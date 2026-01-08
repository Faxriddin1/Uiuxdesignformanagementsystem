"""
=============================================================================
Task API Tests
=============================================================================
Тесты API задач.
"""

import pytest
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework import status

from apps.tasks.constants import TaskStatus, TaskType


pytestmark = pytest.mark.django_db


class TestTaskListAPI:
    """Тесты списка задач."""

    def test_list_tasks(self, authenticated_client, task_factory):
        """Тест получения списка задач."""
        task_factory(title='Task 1')
        task_factory(title='Task 2')
        
        url = reverse('tasks-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data

    def test_list_tasks_unauthorized(self, api_client):
        """Тест получения списка задач без авторизации."""
        url = reverse('tasks-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filter_tasks_by_status(self, authenticated_client, task_factory):
        """Тест фильтрации задач по статусу."""
        task_factory(title='New Task', status=TaskStatus.NEW)
        task_factory(title='Accepted Task', status=TaskStatus.ACCEPTED)
        
        url = reverse('tasks-list')
        response = authenticated_client.get(url, {'status': TaskStatus.NEW})
        
        assert response.status_code == status.HTTP_200_OK


class TestTaskDetailAPI:
    """Тесты детальной информации о задаче."""

    def test_get_task_detail(self, authenticated_client, task_factory):
        """Тест получения детальной информации о задаче."""
        task = task_factory(title='Test Task')
        
        url = reverse('tasks-detail', kwargs={'pk': task.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Test Task'

    def test_get_task_not_found(self, authenticated_client):
        """Тест получения несуществующей задачи."""
        import uuid
        url = reverse('tasks-detail', kwargs={'pk': uuid.uuid4()})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestTaskCreateAPI:
    """Тесты создания задач."""

    def test_create_task(self, authenticated_client_division_head, employee_user):
        """Тест создания задачи."""
        url = reverse('tasks-list')
        response = authenticated_client_division_head.post(url, {
            'title': 'New Task',
            'description': 'Test description',
            'task_type': TaskType.T1,
            'division': 'rnd',
            'priority': 'medium',
            'assignee': str(employee_user.id),
            'deadline': (timezone.now().date() + timedelta(days=7)).isoformat(),
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Task'

    def test_create_task_missing_required(self, authenticated_client_division_head):
        """Тест создания задачи без обязательных полей."""
        url = reverse('tasks-list')
        response = authenticated_client_division_head.post(url, {
            'description': 'Only description',
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestTaskWorkflowAPI:
    """Тесты workflow задач через API."""

    def test_take_task_action(self, authenticated_client, task_factory, employee_user):
        """Тест взятия задачи в работу."""
        task = task_factory(status=TaskStatus.NEW)
        
        url = reverse('tasks-take', kwargs={'pk': task.id})
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == TaskStatus.IN_PROGRESS

    def test_submit_task_action(self, authenticated_client, task_factory, employee_user):
        """Тест отправки задачи на проверку."""
        task = task_factory(
            status=TaskStatus.IN_PROGRESS,
            task_type=TaskType.T2,
            assignee=employee_user,
        )
        
        url = reverse('tasks-submit', kwargs={'pk': task.id})
        response = authenticated_client.post(url, {
            'result_description': 'Task completed',
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == TaskStatus.UNDER_DIVISION_REVIEW

    def test_approve_task_action(self, authenticated_client_division_head, task_factory, employee_user):
        """Тест одобрения задачи (первый уровень - руководитель подразделения)."""
        task = task_factory(
            status=TaskStatus.UNDER_DIVISION_REVIEW,
            task_type=TaskType.T2,
            assignee=employee_user,
        )
        
        url = reverse('tasks-approve', kwargs={'pk': task.id})
        response = authenticated_client_division_head.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        # T2 задача после одобрения руководителем подразделения становится ACCEPTED
        assert response.data['status'] == TaskStatus.ACCEPTED

    def test_reject_task_action(self, authenticated_client_division_head, task_factory, employee_user):
        """Тест отклонения задачи."""
        task = task_factory(
            status=TaskStatus.UNDER_DIVISION_REVIEW,
            assignee=employee_user,
        )
        
        url = reverse('tasks-reject', kwargs={'pk': task.id})
        response = authenticated_client_division_head.post(url, {
            'reason': 'Needs more work',
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == TaskStatus.REWORK
        assert response.data['status'] == TaskStatus.REJECTED
