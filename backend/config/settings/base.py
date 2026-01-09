"""
=============================================================================
Django Base Settings - Общие настройки для всех окружений
=============================================================================

ВАЖНО: Этот файл содержит базовые настройки. Не используйте его напрямую!
Используйте development.py, staging.py или production.py.

Что можно безопасно менять:
- Добавлять новые приложения в INSTALLED_APPS
- Добавлять новые middleware
- Менять настройки REST_FRAMEWORK

Что нельзя менять без тестов:
- AUTH_USER_MODEL (требует пересоздания миграций)
- Настройки JWT (влияет на авторизацию)
- DATABASES (влияет на подключение)
"""

import os
from datetime import timedelta
from pathlib import Path

import environ

# =============================================================================
# Environment Configuration
# =============================================================================

# Инициализация django-environ
env = environ.Env(
    # Значения по умолчанию
    DEBUG=(bool, False),
    DJANGO_ENV=(str, 'development'),
    ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1']),
    CORS_ALLOWED_ORIGINS=(list, ['http://localhost:5173']),
)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Чтение .env файла
env_file = BASE_DIR / '.env'
if env_file.exists():
    environ.Env.read_env(str(env_file))

# =============================================================================
# Core Settings
# =============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-dev-key-change-me')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG')

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# =============================================================================
# Application Definition
# =============================================================================

# Django built-in apps
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

# Third-party apps
THIRD_PARTY_APPS = [
    'rest_framework',           # Django REST Framework
    'rest_framework_simplejwt', # JWT Authentication
    'corsheaders',              # CORS support
    'django_filters',           # Filtering for DRF
    'drf_spectacular',          # OpenAPI documentation
]

# Local apps (наши приложения)
LOCAL_APPS = [
    'apps.core',                # Общие модели, утилиты
    'apps.accounts',            # Пользователи, роли
    'apps.projects',            # Проекты
    'apps.tasks',               # Задачи
    'apps.research',            # R&D исследования
    'apps.notifications',       # Уведомления
    'apps.analytics',           # Аналитика
    'apps.external_packages',   # Внешние пакеты
    'apps.audit_logs',          # Логи и аудит
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# =============================================================================
# Middleware
# =============================================================================

MIDDLEWARE = [
    # CORS должен быть первым!
    'corsheaders.middleware.CorsMiddleware',
    
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Audit logging middleware
    'apps.audit_logs.middleware.AuditMiddleware',
    'apps.audit_logs.middleware.LoginAuditMiddleware',
]

ROOT_URLCONF = 'config.urls'

# =============================================================================
# Templates
# =============================================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# =============================================================================
# Database
# =============================================================================
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
#
# ВАЖНО: Используем отдельные базы данных для каждого модуля

DATABASES = {
    # Единая база данных с разделением по схемам
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='management_db'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='postgres'),
        'HOST': env('DB_HOST', default='db'),
        'PORT': env('DB_PORT', default='5432'),
        'ATOMIC_REQUESTS': True,
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'options': '-c search_path=public,users_schema,tasks_schema,projects_schema,packages_schema,logs_schema,files_schema'
        }
    },
}

# Database Router для маршрутизации запросов к соответствующим схемам
DATABASE_ROUTERS = ['config.db_router.SchemaRouter']

# =============================================================================
# Custom User Model
# =============================================================================
# КРИТИЧНО: Нельзя менять после создания миграций без пересоздания БД!

AUTH_USER_MODEL = 'accounts.User'

# =============================================================================
# Password Validation
# =============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# =============================================================================
# Internationalization
# =============================================================================

LANGUAGE_CODE = 'ru-RU'
TIME_ZONE = 'Asia/Tashkent'  # Узбекистан
USE_I18N = True
USE_TZ = True

# =============================================================================
# Static & Media Files
# =============================================================================

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / env('MEDIA_ROOT', default='media')

# Максимальный размер загружаемого файла
MAX_UPLOAD_SIZE_MB = env.int('MAX_UPLOAD_SIZE_MB', default=50)
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Разрешенные расширения файлов
ALLOWED_FILE_EXTENSIONS = env.list(
    'ALLOWED_FILE_EXTENSIONS',
    default=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar']
)

# =============================================================================
# Default Primary Key Field Type
# =============================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# Django REST Framework
# =============================================================================

