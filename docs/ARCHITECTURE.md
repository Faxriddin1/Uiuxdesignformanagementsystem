# Architecture Overview

> Версия: 1.0.0 | Дата: Январь 2025

## 📋 Оглавление

- [Обзор системы](#обзор-системы)
- [Диаграмма архитектуры](#диаграмма-архитектуры)
- [Слои приложения](#слои-приложения)
- [Backend архитектура](#backend-архитектура)
- [Frontend архитектура](#frontend-архитектура)
- [База данных](#база-данных)
- [API Design](#api-design)
- [Безопасность](#безопасность)
- [Развёртывание](#развёртывание)

---

## Обзор системы

Management System — корпоративная платформа для управления проектами, задачами и исследованиями. Система построена на принципах:

- **Layered Architecture** — чёткое разделение ответственности
- **API-First** — OpenAPI 3.0 документация
- **12-Factor App** — конфигурация через ENV
- **Security by Design** — JWT, CORS, Rate Limiting

### Технологический стек

| Слой | Технология | Версия |
|------|------------|--------|
| Frontend | React + TypeScript | 18.3 + 5.x |
| State/Data | React Query (TanStack) | 5.x |
| Styling | Tailwind CSS + shadcn/ui | 3.x |
| Build | Vite | 6.x |
| Backend | Django + DRF | 5.0 + 3.15 |
| Database | PostgreSQL | 16 |
| Auth | SimpleJWT | 5.x |
| API Docs | drf-spectacular | 0.27 |
| Container | Docker + Compose | 24.x |

---

## Диаграмма архитектуры

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Application                     │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │   │
│  │  │ Pages   │  │Components│  │ Hooks   │  │ API Client  │ │   │
│  │  │         │  │  (UI)   │  │         │  │             │ │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘ │   │
│  │       │           │            │               │         │   │
│  │       └───────────┴────────────┴───────────────┘         │   │
│  │                          │                                │   │
│  └──────────────────────────┼────────────────────────────────┘   │
│                             │ HTTP/REST                          │
├─────────────────────────────┼────────────────────────────────────┤
│                         BACKEND                                  │
│  ┌──────────────────────────┼────────────────────────────────┐   │
│  │                   API Layer (DRF)                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │   │
│  │  │ ViewSets │  │ Serializers│ │Permissions│ │ Throttling│  │   │
│  │  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬─────┘  │   │
│  │        │             │             │             │         │   │
│  │        └─────────────┴─────────────┴─────────────┘         │   │
│  │                          │                                  │   │
│  └──────────────────────────┼──────────────────────────────────┘   │
│  ┌──────────────────────────┼──────────────────────────────────┐   │
│  │                   Service Layer                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │ TaskService  │  │ProjectService│  │ ResearchService  │   │   │
│  │  │              │  │              │  │                  │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │   │
│  │         │                 │                    │             │   │
│  │         └─────────────────┴────────────────────┘             │   │
│  │                          │                                    │   │
│  └──────────────────────────┼────────────────────────────────────┘   │
│  ┌──────────────────────────┼────────────────────────────────────┐   │
│  │                   Data Layer (ORM)                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │   │
│  │  │  Models  │  │ Managers │  │QuerySets │  │ Repositories* │ │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘ │   │
│  │       └─────────────┴─────────────┴────────────────┘         │   │
│  └──────────────────────────┼────────────────────────────────────┘   │
│                             │                                        │
├─────────────────────────────┼────────────────────────────────────────┤
│                         DATABASE                                     │
│  ┌──────────────────────────┴────────────────────────────────────┐   │
│  │                      PostgreSQL 16                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │   │
│  │  │accounts │  │projects │  │ tasks   │  │research │          │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Слои приложения

### 1. Presentation Layer (Frontend)

**Ответственность:** UI/UX, пользовательское взаимодействие

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── ui/             # Базовые UI элементы (Button, Card, etc.)
│   ├── layout/         # Layout компоненты (Sidebar, Header)
│   └── pages/          # Page-level компоненты
├── hooks/              # Custom React hooks
│   ├── useTasks.ts     # Логика работы с задачами
│   ├── useProjects.ts  # Логика работы с проектами
│   └── useAuth.ts      # Аутентификация
├── api/                # API клиент
│   └── client.ts       # Axios instance + interceptors
├── contexts/           # React Context
│   └── AuthContext.tsx # Глобальное состояние авторизации
└── types/              # TypeScript определения
```

### 2. API Layer (Django REST Framework)

**Ответственность:** HTTP endpoints, сериализация, валидация

```
apps/
├── accounts/views.py   # Auth endpoints
├── projects/views.py   # Project CRUD
├── tasks/views.py      # Task CRUD + workflow
└── research/views.py   # Research CRUD
```

**Пример ViewSet:**
```python
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TaskService.get_tasks_for_user(self.request.user)
```

### 3. Service Layer

**Ответственность:** Бизнес-логика, оркестрация

```
services/
├── task_service.py     # Логика задач (workflow, статусы)
├── project_service.py  # Логика проектов
└── notification_service.py  # Уведомления
```

**Принципы:**
- Сервисы — stateless классы с @staticmethod/@classmethod методами
- Сервисы не знают о HTTP (никаких request/response)
- Вся бизнес-валидация в сервисах

**Пример:**
```python
class TaskService:
    @staticmethod
    def change_status(task: Task, new_status: str, user: User) -> Task:
        """Изменить статус с проверкой прав и workflow."""
        if not TaskService._can_transition(task, new_status):
            raise ValidationError("Invalid status transition")
        
        task.status = new_status
        task.save()
        
        NotificationService.notify_status_change(task)
        return task
```

### 4. Data Layer (Django ORM)

**Ответственность:** Доступ к данным, модели

```
apps/
├── core/models.py      # BaseModel с timestamps
├── accounts/models.py  # User, Role
├── projects/models.py  # Project
├── tasks/models.py     # Task, TaskComment
└── research/models.py  # Research
```

---

## Backend архитектура

### Структура Django проекта

```
backend/
├── config/                 # Конфигурация проекта
│   ├── settings/          # Настройки по окружениям
│   │   ├── base.py       # Общие настройки
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py           # Главный роутинг
│   └── wsgi.py           # WSGI entrypoint
│
├── apps/                   # Django приложения
│   ├── accounts/          # Пользователи и роли
│   ├── projects/          # Проекты
│   ├── tasks/             # Задачи (T1/T2 типы)
│   ├── research/          # Исследования
│   ├── notifications/     # Уведомления
│   ├── analytics/         # Дашборд, метрики
│   └── core/              # Общие модели, exceptions
│
├── services/               # Бизнес-логика
│   ├── task_service.py
│   ├── project_service.py
│   └── research_service.py
│
├── tests/                  # Тесты
│   ├── conftest.py        # Pytest fixtures
│   ├── test_tasks.py
│   └── test_projects.py
│
└── scripts/                # Утилиты
    ├── entrypoint.sh      # Docker entrypoint
    └── seed_data.py       # Демо-данные
```

### Модульность приложений

Каждое Django app самодостаточно:

```
apps/tasks/
├── __init__.py
├── admin.py           # Django Admin конфигурация
├── apps.py            # AppConfig
├── models.py          # Модели данных
├── serializers.py     # DRF сериализаторы
├── views.py           # ViewSets
├── urls.py            # Роутинг приложения
├── filters.py         # django-filter
└── permissions.py     # Кастомные permissions
```

---

## Frontend архитектура

### Component Hierarchy

```
App.tsx
├── AuthContext.Provider
│   └── BrowserRouter
│       ├── Layout
│       │   ├── TopHeader
│       │   ├── Sidebar
│       │   └── Main Content
│       │       ├── Dashboard
│       │       ├── Projects
│       │       ├── Tasks
│       │       └── ...
│       └── Public Routes
│           └── Login
```

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Component                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │  useTasks() hook                                 │    │
│  │  ├── useQuery('tasks', fetchTasks)              │    │
│  │  ├── useMutation(createTask)                    │    │
│  │  └── invalidateQueries on success               │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │  apiClient.get('/tasks/')                        │    │
│  │  ├── Axios interceptor: add JWT                  │    │
│  │  ├── On 401: refresh token or logout             │    │
│  │  └── Transform response                          │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                                │
└─────────────────────────┼────────────────────────────────┘
                          │ HTTP
                          ▼
                    Django Backend
```

---

## База данных

### ER-диаграмма (упрощённая)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │   Project    │       │    Task      │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │───┐   │ id           │───┐   │ id           │
│ email        │   │   │ name         │   │   │ title        │
│ role         │   │   │ status       │   │   │ type (T1/T2) │
│ department   │   └──►│ manager_id   │   └──►│ project_id   │
│              │       │ deadline     │       │ assignee_id  │
└──────────────┘       └──────────────┘       │ status       │
                                              │ priority     │
                                              └──────────────┘

┌──────────────┐       ┌──────────────┐
│  Research    │       │ Notification │
├──────────────┤       ├──────────────┤
│ id           │       │ id           │
│ title        │       │ user_id      │
│ status       │       │ type         │
│ researcher_id│       │ message      │
│ project_id   │       │ read         │
└──────────────┘       └──────────────┘
```

### Индексы

```python
class Task(BaseModel):
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['assignee', 'status']),
            models.Index(fields=['project', 'created_at']),
        ]
```

---

## API Design

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login/` | Получить JWT токен |
| POST | `/api/v1/auth/refresh/` | Обновить токен |
| GET | `/api/v1/tasks/` | Список задач |
| POST | `/api/v1/tasks/` | Создать задачу |
| GET | `/api/v1/tasks/{id}/` | Детали задачи |
| PATCH | `/api/v1/tasks/{id}/` | Обновить задачу |
| POST | `/api/v1/tasks/{id}/submit/` | Отправить на ревью |
| POST | `/api/v1/tasks/{id}/approve/` | Одобрить |

### Versioning

API версионируется через URL prefix:
- `/api/v1/` — текущая стабильная версия
- `/api/v2/` — будущая версия (при breaking changes)

### Response Format

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

### Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status transition",
    "details": { ... }
  }
}
```

---

## Безопасность

### Authentication

- **JWT (JSON Web Tokens)** через SimpleJWT
- Access Token: 15 минут
- Refresh Token: 7 дней
- Токены в HttpOnly cookies (опционально)

### Authorization

```python
class IsProjectManager(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.manager == request.user
```

### Security Headers

```python
# settings/production.py
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
```

---

## Развёртывание

### Docker Compose

```bash
# Локальная разработка
make up

# Production (с Gunicorn + Nginx)
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Все секреты через `.env`:
- `SECRET_KEY` — Django secret
- `DATABASE_URL` — PostgreSQL connection
- `JWT_SECRET_KEY` — Ключ подписи токенов

### CI/CD Pipeline

```
GitHub Push → GitHub Actions → Build → Test → Deploy
     │              │           │        │        │
     └──────────────┴───────────┴────────┴────────┘
```

---

## Масштабирование (P2)

### Горизонтальное

```
                    ┌─────────────┐
                    │   Nginx     │
                    │ Load Balancer│
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │ Django  │       │ Django  │       │ Django  │
    │ Worker 1│       │ Worker 2│       │ Worker 3│
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │   Primary   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │   Replica   │
                    └─────────────┘
```

### Кэширование (P1)

```python
# Redis для сессий и кэша
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://redis:6379/0',
    }
}
```

---

## Контакты

- **Архитектор:** TBD
- **Tech Lead:** TBD
- **Repository:** https://github.com/Faxriddin1/Uiuxdesignformanagementsystem
