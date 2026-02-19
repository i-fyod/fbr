# Практические работы

В репозитории две папки (две разные практические работы).

## 1) Карточка товара на SASS

Путь: `practice-01-product-card-sass/`

Что сделано:
- HTML-страница с карточкой товара: название, описание, фотография.
- SASS (SCSS): переменные (>= 2), миксин (>= 1), вложенные селекторы.
- Минимальный дизайн.

Структура:
- `practice-01-product-card-sass/index.html` - страница
- `practice-01-product-card-sass/styles/main.scss` - основной SCSS
- `practice-01-product-card-sass/styles/_variables.scss` - переменные (простые: цвет, отступ)
- `practice-01-product-card-sass/styles/_mixins.scss` - один миксин (простая рамка)
- `practice-01-product-card-sass/styles/main.css` - готовый CSS (упрощённый дизайн, можно сразу открывать)
- `practice-01-product-card-sass/assets/product.svg` - простая картинка-заглушка

Как запустить:
1. Откройте файл `practice-01-product-card-sass/index.html` в браузере.

Если хотите собирать SCSS сами (опционально):
1. Установите Sass.
2. Соберите:
   - `sass styles/main.scss styles/main.css`

## 2) CRUD API для списка товаров

Путь: `practice-02-products-api/`

Требования:
- CRUD операции: просмотр всех, просмотр по id, добавление, редактирование, удаление.
- Поля товара: `id`, `name` (название), `price` (стоимость).

Технологии:
- Node.js + Express
- Хранилище в памяти процесса (без базы данных)

Структура:
- `practice-02-products-api/package.json`
- `practice-02-products-api/src/index.js`

Как запустить:
1. Перейдите в папку:
   - `cd practice-02-products-api`
2. Установите зависимости:
   - `npm install`
3. Запустите сервер:
   - `npm start`
4. Сервер стартует на:
   - `http://localhost:3000`

Эндпоинты:
- `GET /products` - все товары
- `GET /products/:id` - товар по id
- `POST /products` - добавить товар
- `PUT /products/:id` - обновить товар
- `DELETE /products/:id` - удалить товар

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
