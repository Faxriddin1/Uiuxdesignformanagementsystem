"""
=============================================================================
Accounts Views - Users
=============================================================================
"""

from django.contrib.auth import get_user_model
from django.db.models import Q

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from ..constants import Division, UserRole
from ..permissions import IsManager
from ..serializers import UserCreateSerializer, UserMinimalSerializer, UserSerializer

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        tags=['Users'],
        summary='Список пользователей',
        description='Возвращает список пользователей с фильтрацией по роли и отделу.',
        parameters=[
            OpenApiParameter(
                name='role',
                type=str,
                enum=[r[0] for r in UserRole.choices],
                description='Фильтр по роли'
            ),
            OpenApiParameter(
                name='division',
                type=str,
                enum=[d[0] for d in Division.choices],
                description='Фильтр по отделу'
            ),
            OpenApiParameter(
                name='search',
                type=str,
                description='Поиск по имени или email'
            ),
        ]
    ),
    retrieve=extend_schema(
        tags=['Users'],
        summary='Профиль пользователя',
        description='Возвращает детальную информацию о пользователе.'
    ),
    create=extend_schema(
        tags=['Users'],
        summary='Создать пользователя',
        description='Создает нового пользователя (только для руководителей).'
    ),
    update=extend_schema(
        tags=['Users'],
        summary='Обновить пользователя',
        description='Полное обновление пользователя (только для руководителей).'
    ),
    partial_update=extend_schema(
        tags=['Users'],
        summary='Частичное обновление',
        description='Частичное обновление пользователя (только для руководителей).'
    ),
)
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления пользователями.
    
    Endpoints:
    - GET /users/ - список пользователей
    - GET /users/{id}/ - профиль пользователя
    - POST /users/ - создать пользователя (только менеджеры)
    - PATCH /users/{id}/ - обновить пользователя (только менеджеры)
    - GET /users/by-division/ - пользователи по отделам
    """
    
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['role', 'division']
    search_fields = ['name', 'email']
    ordering_fields = ['name', 'date_joined', 'role']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action == 'list' and self.request.query_params.get('minimal'):
            return UserMinimalSerializer
        return UserSerializer
    
    def get_permissions(self):
        """Создание/обновление только для менеджеров."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsManager()]
        return super().get_permissions()
    
    def get_queryset(self):
        """
        Фильтрация списка пользователей.
        
        Руководители видят всех, сотрудники - только свой отдел.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # Division head и employee видят только свой отдел
        if user.role == UserRole.DIVISION_HEAD:
            queryset = queryset.filter(division=user.division)
        elif user.role == UserRole.EMPLOYEE:
            queryset = queryset.filter(division=user.division)
        
        # Поиск
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(email__icontains=search)
            )
        
        return queryset
    
    @extend_schema(
        tags=['Users'],
        summary='Пользователи по отделам',
        description='Возвращает пользователей сгруппированных по отделам.'
    )
    @action(detail=False, methods=['get'])
    def by_division(self, request):
        """Получить пользователей сгруппированных по отделам."""
        result = {}
        
        for division_value, division_label in Division.choices:
            users = self.get_queryset().filter(division=division_value)
            result[division_value] = {
                'name': division_label,
                'users': UserMinimalSerializer(users, many=True).data
            }
        
        return Response(result)
    
    @extend_schema(
        tags=['Users'],
        summary='Доступные исполнители',
        description='Возвращает список пользователей, которых можно назначить исполнителями.',
        parameters=[
            OpenApiParameter(
                name='division',
                type=str,
                description='Фильтр по отделу'
            ),
        ]
    )
    @action(detail=False, methods=['get'])
    def assignees(self, request):
        """
        Получить список доступных исполнителей.
        
        Для division_head - только его отдел.
        Для management_head и выше - все.
        """
        user = request.user
        queryset = self.get_queryset()
        
        # Division head может назначать только свой отдел
        if user.role == UserRole.DIVISION_HEAD:
            queryset = queryset.filter(division=user.division)
        
        # Фильтр по отделу
        division = request.query_params.get('division')
        if division:
            queryset = queryset.filter(division=division)
        
        # Исключаем неактивных
        queryset = queryset.filter(is_active=True)
        
        serializer = UserMinimalSerializer(queryset, many=True)
        return Response(serializer.data)
