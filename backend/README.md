# Management System Backend

Backend API для системы управления задачами, проектами и R&D исследованиями.

## 🛠 Технологический стек

| Компонент | Технология |
|-----------|------------|
| Фреймворк | Django 5.0 + Django REST Framework 3.15 |
| База данных | PostgreSQL 16 |
| Аутентификация | JWT (Simple JWT) |
| Документация API | drf-spectacular (OpenAPI 3.0) |
| Контейнеризация | Docker + Docker Compose |
| Тестирование | pytest + pytest-django |
| Качество кода | black, isort, flake8, pre-commit |

## 🚀 Быстрый старт

### Предварительные требования
- Docker и Docker Compose
- Git

### Запуск (3 команды)

```bash
# 1. Клонирование (если нужно)
cd backend

# 2. Копирование конфигурации
cp .env.example .env

# 3. Запуск
docker compose up --build
```

После запуска:
- **API**: http://localhost:8000/api/v1/
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Admin**: http://localhost:8000/admin/

### Учетные данные по умолчанию

```
Суперпользователь (Начальник Управления):
  Email: admin@company.uz
  Password: admin123

Начальник отдела R&D:
  Email: petrov@company.uz
  Password: user123

Сотрудник R&D:
  Email: sidorova@company.uz
  Password: user123
```

## 📁 Структура проекта

```
backend/
├── config/                 # Django проект (settings, urls, wsgi)
│   ├── settings/
│   │   ├── base.py        # Базовые настройки
│   │   ├── development.py # Dev окружение
│   │   ├── staging.py     # Staging окружение
│   │   └── production.py  # Production окружение
│   ├── urls.py            # Корневой URL роутер
│   └── wsgi.py
├── apps/                   # Django приложения
│   ├── accounts/          # Пользователи, профили, роли
│   ├── projects/          # Проекты
│   ├── tasks/             # Задачи, комментарии, вложения
│   ├── research/          # R&D исследования
│   ├── notifications/     # Уведомления
│   ├── analytics/         # Метрики и дашборд
│   └── core/              # Общие модели, утилиты, миксины
├── services/              # Бизнес-логика (слой сервисов)
├── tests/                 # Тесты
├── docker/                # Docker конфигурация
├── scripts/               # Скрипты (seed, backup и т.д.)
├── Dockerfile
├── docker-compose.yml
├── requirements/          # Зависимости по окружениям
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── manage.py
├── .env.example
├── pyproject.toml         # black, isort конфигурация
└── .pre-commit-config.yaml
```

## 🔐 Аутентификация

Используется **JWT (JSON Web Tokens)** с библиотекой `djangorestframework-simplejwt`.

### Почему JWT, а не Session Auth?

1. **Stateless**: Не требует хранения сессий на сервере
2. **Масштабируемость**: Легко масштабировать на несколько серверов
3. **SPA-совместимость**: Оптимально для React SPA
4. **Микросервисы**: Готовность к переходу на микросервисную архитектуру

### Схема аутентификации

```
┌─────────┐         POST /auth/login           ┌─────────┐
│  Front  │ ────────────────────────────────▶  │ Backend │
│  (React)│ { email, password }                │ (Django)│
└─────────┘                                    └─────────┘
     ▲                                              │
     │         { access_token, refresh_token }      │
     └──────────────────────────────────────────────┘

Последующие запросы:
Authorization: Bearer <access_token>
```

### Время жизни токенов

| Токен | Время жизни | Настройка |
|-------|-------------|-----------|
| Access | 15 минут | `ACCESS_TOKEN_LIFETIME` |
| Refresh | 7 дней | `REFRESH_TOKEN_LIFETIME` |

## 👥 RBAC (Роли и права)

### Роли

| Роль | Код | Описание |
|------|-----|----------|
| Начальник Департамента | `department_head` | Полный доступ ко всему |
| Начальник Управления | `management_head` | Управление своим управлением |
| Начальник отдела | `division_head` | Управление своим отделом |
| Сотрудник | `employee` | Базовые права |

### Матрица прав

| Действие | department_head | management_head | division_head | employee |
|----------|-----------------|-----------------|---------------|----------|
| Создать задачу | ✅ | ✅ | ✅ | ⚠️ (самопостановка) |
| Назначить исполнителя | ✅ | ✅ | ✅ (свой отдел) | ❌ |
| Одобрить задачу | ✅ | ✅ | ✅ (первый уровень) | ❌ |
| Просмотр всех задач | ✅ | ✅ | ⚠️ (свой отдел) | ⚠️ (свои) |
| Управление проектами | ✅ | ✅ | ⚠️ (свои) | ❌ |
| Аналитика | ✅ | ✅ | ⚠️ (свой отдел) | ❌ |

