# Практические работы 8-9 — Refresh tokens + Frontend

В этой практике:
- Бэкенд: `practice-07-08-auth-api/` (добавлены refresh-токены и маршрут `/api/auth/refresh`)
- Фронтенд (React + Vite): `practice-08-09-auth-products-frontend/` (управление товарами через API)

## Запуск бэкенда

```bash
cd practice-07-08-auth-api
npm install
npm start
```

Swagger UI:
- `http://localhost:4100/api-docs`

## Запуск фронтенда

```bash
cd practice-08-09-auth-products-frontend
npm install
npm run dev
```

Откройте адрес, который выведет Vite (обычно `http://localhost:5173`).

## Что умеет фронтенд

- Регистрация пользователя
- Вход (получение `accessToken` + `refreshToken`)
- Авто-обновление access-токена при 401 (используется `/api/auth/refresh`)
- Управление товарами:
  - список
  - создание
  - просмотр по id
  - обновление по id
  - удаление по id

Примечание про refresh:
- refresh-токен передаётся в заголовке `Authorization: Bearer <refreshToken>`
- после использования refresh-токен становится неактуальным (rotation)
