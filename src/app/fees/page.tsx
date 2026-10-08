'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';

type Student = {
  id: string;
  firstName: string;
  lastName: string | null;
  studentNumber: string;
  isActive: boolean;
  classRoom: { name: string } | null;
};

type Payment = {
  id: string;
  receiptNumber: string;
  amount: number;
  date: string | null;
  method: string | null;
  createdAt: string;
};

type Fee = {
  id: string;
  studentId: string;
  student: Student;
  total: number;
  paid: number;
  month: string | null;
  year: string | null;
  dueDate: string | null;
  status: string;
  notes: string | null;
  payments: Payment[];
};

const MONTHS = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
const YEARS = ['۱۴۰۳', '۱۴۰۴', '۱۴۰۵', '۱۴۰۶'];

const STATUS_FA: Record<string, { fa: string; color: string; bg: string }> = {
  PAID: { fa: 'پرداخت‌شده', color: '#047857', bg: '#d1fae5' },
  PARTIAL: { fa: 'نیمه‌پرداخت', color: '#b45309', bg: '#fef3c7' },
  PENDING: { fa: 'پرداخت‌نشده', color: '#dc2626', bg: '#fee2e2' },
};

export default function FeesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // مودال پرداخت
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'نقدی', notes: '' });

  // مودال افزودن فیس
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    studentId: '',
    total: '',
    month: MONTHS[new Date().getMonth()] || 'حمل',
    year: '۱۴۰۴',
    dueDate: '',
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
      const [fRes, sRes] = await Promise.all([
        fetch('/api/fees', { cache: 'no-store' }),
        fetch('/api/students?active=true', { cache: 'no-store' }),
      ]);
      if (fRes.ok) setFees((await fRes.json()).data || []);
      if (sRes.ok) setStudents((await sRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const filtered = fees.filter((f) => {
    if (filterStatus && f.status !== filterStatus) return false;
    if (filterMonth && f.month !== filterMonth) return false;
    if (filterYear && f.year !== filterYear) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (f.student.firstName + ' ' + (f.student.lastName || '')).toLowerCase();
    return name.includes(q) || f.student.studentNumber.toLowerCase().includes(q);
  });

  const totals = {
    total: filtered.reduce((s, f) => s + Number(f.total || 0), 0),
    paid: filtered.reduce((s, f) => s + Number(f.paid || 0), 0),
    remaining: filtered.reduce((s, f) => s + (Number(f.total || 0) - Number(f.paid || 0)), 0),
  };

  const openPay = (fee: Fee) => {
    setSelectedFee(fee);
    setLastPaymentId(null);
    setPayForm({ amount: '', method: 'نقدی', notes: '' });
    setShowPayModal(true);
  };

  const closePayModal = () => {
    if (saving) return;
    setShowPayModal(false);
    setSelectedFee(null);
    setLastPaymentId(null);
  };

  const handlePay = async () => {
    if (!selectedFee) return;
    const amt = Number(String(payForm.amount).replace(/[^0-9.]/g, '')) || 0;
    if (amt <= 0) { alert('مبلغ را وارد کنید'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/fees/' + selectedFee.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addPayment: amt,
          method: payForm.method,
          notes: payForm.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      if (json.data?.payment?.id) {
        setLastPaymentId(json.data.payment.id);
      }

      await logAction({
        action: 'PAYMENT',
        tableName: 'fees',
        recordName: selectedFee.student.firstName + ' ' + (selectedFee.student.lastName || ''),
        details: 'پرداخت ' + amt + ' AFN — ماه ' + (selectedFee.month || ''),
      });

      await loadAll();
      const updRes = await fetch('/api/fees/' + selectedFee.id, { cache: 'no-store' });
      if (updRes.ok) {
        const upd = await updRes.json();
        setSelectedFee(upd.data);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFee = async () => {
    if (!addForm.studentId) { alert('دانشجو را انتخاب کنید'); return; }
    if (!addForm.total) { alert('مبلغ کل را وارد کنید'); return; }
    if (!addForm.month) { alert('ماه را انتخاب کنید'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          total: Number(String(addForm.total).replace(/[^0-9.]/g, '')) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      await logAction({
        action: 'CREATE',
        tableName: 'fees',
        recordName: 'فیس ماه ' + addForm.month,
        details: 'افزودن فیس جدید — ' + addForm.total + ' AFN',
      });

      setShowAddModal(false);
      setAddForm({
        studentId: '', total: '',
        month: MONTHS[new Date().getMonth()] || 'حمل',
        year: '۱۴۰۴', dueDate: '', notes: '',
      });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!confirm('حذف این فیس؟')) return;
    try {
      await fetch('/api/fees/' + id, { method: 'DELETE' });
      await logAction({
        action: 'DELETE',
        tableName: 'fees',
        recordId: id,
        details: 'حذف فیس',
      });
      await loadAll();
    } catch { alert('خطا'); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (!user) return null;

  const currentRemaining = selectedFee
    ? Number(selectedFee.total) - Number(selectedFee.paid)
    : 0;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="fees" />

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
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
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
                💰 مدیریت فیس
              </h1>
              <p style={{ color: '#64748b' }}>پیگیری پرداخت‌های ماهانه دانشجویان</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => router.push('/fees/receipts')}
                className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
                style={{
                  background: '#f1f5f9',
                  color: '#047857',
                  cursor: 'pointer',
                  border: '2px solid #10b981',
                }}
              >
                🧾 لیست رسیدها
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span>+</span><span>افزودن فیس</span>
              </button>
            </div>
          </div>

          {/* آمار */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>مجموع فیس</p>
              <p className="text-2xl font-bold" style={{ color: '#0ea5e9' }}>
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
                {fmt(totals.remaining)} <span className="text-sm" style={{ color: '#94a3b8' }}>AFN</span>
              </p>
            </div>
          </div>

          {/* فیلترها */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="🔍 جستجوی نام یا شماره دانشجویی..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] px-4 py-3 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: '#e2e8f0' }}
            />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-3 rounded-xl border text-sm outline-none bg-white min-w-[130px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه ماه‌ها</option>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-3 rounded-xl border text-sm outline-none bg-white min-w-[110px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه سال‌ها</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border text-sm outline-none bg-white min-w-[140px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="PAID">پرداخت‌شده</option>
              <option value="PARTIAL">نیمه‌پرداخت</option>
              <option value="PENDING">پرداخت‌نشده</option>
            </select>
          </div>

          {/* جدول */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>دانشجو</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>صنف</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>ماه</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>سال</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>مبلغ کل</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>پرداخت‌شده</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>باقی‌مانده</th>
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
                        <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                        <p style={{ color: '#94a3b8', marginBottom: 12 }}>
                          {fees.length === 0 ? 'هنوز فیسی ثبت نشده' : 'نتیجه‌ای یافت نشد'}
                        </p>
                        {fees.length === 0 && (
                          <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="px-5 py-2.5 rounded-xl text-white font-bold text-sm"
                            style={{
                              background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            + اولین فیس را ثبت کن
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : filtered.map((f) => {
                    const st = STATUS_FA[f.status] || STATUS_FA.PENDING;
                    const remaining = Number(f.total) - Number(f.paid);
                    return (
                      <tr key={f.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td className="p-4">
                          <p className="font-bold text-xs" style={{ color: '#0f172a' }}>
                            {f.student.firstName} {f.student.lastName || ''}
                          </p>
                          <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                            {f.student.studentNumber}
                          </p>
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#475569' }}>
                          {f.student.classRoom ? (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#f5f3ff', color: '#6d28d9' }}
                            >
                              {f.student.classRoom.name}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: '#fef3c7', color: '#b45309' }}
                          >
                            📅 {f.month || '—'}
                          </span>
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#64748b' }}>{f.year || '—'}</td>
                        <td className="p-4 text-xs font-mono" style={{ color: '#0f172a' }}>
                          {fmt(f.total)}
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: '#10b981' }}>
                          {fmt(f.paid)}
                        </td>
                        <td className="p-4 text-xs font-bold font-mono" style={{ color: remaining > 0 ? '#dc2626' : '#10b981' }}>
                          {fmt(remaining)}
                        </td>
                        <td className="p-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {st.fa}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openPay(f)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                            >
                              💵 پرداخت
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFee(f.id)}
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
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* مودال پرداخت */}
      {showPayModal && selectedFee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{
                borderBottom: '2px solid #10b981',
                background: '#f0fdf4',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#10b981', fontSize: 22 }}
                >
                  💰
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                    {lastPaymentId ? '✅ پرداخت موفق' : 'ثبت پرداخت'}
                  </h3>
                  <p className="text-xs" style={{ color: '#047857' }}>
                    {selectedFee.student.firstName} {selectedFee.student.lastName || ''}
                    {selectedFee.month && ' — ماه ' + selectedFee.month}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePayModal}
                disabled={saving}
                className="p-2 rounded-lg text-xl"
                style={{ color: '#94a3b8', cursor: 'pointer', border: 'none', background: 'transparent' }}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {lastPaymentId ? (
                <>
                  <div className="p-6 rounded-xl text-center" style={{ background: '#d1fae5' }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                    <p className="font-bold text-lg" style={{ color: '#047857', marginBottom: 6 }}>
                      پرداخت با موفقیت ثبت شد
                    </p>
                    <p className="text-xs" style={{ color: '#047857' }}>رسید آماده چاپ است</p>
                  </div>
                  <a
                    href={'/fees/receipt/' + lastPaymentId}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 rounded-xl text-white font-bold text-center no-underline block"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                      boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
                    }}
                  >
                    🖨️ چاپ رسید
                  </a>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setLastPaymentId(null);
                        setPayForm({ amount: '', method: 'نقدی', notes: '' });
                      }}
                      className="py-3 rounded-xl font-bold text-sm"
                      style={{ background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', border: 'none' }}
                    >
                      💵 پرداخت دیگر
                    </button>
                    <button
                      type="button"
                      onClick={closePayModal}
                      className="py-3 rounded-xl font-bold text-sm"
                      style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
                    >
                      ✓ بستن
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl space-y-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#64748b' }}>ماه:</span>
                      <span className="font-bold" style={{ color: '#b45309' }}>{selectedFee.month || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#64748b' }}>مبلغ کل:</span>
                      <span className="font-bold font-mono" style={{ color: '#0f172a' }}>{fmt(selectedFee.total)} AFN</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#64748b' }}>پرداخت‌شده:</span>
                      <span className="font-bold font-mono" style={{ color: '#10b981' }}>{fmt(selectedFee.paid)} AFN</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <span className="font-bold" style={{ color: '#64748b' }}>باقی‌مانده:</span>
                      <span className="font-bold text-base font-mono" style={{ color: currentRemaining > 0 ? '#dc2626' : '#10b981' }}>
                        {fmt(currentRemaining)} AFN
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                      💵 مبلغ پرداختی (AFN) *
                    </label>
                    <input
                      type="text"
                      placeholder="مبلغ"
                      value={payForm.amount}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                      autoFocus
                      className="w-full px-4 py-4 rounded-xl border-2 text-2xl outline-none font-mono font-bold"
                      style={{ borderColor: '#10b981', background: '#f0fdf4', color: '#047857' }}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[1000, 2000, 5000, 10000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setPayForm({ ...payForm, amount: String(amt) })}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: '#d1fae5', color: '#047857', cursor: 'pointer', border: 'none' }}
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                      {currentRemaining > 0 && (
                        <button
                          type="button"
                          onClick={() => setPayForm({ ...payForm, amount: String(currentRemaining) })}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: '#fef3c7', color: '#b45309', cursor: 'pointer', border: 'none' }}
                        >
                          پرداخت کامل ({fmt(currentRemaining)})
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                      💳 روش پرداخت
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['نقدی', 'بانکی', 'آنلاین'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPayForm({ ...payForm, method: m })}
                          className="py-2.5 rounded-xl text-sm font-bold"
                          style={{
                            background: payForm.method === m ? '#10b981' : '#f1f5f9',
                            color: payForm.method === m ? 'white' : '#475569',
                            cursor: 'pointer',
                            border: 'none',
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                      📝 یادداشت
                    </label>
                    <input
                      type="text"
                      value={payForm.notes}
                      onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                  </div>
                </>
              )}
            </div>

            {!lastPaymentId && (
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
                  onClick={closePayModal}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl font-bold text-sm"
                  style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
                >
                  لغو
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white"
                  style={{
                    background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                    cursor: saving ? 'wait' : 'pointer',
                    border: 'none',
                  }}
                >
                  {saving ? '⏳ ثبت...' : '✓ ثبت پرداخت'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* مودال افزودن فیس */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{
                borderBottom: '2px solid #0ea5e9',
                background: '#f0f9ff',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#0ea5e9', fontSize: 22 }}
                >
                  💰
                </div>
                <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>افزودن فیس جدید</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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
                  👤 دانشجو *
                </label>
                <select
                  value={addForm.studentId}
                  onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">-- انتخاب دانشجو --</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.studentNumber} — {s.firstName} {s.lastName || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  💵 مبلغ کل (AFN) *
                </label>
                <input
                  type="text"
                  placeholder="12000"
                  value={addForm.total}
                  onChange={(e) => setAddForm({ ...addForm, total: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-lg outline-none font-mono"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    📅 ماه *
                  </label>
                  <select
                    value={addForm.month}
                    onChange={(e) => setAddForm({ ...addForm, month: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white font-bold"
                    style={{ borderColor: '#f59e0b' }}
                  >
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    🗓️ سال
                  </label>
                  <select
                    value={addForm.year}
                    onChange={(e) => setAddForm({ ...addForm, year: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  📅 سررسید
                </label>
                <input
                  type="text"
                  placeholder="1404/06/30"
                  value={addForm.dueDate}
                  onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none font-mono"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  📝 یادداشت
                </label>
                <input
                  type="text"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
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
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleAddFee}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                  border: 'none',
                }}
              >
                {saving ? '⏳ ذخیره...' : '✓ افزودن فیس'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}