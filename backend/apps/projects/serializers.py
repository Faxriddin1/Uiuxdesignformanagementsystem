"""
=============================================================================
Project Serializers
=============================================================================
"""

from rest_framework import serializers

from apps.accounts.serializers import UserShortSerializer

from .constants import PROJECT_STEPS, get_project_step_index
from .models import Project, ProjectHistory, ProjectMilestone


class ProjectMilestoneSerializer(serializers.ModelSerializer):
    """
    Сериализатор вех проекта.
    """
    
    class Meta:
        model = ProjectMilestone
        fields = [
            'id', 'title', 'description', 'due_date',
            'completed', 'completed_at', 'order'
        ]
        read_only_fields = ['id', 'completed_at']


class ProjectHistorySerializer(serializers.ModelSerializer):
    """
    Сериализатор истории проекта.
    """
    user = UserShortSerializer(read_only=True)
    
    class Meta:
        model = ProjectHistory
        fields = ['id', 'user', 'action', 'details', 'created_at']


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка проектов (краткий).
    """
    manager = UserShortSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    division_display = serializers.CharField(source='get_division_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    completed_task_count = serializers.IntegerField(read_only=True)
    step_index = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'code', 'title', 'status', 'status_display',
            'priority', 'priority_display', 'division', 'division_display',
            'manager', 'start_date', 'end_date', 'progress',
            'is_overdue', 'days_remaining', 'task_count', 'completed_task_count',
            'step_index', 'created_at'
        ]

    def get_step_index(self, obj) -> int:
        """Возвращает индекс шага (0-3) для UI stepper."""
        return get_project_step_index(obj.status)


class ProjectDetailSerializer(serializers.ModelSerializer):
    """
    Детальный сериализатор проекта.
    """
    manager = UserShortSerializer(read_only=True)
    manager_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    members = UserShortSerializer(many=True, read_only=True)
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    milestones = ProjectMilestoneSerializer(many=True, read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    division_display = serializers.CharField(source='get_division_display', read_only=True)
    
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    completed_task_count = serializers.IntegerField(read_only=True)
    step_index = serializers.SerializerMethodField()
    steps = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'code', 'title', 'description',
            'status', 'status_display', 'priority', 'priority_display',
            'division', 'division_display',
            'manager', 'manager_id', 'members', 'member_ids',
            'start_date', 'end_date', 'progress',
            'budget', 'spent',
            'is_overdue', 'days_remaining', 'task_count', 'completed_task_count',
            'step_index', 'steps', 'milestones',
            'created_at', 'updated_at', 'created_by', 'updated_by'
        ]
        read_only_fields = ['id', 'code', 'created_at', 'updated_at', 'created_by', 'updated_by']

    def get_step_index(self, obj) -> int:
        return get_project_step_index(obj.status)

    def get_steps(self, obj) -> list[dict]:
        """Возвращает конфигурацию шагов для UI."""
        return PROJECT_STEPS

    def update(self, instance, validated_data):
        member_ids = validated_data.pop('member_ids', None)
        manager_id = validated_data.pop('manager_id', None)
        
        instance = super().update(instance, validated_data)
        
        if manager_id:
            from apps.accounts.models import User
            try:
                instance.manager = User.objects.get(id=manager_id)
                instance.save(update_fields=['manager'])
            except User.DoesNotExist:
                pass
        
        if member_ids is not None:
            from apps.accounts.models import User
            members = User.objects.filter(id__in=member_ids)
            instance.members.set(members)
        
        return instance


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор создания проекта.
    """
    manager_id = serializers.UUIDField(required=False, allow_null=True)
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'code', 'priority', 'division',
            'manager_id', 'member_ids', 'start_date', 'end_date',
            'budget'
        ]

    def validate_code(self, value):
        """Проверяет уникальность кода."""
        if Project.objects.filter(code=value).exists():
            raise serializers.ValidationError('Проект с таким кодом уже существует.')
        return value

    def create(self, validated_data):
        manager_id = validated_data.pop('manager_id', None)
        member_ids = validated_data.pop('member_ids', [])
        
        project = Project.objects.create(**validated_data)
        
        if manager_id:
            from apps.accounts.models import User
            try:
                project.manager = User.objects.get(id=manager_id)
                project.save(update_fields=['manager'])
            except User.DoesNotExist:
                pass
        
        if member_ids:
            from apps.accounts.models import User
            members = User.objects.filter(id__in=member_ids)
            project.members.set(members)
        
        return project


class ProjectTransitionSerializer(serializers.Serializer):
    """
    Сериализатор перехода статуса проекта.
    """
    to_status = serializers.ChoiceField(choices=[])
    comment = serializers.CharField(required=False, allow_blank=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Динамически устанавливаем доступные статусы
        from .constants import ProjectStatus
        self.fields['to_status'] = serializers.ChoiceField(
            choices=ProjectStatus.choices
        )
