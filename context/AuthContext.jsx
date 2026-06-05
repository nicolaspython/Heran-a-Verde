'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('hv_token');
    if (token) {
      api('/auth/me')
        .then((r) => setUser(r.user))
        .catch(() => localStorage.removeItem('hv_token'))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('hv_token');
    setUser(null);
    toast.success('Você saiu');
    router.push('/');
  };

  const login = (u, token) => {
    localStorage.setItem('hv_token', token);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, authChecked, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
