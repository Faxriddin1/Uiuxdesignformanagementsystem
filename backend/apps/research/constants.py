"""
=============================================================================
Research Constants
=============================================================================
Статусы исследований и конфигурация workflow.
"""

from django.db import models


class ResearchStatus(models.TextChoices):
    """
    Статусы исследования.
    """
    DRAFT = 'draft', 'Черновик'
    IN_PROGRESS = 'in_progress', 'В процессе'
    SUBMITTED = 'submitted', 'На проверке'
    APPROVED = 'approved', 'Одобрено'
    REJECTED = 'rejected', 'Отклонено'
    ARCHIVED = 'archived', 'В архиве'


class ResearchType(models.TextChoices):
    """
    Типы исследований.
    """
    MARKET = 'market', 'Маркетинговое'
    TECHNICAL = 'technical', 'Техническое'
    COMPETITIVE = 'competitive', 'Конкурентный анализ'
    USER = 'user', 'Пользовательское'
    FEASIBILITY = 'feasibility', 'Анализ осуществимости'
    OTHER = 'other', 'Другое'


class ResearchPriority(models.TextChoices):
    """
    Приоритеты исследования.
    """
    LOW = 'low', 'Низкий'
    MEDIUM = 'medium', 'Средний'
    HIGH = 'high', 'Высокий'


class AccessLevel(models.TextChoices):
    """
    Уровни доступа к исследованию.
    """
    PUBLIC = 'public', 'Публичное (все сотрудники)'
    DIVISION = 'division', 'Подразделение'
    RESTRICTED = 'restricted', 'Ограниченный доступ'
    PRIVATE = 'private', 'Приватное'


# ==========================================
# Переходы статусов исследований
# ==========================================

ALLOWED_RESEARCH_TRANSITIONS: dict[str, list[str]] = {
    ResearchStatus.DRAFT: [
        ResearchStatus.IN_PROGRESS,
    ],
    ResearchStatus.IN_PROGRESS: [
        ResearchStatus.SUBMITTED,
        ResearchStatus.DRAFT,  # Возврат в черновик
    ],
    ResearchStatus.SUBMITTED: [
        ResearchStatus.APPROVED,
        ResearchStatus.REJECTED,
    ],
    ResearchStatus.REJECTED: [
        ResearchStatus.IN_PROGRESS,  # Доработка
    ],
    ResearchStatus.APPROVED: [
        ResearchStatus.ARCHIVED,
    ],
    ResearchStatus.ARCHIVED: [],  # Финальный статус
}


def is_valid_research_transition(from_status: str, to_status: str) -> bool:
    """
    Проверяет допустимость перехода между статусами исследования.
    """
    allowed = ALLOWED_RESEARCH_TRANSITIONS.get(from_status, [])
    return to_status in allowed
