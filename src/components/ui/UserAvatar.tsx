/**
 * Компонент аватара пользователя
 * Отображает инициалы если нет фото
 */

import React from 'react';
import { getUserInitials } from '../../utils/helpers';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ name, avatar, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const initials = getUserInitials(name);

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-sm ${className}`}
      title={name}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span className="font-medium">{initials}</span>
      )}
    </div>
  );
}