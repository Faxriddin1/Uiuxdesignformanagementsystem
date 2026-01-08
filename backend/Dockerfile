# =============================================================================
# Dockerfile для Management System Backend
# =============================================================================
# Multi-stage build для оптимизации размера образа
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image с Python
# -----------------------------------------------------------------------------
FROM python:3.12-slim as base

# Переменные окружения Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Рабочая директория
WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    # PostgreSQL клиент
    libpq-dev \
    # Для компиляции Python пакетов
    gcc \
    python3-dev \
    # Для healthcheck
    curl \
    # Для ожидания PostgreSQL в entrypoint
    netcat-openbsd \
    # Очистка кэша apt
    && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base as dependencies

# Копируем файлы зависимостей
COPY requirements/ requirements/

# Устанавливаем зависимости
ARG ENVIRONMENT=production
RUN pip install --upgrade pip && \
    pip install -r requirements/${ENVIRONMENT}.txt

# -----------------------------------------------------------------------------
# Stage 3: Application
# -----------------------------------------------------------------------------
FROM dependencies as application

# Создаем непривилегированного пользователя для безопасности
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Копируем код приложения
COPY --chown=appuser:appgroup . .

# Создаем директории для статики и медиа
RUN mkdir -p /app/staticfiles /app/media && \
    chown -R appuser:appgroup /app/staticfiles /app/media

# Даём права на скрипт запуска
RUN chmod +x /app/scripts/entrypoint.sh

# Переключаемся на непривилегированного пользователя
USER appuser

# Порт приложения
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/ || exit 1

# Entrypoint
ENTRYPOINT ["/app/scripts/entrypoint.sh"]

# Команда по умолчанию
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2"]
