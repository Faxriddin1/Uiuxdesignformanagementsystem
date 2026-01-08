/**
 * Компонент заголовка страницы
 * Отображает название и действия для текущей страницы
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
}

export function PageHeader({ title, description, actions, onBack }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all mt-1"
              title="Назад"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-gray-900 mb-2">{title}</h2>
            {description && (
              <p className="text-gray-600">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}