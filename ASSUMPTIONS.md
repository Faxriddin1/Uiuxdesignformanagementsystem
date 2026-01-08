# 📋 Assumptions & Design Decisions

**Проект:** Management System  
**Дата:** 2026-01-08  
**Версия:** 1.0

---

## Общие допущения

Данный документ содержит список допущений, принятых при разработке системы. Эти допущения могут быть пересмотрены при изменении требований.

---

## 🔢 Масштаб и производительность

### Допущение 1: Количество пользователей
**Допущение:** Система рассчитана на 100-1000 одновременных пользователей  
**Обоснование:** Корпоративная система для одной организации  
**Риски:** При росте до 10000+ потребуется:
- Horizontal scaling (multiple app instances)
- Database replication (master-slave)
- Caching layer (Redis)

### Допущение 2: Размер базы данных
**Допущение:** До 1TB данных (10 миллионов задач, 100к пользователей)  
**Обоснование:** PostgreSQL хорошо справляется с таким объёмом  
**Риски:** При росте:
- Партиционирование таблиц по датам
- Архивация старых данных

### Допущение 3: Load profile
**Допущение:** Пиковая нагрузка - 100 запросов в секунду  
**Обоснование:** Корпоративное использование (9-18 часов рабочего дня)  
**Риски:** Если нагрузка выше:
- Настроить connection pooling (pgBouncer)
- Добавить CDN для статики

---

## 🌍 Географическое распределение

### Допущение 4: Один дата-центр
**Допущение:** Все пользователи в одном регионе (latency < 50ms)  
**Обоснование:** Российская / локальная компания  
**Риски:** Для multi-region:
- CDN для фронтенда
- Database replication across regions

### Допущение 5: Нет офлайн режима
**Допущение:** Пользователи всегда онлайн  
**Обоснование:** Web приложение, корпоративная сеть  
**Риски:** Для мобильных работников:
- Service Workers для PWA
- Local storage sync

---

## 🔐 Безопасность

### Допущение 6: Внутренняя сеть
**Допущение:** Доступ только из корпоративной сети (VPN или офис)  
**Обоснование:** Sensitive данные, RBAC  
**Риски:** Для публичного доступа:
- 2FA обязателен
- IP whitelisting
- Более строгий rate limiting

### Допущение 7: JWT достаточно для auth
**Допущение:** JWT (access + refresh tokens) безопасны для MVP  
**Обоснование:** Короткие TTL (15 мин access, 7 дней refresh)  
**Риски:** Для enterprise:
- SSO (SAML / OIDC)
- MFA
- Session management с возможностью отзыва

### Допущение 8: HTTPS обязателен в production
**Допущение:** Все коммуникации через TLS 1.3  
**Обоснование:** Защита credentials, GDPR compliance  
**Риски:** Let's Encrypt для автоматического обновления сертификатов

---

## 💾 Данные и хранение

### Допущение 9: PostgreSQL single instance
**Допущение:** Одна мастер-база без репликации (для MVP)  
**Обоснование:** Достаточно для начала, simple setup  
**Риски:** Для production:
- Master-slave replication
- Automatic failover (Patroni / pgpool)
- Daily backups обязательны

### Допущение 10: Файлы хранятся локально
**Допущение:** Attachments на диске сервера (volume mount)  
**Обоснование:** Простота для dev/stage  
**Риски:** Для production:
- S3 / MinIO для distributed storage
- CDN для быстрой отдачи

### Допущение 11: Soft delete для всех данных
**Допущение:** Данные не удаляются физически (deleted_at)  
**Обоснование:** Audit trail, compliance, возможность восстановления  
**Риски:** Растущий размер БД:
- Background job для архивации (data older than 3 years)

---

## 🌐 Интернационализация

### Допущение 12: Только русский язык
**Допущение:** UI и API на русском языке  
**Обоснование:** Российская компания, локальные пользователи  
**Риски:** Для i18n:
- Django i18n framework
- Frontend react-i18next
- Database: translatable fields (JSON)

### Допущение 13: Timezone - UTC
**Допущение:** Все даты хранятся в UTC, отображаются в timezone пользователя  
**Обоснование:** Best practice для multi-timezone apps  
**Риски:** Настройка USER_TIMEZONE в профиле

---

## 📱 Клиенты и интеграции

