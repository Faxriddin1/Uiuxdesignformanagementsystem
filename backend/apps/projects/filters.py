"""
=============================================================================
Project Filters
=============================================================================
"""

import django_filters

from .models import Project


class ProjectFilter(django_filters.FilterSet):
    """
    Фильтры для проектов.
    """
    
    status = django_filters.CharFilter(field_name='status')
    priority = django_filters.CharFilter(field_name='priority')
    division = django_filters.CharFilter(field_name='division')
    manager = django_filters.UUIDFilter(field_name='manager_id')
    
    # Фильтры по датам
    start_date_from = django_filters.DateFilter(
        field_name='start_date',
        lookup_expr='gte'
    )
    start_date_to = django_filters.DateFilter(
        field_name='start_date',
        lookup_expr='lte'
    )
    end_date_from = django_filters.DateFilter(
        field_name='end_date',
        lookup_expr='gte'
    )
    end_date_to = django_filters.DateFilter(
        field_name='end_date',
        lookup_expr='lte'
    )
    
    # Поиск
    search = django_filters.CharFilter(method='filter_search')
    
    # Просроченные
    is_overdue = django_filters.BooleanFilter(method='filter_is_overdue')
    
    class Meta:
        model = Project
        fields = ['status', 'priority', 'division', 'manager']

    def filter_search(self, queryset, name, value):
        """Поиск по названию, коду и описанию."""
        return queryset.filter(
            models.Q(title__icontains=value) |
            models.Q(code__icontains=value) |
            models.Q(description__icontains=value)
        )

    def filter_is_overdue(self, queryset, name, value):
        """Фильтр по просроченности."""
        from django.db import models as db_models
        from django.utils import timezone
        
        today = timezone.now().date()
        overdue_q = db_models.Q(
            end_date__lt=today,
            status__in=['draft', 'planning', 'in_progress', 'review']
        )
        
        if value:
            return queryset.filter(overdue_q)
        else:
            return queryset.exclude(overdue_q)
