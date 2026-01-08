"""
=============================================================================
Константы для модуля Accounts
=============================================================================

Централизованное хранение всех констант, связанных с пользователями и ролями.
Изменения здесь влияют на всю систему прав!

ВАЖНО: При изменении значений требуется миграция данных!
"""

from django.db import models


class UserRole(models.TextChoices):
    """
    Роли пользователей в системе.
    
    Иерархия (от высшей к низшей):
    1. DEPARTMENT_HEAD - Начальник Департамента (полный доступ)
    2. MANAGEMENT_HEAD - Начальник Управления
    3. DIVISION_HEAD - Начальник отдела
    4. EMPLOYEE - Сотрудник
    
    НЕЛЬЗЯ менять значения (value) без миграции данных!
    Можно менять label (отображаемое имя).
    """
    
    DEPARTMENT_HEAD = 'department_head', 'Начальник Департамента'
    MANAGEMENT_HEAD = 'management_head', 'Начальник Управления'
    DIVISION_HEAD = 'division_head', 'Начальник отдела'
    EMPLOYEE = 'employee', 'Сотрудник'
    
    @classmethod
    def get_hierarchy_level(cls, role: str) -> int:
        """
        Получить уровень в иерархии (чем меньше, тем выше).
        
        Используется для проверки "кто кого может назначать/проверять".
        """
        hierarchy = {
            cls.DEPARTMENT_HEAD: 1,
            cls.MANAGEMENT_HEAD: 2,
            cls.DIVISION_HEAD: 3,
            cls.EMPLOYEE: 4,
        }
        return hierarchy.get(role, 99)
    
    @classmethod
    def is_manager(cls, role: str) -> bool:
        """Является ли роль руководящей."""
        return role in [cls.DEPARTMENT_HEAD, cls.MANAGEMENT_HEAD, cls.DIVISION_HEAD]
    
    @classmethod
    def can_approve_tasks(cls, role: str) -> bool:
        """Может ли роль одобрять задачи."""
        return role in [cls.DEPARTMENT_HEAD, cls.MANAGEMENT_HEAD, cls.DIVISION_HEAD]


class Division(models.TextChoices):
    """
    Отделы/подразделения.
    
    Соответствует структуре из фронтенда.
    Можно расширять, добавляя новые отделы.
    """
    
    RND = 'rnd', 'Отдел R&D'
    IT_PROJECTS = 'it_projects', 'Отдел IT-проектов'
    
    @classmethod
    def get_display_name(cls, division: str) -> str:
        """Получить отображаемое имя отдела."""
        for choice in cls.choices:
            if choice[0] == division:
                return choice[1]
        return division


# =============================================================================
# Матрица прав доступа
# =============================================================================
# Определяет какие действия доступны каким ролям
# Используется в permission classes

ROLE_PERMISSIONS = {
    UserRole.DEPARTMENT_HEAD: {
        'can_create_tasks': True,
        'can_assign_any_user': True,
        'can_approve_all_tasks': True,
        'can_view_all_tasks': True,
        'can_view_all_projects': True,
        'can_manage_projects': True,
        'can_view_analytics': True,
        'can_manage_research': True,
        'can_grant_research_access': True,
    },
    UserRole.MANAGEMENT_HEAD: {
        'can_create_tasks': True,
        'can_assign_any_user': True,
        'can_approve_all_tasks': True,  # В своем управлении
        'can_view_all_tasks': True,
        'can_view_all_projects': True,
        'can_manage_projects': True,
        'can_view_analytics': True,
        'can_manage_research': True,
        'can_grant_research_access': True,
    },
    UserRole.DIVISION_HEAD: {
        'can_create_tasks': True,
        'can_assign_division_users': True,  # Только свой отдел
        'can_approve_division_tasks': True,  # Первый уровень
        'can_view_division_tasks': True,
        'can_view_division_projects': True,
        'can_manage_projects': True,  # Свои проекты
        'can_view_analytics': True,  # Своего отдела
        'can_manage_research': True,  # Свои исследования
    },
    UserRole.EMPLOYEE: {
        'can_create_self_tasks': True,  # Только самопостановка
        'can_view_own_tasks': True,
        'can_execute_tasks': True,
    },
}


def get_permission(role: str, permission: str) -> bool:
    """
    Проверить наличие права у роли.
    
    Args:
        role: Роль пользователя
        permission: Название права
        
    Returns:
        True если право есть, False если нет
    """
    role_perms = ROLE_PERMISSIONS.get(role, {})
    return role_perms.get(permission, False)
