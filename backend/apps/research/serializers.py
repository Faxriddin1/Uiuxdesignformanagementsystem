"""
=============================================================================
Research Serializers
=============================================================================
"""

from rest_framework import serializers

from apps.accounts.serializers import UserShortSerializer

from .models import (
    Research,
    ResearchAccess,
    ResearchAttachment,
    ResearchComment,
    ResearchHistory,
)


class ResearchAttachmentSerializer(serializers.ModelSerializer):
    """
    Сериализатор вложений исследования.
    """
    uploaded_by = UserShortSerializer(read_only=True)
    
    class Meta:
        model = ResearchAttachment
        fields = [
            'id', 'filename', 'file', 'file_size', 'mime_type',
            'uploaded_by', 'created_at'
        ]
        read_only_fields = ['id', 'file_size', 'mime_type', 'uploaded_by', 'created_at']


class ResearchCommentSerializer(serializers.ModelSerializer):
    """
    Сериализатор комментариев к исследованию.
    """
    author = UserShortSerializer(read_only=True)
    
    class Meta:
        model = ResearchComment
        fields = ['id', 'author', 'text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class ResearchHistorySerializer(serializers.ModelSerializer):
    """
    Сериализатор истории исследования.
    """
    user = UserShortSerializer(read_only=True)
    
    class Meta:
        model = ResearchHistory
        fields = ['id', 'user', 'action', 'details', 'created_at']


class ResearchAccessSerializer(serializers.ModelSerializer):
    """
    Сериализатор доступа к исследованию.
    """
    user = UserShortSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)
    granted_by = UserShortSerializer(read_only=True)
    
    class Meta:
        model = ResearchAccess
        fields = [
            'id', 'user', 'user_id', 'can_edit',
            'granted_by', 'granted_at'
        ]
        read_only_fields = ['id', 'user', 'granted_by', 'granted_at']


class ResearchListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка исследований (краткий).
    """
    author = UserShortSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_research_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    access_level_display = serializers.CharField(source='get_access_level_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    contributor_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Research
        fields = [
            'id', 'title', 'research_type', 'type_display',
            'status', 'status_display', 'priority', 'priority_display',
            'access_level', 'access_level_display', 'division',
            'author', 'contributor_count',
            'start_date', 'due_date', 'is_overdue', 'days_remaining',
            'tags', 'created_at'
        ]

    def get_contributor_count(self, obj) -> int:
        return obj.contributors.count()


class ResearchDetailSerializer(serializers.ModelSerializer):
    """
    Детальный сериализатор исследования.
    """
    author = UserShortSerializer(read_only=True)
    author_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    contributors = UserShortSerializer(many=True, read_only=True)
    contributor_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    attachments = ResearchAttachmentSerializer(many=True, read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_research_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    access_level_display = serializers.CharField(source='get_access_level_display', read_only=True)
    division_display = serializers.CharField(source='get_division_display', read_only=True)
    
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Research
        fields = [
            'id', 'title', 'description', 'objectives', 'methodology',
            'research_type', 'type_display', 'status', 'status_display',
            'priority', 'priority_display',
            'access_level', 'access_level_display', 'division', 'division_display',
            'author', 'author_id', 'contributors', 'contributor_ids',
            'start_date', 'due_date', 'completed_at',
            'findings', 'recommendations',
            'project', 'tags', 'attachments',
            'is_overdue', 'days_remaining', 'can_edit',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = [
            'id', 'completed_at', 'created_at', 'updated_at',
            'created_by', 'updated_by'
        ]

    def get_can_edit(self, obj) -> bool:
        """Проверяет, может ли текущий пользователь редактировать."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        user = request.user
        
        # Автор всегда может редактировать
        if obj.author == user:
            return True
        
        # Соавторы могут редактировать
        if obj.contributors.filter(id=user.id).exists():
            return True
        
        # Проверяем персональный доступ
        access = obj.access_grants.filter(user=user, can_edit=True).exists()
        if access:
            return True
        
        # Руководители
        if user.role in ['department_head', 'management_head']:
            return True
        
        if user.role == 'division_head' and obj.division == user.division:
            return True
        
        return False

    def update(self, instance, validated_data):
        contributor_ids = validated_data.pop('contributor_ids', None)
        author_id = validated_data.pop('author_id', None)
        
        instance = super().update(instance, validated_data)
        
        if author_id:
            from apps.accounts.models import User
            try:
                instance.author = User.objects.get(id=author_id)
                instance.save(update_fields=['author'])
            except User.DoesNotExist:
                pass
        
        if contributor_ids is not None:
            from apps.accounts.models import User
            contributors = User.objects.filter(id__in=contributor_ids)
            instance.contributors.set(contributors)
        
        return instance


class ResearchCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор создания исследования.
    """
    contributor_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )
    
    class Meta:
        model = Research
        fields = [
            'title', 'description', 'objectives', 'methodology',
            'research_type', 'priority', 'access_level', 'division',
            'contributor_ids', 'start_date', 'due_date',
            'project', 'tags'
        ]

    def create(self, validated_data):
        contributor_ids = validated_data.pop('contributor_ids', [])
        
        research = Research.objects.create(**validated_data)
        
        if contributor_ids:
            from apps.accounts.models import User
            contributors = User.objects.filter(id__in=contributor_ids)
            research.contributors.set(contributors)
        
        return research


class ResearchSubmitSerializer(serializers.Serializer):
    """
    Сериализатор для отправки на проверку.
    """
    findings = serializers.CharField(required=False, allow_blank=True)
    recommendations = serializers.CharField(required=False, allow_blank=True)
    comment = serializers.CharField(required=False, allow_blank=True)


class ResearchReviewSerializer(serializers.Serializer):
    """
    Сериализатор для одобрения/отклонения.
    """
    comment = serializers.CharField(required=False, allow_blank=True)
