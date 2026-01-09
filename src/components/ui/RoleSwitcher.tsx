/**
 * Компонент для переключения роли пользователя (только для демо)
 * Позволяет тестировать систему от разных ролей
 */

import React from 'react';
import { User, UserRole } from '../../types';
import { getUserRoleLabel } from '../../utils/helpers';
import { useUsers } from '../../hooks/useUsers';

interface RoleSwitcherProps {
  currentUser: User;
  onUserChange: (user: User) => void;
}

export function RoleSwitcher({ currentUser, onUserChange }: RoleSwitcherProps) {
  const { users } = useUsers();
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-w-xs z-50">
      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-1 font-medium">🎭 Демо: Переключение роли</p>
        <p className="text-xs text-gray-500">
          Текущий пользователь:
        </p>
      </div>
      
      <select
        value={currentUser.id}
        onChange={(e) => {
          const user = users.find(u => u.id === e.target.value);
          if (user) onUserChange(user);
        }}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all"
      >
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name} ({getUserRoleLabel(user.role)})
          </option>
        ))}
      </select>

      <p className="text-xs text-gray-500 mt-3">
        💡 Меняйте пользователя для тестирования разных прав доступа
      </p>
    </div>
  );
}