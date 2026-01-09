-- =============================================================================
-- Инициализация PostgreSQL схем для разделения данных
-- =============================================================================
-- Создается 6 схем для логического разделения модулей системы:
-- - users_schema: пользователи, аутентификация, разрешения
-- - tasks_schema: задачи
-- - projects_schema: проекты и исследования
-- - packages_schema: внешние пакеты
-- - logs_schema: логи и аудит
-- - files_schema: файлы и вложения
-- =============================================================================

-- Создание схем
CREATE SCHEMA IF NOT EXISTS users_schema;
CREATE SCHEMA IF NOT EXISTS tasks_schema;
CREATE SCHEMA IF NOT EXISTS projects_schema;
CREATE SCHEMA IF NOT EXISTS packages_schema;
CREATE SCHEMA IF NOT EXISTS logs_schema;
CREATE SCHEMA IF NOT EXISTS files_schema;

-- Предоставление прав пользователю postgres
GRANT ALL PRIVILEGES ON SCHEMA users_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA tasks_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA projects_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA packages_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA logs_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA files_schema TO postgres;

-- Установка search_path по умолчанию (public + все схемы)
ALTER DATABASE management_system SET search_path TO public, users_schema, tasks_schema, projects_schema, packages_schema, logs_schema, files_schema;

-- Вывод информации о созданных схемах
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata
WHERE schema_name IN ('users_schema', 'tasks_schema', 'projects_schema', 'packages_schema', 'logs_schema', 'files_schema')
ORDER BY schema_name;
