"""
External Packages Django App Config
"""

from django.apps import AppConfig


class ExternalPackagesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.external_packages'
    verbose_name = 'Внешние пакеты'
    
    def ready(self):
        # Import signals if any
        pass