## 📊 API Endpoints

### Аутентификация

```http
POST   /api/v1/auth/login/          # Вход (получение токенов)
POST   /api/v1/auth/refresh/        # Обновление access токена
POST   /api/v1/auth/logout/         # Выход (инвалидация refresh)
GET    /api/v1/auth/me/             # Текущий пользователь
PATCH  /api/v1/auth/me/             # Обновление профиля
POST   /api/v1/auth/change-password/ # Смена пароля
```

### Пользователи

```http
GET    /api/v1/users/               # Список пользователей
GET    /api/v1/users/{id}/          # Профиль пользователя
GET    /api/v1/users/by-division/   # Пользователи по отделам
```

### Проекты

```http
GET    /api/v1/projects/            # Список проектов
POST   /api/v1/projects/            # Создать проект
GET    /api/v1/projects/{id}/       # Детали проекта
PATCH  /api/v1/projects/{id}/       # Обновить проект
DELETE /api/v1/projects/{id}/       # Удалить проект
POST   /api/v1/projects/{id}/transition/  # Смена статуса
GET    /api/v1/projects/{id}/history/     # История изменений
```

### Задачи

```http
GET    /api/v1/tasks/               # Список задач (с фильтрами)
POST   /api/v1/tasks/               # Создать задачу
GET    /api/v1/tasks/{id}/          # Детали задачи
PATCH  /api/v1/tasks/{id}/          # Обновить задачу
DELETE /api/v1/tasks/{id}/          # Удалить задачу

# Workflow
POST   /api/v1/tasks/{id}/take/             # Взять в работу
POST   /api/v1/tasks/{id}/submit/           # Отправить на проверку
POST   /api/v1/tasks/{id}/approve/          # Одобрить
POST   /api/v1/tasks/{id}/reject/           # Вернуть на доработку
POST   /api/v1/tasks/{id}/withdraw/         # Отозвать с проверки

# Комментарии
GET    /api/v1/tasks/{id}/comments/         # Список комментариев
POST   /api/v1/tasks/{id}/comments/         # Добавить комментарий

# Вложения
GET    /api/v1/tasks/{id}/attachments/      # Список вложений
POST   /api/v1/tasks/{id}/attachments/      # Загрузить файл

# История
GET    /api/v1/tasks/{id}/history/          # История изменений
GET    /api/v1/tasks/{id}/versions/         # Версии результатов
```

### Исследования

```http
GET    /api/v1/research/            # Список исследований
POST   /api/v1/research/            # Создать исследование
GET    /api/v1/research/{id}/       # Детали исследования
PATCH  /api/v1/research/{id}/       # Обновить
DELETE /api/v1/research/{id}/       # Удалить
POST   /api/v1/research/{id}/submit/       # На рассмотрение
POST   /api/v1/research/{id}/approve/      # Одобрить
POST   /api/v1/research/{id}/grant-access/ # Открыть доступ
```

### Уведомления

```http
GET    /api/v1/notifications/              # Список уведомлений
GET    /api/v1/notifications/unread-count/ # Количество непрочитанных
POST   /api/v1/notifications/{id}/read/    # Отметить прочитанным
POST   /api/v1/notifications/read-all/     # Отметить все прочитанными
```

### Аналитика

```http
GET    /api/v1/analytics/summary/          # Общая статистика
GET    /api/v1/analytics/tasks-by-status/  # Задачи по статусам
GET    /api/v1/analytics/tasks-by-employee/ # Задачи по сотрудникам
GET    /api/v1/analytics/overdue/          # Просроченные задачи
GET    /api/v1/analytics/velocity/         # Скорость выполнения
```

## 🔄 Workflow задач

### Типы задач

| Тип | Описание | Маршрут приемки |
|-----|----------|-----------------|
| T1 | Секретная | Исполнитель → Начальник Управления |
| T2 | Обычная | Исполнитель → Начальник отдела → Начальник Управления |

