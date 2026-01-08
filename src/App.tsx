/**
 * Главный компонент приложения
 * Управляет навигацией и состоянием системы
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { Dashboard } from './components/pages/Dashboard';
import { Tasks } from './components/pages/Tasks';
import { TaskDetail } from './components/pages/TaskDetail';
import { ProjectsAndResearch } from './components/pages/ProjectsAndResearch';
import { ProjectDetail } from './components/pages/ProjectDetail';
import { ResearchDetail } from './components/pages/ResearchDetail';
import { ExternalPackages } from './components/pages/ExternalPackages';
import { ComponentsDemo } from './components/pages/ComponentsDemo';
import { P1ComponentsDemo } from './components/pages/P1ComponentsDemo';
import { IntegrationDemo } from './components/pages/IntegrationDemo';
import { LoginPage } from './components/pages/LoginPage';
import { RoleSwitcher } from './components/ui/RoleSwitcher';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProjects } from './hooks/useProjects';
import { useTasks } from './hooks/useTasks';
import { useResearches } from './hooks/useResearch';
import { useNotifications } from './hooks/useNotifications';
import { projectsApi, tasksApi, researchApi } from './api';
import { Task, Project, Research, User, ExternalPackage, Notification } from './types';
import { 
  currentUser as defaultUser, 
  externalPackages as initialPackages, 
  dashboardStats 
} from './data/mockData';

type Page = 'dashboard' | 'tasks' | 'projects-and-research' | 'external-packages' | 'demo' | 'p1-demo' | 'integration';

// Основной компонент приложения
function AppContent() {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // API хуки для загрузки данных
  const { projects, isLoading: projectsLoading, refetch: refetchProjects, updateProject: apiUpdateProject } = useProjects();
  const { tasks, isLoading: tasksLoading, refetch: refetchTasks, updateTask: apiUpdateTask } = useTasks();
  const { researches, isLoading: researchesLoading, refetch: refetchResearches, updateResearch: apiUpdateResearch } = useResearches();
  const { notifications: apiNotifications, markAsRead: apiMarkAsRead, markAllAsRead: apiMarkAllAsRead } = useNotifications();
  
  // Состояние текущего пользователя
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  
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
  
  // Состояние данных (для локального обновления и external packages)
  const [externalPackages, setExternalPackages] = useState<ExternalPackage[]>(initialPackages);
  
  // Конвертируем уведомления из API формата в локальный формат
  const notifications: Notification[] = apiNotifications.map(n => ({
    id: n.id,
    userId: authUser?.id || '',
    type: n.type as Notification['type'],
    title: n.title,
    message: n.message,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));
  
  // Конвертируем projects из API формата в локальный формат
  const localProjects: Project[] = projects.map(p => ({
    id: p.id,
    code: p.code,
    title: p.title,
    description: p.description,
    status: p.status as Project['status'],
    priority: p.priority as Project['priority'],
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
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
  
  // Конвертируем tasks из API формата в локальный формат
  const localTasks: Task[] = tasks.map(t => ({
    id: t.id,
    code: t.code,
    title: t.title,
    description: t.description,
    type: (t.task_type || 'execution') as Task['type'],
    status: t.status as Task['status'],
    priority: t.priority as Task['priority'],
    deadline: t.deadline,
    projectId: t.project?.id,
    project: t.project ? {
      id: t.project.id,
      code: t.project.code,
      title: t.project.title,
    } : undefined,
    createdBy: t.created_by ? {
      id: t.created_by.id,
      name: t.created_by.name,
      email: t.created_by.email,
      role: 'employee' as const,
      division: 'management' as const,
      avatar: t.created_by.avatar,
    } : currentUser,
    assignee: t.assignee ? {
      id: t.assignee.id,
      name: t.assignee.name,
      email: t.assignee.email,
      role: 'employee' as const,
      division: 'management' as const,
      avatar: t.assignee.avatar,
    } : undefined,
    coAssignees: t.co_assignees?.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: 'employee' as const,
      division: 'management' as const,
      avatar: u.avatar,
    })) || [],
    result: t.result,
    attachments: t.attachments?.map(a => ({
      id: a.id,
      fileName: a.file_name,
      fileUrl: a.file_url,
      fileSize: a.file_size,
      uploadedAt: a.uploaded_at,
    })) || [],
    commentsCount: t.comments_count || 0,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
  
  // Конвертируем researches из API формата в локальный формат
  const localResearches: Research[] = researches.map(r => ({
    id: r.id,
    code: r.code,
    title: r.title,
    description: r.description,
    status: r.status as Research['status'],
    priority: r.priority as Research['priority'],
    deadline: r.deadline,
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
      fileName: a.file_name,
      fileUrl: a.file_url,
      fileSize: a.file_size,
      uploadedAt: a.uploaded_at,
    })) || [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  
  // Состояние открытых карточек
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedResearchId, setSelectedResearchId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

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
        result: updates.result,
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
        priority: updates.priority,
        progress: updates.progress,
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
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        result: updates.result,
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
   * Создание нового проекта через API
   */
  const handleCreateProject = async () => {
    // TODO: Открыть модальное окно создания проекта
    alert('Функционал создания проекта. В полной версии здесь будет форма создания проекта.');
  };

  /**
   * Создание нового исследования через API
   */
  const handleCreateResearch = async (newResearch?: Research) => {
    if (newResearch) {
      try {
        await researchApi.create({
          title: newResearch.title,
          description: newResearch.description,
          priority: newResearch.priority,
          deadline: newResearch.deadline,
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
  const selectedPackage = selectedPackageId ? externalPackages.find(p => p.id === selectedPackageId) : null;

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
            packages={externalPackages}
            currentUser={currentUser}
            onSelectPackage={setSelectedPackageId}
            onNavigateBack={handleNavigateBack}
            onCreate={() => alert('Создание внешнего пакета. В полной версии здесь будет форма.')}
          />
        );

      case 'demo':
        return (
          <ComponentsDemo
            currentUser={currentUser}
            onNavigateBack={handleNavigateBack}
          />
        );

      case 'p1-demo':
        return (
          <P1ComponentsDemo
            currentUser={currentUser}
            onNavigateBack={handleNavigateBack}
          />
        );

      case 'integration':
        return (
          <IntegrationDemo
            currentUser={currentUser}
            onNavigateBack={handleNavigateBack}
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
    return <LoginPage onLoginSuccess={() => {}} />;
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

      {/* Переключатель роли (только для демо) */}
      <RoleSwitcher
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />
    </div>
  );
}

// Оборачиваем AppContent в AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}