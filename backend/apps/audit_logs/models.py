"""
Модели для системы аудита и логирования.

Логируем:
- Входы в систему (IP, user agent, время)
- Изменения данных (CRUD операции)
- Просмотры объектов
- Экспорты данных
- Изменения настроек
"""

import uuid
from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.conf import settings


class AuditLog(models.Model):
    """
    Основная модель для хранения логов всех действий в системе.
    """
    
    class ActionType(models.TextChoices):
        # Аутентификация
        LOGIN = 'login', 'Вход в систему'
        LOGOUT = 'logout', 'Выход из системы'
        LOGIN_FAILED = 'login_failed', 'Неудачная попытка входа'
        
        # CRUD операции
        CREATE = 'create', 'Создание'
        READ = 'read', 'Просмотр'
        UPDATE = 'update', 'Изменение'
        DELETE = 'delete', 'Удаление'
        
        # Специфичные действия
        EXPORT = 'export', 'Экспорт данных'
        IMPORT = 'import', 'Импорт данных'
        STATUS_CHANGE = 'status_change', 'Изменение статуса'
        ASSIGNMENT = 'assignment', 'Назначение'
        APPROVAL = 'approval', 'Утверждение'
        REJECTION = 'rejection', 'Отклонение'
        COMMENT = 'comment', 'Комментарий'
        FILE_UPLOAD = 'file_upload', 'Загрузка файла'
        FILE_DOWNLOAD = 'file_download', 'Скачивание файла'
        
        # Настройки
        SETTINGS_CHANGE = 'settings_change', 'Изменение настроек'
        PERMISSION_CHANGE = 'permission_change', 'Изменение прав доступа'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Пользователь, совершивший действие
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        verbose_name='Пользователь'
    )
    
    # Тип действия
    action = models.CharField(
        max_length=50,
        choices=ActionType.choices,
        db_index=True,
        verbose_name='Действие'
    )
    
    # IP адрес
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name='IP адрес'
    )
    
    # User Agent (браузер)
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent'
    )
    
    # Время действия
    timestamp = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Время'
    )
    
    # Объект, над которым совершено действие (Generic Foreign Key)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    object_id = models.CharField(max_length=255, null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Описание объекта (на случай если объект удален)
    object_repr = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Представление объекта'
    )
    
    # Дополнительные данные в JSON
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Дополнительные данные'
    )
    
    # Изменения (для UPDATE действий)
    changes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Изменения',
        help_text='Формат: {"field_name": {"old": "old_value", "new": "new_value"}}'
    )
    
    # URL запроса
    request_url = models.CharField(
        max_length=2000,
        blank=True,
        verbose_name='URL запроса'
    )
    
    # HTTP метод
    request_method = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='HTTP метод'
    )
    
    # Успешность операции
    success = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Успешно'
    )
    
    # Сообщение об ошибке (если success=False)
    error_message = models.TextField(
        blank=True,
        verbose_name='Сообщение об ошибке'
    )
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        verbose_name = 'Лог аудита'
        verbose_name_plural = 'Логи аудита'
        indexes = [
            models.Index(fields=['-timestamp', 'user']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else 'Аноним'
        return f"{user_str} - {self.get_action_display()} - {self.timestamp}"


class LoginHistory(models.Model):
    """
    История входов в систему (отдельная таблица для быстрого доступа).
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_index=True,
        verbose_name='Пользователь'
    )
    
    ip_address = models.GenericIPAddressField(
        db_index=True,
        verbose_name='IP адрес'
    )
    
    user_agent = models.TextField(
        verbose_name='User Agent'
    )
    
    timestamp = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Время входа'
    )
    
    success = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='Успешный вход'
    )
    
    failure_reason = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Причина неудачи'
    )
    
    session_key = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Ключ сессии'
    )
    
    # Геолокация (опционально)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'login_history'
        ordering = ['-timestamp']
        verbose_name = 'История входа'
        verbose_name_plural = 'История входов'
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
        ]
    
    def __str__(self):
        status = '✓' if self.success else '✗'
        email = self.user.email if self.user else 'Unknown'
        return f"{status} {email} from {self.ip_address} at {self.timestamp}"


class DataExport(models.Model):
    """
    Логи экспорта данных (важно для безопасности).
    """
    
    class ExportFormat(models.TextChoices):
        CSV = 'csv', 'CSV'
        EXCEL = 'excel', 'Excel'
        PDF = 'pdf', 'PDF'
        JSON = 'json', 'JSON'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        verbose_name='Пользователь'
    )
    
    export_type = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name='Тип экспорта',
        help_text='Например: tasks, projects, users'
    )
    
    format = models.CharField(
        max_length=20,
        choices=ExportFormat.choices,
        verbose_name='Формат'
    )
    
    filters = models.JSONField(
        default=dict,
        verbose_name='Примененные фильтры'
    )
    
    record_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Количество записей'
    )
    
    file_size = models.PositiveIntegerField(
        default=0,
        verbose_name='Размер файла (байты)'
    )
    
    ip_address = models.GenericIPAddressField(
        verbose_name='IP адрес'
    )
    
    timestamp = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Время экспорта'
    )
    
    class Meta:
        db_table = 'data_exports'
        ordering = ['-timestamp']
        verbose_name = 'Экспорт данных'
        verbose_name_plural = 'Экспорты данных'
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['export_type', '-timestamp']),
        ]
    
    def __str__(self):
        email = self.user.email if self.user else 'Unknown'
        return f"{email} - {self.export_type} ({self.format}) - {self.timestamp}"
