"""
=============================================================================
Custom Exception Handler для DRF
=============================================================================

Обеспечивает единый формат ошибок для всего API.

Формат ответа об ошибке:
{
    "error": {
        "code": "validation_error",
        "message": "Ошибка валидации",
        "details": {...}
    }
}
"""

import logging

from django.core.exceptions import PermissionDenied, ValidationError
from django.http import Http404

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class ErrorCode:
    """
    Коды ошибок для API.
    
    Добавляйте новые коды сюда для единообразия.
    """
    
    # Аутентификация
    AUTHENTICATION_FAILED = 'authentication_failed'
    TOKEN_EXPIRED = 'token_expired'
    TOKEN_INVALID = 'token_invalid'
    
    # Авторизация
    PERMISSION_DENIED = 'permission_denied'
    NOT_AUTHENTICATED = 'not_authenticated'
    
    # Валидация
    VALIDATION_ERROR = 'validation_error'
    INVALID_INPUT = 'invalid_input'
    
    # Ресурсы
    NOT_FOUND = 'not_found'
    ALREADY_EXISTS = 'already_exists'
    
    # Бизнес-логика
    INVALID_STATE_TRANSITION = 'invalid_state_transition'
    WORKFLOW_ERROR = 'workflow_error'
    BUSINESS_RULE_VIOLATION = 'business_rule_violation'
    
    # Сервер
    INTERNAL_ERROR = 'internal_error'
    SERVICE_UNAVAILABLE = 'service_unavailable'


class BusinessLogicException(APIException):
    """
    Исключение для ошибок бизнес-логики.
    
    Использование:
        raise BusinessLogicException(
            message="Нельзя одобрить задачу без результата",
            code=ErrorCode.BUSINESS_RULE_VIOLATION
        )
    """
    
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Ошибка бизнес-логики'
    default_code = ErrorCode.BUSINESS_RULE_VIOLATION
    
    def __init__(self, message=None, code=None, details=None):
        self.message = message or self.default_detail
        self.code = code or self.default_code
        self.details = details
        super().__init__(detail=message)


class WorkflowException(BusinessLogicException):
    """Исключение для ошибок workflow."""
    
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Недопустимый переход состояния'
    default_code = ErrorCode.INVALID_STATE_TRANSITION


class ResourceNotFoundException(APIException):
    """Ресурс не найден."""
    
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Ресурс не найден'
    default_code = ErrorCode.NOT_FOUND


def custom_exception_handler(exc, context):
    """
    Кастомный обработчик исключений для единого формата ошибок.
    
    Все ошибки приводятся к формату:
    {
        "error": {
            "code": "error_code",
            "message": "Человекочитаемое сообщение",
            "details": {...}  # Опционально
        }
    }
    """
    
    # Сначала вызываем стандартный обработчик DRF
    response = exception_handler(exc, context)
    
    # Логируем ошибку
    logger.error(
        f"API Error: {type(exc).__name__}: {str(exc)}",
        exc_info=True,
        extra={
            'view': context.get('view'),
            'request': context.get('request'),
        }
    )
    
    # Обработка кастомных исключений
    if isinstance(exc, BusinessLogicException):
        error_response = {
            'error': {
                'code': exc.code,
                'message': exc.message,
            }
        }
        if exc.details:
            error_response['error']['details'] = exc.details
        
        return Response(error_response, status=exc.status_code)
    
    # Обработка Django исключений
    if isinstance(exc, Http404):
        return Response({
            'error': {
                'code': ErrorCode.NOT_FOUND,
                'message': 'Запрашиваемый ресурс не найден',
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    if isinstance(exc, PermissionDenied):
        return Response({
            'error': {
                'code': ErrorCode.PERMISSION_DENIED,
                'message': str(exc) or 'Доступ запрещен',
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    if isinstance(exc, ValidationError):
        return Response({
            'error': {
                'code': ErrorCode.VALIDATION_ERROR,
                'message': 'Ошибка валидации',
                'details': exc.message_dict if hasattr(exc, 'message_dict') else str(exc),
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Если DRF обработал исключение
    if response is not None:
        # Преобразуем к нашему формату
        error_data = response.data
        
        # Определяем код ошибки
        if response.status_code == 401:
            code = ErrorCode.NOT_AUTHENTICATED
        elif response.status_code == 403:
            code = ErrorCode.PERMISSION_DENIED
        elif response.status_code == 404:
            code = ErrorCode.NOT_FOUND
        elif response.status_code == 400:
            code = ErrorCode.VALIDATION_ERROR
        else:
            code = ErrorCode.INTERNAL_ERROR
        
        # Формируем сообщение
        if isinstance(error_data, dict):
            if 'detail' in error_data:
                message = error_data['detail']
                details = None
            else:
                message = 'Ошибка валидации'
                details = error_data
        elif isinstance(error_data, list):
            message = error_data[0] if error_data else 'Ошибка'
            details = error_data
        else:
            message = str(error_data)
            details = None
        
        response.data = {
            'error': {
                'code': code,
                'message': message,
            }
        }
        if details:
            response.data['error']['details'] = details
    
    # Необработанные исключения
    if response is None:
        logger.exception(f"Unhandled exception: {exc}")
        return Response({
            'error': {
                'code': ErrorCode.INTERNAL_ERROR,
                'message': 'Внутренняя ошибка сервера',
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response
