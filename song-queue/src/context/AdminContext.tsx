'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  password: string;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  password: '',
  login: async () => false,
  logout: () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('adminPassword');
    if (saved) {
      // Verify the saved password on mount
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: saved }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPassword(saved);
            setIsAdmin(true);
          } else {
            // Invalid saved password, clear it
            localStorage.removeItem('adminPassword');
          }
        })
        .catch(() => {
          localStorage.removeItem('adminPassword');
        });
    }
  }, []);

  const login = async (pw: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.success) {
        setPassword(pw);
        setIsAdmin(true);
        localStorage.setItem('adminPassword', pw);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setPassword('');
    setIsAdmin(false);
    localStorage.removeItem('adminPassword');
  };

  return (
    <AdminContext.Provider value={{ isAdmin, password, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
