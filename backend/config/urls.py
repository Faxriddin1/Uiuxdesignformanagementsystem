"""
=============================================================================
URL Configuration - Главный роутер
=============================================================================

Все API endpoints начинаются с /api/v1/
Документация доступна по /api/docs/ и /api/redoc/
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# =============================================================================
# API v1 URLs
# =============================================================================

api_v1_patterns = [
    # Аутентификация
    path('auth/', include('apps.accounts.urls.auth_urls')),
    
    # Пользователи
    path('users/', include('apps.accounts.urls.user_urls')),
    
    # Проекты
    path('projects/', include('apps.projects.urls')),
    
    # Задачи
    path('tasks/', include('apps.tasks.urls')),
    
    # Исследования
    path('research/', include('apps.research.urls')),
    
    # Уведомления
    path('notifications/', include('apps.notifications.urls')),
    
    # Аналитика
    path('analytics/', include('apps.analytics.urls')),
    
    # Внешние пакеты
    path('external-packages/', include('apps.external_packages.urls')),
    
    # Health check
    path('health/', include('apps.core.urls')),
]

# =============================================================================
# Main URL Patterns
# =============================================================================

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/', include(api_v1_patterns)),
    
    # OpenAPI Schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    
    # Swagger UI
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # ReDoc
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# =============================================================================
# Development URLs
# =============================================================================

if settings.DEBUG:
    # Статические и медиа файлы в dev
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Debug Toolbar
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass
