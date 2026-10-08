'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';

type ClassRoom = { id: string; name: string };
type Student = {
  id: string;
  firstName: string;
  lastName: string | null;
  studentNumber: string;
  classRoomId: string | null;
  photo: string | null;
};

type Attendance = {
  id: string;
  studentId: string;
  date: string;
  status: string;
  note: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string | null;
    studentNumber: string;
    classRoom: { name: string } | null;
  };
};

const STATUSES = [
  { key: 'PRESENT', fa: 'حاضر', color: '#10b981', bg: '#d1fae5' },
  { key: 'ABSENT', fa: 'غایب', color: '#dc2626', bg: '#fee2e2' },
  { key: 'LATE', fa: 'تأخیر', color: '#f59e0b', bg: '#fef3c7' },
  { key: 'EXCUSED', fa: 'رخصت', color: '#6366f1', bg: '#e0e7ff' },
];

const todayFa = () => new Date().toLocaleDateString('fa-IR');

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(todayFa());
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    // ✅ ADMIN و FINANCE هر دو اجازه دارند
    if (u.role !== 'ADMIN' && u.role !== 'FINANCE') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cRes, sRes, aRes] = await Promise.all([
        fetch('/api/classrooms', { cache: 'no-store' }),
        fetch('/api/students?active=true', { cache: 'no-store' }),
        fetch('/api/attendance?date=' + encodeURIComponent(date), { cache: 'no-store' }),
      ]);
      if (cRes.ok) setClasses((await cRes.json()).data || []);
      if (sRes.ok) setAllStudents((await sRes.json()).data || []);
      if (aRes.ok) setRecords((await aRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user, date]);

  const students = selectedClass
    ? allStudents.filter((s) => s.classRoomId === selectedClass)
    : [];

  useEffect(() => {
    const map: Record<string, string> = {};
    students.forEach((s) => {
      const existing = records.find(
        (r) => r.studentId === s.id && r.date === date
      );
      map[s.id] = existing?.status || 'PRESENT';
    });
    setStatuses(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, date, records.length, allStudents.length]);

  const setStatus = (studentId: string, status: string) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const setAllStatus = (status: string) => {
    const map: Record<string, string> = {};
    students.forEach((s) => { map[s.id] = status; });
    setStatuses(map);
  };

  const handleSave = async () => {
    if (!selectedClass) { alert('صنف را انتخاب کنید'); return; }
    if (students.length === 0) { alert('دانشجویی در این صنف نیست'); return; }
    setSaving(true);
    try {
      const payload = {
        records: students.map((s) => ({
          studentId: s.id,
          date,
          status: statuses[s.id] || 'PRESENT',
          note: null,
        })),
      };
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در ذخیره');

      await logAction({
        action: 'CREATE',
        tableName: 'attendances',
        recordName: 'حاضری صنف — ' + date,
        details: 'ثبت حاضری ' + students.length + ' دانشجو',
      });

      alert('حاضری با موفقیت ذخیره شد');
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف این رکورد حاضری؟')) return;
    try {
      await fetch('/api/attendance/' + id, { method: 'DELETE' });
      await loadAll();
    } catch { alert('خطا در حذف'); }
  };

  const stats = {
    present: students.filter((s) => (statuses[s.id] || 'PRESENT') === 'PRESENT').length,
    absent: students.filter((s) => statuses[s.id] === 'ABSENT').length,
    late: students.filter((s) => statuses[s.id] === 'LATE').length,
    excused: students.filter((s) => statuses[s.id] === 'EXCUSED').length,
  };

  const total = students.length;
  const attendanceRate = total > 0 ? Math.round((stats.present / total) * 100) : 0;

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="attendance" />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.95)',
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

        <main className="flex-1 p-6 space-y-5">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
              📅 حاضری گروهی
            </h1>
            <p style={{ color: '#64748b' }}>
              همه به‌طور خودکار «حاضر» هستند — فقط روی غایب‌ها کلیک کنید
            </p>
          </div>

          {/* نوار انتخاب صنف */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#334155' }}>
                  صنف *
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border-2 text-sm outline-none bg-white font-bold"
                  style={{ borderColor: '#10b981' }}
                >
                  <option value="">-- انتخاب صنف --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#334155' }}>
                  تاریخ
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border-2 text-sm outline-none bg-white font-mono"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setDate(todayFa())}
                  className="w-full px-4 py-3 rounded-xl font-bold text-sm"
                  style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
                >
                  📅 امروز
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="p-12 text-center text-sm" style={{ color: '#94a3b8' }}>
              ⏳ در حال بارگذاری...
            </div>
          )}

          {!loading && !selectedClass && (
            <div
              className="p-12 text-center bg-white rounded-2xl"
              style={{ border: '2px dashed #cbd5e1' }}
            >
              <div style={{ fontSize: 64, marginBottom: 12 }}>👆</div>
              <p className="font-bold text-lg mb-2" style={{ color: '#475569' }}>
                صنف را انتخاب کنید
              </p>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                بعد از انتخاب، همه دانشجویان به‌طور خودکار «حاضر» علامت می‌خورند
              </p>
            </div>
          )}

          {!loading && selectedClass && students.length === 0 && (
            <div
              className="p-12 text-center bg-white rounded-2xl"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: 64, marginBottom: 12 }}>👥</div>
              <p className="font-bold" style={{ color: '#475569' }}>
                دانشجویی در این صنف نیست
              </p>
            </div>
          )}

          {!loading && selectedClass && students.length > 0 && (
            <>
              {/* نوار ابزار */}
              <div
                className="bg-white rounded-2xl p-4 sticky top-16 z-10"
                style={{ border: '2px solid #10b981', boxShadow: '0 8px 24px rgba(16,185,129,0.15)' }}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {STATUSES.map((st) => {
                      const count =
                        st.key === 'PRESENT' ? stats.present :
                        st.key === 'ABSENT' ? stats.absent :
                        st.key === 'LATE' ? stats.late :
                        stats.excused;
                      return (
                        <div
                          key={st.key}
                          className="px-4 py-2 rounded-xl flex items-center gap-2"
                          style={{ background: st.bg }}
                        >
                          <span className="font-bold text-sm" style={{ color: st.color }}>
                            {st.fa}: {count}
                          </span>
                        </div>
                      );
                    })}
                    <div
                      className="px-4 py-2 rounded-xl flex items-center gap-2"
                      style={{ background: '#f0f9ff' }}
                    >
                      <span className="font-bold text-sm" style={{ color: '#0369a1' }}>
                        📊 {attendanceRate}% حاضری
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* راهنما */}
              <div
                className="p-4 rounded-xl text-xs flex items-center gap-3"
                style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
              >
                <span style={{ fontSize: 20 }}>💡</span>
                <div>
                  <strong>راهنما:</strong> همه «حاضر» هستند. روی هر کارت کلیک کن تا وضعیت عوض شود:
                  <span style={{ margin: '0 8px', fontWeight: 'bold' }}>✓ حاضر</span> ←
                  <span style={{ margin: '0 8px', color: '#dc2626', fontWeight: 'bold' }}>✕ غایب</span> ←
                  <span style={{ margin: '0 8px', color: '#b45309', fontWeight: 'bold' }}>⏱ تأخیر</span> ←
                  <span style={{ margin: '0 8px', color: '#4338ca', fontWeight: 'bold' }}>📝 رخصت</span>
                </div>
              </div>

              {/* دکمه‌های گروهی */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold self-center" style={{ color: '#64748b' }}>
                  علامت‌گذاری همه:
                </span>
                {STATUSES.map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setAllStatus(st.key)}
                    className="px-4 py-2 rounded-xl text-xs font-bold"
                    style={{
                      background: st.bg,
                      color: st.color,
                      cursor: 'pointer',
                      border: '1px solid ' + st.color + '40',
                    }}
                  >
                    همه {st.fa}
                  </button>
                ))}
              </div>

              {/* شبکه کارت‌ها */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {students.map((s, i) => {
                  const current = statuses[s.id] || 'PRESENT';
                  const info = STATUSES.find((x) => x.key === current) || STATUSES[0];
                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl p-3 cursor-pointer transition-all select-none relative"
                      style={{
                        background: info.bg,
                        border: '2px solid ' + info.color,
                        boxShadow: current !== 'PRESENT' ? '0 4px 12px ' + info.color + '30' : 'none',
                      }}
                      onClick={() => {
                        const idx = STATUSES.findIndex((x) => x.key === current);
                        const next = STATUSES[(idx + 1) % STATUSES.length];
                        setStatus(s.id, next.key);
                      }}
                    >
                      <div
                        className="absolute top-2 left-2 text-xs font-bold rounded-full flex items-center justify-center"
                        style={{ width: 22, height: 22, background: info.color, color: 'white', fontSize: 10 }}
                      >
                        {i + 1}
                      </div>

                      <div className="flex flex-col items-center pt-6">
                        {s.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.photo}
                            alt={s.firstName}
                            width={52}
                            height={52}
                            style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }}
                          />
                        ) : (
                          <div
                            className="rounded-full flex items-center justify-center text-white font-bold"
                            style={{ width: 52, height: 52, fontSize: 20, background: info.color, border: '3px solid white' }}
                          >
                            {s.firstName[0]}
                          </div>
                        )}

                        <p className="font-bold text-xs mt-2 text-center leading-tight" style={{ color: info.color }}>
                          {s.firstName} {s.lastName || ''}
                        </p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: info.color, opacity: 0.7, fontSize: 10 }}>
                          {s.studentNumber}
                        </p>

                        <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'white', color: info.color }}>
                          {info.fa}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* دکمه ذخیره */}
              <div
                className="sticky bottom-4 z-10 rounded-2xl p-4 flex items-center justify-between gap-3"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  boxShadow: '0 12px 32px rgba(16,185,129,0.4)',
                }}
              >
                <div style={{ color: 'white' }}>
                  <p className="font-bold text-sm">آماده ذخیره {total} رکورد</p>
                  <p className="text-xs" style={{ opacity: 0.85 }}>
                    {stats.present} حاضر • {stats.absent} غایب • {stats.late} تأخیر • {stats.excused} رخصت
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 rounded-xl font-bold text-sm"
                  style={{
                    background: 'white',
                    color: '#047857',
                    cursor: saving ? 'wait' : 'pointer',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: 15,
                  }}
                >
                  {saving ? '⏳ ذخیره...' : '💾 ذخیره حاضری'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}