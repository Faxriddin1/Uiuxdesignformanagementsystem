# 🤝 Contributing Guide

**Проект:** Management System  
**Версия:** 1.0  
**Дата:** 2026-01-08

---

## 📋 Содержание

- [Добро пожаловать](#добро-пожаловать)
- [Быстрый старт для разработчика](#быстрый-старт-для-разработчика)
- [Структура проекта](#структура-проекта)
- [Как добавить новый модуль](#как-добавить-новый-модуль)
- [Как добавить новый API endpoint](#как-добавить-новый-api-endpoint)
- [Как добавить интеграцию](#как-добавить-интеграцию)
- [Стандарты кода](#стандарты-кода)
- [Тестирование](#тестирование)
- [Git Workflow](#git-workflow)
- [Code Review Process](#code-review-process)

---

## 👋 Добро пожаловать!

Спасибо за интерес к разработке Management System! Этот документ поможет вам быстро начать работу и следовать best practices команды.

### Принципы команды

1. **Качество важнее скорости** - пишем понятный, поддерживаемый код
2. **Тесты обязательны** - для критичной бизнес-логики
3. **Документация в коде** - docstrings, комментарии "почему", не "что"
4. **Code Review** - обязателен для всех PR
5. **Безопасность** - никаких секретов в коде, security check перед PR

---

## 🚀 Быстрый старт для разработчика

### 1. Установка окружения

```bash
# Клонировать репозиторий
git clone https://github.com/your-org/management-system.git
cd management-system

# Установить всё одной командой
make install

# Альтернатива (ручная установка):
# Backend
cd backend
cp .env.example .env
docker compose up -d

# Frontend
cd ..
npm install
npm run dev
```

### 2. Проверка работоспособности

```bash
# Проверить статус
make status

# Открыть в браузере
# http://localhost:5173 - Frontend
# http://localhost:8000/api/docs/ - Swagger UI
```

### 3. Создание ветки для задачи

```bash
# Синхронизировать main
git checkout main
git pull origin main

# Создать feature branch
git checkout -b feature/add-export-functionality

# Или
git checkout -b bugfix/fix-task-filter
```

---

## 📂 Структура проекта

### Backend (Django)

```
backend/
├── apps/                    # Django приложения
│   ├── core/                # Базовые классы, утилиты
│   ├── accounts/            # Пользователи, auth
│   ├── tasks/               # Модуль задач
│   ├── projects/            # Модуль проектов
│   ├── research/            # R&D модуль
│   ├── notifications/       # Уведомления
│   └── analytics/           # Аналитика
│
├── services/                # Бизнес-логика
│   ├── task_service.py
│   ├── notification_service.py
│   └── ...
│
├── config/                  # Django конфигурация
│   ├── settings/
│   │   ├── base.py          # Общие настройки
│   │   ├── development.py   # Dev
│   │   └── production.py    # Prod
│   └── urls.py              # Главный роутер
│
└── tests/                   # Тесты
```

### Frontend (React)

```
src/
├── components/
│   ├── pages/               # Страницы (Dashboard, Tasks, ...)
│   ├── layout/              # Sidebar, Header
│   ├── ui/                  # Переиспользуемые компоненты
│   └── figma/               # Figma дизайн компоненты
│
├── api/                     # API клиенты
├── contexts/                # React Context
├── hooks/                   # Custom hooks
├── types/                   # TypeScript типы
└── utils/                   # Утилиты
```

---

## 🆕 Как добавить новый модуль

### Пример: Добавить модуль "Documents" (Документооборот)

#### Шаг 1: Создать Django app

```bash
cd backend
docker compose exec web python manage.py startapp documents apps/documents
```

#### Шаг 2: Создать структуру файлов

```bash
apps/documents/
├── __init__.py
├── admin.py                 # Django Admin регистрация
├── apps.py                  # App конфигурация
├── constants.py             # Константы (статусы, типы)
├── models.py                # Модели данных
├── serializers.py           # DRF сериализаторы
├── views.py                 # ViewSets / APIViews
├── urls.py                  # URL маршруты
├── filters.py               # django-filter классы
├── permissions.py           # Кастомные разрешения
├── signals.py               # Post-save signals
└── migrations/              # Миграции БД
    └── __init__.py
```

#### Шаг 3: Модель данных

```python
# apps/documents/models.py
import uuid
from django.db import models
from apps.core.models import BaseModel

class Document(BaseModel):
    """Модель документа."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='documents/')
    
    # Relations
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='uploaded_documents'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Черновик'),
            ('published', 'Опубликован'),
        ],
        default='draft'
    )
    
    class Meta:
        db_table = 'documents_document'
        ordering = ['-created_at']
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'
    
    def __str__(self):
        return self.title
```

#### Шаг 4: Сериализаторы

```python
# apps/documents/serializers.py
from rest_framework import serializers
from apps.accounts.serializers import UserBasicSerializer
from .models import Document

class DocumentListSerializer(serializers.ModelSerializer):
    """Список документов (краткий)."""
    uploaded_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Document
        fields = ['id', 'title', 'status', 'uploaded_by', 'created_at']

class DocumentDetailSerializer(serializers.ModelSerializer):
    """Детали документа (полный)."""
    uploaded_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'

class DocumentCreateSerializer(serializers.ModelSerializer):
    """Создание документа."""
    
    class Meta:
        model = Document
        fields = ['title', 'description', 'file']
    
    def create(self, validated_data):
        # Используем сервис для создания
        from services.document_service import DocumentService
        return DocumentService.create_document(
            user=self.context['request'].user,
            **validated_data
        )
```

#### Шаг 5: ViewSet

```python
# apps/documents/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Document
from .serializers import (
    DocumentListSerializer,
    DocumentDetailSerializer,
    DocumentCreateSerializer,
)

@extend_schema_view(
    list=extend_schema(tags=['Documents'], summary='Список документов'),
    retrieve=extend_schema(tags=['Documents'], summary='Детали документа'),
    create=extend_schema(tags=['Documents'], summary='Создать документ'),
)
class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с документами."""
    
    queryset = Document.objects.select_related('uploaded_by')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentListSerializer
        elif self.action == 'create':
            return DocumentCreateSerializer
        return DocumentDetailSerializer
    
    def get_queryset(self):
        """Фильтрация по правам доступа."""
        user = self.request.user
        qs = super().get_queryset()
        
        # Пример: обычные пользователи видят только свои
        if user.role == 'employee':
            return qs.filter(uploaded_by=user)
        
        return qs
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Опубликовать документ."""
        document = self.get_object()
        
        from services.document_service import DocumentService
        updated_doc = DocumentService.publish_document(
            document=document,
            user=request.user
        )
        
        serializer = self.get_serializer(updated_doc)
        return Response(serializer.data)
```

#### Шаг 6: Service Layer

```python
# services/document_service.py
from django.db import transaction
from apps.core.exceptions import BusinessLogicException
from apps.documents.models import Document

class DocumentService:
    """Сервис для бизнес-логики документов."""
    
    @staticmethod
    @transaction.atomic
    def create_document(user, title, description, file):
        """Создать документ."""
        document = Document.objects.create(
            title=title,
            description=description,
            file=file,
            uploaded_by=user,
            created_by=user
        )
        
        # Логика уведомлений, аудита и т.д.
        # NotificationService.notify_document_uploaded(document)
        
        return document
    
    @staticmethod
    @transaction.atomic
    def publish_document(document, user):
        """Опубликовать документ."""
        # Проверки
        if document.uploaded_by != user and not user.is_manager():
            raise BusinessLogicException(
                "Только автор или менеджер может опубликовать"
            )
        
        if document.status == 'published':
            raise BusinessLogicException("Документ уже опубликован")
        
        # Обновление
        document.status = 'published'
        document.save()
        
        return document
```

#### Шаг 7: URLs

```python
# apps/documents/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet

router = DefaultRouter()
router.register(r'', DocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
]
```

```python
# config/urls.py - добавить в api_v1_patterns
api_v1_patterns = [
    # ...
    path('documents/', include('apps.documents.urls')),
]
```

#### Шаг 8: Зарегистрировать в settings

```python
# config/settings/base.py
LOCAL_APPS = [
    # ...
    'apps.documents',  # Новый модуль
]
```

#### Шаг 9: Создать миграции

```bash
docker compose exec web python manage.py makemigrations documents
docker compose exec web python manage.py migrate
```

#### Шаг 10: Написать тесты

```python
# tests/test_document_api.py
import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.django_db
class TestDocumentAPI:
    
    def test_create_document(self, authenticated_client, employee_user):
        """Тест создания документа."""
        url = reverse('document-list')
        data = {
            'title': 'Test Document',
            'description': 'Test description',
        }
        
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Test Document'
        assert response.data['uploaded_by']['id'] == str(employee_user.id)
```

---

## 🔌 Как добавить новый API endpoint

### Пример: Добавить bulk status update для задач

```python
# apps/tasks/views.py
class TaskViewSet(viewsets.ModelViewSet):
    # ... существующие методы
    
    @extend_schema(
        tags=['Tasks'],
        summary='Массовое обновление статусов',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'task_ids': {'type': 'array', 'items': {'type': 'string'}},
                    'status': {'type': 'string', 'enum': ['in_progress', 'completed']},
                },
                'required': ['task_ids', 'status'],
            }
        }
    )
    @action(detail=False, methods=['post'], url_path='bulk-update-status')
    def bulk_update_status(self, request):
        """Массово обновить статусы задач."""
        task_ids = request.data.get('task_ids', [])
        new_status = request.data.get('status')
        
        # Валидация
        if not task_ids:
            return Response(
                {'error': 'task_ids required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Вызов сервиса
        from services.task_service import TaskService
        updated_tasks = TaskService.bulk_update_status(
            task_ids=task_ids,
            new_status=new_status,
            user=request.user
        )
        
        return Response({
            'updated_count': len(updated_tasks),
            'task_ids': [str(t.id) for t in updated_tasks]
        })
```

---

## 🔗 Как добавить интеграцию

### Пример: Email уведомления через SMTP

#### 1. Создать integration модуль

```python
# services/integrations/email_service.py
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Сервис отправки email."""
    
    @staticmethod
    def send_task_assigned_email(task, assignee):
        """Отправить email о назначении задачи."""
        try:
            subject = f'Вам назначена задача: {task.title}'
            message = f'''
            Здравствуйте, {assignee.first_name}!
            
            Вам назначена новая задача:
            Название: {task.title}
            Дедлайн: {task.deadline}
            
            Ссылка: {settings.FRONTEND_URL}/tasks/{task.id}
            '''
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[assignee.email],
                fail_silently=False,
            )
            
            logger.info(f'Email sent to {assignee.email} for task {task.id}')
            
        except Exception as e:
            logger.error(f'Failed to send email: {e}')
            # Не падаем, если email не отправился
```

#### 2. Добавить в settings

```python
# config/settings/production.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST')
EMAIL_PORT = env('EMAIL_PORT', default=587)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL')
```

#### 3. Использовать в сервисе

```python
# services/task_service.py
class TaskService:
    @staticmethod
    def create_task(...):
        task = Task.objects.create(...)
        
        # Отправить email (опционально)
        if settings.EMAIL_ENABLED:
            from services.integrations.email_service import EmailService
            EmailService.send_task_assigned_email(task, assignee)
        
        return task
```

---

## 📏 Стандарты кода

### Python (Backend)

```python
# ✅ ХОРОШО
def calculate_task_duration(task: Task) -> timedelta:
    """
    Вычислить длительность выполнения задачи.
    
    Args:
        task: Объект задачи
        
    Returns:
        timedelta: Время выполнения
        
    Raises:
        ValueError: Если задача не завершена
    """
    if not task.completed_at:
        raise ValueError("Task not completed")
    
    return task.completed_at - task.started_at


# ❌ ПЛОХО
def calc(t):
    # Без docstring, непонятные имена
    return t.c - t.s
```

### TypeScript (Frontend)

```typescript
// ✅ ХОРОШО
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: User;
}

const fetchTasks = async (filters: TaskFilters): Promise<Task[]> => {
  const response = await apiClient.get('/tasks/', { params: filters });
  return response.data.results;
};


// ❌ ПЛОХО
const getTasks = async (f: any): Promise<any> => {
  // Без типов, any
  return apiClient.get('/tasks/', { params: f });
};
```

### Форматирование

**Backend:**
```bash
# Автоформатирование
make format

# Проверка
make lint
```

**Frontend:**
```bash
# Линтинг (когда настроен ESLint)
npm run lint

# Форматирование (когда настроен Prettier)
npm run format
```

---

## 🧪 Тестирование

### Backend Tests

```bash
# Запустить все тесты
make test

# С покрытием
make test-coverage

# Только быстрые
make test-fast
```

### Что тестировать?

1. **Service Layer** - вся бизнес-логика
2. **API endpoints** - основные CRUD + workflow actions
3. **Permissions** - проверка прав доступа
4. **Валидация** - граничные случаи

### Пример теста

```python
# tests/test_task_service.py
import pytest
from apps.tasks.constants import TaskStatus
from services.task_service import TaskService

@pytest.mark.django_db
class TestTaskService:
    
    def test_submit_task_success(self, task_in_progress, employee_user):
        """Тест успешной отправки задачи на проверку."""
        task = TaskService.submit_task(
            task=task_in_progress,
            user=employee_user,
            result_description='Completed work'
        )
        
        assert task.status == TaskStatus.DIVISION_REVIEW
        assert task.result_versions.count() == 1
    
    def test_submit_task_wrong_user(self, task_in_progress, division_head_user):
        """Тест: только assignee может отправить задачу."""
        with pytest.raises(PermissionError):
            TaskService.submit_task(
                task=task_in_progress,
                user=division_head_user,  # Не assignee!
                result_description='...'
            )
```

---

## 🌿 Git Workflow

### Ветки

```
main                    # Production-ready код
├── develop             # Integration branch (опционально)
├── feature/add-export  # Новая функция
├── bugfix/fix-filter   # Исправление бага
└── hotfix/security     # Срочный фикс для production
```

### Commit Messages

Используем **Conventional Commits**:

```bash
# Формат
<type>(<scope>): <subject>

# Примеры
feat(tasks): add bulk status update endpoint
fix(auth): resolve token refresh race condition
docs(readme): update API examples
refactor(services): extract notification logic
test(tasks): add tests for workflow transitions
chore(deps): upgrade Django to 5.0.1
```

**Types:**
- `feat` - новая функциональность
- `fix` - исправление бага
- `docs` - документация
- `refactor` - рефакторинг без изменения поведения
- `test` - добавление тестов
- `chore` - рутинные задачи (deps, config)

### Pull Request

1. **Создать PR** с описанием:
   ```markdown
   ## Что сделано
   - Добавлен endpoint для bulk update
   - Написаны тесты
   
   ## Как тестировать
   1. Запустить `make test`
   2. Проверить в Swagger: POST /api/v1/tasks/bulk-update-status/
   
   ## Связанные issues
   Closes #123
   ```

2. **CI должен пройти** (lint, tests)
3. **Code review** от минимум 1 человека
4. **Merge** после approval

---

## 👀 Code Review Process

### Что проверять в PR?

**✅ Checklist:**

- [ ] Код соответствует стандартам (lint passed)
- [ ] Есть тесты для новой логики
- [ ] Docstrings / комментарии присутствуют
- [ ] Нет секретов в коде
- [ ] API endpoint документирован (@extend_schema)
- [ ] Миграции корректны (если есть)
- [ ] Не сломана существующая функциональность
- [ ] Performance OK (нет N+1 queries)

### Как давать feedback?

```markdown
# ✅ Конструктивно
Предлагаю использовать `select_related('assignee')` здесь, чтобы избежать N+1.

# ❌ Неконструктивно
Этот код плохой.
```

---

## 🆘 Получить помощь

- **Slack:** #management-system-dev
- **Email:** dev-team@your-domain.com
- **Документация:** [ARCHITECTURE.md](./ARCHITECTURE.md), [DECISIONS.md](./DECISIONS.md)
- **Issues:** GitHub Issues для багов/идей

---

## 📚 Полезные ссылки

- [Django Best Practices](https://django-best-practices.readthedocs.io/)
- [DRF Style Guide](https://github.com/HackSoftware/Django-Styleguide)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Спасибо за вклад в проект! 🚀**
