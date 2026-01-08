/**
 * Компонент для отображения статусов проекта (1-4)
 * Визуально показывает текущий этап проекта
 */

import React from 'react';
import { ProjectStatus } from '../../types';
import { getProjectStatusNumber, getProjectStatusLabel, getProjectStatusColor } from '../../utils/helpers';

interface ProjectStatusStepperProps {
  status?: ProjectStatus;
  currentStatus?: ProjectStatus;
  onStatusChange?: (status: ProjectStatus) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function ProjectStatusStepper({ status, currentStatus, onStatusChange, readOnly = false, compact = false }: ProjectStatusStepperProps) {
  // Поддержка обоих пропсов для обратной совместимости
  const activeStatus = status || currentStatus;
  if (!activeStatus) return null;

  const statuses: ProjectStatus[] = [
    'platform_implementation',
    'internal_testing',
    'agreement',
    'launch',
  ];

  const currentStep = getProjectStatusNumber(activeStatus);

  // Компактный вид для Kanban
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {statuses.map((_, index) => {
          const step = index + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-all ${
                isActive ? 'bg-blue-500 shadow-sm' :
                isCompleted ? 'bg-green-500' :
                'bg-gray-200'
              }`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {statuses.map((status, index) => {
          const step = index + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          const label = getProjectStatusLabel(status);
          const canClick = !readOnly && onStatusChange;

          return (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center flex-1">
                {/* Круг с номером */}
                <button
                  onClick={() => canClick && onStatusChange(status)}
                  disabled={!canClick}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-medium
                    transition-all duration-200
                    ${isActive ? getProjectStatusColor(currentStatus) + ' text-white shadow-md' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600' : ''}
                    ${canClick ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {step}
                </button>
                
                {/* Название статуса */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p className={`text-xs ${isActive ? '' : 'text-gray-600'}`}>
                    {label.replace(/^\d+\.\s*/, '')}
                  </p>
                </div>
              </div>

              {/* Линия между статусами */}
              {index < statuses.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-2 mb-8">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCompleted ? 'bg-green-500 w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}