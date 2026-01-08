/**
 * Users API - сервис для работы с пользователями
 */

import apiClient from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  division: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
}

export interface UsersListParams {
  page?: number;
  page_size?: number;
  role?: string;
  division?: string;
  is_active?: boolean;
  search?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const usersApi = {
  /**
   * Получить список пользователей
   */
  async list(params?: UsersListParams): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<User>>(`/users/${query ? `?${query}` : ''}`);
  },

  /**
   * Получить пользователя по ID
   */
  async get(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}/`);
  },

  /**
   * Получить список пользователей для выбора (assignee picker)
   */
  async getAssignees(): Promise<User[]> {
    const response = await this.list({ page_size: 100, is_active: true });
    return response.results;
  },
};

export default usersApi;
