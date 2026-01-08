# 📡 API Documentation

**Проект:** Management System REST API  
**Версия:** v1  
**Base URL:** `http://localhost:8000/api/v1/`  
**Дата:** 2026-01-08

---

## 📋 Содержание

- [Обзор](#обзор)
- [Аутентификация](#аутентификация)
- [Общие концепции](#общие-концепции)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Users](#users)
  - [Tasks](#tasks)
  - [Projects](#projects)
  - [Research](#research)
  - [Notifications](#notifications)
  - [Analytics](#analytics)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Примеры использования](#примеры-использования)

---

## 🎯 Обзор

Management System API - это RESTful API для управления задачами, проектами и исследованиями в корпоративной среде.

### Основные характеристики

- **Протокол:** HTTP/HTTPS
- **Формат данных:** JSON
- **Аутентификация:** JWT (Bearer token)
- **Версионирование:** URL-based (`/api/v1/`)
- **Документация:** Swagger UI доступен по `/api/docs/`

### Live Documentation

🔗 **Swagger UI:** http://localhost:8000/api/docs/  
🔗 **ReDoc:** http://localhost:8000/api/redoc/  
🔗 **OpenAPI Schema:** http://localhost:8000/api/schema/

---

## 🔐 Аутентификация

API использует **JWT (JSON Web Tokens)** для аутентификации.

### Получение токенов

```bash
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

### Использование токена

Добавьте `Authorization` header в каждый запрос:

```bash
GET /api/v1/tasks/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Обновление токена

Access token действителен 15 минут. Для обновления используйте refresh token:

```bash
POST /api/v1/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Выход из системы

```bash
POST /api/v1/auth/logout/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🔄 Общие концепции

### Пагинация

Все list endpoints поддерживают пагинацию:

```json
{
  "count": 142,
  "next": "http://localhost:8000/api/v1/tasks/?page=2",
  "previous": null,
  "results": [...]
}
```

**Query параметры:**
- `page` - номер страницы (default: 1)
- `page_size` - количество элементов на странице (default: 30, max: 100)

### Фильтрация

Используйте query параметры для фильтрации:

```bash
GET /api/v1/tasks/?status=in_progress&priority=high&assignee=<user_id>
```

### Сортировка

Используйте параметр `ordering`:

```bash
GET /api/v1/tasks/?ordering=-created_at
# - (минус) для сортировки по убыванию
# без минуса - по возрастанию
```

### Поиск

Используйте параметр `search`:

```bash
GET /api/v1/tasks/?search=CRM
# Поиск по title и description
```

---

## 🔌 Endpoints

### Auth

#### POST /auth/login/
Аутентификация пользователя.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "access": "string",
  "refresh": "string",
  "user": {
    "id": "uuid",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "role": "employee | division_head | department_head | management_head",
    "division": "rnd | design | marketing | ...",
    "avatar": "string (url) or null"
  }
}
```

#### POST /auth/token/refresh/
Обновить access token.

**Request:**
```json
{
  "refresh": "string"
}
```

**Response 200:**
```json
{
  "access": "string"
}
```

#### POST /auth/logout/
Выйти из системы (blacklist refresh token).

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "refresh": "string"
}
```

**Response 204:** No content

---

### Users

#### GET /users/me/
Получить информацию о текущем пользователе.

**Headers:** `Authorization: Bearer <access_token>`

**Response 200:**
```json
{
  "id": "uuid",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "string",
  "division": "string",
  "avatar": "string or null",
  "created_at": "datetime",
  "last_login": "datetime"
}
```

#### PATCH /users/me/
Обновить профиль текущего пользователя.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "avatar": "file (optional)"
}
```

**Response 200:** Обновлённый объект User

#### GET /users/
Список пользователей (только для managers).

**Query params:**
- `role` - фильтр по роли
- `division` - фильтр по отделу
- `search` - поиск по имени/email

**Response 200:**
```json
{
  "count": 100,
  "results": [
    {
      "id": "uuid",
      "full_name": "string",
      "email": "string",
      "role": "string",
      "division": "string"
    }
  ]
}
```

---

### Tasks

#### GET /tasks/
Список задач с фильтрацией.

**Query params:**
- `status` - статус (new, in_progress, division_review, management_review, accepted, rejected)
- `priority` - приоритет (low, medium, high, urgent)
- `task_type` - тип (T1, T2)
- `division` - отдел
- `assignee` - UUID исполнителя
- `is_overdue` - только просроченные (true/false)
- `search` - поиск по title/description
- `ordering` - сортировка (deadline, -deadline, created_at, priority)

**Response 200:**
```json
{
  "count": 42,
  "results": [
    {
      "id": "uuid",
      "title": "string",
      "status": "string",
      "status_display": "string",
      "priority": "string",
      "task_type": "T1 | T2",
      "deadline": "date",
      "is_overdue": false,
      "assignee": {
        "id": "uuid",
        "full_name": "string"
      },
      "created_at": "datetime"
    }
  ]
}
```

#### POST /tasks/
Создать задачу.

**Request:**
```json
{
  "title": "string (max 255)",
  "description": "string",
  "task_type": "T1 | T2",
  "priority": "low | medium | high | urgent",
  "division": "rnd | design | marketing | ...",
  "assignee_id": "uuid",
  "co_assignee_ids": ["uuid", ...] (optional),
  "deadline": "date (YYYY-MM-DD)",
  "project_id": "uuid (optional)"
}
```

**Response 201:** Созданная задача

#### GET /tasks/{id}/
Детали задачи.

**Response 200:**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "task_type": "T1 | T2",
  "deadline": "date",
  "is_overdue": false,
  "assignee": {
    "id": "uuid",
    "full_name": "string",
    "email": "string",
    "avatar": "string or null"
  },
  "co_assignees": [...],
  "comments": [
    {
      "id": "uuid",
      "content": "string",
      "author": {...},
      "created_at": "datetime"
    }
  ],
  "attachments": [
    {
      "id": "uuid",
      "file": "url",
      "filename": "string",
      "uploaded_by": {...},
      "uploaded_at": "datetime"
    }
  ],
  "result_versions": [
    {
      "version_number": 1,
      "content": "string",
      "created_at": "datetime",
      "created_by": {...}
    }
  ],
  "created_by": {...},
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### PATCH /tasks/{id}/
Обновить задачу (только определённые поля).

**Request:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "priority": "string (optional)",
  "deadline": "date (optional)"
}
```

**Response 200:** Обновлённая задача

#### DELETE /tasks/{id}/
Удалить задачу (soft delete).

**Response 204:** No content

---

### Task Workflow Actions

#### POST /tasks/{id}/take/
Взять задачу в работу (только assignee).

**Response 200:** Обновлённая задача (status → IN_PROGRESS)

#### POST /tasks/{id}/submit/
Отправить задачу на проверку.

**Request:**
```json
{
  "result_description": "string"
}
```

**Response 200:** Обновлённая задача (status → DIVISION_REVIEW или MANAGEMENT_REVIEW)

#### POST /tasks/{id}/approve/
Одобрить задачу (только reviewers).

**Response 200:** Обновлённая задача

#### POST /tasks/{id}/reject/
Вернуть задачу на доработку.

**Request:**
```json
{
  "reason": "string"
}
```

**Response 200:** Обновлённая задача (status → REWORK)

#### POST /tasks/{id}/withdraw/
Отозвать задачу с проверки (только assignee).

**Request:**
```json
{
  "reason": "string"
}
```

**Response 200:** Обновлённая задача (status → IN_PROGRESS)

---

### Projects

#### GET /projects/
Список проектов.

**Query params:**
- `status` - статус (draft, planning, in_progress, completed)
- `priority` - приоритет
- `division` - отдел
- `manager` - UUID менеджера проекта

**Response 200:**
```json
{
  "count": 15,
  "results": [
    {
      "id": "uuid",
      "title": "string",
      "code": "string",
      "status": "string",
      "priority": "string",
      "progress": 45.5,
      "start_date": "date",
      "end_date": "date",
      "manager": {...}
    }
  ]
}
```

#### POST /projects/
Создать проект.

**Request:**
```json
{
  "title": "string",
  "code": "string (unique)",
  "description": "string",
  "priority": "low | medium | high | urgent",
  "division": "string",
  "start_date": "date",
  "end_date": "date",
  "manager_id": "uuid (optional)"
}
```

**Response 201:** Созданный проект

#### GET /projects/{id}/
Детали проекта с milestones и задачами.

**Response 200:**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "string",
  "progress": 45.5,
  "milestones": [
    {
      "id": "uuid",
      "title": "string",
      "due_date": "date",
      "is_completed": false
    }
  ],
  "tasks": [...],
  "team": [...],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### POST /projects/{id}/transition/
Изменить статус проекта.

**Request:**
```json
{
  "status": "draft | planning | in_progress | completed"
}
```

**Response 200:** Обновлённый проект

#### POST /projects/{id}/milestones/
Добавить milestone к проекту.

**Request:**
```json
{
  "title": "string",
  "due_date": "date"
}
```

**Response 201:** Созданный milestone

---

### Research

#### GET /research/
Список исследований.

**Query params:**
- `research_type` - тип (technical, market, competitive, user, feasibility)
- `status` - статус
- `access_level` - уровень доступа (public, division, restricted, private)
- `author` - UUID автора

**Response 200:** Список исследований

#### POST /research/
Создать исследование.

**Request:**
```json
{
  "title": "string",
  "description": "string",
  "research_type": "technical | market | competitive | user | feasibility",
  "access_level": "public | division | restricted | private",
  "tags": ["string", ...]
}
```

**Response 201:** Созданное исследование

#### GET /research/{id}/
Детали исследования.

**Response 200:** Полная информация с attachments

---

### Notifications

#### GET /notifications/
Уведомления текущего пользователя.

**Query params:**
- `is_read` - фильтр по прочитанным (true/false)
- `notification_type` - тип уведомления

**Response 200:**
```json
{
  "count": 25,
  "unread_count": 8,
  "results": [
    {
      "id": "uuid",
      "title": "string",
      "message": "string",
      "notification_type": "string",
      "is_read": false,
      "related_object_type": "task | project | research",
      "related_object_id": "uuid",
      "created_at": "datetime"
    }
  ]
}
```

#### POST /notifications/{id}/mark_read/
Отметить уведомление как прочитанное.

**Response 200:** Обновлённое уведомление

#### POST /notifications/mark_all_read/
Отметить все уведомления как прочитанные.

**Response 200:**
```json
{
  "marked_count": 8
}
```

---

### Analytics

#### GET /analytics/summary/
Общая статистика (дашборд).

**Response 200:**
```json
{
  "tasks": {
    "total": 142,
    "in_progress": 35,
    "pending_review": 12,
    "completed_this_month": 48,
    "overdue": 3
  },
  "projects": {
    "total": 15,
    "active": 8,
    "completed": 7
  },
  "research": {
    "total": 28,
    "in_progress": 5,
    "completed": 23
  }
}
```

#### GET /analytics/tasks-by-status/
Распределение задач по статусам (для pie chart).

**Response 200:**
```json
{
  "data": [
    {"status": "new", "count": 10},
    {"status": "in_progress", "count": 35},
    {"status": "review", "count": 12},
    {"status": "completed", "count": 85}
  ]
}
```

#### GET /analytics/overdue/
Просроченные задачи с группировкой.

**Response 200:**
```json
{
  "total_overdue": 15,
  "by_assignee": [
    {
      "assignee": {...},
      "overdue_count": 3,
      "tasks": [...]
    }
  ]
}
```

#### GET /analytics/velocity/
Скорость выполнения задач по периодам.

**Query params:**
- `period` - week | month | quarter

**Response 200:**
```json
{
  "data": [
    {"period": "2026-W01", "completed": 12},
    {"period": "2026-W02", "completed": 15},
    {"period": "2026-W03", "completed": 18}
  ]
}
```

#### GET /analytics/workload/
Загруженность сотрудников.

**Response 200:**
```json
{
  "data": [
    {
      "assignee": {...},
      "active_tasks": 5,
      "overdue_tasks": 1,
      "avg_completion_days": 3.5
    }
  ]
}
```

---

## ❌ Error Handling

### Стандартный формат ошибок

Все ошибки возвращаются в едином формате:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": {
      "title": ["This field is required."],
      "deadline": ["Date must be in the future."]
    }
  }
}
```

### HTTP Status Codes

| Code | Описание | Пример |
|------|----------|--------|
| `200` | OK | Успешный GET/PATCH/PUT |
| `201` | Created | Успешный POST (создание) |
| `204` | No Content | Успешный DELETE |
| `400` | Bad Request | Невалидные данные |
| `401` | Unauthorized | Требуется авторизация |
| `403` | Forbidden | Нет прав доступа |
| `404` | Not Found | Ресурс не найден |
| `409` | Conflict | Конфликт (неверный переход статуса) |
| `429` | Too Many Requests | Rate limit превышен |
| `500` | Internal Server Error | Ошибка сервера |

### Коды ошибок приложения

| Code | Описание |
|------|----------|
| `validation_error` | Ошибка валидации входных данных |
| `authentication_failed` | Неверный email/пароль |
| `token_expired` | JWT токен истёк |
| `permission_denied` | Недостаточно прав |
| `not_found` | Ресурс не найден |
| `workflow_error` | Неверный переход статуса |
| `business_logic_error` | Нарушение бизнес-правил |

---

## ⏱️ Rate Limiting

**Лимиты:**
- **Anonymous:** 100 requests / minute
- **Authenticated:** 1000 requests / minute

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1609459200
```

**При превышении лимита:**
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Try again in 60 seconds.",
    "retry_after": 60
  }
}
```

---

## 💻 Примеры использования

### curl

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"employee1@example.com","password":"user123"}'

# Get tasks
curl -X GET http://localhost:8000/api/v1/tasks/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create task
curl -X POST http://localhost:8000/api/v1/tasks/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Подготовить отчёт",
    "description": "Квартальный отчёт",
    "task_type": "T2",
    "priority": "high",
    "division": "rnd",
    "assignee_id": "550e8400-e29b-41d4-a716-446655440000",
    "deadline": "2026-01-15"
  }'

# Submit task
curl -X POST http://localhost:8000/api/v1/tasks/{task_id}/submit/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"result_description": "Работа завершена"}'
```

### JavaScript (axios)

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления JWT
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email, password) => {
  const { data } = await apiClient.post('/auth/login/', { email, password });
  localStorage.setItem('accessToken', data.access);
  localStorage.setItem('refreshToken', data.refresh);
  return data.user;
};

