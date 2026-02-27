# Практическая работа 3 — отчет (Postman)

Цель:

1. Протестировать API из Практической работы 2 с помощью Postman (не менее 3 запросов).
2. Выбрать внешнее API, получить ключ, выполнить не менее 5 запросов.

## 1) Тестирование API из Практики 2

Проверяемое API: `practice-02-products-api/`

Как запустить сервер:

1. `cd practice-02-products-api`
2. `npm install`
3. `npm start`
4. База URL: `http://localhost:3000`

Эндпоинты, которые можно показать в отчете:

- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PUT /products/:id`
- `DELETE /products/:id`

Postman:

- Импортируйте коллекцию: `practice-03-products-api-report/assets/requests/practice-02-products-api.postman_collection.json`
- В коллекции используется переменная `apiBase` (по умолчанию `http://localhost:3000`).

### Скриншоты (Практика 2)

1. `GET /` (health)

![GET /](assets/screenshots/Screenshot.from.2026-02-27.at.09_29_59.279620881.png)

2. `GET /products`
   ![GET /products](assets/screenshots/Screenshot.from.2026-02-27.at.09_30_19.099037203.png)

3. `POST /products`

![POST /products](assets/screenshots/Screenshot.from.2026-02-27.at.09_32_04.846816017.png)

4. `GET /products/4`

![GET /products/4](assets/screenshots/Screenshot.from.2026-02-27.at.09_32_34.416768449.png)

5. `PUT /products/4`

![PUT /products/4](assets/screenshots/Screenshot.from.2026-02-27.at.09_33_26.258020567.png)

6. `DELETE /products/4`

![DELETE /products/4](assets/screenshots/Screenshot.from.2026-02-27.at.09_33_45.853591998.png)

## 2) Внешнее API (OpenWeatherMap)

Выбранное API: OpenWeatherMap (`https://openweathermap.org/api`)

Ключ:

- Зарегистрируйтесь в OpenWeatherMap, получите API key и добавьте его в Postman как переменную `owmApiKey`.

Postman:

- Импортируйте коллекцию: `practice-03-products-api-report/assets/requests/openweathermap-api.postman_collection.json`
- В коллекции используются переменные:
  - `owmBase` (по умолчанию `https://api.openweathermap.org`)
  - `owmApiKey` (ваш ключ)

### Скриншоты (OpenWeatherMap)

1. Current weather (город)

![OpenWeatherMap current weather (city)](assets/screenshots/Screenshot.from.2026-02-27.at.09_51_21.365290188.png)

2. Current weather (координаты)

![OpenWeatherMap current weather (coords)](assets/screenshots/Screenshot.from.2026-02-27.at.09_51_46.509602196.png)

3. Forecast

![OpenWeatherMap forecast](assets/screenshots/Screenshot.from.2026-02-27.at.09_52_20.051110919.png)

4. Air pollution

![OpenWeatherMap air pollution](assets/screenshots/Screenshot.from.2026-02-27.at.09_52_47.177468498.png)

5. Geocoding (direct)

![OpenWeatherMap geocoding](assets/screenshots/Screenshot.from.2026-02-27.at.09_53_04.857027479.png)
