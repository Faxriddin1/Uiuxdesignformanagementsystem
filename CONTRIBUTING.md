# Contributing Guide

Добро пожаловать в Management System! Это руководство поможет вам начать работу над проектом.

---

## Быстрый старт

### Требования
- Docker & Docker Compose
- Git
- (Опционально) Python 3.12, Node.js 20 для локальной разработки

### Первый запуск

1. **Клонировать репозиторий:**
```bash
git clone https://github.com/Faxriddin1/Uiuxdesignformanagementsystem.git
cd Uiuxdesignformanagementsystem
```

2. **Настроить environment variables:**
```bash
# Backend
cp backend/.env.example backend/.env
# Отредактируйте backend/.env если нужно

# Frontend
cp .env.example .env
# Отредактируйте .env если нужно
```

3. **Запустить все сервисы:**
```bash
make up
```

4. **Проверить работу:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1/
- Swagger Docs: http://localhost:8000/api/docs/

5. **Создать суперпользователя (опционально):**
```bash
make createsuperuser
```

---

## Структура проекта

```
.
├── backend/               # Django backend
│   ├── apps/             # Django приложения
│   │   ├── accounts/     # Пользователи и аутентификация
│   │   ├── core/         # Общие компоненты
│   │   ├── projects/     # Проекты
│   │   ├── tasks/        # Задачи
│   │   ├── research/     # Исследования
│   │   ├── notifications/# Уведомления
│   │   └── analytics/    # Аналитика
│   ├── config/           # Настройки Django
│   ├── services/         # Бизнес-логика (Service Layer)
│   ├── tests/            # Тесты
│   └── requirements/     # Python зависимости
├── src/                  # React frontend
│   ├── components/       # React компоненты
│   ├── pages/            # Страницы
│   ├── hooks/            # Custom hooks
│   ├── services/         # API клиенты
│   └── utils/            # Утилиты
├── docker-compose.yml    # Оркестрация сервисов
├── Makefile             # Команды разработки
└── docs/                # Документация
```

---

## Backend: Как добавить новый модуль

### Шаг 1: Создать Django app

```bash
make shell
cd apps
python ../manage.py startapp myapp
```

### Шаг 2: Структурировать app

```
apps/myapp/
├── __init__.py
├── api/                 # API layer
│   ├── __init__.py
│   ├── serializers.py   # DRF Serializers
│   ├── views.py         # ViewSets
│   └── urls.py          # URL routing
├── models.py            # Django Models
├── admin.py             # Django Admin
├── apps.py              # App config
└── migrations/          # Database migrations
```

### Шаг 3: Создать модель

```python
# apps/myapp/models.py
from django.db import models
from apps.core.models import BaseModel, SoftDeleteMixin

class MyModel(BaseModel, SoftDeleteMixin):
    """Описание модели."""
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='mymodels'
    )
    
    class Meta:
        verbose_name = 'My Model'
        verbose_name_plural = 'My Models'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
```

**Важно:** Наследуйтесь от `BaseModel` и `SoftDeleteMixin` для единообразия.

### Шаг 4: Создать сервис

```python
# services/myapp_service.py
from django.db import transaction
from apps.myapp.models import MyModel
from services.notification_service import notify_created

class MyModelService:
    """Бизнес-логика для MyModel."""
    
    @transaction.atomic
    def create_mymodel(self, user, data):
        """Создать новую запись."""
        mymodel = MyModel.objects.create(
            owner=user,
            **data
        )
        
        # Отправить уведомление
        notify_created(mymodel, user)
        
        return mymodel
    
    def update_mymodel(self, mymodel, data):
        """Обновить запись."""
        for field, value in data.items():
            setattr(mymodel, field, value)
        mymodel.save()
        return mymodel

# Singleton instance
mymodel_service = MyModelService()
```

### Шаг 5: Создать serializer и views

```python
# apps/myapp/api/serializers.py
from rest_framework import serializers
from apps.myapp.models import MyModel

class MyModelSerializer(serializers.ModelSerializer):
    """Serializer для MyModel."""
    
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    
    class Meta:
        model = MyModel
        fields = [
            'id', 'title', 'description', 
            'owner', 'owner_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

# apps/myapp/api/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.myapp.models import MyModel
from apps.myapp.api.serializers import MyModelSerializer
from services.myapp_service import mymodel_service

class MyModelViewSet(viewsets.ModelViewSet):
    """ViewSet для MyModel."""
    
    queryset = MyModel.objects.all()
    serializer_class = MyModelSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Фильтровать по текущему пользователю."""
        return self.queryset.filter(owner=self.request.user)
    
    def create(self, request):
        """Создать новую запись через сервис."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        mymodel = mymodel_service.create_mymodel(
            user=request.user,
            data=serializer.validated_data
        )
        
        return Response(
            self.get_serializer(mymodel).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, pk=None):
        """Обновить запись через сервис."""
        mymodel = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        mymodel = mymodel_service.update_mymodel(
            mymodel=mymodel,
            data=serializer.validated_data
        )
        
        return Response(self.get_serializer(mymodel).data)
```

