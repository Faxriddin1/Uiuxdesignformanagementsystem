/**
 * useExternalPackages - хук для работы с внешними пакетами
 */

import { useState, useEffect, useCallback } from 'react';
import { externalPackagesApi, ExternalPackage as ApiExternalPackage, PaginatedResponse } from '../api/externalPackages';
import { ExternalPackage } from '../types';

interface UseExternalPackagesResult {
  packages: ExternalPackage[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createPackage: (data: Parameters<typeof externalPackagesApi.create>[0]) => Promise<ExternalPackage>;
  updatePackage: (id: string, data: Parameters<typeof externalPackagesApi.update>[1]) => Promise<ExternalPackage>;
  deletePackage: (id: string) => Promise<void>;
}

function mapApiPackageToLocal(pkg: ApiExternalPackage): ExternalPackage {
  return {
    id: pkg.id,
    title: pkg.title,
    description: pkg.description,
    recipient: pkg.recipient,
    channel: pkg.channel,
    status: pkg.status as ExternalPackage['status'],
    division: (pkg.division || 'rnd') as ExternalPackage['division'],
    responsibleId: pkg.responsible?.id || '',
    creatorId: pkg.creator?.id || '',
    linkedTaskId: pkg.linked_task_id || undefined,
    linkedProjectId: pkg.linked_project_id || undefined,
    attachments: [],
    sentAt: pkg.sent_at ? new Date(pkg.sent_at) : undefined,
    expectedResponseDate: pkg.expected_response_date ? new Date(pkg.expected_response_date) : undefined,
    receivedAt: pkg.received_at ? new Date(pkg.received_at) : undefined,
    escalatedAt: pkg.escalated_at ? new Date(pkg.escalated_at) : undefined,
    createdAt: new Date(pkg.created_at),
    updatedAt: new Date(pkg.updated_at),
    log: [],
    comments: [],
  };
}

export function useExternalPackages(): UseExternalPackagesResult {
  const [packages, setPackages] = useState<ExternalPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<ApiExternalPackage> = await externalPackagesApi.list({ page_size: 100 });
      setPackages(response.results.map(mapApiPackageToLocal));
      setTotalCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки внешних пакетов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const createPackage = async (data: Parameters<typeof externalPackagesApi.create>[0]): Promise<ExternalPackage> => {
    const created = await externalPackagesApi.create(data);
    const local = mapApiPackageToLocal(created);
    setPackages(prev => [local, ...prev]);
    return local;
  };

  const updatePackage = async (id: string, data: Parameters<typeof externalPackagesApi.update>[1]): Promise<ExternalPackage> => {
    const updated = await externalPackagesApi.update(id, data);
    const local = mapApiPackageToLocal(updated);
    setPackages(prev => prev.map(p => p.id === id ? local : p));
    return local;
  };

  const deletePackage = async (id: string): Promise<void> => {
    await externalPackagesApi.delete(id);
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  return {
    packages,
    isLoading,
    error,
    totalCount,
    refetch: fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
  };
}

export default useExternalPackages;
