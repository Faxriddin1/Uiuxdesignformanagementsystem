"""
=============================================================================
Research Views
=============================================================================
"""

from django.db import models

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.pagination import StandardPagination
from services.research_service import ResearchService

from .filters import ResearchFilter
from .models import Research, ResearchAccess
from .serializers import (
    ResearchAccessSerializer,
    ResearchCommentSerializer,
    ResearchCreateSerializer,
    ResearchDetailSerializer,
    ResearchHistorySerializer,
    ResearchListSerializer,
    ResearchReviewSerializer,
    ResearchSubmitSerializer,
)


@extend_schema_view(
    list=extend_schema(
        summary='Список исследований',
        description='Возвращает список доступных исследований.',
        tags=['Research'],
    ),
    retrieve=extend_schema(
        summary='Детали исследования',
        description='Возвращает детальную информацию об исследовании.',
        tags=['Research'],
    ),
    create=extend_schema(
        summary='Создать исследование',
        description='Создаёт новое исследование.',
        tags=['Research'],
    ),
    update=extend_schema(
        summary='Обновить исследование',
        description='Полностью обновляет исследование.',
        tags=['Research'],
    ),
    partial_update=extend_schema(
        summary='Частично обновить исследование',
        description='Частично обновляет исследование.',
        tags=['Research'],
    ),
    destroy=extend_schema(
        summary='Удалить исследование',
        description='Мягко удаляет исследование.',
        tags=['Research'],
    ),
)
class ResearchViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления исследованиями.
    """
    
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_class = ResearchFilter
    search_fields = ['title', 'description', 'objectives']
    ordering_fields = ['created_at', 'due_date', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Возвращает queryset исследований с учётом доступа.
        """
        user = self.request.user
        queryset = Research.objects.select_related(
            'author', 'project', 'created_by', 'updated_by'
        ).prefetch_related('contributors', 'attachments')
        
        # Руководители видят всё
        if user.role in ['department_head', 'management_head']:
            return queryset
        
        # Руководители подразделений - своё подразделение + публичные
        if user.role == 'division_head':
            return queryset.filter(
                models.Q(division=user.division) |
                models.Q(access_level='public') |
                models.Q(author=user) |
                models.Q(contributors=user) |
                models.Q(access_grants__user=user)
            ).distinct()
        
        # Сотрудники - публичные + своё подразделение (если division) + персональный доступ
        return queryset.filter(
            models.Q(access_level='public') |
            models.Q(access_level='division', division=user.division) |
            models.Q(author=user) |
            models.Q(contributors=user) |
            models.Q(access_grants__user=user)
        ).distinct()

    def get_serializer_class(self):
        """Выбирает сериализатор в зависимости от действия."""
        if self.action == 'list':
            return ResearchListSerializer
        if self.action == 'create':
            return ResearchCreateSerializer
        return ResearchDetailSerializer

    def perform_create(self, serializer):
        """Создаёт исследование через сервис."""
        data = serializer.validated_data
        contributor_ids = data.pop('contributor_ids', [])
        
        research = ResearchService.create_research(
            user=self.request.user,
            contributor_ids=[str(uid) for uid in contributor_ids],
            **data,
        )
        serializer.instance = research

    @extend_schema(
        summary='Начать исследование',
        description='Переводит исследование из черновика в работу.',
        responses={200: ResearchDetailSerializer},
        tags=['Research'],
    )
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Начинает работу над исследованием."""
        research = self.get_object()
        
        try:
            updated = ResearchService.start_research(
                research=research,
                user=request.user,
            )
            return Response(ResearchDetailSerializer(updated, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary='Отправить на проверку',
        description='Отправляет исследование на проверку.',
        request=ResearchSubmitSerializer,
        responses={200: ResearchDetailSerializer},
        tags=['Research'],
    )
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Отправляет исследование на проверку."""
        research = self.get_object()
        serializer = ResearchSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated = ResearchService.submit_for_review(
                research=research,
                user=request.user,
                **serializer.validated_data,
            )
            return Response(ResearchDetailSerializer(updated, context={'request': request}).data)
        except (ValueError, PermissionError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary='Одобрить исследование',
        description='Одобряет исследование.',
        request=ResearchReviewSerializer,
        responses={200: ResearchDetailSerializer},
        tags=['Research'],
    )
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Одобряет исследование."""
        research = self.get_object()
        serializer = ResearchReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated = ResearchService.approve_research(
                research=research,
                user=request.user,
                comment=serializer.validated_data.get('comment', ''),
            )
            return Response(ResearchDetailSerializer(updated, context={'request': request}).data)
        except (ValueError, PermissionError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary='Отклонить исследование',
        description='Отклоняет исследование с комментарием.',
        request=ResearchReviewSerializer,
        responses={200: ResearchDetailSerializer},
        tags=['Research'],
    )
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклоняет исследование."""
        research = self.get_object()
        serializer = ResearchReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated = ResearchService.reject_research(
                research=research,
                user=request.user,
                comment=serializer.validated_data.get('comment', ''),
            )
            return Response(ResearchDetailSerializer(updated, context={'request': request}).data)
        except (ValueError, PermissionError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary='Вернуть в работу',
        description='Возвращает отклонённое исследование в работу.',
        responses={200: ResearchDetailSerializer},
        tags=['Research'],
    )
    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """Возвращает исследование в работу."""
        research = self.get_object()
        
        try:
            updated = ResearchService.reopen_research(
                research=research,
                user=request.user,
            )
            return Response(ResearchDetailSerializer(updated, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary='Архивировать',
        description='Архивирует одобренное исследование.',
        responses={200: ResearchDetailSerializer},
        tags=['Research'],
    )
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Архивирует исследование."""
        research = self.get_object()
        
        try:
            updated = ResearchService.archive_research(
                research=research,
                user=request.user,
            )
            return Response(ResearchDetailSerializer(updated, context={'request': request}).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary='Управление доступом',
        description='Получает список или добавляет персональный доступ.',
        responses={200: ResearchAccessSerializer(many=True)},
        tags=['Research'],
    )
    @action(detail=True, methods=['get', 'post'])
    def access(self, request, pk=None):
        """Управление персональным доступом."""
        research = self.get_object()
        
        if request.method == 'GET':
            access_list = research.access_grants.select_related('user', 'granted_by').all()
            serializer = ResearchAccessSerializer(access_list, many=True)
            return Response(serializer.data)
        
        # POST - выдача доступа
        serializer = ResearchAccessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            access = ResearchService.grant_access(
                research=research,
                user_id=str(serializer.validated_data['user_id']),
                granted_by=request.user,
                can_edit=serializer.validated_data.get('can_edit', False),
            )
            return Response(
                ResearchAccessSerializer(access).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary='Отозвать доступ',
        description='Отзывает персональный доступ пользователя.',
        request={'type': 'object', 'properties': {'user_id': {'type': 'string'}}},
        responses={200: dict},
        tags=['Research'],
    )
    @action(detail=True, methods=['post'], url_path='access/revoke')
    def revoke_access(self, request, pk=None):
        """Отзывает доступ."""
        research = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id обязателен.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = ResearchService.revoke_access(
            research=research,
            user_id=user_id,
            revoked_by=request.user,
        )
        
        if success:
            return Response({'status': 'ok'})
        return Response(
            {'error': 'Доступ не найден.'},
            status=status.HTTP_404_NOT_FOUND
        )

    @extend_schema(
        summary='Комментарии',
        description='Получает или добавляет комментарии к исследованию.',
        responses={200: ResearchCommentSerializer(many=True)},
        tags=['Research'],
    )
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Управление комментариями."""
        research = self.get_object()
        
        if request.method == 'GET':
            comments = research.comments.select_related('author').all()
            serializer = ResearchCommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        # POST
        serializer = ResearchCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from .models import ResearchComment
        comment = ResearchComment.objects.create(
            research=research,
            author=request.user,
            text=serializer.validated_data['text'],
        )
        
        return Response(
            ResearchCommentSerializer(comment).data,
            status=status.HTTP_201_CREATED
        )

    @extend_schema(
        summary='История исследования',
        description='Возвращает историю изменений исследования.',
        responses={200: ResearchHistorySerializer(many=True)},
        tags=['Research'],
    )
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Возвращает историю исследования."""
        research = self.get_object()
        history = research.history.select_related('user').all()
        
        page = self.paginate_queryset(history)
        if page is not None:
            serializer = ResearchHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ResearchHistorySerializer(history, many=True)
        return Response(serializer.data)
