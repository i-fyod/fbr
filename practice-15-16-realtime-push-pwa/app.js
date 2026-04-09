const STORAGE_KEY = "pwa.todo.items.v1";

const API_BASE = ""; // same-origin when served by practice server

function toBase64Url(bytes) {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function getToastEl() {
  return document.getElementById("toast");
}

let toastTimer = null;
function showToast(text) {
  const el = getToastEl();
  if (!el) return;
  el.textContent = text;
  el.style.display = "block";
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.style.display = "none";
  }, 2500);
}

async function fetchJson(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

async function ensureSwReady() {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker not supported");
  return navigator.serviceWorker.ready;
}

async function getPublicVapidKey() {
  const data = await fetchJson(`${API_BASE}/api/vapid-public-key`);
  return data.publicKey;
}

async function subscribeToPush() {
  const reg = await ensureSwReady();

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission not granted");
  }

  const publicKey = await getPublicVapidKey();
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  await fetchJson(`${API_BASE}/api/subscribe`, {
    method: "POST",
    body: JSON.stringify(sub),
  });

  return sub;
}

async function unsubscribeFromPush() {
  const reg = await ensureSwReady();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { ok: true, unsubscribed: false };

  await fetchJson(`${API_BASE}/api/unsubscribe`, {
    method: "POST",
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });

  await sub.unsubscribe();
  return { ok: true, unsubscribed: true };
}

async function pushTest() {
  await fetchJson(`${API_BASE}/api/push-test`, { method: "POST" });
}

let socket = null;
async function connectSocket() {
  if (socket) return socket;

  // Load socket.io client from server (served automatically by socket.io)
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/socket.io/socket.io.js";
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load socket.io client"));
    document.head.appendChild(s);
  });

  // global `io`
  // eslint-disable-next-line no-undef
  socket = io();
  socket.on("connect", () => showToast("Socket: connected"));
  socket.on("taskAdded", (task) => {
    if (!task?.text) return;
    showToast(`Добавлено (realtime): ${task.text}`);
  });
  return socket;
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + "_" + String(Math.random()).slice(2);
}

const els = {
  form: document.getElementById("form"),
  input: document.getElementById("input"),
  list: document.getElementById("list"),
  empty: document.getElementById("empty"),
  net: document.getElementById("net"),
  pushSub: document.getElementById("pushSub"),
  pushUnsub: document.getElementById("pushUnsub"),
  pushTest: document.getElementById("pushTest"),
};

let items = loadItems();

function render() {
  els.list.innerHTML = "";

  if (!items.length) {
    els.empty.style.display = "block";
    return;
  }
  els.empty.style.display = "none";

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "item";

    const p = document.createElement("p");
    p.className = "item__text";
    p.textContent = item.text;

    const btn = document.createElement("button");
    btn.className = "item__btn";
    btn.type = "button";
    btn.textContent = "Удалить";
    btn.addEventListener("click", () => {
      items = items.filter((x) => x.id !== item.id);
      saveItems(items);
      render();
    });

    li.appendChild(p);
    li.appendChild(btn);
    els.list.appendChild(li);
  }
}

function renderNet() {
  els.net.textContent = navigator.onLine ? "Онлайн" : "Офлайн";
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = els.input.value.trim();
  if (!text) return;

  const next = {
    id: makeId(),
    text,
    createdAt: Date.now(),
  };
  items.unshift(next);
  saveItems(items);
  els.input.value = "";
  render();

  connectSocket()
    .then((s) => {
      s.emit("newTask", next);
    })
    .catch(() => {
      // offline or server not running
    });
});

if (els.pushSub) {
  els.pushSub.addEventListener("click", () => {
    subscribeToPush()
      .then(() => showToast("Push: подписка оформлена"))
      .catch((e) => showToast(`Push error: ${e.message}`));
  });
}

if (els.pushUnsub) {
  els.pushUnsub.addEventListener("click", () => {
    unsubscribeFromPush()
      .then((r) => showToast(r.unsubscribed ? "Push: отписка выполнена" : "Push: подписки нет"))
      .catch((e) => showToast(`Push error: ${e.message}`));
  });
}

if (els.pushTest) {
  els.pushTest.addEventListener("click", () => {
    pushTest()
      .then(() => showToast("Push: отправлено"))
      .catch((e) => showToast(`Push error: ${e.message}`));
  });
}

window.addEventListener("online", renderNet);
window.addEventListener("offline", renderNet);

renderNet();
render();
