/**
 * External Packages API - сервис для работы с внешними пакетами
 */

import apiClient from './client';

export interface ExternalPackage {
  id: string;
  title: string;
  description: string;
  recipient: string;
  channel: string;
  status: string;
  division: string;
  responsible?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  linked_task_id?: string;
  linked_project_id?: string;
  sent_at?: string;
  expected_response_date?: string;
  received_at?: string;
  escalated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalPackageCreate {
  title: string;
  description: string;
  recipient: string;
  channel: string;
  responsible_id?: string;
  division?: string;
  linked_task_id?: string;
  linked_project_id?: string;
  expected_response_date?: string;
}

export interface ExternalPackageUpdate extends Partial<ExternalPackageCreate> {
  status?: string;
  sent_at?: string;
  received_at?: string;
  escalated_at?: string;
}

export interface ExternalPackagesListParams {
  page?: number;
  page_size?: number;
  status?: string;
  division?: string;
  responsible_id?: string;
  search?: string;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const externalPackagesApi = {
  /**
   * Получить список внешних пакетов
   */
  async list(params?: ExternalPackagesListParams): Promise<PaginatedResponse<ExternalPackage>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<ExternalPackage>>(`/external-packages/${query ? `?${query}` : ''}`);
  },

  /**
   * Получить внешний пакет по ID
   */
  async get(id: string): Promise<ExternalPackage> {
    return apiClient.get<ExternalPackage>(`/external-packages/${id}/`);
  },

  /**
   * Создать внешний пакет
   */
  async create(data: ExternalPackageCreate): Promise<ExternalPackage> {
    return apiClient.post<ExternalPackage>('/external-packages/', data);
  },

  /**
   * Обновить внешний пакет
   */
  async update(id: string, data: ExternalPackageUpdate): Promise<ExternalPackage> {
    return apiClient.patch<ExternalPackage>(`/external-packages/${id}/`, data);
  },

  /**
   * Удалить внешний пакет
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/external-packages/${id}/`);
  },

  /**
   * Изменить статус пакета
   */
  async changeStatus(id: string, status: string, comment?: string): Promise<ExternalPackage> {
    return apiClient.post<ExternalPackage>(`/external-packages/${id}/change_status/`, { status, comment });
  },

  /**
   * Отправить пакет
   */
  async send(id: string, data: { sent_at?: string; notes?: string }): Promise<ExternalPackage> {
    return apiClient.post<ExternalPackage>(`/external-packages/${id}/send/`, data);
  },

  /**
   * Отметить пакет как полученный
   */
  async markReceived(id: string, data: { received_at?: string; notes?: string }): Promise<ExternalPackage> {
    return apiClient.post<ExternalPackage>(`/external-packages/${id}/mark_received/`, data);
  },

  /**
   * Эскалировать пакет
   */
  async escalate(id: string, data: { escalated_at?: string; reason?: string }): Promise<ExternalPackage> {
    return apiClient.post<ExternalPackage>(`/external-packages/${id}/escalate/`, data);
  },
};

export default externalPackagesApi;
