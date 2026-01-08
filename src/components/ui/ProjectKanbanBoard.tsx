/**
 * Компонент Kanban доски для проектов
 * Отображает проекты по статусам в стиле Trello
 */

import React from 'react';
import { Project, User } from '../../types';
import { Card, CardBody } from './Card';
import { ProjectStatusStepper } from './ProjectStatusStepper';
import { UserAvatar } from './UserAvatar';

interface Column {
  id: string;
  title: string;
  color: string;
  projects: Project[];
}

interface ProjectKanbanBoardProps {
  columns: Column[];
  onProjectClick: (projectId: string) => void;
  getUserById: (userId: string) => User | undefined;
}

export function ProjectKanbanBoard({ columns, onProjectClick, getUserById }: ProjectKanbanBoardProps) {
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
              <h3 className="text-gray-900 text-sm">{column.title}</h3>
            </div>
            <span className="text-sm text-gray-600 bg-white px-2.5 py-1 rounded-full border border-gray-200">
              {column.projects.length}
            </span>
          </div>

          {/* Список карточек */}
          <div className="space-y-3 min-h-[200px]">
            {column.projects.map((project) => {
              const responsible = getUserById(project.responsibleId);

              return (
                <Card
                  key={project.id}
                  hover
                  onClick={() => onProjectClick(project.id)}
                  className="bg-white hover:shadow-lg transition-all duration-200 border-gray-200"
                >
                  <CardBody className="p-3">
                    {/* Заголовок проекта */}
                    <h4 className="text-gray-900 mb-2 line-clamp-2">
                      {project.title}
                    </h4>

                    {/* Описание проекта */}
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Степпер статуса */}
                    <div className="mb-3">
                      <ProjectStatusStepper status={project.status} compact />
                    </div>

                    {/* Нижняя панель */}
                    <div className="flex items-center justify-between">
                      {/* Иконки вложений и рисков */}
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        {project.attachments.length > 0 && (
                          <span className="flex items-center gap-1">
                            📎 {project.attachments.length}
                          </span>
                        )}
                        {project.risks && project.risks.length > 0 && (
                          <span className="flex items-center gap-1">
                            ⚠️ {project.risks.length}
                          </span>
                        )}
                      </div>

                      {/* Аватар ответственного */}
                      {responsible && (
                        <UserAvatar
                          name={responsible.name}
                          avatar={responsible.avatar}
                          size="sm"
                        />
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}

            {/* Пустое состояние колонки */}
            {column.projects.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Нет проектов
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}