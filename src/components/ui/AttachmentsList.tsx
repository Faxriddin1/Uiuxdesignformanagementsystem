/**
 * Компонент для отображения списка вложений
 * Показывает файлы с иконками и метаданными
 */

import React from 'react';
import { FileText, Download, X } from 'lucide-react';
import { Attachment } from '../../types';
import { formatFileSize, formatDateTime } from '../../utils/helpers';

interface AttachmentsListProps {
  attachments: Attachment[];
  onRemove?: (attachmentId: string) => void;
  readOnly?: boolean;
}

export function AttachmentsList({ attachments, onRemove, readOnly = false }: AttachmentsListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          {/* Иконка файла */}
          <div className="flex-shrink-0 text-blue-600">
            <FileText size={20} />
          </div>

          {/* Информация о файле */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-gray-900">
              {attachment.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(attachment.size)} • {formatDateTime(attachment.uploadedAt)}
            </p>
          </div>

          {/* Действия */}
          <div className="flex items-center gap-2">
            {/* Кнопка скачивания */}
            <button
              onClick={() => window.open(attachment.url, '_blank')}
              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Скачать"
            >
              <Download size={16} />
            </button>

            {/* Кнопка удаления */}
            {!readOnly && onRemove && (
              <button
                onClick={() => onRemove(attachment.id)}
                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Удалить"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
