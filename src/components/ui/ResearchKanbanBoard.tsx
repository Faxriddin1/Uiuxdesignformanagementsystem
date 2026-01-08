/**
 * Компонент Kanban доски для исследований
 * Отображает исследования по статусам в стиле Trello
 */

import React from 'react';
import { Research, User } from '../../types';
import { Card, CardBody } from './Card';
import { StatusBadge } from './StatusBadge';
import { DeadlineBadge } from './DeadlineBadge';
import { UserAvatar } from './UserAvatar';
import { getResearchStatusLabel, getResearchStatusColor, isResearchOverdue } from '../../utils/helpers';

interface Column {
  id: string;
  title: string;
  color: string;
  researches: Research[];
}

interface ResearchKanbanBoardProps {
  columns: Column[];
  onResearchClick: (researchId: string) => void;
  getUserById: (userId: string) => User | undefined;
}

export function ResearchKanbanBoard({ columns, onResearchClick, getUserById }: ResearchKanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 bg-gray-50 rounded-xl p-4 border border-gray-200"
        >
          {/* Заголовок колонки */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="text-gray-900">{column.title}</h3>
            </div>
            <span className="text-sm text-gray-600 bg-white px-2.5 py-1 rounded-full border border-gray-200">
              {column.researches.length}
            </span>
          </div>

          {/* Список карточек */}
          <div className="space-y-3 min-h-[200px]">
            {column.researches.map((research) => {
              const author = getUserById(research.authorId);
              const overdue = isResearchOverdue(research);

              return (
                <Card
                  key={research.id}
                  hover
                  onClick={() => onResearchClick(research.id)}
                  className={`bg-white hover:shadow-lg transition-all duration-200 border-gray-200 ${
                    overdue ? 'ring-2 ring-red-400' : ''
                  }`}
                >
                  <CardBody className="p-3">
                    {/* Заголовок исследования */}
                    <h4 className="text-gray-900 mb-2 line-clamp-2">
                      {research.title}
                    </h4>

                    {/* Резюме исследования */}
                    {research.summary && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {research.summary}
                      </p>
                    )}

                    {/* Метаданные */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <DeadlineBadge deadline={research.deadline} status={research.status} compact />
                      
                      {research.linkedProjectIds && research.linkedProjectIds.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          🔗 {research.linkedProjectIds.length} проект(ов)
                        </span>
                      )}
                    </div>

                    {/* Нижняя панель */}
                    <div className="flex items-center justify-between">
                      {/* Иконки вложений и комментариев */}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        {research.attachments.length > 0 && (
                          <span className="flex items-center gap-1">
                            📎 {research.attachments.length}
                          </span>
                        )}
                        {research.comments.length > 0 && (
                          <span className="flex items-center gap-1">
                            💬 {research.comments.length}
                          </span>
                        )}
                      </div>

                      {/* Аватар автора */}
                      {author && (
                        <UserAvatar
                          name={author.name}
                          avatar={author.avatar}
                          size="sm"
                        />
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}

            {/* Пустое состояние колонки */}
            {column.researches.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Нет исследований
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}