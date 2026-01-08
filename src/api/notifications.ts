/**
 * Notifications API - сервис для работы с уведомлениями
 */

import apiClient from './client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface NotificationsListParams {
  page?: number;
  page_size?: number;
  is_read?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const notificationsApi = {
  /**
   * Получить список уведомлений
   */
  async list(params?: NotificationsListParams): Promise<PaginatedResponse<Notification>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<Notification>>(`/notifications/${query ? `?${query}` : ''}`);
  },

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>('/notifications/unread_count/');
  },

  /**
   * Пометить уведомление как прочитанное
   */
  async markAsRead(id: string): Promise<Notification> {
    return apiClient.post<Notification>(`/notifications/${id}/mark_read/`);
  },

  /**
   * Пометить все уведомления как прочитанные
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.post('/notifications/mark_all_read/');
  },

  /**
   * Удалить уведомление
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/notifications/${id}/`);
  },
};

export default notificationsApi;
