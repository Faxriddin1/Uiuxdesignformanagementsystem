/**
 * Компонент очереди приемки (Review Inbox)
 * Для руководителей - показывает все задачи на рассмотрении
 */

import React, { useState } from 'react';
import { Eye, FileText } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { PageHeader } from '../layout/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { UserAvatar } from '../ui/UserAvatar';
import { DeadlineBadge } from '../ui/DeadlineBadge';
import { QuickPreview } from '../QuickPreview';
import { Task, User } from '../../types';
import { getDivisionLabel, formatDateTime } from '../../utils/helpers';
import { useUsers } from '../../hooks/useUsers';

interface ReviewQueueProps {
  tasks: Task[];
  currentUser: User;
  onTaskClick: (taskId: string) => void;
  onBack?: () => void;
}

export function ReviewQueue({ tasks, currentUser, onTaskClick, onBack }: ReviewQueueProps) {
  const { users } = useUsers();
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);

  /**
   * Фильтрация: только задачи на рассмотрении
   */
  const reviewTasks = tasks.filter(task => task.status === 'under_review');

  /**
   * Сортировка: сначала просроченные, потом по дедлайну
   */
  const sortedTasks = [...reviewTasks].sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  /**
   * Получить пользователя по ID
   */
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  return (
    <div>
      <PageHeader
        title="Очередь приемки"
        description="Задачи, ожидающие вашего рассмотрения и одобрения"
        onBack={onBack}
      />

      {sortedTasks.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Нет задач на рассмотрении"
              description="Все задачи обработаны. Новые задачи появятся здесь после отправки исполнителями."
              icon={<Eye size={48} />}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map(task => {
            const assignee = getUserById(task.assigneeId);
            const lastUpdate = task.history[task.history.length - 1];

            return (
              <Card
                key={task.id}
                hover
                onClick={() => onTaskClick(task.id)}
                className="border-l-4 border-l-purple-500"
              >
                <CardBody className="py-4">
                  <div className="flex items-start gap-4">
                    {/* Аватар исполнителя */}
                    <div className="flex-shrink-0">
                      {assignee && (
                        <UserAvatar name={assignee.name} avatar={assignee.avatar} />
                      )}
                    </div>

                    {/* Основная информация */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-gray-900 mb-1">{task.title}</h3>
                          <p className="text-sm text-gray-600">
                            Отправил: {assignee?.name} • {getDivisionLabel(task.division)}
                          </p>
                        </div>
                        <DeadlineBadge deadline={task.deadline} status={task.status} />
                      </div>

                      {/* Описание результата */}
                      {task.resultDescription && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Результат выполнения:</strong>
                          </p>
                          <p className="text-sm text-gray-800">
                            {task.resultDescription}
                          </p>
                        </div>
                      )}

                      {/* Информация о вложениях */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {task.attachments.length > 0 && (
                          <div className="flex items-center gap-1.5 text-blue-600">
                            <FileText size={16} />
                            <span>{task.attachments.length} файл(ов)</span>
                          </div>
                        )}

                        {lastUpdate && (
                          <div className="text-gray-500">
                            Обновлено: {formatDateTime(lastUpdate.timestamp)}
                          </div>
                        )}

                        {/* Кнопка быстрого просмотра */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTaskId(task.id);
                          }}
                          className="ml-auto px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                        >
                          Рассмотреть
                        </button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Подсказка */}
      {sortedTasks.length > 0 && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardBody className="py-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Подсказка:</strong> Откройте задачу для просмотра вложений и результатов. 
              Вы можете одобрить задачу или вернуть на доработку с комментарием.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Быстрый просмотр */}
      {previewTaskId && (() => {
        const previewTask = sortedTasks.find(t => t.id === previewTaskId);
        return previewTask ? (
          <QuickPreview
            task={previewTask}
            currentUser={currentUser}
            onClose={() => setPreviewTaskId(null)}
            onFullOpen={() => {
              setPreviewTaskId(null);
              onTaskClick(previewTaskId);
            }}
          />
        ) : null;
      })()}
    </div>
  );
}