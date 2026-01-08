/**
 * useTasks - хук для работы с задачами
 */

import { useState, useEffect, useCallback } from 'react';
import { tasksApi, Task, TasksListParams, TaskCreate, TaskUpdate } from '../api';

interface UseTasksResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
  createTask: (data: TaskCreate) => Promise<Task>;
  updateTask: (id: string, data: TaskUpdate) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  changeStatus: (id: string, status: string, comment?: string) => Promise<Task>;
}

export function useTasks(params?: TasksListParams): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tasksApi.list(params);
      setTasks(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки задач');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: TaskCreate): Promise<Task> => {
    const task = await tasksApi.create(data);
    setTasks(prev => [task, ...prev]);
    return task;
  };

  const updateTask = async (id: string, data: TaskUpdate): Promise<Task> => {
    const updated = await tasksApi.update(id, data);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTask = async (id: string): Promise<void> => {
    await tasksApi.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const changeStatus = async (id: string, status: string, comment?: string): Promise<Task> => {
    const updated = await tasksApi.changeStatus(id, status, comment);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  return {
    tasks,
    isLoading,
    error,
    totalCount,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    changeStatus,
  };
}

/**
 * useTask - хук для работы с одной задачей
 */
export function useTask(id: string | null) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!id) {
      setTask(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await tasksApi.get(id);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки задачи');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const submitForReview = async (result: string): Promise<Task> => {
    if (!id) throw new Error('No task id');
    const updated = await tasksApi.submitForReview(id, result);
    setTask(updated);
    return updated;
  };

  const approve = async (comment?: string): Promise<Task> => {
    if (!id) throw new Error('No task id');
    const updated = await tasksApi.approve(id, comment);
    setTask(updated);
    return updated;
  };

  const reject = async (reason: string): Promise<Task> => {
    if (!id) throw new Error('No task id');
    const updated = await tasksApi.reject(id, reason);
    setTask(updated);
    return updated;
  };

  return { 
    task, 
    isLoading, 
    error, 
    refetch: fetchTask, 
    setTask,
    submitForReview,
    approve,
    reject,
  };
}