### Шаг 6: Зарегистрировать URLs

```python
# apps/myapp/api/urls.py
from rest_framework.routers import DefaultRouter
from apps.myapp.api.views import MyModelViewSet

router = DefaultRouter()
router.register(r'mymodels', MyModelViewSet, basename='mymodel')

urlpatterns = router.urls

# config/urls.py - добавить в основной роутинг
from apps.myapp.api import urls as myapp_urls

urlpatterns = [
    # ...
    path('api/v1/', include(myapp_urls)),
]
```

### Шаг 7: Создать и применить миграции

```bash
make makemigrations
make migrate
```

### Шаг 8: Написать тесты

```python
# backend/tests/test_myapp.py
import pytest
from apps.myapp.models import MyModel
from services.myapp_service import mymodel_service

@pytest.mark.django_db
class TestMyModelService:
    """Тесты для MyModelService."""
    
    def test_create_mymodel(self, user):
        """Тест создания записи."""
        data = {
            'title': 'Test Model',
            'description': 'Test description'
        }
        
        mymodel = mymodel_service.create_mymodel(user, data)
        
        assert mymodel.title == 'Test Model'
        assert mymodel.owner == user
        assert MyModel.objects.count() == 1
```

---

## Backend: Как добавить новый endpoint

### Пример: Добавить кастомный action к существующему ViewSet

```python
# apps/tasks/api/views.py
from rest_framework.decorators import action

class TaskViewSet(viewsets.ModelViewSet):
    # ... существующий код ...
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Завершить задачу."""
        task = self.get_object()
        
        task_service.complete_task(task, request.user)
        
        return Response(
            {'status': 'Task completed'},
            status=status.HTTP_200_OK
        )
```

**URL будет:** `POST /api/v1/tasks/{id}/complete/`

---

## Code Style

### Python (Backend)

**Инструменты:**
- **black** — форматирование кода
- **isort** — сортировка импортов
- **flake8** — линтинг

**Запуск:**
```bash
# Проверка
make lint

# Автоисправление
make lint-fix
```

**Правила:**
- Длина строки: 100 символов
- Импорты: сортировка по black profile
- Docstrings: Google style
- Type hints: где возможно

**Пример:**
```python
from typing import List, Optional

def get_user_tasks(user_id: int, status: Optional[str] = None) -> List[Task]:
    """
    Получить задачи пользователя.
    
    Args:
        user_id: ID пользователя
        status: Фильтр по статусу (опционально)
    
    Returns:
        Список задач пользователя
    
    Raises:
        User.DoesNotExist: Если пользователь не найден
    """
    queryset = Task.objects.filter(assigned_to_id=user_id)
    
    if status:
        queryset = queryset.filter(status=status)
    
    return list(queryset)
```

### TypeScript (Frontend)

**Инструменты:**
- **Prettier** — форматирование (если настроен)
- **ESLint** — линтинг (если настроен)

**Правила:**
- Строгая типизация — избегать `any`
- Функциональные компоненты + hooks
- Именование: PascalCase для компонентов, camelCase для функций

**Пример:**
```typescript
// src/components/TaskCard.tsx
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  const handleComplete = () => {
    onComplete(task.id);
  };
  
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <button onClick={handleComplete}>Complete</button>
    </div>
  );
};
```

---

## Git Workflow

### Ветки

```
main              # Production код
  ├── develop     # Development ветка
      ├── feature/task-123-add-export     # Feature branches
      ├── bugfix/task-456-fix-login       # Bugfix branches
      └── hotfix/critical-security-fix    # Hotfix branches
```

### Процесс разработки

1. **Создать ветку от develop:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/task-123-add-export
```

2. **Коммиты:**
```bash
git add .
git commit -m "feat: Add export functionality for tasks

- Add export service
- Create API endpoint
- Add frontend button
"
```

**Формат коммитов:**
```
<type>: <subject>

<body>
```

**Types:**
- `feat:` — новая функциональность
- `fix:` — исправление бага
- `docs:` — изменения в документации
- `style:` — форматирование кода
- `refactor:` — рефакторинг без изменения функциональности
- `test:` — добавление тестов
- `chore:` — обновление зависимостей, конфигурации

3. **Push и Pull Request:**
```bash
git push origin feature/task-123-add-export
```

Затем создайте PR на GitHub: `feature/task-123-add-export` → `develop`

4. **Code Review:**
- Минимум 1 approver
- Все комментарии должны быть resolved
- CI должен пройти успешно

5. **Merge:**
После approval — merge через GitHub (Squash and merge)

---

## Тестирование

### Backend Tests

**Запуск:**
```bash
# Все тесты
make test

