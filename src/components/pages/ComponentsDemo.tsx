// Демонстрационная страница для тестирования новых компонентов

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { TaskTypeBadge } from '../TaskTypeBadge';
import { CoAssigneesList } from '../CoAssigneesList';
import { ResultVersionHistory } from '../ResultVersionHistory';
import { WithdrawModal } from '../WithdrawModal';
import { RejectModal } from '../RejectModal';
import { ApproveModal } from '../ApproveModal';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { tasks } from '../../data/mockData';
import { getTaskStatusText, getTaskStatusColor } from '../../utils/statusHelpers';
import { User } from '../../types';

interface ComponentsDemoProps {
  currentUser: User;
  onNavigateBack: () => void;
}

export function ComponentsDemo({ currentUser, onNavigateBack }: ComponentsDemoProps) {
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  // Возьмем примеры задач для демонстрации
  const t1Task = tasks.find(t => t.taskType === 'T1');
  const t2TaskWithVersions = tasks.find(t => t.id === 't5'); // Задача с отзывом
  const t2TaskWithCoAssignees = tasks.find(t => t.id === 't2'); // Задача с соисполнителями

  return (
    <div className="p-8">
      {/* Заголовок */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onNavigateBack}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl text-gray-900">Тестирование новых компонентов</h1>
          <p className="text-sm text-gray-500 mt-1">Демонстрация P0 компонентов из ТЗ vFinal</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. Бейджи типов задач */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">1. Бейджи типов задач (T1/T2)</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 mb-2">Секретная задача (T1):</div>
              <TaskTypeBadge taskType="T1" />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">Обычная задача (T2):</div>
              <TaskTypeBadge taskType="T2" />
            </div>
          </CardBody>
        </Card>

        {/* 2. Новые статусы */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">2. Новые статусы (двухуровневая приемка)</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-48">На проверке (Нач. отдела):</span>
              <StatusBadge
                label={getTaskStatusText('under_division_review')}
                color={getTaskStatusColor('under_division_review')}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-48">На рассмотрении (Нач. Управления):</span>
              <StatusBadge
                label={getTaskStatusText('under_management_review')}
                color={getTaskStatusColor('under_management_review')}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-48">На доработке (отозвано):</span>
              <StatusBadge
                label={getTaskStatusText('rework_withdrawn')}
                color={getTaskStatusColor('rework_withdrawn')}
              />
            </div>
          </CardBody>
        </Card>

        {/* 3. Соисполнители */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">3. Соисполнители</h2>
          </CardHeader>
          <CardBody>
            {t2TaskWithCoAssignees?.coAssignees && (
              <CoAssigneesList coAssigneeIds={t2TaskWithCoAssignees.coAssignees} />
            )}
          </CardBody>
        </Card>

        {/* 4. История версий результата */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">4. Версии результата (с отзывом)</h2>
          </CardHeader>
          <CardBody>
            {t2TaskWithVersions && (
              <ResultVersionHistory task={t2TaskWithVersions} />
            )}
          </CardBody>
        </Card>

        {/* 5. Модальные окна */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">5. Модальные окна (Отзыв / Возврат / Одобрение)</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex gap-3">
              <Button onClick={() => setWithdrawModalOpen(true)}>
                Открыть "Отзыв с review"
              </Button>
              <Button onClick={() => setRejectModalOpen(true)} variant="secondary">
                Открыть "Возврат на доработку"
              </Button>
              <Button onClick={() => setApproveModalOpen(true)} variant="primary">
                Открыть "Одобрение"
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* 6. Примеры задач из mockData */}
        <Card>
          <CardHeader>
            <h2 className="text-lg text-gray-900">6. Примеры задач из моковых данных</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* T1 задача */}
            {t1Task && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TaskTypeBadge taskType={t1Task.taskType} />
                  <StatusBadge
                    label={getTaskStatusText(t1Task.status, t1Task.taskType)}
                    color={getTaskStatusColor(t1Task.status)}
                  />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{t1Task.title}</h3>
                <p className="text-sm text-gray-600">{t1Task.description}</p>
                {t1Task.resultVersions && t1Task.resultVersions.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    Версий результата: {t1Task.resultVersions.length}
                  </div>
                )}
              </div>
            )}

            {/* T2 задача с соисполнителями */}
            {t2TaskWithCoAssignees && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TaskTypeBadge taskType={t2TaskWithCoAssignees.taskType} />
                  <StatusBadge
                    label={getTaskStatusText(t2TaskWithCoAssignees.status, t2TaskWithCoAssignees.taskType)}
                    color={getTaskStatusColor(t2TaskWithCoAssignees.status)}
                  />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{t2TaskWithCoAssignees.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{t2TaskWithCoAssignees.description}</p>
                {t2TaskWithCoAssignees.coAssignees && (
                  <CoAssigneesList coAssigneeIds={t2TaskWithCoAssignees.coAssignees} />
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Модальные окна */}
      {t1Task && (
        <>
          <WithdrawModal
            isOpen={withdrawModalOpen}
            onClose={() => setWithdrawModalOpen(false)}
            onConfirm={(reason) => {
              console.log('Отозвано с причиной:', reason);
              setWithdrawModalOpen(false);
              alert(`Задача отозвана. Причина: ${reason}`);
            }}
            taskTitle={t1Task.title}
          />

          <RejectModal
            isOpen={rejectModalOpen}
            onClose={() => setRejectModalOpen(false)}
            onConfirm={(reason) => {
              console.log('Возврат с причиной:', reason);
              setRejectModalOpen(false);
              alert(`Задача возвращена на доработку. Причина: ${reason}`);
            }}
            taskTitle={t1Task.title}
          />

          <ApproveModal
            isOpen={approveModalOpen}
            onClose={() => setApproveModalOpen(false)}
            onConfirm={() => {
              console.log('Одобрено');
              setApproveModalOpen(false);
              alert('Задача одобрена!');
            }}
            task={t1Task}
            reviewerLevel="management"
          />
        </>
      )}
    </div>
  );
}