from django.contrib import admin
from apps.audit_logs.models import AuditLog, LoginHistory, DataExport


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'action', 'object_repr', 'ip_address', 'success']
    list_filter = ['action', 'success', 'timestamp']
    search_fields = ['user__email', 'ip_address', 'object_repr']
    readonly_fields = ['timestamp', 'user', 'action', 'ip_address', 'user_agent', 
                      'content_type', 'object_id', 'object_repr', 'extra_data', 
                      'changes', 'request_url', 'request_method', 'success', 'error_message']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'ip_address', 'success', 'country', 'city']
    list_filter = ['success', 'timestamp']
    search_fields = ['user__email', 'ip_address', 'country', 'city']
    readonly_fields = ['timestamp', 'user', 'ip_address', 'user_agent', 'success', 
                      'failure_reason', 'session_key', 'country', 'city']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(DataExport)
class DataExportAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'export_type', 'format', 'record_count', 'file_size']
    list_filter = ['export_type', 'format', 'timestamp']
    search_fields = ['user__email', 'export_type']
    readonly_fields = ['timestamp', 'user', 'export_type', 'format', 'filters', 
                      'record_count', 'file_size', 'ip_address']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
