# Практическая работа 5 — Swagger (ссылка на Практику 4)

Реализация Практики 5 выполнена внутри Практики 4, чтобы не дублировать код.

Где находится код:
- Сервер: `practice-04-shop-react-express/server/`
- Swagger UI: `http://localhost:3000/api-docs`

Что сделано (Практика 5):
- Подключены `swagger-jsdoc` и `swagger-ui-express`
- Описаны схема `User` и CRUD-операции (GET, POST, GET/:id, PATCH/:id, DELETE)
- Документация работает интерактивно в `/api-docs`

## Как запустить

1. Запуск сервера:
   - `cd practice-04-shop-react-express/server`
   - `npm install`
   - `npm start`
2. Откройте Swagger UI:
   - `http://localhost:3000/api-docs`

## Где лежат аннотации

- `practice-04-shop-react-express/server/src/index.js`
