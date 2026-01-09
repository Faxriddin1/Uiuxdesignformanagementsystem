# =============================================================================
# Makefile - Management System
# =============================================================================
# Единая точка входа для всех операций разработки
# Использование: make <команда>
# =============================================================================

.PHONY: help up down build logs shell test lint migrate seed clean frontend backend all

# Цвета для вывода
YELLOW := \033[1;33m
GREEN := \033[1;32m
RED := \033[1;31m
NC := \033[0m # No Color

# Переменные
DOCKER_COMPOSE := docker compose
DOCKER_COMPOSE_FILE := docker-compose.yml
BACKEND_COMPOSE := backend/docker-compose.yml

# =============================================================================
# Помощь
# =============================================================================

help: ## Показать справку
	@echo ""
	@echo "$(GREEN)Management System - Команды разработки$(NC)"
	@echo ""
	@echo "$(YELLOW)Быстрый старт:$(NC)"
	@echo "  make up          - Запустить всё (backend + frontend)"
	@echo "  make down        - Остановить всё"
	@echo ""
	@echo "$(YELLOW)Разработка:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# Основные команды
# =============================================================================

up: ## 🚀 Запустить все сервисы (backend + DB)
	@echo "$(GREEN)Запуск всех сервисов...$(NC)"
	cd backend && $(DOCKER_COMPOSE) up --build -d
	@echo "$(GREEN)✅ Backend запущен на http://localhost:8000$(NC)"
	@echo "$(GREEN)📚 Swagger UI: http://localhost:8000/api/docs/$(NC)"

up-logs: ## 🚀 Запустить с логами в консоль
	cd backend && $(DOCKER_COMPOSE) up --build

down: ## 🛑 Остановить все сервисы
	@echo "$(YELLOW)Останавливаем сервисы...$(NC)"
	cd backend && $(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Сервисы остановлены$(NC)"

down-v: ## 🗑️ Остановить и удалить volumes (ВНИМАНИЕ: удалит данные!)
	@echo "$(RED)Останавливаем и удаляем volumes...$(NC)"
	cd backend && $(DOCKER_COMPOSE) down -v
	@echo "$(GREEN)✅ Сервисы и данные удалены$(NC)"

restart: down up ## 🔄 Перезапустить все сервисы

build: ## 🔨 Пересобрать образы без кэша
	cd backend && $(DOCKER_COMPOSE) build --no-cache

logs: ## 📋 Показать логи всех сервисов
	cd backend && $(DOCKER_COMPOSE) logs -f

logs-web: ## 📋 Показать логи только web сервиса
	cd backend && $(DOCKER_COMPOSE) logs -f web

logs-db: ## 📋 Показать логи только базы данных
	cd backend && $(DOCKER_COMPOSE) logs -f db

# =============================================================================
# Разработка Backend
# =============================================================================

shell: ## 🐚 Открыть shell в контейнере web
	cd backend && $(DOCKER_COMPOSE) exec web bash

shell-db: ## 🐚 Открыть psql в контейнере базы данных
	cd backend && $(DOCKER_COMPOSE) exec db psql -U postgres -d management_system

migrate: ## 📦 Применить миграции
	cd backend && $(DOCKER_COMPOSE) exec web python manage.py migrate

makemigrations: ## 📦 Создать миграции
	cd backend && $(DOCKER_COMPOSE) exec web python manage.py makemigrations

seed: ## 🌱 Загрузить тестовые данные
	cd backend && $(DOCKER_COMPOSE) exec web python manage.py seed_data

createsuperuser: ## 👤 Создать суперпользователя
	cd backend && $(DOCKER_COMPOSE) exec web python manage.py createsuperuser

collectstatic: ## 📁 Собрать статические файлы
	cd backend && $(DOCKER_COMPOSE) exec web python manage.py collectstatic --noinput

# =============================================================================
# Тестирование
# =============================================================================

test: ## 🧪 Запустить все тесты backend
	cd backend && $(DOCKER_COMPOSE) exec web pytest -v

test-cov: ## 🧪 Запустить тесты с отчётом покрытия
	cd backend && $(DOCKER_COMPOSE) exec web pytest --cov=apps --cov=services --cov-report=term-missing --cov-report=html

test-fast: ## 🧪 Быстрые тесты (без медленных)
	cd backend && $(DOCKER_COMPOSE) exec web pytest -v -m "not slow"

test-watch: ## 🧪 Тесты в watch режиме
	cd backend && $(DOCKER_COMPOSE) exec web pytest-watch

test-e2e: ## 🎭 E2E тесты (Playwright)
	npx playwright test

test-e2e-ui: ## 🎭 E2E тесты в UI режиме
	npx playwright test --ui

test-e2e-headed: ## 🎭 E2E тесты с браузером
	npx playwright test --headed

test-all: test test-e2e ## 🧪 Все тесты (backend + E2E)

# =============================================================================
# Качество кода
# =============================================================================

lint: ## 🔍 Проверить код (flake8 + isort + black --check)
	cd backend && $(DOCKER_COMPOSE) exec web flake8 apps services
	cd backend && $(DOCKER_COMPOSE) exec web isort --check-only apps services
	cd backend && $(DOCKER_COMPOSE) exec web black --check apps services

format: ## ✨ Отформатировать код (isort + black)
	cd backend && $(DOCKER_COMPOSE) exec web isort apps services
	cd backend && $(DOCKER_COMPOSE) exec web black apps services

# =============================================================================
# Frontend
# =============================================================================

frontend-install: ## 📦 Установить зависимости frontend
	npm install

frontend-dev: ## 🚀 Запустить frontend dev сервер
	npm run dev

frontend-build: ## 🔨 Собрать frontend для production
	npm run build

frontend-lint: ## 🔍 Проверить frontend код
	npm run lint 2>/dev/null || echo "Lint script not configured"

playwright-install: ## 🎭 Установить браузеры Playwright
	npx playwright install

# =============================================================================
# Celery (Background Tasks)
# =============================================================================

celery-worker: ## ⚙️ Запустить Celery worker
	cd backend && $(DOCKER_COMPOSE) exec celery celery -A config worker -l INFO

celery-beat: ## ⏰ Запустить Celery beat
	cd backend && $(DOCKER_COMPOSE) exec celery-beat celery -A config beat -l INFO

celery-logs: ## 📋 Логи Celery worker
	cd backend && $(DOCKER_COMPOSE) logs -f celery

# =============================================================================
# Redis
# =============================================================================

redis-cli: ## 🔴 Открыть Redis CLI
	cd backend && $(DOCKER_COMPOSE) exec redis redis-cli

redis-flush: ## 🗑️ Очистить Redis кэш
	cd backend && $(DOCKER_COMPOSE) exec redis redis-cli FLUSHALL

# =============================================================================
# Полный цикл разработки
# =============================================================================

dev: up frontend-dev ## 🚀 Запустить backend + frontend для разработки

setup: ## 🔧 Первоначальная настройка проекта
	@echo "$(GREEN)Настройка проекта...$(NC)"
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env && echo "$(GREEN)✅ Создан backend/.env$(NC)"; fi
	@if [ ! -f .env ]; then cp .env.example .env 2>/dev/null && echo "$(GREEN)✅ Создан .env$(NC)" || true; fi
	npm install
	@echo "$(GREEN)✅ Зависимости frontend установлены$(NC)"
	@echo ""
	@echo "$(YELLOW)Следующие шаги:$(NC)"
	@echo "  1. Отредактируйте backend/.env при необходимости"
	@echo "  2. Запустите: make up"
	@echo "  3. В другом терминале: make frontend-dev"

# =============================================================================
# Очистка
# =============================================================================

clean: ## 🧹 Очистить временные файлы
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)✅ Очистка завершена$(NC)"

clean-all: clean down-v ## 🧹 Полная очистка (включая Docker volumes)
	@echo "$(GREEN)✅ Полная очистка завершена$(NC)"

# =============================================================================
# Статус и диагностика
# =============================================================================

status: ## 📊 Показать статус сервисов
	cd backend && $(DOCKER_COMPOSE) ps

health: ## ❤️ Проверить здоровье сервисов
	@echo "Проверка API..."
	@curl -s http://localhost:8000/api/v1/health/ | python -m json.tool 2>/dev/null || echo "$(RED)API недоступен$(NC)"

# =============================================================================
# Деплой
# =============================================================================

deploy-check: ## 🔍 Проверка готовности к деплою
	@echo "$(YELLOW)Проверка перед деплоем...$(NC)"
	@echo "1. Проверка .env.example..."
	@test -f backend/.env.example && echo "$(GREEN)✅ backend/.env.example существует$(NC)" || echo "$(RED)❌ Нет backend/.env.example$(NC)"
	@echo "2. Проверка тестов..."
	@cd backend && $(DOCKER_COMPOSE) exec web pytest --tb=no -q 2>/dev/null && echo "$(GREEN)✅ Тесты проходят$(NC)" || echo "$(RED)❌ Тесты не проходят$(NC)"
	@echo "3. Проверка линтеров..."
	@make lint 2>/dev/null && echo "$(GREEN)✅ Линтеры проходят$(NC)" || echo "$(YELLOW)⚠️ Есть замечания линтеров$(NC)"
