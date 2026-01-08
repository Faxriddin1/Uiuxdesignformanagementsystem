/**
 * Компонент верхнего хедера
 * Содержит поиск, уведомления и профиль пользователя
 */

import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Plus } from 'lucide-react';
import { UserAvatar } from '../ui/UserAvatar';
import { NotificationCenter } from '../NotificationCenter';
import { CreateTaskDialog } from '../CreateTaskDialog';
import { Button } from '../ui/button';
import { User, Notification } from '../../types';
import { getUserRoleLabel } from '../../utils/helpers';

interface TopHeaderProps {
  currentUser: User;
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

export function TopHeader({ 
  currentUser, 
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead 
}: TopHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Подсчет непрочитанных уведомлений для текущего пользователя
  const unreadCount = notifications.filter(
    n => n.userId === currentUser.id && !n.isRead
  ).length;

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Поиск */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Поиск"
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Правая часть: уведомления и профиль */}
      <div className="flex items-center gap-4">
        {/* Кнопка создания задачи */}
        <CreateTaskDialog currentUser={currentUser}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus size={18} />
            <span className="hidden sm:inline">Создать задачу</span>
          </Button>
        </CreateTaskDialog>

        {/* Уведомления */}
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Профиль пользователя */}
        <button className="flex items-center gap-3 hover:bg-gray-50 rounded-lg pl-1 pr-3 py-1 transition-colors">
          <UserAvatar name={currentUser.name} avatar={currentUser.avatar} />
          <div className="text-left">
            <p className="text-sm text-gray-900">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{getUserRoleLabel(currentUser.role)}</p>
          </div>
          <ChevronDown className="text-gray-400" size={16} />
        </button>
      </div>

      {/* Панель уведомлений */}
      {showNotifications && (
        <NotificationCenter
          notifications={notifications}
          currentUser={currentUser}
          onNotificationClick={(notification) => {
            onNotificationClick?.(notification);
            setShowNotifications(false);
          }}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
}