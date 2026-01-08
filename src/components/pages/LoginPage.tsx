/**
 * LoginPage - страница авторизации
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { email: 'head@demo.com', role: 'Руководитель управления' },
    { email: 'dept@demo.com', role: 'Начальник отдела' },
    { email: 'employee1@demo.com', role: 'Сотрудник' },
  ];

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Система управления
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Войдите в свой аккаунт
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
            Демо-аккаунты (пароль: demo1234)
          </p>
          <div className="space-y-2">
            {demoUsers.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => handleDemoLogin(user.email)}
                className="w-full text-left px-3 py-2 text-sm rounded-md
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                         text-gray-700 dark:text-gray-300"
              >
                <span className="font-medium">{user.email}</span>
                <span className="text-gray-500 dark:text-gray-500 ml-2">— {user.role}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;
