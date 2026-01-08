// Утилиты для работы с версиями результатов задач

import { Task, ResultVersion, Attachment } from '../types';

/**
 * Создает новую версию результата
 */
export function createResultVersion(
  task: Task,
  resultDescription: string,
  attachments: Attachment[],
  submittedBy: string
): ResultVersion {
  const nextVersion = (task.resultVersions?.length || 0) + 1;

  return {
    version: nextVersion,
    resultDescription,
    attachments,
    submittedBy,
    submittedAt: new Date(),
    status: 'current',
  };
}

/**
 * Отзывает текущую версию результата (при Withdraw from Review)
 */
export function withdrawCurrentVersion(
  task: Task,
  withdrawReason: string
): ResultVersion[] | undefined {
  if (!task.resultVersions || !task.currentResultVersion) {
    return task.resultVersions;
  }

  return task.resultVersions.map(version => {
    if (version.version === task.currentResultVersion) {
      return {
        ...version,
        status: 'withdrawn' as const,
        withdrawReason,
      };
    }
    return version;
  });
}

/**
 * Отклоняет текущую версию результата (при возврате на доработку проверяющим)
 */
export function rejectCurrentVersion(
  task: Task,
  rejectionReason: string
): ResultVersion[] | undefined {
  if (!task.resultVersions || !task.currentResultVersion) {
    return task.resultVersions;
  }

  return task.resultVersions.map(version => {
    if (version.version === task.currentResultVersion) {
      return {
        ...version,
        status: 'rejected' as const,
        rejectionReason,
      };
    }
    return version;
  });
}

/**
 * Получает текущую версию результата
 */
export function getCurrentVersion(task: Task): ResultVersion | undefined {
  if (!task.resultVersions || !task.currentResultVersion) {
    return undefined;
  }
  return task.resultVersions.find(v => v.version === task.currentResultVersion);
}

/**
 * Получает историю всех версий результата (отсортировано по версиям по убыванию)
 */
export function getVersionHistory(task: Task): ResultVersion[] {
  if (!task.resultVersions) {
    return [];
  }
  return [...task.resultVersions].sort((a, b) => b.version - a.version);
}

/**
 * Получает текст статуса версии на русском
 */
export function getVersionStatusText(status: ResultVersion['status']): string {
  switch (status) {
    case 'current':
      return 'Текущая';
    case 'withdrawn':
      return 'Отозвана';
    case 'rejected':
      return 'Возвращена на доработку';
    default:
      return '';
  }
}

/**
 * Получает цвет бейджа для статуса версии
 */
export function getVersionStatusColor(status: ResultVersion['status']): string {
  switch (status) {
    case 'current':
      return 'bg-blue-100 text-blue-700';
    case 'withdrawn':
      return 'bg-gray-100 text-gray-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Сравнивает две версии результата (для diff-view)
 */
export function compareVersions(
  oldVersion: ResultVersion,
  newVersion: ResultVersion
): {
  descriptionChanged: boolean;
  attachmentsAdded: Attachment[];
  attachmentsRemoved: Attachment[];
} {
  const descriptionChanged = oldVersion.resultDescription !== newVersion.resultDescription;

  const oldAttachmentIds = new Set(oldVersion.attachments.map(a => a.id));
  const newAttachmentIds = new Set(newVersion.attachments.map(a => a.id));

  const attachmentsAdded = newVersion.attachments.filter(a => !oldAttachmentIds.has(a.id));
  const attachmentsRemoved = oldVersion.attachments.filter(a => !newAttachmentIds.has(a.id));

  return {
    descriptionChanged,
    attachmentsAdded,
    attachmentsRemoved,
  };
}
