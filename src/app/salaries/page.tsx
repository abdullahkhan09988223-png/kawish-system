'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  specialization: string | null;
  salary: number;
  salaryPercent: number;
};

type Salary = {
  id: string;
  teacherId: string;
  fixedAmount: number;
  percent: number;
  amount: number;
  studentsCount: number;
  totalPaidFees: number;
  day: string | null;
  month: string | null;
  year: string | null;
  isPaid: boolean;
  paidDate: string | null;
  notes: string | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
};

const MONTHS = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
const YEARS = ['۱۴۰۳', '۱۴۰۴', '۱۴۰۵', '۱۴۰۶'];

const todayFa = () => new Date().toLocaleDateString('fa-IR');

function todayDay(): string {
  try {
    const parts = todayFa().split('/');
    return parts[2] || '';
  } catch {
    return '';
  }
}

function todayMonth(): string {
  try {
    const monthIndex = new Date().getMonth();
    return MONTHS[monthIndex] || 'حمل';
  } catch {
    return 'حمل';
  }
}

type TabKey = 'list' | 'teachers' | 'summary';

export default function SalariesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabKey>('list');

  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    teacherId: '',
    fixedAmount: '',
    percent: '',
    amount: '',
    day: todayDay(),
    month: todayMonth(),
    year: '۱۴۰۴',
    isPaid: false,
    notes: '',
    studentsCount: 0,
    totalPaidFees: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN' && u.role !== 'FINANCE') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/teachers', { cache: 'no-store' }),
        fetch('/api/salaries', { cache: 'no-store' }),
      ]);
      if (tRes.ok) setTeachers((await tRes.json()).data || []);
      if (sRes.ok) setSalaries((await sRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const filtered = salaries.filter((s) => {
    if (filterYear && s.year !== filterYear) return false;
    if (filterMonth && s.month !== filterMonth) return false;
    if (filterTeacher && s.teacherId !== filterTeacher) return false;
    if (filterStatus === 'PAID' && !s.isPaid) return false;
    if (filterStatus === 'UNPAID' && s.isPaid) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (s.teacher.firstName + ' ' + s.teacher.lastName).toLowerCase();
      if (!name.includes(q) && !s.teacher.employeeNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totals = {
    all: filtered.reduce((sum, s) => sum + Number(s.amount || 0), 0),
    paid: filtered.filter((s) => s.isPaid).reduce((sum, s) => sum + Number(s.amount || 0), 0),
    unpaid: filtered.filter((s) => !s.isPaid).reduce((sum, s) => sum + Number(s.amount || 0), 0),
    count: filtered.length,
  };

  const teacherStats = teachers.map((t) => {
    const teacherSalaries = salaries.filter((s) => s.teacherId === t.id);
    const paid = teacherSalaries.filter((s) => s.isPaid).reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const unpaid = teacherSalaries.filter((s) => !s.isPaid).reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const count = teacherSalaries.length;
    return {
      ...t,
      totalPaid: paid,
      totalUnpaid: unpaid,
      count,
    };
  });

  const monthlySummary: Record<string, { paid: number; unpaid: number; count: number }> = {};
  salaries.forEach((s) => {
    const key = (s.year || '—') + ' / ' + (s.month || '—');
    if (!monthlySummary[key]) monthlySummary[key] = { paid: 0, unpaid: 0, count: 0 };
    monthlySummary[key].count++;
    if (s.isPaid) monthlySummary[key].paid += Number(s.amount || 0);
    else monthlySummary[key].unpaid += Number(s.amount || 0);
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({
      teacherId: '',
      fixedAmount: '',
      percent: '',
      amount: '',
      day: todayDay(),
      month: todayMonth(),
      year: '۱۴۰۴',
      isPaid: false,
      notes: '',
      studentsCount: 0,
      totalPaidFees: 0,
    });
    setShowModal(true);
  };

  const openAddForTeacher = async (t: Teacher) => {
    // گرفتن محاسبه خودکار
    let studentsCount = 0;
    let totalPaidFees = 0;
    try {
      const res = await fetch('/api/salaries/calculate', { cache: 'no-store' });
      if (res.ok) {
        const list = (await res.json()).data || [];
        const found = list.find((x: any) => x.id === t.id);
        if (found) {
          studentsCount = found.studentsCount || 0;
          totalPaidFees = found.totalPaid || 0;
        }
      }
    } catch {}

    const fixedAmount = Number(t.salary || 0);
    const percent = Number(t.salaryPercent || 0);
    const percentAmount = Math.round((totalPaidFees * percent) / 100);

    setEditingId(null);
    setForm({
      teacherId: t.id,
      fixedAmount: String(fixedAmount),
      percent: String(percent),
      amount: String(fixedAmount + percentAmount),
      day: todayDay(),
      month: todayMonth(),
      year: '۱۴۰۴',
      isPaid: false,
      notes: '',
      studentsCount,
      totalPaidFees,
    });
    setShowModal(true);
  };

  const openEdit = (s: Salary) => {
    setEditingId(s.id);
    setForm({
      teacherId: s.teacherId,
      fixedAmount: String(s.fixedAmount || 0),
      percent: String(s.percent || 0),
      amount: String(s.amount || 0),
      day: s.day || '',
      month: s.month || '',
      year: s.year || '',
      isPaid: s.isPaid,
      notes: s.notes || '',
      studentsCount: s.studentsCount || 0,
      totalPaidFees: s.totalPaidFees || 0,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
  };

  // وقتی استاد عوض شد، اطلاعات بارگذاری شود
  const handleTeacherChange = async (teacherId: string) => {
    const t = teachers.find((x) => x.id === teacherId);
    if (!t) {
      setForm({ ...form, teacherId: '', fixedAmount: '', percent: '', amount: '' });
      return;
    }

    let studentsCount = 0;
    let totalPaidFees = 0;
    try {
      const res = await fetch('/api/salaries/calculate', { cache: 'no-store' });
      if (res.ok) {
        const list = (await res.json()).data || [];
        const found = list.find((x: any) => x.id === teacherId);
        if (found) {
          studentsCount = found.studentsCount || 0;
          totalPaidFees = found.totalPaid || 0;
        }
      }
    } catch {}

    const fixedAmount = Number(t.salary || 0);
    const percent = Number(t.salaryPercent || 0);
    const percentAmount = Math.round((totalPaidFees * percent) / 100);

    setForm({
      ...form,
      teacherId,
      fixedAmount: String(fixedAmount),
      percent: String(percent),
      amount: String(fixedAmount + percentAmount),
      studentsCount,
      totalPaidFees,
    });
  };

  // محاسبه‌ی خودکار مبلغ پیشنهادی
  const computeSuggestedAmount = (): number => {
    const fixed = Number(form.fixedAmount) || 0;
    const pct = Number(form.percent) || 0;
    const paidFees = Number(form.totalPaidFees) || 0;
    return fixed + Math.round((paidFees * pct) / 100);
  };

  const handleSave = async () => {
    if (!form.teacherId) { alert('استاد را انتخاب کنید'); return; }
    if (!form.amount && !form.fixedAmount) { alert('مبلغ را وارد کنید'); return; }
    setSaving(true);
    try {
      const url = editingId ? '/api/salaries/' + editingId : '/api/salaries';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fixedAmount: Number(String(form.fixedAmount).replace(/[^0-9.]/g, '')) || 0,
          percent: Number(String(form.percent).replace(/[^0-9.]/g, '')) || 0,
          amount: Number(String(form.amount).replace(/[^0-9.]/g, '')) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      const teacher = teachers.find((t) => t.id === form.teacherId);
      await logAction({
        action: editingId ? 'UPDATE' : 'CREATE',
        tableName: 'salaries',
        recordName: teacher ? teacher.firstName + ' ' + teacher.lastName : '',
        details: (editingId ? 'ویرایش' : 'ثبت') + ' معاش — ماه ' + form.month + ' — ' + form.amount + ' AFN',
      });

      closeModal();
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm('این معاش پرداخت شده علامت بزنیم؟')) return;
    try {
      await fetch('/api/salaries/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markPaid: true }),
      });
      await loadAll();
    } catch { alert('خطا'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف این معاش؟')) return;
    try {
      await fetch('/api/salaries/' + id, { method: 'DELETE' });
      await logAction({
        action: 'DELETE',
        tableName: 'salaries',
        recordId: id,
        details: 'حذف معاش',
      });
      await loadAll();
    } catch { alert('خطا'); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (!user) return null;

  const TABS: Array<{ key: TabKey; label: string; icon: string; count?: number }> = [
    { key: 'list', label: 'لیست معاشات', icon: '📋', count: salaries.length },
    { key: 'teachers', label: 'به تفکیک استاد', icon: '👨‍🏫', count: teachers.length },
    { key: 'summary', label: 'خلاصه ماهانه', icon: '📊' },
  ];

  const suggestedAmount = computeSuggestedAmount();

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="salaries" />

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
              background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
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
                💵 معاش استادان
              </h1>
              <p style={{ color: '#64748b' }}>
                معاش ثابت + فیصدی از فیس پرداخت‌شده شاگردان
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => router.push('/salaries/calculate')}
                className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2"
                style={{
                  background: '#f1f5f9',
                  color: '#b45309',
                  cursor: 'pointer',
                  border: '2px solid #f59e0b',
                }}
              >
                🧮 محاسبه خودکار
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
                }}
              >
                <span style={{ fontSize: 18 }}>+</span>
                <span>ثبت معاش جدید</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="📋" title="تعداد پرداخت" value={totals.count.toString()} color="#0ea5e9" bg="#f0f9ff" />
            <StatCard icon="💰" title="مجموع کل" value={fmt(totals.all) + ' AFN'} color="#0f172a" bg="#f8fafc" />
            <StatCard icon="✅" title="پرداخت‌شده" value={fmt(totals.paid) + ' AFN'} color="#10b981" bg="#d1fae5" />
            <StatCard icon="⏳" title="باقی‌مانده" value={fmt(totals.unpaid) + ' AFN'} color="#dc2626" bg="#fee2e2" />
          </div>

          <div
            className="bg-white rounded-2xl p-2 flex flex-wrap gap-1"
            style={{ border: '1px solid #e2e8f0' }}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                style={{
                  background: tab === t.key ? '#fef3c7' : 'transparent',
                  color: tab === t.key ? '#b45309' : '#475569',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: tab === t.key ? '#f59e0b' : '#e2e8f0',
                      color: tab === t.key ? '#fff' : '#64748b',
                      fontSize: 10,
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === 'list' && (
            <>
              <div
                className="bg-white rounded-2xl p-4 flex flex-wrap gap-3"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <input
                  type="text"
                  placeholder="🔍 جستجو..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
                <select
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[150px]"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">همه استادان</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[110px]"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">همه ماه‌ها</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[100px]"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">همه سال‌ها</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[120px]"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">همه وضعیت‌ها</option>
                  <option value="PAID">پرداخت‌شده</option>
                  <option value="UNPAID">پرداخت‌نشده</option>
                </select>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>استاد</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>روز</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>ماه</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>سال</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>ثابت</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>فیصدی</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>مبلغ نهایی</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>وضعیت</th>
                        <th className="text-left p-4 text-xs" style={{ color: '#64748b' }}>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="p-12 text-center" style={{ color: '#94a3b8' }}>
                            ⏳ در حال بارگذاری...
                          </td>
                        </tr>
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-12 text-center">
                            <div style={{ fontSize: 48, marginBottom: 12 }}>💵</div>
                            <p style={{ color: '#94a3b8', marginBottom: 12 }}>
                              {salaries.length === 0 ? 'هنوز معاشی ثبت نشده' : 'نتیجه‌ای یافت نشد'}
                            </p>
                          </td>
                        </tr>
                      ) : filtered.map((s) => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td className="p-4">
                            <p className="font-bold text-xs" style={{ color: '#0f172a' }}>
                              {s.teacher.firstName} {s.teacher.lastName}
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                              {s.teacher.employeeNumber}
                            </p>
                          </td>
                          <td className="p-4">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                              style={{ background: '#f0f9ff', color: '#0369a1' }}
                            >
                              {s.day || '—'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold"
                              style={{ background: '#fef3c7', color: '#b45309' }}
                            >
                              {s.month || '—'}
                            </span>
                          </td>
                          <td className="p-4 text-xs" style={{ color: '#64748b' }}>{s.year || '—'}</td>
                          <td className="p-4 text-xs font-mono" style={{ color: '#475569' }}>
                            {fmt(s.fixedAmount || 0)}
                          </td>
                          <td className="p-4">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{
                                background: s.percent > 0 ? '#fef3c7' : '#f1f5f9',
                                color: s.percent > 0 ? '#b45309' : '#94a3b8',
                              }}
                            >
                              {s.percent}%
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-sm font-mono" style={{ color: '#0f172a' }}>
                              {fmt(s.amount)}
                            </span>
                          </td>
                          <td className="p-4">
                            {s.isPaid ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{ background: '#d1fae5', color: '#047857' }}>
                                ✓ پرداخت‌شده
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{ background: '#fee2e2', color: '#dc2626' }}>
                                ⏳ پرداخت‌نشده
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              {!s.isPaid && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkPaid(s.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                                  style={{ background: '#d1fae5', color: '#047857', cursor: 'pointer', border: 'none' }}
                                >
                                  ✓
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEdit(s)}
                                className="p-2 rounded-lg"
                                style={{ color: '#2563eb', cursor: 'pointer', border: 'none', background: 'transparent' }}
                                title="ویرایش"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(s.id)}
                                className="p-2 rounded-lg"
                                style={{ color: '#dc2626', cursor: 'pointer', border: 'none', background: 'transparent' }}
                                title="حذف"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'teachers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherStats.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-5 space-y-3"
                  style={{ border: '1px solid #e2e8f0' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{
                        width: 52, height: 52, fontSize: 20,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                      }}
                    >
                      {t.firstName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                        {t.firstName} {t.lastName}
                      </p>
                      <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                        {t.employeeNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-xl text-center" style={{ background: '#f0f9ff' }}>
                      <p style={{ color: '#0369a1' }}>ثابت</p>
                      <p className="font-bold font-mono" style={{ color: '#0369a1' }}>
                        {fmt(t.salary || 0)}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl text-center" style={{ background: '#fef3c7' }}>
                      <p style={{ color: '#b45309' }}>فیصدی</p>
                      <p className="font-bold" style={{ color: '#b45309' }}>
                        {t.salaryPercent || 0}%
                      </p>
                    </div>
                    <div className="p-2 rounded-xl text-center" style={{ background: '#d1fae5' }}>
                      <p style={{ color: '#047857' }}>پرداخت</p>
                      <p className="font-bold font-mono" style={{ color: '#047857' }}>
                        {fmt(t.totalPaid)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => openAddForTeacher(t)}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      + ثبت معاش
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'summary' && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
              <div className="p-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                  📊 خلاصه ماهانه
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>دوره</th>
                      <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>تعداد</th>
                      <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>پرداخت‌شده</th>
                      <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>پرداخت‌نشده</th>
                      <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>مجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(monthlySummary).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center" style={{ color: '#94a3b8' }}>
                          داده‌ای موجود نیست
                        </td>
                      </tr>
                    ) : Object.entries(monthlySummary)
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([period, data]) => (
                      <tr key={period} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td className="p-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: '#fef3c7', color: '#b45309' }}
                          >
                            {period}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-bold" style={{ color: '#0f172a' }}>{data.count}</td>
                        <td className="p-4 text-xs font-bold" style={{ color: '#10b981' }}>{fmt(data.paid)} AFN</td>
                        <td className="p-4 text-xs font-bold" style={{ color: '#dc2626' }}>{fmt(data.unpaid)} AFN</td>
                        <td className="p-4 text-xs font-bold" style={{ color: '#0f172a' }}>
                          {fmt(data.paid + data.unpaid)} AFN
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* مودال */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{
                borderBottom: '3px solid #f59e0b',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#f59e0b', fontSize: 22 }}
                >
                  💵
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                    {editingId ? 'ویرایش معاش' : 'ثبت معاش جدید'}
                  </h3>
                  <p className="text-xs" style={{ color: '#b45309' }}>
                    معاش ثابت + فیصدی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 rounded-lg text-xl"
                style={{ color: '#94a3b8', cursor: 'pointer', border: 'none', background: 'transparent' }}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  👨‍🏫 استاد *
                </label>
                <select
                  value={form.teacherId}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  disabled={!!editingId}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0', cursor: editingId ? 'not-allowed' : 'pointer' }}
                >
                  <option value="">-- انتخاب استاد --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              {form.teacherId && (
                <div
                  className="p-4 rounded-xl space-y-2 text-xs"
                  style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: '#0369a1' }}>شاگردان:</span>
                    <span className="font-bold" style={{ color: '#0369a1' }}>
                      {form.studentsCount} نفر
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#0369a1' }}>فیس پرداخت‌شده:</span>
                    <span className="font-bold font-mono" style={{ color: '#0369a1' }}>
                      {fmt(form.totalPaidFees)} AFN
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    🏦 معاش ثابت (AFN)
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={form.fixedAmount}
                    onChange={(e) => setForm({ ...form, fixedAmount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    📊 فیصدی (%)
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={form.percent}
                    onChange={(e) => setForm({ ...form, percent: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              {/* محاسبه پیشنهادی */}
              {form.teacherId && (
                <div
                  className="p-4 rounded-xl text-xs"
                  style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}
                >
                  <p style={{ color: '#b45309', marginBottom: 4 }}>💡 محاسبه پیشنهادی:</p>
                  <p className="font-mono font-bold" style={{ color: '#b45309' }}>
                    {fmt(Number(form.fixedAmount) || 0)} + ({fmt(form.totalPaidFees)} × {form.percent || 0}%)
                    = <span style={{ fontSize: 14 }}>{fmt(suggestedAmount)} AFN</span>
                  </p>
                  {String(suggestedAmount) !== form.amount && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, amount: String(suggestedAmount) })}
                      className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: '#f59e0b', color: 'white', cursor: 'pointer', border: 'none' }}
                    >
                      ✓ استفاده از این مبلغ
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  💰 مبلغ نهایی پرداختی (AFN) *
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl border-2 text-2xl outline-none font-mono font-bold"
                  style={{ borderColor: '#f59e0b', background: '#fffbeb', color: '#b45309' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: '#334155' }}>
                    📅 روز
                  </label>
                  <input
                    type="text"
                    value={form.day}
                    onChange={(e) => setForm({ ...form, day: e.target.value })}
                    placeholder="15"
                    className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none font-mono text-center"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: '#334155' }}>
                    📅 ماه
                  </label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none bg-white font-bold"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: '#334155' }}>
                    🗓️ سال
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border-2 text-sm outline-none bg-white font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div
                className="p-4 rounded-xl flex items-center gap-3"
                style={{ background: form.isPaid ? '#d1fae5' : '#fee2e2' }}
              >
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={form.isPaid}
                  onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <label htmlFor="isPaid" className="flex-1 cursor-pointer">
                  <p className="font-bold text-sm" style={{ color: form.isPaid ? '#047857' : '#dc2626' }}>
                    {form.isPaid ? '✅ پرداخت شده' : '⏳ پرداخت نشده'}
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  📝 یادداشت
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>
            </div>

            <div
              className="flex justify-end gap-3 p-5"
              style={{
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#f1f5f9', color: '#475569', cursor: saving ? 'not-allowed' : 'pointer', border: 'none' }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                  border: 'none',
                }}
              >
                {saving ? '⏳ ذخیره...' : editingId ? '✓ ذخیره' : '✓ ثبت معاش'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, title, value, color, bg,
}: { icon: string; title: string; value: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="rounded-xl flex items-center justify-center" style={{ width: 40, height: 40, background: bg, fontSize: 20 }}>
          {icon}
        </div>
      </div>
      <p className="text-xs mb-1" style={{ color: '#64748b' }}>{title}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}