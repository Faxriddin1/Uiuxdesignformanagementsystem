"""
=============================================================================
Task Serializers
=============================================================================
"""

from django.contrib.auth import get_user_model

from rest_framework import serializers

from apps.accounts.serializers import UserMinimalSerializer

from .constants import ApprovalRoute, TaskStatus, TaskType
from .models import Task, TaskAttachment, TaskComment, TaskHistory, TaskResultVersion

User = get_user_model()


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Сериализатор вложений."""
    
    uploaded_by = UserMinimalSerializer(read_only=True)
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskAttachment
        fields = [
            'id',
            'name',
            'file',
            'file_type',
            'file_size',
            'uploaded_by',
            'created_at',
            'download_url',
        ]
        read_only_fields = ['id', 'file_type', 'file_size', 'uploaded_by', 'created_at']
    
    def get_download_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class TaskAttachmentUploadSerializer(serializers.ModelSerializer):
    """Сериализатор для загрузки вложений."""
    
    class Meta:
        model = TaskAttachment
        fields = ['file', 'name']
        extra_kwargs = {
            'name': {'required': False}
        }
    
    def create(self, validated_data):
        file = validated_data['file']
        validated_data['file_type'] = file.content_type
        validated_data['file_size'] = file.size
        if not validated_data.get('name'):
            validated_data['name'] = file.name
        return super().create(validated_data)


class TaskCommentSerializer(serializers.ModelSerializer):
    """Сериализатор комментариев."""
    
    author = UserMinimalSerializer(read_only=True)
    mentions = UserMinimalSerializer(many=True, read_only=True)
    mention_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = TaskComment
        fields = [
            'id',
            'text',
            'author',
            'is_return_reason',
            'mentions',
            'mention_ids',
            'created_at',
        ]
        read_only_fields = ['id', 'author', 'is_return_reason', 'created_at']
    
    def create(self, validated_data):
        mention_ids = validated_data.pop('mention_ids', [])
        comment = super().create(validated_data)
        
        if mention_ids:
            mentions = User.objects.filter(id__in=mention_ids)
            comment.mentions.set(mentions)
        
        return comment


class TaskResultVersionSerializer(serializers.ModelSerializer):
    """Сериализатор версий результата."""
    
    submitted_by = UserMinimalSerializer(read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = TaskResultVersion
        fields = [
            'id',
            'version',
            'result_description',
            'submitted_by',
            'submitted_at',
            'status',
            'withdraw_reason',
            'rejection_reason',
            'attachments',
        ]
        read_only_fields = fields


class TaskHistorySerializer(serializers.ModelSerializer):
    """Сериализатор истории изменений."""
    
    user = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = TaskHistory
        fields = [
            'id',
            'action',
            'details',
            'user',
            'field_changes',
            'created_at',
        ]
        read_only_fields = fields


class TaskListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка задач.
    
    Упрощенная версия без вложенных объектов для производительности.
    """
    
    assignee = UserMinimalSerializer(read_only=True)
    creator = UserMinimalSerializer(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_deadline = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'task_type',
            'task_type_display',
            'status',
            'status_display',
            'priority',
            'priority_display',
            'division',
            'assignee',
            'creator',
            'deadline',
            'is_overdue',
            'days_until_deadline',
            'created_at',
            'updated_at',
            'attachments',
        ]
        read_only_fields = fields


class TaskDetailSerializer(serializers.ModelSerializer):
    """
    Детальный сериализатор задачи.
    
    Включает все связанные объекты.
    """
    
    assignee = UserMinimalSerializer(read_only=True)
    co_assignees = UserMinimalSerializer(many=True, read_only=True)
    creator = UserMinimalSerializer(read_only=True)
    custom_approver = UserMinimalSerializer(read_only=True)
    
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    result_versions = TaskResultVersionSerializer(many=True, read_only=True)
    
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_deadline = serializers.IntegerField(read_only=True)
    is_under_review = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    division_display = serializers.CharField(source='get_division_display', read_only=True)
    
    # Доступные действия для текущего пользователя
    available_actions = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'task_type',
            'task_type_display',
            'status',
            'status_display',
            'priority',
            'priority_display',
            'category',
            'division',
            'division_display',
            'assignee',
            'co_assignees',
            'creator',
            'deadline',
            'is_overdue',
            'days_until_deadline',
            'is_under_review',
            'is_active',
            'approval_route',
            'custom_approver',
            'is_self_assigned',
            'current_result_version',
            'attachments',
            'comments',
            'result_versions',
            'available_actions',
            'project',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields
    
    def get_available_actions(self, obj):
        """
        Получить список доступных действий для текущего пользователя.
        
        Это определяется в сервисном слое, здесь просто возвращаем.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        
        # Импортируем здесь чтобы избежать circular import
        from services.task_service import TaskService
        return TaskService.get_available_actions(obj, request.user)


class TaskCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания задачи.
    """
    
    assignee_id = serializers.UUIDField(write_only=True)
    co_assignee_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        default=list
    )
    custom_approver_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = Task
        fields = [
            'title',
            'description',
            'task_type',
            'priority',
            'category',
            'division',
            'assignee_id',
            'co_assignee_ids',
            'deadline',
            'approval_route',
            'custom_approver_id',
            'is_self_assigned',
            'project',
        ]
    
    def validate_assignee_id(self, value):
        """Проверка существования исполнителя."""
        if not User.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Исполнитель не найден')
        return value
    
    def validate(self, data):
        """Кросс-валидация."""
        task_type = data.get('task_type', TaskType.T2)
        
        # T1 задачи — только management_only маршрут
        if task_type == TaskType.T1:
            data['approval_route'] = ApprovalRoute.MANAGEMENT_ONLY
        
        return data
    
    def create(self, validated_data):
        assignee_id = validated_data.pop('assignee_id')
        co_assignee_ids = validated_data.pop('co_assignee_ids', [])
        custom_approver_id = validated_data.pop('custom_approver_id', None)
        
        # Устанавливаем связи
        validated_data['assignee_id'] = assignee_id
        if custom_approver_id:
            validated_data['custom_approver_id'] = custom_approver_id
        
        task = super().create(validated_data)
        
        # Добавляем соисполнителей
        if co_assignee_ids:
            task.co_assignees.set(co_assignee_ids)
        
        return task


class TaskUpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для обновления задачи.
    
    Ограниченный набор полей для редактирования.
    """
    
    co_assignee_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Task
        fields = [
            'title',
            'description',
            'priority',
            'deadline',
            'co_assignee_ids',
        ]
    
    def update(self, instance, validated_data):
        co_assignee_ids = validated_data.pop('co_assignee_ids', None)
        
        task = super().update(instance, validated_data)
        
        if co_assignee_ids is not None:
            task.co_assignees.set(co_assignee_ids)
        
        return task


class TaskSubmitSerializer(serializers.Serializer):
    """
    Сериализатор для отправки результата на проверку.
    """
    
    result_description = serializers.CharField(
        required=True,
        min_length=10,
        help_text='Описание выполненной работы'
    )


class TaskRejectSerializer(serializers.Serializer):
    """
    Сериализатор для возврата на доработку.
    """
    
    reason = serializers.CharField(
        required=True,
        min_length=10,
        help_text='Причина возврата'
    )


class TaskWithdrawSerializer(serializers.Serializer):
    """
    Сериализатор для отзыва с проверки.
    """
    
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Причина отзыва'
    )
