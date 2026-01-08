"""
=============================================================================
Django Production Settings
=============================================================================

Настройки для production окружения.

КРИТИЧНО: Перед deployment проверьте:
1. SECRET_KEY - уникальный и надежный
2. DEBUG = False
3. ALLOWED_HOSTS настроен правильно
4. DATABASE_URL указывает на production БД
5. CORS_ALLOWED_ORIGINS содержит только production домены
6. Все security настройки включены

Использование:
    DJANGO_ENV=production gunicorn config.wsgi:application
"""

from .base import *  # noqa: F401, F403

# =============================================================================
# Core Settings
# =============================================================================

DEBUG = False

# SECURITY: Убедитесь, что этот список содержит только ваши домены
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')  # noqa: F405

# =============================================================================
# Security Settings
# =============================================================================

# HTTPS redirect
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)  # noqa: F405
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Cookies
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Content Security
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Referrer Policy
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# =============================================================================
# REST Framework (Production)
# =============================================================================

# Только JSON renderer
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
]

# Stricter throttling
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {  # noqa: F405
    'anon': '60/minute',
    'user': '500/minute',
}

# =============================================================================
# Database (Production)
# =============================================================================

# Connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 60  # noqa: F405

# =============================================================================
# Cache (Production - Redis)
# =============================================================================

# Раскомментируйте когда Redis будет настроен
# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.redis.RedisCache',
#         'LOCATION': env('REDIS_URL', default='redis://redis:6379/0'),
#     }
# }

# =============================================================================
# Email (Production)
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST')  # noqa: F405
EMAIL_PORT = env.int('EMAIL_PORT', default=587)  # noqa: F405
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)  # noqa: F405
EMAIL_HOST_USER = env('EMAIL_HOST_USER')  # noqa: F405
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')  # noqa: F405
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@company.uz')  # noqa: F405

# =============================================================================
# Logging (Production)
# =============================================================================

LOGGING['handlers']['console']['formatter'] = 'json'  # noqa: F405
LOGGING['loggers']['django']['level'] = 'WARNING'  # noqa: F405
LOGGING['loggers']['apps']['level'] = 'INFO'  # noqa: F405

# =============================================================================
# Sentry (Error Tracking)
# =============================================================================

SENTRY_DSN = env('SENTRY_DSN', default=None)  # noqa: F405

if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
        environment='production',
    )

# =============================================================================
# Static & Media (Production - S3/MinIO)
# =============================================================================

# Раскомментируйте когда S3 будет настроен
# USE_S3 = env.bool('USE_S3', default=False)
#
# if USE_S3:
#     AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
#     AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
#     AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
#     AWS_S3_ENDPOINT_URL = env('AWS_S3_ENDPOINT_URL', default=None)
#     AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', default='us-east-1')
#     AWS_DEFAULT_ACL = 'private'
#     AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
#
#     STORAGES = {
#         'default': {
#             'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
#         },
#         'staticfiles': {
#             'BACKEND': 'storages.backends.s3boto3.S3StaticStorage',
#         },
#     }
