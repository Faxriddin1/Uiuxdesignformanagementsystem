"""
=============================================================================
Project Admin
=============================================================================
"""

from django.contrib import admin

from .models import Project, ProjectHistory, ProjectMilestone


class ProjectMilestoneInline(admin.TabularInline):
    model = ProjectMilestone
    extra = 0
    readonly_fields = ['completed_at']


class ProjectHistoryInline(admin.TabularInline):
    model = ProjectHistory
    extra = 0
    readonly_fields = ['created_at', 'user', 'action', 'details']
    can_delete = False


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'title', 'status', 'priority', 'division',
        'manager', 'progress', 'end_date', 'is_overdue'
    ]
    list_filter = ['status', 'priority', 'division']
    search_fields = ['code', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    date_hierarchy = 'created_at'
    filter_horizontal = ['members']
    
    fieldsets = (
        (None, {
            'fields': ('code', 'title', 'description')
        }),
        ('Статус', {
            'fields': ('status', 'priority', 'progress')
        }),
        ('Принадлежность', {
            'fields': ('division', 'manager', 'members')
        }),
        ('Сроки', {
            'fields': ('start_date', 'end_date')
        }),
        ('Бюджет', {
            'fields': ('budget', 'spent'),
            'classes': ('collapse',)
        }),
        ('Системные', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ProjectMilestoneInline, ProjectHistoryInline]
    
    def is_overdue(self, obj):
        return obj.is_overdue
    is_overdue.boolean = True
    is_overdue.short_description = 'Просрочено'


@admin.register(ProjectMilestone)
class ProjectMilestoneAdmin(admin.ModelAdmin):
    list_display = ['project', 'title', 'due_date', 'completed', 'order']
    list_filter = ['completed']
    search_fields = ['title', 'project__title']
