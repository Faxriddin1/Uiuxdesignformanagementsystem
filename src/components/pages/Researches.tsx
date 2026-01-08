/**
 * Компонент реестра исследований R&D
 * Показывает базу знаний с фильтрацией и управлением доступом
 * Представление в стиле Trello Kanban доски
 */

import React, { useState, useMemo } from 'react';
import { Plus, Filter, FlaskConical, Lock, Unlock, List, LayoutGrid } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { PageHeader } from '../layout/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { ResearchKanbanBoard } from '../ui/ResearchKanbanBoard';
import { StatusBadge } from '../ui/StatusBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { Research, User, ResearchStatus } from '../../types';
import { getResearchStatusLabel, getResearchStatusColor, getDivisionLabel } from '../../utils/helpers';
import { users } from '../../data/mockData';

import { CreateResearchDialog } from '../CreateResearchDialog';

interface ResearchesProps {
  researches: Research[];
  currentUser: User;
  onResearchClick: (researchId: string) => void;
  onCreateResearch: () => void;
  onBack?: () => void;
}

export function Researches({ researches, currentUser, onResearchClick, onCreateResearch, onBack }: ResearchesProps) {
  const [filterStatus, setFilterStatus] = useState<ResearchStatus | 'all'>('all');
  const [showOnlyWithAccess, setShowOnlyWithAccess] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  /**
   * Получить пользователя по ID
   */
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  /**
   * Отфильтрованные исследования
   */
  const filteredResearches = useMemo(() => {
    return researches.filter(research => {
      // Фильтр по статусу
      if (filterStatus !== 'all' && research.status !== filterStatus) {
        return false;
      }

      // Фильтр по открытому доступу
      if (showOnlyWithAccess && !research.access) {
        return false;
      }

      return true;
    });
  }, [researches, filterStatus, showOnlyWithAccess]);

  /**
   * Группировка исследований по статусам для Kanban доски
   */
  const kanbanColumns = useMemo(() => {
    const statusGroups = {
      draft: { id: 'draft', title: 'Черновик', color: 'bg-gray-400', researches: [] as Research[] },
      under_review: { id: 'under_review', title: 'На рассмотрении', color: 'bg-yellow-400', researches: [] as Research[] },
      rework: { id: 'rework', title: 'На доработке', color: 'bg-orange-400', researches: [] as Research[] },
      accepted: { id: 'accepted', title: 'Принято', color: 'bg-green-400', researches: [] as Research[] },
      access_granted: { id: 'access_granted', title: 'Доступ открыт', color: 'bg-blue-400', researches: [] as Research[] },
    };

    filteredResearches.forEach(research => {
      if (statusGroups[research.status]) {
        statusGroups[research.status].researches.push(research);
      }
    });

    return Object.values(statusGroups);
  }, [filteredResearches]);

  return (
    <div>
      <PageHeader
        title="База исследований R&D"
        description="Каталог завершенных исследований и аналитических материалов"
        onBack={onBack}
        actions={
          <div className="flex items-center gap-2">
            {/* Переключатель вида */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Kanban доска"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Список"
              >
                <List size={18} />
              </button>
            </div>

            {currentUser.division === 'rnd' && (
              <CreateResearchDialog currentUser={currentUser} onCreate={onCreateResearch}>
                <Button icon={<Plus size={20} />}>
                  Создать исследование
                </Button>
              </CreateResearchDialog>
            )}
          </div>
        }
      />

      {/* Панель фильтров */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <span className="text-gray-700">Фильтры:</span>
            </div>

            {/* Фильтр по статусу */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ResearchStatus | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="under_review">На рассмотрении</option>
              <option value="rework">На доработке</option>
              <option value="accepted">Принято</option>
              <option value="access_granted">Доступ открыт</option>
            </select>

            {/* Фильтр по доступу */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyWithAccess}
                onChange={(e) => setShowOnlyWithAccess(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Только с открытым доступом</span>
            </label>

            {/* Счетчик */}
            <div className="ml-auto text-gray-600">
              Найдено: {filteredResearches.length}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Представления */}
      {viewMode === 'kanban' ? (
        filteredResearches.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                title="Исследования не найдены"
                description="Попробуйте изменить параметры фильтрации"
                icon={<FlaskConical size={48} />}
              />
            </CardBody>
          </Card>
        ) : (
          <ResearchKanbanBoard
            columns={kanbanColumns}
            onResearchClick={onResearchClick}
            getUserById={getUserById}
          />
        )
      ) : (
        // Список исследований (старое представление)
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResearches.map(research => {
            const author = getUserById(research.authorId);
            const hasAccess = !!research.access;
            const accessToDivision = research.access?.division;

            return (
              <Card
                key={research.id}
                hover
                onClick={() => onResearchClick(research.id)}
              >
                <CardBody className="p-6">
                  {/* Заголовок и статус */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-gray-900 flex-1">{research.title}</h3>
                    <StatusBadge
                      label={getResearchStatusLabel(research.status)}
                      color={getResearchStatusColor(research.status)}
                    />
                  </div>

                  {/* Резюме */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {research.summary}
                  </p>

                  {/* Индикатор доступа */}
                  {hasAccess && accessToDivision && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm">
                      <Unlock size={16} className="text-green-600" />
                      <span className="text-green-800">
                        Доступ открыт для: {getDivisionLabel(accessToDivision)}
                      </span>
                    </div>
                  )}

                  {!hasAccess && research.status === 'accepted' && (
                    <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 text-sm">
                      <Lock size={16} className="text-gray-600" />
                      <span className="text-gray-700">
                        Доступ ограничен отделом R&D
                      </span>
                    </div>
                  )}

                  {/* Метаданные */}
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Автор:</span>
                      {author && (
                        <div className="flex items-center gap-2">
                          <UserAvatar name={author.name} avatar={author.avatar} size="sm" />
                          <span className="text-gray-900">{author.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Отдел:</span>
                      <span className="text-gray-900">{getDivisionLabel(research.division)}</span>
                    </div>

                    {research.attachments.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Материалы:</span>
                        <span className="text-gray-900">📎 {research.attachments.length}</span>
                      </div>
                    )}

                    {research.linkedProjectIds && research.linkedProjectIds.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Связано проектов:</span>
                        <span className="text-blue-600">{research.linkedProjectIds.length}</span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}