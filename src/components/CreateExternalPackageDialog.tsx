import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, Loader2, Package } from 'lucide-react';
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
import { User } from '../types';

const formSchema = z.object({
  title: z.string().min(5, {
    message: 'Название пакета должно содержать минимум 5 символов',
  }),
  description: z.string().min(10, {
    message: 'Описание должно содержать минимум 10 символов',
  }),
  recipient: z.string().min(3, {
    message: 'Укажите адресата (минимум 3 символа)',
  }),
  channel: z.enum(['email', 'sed', 'courier', 'other'], {
    message: 'Выберите канал отправки',
  }),
  responsibleId: z.string({
    message: 'Выберите ответственного',
  }),
  division: z.enum(['rnd', 'it_projects'], {
    message: 'Выберите отдел',
  }),
  linkedTaskId: z.string().optional(),
  linkedProjectId: z.string().optional(),
  expectedResponseDate: z.date().optional(),
});

interface CreateExternalPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  onSubmit: (data: any) => Promise<void>;
}

export function CreateExternalPackageDialog({ 
  open, 
  onOpenChange, 
  currentUser,
  onSubmit 
}: CreateExternalPackageDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Загружаем список сотрудников при открытии диалога
  useEffect(() => {
    if (open) {
      loadEmployees();
    }
  }, [open]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      // Получаем токен из localStorage (используются ключи из client.ts)
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
        // Если ответ - это массив результатов
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
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      recipient: '',
      channel: 'email',
      responsibleId: currentUser.id,
      division: 'rnd',
      linkedTaskId: '',
      linkedProjectId: '',
    },
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        description: values.description,
        recipient: values.recipient,
        channel: values.channel,
        responsible_id: values.responsibleId,
        division: values.division,
        linked_task_id: values.linkedTaskId || undefined,
        linked_project_id: values.linkedProjectId || undefined,
        expected_response_date: values.expectedResponseDate 
          ? values.expectedResponseDate.toISOString().split('T')[0] 
          : undefined,
        status: 'draft',
      });
      
      toast.success('Внешний пакет создан', {
        description: `Пакет "${values.title}" успешно создан`,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Ошибка при создании пакета', {
        description: error.message || 'Попробуйте еще раз',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const channelLabels = {
    email: 'Email',
    sed: 'СЭД',
    courier: 'Курьер',
    other: 'Другое',
  };

  const divisionLabels = {
    rnd: 'Отдел R&D',
    it_projects: 'Отдел IT-проектов',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Создать внешний пакет
          </DialogTitle>
          <DialogDescription>
            Создание пакета документов для отправки во внешние департаменты или организации
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
              {/* Название пакета */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Название пакета *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Например: Запрос согласования интеграции" 
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
                    <FormLabel>Описание *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишите содержание пакета, цель отправки и ожидаемый результат..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Укажите все важные детали для трекинга
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Адресат */}
                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Адресат *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Департамент/Организация" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Внешний получатель
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Канал отправки */}
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Канал отправки *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите канал" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(channelLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Способ доставки
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Ответственный */}
                <FormField
                  control={form.control}
                  name="responsibleId"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Ответственный *</FormLabel>
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
                                  ? "Нет доступных пользователей" 
                                  : "Выберите сотрудника"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Кто отвечает за пакет
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Отдел */}
                <FormField
                  control={form.control}
                  name="division"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Отдел *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите отдел" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(divisionLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Отдел-отправитель
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Ожидаемая дата ответа */}
              <FormField
                control={form.control}
                name="expectedResponseDate"
                render={({ field }: any) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ожидаемая дата ответа (опционально)</FormLabel>
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
                      Когда ожидается получение ответа
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Связанная задача */}
                <FormField
                  control={form.control}
                  name="linkedTaskId"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Связанная задача (опционально)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ID задачи" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Если пакет связан с задачей
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Связанный проект */}
                <FormField
                  control={form.control}
                  name="linkedProjectId"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Связанный проект (опционально)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ID проекта" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Если пакет связан с проектом
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  Создать пакет
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
