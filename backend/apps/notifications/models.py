"""
=============================================================================
Notification Models
=============================================================================
"""

import uuid

from django.conf import settings
from django.db import models

from .constants import NOTIFICATION_PRIORITY_MAP, NotificationPriority, NotificationType


class Notification(models.Model):
    """
    Модель уведомления.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name='ID'
    )
    
    # Получатель
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Получатель'
    )
    
    # Тип и приоритет
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        db_index=True,
        verbose_name='Тип'
    )
    priority = models.CharField(
        max_length=10,
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL,
        verbose_name='Приоритет'
    )
    
    # Контент
    title = models.CharField(
        max_length=255,
        verbose_name='Заголовок'
    )
    message = models.TextField(
        blank=True,
        default='',
        verbose_name='Сообщение'
    )
    
    # Связи (generic)
    related_object_type = models.CharField(
        max_length=50,
        blank=True,
        default='',
        verbose_name='Тип связанного объекта'
    )
    related_object_id = models.UUIDField(
        null=True,
        blank=True,
        verbose_name='ID связанного объекта'
    )
    
    # Дополнительные данные
    data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Дополнительные данные'
    )
    
    # Статус
    is_read = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name='Прочитано'
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Время прочтения'
    )
    
    # Отправитель (опционально)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications',
        verbose_name='Отправитель'
    )
    
    # Даты
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Создано'
    )

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['user', 'notification_type']),
        ]

    def __str__(self):
        return f'{self.user} - {self.title}'

    def save(self, *args, **kwargs):
        # Автоматически устанавливаем приоритет по типу
        if not self.priority:
            self.priority = NOTIFICATION_PRIORITY_MAP.get(
                self.notification_type,
                NotificationPriority.NORMAL
            )
        super().save(*args, **kwargs)

    def mark_as_read(self):
        """Отмечает уведомление как прочитанное."""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    @property
    def related_url(self) -> str | None:
        """Возвращает URL связанного объекта для фронтенда."""
        if not self.related_object_type or not self.related_object_id:
            return None
        
        url_map = {
            'task': f'/tasks/{self.related_object_id}',
            'project': f'/projects/{self.related_object_id}',
            'research': f'/research/{self.related_object_id}',
        }
        
        return url_map.get(self.related_object_type)


class NotificationPreference(models.Model):
    """
    Настройки уведомлений пользователя.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        verbose_name='Пользователь'
    )
    
    # Типы уведомлений (которые включены)
    enabled_types = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Включённые типы',
        help_text='Пустой список = все включены'
    )
    
    # Каналы уведомлений
    email_enabled = models.BooleanField(
        default=True,
        verbose_name='Email уведомления'
    )
    push_enabled = models.BooleanField(
        default=True,
        verbose_name='Push уведомления'
    )
    
    # Тихий режим
    quiet_hours_enabled = models.BooleanField(
        default=False,
        verbose_name='Тихий режим'
    )
    quiet_hours_start = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Начало тихого режима'
    )
    quiet_hours_end = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Конец тихого режима'
    )

    class Meta:
        verbose_name = 'Настройки уведомлений'
        verbose_name_plural = 'Настройки уведомлений'

    def __str__(self):
        return f'Настройки уведомлений: {self.user}'

    def is_type_enabled(self, notification_type: str) -> bool:
        """Проверяет, включён ли тип уведомления."""
        if not self.enabled_types:
            return True  # Пустой список = все включены
        return notification_type in self.enabled_types
