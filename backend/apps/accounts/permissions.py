"""
=============================================================================
Custom Permissions
=============================================================================

Классы прав доступа для DRF.
"""

from rest_framework import permissions

from .constants import UserRole, get_permission


class IsManager(permissions.BasePermission):
    """
    Доступ только для руководителей.
    
    Роли: department_head, management_head, division_head
    """
    
    message = 'Доступ только для руководителей'
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_manager
        )


class IsDepartmentHead(permissions.BasePermission):
    """Доступ только для Начальника Департамента."""
    
    message = 'Доступ только для Начальника Департамента'
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.DEPARTMENT_HEAD
        )


class IsManagementHead(permissions.BasePermission):
    """Доступ для Начальника Управления и выше."""
    
    message = 'Доступ только для Начальника Управления'
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in [UserRole.DEPARTMENT_HEAD, UserRole.MANAGEMENT_HEAD]
        )


class IsDivisionHead(permissions.BasePermission):
    """Доступ для Начальника отдела и выше."""
    
    message = 'Доступ только для Начальника отдела'
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in [
                UserRole.DEPARTMENT_HEAD,
                UserRole.MANAGEMENT_HEAD,
                UserRole.DIVISION_HEAD
            ]
        )


class CanApproveTask(permissions.BasePermission):
    """
    Право на одобрение задачи.
    
    Проверяет:
    - Роль пользователя
    - Маршрут приемки задачи
    - Принадлежность к отделу (для division_head)
    """
    
    message = 'У вас нет прав на одобрение этой задачи'
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Проверяем базовое право
        if not user.can_approve_tasks:
            return False
        
        # Department head и Management head могут всё
        if user.role in [UserRole.DEPARTMENT_HEAD, UserRole.MANAGEMENT_HEAD]:
            return True
        
        # Division head может только свой отдел
        if user.role == UserRole.DIVISION_HEAD:
            return obj.division == user.division
        
        return False


class IsOwnerOrManager(permissions.BasePermission):
    """
    Доступ для владельца объекта или руководителя.
    
    Владелец определяется через поле 'creator' или 'assignee'.
    """
    
    message = 'У вас нет прав на этот объект'
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Руководители могут всё
        if user.is_manager:
            # Но division_head только свой отдел
            if user.role == UserRole.DIVISION_HEAD:
                if hasattr(obj, 'division'):
                    return obj.division == user.division
            return True
        
        # Проверяем владельца
        if hasattr(obj, 'creator_id') and obj.creator_id == user.id:
            return True
        if hasattr(obj, 'assignee_id') and obj.assignee_id == user.id:
            return True
        if hasattr(obj, 'author_id') and obj.author_id == user.id:
            return True
        if hasattr(obj, 'responsible_id') and obj.responsible_id == user.id:
            return True
        
        return False


class HasRolePermission(permissions.BasePermission):
    """
    Проверка конкретного права на основе роли.
    
    Использование в view:
        permission_classes = [HasRolePermission]
        required_permission = 'can_manage_projects'
    """
    
    def has_permission(self, request, view):
        required_permission = getattr(view, 'required_permission', None)
        
        if not required_permission:
            return True
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        return get_permission(request.user.role, required_permission)
