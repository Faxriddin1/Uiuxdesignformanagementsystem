// Типы данных для системы управления задачами и проектами

/**
 * Роли пользователей в системе
 */
export type UserRole = 
  | 'department_head'      // Начальник Департамента
  | 'management_head'      // Начальник Управления
  | 'division_head'        // Начальник отдела
  | 'employee';            // Сотрудник

/**
 * Отделы в управлении
 */
export type Division = 'rnd' | 'it_projects';

/**
 * Категории задач для внешних запросов
 */
export type TaskCategory = 
  | 'standard'                    // Обычные задачи
  | 'external_org'                // Вопросы на сторонней организации
  | 'external_branch'             // Вопросы на сторонней филиала
  | 'external_management';        // Вопросы на сторонней руководителя

/**
 * Типы задач (T1/T2) согласно ТЗ
 */
export type TaskType = 
  | 'T1'  // Секретная (Confidential) - только Начальник Управления
  | 'T2'; // Обычная (Standard) - двухступенчатая приемка

/**
 * Статусы задачи (расширенные для двухуровневой приемки)
 */
export type TaskStatus = 
  | 'new'                        // Новая
  | 'in_progress'                // В работе
  | 'under_division_review'      // На проверке (Нач. отдела) - только T2
  | 'under_management_review'    // На рассмотрении (Нач. Управления)
  | 'rework'                     // На доработке (от проверяющего)
  | 'rework_withdrawn'           // На доработке (отозвано исполнителем)
  | 'accepted';                  // Принято (Закрыто)

/**
 * Маршрут приемки задачи
 */
export type ApprovalRoute = 
  | 'management_only'            // Только Начальник Управления (T1)
  | 'division_then_management'   // Начальник отдела → Начальник Управления (T2)
  | 'custom';                    // Кастомный маршрут (для самопостановки)

/**
 * Приоритеты задачи
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Статусы внешнего пакета
 */
export type ExternalPackageStatus = 
  | 'draft'           // Черновик
  | 'sent'            // Отправлен
  | 'awaiting'        // Ожидание ответа
  | 'received'        // Результат получен
  | 'escalated';      // Эскалация

/**
 * Статусы проекта (фиксированные 1-4)
 */
export type ProjectStatus = 
  | 'platform_implementation'  // 1. Реализация платформы
  | 'internal_testing'         // 2. Внутренние тестирования
  | 'agreement'                // 3. Согласование условий
  | 'launch';                  // 4. Запуск

/**
 * Статусы исследования
 */
export type ResearchStatus = 
  | 'draft'            // Черновик
  | 'under_review'     // На рассмотрении
  | 'rework'           // На доработке
  | 'accepted'         // Принято
  | 'access_granted';  // Доступ открыт

/**
 * Уровни доступа
 */
export type AccessLevel = 'read_only' | 'copy_to_project';

/**
 * Пользователь системы
 */
export interface User {
  id: string;
  name: string;
  role: UserRole;
  division: Division;
  email: string;
  avatar?: string;
}

/**
 * Вложение/Артефакт
 */
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/**
 * Комментарий
 */
export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: Date;
  isReturnReason?: boolean; // Является ли комментарий причиной возврата
  mentions?: string[];      // ID упомянутых пользователей (@mentions)
}

/**
 * История изменений
 */
export interface HistoryEntry {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
}

/**
 * Версия результата задачи
 */
export interface ResultVersion {
  version: number;                // Номер версии (1, 2, 3...)
  resultDescription: string;      // Описание результата
  attachments: Attachment[];      // Вложения версии
  submittedBy: string;            // Кто отправил
  submittedAt: Date;              // Когда отправлено
  status: 'current' | 'withdrawn' | 'rejected'; // Статус версии
  withdrawReason?: string;        // Причина отзыва (если отозвано)
  rejectionReason?: string;       // Причина возврата (если отклонено)
}

/**
 * Задача
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;                  // T1 или T2
  division: Division;
  assigneeId: string;                  // Основной исполнитель
  coAssignees?: string[];              // Соисполнители
  creatorId: string;
  status: TaskStatus;
  priority?: TaskPriority;
  deadline: Date;
  approvalRoute: ApprovalRoute;        // Маршрут приемки
  customApprover?: string;             // Кастомный принимающий (для самопостановки)
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
  comments: Comment[];
  history: HistoryEntry[];
  resultVersions?: ResultVersion[];    // Версии результата
  currentResultVersion?: number;       // Номер текущей версии результата
  isSelfAssigned?: boolean;            // Флаг самопостановки
  category?: TaskCategory;             // Категория задачи для внешних запросов
}

/**
 * Доступ к исследованию
 */
