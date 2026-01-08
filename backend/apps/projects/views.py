"""
=============================================================================
Project Views
=============================================================================
"""

from django.db import models

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.pagination import StandardPagination
from services.project_service import ProjectService

from .filters import ProjectFilter
from .models import Project, ProjectMilestone
from .serializers import (
    ProjectCreateSerializer,
    ProjectDetailSerializer,
    ProjectHistorySerializer,
    ProjectListSerializer,
    ProjectMilestoneSerializer,
    ProjectTransitionSerializer,
)


@extend_schema_view(
    list=extend_schema(
        summary='Список проектов',
        description='Возвращает список проектов с фильтрацией.',
        tags=['Projects'],
    ),
    retrieve=extend_schema(
        summary='Детали проекта',
        description='Возвращает детальную информацию о проекте.',
        tags=['Projects'],
    ),
    create=extend_schema(
        summary='Создать проект',
        description='Создаёт новый проект.',
        tags=['Projects'],
    ),
    update=extend_schema(
        summary='Обновить проект',
        description='Полностью обновляет проект.',
        tags=['Projects'],
    ),
    partial_update=extend_schema(
        summary='Частично обновить проект',
        description='Частично обновляет проект.',
        tags=['Projects'],
    ),
    destroy=extend_schema(
        summary='Удалить проект',
        description='Мягко удаляет проект.',
        tags=['Projects'],
    ),
)
class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления проектами.
    """
    
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_class = ProjectFilter
    search_fields = ['title', 'code', 'description']
    ordering_fields = ['created_at', 'end_date', 'priority', 'status', 'progress']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Возвращает queryset проектов в зависимости от роли пользователя.
        """
        user = self.request.user
        queryset = Project.objects.select_related(
            'manager', 'created_by', 'updated_by'
        ).prefetch_related('members', 'milestones')
        
        # Руководители видят все проекты
        if user.role in ['department_head', 'management_head']:
            return queryset
        
        # Руководители подразделений видят проекты своего подразделения
        if user.role == 'division_head':
            return queryset.filter(
                models.Q(division=user.division) |
                models.Q(manager=user) |
                models.Q(members=user)
            ).distinct()
        
        # Сотрудники видят проекты, где они менеджеры или участники
        return queryset.filter(
            models.Q(manager=user) | models.Q(members=user)
        ).distinct()

    def get_serializer_class(self):
        """Выбирает сериализатор в зависимости от действия."""
        if self.action == 'list':
            return ProjectListSerializer
        if self.action == 'create':
            return ProjectCreateSerializer
        return ProjectDetailSerializer

    def perform_create(self, serializer):
        """Создаёт проект через сервис."""
        data = serializer.validated_data
        project = ProjectService.create_project(
            user=self.request.user,
            **data,
        )
        serializer.instance = project

    @extend_schema(
        summary='Перейти к новому статусу',
        description='Выполняет переход проекта к новому статусу.',
        request=ProjectTransitionSerializer,
        responses={200: ProjectDetailSerializer},
        tags=['Projects'],
    )
    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        """Переход к новому статусу проекта."""
        project = self.get_object()
        serializer = ProjectTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_project = ProjectService.transition_status(
                project=project,
                to_status=serializer.validated_data['to_status'],
                user=request.user,
                comment=serializer.validated_data.get('comment', ''),
            )
            return Response(
                ProjectDetailSerializer(updated_project).data
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary='Доступные переходы',
        description='Возвращает список доступных переходов статуса.',
        responses={200: dict},
        tags=['Projects'],
    )
    @action(detail=True, methods=['get'])
    def available_transitions(self, request, pk=None):
        """Возвращает доступные переходы для проекта."""
        project = self.get_object()
        transitions = ProjectService.get_available_transitions(project)
        return Response({'transitions': transitions})

    @extend_schema(
        summary='История проекта',
        description='Возвращает историю изменений проекта.',
        responses={200: ProjectHistorySerializer(many=True)},
        tags=['Projects'],
    )
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Возвращает историю проекта."""
        project = self.get_object()
        history = project.history.select_related('user').all()
        
        page = self.paginate_queryset(history)
        if page is not None:
            serializer = ProjectHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ProjectHistorySerializer(history, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary='Список вех',
        description='Возвращает вехи проекта.',
        responses={200: ProjectMilestoneSerializer(many=True)},
        tags=['Projects'],
    )
    @action(detail=True, methods=['get', 'post'])
    def milestones(self, request, pk=None):
        """Управление вехами проекта."""
        project = self.get_object()
        
        if request.method == 'GET':
            milestones = project.milestones.all()
            serializer = ProjectMilestoneSerializer(milestones, many=True)
            return Response(serializer.data)
        
        # POST - создание вехи
        serializer = ProjectMilestoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        milestone = ProjectService.add_milestone(
            project=project,
            title=serializer.validated_data['title'],
            due_date=serializer.validated_data['due_date'],
            user=request.user,
            description=serializer.validated_data.get('description', ''),
        )
        
        return Response(
            ProjectMilestoneSerializer(milestone).data,
            status=status.HTTP_201_CREATED
        )

    @extend_schema(
        summary='Завершить веху',
        description='Отмечает веху как выполненную.',
        responses={200: ProjectMilestoneSerializer},
        tags=['Projects'],
    )
    @action(detail=True, methods=['post'], url_path='milestones/(?P<milestone_id>[^/.]+)/complete')
    def complete_milestone(self, request, pk=None, milestone_id=None):
        """Завершает веху."""
        project = self.get_object()
        
        try:
            milestone = project.milestones.get(id=milestone_id)
        except ProjectMilestone.DoesNotExist:
            return Response(
                {'error': 'Веха не найдена.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        updated_milestone = ProjectService.complete_milestone(
            milestone=milestone,
            user=request.user,
        )
        
        return Response(ProjectMilestoneSerializer(updated_milestone).data)

    @extend_schema(
        summary='Добавить участника',
        description='Добавляет участника в проект.',
        request={'type': 'object', 'properties': {'user_id': {'type': 'string'}}},
        responses={200: dict},
        tags=['Projects'],
    )
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Добавляет участника в проект."""
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id обязателен.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = ProjectService.add_member(
            project=project,
            user_id=user_id,
            added_by=request.user,
        )
        
        if success:
            return Response({'status': 'ok'})
        return Response(
            {'error': 'Пользователь не найден.'},
            status=status.HTTP_404_NOT_FOUND
        )

    @extend_schema(
        summary='Удалить участника',
        description='Удаляет участника из проекта.',
        request={'type': 'object', 'properties': {'user_id': {'type': 'string'}}},
        responses={200: dict},
        tags=['Projects'],
    )
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Удаляет участника из проекта."""
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id обязателен.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = ProjectService.remove_member(
            project=project,
            user_id=user_id,
            removed_by=request.user,
        )
        
        if success:
            return Response({'status': 'ok'})
        return Response(
            {'error': 'Пользователь не найден.'},
            status=status.HTTP_404_NOT_FOUND
        )

    @extend_schema(
        summary='Задачи проекта',
        description='Возвращает задачи, связанные с проектом.',
        responses={200: dict},
        tags=['Projects'],
    )
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Возвращает задачи проекта."""
        project = self.get_object()
        tasks = project.tasks.select_related('assignee').all()
        
        from apps.tasks.serializers import TaskListSerializer
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = TaskListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)
