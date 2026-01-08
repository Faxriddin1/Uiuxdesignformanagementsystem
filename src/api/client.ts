/**
 * API Client - HTTP клиент для работы с backend
 */

// При использовании Vite proxy используем относительный путь
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadTokens();
  }

  private loadTokens(): void {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        localStorage.setItem('accessToken', data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, headers = {}, ...restOptions } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers as Record<string, string>,
    };

    if (!skipAuth && this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...restOptions,
      headers: requestHeaders,
    });

    // Если получили 401, пробуем обновить токен
    if (response.status === 401 && !skipAuth && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...restOptions,
          headers: requestHeaders,
        });
      } else {
        throw new Error('SESSION_EXPIRED');
      }
    }

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        message: `HTTP Error: ${response.status}`,
      }));
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    // Для 204 No Content возвращаем пустой объект
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Удобные методы
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Экспортируем singleton
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
