/**
 * useProjects - хук для работы с проектами
 */

import { useState, useEffect, useCallback } from 'react';
import { projectsApi, Project, ProjectsListParams, ProjectCreate, ProjectUpdate } from '../api';

interface UseProjectsResult {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createProject: (data: ProjectCreate) => Promise<Project>;
  updateProject: (id: string, data: ProjectUpdate) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

export function useProjects(params?: ProjectsListParams): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectsApi.list(params);
      setProjects(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки проектов');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: ProjectCreate): Promise<Project> => {
    const project = await projectsApi.create(data);
    setProjects(prev => [project, ...prev]);
    return project;
  };

  const updateProject = async (id: string, data: ProjectUpdate): Promise<Project> => {
    const updated = await projectsApi.update(id, data);
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deleteProject = async (id: string): Promise<void> => {
    await projectsApi.delete(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return {
    projects,
    isLoading,
    error,
    totalCount,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

/**
 * useProject - хук для работы с одним проектом
 */
export function useProject(id: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) {
      setProject(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsApi.get(id);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки проекта');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, isLoading, error, refetch: fetchProject, setProject };
}
