'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Teacher = { id: string; firstName: string; lastName: string };

type ClassRoom = {
  id: string;
  name: string;
  grade: string | null;
  section: string | null;
  capacity: number;
  room: string | null;
  teacherId: string | null;
  teacher: Teacher | null;
  _count: { students: number };
};

export default function ClassesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    name: '', grade: '', section: '', capacity: 30, room: '', teacherId: '',
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
      const [cRes, tRes] = await Promise.all([
        fetch('/api/classrooms'),
        fetch('/api/teachers'),
      ]);
      if (cRes.ok) setClasses((await cRes.json()).data || []);
      if (tRes.ok) setTeachers((await tRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.grade || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.section || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: '', grade: '', section: '', capacity: 30, room: '', teacherId: '',
    });
    setShowModal(true);
  };

  const openEdit = (c: ClassRoom) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      grade: c.grade || '',
      section: c.section || '',
      capacity: c.capacity || 30,
      room: c.room || '',
      teacherId: c.teacherId || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.name.trim()) {
      alert('نام صنف / کورس الزامی است');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? '/api/classrooms/' + editingId : '/api/classrooms';
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm('حذف «' + name + '»؟')) return;
    try {
      await fetch('/api/classrooms/' + id, { method: 'DELETE' });
      await loadAll();
    } catch { alert('خطا'); }
  };

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="classRooms" />

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
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
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
                مدیریت صنف‌ها و کورس‌ها
              </h1>
              <p style={{ color: '#64748b' }}>تعریف صنف، کورس و تخصیص استاد</p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span>+</span><span>افزودن</span>
            </button>
          </div>

          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="جستجو..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: '#e2e8f0' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                صنفی یافت نشد
              </div>
            ) : filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="rounded-xl flex items-center justify-center text-2xl"
                    style={{ width: 48, height: 48, background: '#f5f3ff' }}
                  >
                    🏫
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="p-1.5 rounded-lg"
                      style={{ color: '#2563eb', cursor: 'pointer', border: 'none', background: 'transparent' }}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-1.5 rounded-lg"
                      style={{ color: '#dc2626', cursor: 'pointer', border: 'none', background: 'transparent' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-1" style={{ color: '#0f172a' }}>{c.name}</h3>
                {(c.grade || c.section) && (
                  <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                    {c.grade || ''} {c.section ? '- ' + c.section : ''}
                  </p>
                )}

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>استاد:</span>
                    <span className="font-bold" style={{ color: '#0f172a' }}>
                      {c.teacher ? c.teacher.firstName + ' ' + c.teacher.lastName : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>اتاق:</span>
                    <span className="font-bold" style={{ color: '#0f172a' }}>{c.room || '—'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <span className="text-xs" style={{ color: '#64748b' }}>دانشجو:</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#eff6ff', color: '#1d4ed8' }}
                  >
                    {c._count?.students || 0} / {c.capacity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{ borderBottom: '2px solid #8b5cf6', background: '#f8fafc' }}
            >
              <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                {editingId ? 'ویرایش صنف / کورس' : 'افزودن صنف / کورس'}
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
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                  نام صنف / کورس *
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: صنف ۱۱ الف / کورس کمپیوتر / انگلیسی متوسط"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
                <p className="text-xs mt-1.5" style={{ color: '#94a3b8' }}>
                  هر اسمی که می‌خواهی بنویس — آزاد است
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    پایه / سطح (اختیاری)
                  </label>
                  <input
                    type="text"
                    placeholder="۱۰ / مقدماتی / پیشرفته"
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    شعبه / گروه (اختیاری)
                  </label>
                  <input
                    type="text"
                    placeholder="الف / ب / صبح / عصر"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    ظرفیت
                  </label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    اتاق
                  </label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                  استاد (اختیاری)
                </label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">-- انتخاب --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                  border: 'none',
                }}
              >
                {saving ? 'ذخیره...' : editingId ? 'ذخیره' : 'افزودن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}