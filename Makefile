# =============================================================================
# Makefile для Management System
# =============================================================================
# Автоматизация частых команд для локальной разработки и CI/CD
# =============================================================================

.PHONY: help up down logs shell test lint format migrate seed clean build deploy-prod

# Цвета для вывода
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
BLUE   := $(shell tput -Txterm setaf 4)
RESET  := $(shell tput -Txterm sgr0)

# По умолчанию показываем help
.DEFAULT_GOAL := help

# =============================================================================
# Help - Показать доступные команды
# =============================================================================
help: ## Показать это сообщение помощи
	@echo ''
	@echo '${BLUE}Management System - Доступные команды:${RESET}'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${GREEN}%-20s${RESET} %s\n", $$1, $$2}'
	@echo ''

# =============================================================================
# Development - Локальная разработка
# =============================================================================

up: ## 🚀 Запустить всё (backend + db) в Docker
	@echo "${BLUE}🚀 Запуск Management System...${RESET}"
	cd backend && docker compose up -d
	@echo "${GREEN}✅ Backend запущен на http://localhost:8000${RESET}"
	@echo "${GREEN}📖 Swagger UI: http://localhost:8000/api/docs/${RESET}"
	@echo ""
	@echo "${YELLOW}⚠️  Для запуска frontend выполните: npm run dev${RESET}"

up-build: ## 🔨 Пересобрать и запустить (после изменения зависимостей)
	@echo "${BLUE}🔨 Пересборка образов...${RESET}"
	cd backend && docker compose up --build -d
	@echo "${GREEN}✅ Готово!${RESET}"

down: ## 🛑 Остановить все контейнеры
	@echo "${BLUE}🛑 Остановка контейнеров...${RESET}"
	cd backend && docker compose down
	@echo "${GREEN}✅ Остановлено${RESET}"

down-volumes: ## 🗑️  Остановить и удалить volumes (УДАЛИТ БД!)
	@echo "${YELLOW}⚠️  ВНИМАНИЕ: Это удалит все данные PostgreSQL!${RESET}"
	@read -p "Продолжить? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd backend && docker compose down -v; \
		echo "${GREEN}✅ Volumes удалены${RESET}"; \
	else \
		echo "${BLUE}❌ Отменено${RESET}"; \
	fi

logs: ## 📋 Показать логи backend
	cd backend && docker compose logs -f web

logs-db: ## 📋 Показать логи PostgreSQL
	cd backend && docker compose logs -f db

shell: ## 🐚 Открыть shell в контейнере backend
	cd backend && docker compose exec web bash

shell-db: ## 🐚 Подключиться к PostgreSQL через psql
	cd backend && docker compose exec db psql -U postgres -d management_system

ps: ## 📊 Показать статус контейнеров
	cd backend && docker compose ps

# =============================================================================
# Database - Работа с БД
# =============================================================================

migrate: ## 📦 Применить миграции
	@echo "${BLUE}📦 Применение миграций...${RESET}"
	cd backend && docker compose exec web python manage.py migrate
	@echo "${GREEN}✅ Миграции применены${RESET}"

makemigrations: ## 🔧 Создать новые миграции
	@echo "${BLUE}🔧 Создание миграций...${RESET}"
	cd backend && docker compose exec web python manage.py makemigrations
	@echo "${GREEN}✅ Миграции созданы${RESET}"

seed: ## 🌱 Заполнить БД тестовыми данными
	@echo "${BLUE}🌱 Создание seed данных...${RESET}"
	cd backend && docker compose exec web python manage.py seed_data
	@echo "${GREEN}✅ Тестовые данные созданы${RESET}"

dbshell: ## 💾 Django dbshell
	cd backend && docker compose exec web python manage.py dbshell

# =============================================================================
# Testing - Тестирование
# =============================================================================

test: ## 🧪 Запустить все тесты
	@echo "${BLUE}🧪 Запуск тестов...${RESET}"
	cd backend && docker compose exec web pytest
	@echo "${GREEN}✅ Тесты завершены${RESET}"

test-verbose: ## 🧪 Запустить тесты с подробным выводом
	cd backend && docker compose exec web pytest -vv

test-coverage: ## 📊 Запустить тесты с покрытием
	@echo "${BLUE}📊 Запуск тестов с покрытием...${RESET}"
	cd backend && docker compose exec web pytest --cov=apps --cov-report=html --cov-report=term
	@echo "${GREEN}✅ Отчёт сохранён в backend/htmlcov/index.html${RESET}"

test-fast: ## ⚡ Быстрые тесты (без slow)
	cd backend && docker compose exec web pytest -m "not slow"

# =============================================================================
# Code Quality - Качество кода
# =============================================================================

lint: ## 🔍 Проверить код линтерами (flake8)
	@echo "${BLUE}🔍 Линтинг Python кода...${RESET}"
	cd backend && docker compose exec web flake8 apps/ services/ config/
	@echo "${GREEN}✅ Линтинг завершён${RESET}"

format: ## ✨ Отформатировать код (black + isort)
	@echo "${BLUE}✨ Форматирование Python кода...${RESET}"
	cd backend && docker compose exec web black apps/ services/ config/
	cd backend && docker compose exec web isort apps/ services/ config/
	@echo "${GREEN}✅ Код отформатирован${RESET}"

format-check: ## ✅ Проверить форматирование без изменений
	cd backend && docker compose exec web black --check apps/ services/ config/
	cd backend && docker compose exec web isort --check apps/ services/ config/

