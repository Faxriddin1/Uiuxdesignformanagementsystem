"""
WSGI config for Management System project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Определяем окружение из переменной DJANGO_ENV
environment = os.environ.get('DJANGO_ENV', 'development')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', f'config.settings.{environment}')

application = get_wsgi_application()
