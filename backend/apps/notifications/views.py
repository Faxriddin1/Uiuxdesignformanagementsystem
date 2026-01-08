"""
=============================================================================
Notification Views
=============================================================================
"""

from django.db.models import Count, Q
from django.utils import timezone

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination

from .models import Notification, NotificationPreference
from .serializers import (
    MarkReadSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
)


@extend_schema_view(
    list=extend_schema(
        summary='Список уведомлений',
        description='Возвращает уведомления текущего пользователя.',
        tags=['Notifications'],
    ),
    retrieve=extend_schema(
        summary='Детали уведомления',
        description='Возвращает детали уведомления.',
        tags=['Notifications'],
    ),
    destroy=extend_schema(
        summary='Удалить уведомление',
        description='Удаляет уведомление.',
        tags=['Notifications'],
    ),
)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра уведомлений.
    """
    
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        """Возвращает уведомления текущего пользователя."""
        queryset = Notification.objects.filter(
            user=self.request.user
        ).select_related('sender')
        
        # Фильтр по статусу прочтения
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Фильтр по типу
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Фильтр по приоритету
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Удаляет уведомление."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        summary='Отметить как прочитанное',
        description='Отмечает уведомление как прочитанное.',
        responses={200: NotificationSerializer},
        tags=['Notifications'],
    )
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """Отмечает уведомление как прочитанное."""
        notification = self.get_object()
        notification.mark_as_read()
        return Response(NotificationSerializer(notification).data)

    @extend_schema(
        summary='Отметить все как прочитанные',
        description='Отмечает все уведомления как прочитанные.',
        request=MarkReadSerializer,
        responses={200: dict},
        tags=['Notifications'],
    )
    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        """Отмечает все уведомления как прочитанные."""
        serializer = MarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data.get('notification_ids', [])
        
        queryset = Notification.objects.filter(
            user=request.user,
            is_read=False,
        )
        
        if notification_ids:
            queryset = queryset.filter(id__in=notification_ids)
        
        count = queryset.update(is_read=True, read_at=timezone.now())
        
        return Response({
            'status': 'ok',
            'marked_count': count,
        })

    @extend_schema(
        summary='Количество непрочитанных',
        description='Возвращает количество непрочитанных уведомлений.',
        responses={200: dict},
        tags=['Notifications'],
    )
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Возвращает количество непрочитанных уведомлений."""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()
        
        # Также по приоритетам
        by_priority = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).values('priority').annotate(count=Count('id'))
        
        priority_counts = {item['priority']: item['count'] for item in by_priority}
        
        return Response({
            'total': count,
            'by_priority': priority_counts,
        })

    @extend_schema(
        summary='Удалить все прочитанные',
        description='Удаляет все прочитанные уведомления.',
        responses={200: dict},
        tags=['Notifications'],
    )
    @action(detail=False, methods=['post'], url_path='delete-read')
    def delete_read(self, request):
        """Удаляет все прочитанные уведомления."""
        count, _ = Notification.objects.filter(
            user=request.user,
            is_read=True,
        ).delete()
        
        return Response({
            'status': 'ok',
            'deleted_count': count,
        })


class NotificationPreferenceView(APIView):
    """
    API для управления настройками уведомлений.
    """
    
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Получить настройки уведомлений',
        description='Возвращает настройки уведомлений пользователя.',
        responses={200: NotificationPreferenceSerializer},
        tags=['Notifications'],
    )
    def get(self, request):
        """Возвращает настройки уведомлений."""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = NotificationPreferenceSerializer(preferences)
        return Response(serializer.data)

    @extend_schema(
        summary='Обновить настройки уведомлений',
        description='Обновляет настройки уведомлений пользователя.',
        request=NotificationPreferenceSerializer,
        responses={200: NotificationPreferenceSerializer},
        tags=['Notifications'],
    )
    def put(self, request):
        """Обновляет настройки уведомлений."""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = NotificationPreferenceSerializer(
            preferences,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        """Частичное обновление настроек."""
        return self.put(request)