pre-commit: ## 🎣 Запустить pre-commit hooks вручную
	cd backend && docker compose exec web pre-commit run --all-files

security-check: ## 🔒 Проверка безопасности (bandit)
	@echo "${BLUE}🔒 Проверка безопасности...${RESET}"
	cd backend && docker compose exec web bandit -r apps/ services/ -ll
	@echo "${GREEN}✅ Проверка завершена${RESET}"

check: format-check lint security-check ## ✅ Полная проверка качества кода

# =============================================================================
# Frontend - Фронтенд
# =============================================================================

frontend-install: ## 📦 Установить зависимости frontend
	@echo "${BLUE}📦 Установка npm зависимостей...${RESET}"
	npm install
	@echo "${GREEN}✅ Зависимости установлены${RESET}"

frontend-dev: ## 🚀 Запустить frontend dev server
	@echo "${BLUE}🚀 Запуск frontend на http://localhost:5173${RESET}"
	npm run dev

frontend-build: ## 🔨 Собрать frontend для production
	@echo "${BLUE}🔨 Сборка frontend...${RESET}"
	npm run build
	@echo "${GREEN}✅ Frontend собран в dist/${RESET}"

frontend-lint: ## 🔍 Линтинг frontend (если настроен)
	@echo "${YELLOW}⚠️  ESLint не настроен. Добавьте в package.json${RESET}"

# =============================================================================
# Admin - Django Admin
# =============================================================================

createsuperuser: ## 👤 Создать суперпользователя
	cd backend && docker compose exec web python manage.py createsuperuser

collectstatic: ## 📁 Собрать статические файлы
	cd backend && docker compose exec web python manage.py collectstatic --noinput

# =============================================================================
# Cleanup - Очистка
# =============================================================================

clean: ## 🧹 Очистить кэши и временные файлы
	@echo "${BLUE}🧹 Очистка...${RESET}"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/htmlcov backend/.coverage
	rm -rf dist build
	@echo "${GREEN}✅ Очистка завершена${RESET}"

# =============================================================================
# Production - Продакшн
# =============================================================================

build-prod: ## 🏗️  Собрать production образы
	@echo "${BLUE}🏗️  Сборка production образов...${RESET}"
	cd backend && docker compose -f docker-compose.prod.yml build
	@echo "${GREEN}✅ Production образы собраны${RESET}"

# =============================================================================
# Utilities - Утилиты
# =============================================================================

backup-db: ## 💾 Создать backup PostgreSQL
	@echo "${BLUE}💾 Создание backup БД...${RESET}"
	mkdir -p backups
	cd backend && docker compose exec -T db pg_dump -U postgres management_system > ../backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}✅ Backup создан в backups/${RESET}"

restore-db: ## ♻️  Восстановить БД из backup (укажите файл: make restore-db FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "${YELLOW}⚠️  Укажите файл: make restore-db FILE=backups/backup_20260108.sql${RESET}"; \
		exit 1; \
	fi
	@echo "${BLUE}♻️  Восстановление БД из $(FILE)...${RESET}"
	cd backend && docker compose exec -T db psql -U postgres management_system < ../$(FILE)
	@echo "${GREEN}✅ БД восстановлена${RESET}"

health: ## 🏥 Проверить health endpoints
	@echo "${BLUE}🏥 Проверка health...${RESET}"
	@curl -sf http://localhost:8000/api/v1/health/ | jq '.' || echo "${YELLOW}⚠️  Backend недоступен${RESET}"

# =============================================================================
# All-in-One - Быстрый старт
# =============================================================================

install: ## 📦 Полная установка (backend + frontend)
	@echo "${BLUE}📦 Полная установка Management System...${RESET}"
	@echo ""
	@echo "${GREEN}Шаг 1/4: Создание .env файлов${RESET}"
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "✅ backend/.env создан"; \
	else \
		echo "⚠️  backend/.env уже существует"; \
	fi
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .env создан"; \
	else \
		echo "⚠️  .env уже существует"; \
	fi
	@echo ""
	@echo "${GREEN}Шаг 2/4: Установка frontend зависимостей${RESET}"
	npm install
	@echo ""
	@echo "${GREEN}Шаг 3/4: Запуск backend${RESET}"
	cd backend && docker compose up -d
	@echo ""
	@echo "${GREEN}Шаг 4/4: Ожидание готовности backend...${RESET}"
	@sleep 10
	@echo ""
	@echo "${GREEN}✅ Установка завершена!${RESET}"
	@echo ""
	@echo "${BLUE}═══════════════════════════════════════════════${RESET}"
	@echo "${BLUE}🎉 Management System готов к работе!${RESET}"
	@echo "${BLUE}═══════════════════════════════════════════════${RESET}"
	@echo ""
	@echo "${GREEN}Backend:${RESET}  http://localhost:8000"
	@echo "${GREEN}API Docs:${RESET} http://localhost:8000/api/docs/"
	@echo "${GREEN}Admin:${RESET}    http://localhost:8000/admin/"
	@echo ""
	@echo "${YELLOW}Для запуска frontend:${RESET} npm run dev"
	@echo "${YELLOW}Frontend:${RESET} http://localhost:5173"
	@echo ""
	@echo "${BLUE}Демо пользователи (пароль для всех: user123):${RESET}"
	@echo "  - admin@example.com (Management Head)"
	@echo "  - employee1@example.com (Employee)"
	@echo ""

start: up frontend-dev ## 🚀 Запустить всё (backend + frontend)

restart: down up ## 🔄 Перезапустить backend

status: ps health ## 📊 Показать статус системы
