# Практические работы 15-16 — PWA App Shell + HTTPS + Socket.IO + Web Push

Основа: практика 13-14 (offline TODO), расширена под контрольные 15-16.

## Практика 15 (App Shell + HTTPS)

Что реализовано:
- отдельная страница **"О нас"** (`about.html`)
- Service Worker:
  - статические файлы кэшируются при установке (первом посещении)
  - **Network First** для навигации (HTML) + fallback в кэш
- локальный **HTTPS** сервер (нужен для Push и secure context)

### Запуск по HTTPS

> Сертификаты **не коммитятся** (в репозитории игнорируются `*.pem`).

1) Сгенерируйте сертификаты в папке практики:

```bash
cd practice-15-16-realtime-push-pwa
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/localhost-key.pem \
  -out certs/localhost-cert.pem \
  -days 365 \
  -subj '/CN=localhost'
```

2) Запустите HTTPS-сервер:

```bash
npm run serve:https
```

Откройте:
- `https://localhost:5176/`

### Проверка офлайн + "О нас"

1) Откройте `https://localhost:5176/` онлайн один раз.
2) Откройте `https://localhost:5176/about.html` (или перейдите по ссылке "О нас").
3) В DevTools включите Offline (Network).
4) Перезагрузите `about.html` — страница должна открыться из кэша.

## Практика 16 (следующий шаг)

Реализовано:
- сервер (Express + Socket.IO) раздает статические файлы PWA и Socket.IO клиент
- `newTask` (client) -> server -> `taskAdded` (broadcast)
- Web Push (`web-push`): VAPID ключи, `/api/subscribe` и `/api/unsubscribe`
- кнопки **Подписаться/Отписаться/Тест Push**

### Запуск сервера (HTTPS + Socket.IO + Push)

1) Сгенерируйте HTTPS сертификаты (если еще не сделали):

```bash
cd practice-15-16-realtime-push-pwa
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/localhost-key.pem \
  -out certs/localhost-cert.pem \
  -days 365 \
  -subj '/CN=localhost'
```

2) Установите зависимости сервера:

```bash
cd server
npm install
```

3) Сгенерируйте VAPID ключи:

```bash
npm run generate:vapid
```

4) Запустите сервер, передав VAPID через переменные окружения.

> Важно: **не коммитьте** VAPID_PRIVATE_KEY.

```bash
VAPID_PUBLIC_KEY='<your_public_key>' \
VAPID_PRIVATE_KEY='<your_private_key>' \
npm run dev
```

Откройте PWA:
- `https://localhost:5177/`

### Проверка Socket.IO

Откройте приложение в двух вкладках.
Добавьте задачу в одной вкладке — во второй должна появиться всплывашка "Добавлено (realtime)".

### Проверка Push

1) Нажмите "Подписаться на Push".
2) Разрешите уведомления.
3) Нажмите "Тест Push" — должно прийти уведомление.
