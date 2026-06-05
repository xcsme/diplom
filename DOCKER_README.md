# Кофейня: Мастерская вкуса — Docker-деплой

## Быстрый запуск

```bash
# Клонировать/скопировать проект на сервер, затем:
docker compose up -d --build
```

Приложение будет доступно по адресу: **http://ваш-сервер:80**

## Структура

| Сервис | Порт | Описание |
|--------|------|----------|
| `frontend` | 80 | Nginx — React-билд + прокси /api → backend |
| `backend` | 8001 | FastAPI — игровая логика и API |
| `mongo` | 27017 | MongoDB — база данных |

## Команды

```bash
# Запуск
docker compose up -d --build

# Логи
docker compose logs -f            # все
docker compose logs -f backend    # только бэкенд

# Остановка
docker compose down

# Остановка + удаление данных
docker compose down -v
```

## HTTPS (опционально)

Для HTTPS замените `frontend/nginx.conf` на конфигурацию с SSL-сертификатами или поставьте перед docker-compose reverse-proxy (Traefik, Caddy).

**Пример с Caddy (самый простой):** добавьте в docker-compose:

```yaml
  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
```

И `Caddyfile`:
```
yourdomain.com {
    reverse_proxy frontend:80
}
```
