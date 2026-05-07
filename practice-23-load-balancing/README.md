# Практическая работа 23: Балансировка нагрузки с Nginx и Docker Compose

## Описание

Веб-приложение с балансировкой нагрузки через Nginx, развёрнутое в Docker Compose. Система состоит из:
- Двух идентичных backend-сервисов на Node.js (Express)
- Nginx в роли балансировщика нагрузки
- Единой Docker-сети для взаимодействия сервисов

## Структура проекта

```
practice-23-load-balancing/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Требования

- Docker Desktop с поддержкой WSL 2
- WSL 2 (для Windows)

## Запуск

```bash
# Сборка и запуск всех сервисов
docker compose up --build

# Запуск в фоновом режиме
docker compose up -d --build
```

## Проверка работы

### Тестирование балансировки

При повторных запросах ответы должны поочерёдно приходить от разных серверов:

```bash
# Выполните несколько запросов
curl http://localhost/
curl http://localhost/
curl http://localhost/
curl http://localhost/
```

Пример ответа:
```json
{"server":"backend-1","timestamp":"2026-05-07T10:00:00.000Z"}
```

### Проверка здоровья

```bash
curl http://localhost/health
```

## Отказоустойчивость

В конфигурации Nginx настроены параметры:
- `max_fails=3` — количество неудачных попыток перед исключением сервера
- `fail_timeout=30s` — время, на которое сервер исключается из пула

### Тестирование отказоустойчивости

```bash
# Остановить один из backend-контейнеров
docker stop backend-1

# Проверить, что запросы идут на оставшийся сервер
curl http://localhost/
curl http://localhost/
```

Nginx должен перестать направлять запросы на остановленный сервер и обслуживать трафик через оставшийся.

### Восстановление

```bash
# Запустить остановленный контейнер
docker start backend-1

# Проверить балансировку
curl http://localhost/
```

## Остановка

```bash
docker compose down
```

## Конфигурация

### Backend-сервер

- **Порт:** 3000
- **Эндпоинты:**
  - `GET /` — возвращает ID сервера и timestamp
  - `GET /health` — проверка здоровья

### Nginx

- **Порт:** 80 (внешний)
- **Алгоритм балансировки:** least_conn (наименьшее количество соединений)
- **Backend-пул:** backend-1:3000, backend-2:3000
