"""
=============================================================================
Task Views
=============================================================================
"""

from django.db.models import Q

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample

from apps.accounts.constants import UserRole
from apps.accounts.permissions import IsOwnerOrManager

from services.task_service import TaskService

from .constants import TaskStatus, TaskType
from .filters import TaskFilter
from .models import Task, TaskAttachment, TaskComment, TaskHistory
from .serializers import (
    TaskAttachmentSerializer,
    TaskAttachmentUploadSerializer,
    TaskCommentSerializer,
    TaskCreateSerializer,
    TaskDetailSerializer,
    TaskHistorySerializer,
    TaskListSerializer,
    TaskRejectSerializer,
    TaskSubmitSerializer,
    TaskUpdateSerializer,
    TaskWithdrawSerializer,
)


@extend_schema_view(
    list=extend_schema(
        tags=['Tasks'],
        summary='Список задач',
        description='''
Возвращает список задач с пагинацией и фильтрами.

**Фильтры:**
- `status` - статус задачи (можно несколько)
- `priority` - приоритет
- `task_type` - тип (T1/T2)
- `division` - отдел
- `assignee` - UUID исполнителя
- `is_overdue` - только просроченные
- `search` - поиск по названию/описанию

**Сортировка:**
- `ordering` - поле для сортировки: deadline, -deadline, created_at, -created_at, priority
        ''',
    ),
    retrieve=extend_schema(
        tags=['Tasks'],
        summary='Детали задачи',
        description='Возвращает полную информацию о задаче включая комментарии и вложения.'
    ),
    create=extend_schema(
        tags=['Tasks'],
        summary='Создать задачу',
        description='Создает новую задачу. Требуются права руководителя или самопостановка.',
        examples=[
            OpenApiExample(
                'Создание T2 задачи',
                value={
                    'title': 'Анализ рынка CRM систем',
                    'description': 'Провести исследование CRM решений',
                    'task_type': 'T2',
                    'priority': 'high',
                    'division': 'rnd',
                    'assignee_id': '123e4567-e89b-12d3-a456-426614174000',
                    'deadline': '2026-01-15',
                },
                request_only=True,
            ),
        ]
    ),
    partial_update=extend_schema(
        tags=['Tasks'],
        summary='Обновить задачу',
        description='Частичное обновление задачи.'
    ),
    destroy=extend_schema(
        tags=['Tasks'],
        summary='Удалить задачу',
        description='Мягкое удаление задачи.'
    ),
)
class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления задачами.
    
    Включает CRUD операции и workflow actions.
    """
    
    queryset = Task.objects.select_related(
        'assignee', 'creator', 'custom_approver', 'project'
    ).prefetch_related(
        'co_assignees', 'attachments', 'comments'
    )
    permission_classes = [IsAuthenticated]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['deadline', 'created_at', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        if self.action == 'create':
            return TaskCreateSerializer
        if self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        return TaskDetailSerializer
    
    def get_queryset(self):
        """
        Фильтрация задач по правам доступа.
        
        - department_head, management_head: все задачи
        - division_head: задачи своего отдела + T1 где он исполнитель
        - employee: свои задачи (исполнитель или соисполнитель)
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role in [UserRole.DEPARTMENT_HEAD, UserRole.MANAGEMENT_HEAD]:
            # Видят все задачи
            return queryset
        
        if user.role == UserRole.DIVISION_HEAD:
            # Свой отдел + T1 где исполнитель
            return queryset.filter(
                Q(division=user.division) |
                Q(assignee=user) |
                Q(co_assignees=user)
            ).distinct()
        
        # Employee: только свои
        return queryset.filter(
            Q(assignee=user) |
            Q(co_assignees=user) |
            Q(creator=user)
        ).distinct()
    
    def perform_create(self, serializer):
        """Создание задачи через сервис."""
        # Получаем данные
        data = serializer.validated_data
        assignee_id = data.pop('assignee_id')
        co_assignee_ids = data.pop('co_assignee_ids', [])
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        assignee = User.objects.get(id=assignee_id)
        co_assignees = list(User.objects.filter(id__in=co_assignee_ids)) if co_assignee_ids else None
        
        # Создаем через сервис
        task = TaskService.create_task(
            creator=self.request.user,
            assignee=assignee,
            co_assignees=co_assignees,
            **data
        )
        
        # Сохраняем для ответа
        serializer.instance = task
    
    # =========================================================================
    # Workflow Actions
    # =========================================================================
    
    @extend_schema(
        tags=['Tasks'],
        summary='Взять в работу',
        description='Исполнитель берет задачу в работу. Переход: NEW → IN_PROGRESS',
        responses={200: TaskDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def take(self, request, pk=None):
        """Взять задачу в работу."""
        task = self.get_object()
        task = TaskService.take_task(task, request.user)
        return Response(TaskDetailSerializer(task, context={'request': request}).data)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Отправить на проверку',
        description='Отправить результат на проверку/рассмотрение.',
        request=TaskSubmitSerializer,
        responses={200: TaskDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Отправить результат на проверку."""
        task = self.get_object()
        
        serializer = TaskSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task = TaskService.submit_for_review(
            task=task,
            user=request.user,
            result_description=serializer.validated_data['result_description']
        )
        
        return Response(TaskDetailSerializer(task, context={'request': request}).data)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Одобрить задачу',
        description='Одобрить задачу (руководитель).',
        responses={200: TaskDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Одобрить задачу."""
        task = self.get_object()
        task = TaskService.approve_task(task, request.user)
        return Response(TaskDetailSerializer(task, context={'request': request}).data)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Вернуть на доработку',
        description='Вернуть задачу на доработку с указанием причины.',
        request=TaskRejectSerializer,
        responses={200: TaskDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Вернуть задачу на доработку."""
        task = self.get_object()
        
        serializer = TaskRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task = TaskService.reject_task(
            task=task,
            user=request.user,
            reason=serializer.validated_data['reason']
        )
        
        return Response(TaskDetailSerializer(task, context={'request': request}).data)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Отозвать с проверки',
        description='Исполнитель отзывает задачу с проверки.',
        request=TaskWithdrawSerializer,
        responses={200: TaskDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """Отозвать задачу с проверки."""
        task = self.get_object()
        
        serializer = TaskWithdrawSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task = TaskService.withdraw_from_review(
            task=task,
            user=request.user,
            reason=serializer.validated_data.get('reason', '')
        )
        
        return Response(TaskDetailSerializer(task, context={'request': request}).data)
    
    # =========================================================================
    # Nested Resources
    # =========================================================================
    
    @extend_schema(
        tags=['Tasks'],
        summary='Список комментариев',
        description='Получить комментарии к задаче.',
        responses={200: TaskCommentSerializer(many=True)}
    )
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Комментарии к задаче."""
        task = self.get_object()
        
        if request.method == 'GET':
            comments = task.comments.select_related('author').prefetch_related('mentions')
            serializer = TaskCommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        # POST - добавить комментарий
        serializer = TaskCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task, author=request.user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Вложения',
        description='Управление вложениями задачи.',
    )
    @action(detail=True, methods=['get', 'post'])
    def attachments(self, request, pk=None):
        """Вложения к задаче."""
        task = self.get_object()
        
        if request.method == 'GET':
            attachments = task.attachments.select_related('uploaded_by')
            serializer = TaskAttachmentSerializer(
                attachments, many=True, context={'request': request}
            )
            return Response(serializer.data)
        
        # POST - загрузить файл
        serializer = TaskAttachmentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task, uploaded_by=request.user)
        
        return Response(
            TaskAttachmentSerializer(serializer.instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @extend_schema(
        tags=['Tasks'],
        summary='История изменений',
        description='Получить историю изменений задачи.',
        responses={200: TaskHistorySerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """История изменений задачи."""
        task = self.get_object()
        history = task.history.select_related('user').order_by('-created_at')
        serializer = TaskHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Версии результатов',
        description='Получить все версии результатов задачи.',
    )
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Версии результатов."""
        task = self.get_object()
        from .serializers import TaskResultVersionSerializer
        versions = task.result_versions.select_related('submitted_by').prefetch_related('attachments')
        serializer = TaskResultVersionSerializer(versions, many=True)
        return Response(serializer.data)
