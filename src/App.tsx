/**
 * Главный компонент приложения
 * Управляет навигацией и состоянием системы
 */

import React, { useState, useEffect } from 'react';
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
import { Task, Project, Research, User, ExternalPackage, Notification } from './types';
import { 
  currentUser as defaultUser, 
  tasks as initialTasks, 
  projects as initialProjects, 
  researches as initialResearches, 
  externalPackages as initialPackages, 
  dashboardStats,
  notifications as initialNotifications 
} from './data/mockData';

type Page = 'dashboard' | 'tasks' | 'projects-and-research' | 'external-packages' | 'demo' | 'p1-demo' | 'integration';

// Основной компонент приложения
function AppContent() {
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  
  // Состояние текущего пользователя (для демо можно переключать)
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  
  // Состояние текущей страницы
  const [currentPage, setCurrentPage] = useState<Page>('projects-and-research');
  
  // Состояние данных
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [researches, setResearches] = useState<Research[]>(initialResearches);
  const [externalPackages, setExternalPackages] = useState<ExternalPackage[]>(initialPackages);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  
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
   * Обновление задачи
   */
  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  /**
   * Обновление проекта
   */
  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(projects.map(project =>
      project.id === projectId ? { ...project, ...updates } : project
    ));
  };

  /**
   * Обновление исследования
   */
  const handleUpdateResearch = (researchId: string, updates: Partial<Research>) => {
    setResearches(researches.map(research =>
      research.id === researchId ? { ...research, ...updates } : research
    ));
  };

  /**
   * Создание новой задачи
   */
  const handleCreateTask = () => {
    alert('Функционал создания задачи. В полной версии здесь будет форма создания задачи.');
  };

  /**
   * Создание нового проекта
   */
  const handleCreateProject = () => {
    alert('Функционал создания проекта. В полной версии здесь будет форма создания проекта.');
  };

  /**
   * Создание нового исследования
   */
  const handleCreateResearch = (newResearch?: Research) => {
    if (newResearch) {
      setResearches([newResearch, ...researches]);
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
   * Пометить уведомление как прочитанное
   */
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  /**
   * Пометить все уведомления как прочитанные
   */
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => 
      n.userId === currentUser.id ? { ...n, isRead: true } : n
    ));
  };

  // Получение выбранных объектов
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  const selectedResearch = selectedResearchId ? researches.find(r => r.id === selectedResearchId) : null;
  const selectedPackage = selectedPackageId ? externalPackages.find(p => p.id === selectedPackageId) : null;

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
            tasks={tasks}
            currentUser={currentUser}
            onTaskClick={setSelectedTaskId}
            onBack={handleNavigateBack}
          />
        );

      case 'projects-and-research':
        return (
          <ProjectsAndResearch
            projects={projects}
            researches={researches}
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
  if (isLoading) {
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
            {renderCurrentPage()}
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