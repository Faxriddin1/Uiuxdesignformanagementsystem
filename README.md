<div align="center">

# 🏢 Management System

**Корпоративная система управления задачами, проектами и R&D-исследованиями**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?logo=django)](https://djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#лицензия)

[Быстрый старт](#-быстрый-старт-5-минут) · [Документация](#-документация) · [API](#api-контракты)

</div>

---

## 🚀 Быстрый старт (5 минут)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Faxriddin1/Uiuxdesignformanagementsystem.git
cd Uiuxdesignformanagementsystem

# 2. Настроить и запустить (одна команда!)
make setup

# 3. Открыть приложение
# Backend API:  http://localhost:8000/api/docs/
# Frontend:     http://localhost:5173
```

### Демо-доступы

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@example.com | admin123 |
| Manager | manager@example.com | user123 |
| Designer | designer@example.com | user123 |

---

## 📚 Документация

| Документ | Описание |
|----------|----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Архитектура системы, слои, диаграммы |
| [DECISIONS.md](docs/DECISIONS.md) | Архитектурные решения (ADR) |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Гайд для разработчиков |
| [HOW_TO_EXTEND.md](docs/HOW_TO_EXTEND.md) | Как добавлять новый функционал |
| [ACCEPTANCE_CHECKLIST.md](docs/ACCEPTANCE_CHECKLIST.md) | Чеклист готовности проекта |

---

## 📋 Содержание

- [Обзор](#обзор)
- [Возможности](#возможности)
- [Архитектура](#архитектура-и-компоненты)
- [Технологический стек](#технологический-стек)
- [Структура репозитория](#структура-репозитория)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [API контракты](#api-контракты)
- [Безопасность](#безопасность-и-соответствие)
- [Production Deploy](#production-deploy)
- [Roadmap](#дорожная-карта)
- [Contributing](#contributing)
- [Лицензия](#лицензия)

---

## 🎯 Обзор

**Management System** — это полнофункциональная корпоративная платформа для управления рабочими процессами организации. Система объединяет управление задачами, проектами и научно-исследовательскими работами (R&D) в едином интерфейсе с поддержкой многоуровневых согласований и ролевой модели доступа.

Фронтенд-приложение разработано на основе профессионального UI/UX дизайна из Figma, обеспечивая современный и интуитивно понятный пользовательский интерфейс корпоративного уровня.

### Целевые пользователи

| Роль | Описание |
|------|----------|
| 👤 **Employee (Сотрудник)** | Исполнитель задач, автор исследований |
| 👔 **Division Head (Начальник отдела)** | Управление командой, первичное согласование |
| 🏛️ **Department Head (Начальник департамента)** | Контроль нескольких отделов |
| 👑 **Management Head (Руководство)** | Финальное согласование, полный доступ |

### Ключевая ценность

- ✅ **Прозрачность** — полная история изменений и аудит всех действий
- ✅ **Контроль** — двухуровневая система согласования (Division → Management)
- ✅ **Гибкость** — настраиваемые workflow для разных типов задач (T1/T2)
- ✅ **Аналитика** — дашборды и метрики производительности в реальном времени

---

## ⚡ Возможности

### 📝 Tasks (Задачи)

| Функция | Описание |
|---------|----------|
| CRUD операции | Создание, просмотр, редактирование, удаление задач |
| Типы задач | T1 (конфиденциальные) / T2 (стандартные) |
| Workflow | NEW → IN_PROGRESS → REVIEW → ACCEPTED |
| Дедлайны | Автоматическое отслеживание просроченных задач |
| Соисполнители | Назначение нескольких исполнителей |
| Версионирование | История всех версий результатов |

### 📁 Projects (Проекты)

| Функция | Описание |
|---------|----------|
| 4-Step Stepper | DRAFT → PLANNING → IN_PROGRESS → COMPLETED |
| Milestones | Контрольные точки с отслеживанием прогресса |
| Связь с задачами | Группировка задач по проектам |
| Команда проекта | Менеджер + участники |

### 🔬 R&D Registry (Реестр исследований)

| Функция | Описание |
|---------|----------|
| Типы исследований | technical, market, competitive, user, feasibility |
| Уровни доступа | public, division, restricted, private |
| Workflow | DRAFT → IN_PROGRESS → REVIEW → APPROVED |
| Вложения | Документы, отчёты, презентации |

### ✅ Approvals (Двухуровневая приёмка)

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│   Исполнитель   │────▶│  Начальник отдела   │────▶│    Руководство       │
│    (submit)     │     │ (DIVISION_REVIEW)   │     │ (MANAGEMENT_REVIEW)  │
└─────────────────┘     └─────────────────────┘     └──────────────────────┘
                              │                              │
                              ▼ reject                       ▼ reject
                        ┌───────────┐                  ┌───────────┐
                        │  REWORK   │                  │  REWORK   │
                        └───────────┘                  └───────────┘
```

- **T2 задачи**: Двухуровневое согласование (отдел → руководство)
- **T1 задачи**: Напрямую к руководству (минуя начальника отдела)

### 💬 Comments & Attachments

- Комментарии с @mentions (уведомления упомянутым)
- Вложения с preview (изображения, документы)
- Причины возврата сохраняются как специальные комментарии

### 🔔 Notifications

- Real-time уведомления о событиях
- Фильтрация по типам (assignment, approval, mention, deadline)
- Настройки предпочтений пользователя
- Счётчик непрочитанных

### 📊 Analytics & Dashboards

| Метрика | Описание |
|---------|----------|
| Summary | Общая статистика: задачи, проекты, исследования |
| Tasks by Status | Распределение по статусам (pie chart) |
| Overdue Tasks | Просроченные задачи с группировкой |
| Velocity | Скорость выполнения по периодам (line chart) |
| Workload | Загруженность сотрудников (bar chart) |

Визуализация: **Recharts** (React charting library)

### 🔐 RBAC (Role-Based Access Control)

| Роль | Создание | Согласование T2 | Согласование T1 | Просмотр |
|------|----------|-----------------|-----------------|----------|
| Employee | Самопостановка | ❌ | ❌ | Свои задачи |
| Division Head | Для отдела | ✅ (свой отдел) | ❌ | Свой отдел |
| Department Head | Все | ✅ | ✅ | Все |
| Management Head | Все | ✅ | ✅ | Все |

### 📜 Audit Log

- Все изменения статусов фиксируются
- История действий пользователей
- Поля `created_by`, `updated_by` на всех сущностях
- Soft delete (данные не удаляются физически)

---

## 🏗️ Архитектура и компоненты

### Общая схема

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              КЛИЕНТ                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    React 18 + TypeScript                         │    │
│  │    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │    │
│  │    │Dashboard │  │  Tasks   │  │ Projects │  │ Research │       │    │
│  │    └──────────┘  └──────────┘  └──────────┘  └──────────┘       │    │
│  │                         │                                        │    │
│  │                    Axios / Fetch                                 │    │
│  └─────────────────────────┼───────────────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────────────────┘
                             │ HTTPS (JWT Bearer)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           NGINX (Reverse Proxy)                          │
│                    SSL Termination / Static Files                        │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                 Django 5.0 + DRF 3.15                            │    │
│  │  ┌────────────────────────────────────────────────────────┐     │    │
│  │  │                    /api/v1/                             │     │    │
│  │  │  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌─────────────┐   │     │    │
│  │  │  │  Auth   │ │ Tasks  │ │ Projects │ │  Research   │   │     │    │
│  │  │  └─────────┘ └────────┘ └──────────┘ └─────────────┘   │     │    │
│  │  │  ┌───────────────┐ ┌────────────┐ ┌────────────────┐   │     │    │
│  │  │  │ Notifications │ │ Analytics  │ │     Users      │   │     │    │
│  │  │  └───────────────┘ └────────────┘ └────────────────┘   │     │    │
│  │  └────────────────────────────────────────────────────────┘     │    │
│  │                              │                                   │    │
│  │                     Service Layer                                │    │
│  │  ┌────────────────────────────────────────────────────────┐     │    │
│  │  │ TaskService │ ProjectService │ ResearchService │ ...   │     │    │
│  │  └────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL 16                                   │
│              (accounts, tasks, projects, research, ...)                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Ключевые принципы

> ⚠️ **Важно**: Фронтенд **никогда** не обращается к базе данных напрямую.  
> Все данные проходят через REST API с JWT-аутентификацией.

### Сервисы (Docker Compose)

| Сервис | Порт | Описание |
|--------|------|----------|
| `frontend` | 5173 | React dev server (Vite) |
| `backend` | 8000 | Django + Gunicorn |
| `db` | 5432 | PostgreSQL 16 |
| `nginx` | 80/443 | Reverse proxy (production) |

### API Versioning

Все эндпоинты начинаются с `/api/v1/`. При breaking changes будет создана версия `/api/v2/` с поддержкой обратной совместимости в течение 6 месяцев.

---

## 🛠️ Технологический стек

### Frontend

| Категория | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| Framework | React | 18.3 | UI библиотека |
| Language | TypeScript | 5.x | Типизация |
| Build Tool | Vite | 6.x | Сборка и dev server |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| UI Components | Radix UI | latest | Headless UI компоненты |
| Forms | React Hook Form + Zod | 7.x | Формы и валидация |
| Charts | Recharts | 2.x | Визуализация данных |
| Icons | Lucide React | latest | Иконки |
| State | React Context | built-in | Состояние приложения |

### Backend

| Категория | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| Framework | Django | 5.0 | Web framework |
| API | Django REST Framework | 3.15 | REST API |
| Auth | Simple JWT | 5.3 | JWT аутентификация |
| Docs | drf-spectacular | 0.27 | OpenAPI 3.0 |
| Filtering | django-filter | 24.x | Query filtering |
| CORS | django-cors-headers | 4.x | Cross-origin requests |

### Database & Infrastructure

| Категория | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| Database | PostgreSQL | 16 | Основная БД |
| Driver | psycopg | 3.x | PostgreSQL adapter |
| Containerization | Docker | 24.x | Контейнеризация |
| Orchestration | Docker Compose | 2.x | Оркестрация |
| Web Server | Gunicorn | 21.x | WSGI server |
| Reverse Proxy | Nginx | 1.25 | Proxy + static |

### Security & Quality

| Категория | Технология | Назначение |
|-----------|------------|------------|
| Auth | JWT (HS256) | Аутентификация |
| Rate Limiting | django-ratelimit | Защита от DDoS |
| Linting | ESLint / Flake8 | Статический анализ |
| Formatting | Prettier / Black | Форматирование |
| Pre-commit | pre-commit hooks | Git hooks |
| Testing | pytest / Vitest | Тестирование |

---

## 📂 Структура репозитория

```
management-system/
│
├── 📁 src/                          # Frontend (React)
│   ├── 📁 components/
│   │   ├── 📁 layout/               # Sidebar, Header, PageHeader
│   │   ├── 📁 pages/                # Dashboard, Tasks, Projects, Research
│   │   ├── 📁 ui/                   # Переиспользуемые UI компоненты
│   │   └── 📁 figma/                # Компоненты из Figma
│   ├── 📁 data/                     # Mock данные (для разработки)
│   ├── 📁 types/                    # TypeScript типы
│   ├── 📁 utils/                    # Хелперы, permissions
│   ├── 📁 styles/                   # Глобальные стили
│   ├── App.tsx                      # Корневой компонент
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Tailwind imports
│
├── 📁 backend/                      # Backend (Django)
│   ├── 📁 apps/
│   │   ├── 📁 accounts/             # Пользователи, роли, JWT auth
│   │   ├── 📁 tasks/                # Задачи, комментарии, вложения
│   │   ├── 📁 projects/             # Проекты, milestones
│   │   ├── 📁 research/             # R&D исследования
│   │   ├── 📁 notifications/        # Уведомления
│   │   ├── 📁 analytics/            # Метрики и дашборд
│   │   └── 📁 core/                 # Базовые модели, exceptions
│   ├── 📁 services/                 # Бизнес-логика (Service Layer)
│   ├── 📁 config/
│   │   ├── 📁 settings/             # base, development, production
│   │   ├── urls.py                  # Главный роутер
│   │   └── wsgi.py
│   ├── 📁 tests/                    # pytest тесты
│   ├── 📁 scripts/                  # entrypoint, seed data
│   ├── 📁 requirements/             # Зависимости
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── manage.py
│   └── .env.example
│
├── 📁 docs/                         # Документация (опционально)
│   ├── api/                         # API спецификации
│   ├── architecture/                # Диаграммы архитектуры
│   └── guides/                      # Руководства
│
├── index.html                       # HTML entry (Vite)
├── package.json                     # Frontend зависимости
├── vite.config.ts                   # Vite конфигурация
├── tailwind.config.js               # Tailwind конфигурация
├── tsconfig.json                    # TypeScript конфигурация
├── .gitignore
├── .env.example                     # Шаблон переменных окружения
└── README.md                        # Этот файл
```

---

## 🚀 Быстрый старт

### Prerequisites

Убедитесь, что установлены:

- [ ] **Node.js** 20.x или выше ([скачать](https://nodejs.org/))
- [ ] **Docker** 24.x и **Docker Compose** 2.x ([скачать](https://docker.com/))
- [ ] **Git** ([скачать](https://git-scm.com/))

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/your-org/management-system.git
cd management-system
```

### Шаг 2: Настройка окружения

```bash
# Backend
cd backend
cp .env.example .env

# Вернуться в корень
cd ..
```

> 💡 Отредактируйте `backend/.env` при необходимости (см. [Переменные окружения](#переменные-окружения))

### Шаг 3: Запуск Backend (Docker)

```bash
cd backend
docker compose up --build -d
```

Это выполнит:
- ✅ Сборку Docker образа
- ✅ Запуск PostgreSQL
- ✅ Применение миграций
- ✅ Создание демо-данных (seed)

### Шаг 4: Запуск Frontend

```bash
# В корне проекта
npm install
npm run dev
```

### Шаг 5: Проверка

| Сервис | URL | Описание |
|--------|-----|----------|
| 🖥️ Frontend | http://localhost:5173 | React приложение |
| 🔌 API | http://localhost:8000/api/v1/ | REST API |
| 📖 Swagger | http://localhost:8000/api/docs/ | API документация |
| 📋 ReDoc | http://localhost:8000/api/redoc/ | Альтернативная документация |
| ⚙️ Admin | http://localhost:8000/admin/ | Django Admin |

### Демо-пользователи

После запуска seed_data автоматически создаются тестовые пользователи:

| Email | Пароль | Роль |
|-------|--------|------|
| `admin@example.com` | `admin123` | Management Head |
| `department@example.com` | `user123` | Department Head |
| `division_rnd@example.com` | `user123` | Division Head (R&D) |
| `division_design@example.com` | `user123` | Division Head (Design) |
| `employee1@example.com` | `user123` | Employee |
| `employee2@example.com` | `user123` | Employee |

### Полезные команды

```bash
# Логи backend
docker compose -f backend/docker-compose.yml logs -f web

# Зайти в контейнер
docker compose -f backend/docker-compose.yml exec web bash

# Запустить тесты
docker compose -f backend/docker-compose.yml exec web pytest

# Создать суперпользователя вручную
docker compose -f backend/docker-compose.yml exec web python manage.py createsuperuser

# Остановить всё
docker compose -f backend/docker-compose.yml down

# Очистить volumes (осторожно: удалит данные!)
docker compose -f backend/docker-compose.yml down -v
```

---

## ⚙️ Переменные окружения

### Backend (`backend/.env`)

| Переменная | Пример | Описание | Секрет |
|------------|--------|----------|--------|
| `DEBUG` | `True` | Режим отладки | ❌ |
| `DJANGO_ENV` | `development` | Окружение (development/staging/production) | ❌ |
| `SECRET_KEY` | `django-insecure-xxx` | Секретный ключ Django | ✅ |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Разрешённые хосты | ❌ |
| `DATABASE_URL` | `postgres://user:pass@db:5432/dbname` | URL подключения к БД | ✅ |
| `DB_HOST` | `db` | Хост PostgreSQL | ❌ |
| `DB_PORT` | `5432` | Порт PostgreSQL | ❌ |
| `DB_NAME` | `management_system` | Имя базы данных | ❌ |
| `DB_USER` | `postgres` | Пользователь БД | ✅ |
| `DB_PASSWORD` | `postgres` | Пароль БД | ✅ |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | CORS origins | ❌ |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `15` | Время жизни access token | ❌ |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7` | Время жизни refresh token | ❌ |
| `CREATE_SEED_DATA` | `True` | Создавать демо-данные при старте | ❌ |
| `DEMO_USER_PASSWORD` | `user123` | Пароль демо-пользователей | ✅ |
| `DEMO_ADMIN_PASSWORD` | `admin123` | Пароль администратора | ✅ |

### Генерация секретного ключа

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

> ⚠️ **Важно**: В production **никогда** не используйте значения по умолчанию для секретов!

---

## 📡 API контракты

Полная документация API доступна в **Swagger UI**: `http://localhost:8000/api/docs/`

### Authentication

#### Login (получение токенов)

```http
POST /api/v1/auth/login/
Content-Type: application/json

{
  "email": "employee1@example.com",
  "password": "user123"
}
```

**Response 200:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "employee1@example.com",
    "first_name": "Иван",
    "last_name": "Петров",
    "role": "employee",
    "division": "rnd"
  }
}
```

#### Refresh Token

```http
POST /api/v1/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Current User

```http
GET /api/v1/users/me/
Authorization: Bearer <access_token>
```

### Tasks

#### Список задач (с фильтрами)

```http
GET /api/v1/tasks/?status=in_progress&priority=high&ordering=-deadline
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/v1/tasks/?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Анализ рынка CRM систем",
      "status": "in_progress",
      "status_display": "В работе",
      "priority": "high",
      "task_type": "T2",
      "deadline": "2026-01-15",
      "is_overdue": false,
      "assignee": {
        "id": "...",
        "full_name": "Петров Иван",
        "avatar_url": null
      },
      "created_at": "2026-01-05T10:30:00Z"
    }
  ]
}
```

#### Создание задачи

```http
POST /api/v1/tasks/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Подготовить отчёт Q1",
  "description": "Квартальный отчёт по продажам",
  "task_type": "T2",
  "priority": "medium",
  "division": "rnd",
  "assignee_id": "550e8400-e29b-41d4-a716-446655440002",
  "deadline": "2026-01-20"
}
```

#### Workflow Actions

```http
# Взять в работу
POST /api/v1/tasks/{id}/take/

# Отправить на проверку
POST /api/v1/tasks/{id}/submit/
{
  "result_description": "Отчёт подготовлен, прикреплён файл"
}

# Одобрить (для reviewers)
POST /api/v1/tasks/{id}/approve/

# Вернуть на доработку
POST /api/v1/tasks/{id}/reject/
{
  "reason": "Необходимо добавить графики по регионам"
}

# Отозвать с проверки (исполнитель)
POST /api/v1/tasks/{id}/withdraw/
{
  "reason": "Обнаружил ошибку в расчётах"
}
```

### Projects

```http
# Список проектов
GET /api/v1/projects/

# Создание
POST /api/v1/projects/
{
  "title": "Внедрение CRM",
  "code": "CRM-2026",
  "description": "Проект внедрения CRM системы",
  "priority": "high",
  "division": "rnd",
  "start_date": "2026-01-01",
  "end_date": "2026-06-30"
}

# Смена статуса
POST /api/v1/projects/{id}/transition/
{
  "status": "in_progress"
}

# Добавить milestone
POST /api/v1/projects/{id}/milestones/
{
  "title": "Завершение анализа требований",
  "due_date": "2026-02-01"
}
```

### Analytics

```http
# Общая статистика
GET /api/v1/analytics/summary/

# Задачи по статусам
GET /api/v1/analytics/tasks-by-status/

# Просроченные задачи
GET /api/v1/analytics/overdue/

# Метрики производительности
GET /api/v1/analytics/velocity/?period=week

# Загруженность сотрудников
GET /api/v1/analytics/workload/
```

### Коды ошибок

| Код | Описание |
|-----|----------|
| `400` | Validation Error — неверные данные |
| `401` | Unauthorized — требуется авторизация |
| `403` | Forbidden — нет прав доступа |
| `404` | Not Found — ресурс не найден |
| `409` | Conflict — конфликт workflow (неверный переход статуса) |
| `429` | Too Many Requests — превышен rate limit |

---

## 🔒 Безопасность и соответствие

### Authentication & Authorization

| Механизм | Реализация |
|----------|------------|
| **Аутентификация** | JWT (HS256), access + refresh tokens |
| **Авторизация** | RBAC (Role-Based Access Control) |
| **Хранение токенов** | HttpOnly cookies (рекомендуется) или localStorage |
| **Refresh стратегия** | Silent refresh перед истечением access token |

### API Security

| Защита | Описание |
|--------|----------|
| **CORS** | Whitelist разрешённых origins |
| **Rate Limiting** | 100 req/min (anon), 1000 req/min (auth) |
| **Input Validation** | Serializer validation + Zod на фронте |
| **SQL Injection** | ORM (Django ORM, parameterized queries) |
| **XSS** | Content-Security-Policy, автоэкранирование |

### Хранение секретов

> ⚠️ **Production рекомендации:**

- Использовать **Vault**, **AWS Secrets Manager** или аналог
- Никогда не коммитить `.env` файлы
- Ротация секретов каждые 90 дней
- Разные секреты для dev/staging/production

### Audit & Compliance

| Функция | Описание |
|---------|----------|
| **Audit Log** | Все изменения статусов логируются |
| **Soft Delete** | Данные не удаляются физически |
| **Created/Updated By** | Автоматическая фиксация авторства |
| **IP Logging** | Логирование IP при критических действиях |

### Production Checklist

- [ ] `DEBUG=False`
- [ ] Уникальный `SECRET_KEY`
- [ ] HTTPS only (`SECURE_SSL_REDIRECT=True`)
- [ ] `ALLOWED_HOSTS` содержит только production домены
- [ ] Secure cookies (`SESSION_COOKIE_SECURE=True`)
- [ ] CORS настроен на production frontend
- [ ] Rate limiting включён
- [ ] Логи не содержат sensitive данных

---

## 🌐 Production Deploy

> ⚠️ Данный раздел содержит рекомендации. Детальный deployment guide будет добавлен.

### Рекомендуемая архитектура

```
                         ┌─────────────────┐
                         │   CloudFlare    │
                         │  (CDN + WAF)    │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │     Nginx       │
                         │ (SSL + Proxy)   │
                         └───┬─────────┬───┘
                             │         │
              ┌──────────────▼───┐ ┌───▼──────────────┐
              │   Frontend       │ │     Backend      │
              │   (Static/CDN)   │ │   (Gunicorn)     │
              └──────────────────┘ └────────┬─────────┘
                                            │
                                   ┌────────▼────────┐
                                   │   PostgreSQL    │
                                   │  (Primary/RO)   │
                                   └─────────────────┘
```

### Домены

| Сервис | Домен (пример) |
|--------|----------------|
| Frontend | `app.your-domain.com` |
| API | `api.your-domain.com` |
| Admin | `admin.your-domain.com` (с IP whitelist) |

### SSL/HTTPS

- Let's Encrypt + Certbot для автоматического обновления
- Или managed SSL от облачного провайдера

### Nginx конфигурация (пример)

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /app/staticfiles/;
    }

    location /media/ {
        alias /app/media/;
    }
}
```

### Backup & Restore

```bash
# Backup PostgreSQL
docker compose exec db pg_dump -U postgres management_system > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db psql -U postgres management_system < backup_20260108.sql
```

### Observability

| Инструмент | Назначение |
|------------|------------|
| **Logs** | Docker logs → ELK / Loki / CloudWatch |
| **Metrics** | Prometheus + Grafana |
| **APM** | Sentry (errors + performance) |
| **Uptime** | UptimeRobot / Pingdom |

---

## 🗺️ Дорожная карта

### P0 — MVP (Текущий релиз)

- [x] Аутентификация JWT
- [x] CRUD Tasks с workflow
- [x] CRUD Projects с milestones
- [x] CRUD Research с access control
- [x] Двухуровневое согласование
- [x] Комментарии и вложения
- [x] Уведомления
- [x] Аналитика (дашборд)
- [x] RBAC (4 роли)
- [x] Docker deployment

### P1 — Next Release

- [ ] WebSocket real-time notifications
- [ ] Email уведомления (SMTP integration)
- [ ] Kanban board (drag & drop)
- [ ] Экспорт отчётов (PDF/Excel)
- [ ] Интеграция с календарём
- [ ] Mobile-responsive improvements
- [ ] Dark mode

### P2 — Future

- [ ] Telegram/Slack интеграция
- [ ] Workflow builder (конструктор процессов)
- [ ] SSO (SAML/OIDC)
- [ ] Multi-tenancy
- [ ] AI-assisted task assignment
- [ ] Gantt chart для проектов
- [ ] Time tracking

---

## 🤝 Contributing

Мы приветствуем вклад в развитие проекта!

### Coding Standards

#### Python (Backend)

```bash
# Форматирование
black .
isort .

# Линтинг
flake8 .

# Всё вместе (pre-commit)
pre-commit run --all-files
```

#### TypeScript (Frontend)

```bash
# Линтинг
npm run lint

# Форматирование
npm run format
```

### Git Workflow

1. **Branches**
   - `main` — production-ready код
   - `develop` — интеграционная ветка
   - `feature/*` — новые функции
   - `bugfix/*` — исправления
   - `hotfix/*` — срочные фиксы для production

2. **Commits** (Conventional Commits)
   ```
   feat(tasks): add bulk status update
   fix(auth): resolve token refresh race condition
   docs(readme): update API examples
   refactor(services): extract notification logic
   ```

3. **Pull Requests**
   - Описание изменений
   - Ссылка на issue/task
   - Screenshots для UI изменений
   - Все тесты должны проходить

### Добавление нового модуля

1. Создать Django app:
   ```bash
   cd backend
   python manage.py startapp new_module apps/new_module
   ```

2. Добавить в `LOCAL_APPS` (`config/settings/base.py`)

3. Создать:
   - `models.py` — модели данных
   - `serializers.py` — DRF сериализаторы
   - `views.py` — ViewSets
   - `urls.py` — маршруты
   - `admin.py` — админка
   - `constants.py` — константы (статусы, типы)

4. Создать сервис в `services/new_module_service.py`

5. Подключить URLs в `config/urls.py`

6. Написать тесты в `tests/test_new_module.py`

7. Обновить документацию

### Pre-commit Setup

```bash
cd backend
pip install pre-commit
pre-commit install
```

---

## 📄 Лицензия

```
Copyright © 2026 [Your Organization Name]

Все права защищены. Данное программное обеспечение является 
собственностью [Your Organization Name] и защищено законами 
об авторском праве.

Несанкционированное копирование, распространение или использование
данного программного обеспечения строго запрещено.

Для получения лицензии обратитесь: license@your-domain.com
```

---

## 📞 Поддержка

| Канал | Контакт |
|-------|---------|
| 📧 Email | support@your-domain.com |
| 💬 Slack | #management-system-support |
| 📝 Issues | [GitHub Issues](https://github.com/your-org/management-system/issues) |
| 📖 Wiki | [Internal Confluence](https://wiki.your-domain.com) |

---

## 📎 Assumptions

При подготовке данной документации были приняты следующие допущения:

1. **Порты**: Frontend — 5173, Backend — 8000, PostgreSQL — 5432
2. **Репозиторий**: `github.com/your-org/management-system`
3. **Домены**: Используются placeholder значения `your-domain.com`
4. **Версии**: React 18.3, Django 5.0, PostgreSQL 16
5. **Окружение разработки**: Docker Compose для backend, Vite dev server для frontend
6. **Redis/Celery**: Планируется для P1 (WebSocket, Email queues), пока не реализовано

---

<div align="center">

**Built with ❤️ for Enterprise**

[⬆ Наверх](#-management-system)

</div>
