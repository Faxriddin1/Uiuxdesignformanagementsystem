/**
 * Компонент "Мои задачи" для исполнителя
 * Показывает только назначенные задачи с быстрыми действиями
 * Представление в стиле Trello Kanban доски
 */

import React, { useMemo, useState } from 'react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../layout/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { KanbanBoard } from '../ui/KanbanBoard';
import { StatusBadge } from '../ui/StatusBadge';
import { DeadlineBadge } from '../ui/DeadlineBadge';
import { Task, User } from '../../types';
import { getTaskStatusLabel, getTaskStatusColor, isTaskOverdue, getDaysUntilDeadline } from '../../utils/helpers';
import { CheckSquare, List, LayoutGrid } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';

interface MyTasksProps {
  tasks: Task[];
  currentUser: User;
  onTaskClick: (taskId: string) => void;
  onBack?: () => void;
}

export function MyTasks({ tasks, currentUser, onTaskClick, onBack }: MyTasksProps) {
  const { users } = useUsers();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  /**
   * Получить пользователя по ID
   */
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  /**
   * Фильтрация: только задачи текущего пользователя
   */
  const myTasks = useMemo(() => {
    return tasks.filter(task => task.assigneeId === currentUser.id);
  }, [tasks, currentUser.id]);

  /**
   * Сортировка задач по приоритету дедлайна
   */
  const sortedTasks = useMemo(() => {
    return [...myTasks].sort((a, b) => {
      // Принятые задачи в конец
      if (a.status === 'accepted' && b.status !== 'accepted') return 1;
      if (a.status !== 'accepted' && b.status === 'accepted') return -1;

      // Просроченные - первыми
      const aOverdue = isTaskOverdue(a);
      const bOverdue = isTaskOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Затем по дедлайну
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [myTasks]);

  /**
   * Группировка задач для Kanban доски
   */
  const kanbanColumns = useMemo(() => {
    const statusGroups = {
      new: { id: 'new', title: 'Новые', color: 'bg-gray-400', tasks: [] as Task[] },
      in_progress: { id: 'in_progress', title: 'В работе', color: 'bg-blue-400', tasks: [] as Task[] },
      under_review: { id: 'under_review', title: 'На рассмотрении', color: 'bg-yellow-400', tasks: [] as Task[] },
      rework: { id: 'rework', title: 'На доработке', color: 'bg-orange-400', tasks: [] as Task[] },
      accepted: { id: 'accepted', title: 'Принято', color: 'bg-green-400', tasks: [] as Task[] },
    };

    myTasks.forEach(task => {
      if (statusGroups[task.status]) {
        statusGroups[task.status].tasks.push(task);
      }
    });

    return Object.values(statusGroups);
  }, [myTasks]);

  /**
   * Группировка задач
   */
  const groupedTasks = useMemo(() => {
    const groups: {
      overdue: Task[];
      today: Task[];
      soon: Task[];
      later: Task[];
      completed: Task[];
    } = {
      overdue: [],
      today: [],
      soon: [],
      later: [],
      completed: [],
    };

    sortedTasks.forEach(task => {
      if (task.status === 'accepted') {
        groups.completed.push(task);
      } else if (isTaskOverdue(task)) {
        groups.overdue.push(task);
      } else {
        const days = getDaysUntilDeadline(task.deadline);
        if (days === 0) {
          groups.today.push(task);
        } else if (days <= 3) {
          groups.soon.push(task);
        } else {
          groups.later.push(task);
        }
      }
    });

    return groups;
  }, [sortedTasks]);

  /**
   * Рендер группы задач
   */
  const renderTaskGroup = (title: string, tasks: Task[], color: string) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className={`text-gray-900 mb-3 flex items-center gap-2`}>
          <span className={`w-3 h-3 rounded-full ${color}`}></span>
          {title} ({tasks.length})
        </h3>
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCardItem
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Мои задачи"
        description="Ваш личный список задач, отсортированный по дедлайнам"
        onBack={onBack}
        actions={
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Kanban доска"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Список"
            >
              <List size={18} />
            </button>
          </div>
        }
      />

      {myTasks.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="У вас нет задач"
              description="На данный момент вам не назначены задачи"
              icon={<CheckSquare size={48} />}
            />
          </CardBody>
        </Card>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          onTaskClick={onTaskClick}
          getUserById={getUserById}
        />
      ) : (
        <div>
          {renderTaskGroup('Просроченные', groupedTasks.overdue, 'bg-red-500')}
          {renderTaskGroup('Сегодня', groupedTasks.today, 'bg-orange-500')}
          {renderTaskGroup('Ближайшие дни', groupedTasks.soon, 'bg-yellow-500')}
          {renderTaskGroup('Позже', groupedTasks.later, 'bg-blue-500')}
          {renderTaskGroup('Выполненные', groupedTasks.completed, 'bg-green-500')}
        </div>
      )}
    </div>
  );
}

/**
 * Компонент карточки задачи в списке
 */
function TaskCardItem({ task, onClick }: { task: Task; onClick: () => void }) {
  const overdue = isTaskOverdue(task);

  return (
    <Card
      hover
      onClick={onClick}
      className={overdue && task.status !== 'accepted' ? 'border-l-4 border-l-red-500' : ''}
    >
      <CardBody className="py-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-gray-900 flex-1">{task.title}</h3>
          <StatusBadge
            label={getTaskStatusLabel(task.status)}
            color={getTaskStatusColor(task.status)}
          />
        </div>

        <p className="text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>

        <div className="flex items-center justify-between">
          <DeadlineBadge deadline={task.deadline} status={task.status} />

          <div className="flex items-center gap-3 text-sm text-gray-600">
            {task.attachments.length > 0 && (
              <span>📎 {task.attachments.length}</span>
            )}
            {task.comments.length > 0 && (
              <span>💬 {task.comments.length}</span>
            )}
          </div>
        </div>

        {/* Быстрые действия для новой задачи */}
        {task.status === 'new' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Здесь будет логика взятия задачи в работу
                onClick();
              }}
            >
              Взять в работу
            </Button>
          </div>
        )}

        {/* Быстрые действия для доработки */}
        {task.status === 'rework' && (
          <div className="mt-3 pt-3 border-t border-gray-200 bg-orange-50 -mx-6 -mb-4 px-6 py-3 rounded-b-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Задача возвращена на доработку. Требуется исправление.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}