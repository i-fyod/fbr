# Практические работы

В репозитории каждая практика лежит в отдельной папке.

## 1) Карточка товара на SASS

Путь: `practice-01-product-card-sass/`

Что сделано:

- HTML-страница с карточкой товара (название, описание, фотография)
- SASS (SCSS): переменные (>= 2), миксин (>= 1), вложенные селекторы
- Минимальный дизайн

Запуск:

- Откройте `practice-01-product-card-sass/index.html` в браузере

Опционально (пересобрать SCSS):

```bash
sass styles/main.scss styles/main.css
```

## 2) CRUD API для списка товаров

Путь: `practice-02-products-api/`

Требования:

- CRUD операции: просмотр всех, просмотр по id, добавление, редактирование, удаление
- Поля товара: `id`, `name` (название), `price` (стоимость)

Запуск:

```bash
cd practice-02-products-api
npm install
npm start
```

Сервер: `http://localhost:3000`

Эндпоинты:

- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`

Примеры запросов:

```bash
curl -s http://localhost:3000/products

curl -s -X POST http://localhost:3000/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Чайник","price":1990}'

curl -s http://localhost:3000/products/1

curl -s -X PUT http://localhost:3000/products/1 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Чайник","price":2190}'

curl -s -X DELETE http://localhost:3000/products/1
```

## 3) Отчет по тестированию API (Postman)

Путь: `practice-03-products-api-report/`

Что внутри:

- `practice-03-products-api-report/REPORT.md` — отчет + вставленные скриншоты
- `practice-03-products-api-report/assets/requests/practice-02-products-api.postman_collection.json` — коллекция Postman для Практики 2
- `practice-03-products-api-report/assets/requests/openweathermap-api.postman_collection.json` — коллекция Postman для OpenWeatherMap
- `practice-03-products-api-report/assets/screenshots/` — исходные скриншоты

## 4) Интернет-магазин (React + Express)

Путь: `practice-04-shop-react-express/`

Что сделано:

- Express API (CRUD) для товаров + CORS + логирование + обработчики ошибок
- React-клиент (axios + Sass), связан с API

Запуск:

```bash
# server
cd practice-04-shop-react-express/server
npm install
npm start

# client
cd ../client
npm install
npm start
```

Подробности: `practice-04-shop-react-express/README.md`

## 5) Swagger-документация для CRUD (swagger-jsdoc + swagger-ui-express)

Реализация находится в: `practice-04-shop-react-express/server/`

Swagger UI:

- `http://localhost:3000/api-docs`

Документировано:

- схема `User`
- CRUD для пользователей:
  - `GET /api/users`
  - `POST /api/users`
  - `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

## 7-8) Auth + Products API (JWT)

Путь: `practice-07-08-auth-api/`

Что сделано:
- Регистрация/логин с хешированием пароля (bcryptjs)
- JWT access token, маршрут `GET /api/auth/me`
- CRUD по товарам (title, category, description, price)
- Защищены `GET /api/products/:id`, `PUT /api/products/:id`, `DELETE /api/products/:id`

Swagger UI:
- `http://localhost:4100/api-docs` (или ваш `PORT`)

Запуск:
```bash
cd practice-07-08-auth-api
npm install
npm start   # PORT=4000 по умолчанию
```

## 8-9) Refresh tokens + Frontend

Бэкенд (доработан для refresh): `practice-07-08-auth-api/`
- добавлен `POST /api/auth/refresh`
- `POST /api/auth/login` возвращает `{ accessToken, refreshToken }`

Фронтенд (React + Vite): `practice-08-09-auth-products-frontend/`
- страницы входа и регистрации
- управление товарами (list/create/detail/update/delete)
- авто-refresh accessToken при 401

Запуск фронтенда:
```bash
cd practice-08-09-auth-products-frontend
npm install
npm run dev
```

## 13-14) Offline TODO (Service Worker + Manifest)

Путь: `practice-13-14-offline-todo-pwa/`

Что сделано:
- TODO/заметки: просмотр и добавление
- Сохранение данных в `localStorage`
- Service Worker: регистрация + кэш статических ресурсов
- Офлайн: страница грузится из кэша, добавление/просмотр задач работает
- Manifest + минимум 3 PNG иконки

Запуск:
```bash
cd practice-13-14-offline-todo-pwa
python -m http.server 5174
```
