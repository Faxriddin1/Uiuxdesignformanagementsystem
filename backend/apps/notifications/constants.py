"""
=============================================================================
Notification Constants
=============================================================================
"""

from django.db import models


class NotificationType(models.TextChoices):
    """
    Типы уведомлений.
    """
    # Задачи
    TASK_ASSIGNED = 'task_assigned', 'Назначена задача'
    TASK_SUBMITTED = 'task_submitted', 'Задача отправлена на проверку'
    TASK_APPROVED = 'task_approved', 'Задача одобрена'
    TASK_REJECTED = 'task_rejected', 'Задача отклонена'
    TASK_DEADLINE = 'task_deadline', 'Приближается срок задачи'
    TASK_OVERDUE = 'task_overdue', 'Задача просрочена'
    TASK_COMMENT = 'task_comment', 'Новый комментарий к задаче'
    TASK_MENTION = 'task_mention', 'Вас упомянули в задаче'
    
    # Проекты
    PROJECT_CREATED = 'project_created', 'Создан проект'
    PROJECT_UPDATED = 'project_updated', 'Проект обновлён'
    PROJECT_STATUS = 'project_status', 'Изменён статус проекта'
    PROJECT_MEMBER_ADDED = 'project_member_added', 'Вы добавлены в проект'
    PROJECT_DEADLINE = 'project_deadline', 'Приближается срок проекта'
    
    # Исследования
    RESEARCH_SUBMITTED = 'research_submitted', 'Исследование на проверке'
    RESEARCH_APPROVED = 'research_approved', 'Исследование одобрено'
    RESEARCH_REJECTED = 'research_rejected', 'Исследование отклонено'
    RESEARCH_ACCESS = 'research_access', 'Вам предоставлен доступ'
    
    # Система
    SYSTEM = 'system', 'Системное уведомление'


class NotificationPriority(models.TextChoices):
    """
    Приоритеты уведомлений.
    """
    LOW = 'low', 'Низкий'
    NORMAL = 'normal', 'Обычный'
    HIGH = 'high', 'Высокий'
    URGENT = 'urgent', 'Срочный'


# Маппинг типов уведомлений на приоритеты
NOTIFICATION_PRIORITY_MAP = {
    NotificationType.TASK_ASSIGNED: NotificationPriority.NORMAL,
    NotificationType.TASK_SUBMITTED: NotificationPriority.NORMAL,
    NotificationType.TASK_APPROVED: NotificationPriority.LOW,
    NotificationType.TASK_REJECTED: NotificationPriority.HIGH,
    NotificationType.TASK_DEADLINE: NotificationPriority.HIGH,
    NotificationType.TASK_OVERDUE: NotificationPriority.URGENT,
    NotificationType.TASK_COMMENT: NotificationPriority.LOW,
    NotificationType.TASK_MENTION: NotificationPriority.NORMAL,
    NotificationType.PROJECT_CREATED: NotificationPriority.LOW,
    NotificationType.PROJECT_UPDATED: NotificationPriority.LOW,
    NotificationType.PROJECT_STATUS: NotificationPriority.NORMAL,
    NotificationType.PROJECT_MEMBER_ADDED: NotificationPriority.NORMAL,
    NotificationType.PROJECT_DEADLINE: NotificationPriority.HIGH,
    NotificationType.RESEARCH_SUBMITTED: NotificationPriority.NORMAL,
    NotificationType.RESEARCH_APPROVED: NotificationPriority.LOW,
    NotificationType.RESEARCH_REJECTED: NotificationPriority.HIGH,
    NotificationType.RESEARCH_ACCESS: NotificationPriority.LOW,
    NotificationType.SYSTEM: NotificationPriority.NORMAL,
}
