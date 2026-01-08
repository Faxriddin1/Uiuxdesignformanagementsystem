/**
 * Центр уведомлений
 * Показывает все уведомления пользователя с разными типами
 */

import { Bell, X, CheckCircle, AlertCircle, Clock, MessageSquare, FileText, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Notification, NotificationType, User } from '../types';
import { UserAvatar } from './ui/UserAvatar';
import { users } from '../data/mockData';

interface NotificationCenterProps {
  notifications: Notification[];
  currentUser: User;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onClose?: () => void;
}

export function NotificationCenter({
  notifications,
  currentUser,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Фильтрация уведомлений
  const filteredNotifications = notifications
    .filter(n => n.userId === currentUser.id)
    .filter(n => filter === 'all' || !n.isRead)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.isRead).length;

  /**
   * Получить иконку для типа уведомления
   */
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_assigned':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'task_returned':
        return <ArrowLeft className="w-5 h-5 text-orange-600" />;
      case 'task_approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'deadline_approaching':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'deadline_overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'mention':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'review_required':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'comment_added':
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  /**
   * Получить цвет фона для типа уведомления
   */
  const getNotificationBgColor = (type: NotificationType) => {
    switch (type) {
      case 'task_assigned':
        return 'bg-blue-50';
      case 'task_returned':
        return 'bg-orange-50';
      case 'task_approved':
        return 'bg-green-50';
      case 'deadline_approaching':
        return 'bg-yellow-50';
      case 'deadline_overdue':
        return 'bg-red-50';
      case 'mention':
        return 'bg-purple-50';
      case 'review_required':
        return 'bg-indigo-50';
      case 'comment_added':
        return 'bg-gray-50';
      default:
        return 'bg-gray-50';
    }
  };

  /**
   * Форматировать время
   */
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days === 1) return 'вчера';
    if (days < 7) return `${days} дн назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  /**
   * Получить пользователя по ID
   */
  const getUserById = (userId?: string) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  return (
    <div className="fixed right-0 top-16 w-[400px] h-[calc(100vh-4rem)] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg text-gray-900">Уведомления</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Фильтры */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Непрочитанные
          </button>
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="ml-auto px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Прочитать все
            </button>
          )}
        </div>
      </div>

      {/* Список уведомлений */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">
              {filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'Уведомлений нет'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => {
              const creator = getUserById(notification.createdBy);
              
              return (
                <button
                  key={notification.id}
                  onClick={() => {
                    onNotificationClick?.(notification);
                    onMarkAsRead?.(notification.id);
                  }}
                  className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Иконка */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      getNotificationBgColor(notification.type)
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm ${
                          !notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {creator && (
                          <>
                            <UserAvatar name={creator.name} avatar={creator.avatar} size="xs" />
                            <span>{creator.name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatTime(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
