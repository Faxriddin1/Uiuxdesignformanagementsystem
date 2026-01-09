"""
=============================================================================
External Package Serializers
=============================================================================
"""

from rest_framework import serializers

from apps.accounts.serializers import UserShortSerializer

from .models import ExternalPackage, PackageLogEntry


class PackageLogEntrySerializer(serializers.ModelSerializer):
    """
    Сериализатор записи журнала пакета.
    """
    user = UserShortSerializer(read_only=True)
    
    class Meta:
        model = PackageLogEntry
        fields = ['id', 'action', 'user', 'notes', 'timestamp']


class ExternalPackageListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка внешних пакетов (краткий).
    """
    responsible = UserShortSerializer(read_only=True)
    creator = UserShortSerializer(source='created_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    division_display = serializers.CharField(source='get_division_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ExternalPackage
        fields = [
            'id', 'title', 'recipient', 'channel', 'channel_display',
            'status', 'status_display', 'division', 'division_display',
            'responsible', 'creator', 'sent_at', 'expected_response_date',
            'received_at', 'is_overdue', 'created_at'
        ]


class ExternalPackageDetailSerializer(serializers.ModelSerializer):
    """
    Детальный сериализатор внешнего пакета.
    """
    responsible = UserShortSerializer(read_only=True)
    responsible_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    creator = UserShortSerializer(source='created_by', read_only=True)
    
    log_entries = PackageLogEntrySerializer(many=True, read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    division_display = serializers.CharField(source='get_division_display', read_only=True)
    
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ExternalPackage
        fields = [
            'id', 'title', 'description', 'recipient', 'channel', 'channel_display',
            'status', 'status_display', 'division', 'division_display',
            'responsible', 'responsible_id', 'creator',
            'linked_task', 'linked_project',
            'sent_at', 'expected_response_date', 'received_at', 'escalated_at',
            'is_overdue', 'log_entries',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'creator', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Создание нового пакета с логом"""
        responsible_id = validated_data.pop('responsible_id', None)
        
        if responsible_id:
            from apps.accounts.models import User
            try:
                responsible = User.objects.get(id=responsible_id)
                validated_data['responsible'] = responsible
            except User.DoesNotExist:
                pass
        
        package = super().create(validated_data)
        
        # Создаем запись в журнале
        PackageLogEntry.objects.create(
            package=package,
            action='created',
            user=self.context['request'].user,
            notes='Пакет создан'
        )
        
        return package
    
    def update(self, instance, validated_data):
        """Обновление пакета с логом"""
        responsible_id = validated_data.pop('responsible_id', None)
        
        if responsible_id:
            from apps.accounts.models import User
            try:
                responsible = User.objects.get(id=responsible_id)
                validated_data['responsible'] = responsible
            except User.DoesNotExist:
                pass
        
        # Отслеживаем изменения статуса
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        package = super().update(instance, validated_data)
        
        # Если статус изменился, создаем запись в журнале
        if old_status != new_status:
            PackageLogEntry.objects.create(
                package=package,
                action=f'status_changed_to_{new_status}',
                user=self.context['request'].user,
                notes=f'Статус изменен: {old_status} → {new_status}'
            )
        
        return package


class ExternalPackageCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания внешнего пакета.
    """
    responsible_id = serializers.UUIDField(required=False, allow_null=True)
    
    class Meta:
        model = ExternalPackage
        fields = [
            'title', 'description', 'recipient', 'channel',
            'division', 'responsible_id',
            'linked_task', 'linked_project', 'expected_response_date'
        ]
    
    def create(self, validated_data):
        """Создание пакета"""
        responsible_id = validated_data.pop('responsible_id', None)
        
        if responsible_id:
            from apps.accounts.models import User
            try:
                responsible = User.objects.get(id=responsible_id)
                validated_data['responsible'] = responsible
            except User.DoesNotExist:
                pass
        
        package = ExternalPackage.objects.create(**validated_data)
        
        # Создаем запись в журнале
        PackageLogEntry.objects.create(
            package=package,
            action='created',
            user=self.context['request'].user,
            notes='Пакет создан'
        )
        
        return package
