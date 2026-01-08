# =============================================================================
# Makefile для Management System
# =============================================================================
# Унифицированные команды для разработки и управления проектом
# =============================================================================

.PHONY: help up down build restart test lint lint-fix migrate shell logs clean seed ps status

# По умолчанию показываем справку
.DEFAULT_GOAL := help

# -----------------------------------------------------------------------------
# Цвета для вывода
# -----------------------------------------------------------------------------
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# -----------------------------------------------------------------------------
# Основные команды
# -----------------------------------------------------------------------------

help: ## Показать справку по командам
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  Management System - Доступные команды$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo "$(BLUE)═══════════════════════════════════════════════════════════════$(NC)"

up: ## Запустить все сервисы (frontend + backend + db)
	@echo "$(GREEN)🚀 Запуск всех сервисов...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✨ Сервисы запущены!$(NC)"
	@echo "$(BLUE)Frontend: http://localhost:5173$(NC)"
	@echo "$(BLUE)Backend API: http://localhost:8000/api/v1/$(NC)"
	@echo "$(BLUE)Swagger: http://localhost:8000/api/docs/$(NC)"

down: ## Остановить все сервисы
	@echo "$(YELLOW)⏹️  Остановка сервисов...$(NC)"
	docker compose down
	@echo "$(GREEN)✅ Сервисы остановлены$(NC)"

build: ## Собрать все сервисы
	@echo "$(BLUE)🔨 Сборка сервисов...$(NC)"
	docker compose build
	@echo "$(GREEN)✅ Сборка завершена$(NC)"

rebuild: ## Пересобрать и перезапустить все сервисы
	@echo "$(BLUE)🔄 Пересборка и перезапуск...$(NC)"
	docker compose down
	docker compose build --no-cache
	docker compose up -d
	@echo "$(GREEN)✅ Готово!$(NC)"

restart: ## Перезапустить все сервисы
	@echo "$(YELLOW)🔄 Перезапуск сервисов...$(NC)"
	docker compose restart
	@echo "$(GREEN)✅ Сервисы перезапущены$(NC)"

# -----------------------------------------------------------------------------
# Тестирование и проверка кода
# -----------------------------------------------------------------------------

test: ## Запустить тесты backend
	@echo "$(BLUE)🧪 Запуск тестов...$(NC)"
	docker compose exec backend pytest -v
	@echo "$(GREEN)✅ Тесты завершены$(NC)"

test-cov: ## Запустить тесты с покрытием кода
	@echo "$(BLUE)🧪 Запуск тестов с покрытием...$(NC)"
	docker compose exec backend pytest --cov=apps --cov-report=term-missing
	@echo "$(GREEN)✅ Тесты завершены$(NC)"

lint: ## Проверить код (black, isort, flake8)
	@echo "$(BLUE)🔍 Проверка кода...$(NC)"
	@echo "$(YELLOW)→ black --check$(NC)"
	docker compose exec backend black --check .
	@echo "$(YELLOW)→ isort --check$(NC)"
	docker compose exec backend isort --check .
	@echo "$(YELLOW)→ flake8$(NC)"
	docker compose exec backend flake8 .
	@echo "$(GREEN)✅ Проверка завершена$(NC)"

lint-fix: ## Автоматически исправить код (black, isort)
	@echo "$(BLUE)🔧 Исправление кода...$(NC)"
	@echo "$(YELLOW)→ black$(NC)"
	docker compose exec backend black .
	@echo "$(YELLOW)→ isort$(NC)"
	docker compose exec backend isort .
	@echo "$(GREEN)✅ Код исправлен$(NC)"

# -----------------------------------------------------------------------------
# База данных
# -----------------------------------------------------------------------------

migrate: ## Применить миграции БД
	@echo "$(BLUE)📦 Применение миграций...$(NC)"
	docker compose exec backend python manage.py migrate
	@echo "$(GREEN)✅ Миграции применены$(NC)"

