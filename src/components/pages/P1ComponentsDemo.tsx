// Демонстрационная страница для тестирования P1 компонентов

import { ArrowLeft, Bell, Save } from 'lucide-react';
import { useState } from 'react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { NotificationCenter } from '../NotificationCenter';
import { MentionInput } from '../MentionInput';
import { SavedViewsManager } from '../SavedViewsManager';
import { QuickPreview } from '../QuickPreview';
import { DiffView, SimpleDiffView } from '../DiffView';
import { ExportMenu } from '../ExportMenu';
import { notifications, savedViews, fieldChanges, tasks } from '../../data/mockData';
import { User, Notification, SavedView, FieldChange } from '../../types';

interface P1ComponentsDemoProps {
  currentUser: User;
  onNavigateBack: () => void;
}

export function P1ComponentsDemo({ currentUser, onNavigateBack }: P1ComponentsDemoProps) {
  // Состояния для демо
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const [notificationList, setNotificationList] = useState<Notification[]>(notifications);
  const [savedViewsList, setSavedViewsList] = useState<SavedView[]>(savedViews);
  const [mentionText, setMentionText] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);

  // Задача для предпросмотра
  const previewTask = tasks.find(t => t.id === 't2');

  /**
   * Отметить уведомление как прочитанное
   */
  const handleMarkAsRead = (notificationId: string) => {
    setNotificationList(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  /**
   * Отметить все как прочитанные
   */
  const handleMarkAllAsRead = () => {
    setNotificationList(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  /**
   * Сохранить новое представление
   */
  const handleSaveView = (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newView: SavedView = {
      ...view,
      id: `sv${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSavedViewsList(prev => [...prev, newView]);
    alert(`Представление "${newView.name}" сохранено!`);
  };

  /**
   * Загрузить представление
   */
  const handleLoadView = (view: SavedView) => {
    alert(`Загружено представление: ${view.name}\nФильтры применены!`);
  };

  /**
   * Удалить представление
   */
  const handleDeleteView = (viewId: string) => {
    const view = savedViewsList.find(v => v.id === viewId);
    if (confirm(`Удалить представление "${view?.name}"?`)) {
      setSavedViewsList(prev => prev.filter(v => v.id !== viewId));
    }
  };

  return (
    <div className="p-8">
      {/* Заголовок */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onNavigateBack}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl text-gray-900">Тестирование P1 компонентов</h1>
          <p className="text-sm text-gray-500 mt-1">Демонстрация важных компонентов из ТЗ vFinal</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. Центр уведомлений */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">1. Центр уведомлений (Notification Center)</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-gray-600">
              Показывает уведомления различных типов: назначение задач, возврат на доработку, дедлайны, упоминания в комментариях и др.
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="w-4 h-4 mr-1" />
                {showNotifications ? 'Закрыть' : 'Открыть'} центр уведомлений
              </Button>
              <span className="text-sm text-gray-500">
                ({notificationList.filter(n => !n.isRead).length} непрочитанных)
              </span>
            </div>
          </CardBody>
        </Card>

        {/* 2. @mentions в комментариях */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">2. @mentions в комментариях (с автокомплитом)</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-gray-600">
              Введите @ для упоминания пользователя. Автокомплит покажет доступных пользователей.
            </p>
            <MentionInput
              value={mentionText}
              onChange={(value, mentionIds) => {
                setMentionText(value);
                setMentions(mentionIds);
              }}
              placeholder="Введите комментарий. Используйте @ для упоминания..."
            />
            {mentions.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Упомянутые пользователи: {mentions.join(', ')}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 3. Сохраненные представления */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">3. Сохраненные представления (Saved Views)</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600 mb-4">
              Сохранение часто используемых фильтров для быстрого доступа. Можно делиться представлениями с коллегами.
            </p>
            <SavedViewsManager
              currentUser={currentUser}
              savedViews={savedViewsList}
              currentFilters={{
                status: ['in_progress', 'under_division_review'],
                priority: ['high', 'urgent'],
              }}
              onSaveView={handleSaveView}
              onLoadView={handleLoadView}
              onDeleteView={handleDeleteView}
            />
          </CardBody>
        </Card>

        {/* 4. Быстрый предпросмотр */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">4. Быстрый предпросмотр (Quick Preview)</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-gray-600">
              Позволяет просмотреть задачу в Review Queue без полного открытия. С кнопками одобрения/возврата.
            </p>
            <Button onClick={() => setShowQuickPreview(true)}>
              <Bell className="w-4 h-4 mr-1" />
              Открыть предпросмотр задачи
            </Button>
          </CardBody>
        </Card>

        {/* 5. Diff-view (показ изменений) */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">5. Diff-view (показ изменений До/После)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-gray-600">
              Визуализация изменений полей задачи с подсветкой старых и новых значений.
            </p>
            
            <div>
              <h3 className="text-sm text-gray-700 mb-3">Полная версия (с подсветкой):</h3>
              <DiffView changes={fieldChanges} />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm text-gray-700 mb-3">Упрощенная версия (текстом):</h3>
              <SimpleDiffView changes={fieldChanges} />
            </div>
          </CardBody>
        </Card>

        {/* 6. Экспорт и печать */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">6. Экспорт и печать</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-gray-600">
              Экспорт задач в различных форматах (CSV, Excel, JSON) и печать.
            </p>
            <div className="flex items-center gap-3">
              <ExportMenu
                data={tasks}
                type="tasks"
                currentUser={currentUser}
              />
              <span className="text-sm text-gray-500">
                ({tasks.length} задач для экспорта)
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Итоговая информация */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardBody>
            <h3 className="text-lg text-gray-900 mb-2">✅ Все P1 компоненты реализованы!</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Центр уведомлений с 8 типами уведомлений</li>
              <li>• @mentions с автокомплитом пользователей</li>
              <li>• Сохраненные представления (фильтры) с возможностью sharing</li>
              <li>• Быстрый предпросмотр задач в Review Queue</li>
              <li>• Diff-view для показа изменений (полный и упрощенный)</li>
              <li>• Экспорт в CSV, Excel, JSON и печать</li>
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Модальные окна */}
      {showNotifications && (
        <NotificationCenter
          notifications={notificationList}
          currentUser={currentUser}
          onNotificationClick={(notification) => {
            console.log('Клик по уведомлению:', notification);
            handleMarkAsRead(notification.id);
            setShowNotifications(false);
          }}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showQuickPreview && previewTask && (
        <QuickPreview
          task={previewTask}
          currentUser={currentUser}
          onClose={() => setShowQuickPreview(false)}
          onFullOpen={() => {
            alert('Открытие полной карточки задачи...');
            setShowQuickPreview(false);
          }}
          onApprove={() => {
            alert('Задача одобрена!');
            setShowQuickPreview(false);
          }}
          onReject={() => {
            alert('Открытие формы возврата на доработку...');
            setShowQuickPreview(false);
          }}
        />
      )}
    </div>
  );
}
