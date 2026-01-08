# Architecture Decision Records (ADR)

## О документе

Этот документ содержит записи об архитектурных решениях (Architecture Decision Records, ADR), принятых в проекте Management System. Каждое решение документируется с контекстом, причинами выбора и последствиями.

**Формат записи:**
- **Статус:** Принято / Отклонено / Устарело
- **Контекст:** Почему нужно было принять решение
- **Решение:** Что было решено
- **Последствия:** Какие плюсы и минусы это несёт

---

## ADR-001: Использование Service Layer

**Дата:** 2026-01-08  
**Статус:** ✅ Принято  
**Авторы:** Development Team

### Контекст

В начале проекта вся бизнес-логика размещалась непосредственно в API Views (контроллерах). Это привело к:
- Раздутым views с множеством ответственностей
- Сложности тестирования (нужно мокировать HTTP requests)
- Дублированию кода между разными views
- Сложности повторного использования логики

### Решение

Внедрить **Service Layer Pattern** — выделить бизнес-логику в отдельные сервисные классы в директории `services/`.

**Структура:**
```
services/
├── __init__.py
├── task_service.py       # TaskService
├── project_service.py    # ProjectService
├── notification_service.py
└── analytics_service.py
```

**Пример:**
```python
# services/task_service.py
class TaskService:
    @transaction.atomic
    def create_task(self, user, project_id, data):
        """Создание задачи с валидацией и уведомлениями."""
        project = Project.objects.get(id=project_id)
        
        # Проверка прав
        if not project.has_permission(user, 'add_task'):
            raise PermissionDenied()
        
        # Создание задачи
        task = Task.objects.create(
            project=project,
            created_by=user,
            **data
        )
        
        # Отправка уведомлений
        notification_service.notify_task_created(task)
        
        return task

# api/views.py
class TaskViewSet(viewsets.ModelViewSet):
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task = task_service.create_task(
            user=request.user,
            project_id=request.data['project'],
            data=serializer.validated_data
        )
        
        return Response(TaskSerializer(task).data, status=201)
```

### Последствия

**Плюсы:**
- ✅ **Separation of Concerns** — чёткое разделение ответственностей
- ✅ **Тестируемость** — сервисы можно тестировать без HTTP layer
- ✅ **Повторное использование** — логика доступна из разных мест (API, CLI, Celery tasks)
- ✅ **Thin Controllers** — views остаются простыми и понятными
- ✅ **Транзакционность** — легко оборачивать операции в транзакции

**Минусы:**
- ❌ Дополнительный слой абстракции
- ❌ Больше файлов в проекте
- ❌ Нужно следить, чтобы логика не дублировалась между сервисами и моделями

**Альтернативы:**
- **Fat Models** — вся логика в моделях (отклонено из-за раздутых моделей)
- **Domain-Driven Design** — более сложный подход с Entities/Value Objects (избыточно для текущего проекта)

---

## ADR-002: JWT вместо Session-based Authentication

**Дата:** 2026-01-08  
**Статус:** ✅ Принято  
**Авторы:** Development Team

### Контекст

Для аутентификации пользователей в API нужно было выбрать между:
1. **Session-based auth** — традиционный подход Django
2. **JWT tokens** — stateless подход
3. **OAuth2** — более сложный протокол

### Решение

Использовать **JWT (JSON Web Tokens)** через библиотеку `djangorestframework-simplejwt`.

