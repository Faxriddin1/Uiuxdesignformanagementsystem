/**
 * Компонент детальной карточки исследования
 * Включает управление доступом для передачи R&D → IT-проекты
 */

import React, { useState } from 'react';
import { Send, RotateCcw, Unlock, Plus } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { AttachmentsList } from '../ui/AttachmentsList';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Button as ShadcnButton } from '../ui/Button';
import { Button } from '../ui/Button';
import { Research, User, Comment, Division, AccessLevel } from '../../types';
import { 
  getResearchStatusLabel, 
  getResearchStatusColor,
  getDivisionLabel,
  formatDateTime,
  canUserApprove
} from '../../utils/helpers';
import { useUsers } from '../../hooks/useUsers';

interface ResearchDetailProps {
  research: Research;
  currentUser: User;
  onClose: () => void;
  onUpdateResearch: (researchId: string, updates: Partial<Research>) => void;
  onCreateProject?: (researchId: string) => void;
}

export function ResearchDetail({ 
  research, 
  currentUser, 
  onClose, 
  onUpdateResearch,
  onCreateProject 
}: ResearchDetailProps) {
  const { users } = useUsers();
  const [comment, setComment] = useState('');
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division>('it_projects');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<AccessLevel>('copy_to_project');

  const author = users.find(u => u.id === research.authorId);
  const creator = users.find(u => u.id === research.creatorId);
  const isAuthor = currentUser.id === research.authorId;
  const canApprove = canUserApprove(currentUser);

  /**
   * Отправить на рассмотрение
   */
  const handleSubmitForReview = () => {
    if (research.attachments.length === 0) {
      alert('Необходимо приложить материалы исследования');
      return;
    }

    onUpdateResearch(research.id, {
      status: 'under_review',
      history: [
        ...research.history,
        {
          id: `h${Date.now()}`,
          userId: currentUser.id,
          action: 'Отправлено на рассмотрение',
          details: 'Материалы готовы к проверке',
          timestamp: new Date(),
        },
      ],
    });
  };

  /**
   * Одобрить исследование
   */
  const handleApprove = () => {
    onUpdateResearch(research.id, {
      status: 'accepted',
      history: [
        ...research.history,
        {
          id: `h${Date.now()}`,
          userId: currentUser.id,
          action: 'Одобрено',
          details: 'Исследование принято',
          timestamp: new Date(),
        },
      ],
    });
  };

  /**
   * Вернуть на доработку
   */
  const handleReject = () => {
    if (!comment.trim()) {
      alert('Необходимо указать причину возврата на доработку');
      return;
    }

    const newComment: Comment = {
      id: `c${Date.now()}`,
      authorId: currentUser.id,
      text: comment,
      createdAt: new Date(),
      isReturnReason: true,
    };

    onUpdateResearch(research.id, {
      status: 'rework',
      comments: [...research.comments, newComment],
      history: [
        ...research.history,
        {
          id: `h${Date.now()}`,
          userId: currentUser.id,
          action: 'Возврат на доработку',
          details: comment,
          timestamp: new Date(),
        },
      ],
    });

    setComment('');
  };

  /**
   * Открыть доступ другому отделу
   */
  const handleGrantAccess = () => {
    onUpdateResearch(research.id, {
      status: 'access_granted',
      access: {
        division: selectedDivision,
        accessLevel: selectedAccessLevel,
        grantedAt: new Date(),
        grantedBy: currentUser.id,
      },
      history: [
        ...research.history,
        {
          id: `h${Date.now()}`,
          userId: currentUser.id,
          action: 'Открыт доступ',
          details: `Доступ предоставлен отделу ${getDivisionLabel(selectedDivision)}`,
          timestamp: new Date(),
        },
      ],
    });

    setShowAccessModal(false);
  };

  /**
   * Добавить комментарий
   */
  const handleAddComment = () => {
    if (!comment.trim()) return;

    const newComment: Comment = {
      id: `c${Date.now()}`,
      authorId: currentUser.id,
      text: comment,
      createdAt: new Date(),
    };

    onUpdateResearch(research.id, {
      comments: [...research.comments, newComment],
    });

    setComment('');
  };

  /**
   * Получить автора комментария
   */
  const getCommentAuthor = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  return (
    <>
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden w-[95vw]">
          <DialogHeader className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mr-8">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-semibold">{research.title}</DialogTitle>
                <StatusBadge
                  label={getResearchStatusLabel(research.status)}
                  color={getResearchStatusColor(research.status)}
                />
              </div>
            </div>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              ID: {research.id}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Резюме */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Резюме</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {research.summary}
                </p>
              </div>

              {/* Рекомендации */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Рекомендации</h3>
                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                  {research.recommendations}
                </p>
              </div>

              {/* Сравнение вариантов */}
              {research.comparison && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Сравнение вариантов</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {research.comparison}
                  </p>
                </div>
              )}

              {/* Источники */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Источники</h3>
                <ul className="space-y-1">
                  {research.sources.map((source, index) => (
                    <li key={index} className="text-blue-600 hover:underline">
                      <a href={source} target="_blank" rel="noopener noreferrer">
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Метаданные */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Автор</p>
                  {author && (
                    <div className="flex items-center gap-2">
                      <UserAvatar name={author.name} avatar={author.avatar} size="sm" />
                      <span className="text-gray-900">{author.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Отдел</p>
                  <p className="text-gray-900">{getDivisionLabel(research.division)}</p>
                </div>
              </div>

              {/* Статус доступа */}
              {research.access && (
                <Card className="bg-green-50 border-green-200">
                  <CardBody className="py-3">
                    <div className="flex items-start gap-3">
                      <Unlock size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-green-900 font-medium">
                          Доступ открыт
                        </p>
                        <p className="text-sm text-green-800 mt-1">
                          Отдел: {getDivisionLabel(research.access.division!)} • 
                          Уровень: {research.access.accessLevel === 'read_only' ? 'Только чтение' : 'Копирование в проект'} • 
                          {formatDateTime(research.access.grantedAt)}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Вложения */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Материалы исследования</h3>
                {research.attachments.length === 0 ? (
                  <p className="text-gray-500 text-sm">Нет прикрепленных материалов</p>
                ) : (
                  <AttachmentsList attachments={research.attachments} readOnly />
                )}
              </div>

              {/* Комментарии */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Комментарии</h3>
                
                {research.comments.length === 0 ? (
                  <p className="text-gray-500 text-sm mb-3">Нет комментариев</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {research.comments.map(comm => {
                      const commAuthor = getCommentAuthor(comm.authorId);
                      return (
                        <div
                          key={comm.id}
                          className={`p-4 rounded-lg ${
                            comm.isReturnReason ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {commAuthor && (
                              <UserAvatar name={commAuthor.name} avatar={commAuthor.avatar} size="sm" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{commAuthor?.name}</span>
                                <span className="text-xs text-gray-500">
                                  {formatDateTime(comm.createdAt)}
                                </span>
                                {comm.isReturnReason && (
                                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                                    Причина возврата
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700">{comm.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Форма добавления комментария */}
                {research.status !== 'accepted' && research.status !== 'access_granted' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Добавить комментарий..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <ShadcnButton onClick={handleAddComment} disabled={!comment.trim()}>
                      Отправить
                    </ShadcnButton>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50 sm:justify-between flex-shrink-0">
            <ShadcnButton variant="ghost" onClick={onClose}>
              Закрыть
            </ShadcnButton>

            <div className="flex items-center gap-2">
              {/* Действия для автора */}
              {isAuthor && research.status === 'draft' && (
                <Button onClick={handleSubmitForReview} icon={<Send size={20} />}>
                  Отправить на рассмотрение
                </Button>
              )}

              {/* Действия для руководителя при рассмотрении */}
              {canApprove && research.status === 'under_review' && (
                <>
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    icon={<RotateCcw size={20} />}
                    disabled={!comment.trim()}
                  >
                    Вернуть на доработку
                  </Button>
                  <Button onClick={handleApprove}>
                    Одобрить
                  </Button>
                </>
              )}

              {/* Действие для открытия доступа */}
              {canApprove && research.status === 'accepted' && !research.access && (
                <Button
                  onClick={() => setShowAccessModal(true)}
                  icon={<Unlock size={20} />}
                >
                  Открыть доступ второму отделу
                </Button>
              )}

              {/* Создать проект на основе исследования */}
              {research.status === 'access_granted' && onCreateProject && (
                <Button
                  onClick={() => onCreateProject(research.id)}
                  icon={<Plus size={20} />}
                  variant="secondary"
                >
                  Создать проект на основе исследования
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно управления доступом */}
      {showAccessModal && (
        <Dialog open={showAccessModal} onOpenChange={setShowAccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Открыть доступ к исследованию</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Выбор отдела */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Предоставить доступ отделу:
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value as Division)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="it_projects">{getDivisionLabel('it_projects')}</option>
                  <option value="rnd">{getDivisionLabel('rnd')}</option>
                </select>
              </div>

              {/* Уровень доступа */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Уровень доступа:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="read_only"
                      checked={selectedAccessLevel === 'read_only'}
                      onChange={(e) => setSelectedAccessLevel(e.target.value as AccessLevel)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900">Только чтение</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="copy_to_project"
                      checked={selectedAccessLevel === 'copy_to_project'}
                      onChange={(e) => setSelectedAccessLevel(e.target.value as AccessLevel)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-900">Копирование в проект</span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <ShadcnButton variant="ghost" onClick={() => setShowAccessModal(false)}>
                Отмена
              </ShadcnButton>
              <ShadcnButton onClick={handleGrantAccess}>
                Открыть доступ
              </ShadcnButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}