"""
Celery Tasks для модуля Notifications
======================================

Фоновые задачи:
- Очистка старых уведомлений
- Массовая рассылка
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(
    name='apps.notifications.celery_tasks.cleanup_old_notifications',
    bind=True,
    max_retries=3,
)
def cleanup_old_notifications(self, days: int = 90):
    """
    Удалить прочитанные уведомления старше N дней.
    
    Args:
        days: Количество дней (по умолчанию 90)
    
    Запускается ежедневно в 3:00 через Celery Beat.
    """
    from apps.notifications.models import Notification
    
    try:
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Удаляем только прочитанные старые уведомления
        deleted_count, _ = Notification.objects.filter(
            is_read=True,
            created_at__lt=cutoff_date
        ).delete()
        
        logger.info(f'Cleaned up {deleted_count} old notifications (older than {days} days)')
        
        return {
            'deleted_count': deleted_count,
            'cutoff_date': cutoff_date.isoformat(),
        }
        
    except Exception as exc:
        logger.error(f'Error cleaning up notifications: {exc}')
        raise self.retry(exc=exc)


@shared_task(name='apps.notifications.celery_tasks.send_bulk_notification')
def send_bulk_notification(
    user_ids: list,
    notification_type: str,
    title: str,
    message: str,
    related_object_type: str = None,
    related_object_id: str = None,
):
    """
    Массовая отправка уведомлений группе пользователей.
    
    Args:
        user_ids: Список ID пользователей
        notification_type: Тип уведомления
        title: Заголовок
        message: Текст уведомления
        related_object_type: Тип связанного объекта (task, project, research)
        related_object_id: ID связанного объекта
    """
    from apps.notifications.models import Notification
    from apps.accounts.models import User
    
    try:
        users = User.objects.filter(id__in=user_ids)
        
        notifications = []
        for user in users:
            notification = Notification(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
            )
            
            # Добавляем связь с объектом если указано
            if related_object_type and related_object_id:
                if related_object_type == 'task':
                    notification.related_task_id = related_object_id
                elif related_object_type == 'project':
                    notification.related_project_id = related_object_id
                elif related_object_type == 'research':
                    notification.related_research_id = related_object_id
            
            notifications.append(notification)
        
        # Bulk create для эффективности
        Notification.objects.bulk_create(notifications)
        
        logger.info(f'Bulk notification sent to {len(notifications)} users')
        
        return {
            'success': True,
            'notifications_created': len(notifications),
        }
        
    except Exception as exc:
        logger.error(f'Error sending bulk notification: {exc}')
        return {'success': False, 'error': str(exc)}


@shared_task(name='apps.notifications.celery_tasks.mark_all_as_read')
def mark_all_as_read(user_id: str):
    """
    Отметить все уведомления пользователя как прочитанные.
    
    Args:
        user_id: ID пользователя
    """
    from apps.notifications.models import Notification
    
    try:
        updated_count = Notification.objects.filter(
            user_id=user_id,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        logger.info(f'Marked {updated_count} notifications as read for user {user_id}')
        
        return {
            'success': True,
            'updated_count': updated_count,
        }
        
    except Exception as exc:
        logger.error(f'Error marking notifications as read: {exc}')
        return {'success': False, 'error': str(exc)}
