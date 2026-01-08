// Утилиты для управления правами доступа и редактирования (RBAC + Edit Policy)

import { Task, TaskStatus, TaskType, User, UserRole, TaskEditPermissions } from '../types';

/**
 * Проверяет, имеет ли пользователь доступ к просмотру T1 задачи
 * T1 видны только участникам (создателю, исполнителю, соисполнителям) и Начальнику Управления
 */
export function canViewT1Task(task: Task, user: User): boolean {
  // T2 задачи видны всем по стандартным правилам RBAC
  if (task.taskType === 'T2') {
    return true;
  }

  // T1 задачи видны только:
  // 1. Начальнику Управления (всегда)
  if (user.role === 'management_head') {
    return true;
  }

  // 2. Создателю задачи
  if (task.creatorId === user.id) {
    return true;
  }

  // 3. Исполнителю
  if (task.assigneeId === user.id) {
    return true;
  }

  // 4. Соисполнителям
  if (task.coAssignees && task.coAssignees.includes(user.id)) {
    return true;
  }

  // Остальным - нет доступа
  return false;
}

/**
 * Проверяет, может ли пользователь создавать задачи определенного типа
 */
export function canCreateTaskType(user: User, taskType: TaskType): boolean {
  // T1 могут создавать только Начальники Управления
  if (taskType === 'T1') {
    return user.role === 'management_head';
  }

  // T2 могут создавать все
  return true;
}

/**
 * Проверяет, находится ли задача в статусе review
 */
export function isTaskUnderReview(status: TaskStatus): boolean {
  return status === 'under_division_review' || status === 'under_management_review';
}

/**
 * Проверяет, можно ли редактировать задачу в текущем статусе
 */
export function isEditableStatus(status: TaskStatus): boolean {
  return status === 'new' || status === 'in_progress' || status === 'rework' || status === 'rework_withdrawn';
}

/**
 * Получает права доступа к редактированию полей задачи для конкретного пользователя
 */
export function getTaskEditPermissions(task: Task, user: User): TaskEditPermissions {
  const isCreator = task.creatorId === user.id;
  const isAssignee = task.assigneeId === user.id || (task.coAssignees && task.coAssignees.includes(user.id));
  const isManagementHead = user.role === 'management_head';
  const isDivisionHead = user.role === 'division_head' && user.division === task.division;
  const isUnderReview = isTaskUnderReview(task.status);
  const isEditable = isEditableStatus(task.status);

  // Базовые права - никто ничего не может на review
  if (isUnderReview) {
    return {
      canEditDescription: false,
      canEditDeadline: false,
      canEditAssignee: false,
      canEditCoAssignees: false,
      canEditApprover: false,
      canEditResult: false,
      canWithdraw: canWithdrawFromReview(task, user),
    };
  }

  // В недоступных для редактирования статусах
  if (!isEditable) {
    return {
      canEditDescription: false,
      canEditDeadline: false,
      canEditAssignee: false,
      canEditCoAssignees: false,
      canEditApprover: false,
      canEditResult: false,
      canWithdraw: false,
    };
  }

  // В редактируемых статусах (new, in_progress, rework, rework_withdrawn)
  return {
    // Описание могут менять: создатель, руководители по правам
    canEditDescription: isCreator || isManagementHead || (isDivisionHead && task.taskType === 'T2'),

    // Дедлайн могут менять: создатель, Начальник Управления, Начальник отдела (в своем отделе)
    canEditDeadline: isCreator || isManagementHead || isDivisionHead,

    // Исполнителя могут менять: Начальник Управления, Начальник отдела (в своем отделе)
    canEditAssignee: isManagementHead || isDivisionHead,

    // Соисполнителей могут менять: создатель, руководители
    canEditCoAssignees: isCreator || isManagementHead || isDivisionHead,

    // Принимающего можно менять только в new/in_progress и только если это самопостановка
    canEditApprover: task.isSelfAssigned && isCreator && (task.status === 'new' || task.status === 'in_progress'),

    // Результат могут менять только исполнители в допустимых статусах
    canEditResult: isAssignee,

    canWithdraw: false,
  };
}

/**
 * Проверяет, может ли пользователь отозвать задачу с review
 */
export function canWithdrawFromReview(task: Task, user: User): boolean {
  // Отзыв возможен только со статусов review
  if (!isTaskUnderReview(task.status)) {
    return false;
  }

  const isAssignee = task.assigneeId === user.id || (task.coAssignees && task.coAssignees.includes(user.id));
  const isManagementHead = user.role === 'management_head';
  const isDivisionHead = user.role === 'division_head' && user.division === task.division;

  // Начальник Управления может отозвать с любого уровня
  if (isManagementHead) {
    return true;
  }

  // Начальник отдела может отозвать только с уровня "На проверке (Нач. отдела)"
  if (isDivisionHead && task.status === 'under_division_review') {
    return true;
  }

  // Исполнитель может отозвать свою задачу с любого уровня до вынесения решения
  if (isAssignee) {
    return true;
  }

  return false;
}

