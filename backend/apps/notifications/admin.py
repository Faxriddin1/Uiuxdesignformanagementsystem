"""
=============================================================================
Notification Admin
=============================================================================
"""

from django.contrib import admin

from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'notification_type', 'priority', 'title',
        'is_read', 'created_at'
    ]
    list_filter = ['notification_type', 'priority', 'is_read']
    search_fields = ['title', 'message', 'user__email']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('user', 'notification_type', 'priority')
        }),
        ('Контент', {
            'fields': ('title', 'message', 'data')
        }),
        ('Связи', {
            'fields': ('related_object_type', 'related_object_id', 'sender')
        }),
        ('Статус', {
            'fields': ('is_read', 'read_at', 'created_at')
        }),
    )


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_enabled', 'push_enabled', 'quiet_hours_enabled']
    list_filter = ['email_enabled', 'push_enabled', 'quiet_hours_enabled']
    search_fields = ['user__email']
