"""
=============================================================================
Django Staging Settings
=============================================================================

Настройки для staging окружения (тестовый сервер).

Использование:
    DJANGO_ENV=staging python manage.py runserver
"""

from .base import *  # noqa: F401, F403

# =============================================================================
# Debug Settings
# =============================================================================

DEBUG = False

# =============================================================================
# Security Settings
# =============================================================================

# HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=False)  # noqa: F405

# Cookies
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 3600  # 1 hour для staging
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = False

# =============================================================================
# REST Framework (Staging)
# =============================================================================

# Только JSON
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
]

# =============================================================================
# Email (Staging)
# =============================================================================

# Можно использовать реальный SMTP или сервис типа Mailtrap
EMAIL_BACKEND = env(  # noqa: F405
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST = env('EMAIL_HOST', default='smtp.mailtrap.io')  # noqa: F405
EMAIL_PORT = env.int('EMAIL_PORT', default=587)  # noqa: F405
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)  # noqa: F405
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')  # noqa: F405
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')  # noqa: F405

# =============================================================================
# Logging (Staging)
# =============================================================================

LOGGING['handlers']['console']['level'] = 'INFO'  # noqa: F405
LOGGING['loggers']['django']['level'] = 'INFO'  # noqa: F405