### Диаграмма переходов

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
┌─────┐  take()  ┌───────────┐  submit()  ┌────────────┐  │ reject()
│ NEW │ ───────▶ │IN_PROGRESS│ ─────────▶ │UNDER_REVIEW│ ─┤
└─────┘          └───────────┘            └────────────┘  │
                      ▲                         │         │
                      │                         │ approve()
                      │      ┌────────┐         │
                      └───── │ REWORK │ ◀───────┤
                   fix()     └────────┘         │
                                               ▼
                                          ┌──────────┐
                                          │ ACCEPTED │
                                          └──────────┘
```

## 🌐 Интеграция с фронтендом

### CORS настройка

В `.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Пример конфигурации на фронте

```typescript
// vite.config.ts или .env
VITE_API_BASE_URL=http://localhost:8000/api/v1

// axios instance
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const { data } = await axios.post('/api/v1/auth/refresh/', {
          refresh: refreshToken,
        });
        localStorage.setItem('access_token', data.access);
        error.config.headers.Authorization = `Bearer ${data.access}`;
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

## 🧪 Тестирование

```bash
# Запуск всех тестов
docker compose exec web pytest

# С покрытием
docker compose exec web pytest --cov=apps --cov-report=html

# Конкретный модуль
docker compose exec web pytest tests/test_tasks.py -v
```

## 🔧 Разработка

### Локальный запуск без Docker

```bash
# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Установка зависимостей
pip install -r requirements/development.txt

# Переменные окружения
cp .env.example .env
# Отредактируйте .env для локальной БД

# Миграции
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Загрузка тестовых данных
python manage.py seed_data

# Запуск
python manage.py runserver
```

### Pre-commit hooks

```bash
# Установка
pip install pre-commit
pre-commit install

# Ручной запуск
pre-commit run --all-files
```

### Полезные команды

```bash
# Создание миграций
docker compose exec web python manage.py makemigrations

# Применение миграций
docker compose exec web python manage.py migrate

# Создание суперпользователя
docker compose exec web python manage.py createsuperuser

# Загрузка seed данных
docker compose exec web python manage.py seed_data

# Django shell
docker compose exec web python manage.py shell_plus

# Просмотр логов
docker compose logs -f web
```

## 📝 Примеры API запросов

### Аутентификация

```bash
# Вход
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.uz", "password": "admin123"}'

# Ответ
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@company.uz",
    "name": "Иванов Иван Иванович",
    "role": "management_head",
    "division": "rnd"
  }
}
```

### Создание задачи

```bash
curl -X POST http://localhost:8000/api/v1/tasks/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Анализ рынка CRM систем",
    "description": "Провести исследование CRM решений",
    "task_type": "T2",
    "assignee_id": "uuid-assignee",
    "deadline": "2026-01-15",
    "priority": "high"
  }'
```

### Получение задач с фильтрами

```bash
curl "http://localhost:8000/api/v1/tasks/?status=in_progress&priority=high&ordering=-deadline" \
  -H "Authorization: Bearer <access_token>"
```

## 🔒 Безопасность

### Реализованные меры

1. **JWT с ротацией**: Короткоживущие access токены
2. **Rate Limiting**: 100 запросов/минуту для анонимных, 1000 для аутентифицированных
3. **CORS**: Строгий whitelist разрешенных origins
4. **CSRF**: Защита для браузерных запросов
5. **SQL Injection**: Защита через Django ORM
6. **XSS**: Автоэкранирование в DRF
7. **Audit Log**: Логирование всех изменений

### Рекомендации для Production

```env
# Production .env
DEBUG=False
SECRET_KEY=<strong-random-key-256-bits>
ALLOWED_HOSTS=api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## 📋 Assumptions (допущения)

1. **Один пользователь = один отдел**: Пользователь принадлежит только к одному отделу
2. **Иерархия ролей**: department_head > management_head > division_head > employee
3. **Секретные задачи (T1)**: Видны только исполнителю и Начальнику Управления
4. **Файлы**: В MVP хранятся локально, для production рекомендуется S3/MinIO
5. **Уведомления**: В MVP через API polling, WebSocket как P1
6. **Email**: В MVP логируется в консоль, для production настроить SMTP

## 🚧 Roadmap (P1 features)

- [ ] WebSocket уведомления (Django Channels)
- [ ] S3/MinIO для файлов
- [ ] Email уведомления
- [ ] Экспорт отчетов (PDF, Excel)
- [ ] Полнотекстовый поиск (PostgreSQL FTS)
- [ ] Кэширование (Redis)
- [ ] Celery для фоновых задач
- [ ] 2FA аутентификация

## 📄 Лицензия

Proprietary - Все права защищены.
