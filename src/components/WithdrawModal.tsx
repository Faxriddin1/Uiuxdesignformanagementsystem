// Модальное окно для отзыва задачи с review

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/Button';
import { Textarea } from './ui/textarea';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  taskTitle: string;
}

/**
 * Модальное окно для отзыва задачи с этапа review
 * Требует обязательного указания причины отзыва
 */
export function WithdrawModal({ isOpen, onClose, onConfirm, taskTitle }: WithdrawModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Необходимо указать причину отзыва');
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
          <DialogTitle>Отозвать задачу на доработку</DialogTitle>
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
              Причина отзыва <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Укажите, что нужно доработать или изменить..."
              rows={4}
              className={error ? 'border-red-300' : ''}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              После отзыва задача перейдет в статус <strong>"На доработке (отозвано)"</strong>.
              Текущая версия результата будет помечена как "Отозвана". 
              Вы сможете внести изменения и отправить новую версию результата.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Отозвать на доработку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}