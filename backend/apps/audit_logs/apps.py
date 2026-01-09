from django.apps import AppConfig


class AuditLogsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.audit_logs'
    verbose_name = 'Логи и Аудит'
    
    def ready(self):
        """Регистрируем сигналы при запуске приложения."""
        # import apps.audit_logs.signals  # noqa
        # Отключаем сигналы пока не применятся все миграции
        pass
