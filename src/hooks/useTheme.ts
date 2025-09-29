import { useState, useEffect, useCallback } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((newTheme: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Obtener tema guardado del localStorage o detectar preferencia del sistema
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      
      const initialTheme = savedTheme || systemTheme;
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
      
      // Disparar evento personalizado para notificar el cambio de tema
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: newTheme } }));
    }
  }, [theme, applyTheme]);

  // Durante la hidratación, usar tema por defecto para evitar diferencias
  if (!mounted) {
    return { theme: 'light', toggleTheme: () => {} };
  }

  return { theme, toggleTheme };
};
