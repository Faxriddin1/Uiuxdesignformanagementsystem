"""
=============================================================================
Audit Log Middleware
=============================================================================

Middleware для логирования действий пользователей.
Записывает информацию о запросах в структурированном формате.
"""

import json
import logging
import time
import uuid

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('apps.audit')


class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware для аудит-логирования.
    
    Логирует:
    - HTTP метод и путь
    - Пользователь (если аутентифицирован)
    - IP адрес
    - Время выполнения
    - Статус ответа
    
    Не логирует:
    - GET запросы (можно включить через настройки)
    - Статические файлы
    - Health check эндпоинты
    """
    
    # Пути, которые не логируем
    EXCLUDED_PATHS = [
        '/api/v1/health/',
        '/static/',
        '/media/',
        '/__debug__/',
        '/admin/jsi18n/',
    ]
    
    # Методы, которые всегда логируем
    LOGGED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    def process_request(self, request):
        """Запоминаем время начала запроса."""
        request._start_time = time.time()
        request._request_id = str(uuid.uuid4())[:8]
    
    def process_response(self, request, response):
        """Логируем информацию о запросе."""
        # Пропускаем исключенные пути
        if any(request.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return response
        
        # Пропускаем GET запросы (опционально)
        if request.method not in self.LOGGED_METHODS:
            return response
        
        # Вычисляем время выполнения
        duration = 0
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
        
        # Получаем информацию о пользователе
        user_id = None
        user_email = None
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_id = str(request.user.id)
            user_email = request.user.email
        
        # Получаем IP адрес
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR', 'unknown')
        
        # Формируем лог-запись
        log_data = {
            'request_id': getattr(request, '_request_id', 'unknown'),
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'user_id': user_id,
            'user_email': user_email,
            'ip_address': ip_address,
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200],
        }
        
        # Логируем
        if response.status_code >= 400:
            logger.warning(f"API Request: {json.dumps(log_data, ensure_ascii=False)}")
        else:
            logger.info(f"API Request: {json.dumps(log_data, ensure_ascii=False)}")
        
        return response
