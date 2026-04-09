# Certificates

Эта папка используется для локальных HTTPS сертификатов.

Файлы `*.pem` игнорируются глобальным `.gitignore`, поэтому сертификаты не попадают в репозиторий.

Пример генерации:

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/localhost-key.pem \
  -out certs/localhost-cert.pem \
  -days 365 \
  -subj '/CN=localhost'
```
