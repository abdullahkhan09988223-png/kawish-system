'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Student = {
  id: string;
  firstName: string;
  lastName: string | null;
  fatherName: string | null;
  studentNumber: string;
  classRoom: { name: string } | null;
};

type Certificate = {
  id: string;
  serialNumber: string;
  type: string;
  title: string;
  recipientName: string;
  fatherName: string | null;
  className: string | null;
  courseName: string | null;
  issuedAt: string | null;
  template: string;
  createdAt: string;
};

const TYPES = [
  { key: 'APPRECIATION', fa: 'تقدیرنامه', icon: '🏆', color: '#f59e0b', bg: '#fef3c7' },
  { key: 'GRADUATION', fa: 'تصدیق‌نامه فراغت', icon: '🎓', color: '#10b981', bg: '#d1fae5' },
  { key: 'COURSE', fa: 'تصدیق‌نامه کورس', icon: '📘', color: '#0ea5e9', bg: '#f0f9ff' },
  { key: 'EMPLOYMENT', fa: 'تصدیق‌نامه اشتغال', icon: '💼', color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'INTRO', fa: 'معرفی‌نامه', icon: '📨', color: '#ec4899', bg: '#fce7f3' },
  { key: 'TESTIMONIAL', fa: 'گواهی‌نامه', icon: '📜', color: '#6366f1', bg: '#e0e7ff' },
];

const TEMPLATES = [
  { key: 'classic', fa: 'کلاسیک طلایی', color: '#b45309', bg: '#fffbeb' },
  { key: 'modern', fa: 'مدرن آبی', color: '#0369a1', bg: '#f0f9ff' },
  { key: 'elegant', fa: 'زیبا سبز', color: '#047857', bg: '#ecfdf5' },
];

const todayFa = () => new Date().toLocaleDateString('fa-IR');

