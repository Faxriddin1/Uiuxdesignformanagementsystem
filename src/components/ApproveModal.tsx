// Модальное окно для одобрения задачи

import { CheckCircle } from 'lucide-react';
import { Task, TaskType } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/Button';

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment?: string) => void;
  task: Task;
  reviewerLevel: 'division' | 'management';
}

/**
 * Модальное окно для одобрения задачи проверяющим
 * Для T2 на уровне отдела - передает на следующий уровень
 * Для остальных случаев - закрывает задачу
 */
export function ApproveModal({ isOpen, onClose, onConfirm, task, reviewerLevel }: ApproveModalProps) {
  // Определяем, что произойдет после одобрения
  const willClose = task.taskType === 'T1' || reviewerLevel === 'management';
  const willForward = task.taskType === 'T2' && reviewerLevel === 'division';

  const getActionText = () => {
    if (willClose) {
      return 'Одобрить и закрыть задачу';
    }
    if (willForward) {
      return 'Одобрить и передать на рассмотрение';
    }
    return 'Одобрить';
  };

  const getDescriptionText = () => {
    if (willClose) {
      return (
        <p className="text-sm text-gray-700">
          После одобрения задача будет автоматически <strong>закрыта</strong> со статусом{' '}
          <span className="text-green-600 font-medium">"Принято (Закрыто)"</span>.
          Текущая версия результата будет зафиксирована как финальная.
        </p>
      );
    }
    if (willForward) {
      return (
        <p className="text-sm text-gray-700">
          После одобрения задача будет передана на рассмотрение{' '}
          <strong>Начальнику Управления</strong> со статусом{' '}
          <span className="text-orange-600 font-medium">"На рассмотрении (Нач. Управления)"</span>.
        </p>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <DialogTitle>{getActionText()}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">Задача:</div>
            <div className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded border border-gray-200">
              {task.title}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            {getDescriptionText()}
          </div>

          <DialogDescription className="text-sm text-gray-600">
            Вы уверены, что хотите одобрить эту задачу?
          </DialogDescription>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={() => onConfirm()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {getActionText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}