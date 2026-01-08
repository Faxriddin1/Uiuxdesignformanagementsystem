"""
=============================================================================
Notification Serializers
=============================================================================
"""

from rest_framework import serializers

from apps.accounts.serializers import UserShortSerializer

from .constants import NotificationType
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """
    Сериализатор уведомления.
    """
    sender = UserShortSerializer(read_only=True)
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    related_url = serializers.CharField(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'type_display',
            'priority', 'priority_display',
            'title', 'message', 'data',
            'related_object_type', 'related_object_id', 'related_url',
            'is_read', 'read_at', 'sender', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Сериализатор настроек уведомлений.
    """
    available_types = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificationPreference
        fields = [
            'enabled_types', 'email_enabled', 'push_enabled',
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
            'available_types'
        ]

    def get_available_types(self, obj) -> list[dict]:
        """Возвращает список всех доступных типов уведомлений."""
        return [
            {'value': choice[0], 'label': choice[1]}
            for choice in NotificationType.choices
        ]


class MarkReadSerializer(serializers.Serializer):
    """
    Сериализатор для отметки уведомлений как прочитанных.
    """
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text='Список ID уведомлений. Если пустой - отметить все.'
    )
