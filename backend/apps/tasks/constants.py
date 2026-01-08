"""
=============================================================================
Константы для модуля Tasks
=============================================================================

Централизованное хранение всех статусов, типов и настроек workflow.

ВАЖНО: Изменение статусов требует проверки ALLOWED_TRANSITIONS!
"""

from django.db import models


class TaskType(models.TextChoices):
    """
    Типы задач.
    
    T1 - Секретная:
        - Видна только исполнителю и Начальнику Управления
        - Маршрут: Исполнитель → Начальник Управления
        
    T2 - Обычная:
        - Видна всем в отделе
        - Маршрут: Исполнитель → Начальник отдела → Начальник Управления
    """
    
    T1 = 'T1', 'Секретная (Confidential)'
    T2 = 'T2', 'Обычная (Standard)'


class TaskStatus(models.TextChoices):
    """
    Статусы задачи.
    
    Workflow:
    NEW → IN_PROGRESS → UNDER_DIVISION_REVIEW → UNDER_MANAGEMENT_REVIEW → ACCEPTED
                     ↓                        ↓                        ↓
                     └────────────────────────┴── REWORK ──────────────┘
    
    НЕЛЬЗЯ менять значения без миграции!
    """
    
    NEW = 'new', 'Новая'
    IN_PROGRESS = 'in_progress', 'В работе'
    UNDER_DIVISION_REVIEW = 'under_division_review', 'На проверке (Нач. отдела)'
    UNDER_MANAGEMENT_REVIEW = 'under_management_review', 'На рассмотрении (Нач. Управления)'
    REWORK = 'rework', 'На доработке'
    REWORK_WITHDRAWN = 'rework_withdrawn', 'На доработке (отозвано)'
    ACCEPTED = 'accepted', 'Принято (Закрыто)'


class ApprovalRoute(models.TextChoices):
    """
    Маршруты приемки задачи.
    """
    
    MANAGEMENT_ONLY = 'management_only', 'Только Начальник Управления (T1)'
    DIVISION_THEN_MANAGEMENT = 'division_then_management', 'Отдел → Управление (T2)'
    CUSTOM = 'custom', 'Кастомный маршрут'


class TaskPriority(models.TextChoices):
    """Приоритеты задачи."""
    
    LOW = 'low', 'Низкий'
    MEDIUM = 'medium', 'Средний'
    HIGH = 'high', 'Высокий'
    URGENT = 'urgent', 'Срочный'


class TaskCategory(models.TextChoices):
    """Категории задач для внешних запросов."""
    
    STANDARD = 'standard', 'Обычные задачи'
    EXTERNAL_ORG = 'external_org', 'Внешняя организация'
    EXTERNAL_BRANCH = 'external_branch', 'Внешний филиал'
    EXTERNAL_MANAGEMENT = 'external_management', 'Внешнее руководство'


class ResultVersionStatus(models.TextChoices):
    """Статусы версии результата."""
    
    CURRENT = 'current', 'Текущая'
    WITHDRAWN = 'withdrawn', 'Отозвана'
    REJECTED = 'rejected', 'Отклонена'


# =============================================================================
# Workflow Configuration
# =============================================================================

# Допустимые переходы между статусами
# Формат: {текущий_статус: [допустимые_новые_статусы]}
ALLOWED_TRANSITIONS = {
    TaskStatus.NEW: [
        TaskStatus.IN_PROGRESS,  # Взять в работу
    ],
    TaskStatus.IN_PROGRESS: [
        TaskStatus.UNDER_DIVISION_REVIEW,   # Отправить на проверку (T2)
        TaskStatus.UNDER_MANAGEMENT_REVIEW, # Отправить на рассмотрение (T1)
    ],
    TaskStatus.UNDER_DIVISION_REVIEW: [
        TaskStatus.UNDER_MANAGEMENT_REVIEW,  # Начальник отдела одобрил
        TaskStatus.REWORK,                   # Вернуть на доработку
        TaskStatus.REWORK_WITHDRAWN,         # Исполнитель отозвал
    ],
    TaskStatus.UNDER_MANAGEMENT_REVIEW: [
        TaskStatus.ACCEPTED,                 # Принять
        TaskStatus.REWORK,                   # Вернуть на доработку
        TaskStatus.REWORK_WITHDRAWN,         # Исполнитель отозвал
    ],
    TaskStatus.REWORK: [
        TaskStatus.UNDER_DIVISION_REVIEW,    # Повторно на проверку (T2)
        TaskStatus.UNDER_MANAGEMENT_REVIEW,  # Повторно на рассмотрение (T1)
    ],
    TaskStatus.REWORK_WITHDRAWN: [
        TaskStatus.IN_PROGRESS,              # Продолжить работу
        TaskStatus.UNDER_DIVISION_REVIEW,    # Снова на проверку
        TaskStatus.UNDER_MANAGEMENT_REVIEW,  # Снова на рассмотрение
    ],
    TaskStatus.ACCEPTED: [],  # Финальный статус
}


def is_valid_transition(from_status: str, to_status: str) -> bool:
    """
    Проверка допустимости перехода между статусами.
    
    Args:
        from_status: Текущий статус
        to_status: Новый статус
        
    Returns:
        True если переход допустим
    """
    allowed = ALLOWED_TRANSITIONS.get(from_status, [])
    return to_status in allowed


def get_allowed_transitions(status: str) -> list:
    """
    Получить список допустимых переходов из текущего статуса.
    
    Args:
        status: Текущий статус
        
    Returns:
        Список допустимых статусов
    """
    return ALLOWED_TRANSITIONS.get(status, [])


# Статусы, в которых задача считается "на рассмотрении"
REVIEW_STATUSES = [
    TaskStatus.UNDER_DIVISION_REVIEW,
    TaskStatus.UNDER_MANAGEMENT_REVIEW,
]

# Статусы, в которых задача считается "активной" (не закрыта)
ACTIVE_STATUSES = [
    TaskStatus.NEW,
    TaskStatus.IN_PROGRESS,
    TaskStatus.UNDER_DIVISION_REVIEW,
    TaskStatus.UNDER_MANAGEMENT_REVIEW,
    TaskStatus.REWORK,
    TaskStatus.REWORK_WITHDRAWN,
]

# Статусы, в которых задача считается "в работе"
WORKING_STATUSES = [
    TaskStatus.IN_PROGRESS,
    TaskStatus.REWORK,
    TaskStatus.REWORK_WITHDRAWN,
]
