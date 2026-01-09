/**
 * Компонент реестра проектов
 * Показывает все пилотные проекты с фильтрацией по статусам
 * Представление в стиле Trello Kanban доски
 */

import React, { useState, useMemo } from 'react';
import { Plus, Filter, FolderKanban, List, LayoutGrid } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../layout/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { ProjectKanbanBoard } from '../ui/ProjectKanbanBoard';
import { UserAvatar } from '../ui/UserAvatar';
import { Project, User, ProjectStatus } from '../../types';
import { 
  getProjectStatusLabel, 
  getProjectStatusNumber,
  getProjectStatusColor,
  getDivisionLabel 
} from '../../utils/helpers';
import { useUsers } from '../../hooks/useUsers';

interface ProjectsProps {
  projects: Project[];
  currentUser: User;
  onProjectClick: (projectId: string) => void;
  onCreateProject: () => void;
  onBack?: () => void;
}

export function Projects({ projects, currentUser, onProjectClick, onCreateProject, onBack }: ProjectsProps) {
  const { users } = useUsers();
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  /**
   * Получить пользователя по ID
   */
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  /**
   * Отфильтрованные проекты
   */
  const filteredProjects = useMemo(() => {
    if (filterStatus === 'all') return projects;
    return projects.filter(project => project.status === filterStatus);
  }, [projects, filterStatus]);

  /**
   * Группировка проектов по статусам для Kanban доски
   */
  const kanbanColumns = useMemo(() => {
    const statusGroups = {
      platform_implementation: { 
        id: 'platform_implementation', 
        title: '1. Реализация платформы', 
        color: 'bg-blue-400', 
        projects: [] as Project[] 
      },
      internal_testing: { 
        id: 'internal_testing', 
        title: '2. Внутренние тестирования', 
        color: 'bg-yellow-400', 
        projects: [] as Project[] 
      },
      agreement: { 
        id: 'agreement', 
        title: '3. Согласование условий', 
        color: 'bg-orange-400', 
        projects: [] as Project[] 
      },
      launch: { 
        id: 'launch', 
        title: '4. Запуск', 
        color: 'bg-green-400', 
        projects: [] as Project[] 
      },
    };

    filteredProjects.forEach(project => {
      if (statusGroups[project.status]) {
        statusGroups[project.status].projects.push(project);
      }
    });

    return Object.values(statusGroups);
  }, [filteredProjects]);

  return (
    <div>
      <PageHeader
        title="Реестр проектов"
        description="Управление пилотными проектами и партнерскими запусками"
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

            <Button onClick={onCreateProject} icon={<Plus size={20} />}>
              Создать проект
            </Button>
          </div>
        }
      />

      {/* Панель фильтров */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <span className="text-gray-700">Фильтр по статусу:</span>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="platform_implementation">1. Реализация платформы</option>
              <option value="internal_testing">2. Внутренние тестирования</option>
              <option value="agreement">3. Согласование условий</option>
              <option value="launch">4. Запуск</option>
            </select>

            <div className="ml-auto text-gray-600">
              Найдено: {filteredProjects.length}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Представления */}
      {viewMode === 'kanban' ? (
        filteredProjects.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                title="Проекты не найдены"
                description={filterStatus === 'all' 
                  ? "Создайте первый проект" 
                  : "Попробуйте изменить фильтр статуса"
                }
                icon={<FolderKanban size={48} />}
              />
            </CardBody>
          </Card>
        ) : (
          <ProjectKanbanBoard
            columns={kanbanColumns}
            onProjectClick={onProjectClick}
            getUserById={getUserById}
          />
        )
      ) : (
        // Список проектов (старое представление)
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map(project => {
            const responsible = getUserById(project.responsibleId);
            const statusNumber = getProjectStatusNumber(project.status);
            const statusColor = getProjectStatusColor(project.status);

            return (
              <Card
                key={project.id}
                hover
                onClick={() => onProjectClick(project.id)}
              >
                <CardBody className="p-6">
                  {/* Заголовок проекта */}
                  <div className="mb-4">
                    <h3 className="text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  {/* Статус-индикатор (упрощенный степпер) */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4].map(step => (
                        <div
                          key={step}
                          className={`flex-1 h-2 rounded-full ${
                            step === statusNumber 
                              ? statusColor 
                              : step < statusNumber 
                              ? 'bg-green-500' 
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">
                      {getProjectStatusLabel(project.status)}
                    </p>
                  </div>

                  {/* Метаданные */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Ответственный:</span>
                      {responsible && (
                        <div className="flex items-center gap-2">
                          <UserAvatar name={responsible.name} avatar={responsible.avatar} size="sm" />
                          <span className="text-gray-900">{responsible.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Отдел:</span>
                      <span className="text-gray-900">{getDivisionLabel(project.division)}</span>
                    </div>

                    {project.attachments.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Документы:</span>
                        <span className="text-gray-900">📎 {project.attachments.length}</span>
                      </div>
                    )}

                    {project.risks && project.risks.length > 0 && (
                      <div className="text-sm">
                        <span className="text-orange-600">⚠️ Риски: {project.risks.length}</span>
                      </div>
                    )}
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