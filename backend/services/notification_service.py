"""
=============================================================================
Notification Service - Сервис уведомлений
=============================================================================

Создание и управление уведомлениями.
"""

import logging
from typing import List, Optional, TYPE_CHECKING

from django.contrib.auth import get_user_model
from django.db import transaction

if TYPE_CHECKING:
    from apps.tasks.models import Task
    from apps.projects.models import Project
    from apps.research.models import Research

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationService:
    """
    Сервис для работы с уведомлениями.
    
    MVP реализация - сохранение в БД.
    P1: добавить WebSocket для realtime.
    """
    
    @staticmethod
    @transaction.atomic
    def create_notification(
        user,
        notification_type: str,
        title: str,
        message: str = '',
        related_object_type: str = '',
        related_object_id=None,
        sender=None,
        data: dict = None,
    ):
        """
        Создать уведомление.
        
        Args:
            user: Получатель уведомления
            notification_type: Тип уведомления
            title: Заголовок
            message: Текст сообщения
            related_object_type: Тип связанного объекта (task/project/research)
            related_object_id: ID связанного объекта
            sender: Отправитель
            data: Дополнительные данные
            
        Returns:
            Созданное уведомление
        """
        from apps.notifications.models import Notification
        
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            related_object_type=related_object_type,
            related_object_id=related_object_id,
            sender=sender,
            data=data or {},
        )
        
        logger.info(f"Notification created: {notification.id} for user {user.id}")
        
        # TODO P1: Отправить через WebSocket
        # WebSocketService.send_to_user(user.id, notification)
        
        return notification
    
    @staticmethod
    def notify_task_assigned(task: 'Task', assignee, creator=None):
        """Уведомление о назначении задачи."""
        return NotificationService.create_notification(
            user=assignee,
            notification_type='task_assigned',
            title='Новая задача',
            message=f'Вам назначена задача: {task.title}',
            related_object_type='task',
            related_object_id=task.id,
            sender=creator or task.creator,
            data={'task_type': task.task_type},
        )
    
    @staticmethod
    def notify_task_submitted(task: 'Task', submitted_by):
        """Уведомление об отправке на проверку."""
        reviewers = NotificationService._get_task_reviewers(task)
        
        for reviewer in reviewers:
            NotificationService.create_notification(
                user=reviewer,
                notification_type='task_submitted',
                title='Задача на проверку',
                message=f'Задача "{task.title}" ожидает вашей проверки',
                related_object_type='task',
                related_object_id=task.id,
                sender=submitted_by,
            )
    
    @staticmethod
    def notify_task_returned(task: 'Task', assignee, reviewer, reason: str):
        """Уведомление о возврате задачи."""
        return NotificationService.create_notification(
            user=assignee,
            notification_type='task_rejected',
            title='Задача возвращена',
            message=f'Задача "{task.title}" возвращена на доработку: {reason[:100]}' if reason else f'Задача "{task.title}" возвращена на доработку',
            related_object_type='task',
            related_object_id=task.id,
            sender=reviewer,
        )
    
    @staticmethod
    def notify_task_approved(task: 'Task', assignee, approver):
        """Уведомление об одобрении задачи."""
        return NotificationService.create_notification(
            user=assignee,
            notification_type='task_approved',
            title='Задача одобрена',
            message=f'Задача "{task.title}" была одобрена',
            related_object_type='task',
            related_object_id=task.id,
            sender=approver,
        )
    
    @staticmethod
    def notify_task_rejected(task: 'Task', rejected_by, reason: str = ''):
        """Уведомление об отклонении задачи."""
        if task.assignee:
            return NotificationService.create_notification(
                user=task.assignee,
                notification_type='task_rejected',
                title='Задача отклонена',
                message=f'Причина: {reason}' if reason else 'Требуется доработка',
                related_object_type='task',
                related_object_id=task.id,
                sender=rejected_by,
            )
    
    @staticmethod
    def notify_deadline_approaching(task: 'Task'):
        """Уведомление о приближающемся дедлайне."""
        if task.assignee and task.deadline:
            return NotificationService.create_notification(
                user=task.assignee,
                notification_type='task_deadline',
                title='Приближается срок',
                message=f'Задача "{task.title}" - срок: {task.deadline.strftime("%d.%m.%Y")}',
                related_object_type='task',
                related_object_id=task.id,
            )
    
    @staticmethod
    def notify_project_status_change(
        project: 'Project',
        old_status: str,
        new_status: str,
        changed_by,
    ):
        """Уведомление об изменении статуса проекта."""
        from apps.projects.constants import ProjectStatus
        
        recipients = set()
        if project.manager and project.manager != changed_by:
            recipients.add(project.manager)
        
        for member in project.members.all():
            if member != changed_by:
                recipients.add(member)
        
        old_label = ProjectStatus(old_status).label if old_status else ''
        new_label = ProjectStatus(new_status).label if new_status else ''
        
        for user in recipients:
            NotificationService.create_notification(
                user=user,
                notification_type='project_status',
                title=f'Статус проекта изменён',
                message=f'{project.title}: {old_label} → {new_label}',
                related_object_type='project',
                related_object_id=project.id,
                sender=changed_by,
            )
    
    @staticmethod
    def notify_research_submitted(research: 'Research', submitted_by):
        """Уведомление об отправке исследования на проверку."""
        reviewers = NotificationService._get_research_reviewers(research)
        
        for reviewer in reviewers:
            NotificationService.create_notification(
                user=reviewer,
                notification_type='research_submitted',
                title='Исследование на проверку',
                message=f'Исследование "{research.title}" ожидает проверки',
                related_object_type='research',
                related_object_id=research.id,
                sender=submitted_by,
            )
    
    @staticmethod
    def notify_research_approved(research: 'Research', approved_by):
        """Уведомление об одобрении исследования."""
        if research.author:
            return NotificationService.create_notification(
                user=research.author,
                notification_type='research_approved',
                title='Исследование одобрено',
                message=f'Исследование "{research.title}" было одобрено',
                related_object_type='research',
                related_object_id=research.id,
                sender=approved_by,
            )
    
    @staticmethod
    def notify_research_rejected(research: 'Research', rejected_by, reason: str = ''):
        """Уведомление об отклонении исследования."""
        if research.author:
            return NotificationService.create_notification(
                user=research.author,
                notification_type='research_rejected',
                title='Исследование отклонено',
                message=f'Причина: {reason}' if reason else 'Требуется доработка',
                related_object_type='research',
                related_object_id=research.id,
                sender=rejected_by,
            )
    
    @staticmethod
    def notify_mention(comment, mentioned_user, author):
        """Уведомление об упоминании в комментарии."""
        task = getattr(comment, 'task', None)
        return NotificationService.create_notification(
            user=mentioned_user,
            notification_type='task_mention',
            title='Вас упомянули',
            message=f'{author.full_name} упомянул вас в комментарии',
            related_object_type='task' if task else '',
            related_object_id=task.id if task else None,
            sender=author,
        )
    
    @staticmethod
    def mark_as_read(notification_id, user) -> bool:
        """Отметить уведомление как прочитанное."""
        from apps.notifications.models import Notification
        from django.utils import timezone
        
        updated = Notification.objects.filter(
            id=notification_id,
            user=user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
        return updated > 0
    
    @staticmethod
    def mark_all_as_read(user) -> int:
        """Отметить все уведомления как прочитанные."""
        from apps.notifications.models import Notification
        from django.utils import timezone
        
        return Notification.objects.filter(
            user=user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
    
    @staticmethod
    def get_unread_count(user) -> int:
        """Получить количество непрочитанных уведомлений."""
        from apps.notifications.models import Notification
        
        return Notification.objects.filter(
            user=user,
            is_read=False
        ).count()
    
    @staticmethod
    def _get_task_reviewers(task: 'Task') -> list:
        """Возвращает список проверяющих для задачи."""
        reviewers = []
        
        if task.approval_route == 'self':
            return []
        
        if task.approval_route == 'custom' and task.custom_approver:
            reviewers.append(task.custom_approver)
        elif task.approval_route == 'division_head':
            reviewers = list(User.objects.filter(
                role='division_head',
                division=task.division,
                is_active=True,
            ))
        elif task.approval_route == 'department_head':
            reviewers = list(User.objects.filter(
                role='department_head',
                is_active=True,
            ))
        
        return reviewers
    
    @staticmethod
    def _get_research_reviewers(research: 'Research') -> list:
        """Возвращает список проверяющих для исследования."""
        author_id = research.author_id if research.author else None
        
        reviewers = list(User.objects.filter(
            role__in=['division_head', 'department_head', 'management_head'],
            is_active=True,
        ).exclude(id=author_id))
        
        return reviewers
