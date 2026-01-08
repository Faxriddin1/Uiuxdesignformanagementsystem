// Модальное окно для возврата задачи на доработку (проверяющим)

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  taskTitle: string;
}

/**
 * Модальное окно для возврата задачи на доработку проверяющим
 * Требует обязательного указания причины возврата
 */
export function RejectModal({ isOpen, onClose, onConfirm, taskTitle }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Необходимо указать причину возврата');
      return;
    }

    onConfirm(reason);
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Вернуть задачу на доработку</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">Задача:</div>
            <div className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded border border-gray-200">
              {taskTitle}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Причина возврата / Замечания <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Опишите, что необходимо доработать или исправить..."
              rows={5}
              className={error ? 'border-red-300' : ''}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              После возврата задача перейдет в статус <strong>"На доработке"</strong>.
              Текущая версия результата будет помечена как "Возвращена на доработку" с указанием причины.
              Исполнитель сможет внести правки и отправить новую версию результата.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            variant="destructive"
          >
            Вернуть на доработку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}