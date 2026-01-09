"""
Schema Router для маршрутизации запросов к соответствующим PostgreSQL схемам.

Архитектура:
- users_schema: accounts, auth, admin, sessions, contenttypes, notifications
- tasks_schema: tasks
- projects_schema: projects, research  
- packages_schema: external_packages
- logs_schema: audit_logs
- files_schema: файлы и вложения (task attachments, research attachments)
"""


class SchemaRouter:
    """
    Маршрутизирует запросы к PostgreSQL схемам в зависимости от приложения/модели.
    Все данные в одной физической БД, но логически разделены по схемам.
    """

    # Маппинг приложений к схемам
    APP_SCHEMA_MAPPING = {
        # Пользователи и аутентификация
        'accounts': 'users_schema',
        'auth': 'users_schema',
        'admin': 'users_schema',
        'sessions': 'users_schema',
        'contenttypes': 'users_schema',
        'notifications': 'users_schema',
        
        # Задачи
        'tasks': 'tasks_schema',
        
        # Проекты и исследования
        'projects': 'projects_schema',
        'research': 'projects_schema',
        
        # Внешние пакеты
        'external_packages': 'packages_schema',
        
        # Логи и аудит
        'audit_logs': 'logs_schema',
        
        # Аналитика
        'analytics': 'logs_schema',
        
        # Core (общие утилиты)
        'core': 'users_schema',
    }

    # Маппинг специфичных моделей к схемам
    MODEL_SCHEMA_MAPPING = {
        # Файлы и вложения в отдельную схему
        'tasks.TaskAttachment': 'files_schema',
        'research.ResearchAttachment': 'files_schema',
        'external_packages.PackageAttachment': 'files_schema',
    }

    def db_for_read(self, model, **hints):
        """
        Все читают из default, но с указанием схемы через db_table.
        """
        return 'default'

    def db_for_write(self, model, **hints):
        """
        Все пишут в default, но с указанием схемы через db_table.
        """
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """
        Разрешаем все связи, т.к. все в одной физической БД.
        """
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Все миграции применяются к default БД.
        Django автоматически использует схемы из db_table моделей.
        """
        return db == 'default'

    @classmethod
    def get_schema_for_model(cls, model):
        """
        Получить имя схемы для модели.
        """
        # Проверяем специфичный маппинг модели
        model_label = f"{model._meta.app_label}.{model._meta.object_name}"
        if model_label in cls.MODEL_SCHEMA_MAPPING:
            return cls.MODEL_SCHEMA_MAPPING[model_label]
        
        # Проверяем маппинг приложения
        if model._meta.app_label in cls.APP_SCHEMA_MAPPING:
            return cls.APP_SCHEMA_MAPPING[model._meta.app_label]
        
        # По умолчанию используем public (для системных таблиц Django)
        return 'public'
