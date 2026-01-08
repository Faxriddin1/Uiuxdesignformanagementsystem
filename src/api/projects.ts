/**
 * Projects API - сервис для работы с проектами
 */

import apiClient from './client';

export interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  deadline: string;
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
  tasks_count: number;
  completed_tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  title: string;
  description?: string;
  priority?: string;
  deadline?: string;
  assignee_id?: string;
  co_assignee_ids?: string[];
}

export interface ProjectUpdate extends Partial<ProjectCreate> {
  status?: string;
  progress?: number;
}

export interface ProjectsListParams {
  page?: number;
  page_size?: number;
  status?: string;
  priority?: string;
  assignee_id?: string;
  search?: string;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const projectsApi = {
  /**
   * Получить список проектов
   */
  async list(params?: ProjectsListParams): Promise<PaginatedResponse<Project>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<Project>>(`/projects/${query ? `?${query}` : ''}`);
  },

  /**
   * Получить проект по ID
   */
  async get(id: string): Promise<Project> {
    return apiClient.get<Project>(`/projects/${id}/`);
  },

  /**
   * Создать проект
   */
  async create(data: ProjectCreate): Promise<Project> {
    return apiClient.post<Project>('/projects/', data);
  },

  /**
   * Обновить проект
   */
  async update(id: string, data: ProjectUpdate): Promise<Project> {
    return apiClient.patch<Project>(`/projects/${id}/`, data);
  },

  /**
   * Удалить проект
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/projects/${id}/`);
  },

  /**
   * Изменить статус проекта
   */
  async changeStatus(id: string, status: string, comment?: string): Promise<Project> {
    return apiClient.post<Project>(`/projects/${id}/change_status/`, { status, comment });
  },

  /**
   * Получить задачи проекта
   */
  async getTasks(id: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/projects/${id}/tasks/`);
  },

  /**
   * Получить историю изменений проекта
   */
  async getHistory(id: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/projects/${id}/history/`);
  },
};

export default projectsApi;
