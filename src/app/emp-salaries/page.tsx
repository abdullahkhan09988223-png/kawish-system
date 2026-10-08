'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position: string | null;
  salary: number;
};

type EmpSalary = {
  id: string;
  employeeId: string;
  amount: number;
  day: string | null;
  month: string | null;
  year: string | null;
  isPaid: boolean;
  paidDate: string | null;
  notes: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: string | null;
  };
};

const MONTHS = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
const YEARS = ['۱۴۰۳', '۱۴۰۴', '۱۴۰۵', '۱۴۰۶'];

function todayDay(): string {
  try {
    return new Date().toLocaleDateString('fa-IR').split('/')[2] || '';
  } catch {
    return '';
  }
}

function todayMonth(): string {
  try {
    return MONTHS[new Date().getMonth()] || 'حمل';
  } catch {
    return 'حمل';
  }
}

export default function EmpSalariesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<EmpSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    employeeId: '',
    amount: '',
    day: todayDay(),
    month: todayMonth(),
    year: '۱۴۰۴',
    isPaid: false,
    notes: '',
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
      const [eRes, sRes] = await Promise.all([
        fetch('/api/employees', { cache: 'no-store' }),
        fetch('/api/emp-salaries', { cache: 'no-store' }),
      ]);
      if (eRes.ok) setEmployees((await eRes.json()).data || []);
      if (sRes.ok) setSalaries((await sRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const filtered = salaries.filter((s) => {
    if (filterYear && s.year !== filterYear) return false;
    if (filterMonth && s.month !== filterMonth) return false;
    if (filterEmployee && s.employeeId !== filterEmployee) return false;
    return true;
  });

  const totals = {
    total: filtered.reduce((sum, s) => sum + Number(s.amount || 0), 0),
    paid: filtered.filter((s) => s.isPaid).reduce((sum, s) => sum + Number(s.amount || 0), 0),
    unpaid: filtered.filter((s) => !s.isPaid).reduce((sum, s) => sum + Number(s.amount || 0), 0),
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      employeeId: '',
      amount: '',
      day: todayDay(),
      month: todayMonth(),
      year: '۱۴۰۴',
      isPaid: false,
      notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (s: EmpSalary) => {
    setEditingId(s.id);
    setForm({
      employeeId: s.employeeId,
      amount: String(s.amount),
      day: s.day || '',
      month: s.month || '',
      year: s.year || '',
      isPaid: s.isPaid,
      notes: s.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
  };

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    setForm({
      ...form,
      employeeId,
      amount: emp && !form.amount ? String(emp.salary || 0) : form.amount,
    });
  };

  const handleSave = async () => {
    if (!form.employeeId) { alert('کارمند را انتخاب کنید'); return; }
    if (!form.amount) { alert('مبلغ را وارد کنید'); return; }
    setSaving(true);
    try {
      const url = editingId ? '/api/emp-salaries/' + editingId : '/api/emp-salaries';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(String(form.amount).replace(/[^0-9.]/g, '')) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      const emp = employees.find((e) => e.id === form.employeeId);
      await logAction({
        action: editingId ? 'UPDATE' : 'CREATE',
        tableName: 'emp_salaries',
        recordName: emp ? emp.firstName + ' ' + emp.lastName : '',
        details: (editingId ? 'ویرایش' : 'ثبت') + ' معاش — ماه ' + form.month,
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
      await fetch('/api/emp-salaries/' + id, {
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
      await fetch('/api/emp-salaries/' + id, { method: 'DELETE' });
      await logAction({
        action: 'DELETE',
        tableName: 'emp_salaries',
        recordId: id,
        details: 'حذف معاش کارمند',
      });
      await loadAll();
    } catch { alert('خطا'); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="empSalaries" />

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
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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
                💼 معاش کارمندان
              </h1>
              <p style={{ color: '#64748b' }}>مدیریت معاش ماهانه کارمندان اداری</p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 8px 24px rgba(236,72,153,0.35)',
              }}
            >
              <span style={{ fontSize: 18 }}>+</span>
              <span>ثبت معاش جدید</span>
            </button>
          </div>

          {/* آمار */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>مجموع کل</p>
              <p className="text-2xl font-bold" style={{ color: '#0f172a' }}>
                {fmt(totals.total)} <span className="text-sm" style={{ color: '#94a3b8' }}>AFN</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>پرداخت‌شده</p>
              <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
                {fmt(totals.paid)} <span className="text-sm" style={{ color: '#94a3b8' }}>AFN</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>باقی‌مانده</p>
              <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>
                {fmt(totals.unpaid)} <span className="text-sm" style={{ color: '#94a3b8' }}>AFN</span>
              </p>
            </div>
          </div>

          {/* فیلترها */}
          <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3" style={{ border: '1px solid #e2e8f0' }}>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[180px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه کارمندان</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[120px]"
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
          </div>

          {/* جدول */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>کارمند</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>شماره</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>روز</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>ماه</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>سال</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>مبلغ</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>وضعیت</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>پرداخت</th>
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
                        <div style={{ fontSize: 48, marginBottom: 12 }}>💼</div>
                        <p style={{ color: '#94a3b8', marginBottom: 12 }}>
                          {salaries.length === 0 ? 'هنوز معاشی ثبت نشده' : 'نتیجه‌ای یافت نشد'}
                        </p>
                        {salaries.length === 0 && employees.length > 0 && (
                          <button
                            type="button"
                            onClick={openAdd}
                            className="px-5 py-2.5 rounded-xl text-white font-bold text-sm"
                            style={{
                              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            + اولین معاش
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : filtered.map((s) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td className="p-4">
                        <p className="font-bold text-xs" style={{ color: '#0f172a' }}>
                          {s.employee.firstName} {s.employee.lastName}
                        </p>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>
                          {s.employee.position || '—'}
                        </p>
                      </td>
                      <td className="p-4 text-xs font-mono" style={{ color: '#6d28d9' }}>
                        {s.employee.employeeNumber}
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
                          style={{ background: '#fce7f3', color: '#be185d' }}
                        >
                          {s.month || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-xs" style={{ color: '#64748b' }}>{s.year || '—'}</td>
                      <td className="p-4">
                        <span className="font-bold text-sm font-mono" style={{ color: '#0f172a' }}>
                          {fmt(s.amount)} <span className="text-xs" style={{ color: '#94a3b8' }}>AFN</span>
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
                      <td className="p-4 text-xs" style={{ color: '#64748b' }}>{s.paidDate || '—'}</td>
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
                borderBottom: '3px solid #ec4899',
                background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#ec4899', fontSize: 22 }}
                >
                  💼
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                    {editingId ? 'ویرایش معاش' : 'ثبت معاش کارمند'}
                  </h3>
                  <p className="text-xs" style={{ color: '#be185d' }}>
                    معاش ماهانه اداری
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
                  👷 کارمند *
                </label>
                <select
                  value={form.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  disabled={!!editingId}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0', cursor: editingId ? 'not-allowed' : 'pointer' }}
                >
                  <option value="">-- انتخاب کارمند --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeNumber})
                    </option>
                  ))}
                </select>
                {form.employeeId && (
                  <p className="text-xs mt-2" style={{ color: '#be185d' }}>
                    💡 معاش پیش‌فرض: {fmt(employees.find((e) => e.id === form.employeeId)?.salary || 0)} AFN
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  💰 مبلغ پرداختی (AFN) *
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  autoFocus
                  className="w-full px-4 py-4 rounded-xl border-2 text-2xl outline-none font-mono font-bold"
                  style={{ borderColor: '#ec4899', background: '#fdf2f8', color: '#be185d' }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[5000, 10000, 15000, 20000, 25000, 30000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setForm({ ...form, amount: String(amt) })}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: '#fce7f3', color: '#be185d', cursor: 'pointer', border: 'none' }}
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
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
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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