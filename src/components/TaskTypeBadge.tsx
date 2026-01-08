// Компонент для отображения типа задачи (T1/T2)

import { Lock } from 'lucide-react';
import { TaskType } from '../types';
import { getTaskTypeText, getTaskTypeColor } from '../utils/statusHelpers';

interface TaskTypeBadgeProps {
  taskType: TaskType;
  className?: string;
}

/**
 * Бейдж типа задачи с иконкой для T1 (секретная)
 */
export function TaskTypeBadge({ taskType, className = '' }: TaskTypeBadgeProps) {
  const text = getTaskTypeText(taskType);
  const colorClass = getTaskTypeColor(taskType);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${colorClass} ${className}`}>
      {taskType === 'T1' && <Lock className="w-3 h-3" />}
      {text}
    </span>
  );
}
