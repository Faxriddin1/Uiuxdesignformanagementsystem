"""
=============================================================================
Task Service Tests
=============================================================================
Тесты для бизнес-логики задач.
"""

import pytest
from django.utils import timezone
from datetime import timedelta

from apps.tasks.constants import TaskStatus, TaskType
from services.task_service import TaskService


pytestmark = pytest.mark.django_db


class TestTaskServiceCreate:
    """Тесты создания задач."""

    def test_create_task_t1(self, division_head_user, employee_user):
        """Тест создания задачи T1."""
        task = TaskService.create_task(
            creator=division_head_user,
            title='Test T1 Task',
            description='Test description',
            assignee=employee_user,
            deadline=timezone.now().date() + timedelta(days=7),
            division='rnd',
            task_type=TaskType.T1,
            priority='high',
        )
        
        assert task.title == 'Test T1 Task'
        assert task.task_type == TaskType.T1
        assert task.status == TaskStatus.NEW
        assert task.creator == division_head_user

    def test_create_task_t2(self, division_head_user, employee_user):
        """Тест создания задачи T2."""
        task = TaskService.create_task(
            creator=division_head_user,
            title='Test T2 Task',
            description='Test description',
            assignee=employee_user,
            deadline=timezone.now().date() + timedelta(days=7),
            division='rnd',
            task_type=TaskType.T2,
        )
        
        assert task.task_type == TaskType.T2

    def test_create_task_with_deadline(self, division_head_user, employee_user):
        """Тест создания задачи с дедлайном."""
        deadline = timezone.now().date() + timedelta(days=7)
        
        task = TaskService.create_task(
            creator=division_head_user,
            title='Task with deadline',
            description='Test description',
            assignee=employee_user,
            deadline=deadline,
            division='rnd',
            task_type=TaskType.T1,
        )
        
        assert task.deadline is not None


class TestTaskServiceWorkflow:
    """Тесты workflow задач."""

    def test_take_task(self, division_head_user, employee_user):
        """Тест взятия задачи в работу."""
        task = TaskService.create_task(
            creator=division_head_user,
            title='Task to take',
            description='Test description',
            assignee=employee_user,
            deadline=timezone.now().date() + timedelta(days=7),
            division='rnd',
        )
        
        updated_task = TaskService.take_task(task, employee_user)
        
        assert updated_task.status == TaskStatus.IN_PROGRESS

    def test_take_task_invalid_status(self, division_head_user, employee_user):
        """Тест взятия задачи с невалидным статусом."""
        from apps.core.exceptions import WorkflowException
        
        task = TaskService.create_task(
            creator=division_head_user,
            title='Task',
            description='Test',
            assignee=employee_user,
            deadline=timezone.now().date() + timedelta(days=7),
            division='rnd',
        )
        
        # Берём задачу в работу
        TaskService.take_task(task, employee_user)
        
        # Пробуем взять ещё раз - должна быть ошибка
        with pytest.raises(WorkflowException):
            TaskService.take_task(task, employee_user)

    def test_submit_for_review_t2(self, division_head_user, employee_user):
        """Тест отправки задачи T2 на проверку."""
        task = TaskService.create_task(
            creator=division_head_user,
            title='T2 Task',
            description='Test',
            assignee=employee_user,
            deadline=timezone.now().date() + timedelta(days=7),
            division='rnd',
            task_type=TaskType.T2,
        )
        
        TaskService.take_task(task, employee_user)
        
        updated_task = TaskService.submit_for_review(
            task=task,
            user=employee_user,
            result_description='Task completed',
        )
        
        assert updated_task.status == TaskStatus.UNDER_DIVISION_REVIEW

    def test_submit_for_review_t1(self, division_head_user, employee_user):
        """Тест отправки задачи T1 на проверку (идёт сразу на управление)."""
        task = TaskService.create_task(
            creator=division_head_user,
            title='T1 Task',
            description='Test',
            assignee=employee_user,
            deadline=timezone.now().date() + timedelta(days=7),
            division='rnd',
            task_type=TaskType.T1,
        )
        
        TaskService.take_task(task, employee_user)
        
        updated_task = TaskService.submit_for_review(
            task=task,
            user=employee_user,
            result_description='T1 result',
        )
        
        assert updated_task.status == TaskStatus.UNDER_MANAGEMENT_REVIEW
