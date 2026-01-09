/**
 * Быстрый предпросмотр задачи без полного открытия
 * Показывается при наведении/клике в Review Queue
 */

import { X, FileText, Clock, User as UserIcon, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Task, User } from '../types';
import { UserAvatar } from './ui/UserAvatar';
import { StatusBadge } from './ui/StatusBadge';
import { TaskTypeBadge } from './TaskTypeBadge';
import { DeadlineBadge } from './ui/DeadlineBadge';
import { AttachmentsList } from './ui/AttachmentsList';
import { Button } from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { getTaskStatusText, getTaskStatusColor } from '../utils/statusHelpers';
import { getCurrentVersion } from '../utils/resultVersions';

interface QuickPreviewProps {
  task: Task;
  currentUser: User;
  onClose: () => void;
  onFullOpen?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  position?: 'left' | 'right' | 'center';
}

export function QuickPreview({
  task,
  currentUser,
  onClose,
  onFullOpen,
  onApprove,
  onReject,
  position = 'right'
}: QuickPreviewProps) {
  const { users } = useUsers();
  
  // Получить пользователя по ID
  const getUserById = (userId: string) => users.find(u => u.id === userId);

  const assignee = getUserById(task.assigneeId);
  const creator = getUserById(task.creatorId);
  const currentVersion = getCurrentVersion(task);

  // Позиция модального окна
  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-20">
      {/* Фон для закрытия */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Контент предпросмотра */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col ${positionClasses[position]}`}
      >
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Быстрый просмотр</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl text-gray-900 mb-2">{task.title}</h2>

          <div className="flex items-center gap-2 flex-wrap">
            <TaskTypeBadge taskType={task.taskType} />
            <StatusBadge
              label={getTaskStatusText(task.status, task.taskType)}
              color={getTaskStatusColor(task.status)}
            />
            <DeadlineBadge deadline={task.deadline} />
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Описание */}
          <div>
            <h3 className="text-sm text-gray-700 mb-2">Описание задачи</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
          </div>

          {/* Текущий результат */}
          {currentVersion && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm text-blue-900">
                  Результат (версия {currentVersion.version})
                </h3>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                {currentVersion.resultDescription}
              </p>
              
              {currentVersion.attachments.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">
                    Вложения ({currentVersion.attachments.length}):
                  </p>
                  <AttachmentsList attachments={currentVersion.attachments} />
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                <UserAvatar
                  name={getUserById(currentVersion.submittedBy)?.name || 'Неизвестно'}
                  avatar={getUserById(currentVersion.submittedBy)?.avatar}
                  size="xs"
                />
                <span className="text-xs text-gray-600">
                  Отправлено {currentVersion.submittedAt.toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          )}

          {/* Информация */}
          <div className="grid grid-cols-2 gap-4">
            {/* Исполнитель */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <UserIcon className="w-4 h-4" />
                <span>Исполнитель</span>
              </div>
              {assignee && (
                <div className="flex items-center gap-2">
                  <UserAvatar name={assignee.name} avatar={assignee.avatar} size="sm" />
                  <div>
                    <p className="text-sm text-gray-900">{assignee.name}</p>
                    <p className="text-xs text-gray-500">{assignee.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Постановщик */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <UserIcon className="w-4 h-4" />
                <span>Постановщик</span>
              </div>
              {creator && (
                <div className="flex items-center gap-2">
                  <UserAvatar name={creator.name} avatar={creator.avatar} size="sm" />
                  <div>
                    <p className="text-sm text-gray-900">{creator.name}</p>
                    <p className="text-xs text-gray-500">{creator.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Дедлайн */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                <span>Дедлайн</span>
              </div>
              <p className="text-sm text-gray-900">
                {task.deadline.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            {/* Создано */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                <span>Создано</span>
              </div>
              <p className="text-sm text-gray-900">
                {task.createdAt.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Соисполнители */}
          {task.coAssignees && task.coAssignees.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-700 mb-2">
                Соисполнители ({task.coAssignees.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.coAssignees.map(coAssigneeId => {
                  const coAssignee = getUserById(coAssigneeId);
                  if (!coAssignee) return null;
                  return (
                    <div key={coAssigneeId} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                      <UserAvatar name={coAssignee.name} avatar={coAssignee.avatar} size="xs" />
                      <span className="text-sm text-gray-700">{coAssignee.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Действия */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          <Button onClick={onFullOpen} variant="secondary">
            <Eye className="w-4 h-4 mr-1" />
            Открыть полностью
          </Button>

          <div className="flex gap-2">
            {onReject && (
              <Button onClick={onReject} variant="secondary">
                <XCircle className="w-4 h-4 mr-1" />
                Вернуть
              </Button>
            )}
            {onApprove && (
              <Button onClick={onApprove} variant="primary">
                <CheckCircle className="w-4 h-4 mr-1" />
                Одобрить
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}