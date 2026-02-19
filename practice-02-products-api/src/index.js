const express = require("express");

const app = express();
app.use(express.json());

/**
 * In-memory storage for practice work.
 * Product shape: { id: number, name: string, price: number }
 */
const products = [];
let nextId = 1;

function parseId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function validateProductPayload(payload) {
  const name = payload?.name;
  const price = payload?.price;

  if (typeof name !== "string" || name.trim().length === 0) {
    return { ok: false, error: "Поле 'name' должно быть непустой строкой" };
  }

  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Поле 'price' должно быть числом >= 0" };
  }

  return { ok: true, value: { name: name.trim(), price } };
}

app.get("/", (req, res) => {
  res.type("text").send("Products API is running");
});

app.get("/products", (req, res) => {
  res.json(products);
});

app.get("/products/:id", (req, res) => {
  const id = parseId(req);
  if (id === null) return res.status(400).json({ error: "Некорректный id" });

  const product = products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: "Товар не найден" });

  res.json(product);
});

app.post("/products", (req, res) => {
  const validated = validateProductPayload(req.body);
  if (!validated.ok) return res.status(400).json({ error: validated.error });

  const product = { id: nextId++, ...validated.value };
  products.push(product);
  res.status(201).json(product);
});

app.put("/products/:id", (req, res) => {
  const id = parseId(req);
  if (id === null) return res.status(400).json({ error: "Некорректный id" });

  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Товар не найден" });

  const validated = validateProductPayload(req.body);
  if (!validated.ok) return res.status(400).json({ error: validated.error });

  products[idx] = { id, ...validated.value };
  res.json(products[idx]);
});

app.delete("/products/:id", (req, res) => {
  const id = parseId(req);
  if (id === null) return res.status(400).json({ error: "Некорректный id" });

  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Товар не найден" });

  const deleted = products.splice(idx, 1)[0];
  res.json(deleted);
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on http://localhost:${port}`);
});
