'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('kawish_theme') as 'light' | 'dark' | null) || 'light';
    setTheme(saved);
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('kawish_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={{
        background: theme === 'dark' ? '#334155' : '#f8fafc',
        color: theme === 'dark' ? '#fbbf24' : '#475569',
        cursor: 'pointer',
      }}
      title={theme === 'light' ? 'تغییر به تم تیره' : 'تغییر به تم روشن'}
    >
      <span style={{ fontSize: 18 }}>{theme === 'light' ? '🌙' : '☀️'}</span>
      <span>{theme === 'light' ? 'تم تیره' : 'تم روشن'}</span>
    </button>
  );
}