# Практическая работа 4 — API + React (Интернет-магазин)

В этой работе два приложения:
- `server/` — бэкенд на Express (CRUD API для товаров)
- `client/` — фронтенд на React (интерфейс магазина, использует API)

## Запуск

### 1) Бэкенд

1. Перейдите в папку:
   - `cd practice-04-shop-react-express/server`
2. Установите зависимости:
   - `npm install`
3. Запустите сервер:
   - `npm start`

Сервер по умолчанию стартует на `http://localhost:3000`.

Swagger-документация:
- `http://localhost:3000/api-docs`

### 2) Фронтенд

1. Перейдите в папку:
   - `cd practice-04-shop-react-express/client`
2. Установите зависимости:
   - `npm install`
3. Запустите приложение:
   - `npm start`

Фронтенд по умолчанию запускается на `http://localhost:3001`.

Примечание:
- В `client/package.json` настроен `proxy` на `http://localhost:3000`, поэтому фронтенд обращается к API по относительному пути `/api/...`.

## API

База: `http://localhost:3000/api`

Маршруты:
- `GET /products` — получить все товары
- `GET /products/:id` — получить товар по id
- `POST /products` — создать товар
- `PATCH /products/:id` — частично обновить товар
- `DELETE /products/:id` — удалить товар

Формат товара:
```json
{
  "id": "a1B2c3",
  "name": "...",
  "category": "...",
  "description": "...",
  "price": 12345,
  "stock": 10,
  "rating": 4.5,
  "image": "https://..."
}
```

`rating` и `image` — опциональные.
