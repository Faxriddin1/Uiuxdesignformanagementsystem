/**
 * Компонент Kanban доски в стиле Trello
 * Отображает карточки в колонках по статусам с возможностью перетаскивания
 */

import React from 'react';
import { Task } from '../../types';
import { Card, CardBody } from './Card';
import { StatusBadge } from './StatusBadge';
import { DeadlineBadge } from './DeadlineBadge';
import { UserAvatar } from './UserAvatar';
import { User } from '../../types';
import { isTaskOverdue } from '../../utils/helpers';

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  columns: Column[];
  onTaskClick: (taskId: string) => void;
  getUserById: (userId: string) => User | undefined;
}

export function KanbanBoard({ columns, onTaskClick, getUserById }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 bg-gray-50 rounded-xl p-4 border border-gray-200"
        >
          {/* Заголовок колонки */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="text-gray-900">{column.title}</h3>
            </div>
            <span className="text-sm text-gray-600 bg-white px-2.5 py-1 rounded-full border border-gray-200">
              {column.tasks.length}
            </span>
          </div>

          {/* Список карточек */}
          <div className="space-y-3 min-h-[200px]">
            {column.tasks.map((task) => {
              const assignee = getUserById(task.assigneeId);
              const overdue = isTaskOverdue(task);

              return (
                <Card
                  key={task.id}

                  onClick={() => onTaskClick(task.id)}
                  className={`bg-white hover:shadow-lg transition-all duration-200 border-gray-200 ${overdue ? 'ring-2 ring-red-400' : ''
                    }`}
                >
                  <CardBody className="p-4">
                    {/* Заголовок задачи */}
                    <h4 className="text-gray-900 mb-2 line-clamp-2">
                      {task.title}
                    </h4>

                    {/* Описание задачи */}
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Метаданные */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <DeadlineBadge deadline={task.deadline} status={task.status} compact />

                      {task.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                          }`}>
                          {task.priority === 'urgent' ? 'Срочно' :
                            task.priority === 'high' ? 'Высокий' :
                              task.priority === 'medium' ? 'Средний' : 'Низкий'}
                        </span>
                      )}
                    </div>

                    {/* Нижняя панель */}
                    <div className="flex items-center justify-between">
                      {/* Иконки вложений и комментариев */}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        {task.attachments.length > 0 && (
                          <span className="flex items-center gap-1">
                            📎 {task.attachments.length}
                          </span>
                        )}
                        {task.comments.length > 0 && (
                          <span className="flex items-center gap-1">
                            💬 {task.comments.length}
                          </span>
                        )}
                      </div>

                      {/* Аватары участников */}
                      <div className="flex items-center gap-1">
                        {/* Создатель (если отличается от исполнителя) */}
                        {task.creatorId && task.creatorId !== task.assigneeId && (
                          <div title={`Создатель: ${getUserById(task.creatorId)?.name || 'Неизвестно'}`}>
                            <UserAvatar
                              name={getUserById(task.creatorId)?.name || '?'}
                              avatar={getUserById(task.creatorId)?.avatar}
                              size="xs"
                              className="opacity-75 ring-1 ring-gray-200"
                            />
                          </div>
                        )}

                        {/* Исполнитель */}
                        {assignee && (
                          <div title={`Исполнитель: ${assignee.name}`}>
                            <UserAvatar
                              name={assignee.name}
                              avatar={assignee.avatar}
                              size="sm"
                              className="ring-2 ring-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}

            {/* Пустое состояние колонки */}
            {column.tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Нет задач
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}