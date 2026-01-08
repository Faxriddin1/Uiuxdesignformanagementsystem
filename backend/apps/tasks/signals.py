"""
=============================================================================
Task Signals
=============================================================================

Сигналы для автоматических действий при изменении задач.
"""

import logging

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Task, TaskHistory

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Task)
def track_status_change(sender, instance, **kwargs):
    """Отслеживание изменения статуса для истории."""
    if instance.pk:
        try:
            old_instance = Task.all_objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Task.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Task)
def create_history_on_status_change(sender, instance, created, **kwargs):
    """Создание записи истории при изменении статуса."""
    if created:
        # Создание новой задачи
        TaskHistory.objects.create(
            task=instance,
            user=instance.creator,
            action='Создание задачи',
            details=f'Задача "{instance.title}" создана',
        )
    else:
        # Проверяем изменение статуса
        old_status = getattr(instance, '_old_status', None)
        if old_status and old_status != instance.status:
            # Записываем изменение статуса
            # История создается в сервисном слое для более детального контроля
            pass
