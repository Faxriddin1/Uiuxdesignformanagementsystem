"""
=============================================================================
Task Service - Бизнес-логика для задач
=============================================================================

Этот модуль содержит всю бизнес-логику работы с задачами.
Вся логика workflow, переходов статусов, проверки прав - здесь.

Правила архитектуры:
1. Views вызывают методы сервиса
2. Сервис содержит бизнес-логику
3. Сервис работает с моделями напрямую
4. Сервис возвращает результат или выбрасывает исключение

ВАЖНО: Изменения в workflow требуют обновления:
1. constants.py (ALLOWED_TRANSITIONS)
2. Этот файл (методы переходов)
3. Тесты

Как расширять:
- Добавляйте новые методы для новой функциональности
- Не добавляйте бизнес-логику в views или serializers
- Используйте _create_history для аудита
"""

import logging
from typing import List, Optional

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.accounts.constants import UserRole
from apps.core.exceptions import BusinessLogicException, ErrorCode, WorkflowException
from apps.tasks.constants import (
    ALLOWED_TRANSITIONS,
    ApprovalRoute,
    ResultVersionStatus,
    TaskStatus,
    TaskType,
    is_valid_transition,
)
from apps.tasks.models import Task, TaskAttachment, TaskComment, TaskHistory, TaskResultVersion

User = get_user_model()
logger = logging.getLogger(__name__)


