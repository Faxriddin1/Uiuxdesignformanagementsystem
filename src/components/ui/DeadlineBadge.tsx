/**
 * Компонент для отображения дедлайна задачи
 * Показывает цветовую индикацию приближения/просрочки дедлайна
 */

import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { TaskStatus } from '../../types';
import { getDeadlineLabel, getDeadlineColor, isTaskOverdue, getDaysUntilDeadline } from '../../utils/helpers';

interface DeadlineBadgeProps {
  deadline: Date;
  status: TaskStatus;
  showIcon?: boolean;
  className?: string;
  compact?: boolean;
}

export function DeadlineBadge({ deadline, status, showIcon = true, className = '', compact = false }: DeadlineBadgeProps) {
  const label = getDeadlineLabel(deadline, status);
  const colorClass = getDeadlineColor(deadline, status);
  const overdue = status !== 'accepted' && isTaskOverdue({ deadline, status } as any);
  const days = getDaysUntilDeadline(deadline);

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${colorClass} ${className}`}>
        {showIcon && (overdue || days <= 1 ? <AlertCircle size={12} /> : <Calendar size={12} />)}
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${colorClass} ${className}`}>
      {showIcon && (
        <span className="flex-shrink-0">
          {overdue || days <= 1 ? <AlertCircle size={16} /> : <Calendar size={16} />}
        </span>
      )}
      <span>{label}</span>
    </span>
  );
}