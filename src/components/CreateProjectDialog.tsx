import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { cn } from './ui/utils';
import { User, ProjectStatus } from '../types';

const formSchema = z.object({
  title: z.string().min(5, {
    message: 'Название проекта должно содержать минимум 5 символов',
  }),
  description: z.string().min(10, {
    message: 'Описание должно содержать минимум 10 символов',
  }),
  ownerId: z.string({ message: 'Выберите владельца проекта' }),
  partnerOrganization: z.string().optional(),
  deadline: z.date({ message: 'Укажите срок завершения проекта' }),
  division: z.enum(['rnd', 'it_projects']),
});

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  onSubmit: (data: any) => Promise<void>;
}

export function CreateProjectDialog({ 
  open, 
  onOpenChange, 
  currentUser,
  onSubmit 
}: CreateProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectOwners, setProjectOwners] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Загружаем список пользователей через API при открытии диалога
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.warn('⚠️ Токен не найден в localStorage');
        setProjectOwners([]);
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
        // Фильтруем пользователей, которые могут быть владельцами проектов
        const owners = usersList.filter(
          (u: User) => ['management_head', 'division_head', 'department_head'].includes(u.role)
        );
        setProjectOwners(owners);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Ошибка загрузки пользователей:', response.status, errorData);
        setProjectOwners([]);
      }
    } catch (error) {
      console.error('❌ Исключение при загрузке пользователей:', error);
      setProjectOwners([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      ownerId: currentUser.id,
      partnerOrganization: '',
      division: currentUser.division as any,
    },
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        description: values.description,
        owner_id: values.ownerId,
        partner_organization: values.partnerOrganization,
        deadline: values.deadline.toISOString().split('T')[0],
        division: values.division,
        status: 'platform_implementation' as ProjectStatus,
      });
      
      toast.success('Проект успешно создан', {
        description: `Проект "${values.title}" был создан`,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Ошибка при создании проекта', {
        description: error.message || 'Попробуйте еще раз',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Создать новый проект</DialogTitle>
          <DialogDescription>
            Заполните информацию о пилотном проекте или партнерском запуске
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
              {/* Название проекта */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Название проекта *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Например: Запуск платформы в регионе X" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Описание */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Описание проекта *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишите цели, задачи и ожидаемые результаты проекта..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Подробное описание поможет участникам понять контекст
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Владелец проекта */}
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Владелец проекта *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loadingUsers || projectOwners.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            loadingUsers 
                              ? "Загрузка..." 
                              : projectOwners.length === 0 
                                ? "Нет доступных пользователей" 
                                : "Выберите владельца"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectOwners.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <span>{user.name}</span>
                              <span className="text-xs text-gray-500">
                                ({user.role === 'management_head' ? 'Руководитель' : 
                                  user.role === 'division_head' ? 'Нач. отдела' : 'Сотрудник'})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Руководитель проекта, ответственный за реализацию
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Организация-партнер */}
              <FormField
                control={form.control}
                name="partnerOrganization"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Организация-партнер (опционально)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Например: ООО 'Компания'" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Укажите организацию, если проект партнерский
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Подразделение */}
              <FormField
                control={form.control}
                name="division"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Подразделение *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите подразделение" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rnd">Отдел R&D</SelectItem>
                        <SelectItem value="it_projects">Отдел IT-проектов</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Подразделение, отвечающее за проект
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Срок завершения */}
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }: any) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Срок завершения *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'dd MMMM yyyy', { locale: ru })
                            ) : (
                              <span>Выберите дату</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          locale={ru}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Планируемая дата завершения проекта
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Создать проект
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
