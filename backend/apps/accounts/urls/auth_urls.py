"""
=============================================================================
Auth URLs
=============================================================================
"""

from django.urls import path

from ..views import (
    ChangePasswordView,
    CurrentUserView,
    LoginView,
    LogoutView,
    RefreshTokenView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
]
