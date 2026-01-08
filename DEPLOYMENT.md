# 🚀 Deployment Guide

**Проект:** Management System  
**Версия:** 1.0  
**Дата:** 2026-01-08

---

## 📋 Содержание

- [Обзор](#обзор)
- [Требования](#требования)
- [Development](#development)
- [Staging](#staging)
- [Production](#production)
- [Database Management](#database-management)
- [Мониторинг и логи](#мониторинг-и-логи)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Обзор

Этот документ описывает процесс развёртывания Management System в различных окружениях.

### Окружения

| Окружение | Назначение | URL (пример) | Автодеплой |
|-----------|------------|--------------|------------|
| **Development** | Локальная разработка | localhost | Нет |
| **Staging** | Тестирование перед prod | stage.your-domain.com | Да (на push в develop) |
| **Production** | Боевое окружение | app.your-domain.com | Нет (ручной релиз) |

---

## 📦 Требования

### Минимальные системные требования

**Backend (Django):**
- CPU: 2 cores
- RAM: 4GB
- Disk: 50GB SSD
- OS: Ubuntu 22.04 LTS / Debian 11

**Database (PostgreSQL):**
- CPU: 2 cores
- RAM: 4GB
- Disk: 100GB SSD (с учётом роста данных)

**Frontend (Static files):**
- Не требует отдельного сервера (статика отдаётся через NGINX или CDN)

### Софт

- Docker 24.x
- Docker Compose 2.x
- NGINX 1.25+ (для reverse proxy)
- PostgreSQL 16
- Git

---

## 💻 Development

### Быстрый старт

```bash
# Клонирование репозитория
git clone https://github.com/your-org/management-system.git
cd management-system

# One-command установка
make install

# Альтернатива (вручную)
# Backend
cd backend
cp .env.example .env
docker compose up -d

# Frontend
cd ..
npm install
npm run dev
```

### Доступ

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/v1/
- **Swagger UI:** http://localhost:8000/api/docs/
- **Django Admin:** http://localhost:8000/admin/

### Демо пользователи

| Email | Пароль | Роль |
|-------|--------|------|
| admin@example.com | admin123 | Management Head |
| employee1@example.com | user123 | Employee |

---

## 🧪 Staging

Staging окружение максимально близко к production.

### Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo apt install docker-compose-plugin

# Установка NGINX
sudo apt install nginx certbot python3-certbot-nginx
```

### Настройка окружения

```bash
# Клонирование репозитория
cd /opt
sudo git clone https://github.com/your-org/management-system.git
cd management-system

# Создание .env файлов
cd backend
sudo cp .env.example .env
sudo nano .env  # Настроить переменные
```

**backend/.env для staging:**
```bash
DEBUG=False
DJANGO_ENV=staging
SECRET_KEY=<generate_unique_key>
ALLOWED_HOSTS=stage.your-domain.com

# Database
DATABASE_URL=postgres://user:password@db:5432/management_system_stage
DB_HOST=db
DB_PORT=5432
DB_NAME=management_system_stage
DB_USER=postgres
DB_PASSWORD=<strong_password>

# CORS
CORS_ALLOWED_ORIGINS=https://stage.your-domain.com
CORS_ALLOW_CREDENTIALS=True

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# SSL
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Email (SMTP)
EMAIL_BACKEND=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@your-domain.com
EMAIL_HOST_PASSWORD=<app_password>
DEFAULT_FROM_EMAIL=Management System <noreply@your-domain.com>

# Seed data (отключить для staging/prod)
CREATE_SEED_DATA=False
```

### Запуск

```bash
# Запуск backend
cd backend
sudo docker compose -f docker-compose.yml up -d

# Сборка frontend
cd ..
npm install
npm run build

# Frontend будет отдаваться через NGINX
```

### NGINX конфигурация

```bash
sudo nano /etc/nginx/sites-available/management-system-staging
```

**Конфигурация:**
```nginx
# Backend API
server {
    listen 80;
    server_name stage-api.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name stage-api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/stage-api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stage-api.your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend proxy
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /opt/management-system/backend/staticfiles/;
    }

    location /media/ {
        alias /opt/management-system/backend/media/;
    }
}

# Frontend
server {
    listen 80;
    server_name stage.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name stage.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/stage.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stage.your-domain.com/privkey.pem;

    root /opt/management-system/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

**Включение конфигурации:**
```bash
sudo ln -s /etc/nginx/sites-available/management-system-staging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL сертификаты

```bash
# Let's Encrypt (бесплатно)
sudo certbot --nginx -d stage.your-domain.com -d stage-api.your-domain.com

# Автообновление
sudo certbot renew --dry-run
```

---

## 🏭 Production

Production deployment аналогичен staging, но с дополнительными мерами безопасности.

### Production Checklist

#### Перед деплоем

- [ ] **Код:** Все тесты проходят в CI
- [ ] **Код:** Code review завершён
- [ ] **Безопасность:** Secrets не в коде
- [ ] **Безопасность:** pre-commit hooks настроены
- [ ] **Database:** Backup создан
- [ ] **Database:** Миграции проверены на staging
- [ ] **Monitoring:** Sentry настроен (опционально)
- [ ] **Logs:** Centralized logging настроен

#### Настройки окружения

```bash
DEBUG=False
DJANGO_ENV=production
SECRET_KEY=<unique_production_key>
ALLOWED_HOSTS=app.your-domain.com,api.your-domain.com

# Database
DATABASE_URL=postgres://user:password@db:5432/management_system_prod
DB_HOST=db  # или IP managed database
DB_PORT=5432
DB_NAME=management_system_prod
DB_USER=<production_user>
DB_PASSWORD=<very_strong_password>

# CORS
CORS_ALLOWED_ORIGINS=https://app.your-domain.com
CORS_ALLOW_CREDENTIALS=True

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# SSL
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True

# Email
EMAIL_BACKEND=smtp
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@your-domain.com
EMAIL_HOST_PASSWORD=<production_app_password>

# Sentry (опционально)
# SENTRY_DSN=https://xxx@sentry.io/xxx

# NO SEED DATA IN PRODUCTION
CREATE_SEED_DATA=False
```

### Deployment процесс

```bash
# 1. Подключение к серверу
ssh user@production-server

# 2. Переход в директорию
cd /opt/management-system

# 3. Остановка сервисов
cd backend
docker compose down

# 4. Обновление кода
git fetch origin
git checkout v1.2.0  # конкретный tag

# 5. Backup базы данных
docker compose exec -T db pg_dump -U postgres management_system_prod > /backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 6. Применение миграций
docker compose up -d db
docker compose exec web python manage.py migrate --noinput

# 7. Сборка статики
docker compose exec web python manage.py collectstatic --noinput

# 8. Запуск backend
docker compose up -d

# 9. Сборка и деплой frontend
cd ..
npm ci
npm run build

# 10. Обновление NGINX (если нужно)
sudo systemctl reload nginx

# 11. Проверка здоровья
curl https://api.your-domain.com/api/v1/health/
```

### Zero-downtime deployment

Для минимизации даунтайма используйте:

```bash
# Запуск новой версии параллельно
docker compose -f docker-compose.prod.yml up -d --scale web=2

# Ожидание healthcheck
sleep 30

# Переключение NGINX на новые контейнеры
# (требует настройки upstream)

# Остановка старых контейнеров
docker compose -f docker-compose.prod.yml scale web=1
```

---

## 💾 Database Management

### Backup

**Автоматический backup (cron):**
```bash
# Создать скрипт
sudo nano /opt/scripts/backup_db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="management_db"

mkdir -p $BACKUP_DIR

docker exec -t $DB_CONTAINER pg_dump -U postgres management_system_prod > $BACKUP_DIR/backup_$DATE.sql

# Удалить старые backup (>30 дней)
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup created: backup_$DATE.sql"
```

```bash
sudo chmod +x /opt/scripts/backup_db.sh

# Добавить в cron (ежедневно в 2:00 AM)
sudo crontab -e
0 2 * * * /opt/scripts/backup_db.sh >> /var/log/postgres_backup.log 2>&1
```

### Restore

```bash
# Восстановление из backup
cd backend
docker compose exec -T db psql -U postgres management_system_prod < /backups/backup_20260108_020000.sql
```

### Миграции

```bash
# Проверка pending миграций
docker compose exec web python manage.py showmigrations

# Применение миграций
docker compose exec web python manage.py migrate

# Откат последней миграции
docker compose exec web python manage.py migrate <app_name> <previous_migration>
```

---

## 📊 Мониторинг и логи

### Healthcheck

```bash
# Проверка здоровья API
curl https://api.your-domain.com/api/v1/health/
```

**Ожидаемый ответ:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-08T12:00:00Z"
}
```

### Логи

```bash
# Backend logs
docker compose logs -f web

# Database logs
docker compose logs -f db

# NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u docker -f
```

### Метрики

**Рекомендуемые инструменты:**
- **Sentry** - для отслеживания ошибок
- **Prometheus + Grafana** - для метрик
- **ELK Stack / Loki** - для централизованных логов
- **UptimeRobot / Pingdom** - для uptime мониторинга

---

## 🔄 Rollback

### Откат к предыдущей версии

```bash
# 1. Подключение к серверу
ssh user@production-server

# 2. Остановка текущей версии
cd /opt/management-system/backend
docker compose down

# 3. Откат кода
git checkout v1.1.0  # предыдущий стабильный tag

# 4. Restore database (если были миграции)
docker compose up -d db
docker compose exec -T db psql -U postgres management_system_prod < /backups/backup_before_v1.2.0.sql

# 5. Запуск
docker compose up -d

# 6. Rebuild frontend
cd ..
npm run build

# 7. Проверка
curl https://api.your-domain.com/api/v1/health/
```

---

## 🔧 Troubleshooting

### Backend не запускается

```bash
# Проверить логи
docker compose logs web

# Частые проблемы:
# 1. Неправильные переменные окружения
cat .env

# 2. База данных недоступна
docker compose exec db pg_isready -U postgres

# 3. Порты заняты
sudo lsof -i :8000
```

### Database connection failed

```bash
# Проверка PostgreSQL
docker compose exec db psql -U postgres -d management_system_prod

# Проверка connectivity
docker compose exec web nc -zv db 5432

# Проверка credentials
docker compose exec web env | grep DB_
```

### NGINX 502 Bad Gateway

```bash
# Проверка backend
curl http://localhost:8000/api/v1/health/

# Проверка NGINX config
sudo nginx -t

# Проверка логов
sudo tail -f /var/log/nginx/error.log
```

### Disk space full

```bash
# Проверка места
df -h

# Очистка Docker volumes
docker system prune -a --volumes

# Очистка логов
sudo truncate -s 0 /var/log/nginx/*.log
```

---

## 🔗 Полезные команды

```bash
# Status check
make status

# Full restart
make restart

# Database backup
make backup-db

# View logs
make logs

# Run tests
make test

# Security check
make security-check
```

---

## 📚 Дополнительные ресурсы

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура системы
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Гайд для разработчиков
- [API.md](./API.md) - API документация
- [README.md](./README.md) - Общая информация

---

## 📞 Поддержка

**В случае проблем:**
1. Проверить [Troubleshooting](#troubleshooting)
2. Посмотреть логи
3. Создать issue на GitHub
4. Связаться с DevOps командой

**Контакты:**
- Slack: #devops-support
- Email: devops@your-domain.com

---

**Последнее обновление:** 2026-01-08
