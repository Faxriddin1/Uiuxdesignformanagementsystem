/**
 * AuthContext - контекст аутентификации
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '../api';
import type { UserProfile } from '../api/auth';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      if (authApi.isAuthenticated()) {
        const profile = await authApi.getProfile();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authApi.isAuthenticated()) {
          const profile = await authApi.getProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error('Auth init failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const profile = await authApi.login({ email, password });
    setUser(profile);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
