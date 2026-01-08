# 🏗️ Architecture Documentation

**Версия:** 1.0  
**Дата:** 2026-01-08  
**Система:** Management System (Корпоративная система управления)

---

## 📋 Содержание

- [Обзор](#обзор)
- [Архитектурные принципы](#архитектурные-принципы)
- [Общая архитектура](#общая-архитектура)
- [Backend архитектура](#backend-архитектура)
- [Frontend архитектура](#frontend-архитектура)
- [Потоки данных](#потоки-данных)
- [Модель безопасности](#модель-безопасности)
- [Масштабирование](#масштабирование)

---

## 🎯 Обзор

Management System - это **трёхуровневая архитектура** (Three-tier architecture) с чётким разделением:
1. **Presentation Layer** (Frontend) - React SPA
2. **Business Logic Layer** (Backend) - Django REST API
3. **Data Layer** - PostgreSQL

### Ключевые характеристики

| Аспект | Решение |
|--------|---------|
| **Стиль** | Monolithic + Service-Oriented (в рамках монолита) |
| **Паттерн** | Layered Architecture + Domain-Driven Design (упрощённый) |
| **Коммуникация** | REST API (HTTP/JSON) |
| **Аутентификация** | JWT (Bearer tokens) |
| **База данных** | PostgreSQL (Single instance with replication support) |
| **Деплой** | Docker Compose (Dev) / Kubernetes-ready (Prod) |

---

## 🧱 Архитектурные принципы

### 1. Separation of Concerns (SoC)
Каждый слой отвечает за свою задачу:
- **Views** - HTTP запросы/ответы, валидация, разрешения
- **Services** - Бизнес-логика, workflow, оркестрация
- **Models** - Структура данных, constraints, relationships
- **Serializers** - Трансформация данных (DTO)

### 2. SOLID Principles

#### Single Responsibility Principle (SRP)
```python
# ❌ ПЛОХО: Всё в одном месте
class TaskViewSet(viewsets.ModelViewSet):
    def create(self, request):
        # Валидация
        # Бизнес-логика
        # Уведомления
        # Сохранение в БД
        pass

# ✅ ХОРОШО: Разделение ответственности
class TaskViewSet(viewsets.ModelViewSet):
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = TaskService.create_task(user=request.user, **serializer.validated_data)
        return Response(TaskSerializer(task).data)
```

#### Dependency Inversion Principle (DIP)
Services не зависят от конкретных реализаций - работают через интерфейсы (Django ORM QuerySets).

### 3. DRY (Don't Repeat Yourself)
- Общая логика в **services/**
- Переиспользуемые компоненты в **apps/core/**
- UI компоненты в **src/components/ui/**

### 4. Configuration over Code
Все настройки через **environment variables**, никаких hard-coded значений.

---

## 🏛️ Общая архитектура

```
                                    ┌─────────────────────────────────────────┐
                                    │            ИНТЕРНЕТ / VPN               │
                                    └──────────────────┬──────────────────────┘
                                                       │
                                                       ▼
                                    ┌─────────────────────────────────────────┐
                                    │         Reverse Proxy (NGINX)           │
                                    │   - SSL Termination                     │
                                    │   - Load Balancing (опционально)        │
                                    │   - Rate Limiting                       │
                                    └────────┬─────────────────┬──────────────┘
                                             │                 │
                    ┌────────────────────────┘                 └───────────────────────────┐
                    │                                                                      │
                    ▼                                                                      ▼
┌──────────────────────────────────────────────┐                 ┌──────────────────────────────────────┐
│           FRONTEND (React SPA)               │                 │         BACKEND (Django)             │
│  ┌────────────────────────────────────────┐  │                 │  ┌────────────────────────────────┐  │
│  │  Presentation Components               │  │                 │  │      REST API Layer            │  │
│  │  ┌──────────┐  ┌──────────┐           │  │                 │  │  ┌──────────────────────────┐  │  │
│  │  │Dashboard │  │  Tasks   │  ...      │  │                 │  │  │ ViewSets & APIViews      │  │  │
│  │  └──────────┘  └──────────┘           │  │                 │  │  │ - TaskViewSet            │  │  │
│  │                                         │  │   HTTP/JSON     │  │  │ - ProjectViewSet         │  │  │
│  └─────────────────┬───────────────────────┘  │   (JWT Auth)    │  │  │ - AuthViewSet            │  │  │
│                    │                          │ ◄──────────────►│  │  └────────┬─────────────────┘  │  │
│  ┌─────────────────▼───────────────────────┐  │                 │  │           │                    │  │
│  │         API Client Layer               │  │                 │  │           ▼                    │  │
│  │  ┌──────────────────────────────────┐  │  │                 │  │  ┌──────────────────────────┐  │  │
│  │  │ axios interceptors               │  │  │                 │  │  │   Service Layer          │  │  │
│  │  │ - JWT refresh                    │  │  │                 │  │  │ ┌──────────────────────┐ │  │  │
│  │  │ - Error handling                 │  │  │                 │  │  │ │ TaskService          │ │  │  │
│  │  │ - Request/Response transform     │  │  │                 │  │  │ │ ProjectService       │ │  │  │
│  │  └──────────────────────────────────┘  │  │                 │  │  │ │ NotificationService  │ │  │  │
│  └─────────────────────────────────────────┘  │                 │  │  │ └──────────┬───────────┘ │  │  │
│                                               │                 │  │  └────────────┼─────────────┘  │  │
│  ┌─────────────────────────────────────────┐  │                 │  │               │                │  │
│  │       State Management                  │  │                 │  │               ▼                │  │
│  │  - React Context (Auth, Filters)        │  │                 │  │  ┌──────────────────────────┐  │  │
│  │  - Local State (useState, useReducer)   │  │                 │  │  │    ORM / Models          │  │  │
│  └─────────────────────────────────────────┘  │                 │  │  │  - Task                  │  │  │
└──────────────────────────────────────────────┘                 │  │  │  - Project               │  │  │
                                                                  │  │  │  - User                  │  │  │
                                                                  │  │  │  - Notification          │  │  │
                                                                  │  │  └────────┬─────────────────┘  │  │
                                                                  │  └───────────┼────────────────────┘  │
                                                                  └──────────────┼───────────────────────┘
                                                                                 │
                                                                                 ▼
                                                                  ┌──────────────────────────────────────┐
                                                                  │       PostgreSQL Database            │
                                                                  │  ┌────────────────────────────────┐  │
                                                                  │  │ Tables:                        │  │
                                                                  │  │ - accounts_user                │  │
                                                                  │  │ - tasks_task                   │  │
                                                                  │  │ - projects_project             │  │
                                                                  │  │ - research_research            │  │
                                                                  │  │ - notifications_notification   │  │
                                                                  │  └────────────────────────────────┘  │
                                                                  └──────────────────────────────────────┘
```

---

## 🔧 Backend Architecture

### Структура слоёв

```
backend/
├── apps/                           # Django приложения (модули)
│   ├── accounts/                   # Аутентификация, пользователи
│   │   ├── models.py               # User, Role, Division
│   │   ├── serializers.py          # DTO для API
│   │   ├── views/                  # API endpoints
│   │   │   ├── auth_views.py       # Login, Logout, Token refresh
│   │   │   └── user_views.py       # User CRUD, Profile
│   │   ├── permissions.py          # RBAC логика
│   │   └── constants.py            # UserRole, Division enums
│   │
│   ├── tasks/                      # Модуль задач
│   │   ├── models.py               # Task, TaskComment, TaskAttachment, TaskHistory
│   │   ├── serializers.py          # CRUD + Workflow actions
│   │   ├── views.py                # TaskViewSet
│   │   ├── filters.py              # django-filter для фильтрации
│   │   ├── constants.py            # TaskStatus, TaskType, Priority
│   │   └── signals.py              # Post-save hooks (уведомления)
│   │
│   ├── projects/                   # Модуль проектов
│   ├── research/                   # Модуль R&D
│   ├── notifications/              # Уведомления
│   ├── analytics/                  # Метрики, дашборд
│   └── core/                       # Общие базовые классы
│       ├── models.py               # BaseModel (created_at, updated_at, created_by)
│       ├── exceptions.py           # Кастомные исключения
│       ├── middleware.py           # Correlation ID, Logging
│       └── pagination.py           # Кастомная пагинация
│
├── services/                       # Бизнес-логика (Service Layer)
│   ├── task_service.py
│   ├── project_service.py
│   ├── research_service.py
│   ├── notification_service.py
│   └── analytics_service.py
│
├── config/                         # Конфигурация Django
│   ├── settings/
│   │   ├── base.py                 # Общие настройки
│   │   ├── development.py          # Dev окружение
│   │   ├── staging.py              # Stage окружение
│   │   └── production.py           # Production окружение
│   ├── urls.py                     # Главный роутер
│   ├── wsgi.py                     # WSGI entry
│   └── asgi.py                     # ASGI entry (для WebSocket в будущем)
│
└── tests/                          # Тесты
    ├── conftest.py                 # Pytest fixtures
    ├── test_task_api.py
    ├── test_task_service.py
    └── ...
```

### Поток обработки запроса

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  1. MIDDLEWARE LAYER                                        │
│     - CORS Headers                                          │
│     - JWT Authentication                                    │
│     - Correlation ID                                        │
│     - Request Logging                                       │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. URL ROUTING                                             │
│     /api/v1/tasks/ → TaskViewSet                            │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. VIEW LAYER (ViewSet / APIView)                          │
│     - Permission check (IsAuthenticated, IsOwnerOrManager)  │
│     - Input validation (Serializer)                         │
│     - Call Service Layer                                    │
│     - Format response (Serializer)                          │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  4. SERVICE LAYER                                           │
│     - Business logic                                        │
│     - Workflow orchestration                                │
│     - Transaction management (@transaction.atomic)          │
│     - Call multiple models if needed                        │
│     - Create audit records                                  │
│     - Trigger notifications                                 │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  5. MODEL LAYER (ORM)                                       │
│     - Data validation (model constraints)                   │
│     - Database operations (SELECT, INSERT, UPDATE)          │
│     - Relationships (ForeignKey, ManyToMany)                │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  6. DATABASE (PostgreSQL)                                   │
│     - ACID transactions                                     │
│     - Constraints enforcement                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    Response ▲
                         │   │
                         └───┘
```

### Service Layer Pattern

**Зачем?** Отделить бизнес-логику от HTTP-слоя.

#### Пример: TaskService

```python
# apps/tasks/views.py (THIN)
class TaskViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        task = self.get_object()
        serializer = TaskSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Вся логика в сервисе
        updated_task = TaskService.submit_task(
            task=task,
            user=request.user,
            result_description=serializer.validated_data['result_description']
        )
        
        return Response(TaskDetailSerializer(updated_task).data)

# services/task_service.py (FAT - бизнес-логика здесь)
class TaskService:
    @staticmethod
    @transaction.atomic
    def submit_task(task, user, result_description):
        # 1. Проверки
        if task.assignee != user:
            raise PermissionDenied("Только исполнитель может отправить задачу")
        
        if task.status != TaskStatus.IN_PROGRESS:
            raise WorkflowException("Неверный статус для отправки")
        
        # 2. Создание версии результата
        version = TaskResultVersion.objects.create(
            task=task,
            version_number=task.result_versions.count() + 1,
            content=result_description,
            created_by=user
        )
        
        # 3. Изменение статуса
        if task.task_type == TaskType.T1:
            task.status = TaskStatus.MANAGEMENT_REVIEW
        else:
            task.status = TaskStatus.DIVISION_REVIEW
        
        task.save()
        
        # 4. Аудит
        TaskHistory.objects.create(
            task=task,
            action='submitted',
            user=user,
            details={'version': version.version_number}
        )
        
        # 5. Уведомления
        NotificationService.notify_task_submitted(task, user)
        
        return task
```

---

## 🎨 Frontend Architecture

### Структура

```
src/
├── components/
│   ├── pages/                    # Страницы (роуты)
│   │   ├── Dashboard.tsx
│   │   ├── AllTasks.tsx
│   │   ├── TaskDetail.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Макет
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PageHeader.tsx
│   │
│   ├── ui/                       # Переиспользуемые UI компоненты
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   └── ...
│   │
│   └── figma/                    # Компоненты из Figma дизайна
│       ├── Stats.tsx
│       ├── TaskCard.tsx
│       └── ...
│
├── api/                          # API клиенты
│   ├── client.ts                 # Axios instance с interceptors
│   ├── auth.ts                   # Login, Logout, Token refresh
│   ├── tasks.ts                  # Task CRUD + workflow actions
│   ├── projects.ts
│   └── ...
│
├── contexts/                     # React Context для глобального состояния
│   ├── AuthContext.tsx           # Аутентификация
│   └── FiltersContext.tsx        # Фильтры (опционально)
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── ...
│
├── types/                        # TypeScript типы
│   └── index.ts                  # User, Task, Project, ...
│
└── utils/                        # Утилиты
    ├── permissions.ts            # canEditTask(), canApprove(), ...
    └── helpers.ts                # formatDate(), statusColor(), ...
```

### State Management

**Стратегия:** Hybrid - Context для глобального, Local State для компонентов.

```
┌─────────────────────────────────────────────────────┐
│            Application State                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Global State (React Context)                       │
│  ┌───────────────────────────────────────────────┐  │
│  │ AuthContext                                   │  │
│  │ - currentUser                                 │  │
│  │ - isAuthenticated                             │  │
│  │ - login()                                     │  │
│  │ - logout()                                    │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Local State (useState, useReducer)                 │
│  ┌───────────────────────────────────────────────┐  │
│  │ Component State                               │  │
│  │ - Form values                                 │  │
│  │ - Modal visibility                            │  │
│  │ - Loading states                              │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Server State (React Query / SWR - опционально)     │
│  ┌───────────────────────────────────────────────┐  │
│  │ API Data Caching                              │  │
│  │ - tasks, projects, users                      │  │
│  │ - Automatic refetching                        │  │
│  │ - Optimistic updates                          │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### API Communication Pattern

```typescript
// api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - добавляем JWT
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - обработка 401 и refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Попытка refresh токена
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/token/refresh/', {
            refresh: refreshToken
          });
          localStorage.setItem('accessToken', data.access);
          // Повторяем оригинальный запрос
          return apiClient(error.config);
        } catch {
          // Refresh не удался - разлогиниваем
          logout();
        }
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 🔄 Потоки данных

### 1. Аутентификация (Login Flow)

```
[Frontend]                [Backend]              [Database]
    │                         │                      │
    │ POST /api/v1/auth/login/│                      │
    │ {email, password}       │                      │
    ├────────────────────────>│                      │
    │                         │ Validate credentials │
    │                         ├─────────────────────>│
    │                         │ SELECT * FROM users  │
    │                         │<─────────────────────┤
    │                         │                      │
    │                         │ Generate JWT         │
    │                         │ (access + refresh)   │
    │ 200 OK                  │                      │
    │ {access, refresh, user} │                      │
    │<────────────────────────┤                      │
    │                         │                      │
    │ Store in localStorage   │                      │
    │ Redirect to /dashboard  │                      │
```

### 2. Создание задачи (Task Creation)

```
[Frontend]                [Backend]                      [Database]
    │                         │                              │
    │ POST /api/v1/tasks/     │                              │
    │ Bearer: JWT             │                              │
    │ {title, assignee, ...}  │                              │
    ├────────────────────────>│                              │
    │                         │ 1. Authentication (JWT)      │
    │                         │ 2. Permission check          │
    │                         │ 3. Serializer validation     │
    │                         │                              │
    │                         │ 4. TaskService.create_task() │
    │                         ├─────────────────────────────>│
    │                         │    BEGIN TRANSACTION         │
    │                         │    INSERT INTO tasks         │
    │                         │    INSERT INTO task_history  │
    │                         │    COMMIT                    │
    │                         │<─────────────────────────────┤
    │                         │                              │
    │                         │ 5. NotificationService       │
    │                         │    (создать уведомление)     │
    │                         ├─────────────────────────────>│
    │                         │    INSERT INTO notifications │
    │                         │<─────────────────────────────┤
    │                         │                              │
    │ 201 Created             │                              │
    │ {id, title, status,...} │                              │
    │<────────────────────────┤                              │
    │                         │                              │
    │ Update UI               │                              │
```

### 3. Workflow: Отправка задачи на проверку

```
[Employee]              [DivisionHead]           [ManagementHead]
    │                         │                         │
    │ 1. Submit Task          │                         │
    │ POST /api/v1/tasks/{id}/submit/                   │
    ├────────────────────────>│                         │
    │                         │                         │
    │ Task status:            │                         │
    │ IN_PROGRESS → DIVISION_REVIEW (T2)                │
    │            → MANAGEMENT_REVIEW (T1)               │
    │                         │                         │
    │                         │ 2. Notification         │
    │                         │<────────────────────────┤
    │                         │                         │
    │                         │ 3. Review Task          │
    │                         │ POST /api/v1/tasks/{id}/approve/
    │                         ├────────────────────────>│
    │                         │                         │
    │                         │ Status → MANAGEMENT_REVIEW (T2)
    │                         │       → ACCEPTED (T1)   │
    │                         │                         │
    │                         │                    4. Final Approval (T2)
    │                         │                         │ POST /approve/
    │                         │                         │
    │                         │                Status → ACCEPTED
    │                         │                         │
    │ 5. Notification         │                         │
    │<────────────────────────┼─────────────────────────┤
```

---

## 🔒 Модель безопасности

### 1. Authentication & Authorization

```
┌─────────────────────────────────────────────────────────┐
│                   Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: Transport Security                            │
│  ✓ HTTPS (TLS 1.3)                                      │
│  ✓ HSTS (Strict-Transport-Security)                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 2: Authentication (JWT)                          │
│  ✓ HS256 algorithm                                      │
│  ✓ Short-lived access tokens (15 min)                   │
│  ✓ Long-lived refresh tokens (7 days)                   │
│  ✓ Token rotation on refresh                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 3: Authorization (RBAC)                          │
│  ✓ Role-based permissions                               │
│  ✓ Object-level permissions                             │
│  ✓ Custom permission classes                            │
│                                                         │
│  Example:                                               │
│  if user.role == 'employee':                            │
│      can only view/edit own tasks                       │
│  if user.role == 'division_head':                       │
│      can approve tasks in division                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 4: Input Validation                              │
│  ✓ DRF Serializers (backend)                            │
│  ✓ Zod schemas (frontend)                               │
│  ✓ SQL Injection protection (ORM)                       │
│  ✓ XSS protection (auto-escaping)                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 5: Rate Limiting                                 │
│  ✓ django-ratelimit                                     │
│  ✓ 100 req/min (anonymous)                              │
│  ✓ 1000 req/min (authenticated)                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. RBAC Matrix

| Действие | Employee | Division Head | Department Head | Management Head |
|----------|----------|---------------|-----------------|-----------------|
| **Создать задачу** | Самопостановка | Для отдела | Все | Все |
| **Просмотр задач** | Свои | Свой отдел | Все | Все |
| **Одобрить T2 (Division Review)** | ❌ | ✅ Свой отдел | ✅ | ✅ |
| **Одобрить T2 (Management Review)** | ❌ | ❌ | ✅ | ✅ |
| **Одобрить T1** | ❌ | ❌ | ✅ | ✅ |
| **Удалить задачу** | ❌ | ❌ | ✅ (Soft delete) | ✅ |
| **Просмотр аналитики** | Свои метрики | Свой отдел | Все | Все |

---

## 📈 Масштабирование

### Текущая архитектура (MVP)

```
              ┌──────────┐
              │  NGINX   │
              └────┬─────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    ┌────────┐         ┌──────────┐
    │ React  │         │  Django  │
    │  SPA   │         │  + DRF   │
    └────────┘         └─────┬────┘
                             │
                             ▼
                       ┌──────────┐
                       │PostgreSQL│
                       └──────────┘
```

### Горизонтальное масштабирование (Stage/Prod)

```
                      ┌────────────────┐
                      │  Load Balancer │
                      │  (AWS ALB)     │
                      └────────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         ┌────────┐       ┌────────┐      ┌────────┐
         │ Django │       │ Django │      │ Django │
         │ Pod 1  │       │ Pod 2  │      │ Pod N  │
         └────┬───┘       └────┬───┘      └────┬───┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                     ┌─────────▼─────────┐
                     │   PostgreSQL      │
                     │   Primary         │
                     └─────────┬─────────┘
                               │ Replication
                     ┌─────────▼─────────┐
                     │   PostgreSQL      │
                     │   Read Replica    │
                     └───────────────────┘
```

### Оптимизации для высоких нагрузок

1. **Кэширование** (Redis)
   - Session storage
   - API responses caching
   - Query result caching

2. **CDN** для статики
   - Frontend build (CloudFlare / CloudFront)
   - User avatars, attachments (S3 + CloudFront)

3. **Database optimization**
   - Connection pooling (pgBouncer)
   - Read replicas
   - Indexes на частые запросы

4. **Async tasks** (Celery)
   - Email notifications
   - Report generation
   - Data aggregation

---

## 📦 Deployment Topology

### Development
```
docker-compose.yml
├── web (Django dev server)
├── db (PostgreSQL)
└── frontend (Vite dev server)
```

### Production (Рекомендуется)
```
Kubernetes Cluster
├── Ingress (NGINX)
├── Frontend Deployment (Static files → S3/CDN)
├── Backend Deployment
│   ├── Pod 1 (Gunicorn)
│   ├── Pod 2 (Gunicorn)
│   └── Pod N (Gunicorn)
├── PostgreSQL (RDS / Managed)
├── Redis (ElastiCache / Managed)
└── Celery Workers (опционально)
```

---

## 🔄 Миграционный путь к микросервисам (будущее)

Если система вырастет, можно выделить:

```
┌────────────────────────────────────────────────────────┐
│                    API Gateway                         │
└───────────┬────────────────────────────────────────────┘
            │
     ┌──────┴──────┬──────────┬──────────┬─────────┐
     ▼             ▼          ▼          ▼         ▼
┌─────────┐  ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  Auth   │  │  Tasks  │ │Projects│ │Research│ │Analytics│
│ Service │  │ Service │ │Service │ │Service │ │ Service│
└────┬────┘  └────┬────┘ └────┬───┘ └───┬────┘ └───┬────┘
     │            │           │         │          │
     ▼            ▼           ▼         ▼          ▼
┌─────────┐  ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  Users  │  │  Tasks  │ │Projects│ │Research│ │Metrics │
│   DB    │  │   DB    │ │  DB    │ │   DB   │ │   DB   │
└─────────┘  └─────────┘ └────────┘ └────────┘ └────────┘
```

**Но сейчас это избыточно!** Monolithic approach оптимален для MVP.

---

## 📚 Ссылки на документацию

- [README.md](./README.md) - Быстрый старт и обзор
- [DECISIONS.md](./DECISIONS.md) - Архитектурные решения (ADR)
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Как добавлять новые модули
- [API.md](./API.md) - API документация и примеры
- [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) - Результаты технического аудита

---

**Вопросы?** Обратитесь к команде архитектуры или создайте issue.
