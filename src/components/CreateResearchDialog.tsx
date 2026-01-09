import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, FileText } from 'lucide-react';
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
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/Button';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { User, Division } from '../types';

// Схема валидации
const formSchema = z.object({
  title: z.string().min(5, {
    message: 'Заголовок должен содержать минимум 5 символов',
  }),
  summary: z.string().min(20, {
    message: 'Резюме должно содержать минимум 20 символов',
  }),
  recommendations: z.string().min(10, {
    message: 'Рекомендации должны содержать минимум 10 символов',
  }),
  sources: z.string().optional(), // Вводим как текст, разделенный переносами строки
});

interface CreateResearchDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  currentUser: User;
  onCreate?: (data: any) => void;
}

export function CreateResearchDialog({ 
  open, 
  onOpenChange, 
  children, 
  currentUser,
  onCreate 
}: CreateResearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Управление состоянием открытия
  const isDialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      summary: '',
      recommendations: '',
      sources: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Преобразуем источники из текста в массив
    const sourcesList = values.sources
      ? values.sources.split('\n').filter(s => s.trim().length > 0)
      : [];

    const newResearch = {
      id: Math.random().toString(36).substr(2, 9),
      ...values,
      sources: sourcesList,
      division: currentUser.division,
      authorId: currentUser.id,
      creatorId: currentUser.id,
      status: 'draft',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: [],
      comments: [],
      history: [],
      linkedProjectIds: [],
    };

    console.log('Creating research:', newResearch);
    
    // Имитация загрузки
    setTimeout(() => {
      toast.success('Исследование создано', {
        description: `Исследование "${values.title}" добавлено в черновики`,
      });
      
      if (onCreate) {
        onCreate(newResearch);
      }
      
      setDialogOpen(false);
      form.reset();
    }, 1000);
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-gray-200 flex-shrink-0">
          <DialogTitle>Новое исследование R&D</DialogTitle>
          <DialogDescription>
            Создайте карточку нового исследования. После создания она будет доступна в статусе "Черновик".
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="create-research-form">
                
                {/* Заголовок */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тема исследования</FormLabel>
                      <FormControl>
                        <Input placeholder="Например: Сравнительный анализ архитектурных паттернов для микросервисов" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Резюме (Summary) */}
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Резюме (Summary)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Краткое описание целей и результатов исследования..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Опишите суть исследования и ключевые выводы.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Рекомендации */}
                <FormField
                  control={form.control}
                  name="recommendations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Рекомендации</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Практические рекомендации по внедрению или использованию технологий..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Источники */}
                <FormField
                  control={form.control}
                  name="sources"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Источники</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Укажите ссылки или названия источников (каждый с новой строки)" 
                          className="min-h-[80px] font-mono text-sm"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Каждая ссылка с новой строки.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Загрузка файлов (Заглушка) */}
                <div className="space-y-2">
                  <FormLabel>Вложения</FormLabel>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <FileText className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Перетащите файлы сюда или кликните</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOCX, PNG (макс. 10MB)</p>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Отмена
          </Button>
          <Button type="submit" form="create-research-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать исследование
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}