"""
=============================================================================
Accounts Serializers
=============================================================================

Сериализаторы для пользователей и аутентификации.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Сериализатор пользователя для API ответов.
    
    Используется для:
    - Списка пользователей
    - Профиля пользователя
    - Вложенных объектов (assignee, creator, etc.)
    """
    
    role_display = serializers.CharField(read_only=True)
    division_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'name',
            'role',
            'role_display',
            'division',
            'division_display',
            'avatar',
            'is_active',
            'date_joined',
            'last_login',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class UserMinimalSerializer(serializers.ModelSerializer):
    """
    Минимальный сериализатор пользователя.
    
    Используется для вложенных объектов, где нужны только основные данные.
    """
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'division', 'avatar']
        read_only_fields = fields


# Алиас для обратной совместимости
UserShortSerializer = UserMinimalSerializer


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для обновления профиля пользователя.
    
    Пользователь может менять только:
    - name
    - avatar
    
    Роль и отдел меняет только администратор.
    """
    
    class Meta:
        model = User
        fields = ['name', 'avatar']


class ChangePasswordSerializer(serializers.Serializer):
    """
    Сериализатор для смены пароля.
    """
    
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Неверный текущий пароль')
        return value
    
    def validate_new_password(self, value):
        validate_password(value)
        return value
    
    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Кастомный сериализатор для получения JWT токенов.
    
    Добавляет информацию о пользователе в ответ:
    {
        "access": "...",
        "refresh": "...",
        "user": {
            "id": "...",
            "email": "...",
            "name": "...",
            "role": "...",
            "division": "..."
        }
    }
    """
    
    username_field = 'email'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Добавляем кастомные claims в токен
        token['email'] = user.email
        token['name'] = user.name
        token['role'] = user.role
        token['division'] = user.division
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Добавляем информацию о пользователе
        data['user'] = {
            'id': str(self.user.id),
            'email': self.user.email,
            'name': self.user.name,
            'role': self.user.role,
            'role_display': self.user.role_display,
            'division': self.user.division,
            'division_display': self.user.division_display,
            'avatar': self.user.avatar.url if self.user.avatar else None,
        }
        
        return data


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания пользователя (только для админов).
    """
    
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'email',
            'name',
            'password',
            'role',
            'division',
            'avatar',
            'is_active',
        ]
    
    def validate_password(self, value):
        validate_password(value)
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
