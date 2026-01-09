# Architectural Decision Records (ADR)

> Журнал архитектурных решений проекта Management System

---

## Формат записи

Каждое решение документируется в формате:

```
## ADR-XXX: Название решения

**Дата:** YYYY-MM-DD
**Статус:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Контекст:** Описание проблемы
**Решение:** Что решили делать
**Последствия:** Плюсы и минусы
```

---

## ADR-001: Выбор Django + DRF для Backend

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

Необходимо выбрать backend framework для корпоративной системы управления проектами. Требования:
- Быстрая разработка MVP
- Надёжная ORM для сложных связей
- Встроенная админка
- Богатая экосистема

### Рассмотренные альтернативы

| Framework | Плюсы | Минусы |
|-----------|-------|--------|
| Django + DRF | Зрелая экосистема, ORM, Admin | Монолитная архитектура |
| FastAPI | Async, автодокументация | Молодая экосистема |
| Node.js + Express | JavaScript fullstack | Нет встроенной ORM |
| Go + Gin | Производительность | Дольше разработка |

### Решение

Выбрать **Django 5.0 + Django REST Framework 3.15** потому что:
1. Зрелая ORM для сложных связей (проекты → задачи → комментарии)
2. Встроенная админка для быстрого управления данными
3. drf-spectacular для OpenAPI документации
4. Большое сообщество и готовые решения

### Последствия

✅ **Плюсы:**
- Быстрая разработка CRUD операций
- Автоматическая документация API
- Простое добавление новых моделей
- Миграции базы данных из коробки

⚠️ **Минусы:**
- Синхронная модель (для async нужен ASGI)
- Более медленный чем FastAPI/Go для высоконагруженных API

---

## ADR-002: Service Layer для бизнес-логики

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

В классическом Django-приложении бизнес-логика часто размазывается между:
- Views (обработка HTTP)
- Models (fat models)
- Serializers (валидация)

Это усложняет тестирование и поддержку.

### Решение

Ввести отдельный **Service Layer** (`services/`) со следующими правилами:

1. Сервисы — Python классы с `@staticmethod` методами
2. Сервисы не знают о HTTP (никаких request/response)
3. Views вызывают сервисы, сервисы работают с моделями
4. Вся бизнес-валидация в сервисах

```python
# services/task_service.py
class TaskService:
    @staticmethod
    def submit_for_review(task: Task, user: User) -> Task:
        """Отправить задачу на ревью."""
        if task.status != TaskStatus.DRAFT:
            raise BusinessLogicError("Only draft tasks can be submitted")
        
        task.status = TaskStatus.PENDING_REVIEW
        task.submitted_at = timezone.now()
        task.save()
        
        NotificationService.notify_reviewers(task)
        return task

# views.py — только HTTP
class TaskViewSet(ModelViewSet):
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        task = self.get_object()
        task = TaskService.submit_for_review(task, request.user)
        return Response(TaskSerializer(task).data)
```

### Последствия

✅ **Плюсы:**
- Бизнес-логика легко тестируется без HTTP
- Views становятся тонкими (thin controllers)
- Логика переиспользуется (API, Admin, management commands)

⚠️ **Минусы:**
- Дополнительный слой абстракции
- Нужна дисциплина команды

---

## ADR-003: JWT Authentication вместо Session

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

Выбор механизма аутентификации для SPA (React) + REST API.

### Рассмотренные альтернативы

| Метод | Плюсы | Минусы |
|-------|-------|--------|
| Session + Cookie | Простота, Django из коробки | Stateful, проблемы с CORS |
| JWT в localStorage | Stateless | XSS уязвимость |
| JWT в HttpOnly Cookie | Stateless + безопасность | Сложнее настройка |
| OAuth2 | Стандарт | Overkill для внутреннего приложения |

### Решение

**SimpleJWT** с хранением токенов на клиенте:
- Access Token: 15 минут (короткий срок жизни)
- Refresh Token: 7 дней (в HttpOnly cookie или secure storage)

```python
# settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

### Последствия

✅ **Плюсы:**
- Stateless — легко масштабировать backend
- Стандартный формат, поддержка во всех языках
- Автоматическая документация в Swagger

⚠️ **Минусы:**
- Нужна логика refresh на клиенте
- Нельзя мгновенно отозвать токен (только blacklist)

---

## ADR-004: PostgreSQL как основная СУБД

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

Выбор СУБД для хранения данных приложения.

### Решение

**PostgreSQL 16** потому что:
1. Полная поддержка в Django ORM
2. JSONB для гибких полей (например, metadata)
3. Полнотекстовый поиск
4. Надёжность и производительность

### Альтернативы

- MySQL — менее строгий, проблемы с encoding
- SQLite — не для production
- MongoDB — не нужен для структурированных данных

### Последствия

✅ Надёжное хранение, индексы, транзакции  
⚠️ Требует администрирования (бэкапы, вакуум)

---

## ADR-005: Использование Docker для разработки и деплоя

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

Нужна воспроизводимая среда разработки и простой деплой.

### Решение

**Docker + Docker Compose** для:
- Локальной разработки (`docker-compose.yml`)
- Production (`docker-compose.prod.yml`)

```yaml
services:
  db:
    image: postgres:16-alpine
  web:
    build: .
    depends_on:
      db:
        condition: service_healthy
