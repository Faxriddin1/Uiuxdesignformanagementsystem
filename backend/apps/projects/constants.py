"""
=============================================================================
Project Constants
=============================================================================
Статусы проектов и конфигурация переходов.
"""

from django.db import models


class ProjectStatus(models.TextChoices):
    """
    Статусы проекта с 4-шаговым процессом.
    """
    DRAFT = 'draft', 'Черновик'
    PLANNING = 'planning', 'Планирование'
    IN_PROGRESS = 'in_progress', 'В работе'
    REVIEW = 'review', 'На проверке'
    COMPLETED = 'completed', 'Завершён'
    ON_HOLD = 'on_hold', 'На паузе'
    CANCELLED = 'cancelled', 'Отменён'


class ProjectPriority(models.TextChoices):
    """
    Приоритеты проекта.
    """
    LOW = 'low', 'Низкий'
    MEDIUM = 'medium', 'Средний'
    HIGH = 'high', 'Высокий'
    CRITICAL = 'critical', 'Критический'


# ==========================================
# Переходы статусов проектов
# ==========================================

ALLOWED_PROJECT_TRANSITIONS: dict[str, list[str]] = {
    ProjectStatus.DRAFT: [
        ProjectStatus.PLANNING,
        ProjectStatus.CANCELLED,
    ],
    ProjectStatus.PLANNING: [
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.ON_HOLD,
        ProjectStatus.CANCELLED,
    ],
    ProjectStatus.IN_PROGRESS: [
        ProjectStatus.REVIEW,
        ProjectStatus.ON_HOLD,
        ProjectStatus.CANCELLED,
    ],
    ProjectStatus.REVIEW: [
        ProjectStatus.COMPLETED,
        ProjectStatus.IN_PROGRESS,  # Возврат на доработку
        ProjectStatus.CANCELLED,
    ],
    ProjectStatus.ON_HOLD: [
        ProjectStatus.PLANNING,
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.CANCELLED,
    ],
    ProjectStatus.COMPLETED: [],  # Финальный статус
    ProjectStatus.CANCELLED: [],  # Финальный статус
}


def is_valid_project_transition(from_status: str, to_status: str) -> bool:
    """
    Проверяет допустимость перехода между статусами проекта.
    """
    allowed = ALLOWED_PROJECT_TRANSITIONS.get(from_status, [])
    return to_status in allowed


# ==========================================
# Шаги проекта (4-step stepper)
# ==========================================

PROJECT_STEPS = [
    {'key': 'planning', 'label': 'Планирование', 'status': ProjectStatus.PLANNING},
    {'key': 'in_progress', 'label': 'В работе', 'status': ProjectStatus.IN_PROGRESS},
    {'key': 'review', 'label': 'Проверка', 'status': ProjectStatus.REVIEW},
    {'key': 'completed', 'label': 'Завершено', 'status': ProjectStatus.COMPLETED},
]


def get_project_step_index(status: str) -> int:
    """
    Возвращает индекс шага для статуса проекта (0-3).
    Возвращает -1 для draft, on_hold, cancelled.
    """
    for i, step in enumerate(PROJECT_STEPS):
        if step['status'] == status:
            return i
    return -1
