'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import {
  getSavedLanguage,
  getTranslation,
  type Language,
  type TranslationKey,
} from '@/lib/translations';

const LOGO_URL =
  'https://i.ibb.co/5WVzgSt6/C7-B9-CCE3-0367-42A6-899-D-91-EE83-D25485.png';

type MenuItem = {
  key: string;
  labelKey: TranslationKey;
  icon: string;
  href: string;
  roles: string[];
};

export const MENU_ITEMS: MenuItem[] = [
  { key: 'dashboard', labelKey: 'dashboard', icon: '📊', href: '/dashboard', roles: ['ADMIN', 'FINANCE'] },
  { key: 'reports', labelKey: 'reports', icon: '📈', href: '/reports', roles: ['ADMIN', 'FINANCE'] },
  { key: 'classRooms', labelKey: 'classRooms', icon: '🏫', href: '/classes', roles: ['ADMIN'] },
  { key: 'students', labelKey: 'students', icon: '👥', href: '/students', roles: ['ADMIN'] },
  { key: 'studentDoc', labelKey: 'studentDoc', icon: '📋', href: '/student-doc', roles: ['ADMIN'] },
  { key: 'transcript', labelKey: 'transcript', icon: '🎓', href: '/transcript', roles: ['ADMIN'] },
  { key: 'rankings', labelKey: 'rankings', icon: '🏆', href: '/rankings', roles: ['ADMIN'] },
  { key: 'teachers', labelKey: 'teachers', icon: '👨‍🏫', href: '/teachers', roles: ['ADMIN'] },
  { key: 'employees', labelKey: 'employees', icon: '👷', href: '/employees', roles: ['ADMIN'] },
  { key: 'subjects', labelKey: 'subjects', icon: '📚', href: '/subjects', roles: ['ADMIN'] },
  { key: 'schedule', labelKey: 'schedule', icon: '🗓️', href: '/schedule', roles: ['ADMIN'] },
  { key: 'enrollments', labelKey: 'enrollments', icon: '📋', href: '/enrollments', roles: ['ADMIN'] },
  { key: 'grades', labelKey: 'grades', icon: '📝', href: '/grades', roles: ['ADMIN'] },
  { key: 'certificates', labelKey: 'certificates', icon: '📜', href: '/certificates', roles: ['ADMIN'] },
  // بخش مالی - حاضری هم اینجا
  { key: 'attendance', labelKey: 'attendance', icon: '📅', href: '/attendance', roles: ['ADMIN', 'FINANCE'] },
  { key: 'fees', labelKey: 'fees', icon: '💰', href: '/fees', roles: ['ADMIN', 'FINANCE'] },
  { key: 'salaries', labelKey: 'salaries', icon: '💵', href: '/salaries', roles: ['ADMIN', 'FINANCE'] },
  { key: 'empSalaries', labelKey: 'empSalaries', icon: '💼', href: '/emp-salaries', roles: ['ADMIN', 'FINANCE'] },
  { key: 'expenses', labelKey: 'expenses', icon: '📉', href: '/expenses', roles: ['ADMIN', 'FINANCE'] },
  // تنظیمات
  { key: 'activityLogs', labelKey: 'activityLogs', icon: '📋', href: '/activity-logs', roles: ['ADMIN'] },
  { key: 'backupPage', labelKey: 'backupPage', icon: '💾', href: '/backup', roles: ['ADMIN'] },
  { key: 'database', labelKey: 'database', icon: '🗄️', href: '/database', roles: ['ADMIN'] },
  { key: 'settings', labelKey: 'settings', icon: '⚙️', href: '/settings', roles: ['ADMIN'] },
];

type SidebarProps = {
  active: string;
};

const roleInfo: Record<string, { color: string; icon: string; labelKey: TranslationKey }> = {
  ADMIN: { color: '#3b82f6', icon: '🛡️', labelKey: 'role_admin' },
  FINANCE: { color: '#10b981', icon: '💼', labelKey: 'role_finance' },
};

export default function Sidebar({ active }: SidebarProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<Language>('fa');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (saved) setUser(JSON.parse(saved));
    setLang(getSavedLanguage());
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('kawish_user');
    sessionStorage.removeItem('kawish_user');
    router.push('/login');
  };

  if (!mounted || !user) return null;

  const t = (key: TranslationKey) => getTranslation(lang, key);
  const userRole = user.role || 'ADMIN';
  const visibleItems = MENU_ITEMS.filter((item) => item.roles.includes(userRole));
  const role = roleInfo[userRole] || roleInfo.ADMIN;

  return (
    <aside className="hidden md:flex w-64 bg-white border-l border-slate-200 flex-col shadow-sm">
      <div className="p-4 border-b border-slate-100 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_URL}
          alt="Kawish Logo"
          width={100}
          height={100}
          style={{ objectFit: 'contain' }}
        />
      </div>

      <div className="px-3 pt-3">
        <div
          className="p-3 rounded-xl flex items-center gap-2"
          style={{ background: role.color + '15' }}
        >
          <span style={{ fontSize: 18 }}>{role.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: '#64748b' }}>{t('your_role')}</p>
            <p className="text-sm font-bold truncate" style={{ color: role.color }}>
              {t(role.labelKey)}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = item.key === active;
          return (
            <a
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#1d4ed8' : '#475569',
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{t(item.labelKey)}</span>
              {isActive && (
                <span
                  className="ms-auto rounded-full"
                  style={{ width: 6, height: 6, background: '#3b82f6' }}
                />
              )}
            </a>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-2">
        <LanguageToggle />
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
          style={{ color: '#dc2626', cursor: 'pointer', border: 'none', background: 'transparent' }}
        >
          <span style={{ fontSize: 18 }}>🚪</span>
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}