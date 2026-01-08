"""
=============================================================================
Task Admin
=============================================================================
"""

from django.contrib import admin

from .models import Task, TaskAttachment, TaskComment, TaskHistory, TaskResultVersion


class TaskAttachmentInline(admin.TabularInline):
    model = TaskAttachment
    extra = 0
    readonly_fields = ['created_at', 'uploaded_by']


class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 0
    readonly_fields = ['created_at', 'author']


class TaskHistoryInline(admin.TabularInline):
    model = TaskHistory
    extra = 0
    readonly_fields = ['created_at', 'user', 'action', 'details']
    can_delete = False


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'task_type', 'status', 'priority',
        'assignee', 'deadline', 'is_overdue', 'created_at'
    ]
    list_filter = ['status', 'task_type', 'priority', 'division']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('title', 'description')
        }),
        ('Тип и статус', {
            'fields': ('task_type', 'status', 'priority', 'category')
        }),
        ('Участники', {
            'fields': ('division', 'assignee', 'co_assignees', 'creator')
        }),
        ('Сроки', {
            'fields': ('deadline',)
        }),
        ('Приемка', {
            'fields': ('approval_route', 'custom_approver', 'is_self_assigned')
        }),
        ('Системные', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [TaskAttachmentInline, TaskCommentInline, TaskHistoryInline]
    
    def is_overdue(self, obj):
        return obj.is_overdue
    is_overdue.boolean = True
    is_overdue.short_description = 'Просрочено'


@admin.register(TaskResultVersion)
class TaskResultVersionAdmin(admin.ModelAdmin):
    list_display = ['task', 'version', 'status', 'submitted_by', 'submitted_at']
    list_filter = ['status']
    readonly_fields = ['created_at']
