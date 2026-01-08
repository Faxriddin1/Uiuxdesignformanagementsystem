/**
 * Поле ввода с поддержкой @mentions и автокомплитом пользователей
 */

import { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { UserAvatar } from './ui/UserAvatar';
import { users } from '../data/mockData';

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  availableUsers?: User[]; // Пользователи для автокомплита (по умолчанию - все)
}

export function MentionInput({
  value,
  onChange,
  placeholder = 'Введите текст...',
  className = '',
  minRows = 3,
  maxRows = 10,
  availableUsers = users
}: MentionInputProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Найти позицию @ перед курсором
   */
  const findMentionStart = (text: string, cursorPos: number): number => {
    let pos = cursorPos - 1;
    while (pos >= 0) {
      if (text[pos] === '@') {
        // Проверить, что @ находится в начале или после пробела
        if (pos === 0 || text[pos - 1] === ' ' || text[pos - 1] === '\n') {
          return pos;
        }
      }
      if (text[pos] === ' ' || text[pos] === '\n') {
        break;
      }
      pos--;
    }
    return -1;
  };

  /**
   * Обработчик изменения текста
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Найти @ перед курсором
    const mentionStart = findMentionStart(newValue, cursorPos);

    if (mentionStart >= 0) {
      // Извлечь поисковый запрос
      const query = newValue.substring(mentionStart + 1, cursorPos);
      
      // Показать автокомплит, если запрос не содержит пробелов
      if (!query.includes(' ') && !query.includes('\n')) {
        setSearchQuery(query);
        setShowAutocomplete(true);
        setSelectedIndex(0);

        // Вычислить позицию автокомплита
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const coords = getCaretCoordinates(textarea, mentionStart);
          setAutocompletePosition({
            top: coords.top + 20,
            left: coords.left
          });
        }
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }

    // Извлечь упоминания
    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
  };

  /**
   * Извлечь ID упомянутых пользователей
   */
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]); // ID пользователя
    }

    return mentions;
  };

  /**
   * Получить координаты курсора в textarea
   */
  const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div');
    const style = getComputedStyle(element);
    
    for (const prop of style) {
      div.style.setProperty(prop, style.getPropertyValue(prop));
    }
    
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    
    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
    
    document.body.appendChild(div);
    
    const coordinates = {
      top: span.offsetTop,
      left: span.offsetLeft
    };
    
    document.body.removeChild(div);
    return coordinates;
  };

  /**
   * Фильтрация пользователей для автокомплита
   */
  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5); // Показывать максимум 5 результатов

  /**
   * Вставить упоминание пользователя
   */
  const insertMention = (user: User) => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const mentionStart = findMentionStart(value, cursorPos);

    if (mentionStart >= 0) {
      const before = value.substring(0, mentionStart);
      const after = value.substring(cursorPos);
      const mention = `@[${user.name}](${user.id})`;
      const newValue = before + mention + ' ' + after;

      const mentions = extractMentions(newValue);
      onChange(newValue, mentions);

      setShowAutocomplete(false);

      // Установить курсор после упоминания
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = before.length + mention.length + 1;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  /**
   * Обработчик клавиш для навигации по автокомплиту
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showAutocomplete) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredUsers.length > 0) {
      e.preventDefault();
      insertMention(filteredUsers[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  /**
   * Отрендерить текст с подсветкой упоминаний
   */
  const renderDisplayText = (text: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    return text.replace(mentionRegex, '@$1');
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={minRows}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className}`}
        style={{
          minHeight: `${minRows * 1.5}rem`,
          maxHeight: `${maxRows * 1.5}rem`
        }}
      />

      {/* Автокомплит */}
      {showAutocomplete && filteredUsers.length > 0 && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{
            top: `${autocompletePosition.top}px`,
            left: `${autocompletePosition.left}px`,
            minWidth: '250px'
          }}
        >
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Подсказка */}
      <p className="text-xs text-gray-500 mt-1">
        Используйте @ для упоминания пользователей
      </p>
    </div>
  );
}
