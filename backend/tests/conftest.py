"""
=============================================================================
Pytest Configuration
=============================================================================
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """Возвращает неавторизованный API клиент."""
    return APIClient()


@pytest.fixture
def user_factory(db):
    """Фабрика для создания пользователей."""
    def create_user(
        email=None,
        password='testpass123',
        first_name='Test',
        last_name='User',
        role='employee',
        division='rnd',
        **kwargs
    ):
        if email is None:
            import uuid
            email = f'test-{uuid.uuid4().hex[:8]}@test.com'
        
        return User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            division=division,
            **kwargs
        )
    
    return create_user


@pytest.fixture
def employee_user(user_factory):
    """Создаёт пользователя-сотрудника."""
    return user_factory(
        email='employee@test.com',
        role='employee',
        division='rnd',
    )


@pytest.fixture
def division_head_user(user_factory):
    """Создаёт руководителя подразделения."""
    return user_factory(
        email='division_head@test.com',
        role='division_head',
        division='rnd',
    )


@pytest.fixture
def department_head_user(user_factory):
    """Создаёт руководителя департамента."""
    return user_factory(
        email='department_head@test.com',
        role='department_head',
        division='rnd',
    )


@pytest.fixture
def authenticated_client(api_client, employee_user):
    """Возвращает авторизованный клиент."""
    api_client.force_authenticate(user=employee_user)
    return api_client


@pytest.fixture
def authenticated_client_division_head(api_client, division_head_user):
    """Возвращает авторизованный клиент руководителя подразделения."""
    api_client.force_authenticate(user=division_head_user)
    return api_client


@pytest.fixture
def task_factory(db, employee_user, division_head_user):
    """Фабрика для создания задач."""
    from apps.tasks.models import Task
    from apps.tasks.constants import TaskStatus, TaskType
    from django.utils import timezone
    from datetime import timedelta
    
    def create_task(
        title='Test Task',
        task_type=TaskType.T1,
        status=TaskStatus.NEW,
        priority='medium',
        division='rnd',
        creator=None,
        assignee=None,
        **kwargs
    ):
        return Task.objects.create(
            title=title,
            description='Test task description',
            task_type=task_type,
            status=status,
            priority=priority,
            division=division,
            creator=creator or division_head_user,
            assignee=assignee or employee_user,
            deadline=timezone.now().date() + timedelta(days=7),
            created_by=creator or division_head_user,
            **kwargs
        )
    
    return create_task


@pytest.fixture
def project_factory(db, division_head_user):
    """Фабрика для создания проектов."""
    from apps.projects.models import Project
    
    counter = [0]
    
    def create_project(
        title='Test Project',
        code=None,
        status='draft',
        priority='medium',
        division='rnd',
        manager=None,
        **kwargs
    ):
        counter[0] += 1
        if code is None:
            code = f'TST-{counter[0]:03d}'
        
        return Project.objects.create(
            title=title,
            code=code,
            status=status,
            priority=priority,
            division=division,
            manager=manager or division_head_user,
            created_by=division_head_user,
            **kwargs
        )
    
    return create_project


@pytest.fixture
def research_factory(db, employee_user):
    """Фабрика для создания исследований."""
    from apps.research.models import Research
    
    def create_research(
        title='Test Research',
        research_type='technical',
        status='draft',
        priority='medium',
        division='rnd',
        author=None,
        **kwargs
    ):
        return Research.objects.create(
            title=title,
            research_type=research_type,
            status=status,
            priority=priority,
            division=division,
            author=author or employee_user,
            created_by=author or employee_user,
            **kwargs
        )
    
    return create_research
