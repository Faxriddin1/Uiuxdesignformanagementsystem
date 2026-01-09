import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/Button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { cn } from './ui/utils';
import { User, TaskType, TaskPriority, Division, TaskCategory } from '../types';

const formSchema = z.object({
  title: z.string().min(5, {
    message: 'Заголовок должен содержать минимум 5 символов',
  }),
  description: z.string().min(10, {
    message: 'Описание должно содержать минимум 10 символов',
  }),
  taskType: z.enum(['T1', 'T2']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.enum(['standard', 'external_org', 'external_branch', 'external_management']).default('standard'),
  division: z.enum(['rnd', 'it_projects'], {
    message: 'Выберите отдел',
  }),
  assigneeId: z.string({
    message: 'Выберите исполнителя',
  }),
  deadline: z.date({
    message: 'Укажите срок выполнения',
  }),
  isSecret: z.boolean().default(false),
});

interface CreateTaskDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  currentUser: User;
}

export function CreateTaskDialog({ open, onOpenChange, children, currentUser }: CreateTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // Use controlled open state if provided, otherwise local state
  const isDialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  // Загружаем список сотрудников через API при открытии диалога
  useEffect(() => {
    if (isDialogOpen) {
      loadEmployees();
    }
  }, [isDialogOpen]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.warn('⚠️ Токен не найден в localStorage');
        setEmployees([]);
        return;
      }

      const response = await fetch('/api/v1/users/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const usersList = Array.isArray(data) ? data : (data.results || []);
        console.log('✓ Пользователи загружены из API:', usersList.length);
        setEmployees(usersList);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Ошибка загрузки пользователей:', response.status, errorData);
        setEmployees([]);
      }
    } catch (error) {
      console.error('❌ Исключение при загрузке пользователей:', error);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      taskType: 'T2',
      priority: 'medium',
      category: 'standard',
      division: '',
      isSecret: false,
    },
  });

  const taskType = form.watch('taskType');

  // Effect to handle T1 logic
  React.useEffect(() => {
    if (taskType === 'T1') {
      form.setValue('isSecret', true);
    }
  }, [taskType, form]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Ошибка авторизации', {
          description: 'Токен не найден. Пожалуйста, войдите в систему.',
        });
        return;
      }

      // Форматируем дату в ISO формат (только дата, без времени)
      const deadlineISO = values.deadline.toISOString().split('T')[0];

      const payload = {
        title: values.title,
        description: values.description,
        task_type: values.taskType,
        priority: values.priority,
        category: values.category,
        division: values.division,
        assignee_id: values.assigneeId,
        deadline: deadlineISO,
      };

      console.log('📤 Отправка задачи:', payload);

      const response = await fetch('/api/v1/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Задача создана:', data);
        toast.success('Задача успешно создана', {
          description: `Задача "${values.title}" добавлена в реестр`,
        });
        setDialogOpen(false);
        form.reset();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Ошибка создания задачи:', response.status, errorData);
        
        // Показываем детальные ошибки валидации
        if (errorData && typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          toast.error('Ошибка создания задачи', {
            description: errorMessages || `Код ошибки: ${response.status}`,
          });
        } else {
          toast.error('Ошибка создания задачи', {
            description: `Код ошибки: ${response.status}`,
          });
        }
      }
    } catch (error) {
      console.error('❌ Исключение при создании задачи:', error);
      toast.error('Ошибка сети', {
        description: 'Не удалось подключиться к серверу',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-gray-200 flex-shrink-0">
          <DialogTitle>Создание новой задачи</DialogTitle>
          <DialogDescription>
            Заполните форму для создания новой задачи. Задачи типа T1 автоматически являются секретными.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="create-task-form">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Заголовок задачи</FormLabel>
                      <FormControl>
                        <Input placeholder="Например: Разработка API для мобильного приложения" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Подробное описание задачи, критерии приемки и технические детали..." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taskType"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Тип задачи</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="T2">T2 - Обычная задача</SelectItem>
                            <SelectItem value="T1">T1 - Секретная (Confidential)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          {field.value === 'T1' 
                            ? 'Требует утверждения только Начальником Управления.' 
                            : 'Проходит двухэтапную проверку (Отдел -> Управление).'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Приоритет</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите приоритет" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low (Низкий)</SelectItem>
                            <SelectItem value="medium">Medium (Средний)</SelectItem>
                            <SelectItem value="high">High (Высокий)</SelectItem>
                            <SelectItem value="urgent">Urgent (Срочный)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Категория задачи</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'standard'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">📋 Обычная задача</SelectItem>
                          <SelectItem value="external_org">🏢 Вопрос на сторонней организации</SelectItem>
                          <SelectItem value="external_branch">📍 Вопрос на сторонней филиала</SelectItem>
                          <SelectItem value="external_management">👥 Вопрос на сторонней руководителя</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Выберите категорию для правильной группировки задачи
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="division"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Отдел</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите отдел" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rnd">Отдел R&D</SelectItem>
                          <SelectItem value="it_projects">Отдел IT-проектов</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Исполнитель</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={loadingEmployees || employees.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                loadingEmployees 
                                  ? "Загрузка..." 
                                  : employees.length === 0 
                                    ? "Нет доступных сотрудников" 
                                    : "Выберите сотрудника"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.role === 'management_head' ? 'Руководитель' : 
                                  user.role === 'division_head' ? 'Нач. отдела' : 
                                  user.role === 'department_head' ? 'Нач. департамента' : 'Сотрудник'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }: any) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Срок выполнения</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ru })
                                ) : (
                                  <span>Выберите дату</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isSecret"
                  render={({ field }: any) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Секретная задача
                        </FormLabel>
                        <FormDescription>
                          Доступ только для участников и руководства.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={taskType === 'T1'}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Отмена
          </Button>
          <Button type="submit" form="create-task-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать задачу
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}