class TaskService:
    """
    Сервис для работы с задачами.
    
    Все методы статические для удобства использования:
        TaskService.take_task(task, user)
    
    Можно переделать на instance методы если нужен DI.
    """
    
    # =========================================================================
    # Создание и обновление
    # =========================================================================
    
    @staticmethod
    @transaction.atomic
    def create_task(
        creator: User,
        title: str,
        description: str,
        assignee: User,
        deadline,
        division: str,
        task_type: str = TaskType.T2,
        priority: str = 'medium',
        co_assignees: Optional[List[User]] = None,
        project=None,
        is_self_assigned: bool = False,
        **kwargs
    ) -> Task:
        """
        Создание новой задачи.
        
        Args:
            creator: Пользователь-создатель
            title: Название
            description: Описание
            assignee: Исполнитель
            deadline: Дедлайн
            division: Отдел
            task_type: Тип задачи (T1/T2)
            priority: Приоритет
            co_assignees: Список соисполнителей
            project: Связанный проект
            is_self_assigned: Флаг самопостановки
            
        Returns:
            Созданная задача
            
        Raises:
            BusinessLogicException: При нарушении бизнес-правил
        """
        
        # Проверка прав на создание
        if not TaskService._can_create_task(creator, assignee, is_self_assigned):
            raise BusinessLogicException(
                message='У вас нет прав на создание задачи с такими параметрами',
                code=ErrorCode.PERMISSION_DENIED
            )
        
        # Определяем маршрут приемки
        if task_type == TaskType.T1:
            approval_route = ApprovalRoute.MANAGEMENT_ONLY
        elif is_self_assigned:
            approval_route = ApprovalRoute.CUSTOM
        else:
            approval_route = ApprovalRoute.DIVISION_THEN_MANAGEMENT
        
        task = Task.objects.create(
            title=title,
            description=description,
            task_type=task_type,
            status=TaskStatus.NEW,
            priority=priority,
            division=division,
            assignee=assignee,
            creator=creator,
            deadline=deadline,
            approval_route=approval_route,
            is_self_assigned=is_self_assigned,
            project=project,
            created_by=creator,
            **kwargs
        )
        
        # Добавляем соисполнителей
        if co_assignees:
            task.co_assignees.set(co_assignees)
        
        # Создаем запись в истории
        TaskService._create_history(
            task=task,
            user=creator,
            action='Создание задачи',
            details=f'Создана задача типа {task.get_task_type_display()}'
        )
        
        logger.info(f"Task created: {task.id} by user {creator.id}")
        
        return task
    
    # =========================================================================
    # Workflow Actions
    # =========================================================================
    
    @staticmethod
    @transaction.atomic
    def take_task(task: Task, user: User) -> Task:
        """
        Взять задачу в работу.
        
        Переход: NEW → IN_PROGRESS
        
        Правила:
        - Только исполнитель или соисполнитель может взять
        - Только из статуса NEW
        """
        
        # Проверка статуса
        if task.status != TaskStatus.NEW:
            raise WorkflowException(
                message=f'Нельзя взять задачу в статусе "{task.get_status_display()}"'
            )
        
        # Проверка прав
        if not TaskService._is_assignee(task, user):
            raise BusinessLogicException(
                message='Только исполнитель может взять задачу в работу',
                code=ErrorCode.PERMISSION_DENIED
            )
        
        old_status = task.status
        task.status = TaskStatus.IN_PROGRESS
        task.updated_by = user
        task.save()
        
        TaskService._create_history(
            task=task,
            user=user,
            action='Взято в работу',
            details=f'Статус изменен: {old_status} → {task.status}'
        )
        
        return task
    
    @staticmethod
    @transaction.atomic
    def submit_for_review(
        task: Task,
        user: User,
        result_description: str,
        attachments: Optional[List] = None
    ) -> Task:
        """
        Отправить результат на проверку/рассмотрение.
        
        Переходы:
        - T1: IN_PROGRESS → UNDER_MANAGEMENT_REVIEW
        - T2: IN_PROGRESS → UNDER_DIVISION_REVIEW
        - REWORK → соответствующий review статус
        
        Правила:
        - Только исполнитель может отправить
        - Обязательно описание результата
        """
        
        # Проверка статуса
        allowed_from = [TaskStatus.IN_PROGRESS, TaskStatus.REWORK, TaskStatus.REWORK_WITHDRAWN]
        if task.status not in allowed_from:
            raise WorkflowException(
                message=f'Нельзя отправить на проверку из статуса "{task.get_status_display()}"'
            )
        
        # Проверка прав
        if not TaskService._is_assignee(task, user):
            raise BusinessLogicException(
                message='Только исполнитель может отправить на проверку',
                code=ErrorCode.PERMISSION_DENIED
            )
        
        # Создаем новую версию результата
        version_number = task.current_result_version + 1
        result_version = TaskResultVersion.objects.create(
            task=task,
            version=version_number,
            result_description=result_description,
            submitted_by=user,
            status=ResultVersionStatus.CURRENT
        )
        
        # Помечаем предыдущие версии
        TaskResultVersion.objects.filter(
            task=task,
            status=ResultVersionStatus.CURRENT
        ).exclude(id=result_version.id).update(
            status=ResultVersionStatus.WITHDRAWN
        )
        
        # Определяем новый статус
        old_status = task.status
        if task.task_type == TaskType.T1 or task.approval_route == ApprovalRoute.MANAGEMENT_ONLY:
            new_status = TaskStatus.UNDER_MANAGEMENT_REVIEW
        else:
            new_status = TaskStatus.UNDER_DIVISION_REVIEW
        
        task.status = new_status
        task.current_result_version = version_number
        task.updated_by = user
        task.save()
        
        TaskService._create_history(
            task=task,
            user=user,
            action='Отправлено на проверку',
            details=f'Версия результата: {version_number}. Статус: {old_status} → {new_status}'
        )
        
        return task
    
    @staticmethod
    @transaction.atomic
    def approve_task(task: Task, user: User) -> Task:
        """
        Одобрить задачу.
        
        Переходы:
        - UNDER_DIVISION_REVIEW → UNDER_MANAGEMENT_REVIEW (одобрение нач. отдела)
        - UNDER_MANAGEMENT_REVIEW → ACCEPTED (финальное одобрение)
        
        Правила:
        - Только уполномоченный может одобрить
        - Проверка маршрута приемки
        """
        
        # Проверка статуса
        if task.status not in [TaskStatus.UNDER_DIVISION_REVIEW, TaskStatus.UNDER_MANAGEMENT_REVIEW]:
            raise WorkflowException(
                message=f'Нельзя одобрить задачу в статусе "{task.get_status_display()}"'
            )
        
        # Проверка прав
        if not TaskService._can_approve(task, user):
            raise BusinessLogicException(
                message='У вас нет прав на одобрение этой задачи',
                code=ErrorCode.PERMISSION_DENIED
            )
        
        old_status = task.status
        
        # Определяем новый статус
        if task.status == TaskStatus.UNDER_DIVISION_REVIEW:
            # Первый уровень одобрен, переходим ко второму
            new_status = TaskStatus.UNDER_MANAGEMENT_REVIEW
            action = 'Одобрено Начальником отдела'
        else:
            # Финальное одобрение
            new_status = TaskStatus.ACCEPTED
            action = 'Задача принята'
        
        task.status = new_status
        task.updated_by = user
        task.save()
        
        TaskService._create_history(
            task=task,
            user=user,
            action=action,
            details=f'Статус: {old_status} → {new_status}'
        )
        
        return task
    
    @staticmethod
    @transaction.atomic
    def reject_task(task: Task, user: User, reason: str) -> Task:
        """
        Вернуть задачу на доработку.
        
        Переход: UNDER_*_REVIEW → REWORK
        
        Правила:
        - Только уполномоченный может вернуть
        - Обязательна причина возврата
        """
        
        # Проверка статуса
        if task.status not in [TaskStatus.UNDER_DIVISION_REVIEW, TaskStatus.UNDER_MANAGEMENT_REVIEW]:
            raise WorkflowException(
                message=f'Нельзя вернуть на доработку из статуса "{task.get_status_display()}"'
            )
        
        # Проверка прав
        if not TaskService._can_approve(task, user):
            raise BusinessLogicException(
                message='У вас нет прав на возврат этой задачи',
                code=ErrorCode.PERMISSION_DENIED
            )
        
        if not reason or len(reason.strip()) < 10:
            raise BusinessLogicException(
                message='Укажите причину возврата (минимум 10 символов)',
                code=ErrorCode.VALIDATION_ERROR
            )
        
        old_status = task.status
        task.status = TaskStatus.REWORK
        task.updated_by = user
        task.save()
        
        # Обновляем статус версии результата
        current_version = TaskResultVersion.objects.filter(
            task=task,
            version=task.current_result_version
        ).first()
        if current_version:
            current_version.status = ResultVersionStatus.REJECTED
            current_version.rejection_reason = reason
            current_version.save()
        
        # Создаем комментарий с причиной
        TaskComment.objects.create(
            task=task,
            author=user,
            text=reason,
            is_return_reason=True
        )
        
        TaskService._create_history(
            task=task,
            user=user,
            action='Возвращено на доработку',
            details=f'Причина: {reason}'
        )
        
        return task
    
    @staticmethod
    @transaction.atomic
    def withdraw_from_review(task: Task, user: User, reason: str = '') -> Task:
        """
        Отозвать задачу с проверки (исполнитель передумал).
        
        Переход: UNDER_*_REVIEW → REWORK_WITHDRAWN
        """
        
        # Проверка статуса
        if task.status not in [TaskStatus.UNDER_DIVISION_REVIEW, TaskStatus.UNDER_MANAGEMENT_REVIEW]:
            raise WorkflowException(
                message=f'Нельзя отозвать задачу из статуса "{task.get_status_display()}"'
            )
        
        # Проверка прав (только исполнитель)
        if not TaskService._is_assignee(task, user):
            raise BusinessLogicException(
                message='Только исполнитель может отозвать задачу',
                code=ErrorCode.PERMISSION_DENIED
            )
        
        old_status = task.status
        task.status = TaskStatus.REWORK_WITHDRAWN
        task.updated_by = user
        task.save()
        
        # Обновляем статус версии результата
        current_version = TaskResultVersion.objects.filter(
            task=task,
            version=task.current_result_version
        ).first()
        if current_version:
            current_version.status = ResultVersionStatus.WITHDRAWN
            current_version.withdraw_reason = reason
            current_version.save()
        
        TaskService._create_history(
            task=task,
            user=user,
            action='Отозвано с проверки',
            details=reason or 'Причина не указана'
        )
        
        return task
    
    # =========================================================================
    # Вспомогательные методы
    # =========================================================================
    
    @staticmethod
    def get_available_actions(task: Task, user: User) -> List[str]:
        """
        Получить список доступных действий для пользователя.
        
        Returns:
            Список строк с названиями действий
        """
        actions = []
        
        is_assignee = TaskService._is_assignee(task, user)
        can_approve = TaskService._can_approve(task, user)
        
        if task.status == TaskStatus.NEW and is_assignee:
            actions.append('take')
        
        if task.status in [TaskStatus.IN_PROGRESS, TaskStatus.REWORK, TaskStatus.REWORK_WITHDRAWN]:
            if is_assignee:
                actions.append('submit')
        
        if task.status in [TaskStatus.UNDER_DIVISION_REVIEW, TaskStatus.UNDER_MANAGEMENT_REVIEW]:
            if can_approve:
                actions.append('approve')
                actions.append('reject')
            if is_assignee:
                actions.append('withdraw')
        
        return actions
    
    @staticmethod
    def _is_assignee(task: Task, user: User) -> bool:
        """Проверка, является ли пользователь исполнителем."""
        if task.assignee_id == user.id:
            return True
        if task.co_assignees.filter(id=user.id).exists():
            return True
        return False
    
    @staticmethod
    def _can_approve(task: Task, user: User) -> bool:
        """
        Проверка права на одобрение задачи.
        
        Правила:
        - department_head и management_head могут всё
        - division_head может только свой отдел и только первый уровень
        """
        
        # Высшие руководители
        if user.role in [UserRole.DEPARTMENT_HEAD, UserRole.MANAGEMENT_HEAD]:
            return True
        
        # Начальник отдела - только первый уровень и свой отдел
        if user.role == UserRole.DIVISION_HEAD:
            if task.status == TaskStatus.UNDER_DIVISION_REVIEW:
                return task.division == user.division
        
        # Кастомный approver
        if task.approval_route == ApprovalRoute.CUSTOM:
            return task.custom_approver_id == user.id
        
        return False
    
    @staticmethod
    def _can_create_task(creator: User, assignee: User, is_self_assigned: bool) -> bool:
        """
        Проверка права на создание задачи.
        
        Правила:
        - Руководители могут создавать для всех (в рамках своих прав)
        - Сотрудники только самопостановку
        """
        
        if creator.role in [UserRole.DEPARTMENT_HEAD, UserRole.MANAGEMENT_HEAD]:
            return True
        
        if creator.role == UserRole.DIVISION_HEAD:
            # Может назначать только свой отдел
            return assignee.division == creator.division
        
        if creator.role == UserRole.EMPLOYEE:
            # Только самопостановка
            return is_self_assigned and creator.id == assignee.id
        
        return False
    
    @staticmethod
    def _create_history(task: Task, user: User, action: str, details: str = '', field_changes: dict = None):
        """Создание записи в истории изменений."""
        TaskHistory.objects.create(
            task=task,
            user=user,
            action=action,
            details=details,
            field_changes=field_changes or {}
        )
