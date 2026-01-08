/**
 * Компонент для отображения пустых состояний
 * Используется когда нет данных для отображения
 */

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-gray-200">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
        {icon || <Inbox size={32} />}
      </div>
      <h3 className="text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-md">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}