# С покрытием
make test-cov

# Конкретный файл
docker compose exec backend pytest tests/test_task_service.py

# Конкретный тест
docker compose exec backend pytest tests/test_task_service.py::TestTaskService::test_create_task
```

**Написание тестов:**
```python
# tests/test_task_service.py
import pytest
from apps.tasks.models import Task
from services.task_service import task_service

@pytest.mark.django_db
class TestTaskService:
    """Тесты для TaskService."""
    
    def test_create_task(self, user, project):
        """Создание задачи."""
        data = {
            'title': 'New Task',
            'description': 'Description',
            'project': project
        }
        
        task = task_service.create_task(user, data)
        
        assert task.title == 'New Task'
        assert task.created_by == user
        assert Task.objects.count() == 1
    
    def test_create_task_without_permission(self, user, project):
        """Создание задачи без прав должно падать."""
        # Убираем пользователя из проекта
        project.members.remove(user)
        
        data = {'title': 'Task', 'project': project}
        
        with pytest.raises(PermissionError):
            task_service.create_task(user, data)
```

**Fixtures:**
```python
# tests/conftest.py
import pytest
from apps.accounts.models import User
from apps.projects.models import Project

@pytest.fixture
def user():
    """Создать тестового пользователя."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

@pytest.fixture
def project(user):
    """Создать тестовый проект."""
    return Project.objects.create(
        name='Test Project',
        owner=user
    )
```

### Frontend Tests

(TODO: Добавить когда будет настроен Jest/Vitest)

---

## Отладка

### Backend Debug

**Через print/logging:**
```python
import logging

logger = logging.getLogger(__name__)

def my_function():
    logger.debug("Debug message")
    logger.info("Info message")
    logger.warning("Warning message")
```

**Через Django shell:**
```bash
make shell

>>> from apps.tasks.models import Task
>>> Task.objects.all()
```

**Через pytest:**
```bash
docker compose exec backend pytest tests/test_task_service.py --pdb
```

### Frontend Debug

**Browser DevTools:**
- Console для логов
- Network для API запросов
- React DevTools extension

**Logging:**
```typescript
console.log('Debug:', data);
console.error('Error:', error);
```

---

## База данных

### Миграции

```bash
# Создать миграции
make makemigrations

# Применить миграции
make migrate

# Откатить последнюю миграцию
docker compose exec backend python manage.py migrate myapp 0001

# Посмотреть статус миграций
docker compose exec backend python manage.py showmigrations
```

### Seed данных

```bash
# Загрузить тестовые данные
make seed
```

### PostgreSQL shell

```bash
make dbshell

# Или напрямую
docker compose exec db psql -U postgres -d management_system
```

---

## Производительность

### Database Queries

**Избегать N+1 queries:**
```python
# Плохо (N+1)
tasks = Task.objects.all()
for task in tasks:
    print(task.project.name)  # Запрос к БД на каждой итерации

# Хорошо (1 запрос)
tasks = Task.objects.select_related('project').all()
for task in tasks:
    print(task.project.name)
```

**Для many-to-many:**
```python
# Плохо
projects = Project.objects.all()
for project in projects:
    print(project.members.all())  # N+1

# Хорошо
projects = Project.objects.prefetch_related('members').all()
for project in projects:
    print(project.members.all())
```

### API Performance

- Используйте pagination для списков
- Добавляйте индексы на часто запрашиваемые поля
- Кэшируйте дорогие запросы

---

## Часто задаваемые вопросы

**Q: Как сбросить БД?**
```bash
make clean  # Удалит все volumes (ОСТОРОЖНО!)
make up     # Создаст свежую БД
```

**Q: Порт уже занят?**
```bash
# Изменить порты в docker-compose.yml
ports:
  - "5174:5173"  # Вместо 5173:5173
```

**Q: Как обновить зависимости?**
```bash
# Backend
docker compose exec backend pip install -r requirements/development.txt

# Frontend
npm install
```

**Q: Как посмотреть логи?**
```bash
make logs           # Все сервисы
make logs-backend   # Только backend
make logs-frontend  # Только frontend
```

---

## Контакты

- **Issues:** https://github.com/Faxriddin1/Uiuxdesignformanagementsystem/issues
- **Discussions:** https://github.com/Faxriddin1/Uiuxdesignformanagementsystem/discussions

---

## Полезные ссылки

- [ARCHITECTURE.md](./ARCHITECTURE.md) — архитектура системы
- [DECISIONS.md](./DECISIONS.md) — архитектурные решения
- [Django Documentation](https://docs.djangoproject.com/)
- [DRF Documentation](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
