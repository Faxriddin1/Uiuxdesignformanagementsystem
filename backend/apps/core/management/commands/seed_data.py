"""
=============================================================================
Seed Data Command
=============================================================================
Заполняет базу данных демо-данными для разработки.
"""

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.constants import UserRole, Division
from apps.tasks.models import Task
from apps.tasks.constants import TaskStatus, TaskType, TaskPriority
from apps.projects.models import Project, ProjectMilestone
from apps.projects.constants import ProjectStatus, ProjectPriority
from apps.research.models import Research
from apps.research.constants import ResearchStatus, ResearchType, AccessLevel


class Command(BaseCommand):
    help = 'Заполняет базу данных демо-данными'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Очистить существующие данные перед заполнением',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Очистка существующих данных...')
            self._clear_data()
        
        self.stdout.write('Создание пользователей...')
        users = self._create_users()
        
        self.stdout.write('Создание проектов...')
        projects = self._create_projects(users)
        
        self.stdout.write('Создание задач...')
        tasks = self._create_tasks(users, projects)
        
        self.stdout.write('Создание исследований...')
        researches = self._create_researches(users, projects)
        
        self.stdout.write(self.style.SUCCESS(
            f'Готово! Создано: {len(users)} пользователей, '
            f'{len(projects)} проектов, {len(tasks)} задач, '
            f'{len(researches)} исследований.'
        ))

    def _clear_data(self):
        """Очищает существующие данные."""
        Research.objects.all().delete()
        Task.objects.all().delete()
        Project.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    def _create_users(self) -> list[User]:
        """Создаёт демо-пользователей."""
        users = []
        
        # Руководитель управления
        if not User.objects.filter(email='head@demo.com').exists():
            users.append(User.objects.create_user(
                email='head@demo.com',
                password='demo1234',
                name='Александр Петров',
                role=UserRole.MANAGEMENT_HEAD,
                division=Division.RND,
            ))
        
        # Руководитель департамента
        if not User.objects.filter(email='dept@demo.com').exists():
            users.append(User.objects.create_user(
                email='dept@demo.com',
                password='demo1234',
                name='Мария Иванова',
                role=UserRole.DEPARTMENT_HEAD,
                division=Division.RND,
            ))
        
        # Руководители подразделений
        division_heads = [
            ('rnd_lead@demo.com', 'Сергей Козлов', Division.RND),
            ('it_lead@demo.com', 'Елена Смирнова', Division.IT_PROJECTS),
        ]
        
        for email, name, division in division_heads:
            if not User.objects.filter(email=email).exists():
                users.append(User.objects.create_user(
                    email=email,
                    password='demo1234',
                    name=name,
                    role=UserRole.DIVISION_HEAD,
                    division=division,
                ))
        
        # Сотрудники
        employees = [
            ('employee1@demo.com', 'Иван Сидоров', Division.RND),
            ('employee2@demo.com', 'Анна Федорова', Division.RND),
            ('employee3@demo.com', 'Дмитрий Николаев', Division.IT_PROJECTS),
            ('employee4@demo.com', 'Ольга Павлова', Division.IT_PROJECTS),
            ('employee5@demo.com', 'Максим Васильев', Division.RND),
        ]
        
        for email, name, division in employees:
            if not User.objects.filter(email=email).exists():
                users.append(User.objects.create_user(
                    email=email,
                    password='demo1234',
                    name=name,
                    role=UserRole.EMPLOYEE,
                    division=division,
                ))
        
        # Получаем всех пользователей
        return list(User.objects.all())

    def _create_projects(self, users: list[User]) -> list[Project]:
        """Создаёт демо-проекты."""
        projects = []
        
        managers = [u for u in users if u.role in [UserRole.DIVISION_HEAD, UserRole.DEPARTMENT_HEAD]]
        employees = [u for u in users if u.role == UserRole.EMPLOYEE]
        
        project_data = [
            {
                'code': 'PRJ-001',
                'title': 'Платформа машинного обучения',
                'description': 'Разработка платформы для автоматизации ML-пайплайнов',
                'status': ProjectStatus.IN_PROGRESS,
                'priority': ProjectPriority.HIGH,
                'division': Division.RND,
                'progress': 45,
            },
            {
                'code': 'PRJ-002',
                'title': 'Система документооборота',
                'description': 'Внедрение электронного документооборота',
                'status': ProjectStatus.PLANNING,
                'priority': ProjectPriority.MEDIUM,
                'division': Division.IT_PROJECTS,
                'progress': 10,
            },
            {
                'code': 'PRJ-003',
                'title': 'Модернизация инфраструктуры',
                'description': 'Миграция в облачную инфраструктуру',
                'status': ProjectStatus.IN_PROGRESS,
                'priority': ProjectPriority.CRITICAL,
                'division': Division.IT_PROJECTS,
                'progress': 70,
            },
            {
                'code': 'PRJ-004',
                'title': 'NLP-движок для чат-бота',
                'description': 'Разработка NLP-компонента для корпоративного бота',
                'status': ProjectStatus.REVIEW,
                'priority': ProjectPriority.HIGH,
                'division': Division.RND,
                'progress': 90,
            },
            {
                'code': 'PRJ-005',
                'title': 'Интеграция с внешними API',
                'description': 'Разработка интеграционного слоя',
                'status': ProjectStatus.DRAFT,
                'priority': ProjectPriority.LOW,
                'division': Division.IT_PROJECTS,
                'progress': 0,
            },
        ]
        
        for data in project_data:
            if Project.objects.filter(code=data['code']).exists():
                continue
            
            manager = random.choice([m for m in managers if m.division == data['division']] or managers)
            
            project = Project.objects.create(
                **data,
                manager=manager,
                start_date=timezone.now().date() - timedelta(days=random.randint(30, 90)),
                end_date=timezone.now().date() + timedelta(days=random.randint(30, 180)),
            )
            
            # Добавляем участников
            division_employees = [e for e in employees if e.division == data['division']]
            for emp in random.sample(division_employees, min(2, len(division_employees))):
                project.members.add(emp)
            
            # Создаём вехи
            milestones = [
                ('Анализ требований', 10),
                ('Проектирование', 30),
                ('Разработка MVP', 60),
                ('Тестирование', 80),
                ('Релиз', 100),
            ]
            
            for idx, (title, threshold) in enumerate(milestones):
                ProjectMilestone.objects.create(
                    project=project,
                    title=title,
                    due_date=project.start_date + timedelta(days=30 * (idx + 1)),
                    completed=project.progress >= threshold,
                    order=idx,
                )
            
            projects.append(project)
        
        return projects

    def _create_tasks(self, users: list[User], projects: list[Project]) -> list[Task]:
        """Создаёт демо-задачи."""
        tasks = []
        
        employees = [u for u in users if u.role == UserRole.EMPLOYEE]
        creators = [u for u in users if u.role in [UserRole.DIVISION_HEAD, UserRole.DEPARTMENT_HEAD]]
        
        task_templates = [
            ('Провести анализ требований', TaskType.T1, TaskPriority.HIGH),
            ('Разработать архитектуру модуля', TaskType.T1, TaskPriority.HIGH),
            ('Написать документацию API', TaskType.T2, TaskPriority.MEDIUM),
            ('Подготовить отчёт о прогрессе', TaskType.T2, TaskPriority.LOW),
            ('Провести code review', TaskType.T2, TaskPriority.MEDIUM),
            ('Настроить CI/CD пайплайн', TaskType.T1, TaskPriority.HIGH),
            ('Оптимизировать производительность', TaskType.T1, TaskPriority.URGENT),
            ('Исправить баги из backlog', TaskType.T2, TaskPriority.MEDIUM),
            ('Провести нагрузочное тестирование', TaskType.T1, TaskPriority.HIGH),
            ('Подготовить презентацию для стейкхолдеров', TaskType.T2, TaskPriority.LOW),
        ]
        
        statuses = [
            TaskStatus.NEW,
            TaskStatus.IN_PROGRESS,
            TaskStatus.UNDER_DIVISION_REVIEW,
            TaskStatus.UNDER_MANAGEMENT_REVIEW,
            TaskStatus.ACCEPTED,
        ]
        
        for project in projects[:3]:
            for i, (title, task_type, priority) in enumerate(random.sample(task_templates, 5)):
                status = random.choice(statuses)
                assignee = random.choice([e for e in employees if e.division == project.division] or employees)
                creator = random.choice([c for c in creators if c.division == project.division] or creators)
                
                task = Task.objects.create(
                    title=f'{title} - {project.code}',
                    description=f'Задача для проекта {project.title}',
                    task_type=task_type,
                    status=status,
                    priority=priority,
                    division=project.division,
                    project=project,
                    creator=creator,
                    assignee=assignee if status != TaskStatus.NEW else None,
                    deadline=timezone.now() + timedelta(days=random.randint(-5, 30)),
                    created_by=creator,
                )
                
                tasks.append(task)
        
        return tasks

    def _create_researches(self, users: list[User], projects: list[Project]) -> list[Research]:
        """Создаёт демо-исследования."""
        researches = []
        
        rnd_users = [u for u in users if u.division == Division.RND]
        
        research_data = [
            {
                'title': 'Анализ рынка NLP-решений',
                'research_type': ResearchType.MARKET,
                'status': ResearchStatus.APPROVED,
                'access_level': AccessLevel.PUBLIC,
            },
            {
                'title': 'Сравнение фреймворков глубокого обучения',
                'research_type': ResearchType.TECHNICAL,
                'status': ResearchStatus.IN_PROGRESS,
                'access_level': AccessLevel.DIVISION,
            },
            {
                'title': 'Конкурентный анализ AI-стартапов',
                'research_type': ResearchType.COMPETITIVE,
                'status': ResearchStatus.SUBMITTED,
                'access_level': AccessLevel.RESTRICTED,
            },
            {
                'title': 'Исследование UX для ML-платформ',
                'research_type': ResearchType.USER,
                'status': ResearchStatus.DRAFT,
                'access_level': AccessLevel.DIVISION,
            },
            {
                'title': 'Feasibility study: AutoML',
                'research_type': ResearchType.FEASIBILITY,
                'status': ResearchStatus.IN_PROGRESS,
                'access_level': AccessLevel.PRIVATE,
            },
        ]
        
        for data in research_data:
            author = random.choice(rnd_users) if rnd_users else users[0]
            
            research = Research.objects.create(
                **data,
                description=f'Исследование в области {data["title"]}',
                objectives='Определить ключевые тренды и возможности',
                methodology='Кабинетное исследование, анализ данных',
                priority='medium',
                division=Division.RND,
                author=author,
                start_date=timezone.now().date() - timedelta(days=random.randint(10, 60)),
                due_date=timezone.now().date() + timedelta(days=random.randint(10, 60)),
                project=projects[0] if projects else None,
                created_by=author,
            )
            
            # Добавляем соавторов
            other_rnd = [u for u in rnd_users if u != author]
            if other_rnd:
                research.contributors.add(random.choice(other_rnd))
            
            researches.append(research)
        
        return researches
