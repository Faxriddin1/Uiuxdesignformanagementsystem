"""
Redis Configuration
====================

Настройка Redis для:
- Кэширование
- Сессии
- Celery broker
- Rate limiting

Redis URL формат:
    redis://[[username]:[password]@]host:port/db_number

Примеры:
    redis://localhost:6379/0
    redis://:password@redis-server:6379/1
    rediss://user:pass@redis-ssl:6380/0  (SSL)
"""

import os

# Redis URL из переменных окружения
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# ---------------------------------------------------------------------------
# Cache Configuration
# ---------------------------------------------------------------------------

CACHE_CONFIG = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PARSER_CLASS': 'redis.connection.HiredisParser',
            'CONNECTION_POOL_CLASS': 'redis.BlockingConnectionPool',
            'CONNECTION_POOL_CLASS_KWARGS': {
                'max_connections': 50,
                'timeout': 20,
            },
            # Сериализация
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'mgmt',
        'TIMEOUT': 300,  # 5 минут по умолчанию
    },
    # Отдельный кэш для сессий
    'sessions': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL.replace('/0', '/1'),  # DB 1
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'session',
        'TIMEOUT': 86400,  # 24 часа
    },
    # Кэш для rate limiting
    'ratelimit': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL.replace('/0', '/2'),  # DB 2
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'rl',
    },
}

# ---------------------------------------------------------------------------
# Session Configuration (Redis-backed)
# ---------------------------------------------------------------------------

SESSION_CONFIG = {
    'SESSION_ENGINE': 'django.contrib.sessions.backends.cache',
    'SESSION_CACHE_ALIAS': 'sessions',
    'SESSION_COOKIE_AGE': 86400,  # 24 часа
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': 'Lax',
}

# ---------------------------------------------------------------------------
# Celery Configuration
# ---------------------------------------------------------------------------

CELERY_CONFIG = {
    'CELERY_BROKER_URL': REDIS_URL.replace('/0', '/3'),  # DB 3
    'CELERY_RESULT_BACKEND': REDIS_URL.replace('/0', '/4'),  # DB 4
    'CELERY_ACCEPT_CONTENT': ['json'],
    'CELERY_TASK_SERIALIZER': 'json',
    'CELERY_RESULT_SERIALIZER': 'json',
    'CELERY_TIMEZONE': 'UTC',
    'CELERY_ENABLE_UTC': True,
    'CELERY_TASK_TRACK_STARTED': True,
    'CELERY_TASK_TIME_LIMIT': 600,  # 10 минут
    'CELERY_WORKER_PREFETCH_MULTIPLIER': 1,
    'CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP': True,
}


def get_redis_settings(use_redis: bool = True) -> dict:
    """
    Получить настройки Redis для Django settings.
    
    Args:
        use_redis: Использовать Redis (True) или локальный кэш (False)
    
    Returns:
        Словарь с настройками для settings.py
    """
    if not use_redis:
        return {
            'CACHES': {
                'default': {
                    'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                    'LOCATION': 'unique-snowflake',
                }
            }
        }
    
    return {
        'CACHES': CACHE_CONFIG,
        **SESSION_CONFIG,
        **CELERY_CONFIG,
    }
