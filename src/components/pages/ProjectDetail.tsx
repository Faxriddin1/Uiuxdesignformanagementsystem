/**
 * Компонент детальной карточки проекта
 * Показывает все данные проекта, статусы и артефакты
 */

import React, { useState } from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { ProjectStatusStepper } from '../ui/ProjectStatusStepper';
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
import { Project, User, Research, ProjectStatus } from '../../types';
import { getDivisionLabel, formatDateTime, canUserEdit } from '../../utils/helpers';
import { useUsers } from '../../hooks/useUsers';

interface ProjectDetailProps {
  project: Project;
  currentUser: User;
  onClose: () => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onViewResearch?: (researchId: string) => void;
}

export function ProjectDetail({ 
  project, 
  currentUser, 
  onClose, 
  onUpdateProject,
  onViewResearch 
}: ProjectDetailProps) {
  const { users } = useUsers();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const responsible = users.find(u => u.id === project.responsibleId);
  const creator = users.find(u => u.id === project.creatorId);
  const linkedResearch = project.linkedResearchId 
    ? researches.find(r => r.id === project.linkedResearchId)
    : null;

  const canEdit = canUserEdit(currentUser, project.creatorId, project.division);

  /**
   * Изменить статус проекта
   */
  const handleStatusChange = (newStatus: ProjectStatus) => {
    if (!canEdit) {
      alert('У вас недостаточно прав для изменения статуса проекта');
      return;
    }

    onUpdateProject(project.id, {
      status: newStatus,
      updatedAt: new Date(),
      history: [
        ...project.history,
        {
          id: `h${Date.now()}`,
          userId: currentUser.id,
          action: 'Переход к статусу',
          details: `Статус изменен на "${newStatus}"`,
          timestamp: new Date(),
        },
      ],
    });
  };

  /**
   * Сформировать справку по проекту
   */
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    
    // Имитация генерации отчета
    setTimeout(() => {
      setIsGeneratingReport(false);
      alert('Справка по проекту сформирована и готова к скачиванию');
      // В реальном приложении здесь был бы запрос на генерацию PDF
    }, 1500);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden w-[95vw]">
        <DialogHeader className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mr-8">
            <div>
              <DialogTitle className="text-xl font-semibold mb-2">{project.title}</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                ID: {project.id} • Создан: {new Date(project.createdAt).toLocaleDateString('ru-RU')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Статус проекта (степпер 1-4) */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Статус проекта</h3>
              <ProjectStatusStepper
                currentStatus={project.status}
                onStatusChange={canEdit ? handleStatusChange : undefined}
                readOnly={!canEdit}
              />
              {!canEdit && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Только ответственный может изменять статус проекта
                </p>
              )}
            </div>

            {/* Описание */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Описание проекта</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {project.description}
              </p>
            </div>

            {/* Метаданные */}
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-2">Ответственный</p>
                {responsible && (
                  <div className="flex items-center gap-2">
                    <UserAvatar name={responsible.name} avatar={responsible.avatar} size="sm" />
                    <span className="text-gray-900">{responsible.name}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Создатель</p>
                {creator && (
                  <div className="flex items-center gap-2">
                    <UserAvatar name={creator.name} avatar={creator.avatar} size="sm" />
                    <span className="text-gray-900">{creator.name}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Отдел</p>
                <p className="text-gray-900">{getDivisionLabel(project.division)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Последнее обновление</p>
                <p className="text-gray-900">{new Date(project.updatedAt).toLocaleDateString('ru-RU')}</p>
              </div>
            </div>

            {/* Связанное исследование */}
            {linkedResearch && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Связанное исследование R&D</h3>
                <Card className="bg-blue-50 border-blue-200" hover>
                  <CardBody className="py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1">{linkedResearch.title}</h4>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {linkedResearch.summary}
                        </p>
                      </div>
                      {onViewResearch && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onViewResearch(linkedResearch.id)}
                        >
                          Открыть
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* Риски */}
            {project.risks && project.risks.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-orange-500" size={20} />
                  Риски проекта
                </h3>
                <ul className="space-y-2">
                  {project.risks.map((risk, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-orange-500 flex-shrink-0 mt-1">⚠️</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Артефакты и документы */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Артефакты и документы</h3>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Download size={16} />}
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? 'Формируется...' : 'Сформировать справку'}
                </Button>
              </div>

              {project.attachments.length === 0 ? (
                <p className="text-gray-500 text-sm">Нет прикрепленных документов</p>
              ) : (
                <AttachmentsList attachments={project.attachments} readOnly />
              )}
            </div>

            {/* История изменений */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">История изменений</h3>
              <div className="space-y-2">
                {project.history.length === 0 ? (
                  <p className="text-gray-500 text-sm">Нет записей в истории</p>
                ) : (
                  project.history.map(entry => {
                    const user = users.find(u => u.id === entry.userId);
                    return (
                      <div key={entry.id} className="flex gap-3 text-sm p-2 bg-gray-50 rounded">
                        <span className="text-gray-500 min-w-[140px]">{formatDateTime(entry.timestamp)}</span>
                        <span className="font-medium text-gray-900">{user?.name}</span>
                        <span className="text-gray-700">{entry.action}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <ShadcnButton variant="ghost" onClick={onClose}>
            Закрыть
          </ShadcnButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}