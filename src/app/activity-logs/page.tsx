'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Log = {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  recordName: string | null;
  details: string | null;
  createdAt: string;
};

const ACTION_INFO: Record<string, { fa: string; icon: string; color: string; bg: string }> = {
  CREATE: { fa: 'ایجاد', icon: '➕', color: '#047857', bg: '#d1fae5' },
  UPDATE: { fa: 'ویرایش', icon: '✏️', color: '#0369a1', bg: '#f0f9ff' },
  DELETE: { fa: 'حذف', icon: '🗑️', color: '#dc2626', bg: '#fee2e2' },
  LOGIN: { fa: 'ورود', icon: '🔐', color: '#6d28d9', bg: '#f5f3ff' },
  LOGOUT: { fa: 'خروج', icon: '🚪', color: '#64748b', bg: '#f1f5f9' },
  PAYMENT: { fa: 'پرداخت', icon: '💰', color: '#047857', bg: '#d1fae5' },
  BACKUP: { fa: 'پشتیبان', icon: '💾', color: '#b45309', bg: '#fef3c7' },
};

const TABLE_FA: Record<string, string> = {
  students: 'دانشجویان',
  teachers: 'استادان',
  employees: 'کارمندان',
  classRooms: 'صنف‌ها',
  class_rooms: 'صنف‌ها',
  subjects: 'مضامین',
  enrollments: 'ثبت‌نام',
  schedules: 'جدول هفتگی',
  grades: 'نمرات',
  attendances: 'حاضری',
  fees: 'فیس',
  payments: 'پرداخت‌ها',
  salaries: 'معاش استادان',
  emp_salaries: 'معاش کارمندان',
  expenses: 'مصارف',
  certificates: 'تقدیرنامه',
  users: 'کاربران',
  auth: 'احراز هویت',
  backup: 'پشتیبان‌گیری',
};