/**
 * Проверяет, может ли пользователь принимать/отклонять задачу на текущем уровне review
 */
export function canReviewTask(task: Task, user: User): boolean {
  // T1: только Начальник Управления
  if (task.taskType === 'T1') {
    return user.role === 'management_head' && task.status === 'under_management_review';
  }

  // T2: зависит от уровня
  if (task.status === 'under_division_review') {
    // На проверке у Начальника отдела
    return user.role === 'division_head' && user.division === task.division;
  }

  if (task.status === 'under_management_review') {
    // На рассмотрении у Начальника Управления
    return user.role === 'management_head';
  }

  return false;
}

/**
 * Проверяет, может ли пользователь отправить задачу на review
 */
export function canSubmitForReview(task: Task, user: User): boolean {
  // Только исполнители могут отправлять на review
  const isAssignee = task.assigneeId === user.id || (task.coAssignees && task.coAssignees.includes(user.id));
  if (!isAssignee) {
    return false;
  }

  // Можно отправить из статусов: in_progress, rework, rework_withdrawn
  return task.status === 'in_progress' || task.status === 'rework' || task.status === 'rework_withdrawn';
}

/**
 * Проверяет, есть ли у задачи обязательные вложения для отправки на review
 */
export function hasRequiredAttachments(task: Task): boolean {
  // Должен быть хотя бы один файл в текущей версии результата
  if (task.currentResultVersion && task.resultVersions && task.resultVersions.length > 0) {
    const currentVersion = task.resultVersions.find(v => v.version === task.currentResultVersion);
    return !!(currentVersion && currentVersion.attachments.length > 0);
  }
  
  // Если версий нет, проверяем основные вложения (для обратной совместимости)
  return task.attachments.length > 0;
}

/**
 * Проверяет, есть ли описание результата
 */
export function hasResultDescription(task: Task): boolean {
  if (task.currentResultVersion && task.resultVersions && task.resultVersions.length > 0) {
    const currentVersion = task.resultVersions.find(v => v.version === task.currentResultVersion);
    return !!(currentVersion && currentVersion.resultDescription && currentVersion.resultDescription.trim().length > 0);
  }
  return false;
}

/**
 * Валидирует возможность отправки на review
 */
export function validateSubmitForReview(task: Task): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!hasRequiredAttachments(task)) {
    errors.push('Необходимо приложить файлы результата');
  }

  if (!hasResultDescription(task)) {
    errors.push('Необходимо заполнить описание результата');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Определяет следующий статус при отправке на review в зависимости от типа задачи и маршрута
 */
export function getNextReviewStatus(task: Task): TaskStatus {
  // T1 всегда идет сразу к Начальнику Управления
  if (task.taskType === 'T1') {
    return 'under_management_review';
  }

  // T2 с двухступенчатым маршрутом сначала к Начальнику отдела
  if (task.approvalRoute === 'division_then_management') {
    return 'under_division_review';
  }

  // Кастомный маршрут или management_only - сразу к Начальнику Управления
  return 'under_management_review';
}

/**
 * Определяет следующий статус после одобрения на уровне Начальника отдела
 */
export function getNextStatusAfterDivisionApproval(task: Task): TaskStatus {
  // После проверки Начальника отдела T2 задача идет к Начальнику Управления
  return 'under_management_review';
}

/**
 * Получает список пользователей, которым доступны задачи в реестре (с учетом T1)
 */
export function getVisibleTasks(tasks: Task[], user: User): Task[] {
  return tasks.filter(task => canViewT1Task(task, user));
}

/**
 * Фильтрует задачи для Dashboard (без утечки метаданных T1)
 */
export function filterTasksForDashboard(tasks: Task[], user: User): Task[] {
  // Начальник Управления видит все
  if (user.role === 'management_head') {
    return tasks;
  }

  // Остальные видят только T2 + свои T1
  return tasks.filter(task => {
    if (task.taskType === 'T2') {
      return true;
    }
    return canViewT1Task(task, user);
  });
}

/**
 * Получает список доступных принимающих для самопостановки
 */
export function getAvailableApprovers(user: User, allUsers: User[]): User[] {
  // Сотрудник может выбрать:
  // 1. Начальника своего отдела
  // 2. Начальника Управления (опционально, по политике)
  
  const approvers: User[] = [];

  // Начальник отдела
  const divisionHead = allUsers.find(u => u.role === 'division_head' && u.division === user.division);
  if (divisionHead) {
    approvers.push(divisionHead);
  }

  // Начальник Управления
  const managementHead = allUsers.find(u => u.role === 'management_head');
  if (managementHead) {
    approvers.push(managementHead);
  }

  return approvers;
}
