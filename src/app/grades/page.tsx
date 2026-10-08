'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type ClassRoom = { id: string; name: string };
type Subject = { id: string; name: string; code: string };
type Student = {
  id: string;
  firstName: string;
  lastName: string | null;
  studentNumber: string;
  classRoomId: string | null;
};

type Grade = {
  id: string;
  studentId: string;
  subjectId: string;
  semester: string | null;
  midtermScore: number;
  finalScore: number;
  practicalScore: number;
  totalScore: number;
  notes: string | null;
  student: { id: string; firstName: string; lastName: string | null; studentNumber: string };
  subject: { id: string; name: string; code: string };
};

const SEMESTERS = ['چهارده یک', 'چهارده دو', 'بهار', 'خزان', 'تابستان'];

export default function GradesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filterSubject, setFilterSubject] = useState('');

  const [bulkClass, setBulkClass] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkSemester, setBulkSemester] = useState('چهارده یک');
  const [bulkScores, setBulkScores] = useState<Record<string, any>>({});

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
      const [gRes, cRes, subRes, sRes] = await Promise.all([
        fetch('/api/grades'),
        fetch('/api/classrooms'),
        fetch('/api/subjects'),
        fetch('/api/students'),
      ]);
      if (gRes.ok) setGrades((await gRes.json()).data || []);
      if (cRes.ok) setClasses((await cRes.json()).data || []);
      if (subRes.ok) setSubjects((await subRes.json()).data || []);
      if (sRes.ok) setAllStudents((await sRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  // دانشجویان صنف انتخاب‌شده
  const bulkStudents = bulkClass
    ? allStudents.filter((s) => s.classRoomId === bulkClass)
    : [];

  // وقتی صنف/مضمون/سمستر عوض شد، نمرات قبلی را لود کن
  useEffect(() => {
    const scores: Record<string, any> = {};
    bulkStudents.forEach((s) => {
      const existing = grades.find(
        (g) =>
          g.studentId === s.id &&
          g.subjectId === bulkSubject &&
          (g.semester || '') === bulkSemester
      );
      scores[s.id] = {
        midtermScore: existing?.midtermScore ?? '',
        finalScore: existing?.finalScore ?? '',
        practicalScore: existing?.practicalScore ?? '',
        notes: existing?.notes ?? '',
      };
    });
    setBulkScores(scores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkClass, bulkSubject, bulkSemester, grades.length]);

  const filtered = filterSubject
    ? grades.filter((g) => g.subjectId === filterSubject)
    : grades;

  const handleBulkSave = async () => {
    if (!bulkClass || !bulkSubject || !bulkSemester) {
      alert('صنف، مضمون و سمستر الزامی است');
      return;
    }
    if (bulkStudents.length === 0) {
      alert('دانشجویی در این صنف یافت نشد');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        grades: bulkStudents.map((s) => ({
          studentId: s.id,
          subjectId: bulkSubject,
          semester: bulkSemester,
          midtermScore: Number(bulkScores[s.id]?.midtermScore) || 0,
          finalScore: Number(bulkScores[s.id]?.finalScore) || 0,
          practicalScore: Number(bulkScores[s.id]?.practicalScore) || 0,
          notes: bulkScores[s.id]?.notes || null,
        })),
      };
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در ذخیره');
      alert('نمرات با موفقیت ذخیره شد');
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف این نمره؟')) return;
    try {
      await fetch('/api/grades/' + id, { method: 'DELETE' });
      await loadAll();
    } catch { alert('خطا در حذف'); }
  };

  const setScore = (studentId: string, field: string, value: string) => {
    setBulkScores((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [field]: value },
    }));
  };

  const calcTotal = (studentId: string) => {
    const s = bulkScores[studentId] || {};
    return (
      (Number(s.midtermScore) || 0) +
      (Number(s.finalScore) || 0) +
      (Number(s.practicalScore) || 0)
    );
  };

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="grades" />

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
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
              fontSize: 14,
            }}
          >
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
              ثبت نمرات
            </h1>
            <p style={{ color: '#64748b' }}>میان‌ترم + فاینل + عملی</p>
          </div>

          {/* ثبت گروهی */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
            <h2 className="font-bold mb-4" style={{ color: '#0f172a' }}>
              📝 ثبت گروهی نمرات یک صنف
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#334155' }}>
                  صنف *
                </label>
                <select
                  value={bulkClass}
                  onChange={(e) => setBulkClass(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">-- انتخاب صنف --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#334155' }}>
                  مضمون *
                </label>
                <select
                  value={bulkSubject}
                  onChange={(e) => setBulkSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">-- انتخاب مضمون --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#334155' }}>
                  سمستر *
                </label>
                <select
                  value={bulkSemester}
                  onChange={(e) => setBulkSemester(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {bulkClass && bulkSubject && bulkStudents.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                  <table className="w-full text-sm">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>#</th>
                        <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>دانشجو</th>
                        <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>میان‌ترم</th>
                        <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>فاینل</th>
                        <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>عملی</th>
                        <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkStudents.map((s, i) => (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td className="p-3 text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-xs" style={{ color: '#0f172a' }}>
                              {s.firstName} {s.lastName || ''}
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                              {s.studentNumber}
                            </p>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={bulkScores[s.id]?.midtermScore ?? ''}
                              onChange={(e) => setScore(s.id, 'midtermScore', e.target.value)}
                              className="w-20 px-2 py-1.5 rounded-lg border text-sm outline-none"
                              style={{ borderColor: '#e2e8f0' }}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={bulkScores[s.id]?.finalScore ?? ''}
                              onChange={(e) => setScore(s.id, 'finalScore', e.target.value)}
                              className="w-20 px-2 py-1.5 rounded-lg border text-sm outline-none"
                              style={{ borderColor: '#e2e8f0' }}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={bulkScores[s.id]?.practicalScore ?? ''}
                              onChange={(e) => setScore(s.id, 'practicalScore', e.target.value)}
                              className="w-20 px-2 py-1.5 rounded-lg border text-sm outline-none"
                              style={{ borderColor: '#e2e8f0' }}
                            />
                          </td>
                          <td className="p-3">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold"
                              style={{ background: '#fef3c7', color: '#92400e' }}
                            >
                              {calcTotal(s.id)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={handleBulkSave}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl text-white font-bold text-sm"
                    style={{
                      background: saving
                        ? '#94a3b8'
                        : 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                      cursor: saving ? 'wait' : 'pointer',
                    }}
                  >
                    {saving ? 'ذخیره...' : '💾 ذخیره نمرات'}
                  </button>
                </div>
              </>
            )}

            {bulkClass && bulkSubject && bulkStudents.length === 0 && (
              <div
                className="p-6 text-center rounded-xl"
                style={{ background: '#fef3c7', color: '#92400e' }}
              >
                ⚠️ دانشجویی در این صنف ثبت نشده
              </div>
            )}

            {(!bulkClass || !bulkSubject) && (
              <div
                className="p-6 text-center rounded-xl text-sm"
                style={{ background: '#f8fafc', color: '#64748b' }}
              >
                صنف و مضمون را انتخاب کنید تا لیست دانشجویان بیاید
              </div>
            )}
          </div>

          {/* لیست نمرات ثبت‌شده */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #e2e8f0' }}
          >
            <div
              className="p-4 flex items-center justify-between flex-wrap gap-3"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <h2 className="font-bold" style={{ color: '#0f172a' }}>
                📋 نمرات ثبت‌شده
              </h2>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2 rounded-xl border text-sm outline-none bg-white"
                style={{ borderColor: '#e2e8f0' }}
              >
                <option value="">همه مضامین</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>دانشجو</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مضمون</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>سمستر</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>میان‌ترم</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>فاینل</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>عملی</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مجموع</th>
                    <th className="text-left p-3 text-xs" style={{ color: '#64748b' }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center" style={{ color: '#94a3b8' }}>
                        در حال بارگذاری...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center" style={{ color: '#94a3b8' }}>
                        نمره‌ای یافت نشد
                      </td>
                    </tr>
                  ) : (
                    filtered.map((g) => (
                      <tr key={g.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td className="p-3">
                          <p className="font-bold text-xs" style={{ color: '#0f172a' }}>
                            {g.student.firstName} {g.student.lastName || ''}
                          </p>
                          <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                            {g.student.studentNumber}
                          </p>
                        </td>
                        <td className="p-3 text-xs" style={{ color: '#0f172a' }}>
                          {g.subject.name}
                        </td>
                        <td className="p-3 text-xs" style={{ color: '#64748b' }}>
                          {g.semester || '—'}
                        </td>
                        <td className="p-3 text-xs" style={{ color: '#475569' }}>{g.midtermScore}</td>
                        <td className="p-3 text-xs" style={{ color: '#475569' }}>{g.finalScore}</td>
                        <td className="p-3 text-xs" style={{ color: '#475569' }}>{g.practicalScore}</td>
                        <td className="p-3">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: '#fef3c7', color: '#92400e' }}
                          >
                            {g.totalScore}
                          </span>
                        </td>
                        <td className="p-3 text-left">
                          <button
                            onClick={() => handleDelete(g.id)}
                            className="p-2 rounded-lg"
                            style={{ color: '#dc2626', cursor: 'pointer' }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}