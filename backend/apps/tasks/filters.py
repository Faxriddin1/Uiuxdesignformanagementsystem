"""
=============================================================================
Task Filters
=============================================================================
"""

import django_filters

from .constants import TaskPriority, TaskStatus, TaskType
from .models import Task


class TaskFilter(django_filters.FilterSet):
    """
    Фильтры для списка задач.
    
    Параметры:
    - status: фильтр по статусу (можно несколько через запятую)
    - priority: фильтр по приоритету
    - task_type: фильтр по типу (T1/T2)
    - division: фильтр по отделу
    - assignee: фильтр по исполнителю (UUID)
    - is_overdue: только просроченные
    - deadline_from, deadline_to: диапазон дедлайна
    - search: поиск по названию и описанию
    """
    
    status = django_filters.MultipleChoiceFilter(
        choices=TaskStatus.choices,
        help_text='Фильтр по статусу'
    )
    priority = django_filters.MultipleChoiceFilter(
        choices=TaskPriority.choices,
        help_text='Фильтр по приоритету'
    )
    task_type = django_filters.ChoiceFilter(
        choices=TaskType.choices,
        help_text='Фильтр по типу задачи'
    )
    
    assignee = django_filters.UUIDFilter(
        field_name='assignee_id',
        help_text='Фильтр по исполнителю'
    )
    creator = django_filters.UUIDFilter(
        field_name='creator_id',
        help_text='Фильтр по создателю'
    )
    
    is_overdue = django_filters.BooleanFilter(
        method='filter_is_overdue',
        help_text='Только просроченные'
    )
    
    deadline_from = django_filters.DateFilter(
        field_name='deadline',
        lookup_expr='gte',
        help_text='Дедлайн от'
    )
    deadline_to = django_filters.DateFilter(
        field_name='deadline',
        lookup_expr='lte',
        help_text='Дедлайн до'
    )
    
    search = django_filters.CharFilter(
        method='filter_search',
        help_text='Поиск по названию и описанию'
    )
    
    class Meta:
        model = Task
        fields = [
            'status',
            'priority',
            'task_type',
            'division',
            'assignee',
            'creator',
            'project',
        ]
    
    def filter_is_overdue(self, queryset, name, value):
        """Фильтр по просроченности."""
        from django.utils import timezone
        
        if value:
            return queryset.filter(
                deadline__lt=timezone.now().date()
            ).exclude(status=TaskStatus.ACCEPTED)
        return queryset
    
    def filter_search(self, queryset, name, value):
        """Поиск по названию и описанию."""
        if value:
            return queryset.filter(
                models.Q(title__icontains=value) |
                models.Q(description__icontains=value)
            )
        return queryset


from django.db import models  # noqa: E402
