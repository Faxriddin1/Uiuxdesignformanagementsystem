from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.projects'
    verbose_name = 'Проекты'

    def ready(self):
        import apps.projects.signals  # noqa: F401
