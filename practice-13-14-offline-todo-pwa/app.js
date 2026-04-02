const STORAGE_KEY = "pwa.todo.items.v1";

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
});

window.addEventListener("online", renderNet);
window.addEventListener("offline", renderNet);

renderNet();
render();
