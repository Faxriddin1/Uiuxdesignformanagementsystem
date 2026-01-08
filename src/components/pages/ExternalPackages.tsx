// Страница реестра внешних пакетов

import { ArrowLeft, Plus, Package, AlertCircle, Clock, CheckCircle, Send } from 'lucide-react';
import { ExternalPackage, User } from '../../types';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { getExternalPackageStatusText, getExternalPackageStatusColor, getDivisionShortText } from '../../utils/statusHelpers';

interface ExternalPackagesProps {
  packages: ExternalPackage[];
  currentUser: User;
  onNavigateBack: () => void;
  onSelectPackage: (packageId: string) => void;
  onCreate: () => void;
}

/**
 * Компонент реестра внешних пакетов
 * Отображает список всех пакетов с фильтрацией по статусам
 */
export function ExternalPackages({
  packages,
  currentUser,
  onNavigateBack,
  onSelectPackage,
  onCreate,
}: ExternalPackagesProps) {
  const getStatusIcon = (status: ExternalPackage['status']) => {
    switch (status) {
      case 'draft':
        return <Package className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'awaiting':
        return <Clock className="w-4 h-4" />;
      case 'received':
        return <CheckCircle className="w-4 h-4" />;
      case 'escalated':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isOverdue = (pkg: ExternalPackage) => {
    if (!pkg.expectedResponseDate || pkg.status === 'received') {
      return false;
    }
    return new Date() > new Date(pkg.expectedResponseDate);
  };

  return (
    <div className="p-8">
      {/* Заголовок и навигация */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onNavigateBack}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl text-gray-900">Внешние пакеты</h1>
          <p className="text-sm text-gray-500 mt-1">
            Трекинг пакетов документов для внешних департаментов
          </p>
        </div>
        <Button onClick={onCreate} icon={<Plus className="w-4 h-4" />}>
          Создать пакет
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Ожидание ответа</div>
                <div className="text-xl text-gray-900">
                  {packages.filter(p => p.status === 'awaiting').length}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Эскалация</div>
                <div className="text-xl text-gray-900">
                  {packages.filter(p => p.status === 'escalated').length}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Получено</div>
                <div className="text-xl text-gray-900">
                  {packages.filter(p => p.status === 'received').length}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Всего</div>
                <div className="text-xl text-gray-900">{packages.length}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Список пакетов */}
      {packages.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="Нет внешних пакетов"
          description="Создайте первый пакет документов для отправки во внешний департамент"
          action={{
            label: 'Создать пакет',
            onClick: onCreate,
          }}
        />
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => {
            const overdue = isOverdue(pkg);

            return (
              <Card
                key={pkg.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectPackage(pkg.id)}
              >
                <CardBody className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Иконка статуса */}
                    <div className={`p-2 rounded-lg ${
                      pkg.status === 'escalated' ? 'bg-red-100 text-red-600' :
                      pkg.status === 'awaiting' ? 'bg-yellow-100 text-yellow-600' :
                      pkg.status === 'received' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getStatusIcon(pkg.status)}
                    </div>

                    {/* Основная информация */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-gray-900 mb-1">{pkg.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                        </div>
                        <StatusBadge
                          label={getExternalPackageStatusText(pkg.status)}
                          color={getExternalPackageStatusColor(pkg.status)}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Адресат</div>
                          <div className="text-gray-900">{pkg.recipient}</div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 mb-1">Канал</div>
                          <div className="text-gray-900">{pkg.channel}</div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 mb-1">Отдел</div>
                          <div className="text-gray-900">{getDivisionShortText(pkg.division)}</div>
                        </div>

                        {pkg.sentAt && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Отправлено</div>
                            <div className="text-gray-900">{formatDate(pkg.sentAt)}</div>
                          </div>
                        )}

                        {pkg.expectedResponseDate && pkg.status !== 'received' && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Ожидаемый ответ</div>
                            <div className={overdue ? 'text-red-600' : 'text-gray-900'}>
                              {formatDate(pkg.expectedResponseDate)}
                              {overdue && ' (просрочено)'}
                            </div>
                          </div>
                        )}

                        {pkg.receivedAt && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Получен ответ</div>
                            <div className="text-green-600">{formatDate(pkg.receivedAt)}</div>
                          </div>
                        )}
                      </div>

                      {/* Вложения */}
                      {pkg.attachments.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <Package className="w-3 h-3" />
                          <span>{pkg.attachments.length} файл(ов)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
