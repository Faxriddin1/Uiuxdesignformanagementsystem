"""
=============================================================================
Auth API Tests
=============================================================================
Тесты API аутентификации.
"""

import pytest
from django.urls import reverse
from rest_framework import status


pytestmark = pytest.mark.django_db


class TestLoginAPI:
    """Тесты API входа."""

    def test_login_success(self, api_client, user_factory):
        """Тест успешного входа."""
        user = user_factory(email='test@example.com', password='testpass123')
        
        url = reverse('auth-login')
        response = api_client.post(url, {
            'email': 'test@example.com',
            'password': 'testpass123',
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_invalid_credentials(self, api_client, user_factory):
        """Тест входа с неверными учётными данными."""
        user_factory(email='test@example.com', password='testpass123')
        
        url = reverse('auth-login')
        response = api_client.post(url, {
            'email': 'test@example.com',
            'password': 'wrongpassword',
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        """Тест входа несуществующего пользователя."""
        url = reverse('auth-login')
        response = api_client.post(url, {
            'email': 'nonexistent@example.com',
            'password': 'password123',
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCurrentUserAPI:
    """Тесты API текущего пользователя."""

    def test_get_current_user(self, authenticated_client, employee_user):
        """Тест получения текущего пользователя."""
        url = reverse('auth-me')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == employee_user.email

    def test_get_current_user_unauthorized(self, api_client):
        """Тест получения текущего пользователя без авторизации."""
        url = reverse('auth-me')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestPasswordChangeAPI:
    """Тесты API смены пароля."""

    def test_change_password_success(self, authenticated_client, employee_user):
        """Тест успешной смены пароля."""
        url = reverse('auth-change-password')
        response = authenticated_client.post(url, {
            'old_password': 'testpass123',
            'new_password': 'newpassword123',
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Проверяем, что новый пароль работает
        employee_user.refresh_from_db()
        assert employee_user.check_password('newpassword123')

    def test_change_password_wrong_old(self, authenticated_client):
        """Тест смены пароля с неверным старым паролем."""
        url = reverse('auth-change-password')
        response = authenticated_client.post(url, {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123',
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
