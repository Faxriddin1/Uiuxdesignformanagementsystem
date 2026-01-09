"""
=============================================================================
External Package Views
=============================================================================
"""

from django.db import models
from django.utils import timezone

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.pagination import StandardPagination

from .models import ExternalPackage, PackageLogEntry
from .serializers import (
    ExternalPackageCreateSerializer,
    ExternalPackageDetailSerializer,
    ExternalPackageListSerializer,
)


@extend_schema_view(
    list=extend_schema(
        summary='Список внешних пакетов',
        description='Возвращает список внешних пакетов с фильтрацией.',
        tags=['External Packages'],
    ),
    retrieve=extend_schema(
        summary='Детали пакета',
        description='Возвращает детальную информацию о пакете.',
        tags=['External Packages'],
    ),
    create=extend_schema(
        summary='Создать пакет',
        description='Создаёт новый внешний пакет.',
        tags=['External Packages'],
    ),
    update=extend_schema(
        summary='Обновить пакет',
        description='Полностью обновляет пакет.',
        tags=['External Packages'],
    ),
    partial_update=extend_schema(
        summary='Частично обновить пакет',
        description='Частично обновляет пакет.',
        tags=['External Packages'],
    ),
    destroy=extend_schema(
        summary='Удалить пакет',
        description='Мягко удаляет пакет.',
        tags=['External Packages'],
    ),
)
class ExternalPackageViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления внешними пакетами.
    """
    
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    search_fields = ['title', 'recipient', 'description']
    ordering_fields = ['created_at', 'sent_at', 'expected_response_date', 'status']
    ordering = ['-created_at']
    filterset_fields = ['status', 'division', 'channel', 'responsible']

    def get_queryset(self):
        """
        Возвращает queryset пакетов в зависимости от роли пользователя.
        """
        user = self.request.user
        queryset = ExternalPackage.objects.select_related(
            'responsible', 'created_by', 'updated_by',
            'linked_task', 'linked_project'
        ).prefetch_related('log_entries')
        
        # Руководители видят все пакеты
        if user.role in ['department_head', 'management_head']:
            return queryset
        
        # Руководители подразделений видят пакеты своего подразделения
        if user.role == 'division_head':
            return queryset.filter(
                models.Q(division=user.division) |
                models.Q(responsible=user) |
                models.Q(created_by=user)
            ).distinct()
        
        # Сотрудники видят только свои пакеты
        return queryset.filter(
            models.Q(responsible=user) | models.Q(created_by=user)
        ).distinct()

    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия."""
        if self.action == 'list':
            return ExternalPackageListSerializer
        elif self.action == 'create':
            return ExternalPackageCreateSerializer
        return ExternalPackageDetailSerializer

    def perform_create(self, serializer):
        """Создание пакета с установкой created_by."""
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        """Обновление пакета с установкой updated_by."""
        serializer.save(updated_by=self.request.user)

    @extend_schema(
        summary='Отправить пакет',
        description='Помечает пакет как отправленный',
        tags=['External Packages'],
    )
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """
        Отправить пакет.
        """
        package = self.get_object()
        
        if package.status != 'draft':
            return Response(
                {'detail': 'Можно отправить только черновик'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        package.mark_sent()
        
        # Создаем запись в журнале
        PackageLogEntry.objects.create(
            package=package,
            action='sent',
            user=request.user,
            notes=request.data.get('notes', 'Пакет отправлен')
        )
        
        serializer = self.get_serializer(package)
        return Response(serializer.data)

    @extend_schema(
        summary='Пометить как ожидающий',
        description='Переводит пакет в статус ожидания ответа',
        tags=['External Packages'],
    )
    @action(detail=True, methods=['post'])
    def mark_awaiting(self, request, pk=None):
        """
        Пометить пакет как ожидающий ответа.
        """
        package = self.get_object()
        
        if package.status != 'sent':
            return Response(
                {'detail': 'Можно перевести в ожидание только отправленный пакет'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        package.mark_awaiting()
        
        # Создаем запись в журнале
        PackageLogEntry.objects.create(
            package=package,
            action='awaiting',
            user=request.user,
            notes=request.data.get('notes', 'Переведен в статус ожидания')
        )
        
        serializer = self.get_serializer(package)
        return Response(serializer.data)

    @extend_schema(
        summary='Пометить как полученный',
        description='Помечает пакет как полученный (получен ответ)',
        tags=['External Packages'],
    )
    @action(detail=True, methods=['post'])
    def mark_received(self, request, pk=None):
        """
        Пометить получение ответа.
        """
        package = self.get_object()
        
        if package.status not in ['sent', 'awaiting']:
            return Response(
                {'detail': 'Можно отметить получение только для отправленного/ожидающего пакета'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        package.mark_received()
        
        # Создаем запись в журнале
        PackageLogEntry.objects.create(
            package=package,
            action='received',
            user=request.user,
            notes=request.data.get('notes', 'Ответ получен')
        )
        
        serializer = self.get_serializer(package)
        return Response(serializer.data)

    @extend_schema(
        summary='Эскалировать пакет',
        description='Эскалирует пакет (если нет ответа)',
        tags=['External Packages'],
    )
    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        """
        Эскалировать пакет.
        """
        package = self.get_object()
        
        if package.status in ['draft', 'received']:
            return Response(
                {'detail': 'Нельзя эскалировать черновик или полученный пакет'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        package.escalate()
        
        # Создаем запись в журнале
        reason = request.data.get('reason', 'Эскалация')
        PackageLogEntry.objects.create(
            package=package,
            action='escalated',
            user=request.user,
            notes=reason
        )
        
        serializer = self.get_serializer(package)
        return Response(serializer.data)

    @extend_schema(
        summary='История пакета',
        description='Возвращает журнал всех действий с пакетом',
        tags=['External Packages'],
    )
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Получить историю пакета.
        """
        package = self.get_object()
        log_entries = package.log_entries.all()
        
        from .serializers import PackageLogEntrySerializer
        serializer = PackageLogEntrySerializer(log_entries, many=True)
        return Response(serializer.data)
