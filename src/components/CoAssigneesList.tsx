// Компонент для отображения списка соисполнителей задачи

import { Users } from 'lucide-react';
import { User } from '../types';
import { useUsers } from '../hooks/useUsers';

interface CoAssigneesListProps {
  coAssigneeIds: string[];
  className?: string;
}

/**
 * Компонент отображает список соисполнителей с аватарами
 */
export function CoAssigneesList({ coAssigneeIds, className = '' }: CoAssigneesListProps) {
  const { users } = useUsers();
  
  if (!coAssigneeIds || coAssigneeIds.length === 0) {
    return null;
  }

  const coAssignees = coAssigneeIds
    .map(id => users.find(u => u.id === id))
    .filter((u): u is User => u !== undefined);

  if (coAssignees.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Users className="w-4 h-4 text-gray-400" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Соисполнители:</span>
        <div className="flex items-center gap-2">
          {coAssignees.map((coAssignee) => (
            <div
              key={coAssignee.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                {coAssignee.name.charAt(0)}
              </div>
              <span className="text-xs text-gray-700">{coAssignee.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
