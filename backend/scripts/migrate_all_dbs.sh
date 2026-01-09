#!/bin/bash
# Скрипт для применения миграций ко всем базам данных

echo "==================================================================="
echo "Применение миграций к множественным базам данных"
echo "==================================================================="

# 1. Применяем системные миграции Django к users_db
echo ""
echo "1. Применяем системные миграции к users_db..."
python manage.py migrate contenttypes --database=users_db
python manage.py migrate auth --database=users_db
python manage.py migrate sessions --database=users_db
python manage.py migrate admin --database=users_db

# 2. Применяем миграции accounts к users_db
echo ""
echo "2. Применяем миграции accounts к users_db..."
python manage.py migrate accounts --database=users_db

# 3. Применяем миграции notifications к users_db
echo ""
echo "3. Применяем миграции notifications к users_db..."
python manage.py migrate notifications --database=users_db

# 4. Применяем миграции tasks к tasks_db
echo ""
echo "4. Применяем миграции tasks к tasks_db..."
python manage.py migrate tasks --database=tasks_db

# 5. Применяем миграции projects к projects_db
echo ""
echo "5. Применяем миграции projects к projects_db..."
python manage.py migrate projects --database=projects_db

# 6. Применяем миграции research к projects_db
echo ""
echo "6. Применяем миграции research к projects_db..."
python manage.py migrate research --database=projects_db

# 7. Применяем миграции external_packages к packages_db
echo ""
echo "7. Применяем миграции external_packages к packages_db..."
python manage.py migrate external_packages --database=packages_db

# 8. Применяем миграции audit_logs к logs_db
echo ""
echo "8. Применяем миграции audit_logs к logs_db..."
python manage.py migrate audit_logs --database=logs_db

echo ""
echo "==================================================================="
echo "Миграции успешно применены ко всем базам данных!"
echo "===================================================================  "
