/**
 * Объединенная страница задач с вкладками
 * Включает "Мои задачи", "Реестр задач", "Очередь приемки" и три внешних календаря
 */

import React, { useState, useMemo } from 'react';
import { Plus, Filter, List, LayoutGrid, Save, CheckSquare, ClipboardList, Building2, MapPin, Users } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../layout/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { KanbanBoard } from '../ui/KanbanBoard';
import { StatusBadge } from '../ui/StatusBadge';
import { DeadlineBadge } from '../ui/DeadlineBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { SavedViewsManager } from '../SavedViewsManager';
import { CreateTaskDialog } from '../CreateTaskDialog';
import { Task, User, Division, TaskStatus, SavedView } from '../../types';
import { getTaskStatusLabel, getTaskStatusColor, getDivisionLabel, isTaskOverdue, formatDateTime } from '../../utils/helpers';
import { useUsers } from '../../hooks/useUsers';

interface TasksProps {
  tasks: Task[];
  currentUser: User;
  onTaskClick: (taskId: string) => void;
  onBack?: () => void;
}

type TabType = 'my' | 'all' | 'review' | 'external_org' | 'external_branch' | 'external_management';

export function Tasks({ tasks, currentUser, onTaskClick, onBack }: TasksProps) {
  const { users } = useUsers();

  // Вкладки
  const [activeTab, setActiveTab] = useState<TabType>('my');

  // Фильтры для "Реестр задач"
  const [filterDivision, setFilterDivision] = useState<Division | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterOverdue, setFilterOverdue] = useState(false);

  // Режим отображения
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Сохраненные представления
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showSavedViews, setShowSavedViews] = useState(false);

  /**
   * Получить пользователя по ID
   */
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  /**
   * Фильтрация: только мои задачи
   */
  const myTasks = useMemo(() => {
    return tasks.filter(task => task.assigneeId === currentUser.id);
  }, [tasks, currentUser.id]);

  /**
   * Фильтрация: задачи на рассмотрении для очереди приемки
   */
  const reviewTasks = useMemo(() => {
    return tasks.filter(task =>
      task.status === 'under_division_review' ||
      task.status === 'under_management_review'
    ).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [tasks]);

  /**
   * Фильтрация: задачи внешних организаций
   */
  const externalOrgTasks = useMemo(() => {
    return tasks.filter(task => task.category === 'external_org');
  }, [tasks]);

  /**
   * Фильтрация: задачи внешних филиалов
   */
  const externalBranchTasks = useMemo(() => {
    return tasks.filter(task => task.category === 'external_branch');
  }, [tasks]);

  /**
   * Фильтрация: задачи внешнего управления
   */
  const externalManagementTasks = useMemo(() => {
    return tasks.filter(task => task.category === 'external_management');
  }, [tasks]);

  /**
   * Проверка прав на приемку
   */
  const canApprove = currentUser.role === 'management_head' || currentUser.role === 'division_head';

  /**
   * Отфильтрованные задачи для "Реестр задач"
   */
  const filteredAllTasks = useMemo(() => {
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
   * Текущие задачи для отображения
   */
  const currentTasks = useMemo(() => {
    switch (activeTab) {
      case 'my':
        return myTasks;
      case 'review':
        return reviewTasks;
      case 'external_org':
        return externalOrgTasks;
      case 'external_branch':
        return externalBranchTasks;
      case 'external_management':
        return externalManagementTasks;
      case 'all':
      default:
        return filteredAllTasks;
    }
  }, [activeTab, myTasks, reviewTasks, externalOrgTasks, externalBranchTasks, externalManagementTasks, filteredAllTasks]);

  /**
   * Группировка задач по статусам для Kanban доски
   */
  const kanbanColumns = useMemo(() => {
    const statusGroups: any = {
      new: { id: 'new', title: 'Новые', color: 'bg-gray-400', tasks: [] as Task[] },
      in_progress: { id: 'in_progress', title: 'В работе', color: 'bg-blue-400', tasks: [] as Task[] },
      under_review: { id: 'under_review', title: 'На рассмотрении', color: 'bg-yellow-400', tasks: [] as Task[] },
      rework: { id: 'rework', title: 'На доработке', color: 'bg-orange-400', tasks: [] as Task[] },
      accepted: { id: 'accepted', title: 'Принято', color: 'bg-green-400', tasks: [] as Task[] },
    };

    currentTasks.forEach(task => {
      if (statusGroups[task.status]) {
        statusGroups[task.status].tasks.push(task);
      } else if (task.status === 'under_division_review' || task.status === 'under_management_review') {
        statusGroups['under_review'].tasks.push(task);
      } else if (task.status === 'rework_withdrawn') {
        statusGroups['rework'].tasks.push(task);
      }
    });

    return Object.values(statusGroups).filter((g: any) => g.id);
  }, [currentTasks]);

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
   * Создание новой задачи
   */
  const handleCreateTask = (newTask: Task) => {
    console.log('Created task:', newTask);
    // В реальном приложении здесь был бы вызов API
  };

  return (
    <div className="space-y-6">
      {/* Хедер страницы */}
      <PageHeader
        title="Задачи"
        subtitle={
          activeTab === 'my'
            ? `${myTasks.length} ${myTasks.length === 1 ? 'задача' : myTasks.length < 5 ? 'задачи' : 'задач'}`
            : `${filteredAllTasks.length} из ${tasks.length} ${tasks.length === 1 ? 'задачи' : tasks.length < 5 ? 'задач' : 'задач'}`
        }
        icon={activeTab === 'my' ? CheckSquare : List}
        actions={
          <div className="flex items-center gap-3">
            {/* Кнопка создания задачи */}
            <CreateTaskDialog currentUser={currentUser} onCreate={handleCreateTask}>
              <Button className="gap-2">
                <Plus size={16} />
                Новая задача
              </Button>
            </CreateTaskDialog>

            {/* Переключатель режима просмотра */}
            <div className="flex bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded transition-colors ${viewMode === 'kanban'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Kanban"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded transition-colors ${viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Список"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        }
      />

      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('my')}
            className={`
              py-3 px-1 border-b-2 transition-colors
              ${activeTab === 'my'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <CheckSquare size={18} />
              <span>Мои задачи</span>
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm">
                {myTasks.length}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`
              py-3 px-1 border-b-2 transition-colors
              ${activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <List size={18} />
              <span>Реестр задач</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
                {tasks.length}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`
              py-3 px-1 border-b-2 transition-colors
              ${activeTab === 'review'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={18} />
              <span>Очередь приемки</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
                {tasks.filter(task =>
                  task.status === 'under_division_review' ||
                  task.status === 'under_management_review'
                ).length}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('external_org')}
            className={`
              py-3 px-1 border-b-2 transition-colors
              ${activeTab === 'external_org'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Building2 size={18} />
              <span>Внешние организации</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
                {externalOrgTasks.length}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('external_branch')}
            className={`
              py-3 px-1 border-b-2 transition-colors
              ${activeTab === 'external_branch'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>Внешние филиалы</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
                {externalBranchTasks.length}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('external_management')}
            className={`
              py-3 px-1 border-b-2 transition-colors
              ${activeTab === 'external_management'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>Внешнее управление</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
                {externalManagementTasks.length}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Фильтры для "Реестр задач" */}
      {activeTab === 'all' && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <span className="text-sm text-gray-600">Фильтры:</span>
              </div>

              {/* Фильтр по отделу */}
              <select
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value as Division | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все отделы</option>
                <option value="rnd">Отдел R&D</option>
                <option value="it_projects">Отдел IT-проектов</option>
              </select>

              {/* Фильтр по статусу */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все статусы</option>
                <option value="new">Новые</option>
                <option value="in_progress">В работе</option>
                <option value="under_division_review">На проверке</option>
                <option value="under_management_review">На рассмотрении</option>
                <option value="rework">На доработке</option>
                <option value="accepted">Принято</option>
              </select>

              {/* Фильтр просроченных */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterOverdue}
                  onChange={(e) => setFilterOverdue(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Только просроченные</span>
              </label>

              {/* Сохранить представление */}
              <button
                onClick={() => setShowSavedViews(!showSavedViews)}
                className="ml-auto px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Save size={16} />
                Сохраненные представления
              </button>
            </div>

            {/* Менеджер сохраненных представлений */}
            {showSavedViews && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <SavedViewsManager
                  currentFilters={{
                    division: filterDivision,
                    status: filterStatus,
                    overdue: filterOverdue,
                  }}
                  savedViews={savedViews}
                  onSaveView={handleSaveView}
                  onLoadView={handleLoadView}
                  onDeleteView={handleDeleteView}
                />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Контент */}
      {currentTasks.length === 0 ? (
        <EmptyState
          icon={activeTab === 'my' ? <CheckSquare size={32} /> : <List size={32} />}
          title={activeTab === 'my' ? 'Нет назначенных задач' : 'Задачи не найдены'}
          description={
            activeTab === 'my'
              ? 'У вас пока нет назначенных задач'
              : 'Попробуйте изменить фильтры или создать новую задачу'
          }
        />
      ) : viewMode === 'kanban' ? (
        <KanbanBoard columns={kanbanColumns} onTaskClick={onTaskClick} getUserById={getUserById} />
      ) : (
        <div className="space-y-3">
          {currentTasks.map(task => {
            const assignee = task.assigneeId ? getUserById(task.assigneeId) : null;
            const creator = getUserById(task.creatorId);

            return (
              <Card key={task.id} onClick={() => onTaskClick(task.id)} hoverable>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-medium text-gray-900 truncate">
                          {task.title}
                        </h3>
                        <StatusBadge
                          label={getTaskStatusLabel(task.status)}
                          color={getTaskStatusColor(task.status)}
                        />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">ID: {task.id}</span>
                        {assignee && (
                          <div className="flex items-center gap-2">
                            <UserAvatar name={assignee.name} avatar={assignee.avatar} size="xs" />
                            <span className="text-gray-700">{assignee.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <DeadlineBadge deadline={task.deadline} status={task.status} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}