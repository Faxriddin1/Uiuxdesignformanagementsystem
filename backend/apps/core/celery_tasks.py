"""
Celery Tasks для модуля Core
=============================

Общие фоновые задачи:
- Health check
- Мониторинг
- Логирование
"""

from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(name='apps.core.celery_tasks.health_check')
def health_check():
    """
    Проверка здоровья системы.
    
    Запускается каждые 5 минут для мониторинга.
    """
    from django.db import connection
    from django.core.cache import cache
    
    health_status = {
        'timestamp': timezone.now().isoformat(),
        'database': False,
        'cache': False,
        'celery': True,  # Если эта задача выполняется, Celery работает
    }
    
    # Проверка базы данных
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        health_status['database'] = True
    except Exception as exc:
        logger.error(f'Database health check failed: {exc}')
    
    # Проверка кэша (Redis)
    try:
        cache.set('health_check', 'ok', 10)
        if cache.get('health_check') == 'ok':
            health_status['cache'] = True
    except Exception as exc:
        logger.error(f'Cache health check failed: {exc}')
    
    # Сохраняем статус в кэш
    try:
        cache.set('system_health', health_status, 300)  # 5 минут
    except Exception:
        pass
    
    all_healthy = all([
        health_status['database'],
        health_status['cache'],
        health_status['celery'],
    ])
    
    if all_healthy:
        logger.info('System health check: OK')
    else:
        logger.warning(f'System health check: Issues detected - {health_status}')
    
    return health_status


@shared_task(name='apps.core.celery_tasks.log_system_metrics')
def log_system_metrics():
    """
    Логирование системных метрик.
    
    Собирает статистику для мониторинга.
    """
    from apps.tasks.models import Task
    from apps.projects.models import Project
    from apps.accounts.models import User
    
    try:
        metrics = {
            'timestamp': timezone.now().isoformat(),
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'total_tasks': Task.objects.count(),
            'pending_tasks': Task.objects.filter(
                status__in=['draft', 'in_progress', 'pending_review']
            ).count(),
            'total_projects': Project.objects.count(),
            'active_projects': Project.objects.filter(
                status__in=['planning', 'in_progress']
            ).count(),
        }
        
        logger.info(f'System metrics: {metrics}')
        
        return metrics
        
    except Exception as exc:
        logger.error(f'Error collecting system metrics: {exc}')
        return {'error': str(exc)}
