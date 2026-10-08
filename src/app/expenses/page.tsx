'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';

type Expense = {
  id: string;
  title: string;
  category: string | null;
  amount: number;
  date: string | null;
  day: string | null;
  month: string | null;
  year: string | null;
  description: string | null;
  paidBy: string | null;
};

const MONTHS = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
const YEARS = ['۱۴۰۳', '۱۴۰۴', '۱۴۰۵', '۱۴۰۶'];

const CATEGORIES = [
  { key: 'خدمات', icon: '⚡', color: '#0ea5e9' },
  { key: 'لوازم', icon: '📦', color: '#8b5cf6' },
  { key: 'ترمیمات', icon: '🔧', color: '#f59e0b' },
  { key: 'معاش', icon: '💵', color: '#10b981' },
  { key: 'اجاره', icon: '🏠', color: '#ec4899' },
  { key: 'سایر', icon: '📌', color: '#64748b' },
];

function todayDay(): string {
  try {
    return new Date().toLocaleDateString('fa-IR').split('/')[2] || '';
  } catch { return ''; }
}

function todayMonth(): string {
  try { return MONTHS[new Date().getMonth()] || 'حمل'; } catch { return 'حمل'; }
}

const EMPTY_FORM = {
  title: '',
  category: 'خدمات',
  amount: '',
  day: todayDay(),
  month: todayMonth(),
  year: '۱۴۰۴',
  description: '',
  paidBy: '',
};

