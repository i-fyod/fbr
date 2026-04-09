import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

import express from "express";
import { Server as SocketIOServer } from "socket.io";
import webpush from "web-push";

import { getDirname } from "./lib/paths.js";
import { validatePushSubscription } from "./lib/subscription-validate.js";
import { createSubscriptionsStore } from "./lib/subscriptions-store.js";
import { createPushService } from "./lib/push-service.js";

const __dirname = getDirname(import.meta.url);

const PORT = Number(process.env.PORT || 5177);
const HTTPS_KEY_PATH =
  process.env.HTTPS_KEY_PATH || path.join(__dirname, "..", "..", "certs", "localhost-key.pem");
const HTTPS_CERT_PATH =
  process.env.HTTPS_CERT_PATH || path.join(__dirname, "..", "..", "certs", "localhost-cert.pem");

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:example@example.com";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

const store = createSubscriptionsStore({
  filePath: path.join(__dirname, "..", ".data", "subscriptions.json"),
});

const push = createPushService({
  webpush,
  subject: VAPID_SUBJECT,
  vapidKeys: { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY },
  store,
});

function readFileOrNull(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

const key = readFileOrNull(HTTPS_KEY_PATH);
const cert = readFileOrNull(HTTPS_CERT_PATH);

if (!key || !cert) {
  console.error("Missing HTTPS certificate files.");
  console.error("Expected:");
  console.error("-", HTTPS_KEY_PATH);
  console.error("-", HTTPS_CERT_PATH);
  console.error("");
  console.error("Generate them from practice root folder (example):");
  console.error("cd practice-15-16-realtime-push-pwa");
  console.error("mkdir -p certs");
  console.error(
    "openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/localhost-key.pem -out certs/localhost-cert.pem -days 365 -subj '/CN=localhost'"
  );
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "200kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, pushEnabled: push.isEnabled });
});

app.get("/api/vapid-public-key", (_req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    res.status(500).json({ ok: false, error: "VAPID_PUBLIC_KEY is not set" });
    return;
  }
  res.json({ ok: true, publicKey: VAPID_PUBLIC_KEY });
});

app.post("/api/subscribe", (req, res) => {
  if (!push.isEnabled) {
    res.status(501).json({ ok: false, error: "Push disabled (missing VAPID keys)" });
    return;
  }

  const validation = validatePushSubscription(req.body);
  if (!validation.ok) {
    res.status(400).json({ ok: false, error: validation.error });
    return;
  }

  store.upsert(validation.data);
  res.json({ ok: true });
});

app.post("/api/unsubscribe", (req, res) => {
  const endpoint = req.body?.endpoint || req.body?.subscription?.endpoint;
  if (typeof endpoint !== "string" || !endpoint) {
    res.status(400).json({ ok: false, error: "endpoint is required" });
    return;
  }
  store.removeByEndpoint(endpoint);
  res.json({ ok: true });
});

// Service worker must be same-origin + correct mime
app.get("/sw.js", (req, res, next) => {
  res.type("application/javascript");
  next();
});

app.post("/api/push-test", async (_req, res) => {
  const result = await push.sendToAll({
    title: "Тест push",
    body: "Push работает",
    url: "/",
  });
  if (!result.ok) {
    res.status(500).json(result);
    return;
  }
  res.json(result);
});

// Avoid exposing server source via static hosting
app.use((req, res, next) => {
  if (req.path.startsWith("/server")) {
    res.status(404).send("Not found");
    return;
  }
  next();
});

const clientRoot = path.join(__dirname, "..", "..");
app.use(
  express.static(clientRoot, {
    index: ["index.html"],
    dotfiles: "ignore",
    extensions: ["html"],
  })
);

app.get("/about", (_req, res) => {
  res.sendFile(path.join(clientRoot, "about.html"));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientRoot, "index.html"));
});

const httpsServer = https.createServer({ key, cert }, app);
const io = new SocketIOServer(httpsServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("newTask", async (task, ack) => {
    io.emit("taskAdded", task);
    await push.sendToAll({
      title: "Новая задача",
      body: String(task?.text || ""),
      url: "/",
    });
    if (typeof ack === "function") ack({ ok: true });
  });
});

// Optional: HTTP -> HTTPS redirect (useful when someone opens http://localhost)
const REDIRECT_HTTP_PORT = Number(process.env.REDIRECT_HTTP_PORT || 0);
if (REDIRECT_HTTP_PORT) {
  const redirect = http.createServer((req, res) => {
    const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
    res.writeHead(301, { Location: `https://${host}:${PORT}${req.url || "/"}` });
    res.end();
  });
  redirect.listen(REDIRECT_HTTP_PORT, () => {
    console.log(`Redirect: http://localhost:${REDIRECT_HTTP_PORT} -> https://localhost:${PORT}`);
  });
}

httpsServer.listen(PORT, () => {
  console.log(`Server: https://localhost:${PORT}`);
  console.log(`Health: https://localhost:${PORT}/api/health`);
  if (!push.isEnabled) {
    console.log("Push: disabled (set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY)");
  }
});
