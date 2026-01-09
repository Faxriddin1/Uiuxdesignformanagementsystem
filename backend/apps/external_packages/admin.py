"""
External Packages Admin
"""

from django.contrib import admin

from .models import ExternalPackage, PackageLogEntry


@admin.register(ExternalPackage)
class ExternalPackageAdmin(admin.ModelAdmin):
    """
    Админка для внешних пакетов.
    """
    list_display = [
        'title', 'recipient', 'status', 'channel', 'division',
        'responsible', 'expected_response_date', 'is_overdue', 'created_at'
    ]
    list_filter = ['status', 'channel', 'division', 'created_at']
    search_fields = ['title', 'recipient', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'description', 'recipient', 'channel')
        }),
        ('Статус и подразделение', {
            'fields': ('status', 'division')
        }),
        ('Ответственные', {
            'fields': ('responsible',)
        }),
        ('Связи', {
            'fields': ('linked_task', 'linked_project')
        }),
        ('Временные метки', {
            'fields': (
                'sent_at', 'expected_response_date',
                'received_at', 'escalated_at'
            )
        }),
        ('Системная информация', {
            'fields': ('id', 'created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PackageLogEntry)
class PackageLogEntryAdmin(admin.ModelAdmin):
    """
    Админка для записей журнала пакетов.
    """
    list_display = ['package', 'action', 'user', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['package__title', 'notes']
    readonly_fields = ['id', 'timestamp']
