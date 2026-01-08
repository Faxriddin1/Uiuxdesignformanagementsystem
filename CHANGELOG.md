# Changelog

Все заметные изменения в проекте документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

---

## [Unreleased]

### 🔜 Planned (P1)
- Email уведомления (SMTP integration)
- WebSocket для real-time notifications
- Kanban board с drag & drop
- Экспорт отчётов (PDF/Excel)
- GitHub Actions CI/CD pipeline
- Dark mode для UI

---

## [0.2.0] - 2026-01-08

### ✨ Added (Аудит и документация)
- **GAP_ANALYSIS.md** - Технический аудит с таблицей 25 выявленных проблем
- **ARCHITECTURE.md** - Полная документация архитектуры системы
- **DECISIONS.md** - Architectural Decision Records (9 ADR)
- **CONTRIBUTING.md** - Руководство для разработчиков по добавлению модулей
- **ASSUMPTIONS.md** - Документация принятых допущений
- **CHANGELOG.md** - Этот файл
- **Makefile** - 30+ команд для автоматизации (up, test, lint, migrate, backup)

### 🔒 Security
- Удалены hardcoded секреты из docker-compose.yml
- Добавлен .dockerignore для безопасности образов
- Документированы security best practices

### 📝 Changed
- Обновлён README.md с улучшенной структурой и ссылками на новую документацию
- docker-compose.yml теперь использует env_file вместо hardcoded значений

---

## [0.1.0] - 2026-01-05

### ✨ Added (MVP Release)

#### Backend
- **Authentication & Authorization**
  - JWT аутентификация (access + refresh tokens)
  - RBAC с 4 ролями (Employee, Division Head, Department Head, Management Head)
  - Permission classes (IsOwnerOrManager, RBAC checks)

- **Apps (Modules)**
  - `accounts` - Пользователи, роли, аутентификация
  - `tasks` - Задачи с workflow (NEW → IN_PROGRESS → REVIEW → ACCEPTED)
  - `projects` - Проекты с milestones и 4-step stepper
  - `research` - R&D исследования с access levels
  - `notifications` - In-app уведомления
  - `analytics` - Дашборд с метриками производительности
  - `core` - Базовые модели, exceptions, middleware

- **Service Layer**
  - TaskService - бизнес-логика задач
  - ProjectService - бизнес-логика проектов
  - ResearchService - бизнес-логика исследований
  - NotificationService - создание уведомлений

- **Features**
  - Двухуровневое согласование (T1/T2 задачи)
  - Комментарии с @mentions
  - Вложения к задачам
  - История изменений (audit log)
  - Версионирование результатов задач
  - Soft delete для всех сущностей
  - Фильтрация и сортировка (django-filter)
  - OpenAPI 3.0 документация (Swagger UI + ReDoc)

- **DevOps**
  - Docker Compose конфигурация
  - Multi-stage Dockerfile
  - Healthcheck endpoints
  - Entrypoint script с миграциями
  - Seed data command

- **Code Quality**
  - pre-commit hooks (black, isort, flake8, bandit)
  - pytest с fixtures
  - Coverage configuration
  - pyproject.toml с настройками инструментов

#### Frontend
- **UI Framework**
  - React 18.3 + TypeScript
  - Vite для сборки
  - Tailwind CSS + Radix UI компоненты
  - Recharts для визуализации

- **Pages**
  - Dashboard с метриками
  - All Tasks / My Tasks с фильтрами
  - Task Detail с комментариями и вложениями
  - Projects & Research списки и детали
  - Review Queue для согласований

- **Features**
  - JWT authentication с auto-refresh
  - Axios interceptors для API calls
  - Permission-based UI rendering
  - Responsive design
  - Real-time status updates

- **Integration**
  - Полная интеграция с backend API
  - Централизованный API клиент
  - TypeScript типы для всех сущностей
  - Error handling и user feedback

#### Database
- PostgreSQL 16 schema
- 20+ таблиц с отношениями
- UUID primary keys
- Indexes на часто используемые поля
- Foreign keys с CASCADE/PROTECT
- created_at, updated_at, created_by на всех моделях

#### Documentation
- Подробный README с quickstart
- API примеры в docstrings
- Inline комментарии в критичных местах
- .env.example с описанием переменных

---

## [0.0.1] - 2026-01-01

### 🎉 Initial Release
- Создание репозитория
- Базовая структура проекта
- Hello World backend + frontend

---

## Формат записей

### Types of changes
- `✨ Added` - новая функциональность
- `📝 Changed` - изменения в существующей функциональности
- `🗑️ Deprecated` - функциональность устарела, будет удалена
- `🔥 Removed` - удалённая функциональность
- `🐛 Fixed` - исправления багов
- `🔒 Security` - изменения безопасности

---

## Ссылки

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Releases](https://github.com/your-org/management-system/releases)

---

**Как обновлять:**
1. При каждом PR добавлять изменения в раздел `[Unreleased]`
2. При релизе создавать новый раздел с версией и датой
3. Перемещать изменения из `[Unreleased]` в новый релиз
4. Создавать git tag: `git tag -a v0.2.0 -m "Release v0.2.0"`