export interface ResearchAccess {
  division?: Division;
  userIds?: string[];
  accessLevel: AccessLevel;
  grantedAt: Date;
  grantedBy: string;
  revokedAt?: Date;                    // Дата закрытия доступа
  revokedBy?: string;                  // Кто закрыл доступ
  revocationReason?: string;           // Причина закрытия доступа
}

/**
 * Исследование R&D
 */
export interface Research {
  id: string;
  title: string;
  summary: string;           // Резюме
  sources: string[];         // Источники
  comparison?: string;       // Сравнение вариантов
  recommendations: string;   // Рекомендации
  division: Division;
  authorId: string;
  creatorId: string;
  status: ResearchStatus;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
  comments: Comment[];
  history: HistoryEntry[];
  access?: ResearchAccess;   // Управление доступом
  linkedProjectIds?: string[]; // Связанные проекты
}

/**
 * Журнал событий внешнего пакета
 */
export interface PackageLogEntry {
  id: string;
  action: string;            // Действие (отправлен, напоминание, получен ответ...)
  description: string;       // Описание
  performedBy: string;       // Кто выполнил
  timestamp: Date;           // Когда
}

/**
 * Внешний пакет (для трекинга внешних зависимостей)
 */
export interface ExternalPackage {
  id: string;
  title: string;             // Название пакета
  description: string;       // Описание
  recipient: string;         // Адресат (внешний контрагент/департамент)
  channel: string;           // Канал отправки (email, СЭД, курьер...)
  status: ExternalPackageStatus;
  division: Division;        // Отдел-отправитель
  responsibleId: string;     // Ответственный за пакет
  creatorId: string;         // Создатель
  linkedTaskId?: string;     // Связанная задача
  linkedProjectId?: string;  // Связанный проект
  attachments: Attachment[]; // Документы в пакете
  sentAt?: Date;             // Дата отправки
  expectedResponseDate?: Date; // Ожидаемая дата ответа
  receivedAt?: Date;         // Дата получения ответа
  escalatedAt?: Date;        // Дата эскалации
  createdAt: Date;
  updatedAt: Date;
  log: PackageLogEntry[];    // Журнал событий
  comments: Comment[];       // Комментарии
}

/**
 * Проект (пилот/внедрение)
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  division: Division;
  responsibleId: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  attachments: Attachment[];
  risks?: string[];
  linkedResearchId?: string; // Связанное исследование
  history: HistoryEntry[];
  reportGenerated?: boolean;  // Флаг "Справка сформирована"
  lastReportDate?: Date;      // Дата последней справки
}

/**
 * Статистика для Dashboard
 */
export interface DashboardStats {
  overdue: number;           // Просроченные
  onTime: number;            // Выполнено в срок
  inProgress: number;        // В работе
  underReview: number;       // На рассмотрении
  byEmployee: {
    employeeId: string;
    total: number;
    overdue: number;
    completed: number;
  }[];
}

/**
 * Права доступа на редактирование полей задачи
 */
export interface TaskEditPermissions {
  canEditDescription: boolean;
  canEditDeadline: boolean;
  canEditAssignee: boolean;
  canEditCoAssignees: boolean;
  canEditApprover: boolean;
  canEditResult: boolean;
  canWithdraw: boolean;        // Может ли отозвать с review
}

/**
 * Типы уведомлений
 */
export type NotificationType = 
  | 'task_assigned'          // Назначена задача
  | 'task_returned'          // Задача возвращена на доработку
  | 'task_approved'          // Задача одобрена
  | 'deadline_approaching'   // Приближается дедлайн
  | 'deadline_overdue'       // Дедлайн просрочен
  | 'mention'                // Упоминание в комментарии
  | 'review_required'        // Требуется проверка
  | 'comment_added';         // Добавлен комментарий

/**
 * Уведомление
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;            // Кому адресовано
  relatedTaskId?: string;    // Связанная задача
  relatedProjectId?: string; // Связанный проект
  relatedResearchId?: string;// Связанное исследование
  relatedCommentId?: string; // Связанный комментарий
  actionUrl?: string;        // URL для перехода
  isRead: boolean;
  createdAt: Date;
  createdBy?: string;        // Кто создал уведомление
}

/**
 * Сохраненное представление (фильтр)
 */
export interface SavedView {
  id: string;
  name: string;
  description?: string;
  userId: string;            // Владелец представления
  isShared: boolean;         // Доступно ли другим
  filters: {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    assigneeId?: string[];
    division?: Division[];
    taskType?: TaskType[];
    search?: string;
  };
  sortBy?: 'deadline' | 'createdAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Изменение поля (для diff-view)
 */
export interface FieldChange {
  fieldName: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
}