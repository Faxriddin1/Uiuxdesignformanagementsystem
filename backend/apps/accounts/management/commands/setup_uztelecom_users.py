"""
Management команда для создания реальных пользователей Uztelecom
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User, UserDivision
from apps.accounts.constants import UserRole, Division


class Command(BaseCommand):
    help = 'Создает пользователей Uztelecom (удаляет старых и создает новых)'

    def handle(self, *args, **options):
        self.stdout.write('Создание пользователей Uztelecom...')
        
        with transaction.atomic():
            # 1. Удаляем всех существующих пользователей
            deleted_count = User.objects.all().count()
            User.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(f'Удалено пользователей: {deleted_count}')
            )
            
            # 2. Создаем реальных пользователей
            users_data = [
                {
                    'email': 's.nabiev@uztelecom.uz',
                    'name': 'Набиев Сардор Ботир ўғли',
                    'role': UserRole.MANAGEMENT_HEAD,
                    'division': Division.RND,  # Управление IT развития
                    'password': 'uztelecom2026',
                    'is_staff': True,
                    'description': 'Начальник Управления / Axborot texnologiyalarini rivojlantirish boshqarmasi'
                },
                {
                    'email': 'j.abdivosiev@uztelecom.uz',
                    'name': 'Абдивосиев Жахонгир Асомиддин ўғли',
                    'role': UserRole.DIVISION_HEAD,
                    'division': Division.RND,
                    'password': 'uztelecom2026',
                    'is_staff': True,
                    'description': 'Начальник отдела / Innovatsiyalar va R&D bo\'limi'
                },
                {
                    'email': 'sh.tagzamov@uztelecom.uz',
                    'name': 'Агзамов Шухрат Тургунбой ўғли',
                    'role': UserRole.EMPLOYEE,
                    'division': Division.RND,
                    'password': 'uztelecom2026',
                    'description': 'Ведущий инженер / Innovatsiyalar va R&D bo\'limi'
                },
                {
                    'email': 'f.mutalov@utc.uz',
                    'name': 'Муталов Фахриддин Зохириддин ўғли',
                    'role': UserRole.EMPLOYEE,
                    'division': Division.RND,  # Основной отдел - R&D
                    'password': 'uztelecom2026',
                    'description': 'Ведущий инженер / R&D и IT-проекты (работает в 2 отделах)'
                },
                {
                    'email': 'v.kamelyan@uztelecom.uz',
                    'name': 'Камелян Владислав Васильевич',
                    'role': UserRole.DIVISION_HEAD,
                    'division': Division.IT_PROJECTS,
                    'password': 'uztelecom2026',
                    'is_staff': True,
                    'description': 'Начальник отдела / "IT"-loyihalarni boshqarish va tatbiq etish bo\'limi'
                },
            ]
            
            created_users = []
            for user_data in users_data:
                description = user_data.pop('description', '')
                password = user_data.pop('password')
                
                user = User.objects.create_user(**user_data)
                user.set_password(password)
                user.save()
                
                created_users.append(user)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Создан: {user.name} ({user.email}) - {user.get_role_display()} / {user.get_division_display()}'
                    )
                )
                if description:
                    self.stdout.write(f'  {description}')
            
            self.stdout.write('\n' + '='*80)
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Успешно создано пользователей: {len(created_users)}'
                )
            )
            
            # 3. Добавляем Муталову второй отдел (IT-проекты)
            mutalov = User.objects.get(email='f.mutalov@utc.uz')
            UserDivision.objects.create(
                user=mutalov,
                division=Division.IT_PROJECTS,
                can_assign_tasks=True
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Добавлен дополнительный отдел для {mutalov.name}: IT-проекты'
                )
            )
            
            self.stdout.write('\nДанные для входа:')
            self.stdout.write('  Email: s.nabiev@uztelecom.uz (Начальник Управления)')
            self.stdout.write('  Email: j.abdivosiev@uztelecom.uz (Начальник отдела R&D)')
            self.stdout.write('  Email: sh.tagzamov@uztelecom.uz (Инженер R&D)')
            self.stdout.write('  Email: f.mutalov@utc.uz (Инженер R&D + IT-проекты)')
            self.stdout.write('  Email: v.kamelyan@uztelecom.uz (Начальник отдела IT-проекты)')
            self.stdout.write('  Пароль для всех: uztelecom2026')
            self.stdout.write('='*80 + '\n')
            
            # Информация о Mutalov Faxriddin
            mutalov = User.objects.get(email='f.mutalov@utc.uz')
            mutalov_divisions = mutalov.get_all_divisions()
            
            self.stdout.write(
                self.style.WARNING(
                    f'\n⚠ ВАЖНО: {mutalov.name} работает в {len(mutalov_divisions)} отделах:'
                )
            )
            self.stdout.write(f'  - Основной отдел: {mutalov.get_division_display()} (R&D)')
            self.stdout.write(f'  - Дополнительный отдел: IT-проекты')
            self.stdout.write(f'\n  Оба начальника отделов могут ставить ему задачи:')
            
            abdivosiev = User.objects.get(email='j.abdivosiev@uztelecom.uz')
            kamelyan = User.objects.get(email='v.kamelyan@uztelecom.uz')
            
            self.stdout.write(f'    1. {abdivosiev.name} (R&D)')
            self.stdout.write(f'    2. {kamelyan.name} (IT-проекты)')
