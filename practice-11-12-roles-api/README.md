# Практическое занятие 11-12: Система ролей и прав доступа

## Описание

API с системой ролей и прав доступа для управления пользователями и товарами.

## Роли

| Роль | Описание |
|------|----------|
| `guest` | Не аутентифицированный пользователь |
| `user` | Пользователь сайта (только просмотр товаров) |
| `seller` | Продавец (добавление и редактирование товаров) |
| `admin` | Администратор (права продавца + управление пользователями) |

## Таблица прав доступа

| Маршрут | Метод | Доступ | Описание |
|---------|-------|--------|----------|
| `/api/auth/register` | POST | Гость | Регистрация пользователя |
| `/api/auth/login` | POST | Гость | Вход в систему |
| `/api/auth/refresh` | POST | Гость | Обновление пары токенов |
| `/api/auth/me` | GET | Пользователь | Получение текущего пользователя |
| `/api/users` | GET | Администратор | Получить список пользователей |
| `/api/users/:id` | GET | Администратор | Получить пользователя по id |
| `/api/users/:id` | PUT | Администратор | Обновить информацию пользователя |
| `/api/users/:id` | DELETE | Администратор | Заблокировать пользователя |
| `/api/products` | POST | Продавец | Создать товар |
| `/api/products` | GET | Пользователь | Получить список товаров |
| `/api/products/:id` | GET | Пользователь | Получить товар по id |
| `/api/products/:id` | PUT | Продавец | Обновить параметры товара |
| `/api/products/:id` | DELETE | Администратор | Удалить товар |

## Запуск

```bash
npm start
```

Сервер запустится на `http://localhost:4100`

## Swagger документация

После запуска сервера Swagger UI доступен по адресу:
`http://localhost:4100/api-docs`

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | `4100` |
| `JWT_SECRET` | Секрет для access токена | `dev-secret-please-change` |
| `REFRESH_SECRET` | Секрет для refresh токена | `dev-refresh-secret-please-change` |
| `ACCESS_EXPIRES_IN` | Время жизни access токена | `10s` |
| `REFRESH_EXPIRES_IN` | Время жизни refresh токена | `7d` |

## Примеры запросов

### Регистрация пользователя

```bash
curl -X POST http://localhost:4100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","first_name":"Иван","last_name":"Петров","password":"secret123"}'
```

### Вход в систему

```bash
curl -X POST http://localhost:4100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

### Получение текущего пользователя

```bash
curl -X GET http://localhost:4100/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

### Создание товара (только Seller/Admin)

```bash
curl -X POST http://localhost:4100/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"title":"Товар","category":"Категория","description":"Описание","price":1000}'
```

### Получение списка пользователей (только Admin)

```bash
curl -X GET http://localhost:4100/api/users \
  -H "Authorization: Bearer <access_token>"
```

### Блокировка пользователя (только Admin)

```bash
curl -X DELETE http://localhost:4100/api/users/<user_id> \
  -H "Authorization: Bearer <access_token>"
```

## Структура проекта

```
practice-11-12-roles-api/
├── src/
│   └── index.js       # Основной файл сервера
├── package.json
└── README.md
```