REST_FRAMEWORK = {
    # Аутентификация
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        # Session auth для Browsable API (только dev)
        'rest_framework.authentication.SessionAuthentication',
    ],
    
    # Права доступа по умолчанию
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    
    # Пагинация
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    
    # Фильтрация
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    
    # Throttling (Rate Limiting)
    'DEFAULT_THROTTLE_CLASSES': [
        'apps.core.throttling.AnonRateThrottle',
        'apps.core.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': env('RATE_LIMIT_ANON', default='100/minute'),
        'user': env('RATE_LIMIT_USER', default='1000/minute'),
        'login': '5/minute',
        'password_reset': '3/hour',
        'burst': '60/second',
        'sustained': '10000/day',
        'file_upload': '20/hour',
    },
    
    # Рендереры
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    
    # Парсеры
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    
    # Обработка исключений
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
    
    # Формат даты/времени
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S%z',
    'DATE_FORMAT': '%Y-%m-%d',
    'TIME_FORMAT': '%H:%M:%S',
    
    # OpenAPI Schema
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# =============================================================================
# Simple JWT Configuration
# =============================================================================

SIMPLE_JWT = {
    # Время жизни токенов
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=env.int('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=15)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=env.int('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7)
    ),
    
    # Ротация refresh токенов
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    
    # Алгоритм
    'ALGORITHM': env('JWT_ALGORITHM', default='HS256'),
    'SIGNING_KEY': SECRET_KEY,
    
    # Заголовки
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    # Payload
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # Дополнительные claims
    'TOKEN_OBTAIN_SERIALIZER': 'apps.accounts.serializers.CustomTokenObtainPairSerializer',
}

# =============================================================================
# CORS Configuration
# =============================================================================

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_CREDENTIALS = env.bool('CORS_ALLOW_CREDENTIALS', default=True)

# Разрешенные заголовки
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# =============================================================================
# CSRF Configuration
# =============================================================================

CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:5173', 'http://localhost:3000']
)

# =============================================================================
# DRF Spectacular (OpenAPI)
# =============================================================================

SPECTACULAR_SETTINGS = {
    'TITLE': 'Management System API',
    'DESCRIPTION': '''
    REST API для системы управления задачами, проектами и R&D исследованиями.
    
    ## Аутентификация
    
    API использует JWT (JSON Web Tokens) для аутентификации.
    
    1. Получите токены через `POST /api/v1/auth/login/`
    2. Добавляйте заголовок `Authorization: Bearer <access_token>` к запросам
    3. Обновляйте access токен через `POST /api/v1/auth/refresh/`
    
    ## Роли пользователей
    
    - **department_head**: Начальник Департамента (полный доступ)
    - **management_head**: Начальник Управления
    - **division_head**: Начальник отдела
    - **employee**: Сотрудник
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    
    # Группировка по тегам
    'TAGS': [
        {'name': 'Auth', 'description': 'Аутентификация и авторизация'},
        {'name': 'Users', 'description': 'Управление пользователями'},
        {'name': 'Tasks', 'description': 'Управление задачами'},
        {'name': 'Projects', 'description': 'Управление проектами'},
        {'name': 'Research', 'description': 'R&D исследования'},
        {'name': 'Notifications', 'description': 'Уведомления'},
        {'name': 'Analytics', 'description': 'Аналитика и отчеты'},
    ],
    
    # Схема безопасности
    'SECURITY': [{'Bearer': []}],
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'Bearer': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
        }
    },
    
    # Примеры
    'EXAMPLES_FIELD_NAME': 'examples',
    
    # Enum naming
    'ENUM_NAME_OVERRIDES': {
        'TaskStatusEnum': 'apps.tasks.constants.TaskStatus',
        'TaskTypeEnum': 'apps.tasks.constants.TaskType',
        'UserRoleEnum': 'apps.accounts.constants.UserRole',
    },
}

# =============================================================================
# Logging Configuration
# =============================================================================

LOG_LEVEL = env('LOG_LEVEL', default='INFO')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'json': {
            '()': 'apps.core.logging.JsonFormatter',
        },
    },
    
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'app.log',
            'maxBytes': 10 * 1024 * 1024,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': LOG_LEVEL,
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'services': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Создаем директорию для логов если не существует
logs_dir = BASE_DIR / 'logs'
logs_dir.mkdir(exist_ok=True)

# =============================================================================
# Email Configuration
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Для dev

# =============================================================================
# Custom Settings (Project-specific)
# =============================================================================

# Seed data settings
CREATE_SEED_DATA = env.bool('CREATE_SEED_DATA', default=False)
DEMO_USER_PASSWORD = env('DEMO_USER_PASSWORD', default='user123')
DEMO_ADMIN_PASSWORD = env('DEMO_ADMIN_PASSWORD', default='admin123')
