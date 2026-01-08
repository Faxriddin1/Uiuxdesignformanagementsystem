"""
=============================================================================
Research URLs
=============================================================================
"""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import ResearchViewSet

router = DefaultRouter()
router.register('', ResearchViewSet, basename='research')

urlpatterns = [
    path('', include(router.urls)),
]
