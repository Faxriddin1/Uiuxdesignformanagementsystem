"""
=============================================================================
Analytics Views
=============================================================================
"""

from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from services.analytics_service import AnalyticsService


class DashboardSummaryView(APIView):
    """
    Сводка для дашборда.
    """
    
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Сводка дашборда',
        description='Возвращает общую статистику по задачам, проектам и исследованиям.',
        parameters=[
            OpenApiParameter(
                name='division',
                description='Фильтр по подразделению',
                required=False,
                type=str,
            ),
        ],
        responses={200: dict},
        tags=['Analytics'],
    )
    def get(self, request):
        division = request.query_params.get('division')
        
        summary = AnalyticsService.get_dashboard_summary(
            user=request.user,
            division=division,
        )
        
        return Response(summary)


class TasksByStatusView(APIView):
    """
    Распределение задач по статусам.
    """
    
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Задачи по статусам',
        description='Возвращает распределение задач по статусам для графика.',
        parameters=[
            OpenApiParameter(
                name='division',
                description='Фильтр по подразделению',
                required=False,
                type=str,
            ),
        ],
        responses={200: list},
        tags=['Analytics'],
    )
    def get(self, request):
        division = request.query_params.get('division')
        
        data = AnalyticsService.get_tasks_by_status(division=division)
        
        return Response(data)


class TasksByTypeView(APIView):
    """
    Распределение задач по типам.
    """
    
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Задачи по типам',
        description='Возвращает распределение задач по типам (T1/T2).',
        parameters=[
            OpenApiParameter(
                name='division',
                description='Фильтр по подразделению',
                required=False,
                type=str,
            ),
        ],
        responses={200: list},
        tags=['Analytics'],
    )
    def get(self, request):
        division = request.query_params.get('division')
        
        data = AnalyticsService.get_tasks_by_type(division=division)
        
        return Response(data)


class OverdueTasksView(APIView):
    """
    Просроченные задачи.
    """
    
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Просроченные задачи',
        description='Возвращает список просроченных задач.',
        parameters=[
            OpenApiParameter(
                name='division',
                description='Фильтр по подразделению',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='limit',
                description='Максимальное количество',
                required=False,
                type=int,
            ),
        ],
        responses={200: list},
        tags=['Analytics'],
    )
    def get(self, request):
        division = request.query_params.get('division')
        limit = int(request.query_params.get('limit', 10))
        
        data = AnalyticsService.get_overdue_tasks(
            user=request.user,
            division=division,
            limit=limit,
        )
        
        return Response(data)


class TaskCompletionTrendView(APIView):
    """
    Тренд завершения задач.
    """
    
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Тренд завершения задач',
        description='Возвращает тренд завершения задач по периодам.',
        parameters=[
            OpenApiParameter(
                name='period',
                description='Период группировки: day, week, month',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='days',
                description='Количество дней для анализа',
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name='division',
                description='Фильтр по подразделению',
                required=False,
                type=str,
            ),
        ],
        responses={200: list},
        tags=['Analytics'],
    )
    def get(self, request):
        period = request.query_params.get('period', 'week')
        days = int(request.query_params.get('days', 30))
        division = request.query_params.get('division')
        
        data = AnalyticsService.get_task_completion_trend(
            period=period,
            days=days,
            division=division,
        )
        
        return Response(data)


class VelocityMetricsView(APIView):
    """
    Метрики производительности.
    """
    
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Метрики производительности',
        description='Возвращает метрики скорости выполнения задач.',
        parameters=[
            OpenApiParameter(
                name='days',
                description='Количество дней для анализа',
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name='user_id',
                description='ID пользователя (для персональных метрик)',
                required=False,
                type=str,
            ),
        ],
        responses={200: dict},
        tags=['Analytics'],
    )
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        user_id = request.query_params.get('user_id')
        
        user = None
        if user_id:
            from apps.accounts.models import User
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        data = AnalyticsService.get_velocity_metrics(user=user, days=days)
        
        return Response(data)


class UserWorkloadView(APIView):
    """
    Загруженность пользователей.
    """
    
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Загруженность пользователей',
        description='Возвращает загруженность пользователей по активным задачам.',
        parameters=[
            OpenApiParameter(
                name='division',
                description='Фильтр по подразделению',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='limit',
                description='Максимальное количество',
                required=False,
                type=int,
            ),
        ],
        responses={200: list},
        tags=['Analytics'],
    )
    def get(self, request):
        division = request.query_params.get('division')
        limit = int(request.query_params.get('limit', 10))
        
        data = AnalyticsService.get_user_workload(
            division=division,
            limit=limit,
        )
        
        return Response(data)


class ProjectsProgressView(APIView):
    """
    Прогресс проектов.
    """
    
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Прогресс проектов',
        description='Возвращает прогресс активных проектов.',
        parameters=[
            OpenApiParameter(
                name='division',
                description='Фильтр по подразделению',
                required=False,
                type=str,
            ),
        ],
        responses={200: list},
        tags=['Analytics'],
    )
    def get(self, request):
        division = request.query_params.get('division')
        
        data = AnalyticsService.get_projects_progress(division=division)
        
        return Response(data)
