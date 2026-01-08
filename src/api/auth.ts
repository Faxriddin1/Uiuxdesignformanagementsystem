/**
 * Auth API - сервис аутентификации
 */

import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  division: string;
  avatar?: string;
}

export const authApi = {
  /**
   * Логин пользователя
   */
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    const tokens = await apiClient.post<TokenResponse>('/auth/login/', credentials, {
      skipAuth: true,
    });
    
    apiClient.setTokens(tokens.access, tokens.refresh);
    
    // Получаем профиль пользователя после логина
    return this.getProfile();
  },

  /**
   * Выход пользователя
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout/');
    } catch {
      // Игнорируем ошибки при логауте
    } finally {
      apiClient.clearTokens();
    }
  },

  /**
   * Получить профиль текущего пользователя
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/auth/me/');
  },

  /**
   * Проверить, авторизован ли пользователь
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  },

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/auth/me/', data);
  },

  /**
   * Сменить пароль
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return apiClient.post('/auth/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};

export default authApi;
