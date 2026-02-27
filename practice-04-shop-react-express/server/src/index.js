const cors = require("cors");
const express = require("express");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = Number(process.env.PORT) || 3000;

// Middleware: JSON
app.use(express.json());

// Middleware: CORS (React dev server)
app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware: request logging
app.use((req, res, next) => {
  res.on("finish", () => {
    // eslint-disable-next-line no-console
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`
    );
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      // eslint-disable-next-line no-console
      console.log("Body:", req.body);
    }
  });
  next();
});

/**
 * @openapi
 * openapi: 3.0.0
 * info:
 *   title: Practice 4/5 API
 *   version: 1.0.0
 *   description: Express API for shop + users (Practice 5 Swagger)
 * servers:
 *   - url: http://localhost:3000
 * tags:
 *   - name: Users
 *     description: CRUD for users
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required: [id, name, age]
 *       properties:
 *         id:
 *           type: string
 *           description: User id (nanoid)
 *           example: a1B2c3
 *         name:
 *           type: string
 *           example: Петр
 *         age:
 *           type: integer
 *           minimum: 0
 *           maximum: 150
 *           example: 18
 *     UserCreate:
 *       type: object
 *       required: [name, age]
 *       properties:
 *         name:
 *           type: string
 *           example: Иван
 *         age:
 *           type: integer
 *           minimum: 0
 *           maximum: 150
 *           example: 20
 *     UserPatch:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Дарья
 *         age:
 *           type: integer
 *           minimum: 0
 *           maximum: 150
 *           example: 21
 */

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Practice 4/5 API",
      version: "1.0.0",
    },
  },
  apis: ["./src/index.js"],
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * In-memory storage (for practice work)
 * Product shape:
 * { id, name, category, description, price, stock, rating?, image? }
 */
let products = [
  {
    id: nanoid(6),
    name: "Кофе зерновой",
    category: "Напитки",
    description: "Арабика 100%, средняя обжарка, 1 кг.",
    price: 1290,
    stock: 24,
    rating: 4.6,
  },
  {
    id: nanoid(6),
    name: "Чай зелёный",
    category: "Напитки",
    description: "Листовой чай, 200 г.",
    price: 390,
    stock: 50,
    rating: 4.3,
  },
  {
    id: nanoid(6),
    name: "Шоколад тёмный",
    category: "Сладости",
    description: "Какао 70%, плитка 100 г.",
    price: 210,
    stock: 80,
    rating: 4.7,
  },
  {
    id: nanoid(6),
    name: "Печенье овсяное",
    category: "Сладости",
    description: "Мягкое печенье, 350 г.",
    price: 180,
    stock: 40,
    rating: 4.1,
  },
  {
    id: nanoid(6),
    name: "Паста томатная",
    category: "Бакалея",
    description: "Томатная паста, 380 г.",
    price: 160,
    stock: 35,
  },
  {
    id: nanoid(6),
    name: "Макароны",
    category: "Бакалея",
    description: "Пшеница твёрдых сортов, 450 г.",
    price: 120,
    stock: 90,
  },
  {
    id: nanoid(6),
    name: "Оливковое масло",
    category: "Бакалея",
    description: "Extra Virgin, 500 мл.",
    price: 890,
    stock: 18,
    rating: 4.4,
  },
  {
    id: nanoid(6),
    name: "Гранола",
    category: "Завтраки",
    description: "Овсяные хлопья, орехи и мёд, 400 г.",
    price: 520,
    stock: 27,
    rating: 4.2,
  },
  {
    id: nanoid(6),
    name: "Мёд цветочный",
    category: "Завтраки",
    description: "Натуральный мёд, 500 г.",
    price: 650,
    stock: 12,
    rating: 4.8,
  },
  {
    id: nanoid(6),
    name: "Орехи ассорти",
    category: "Снеки",
    description: "Микс орехов, 300 г.",
    price: 740,
    stock: 16,
    rating: 4.5,
  },
];

/**
 * In-memory users (for Practice 5 Swagger task)
 * User shape: { id: string, name: string, age: number }
 */
let users = [
  { id: nanoid(6), name: "Петр", age: 16 },
  { id: nanoid(6), name: "Иван", age: 18 },
  { id: nanoid(6), name: "Дарья", age: 20 },
];

function findProductOr404(id, res) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function parseNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return NaN;
}

function findUserOr404(id, res) {
  const user = users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return null;
  }
  return user;
}

function validateUserCreate(payload) {
  const name = payload?.name;
  const age = parseNumber(payload?.age);

  if (!isNonEmptyString(name)) return "Поле 'name' обязательно";
  if (!Number.isInteger(age) || age < 0 || age > 150) {
    return "Поле 'age' должно быть целым числом 0-150";
  }

  return { name: name.trim(), age };
}

function validateUserPatch(payload) {
  if (!payload || typeof payload !== "object") return "Некорректное тело запроса";
  if (payload.name === undefined && payload.age === undefined) return "Nothing to update";

  const out = {};
  if (payload.name !== undefined) {
    if (!isNonEmptyString(payload.name)) return "Поле 'name' должно быть непустой строкой";
    out.name = payload.name.trim();
  }
  if (payload.age !== undefined) {
    const age = parseNumber(payload.age);
    if (!Number.isInteger(age) || age < 0 || age > 150) {
      return "Поле 'age' должно быть целым числом 0-150";
    }
    out.age = age;
  }
  return out;
}

function validateCreate(payload) {
  const name = payload?.name;
  const category = payload?.category;
  const description = payload?.description;
  const price = parseNumber(payload?.price);
  const stock = parseNumber(payload?.stock);
  const ratingRaw = payload?.rating;
  const image = payload?.image;

  if (!isNonEmptyString(name)) return "Поле 'name' обязательно";
  if (!isNonEmptyString(category)) return "Поле 'category' обязательно";
  if (!isNonEmptyString(description)) return "Поле 'description' обязательно";
  if (!Number.isFinite(price) || price < 0) return "Поле 'price' должно быть числом >= 0";
  if (!Number.isInteger(stock) || stock < 0) return "Поле 'stock' должно быть целым числом >= 0";

  let rating;
  if (ratingRaw !== undefined) {
    rating = parseNumber(ratingRaw);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      return "Поле 'rating' должно быть числом от 0 до 5";
    }
  }

  if (image !== undefined && !isNonEmptyString(image)) {
    return "Поле 'image' должно быть непустой строкой";
  }

  return {
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price,
    stock,
    ...(rating !== undefined ? { rating } : {}),
    ...(image !== undefined ? { image: image.trim() } : {}),
  };
}

function validatePatch(payload) {
  if (!payload || typeof payload !== "object") return "Некорректное тело запроса";
  const allowed = ["name", "category", "description", "price", "stock", "rating", "image"];
  const keys = Object.keys(payload).filter((k) => allowed.includes(k));

  if (keys.length === 0) return "Nothing to update";

  const out = {};
  if (payload.name !== undefined) {
    if (!isNonEmptyString(payload.name)) return "Поле 'name' должно быть непустой строкой";
    out.name = payload.name.trim();
  }
  if (payload.category !== undefined) {
    if (!isNonEmptyString(payload.category)) return "Поле 'category' должно быть непустой строкой";
    out.category = payload.category.trim();
  }
  if (payload.description !== undefined) {
    if (!isNonEmptyString(payload.description)) return "Поле 'description' должно быть непустой строкой";
    out.description = payload.description.trim();
  }
  if (payload.price !== undefined) {
    const price = parseNumber(payload.price);
    if (!Number.isFinite(price) || price < 0) return "Поле 'price' должно быть числом >= 0";
    out.price = price;
  }
  if (payload.stock !== undefined) {
    const stock = parseNumber(payload.stock);
    if (!Number.isInteger(stock) || stock < 0) return "Поле 'stock' должно быть целым числом >= 0";
    out.stock = stock;
  }
  if (payload.rating !== undefined) {
    const rating = parseNumber(payload.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      return "Поле 'rating' должно быть числом от 0 до 5";
    }
    out.rating = rating;
  }
  if (payload.image !== undefined) {
    if (!isNonEmptyString(payload.image)) return "Поле 'image' должно быть непустой строкой";
    out.image = payload.image.trim();
  }

  return out;
}

// Health
app.get("/", (req, res) => {
  res.type("text").send("Shop API is running");
});

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
app.get("/api/users", (req, res) => {
  res.json(users);
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 */
app.post("/api/users", (req, res) => {
  const validated = validateUserCreate(req.body);
  if (typeof validated === "string") return res.status(400).json({ error: validated });

  const newUser = { id: nanoid(6), ...validated };
  users.push(newUser);
  res.status(201).json(newUser);
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Not found
 */
app.get("/api/users/:id", (req, res) => {
  const user = findUserOr404(req.params.id, res);
  if (!user) return;
  res.json(user);
});

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user partially
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPatch'
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 */
app.patch("/api/users/:id", (req, res) => {
  const user = findUserOr404(req.params.id, res);
  if (!user) return;

  const validated = validateUserPatch(req.body);
  if (typeof validated === "string") return res.status(400).json({ error: validated });

  Object.assign(user, validated);
  res.json(user);
});

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
app.delete("/api/users/:id", (req, res) => {
  const id = req.params.id;
  const exists = users.some((u) => u.id === id);
  if (!exists) return res.status(404).json({ error: "User not found" });
  users = users.filter((u) => u.id !== id);
  res.status(204).send();
});

// GET /api/products
app.get("/api/products", (req, res) => {
  res.json(products);
});

// GET /api/products/:id
app.get("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

// POST /api/products
app.post("/api/products", (req, res) => {
  const validated = validateCreate(req.body);
  if (typeof validated === "string") {
    return res.status(400).json({ error: validated });
  }

  const newProduct = { id: nanoid(6), ...validated };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PATCH /api/products/:id
app.patch("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const validated = validatePatch(req.body);
  if (typeof validated === "string") {
    return res.status(400).json({ error: validated });
  }

  Object.assign(product, validated);
  res.json(product);
});

// DELETE /api/products/:id
app.delete("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const exists = products.some((p) => p.id === id);
  if (!exists) return res.status(404).json({ error: "Product not found" });
  products = products.filter((p) => p.id !== id);
  res.status(204).send();
});

// 404 for all other routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${port}`);
});
