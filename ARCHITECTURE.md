# Architecture Documentation

## Обзор системы

Management System — это веб-приложение для управления проектами, задачами и исследованиями, построенное на современном технологическом стеке с чётким разделением на frontend и backend.

### Технологический стек

**Backend:**
- Python 3.12
- Django 5.0 + Django REST Framework
- PostgreSQL 16
- JWT Authentication (Simple JWT)

**Frontend:**
- React 18
- TypeScript
- Vite
- Radix UI + Tailwind CSS

---

## Архитектурные слои

Система построена по принципу многослойной архитектуры (Layered Architecture):

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│              (Controllers / API Views / Routes)              │
│  - Валидация входных данных                                 │
│  - Сериализация/десериализация                              │
│  - HTTP handling                                            │
│  apps/*/api/                                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│                   (Service Layer Pattern)                    │
│  - Бизнес-логика                                            │
│  - Координация операций                                     │
│  - Транзакционность                                         │
│  services/                                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                         │
│                  (Models / Repositories)                     │
│  - CRUD операции                                            │
│  - Запросы к БД (ORM)                                       │
│  - Бизнес-правила моделей                                   │
│  apps/*/models.py                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                         │
│                       (PostgreSQL 16)                        │
│  - Хранение данных                                          │
│  - Индексы, constraints                                     │
│  - Транзакции                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Архитектурные принципы

### 1. Thin Controllers (Тонкие контроллеры)
API Views содержат только логику обработки HTTP-запросов. Вся бизнес-логика вынесена в Service Layer.

**Плохо:**
```python
class TaskViewSet(viewsets.ModelViewSet):
    def create(self, request):
        # Куча бизнес-логики здесь
        task = Task.objects.create(...)
        # Логика уведомлений, валидация и т.д.
```

**Хорошо:**
```python
class TaskViewSet(viewsets.ModelViewSet):
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = task_service.create_task(
            user=request.user,
            data=serializer.validated_data
        )
        return Response(TaskSerializer(task).data)
```

### 2. Single Responsibility Principle (SRP)
Каждый класс/модуль отвечает за одну область ответственности:
- Models — структура данных и ORM
- Services — бизнес-логика
- Serializers — валидация и трансформация данных
- Views — HTTP handling

### 3. Dependency Inversion Principle (DIP)
Высокоуровневые модули не зависят от низкоуровневых. Оба зависят от абстракций (интерфейсов).

```python
# Services зависят от абстракций (моделей), а не от конкретных реализаций
class TaskService:
    def create_task(self, user, data):
        # Работа с моделью через ORM API
        task = Task.objects.create(...)
```

### 4. Service Layer Pattern
Вся бизнес-логика находится в `services/`:
- Координация операций между моделями
- Транзакционная логика
- Сложные бизнес-правила
- Отправка уведомлений

---

## Структура Django Apps

| App | Ответственность | Основные модели |
|-----|----------------|----------------|
| **accounts** | Управление пользователями и аутентификация | User, UserProfile |
| **core** | Общие компоненты (mixins, базовые модели) | BaseModel, SoftDeleteMixin |
| **projects** | Управление проектами | Project, ProjectMember, Milestone |
| **tasks** | Управление задачами | Task, TaskComment, TaskAttachment |
| **research** | Исследования и документация | Research, ResearchNote |
| **notifications** | Уведомления пользователей | Notification |
| **analytics** | Аналитика и отчёты | Analytics, Report |

### Зависимости между приложениями

```
accounts (базовый)
    ↓
core (общие компоненты)
    ↓
projects ← tasks
    ↓         ↓
research  notifications
    ↓
analytics
```

---

## Workflow задач

Задачи проходят через следующие статусы:

```
                      ┌──────────┐
                      │  DRAFT   │
                      └────┬─────┘
                           │
                      ┌────▼─────┐
           ┌─────────►│   TODO   │◄──────────┐
           │          └────┬─────┘           │
           │               │                 │
           │          ┌────▼──────┐          │
           │          │IN_PROGRESS│          │
           │          └────┬──────┘          │
           │               │                 │
    ┌──────┴─────┐    ┌───▼──────┐    ┌─────┴──────┐
    │  BLOCKED   │    │IN_REVIEW │    │  ON_HOLD   │
    └──────┬─────┘    └───┬──────┘    └─────┬──────┘
           │               │                 │
           └───────┐  ┌────▼──────┐   ┌─────┘
                   └─►│   DONE    │◄──┘
                      └────┬──────┘
                           │
                      ┌────▼──────┐
                      │ ARCHIVED  │
                      └───────────┘
```

### Переходы статусов

