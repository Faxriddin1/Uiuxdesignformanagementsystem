/**
 * Компонент для отображения изменений (До/После)
 * Используется в истории изменений задачи/проекта
 */

import { ArrowRight, Calendar, User as UserIcon, Tag, FileText, Clock, Users } from 'lucide-react';
import { FieldChange, User } from '../types';
import { UserAvatar } from './ui/UserAvatar';
import { users } from '../data/mockData';

interface DiffViewProps {
  changes: FieldChange[];
}

export function DiffView({ changes }: DiffViewProps) {
  // Получить пользователя по ID
  const getUserById = (userId: string) => users.find(u => u.id === userId);

  /**
   * Получить иконку для типа поля
   */
  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'title':
      case 'description':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'deadline':
        return <Calendar className="w-4 h-4 text-gray-400" />;
      case 'assigneeId':
      case 'creatorId':
        return <UserIcon className="w-4 h-4 text-gray-400" />;
      case 'coAssignees':
        return <Users className="w-4 h-4 text-gray-400" />;
      case 'status':
      case 'priority':
        return <Tag className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  /**
   * Форматировать значение поля
   */
  const formatValue = (fieldName: string, value: any): string => {
    if (value === null || value === undefined) return '—';

    // Даты
    if (fieldName === 'deadline' || fieldName === 'createdAt' || fieldName === 'updatedAt') {
      if (value instanceof Date) {
        return value.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return value.toString();
    }

    // Пользователи
    if (fieldName === 'assigneeId' || fieldName === 'creatorId' || fieldName === 'responsibleId') {
      const user = getUserById(value);
      return user ? user.name : value;
    }

    // Соисполнители (массив)
    if (fieldName === 'coAssignees' && Array.isArray(value)) {
      return value.map(id => {
        const user = getUserById(id);
        return user ? user.name : id;
      }).join(', ');
    }

    // Массивы
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    // Булевы значения
    if (typeof value === 'boolean') {
      return value ? 'Да' : 'Нет';
    }

    // Статусы и перечисления
    if (typeof value === 'string') {
      // Можно добавить маппинг для человекочитаемых названий
      return value;
    }

    return String(value);
  };

  /**
   * Рендер изменения одного поля
   */
  const renderFieldChange = (change: FieldChange) => {
    const changedBy = getUserById(change.changedBy);
    const oldValueFormatted = formatValue(change.fieldName, change.oldValue);
    const newValueFormatted = formatValue(change.fieldName, change.newValue);

    // Определить, является ли изменение значительным
    const isSignificant = change.fieldName === 'status' || 
                          change.fieldName === 'assigneeId' || 
                          change.fieldName === 'deadline';

    return (
      <div
        key={`${change.fieldName}-${change.changedAt.getTime()}`}
        className={`p-4 border rounded-lg ${
          isSignificant 
            ? 'border-blue-200 bg-blue-50/30' 
            : 'border-gray-200 bg-white'
        }`}
      >
        {/* Заголовок изменения */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getFieldIcon(change.fieldName)}
            <span className="text-sm text-gray-900">{change.fieldLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {changedBy && (
              <>
                <UserAvatar name={changedBy.name} avatar={changedBy.avatar} size="xs" />
                <span className="text-xs text-gray-600">{changedBy.name}</span>
              </>
            )}
            <span className="text-xs text-gray-400">
              {change.changedAt.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Изменение: До -> После */}
        <div className="flex items-start gap-3">
          {/* Старое значение */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-1">Было:</div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900 break-words whitespace-pre-wrap">
                {oldValueFormatted}
              </p>
            </div>
          </div>

          {/* Стрелка */}
          <div className="flex items-center justify-center pt-6">
            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>

          {/* Новое значение */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-1">Стало:</div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900 break-words whitespace-pre-wrap">
                {newValueFormatted}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {changes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p>Нет изменений для отображения</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm text-gray-700">
              Изменено полей: {changes.length}
            </h3>
          </div>
          
          {changes.map(renderFieldChange)}
        </>
      )}
    </div>
  );
}

/**
 * Упрощенный вариант - показывает только текстовое описание изменения
 */
export function SimpleDiffView({ changes }: DiffViewProps) {
  const getUserById = (userId: string) => users.find(u => u.id === userId);

  return (
    <div className="space-y-2">
      {changes.map((change, index) => {
        const changedBy = getUserById(change.changedBy);
        
        return (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
            {changedBy && (
              <UserAvatar name={changedBy.name} avatar={changedBy.avatar} size="sm" />
            )}
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-medium">{changedBy?.name || 'Система'}</span>
                {' '}изменил(а) <span className="font-medium">{change.fieldLabel}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {change.changedAt.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