### Допущение 14: Только Web клиент
**Допущение:** React SPA, нет мобильных приложений  
**Обоснование:** MVP фокус на desktop  
**Риски:** Для mobile:
- Responsive design (уже есть)
- PWA (Service Workers)
- Native apps (React Native / Flutter)

### Допущение 15: Email уведомления опциональны
**Допущение:** In-app notifications + email (P1 feature)  
**Обоснование:** MVP может работать без email  
**Риски:** Для production:
- SMTP integration обязателен
- Email templates (Django templates)

### Допущение 16: Нет интеграций с внешними системами
**Допущение:** Standalone система, нет sync с 1C, SAP и т.д.  
**Обоснование:** MVP self-contained  
**Риски:** Для интеграций:
- REST API webhooks
- Background workers (Celery)

---

## 🧪 Тестирование и качество

### Допущение 17: >80% test coverage для services
**Допущение:** Критичная бизнес-логика покрыта тестами  
**Обоснование:** Service layer = core logic  
**Риски:** Views/serializers могут иметь меньшее покрытие

### Допущение 18: Manual QA перед релизом
**Допущение:** Нет полностью автоматизированного E2E testing  
**Обоснование:** Playwright/Cypress - P2 задача  
**Риски:** Регрессии в UI:
- Добавить E2E тесты для критичных флоу

---

## 🚀 DevOps и развёртывание

### Допущение 19: Docker Compose для dev/stage
**Допущение:** Kubernetes - для production (опционально)  
**Обоснование:** Docker Compose проще для начала  
**Риски:** Для high availability:
- Kubernetes с ingress
- Helm charts для деплоя

### Допущение 20: CI/CD на GitHub Actions
**Допущение:** GitHub Actions для lint/test/build  
**Обоснование:** Бесплатно для публичных репозиториев, интеграция с GitHub  
**Риски:** Альтернативы:
- GitLab CI
- Jenkins

### Допущение 21: Мониторинг - ручной
**Допущение:** Нет Prometheus/Grafana в MVP  
**Обоснование:** Можно мониторить через логи + Docker stats  
**Риски:** Для production:
- Prometheus metrics
- Grafana dashboards
- Sentry для errors

---

## 🔄 Workflow и процессы

### Допущение 22: Жёсткий workflow (не конфигурируемый)
**Допущение:** Статусы и переходы захардкожены в коде  
**Обоснование:** Простота для MVP  
**Риски:** Для гибкости:
- Workflow engine (django-fsm / django-viewflow)
- Admin UI для настройки workflow

### Допущение 23: Двухуровневое согласование достаточно
**Допущение:** T1 (Management) / T2 (Division → Management)  
**Обоснование:** Текущая оргструктура  
**Риски:** При усложнении:
- Multi-level approval chains
- Configurable routes

---

## 📊 Аналитика и отчёты

### Допущение 24: Real-time аналитика не критична
**Допущение:** Дашборды обновляются при загрузке страницы  
**Обоснование:** Не real-time business  
**Риски:** Для real-time:
- WebSocket updates
- Server-sent events

### Допущение 25: Отчёты генерируются on-demand
**Допущение:** Нет scheduled reports (email каждый понедельник)  
**Обоснование:** MVP feature set  
**Риски:** Для автоматизации:
- Celery Beat для cron jobs
- PDF/Excel генерация

---

## 💰 Стоимость и бюджет

### Допущение 26: On-premise или VPS deployment
**Допущение:** Не облачные managed services (AWS RDS, etc.)  
**Обоснование:** Cost optimization  
**Риски:** Для enterprise:
- AWS RDS (PostgreSQL managed)
- AWS ECS / EKS (container orchestration)
- AWS S3 + CloudFront (static assets)

---

## 📝 Изменения допущений

**Процесс пересмотра:**
1. Допущение больше не актуально
2. Создать issue с описанием
3. Обсудить с командой
4. Обновить документ
5. Создать ADR (Architecture Decision Record) в DECISIONS.md

---

## 🔗 Связанные документы

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура системы
- [DECISIONS.md](./DECISIONS.md) - Архитектурные решения (ADR)
- [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) - Результаты аудита

---

**Последнее обновление:** 2026-01-08  
**Следующий пересмотр:** Каждый квартал или при изменении requirements
