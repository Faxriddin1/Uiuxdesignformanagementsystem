"""
=============================================================================
Research Models
=============================================================================
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import FullAuditModel

from .constants import AccessLevel, ResearchPriority, ResearchStatus, ResearchType


class Research(FullAuditModel):
    """
    Модель исследования (R&D).
    
    Исследования имеют гибкий доступ и workflow одобрения.
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
    objectives = models.TextField(
        blank=True,
        default='',
        verbose_name='Цели исследования'
    )
    methodology = models.TextField(
        blank=True,
        default='',
        verbose_name='Методология'
    )
    
    # Тип и статус
    research_type = models.CharField(
        max_length=20,
        choices=ResearchType.choices,
        default=ResearchType.OTHER,
        verbose_name='Тип исследования'
    )
    status = models.CharField(
        max_length=20,
        choices=ResearchStatus.choices,
        default=ResearchStatus.DRAFT,
        db_index=True,
        verbose_name='Статус'
    )
    priority = models.CharField(
        max_length=10,
        choices=ResearchPriority.choices,
        default=ResearchPriority.MEDIUM,
        verbose_name='Приоритет'
    )
    
    # Доступ
    access_level = models.CharField(
        max_length=20,
        choices=AccessLevel.choices,
        default=AccessLevel.DIVISION,
        verbose_name='Уровень доступа'
    )
    
    # Принадлежность
    division = models.CharField(
        max_length=20,
        choices=[('rnd', 'R&D'), ('it_projects', 'IT-проекты')],
        default='rnd',
        db_index=True,
        verbose_name='Подразделение'
    )
    
    # Участники
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='authored_researches',
        verbose_name='Автор'
    )
    contributors = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='contributed_researches',
        verbose_name='Соавторы'
    )
    
    # Сроки
    start_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Дата начала'
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Срок сдачи'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата завершения'
    )
    
    # Результаты
    findings = models.TextField(
        blank=True,
        default='',
        verbose_name='Результаты/Выводы'
    )
    recommendations = models.TextField(
        blank=True,
        default='',
        verbose_name='Рекомендации'
    )
    
    # Связь с проектом (опционально)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='researches',
        verbose_name='Связанный проект'
    )
    
    # Теги
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Теги'
    )
    
    class Meta:
        verbose_name = 'Исследование'
        verbose_name_plural = 'Исследования'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'division']),
            models.Index(fields=['author', 'status']),
        ]

    def __str__(self):
        return self.title

    @property
    def is_overdue(self) -> bool:
        """Проверяет, просрочено ли исследование."""
        if self.due_date and self.status not in [
            ResearchStatus.APPROVED, ResearchStatus.ARCHIVED
        ]:
            return self.due_date < timezone.now().date()
        return False

    @property
    def days_remaining(self) -> int | None:
        """Возвращает количество оставшихся дней."""
        if self.due_date:
            delta = self.due_date - timezone.now().date()
            return delta.days
        return None


class ResearchAccess(models.Model):
    """
    Персональный доступ к исследованию.
    
    Используется когда access_level = 'restricted'.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    research = models.ForeignKey(
        Research,
        on_delete=models.CASCADE,
        related_name='access_grants',
        verbose_name='Исследование'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='research_access',
        verbose_name='Пользователь'
    )
    can_edit = models.BooleanField(
        default=False,
        verbose_name='Может редактировать'
    )
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='granted_research_access',
        verbose_name='Кем выдан'
    )
    granted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата выдачи'
    )

    class Meta:
        verbose_name = 'Доступ к исследованию'
        verbose_name_plural = 'Доступы к исследованиям'
        unique_together = ['research', 'user']

    def __str__(self):
        return f'{self.user} -> {self.research}'


class ResearchAttachment(models.Model):
    """
    Вложения исследования.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    research = models.ForeignKey(
        Research,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='Исследование'
    )
    file = models.FileField(
        upload_to='research_attachments/%Y/%m/',
        verbose_name='Файл'
    )
    filename = models.CharField(
        max_length=255,
        verbose_name='Имя файла'
    )
    file_size = models.PositiveIntegerField(
        default=0,
        verbose_name='Размер файла'
    )
    mime_type = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='MIME-тип'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Загружено'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата загрузки'
    )

    class Meta:
        verbose_name = 'Вложение исследования'
        verbose_name_plural = 'Вложения исследований'
        ordering = ['-created_at']

    def __str__(self):
        return self.filename


class ResearchComment(models.Model):
    """
    Комментарии к исследованию.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    research = models.ForeignKey(
        Research,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Исследование'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Автор'
    )
    text = models.TextField(
        verbose_name='Текст'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Изменено'
    )

    class Meta:
        verbose_name = 'Комментарий к исследованию'
        verbose_name_plural = 'Комментарии к исследованиям'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author} - {self.research}'


class ResearchHistory(models.Model):
    """
    История изменений исследования.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    research = models.ForeignKey(
        Research,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name='Исследование'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
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
        verbose_name = 'История исследования'
        verbose_name_plural = 'История исследований'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.research} - {self.action}'
