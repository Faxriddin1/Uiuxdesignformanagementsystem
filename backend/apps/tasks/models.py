"""
=============================================================================
Task Models - Модели задач
=============================================================================
"""

import os
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.accounts.constants import Division
from apps.core.models import BaseModel, FullAuditModel, SoftDeleteManager, AllObjectsManager

from .constants import (
    ApprovalRoute,
    ResultVersionStatus,
    TaskCategory,
    TaskPriority,
    TaskStatus,
    TaskType,
)


def task_attachment_path(instance, filename):
    """Генерация пути для вложений задачи."""
    ext = os.path.splitext(filename)[1]
    new_filename = f"{uuid.uuid4()}{ext}"
    return f"tasks/{instance.task_id}/attachments/{new_filename}"


class Task(FullAuditModel):
    """
    Модель задачи.
    
    Ключевые особенности:
    - Типы T1/T2 с разными маршрутами приемки
    - Двухуровневая система проверки
    - Версионирование результатов
    - Мягкое удаление
    
    Связи:
    - assignee: основной исполнитель
    - co_assignees: соисполнители
    - creator: создатель задачи
    - project: связанный проект (опционально)
    """
    
    # Основные поля
    title = models.CharField(
        max_length=500,
        verbose_name='Название'
    )
    description = models.TextField(
        verbose_name='Описание'
    )
    
    # Тип и статус
    task_type = models.CharField(
        max_length=10,
        choices=TaskType.choices,
        default=TaskType.T2,
        verbose_name='Тип задачи',
        db_index=True
    )
    status = models.CharField(
        max_length=50,
        choices=TaskStatus.choices,
        default=TaskStatus.NEW,
        verbose_name='Статус',
        db_index=True
    )
    priority = models.CharField(
        max_length=20,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM,
        verbose_name='Приоритет',
        db_index=True
    )
    category = models.CharField(
        max_length=50,
        choices=TaskCategory.choices,
        default=TaskCategory.STANDARD,
        verbose_name='Категория'
    )
    
    # Отдел
    division = models.CharField(
        max_length=50,
        choices=Division.choices,
        verbose_name='Отдел',
        db_index=True
    )
    
    # Участники
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='assigned_tasks',
        verbose_name='Исполнитель'
    )
    co_assignees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='co_assigned_tasks',
        blank=True,
        verbose_name='Соисполнители'
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_tasks',
        verbose_name='Создатель'
    )
    
    # Сроки
    deadline = models.DateField(
        verbose_name='Дедлайн',
        db_index=True
    )
    
    # Маршрут приемки
    approval_route = models.CharField(
        max_length=50,
        choices=ApprovalRoute.choices,
        default=ApprovalRoute.DIVISION_THEN_MANAGEMENT,
        verbose_name='Маршрут приемки'
    )
    custom_approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='custom_approval_tasks',
        verbose_name='Кастомный принимающий'
    )
    
    # Связь с проектом
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        verbose_name='Проект'
    )
    
    # Флаги
    is_self_assigned = models.BooleanField(
        default=False,
        verbose_name='Самопостановка'
    )
    
    # Текущая версия результата
    current_result_version = models.PositiveIntegerField(
        default=0,
        verbose_name='Номер текущей версии результата'
    )
    
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()
    
    class Meta:
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'deadline']),
            models.Index(fields=['assignee', 'status']),
            models.Index(fields=['division', 'status']),
            models.Index(fields=['task_type', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    @property
    def is_overdue(self) -> bool:
        """Проверка просроченности."""
        if self.status == TaskStatus.ACCEPTED:
            return False
        return self.deadline < timezone.now().date()
    
    @property
    def days_until_deadline(self) -> int:
        """Дней до дедлайна (отрицательное если просрочено)."""
        delta = self.deadline - timezone.now().date()
        return delta.days
    
    @property
    def is_under_review(self) -> bool:
        """Находится ли задача на рассмотрении."""
        return self.status in [
            TaskStatus.UNDER_DIVISION_REVIEW,
            TaskStatus.UNDER_MANAGEMENT_REVIEW
        ]
    
    @property
    def is_active(self) -> bool:
        """Активна ли задача (не закрыта)."""
        return self.status != TaskStatus.ACCEPTED


class TaskResultVersion(BaseModel):
    """
    Версия результата задачи.
    
    Хранит историю всех отправленных результатов.
    """
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='result_versions',
        verbose_name='Задача'
    )
    version = models.PositiveIntegerField(
        verbose_name='Номер версии'
    )
    result_description = models.TextField(
        verbose_name='Описание результата'
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='submitted_results',
        verbose_name='Кто отправил'
    )
    submitted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Когда отправлено'
    )
    status = models.CharField(
        max_length=20,
        choices=ResultVersionStatus.choices,
        default=ResultVersionStatus.CURRENT,
        verbose_name='Статус версии'
    )
    
    # Причины возврата/отзыва
    withdraw_reason = models.TextField(
        blank=True,
        verbose_name='Причина отзыва'
    )
    rejection_reason = models.TextField(
        blank=True,
        verbose_name='Причина возврата'
    )
    
    class Meta:
        verbose_name = 'Версия результата'
        verbose_name_plural = 'Версии результатов'
        ordering = ['-version']
        unique_together = ['task', 'version']
    
    def __str__(self):
        return f"Версия {self.version} задачи {self.task_id}"


class TaskAttachment(BaseModel):
    """
    Вложение к задаче.
    """
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='Задача'
    )
    result_version = models.ForeignKey(
        TaskResultVersion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attachments',
        verbose_name='Версия результата'
    )
    
    name = models.CharField(
        max_length=255,
        verbose_name='Имя файла'
    )
    file = models.FileField(
        upload_to=task_attachment_path,
        verbose_name='Файл'
    )
    file_type = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='MIME тип'
    )
    file_size = models.PositiveIntegerField(
        default=0,
        verbose_name='Размер (байт)'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='uploaded_attachments',
        verbose_name='Загрузил'
    )
    
    class Meta:
        verbose_name = 'Вложение'
        verbose_name_plural = 'Вложения'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class TaskComment(BaseModel):
    """
    Комментарий к задаче.
    """
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Задача'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='task_comments',
        verbose_name='Автор'
    )
    text = models.TextField(
        verbose_name='Текст'
    )
    
    # Флаг для комментариев-причин возврата
    is_return_reason = models.BooleanField(
        default=False,
        verbose_name='Причина возврата'
    )
    
    # Упоминания (@mentions)
    mentions = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='mentioned_in_comments',
        blank=True,
        verbose_name='Упоминания'
    )
    
    class Meta:
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Комментарий от {self.author} к {self.task_id}"


class TaskHistory(BaseModel):
    """
    История изменений задачи (audit log).
    """
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name='Задача'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='task_history_entries',
        verbose_name='Пользователь'
    )
    action = models.CharField(
        max_length=100,
        verbose_name='Действие'
    )
    details = models.TextField(
        blank=True,
        verbose_name='Детали'
    )
    
    # Опционально: сохраняем изменения полей
    field_changes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Изменения полей'
    )
    
    class Meta:
        verbose_name = 'Запись истории'
        verbose_name_plural = 'История изменений'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} - {self.task_id}"
