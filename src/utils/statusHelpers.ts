// Утилиты для работы со статусами задач, проектов, исследований и пакетов

import { TaskStatus, ProjectStatus, ResearchStatus, ExternalPackageStatus, TaskType } from '../types';

/**
 * Получает текст статуса задачи на русском
 */
export function getTaskStatusText(status: TaskStatus, taskType?: TaskType): string {
  switch (status) {
    case 'new':
      return 'Новая';
    case 'in_progress':
      return 'В работе';
    case 'under_division_review':
      return 'На проверке (Нач. отдела)';
    case 'under_management_review':
      if (taskType === 'T1') {
        return 'На рассмотрении (Нач. Управления)';
      }
      return 'На рассмотрении (Нач. Управления)';
    case 'rework':
      return 'На доработке';
    case 'rework_withdrawn':
      return 'На доработке (отозвано)';
    case 'accepted':
      return 'Принято (Закрыто)';
    default:
      return status;
  }
}

/**
 * Получает цвет бейджа для статуса задачи
 */
export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'new':
      return 'bg-gray-100 text-gray-700';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700';
    case 'under_division_review':
      return 'bg-yellow-100 text-yellow-700';
    case 'under_management_review':
      return 'bg-orange-100 text-orange-700';
    case 'rework':
      return 'bg-red-100 text-red-700';
    case 'rework_withdrawn':
      return 'bg-purple-100 text-purple-700';
    case 'accepted':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Получает текст типа задачи на русском
 */
export function getTaskTypeText(taskType: TaskType): string {
  switch (taskType) {
    case 'T1':
      return 'Секретная';
    case 'T2':
      return 'Обычная';
    default:
      return taskType;
  }
}

/**
 * Получает цвет бейджа для типа задачи
 */
export function getTaskTypeColor(taskType: TaskType): string {
  switch (taskType) {
    case 'T1':
      return 'bg-red-100 text-red-700 border border-red-300';
    case 'T2':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Получает текст статуса проекта на русском
 */
export function getProjectStatusText(status: ProjectStatus): string {
  switch (status) {
    case 'platform_implementation':
      return '1. Реализация платформы';
    case 'internal_testing':
      return '2. Внутренние тестирования';
    case 'agreement':
      return '3. Согласование условий';
    case 'launch':
      return '4. Запуск';
    default:
      return status;
  }
}

/**
 * Получает номер этапа проекта (1-4)
 */
export function getProjectStepNumber(status: ProjectStatus): number {
  switch (status) {
    case 'platform_implementation':
      return 1;
    case 'internal_testing':
      return 2;
    case 'agreement':
      return 3;
    case 'launch':
      return 4;
    default:
      return 1;
  }
}

/**
 * Получает текст статуса исследования на русском
 */
export function getResearchStatusText(status: ResearchStatus): string {
  switch (status) {
    case 'draft':
      return 'Черновик';
    case 'under_review':
      return 'На рассмотрении';
    case 'rework':
      return 'На доработке';
    case 'accepted':
      return 'Принято';
    case 'access_granted':
      return 'Доступ открыт IT';
    default:
      return status;
  }
}

/**
 * Получает цвет бейджа для статуса исследования
 */
export function getResearchStatusColor(status: ResearchStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700';
    case 'under_review':
      return 'bg-yellow-100 text-yellow-700';
    case 'rework':
      return 'bg-red-100 text-red-700';
    case 'accepted':
      return 'bg-green-100 text-green-700';
    case 'access_granted':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Получает текст статуса внешнего пакета на русском
 */
export function getExternalPackageStatusText(status: ExternalPackageStatus): string {
  switch (status) {
    case 'draft':
      return 'Черновик';
    case 'sent':
      return 'Отправлен';
    case 'awaiting':
      return 'Ожидание ответа';
    case 'received':
      return 'Результат получен';
    case 'escalated':
      return 'Эскалация';
    default:
      return status;
  }
}

/**
 * Получает цвет бейджа для статуса внешнего пакета
 */
export function getExternalPackageStatusColor(status: ExternalPackageStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700';
    case 'sent':
      return 'bg-blue-100 text-blue-700';
    case 'awaiting':
      return 'bg-yellow-100 text-yellow-700';
    case 'received':
      return 'bg-green-100 text-green-700';
    case 'escalated':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Получает текст отдела на русском
 */
export function getDivisionText(division: 'rnd' | 'it_projects'): string {
  switch (division) {
    case 'rnd':
      return 'Отдел инноваций и R&D';
    case 'it_projects':
      return 'Отдел управления и внедрения IT проектов';
    default:
      return division;
  }
}

/**
 * Получает сокращенное название отдела
 */
export function getDivisionShortText(division: 'rnd' | 'it_projects'): string {
  switch (division) {
    case 'rnd':
      return 'R&D';
    case 'it_projects':
      return 'IT проекты';
    default:
      return division;
  }
}

/**
 * Получает текст роли на русском
 */
export function getRoleText(role: string): string {
  switch (role) {
    case 'department_head':
      return 'Начальник Департамента';
    case 'management_head':
      return 'Начальник Управления';
    case 'division_head':
      return 'Начальник отдела';
    case 'employee':
      return 'Сотрудник';
    default:
      return role;
  }
}

/**
 * Проверяет, является ли статус просроченным для задачи
 */
export function isOverdue(deadline: Date, status: TaskStatus): boolean {
  if (status === 'accepted') {
    return false; // Закрытые задачи не считаются просроченными
  }
  return new Date() > new Date(deadline);
}

/**
 * Получает количество дней до дедлайна (может быть отрицательным если просрочено)
 */
export function getDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Получает текстовое представление времени до дедлайна
 */
export function getDeadlineText(deadline: Date, status: TaskStatus): string {
  if (status === 'accepted') {
    return 'Завершено';
  }

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
    return `${days} дн.`;
  }
}

/**
 * Получает цвет для индикатора дедлайна
 */
export function getDeadlineColor(deadline: Date, status: TaskStatus): string {
  if (status === 'accepted') {
    return 'text-green-600';
  }

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
