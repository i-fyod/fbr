const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const NodeCache = require("node-cache");

// Кэш для API запросов
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Время кэширования для разных маршрутов (в секундах)
const CACHE_TTL = {
  USERS: 60,       // 1 минута для /api/users
  USER_BY_ID: 60,  // 1 минута для /api/users/:id
  PRODUCTS: 600,   // 10 минут для /api/products
  PRODUCT_BY_ID: 600, // 10 минут для /api/products/:id
};

const app = express();
const PORT = Number(process.env.PORT) || 4100;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-please-change";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "dev-refresh-secret-please-change";
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || "10s";
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "7d";

// Роли пользователей
const ROLES = {
  GUEST: "guest",       // Не аутентифицированный пользователь
  USER: "user",         // Пользователь (только просмотр товаров)
  SELLER: "seller",     // Продавец (добавление и редактирование товаров)
  ADMIN: "admin",       // Администратор (права продавца + управление пользователями)
};

// Приоритет ролей (чем больше число, тем выше права)
const ROLE_PRIORITY = {
  [ROLES.GUEST]: 0,
  [ROLES.USER]: 1,
  [ROLES.SELLER]: 2,
  [ROLES.ADMIN]: 3,
};

app.use(express.json());
app.use(cors());

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Practice 11-12 Roles API",
      version: "1.0.0",
      description: "API с системой ролей и прав доступа",
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
          required: ["id", "email", "first_name", "last_name", "role"],
          properties: {
            id: { type: "string", example: "a1B2c3D4eF" },
            email: { type: "string", example: "user@example.com" },
            first_name: { type: "string", example: "Иван" },
            last_name: { type: "string", example: "Петров" },
            role: { 
              type: "string", 
              enum: Object.values(ROLES),
              example: ROLES.USER 
            },
            is_blocked: { type: "boolean", example: false },
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
          required: ["accessToken", "refreshToken"],
          properties: {
            accessToken: {
              type: "string",
              description: "JWT access token",
            },
            refreshToken: {
              type: "string",
              description: "JWT refresh token",
            },
          },
        },
        RefreshResponse: {
          type: "object",
          required: ["accessToken", "refreshToken"],
          properties: {
            accessToken: {
              type: "string",
              description: "New JWT access token",
            },
            refreshToken: {
              type: "string",
              description: "New JWT refresh token",
            },
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
        UpdateUserRequest: {
          type: "object",
          properties: {
            email: { type: "string", example: "newemail@example.com" },
            first_name: { type: "string", example: "НовоеИмя" },
            last_name: { type: "string", example: "НоваяФамилия" },
            role: { 
              type: "string", 
              enum: Object.values(ROLES),
              example: ROLES.SELLER 
            },
            is_blocked: { type: "boolean", example: true },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Регистрация и вход" },
      { name: "Users", description: "Управление пользователями (Admin only)" },
      { name: "Products", description: "CRUD товаров" },
    ],
  },
  apis: [path.join(__dirname, "index.js")],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

/**
 * In-memory storage (practice scope)
 */
let users = [];
let refreshTokens = new Set();
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

/**
 * Middleware для аутентификации
 * Добавляет req.user с информацией о пользователе
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.is_blocked) {
      return res.status(403).json({ error: "User is blocked" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Middleware для проверки роли
 * @param {string|string[]} allowedRoles - Разрешенные роли или массив ролей
 */
function roleMiddleware(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: `Требуется одна из ролей: ${roles.join(", ")}. Ваша роль: ${req.user.role}` 
      });
    }
    
    next();
  };
}

/**
 * Middleware для проверки минимального уровня роли
 * @param {string} minRole - Минимальная требуемая роль
 */
function minRoleMiddleware(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userPriority = ROLE_PRIORITY[req.user.role] || 0;
    const requiredPriority = ROLE_PRIORITY[minRole] || 0;
    
    if (userPriority < requiredPriority) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: `Требуется роль не ниже '${minRole}'. Ваша роль: ${req.user.role}` 
      });
    }
    
    next();
  };
}

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: nanoid(10),
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: nanoid(10),
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  refreshTokens.add(refreshToken);
  return { accessToken, refreshToken };
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

