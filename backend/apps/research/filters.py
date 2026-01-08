"""
=============================================================================
Research Filters
=============================================================================
"""

import django_filters
from django.db import models

from .models import Research


class ResearchFilter(django_filters.FilterSet):
    """
    Фильтры для исследований.
    """
    
    status = django_filters.CharFilter(field_name='status')
    research_type = django_filters.CharFilter(field_name='research_type')
    priority = django_filters.CharFilter(field_name='priority')
    access_level = django_filters.CharFilter(field_name='access_level')
    division = django_filters.CharFilter(field_name='division')
    author = django_filters.UUIDFilter(field_name='author_id')
    project = django_filters.UUIDFilter(field_name='project_id')
    
    # Фильтры по датам
    due_date_from = django_filters.DateFilter(
        field_name='due_date',
        lookup_expr='gte'
    )
    due_date_to = django_filters.DateFilter(
        field_name='due_date',
        lookup_expr='lte'
    )
    
    # Поиск
    search = django_filters.CharFilter(method='filter_search')
    
    # Теги
    tag = django_filters.CharFilter(method='filter_tag')
    
    # Просроченные
    is_overdue = django_filters.BooleanFilter(method='filter_is_overdue')
    
    class Meta:
        model = Research
        fields = ['status', 'research_type', 'priority', 'access_level', 'division', 'author']

    def filter_search(self, queryset, name, value):
        """Поиск по названию, описанию, целям."""
        return queryset.filter(
            models.Q(title__icontains=value) |
            models.Q(description__icontains=value) |
            models.Q(objectives__icontains=value)
        )

    def filter_tag(self, queryset, name, value):
        """Фильтр по тегу."""
        return queryset.filter(tags__contains=[value])

    def filter_is_overdue(self, queryset, name, value):
        """Фильтр по просроченности."""
        from django.utils import timezone
        
        today = timezone.now().date()
        overdue_q = models.Q(
            due_date__lt=today,
            status__in=['draft', 'in_progress', 'submitted']
        )
        
        if value:
            return queryset.filter(overdue_q)
        else:
            return queryset.exclude(overdue_q)
