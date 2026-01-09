/**
 * Компонент детальной карточки задачи
 * Позволяет просматривать и редактировать задачу
 */

import React, { useState } from 'react';
import { Upload, Send, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button'; // Changed to use shadcn button
import { StatusBadge } from '../ui/StatusBadge';
import { DeadlineBadge } from '../ui/DeadlineBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { AttachmentsList } from '../ui/AttachmentsList';
import { MentionInput } from '../MentionInput';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Task, User, Comment } from '../../types';
import { 
  getTaskStatusLabel, 
  getTaskStatusColor, 
  getDivisionLabel,
  formatDateTime,
  canUserApprove
} from '../../utils/helpers';
import { useUsers } from '../../hooks/useUsers';

/**
 * Получить метку категории задачи
 */
const getTaskCategoryLabel = (category?: string) => {
  if (!category || category === 'standard') return null;
  
  switch (category) {
    case 'external_org':
      return '🏢 Вопрос на сторонней организации';
    case 'external_branch':
      return '📍 Вопрос на сторонней филиала';
    case 'external_management':
      return '👥 Вопрос на сторонней руководителя';
    default:
      return null;
  }
};

interface TaskDetailProps {
  task: Task;
  currentUser: User;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function TaskDetail({ task, currentUser, onClose, onUpdateTask }: TaskDetailProps) {
  const { users } = useUsers();
  const [resultDescription, setResultDescription] = useState(task.resultDescription || '');
  const [comment, setComment] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const assignee = users.find(u => u.id === task.assigneeId);
  const creator = users.find(u => u.id === task.creatorId);
  const isAssignee = currentUser.id === task.assigneeId;
  const canApprove = canUserApprove(currentUser);

  const handleStartWork = async () => {
    try {
      const { tasksApi } = await import('../../api/tasks');
      await tasksApi.take(task.id);
      onUpdateTask(task.id, { status: 'in_progress' });
    } catch (error) {
      console.error('Ошибка при взятии задачи в работу:', error);
      alert('Не удалось взять задачу в работу');
    }
  };

  const handleSubmitForReview = () => {
    if (task.attachments.length === 0) {
      alert('Необходимо приложить файлы для подтверждения выполнения');
      return;
    }

    if (!resultDescription.trim()) {
      alert('Необходимо описать результат выполнения');
      return;
    }

    onUpdateTask(task.id, {
      status: 'under_review',
      resultDescription,
      history: [
        ...task.history,
        {
          id: `h${Date.now()}`,
          userId: currentUser.id,
          action: 'Отправлено на рассмотрение',
          details: 'Добавлены результаты работы',
          timestamp: new Date(),
        },
      ],
    });
  };

  const handleApprove = () => {
    onUpdateTask(task.id, {
      status: 'accepted',
      history: [
        ...task.history,
        {
          id: `h${Date.now()}`,
          userId: currentUser.id,
          action: 'Одобрено',
          details: 'Задача принята и закрыта',
          timestamp: new Date(),
        },
      ],
    });
  };

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

    onUpdateTask(task.id, {
      status: 'rework',
      comments: [...task.comments, newComment],
      history: [
        ...task.history,
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

  const handleAddComment = () => {
    if (!comment.trim()) return;

    const newComment: Comment = {
      id: `c${Date.now()}`,
      authorId: currentUser.id,
      text: comment,
      createdAt: new Date(),
    };

    onUpdateTask(task.id, {
      comments: [...task.comments, newComment],
    });

    setComment('');
  };

  const getCommentAuthor = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden w-[95vw]">
        <DialogHeader className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mr-8">
             <div className="flex items-center gap-3">
               <DialogTitle className="text-xl font-semibold">{task.title}</DialogTitle>
               <StatusBadge
                 label={getTaskStatusLabel(task.status)}
                 color={getTaskStatusColor(task.status)}
               />
             </div>
          </div>
          <DialogDescription className="flex items-center gap-4 text-sm text-gray-600 mt-2">
            <span>ID: {task.id}</span>
            <DeadlineBadge deadline={task.deadline} status={task.status} />
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Описание */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Описание</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>

            {/* Категория задачи (если установлена) */}
            {getTaskCategoryLabel(task.category) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-900">Категория:</span>
                  <span className="text-sm text-blue-800">{getTaskCategoryLabel(task.category)}</span>
                </div>
              </div>
            )}

            {/* Метаданные */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Исполнитель</p>
                {assignee && (
                  <div className="flex items-center gap-2">
                    <UserAvatar name={assignee.name} avatar={assignee.avatar} size="sm" />
                    <span className="text-gray-900">{assignee.name}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Создатель</p>
                {creator && (
                  <div className="flex items-center gap-2">
                    <UserAvatar name={creator.name} avatar={creator.avatar} size="sm" />
                    <span className="text-gray-900">{creator.name}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Отдел</p>
                <p className="text-gray-900">{getDivisionLabel(task.division)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Дедлайн</p>
                <p className="text-gray-900">{new Date(task.deadline).toLocaleDateString('ru-RU')}</p>
              </div>
            </div>

            {/* Результат */}
            {(task.status === 'under_review' || task.status === 'rework' || task.status === 'accepted') && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Результат выполнения</h3>
                <div className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  {task.resultDescription || 'Описание результата не предоставлено'}
                </div>
              </div>
            )}

            {/* Поле для ввода результата */}
            {isAssignee && (task.status === 'in_progress' || task.status === 'rework') && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Описание результата <span className="text-red-500">*</span></h3>
                <textarea
                  value={resultDescription}
                  onChange={(e) => setResultDescription(e.target.value)}
                  placeholder="Опишите выполненную работу..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
              </div>
            )}

            {/* Вложения */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Вложения</h3>
                {isAssignee && (task.status === 'in_progress' || task.status === 'rework') && (
                  <Button size="sm" variant="secondary" className="gap-2">
                    <Upload size={16} />
                    Добавить файлы
                  </Button>
                )}
              </div>
              
              {task.attachments.length === 0 ? (
                <div className="text-gray-500 text-sm italic p-4 border border-dashed border-gray-200 rounded-lg text-center">
                  {isAssignee && (task.status === 'in_progress' || task.status === 'rework')
                    ? 'Необходимо приложить файлы для подтверждения выполнения'
                    : 'Нет вложений'}
                </div>
              ) : (
                <AttachmentsList
                  attachments={task.attachments}
                  readOnly={!isAssignee || (task.status !== 'in_progress' && task.status !== 'rework')}
                />
              )}
            </div>

            {/* Комментарии */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Комментарии</h3>
              
              <div className="space-y-4 mb-4">
                {task.comments.length === 0 ? (
                  <p className="text-gray-500 text-sm">Нет комментариев</p>
                ) : (
                  task.comments.map(comm => {
                    const author = getCommentAuthor(comm.authorId);
                    return (
                      <div
                        key={comm.id}
                        className={`p-4 rounded-lg ${
                          comm.isReturnReason ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {author && (
                            <UserAvatar name={author.name} avatar={author.avatar} size="sm" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{author?.name}</span>
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
                  })
                )}
              </div>

              {/* Форма добавления комментария */}
              {task.status !== 'accepted' && (
                <div className="flex gap-2">
                  <MentionInput
                    value={comment}
                    onChange={(value) => setComment(value)}
                    placeholder="Добавить комментарий..."
                    className="flex-1"
                  />
                  <Button onClick={handleAddComment} disabled={!comment.trim()}>
                    Отправить
                  </Button>
                </div>
              )}
            </div>

            {/* История изменений */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showHistory ? 'Скрыть историю изменений' : 'Показать историю изменений'}
              </button>

              {showHistory && (
                <div className="space-y-3 mt-4">
                  {task.history.map(entry => {
                    const user = users.find(u => u.id === entry.userId);
                    return (
                      <div key={entry.id} className="flex gap-3 text-sm">
                        <span className="text-gray-400 min-w-[120px]">{formatDateTime(entry.timestamp)}</span>
                        <span className="font-medium text-gray-900">{user?.name}</span>
                        <span className="text-gray-600">{entry.action}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50 sm:justify-between flex-shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>

          <div className="flex items-center gap-2">
            {/* Действия для исполнителя */}
            {isAssignee && task.status === 'new' && (
              <Button onClick={handleStartWork} className="gap-2">
                <Send size={16} />
                Взять в работу
              </Button>
            )}

            {isAssignee && (task.status === 'in_progress' || task.status === 'rework') && (
              <Button
                onClick={handleSubmitForReview}
                className="gap-2"
                disabled={task.attachments.length === 0 || !resultDescription.trim()}
              >
                <Send size={16} />
                Отправить на рассмотрение
              </Button>
            )}

            {/* Действия для руководителя */}
            {canApprove && task.status === 'under_review' && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  className="gap-2"
                  disabled={!comment.trim()}
                >
                  <RotateCcw size={16} />
                  Вернуть
                </Button>
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
                  Одобрить и закрыть
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}