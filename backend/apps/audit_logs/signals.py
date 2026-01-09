"""
Django signals для автоматического логирования изменений моделей.
"""

from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from apps.audit_logs.models import AuditLog


def get_current_request():
    """
    Получает текущий request из middleware.
    Требует использования LocalMiddleware.
    """
    try:
        from apps.audit_logs.middleware import thread_local
        return getattr(thread_local, 'request', None)
    except:
        return None


@receiver(post_save)
def log_model_save(sender, instance, created, **kwargs):
    """
    Логирует создание и изменение моделей.
    """
    
    # Исключаем логирование самих логов
    if sender._meta.app_label == 'audit_logs':
        return
    
    # Исключаем системные модели Django
    if sender._meta.app_label in ['admin', 'sessions', 'contenttypes']:
        return
    
    request = get_current_request()
    
    try:
        AuditLog.objects.create(
            user=request.user if request and request.user.is_authenticated else None,
            action=AuditLog.ActionType.CREATE if created else AuditLog.ActionType.UPDATE,
            content_type=ContentType.objects.get_for_model(sender),
            object_id=str(instance.pk),
            object_repr=str(instance)[:500],
            ip_address=_get_ip_from_request(request),
            user_agent=_get_user_agent_from_request(request),
        )
    except Exception as e:
        print(f"Model save logging error: {e}")


@receiver(post_delete)
def log_model_delete(sender, instance, **kwargs):
    """
    Логирует удаление моделей.
    """
    
    # Исключаем логирование самих логов
    if sender._meta.app_label == 'audit_logs':
        return
    
    # Исключаем системные модели Django
    if sender._meta.app_label in ['admin', 'sessions', 'contenttypes']:
        return
    
    request = get_current_request()
    
    try:
        AuditLog.objects.create(
            user=request.user if request and request.user.is_authenticated else None,
            action=AuditLog.ActionType.DELETE,
            content_type=ContentType.objects.get_for_model(sender),
            object_id=str(instance.pk),
            object_repr=str(instance)[:500],
            ip_address=_get_ip_from_request(request),
            user_agent=_get_user_agent_from_request(request),
        )
    except Exception as e:
        print(f"Model delete logging error: {e}")


def _get_ip_from_request(request):
    """Получает IP адрес из запроса."""
    if not request:
        return None
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _get_user_agent_from_request(request):
    """Получает User Agent из запроса."""
    if not request:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')