**Конфигурация:**
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
}
```

**Flow:**
1. Login → получить Access Token (15 мин) + Refresh Token (7 дней)
2. Запросы к API → отправлять Access Token в заголовке `Authorization: Bearer <token>`
3. Access Token истёк → использовать Refresh Token для получения нового Access Token
4. Refresh Token истёк → нужен новый Login

### Последствия

**Плюсы:**
- ✅ **Stateless backend** — не нужно хранить сессии в БД или Redis
- ✅ **Масштабируемость** — легко добавлять новые backend серверы
- ✅ **Mobile-friendly** — JWT удобен для мобильных приложений
- ✅ **Microservices-ready** — токены можно валидировать в разных сервисах
- ✅ **Short-lived tokens** — 15-минутный Access Token снижает риски

**Минусы:**
- ❌ **Невозможность инвалидации** — токен валиден до истечения (решается через blacklist)
- ❌ **Размер токена** — JWT больше по размеру, чем session ID
- ❌ **Безопасность** — нужно хранить токены безопасно на клиенте (httpOnly cookies или secure storage)

**Альтернативы:**
- **Session-based** — проще, но не подходит для stateless architecture
- **OAuth2** — избыточно сложно для текущих требований

**Безопасность:**
- Access Token хранится в памяти приложения (не в localStorage)
- Refresh Token в httpOnly cookie (если через web)
- HTTPS обязателен в production

---

## ADR-003: Soft Delete для всех сущностей

**Дата:** 2026-01-08  
**Статус:** ✅ Принято  
**Авторы:** Development Team

### Контекст

При удалении данных пользователями (задачи, проекты) нужно решить:
- Удалять физически (hard delete) из БД?
- Помечать как удалённые (soft delete)?

**Проблемы hard delete:**
- Невозможность восстановления данных
- Потеря истории (кто, когда, что удалил)
- Нарушение связей между сущностями (foreign keys)
- Проблемы с аудитом

### Решение

Использовать **Soft Delete** для всех основных сущностей.

**Реализация:**
```python
# core/models.py
class SoftDeleteMixin(models.Model):
    """Mixin для soft delete."""
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    
    class Meta:
        abstract = True
    
    def delete(self, using=None, keep_parents=False):
        """Переопределяем delete для soft delete."""
        self.deleted_at = timezone.now()
        self.save(using=using)
    
    def hard_delete(self):
        """Физическое удаление (только для админов)."""
        super().delete()

# core/managers.py
class SoftDeleteManager(models.Manager):
    """Manager для работы только с неудалёнными объектами."""
    
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

# Использование
class Task(SoftDeleteMixin):
    # ... поля ...
    
    objects = SoftDeleteManager()  # По умолчанию без удалённых
    all_objects = models.Manager()  # Со всеми (включая удалённые)
```

**API:**
```python
# Soft delete
task.delete()  # deleted_at = now()

# Восстановление
task.deleted_at = None
task.save()

# Hard delete (только для админов)
task.hard_delete()

# Запросы
Task.objects.all()      # Только неудалённые
Task.all_objects.all()  # Включая удалённые
```

### Последствия

**Плюсы:**
- ✅ **Восстановление данных** — можно вернуть удалённое
- ✅ **Аудит** — полная история изменений
- ✅ **Безопасность** — случайное удаление не критично
- ✅ **Связи** — foreign keys остаются валидными
- ✅ **Соответствие GDPR** — можно настроить физическое удаление для персональных данных

**Минусы:**
- ❌ **Размер БД** — удалённые данные занимают место
- ❌ **Производительность** — больше записей в таблицах
- ❌ **Сложность** — нужно помнить про фильтрацию deleted_at
- ❌ **Unique constraints** — могут конфликтовать с удалёнными записями

**Решения для минусов:**
- Периодическая очистка старых удалённых записей (> 90 дней)
- Индексы на `deleted_at` для производительности
- Composite unique constraints с учётом `deleted_at`

**Альтернативы:**
- **Hard Delete** — проще, но небезопасно
- **Archive таблицы** — перемещать удалённые в отдельные таблицы (сложнее)

---

## ADR-004: PostgreSQL как основная БД

**Дата:** 2026-01-08  
**Статус:** ✅ Принято  
**Авторы:** Development Team

### Контекст

Нужно выбрать СУБД для проекта.

**Требования:**
- Поддержка транзакций (ACID)
- Полнотекстовый поиск
- JSON поля для гибкости
- Надёжность и производительность
- Open Source

### Решение

Использовать **PostgreSQL 16** как основную СУБД.

### Последствия

**Плюсы:**
- ✅ **ACID transactions** — надёжность данных
- ✅ **Advanced features** — JSON, Full-Text Search, Array fields
- ✅ **Производительность** — отличная для большинства случаев
- ✅ **Django ORM поддержка** — полная интеграция
- ✅ **Open Source** — бесплатно, большое сообщество
- ✅ **Managed services** — AWS RDS, Azure Database, Google Cloud SQL

**Минусы:**
- ❌ Сложнее в настройке, чем MySQL (решается через Docker)
- ❌ Требует больше ресурсов (RAM)

**Альтернативы:**
- **MySQL** — проще, но меньше возможностей
- **SQLite** — только для разработки, не подходит для production

---

## ADR-005: Vite вместо Create React App

**Дата:** 2026-01-08  
**Статус:** ✅ Принято  
**Авторы:** Development Team

### Контекст

Для frontend нужен build tool. Рассматривались:
- **Create React App (CRA)** — традиционный выбор
- **Vite** — современный быстрый bundler
- **Next.js** — полноценный фреймворк (избыточно)

### Решение

Использовать **Vite** как build tool для frontend.

### Последствия

**Плюсы:**
- ✅ **Скорость разработки** — мгновенный HMR (Hot Module Replacement)
- ✅ **Быстрая сборка** — в разы быстрее, чем CRA
- ✅ **Современный ES Modules** — нативная поддержка
- ✅ **TypeScript out-of-the-box** — без дополнительной настройки
- ✅ **Лёгкая настройка** — простой vite.config.ts

**Минусы:**
- ❌ Меньше туториалов, чем для CRA (но растущее сообщество)
- ❌ Некоторые старые пакеты могут требовать настройки

**Альтернативы:**
- **CRA** — проще для начинающих, но медленнее
- **Next.js** — избыточно, так как у нас отдельный backend

---

## ADR-006: Docker Compose для локальной разработки

**Дата:** 2026-01-08  
**Статус:** ✅ Принято  
**Авторы:** Development Team

### Контекст

Разработчикам нужно запускать весь стек (frontend + backend + db) локально.

**Проблемы без Docker:**
- Разные версии PostgreSQL, Python, Node.js
- Сложная настройка окружения
- "Works on my machine" проблемы

### Решение

Использовать **Docker Compose** для унификации development environment.

**Структура:**
```yaml
services:
  - db (PostgreSQL 16)
  - backend (Django)
  - frontend (Vite dev server)
