const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-please-change";

app.use(express.json());
app.use(cors());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Practice 7-8 Auth + Products API",
      version: "1.0.0",
      description: "API for registration/login and products CRUD with JWT",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["id", "email", "first_name", "last_name"],
          properties: {
            id: { type: "string", example: "a1B2c3D4eF" },
            email: { type: "string", example: "user@example.com" },
            first_name: { type: "string", example: "Иван" },
            last_name: { type: "string", example: "Петров" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "first_name", "last_name", "password"],
          properties: {
            email: { type: "string", example: "user@example.com" },
            first_name: { type: "string", example: "Иван" },
            last_name: { type: "string", example: "Петров" },
            password: { type: "string", example: "secret" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "user@example.com" },
            password: { type: "string", example: "secret" },
          },
        },
        LoginResponse: {
          type: "object",
          required: ["accessToken"],
          properties: {
            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          },
        },
        Product: {
          type: "object",
          required: ["id", "title", "category", "description", "price"],
          properties: {
            id: { type: "string", example: "h6VU0Tww" },
            title: { type: "string", example: "Ноутбук" },
            category: { type: "string", example: "Электроника" },
            description: { type: "string", example: "Описание товара" },
            price: { type: "number", example: 89000 },
          },
        },
        ProductRequest: {
          type: "object",
          required: ["title", "category", "description", "price"],
          properties: {
            title: { type: "string", example: "Товар" },
            category: { type: "string", example: "Категория" },
            description: { type: "string", example: "Описание" },
            price: { type: "number", example: 1000 },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Registration and login" },
      { name: "Products", description: "Products CRUD" },
    ],
  },
  apis: [path.join(__dirname, "index.js")],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * In-memory storage (practice scope)
 */
let users = [];
let products = [
  {
    id: nanoid(8),
    title: "Ноутбук",
    category: "Электроника",
    description: '15" экран, 16 ГБ RAM, SSD 512 ГБ',
    price: 89000,
  },
  {
    id: nanoid(8),
    title: "Наушники",
    category: "Аудио",
    description: "Беспроводные, с шумоподавлением",
    price: 11990,
  },
  {
    id: nanoid(8),
    title: "Рюкзак",
    category: "Аксессуары",
    description: "Городской, 20 л",
    price: 3590,
  },
];

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function validateUserCreate(body) {
  const { email, first_name, last_name, password } = body || {};
  if (!isNonEmptyString(email)) return "Поле 'email' обязательно";
  if (!isNonEmptyString(first_name)) return "Поле 'first_name' обязательно";
  if (!isNonEmptyString(last_name)) return "Поле 'last_name' обязательно";
  if (!isNonEmptyString(password) || password.length < 4) {
    return "Поле 'password' обязательно (мин. 4 символа)";
  }
  return {
    email: email.trim().toLowerCase(),
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    password,
  };
}

function validateProduct(body) {
  const { title, category, description, price } = body || {};
  if (!isNonEmptyString(title)) return "Поле 'title' обязательно";
  if (!isNonEmptyString(category)) return "Поле 'category' обязательно";
  if (!isNonEmptyString(description)) return "Поле 'description' обязательно";
  const numPrice = Number(price);
  if (!Number.isFinite(numPrice) || numPrice < 0) return "Поле 'price' должно быть числом >= 0";
  return {
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    price: numPrice,
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

app.get("/", (req, res) => {
  res.type("text").send("Auth + Products API is running");
});

// ===== Auth =====

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Created user (without password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 */
app.post("/api/auth/register", async (req, res) => {
  const validated = validateUserCreate(req.body);
  if (typeof validated === "string") return res.status(400).json({ error: validated });

  const exists = users.some((u) => u.email === validated.email);
  if (exists) return res.status(400).json({ error: "Пользователь уже существует" });

  const hash = await bcrypt.hash(validated.password, 10);
  const newUser = {
    id: nanoid(10),
    email: validated.email,
    first_name: validated.first_name,
    last_name: validated.last_name,
    password: hash,
  };
  users.push(newUser);

  res.status(201).json(sanitizeUser(newUser));
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     description: Returns JWT access token. Use it in Swagger Authorize as `Bearer <token>`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Invalid credentials
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: "email и password обязательны" });
  }

  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) return res.status(401).json({ error: "Неверные учетные данные" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Неверные учетные данные" });

  const accessToken = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ accessToken });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json(sanitizeUser(user));
});

// ===== Products =====

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductRequest'
 *     responses:
 *       201:
 *         description: Created product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 */
app.post("/api/products", (req, res) => {
  const validated = validateProduct(req.body);
  if (typeof validated === "string") return res.status(400).json({ error: validated });

  const product = { id: nanoid(8), ...validated };
  products.push(product);
  res.status(201).json(product);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get products list
 *     responses:
 *       200:
 *         description: Products list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
  const p = products.find((item) => item.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found" });
  res.json(p);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update product
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/ProductRequest'
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
app.put("/api/products/:id", authMiddleware, (req, res) => {
  const idx = products.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });

  const validated = validateProduct(req.body);
  if (typeof validated === "string") return res.status(400).json({ error: validated });

  const updated = { id: products[idx].id, ...validated };
  products[idx] = updated;
  res.json(updated);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const idx = products.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });
  products.splice(idx, 1);
  res.status(204).send();
});

// 404
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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});
