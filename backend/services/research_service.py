"""
=============================================================================
Research Service
=============================================================================
Бизнес-логика для работы с исследованиями.
"""

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.research.constants import (
    ALLOWED_RESEARCH_TRANSITIONS,
    AccessLevel,
    ResearchStatus,
    is_valid_research_transition,
)
from apps.research.models import Research, ResearchAccess, ResearchHistory


class ResearchService:
    """
    Сервис для работы с исследованиями.
    """

    @classmethod
    @transaction.atomic
    def create_research(
        cls,
        *,
        title: str,
        user: User,
        description: str = '',
        objectives: str = '',
        methodology: str = '',
        research_type: str = 'other',
        priority: str = 'medium',
        access_level: str = 'division',
        division: str = 'rnd',
        contributor_ids: list[str] | None = None,
        start_date=None,
        due_date=None,
        project=None,
        tags: list[str] | None = None,
    ) -> Research:
        """
        Создаёт новое исследование.
        """
        research = Research.objects.create(
            title=title,
            description=description,
            objectives=objectives,
            methodology=methodology,
            research_type=research_type,
            priority=priority,
            access_level=access_level,
            division=division,
            author=user,
            start_date=start_date,
            due_date=due_date,
            project=project,
            tags=tags or [],
            status=ResearchStatus.DRAFT,
            created_by=user,
        )
        
        if contributor_ids:
            contributors = User.objects.filter(id__in=contributor_ids)
            research.contributors.set(contributors)
        
        # Записываем в историю
        cls._log_history(research, user, 'created', {
            'title': title,
        })
        
        return research

    @classmethod
    @transaction.atomic
    def start_research(cls, research: Research, user: User) -> Research:
        """
        Начинает работу над исследованием (draft -> in_progress).
        """
        if research.status != ResearchStatus.DRAFT:
            raise ValueError('Можно начать только исследование в статусе "Черновик".')
        
        research.status = ResearchStatus.IN_PROGRESS
        if not research.start_date:
            research.start_date = timezone.now().date()
        research.save(update_fields=['status', 'start_date', 'updated_at'])
        
        cls._log_history(research, user, 'started', {})
        
        return research

    @classmethod
    @transaction.atomic
    def submit_for_review(
        cls,
        research: Research,
        user: User,
        findings: str = '',
        recommendations: str = '',
        comment: str = '',
    ) -> Research:
        """
        Отправляет исследование на проверку.
        """
        if research.status != ResearchStatus.IN_PROGRESS:
            raise ValueError('Можно отправить только исследование в статусе "В процессе".')
        
        # Проверяем, что пользователь имеет право
        if not cls._can_submit(research, user):
            raise PermissionError('У вас нет прав для отправки этого исследования.')
        
        if findings:
            research.findings = findings
        if recommendations:
            research.recommendations = recommendations
        
        research.status = ResearchStatus.SUBMITTED
        research.save(update_fields=['status', 'findings', 'recommendations', 'updated_at'])
        
        cls._log_history(research, user, 'submitted', {
            'comment': comment,
        })
        
        # Уведомление
        from services.notification_service import NotificationService
        NotificationService.notify_research_submitted(research, user)
        
        return research

    @classmethod
    @transaction.atomic
    def approve_research(
        cls,
        research: Research,
        user: User,
        comment: str = '',
    ) -> Research:
        """
        Одобряет исследование.
        """
        if research.status != ResearchStatus.SUBMITTED:
            raise ValueError('Можно одобрить только исследование на проверке.')
        
        # Проверяем права на одобрение
        if not cls._can_review(research, user):
            raise PermissionError('У вас нет прав для одобрения этого исследования.')
        
        research.status = ResearchStatus.APPROVED
        research.completed_at = timezone.now()
        research.save(update_fields=['status', 'completed_at', 'updated_at'])
        
        cls._log_history(research, user, 'approved', {
            'comment': comment,
        })
        
        # Уведомление
        from services.notification_service import NotificationService
        NotificationService.notify_research_approved(research, user)
        
        return research

    @classmethod
    @transaction.atomic
    def reject_research(
        cls,
        research: Research,
        user: User,
        comment: str = '',
    ) -> Research:
        """
        Отклоняет исследование.
        """
        if research.status != ResearchStatus.SUBMITTED:
            raise ValueError('Можно отклонить только исследование на проверке.')
        
        if not cls._can_review(research, user):
            raise PermissionError('У вас нет прав для отклонения этого исследования.')
        
        research.status = ResearchStatus.REJECTED
        research.save(update_fields=['status', 'updated_at'])
        
        cls._log_history(research, user, 'rejected', {
            'comment': comment,
        })
        
        # Уведомление
        from services.notification_service import NotificationService
        NotificationService.notify_research_rejected(research, user, comment)
        
        return research

    @classmethod
    @transaction.atomic
    def reopen_research(cls, research: Research, user: User) -> Research:
        """
        Возвращает отклонённое исследование в работу.
        """
        if research.status != ResearchStatus.REJECTED:
            raise ValueError('Можно вернуть в работу только отклонённое исследование.')
        
        research.status = ResearchStatus.IN_PROGRESS
        research.save(update_fields=['status', 'updated_at'])
        
        cls._log_history(research, user, 'reopened', {})
        
        return research

    @classmethod
    @transaction.atomic
    def archive_research(cls, research: Research, user: User) -> Research:
        """
        Архивирует одобренное исследование.
        """
        if research.status != ResearchStatus.APPROVED:
            raise ValueError('Можно архивировать только одобренное исследование.')
        
        research.status = ResearchStatus.ARCHIVED
        research.save(update_fields=['status', 'updated_at'])
        
        cls._log_history(research, user, 'archived', {})
        
        return research

    @classmethod
    @transaction.atomic
    def grant_access(
        cls,
        research: Research,
        user_id: str,
        granted_by: User,
        can_edit: bool = False,
    ) -> ResearchAccess:
        """
        Выдаёт доступ к исследованию.
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValueError('Пользователь не найден.')
        
        access, created = ResearchAccess.objects.update_or_create(
            research=research,
            user=user,
            defaults={
                'can_edit': can_edit,
                'granted_by': granted_by,
            }
        )
        
        cls._log_history(research, granted_by, 'access_granted', {
            'user_name': user.full_name,
            'can_edit': can_edit,
        })
        
        return access

    @classmethod
    @transaction.atomic
    def revoke_access(
        cls,
        research: Research,
        user_id: str,
        revoked_by: User,
    ) -> bool:
        """
        Отзывает доступ к исследованию.
        """
        try:
            user = User.objects.get(id=user_id)
            access = ResearchAccess.objects.get(research=research, user=user)
            access.delete()
            
            cls._log_history(research, revoked_by, 'access_revoked', {
                'user_name': user.full_name,
            })
            
            return True
        except (User.DoesNotExist, ResearchAccess.DoesNotExist):
            return False

    @classmethod
    def check_access(cls, research: Research, user: User) -> bool:
        """
        Проверяет, имеет ли пользователь доступ к исследованию.
        """
        # Автор всегда имеет доступ
        if research.author == user:
            return True
        
        # Соавторы имеют доступ
        if research.contributors.filter(id=user.id).exists():
            return True
        
        # Публичные исследования
        if research.access_level == AccessLevel.PUBLIC:
            return True
        
        # Доступ по подразделению
        if research.access_level == AccessLevel.DIVISION:
            if user.division == research.division:
                return True
        
        # Ограниченный доступ - проверяем персональный доступ
        if research.access_level == AccessLevel.RESTRICTED:
            if research.access_grants.filter(user=user).exists():
                return True
        
        # Руководители имеют доступ ко всему
        if user.role in ['department_head', 'management_head']:
            return True
        
        # Руководитель подразделения к своему подразделению
        if user.role == 'division_head' and research.division == user.division:
            return True
        
        return False

    @classmethod
    def _can_submit(cls, research: Research, user: User) -> bool:
        """Проверяет право на отправку."""
        return (
            research.author == user or
            research.contributors.filter(id=user.id).exists()
        )

    @classmethod
    def _can_review(cls, research: Research, user: User) -> bool:
        """Проверяет право на проверку (одобрение/отклонение)."""
        # Руководители могут проверять
        if user.role in ['department_head', 'management_head']:
            return True
        
        # Руководитель подразделения своего подразделения
        if user.role == 'division_head' and research.division == user.division:
            return True
        
        return False

    @classmethod
    def _log_history(
        cls,
        research: Research,
        user: User,
        action: str,
        details: dict,
    ) -> ResearchHistory:
        """
        Записывает действие в историю исследования.
        """
        return ResearchHistory.objects.create(
            research=research,
            user=user,
            action=action,
            details=details,
        )
