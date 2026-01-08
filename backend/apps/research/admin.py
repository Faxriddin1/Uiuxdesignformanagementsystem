"""
=============================================================================
Research Admin
=============================================================================
"""

from django.contrib import admin

from .models import (
    Research,
    ResearchAccess,
    ResearchAttachment,
    ResearchComment,
    ResearchHistory,
)


class ResearchAttachmentInline(admin.TabularInline):
    model = ResearchAttachment
    extra = 0
    readonly_fields = ['created_at', 'uploaded_by', 'file_size', 'mime_type']


class ResearchCommentInline(admin.TabularInline):
    model = ResearchComment
    extra = 0
    readonly_fields = ['created_at', 'author']


class ResearchHistoryInline(admin.TabularInline):
    model = ResearchHistory
    extra = 0
    readonly_fields = ['created_at', 'user', 'action', 'details']
    can_delete = False


class ResearchAccessInline(admin.TabularInline):
    model = ResearchAccess
    extra = 0
    readonly_fields = ['granted_at', 'granted_by']


@admin.register(Research)
class ResearchAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'research_type', 'status', 'priority',
        'access_level', 'author', 'due_date', 'is_overdue'
    ]
    list_filter = ['status', 'research_type', 'priority', 'access_level', 'division']
    search_fields = ['title', 'description', 'objectives']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by', 'completed_at']
    date_hierarchy = 'created_at'
    filter_horizontal = ['contributors']
    
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'objectives', 'methodology')
        }),
        ('Тип и статус', {
            'fields': ('research_type', 'status', 'priority')
        }),
        ('Доступ', {
            'fields': ('access_level', 'division')
        }),
        ('Участники', {
            'fields': ('author', 'contributors')
        }),
        ('Сроки', {
            'fields': ('start_date', 'due_date', 'completed_at')
        }),
        ('Результаты', {
            'fields': ('findings', 'recommendations'),
            'classes': ('collapse',)
        }),
        ('Связи', {
            'fields': ('project', 'tags'),
            'classes': ('collapse',)
        }),
        ('Системные', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [
        ResearchAccessInline,
        ResearchAttachmentInline,
        ResearchCommentInline,
        ResearchHistoryInline,
    ]
    
    def is_overdue(self, obj):
        return obj.is_overdue
    is_overdue.boolean = True
    is_overdue.short_description = 'Просрочено'