export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);

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
      const params = new URLSearchParams();
      if (filterMonth) params.append('month', filterMonth);
      if (filterYear) params.append('year', filterYear);
      if (filterCategory) params.append('category', filterCategory);

      const res = await fetch('/api/expenses?' + params.toString(), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user, filterMonth, filterYear, filterCategory]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setEditingId(e.id);
    setForm({
      title: e.title,
      category: e.category || 'سایر',
      amount: String(e.amount),
      day: e.day || '',
      month: e.month || '',
      year: e.year || '',
      description: e.description || '',
      paidBy: e.paidBy || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.title || !form.amount) {
      alert('عنوان و مبلغ الزامی است');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? '/api/expenses/' + editingId : '/api/expenses';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          date: form.year && form.month && form.day
            ? form.year + '/' + String(MONTHS.indexOf(form.month) + 1).padStart(2, '0') + '/' + form.day
            : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      await logAction({
        action: editingId ? 'UPDATE' : 'CREATE',
        tableName: 'expenses',
        recordName: form.title,
        details: (editingId ? 'ویرایش' : 'افزودن') + ' مصرف — ' + form.amount + ' AFN',
      });

      closeModal();
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm('حذف مصرف «' + title + '»؟')) return;
    try {
      await fetch('/api/expenses/' + id, { method: 'DELETE' });
      await logAction({
        action: 'DELETE',
        tableName: 'expenses',
        recordId: id,
        recordName: title,
        details: 'حذف مصرف',
      });
      await loadAll();
    } catch { alert('خطا'); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (!user) return null;

  const filtered = search
    ? expenses.filter((e) => {
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q) ||
          (e.paidBy || '').toLowerCase().includes(q)
        );
      })
    : expenses;

  const totalAmount = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  // آمار بر اساس دسته
  const categoryTotals: Record<string, number> = {};
  filtered.forEach((e) => {
    const cat = e.category || 'سایر';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
  });

  const maxCatTotal = Math.max(...Object.values(categoryTotals), 1);

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="expenses" />

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
              background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
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
                📉 مصارف
              </h1>
              <p style={{ color: '#64748b' }}>پیگیری مصارف ماهانه مرکز</p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 8px 24px rgba(239,68,68,0.35)',
              }}
            >
              <span style={{ fontSize: 18 }}>+</span>
              <span>ثبت مصرف جدید</span>
            </button>
          </div>

          {/* آمار کلی */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '2px solid #ef4444', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs mb-1" style={{ color: '#991b1b' }}>مجموع مصارف (فیلتر فعلی)</p>
                <p className="text-3xl font-bold font-mono" style={{ color: '#dc2626' }}>
                  {fmt(totalAmount)} <span className="text-lg">AFN</span>
                </p>
              </div>
              <div
                className="rounded-2xl flex items-center justify-center"
                style={{ width: 70, height: 70, background: '#ef4444', fontSize: 34 }}
              >
                📉
              </div>
            </div>
          </div>

          {/* نمودار دسته‌ها */}
          {Object.keys(categoryTotals).length > 0 && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <h2 className="font-bold mb-4" style={{ color: '#0f172a' }}>📊 مصارف بر اساس دسته</h2>
              <div className="space-y-3">
                {Object.entries(categoryTotals).map(([cat, amount]) => {
                  const catInfo = CATEGORIES.find((c) => c.key === cat) || { icon: '📌', color: '#64748b' };
                  const percent = Math.round((amount / totalAmount) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold" style={{ color: '#0f172a' }}>
                          {catInfo.icon} {cat}
                        </span>
                        <span style={{ color: '#64748b' }}>
                          {fmt(amount)} AFN ({percent}%)
                        </span>
                      </div>
                      <div className="rounded-full overflow-hidden" style={{ height: 8, background: '#f1f5f9' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: (amount / maxCatTotal) * 100 + '%',
                            background: catInfo.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* فیلترها */}
          <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3" style={{ border: '1px solid #e2e8f0' }}>
            <input
              type="text"
              placeholder="🔍 جستجو..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#e2e8f0' }}
            />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[130px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه ماه‌ها</option>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[110px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه سال‌ها</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[140px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه دسته‌ها</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.key}</option>
              ))}
            </select>
            {(filterMonth || filterYear || filterCategory || search) && (
              <button
                type="button"
                onClick={() => {
                  setFilterMonth('');
                  setFilterYear('');
                  setFilterCategory('');
                  setSearch('');
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#fee2e2', color: '#dc2626', cursor: 'pointer', border: 'none' }}
              >
                ✕ پاک کردن
              </button>
            )}
          </div>

          {/* جدول */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>عنوان</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>دسته</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>روز</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>ماه</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>سال</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>مبلغ</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>پرداخت‌کننده</th>
                    <th className="text-left p-4 text-xs" style={{ color: '#64748b' }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center" style={{ color: '#94a3b8' }}>
                        ⏳ در حال بارگذاری...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center">
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📉</div>
                        <p style={{ color: '#94a3b8', marginBottom: 12 }}>
                          {expenses.length === 0 ? 'هنوز مصرفی ثبت نشده' : 'نتیجه‌ای یافت نشد'}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.map((e) => {
                    const catInfo = CATEGORIES.find((c) => c.key === e.category) || { icon: '📌', color: '#64748b' };
                    return (
                      <tr key={e.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td className="p-4">
                          <p className="font-bold text-xs" style={{ color: '#0f172a' }}>{e.title}</p>
                          {e.description && (
                            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                              {e.description}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: catInfo.color + '20', color: catInfo.color }}
                          >
                            {catInfo.icon} {e.category || 'سایر'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                            style={{ background: '#f0f9ff', color: '#0369a1' }}
                          >
                            {e.day || '—'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: '#fef3c7', color: '#b45309' }}
                          >
                            {e.month || '—'}
                          </span>
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#64748b' }}>{e.year || '—'}</td>
                        <td className="p-4">
                          <span className="font-bold text-sm font-mono" style={{ color: '#dc2626' }}>
                            {fmt(e.amount)} AFN
                          </span>
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#64748b' }}>{e.paidBy || '—'}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(e)}
                              className="p-2 rounded-lg"
                              style={{ color: '#2563eb', cursor: 'pointer', border: 'none', background: 'transparent' }}
                              title="ویرایش"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(e.id, e.title)}
                              className="p-2 rounded-lg"
                              style={{ color: '#dc2626', cursor: 'pointer', border: 'none', background: 'transparent' }}
                              title="حذف"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot style={{ background: '#fef2f2', borderTop: '2px solid #ef4444' }}>
                    <tr>
                      <td colSpan={5} className="p-4 text-sm font-bold" style={{ color: '#991b1b' }}>
                        مجموع ({filtered.length} مصرف)
                      </td>
                      <td className="p-4 text-sm font-bold font-mono" style={{ color: '#dc2626' }}>
                        {fmt(totalAmount)} AFN
                      </td>
                      <td colSpan={2} className="p-4" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* مودال */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{
                borderBottom: '3px solid #ef4444',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#ef4444', fontSize: 22 }}
                >
                  📉
                </div>
                <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                  {editingId ? 'ویرایش مصرف' : 'ثبت مصرف جدید'}
                </h3>
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
                  📋 عنوان *
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: برق، اجاره، خرید لوازم..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  🏷️ دسته
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setForm({ ...form, category: c.key })}
                      className="p-2.5 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: form.category === c.key ? c.color : c.color + '20',
                        color: form.category === c.key ? 'white' : c.color,
                        border: '2px solid ' + (form.category === c.key ? c.color : 'transparent'),
                        cursor: 'pointer',
                      }}
                    >
                      {c.icon} {c.key}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  💰 مبلغ (AFN) *
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl border-2 text-2xl outline-none font-mono font-bold"
                  style={{ borderColor: '#ef4444', background: '#fef2f2', color: '#dc2626' }}
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

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  👤 پرداخت‌کننده
                </label>
                <input
                  type="text"
                  placeholder="نام پرداخت‌کننده"
                  value={form.paidBy}
                  onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  📝 توضیحات
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                  border: 'none',
                }}
              >
                {saving ? '⏳ ذخیره...' : editingId ? '✓ ذخیره' : '✓ ثبت مصرف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}