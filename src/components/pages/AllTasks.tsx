/**
 * Компонент реестра всех задач Управления
 * Для руководителя - видны все задачи с фильтрами
 * Представление в стиле Trello Kanban доски
 */

import React, { useState, useMemo } from 'react';
import { Plus, Filter, List, LayoutGrid, Save } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../layout/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { KanbanBoard } from '../ui/KanbanBoard';
import { StatusBadge } from '../ui/StatusBadge';
import { DeadlineBadge } from '../ui/DeadlineBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { SavedViewsManager } from '../SavedViewsManager';
import { Task, User, Division, TaskStatus, SavedView } from '../../types';
import { getTaskStatusLabel, getTaskStatusColor, getDivisionLabel, isTaskOverdue } from '../../utils/helpers';
import { useUsers } from '../../hooks/useUsers';

interface AllTasksProps {
  tasks: Task[];
  currentUser: User;
  onTaskClick: (taskId: string) => void;
  onCreateTask: () => void;
  onBack?: () => void;
}

export function AllTasks({ tasks, currentUser, onTaskClick, onCreateTask, onBack }: AllTasksProps) {
  const { users } = useUsers();
  const [filterDivision, setFilterDivision] = useState<Division | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showSavedViews, setShowSavedViews] = useState(false);

  /**
   * Получить пользователя по ID
   */
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  /**
   * Сохранить текущее представление
   */
  const handleSaveView = (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newView: SavedView = {
      ...view,
      id: `view-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSavedViews([...savedViews, newView]);
  };

  /**
   * Загрузить сохраненное представление
   */
  const handleLoadView = (view: SavedView) => {
    if (view.filters.division) setFilterDivision(view.filters.division as Division);
    if (view.filters.status) setFilterStatus(view.filters.status as TaskStatus);
    if (view.filters.overdue !== undefined) setFilterOverdue(view.filters.overdue);
    setShowSavedViews(false);
  };

  /**
   * Удалить сохраненное представление
   */
  const handleDeleteView = (viewId: string) => {
    setSavedViews(savedViews.filter(v => v.id !== viewId));
  };

  /**
   * Отфильтрованные задачи
   */
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Фильтр по отделу
      if (filterDivision !== 'all' && task.division !== filterDivision) {
        return false;
      }

      // Фильтр по статусу
      if (filterStatus !== 'all' && task.status !== filterStatus) {
        return false;
      }

      // Фильтр по просрочке
      if (filterOverdue && !isTaskOverdue(task)) {
        return false;
      }

      return true;
    });
  }, [tasks, filterDivision, filterStatus, filterOverdue]);

  /**
   * Группировка задач по статусам для Kanban доски
   */
  const kanbanColumns = useMemo(() => {
    const statusGroups = {
      new: { id: 'new', title: 'Новые', color: 'bg-gray-400', tasks: [] as Task[] },
      in_progress: { id: 'in_progress', title: 'В работе', color: 'bg-blue-400', tasks: [] as Task[] },
      under_review: { id: 'under_review', title: 'На рассмотрении', color: 'bg-yellow-400', tasks: [] as Task[] },
      rework: { id: 'rework', title: 'На доработке', color: 'bg-orange-400', tasks: [] as Task[] },
      accepted: { id: 'accepted', title: 'Принято', color: 'bg-green-400', tasks: [] as Task[] },
    };

    filteredTasks.forEach(task => {
      if (statusGroups[task.status]) {
        statusGroups[task.status].tasks.push(task);
      }
    });

    return Object.values(statusGroups);
  }, [filteredTasks]);

  return (
    <div>
      <PageHeader
        title="Реестр задач Управления"
        description="Все задачи с возможностью фильтрации и управления"
        onBack={onBack}
        actions={
          <div className="flex items-center gap-2">
            {/* Переключатель вида */}
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
            
            <Button onClick={onCreateTask} icon={<Plus size={20} />}>
              Создать задачу
            </Button>
          </div>
        }
      />

      {/* Панель фильтров */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <span className="text-gray-700">Фильтры:</span>
            </div>

            {/* Фильтр по отделу */}
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value as Division | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все отделы</option>
              <option value="rnd">{getDivisionLabel('rnd')}</option>
              <option value="it_projects">{getDivisionLabel('it_projects')}</option>
            </select>

            {/* Фильтр по статусу */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="new">Новые</option>
              <option value="in_progress">В работе</option>
              <option value="under_review">На рассмотрении</option>
              <option value="rework">На доработке</option>
              <option value="accepted">Принятые</option>
            </select>

            {/* Фильтр по просрочке */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOverdue}
                onChange={(e) => setFilterOverdue(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Только просроченные</span>
            </label>

            {/* Кнопка сохраненных представлений */}
            <button
              onClick={() => setShowSavedViews(true)}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Save size={16} />
              <span>Представления ({savedViews.length})</span>
            </button>

            {/* Счетчик результатов */}
            <div className="text-gray-600">
              Найдено: {filteredTasks.length}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Kanban представление */}
      {viewMode === 'kanban' ? (
        filteredTasks.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                title="Задачи не найдены"
                description="Попробуйте изменить параметры фильтрации"
              />
            </CardBody>
          </Card>
        ) : (
          <KanbanBoard
            columns={kanbanColumns}
            onTaskClick={onTaskClick}
            getUserById={getUserById}
          />
        )
      ) : (
        // Список задач (старое представление)
        filteredTasks.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                title="Задачи не найдены"
                description="Попробуйте изменить параметры фильтрации"
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const assignee = getUserById(task.assigneeId);
              const creator = getUserById(task.creatorId);
              const overdue = isTaskOverdue(task);

              return (
                <Card
                  key={task.id}
                  hover
                  onClick={() => onTaskClick(task.id)}
                  className={overdue ? 'border-l-4 border-l-red-500' : ''}
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
                          <h3 className="text-gray-900">{task.title}</h3>
                          <StatusBadge
                            label={getTaskStatusLabel(task.status)}
                            color={getTaskStatusColor(task.status)}
                          />
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">Исполнитель:</span>
                            <span className="text-gray-900">{assignee?.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">Отдел:</span>
                            <span className="text-gray-900">{getDivisionLabel(task.division)}</span>
                          </div>

                          <DeadlineBadge deadline={task.deadline} status={task.status} />

                          {task.attachments.length > 0 && (
                            <span className="text-gray-600">
                              📎 {task.attachments.length}
                            </span>
                          )}

                          {task.comments.length > 0 && (
                            <span className="text-gray-600">
                              💬 {task.comments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Модальное окно сохраненных представлений */}
      {showSavedViews && (
        <SavedViewsManager
          currentUser={currentUser}
          savedViews={savedViews}
          currentFilters={{
            division: filterDivision !== 'all' ? filterDivision : undefined,
            status: filterStatus !== 'all' ? filterStatus : undefined,
            overdue: filterOverdue || undefined,
          }}
          onSaveView={handleSaveView}
          onLoadView={handleLoadView}
          onDeleteView={handleDeleteView}
          onClose={() => setShowSavedViews(false)}
        />
      )}
    </div>
  );
}