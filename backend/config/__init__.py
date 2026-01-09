# Config package

# Celery app import для автозагрузки
from .celery import app as celery_app

__all__ = ('celery_app',)
