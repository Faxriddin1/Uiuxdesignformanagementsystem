/**
 * useResearch - хук для работы с исследованиями
 */

import { useState, useEffect, useCallback } from 'react';
import { researchApi, Research, ResearchListParams, ResearchCreate, ResearchUpdate } from '../api';

interface UseResearchesResult {
  researches: Research[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createResearch: (data: ResearchCreate) => Promise<Research>;
  updateResearch: (id: string, data: ResearchUpdate) => Promise<Research>;
  deleteResearch: (id: string) => Promise<void>;
}

export function useResearches(params?: ResearchListParams): UseResearchesResult {
  const [researches, setResearches] = useState<Research[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchResearches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await researchApi.list(params);
      setResearches(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки исследований');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchResearches();
  }, [fetchResearches]);

  const createResearch = async (data: ResearchCreate): Promise<Research> => {
    const research = await researchApi.create(data);
    setResearches(prev => [research, ...prev]);
    return research;
  };

  const updateResearch = async (id: string, data: ResearchUpdate): Promise<Research> => {
    const updated = await researchApi.update(id, data);
    setResearches(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  };

  const deleteResearch = async (id: string): Promise<void> => {
    await researchApi.delete(id);
    setResearches(prev => prev.filter(r => r.id !== id));
  };

  return {
    researches,
    isLoading,
    error,
    totalCount,
    refetch: fetchResearches,
    createResearch,
    updateResearch,
    deleteResearch,
  };
}

/**
 * useResearch - хук для работы с одним исследованием
 */
export function useResearch(id: string | null) {
  const [research, setResearch] = useState<Research | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResearch = useCallback(async () => {
    if (!id) {
      setResearch(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await researchApi.get(id);
      setResearch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки исследования');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  const submitForReview = async (result: string): Promise<Research> => {
    if (!id) throw new Error('No research id');
    const updated = await researchApi.submitForReview(id, result);
    setResearch(updated);
    return updated;
  };

  const approve = async (comment?: string): Promise<Research> => {
    if (!id) throw new Error('No research id');
    const updated = await researchApi.approve(id, comment);
    setResearch(updated);
    return updated;
  };

  const reject = async (reason: string): Promise<Research> => {
    if (!id) throw new Error('No research id');
    const updated = await researchApi.reject(id, reason);
    setResearch(updated);
    return updated;
  };

  return { 
    research, 
    isLoading, 
    error, 
    refetch: fetchResearch, 
    setResearch,
    submitForReview,
    approve,
    reject,
  };
}
