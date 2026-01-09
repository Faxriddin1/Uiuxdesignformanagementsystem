"""
Celery Configuration
====================

Настройка Celery для фоновых задач:
- Отправка email уведомлений
- Напоминания о дедлайнах
- Генерация отчётов
- Очистка устаревших данных

Запуск worker:
    celery -A config worker -l INFO

Запуск beat (scheduler):
    celery -A config beat -l INFO

Или вместе:
    celery -A config worker -B -l INFO
"""

import os
from celery import Celery
from celery.schedules import crontab

# Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# Создаём приложение Celery
app = Celery('management_system')

# Загружаем конфигурацию из Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автоматический поиск задач в apps/*/tasks.py
app.autodiscover_tasks()

# ---------------------------------------------------------------------------
# Периодические задачи (Celery Beat)
# ---------------------------------------------------------------------------
app.conf.beat_schedule = {
    # Напоминания о дедлайнах - каждый день в 9:00
    'send-deadline-reminders': {
        'task': 'apps.tasks.celery_tasks.send_deadline_reminders',
        'schedule': crontab(hour=9, minute=0),
        'options': {'queue': 'notifications'},
    },
    
    # Уведомления о просроченных задачах - каждый час
    'notify-overdue-tasks': {
        'task': 'apps.tasks.celery_tasks.notify_overdue_tasks',
        'schedule': crontab(minute=0),  # Каждый час в :00
        'options': {'queue': 'notifications'},
    },
    
    # Еженедельный отчёт - понедельник в 8:00
    'weekly-summary-report': {
        'task': 'apps.analytics.celery_tasks.generate_weekly_report',
        'schedule': crontab(hour=8, minute=0, day_of_week='monday'),
        'options': {'queue': 'reports'},
    },
    
    # Очистка старых уведомлений - каждую ночь в 3:00
    'cleanup-old-notifications': {
        'task': 'apps.notifications.celery_tasks.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0),
        'options': {'queue': 'maintenance'},
    },
    
    # Проверка здоровья - каждые 5 минут
    'health-check': {
        'task': 'apps.core.celery_tasks.health_check',
        'schedule': crontab(minute='*/5'),
    },
}

# ---------------------------------------------------------------------------
# Настройки очередей
# ---------------------------------------------------------------------------
app.conf.task_queues = {
    'default': {},
    'notifications': {'routing_key': 'notifications'},
    'reports': {'routing_key': 'reports'},
    'maintenance': {'routing_key': 'maintenance'},
}

app.conf.task_default_queue = 'default'

# ---------------------------------------------------------------------------
# Настройки задач
# ---------------------------------------------------------------------------
app.conf.update(
    # Сериализация
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    
    # Таймзона
    timezone='UTC',
    enable_utc=True,
    
    # Результаты задач
    result_expires=3600,  # 1 час
    result_backend_transport_options={
        'visibility_timeout': 3600,
    },
    
    # Лимиты
    task_soft_time_limit=300,  # 5 минут soft limit
    task_time_limit=600,  # 10 минут hard limit
    
    # Retry
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Concurrency
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
)


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug задача для тестирования Celery."""
    print(f'Request: {self.request!r}')
