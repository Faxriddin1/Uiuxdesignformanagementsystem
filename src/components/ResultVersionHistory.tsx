// Компонент для отображения истории версий результата задачи

import { FileText, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Task, User } from '../types';
import { getVersionHistory, getVersionStatusText, getVersionStatusColor } from '../utils/resultVersions';
import { users } from '../data/mockData';

interface ResultVersionHistoryProps {
  task: Task;
}

/**
 * Компонент отображает историю всех версий результата задачи
 * С указанием статуса каждой версии (текущая, отозвана, возвращена на доработку)
 */
export function ResultVersionHistory({ task }: ResultVersionHistoryProps) {
  const versions = getVersionHistory(task);

  if (versions.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        Результаты еще не отправлялись на проверку
      </div>
    );
  }

  const getUser = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: 'current' | 'withdrawn' | 'rejected') => {
    switch (status) {
      case 'current':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'withdrawn':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {versions.map((version) => {
        const submitter = getUser(version.submittedBy);
        const statusText = getVersionStatusText(version.status);
        const statusColor = getVersionStatusColor(version.status);

        return (
          <div
            key={version.version}
            className={`border rounded-lg p-4 ${
              version.status === 'current' ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            {/* Заголовок версии */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(version.status)}
                <div>
                  <div className="text-sm">
                    <span className="font-medium">Версия {version.version}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Отправлено: {formatDate(version.submittedAt)} • {submitter?.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Описание результата */}
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1">Описание результата:</div>
              <div className="text-sm text-gray-800 bg-white p-2 rounded border border-gray-200">
                {version.resultDescription}
              </div>
            </div>

            {/* Вложения */}
            {version.attachments.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">Вложения ({version.attachments.length}):</div>
                <div className="space-y-1">
                  {version.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 text-sm bg-white p-2 rounded border border-gray-200"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-gray-700">{attachment.name}</span>
                      <span className="text-xs text-gray-500">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button className="text-blue-600 hover:text-blue-700">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Причина отзыва/отклонения */}
            {version.withdrawReason && (
              <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded">
                <div className="text-xs text-purple-700 font-medium mb-1">Причина отзыва:</div>
                <div className="text-sm text-purple-900">{version.withdrawReason}</div>
              </div>
            )}

            {version.rejectionReason && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <div className="text-xs text-red-700 font-medium mb-1">Причина возврата:</div>
                <div className="text-sm text-red-900">{version.rejectionReason}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
