'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';

type Teacher = { id: string; firstName: string; lastName: string };

type Subject = {
  id: string;
  code: string;
  name: string;
  hours: number;
  category: string;
  description: string | null;
  teacherId: string | null;
  teacher: Teacher | null;
  _count?: { enrollments: number; schedules: number };
};

const EMPTY_FORM = {
  code: '',
  name: '',
  hours: 3,
  category: 'general',
  description: '',
  teacherId: '',
};

const CATEGORY_INFO: Record<string, { fa: string; icon: string; color: string; bg: string }> = {
  math: { fa: 'ریاضی', icon: '📐', color: '#0369a1', bg: '#f0f9ff' },
  computer: { fa: 'کمپیوتر', icon: '💻', color: '#6d28d9', bg: '#f5f3ff' },
  english: { fa: 'انگلیسی', icon: '🌐', color: '#047857', bg: '#d1fae5' },
  general: { fa: 'عمومی', icon: '📚', color: '#b45309', bg: '#fef3c7' },
};

export default function SubjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_FORM);

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        fetch('/api/subjects', { cache: 'no-store' }),
        fetch('/api/teachers', { cache: 'no-store' }),
      ]);
      if (sRes.ok) setSubjects((await sRes.json()).data || []);
      if (tRes.ok) setTeachers((await tRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s: Subject) => {
    setEditingId(s.id);
    setForm({
      code: s.code,
      name: s.name,
      hours: s.hours || 3,
      category: s.category || 'general',
      description: s.description || '',
      teacherId: s.teacherId || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      alert('نام و کد مضمون الزامی است');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? '/api/subjects/' + editingId : '/api/subjects';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      await logAction({
        action: editingId ? 'UPDATE' : 'CREATE',
        tableName: 'subjects',
        recordName: form.name + ' (' + form.code + ')',
        details: editingId ? 'ویرایش مضمون' : 'افزودن مضمون جدید',
      });

      closeModal();
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm('حذف مضمون «' + name + '»؟')) return;
    try {
      await fetch('/api/subjects/' + id, { method: 'DELETE' });
      await logAction({
        action: 'DELETE',
        tableName: 'subjects',
        recordId: id,
        recordName: name,
        details: 'حذف مضمون',
      });
      await loadAll();
    } catch { alert('خطا'); }
  };

  const filtered = subjects.filter((s) => {
    if (filterCategory && s.category !== filterCategory) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.teacher ? (s.teacher.firstName + ' ' + s.teacher.lastName).toLowerCase().includes(q) : false)
    );
  });

  if (!user) return null;

  // شمارش دسته‌ها
  const categoryCounts = {
    math: subjects.filter((s) => s.category === 'math').length,
    computer: subjects.filter((s) => s.category === 'computer').length,
    english: subjects.filter((s) => s.category === 'english').length,
    general: subjects.filter((s) => s.category === 'general').length,
  };

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="subjects" />

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
                مدیریت مضامین
              </h1>
              <p style={{ color: '#64748b' }}>لیست مضامین ثبت‌شده در سیستم</p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span>+</span><span>افزودن مضمون</span>
            </button>
          </div>

          {/* کارت‌های دسته‌بندی */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(CATEGORY_INFO) as string[]).map((key) => {
              const info = CATEGORY_INFO[key];
              const count = categoryCounts[key as keyof typeof categoryCounts];
              const isActive = filterCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilterCategory(isActive ? '' : key)}
                  className="bg-white rounded-2xl p-4 text-right transition-all"
                  style={{
                    border: isActive ? '2px solid ' + info.color : '1px solid #e2e8f0',
                    background: isActive ? info.bg : 'white',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 8px 24px ' + info.color + '30' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-xl flex items-center justify-center"
                      style={{ width: 44, height: 44, background: info.bg, fontSize: 22 }}
                    >
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#64748b' }}>{info.fa}</p>
                      <p className="text-2xl font-bold" style={{ color: info.color }}>
                        {count}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="🔍 جستجو بر اساس نام، کد یا استاد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: '#e2e8f0' }}
            />
          </div>

          {/* لیست مضامین */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div
                className="col-span-full p-8 text-center bg-white rounded-2xl"
                style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
              >
                در حال بارگذاری...
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="col-span-full p-8 text-center bg-white rounded-2xl"
                style={{ color: '#94a3b8', border: '1px solid #e2e8f0' }}
              >
                مضمونی یافت نشد
              </div>
            ) : (
              filtered.map((s) => {
                const cat = CATEGORY_INFO[s.category] || CATEGORY_INFO.general;
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl p-5"
                    style={{ border: '1px solid #e2e8f0', borderTop: '4px solid ' + cat.color }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="rounded-xl flex items-center justify-center text-2xl"
                        style={{ width: 48, height: 48, background: cat.bg }}
                      >
                        {cat.icon}
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg"
                          style={{ color: '#2563eb', cursor: 'pointer', border: 'none', background: 'transparent' }}
                          title="ویرایش"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 rounded-lg"
                          style={{ color: '#dc2626', cursor: 'pointer', border: 'none', background: 'transparent' }}
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {cat.icon} {cat.fa}
                    </span>

                    <h3 className="font-bold text-lg mb-1" style={{ color: '#0f172a' }}>
                      {s.name}
                    </h3>
                    <p className="text-xs font-mono mb-3" style={{ color: '#94a3b8' }}>
                      {s.code}
                    </p>

                    {s.description && (
                      <p className="text-xs mb-3" style={{ color: '#64748b' }}>
                        {s.description}
                      </p>
                    )}

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span style={{ color: '#64748b' }}>استاد:</span>
                        <span className="font-bold" style={{ color: '#0f172a' }}>
                          {s.teacher ? s.teacher.firstName + ' ' + s.teacher.lastName : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <span className="text-xs" style={{ color: '#64748b' }}>
                        ثبت‌نام:
                      </span>
                      <div className="flex gap-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: '#eff6ff', color: '#1d4ed8' }}
                        >
                          👥 {s._count?.enrollments || 0}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: '#fef3c7', color: '#b45309' }}
                        >
                          ⏰ {s.hours} ساعت
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{
                borderBottom: '2px solid #f59e0b',
                background: '#fffbeb',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                {editingId ? 'ویرایش مضمون' : 'افزودن مضمون'}
              </h3>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    کد مضمون *
                  </label>
                  <input
                    type="text"
                    placeholder="MATH-10"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    ساعت درسی
                  </label>
                  <input
                    type="number"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                  نام مضمون *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                  دسته‌بندی *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(CATEGORY_INFO) as string[]).map((key) => {
                    const info = CATEGORY_INFO[key];
                    const isSelected = form.category === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, category: key })}
                        className="p-3 rounded-xl text-center transition-all"
                        style={{
                          background: isSelected ? info.color : info.bg,
                          color: isSelected ? 'white' : info.color,
                          border: '2px solid ' + (isSelected ? info.color : 'transparent'),
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{info.icon}</div>
                        <p className="text-xs font-bold">{info.fa}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                  استاد
                </label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">-- انتخاب استاد --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                  توضیحات
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                  border: 'none',
                }}
              >
                {saving ? '⏳ ذخیره...' : editingId ? '✓ ذخیره' : '✓ افزودن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}