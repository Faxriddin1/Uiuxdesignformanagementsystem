"""
=============================================================================
Accounts Views - Authentication
=============================================================================
"""

from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from drf_spectacular.utils import extend_schema, OpenApiExample

from ..serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    """
    Аутентификация пользователя.
    
    Возвращает JWT токены (access и refresh) вместе с информацией о пользователе.
    
    POST /api/v1/auth/login/
    
    Request:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    
    Response:
    {
        "access": "eyJ0eXAiOiJKV1Q...",
        "refresh": "eyJ0eXAiOiJKV1Q...",
        "user": {
            "id": "uuid",
            "email": "user@example.com",
            "name": "Иван Иванов",
            "role": "employee",
            "division": "rnd"
        }
    }
    """
    
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Auth'],
        summary='Вход в систему',
        description='Аутентификация по email и паролю. Возвращает JWT токены.',
        examples=[
            OpenApiExample(
                'Пример запроса',
                value={
                    'email': 'admin@company.uz',
                    'password': 'admin123'
                },
                request_only=True,
            ),
            OpenApiExample(
                'Успешный ответ',
                value={
                    'access': 'eyJ0eXAiOiJKV1Q...',
                    'refresh': 'eyJ0eXAiOiJKV1Q...',
                    'user': {
                        'id': '123e4567-e89b-12d3-a456-426614174000',
                        'email': 'admin@company.uz',
                        'name': 'Иванов Иван Иванович',
                        'role': 'management_head',
                        'role_display': 'Начальник Управления',
                        'division': 'rnd',
                        'division_display': 'Отдел R&D',
                        'avatar': None
                    }
                },
                response_only=True,
            ),
        ]
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class RefreshTokenView(TokenRefreshView):
    """
    Обновление access токена.
    
    POST /api/v1/auth/refresh/
    
    Request:
    {
        "refresh": "eyJ0eXAiOiJKV1Q..."
    }
    
    Response:
    {
        "access": "eyJ0eXAiOiJKV1Q...",
        "refresh": "eyJ0eXAiOiJKV1Q..."  // Новый refresh (если включена ротация)
    }
    """
    
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Auth'],
        summary='Обновление токена',
        description='Обновляет access токен используя refresh токен.'
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    """
    Выход из системы.
    
    Инвалидирует refresh токен (добавляет в blacklist).
    
    POST /api/v1/auth/logout/
    
    Request:
    {
        "refresh": "eyJ0eXAiOiJKV1Q..."
    }
    """
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Auth'],
        summary='Выход из системы',
        description='Инвалидирует refresh токен.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'refresh': {'type': 'string', 'description': 'Refresh токен'}
                },
                'required': ['refresh']
            }
        }
    )
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': {'code': 'invalid_input', 'message': 'Refresh токен обязателен'}},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({'message': 'Успешный выход'}, status=status.HTTP_200_OK)
        
        except Exception:
            return Response(
                {'error': {'code': 'invalid_token', 'message': 'Невалидный токен'}},
                status=status.HTTP_400_BAD_REQUEST
            )


class CurrentUserView(APIView):
    """
    Получение/обновление текущего пользователя.
    
    GET /api/v1/auth/me/
    PATCH /api/v1/auth/me/
    """
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Auth'],
        summary='Текущий пользователь',
        description='Возвращает информацию о текущем аутентифицированном пользователе.',
        responses={200: UserSerializer}
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @extend_schema(
        tags=['Auth'],
        summary='Обновить профиль',
        description='Обновляет профиль текущего пользователя (имя, аватар).',
        request=UserProfileUpdateSerializer,
        responses={200: UserSerializer}
    )
    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Возвращаем полную информацию
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """
    Смена пароля.
    
    POST /api/v1/auth/change-password/
    
    Request:
    {
        "old_password": "current_password",
        "new_password": "new_secure_password"
    }
    """
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Auth'],
        summary='Смена пароля',
        description='Изменяет пароль текущего пользователя.',
        request=ChangePasswordSerializer
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({'message': 'Пароль успешно изменен'})