// Get tasks
const getTasks = async (filters = {}) => {
  const { data } = await apiClient.get('/tasks/', { params: filters });
  return data.results;
};

// Create task
const createTask = async (taskData) => {
  const { data } = await apiClient.post('/tasks/', taskData);
  return data;
};

// Submit task
const submitTask = async (taskId, resultDescription) => {
  const { data } = await apiClient.post(`/tasks/${taskId}/submit/`, {
    result_description: resultDescription,
  });
  return data;
};
```

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Login
def login(email, password):
    response = requests.post(
        f"{BASE_URL}/auth/login/",
        json={"email": email, "password": password}
    )
    data = response.json()
    return data["access"], data["refresh"]

# Get tasks
def get_tasks(access_token, filters=None):
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(
        f"{BASE_URL}/tasks/",
        headers=headers,
        params=filters or {}
    )
    return response.json()["results"]

# Create task
def create_task(access_token, task_data):
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.post(
        f"{BASE_URL}/tasks/",
        headers=headers,
        json=task_data
    )
    return response.json()

# Submit task
def submit_task(access_token, task_id, result_description):
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.post(
        f"{BASE_URL}/tasks/{task_id}/submit/",
        headers=headers,
        json={"result_description": result_description}
    )
    return response.json()
```

---

## 🔗 Полезные ссылки

- [Swagger UI (интерактивная документация)](http://localhost:8000/api/docs/)
- [ReDoc (альтернативная документация)](http://localhost:8000/api/redoc/)
- [OpenAPI Schema (JSON)](http://localhost:8000/api/schema/)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура системы
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Как добавлять новые endpoints

---

**Вопросы?** Обратитесь к команде backend или создайте issue на GitHub.
