/**
 * Research API - сервис для работы с исследованиями
 */

import apiClient from './client';

export interface Research {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  priority: string;
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
  result?: string;
  attachments: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    uploaded_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ResearchCreate {
  title: string;
  description?: string;
  priority?: string;
  deadline?: string;
  assignee_id?: string;
  co_assignee_ids?: string[];
}

export interface ResearchUpdate extends Partial<ResearchCreate> {
  status?: string;
  result?: string;
}

export interface ResearchListParams {
  page?: number;
  page_size?: number;
  status?: string;
  priority?: string;
  assignee_id?: string;
  created_by_id?: string;
  search?: string;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const researchApi = {
  /**
   * Получить список исследований
   */
  async list(params?: ResearchListParams): Promise<PaginatedResponse<Research>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<Research>>(`/researches/${query ? `?${query}` : ''}`);
  },

  /**
   * Получить исследование по ID
   */
  async get(id: string): Promise<Research> {
    return apiClient.get<Research>(`/researches/${id}/`);
  },

  /**
   * Создать исследование
   */
  async create(data: ResearchCreate): Promise<Research> {
    return apiClient.post<Research>('/researches/', data);
  },

  /**
   * Обновить исследование
   */
  async update(id: string, data: ResearchUpdate): Promise<Research> {
    return apiClient.patch<Research>(`/researches/${id}/`, data);
  },

  /**
   * Удалить исследование
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/researches/${id}/`);
  },

  /**
   * Изменить статус исследования
   */
  async changeStatus(id: string, status: string, comment?: string): Promise<Research> {
    return apiClient.post<Research>(`/researches/${id}/change_status/`, { status, comment });
  },

  /**
   * Отправить на рассмотрение
   */
  async submitForReview(id: string, result: string): Promise<Research> {
    return apiClient.post<Research>(`/researches/${id}/submit_for_review/`, { result });
  },

  /**
   * Одобрить исследование
   */
  async approve(id: string, comment?: string): Promise<Research> {
    return apiClient.post<Research>(`/researches/${id}/approve/`, { comment });
  },

  /**
   * Отклонить исследование
   */
  async reject(id: string, reason: string): Promise<Research> {
    return apiClient.post<Research>(`/researches/${id}/reject/`, { reason });
  },

  /**
   * Получить историю изменений
   */
  async getHistory(id: string): Promise<unknown[]> {
    return apiClient.get<unknown[]>(`/researches/${id}/history/`);
  },
};

export default researchApi;
