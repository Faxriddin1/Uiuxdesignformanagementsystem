// Вспомогательные функции для работы с данными

import { TaskStatus, ProjectStatus, ResearchStatus, UserRole, Division, Task, User } from '../types';

/**
 * Получить текстовое название статуса задачи
 */
export function getTaskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    under_review: 'На рассмотрении',
    rework: 'На доработке',
    accepted: 'Принято',
  };
  return labels[status];
}

/**
 * Получить цвет для статуса задачи
 */
export function getTaskStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-purple-100 text-purple-800',
    rework: 'bg-orange-100 text-orange-800',
    accepted: 'bg-green-100 text-green-800',
  };
  return colors[status];
}

/**
 * Получить текстовое название статуса проекта
 */
export function getProjectStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    platform_implementation: '1. Реализация платформы',
    internal_testing: '2. Внутренние тестирования',
    agreement: '3. Согласование условий',
    launch: '4. Запуск',
  };
  return labels[status];
}

/**
 * Получить номер статуса проекта (1-4)
 */
export function getProjectStatusNumber(status: ProjectStatus): number {
  const numbers: Record<ProjectStatus, number> = {
    platform_implementation: 1,
    internal_testing: 2,
    agreement: 3,
    launch: 4,
  };
  return numbers[status];
}

/**
 * Получить цвет для статуса проекта
 */
export function getProjectStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    platform_implementation: 'bg-blue-500',
    internal_testing: 'bg-yellow-500',
    agreement: 'bg-orange-500',
    launch: 'bg-green-500',
  };
  return colors[status];
}

/**
 * Получить текстовое название статуса исследования
 */
export function getResearchStatusLabel(status: ResearchStatus): string {
  const labels: Record<ResearchStatus, string> = {
    draft: 'Черновик',
    under_review: 'На рассмотрении',
    rework: 'На доработке',
    accepted: 'Принято',
    access_granted: 'Доступ открыт',
  };
  return labels[status];
}

/**
 * Получить цвет для статуса исследования
 */
export function getResearchStatusColor(status: ResearchStatus): string {
  const colors: Record<ResearchStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    under_review: 'bg-purple-100 text-purple-800',
    rework: 'bg-orange-100 text-orange-800',
    accepted: 'bg-green-100 text-green-800',
    access_granted: 'bg-blue-100 text-blue-800',
  };
  return colors[status];
}

/**
 * Получить текстовое название роли пользователя
 */
export function getUserRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    department_head: 'Начальник Департамента',
    management_head: 'Начальник Управления',
    division_head: 'Начальник отдела',
    employee: 'Сотрудник',
  };
  return labels[role];
}

/**
 * Получить текстовое название отдела
 */
export function getDivisionLabel(division: Division): string {
  const labels: Record<Division, string> = {
    rnd: 'Innovatsiya va R&D bo\'limi',
    it_projects: 'IT loyihalarni boshqarish va tadbiq qilish bo\'limi',
  };
  return labels[division];
}

/**
 * Проверить, просрочена ли задача
 */
export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'accepted') return false;
  return new Date(task.deadline) < new Date();
}

/**
 * Проверить, просрочено ли исследование
 */
export function isResearchOverdue(research: { deadline: Date; status: ResearchStatus }): boolean {
  if (research.status === 'accepted' || research.status === 'access_granted') return false;
  return new Date(research.deadline) < new Date();
}

/**
 * Получить количество дней до дедлайна или просрочки
 */
export function getDaysUntilDeadline(deadline: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Получить текст для индикатора дедлайна
 */
export function getDeadlineLabel(deadline: Date, status: TaskStatus): string {
  if (status === 'accepted') return 'Выполнено';
  
  const days = getDaysUntilDeadline(deadline);
  
  if (days < 0) {
    return `Просрочено на ${Math.abs(days)} дн.`;
  } else if (days === 0) {
    return 'Сегодня';
  } else if (days === 1) {
    return 'Завтра';
  } else if (days <= 3) {
    return `Через ${days} дн.`;
  } else {
    return deadline.toLocaleDateString('ru-RU');
  }
}

/**
 * Получить цвет индикатора дедлайна
 */
export function getDeadlineColor(deadline: Date, status: TaskStatus): string {
  if (status === 'accepted') return 'text-green-600';
  
  const days = getDaysUntilDeadline(deadline);
  
  if (days < 0) {
    return 'text-red-600';
  } else if (days <= 1) {
    return 'text-orange-600';
  } else if (days <= 3) {
    return 'text-yellow-600';
  } else {
    return 'text-gray-600';
  }
}

/**
 * Форматировать размер файла
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Проверить права доступа пользователя
 */
export function canUserEdit(currentUser: User, itemCreatorId?: string, itemDivision?: Division): boolean {
  // Начальник Управления может редактировать все
  if (currentUser.role === 'management_head') return true;
  
  // Начальник отдела может редактировать в своем отделе
  if (currentUser.role === 'division_head' && itemDivision === currentUser.division) return true;
  
  // Сотрудник может редактировать только свои задачи
  if (currentUser.id === itemCreatorId) return true;
  
  return false;
}

/**
 * Проверить, может ли пользователь одобрять задачи
 */
export function canUserApprove(currentUser: User): boolean {
  return currentUser.role === 'management_head' || currentUser.role === 'division_head';
}

/**
 * Получить инициалы пользователя
 */
export function getUserInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return name[0] || '?';
}

/**
 * Форматировать дату и время
 */
export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Форматировать дату
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}