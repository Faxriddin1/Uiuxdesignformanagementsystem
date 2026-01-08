"""
=============================================================================
Analytics URLs
=============================================================================
"""

from django.urls import path

from .views import (
    DashboardSummaryView,
    OverdueTasksView,
    ProjectsProgressView,
    TaskCompletionTrendView,
    TasksByStatusView,
    TasksByTypeView,
    UserWorkloadView,
    VelocityMetricsView,
)

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='analytics-summary'),
    path('tasks-by-status/', TasksByStatusView.as_view(), name='analytics-tasks-by-status'),
    path('tasks-by-type/', TasksByTypeView.as_view(), name='analytics-tasks-by-type'),
    path('overdue/', OverdueTasksView.as_view(), name='analytics-overdue'),
    path('completion-trend/', TaskCompletionTrendView.as_view(), name='analytics-completion-trend'),
    path('velocity/', VelocityMetricsView.as_view(), name='analytics-velocity'),
    path('workload/', UserWorkloadView.as_view(), name='analytics-workload'),
    path('projects-progress/', ProjectsProgressView.as_view(), name='analytics-projects-progress'),
]