| Из | В | Условие |
|----|---|---------|
| DRAFT | TODO | Задача заполнена и готова к работе |
| TODO | IN_PROGRESS | Исполнитель начал работу |
| IN_PROGRESS | IN_REVIEW | Работа завершена, ждёт проверки |
| IN_REVIEW | DONE | Проверка пройдена |
| IN_REVIEW | TODO | Требуются исправления |
| IN_PROGRESS | BLOCKED | Есть блокирующие зависимости |
| BLOCKED | IN_PROGRESS | Блокеры устранены |
| * | ON_HOLD | Работа приостановлена |
| ON_HOLD | TODO | Работа возобновлена |
| DONE | ARCHIVED | Архивирование старых задач |

---

## Маршруты приёмки работ

### T1 (Track 1) — Основной маршрут
Стандартная приёмка для большинства задач.

```
IN_PROGRESS → IN_REVIEW → DONE
     ↑             ↓
     └─────────────┘
     (если нужны исправления)
```

**Критерии:**
- Код написан
- Тесты проходят
- Code review выполнен
- Документация обновлена

### T2 (Track 2) — Быстрый маршрут
Для простых задач или hot-fixes.

```
IN_PROGRESS → DONE
```

**Критерии:**
- Задача простая (менее 1 часа)
- Не требует code review
- Не затрагивает критичные компоненты

---

## Структура Frontend

```
src/
├── components/         # React компоненты
│   ├── ui/            # Базовые UI компоненты (Radix UI)
│   └── features/      # Компоненты фич (Tasks, Projects)
├── pages/             # Страницы приложения
├── hooks/             # Custom React hooks
├── services/          # API клиенты и сервисы
├── store/             # State management (если используется)
├── utils/             # Утилиты и хелперы
├── types/             # TypeScript типы
└── styles/            # Глобальные стили
```

### Принципы Frontend
- **Component-driven development** — разработка через компоненты
- **Atomic design** — базовые компоненты → составные → страницы
- **Type safety** — строгая типизация через TypeScript
- **Composition over inheritance** — композиция вместо наследования

---

## API Design

### RESTful принципы
- Используем стандартные HTTP методы (GET, POST, PUT, PATCH, DELETE)
- Ресурсы именуются существительными во множественном числе
- Вложенные ресурсы для связей: `/projects/1/tasks/`

### Версионирование
API версионируется через URL: `/api/v1/`

### Структура ответа

**Success (200, 201):**
```json
{
  "id": 1,
  "title": "Task title",
  "status": "in_progress"
}
```

**Error (400, 404, etc.):**
```json
{
  "error": "Error message",
  "details": {
    "field": ["Field-specific error"]
  }
}
```

### Эндпоинты

| Resource | Method | Endpoint | Описание |
|----------|--------|----------|----------|
| Projects | GET | `/api/v1/projects/` | Список проектов |
| Projects | POST | `/api/v1/projects/` | Создать проект |
| Projects | GET | `/api/v1/projects/{id}/` | Детали проекта |
| Tasks | GET | `/api/v1/tasks/` | Список задач |
| Tasks | POST | `/api/v1/tasks/` | Создать задачу |
| Tasks | PATCH | `/api/v1/tasks/{id}/` | Обновить задачу |
| Tasks | DELETE | `/api/v1/tasks/{id}/` | Удалить задачу (soft delete) |

---

## Безопасность

### Аутентификация
- JWT токены (Access + Refresh)
- Access token lifetime: 15 минут
- Refresh token lifetime: 7 дней

### Авторизация
- Role-based access control (RBAC)
- Permissions на уровне объектов
- Owner/Member/Viewer roles

### Защита данных
- HTTPS в production
- CORS настроен только для известных origins
- SQL injection защита через ORM
- XSS защита через DRF serializers
- CSRF tokens для state-changing операций

---

## Масштабирование

### Горизонтальное масштабирование
- Stateless backend (JWT вместо сессий)
- Shared database (PostgreSQL с репликацией)
- Load balancer (nginx) перед backend

### Кэширование
- Redis для кэширования запросов
- Cache-aside pattern
- Cache invalidation при изменении данных

### База данных
- Индексы на часто запрашиваемых полях
- Query optimization через select_related/prefetch_related
- Database connection pooling

---

## Мониторинг и логирование

### Логи
- Структурированные логи (JSON format)
- Уровни: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Ротация логов

### Метрики
- Response time
- Error rate
- Database query performance

### Health checks
- `/api/v1/health/` — статус backend
- Healthcheck для всех сервисов в docker-compose

---

## Deployment

### Development
```bash
make up  # Запуск через docker-compose
```

### Production
- Docker images для backend и frontend
- PostgreSQL managed service (AWS RDS, Azure Database)
- Static files на CDN (S3 + CloudFront)
- Secrets через environment variables или secrets manager

---

## Дополнительные ресурсы

- [DECISIONS.md](./DECISIONS.md) — архитектурные решения (ADR)
- [CONTRIBUTING.md](./CONTRIBUTING.md) — руководство для разработчиков
- [Backend README](./backend/README.md) — специфичная документация backend
- [Frontend README](./src/README.md) — специфичная документация frontend
