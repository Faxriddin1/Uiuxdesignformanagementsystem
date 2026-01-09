"""
Rate Limiting / Throttling для API
===================================

Настройка ограничения запросов для защиты от:
- Брутфорса
- DDoS атак
- Злоупотребления API

Использование:
    В views.py:
        from apps.core.throttling import LoginRateThrottle
        
        class LoginView(APIView):
            throttle_classes = [LoginRateThrottle]
    
    Или глобально в settings.py:
        REST_FRAMEWORK = {
            'DEFAULT_THROTTLE_CLASSES': [
                'apps.core.throttling.AnonRateThrottle',
                'apps.core.throttling.UserRateThrottle',
            ],
        }
"""

from rest_framework.throttling import AnonRateThrottle as BaseAnonThrottle
from rest_framework.throttling import UserRateThrottle as BaseUserThrottle
from rest_framework.throttling import SimpleRateThrottle


class AnonRateThrottle(BaseAnonThrottle):
    """
    Ограничение для анонимных пользователей.
    
    Лимит: 100 запросов/минуту (настраивается в settings)
    """
    rate = '100/minute'
    
    def get_cache_key(self, request, view):
        """Ключ кэша на основе IP адреса."""
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }


class UserRateThrottle(BaseUserThrottle):
    """
    Ограничение для авторизованных пользователей.
    
    Лимит: 1000 запросов/минуту (настраивается в settings)
    """
    rate = '1000/minute'
    
    def get_cache_key(self, request, view):
        """Ключ кэша на основе user ID."""
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class LoginRateThrottle(SimpleRateThrottle):
    """
    Строгое ограничение для эндпоинта логина.
    
    Защита от брутфорса: 5 попыток/минуту на IP
    """
    scope = 'login'
    rate = '5/minute'
    
    def get_cache_key(self, request, view):
        """Ключ на основе IP + username (если есть)."""
        ident = self.get_ident(request)
        
        # Добавляем username для более точного ограничения
        username = request.data.get('email', '') or request.data.get('username', '')
        if username:
            ident = f"{ident}_{username}"
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class PasswordResetRateThrottle(SimpleRateThrottle):
    """
    Ограничение для сброса пароля.
    
    Лимит: 3 запроса/час на email
    """
    scope = 'password_reset'
    rate = '3/hour'
    
    def get_cache_key(self, request, view):
        email = request.data.get('email', '')
        if email:
            return self.cache_format % {
                'scope': self.scope,
                'ident': email.lower()
            }
        return None


class BurstRateThrottle(SimpleRateThrottle):
    """
    Защита от burst запросов.
    
    Лимит: 60 запросов/секунду (для API под нагрузкой)
    """
    scope = 'burst'
    rate = '60/second'
    
    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class SustainedRateThrottle(SimpleRateThrottle):
    """
    Ограничение на длительный период.
    
    Лимит: 10000 запросов/день
    """
    scope = 'sustained'
    rate = '10000/day'
    
    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class FileUploadRateThrottle(SimpleRateThrottle):
    """
    Ограничение для загрузки файлов.
    
    Лимит: 20 файлов/час
    """
    scope = 'file_upload'
    rate = '20/hour'
    
    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return self.cache_format % {
                'scope': self.scope,
                'ident': request.user.pk
            }
        return None  # Анонимные не могут загружать файлы
