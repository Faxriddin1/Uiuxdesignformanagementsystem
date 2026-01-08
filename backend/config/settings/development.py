"""
=============================================================================
Django Development Settings
=============================================================================

Настройки для локальной разработки.

Использование:
    DJANGO_ENV=development python manage.py runserver
"""

from .base import *  # noqa: F401, F403

# =============================================================================
# Debug Settings
# =============================================================================

DEBUG = True

# Разрешаем все хосты в dev
ALLOWED_HOSTS = ['*']

# =============================================================================
# Installed Apps (Development Only)
# =============================================================================

INSTALLED_APPS += [  # noqa: F405
    'debug_toolbar',
    'django_extensions',
]

# =============================================================================
# Middleware (Development Only)
# =============================================================================

MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405

# =============================================================================
# Debug Toolbar
# =============================================================================

INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
    # Docker
    '172.17.0.1',
    '172.18.0.1',
    '172.19.0.1',
]

DEBUG_TOOLBAR_CONFIG = {
    'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
    'INTERCEPT_REDIRECTS': False,
}

# =============================================================================
# REST Framework (Development Overrides)
# =============================================================================

# Добавляем Browsable API для удобства
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
]

# Отключаем throttling в dev
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []  # noqa: F405

# =============================================================================
# CORS (Development - более permissive)
# =============================================================================

CORS_ALLOW_ALL_ORIGINS = True  # Только для dev!

# =============================================================================
# Email (Development)
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# =============================================================================
# Logging (Development - более verbose)
# =============================================================================

LOGGING['handlers']['console']['level'] = 'DEBUG'  # noqa: F405
LOGGING['loggers']['django']['level'] = 'DEBUG'  # noqa: F405

# SQL logging (опционально, включается через env)
if env.bool('LOG_SQL_QUERIES', default=False):  # noqa: F405
    LOGGING['loggers']['django.db.backends'] = {  # noqa: F405
        'handlers': ['console'],
        'level': 'DEBUG',
        'propagate': False,
    }

# =============================================================================
# Cache (Development - локальный)
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# =============================================================================
# Static Files
# =============================================================================

STATICFILES_DIRS = [
    BASE_DIR / 'static',  # noqa: F405
]
