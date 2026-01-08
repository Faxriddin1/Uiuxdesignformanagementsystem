/**
 * Компонент бейджа для отображения статусов
 * Используется для задач, проектов и исследований
 */

import React from 'react';

interface StatusBadgeProps {
  label: string;
  color: string;
  className?: string;
}

export function StatusBadge({ label, color, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}