makemigrations: ## Создать новые миграции
	@echo "$(BLUE)📝 Создание миграций...$(NC)"
	docker compose exec backend python manage.py makemigrations
	@echo "$(GREEN)✅ Миграции созданы$(NC)"

seed: ## Загрузить тестовые данные
	@echo "$(BLUE)🌱 Загрузка тестовых данных...$(NC)"
	docker compose exec backend python manage.py seed_data
	@echo "$(GREEN)✅ Данные загружены$(NC)"

# -----------------------------------------------------------------------------
# Django команды
# -----------------------------------------------------------------------------

shell: ## Открыть Django shell
	@echo "$(BLUE)🐚 Открытие Django shell...$(NC)"
	docker compose exec backend python manage.py shell

dbshell: ## Открыть PostgreSQL shell
	@echo "$(BLUE)🗄️  Открытие PostgreSQL shell...$(NC)"
	docker compose exec db psql -U postgres -d management_system

createsuperuser: ## Создать суперпользователя Django
	@echo "$(BLUE)👤 Создание суперпользователя...$(NC)"
	docker compose exec backend python manage.py createsuperuser

# -----------------------------------------------------------------------------
# Логи и мониторинг
# -----------------------------------------------------------------------------

logs: ## Показать логи всех сервисов
	docker compose logs -f

logs-backend: ## Показать логи backend
	docker compose logs -f backend

logs-frontend: ## Показать логи frontend
	docker compose logs -f frontend

logs-db: ## Показать логи database
	docker compose logs -f db

ps: ## Показать статус контейнеров
	docker compose ps

status: ps ## Алиас для ps

# -----------------------------------------------------------------------------
# Очистка
# -----------------------------------------------------------------------------

clean: ## Остановить сервисы и удалить volumes
	@echo "$(RED)🧹 Очистка volumes...$(NC)"
	@echo "$(YELLOW)⚠️  Это удалит все данные в БД!$(NC)"
	@read -p "Продолжить? [y/N]: " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose down -v; \
		echo "$(GREEN)✅ Volumes удалены$(NC)"; \
	else \
		echo "$(YELLOW)Отменено$(NC)"; \
	fi

clean-all: ## Удалить все (volumes, images, orphans)
	@echo "$(RED)🧹 Полная очистка...$(NC)"
	@echo "$(YELLOW)⚠️  Это удалит все данные, образы и контейнеры!$(NC)"
	@read -p "Продолжить? [y/N]: " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose down -v --rmi all --remove-orphans; \
		echo "$(GREEN)✅ Полная очистка завершена$(NC)"; \
	else \
		echo "$(YELLOW)Отменено$(NC)"; \
	fi

# -----------------------------------------------------------------------------
# Frontend команды
# -----------------------------------------------------------------------------

frontend-install: ## Установить зависимости frontend
	@echo "$(BLUE)📦 Установка frontend зависимостей...$(NC)"
	npm ci
	@echo "$(GREEN)✅ Зависимости установлены$(NC)"

frontend-dev: ## Запустить frontend dev server локально (без Docker)
	@echo "$(BLUE)🚀 Запуск frontend dev server...$(NC)"
	npm run dev

frontend-build: ## Собрать frontend для production
	@echo "$(BLUE)🔨 Сборка frontend...$(NC)"
	npm run build
	@echo "$(GREEN)✅ Frontend собран$(NC)"

# -----------------------------------------------------------------------------
# Backend команды
# -----------------------------------------------------------------------------

backend-install: ## Установить зависимости backend
	@echo "$(BLUE)📦 Установка backend зависимостей...$(NC)"
	docker compose exec backend pip install -r requirements/development.txt
	@echo "$(GREEN)✅ Зависимости установлены$(NC)"

# -----------------------------------------------------------------------------
# Разработка
# -----------------------------------------------------------------------------

dev: up ## Запустить в режиме разработки (алиас для up)

prod-up: ## Запустить в production режиме
	@echo "$(GREEN)🚀 Запуск в production режиме...$(NC)"
	docker compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✨ Production сервисы запущены!$(NC)"
