import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5176);
const KEY_PATH = process.env.HTTPS_KEY_PATH || path.join(__dirname, "certs", "localhost-key.pem");
const CERT_PATH =
  process.env.HTTPS_CERT_PATH || path.join(__dirname, "certs", "localhost-cert.pem");

const contentTypeByExt = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function readFileSafe(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error };
  }
}

function resolvePublicPath(urlPathname) {
  const raw = decodeURIComponent(urlPathname || "/");
  const normalized = raw === "/" ? "/index.html" : raw;

  const abs = path.resolve(__dirname, "." + normalized);
  if (!abs.startsWith(__dirname)) return null;
  return abs;
}

const key = readFileSafe(KEY_PATH);
const cert = readFileSafe(CERT_PATH);

if (!key.ok || !cert.ok) {
  console.error("Missing HTTPS certificate files.");
  console.error("Expected:");
  console.error("-", KEY_PATH);
  console.error("-", CERT_PATH);
  console.error("");
  console.error("Generate them from this folder (example with OpenSSL):");
  console.error("mkdir -p certs");
  console.error(
    "openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/localhost-key.pem -out certs/localhost-cert.pem -days 365 -subj '/CN=localhost'"
  );
  process.exit(1);
}

const server = https.createServer({ key: key.data, cert: cert.data }, (req, res) => {
  const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
  const absPath = resolvePublicPath(url.pathname);

  if (!absPath) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  // App Shell for pretty routes (optional): /about -> about.html
  const filePath = url.pathname === "/about" ? path.join(__dirname, "about.html") : absPath;
  const ext = path.extname(filePath);
  const type = contentTypeByExt[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`HTTPS server running: https://localhost:${PORT}`);
});
