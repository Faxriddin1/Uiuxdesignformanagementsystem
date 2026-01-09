"""
External Packages URLs
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExternalPackageViewSet

router = DefaultRouter()
router.register(r'', ExternalPackageViewSet, basename='externalpackage')

urlpatterns = [
    path('', include(router.urls)),
]