app.get("/", (req, res) => {
  res.type("text").send("Roles API is running");
});

// ===== Auth =====

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Регистрация нового пользователя
 *     description: Создает нового пользователя с ролью 'user' по умолчанию
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации
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
    role: ROLES.USER, // По умолчанию роль пользователя
    is_blocked: false,
  };
  users.push(newUser);

  res.status(201).json(sanitizeUser(newUser));
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Вход в систему
 *     description: Возвращает пару JWT токенов
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Отсутствуют поля
 *       401:
 *         description: Неверные учетные данные
 *       403:
 *         description: Пользователь заблокирован
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: "email и password обязательны" });
  }

  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) return res.status(401).json({ error: "Неверные учетные данные" });

  if (user.is_blocked) {
    return res.status(403).json({ error: "Пользователь заблокирован" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Неверные учетные данные" });

  const tokens = generateTokens(user);
  res.json(tokens);
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Обновить пару токенов
 *     description: Принимает refreshToken в заголовке Authorization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       401:
 *         description: Неверный/истекший токен
 *       403:
 *         description: Пользователь заблокирован
 */
app.post("/api/auth/refresh", (req, res) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Отсутствует или неверный заголовок Authorization" });

  if (!refreshTokens.has(token)) {
    return res.status(401).json({ error: "Refresh token недействителен или уже использован" });
  }

  try {
    const payload = jwt.verify(token, REFRESH_SECRET);

    // rotate refresh: invalidate old token
    refreshTokens.delete(token);

    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "Пользователь не найден" });

    if (user.is_blocked) {
      return res.status(403).json({ error: "Пользователь заблокирован" });
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (err) {
    refreshTokens.delete(token);
    return res.status(401).json({ error: "Refresh token истек или недействителен" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Получить текущего пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json(sanitizeUser(req.user));
});

// ===== Users (Admin only) =====

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Получить список пользователей
 *     description: Только для администраторов
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 */
app.get("/api/users", authMiddleware, roleMiddleware(ROLES.ADMIN), (req, res) => {
  const cacheKey = 'users:all';
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }
  
  const sanitizedUsers = users.map(sanitizeUser);
  cache.set(cacheKey, sanitizedUsers, CACHE_TTL.USERS);
  res.json(sanitizedUsers);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Получить пользователя по ID
 *     description: Только для администраторов
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
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.get("/api/users/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), (req, res) => {
  const cacheKey = `users:id:${req.params.id}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }
  
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  
  const sanitizedUser = sanitizeUser(user);
  cache.set(cacheKey, sanitizedUser, CACHE_TTL.USER_BY_ID);
  res.json(sanitizedUser);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Обновить информацию пользователя
 *     description: Только для администраторов
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
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Обновленный пользователь
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 *       400:
 *         description: Ошибка валидации
 */
app.put("/api/users/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), async (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Пользователь не найден" });

  const { email, first_name, last_name, role, is_blocked } = req.body || {};

  // Валидация email
  if (email !== undefined) {
    if (!isNonEmptyString(email)) {
      return res.status(400).json({ error: "Поле 'email' не может быть пустым" });
    }
    const emailExists = users.some((u, i) => i !== idx && u.email === email.trim().toLowerCase());
    if (emailExists) {
      return res.status(400).json({ error: "Email уже занят" });
    }
    users[idx].email = email.trim().toLowerCase();
  }

  // Валидация имен
  if (first_name !== undefined) {
    if (!isNonEmptyString(first_name)) {
      return res.status(400).json({ error: "Поле 'first_name' не может быть пустым" });
    }
    users[idx].first_name = first_name.trim();
  }

  if (last_name !== undefined) {
    if (!isNonEmptyString(last_name)) {
      return res.status(400).json({ error: "Поле 'last_name' не может быть пустым" });
    }
    users[idx].last_name = last_name.trim();
  }

  // Валидация роли
  if (role !== undefined) {
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ 
        error: "Неверная роль", 
        allowedRoles: Object.values(ROLES) 
      });
    }
    users[idx].role = role;
  }

  // Валидация блокировки
  if (is_blocked !== undefined) {
    if (typeof is_blocked !== "boolean") {
      return res.status(400).json({ error: "Поле 'is_blocked' должно быть булевым" });
    }
    users[idx].is_blocked = is_blocked;
  }

  // Инвалидация кэша
  cache.del('users:all');
  cache.del(`users:id:${req.params.id}`);

  res.json(sanitizeUser(users[idx]));
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Заблокировать пользователя
 *     description: Только для администраторов. Устанавливает is_blocked=true
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
 *         description: Пользователь заблокирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
app.delete("/api/users/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Пользователь не найден" });

  users[idx].is_blocked = true;
  
  // Инвалидация кэша
  cache.del('users:all');
  cache.del(`users:id:${req.params.id}`);
  
  res.json(sanitizeUser(users[idx]));
});

// ===== Products =====

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Создать товар
 *     description: Только для продавцов и администраторов
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductRequest'
 *     responses:
 *       201:
 *         description: Созданный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 */
app.post("/api/products", authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
  const validated = validateProduct(req.body);
  if (typeof validated === "string") return res.status(400).json({ error: validated });

  const product = { id: nanoid(8), ...validated };
  products.push(product);
  
  // Инвалидация кэша списка продуктов
  cache.del('products:all');
  
  res.status(201).json(product);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Получить список товаров
 *     description: Доступно всем (включая гостей)
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  const cacheKey = 'products:all';
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }
  
  cache.set(cacheKey, products, CACHE_TTL.PRODUCTS);
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Получить товар по ID
 *     description: Доступно всем (включая гостей)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Не найден
 */
app.get("/api/products/:id", (req, res) => {
  const cacheKey = `products:id:${req.params.id}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return res.json(cachedData);
  }
  
  const p = products.find((item) => item.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Товар не найден" });
  
  cache.set(cacheKey, p, CACHE_TTL.PRODUCT_BY_ID);
  res.json(p);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Обновить товар
 *     description: Только для продавцов и администраторов
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
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Не найден
 */
app.put("/api/products/:id", authMiddleware, roleMiddleware([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
  const idx = products.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Товар не найден" });

  const validated = validateProduct(req.body);
  if (typeof validated === "string") return res.status(400).json({ error: validated });

  const updated = { id: products[idx].id, ...validated };
  products[idx] = updated;
  
  // Инвалидация кэша
  cache.del('products:all');
  cache.del(`products:id:${req.params.id}`);
  
  res.json(updated);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Удалить товар
 *     description: Только для администраторов
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
 *         description: Удален
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         Не найден
 */
app.delete("/api/products/:id", authMiddleware, roleMiddleware(ROLES.ADMIN), (req, res) => {
  const idx = products.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Товар не найден" });
  products.splice(idx, 1);
  
  // Инвалидация кэша
  cache.del('products:all');
  cache.del(`products:id:${req.params.id}`);
  
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


// Инициализация администратора для демонстрации (только для dev!)
const initAdmin = async () => {
  const adminExists = users.some(u => u.email === 'admin@demo.com');
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    users.push({
      id: 'admin-001',
      email: 'admin@demo.com',
      first_name: 'Demo',
      last_name: 'Admin',
      password: hash,
      role: ROLES.ADMIN,
      is_blocked: false,
    });
    // eslint-disable-next-line no-console
    console.log('✅ Admin user created: admin@demo.com / admin123');
  }
};

// Вызываем после запуска сервера
setTimeout(initAdmin, 100);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  // eslint-disable-next-line no-console
  console.log(`Роли: ${Object.values(ROLES).join(", ")}`);
});
