"""
=============================================================================
Accounts Admin
=============================================================================
"""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Админка для пользователей."""
    
    list_display = ['email', 'name', 'role', 'division', 'is_active', 'date_joined']
    list_filter = ['role', 'division', 'is_active', 'is_staff']
    search_fields = ['email', 'name']
    ordering = ['name']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Персональные данные', {'fields': ('name', 'avatar')}),
        ('Роль и отдел', {'fields': ('role', 'division')}),
        ('Права доступа', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Даты', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'division', 'password1', 'password2'),
        }),
    )
