"""
=============================================================================
User Models - Модели пользователей
=============================================================================

Кастомная модель пользователя с email в качестве логина.

КРИТИЧНО: AUTH_USER_MODEL нельзя менять после создания миграций!
"""

import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from .constants import Division, UserRole


class UserManager(BaseUserManager):
    """
    Кастомный менеджер для User модели.
    
    Использует email вместо username для аутентификации.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Создание обычного пользователя.
        
        Args:
            email: Email (используется как логин)
            password: Пароль
            **extra_fields: Дополнительные поля (name, role, division, etc.)
        """
        if not email:
            raise ValueError('Email обязателен')
        
        email = self.normalize_email(email)
        
        # Устанавливаем значения по умолчанию
        extra_fields.setdefault('role', UserRole.EMPLOYEE)
        extra_fields.setdefault('is_active', True)
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Создание суперпользователя.
        
        Суперпользователь автоматически получает роль department_head.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', UserRole.DEPARTMENT_HEAD)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Суперпользователь должен иметь is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Суперпользователь должен иметь is_superuser=True')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Кастомная модель пользователя.
    
    Особенности:
    - UUID в качестве первичного ключа
    - Email как логин (вместо username)
    - Роль и отдел как обязательные поля
    
    НЕЛЬЗЯ менять:
    - Тип поля id
    - EMAIL_FIELD
    - USERNAME_FIELD
    
    МОЖНО добавлять:
    - Новые поля профиля
    - Методы
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    # Основные поля
    email = models.EmailField(
        unique=True,
        verbose_name='Email',
        db_index=True
    )
    name = models.CharField(
        max_length=255,
        verbose_name='ФИО'
    )
    
    # Роль и отдел
    role = models.CharField(
        max_length=50,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE,
        verbose_name='Роль',
        db_index=True
    )
    division = models.CharField(
        max_length=50,
        choices=Division.choices,
        default=Division.RND,
        verbose_name='Отдел',
        db_index=True
    )
    
    # Аватар (опционально)
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name='Аватар'
    )
    
    # Служебные поля Django
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name='Доступ в админку'
    )
    date_joined = models.DateTimeField(
        default=timezone.now,
        verbose_name='Дата регистрации'
    )
    last_login = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Последний вход'
    )
    
    objects = UserManager()
    
    EMAIL_FIELD = 'email'
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['name']
        indexes = [
            models.Index(fields=['role', 'division']),
            models.Index(fields=['division']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    # =========================================================================
    # Методы проверки прав
    # =========================================================================
    
    @property
    def is_manager(self) -> bool:
        """Является ли пользователь руководителем."""
        return UserRole.is_manager(self.role)
    
    @property
    def can_approve_tasks(self) -> bool:
        """Может ли пользователь одобрять задачи."""
        return UserRole.can_approve_tasks(self.role)
    
    @property
    def hierarchy_level(self) -> int:
        """Уровень в иерархии (1 - высший)."""
        return UserRole.get_hierarchy_level(self.role)
    
    def is_higher_than(self, other_user: 'User') -> bool:
        """Проверка, что текущий пользователь выше в иерархии."""
        return self.hierarchy_level < other_user.hierarchy_level
    
    def is_same_division(self, other_user: 'User') -> bool:
        """Проверка, что пользователи в одном отделе."""
        return self.division == other_user.division
    
    def can_manage_user(self, other_user: 'User') -> bool:
        """
        Может ли текущий пользователь управлять другим.
        
        Правила:
        - department_head и management_head могут управлять всеми
        - division_head может управлять только своим отделом
        """
        if self.role in [UserRole.DEPARTMENT_HEAD, UserRole.MANAGEMENT_HEAD]:
            return True
        
        if self.role == UserRole.DIVISION_HEAD:
            return self.is_same_division(other_user) and self.is_higher_than(other_user)
        
        return False
    
    # =========================================================================
    # Shortcut методы
    # =========================================================================
    
    @property
    def role_display(self) -> str:
        """Человекочитаемое название роли."""
        return self.get_role_display()
    
    @property
    def division_display(self) -> str:
        """Человекочитаемое название отдела."""
        return self.get_division_display()
    
    def get_all_divisions(self):
        """Возвращает все отделы пользователя (основной + дополнительные)."""
        divisions = [self.division]
        # Добавляем дополнительные отделы из UserDivision
        additional = self.additional_divisions.values_list('division', flat=True)
        divisions.extend(additional)
        return list(set(divisions))  # Уникальные значения
    
    def is_in_division(self, division):
        """Проверяет, работает ли пользователь в указанном отделе."""
        return division in self.get_all_divisions()


class UserDivision(models.Model):
    """
    Дополнительные отделы для пользователя.
    
    Используется для сотрудников, работающих в нескольких отделах.
    Например: Муталов Фахриддин работает в R&D и IT-проектах.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='additional_divisions',
        verbose_name='Пользователь'
    )
    
    division = models.CharField(
        max_length=50,
        choices=Division.choices,
        verbose_name='Дополнительный отдел'
    )
    
    # Кто может ставить задачи из этого отдела
    can_assign_tasks = models.BooleanField(
        default=True,
        verbose_name='Может получать задачи'
    )
    
    class Meta:
        db_table = 'user_divisions'
        verbose_name = 'Дополнительный отдел пользователя'
        verbose_name_plural = 'Дополнительные отделы пользователей'
        unique_together = [['user', 'division']]
    
    def __str__(self):
        return f"{self.user.name} - {self.get_division_display()}"
