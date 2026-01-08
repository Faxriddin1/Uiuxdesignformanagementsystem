import React, { useState } from 'react';
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
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { cn } from './ui/utils';
import { User, TaskType, TaskPriority, Division, TaskCategory } from '../types';
import { users } from '../data/mockData';

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
  assigneeId: z.string({
    required_error: 'Выберите исполнителя',
  }),
  deadline: z.date({
    required_error: 'Укажите срок выполнения',
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
  
  // Use controlled open state if provided, otherwise local state
  const isDialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      taskType: 'T2',
      priority: 'medium',
      category: 'standard',
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Mock API call
    console.log('Creating task:', values);
    
    // Simulate loading
    setTimeout(() => {
      toast.success('Задача успешно создана', {
        description: `Задача "${values.title}" добавлена в реестр`,
      });
      setDialogOpen(false);
      form.reset();
    }, 1000);
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
                  render={({ field }) => (
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
                  render={({ field }) => (
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
                    render={({ field }) => (
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
                    render={({ field }) => (
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
                  render={({ field }) => (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Исполнитель</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите сотрудника" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.role})
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
                    render={({ field }) => (
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
                  render={({ field }) => (
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
          <Button type="submit" form="create-task-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать задачу
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}