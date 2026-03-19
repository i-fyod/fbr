# Практические работы 7-8 — Auth + Products API (Node.js)

Серверное приложение на Node.js с регистрацией/логином, JWT и CRUD по товарам.

## Запуск

```bash
cd practice-07-08-auth-api
npm install
npm start
```

По умолчанию сервер слушает `http://localhost:4100` (переменная `PORT` может переопределить).

Swagger UI:
- `http://localhost:4100/api-docs` (или ваш `PORT`)

Как протестировать защищённые запросы в Swagger:
1. Выполните `POST /api/auth/register`
2. Выполните `POST /api/auth/login` и скопируйте `accessToken` (в Response body он приходит полностью)
3. Нажмите `Authorize` и вставьте: `Bearer <accessToken>`
4. Теперь можно вызывать защищённые `GET/PUT/DELETE /api/products/:id` и `GET /api/auth/me`

Примечание:
- В блоке "Example Value" Swagger показывает примеры (они не являются реальными токенами).
- Реальные токены выдаются только в ответе на `Try it out` для `POST /api/auth/login` и `POST /api/auth/refresh`.

## Маршруты

### Auth
- `POST /api/auth/register` — регистрация пользователя (email, first_name, last_name, password)
- `POST /api/auth/login` — вход, возвращает пару токенов: `accessToken`, `refreshToken`
- `POST /api/auth/refresh` — обновление пары токенов (refresh-токен передавать в заголовке Authorization)
- `GET /api/auth/me` — вернуть текущего пользователя (требует токен)

### Products
- `POST /api/products` — создать товар
- `GET /api/products` — получить список товаров
- `GET /api/products/:id` — получить товар по id *(защищён)*
- `PUT /api/products/:id` — обновить товар *(защищён)*
- `DELETE /api/products/:id` — удалить товар *(защищён)*

### Поля

Пользователь:
```json
{
  "id": "...",
  "email": "...",
  "first_name": "...",
  "last_name": "...",
  "password": "<hash>"
}
```

Товар:
```json
{
  "id": "...",
  "title": "...",
  "category": "...",
  "description": "...",
  "price": 123.45
}
```

## Токены
- Авторизация: заголовок `Authorization: Bearer <accessToken>`
- Обновление токена: `POST /api/auth/refresh` с заголовком `Authorization: Bearer <refreshToken>`
- Секреты:
  - `JWT_SECRET` — для accessToken
  - `REFRESH_SECRET` — для refreshToken

## Зависимости
- express, cors, bcryptjs, jsonwebtoken, nanoid
