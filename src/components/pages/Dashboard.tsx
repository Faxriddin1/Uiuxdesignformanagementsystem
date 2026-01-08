/**
 * Компонент Dashboard - главная страница с KPI и статистикой
 * Показывает основные метрики по задачам и проектам
 */

import React from 'react';
import { AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { DashboardStats, User } from '../../types';
import { users } from '../../data/mockData';
import { UserAvatar } from '../ui/UserAvatar';

interface DashboardProps {
  stats: DashboardStats;
  onNavigateToTasks: (filter?: string) => void;
  currentUser: User;
}

export function Dashboard({ stats, onNavigateToTasks, currentUser }: DashboardProps) {
  /**
   * Получить текущую дату в формате "4 января, 2026"
   */
  const getCurrentDate = () => {
    const date = new Date();
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  /**
   * Виджеты с основными метриками
   */
  const widgets = [
    {
      title: 'Просроченные',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      filter: 'overdue',
    },
    {
      title: 'В работе',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      filter: 'in_progress',
    },
    {
      title: 'На рассмотрении',
      value: stats.underReview,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      filter: 'under_review',
    },
    {
      title: 'Выполнено в срок',
      value: stats.onTime,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      filter: 'accepted',
    },
  ];

  /**
   * Получить информацию о пользователе по ID
   */
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  return (
    <div>
      {/* Приветственный баннер */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 mb-6 text-white shadow-lg relative overflow-hidden">
        {/* Декоративные точки */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <h1 className="text-white mb-2">Добро пожаловать, {currentUser.name}</h1>
          <p className="text-blue-100">{getCurrentDate()}</p>
        </div>
      </div>

      {/* Виджеты с метриками */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <Card
              key={widget.title}
              hover
              onClick={() => onNavigateToTasks(widget.filter)}
              className="cursor-pointer"
            >
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">{widget.title}</p>
                    <p className={`${widget.color}`}>{widget.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${widget.bgColor}`}>
                    <Icon className={widget.color} size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Статистика по сотрудникам */}
      <Card>
        <CardHeader>
          <h3 className="text-gray-900">Загрузка сотрудников</h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-3 text-gray-600">Сотрудник</th>
                  <th className="text-center pb-3 text-gray-600">Всего задач</th>
                  <th className="text-center pb-3 text-gray-600">Просрочено</th>
                  <th className="text-center pb-3 text-gray-600">Выполнено</th>
                  <th className="text-right pb-3 text-gray-600">Выполнение, %</th>
                </tr>
              </thead>
              <tbody>
                {stats.byEmployee.map((emp) => {
                  const user = getUserById(emp.employeeId);
                  if (!user) return null;

                  const completionRate = emp.total > 0 
                    ? Math.round((emp.completed / emp.total) * 100) 
                    : 0;

                  return (
                    <tr key={emp.employeeId} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                          <span className="text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="text-center text-gray-900">{emp.total}</td>
                      <td className="text-center">
                        <span className={emp.overdue > 0 ? 'text-red-600' : 'text-gray-900'}>
                          {emp.overdue}
                        </span>
                      </td>
                      <td className="text-center text-green-600">{emp.completed}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                completionRate >= 80 ? 'bg-green-500' :
                                completionRate >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                          <span className="text-gray-900 w-12 text-right">
                            {completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}