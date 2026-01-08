/**
 * Компонент боковой навигации
 * Минималистичный сайдбар с иконками в стиле платформы
 */

import React from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  CheckSquare, 
  FolderKanban, 
  FlaskConical,
  ClipboardList,
  Waves,
  Package,
  TestTube,
  TestTube2,
  Plug
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentUser, currentPage, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Задачи', icon: ListTodo },
    { id: 'projects-and-research', label: 'Проекты и исследования', icon: FolderKanban },
    { id: 'external-packages', label: 'Внешние пакеты', icon: Package },
  ];

  const demoItems = [
    { id: 'integration', label: 'Интеграция P1', icon: Plug },
    { id: 'demo', label: 'Demo P0 (Базовые)', icon: TestTube },
    { id: 'p1-demo', label: 'Demo P1 (Важные)', icon: TestTube2 },
  ];

  return (
    <div className="w-16 bg-[#3B82F6] h-screen flex flex-col items-center py-4 shadow-lg">
      {/* Логотип */}
      <div className="mb-8 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <Waves className="text-white" size={24} />
      </div>

      {/* Меню навигации */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }
              `}
              title={item.label}
            >
              <Icon size={20} />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Demo секция */}
      <div className="border-t border-white/20 pt-4 flex flex-col items-center gap-2">
        {demoItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-yellow-400/30 text-white' 
                  : 'text-white/50 hover:bg-yellow-400/20 hover:text-white'
                }
              `}
              title={item.label}
            >
              <Icon size={18} />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}