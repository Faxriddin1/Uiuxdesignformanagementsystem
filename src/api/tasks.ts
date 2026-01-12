/**
 * Tasks API - сервис для работы с задачами
 */

import apiClient from './client';

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  task_type: string;
  status: string;
  priority: string;
  deadline: string;
  project?: {
    id: string;
    code: string;
    title: string;
  };
  created_by: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  co_assignees: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  result?: string;
  attachments: Array<{
    id: string;
    name: string;
    file: string;
    file_type: string;
    file_size: number;
    uploaded_by: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    created_at: string;
    download_url?: string;
  }>;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  task_type?: string;
  priority?: string;
  deadline?: string;
  project_id?: string;
  assignee_id?: string;
  co_assignee_ids?: string[];
}

export interface TaskUpdate extends Partial<TaskCreate> {
  status?: string;
  result?: string;
}

export interface TasksListParams {
  page?: number;
  page_size?: number;
  status?: string;
  priority?: string;
  task_type?: string;
  project_id?: string;
  assignee_id?: string;
  created_by_id?: string;
  search?: string;
  ordering?: string;
  my_tasks?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
}

export const tasksApi = {
  /**
   * Получить список задач
   */
  async list(params?: TasksListParams): Promise<PaginatedResponse<Task>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<Task>>(`/tasks/${query ? `?${query}` : ''}`);
  },

  /**
   * Получить задачу по ID
   */
  async get(id: string): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}/`);
  },

  /**
   * Создать задачу
   */
  async create(data: TaskCreate): Promise<Task> {
    return apiClient.post<Task>('/tasks/', data);
  },

  /**
   * Обновить задачу
   */
  async update(id: string, data: TaskUpdate): Promise<Task> {
    return apiClient.patch<Task>(`/tasks/${id}/`, data);
  },

  /**
   * Удалить задачу
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/tasks/${id}/`);
  },

  /**
   * Взять задачу в работу
   */
  async take(id: string): Promise<Task> {
    return apiClient.post<Task>(`/tasks/${id}/take/`, {});
  },

  /**
   * Изменить статус задачи
   */
  async changeStatus(id: string, status: string, comment?: string): Promise<Task> {
    return apiClient.post<Task>(`/tasks/${id}/change_status/`, { status, comment });
  },

  /**
   * Отправить на рассмотрение
   */
  async submitForReview(id: string, result_description: string): Promise<Task> {
    return apiClient.post<Task>(`/tasks/${id}/submit/`, { result_description });
  },

  /**
   * Одобрить задачу
   */
  async approve(id: string, comment?: string): Promise<Task> {
    return apiClient.post<Task>(`/tasks/${id}/approve/`, { comment });
  },

  /**
   * Отклонить задачу
   */
  async reject(id: string, reason: string): Promise<Task> {
    return apiClient.post<Task>(`/tasks/${id}/reject/`, { reason });
  },

  /**
   * Отозвать задачу
   */
  async withdraw(id: string, reason?: string): Promise<Task> {
    return apiClient.post<Task>(`/tasks/${id}/withdraw/`, { reason });
  },

  /**
   * Получить комментарии к задаче
   */
  async getComments(id: string): Promise<Comment[]> {
    return apiClient.get<Comment[]>(`/tasks/${id}/comments/`);
  },

  /**
   * Добавить комментарий к задаче
   */
  async addComment(id: string, content: string): Promise<Comment> {
    return apiClient.post<Comment>(`/tasks/${id}/comments/`, { content });
  },

  /**
   * Загрузить файл к задаче
   */
  async uploadAttachment(id: string, file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.request(`/tasks/${id}/attachments/`, {
      method: 'POST',
      headers: {},
      body: formData,
    });
  },

  /**
   * Удалить вложение
   */
  async deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
    return apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}/`);
  },

  /**
   * Получить историю изменений задачи
   */
  async getHistory(id: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/tasks/${id}/history/`);
  },
};

export default tasksApi;
