'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type ClassRoom = { id: string; name: string };
type Subject = { id: string; name: string; code: string };
type Teacher = { id: string; firstName: string; lastName: string };

type Schedule = {
  id: string;
  classRoomId: string;
  classRoom: { id: string; name: string };
  subjectId: string;
  subject: { id: string; name: string; code: string };
  teacherId: string | null;
  teacher: { id: string; firstName: string; lastName: string } | null;
  dayOfWeek: string;
  timeFrom: string;
  timeTo: string;
  room: string | null;
};

const DAYS = [
  { key: 'شنبه', fa: 'شنبه', en: 'Saturday' },
  { key: 'یکشنبه', fa: 'یکشنبه', en: 'Sunday' },
  { key: 'دوشنبه', fa: 'دوشنبه', en: 'Monday' },
  { key: 'سه‌شنبه', fa: 'سه‌شنبه', en: 'Tuesday' },
  { key: 'چهارشنبه', fa: 'چهارشنبه', en: 'Wednesday' },
  { key: 'پنجشنبه', fa: 'پنجشنبه', en: 'Thursday' },
];

export default function SchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    classRoomId: '', subjectId: '', teacherId: '',
    dayOfWeek: 'شنبه', timeFrom: '08:00', timeTo: '10:00', room: '',
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
      const [sRes, cRes, subRes, tRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/classrooms'),
        fetch('/api/subjects'),
        fetch('/api/teachers'),
      ]);
      if (sRes.ok) setSchedules((await sRes.json()).data || []);
      if (cRes.ok) setClasses((await cRes.json()).data || []);
      if (subRes.ok) setSubjects((await subRes.json()).data || []);
      if (tRes.ok) setTeachers((await tRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const filtered = selectedClass
    ? schedules.filter((s) => s.classRoomId === selectedClass)
    : schedules;

  const openAdd = () => {
    setEditingId(null);
    setForm({
      classRoomId: selectedClass || '',
      subjectId: '',
      teacherId: '',
      dayOfWeek: 'شنبه',
      timeFrom: '08:00',
      timeTo: '10:00',
      room: '',
    });
    setShowModal(true);
  };

  const openEdit = (s: Schedule) => {
    setEditingId(s.id);
    setForm({
      classRoomId: s.classRoomId,
      subjectId: s.subjectId,
      teacherId: s.teacherId || '',
      dayOfWeek: s.dayOfWeek,
      timeFrom: s.timeFrom,
      timeTo: s.timeTo,
      room: s.room || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.classRoomId || !form.subjectId) {
      alert('صنف و مضمون الزامی است');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? '/api/schedules/' + editingId : '/api/schedules';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');
      setShowModal(false);
      await loadAll();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف این تایم؟')) return;
    try {
      await fetch('/api/schedules/' + id, { method: 'DELETE' });
      await loadAll();
    } catch { alert('خطا'); }
  };

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="schedule" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>خوش آمدید، {user.name}</h2>
          <div className="rounded-full flex items-center justify-center text-white font-bold"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', fontSize: 14 }}>
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>جدول هفتگی</h1>
              <p style={{ color: '#64748b' }}>برنامه درسی صنف‌ها</p>
            </div>
            <button onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', cursor: 'pointer' }}>
              <span>+</span><span>افزودن تایم</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <select value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-3 rounded-xl border text-sm outline-none bg-white min-w-[200px]"
              style={{ borderColor: '#e2e8f0' }}>
              <option value="">همه صنف‌ها</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>روز</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>تایم</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>صنف</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>مضمون</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>استاد</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>اتاق</th>
                    <th className="text-left p-4 text-xs" style={{ color: '#64748b' }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-8 text-center" style={{ color: '#94a3b8' }}>در حال بارگذاری...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center" style={{ color: '#94a3b8' }}>تایمی یافت نشد</td></tr>
                  ) : filtered.map((s) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td className="p-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: '#f0f9ff', color: '#0369a1' }}>
                          {s.dayOfWeek}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs" style={{ color: '#475569' }}>
                        {s.timeFrom} - {s.timeTo}
                      </td>
                      <td className="p-3 font-bold" style={{ color: '#0f172a' }}>{s.classRoom.name}</td>
                      <td className="p-3">
                        <p className="font-bold" style={{ color: '#0f172a' }}>{s.subject.name}</p>
                        <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>{s.subject.code}</p>
                      </td>
                      <td className="p-3 text-xs" style={{ color: '#475569' }}>
                        {s.teacher ? s.teacher.firstName + ' ' + s.teacher.lastName : '—'}
                      </td>
                      <td className="p-3 text-xs" style={{ color: '#475569' }}>{s.room || '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(s)} className="p-2 rounded-lg" style={{ color: '#2563eb', cursor: 'pointer' }}>✏️</button>
                          <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg" style={{ color: '#dc2626', cursor: 'pointer' }}>🗑️</button>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '2px solid #0ea5e9', background: '#f8fafc' }}>
              <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                {editingId ? 'ویرایش تایم' : 'افزودن تایم'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-xl" style={{ color: '#94a3b8', cursor: 'pointer' }}>X</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>صنف *</label>
                  <select value={form.classRoomId}
                    onChange={(e) => setForm({ ...form, classRoomId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#e2e8f0' }}>
                    <option value="">-- انتخاب --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>روز هفته *</label>
                  <select value={form.dayOfWeek}
                    onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#e2e8f0' }}>
                    {DAYS.map((d) => (
                      <option key={d.key} value={d.key}>{d.fa}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>مضمون *</label>
                  <select value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#e2e8f0' }}>
                    <option value="">-- انتخاب --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>استاد</label>
                  <select value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#e2e8f0' }}>
                    <option value="">-- انتخاب --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>از ساعت</label>
                  <input type="text" placeholder="08:00" value={form.timeFrom}
                    onChange={(e) => setForm({ ...form, timeFrom: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>تا ساعت</label>
                  <input type="text" placeholder="10:00" value={form.timeTo}
                    onChange={(e) => setForm({ ...form, timeTo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#e2e8f0' }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>اتاق</label>
                <input type="text" value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#e2e8f0' }} />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer' }}>لغو</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: saving ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', cursor: saving ? 'wait' : 'pointer' }}>
                {saving ? 'ذخیره...' : editingId ? 'ذخیره' : 'افزودن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}