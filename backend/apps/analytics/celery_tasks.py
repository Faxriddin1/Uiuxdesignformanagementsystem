"""
Celery Tasks для модуля Analytics
==================================

Фоновые задачи:
- Генерация отчётов
- Агрегация данных
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(
    name='apps.analytics.celery_tasks.generate_weekly_report',
    bind=True,
    max_retries=3,
)
def generate_weekly_report(self):
    """
    Генерация еженедельного отчёта о производительности.
    
    Запускается каждый понедельник в 8:00.
    """
    from apps.tasks.models import Task
    from apps.projects.models import Project
    from apps.accounts.models import User
    from apps.notifications.models import Notification
    
    try:
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        
        report = {
            'period': {
                'start': week_ago.isoformat(),
                'end': now.isoformat(),
            },
            'tasks': {
                'created': Task.objects.filter(created_at__gte=week_ago).count(),
                'completed': Task.objects.filter(
                    status='completed',
                    updated_at__gte=week_ago
                ).count(),
                'overdue': Task.objects.filter(
                    deadline__lt=now,
                    status__in=['draft', 'in_progress', 'pending_review']
                ).count(),
            },
            'projects': {
                'created': Project.objects.filter(created_at__gte=week_ago).count(),
                'completed': Project.objects.filter(
                    status='completed',
                    updated_at__gte=week_ago
                ).count(),
            },
        }
        
        logger.info(f'Weekly report generated: {report}')
        
        # Отправляем отчёт администраторам
        admin_users = User.objects.filter(role__in=['admin', 'management_head'])
        
        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                notification_type='weekly_report',
                title='Еженедельный отчёт',
                message=f"""
За последнюю неделю:
- Создано задач: {report['tasks']['created']}
- Завершено задач: {report['tasks']['completed']}
- Просроченных: {report['tasks']['overdue']}
- Создано проектов: {report['projects']['created']}
- Завершено проектов: {report['projects']['completed']}
                """.strip(),
            )
        
        return report
        
    except Exception as exc:
        logger.error(f'Error generating weekly report: {exc}')
        raise self.retry(exc=exc)


@shared_task(name='apps.analytics.celery_tasks.calculate_user_statistics')
def calculate_user_statistics(user_id: str):
    """
    Расчёт статистики для конкретного пользователя.
    
    Args:
        user_id: ID пользователя
    """
    from apps.tasks.models import Task
    from apps.accounts.models import User
    from django.db.models import Count, Avg
    from django.core.cache import cache
    
    try:
        user = User.objects.get(id=user_id)
        
        # Статистика по задачам
        task_stats = Task.objects.filter(assignee=user).aggregate(
            total=Count('id'),
            completed=Count('id', filter=models.Q(status='completed')),
            in_progress=Count('id', filter=models.Q(status='in_progress')),
            overdue=Count('id', filter=models.Q(
                deadline__lt=timezone.now(),
                status__in=['draft', 'in_progress', 'pending_review']
            )),
        )
        
        # Процент выполнения
        completion_rate = 0
        if task_stats['total'] > 0:
            completion_rate = round(
                (task_stats['completed'] / task_stats['total']) * 100, 
                1
            )
        
        stats = {
            'user_id': user_id,
            'calculated_at': timezone.now().isoformat(),
            'tasks': task_stats,
            'completion_rate': completion_rate,
        }
        
        # Кэшируем результат
        cache_key = f'user_stats_{user_id}'
        cache.set(cache_key, stats, 3600)  # 1 час
        
        logger.info(f'User statistics calculated for {user_id}')
        
        return stats
        
    except User.DoesNotExist:
        logger.error(f'User not found: {user_id}')
        return {'error': 'User not found'}
    except Exception as exc:
        logger.error(f'Error calculating user statistics: {exc}')
        return {'error': str(exc)}


@shared_task(name='apps.analytics.celery_tasks.export_report')
def export_report(report_type: str, filters: dict, user_id: str):
    """
    Асинхронная генерация отчёта для экспорта.
    
    Args:
        report_type: Тип отчёта (tasks, projects, users)
        filters: Фильтры для отчёта
        user_id: ID пользователя, запросившего отчёт
    """
    from apps.notifications.models import Notification
    from apps.accounts.models import User
    
    try:
        logger.info(f'Generating {report_type} report with filters: {filters}')
        
        # Здесь была бы логика генерации отчёта
        # Например, создание Excel/CSV файла
        
        # Уведомляем пользователя о готовности
        user = User.objects.get(id=user_id)
        Notification.objects.create(
            user=user,
            notification_type='report_ready',
            title='Отчёт готов',
            message=f'Ваш отчёт "{report_type}" готов к скачиванию',
        )
        
        return {
            'success': True,
            'report_type': report_type,
            # 'file_url': url_to_generated_file,
        }
        
    except Exception as exc:
        logger.error(f'Error exporting report: {exc}')
        return {'success': False, 'error': str(exc)}
