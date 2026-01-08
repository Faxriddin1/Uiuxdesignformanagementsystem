"""
=============================================================================
Project API Tests
=============================================================================
Тесты API проектов.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.projects.constants import ProjectStatus


pytestmark = pytest.mark.django_db


class TestProjectListAPI:
    """Тесты списка проектов."""

    def test_list_projects(self, authenticated_client, project_factory):
        """Тест получения списка проектов."""
        project_factory(title='Project 1')
        project_factory(title='Project 2')
        
        url = reverse('projects-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK

    def test_list_projects_unauthorized(self, api_client):
        """Тест получения списка проектов без авторизации."""
        url = reverse('projects-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestProjectDetailAPI:
    """Тесты детальной информации о проекте."""

    def test_get_project_detail(self, authenticated_client, project_factory):
        """Тест получения детальной информации о проекте."""
        project = project_factory(title='Test Project')
        
        url = reverse('projects-detail', kwargs={'pk': project.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Test Project'


class TestProjectTransitionAPI:
    """Тесты переходов статуса проекта."""

    def test_transition_to_planning(self, authenticated_client_division_head, project_factory):
        """Тест перехода в статус планирования."""
        project = project_factory(status=ProjectStatus.DRAFT)
        
        url = reverse('projects-transition', kwargs={'pk': project.id})
        response = authenticated_client_division_head.post(url, {
            'to_status': ProjectStatus.PLANNING,
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == ProjectStatus.PLANNING

    def test_invalid_transition(self, authenticated_client_division_head, project_factory):
        """Тест невалидного перехода."""
        project = project_factory(status=ProjectStatus.DRAFT)
        
        url = reverse('projects-transition', kwargs={'pk': project.id})
        response = authenticated_client_division_head.post(url, {
            'to_status': ProjectStatus.COMPLETED,  # Нельзя сразу в completed
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_available_transitions(self, authenticated_client, project_factory):
        """Тест получения доступных переходов."""
        project = project_factory(status=ProjectStatus.DRAFT)
        
        url = reverse('projects-available-transitions', kwargs={'pk': project.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'transitions' in response.data
