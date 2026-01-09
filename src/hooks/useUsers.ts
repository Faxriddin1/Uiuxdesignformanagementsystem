/**
 * Хук для загрузки и кэширования пользователей из API
 */

import { useState, useEffect } from 'react';
import { usersApi, User as ApiUser } from '../api/users';
import { User } from '../types';

// Глобальный кэш пользователей
let cachedUsers: User[] = [];
let isLoading = false;
let loadPromise: Promise<User[]> | null = null;

/**
 * Преобразование API пользователя в локальный тип
 */
function mapApiUserToLocal(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role as User['role'],
    division: (apiUser.division || 'rnd') as User['division'],
    avatar: apiUser.avatar,
  };
}

/**
 * Загрузка пользователей из API
 */
async function fetchUsers(): Promise<User[]> {
  if (cachedUsers.length > 0) {
    return cachedUsers;
  }

  if (loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = usersApi.list({ page_size: 100 })
    .then(response => {
      cachedUsers = response.results.map(mapApiUserToLocal);
      console.log('✅ useUsers: Загружено пользователей:', cachedUsers.length);
      return cachedUsers;
    })
    .catch(error => {
      console.error('❌ useUsers: Ошибка загрузки пользователей:', error);
      return [];
    })
    .finally(() => {
      isLoading = false;
      loadPromise = null;
    });

  return loadPromise;
}

/**
 * Хук для получения списка пользователей
 */
export function useUsers() {
  const [users, setUsers] = useState<User[]>(cachedUsers);
  const [loading, setLoading] = useState(cachedUsers.length === 0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedUsers.length > 0) {
      setUsers(cachedUsers);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const refetch = async () => {
    cachedUsers = [];
    setLoading(true);
    try {
      const newUsers = await fetchUsers();
      setUsers(newUsers);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, refetch };
}

/**
 * Получить пользователей синхронно (из кэша)
 * Возвращает пустой массив если кэш еще не загружен
 */
export function getUsersSync(): User[] {
  return cachedUsers;
}

/**
 * Найти пользователя по ID
 */
export function getUserById(userId: string): User | undefined {
  return cachedUsers.find(u => u.id === userId);
}

/**
 * Предзагрузка пользователей
 */
export function preloadUsers(): Promise<User[]> {
  return fetchUsers();
}

export default useUsers;