```

### Последствия

**Плюсы:**
- ✅ **Единое окружение** — все используют одинаковые версии
- ✅ **Быстрый старт** — `make up` запускает всё
- ✅ **Изоляция** — не засоряет локальную систему
- ✅ **CI/CD готовность** — те же образы в production

**Минусы:**
- ❌ **Overhead** — Docker требует ресурсов
- ❌ **Сложность отладки** — для новичков может быть непривычно
- ❌ **Медленнее на Windows/Mac** — из-за file sharing

**Альтернативы:**
- **Локальная установка** — проще, но не унифицировано
- **Vagrant** — устарело, Docker популярнее

---

## ADR-007: Makefile для унификации команд

**Дата:** 2026-01-08  
**Статус:** ✅ Принято  
**Авторы:** Development Team

### Контекст

Команды Docker Compose длинные и сложно запоминаются:
```bash
docker compose exec backend python manage.py migrate
docker compose exec backend pytest --cov=apps
```

### Решение

Создать **Makefile** с короткими командами:
```bash
make migrate
make test
make up
make down
```

### Последствия

**Плюсы:**
- ✅ **Простота** — короткие запоминающиеся команды
- ✅ **Документация** — `make help` показывает все команды
- ✅ **Стандартизация** — все используют одни команды
- ✅ **Автоматизация** — можно добавлять сложные workflows

**Минусы:**
- ❌ **GNU Make** — может не быть на Windows (решается через WSL)
- ❌ Ещё один инструмент для изучения

**Альтернативы:**
- **Shell скрипты** — менее структурировано
- **Task runners** (gulp, grunt) — избыточно

---

## История изменений

| Дата | ADR | Изменение |
|------|-----|-----------|
| 2026-01-08 | ADR-001 до ADR-007 | Инициализация документа |

---

## Процесс принятия решений

1. **Проблема обнаружена** → создаётся issue для обсуждения
2. **Обсуждение** → команда обсуждает варианты решения
3. **Решение принято** → создаётся ADR в этом документе
4. **Реализация** → решение внедряется в код
5. **Обзор** → периодически пересматриваем актуальность решений

**Для предложения нового ADR:**
Создайте Pull Request с новой записью в этом файле.
