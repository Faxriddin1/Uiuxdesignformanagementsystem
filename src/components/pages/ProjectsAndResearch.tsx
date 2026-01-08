/**
 * Объединённая страница проектов и исследований
 * Две вкладки: Проекты и Исследования
 */

import React, { useState, useMemo } from 'react';
import { Plus, Filter, FolderKanban, FlaskConical, List, LayoutGrid, Lock } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../layout/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { ProjectKanbanBoard } from '../ui/ProjectKanbanBoard';
import { ResearchKanbanBoard } from '../ui/ResearchKanbanBoard';
import { StatusBadge } from '../ui/StatusBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { Project, Research, User, ProjectStatus, ResearchStatus, Division } from '../../types';
import { 
  getProjectStatusLabel, 
  getProjectStatusColor,
  getResearchStatusLabel,
  getResearchStatusColor,
  getDivisionLabel 
} from '../../utils/helpers';
import { users } from '../../data/mockData';

interface ProjectsAndResearchProps {
  projects: Project[];
  researches: Research[];
  currentUser: User;
  onProjectClick: (projectId: string) => void;
  onResearchClick: (researchId: string) => void;
  onCreateProject: () => void;
  onCreateResearch: () => void;
  onBack?: () => void;
}

type TabType = 'projects' | 'researches';