export default function ActivityLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAction) params.append('action', filterAction);
      if (filterTable) params.append('tableName', filterTable);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      params.append('limit', '500');

      const res = await fetch('/api/activity-logs?' + params.toString(), {
        cache: 'no-store',
      });
      if (res.ok) {
        setLogs((await res.json()).data || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadLogs(); }, [user, filterAction, filterTable, fromDate, toDate]);

  const handleClearOld = async () => {
    if (!confirm('حذف لاگ‌های قدیمی‌تر از ۹۰ روز؟')) return;
    try {
      const res = await fetch('/api/activity-logs', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');
      alert(`✅ ${json.deletedCount} لاگ قدیمی حذف شد`);
      await loadLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = search
    ? logs.filter((l) => {
        const q = search.toLowerCase();
        return (
          (l.userName || '').toLowerCase().includes(q) ||
          (l.recordName || '').toLowerCase().includes(q) ||
          (l.details || '').toLowerCase().includes(q) ||
          l.tableName.toLowerCase().includes(q)
        );
      })
    : logs;

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const date = d.toLocaleDateString('fa-IR');
      const time = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      return { date, time };
    } catch {
      return { date: iso, time: '' };
    }
  };

  if (!user) return null;

  const uniqueTables = Array.from(new Set(logs.map((l) => l.tableName))).sort();

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="activityLogs" />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>
            خوش آمدید، {user.name}
          </h2>
          <div
            className="rounded-full flex items-center justify-center text-white font-bold"
            style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
              fontSize: 14,
            }}
          >
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
                📋 لاگ فعالیت‌ها
              </h1>
              <p style={{ color: '#64748b' }}>
                گزارش کامل تمام تغییرات سیستم
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearOld}
              className="px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                cursor: 'pointer',
                border: '1px solid #fecaca',
              }}
            >
              🧹 پاک‌سازی قدیمی‌ها
            </button>
          </div>

          {/* آمار */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>کل فعالیت‌ها</p>
              <p className="text-2xl font-bold" style={{ color: '#0ea5e9' }}>{logs.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>ایجادها</p>
              <p className="text-2xl font-bold" style={{ color: '#047857' }}>
                {logs.filter((l) => l.action === 'CREATE').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>ویرایش‌ها</p>
              <p className="text-2xl font-bold" style={{ color: '#0369a1' }}>
                {logs.filter((l) => l.action === 'UPDATE').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>حذف‌ها</p>
              <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>
                {logs.filter((l) => l.action === 'DELETE').length}
              </p>
            </div>
          </div>

          {/* فیلترها */}
          <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3" style={{ border: '1px solid #e2e8f0' }}>
            <input
              type="text"
              placeholder="🔍 جستجو در نام کاربر، رکورد، جزئیات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#e2e8f0' }}
            />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[140px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه عملیات</option>
              {Object.entries(ACTION_INFO).map(([key, info]) => (
                <option key={key} value={key}>{info.icon} {info.fa}</option>
              ))}
            </select>
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[160px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه بخش‌ها</option>
              {uniqueTables.map((t) => (
                <option key={t} value={t}>
                  {TABLE_FA[t] || t}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: '#e2e8f0' }}
              placeholder="از تاریخ"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: '#e2e8f0' }}
              placeholder="تا تاریخ"
            />
            {(search || filterAction || filterTable || fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterAction('');
                  setFilterTable('');
                  setFromDate('');
                  setToDate('');
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#fee2e2', color: '#dc2626', cursor: 'pointer', border: 'none' }}
              >
                ✕ پاک کردن
              </button>
            )}
          </div>

          {/* جدول لاگ‌ها */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>تاریخ و ساعت</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>کاربر</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>عملیات</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>بخش</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>رکورد</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>جزئیات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center" style={{ color: '#94a3b8' }}>
                        ⏳ در حال بارگذاری...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                        <p style={{ color: '#94a3b8' }}>
                          {logs.length === 0 ? 'هنوز فعالیتی ثبت نشده' : 'نتیجه‌ای یافت نشد'}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.map((l) => {
                    const actionInfo = ACTION_INFO[l.action] || {
                      fa: l.action,
                      icon: '•',
                      color: '#64748b',
                      bg: '#f1f5f9',
                    };
                    const dt = formatDateTime(l.createdAt);
                    const tableFa = TABLE_FA[l.tableName] || l.tableName;

                    return (
                      <tr key={l.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td className="p-4">
                          <p className="text-xs font-bold" style={{ color: '#0f172a' }}>{dt.date}</p>
                          <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>{dt.time}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold" style={{ color: '#0f172a' }}>
                            {l.userName || '—'}
                          </p>
                          <p className="text-xs" style={{ color: '#94a3b8' }}>
                            {l.userRole === 'ADMIN' ? '🛡️ مدیر' : l.userRole === 'FINANCE' ? '💼 مالی' : ''}
                          </p>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"
                            style={{ background: actionInfo.bg, color: actionInfo.color }}
                          >
                            {actionInfo.icon} {actionInfo.fa}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: '#f5f3ff', color: '#6d28d9' }}
                          >
                            {tableFa}
                          </span>
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#475569' }}>
                          {l.recordName || '—'}
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#64748b', maxWidth: 300 }}>
                          {l.details || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* راهنما */}
          <div
            className="p-4 rounded-xl text-xs"
            style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
          >
            <p style={{ fontWeight: 'bold', marginBottom: 6 }}>💡 نکات:</p>
            <ul style={{ paddingRight: 20, lineHeight: 1.9 }}>
              <li>همه عملیات مهم (ایجاد، ویرایش، حذف) به صورت خودکار ثبت می‌شوند</li>
              <li>هر لاگ شامل: کاربر، زمان، نوع عملیات، بخش و جزئیات</li>
              <li>لاگ‌ها را می‌توانی تا ۹۰ روز نگه داری — بعد خودکار پاک می‌شوند</li>
              <li>این لاگ‌ها برای بررسی و پیگیری مسائل امنیتی بسیار مفید هستند</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}