/**
 * API Index - экспорт всех API сервисов
 */

export { default as apiClient } from './client';
export { default as authApi } from './auth';
export { default as projectsApi } from './projects';
export { default as tasksApi } from './tasks';
export { default as researchApi } from './research';
export { default as usersApi } from './users';
export { default as notificationsApi } from './notifications';
export { default as externalPackagesApi } from './externalPackages';

// Re-export types
export type { LoginCredentials, TokenResponse, UserProfile } from './auth';
export type { Project, ProjectCreate, ProjectUpdate, ProjectsListParams } from './projects';
export type { Task, TaskCreate, TaskUpdate, TasksListParams, Comment } from './tasks';
export type { Research, ResearchCreate, ResearchUpdate, ResearchListParams } from './research';
export type { User, UsersListParams } from './users';
export type { Notification, NotificationsListParams } from './notifications';
export type { ExternalPackage, ExternalPackageCreate, ExternalPackageUpdate, ExternalPackagesListParams } from './externalPackages';
