"""
=============================================================================
Analytics Service
=============================================================================
Сервис для расчёта аналитики и метрик.
"""

from datetime import timedelta
from typing import Any

from django.db import models
from django.db.models import Count, Q, Avg, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone


class AnalyticsService:
    """
    Сервис для расчёта аналитических данных.
    """

    @classmethod
    def get_dashboard_summary(cls, user=None, division: str = None) -> dict[str, Any]:
        """
        Возвращает сводку для дашборда.
        """
        from apps.tasks.models import Task
        from apps.projects.models import Project
        from apps.research.models import Research
        
        # Базовые фильтры
        task_filter = Q()
        project_filter = Q()
        research_filter = Q()
        
        if division:
            task_filter &= Q(division=division)
            project_filter &= Q(division=division)
            research_filter &= Q(division=division)
        
        # Подсчёт задач
        tasks = Task.objects.filter(task_filter)
        total_tasks = tasks.count()
        tasks_in_progress = tasks.filter(status__in=['assigned', 'in_progress']).count()
        tasks_pending_review = tasks.filter(status='pending_review').count()
        tasks_completed = tasks.filter(status='approved').count()
        tasks_overdue = tasks.filter(
            deadline__lt=timezone.now(),
            status__in=['open', 'assigned', 'in_progress', 'pending_review']
        ).count()
        
        # Подсчёт проектов
        projects = Project.objects.filter(project_filter)
        total_projects = projects.count()
        projects_in_progress = projects.filter(status='in_progress').count()
        projects_completed = projects.filter(status='completed').count()
        
        # Подсчёт исследований
        researches = Research.objects.filter(research_filter)
        total_researches = researches.count()
        researches_in_progress = researches.filter(status='in_progress').count()
        researches_pending = researches.filter(status='submitted').count()
        
        return {
            'tasks': {
                'total': total_tasks,
                'in_progress': tasks_in_progress,
                'pending_review': tasks_pending_review,
                'completed': tasks_completed,
                'overdue': tasks_overdue,
            },
            'projects': {
                'total': total_projects,
                'in_progress': projects_in_progress,
                'completed': projects_completed,
            },
            'researches': {
                'total': total_researches,
                'in_progress': researches_in_progress,
                'pending_review': researches_pending,
            },
        }

    @classmethod
    def get_tasks_by_status(cls, division: str = None) -> list[dict]:
        """
        Возвращает распределение задач по статусам.
        """
        from apps.tasks.models import Task
        from apps.tasks.constants import TaskStatus
        
        filter_q = Q()
        if division:
            filter_q &= Q(division=division)
        
        stats = Task.objects.filter(filter_q).values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Добавляем labels
        result = []
        for item in stats:
            status = item['status']
            label = TaskStatus(status).label if status in TaskStatus.values else status
            result.append({
                'status': status,
                'label': label,
                'count': item['count'],
            })
        
        return result

    @classmethod
    def get_tasks_by_type(cls, division: str = None) -> list[dict]:
        """
        Возвращает распределение задач по типам (T1/T2).
        """
        from apps.tasks.models import Task
        from apps.tasks.constants import TaskType
        
        filter_q = Q()
        if division:
            filter_q &= Q(division=division)
        
        stats = Task.objects.filter(filter_q).values('task_type').annotate(
            count=Count('id')
        ).order_by('task_type')
        
        result = []
        for item in stats:
            task_type = item['task_type']
            label = TaskType(task_type).label if task_type in TaskType.values else task_type
            result.append({
                'type': task_type,
                'label': label,
                'count': item['count'],
            })
        
        return result

    @classmethod
    def get_overdue_tasks(cls, user=None, division: str = None, limit: int = 10) -> list[dict]:
        """
        Возвращает список просроченных задач.
        """
        from apps.tasks.models import Task
        
        filter_q = Q(
            deadline__lt=timezone.now(),
            status__in=['open', 'assigned', 'in_progress', 'pending_review']
        )
        
        if division:
            filter_q &= Q(division=division)
        
        if user and user.role == 'employee':
            filter_q &= Q(assignee=user)
        
        tasks = Task.objects.filter(filter_q).select_related(
            'assignee'
        ).order_by('deadline')[:limit]
        
        return [
            {
                'id': str(task.id),
                'title': task.title,
                'deadline': task.deadline.isoformat() if task.deadline else None,
                'days_overdue': (timezone.now().date() - task.deadline.date()).days if task.deadline else 0,
                'assignee': task.assignee.full_name if task.assignee else None,
                'status': task.status,
            }
            for task in tasks
        ]

    @classmethod
    def get_task_completion_trend(
        cls,
        period: str = 'week',
        days: int = 30,
        division: str = None,
    ) -> list[dict]:
        """
        Возвращает тренд завершения задач.
        
        Args:
            period: 'day', 'week', 'month'
            days: количество дней для анализа
            division: фильтр по подразделению
        """
        from apps.tasks.models import Task
        
        start_date = timezone.now() - timedelta(days=days)
        
        filter_q = Q(
            status='approved',
            updated_at__gte=start_date,
        )
        
        if division:
            filter_q &= Q(division=division)
        
        # Выбираем функцию группировки
        if period == 'day':
            trunc_func = TruncDate('updated_at')
        elif period == 'month':
            trunc_func = TruncMonth('updated_at')
        else:
            trunc_func = TruncWeek('updated_at')
        
        stats = Task.objects.filter(filter_q).annotate(
            period=trunc_func
        ).values('period').annotate(
            count=Count('id')
        ).order_by('period')
        
        return [
            {
                'date': item['period'].isoformat() if item['period'] else None,
                'completed': item['count'],
            }
            for item in stats
        ]

    @classmethod
    def get_velocity_metrics(cls, user=None, days: int = 30) -> dict:
        """
        Возвращает метрики производительности.
        """
        from apps.tasks.models import Task
        
        start_date = timezone.now() - timedelta(days=days)
        
        filter_q = Q(status='approved', updated_at__gte=start_date)
        
        if user:
            filter_q &= Q(assignee=user)
        
        completed_tasks = Task.objects.filter(filter_q)
        total_completed = completed_tasks.count()
        
        # Среднее время выполнения (в днях)
        avg_completion_time = completed_tasks.annotate(
            completion_days=F('updated_at') - F('created_at')
        ).aggregate(avg=Avg('completion_days'))['avg']
        
        avg_days = avg_completion_time.days if avg_completion_time else 0
        
        # Задачи в срок vs просроченные
        on_time = completed_tasks.filter(
            models.Q(deadline__isnull=True) |
            models.Q(updated_at__date__lte=F('deadline'))
        ).count()
        
        late = total_completed - on_time
        
        return {
            'total_completed': total_completed,
            'avg_completion_days': avg_days,
            'on_time': on_time,
            'late': late,
            'on_time_percentage': round((on_time / total_completed * 100) if total_completed else 0, 1),
        }

    @classmethod
    def get_user_workload(cls, division: str = None, limit: int = 10) -> list[dict]:
        """
        Возвращает загруженность пользователей.
        """
        from apps.tasks.models import Task
        from apps.accounts.models import User
        
        filter_q = Q(
            status__in=['assigned', 'in_progress', 'pending_review']
        )
        
        if division:
            filter_q &= Q(division=division)
        
        # Группируем по исполнителям
        workload = Task.objects.filter(filter_q).values(
            'assignee', 'assignee__first_name', 'assignee__last_name'
        ).annotate(
            active_tasks=Count('id')
        ).order_by('-active_tasks')[:limit]
        
        return [
            {
                'user_id': str(item['assignee']) if item['assignee'] else None,
                'name': f"{item['assignee__first_name'] or ''} {item['assignee__last_name'] or ''}".strip() or 'Не назначено',
                'active_tasks': item['active_tasks'],
            }
            for item in workload
        ]

    @classmethod
    def get_projects_progress(cls, division: str = None) -> list[dict]:
        """
        Возвращает прогресс проектов.
        """
        from apps.projects.models import Project
        
        filter_q = Q(status__in=['planning', 'in_progress', 'review'])
        
        if division:
            filter_q &= Q(division=division)
        
        projects = Project.objects.filter(filter_q).select_related(
            'manager'
        ).order_by('-progress')[:10]
        
        return [
            {
                'id': str(project.id),
                'code': project.code,
                'title': project.title,
                'progress': project.progress,
                'status': project.status,
                'manager': project.manager.full_name if project.manager else None,
                'end_date': project.end_date.isoformat() if project.end_date else None,
                'is_overdue': project.is_overdue,
            }
            for project in projects
        ]
