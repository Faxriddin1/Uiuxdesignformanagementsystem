# How to Extend the Project

> Руководство для разработчиков по расширению функциональности

---

## 📋 Оглавление

- [Добавление нового API endpoint](#добавление-нового-api-endpoint)
- [Добавление новой модели](#добавление-новой-модели)
- [Добавление нового React компонента](#добавление-нового-react-компонента)
- [Добавление новой страницы](#добавление-новой-страницы)
- [Интеграция с внешними сервисами](#интеграция-с-внешними-сервисами)
- [Добавление фоновых задач (Celery)](#добавление-фоновых-задач-celery)

---

## Добавление нового API endpoint

### Шаг 1: Создать/расширить модель

```python
# backend/apps/documents/models.py
from apps.core.models import BaseModel

class Document(BaseModel):
    """Модель документа."""
    
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self) -> str:
        return self.title
```

### Шаг 2: Создать сериализатор

```python
# backend/apps/documents/serializers.py
from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'project', 
            'uploaded_by', 'uploaded_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at']
```

### Шаг 3: Создать сервис (бизнес-логика)

```python
# backend/services/document_service.py
from apps.documents.models import Document
from apps.core.exceptions import BusinessLogicError

class DocumentService:
    """Сервис для работы с документами."""
    
    @staticmethod
    def upload_document(project_id: str, file, user) -> Document:
        """Загрузить новый документ в проект."""
        # Валидация
        if file.size > 50 * 1024 * 1024:  # 50MB
            raise BusinessLogicError("File too large")
        
        document = Document.objects.create(
            project_id=project_id,
            file=file,
            title=file.name,
            uploaded_by=user
        )
        
        # Можно добавить уведомление
        NotificationService.notify_document_uploaded(document)
        
        return document
```

### Шаг 4: Создать ViewSet

```python
# backend/apps/documents/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from services.document_service import DocumentService
from .models import Document
from .serializers import DocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    """API для работы с документами."""
    
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Document.objects.filter(
            project__members=self.request.user
        ).select_related('uploaded_by', 'project')
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Загрузка документа."""
        project_id = request.data.get('project_id')
        file = request.FILES.get('file')
        
        document = DocumentService.upload_document(
            project_id=project_id,
            file=file,
            user=request.user
        )
        
        return Response(
            DocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )
```

### Шаг 5: Добавить URL

```python
# backend/apps/documents/urls.py
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet

router = DefaultRouter()
router.register('documents', DocumentViewSet, basename='documents')

urlpatterns = router.urls

# backend/config/urls.py — добавить include
path('api/v1/', include('apps.documents.urls')),
```

### Шаг 6: Миграция

```bash
make makemigrations
make migrate
```

### Шаг 7: Тесты

```python
# backend/tests/test_documents.py
import pytest
from apps.documents.models import Document

@pytest.mark.django_db
class TestDocumentAPI:
    def test_upload_document(self, api_client, user, project):
        api_client.force_authenticate(user=user)
        
        with open('test_file.txt', 'rb') as f:
            response = api_client.post('/api/v1/documents/upload/', {
                'project_id': project.id,
                'file': f
            })
        
        assert response.status_code == 201
        assert Document.objects.count() == 1
```

---

## Добавление новой модели

### Чеклист

- [ ] Создать модель в `apps/<app>/models.py`
- [ ] Наследовать от `BaseModel` для timestamps
- [ ] Добавить `__str__` метод
- [ ] Создать миграцию: `make makemigrations`
- [ ] Применить миграцию: `make migrate`
- [ ] Добавить в admin: `apps/<app>/admin.py`
- [ ] Создать сериализатор
- [ ] Создать сервис если есть бизнес-логика
- [ ] Создать ViewSet
- [ ] Добавить тесты

### Шаблон модели

```python
from django.db import models
from apps.core.models import BaseModel

class MyModel(BaseModel):
    """Описание модели."""
    
    # Choices
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Черновик'
        ACTIVE = 'active', 'Активный'
        ARCHIVED = 'archived', 'Архив'
    
    # Fields
    title = models.CharField('Название', max_length=255)
    status = models.CharField(
        'Статус',
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    
    class Meta:
        verbose_name = 'Моя модель'
        verbose_name_plural = 'Мои модели'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
        ]
    
    def __str__(self) -> str:
        return self.title
```

---

## Добавление нового React компонента

### Структура компонента

```
src/components/ui/MyComponent/
├── MyComponent.tsx       # Основной компонент
├── MyComponent.test.tsx  # Тесты
├── index.ts              # Re-export
└── types.ts              # Типы (если много)
```

### Шаблон компонента

```tsx
// src/components/ui/DocumentCard.tsx
import React from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';

interface DocumentCardProps {
  /** Заголовок документа */
  title: string;
  /** URL файла */
  fileUrl: string;
  /** Размер файла в байтах */
  fileSize: number;
  /** Дата загрузки */
  uploadedAt: string;
  /** Callback удаления */
  onDelete?: () => void;
  /** Компонент в режиме загрузки */
  isLoading?: boolean;
}

/**
 * Карточка документа
 * 
 * @example
 * ```tsx
 * <DocumentCard
 *   title="Презентация.pptx"
 *   fileUrl="/files/presentation.pptx"
 *   fileSize={1024000}
 *   uploadedAt="2025-01-15"
 *   onDelete={() => handleDelete(doc.id)}
 * />
 * ```
 */
export const DocumentCard: React.FC<DocumentCardProps> = ({
  title,
  fileUrl,
  fileSize,
  uploadedAt,
  onDelete,
  isLoading = false,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className={isLoading ? 'opacity-50' : ''}>
      <CardHeader className="flex flex-row items-center gap-3">
        <FileText className="h-8 w-8 text-blue-500" />
        <div className="flex-1">
          <CardTitle className="text-sm">{title}</CardTitle>
          <p className="text-xs text-gray-500">
            {formatFileSize(fileSize)} • {uploadedAt}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(fileUrl)}
          disabled={isLoading}
        >
          <Download className="h-4 w-4 mr-1" />
          Скачать
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentCard;
```

---

## Добавление новой страницы

### Шаг 1: Создать компонент страницы

```tsx
// src/components/pages/Documents.tsx
import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import { DocumentCard } from '../ui/DocumentCard';
import { useDocuments } from '../../hooks/useDocuments';
import { EmptyState } from '../ui/EmptyState';

interface DocumentsProps {
  projectId: string;
  onNavigateBack: () => void;
}

export const Documents: React.FC<DocumentsProps> = ({
  projectId,
  onNavigateBack,
}) => {
  const { documents, isLoading, deleteDocument } = useDocuments(projectId);

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Документы"
        onBack={onNavigateBack}
      />

      {documents.length === 0 ? (
        <EmptyState
          title="Нет документов"
          description="Загрузите первый документ"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              title={doc.title}
              fileUrl={doc.fileUrl}
              fileSize={doc.fileSize}
              uploadedAt={doc.uploadedAt}
              onDelete={() => deleteDocument(doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Шаг 2: Создать хук для данных

```tsx
// src/hooks/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../api';

export function useDocuments(projectId: string) {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => documentsApi.getByProject(projectId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
    },
  });

  return {
    documents,
    isLoading,
    deleteDocument: deleteMutation.mutate,
  };
}
```

### Шаг 3: Добавить в роутинг (App.tsx)

```tsx
// В type Page добавить
type Page = 'dashboard' | 'tasks' | 'documents' | ...;

// В renderCurrentPage()
case 'documents':
  return <Documents projectId={selectedProjectId} onNavigateBack={handleNavigateBack} />;
```

---

## Интеграция с внешними сервисами

### Пример: Email-уведомления

```python
# backend/services/email_service.py
from django.core.mail import send_mail
from django.conf import settings

class EmailService:
    """Сервис отправки email."""
    
    @staticmethod
    def send_task_notification(user, task, action: str):
        """Отправить уведомление о задаче."""
        subject = f'Задача "{task.title}" - {action}'
        message = f"""
        Здравствуйте, {user.name}!
        
        {action} задача "{task.title}".
        
        Статус: {task.get_status_display()}
        Дедлайн: {task.deadline}
        
        Перейти к задаче: {settings.FRONTEND_URL}/tasks/{task.id}
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
```

### Пример: Интеграция с S3

```python
# backend/config/settings/base.py
if env.bool('USE_S3', False):
    AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', default='us-east-1')
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

---

## Добавление фоновых задач (Celery)

### Шаг 1: Установить зависимости

```bash
# backend/requirements/base.txt
celery>=5.3,<6.0
redis>=5.0,<6.0
django-celery-beat>=2.5,<3.0
```

### Шаг 2: Настроить Celery

```python
# backend/config/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('management_system')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

### Шаг 3: Создать задачу

```python
# backend/apps/tasks/tasks.py
from celery import shared_task
from services.notification_service import NotificationService

@shared_task
def send_deadline_reminders():
    """Отправить напоминания о дедлайнах."""
    from apps.tasks.models import Task
    from django.utils import timezone
    from datetime import timedelta
    
    tomorrow = timezone.now() + timedelta(days=1)
    tasks = Task.objects.filter(
        deadline__date=tomorrow.date(),
        status__in=['draft', 'in_progress']
    )
    
    for task in tasks:
        NotificationService.send_deadline_reminder(task)
    
    return f'Sent {tasks.count()} reminders'
```

### Шаг 4: Добавить в docker-compose.yml

```yaml
services:
  celery:
    build: .
    command: celery -A config worker -l INFO
    depends_on:
      - db
      - redis
    env_file:
      - .env

  celery-beat:
    build: .
    command: celery -A config beat -l INFO
    depends_on:
      - celery
```

---

## Чеклист для нового функционала

### Backend

- [ ] Модель создана и наследует BaseModel
- [ ] Миграция создана и применена
- [ ] Сериализатор создан
- [ ] Сервис создан для бизнес-логики
- [ ] ViewSet создан
- [ ] URL добавлен в роутинг
- [ ] Permissions настроены
- [ ] Тесты написаны (минимум 70% coverage)
- [ ] Swagger документация генерируется

### Frontend

- [ ] Компонент создан с TypeScript
- [ ] Props типизированы через interface
- [ ] JSDoc комментарии добавлены
- [ ] Хук создан для работы с API
- [ ] Страница добавлена в роутинг
- [ ] Обработка ошибок добавлена
- [ ] Loading state реализован

### Общее

- [ ] Code review пройден
- [ ] Lint проходит
- [ ] Тесты проходят
- [ ] Документация обновлена
