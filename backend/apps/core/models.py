"""
=============================================================================
Core Models - Базовые абстрактные модели
=============================================================================

Эти модели используются как базовые классы для всех других моделей проекта.
Они обеспечивают единообразие и переиспользование кода.

ВАЖНО: Изменения в этих моделях влияют на ВСЕ дочерние модели!
Перед изменением убедитесь, что понимаете последствия.
"""

import uuid

from django.db import models
from django.utils import timezone


class UUIDModel(models.Model):
    """
    Абстрактная модель с UUID в качестве первичного ключа.
    
    Почему UUID вместо автоинкремента:
    1. Безопасность: Нельзя угадать ID других объектов
    2. Распределенность: Можно генерировать ID без обращения к БД
    3. Merge: Легко объединять данные из разных источников
    
    Что можно менять безопасно:
    - Ничего (это базовый класс)
    
    Что нельзя менять:
    - Тип поля id (сломает все FK)
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name='ID'
    )
    
    class Meta:
        abstract = True


class TimestampedModel(models.Model):
    """
    Абстрактная модель с полями created_at и updated_at.
    
    Поля обновляются автоматически:
    - created_at: при создании объекта
    - updated_at: при каждом сохранении
    """
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания',
        db_index=True  # Часто используется для сортировки
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        abstract = True
        ordering = ['-created_at']


class BaseModel(UUIDModel, TimestampedModel):
    """
    Базовая модель, объединяющая UUID и timestamps.
    
    Использование:
        class MyModel(BaseModel):
            title = models.CharField(max_length=255)
            
            class Meta(BaseModel.Meta):
                verbose_name = 'Моя модель'
    """
    
    class Meta:
        abstract = True
        ordering = ['-created_at']


class SoftDeleteModel(models.Model):
    """
    Абстрактная модель с мягким удалением.
    
    Вместо физического удаления записи, устанавливается deleted_at.
    Для работы используйте менеджеры:
    - objects: только активные записи
    - all_objects: все записи включая удаленные
    
    Пример:
        Task.objects.all()  # Только не удаленные
        Task.all_objects.all()  # Все включая удаленные
    """
    
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата удаления'
    )
    
    class Meta:
        abstract = True
    
    def delete(self, using=None, keep_parents=False):
        """Мягкое удаление вместо физического."""
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])
    
    def hard_delete(self, using=None, keep_parents=False):
        """Физическое удаление (использовать осторожно!)."""
        super().delete(using=using, keep_parents=keep_parents)
    
    def restore(self):
        """Восстановление удаленной записи."""
        self.deleted_at = None
        self.save(update_fields=['deleted_at'])
    
    @property
    def is_deleted(self) -> bool:
        """Проверка, удалена ли запись."""
        return self.deleted_at is not None


class SoftDeleteManager(models.Manager):
    """Менеджер, возвращающий только активные (не удаленные) записи."""
    
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class AllObjectsManager(models.Manager):
    """Менеджер, возвращающий все записи включая удаленные."""
    pass


class AuditModel(models.Model):
    """
    Абстрактная модель для аудита изменений.
    
    Хранит информацию о том, кто создал и изменил запись.
    
    ВАЖНО: created_by и updated_by заполняются автоматически
    через middleware или в сервисном слое.
    """
    
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created',
        verbose_name='Создано пользователем'
    )
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated',
        verbose_name='Изменено пользователем'
    )
    
    class Meta:
        abstract = True


class FullAuditModel(BaseModel, SoftDeleteModel, AuditModel):
    """
    Полная модель с UUID, timestamps, soft delete и аудитом.
    
    Используйте для важных бизнес-сущностей, где нужна полная
    история изменений.
    
    Включает:
    - UUID первичный ключ
    - created_at, updated_at
    - deleted_at (soft delete)
    - created_by, updated_by
    """
    
    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()
    
    class Meta:
        abstract = True
        ordering = ['-created_at']
