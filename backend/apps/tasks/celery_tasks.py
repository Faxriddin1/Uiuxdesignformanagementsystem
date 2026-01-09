"""
Celery Tasks для модуля Tasks
==============================

Фоновые задачи:
- Напоминания о дедлайнах
- Уведомления о просроченных задачах
- Отправка email
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(
    name='apps.tasks.celery_tasks.send_deadline_reminders',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_deadline_reminders(self):
    """
    Отправить напоминания о задачах с дедлайном завтра.
    
    Запускается ежедневно в 9:00 через Celery Beat.
    """
    from apps.tasks.models import Task
    from apps.notifications.models import Notification
    
    try:
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Задачи с дедлайном завтра, которые ещё не завершены
        tasks = Task.objects.filter(
            deadline__date=tomorrow,
            status__in=['draft', 'in_progress', 'pending_review']
        ).select_related('assignee', 'project')
        
        notifications_created = 0
        
        for task in tasks:
            if task.assignee:
                Notification.objects.create(
                    user=task.assignee,
                    notification_type='deadline_reminder',
                    title='Напоминание о дедлайне',
                    message=f'Задача "{task.title}" должна быть выполнена завтра ({tomorrow})',
                    related_task=task,
                )
                notifications_created += 1
                
                logger.info(
                    f'Deadline reminder sent for task {task.id} to user {task.assignee.email}'
                )
        
        logger.info(f'Total deadline reminders sent: {notifications_created}')
        return {'notifications_sent': notifications_created}
        
    except Exception as exc:
        logger.error(f'Error sending deadline reminders: {exc}')
        raise self.retry(exc=exc)


@shared_task(
    name='apps.tasks.celery_tasks.notify_overdue_tasks',
    bind=True,
    max_retries=3,
)
def notify_overdue_tasks(self):
    """
    Уведомить о просроченных задачах.
    
    Запускается каждый час.
    """
    from apps.tasks.models import Task
    from apps.notifications.models import Notification
    
    try:
        now = timezone.now()
        
        # Просроченные незавершённые задачи
        overdue_tasks = Task.objects.filter(
            deadline__lt=now,
            status__in=['draft', 'in_progress', 'pending_review']
        ).exclude(
            # Исключаем задачи, для которых уже отправлено уведомление сегодня
            id__in=Notification.objects.filter(
                notification_type='overdue_task',
                created_at__date=now.date()
            ).values_list('related_task_id', flat=True)
        ).select_related('assignee', 'created_by')
        
        notifications_created = 0
        
        for task in overdue_tasks:
            # Уведомляем исполнителя
            if task.assignee:
                Notification.objects.create(
                    user=task.assignee,
                    notification_type='overdue_task',
                    title='Просроченная задача',
                    message=f'Задача "{task.title}" просрочена! Дедлайн: {task.deadline}',
                    related_task=task,
                )
                notifications_created += 1
            
            # Уведомляем создателя (если это не исполнитель)
            if task.created_by and task.created_by != task.assignee:
                Notification.objects.create(
                    user=task.created_by,
                    notification_type='overdue_task',
                    title='Просроченная задача',
                    message=f'Задача "{task.title}" просрочена исполнителем',
                    related_task=task,
                )
                notifications_created += 1
        
        logger.info(f'Overdue notifications sent: {notifications_created}')
        return {'notifications_sent': notifications_created}
        
    except Exception as exc:
        logger.error(f'Error notifying overdue tasks: {exc}')
        raise self.retry(exc=exc)


@shared_task(name='apps.tasks.celery_tasks.send_task_notification')
def send_task_notification(task_id: str, notification_type: str, recipients: list):
    """
    Отправить уведомление о задаче конкретным получателям.
    
    Args:
        task_id: ID задачи
        notification_type: Тип уведомления
        recipients: Список ID пользователей
    """
    from apps.tasks.models import Task
    from apps.notifications.models import Notification
    from apps.accounts.models import User
    
    try:
        task = Task.objects.get(id=task_id)
        users = User.objects.filter(id__in=recipients)
        
        notification_messages = {
            'task_assigned': f'Вам назначена задача "{task.title}"',
            'task_completed': f'Задача "{task.title}" выполнена',
            'task_approved': f'Задача "{task.title}" одобрена',
            'task_rejected': f'Задача "{task.title}" отклонена',
            'task_comment': f'Новый комментарий к задаче "{task.title}"',
        }
        
        message = notification_messages.get(
            notification_type, 
            f'Обновление по задаче "{task.title}"'
        )
        
        for user in users:
            Notification.objects.create(
                user=user,
                notification_type=notification_type,
                title='Уведомление о задаче',
                message=message,
                related_task=task,
            )
        
        logger.info(f'Task notification sent: {notification_type} for task {task_id}')
        return {'success': True, 'recipients': len(users)}
        
    except Task.DoesNotExist:
        logger.error(f'Task not found: {task_id}')
        return {'success': False, 'error': 'Task not found'}
    except Exception as exc:
        logger.error(f'Error sending task notification: {exc}')
        return {'success': False, 'error': str(exc)}


@shared_task(name='apps.tasks.celery_tasks.send_email_notification')
def send_email_notification(user_id: str, subject: str, message: str):
    """
    Отправить email уведомление пользователю.
    
    Args:
        user_id: ID пользователя
        subject: Тема письма
        message: Текст письма
    """
    from django.core.mail import send_mail
    from django.conf import settings
    from apps.accounts.models import User
    
    try:
        user = User.objects.get(id=user_id)
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        logger.info(f'Email sent to {user.email}: {subject}')
        return {'success': True, 'email': user.email}
        
    except User.DoesNotExist:
        logger.error(f'User not found: {user_id}')
        return {'success': False, 'error': 'User not found'}
    except Exception as exc:
        logger.error(f'Error sending email: {exc}')
        return {'success': False, 'error': str(exc)}
