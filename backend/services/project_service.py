"""
=============================================================================
Project Service
=============================================================================
Бизнес-логика для работы с проектами.
"""

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.projects.constants import (
    ALLOWED_PROJECT_TRANSITIONS,
    ProjectStatus,
    is_valid_project_transition,
)
from apps.projects.models import Project, ProjectHistory, ProjectMilestone


class ProjectService:
    """
    Сервис для работы с проектами.
    """

    @classmethod
    @transaction.atomic
    def create_project(
        cls,
        *,
        title: str,
        code: str,
        division: str,
        user: User,
        description: str = '',
        priority: str = 'medium',
        manager_id: str | None = None,
        member_ids: list[str] | None = None,
        start_date=None,
        end_date=None,
        budget=None,
    ) -> Project:
        """
        Создаёт новый проект.
        """
        project = Project.objects.create(
            title=title,
            code=code,
            description=description,
            division=division,
            priority=priority,
            status=ProjectStatus.DRAFT,
            start_date=start_date,
            end_date=end_date,
            budget=budget,
            created_by=user,
        )
        
        if manager_id:
            try:
                project.manager = User.objects.get(id=manager_id)
                project.save(update_fields=['manager'])
            except User.DoesNotExist:
                pass
        
        if member_ids:
            members = User.objects.filter(id__in=member_ids)
            project.members.set(members)
        
        # Записываем в историю
        cls._log_history(project, user, 'created', {
            'title': title,
            'code': code,
        })
        
        return project

    @classmethod
    @transaction.atomic
    def transition_status(
        cls,
        project: Project,
        to_status: str,
        user: User,
        comment: str = '',
    ) -> Project:
        """
        Выполняет переход статуса проекта.
        """
        from_status = project.status
        
        if not is_valid_project_transition(from_status, to_status):
            allowed = ALLOWED_PROJECT_TRANSITIONS.get(from_status, [])
            allowed_labels = [ProjectStatus(s).label for s in allowed]
            raise ValueError(
                f'Переход из "{ProjectStatus(from_status).label}" '
                f'в "{ProjectStatus(to_status).label}" недопустим. '
                f'Разрешённые переходы: {", ".join(allowed_labels) or "нет"}.'
            )
        
        old_status = project.status
        project.status = to_status
        project.save(update_fields=['status', 'updated_at'])
        
        # История
        cls._log_history(project, user, 'status_changed', {
            'from_status': old_status,
            'to_status': to_status,
            'comment': comment,
        })
        
        # Уведомления
        from services.notification_service import NotificationService
        NotificationService.notify_project_status_change(project, old_status, to_status, user)
        
        return project

    @classmethod
    def get_available_transitions(cls, project: Project) -> list[dict]:
        """
        Возвращает список доступных переходов для проекта.
        """
        allowed_statuses = ALLOWED_PROJECT_TRANSITIONS.get(project.status, [])
        return [
            {'status': s, 'label': ProjectStatus(s).label}
            for s in allowed_statuses
        ]

    @classmethod
    @transaction.atomic
    def add_milestone(
        cls,
        project: Project,
        title: str,
        due_date,
        user: User,
        description: str = '',
    ) -> ProjectMilestone:
        """
        Добавляет веху в проект.
        """
        order = project.milestones.count()
        milestone = ProjectMilestone.objects.create(
            project=project,
            title=title,
            description=description,
            due_date=due_date,
            order=order,
        )
        
        cls._log_history(project, user, 'milestone_added', {
            'milestone_title': title,
            'due_date': str(due_date),
        })
        
        return milestone

    @classmethod
    @transaction.atomic
    def complete_milestone(
        cls,
        milestone: ProjectMilestone,
        user: User,
    ) -> ProjectMilestone:
        """
        Отмечает веху как выполненную.
        """
        milestone.completed = True
        milestone.completed_at = timezone.now()
        milestone.save(update_fields=['completed', 'completed_at'])
        
        cls._log_history(milestone.project, user, 'milestone_completed', {
            'milestone_title': milestone.title,
        })
        
        # Обновляем прогресс проекта
        cls._update_progress(milestone.project)
        
        return milestone

    @classmethod
    def _update_progress(cls, project: Project) -> None:
        """
        Пересчитывает прогресс проекта на основе выполненных задач.
        """
        total_tasks = project.tasks.count()
        if total_tasks == 0:
            # Если нет задач, считаем по вехам
            total_milestones = project.milestones.count()
            if total_milestones == 0:
                project.progress = 0
            else:
                completed_milestones = project.milestones.filter(completed=True).count()
                project.progress = int((completed_milestones / total_milestones) * 100)
        else:
            completed_tasks = project.tasks.filter(status='approved').count()
            project.progress = int((completed_tasks / total_tasks) * 100)
        
        project.save(update_fields=['progress'])

    @classmethod
    @transaction.atomic
    def add_member(cls, project: Project, user_id: str, added_by: User) -> bool:
        """
        Добавляет участника в проект.
        """
        try:
            user = User.objects.get(id=user_id)
            project.members.add(user)
            
            cls._log_history(project, added_by, 'member_added', {
                'member_name': user.full_name,
                'member_id': str(user.id),
            })
            
            return True
        except User.DoesNotExist:
            return False

    @classmethod
    @transaction.atomic
    def remove_member(cls, project: Project, user_id: str, removed_by: User) -> bool:
        """
        Удаляет участника из проекта.
        """
        try:
            user = User.objects.get(id=user_id)
            project.members.remove(user)
            
            cls._log_history(project, removed_by, 'member_removed', {
                'member_name': user.full_name,
                'member_id': str(user.id),
            })
            
            return True
        except User.DoesNotExist:
            return False

    @classmethod
    def _log_history(
        cls,
        project: Project,
        user: User,
        action: str,
        details: dict,
    ) -> ProjectHistory:
        """
        Записывает действие в историю проекта.
        """
        return ProjectHistory.objects.create(
            project=project,
            user=user,
            action=action,
            details=details,
        )
