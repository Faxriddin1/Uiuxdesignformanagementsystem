"""
=============================================================================
External Package Models
=============================================================================
Модели для трекинга внешних пакетов документов
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import FullAuditModel


class ExternalPackageStatus(models.TextChoices):
    """Статусы внешнего пакета"""
    DRAFT = 'draft', 'Черновик'
    SENT = 'sent', 'Отправлен'
    AWAITING = 'awaiting', 'Ожидание ответа'
    RECEIVED = 'received', 'Результат получен'
    ESCALATED = 'escalated', 'Эскалация'


class ExternalPackageChannel(models.TextChoices):
    """Каналы отправки пакетов"""
    EMAIL = 'email', 'Email'
    SED = 'sed', 'СЭД'
    COURIER = 'courier', 'Курьер'
    OTHER = 'other', 'Другое'


class ExternalPackage(FullAuditModel):
    """
    Модель внешнего пакета документов.
    
    Используется для трекинга отправки и получения документов
    во внешние департаменты или организации.
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
        verbose_name='Название пакета'
    )
    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Описание'
    )
    
    # Адресат и канал
    recipient = models.CharField(
        max_length=255,
        verbose_name='Адресат',
        help_text='Внешний департамент или организация'
    )
    channel = models.CharField(
        max_length=20,
        choices=ExternalPackageChannel.choices,
        default=ExternalPackageChannel.EMAIL,
        verbose_name='Канал отправки'
    )
    
    # Статус
    status = models.CharField(
        max_length=20,
        choices=ExternalPackageStatus.choices,
        default=ExternalPackageStatus.DRAFT,
        db_index=True,
        verbose_name='Статус'
    )
    
    # Принадлежность
    division = models.CharField(
        max_length=20,
        choices=[('rnd', 'R&D'), ('it_projects', 'IT-проекты')],
        db_index=True,
        verbose_name='Подразделение'
    )
    
    # Ответственные
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responsible_packages',
        db_index=True,
        verbose_name='Ответственный'
    )
    
    # Связи с другими объектами
    linked_task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='external_packages',
        verbose_name='Связанная задача'
    )
    linked_project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='external_packages',
        verbose_name='Связанный проект'
    )
    
    # Временные метки
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата отправки'
    )
    expected_response_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Ожидаемая дата ответа'
    )
    received_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата получения ответа'
    )
    escalated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата эскалации'
    )
    
    class Meta:
        db_table = 'external_packages'
        verbose_name = 'Внешний пакет'
        verbose_name_plural = 'Внешние пакеты'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['division', 'status']),
            models.Index(fields=['responsible', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    def is_overdue(self):
        """Проверяет, просрочен ли ожидаемый ответ"""
        if not self.expected_response_date or self.status == ExternalPackageStatus.RECEIVED:
            return False
        return timezone.now().date() > self.expected_response_date
    
    def mark_sent(self, commit=True):
        """Отметить пакет как отправленный"""
        self.status = ExternalPackageStatus.SENT
        self.sent_at = timezone.now()
        if commit:
            self.save(update_fields=['status', 'sent_at', 'updated_at'])
    
    def mark_awaiting(self, commit=True):
        """Перевести в статус ожидания ответа"""
        self.status = ExternalPackageStatus.AWAITING
        if commit:
            self.save(update_fields=['status', 'updated_at'])
    
    def mark_received(self, commit=True):
        """Отметить получение ответа"""
        self.status = ExternalPackageStatus.RECEIVED
        self.received_at = timezone.now()
        if commit:
            self.save(update_fields=['status', 'received_at', 'updated_at'])
    
    def escalate(self, commit=True):
        """Эскалировать пакет"""
        self.status = ExternalPackageStatus.ESCALATED
        self.escalated_at = timezone.now()
        if commit:
            self.save(update_fields=['status', 'escalated_at', 'updated_at'])


class PackageLogEntry(models.Model):
    """
    Журнал событий пакета.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    package = models.ForeignKey(
        ExternalPackage,
        on_delete=models.CASCADE,
        related_name='log_entries',
        verbose_name='Пакет'
    )
    
    action = models.CharField(
        max_length=50,
        verbose_name='Действие',
        help_text='Например: created, sent, received, escalated'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Пользователь'
    )
    
    notes = models.TextField(
        blank=True,
        default='',
        verbose_name='Примечания'
    )
    
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Время'
    )
    
    class Meta:
        db_table = 'package_log_entries'
        verbose_name = 'Запись журнала пакета'
        verbose_name_plural = 'Записи журнала пакетов'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.package.title} - {self.action} ({self.timestamp})"