export default function CertificatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<any>({
    type: 'APPRECIATION',
    title: 'تقدیرنامه',
    recipientName: '',
    fatherName: '',
    studentId: '',
    className: '',
    courseName: '',
    startDate: '',
    endDate: '',
    grade: '',
    position: '',
    body: '',
    issuedBy: 'مدیر مرکز آموزشی کاوش',
    issuedAt: todayFa(),
    validUntil: '',
    notes: '',
    template: 'classic',
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/certificates', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' }),
      ]);
      if (cRes.ok) setCerts((await cRes.json()).data || []);
      if (sRes.ok) setStudents((await sRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const filtered = certs.filter((c) => {
    if (filterType && c.type !== filterType) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.recipientName.toLowerCase().includes(q) ||
      c.serialNumber.toLowerCase().includes(q) ||
      (c.className || '').toLowerCase().includes(q) ||
      (c.courseName || '').toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({
      type: 'APPRECIATION',
      title: 'تقدیرنامه',
      recipientName: '',
      fatherName: '',
      studentId: '',
      className: '',
      courseName: '',
      startDate: '',
      endDate: '',
      grade: '',
      position: '',
      body: '',
      issuedBy: 'مدیر مرکز آموزشی کاوش',
      issuedAt: todayFa(),
      validUntil: '',
      notes: '',
      template: 'classic',
    });
    setShowModal(true);
  };

  const openEdit = (c: Certificate) => {
    setEditingId(c.id);
    setForm({
      type: c.type,
      title: c.title,
      recipientName: c.recipientName,
      fatherName: c.fatherName || '',
      studentId: '',
      className: c.className || '',
      courseName: c.courseName || '',
      startDate: '',
      endDate: '',
      grade: '',
      position: '',
      body: '',
      issuedBy: '',
      issuedAt: c.issuedAt || '',
      validUntil: '',
      notes: '',
      template: c.template,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
  };

  const handleTypeChange = (type: string) => {
    const t = TYPES.find((x) => x.key === type);
    setForm((prev: any) => ({
      ...prev,
      type,
      title: t?.fa || prev.title,
    }));
  };

  const handleStudentPick = (id: string) => {
    const s = students.find((x) => x.id === id);
    if (!s) {
      setForm((prev: any) => ({ ...prev, studentId: '' }));
      return;
    }
    setForm((prev: any) => ({
      ...prev,
      studentId: id,
      recipientName: s.firstName + ' ' + (s.lastName || ''),
      fatherName: s.fatherName || '',
      className: s.classRoom?.name || prev.className,
    }));
  };

  const handleSave = async () => {
    if (!form.recipientName || !form.title || !form.body) {
      alert('نام، عنوان و متن سند الزامی است');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? '/api/certificates/' + editingId : '/api/certificates';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');
      closeModal();
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, serial: string) => {
    if (!confirm('حذف سند «' + serial + '»؟')) return;
    try {
      await fetch('/api/certificates/' + id, { method: 'DELETE' });
      await loadAll();
    } catch { alert('خطا'); }
  };

  const fmtDate = (d: string | null) => d || '—';

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="certificates" />

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
                📜 تقدیرنامه و تصدیق‌نامه
              </h1>
              <p style={{ color: '#64748b' }}>صدور و مدیریت اسناد رسمی</p>
            </div>
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
              <span>صدور سند جدید</span>
            </button>
          </div>

          {/* کارت‌های نوع */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {TYPES.map((t) => {
              const count = certs.filter((c) => c.type === t.key).length;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilterType(filterType === t.key ? '' : t.key)}
                  className="p-3 rounded-2xl text-center transition-all"
                  style={{
                    background: filterType === t.key ? t.color : 'white',
                    color: filterType === t.key ? 'white' : t.color,
                    border: '2px solid ' + (filterType === t.key ? t.color : '#e2e8f0'),
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{t.icon}</div>
                  <p style={{ fontSize: 11, fontWeight: 'bold' }}>{t.fa}</p>
                  <p style={{ fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>{count}</p>
                </button>
              );
            })}
          </div>

          {/* جستجو */}
          <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3" style={{ border: '1px solid #e2e8f0' }}>
            <input
              type="text"
              placeholder="🔍 جستجوی سریال، نام، صنف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#e2e8f0' }}
            />
            {(search || filterType) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterType(''); }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#fee2e2', color: '#dc2626', cursor: 'pointer', border: 'none' }}
              >
                ✕ پاک کردن
              </button>
            )}
          </div>

          {/* لیست */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>نوع</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>سریال نمبر</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>دریافت‌کننده</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>صنف/کورس</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>تاریخ صدور</th>
                    <th className="text-left p-4 text-xs" style={{ color: '#64748b' }}>عملیات</th>
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
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
                        <p style={{ color: '#94a3b8' }}>
                          {certs.length === 0 ? 'هنوز سندی صادر نشده' : 'با این فیلترها نتیجه‌ای یافت نشد'}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.map((c) => {
                    const t = TYPES.find((x) => x.key === c.type) || TYPES[0];
                    return (
                      <tr key={c.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td className="p-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"
                            style={{ background: t.bg, color: t.color }}
                          >
                            {t.icon} {t.fa}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono font-bold" style={{ color: '#0f172a' }}>
                          {c.serialNumber}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-xs" style={{ color: '#0f172a' }}>
                            {c.recipientName}
                          </p>
                          {c.fatherName && (
                            <p className="text-xs" style={{ color: '#94a3b8' }}>ولد {c.fatherName}</p>
                          )}
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#475569' }}>
                          {c.className || c.courseName || '—'}
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#64748b' }}>
                          {fmtDate(c.issuedAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={'/certificates/' + c.id + '/print'}
                              target="_blank"
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                                textDecoration: 'none',
                              }}
                            >
                              🖨️ چاپ
                            </a>
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="p-2 rounded-lg"
                              style={{ color: '#2563eb', cursor: 'pointer', border: 'none', background: 'transparent' }}
                              title="ویرایش"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id, c.serialNumber)}
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

      {/* مودال */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-6">
            <div
              className="flex items-center justify-between p-5 sticky top-0 z-10"
              style={{
                borderBottom: '3px solid #f59e0b',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                borderTopLeftRadius: 16, borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#f59e0b', fontSize: 22 }}
                >
                  📜
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                    {editingId ? 'ویرایش سند' : 'صدور سند جدید'}
                  </h3>
                  <p className="text-xs" style={{ color: '#b45309' }}>
                    سریال نمبر خودکار تعیین می‌شود
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

            <div className="p-5 space-y-5" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* نوع سند */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  📋 نوع سند *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => handleTypeChange(t.key)}
                      className="p-3 rounded-xl text-sm font-bold flex items-center gap-2"
                      style={{
                        background: form.type === t.key ? t.color : t.bg,
                        color: form.type === t.key ? 'white' : t.color,
                        border: '2px solid ' + (form.type === t.key ? t.color : 'transparent'),
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{t.icon}</span>
                      <span>{t.fa}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* قالب */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  🎨 قالب
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setForm({ ...form, template: t.key })}
                      className="p-3 rounded-xl text-sm font-bold"
                      style={{
                        background: form.template === t.key ? t.color : t.bg,
                        color: form.template === t.key ? 'white' : t.color,
                        border: '2px solid ' + (form.template === t.key ? t.color : 'transparent'),
                        cursor: 'pointer',
                      }}
                    >
                      {t.fa}
                    </button>
                  ))}
                </div>
              </div>

              {/* انتخاب دانشجو */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  👤 انتخاب دانشجو (اختیاری — اطلاعات خودکار پر می‌شود)
                </label>
                <select
                  value={form.studentId}
                  onChange={(e) => handleStudentPick(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">-- بدون دانشجو (دستی پر می‌کنم) --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentNumber} — {s.firstName} {s.lastName || ''} {s.classRoom ? '(' + s.classRoom.name + ')' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* عنوان */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  🏷️ عنوان سند *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              {/* نام و ولد */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    نام کامل *
                  </label>
                  <input
                    type="text"
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    ولد
                  </label>
                  <input
                    type="text"
                    value={form.fatherName}
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              {/* صنف و کورس */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    صنف / کورس
                  </label>
                  <input
                    type="text"
                    placeholder="صنف ۱۲ الف / کورس کمپیوتر"
                    value={form.className || form.courseName}
                    onChange={(e) => setForm({ ...form, className: e.target.value, courseName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    درجه / نمره
                  </label>
                  <input
                    type="text"
                    placeholder="ممتاز / 95"
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              {/* تاریخ شروع و ختم */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    تاریخ شروع
                  </label>
                  <input
                    type="text"
                    placeholder="1404/01/01"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    تاریخ ختم
                  </label>
                  <input
                    type="text"
                    placeholder="1404/06/30"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              {/* متن اصلی */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  ✍️ متن سند *
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={5}
                  placeholder="متن کامل تقدیرنامه یا تصدیق‌نامه..."
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#e2e8f0', lineHeight: 2 }}
                />
                <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
                  💡 می‌توانی از این متغیرها استفاده کنی: نام، ولد، صنف، نمره
                </p>
              </div>

              {/* صادرکننده و تاریخ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    صادرکننده
                  </label>
                  <input
                    type="text"
                    value={form.issuedBy}
                    onChange={(e) => setForm({ ...form, issuedBy: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    تاریخ صدور
                  </label>
                  <input
                    type="text"
                    value={form.issuedAt}
                    onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              {/* اعتبار */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    معتبر تا
                  </label>
                  <input
                    type="text"
                    placeholder="1405/12/29"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                    یادداشت داخلی
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>
            </div>

            <div
              className="flex justify-end gap-3 p-5"
              style={{
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
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
                  boxShadow: saving ? 'none' : '0 6px 16px rgba(245,158,11,0.35)',
                }}
              >
                {saving ? '⏳ ذخیره...' : editingId ? '✓ ذخیره' : '✓ صدور سند'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}