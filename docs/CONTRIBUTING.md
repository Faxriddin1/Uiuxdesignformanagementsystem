# Contributing Guide

> Руководство для разработчиков проекта Management System

---

## 📋 Оглавление

- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Git Workflow](#git-workflow)
- [Code Style](#code-style)
- [Тестирование](#тестирование)
- [Pull Request Process](#pull-request-process)
- [Архитектурные правила](#архитектурные-правила)

---

## Быстрый старт

### Требования

- Docker Desktop 24+
- Node.js 18+ (для frontend разработки)
- Git 2.40+
- VS Code (рекомендуется)

### Первый запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Faxriddin1/Uiuxdesignformanagementsystem.git
cd Uiuxdesignformanagementsystem

# 2. Скопировать переменные окружения
cp backend/.env.example backend/.env

# 3. Запустить всё одной командой
make setup

# 4. Открыть приложение
# Backend:  http://localhost:8000/api/docs/
# Frontend: http://localhost:5173
```

### Демо-доступы

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@example.com | admin123 |
| Manager | manager@example.com | user123 |
| Designer | designer@example.com | user123 |

---

## Структура проекта

```
Uiuxdesignformanagementsystem/
├── backend/                    # Django приложение
│   ├── apps/                   # Django apps
│   │   ├── accounts/          # Пользователи, роли
│   │   ├── projects/          # Проекты
│   │   ├── tasks/             # Задачи
│   │   └── ...
│   ├── services/              # Бизнес-логика (❗ не в views!)
│   ├── tests/                 # Тесты
│   └── config/                # Django настройки
│
├── src/                        # React приложение
│   ├── api/                   # API клиент
│   ├── components/            # React компоненты
│   │   ├── ui/               # Базовые UI компоненты
│   │   ├── layout/           # Layout компоненты
│   │   └── pages/            # Page компоненты
│   ├── hooks/                 # Custom React hooks
│   ├── contexts/              # React Context
│   └── types/                 # TypeScript типы
│
├── docs/                       # Документация
│   ├── ARCHITECTURE.md        # Архитектура системы
│   ├── DECISIONS.md           # ADR (Architectural Decisions)
│   └── CONTRIBUTING.md        # Этот файл
│
└── Makefile                    # Команды разработки
```

---

## Git Workflow

### Branch Naming

```
feature/ABC-123-short-description  # Новая функциональность
bugfix/ABC-456-fix-description     # Исправление бага
hotfix/critical-fix                # Срочное исправление в production
refactor/improve-something         # Рефакторинг без изменения функциональности
docs/update-readme                 # Изменения в документации
```

### Commit Messages

Используем [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Типы:**

| Type | Описание |
|------|----------|
| `feat` | Новая функциональность |
| `fix` | Исправление бага |
| `docs` | Документация |
| `style` | Форматирование (не влияет на код) |
| `refactor` | Рефакторинг |
| `test` | Добавление тестов |
| `chore` | Обслуживание (зависимости, CI) |

**Примеры:**

```bash
# Хорошо ✅
feat(tasks): add deadline notification
fix(auth): handle expired refresh token
docs: update API examples in README
refactor(services): extract notification logic

# Плохо ❌
fixed stuff
update
WIP
```

### Pull Request Flow

```
1. Создать branch от main
   git checkout -b feature/ABC-123-new-feature

2. Разработка + коммиты
   git commit -m "feat(tasks): add new feature"

3. Push + создать PR
   git push origin feature/ABC-123-new-feature

4. Code Review (минимум 1 approve)

5. Merge в main (squash)
```

---

## Code Style

### Backend (Python)

**Инструменты:**
- `black` — форматирование кода
- `isort` — сортировка импортов
- `flake8` — линтинг

**Запуск:**
```bash
make lint      # Проверка
make format    # Автоисправление
```

**Правила:**
```python
# ✅ Хорошо
from django.db import models
from apps.core.models import BaseModel


class Task(BaseModel):
    """Модель задачи в проекте."""
    
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=TaskStatus.choices)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self) -> str:
        return self.title


# ❌ Плохо
from django.db import models
from apps.core.models import BaseModel
class Task(BaseModel):
    title = models.CharField(max_length=255)
    status=models.CharField(max_length=20,choices=TaskStatus.choices)
```

### Frontend (TypeScript)

**Инструменты:**
- `prettier` — форматирование
- `eslint` — линтинг
- TypeScript strict mode

**Правила:**
```typescript
// ✅ Хорошо
interface TaskProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export const TaskCard: React.FC<TaskProps> = ({ task, onUpdate }) => {
  const handleClick = useCallback(() => {
    onUpdate(task);
  }, [task, onUpdate]);

  return (
    <Card onClick={handleClick}>
      <CardTitle>{task.title}</CardTitle>
    </Card>
  );
};


// ❌ Плохо
export const TaskCard = (props: any) => {
  return <div onClick={() => props.onUpdate(props.task)}>{props.task.title}</div>
}
```

---

## Тестирование

### Backend Tests

```bash
# Запуск всех тестов
make test

# С покрытием
make test-cov

# Конкретный тест
docker-compose exec web pytest tests/test_tasks.py -v
```

**Пример теста:**
```python
# tests/test_tasks.py
import pytest
from apps.tasks.models import Task
from services.task_service import TaskService


@pytest.mark.django_db
class TestTaskService:
    def test_submit_task_changes_status(self, task_factory, user):
        """Отправка задачи меняет статус на PENDING_REVIEW."""
        task = task_factory(status='draft', assignee=user)
        
        result = TaskService.submit_for_review(task, user)
        
        assert result.status == 'pending_review'
        assert result.submitted_at is not None
    
    def test_submit_completed_task_raises_error(self, task_factory, user):
        """Нельзя отправить уже завершённую задачу."""
        task = task_factory(status='completed')
        
        with pytest.raises(BusinessLogicError):
            TaskService.submit_for_review(task, user)
```

### Frontend Tests (P2)

```bash
npm run test        # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

---

## Pull Request Process

### Checklist

Перед созданием PR убедитесь:

- [ ] Код соответствует code style (`make lint`)
- [ ] Все тесты проходят (`make test`)
- [ ] Добавлены тесты для новой функциональности
- [ ] Документация обновлена (если нужно)
- [ ] Нет секретов в коде
- [ ] PR имеет понятное описание

### PR Template

```markdown
## Описание

Краткое описание изменений.

## Тип изменения

- [ ] Новая функциональность (feature)
- [ ] Исправление бага (bugfix)
- [ ] Рефакторинг
- [ ] Документация

## Как тестировать

1. Запустить `make up`
2. Перейти на ...
3. Проверить ...

## Screenshots (если UI)

## Checklist

- [ ] Lint проходит
- [ ] Тесты проходят
- [ ] Документация обновлена
```

### Code Review

**Для автора:**
- Отвечайте на комментарии
- Не принимайте PR лично
- Объясняйте решения

**Для ревьюера:**
- Будьте конструктивны
- Предлагайте альтернативы
- Используйте "Suggestion" для кода

---

## Архитектурные правила

### 1. Бизнес-логика — только в Services

```python
# ❌ Плохо — логика во view
class TaskViewSet(ModelViewSet):
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        task = self.get_object()
        if task.status != 'draft':
            raise ValidationError("Invalid status")
        task.status = 'pending_review'
        task.submitted_at = timezone.now()
        task.save()
        # Отправить уведомление...
        return Response(...)


# ✅ Хорошо — логика в service
class TaskViewSet(ModelViewSet):
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        task = self.get_object()
        task = TaskService.submit_for_review(task, request.user)
        return Response(TaskSerializer(task).data)
```

### 2. Views — тонкие (thin controllers)

Views отвечают только за:
- Получение данных из request
- Вызов service
- Формирование response

### 3. Сериализаторы — для валидации и трансформации

```python
# ✅ Валидация в serializer
class TaskCreateSerializer(serializers.ModelSerializer):
    def validate_deadline(self, value):
        if value < timezone.now():
            raise ValidationError("Deadline must be in the future")
        return value
```

### 4. Модели — чистые данные

Модели содержат:
- Поля данных
- Простые свойства (`@property`)
- Метод `__str__`
- Meta класс

**НЕ** содержат:
- Бизнес-логику
- Обращения к другим моделям
- Side effects в save()

### 5. Типизация обязательна (Frontend)

```typescript
// ❌ any запрещён
function handleData(data: any) { ... }

// ✅ Явные типы
function handleData(data: Task) { ... }
```

---

## Полезные команды

```bash
# Разработка
make up              # Запустить всё
make down            # Остановить
make logs            # Логи backend
make shell           # Django shell
make frontend-dev    # Frontend dev server

# База данных
make migrate         # Применить миграции
make makemigrations  # Создать миграции
make seed            # Загрузить демо-данные

# Качество кода
make lint            # Проверка стиля
make format          # Автоформатирование
make test            # Запуск тестов
make test-cov        # Тесты с покрытием

# Деплой
make deploy-check    # Проверка перед деплоем
```

---

## Вопросы?

- Документация: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- Архитектурные решения: [docs/DECISIONS.md](./DECISIONS.md)
- GitHub Issues: [Создать issue](https://github.com/Faxriddin1/Uiuxdesignformanagementsystem/issues)
