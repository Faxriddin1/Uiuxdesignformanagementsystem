"""
Middleware для автоматического логирования действий пользователей.
"""

import json
from django.utils.deprecation import MiddlewareMixin
from django.contrib.contenttypes.models import ContentType
from apps.audit_logs.models import AuditLog


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware для логирования всех HTTP запросов.
    """
    
    # Методы, которые логируем
    LOGGABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    # URL patterns, которые НЕ логируем
    EXCLUDED_PATHS = [
        '/api/v1/health/',
        '/admin/jsi18n/',
        '/static/',
        '/media/',
    ]
    
    def process_request(self, request):
        """Сохраняем начало запроса."""
        request._audit_start_time = None
        return None
    
    def process_response(self, request, response):
        """Логируем запрос после его выполнения."""
        
        # Проверяем, нужно ли логировать этот запрос
        if not self._should_log_request(request):
            return response
        
        # Определяем тип действия
        action = self._get_action_type(request, response)
        if not action:
            return response
        
        # Получаем IP адрес
        ip_address = self._get_client_ip(request)
        
        # Получаем User Agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Создаем лог
        try:
            audit_log = AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action=action,
                ip_address=ip_address,
                user_agent=user_agent,
                request_url=request.path,
                request_method=request.method,
                success=200 <= response.status_code < 400,
                error_message=self._get_error_message(response) if response.status_code >= 400 else '',
                extra_data=self._get_request_data(request)
            )
        except Exception as e:
            # Не блокируем запрос если логирование не удалось
            print(f"Audit logging error: {e}")
        
        return response
    
    def _should_log_request(self, request):
        """Проверяет, нужно ли логировать запрос."""
        
        # Не логируем GET запросы (слишком много)
        if request.method not in self.LOGGABLE_METHODS:
            return False
        
        # Не логируем исключенные пути
        for excluded_path in self.EXCLUDED_PATHS:
            if request.path.startswith(excluded_path):
                return False
        
        return True
    
    def _get_action_type(self, request, response):
        """Определяет тип действия на основе метода и URL."""
        
        if request.method == 'POST':
            if 'login' in request.path:
                return AuditLog.ActionType.LOGIN
            return AuditLog.ActionType.CREATE
        
        elif request.method == 'PUT' or request.method == 'PATCH':
            if 'status' in request.path or 'approve' in request.path or 'reject' in request.path:
                return AuditLog.ActionType.STATUS_CHANGE
            return AuditLog.ActionType.UPDATE
        
        elif request.method == 'DELETE':
            return AuditLog.ActionType.DELETE
        
        return None
    
    def _get_client_ip(self, request):
        """Получает реальный IP адрес клиента."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _get_request_data(self, request):
        """Извлекает данные из запроса (без чувствительной информации)."""
        data = {}
        
        try:
            if request.method in ['POST', 'PUT', 'PATCH']:
                body = request.body.decode('utf-8')
                if body:
                    request_data = json.loads(body)
                    # Удаляем чувствительные поля
                    sensitive_fields = ['password', 'token', 'secret', 'api_key']
                    for field in sensitive_fields:
                        if field in request_data:
                            request_data[field] = '***REDACTED***'
                    data['request_body'] = request_data
        except:
            pass
        
        return data
    
    def _get_error_message(self, response):
        """Извлекает сообщение об ошибке из ответа."""
        try:
            if hasattr(response, 'content'):
                content = json.loads(response.content.decode('utf-8'))
                return content.get('detail') or content.get('error') or f"HTTP {response.status_code}"
        except:
            pass
        return f"HTTP {response.status_code}"


class LoginAuditMiddleware(MiddlewareMixin):
    """
    Отдельный middleware для логирования входов в систему.
    """
    
    def process_request(self, request):
        """Логируем успешные входы в систему."""
        
        # Проверяем, произошла ли аутентификация
        if request.user.is_authenticated and not hasattr(request, '_login_logged'):
            # Помечаем, что уже залогировали этот вход
            request._login_logged = True
            
            # Импортируем здесь, чтобы избежать циклических импортов
            from apps.audit_logs.models import LoginHistory
            
            try:
                LoginHistory.objects.create(
                    user=request.user,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    session_key=request.session.session_key if hasattr(request, 'session') else '',
                    success=True
                )
            except Exception as e:
                print(f"Login logging error: {e}")
        
        return None
    
    def _get_client_ip(self, request):
        """Получает реальный IP адрес клиента."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
