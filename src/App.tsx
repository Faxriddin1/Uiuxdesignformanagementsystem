/**
 * Главный компонент приложения
 * Управляет навигацией и состоянием системы
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { Dashboard } from './components/pages/Dashboard';
import { Tasks } from './components/pages/Tasks';
import { TaskDetail } from './components/pages/TaskDetail';
import { ProjectsAndResearch } from './components/pages/ProjectsAndResearch';
import { ProjectDetail } from './components/pages/ProjectDetail';
import { ResearchDetail } from './components/pages/ResearchDetail';
import { ExternalPackages } from './components/pages/ExternalPackages';
import { LoginPage } from './components/pages/LoginPage';
import { CreateProjectDialog } from './components/CreateProjectDialog';
import { CreateExternalPackageDialog } from './components/CreateExternalPackageDialog';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProjects } from './hooks/useProjects';
import { useTasks } from './hooks/useTasks';
import { useResearches } from './hooks/useResearch';
import { useExternalPackages } from './hooks/useExternalPackages';
import { useNotifications } from './hooks/useNotifications';
import { projectsApi, tasksApi, researchApi, externalPackagesApi } from './api';
import { Task, Project, Research, User, ExternalPackage, Notification } from './types';
import { isTaskOverdue } from './utils/helpers';

type Page = 'dashboard' | 'tasks' | 'projects-and-research' | 'external-packages';

// Основной компонент приложения
function AppContent() {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  // API хуки для загрузки данных
  const { projects, isLoading: projectsLoading, refetch: refetchProjects, updateProject: apiUpdateProject } = useProjects();
  const { tasks, isLoading: tasksLoading, refetch: refetchTasks, updateTask: apiUpdateTask } = useTasks();
  const { researches, isLoading: researchesLoading, refetch: refetchResearches, updateResearch: apiUpdateResearch } = useResearches();
  const { packages, isLoading: packagesLoading, refetch: refetchPackages, createPackage } = useExternalPackages();
  const { notifications: apiNotifications, markAsRead: apiMarkAsRead, markAllAsRead: apiMarkAllAsRead } = useNotifications();

  // Состояние текущего пользователя
  const [currentUser, setCurrentUser] = useState<User>({
    id: '',
    name: '',
    email: '',
    role: 'employee',
    division: 'rnd',
  });

  // Обновляем currentUser когда authUser загружается
  useEffect(() => {
    if (authUser) {
      setCurrentUser({
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role as User['role'],
        division: authUser.division as User['division'],
        avatar: authUser.avatar,
      });
    }
  }, [authUser]);

  // Состояние текущей страницы
  const [currentPage, setCurrentPage] = useState<Page>('projects-and-research');

  // Внешние пакеты загружаются из API через useExternalPackages

  // Конвертируем уведомления из API формата в локальный формат
  const notifications: Notification[] = apiNotifications.map(n => ({
    id: n.id,
    userId: authUser?.id || '',
    type: n.type as Notification['type'],
    title: n.title,
    message: n.message,
    isRead: n.is_read,
    createdAt: new Date(n.created_at),
  }));

  // Конвертируем projects из API формата в локальный формат
  const localProjects: Project[] = projects.map(p => ({
    id: p.id,
    code: p.code,
    title: p.title,
    description: p.description,
    status: p.status as Project['status'],
    // priority removed
    progress: p.progress,
    deadline: p.deadline,
    createdBy: p.created_by ? {
      id: p.created_by.id,
      name: p.created_by.name,
      email: p.created_by.email,
      role: 'employee' as const,
      division: 'management' as const,
      avatar: p.created_by.avatar,
    } : currentUser,
    assignee: p.assignee ? {
      id: p.assignee.id,
      name: p.assignee.name,
      email: p.assignee.email,
      role: 'employee' as const,
      division: 'management' as const,
      avatar: p.assignee.avatar,
    } : undefined,
    coAssignees: p.co_assignees?.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: 'employee' as const,
      division: 'management' as const,
      avatar: u.avatar,
    })) || [],
    tasksCount: p.tasks_count || 0,
    completedTasksCount: p.completed_tasks_count || 0,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
    division: 'rnd', // Default fallback
    responsibleId: p.assignee?.id || '',
    creatorId: p.created_by?.id || '',
    attachments: [],
    history: [],
    risks: [],
  }));

  // Конвертируем tasks из API формата в локальный формат
  const localTasks: Task[] = tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    taskType: (t.task_type === 'T1' ? 'T1' : 'T2') as Task['taskType'],
    division: 'rnd' as Task['division'],
    assigneeId: t.assignee?.id || '',
    coAssignees: t.co_assignees?.map(u => u.id) || [],
    creatorId: t.created_by?.id || '',
    creator: t.created_by ? {
      id: t.created_by.id,
      name: t.created_by.name,
      email: t.created_by.email,
      avatar: t.created_by.avatar,
      role: 'employee', // Default fallback
      division: 'rnd'   // Default fallback
    } : undefined,
    status: t.status as Task['status'],
    priority: (t.priority || 'medium') as Task['priority'],
    deadline: new Date(t.deadline),
    approvalRoute: 'division_then_management' as Task['approvalRoute'],
    createdAt: new Date(t.created_at),
    updatedAt: new Date(t.updated_at),
    attachments: t.attachments?.map(a => ({
      id: a.id,
      name: a.name,
      type: a.file_type || 'unknown',
      url: a.download_url || a.file,
      size: a.file_size,
      uploadedBy: a.uploaded_by?.name || 'Unknown',
      uploadedAt: new Date(a.created_at),
    })) || [],
    comments: [],
    history: [],
    category: 'standard' as Task['category'],
  }));

  // Статистика Dashboard из задач (без демо-данных)
  const dashboardStats = {
    overdue: localTasks.filter(isTaskOverdue).length,
    onTime: localTasks.filter(t => t.status === 'accepted').length,
    inProgress: localTasks.filter(t => t.status === 'in_progress').length,
    underReview: localTasks.filter(t => t.status === 'under_division_review' || t.status === 'under_management_review').length,
    byEmployee: Object.values(
      localTasks.reduce<Record<string, { employeeId: string; total: number; overdue: number; completed: number }>>((acc, t) => {
        const key = t.assigneeId || 'unknown';
        if (!acc[key]) acc[key] = { employeeId: key, total: 0, overdue: 0, completed: 0 };
        acc[key].total += 1;
        if (isTaskOverdue(t)) acc[key].overdue += 1;
        if (t.status === 'accepted') acc[key].completed += 1;
        return acc;
      }, {})
    ),
  };

  // Конвертируем researches из API формата в локальный формат
  const localResearches: Research[] = researches.map(r => ({
    id: r.id,
    code: r.code,
    title: r.title,
    // description removed (mapped to summary below)
    status: r.status as Research['status'],
    // priority removed (not in Research type)
    deadline: new Date(r.deadline),
    createdBy: r.created_by ? {
      id: r.created_by.id,
      name: r.created_by.name,
      email: r.created_by.email,
      role: 'employee' as const,
      division: 'management' as const,
      avatar: r.created_by.avatar,
    } : currentUser,
    assignee: r.assignee ? {
      id: r.assignee.id,
      name: r.assignee.name,
      email: r.assignee.email,
      role: 'employee' as const,
      division: 'management' as const,
      avatar: r.assignee.avatar,
    } : undefined,
    coAssignees: r.co_assignees?.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: 'employee' as const,
      division: 'management' as const,
      avatar: u.avatar,
    })) || [],
    result: r.result,
    attachments: r.attachments?.map(a => ({
      id: a.id,
      name: a.file_name,
      type: 'unknown',
      url: a.file_url,
      size: a.file_size,
      uploadedBy: 'Unknown',
      uploadedAt: new Date(a.uploaded_at),
    })) || [],
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    summary: r.description || '', // Map API description to local summary
    sources: [],
    recommendations: r.result || '', // Map API result to local recommendations
    division: 'rnd',
    authorId: r.assignee?.id || '',
    creatorId: r.created_by?.id || '',
    comments: [],
    history: [],
    access: { accessLevel: 'read_only', grantedAt: new Date(), grantedBy: '' },
  }));

  // Состояние открытых карточек
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedResearchId, setSelectedResearchId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  // Состояние диалогов создания
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isCreatePackageDialogOpen, setIsCreatePackageDialogOpen] = useState(false);

  /**
   * Навигация между страницами
   */
  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  /**
   * Навигация назад на Dashboard
   */
  const handleNavigateBack = () => {
    setCurrentPage('dashboard');
  };

  /**
   * Навигация на страницу задач с фильтром
   */
  const handleNavigateToTasks = (filter?: string) => {
    setCurrentPage('tasks');
    // В реальном приложении здесь бы применялся фильтр
  };

  /**
   * Обновление задачи через API
   */
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await tasksApi.update(taskId, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        result: updates.resultDescription,
      });
      await refetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  /**
   * Обновление проекта через API
   */
  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await projectsApi.update(projectId, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        // priority not in UpdateProjectDto
        // progress not in UpdateProjectDto
      });
      await refetchProjects();
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  /**
   * Обновление исследования через API
   */
  const handleUpdateResearch = async (researchId: string, updates: Partial<Research>) => {
    try {
      await researchApi.update(researchId, {
        title: updates.title,
        description: updates.summary,
        status: updates.status,
        // priority not in Research
        result: updates.recommendations,
      });
      await refetchResearches();
    } catch (error) {
      console.error('Failed to update research:', error);
    }
  };

  /**
   * Создание новой задачи через API
   */
  const handleCreateTask = async () => {
    // TODO: Открыть модальное окно создания задачи
    alert('Функционал создания задачи. В полной версии здесь будет форма создания задачи.');
  };

  /**
   * Открыть диалог создания проекта
   */
  const handleCreateProject = () => {
    setIsCreateProjectDialogOpen(true);
  };

  /**
   * Создание нового проекта через API
   */
  const handleSubmitCreateProject = async (data: any) => {
    try {
      await projectsApi.create(data);
      await refetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  /**
   * Создание нового исследования через API
   */
  const handleCreateResearch = async (newResearch?: Research) => {
    if (newResearch) {
      try {
        await researchApi.create({
          title: newResearch.title,
          description: newResearch.summary,
          // priority removed
          deadline: newResearch.deadline.toISOString(),
        });
        await refetchResearches();
      } catch (error) {
        console.error('Failed to create research:', error);
      }
    }
  };

  /**
   * Создать проект на основе исследования
   */
  const handleCreateProjectFromResearch = (researchId: string) => {
    alert(`Создание проекта на основе исследования ${researchId}. В полной версии здесь будет форма создания проекта с предзаполненными данными из исследования.`);
    setSelectedResearchId(null);
    setCurrentPage('projects-and-research');
  };

  /**
   * Открыть диалог создания внешнего пакета
   */
  const handleCreatePackage = () => {
    setIsCreatePackageDialogOpen(true);
  };

  /**
   * Создание нового внешнего пакета
   */
  const handleSubmitCreatePackage = async (data: any) => {
    try {
      await createPackage(data);
      await refetchPackages();
    } catch (error) {
      console.error('Failed to create external package:', error);
      throw error;
    }
  };

  /**
   * Просмотр исследования из карточки проекта
   */
  const handleViewResearch = (researchId: string) => {
    setSelectedProjectId(null);
    setSelectedResearchId(researchId);
  };

  /**
   * Обработка клика по уведомлению
   */
  const handleNotificationClick = (notification: Notification) => {
    // Навигация к объекту уведомления
    if (notification.relatedTaskId) {
      setSelectedTaskId(notification.relatedTaskId);
    } else if (notification.relatedProjectId) {
      setSelectedProjectId(notification.relatedProjectId);
    } else if (notification.relatedResearchId) {
      setSelectedResearchId(notification.relatedResearchId);
    }
  };

  /**
   * Пометить уведомление как прочитанное через API
   */
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiMarkAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  /**
   * Пометить все уведомления как прочитанные через API
   */
  const handleMarkAllAsRead = async () => {
    try {
      await apiMarkAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Получение выбранных объектов
  const selectedTask = selectedTaskId ? localTasks.find(t => t.id === selectedTaskId) : null;
  const selectedProject = selectedProjectId ? localProjects.find(p => p.id === selectedProjectId) : null;
  const selectedResearch = selectedResearchId ? localResearches.find(r => r.id === selectedResearchId) : null;
  const selectedPackage = selectedPackageId ? packages.find(p => p.id === selectedPackageId) : null;

  // Общее состояние загрузки
  const isDataLoading = projectsLoading || tasksLoading || researchesLoading;

  /**
   * Рендеринг текущей страницы
   */
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            stats={dashboardStats}
            onNavigateToTasks={handleNavigateToTasks}
            currentUser={currentUser}
          />
        );

      case 'tasks':
        return (
          <Tasks
            tasks={localTasks}
            currentUser={currentUser}
            onTaskClick={setSelectedTaskId}
            onBack={handleNavigateBack}
          />
        );

      case 'projects-and-research':
        return (
          <ProjectsAndResearch
            projects={localProjects}
            researches={localResearches}
            currentUser={currentUser}
            onProjectClick={setSelectedProjectId}
            onResearchClick={setSelectedResearchId}
            onCreateProject={handleCreateProject}
            onCreateResearch={() => handleCreateResearch()}
            onBack={handleNavigateBack}
          />
        );

      case 'external-packages':
        return (
          <ExternalPackages
            packages={packages}
            currentUser={currentUser}
            onSelectPackage={setSelectedPackageId}
            onNavigateBack={handleNavigateBack}
            onCreate={handleCreatePackage}
          />
        );

      default:
        return <Dashboard stats={dashboardStats} onNavigateToTasks={handleNavigateToTasks} currentUser={currentUser} />;
    }
  };

  // Показываем загрузку при проверке авторизации
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Показываем страницу логина, если не авторизован
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => { }} />;
  }

  return (
    <div className="flex h-screen bg-[#F7F9FC]">
      {/* Боковая навигация */}
      <Sidebar
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      {/* Основная область с хедером и контентом */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Верхний хедер */}
        <TopHeader
          currentUser={currentUser}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />

        {/* Основной контент */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {isDataLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Загрузка данных...</p>
                </div>
              </div>
            ) : (
              renderCurrentPage()
            )}
          </div>
        </main>
      </div>

      {/* Модальное окно задачи */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          currentUser={currentUser}
          onClose={() => setSelectedTaskId(null)}
          onUpdateTask={handleUpdateTask}
        />
      )}

      {/* Модальное окно проекта */}
      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          currentUser={currentUser}
          onClose={() => setSelectedProjectId(null)}
          onUpdateProject={handleUpdateProject}
          onViewResearch={handleViewResearch}
        />
      )}

      {/* Модальное окно исследования */}
      {selectedResearch && (
        <ResearchDetail
          research={selectedResearch}
          currentUser={currentUser}
          onClose={() => setSelectedResearchId(null)}
          onUpdateResearch={handleUpdateResearch}
          onCreateProject={handleCreateProjectFromResearch}
        />
      )}

      {/* Диалог создания проекта */}
      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        currentUser={currentUser}
        onSubmit={handleSubmitCreateProject}
      />

      {/* Диалог создания внешнего пакета */}
      <CreateExternalPackageDialog
        open={isCreatePackageDialogOpen}
        onOpenChange={setIsCreatePackageDialogOpen}
        currentUser={currentUser}
        onSubmit={handleSubmitCreatePackage}
      />
    </div>
  );
}

// Оборачиваем AppContent в AuthProvider и ErrorBoundary
export default function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // В production здесь можно отправлять в Sentry
        console.error('App Error:', error, errorInfo);
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}