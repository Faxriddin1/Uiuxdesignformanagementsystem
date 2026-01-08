/**
 * Менеджер сохраненных представлений (фильтров)
 * Позволяет сохранять, загружать и удалять наборы фильтров
 */

import { useState } from 'react';
import { Save, Trash2, Eye, Globe, Lock, Plus } from 'lucide-react';
import { SavedView, User, TaskStatus, TaskPriority, Division, TaskType } from '../types';
import { Button } from './ui/Button';
import { Card, CardBody, CardHeader } from './ui/Card';

interface SavedViewsManagerProps {
  currentUser: User;
  savedViews: SavedView[];
  currentFilters?: SavedView['filters'];
  onSaveView: (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (viewId: string) => void;
  onClose?: () => void;
}

export function SavedViewsManager({
  currentUser,
  savedViews,
  currentFilters,
  onSaveView,
  onLoadView,
  onDeleteView,
  onClose
}: SavedViewsManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [isShared, setIsShared] = useState(false);

  // Фильтрация представлений (свои + общие)
  const myViews = savedViews.filter(v => v.userId === currentUser.id);
  const sharedViews = savedViews.filter(v => v.isShared && v.userId !== currentUser.id);

  /**
   * Сохранить текущие фильтры как представление
   */
  const handleSave = () => {
    if (!viewName.trim()) return;

    onSaveView({
      name: viewName.trim(),
      description: viewDescription.trim() || undefined,
      userId: currentUser.id,
      isShared,
      filters: currentFilters || {},
      sortBy: 'deadline',
      sortOrder: 'asc'
    });

    // Сбросить форму
    setViewName('');
    setViewDescription('');
    setIsShared(false);
    setShowSaveDialog(false);
  };

  /**
   * Получить описание фильтров
   */
  const getFiltersDescription = (filters: SavedView['filters']): string => {
    const parts: string[] = [];

    if (filters.status && filters.status.length > 0) {
      parts.push(`Статус: ${filters.status.length}`);
    }
    if (filters.priority && filters.priority.length > 0) {
      parts.push(`Приоритет: ${filters.priority.length}`);
    }
    if (filters.taskType && filters.taskType.length > 0) {
      parts.push(`Тип: ${filters.taskType.join(', ')}`);
    }
    if (filters.division && filters.division.length > 0) {
      parts.push(`Отдел: ${filters.division.length}`);
    }
    if (filters.assigneeId && filters.assigneeId.length > 0) {
      parts.push(`Исполнитель: ${filters.assigneeId.length}`);
    }
    if (filters.search) {
      parts.push(`Поиск: "${filters.search}"`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Без фильтров';
  };

  /**
   * Форматировать дату
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg text-gray-900">Сохраненные представления</h3>
            <p className="text-sm text-gray-500 mt-1">
              Сохраняйте часто используемые фильтры для быстрого доступа
            </p>
          </div>
          <Button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            variant="primary"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Сохранить текущее
          </Button>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Форма сохранения нового представления */}
        {showSaveDialog && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Название представления *
              </label>
              <input
                type="text"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="Мои просроченные задачи"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Описание (опционально)
              </label>
              <input
                type="text"
                value={viewDescription}
                onChange={(e) => setViewDescription(e.target.value)}
                placeholder="Все просроченные задачи, назначенные мне"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="share-view"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="share-view" className="text-sm text-gray-700">
                Сделать доступным другим пользователям
              </label>
            </div>

            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Текущие фильтры:</p>
              <p className="text-sm text-gray-900">
                {getFiltersDescription(currentFilters || {})}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!viewName.trim()}>
                <Save className="w-4 h-4 mr-1" />
                Сохранить
              </Button>
              <Button onClick={() => setShowSaveDialog(false)} variant="secondary">
                Отмена
              </Button>
            </div>
          </div>
        )}

        {/* Мои представления */}
        {myViews.length > 0 && (
          <div>
            <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Мои представления ({myViews.length})
            </h4>
            <div className="space-y-2">
              {myViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                >
                  <button
                    onClick={() => onLoadView(view)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <h5 className="text-sm text-gray-900">{view.name}</h5>
                      {view.isShared && (
                        <Globe className="w-3 h-3 text-blue-500" title="Общее" />
                      )}
                    </div>
                    {view.description && (
                      <p className="text-xs text-gray-600 mb-1">{view.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {getFiltersDescription(view.filters)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Сохранено {formatDate(view.createdAt)}
                    </p>
                  </button>

                  <button
                    onClick={() => onDeleteView(view.id)}
                    className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Общие представления */}
        {sharedViews.length > 0 && (
          <div>
            <h4 className="text-sm text-gray-700 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Общие представления ({sharedViews.length})
            </h4>
            <div className="space-y-2">
              {sharedViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => onLoadView(view)}
                  className="w-full flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left"
                >
                  <Eye className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-sm text-gray-900 mb-1">{view.name}</h5>
                    {view.description && (
                      <p className="text-xs text-gray-600 mb-1">{view.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {getFiltersDescription(view.filters)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {myViews.length === 0 && sharedViews.length === 0 && !showSaveDialog && (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">Нет сохраненных представлений</p>
            <p className="text-sm text-gray-400">
              Настройте фильтры и нажмите "Сохранить текущее"
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
