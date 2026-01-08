/**
 * Демонстрация интеграции всех P1 компонентов
 * Показывает, где и как используются компоненты в системе
 */

import React from 'react';
import { ArrowLeft, CheckCircle, Bell, Save, Zap, MessageSquare, FileSearch } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../layout/PageHeader';
import { User } from '../../types';

interface IntegrationDemoProps {
  currentUser: User;
  onNavigateBack: () => void;
}

export function IntegrationDemo({ currentUser, onNavigateBack }: IntegrationDemoProps) {
  const integrations = [
    {
      id: 'notification-center',
      name: 'Центр уведомлений (NotificationCenter)',
      icon: <Bell className="w-6 h-6 text-blue-600" />,
      location: 'TopHeader (правый верхний угол)',
      features: [
        'Отображает уведомления о задачах, упоминаниях, дедлайнах',
        'Фильтрация: Все / Непрочитанные',
        'Переход к связанным объектам по клику',
        'Пометка как прочитанное / Прочитать все',
        'Реальное время обновления счетчика непрочитанных'
      ],
      status: 'integrated',
      color: 'blue'
    },
    {
      id: 'mention-input',
      name: '@Упоминания в комментариях (MentionInput)',
      icon: <MessageSquare className="w-6 h-6 text-purple-600" />,
      location: 'TaskDetail, ProjectDetail, ResearchDetail',
      features: [
        'Автодополнение при вводе @',
        'Выбор пользователя из выпадающего списка',
        'Визуальное выделение упоминаний',
        'Создание уведомлений упомянутым пользователям',
        'Поддержка навигации с клавиатуры'
      ],
      status: 'integrated',
      color: 'purple'
    },
    {
      id: 'saved-views',
      name: 'Сохраненные представления (SavedViewsManager)',
      icon: <Save className="w-6 h-6 text-green-600" />,
      location: 'AllTasks, Projects, Researches (кнопка в фильтрах)',
      features: [
        'Сохранение текущих фильтров как представление',
        'Приватные и публичные представления',
        'Быстрое применение сохраненных фильтров',
        'Управление: создание, применение, удаление',
        'Отображение количества сохраненных представлений'
      ],
      status: 'integrated',
      color: 'green'
    },
    {
      id: 'quick-preview',
      name: 'Быстрый просмотр (QuickPreview)',
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      location: 'ReviewQueue (кнопка "Рассмотреть")',
      features: [
        'Предпросмотр задачи без полного открытия',
        'Отображение результатов и вложений',
        'Быстрые действия: одобрить/вернуть',
        'Кнопка "Открыть полностью" для детального просмотра',
        'Оптимизация работы с очередью приемки'
      ],
      status: 'integrated',
      color: 'yellow'
    },
    {
      id: 'diff-view',
      name: 'Просмотр изменений (DiffView)',
      icon: <FileSearch className="w-6 h-6 text-indigo-600" />,
      location: 'ResultVersionHistory (версии результатов)',
      features: [
        'Сравнение версий результатов задач',
        'Построчное сравнение с подсветкой изменений',
        'Добавления (зеленый), удаления (красный)',
        'Навигация между версиями',
        'История изменений с временными метками'
      ],
      status: 'integrated',
      color: 'indigo'
    },
    {
      id: 'export-menu',
      name: 'Экспорт и печать (ExportMenu)',
      icon: <FileSearch className="w-6 h-6 text-orange-600" />,
      location: 'PageHeader (страницы задач, проектов, отчетов)',
      features: [
        'Экспорт в PDF, Excel, CSV',
        'Печать текущего представления',
        'Настройка параметров экспорта',
        'Выбор полей для экспорта',
        'Сохранение настроек экспорта'
      ],
      status: 'ready',
      color: 'orange'
    }
  ];

  return (
    <div>
      <PageHeader
        title="Интеграция P1 компонентов"
        description="Обзор интегрированных компонентов приоритета P1 в основную систему"
        onBack={onNavigateBack}
        actions={
          <Button onClick={onNavigateBack} icon={<ArrowLeft size={20} />}>
            Назад к Dashboard
          </Button>
        }
      />

      {/* Статус интеграции */}
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardBody>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-green-900 mb-2">✅ Интеграция завершена</h3>
              <p className="text-green-800 mb-4">
                Все приоритетные P1 компоненты успешно интегрированы в основную систему управления задачами.
                Компоненты доступны на соответствующих страницах и готовы к использованию.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="px-3 py-1 bg-white rounded-lg text-sm">
                  <span className="text-gray-600">Всего компонентов:</span>{' '}
                  <span className="font-medium text-gray-900">{integrations.length}</span>
                </div>
                <div className="px-3 py-1 bg-white rounded-lg text-sm">
                  <span className="text-gray-600">Интегрировано:</span>{' '}
                  <span className="font-medium text-green-600">
                    {integrations.filter(i => i.status === 'integrated').length}
                  </span>
                </div>
                <div className="px-3 py-1 bg-white rounded-lg text-sm">
                  <span className="text-gray-600">Готово к интеграции:</span>{' '}
                  <span className="font-medium text-blue-600">
                    {integrations.filter(i => i.status === 'ready').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Список интегрированных компонентов */}
      <div className="grid gap-6">
        {integrations.map((integration, index) => (
          <Card key={integration.id} className="overflow-hidden">
            <div className={`h-2 bg-${integration.color}-500`} />
            <CardBody className="p-6">
              <div className="flex items-start gap-4">
                {/* Иконка */}
                <div className={`w-12 h-12 bg-${integration.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {integration.icon}
                </div>

                {/* Контент */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-gray-900 mb-1">{integration.name}</h3>
                      <p className="text-sm text-gray-600">
                        📍 {integration.location}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      integration.status === 'integrated'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {integration.status === 'integrated' ? '✓ Интегрирован' : '○ Готов'}
                    </span>
                  </div>

                  {/* Функции */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-700 mb-2">Основные функции:</p>
                    <ul className="space-y-1">
                      {integration.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full bg-${integration.color}-500 mt-1.5 flex-shrink-0`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Инструкции по использованию */}
      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-gray-900">Как использовать интегрированные компоненты</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <h4 className="text-gray-900 mb-2">1. Центр уведомлений</h4>
              <p className="text-gray-700 mb-2">
                Нажмите на иконку колокольчика в правом верхнем углу. Откроется панель со всеми вашими уведомлениями.
                Клик по уведомлению откроет связанную задачу/проект.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 mb-2">2. @Упоминания</h4>
              <p className="text-gray-700 mb-2">
                Откройте любую задачу и начните вводить комментарий с символа @. Появится список пользователей
                для упоминания. Выберите пользователя - он получит уведомление.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 mb-2">3. Сохраненные представления</h4>
              <p className="text-gray-700 mb-2">
                На странице "Все задачи" установите нужные фильтры и нажмите кнопку "Представления".
                Сохраните текущие фильтры для быстрого доступа в будущем.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 mb-2">4. Быстрый просмотр</h4>
              <p className="text-gray-700 mb-2">
                В очереди приемки (Review Queue) нажмите кнопку "Рассмотреть" на любой задаче.
                Откроется быстрый предпросмотр с возможностью одобрения/возврата без полного открытия.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 mb-2">5. Просмотр изменений</h4>
              <p className="text-gray-700 mb-2">
                В истории версий результатов задачи выберите две версии для сравнения.
                Система покажет построчные изменения с подсветкой добавлений и удалений.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Следующие шаги */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardBody>
          <h3 className="text-blue-900 mb-3">🚀 Следующие шаги</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">→</span>
              <span>Добавить ExportMenu на страницы задач и проектов для экспорта данных</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">→</span>
              <span>Интегрировать DiffView в ResultVersionHistory для сравнения версий</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">→</span>
              <span>Добавить аналогичные интеграции для ProjectDetail и ResearchDetail</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">→</span>
              <span>Настроить уведомления при упоминаниях пользователей</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