export function ProjectsAndResearch({ 
  projects, 
  researches, 
  currentUser, 
  onProjectClick, 
  onResearchClick,
  onCreateProject,
  onCreateResearch,
  onBack 
}: ProjectsAndResearchProps) {
  // Вкладки
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  
  // Фильтры для проектов
  const [projectFilterStatus, setProjectFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [projectViewMode, setProjectViewMode] = useState<'kanban' | 'list'>('kanban');
  
  // Фильтры для исследований
  const [researchFilterStatus, setResearchFilterStatus] = useState<ResearchStatus | 'all'>('all');
  const [showOnlyWithAccess, setShowOnlyWithAccess] = useState(false);
  const [researchViewMode, setResearchViewMode] = useState<'kanban' | 'list'>('kanban');

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
    if (projectFilterStatus === 'all') return projects;
    return projects.filter(project => project.status === projectFilterStatus);
  }, [projects, projectFilterStatus]);

  /**
   * Отфильтрованные исследования
   */
  const filteredResearches = useMemo(() => {
    return researches.filter(research => {
      // Фильтр по статусу
      if (researchFilterStatus !== 'all' && research.status !== researchFilterStatus) {
        return false;
      }

      // Фильтр по открытому доступу
      if (showOnlyWithAccess && !research.access) {
        return false;
      }

      return true;
    });
  }, [researches, researchFilterStatus, showOnlyWithAccess]);

  /**
   * Группировка проектов по статусам для Kanban доски
   */
  const projectKanbanColumns = useMemo(() => {
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

  /**
   * Группировка исследований по статусам для Kanban доски
   */
  const researchKanbanColumns = useMemo(() => {
    const statusGroups = {
      draft: { id: 'draft', title: 'Черновик', color: 'bg-gray-400', researches: [] as Research[] },
      under_review: { id: 'under_review', title: 'На рассмотрении', color: 'bg-yellow-400', researches: [] as Research[] },
      rework: { id: 'rework', title: 'На доработке', color: 'bg-orange-400', researches: [] as Research[] },
      accepted: { id: 'accepted', title: 'Принято', color: 'bg-green-400', researches: [] as Research[] },
      access_granted: { id: 'access_granted', title: 'Доступ открыт', color: 'bg-blue-400', researches: [] as Research[] },
    };

    filteredResearches.forEach(research => {
      if (statusGroups[research.status]) {
        statusGroups[research.status].researches.push(research);
      }
    });

    return Object.values(statusGroups);
  }, [filteredResearches]);

  // Счётчики для вкладок
  const projectsCount = projects.length;
  const researchesCount = researches.length;

  return (
    <div>
      <PageHeader
        title="Проекты и исследования"
        description={
          activeTab === 'projects' 
            ? 'Управление пилотными проектами и партнерскими запусками'
            : 'Каталог завершенных исследований и аналитических материалов'
        }
        onBack={onBack}
        actions={
          <div className="flex items-center gap-2">
            {/* Кнопка создания */}
            <Button
              variant="primary"
              onClick={activeTab === 'projects' ? onCreateProject : onCreateResearch}
              className="gap-2"
            >
              <Plus size={18} />
              {activeTab === 'projects' ? 'Новый проект' : 'Новое исследование'}
            </Button>
          </div>
        }
      />

      {/* Вкладки */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'projects'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderKanban size={18} />
              <span>Проекты</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'projects' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {projectsCount}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('researches')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'researches'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <FlaskConical size={18} />
              <span>Исследования</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'researches' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {researchesCount}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Контент вкладки Проекты */}
      {activeTab === 'projects' && (
        <div>
          {/* Фильтры и переключатель вида */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Переключатель вида */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setProjectViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    projectViewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Kanban доска"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setProjectViewMode('list')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    projectViewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Список"
                >
                  <List size={18} />
                </button>
              </div>

              {/* Фильтр по статусу */}
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={projectFilterStatus}
                  onChange={(e) => setProjectFilterStatus(e.target.value as ProjectStatus | 'all')}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все статусы ({projects.length})</option>
                  <option value="platform_implementation">Реализация платформы ({projects.filter(p => p.status === 'platform_implementation').length})</option>
                  <option value="internal_testing">Внутренние тестирования ({projects.filter(p => p.status === 'internal_testing').length})</option>
                  <option value="agreement">Согласование условий ({projects.filter(p => p.status === 'agreement').length})</option>
                  <option value="launch">Запуск ({projects.filter(p => p.status === 'launch').length})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Отображение проектов */}
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Проекты не найдены"
              description="Попробуйте изменить фильтры или создать новый проект"
            />
          ) : projectViewMode === 'kanban' ? (
            <ProjectKanbanBoard columns={projectKanbanColumns} onProjectClick={onProjectClick} getUserById={getUserById} />
          ) : (
            <div className="space-y-3">
              {filteredProjects.map(project => {
                const author = getUserById(project.authorId);
                const creator = getUserById(project.creatorId);

                return (
                  <Card key={project.id} onClick={() => onProjectClick(project.id)} hoverable>
                    <CardBody>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {project.title}
                            </h3>
                            <StatusBadge
                              label={getProjectStatusLabel(project.status)}
                              color={getProjectStatusColor(project.status)}
                            />
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{getDivisionLabel(project.division)}</span>
                            {author && (
                              <div className="flex items-center gap-1">
                                <UserAvatar name={author.name} avatar={author.avatar} size="xs" />
                                <span>{author.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Контент вкладки Исследования */}
      {activeTab === 'researches' && (
        <div>
          {/* Фильтры и переключатель вида */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Переключатель вида */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setResearchViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    researchViewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Kanban доска"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setResearchViewMode('list')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    researchViewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Список"
                >
                  <List size={18} />
                </button>
              </div>

              {/* Фильтр по статусу */}
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={researchFilterStatus}
                  onChange={(e) => setResearchFilterStatus(e.target.value as ResearchStatus | 'all')}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все статусы ({researches.length})</option>
                  <option value="draft">Черновик ({researches.filter(r => r.status === 'draft').length})</option>
                  <option value="under_review">На рассмотрении ({researches.filter(r => r.status === 'under_review').length})</option>
                  <option value="rework">На доработке ({researches.filter(r => r.status === 'rework').length})</option>
                  <option value="accepted">Принято ({researches.filter(r => r.status === 'accepted').length})</option>
                  <option value="access_granted">Доступ открыт ({researches.filter(r => r.status === 'access_granted').length})</option>
                </select>
              </div>

              {/* Фильтр по открытому доступу */}
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyWithAccess}
                  onChange={(e) => setShowOnlyWithAccess(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Lock size={14} />
                Только с открытым доступом
              </label>
            </div>
          </div>

          {/* Отображение исследований */}
          {filteredResearches.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="Исследования не найдены"
              description="Попробуйте изменить фильтры или создать новое исследование"
            />
          ) : researchViewMode === 'kanban' ? (
            <ResearchKanbanBoard columns={researchKanbanColumns} onResearchClick={onResearchClick} getUserById={getUserById} />
          ) : (
            <div className="space-y-3">
              {filteredResearches.map(research => {
                const author = getUserById(research.authorId);
                const creator = getUserById(research.creatorId);

                return (
                  <Card key={research.id} onClick={() => onResearchClick(research.id)} hoverable>
                    <CardBody>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {research.title}
                            </h3>
                            <StatusBadge
                              label={getResearchStatusLabel(research.status)}
                              color={getResearchStatusColor(research.status)}
                            />
                            {research.access && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                Открыт доступ
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {research.summary}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{getDivisionLabel(research.division)}</span>
                            {author && (
                              <div className="flex items-center gap-1">
                                <UserAvatar name={author.name} avatar={author.avatar} size="xs" />
                                <span>{author.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
