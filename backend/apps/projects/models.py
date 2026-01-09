"""
=============================================================================
Project Models
=============================================================================
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import FullAuditModel

from .constants import ProjectPriority, ProjectStatus


class Project(FullAuditModel):
    """
    Модель проекта.
    
    Проект содержит набор связанных задач и имеет 4-шаговый workflow:
    планирование → в работе → проверка → завершено
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name='ID'
    )
    
    # Основная информация
    title = models.CharField(
        max_length=255,
        verbose_name='Название'
    )
    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Описание'
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Код проекта',
        help_text='Уникальный код проекта, например: PRJ-001'
    )
    
    # Статус и приоритет
    status = models.CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.DRAFT,
        db_index=True,
        verbose_name='Статус'
    )
    priority = models.CharField(
        max_length=10,
        choices=ProjectPriority.choices,
        default=ProjectPriority.MEDIUM,
        verbose_name='Приоритет'
    )
    
    # Принадлежность
    division = models.CharField(
        max_length=20,
        choices=[('rnd', 'R&D'), ('it_projects', 'IT-проекты')],
        db_index=True,
        verbose_name='Подразделение'
    )
    
    # Участники
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_projects',
        db_index=True,
        verbose_name='Руководитель проекта'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='project_members',
        blank=True,
        verbose_name='Участники'
    )
    
    # Сроки
    start_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Дата начала'
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Дата окончания'
    )
    
    # Прогресс
    progress = models.PositiveIntegerField(
        default=0,
        verbose_name='Прогресс (%)',
        help_text='0-100'
    )
    
    # Бюджет (опционально)
    budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Бюджет'
    )
    spent = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        verbose_name='Потрачено'
    )
    
    class Meta:
        verbose_name = 'Проект'
        verbose_name_plural = 'Проекты'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'division']),
            models.Index(fields=['manager', 'status']),
        ]

    def __str__(self):
        return f'{self.code}: {self.title}'

    @property
    def is_overdue(self) -> bool:
        """Проверяет, просрочен ли проект."""
        if self.end_date and self.status not in [
            ProjectStatus.COMPLETED, ProjectStatus.CANCELLED
        ]:
            return self.end_date < timezone.now().date()
        return False

    @property
    def days_remaining(self) -> int | None:
        """Возвращает количество оставшихся дней."""
        if self.end_date:
            delta = self.end_date - timezone.now().date()
            return delta.days
        return None

    @property
    def task_count(self) -> int:
        """Количество задач в проекте."""
        return self.tasks.count()

    @property
    def completed_task_count(self) -> int:
        """Количество завершённых задач."""
        return self.tasks.filter(status='approved').count()


class ProjectHistory(models.Model):
    """
    История изменений проекта.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name='Проект'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Пользователь'
    )
    action = models.CharField(
        max_length=50,
        verbose_name='Действие'
    )
    details = models.JSONField(
        default=dict,
        verbose_name='Детали'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата'
    )

    class Meta:
        verbose_name = 'История проекта'
        verbose_name_plural = 'История проектов'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project.code} - {self.action}'


class ProjectMilestone(models.Model):
    """
    Вехи проекта.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='milestones',
        verbose_name='Проект'
    )
    title = models.CharField(
        max_length=255,
        verbose_name='Название'
    )
    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Описание'
    )
    due_date = models.DateField(
        verbose_name='Срок'
    )
    completed = models.BooleanField(
        default=False,
        verbose_name='Выполнено'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата выполнения'
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Порядок'
    )

    class Meta:
        verbose_name = 'Веха'
        verbose_name_plural = 'Вехи'
        ordering = ['order', 'due_date']

    def __str__(self):
        return f'{self.project.code} - {self.title}'
