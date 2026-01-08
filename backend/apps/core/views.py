"""
=============================================================================
Core Views
=============================================================================
"""

from django.db import connection

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """
    Health Check эндпоинт.
    
    Проверяет:
    - Работоспособность API
    - Подключение к БД
    
    Используется для:
    - Docker HEALTHCHECK
    - Kubernetes liveness/readiness probes
    - Мониторинг
    """
    
    permission_classes = [AllowAny]
    authentication_classes = []  # Без аутентификации
    
    def get(self, request):
        # Проверяем подключение к БД
        db_ok = True
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
        except Exception:
            db_ok = False
        
        health_status = {
            'status': 'healthy' if db_ok else 'unhealthy',
            'database': 'connected' if db_ok else 'disconnected',
        }
        
        status_code = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return Response(health_status, status=status_code)