```

### Последствия

✅ **Плюсы:**
- "Works on my machine" → работает везде
- Изолированные зависимости
- Простой onboarding новых разработчиков

⚠️ **Минусы:**
- Overhead на Windows/macOS
- Требует знания Docker

---

## ADR-006: React + TypeScript для Frontend

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

Выбор frontend framework для SPA приложения.

### Рассмотренные альтернативы

| Framework | Плюсы | Минусы |
|-----------|-------|--------|
| React | Экосистема, гибкость | Нет conventions |
| Vue 3 | Простота, хорошая документация | Меньше экосистема |
| Angular | Полноценный фреймворк | Сложный, тяжёлый |
| Svelte | Производительность | Молодая экосистема |

### Решение

**React 18 + TypeScript + Vite**:
- React — индустриальный стандарт
- TypeScript — типизация, меньше багов
- Vite — быстрая сборка

### Последствия

✅ Большой выбор библиотек, найм разработчиков  
⚠️ Нужны соглашения по структуре (решено: atomic design pattern)

---

## ADR-007: shadcn/ui для UI компонентов

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

Выбор UI библиотеки для React компонентов.

### Рассмотренные альтернативы

| Библиотека | Плюсы | Минусы |
|------------|-------|--------|
| Material UI | Полный набор | Тяжёлый, специфичный стиль |
| Ant Design | Enterprise-ready | Китайская локализация |
| Chakra UI | Хорошая доступность | Ограниченная кастомизация |
| shadcn/ui | Копируется в проект, Tailwind | Нужно настраивать |

### Решение

**shadcn/ui + Tailwind CSS** потому что:
1. Компоненты копируются в проект → полный контроль
2. Построен на Radix UI → доступность из коробки
3. Tailwind → консистентный дизайн

### Последствия

✅ Полный контроль над стилями  
⚠️ Нужно поддерживать компоненты самостоятельно

---

## ADR-008: API Versioning через URL prefix

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

Стратегия версионирования REST API.

### Рассмотренные альтернативы

| Метод | Пример | Плюсы | Минусы |
|-------|--------|-------|--------|
| URL prefix | `/api/v1/` | Явный, простой | URL меняется |
| Header | `Accept: application/vnd.api+json;v=1` | Чистые URL | Сложнее тестировать |
| Query param | `/api?version=1` | Простой | Кэширование |

### Решение

**URL prefix** `/api/v1/`:

```python
urlpatterns = [
    path('api/v1/', include('apps.tasks.urls')),
    path('api/v2/', include('apps.tasks.urls_v2')),  # будущее
]
```

### Последствия

✅ Явное версионирование, простое документирование  
⚠️ При breaking changes нужен новый endpoint

---

## ADR-009: Unified Error Response Format

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

Необходим единый формат ошибок для frontend.

### Решение

Стандартизированный JSON формат:

```python
# apps/core/exceptions.py
class ErrorCode:
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR"

# Response format
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Human readable message",
        "details": {
            "field": ["error1", "error2"]
        }
    }
}
```

### Последствия

✅ Фронтенд легко обрабатывает ошибки  
✅ Централизованная обработка в exception handler

---

## ADR-010: Monorepo vs Multi-repo

**Дата:** 2025-01-15  
**Статус:** Accepted

### Контекст

Выбор стратегии репозитория.

### Решение

**Monorepo** с frontend и backend в одном репозитории:

```
/
├── backend/     # Django
├── src/         # React
├── docs/        # Документация
└── Makefile     # Общие команды
```

### Обоснование

- Единая история изменений
- Атомарные коммиты (backend + frontend вместе)
- Проще CI/CD
- Для небольшой команды (2-5 человек) — оптимально

### Последствия

✅ Простота разработки и деплоя  
⚠️ При росте команды может потребоваться разделение

---

## История изменений

| Дата | ADR | Изменение |
|------|-----|-----------|
| 2025-01-15 | ADR-001 | Создан |
| 2025-01-15 | ADR-002 | Создан |
| 2025-01-15 | ADR-003 | Создан |
| 2025-01-15 | ADR-004 | Создан |
| 2025-01-15 | ADR-005 | Создан |
| 2025-01-15 | ADR-006 | Создан |
| 2025-01-15 | ADR-007 | Создан |
| 2025-01-15 | ADR-008 | Создан |
| 2025-01-15 | ADR-009 | Создан |
| 2025-01-15 | ADR-010 | Создан |
