'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type StudentInClass = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  fatherName: string | null;
  phone: string | null;
  photo: string | null;
  gender: string | null;
  isActive: boolean;
  totalFee: number;
  paid: number;
  remaining: number;
  attendanceRate: number;
  avgGrade: number;
};

type ClassData = {
  id: string;
  name: string;
  grade: string | null;
  section: string | null;
  capacity: number;
  room: string | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    phone: string | null;
    specialization: string | null;
  } | null;
  schedules: Array<{
    id: string;
    dayOfWeek: string;
    timeFrom: string;
    timeTo: string;
    room: string | null;
    subject: { name: string; code: string };
    teacher: { firstName: string; lastName: string } | null;
  }>;
  students: StudentInClass[];
  stats: {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    totalFee: number;
    totalPaid: number;
    remaining: number;
    attendanceRate: number;
    avgGrade: number;
  };
};

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [tab, setTab] = useState<'students' | 'finance' | 'schedule'>('students');

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/classrooms/' + id, { cache: 'no-store' });
      if (res.ok) setData((await res.json()).data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user && id) loadData(); }, [user, id]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  const handlePrint = () => window.print();

  if (!user) return null;

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <Sidebar active="classRooms" />
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: '#94a3b8' }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <Sidebar active="classRooms" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-6xl">🔍</p>
          <p className="font-bold" style={{ color: '#0f172a' }}>صنف یافت نشد</p>
          <a
            href="/classes"
            className="px-5 py-2.5 rounded-xl text-white font-bold text-sm no-underline"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}
          >
            بازگشت
          </a>
        </div>
      </div>
    );
  }

  const filtered = data.students.filter((s) => {
    if (filterStatus === 'active' && !s.isActive) return false;
    if (filterStatus === 'inactive' && s.isActive) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      (s.lastName || '').toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q)
    );
  });

  const TABS: Array<{ key: typeof tab; label: string; icon: string; count?: number }> = [
    { key: 'students', label: 'دانشجویان', icon: '👥', count: data.stats.totalStudents },
    { key: 'finance', label: 'مالی', icon: '💰' },
    { key: 'schedule', label: 'جدول هفتگی', icon: '🗓️', count: data.schedules.length },
  ];

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="classRooms" />

      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between print:hidden flex-wrap gap-3"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <a
            href="/classes"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold no-underline"
            style={{ background: '#f1f5f9', color: '#475569' }}
          >
            ← بازگشت
          </a>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', cursor: 'pointer', border: 'none' }}
          >
            🖨️ چاپ لیست
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* کارت اصلی صنف */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: '2px solid #8b5cf6', background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="rounded-2xl flex items-center justify-center"
                  style={{ width: 80, height: 80, background: '#8b5cf6', fontSize: 40 }}
                >
                  🏫
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1" style={{ color: '#6d28d9' }}>
                    {data.name}
                  </h1>
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#64748b' }}>
                    {data.grade && <span>📚 پایه: {data.grade}</span>}
                    {data.section && <span>🔤 شعبه: {data.section}</span>}
                    {data.room && <span>🚪 اتاق: {data.room}</span>}
                    <span>👥 ظرفیت: {data.capacity}</span>
                  </div>
                </div>
              </div>

              {data.teacher && (
                <div
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'white', border: '1px solid #ddd6fe' }}
                >
                  <div
                    className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ width: 42, height: 42, background: '#8b5cf6', fontSize: 16 }}
                  >
                    {data.teacher.firstName[0]}
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#64748b' }}>استاد مسئول</p>
                    <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                      {data.teacher.firstName} {data.teacher.lastName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* آمار */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>کل دانشجویان</p>
              <p className="text-2xl font-bold" style={{ color: '#0ea5e9' }}>
                {data.stats.totalStudents}
              </p>
              <div className="flex gap-2 mt-2 text-xs">
                <span style={{ color: '#10b981' }}>✅ {data.stats.activeStudents}</span>
                <span style={{ color: '#dc2626' }}>⛔ {data.stats.inactiveStudents}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>مجموع فیس</p>
              <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                {fmt(data.stats.totalFee)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>AFN</p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>پرداخت‌شده (عاید)</p>
              <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
                {fmt(data.stats.totalPaid)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>AFN</p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>باقی‌مانده</p>
              <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>
                {fmt(data.stats.remaining)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>AFN</p>
            </div>
          </div>

          {/* آمار دوم */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>📅 نرخ حاضری صنف</p>
              <p className="text-2xl font-bold" style={{ color: '#0ea5e9' }}>
                {data.stats.attendanceRate}%
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>📊 معدل صنف</p>
              <p className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
                {data.stats.avgGrade.toFixed(2)}
              </p>
            </div>
          </div>

          {/* تب‌ها */}
          <div className="bg-white rounded-2xl" style={{ border: '1px solid #e2e8f0' }}>
            <div className="flex flex-wrap p-2 gap-1" style={{ borderBottom: '1px solid #f1f5f9' }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                  style={{
                    background: tab === t.key ? '#f5f3ff' : 'transparent',
                    color: tab === t.key ? '#6d28d9' : '#475569',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: tab === t.key ? '#8b5cf6' : '#e2e8f0',
                        color: tab === t.key ? 'white' : '#64748b',
                        fontSize: 10,
                      }}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* تب دانشجویان */}
              {tab === 'students' && (
                <>
                  <div className="flex flex-wrap gap-3 mb-5">
                    <input
                      type="text"
                      placeholder="🔍 جستجوی نام یا شماره..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                    <div className="flex gap-1 rounded-xl p-1" style={{ background: '#f1f5f9' }}>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{
                          background: filterStatus === 'all' ? '#0ea5e9' : 'transparent',
                          color: filterStatus === 'all' ? 'white' : '#475569',
                          cursor: 'pointer',
                          border: 'none',
                        }}
                      >
                        همه ({data.stats.totalStudents})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('active')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{
                          background: filterStatus === 'active' ? '#10b981' : 'transparent',
                          color: filterStatus === 'active' ? 'white' : '#475569',
                          cursor: 'pointer',
                          border: 'none',
                        }}
                      >
                        ✅ فعال ({data.stats.activeStudents})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('inactive')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold"
                        style={{
                          background: filterStatus === 'inactive' ? '#dc2626' : 'transparent',
                          color: filterStatus === 'inactive' ? 'white' : '#475569',
                          cursor: 'pointer',
                          border: 'none',
                        }}
                      >
                        ⛔ غیرفعال ({data.stats.inactiveStudents})
                      </button>
                    </div>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="p-12 text-center">
                      <p style={{ fontSize: 48, marginBottom: 12 }}>👥</p>
                      <p style={{ color: '#94a3b8' }}>دانشجویی یافت نشد</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                      <table className="w-full text-sm">
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>#</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>دانشجو</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>شماره</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>فیس کل</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>پرداخت</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>باقی</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>حاضری</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>معدل</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>وضعیت</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((s, i) => (
                            <tr
                              key={s.id}
                              style={{
                                borderTop: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                opacity: s.isActive ? 1 : 0.7,
                                background: s.isActive ? 'white' : '#fef2f2',
                              }}
                              onClick={() => router.push('/students/' + s.id)}
                            >
                              <td className="p-3 text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {s.photo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={s.photo}
                                      alt={s.firstName}
                                      width={32}
                                      height={32}
                                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div
                                      className="rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                      style={{
                                        width: 32, height: 32,
                                        background: s.isActive
                                          ? 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)'
                                          : '#94a3b8',
                                      }}
                                    >
                                      {s.firstName[0]}
                                    </div>
                                  )}
                                  <span className="font-bold text-xs" style={{ color: '#0f172a' }}>
                                    {s.firstName} {s.lastName || ''}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-xs font-mono" style={{ color: '#6d28d9' }}>
                                {s.studentNumber}
                              </td>
                              <td className="p-3 text-xs font-mono" style={{ color: '#475569' }}>
                                {fmt(s.totalFee)}
                              </td>
                              <td className="p-3 text-xs font-mono" style={{ color: '#10b981' }}>
                                {fmt(s.paid)}
                              </td>
                              <td className="p-3 text-xs font-mono font-bold" style={{ color: s.remaining > 0 ? '#dc2626' : '#10b981' }}>
                                {fmt(s.remaining)}
                              </td>
                              <td className="p-3">
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                                  style={{
                                    background: s.attendanceRate >= 90 ? '#d1fae5' : s.attendanceRate >= 70 ? '#fef3c7' : '#fee2e2',
                                    color: s.attendanceRate >= 90 ? '#047857' : s.attendanceRate >= 70 ? '#b45309' : '#dc2626',
                                  }}
                                >
                                  {s.attendanceRate}%
                                </span>
                              </td>
                              <td className="p-3">
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                                  style={{
                                    background: s.avgGrade >= 80 ? '#d1fae5' : s.avgGrade >= 50 ? '#fef3c7' : '#fee2e2',
                                    color: s.avgGrade >= 80 ? '#047857' : s.avgGrade >= 50 ? '#b45309' : '#dc2626',
                                  }}
                                >
                                  {s.avgGrade.toFixed(1)}
                                </span>
                              </td>
                              <td className="p-3">
                                {s.isActive ? (
                                  <span className="text-xs" style={{ color: '#10b981' }}>✅</span>
                                ) : (
                                  <span className="text-xs" style={{ color: '#dc2626' }}>⛔</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot style={{ background: '#f5f3ff', borderTop: '2px solid #8b5cf6' }}>
                          <tr>
                            <td colSpan={3} className="p-3 text-sm font-bold" style={{ color: '#6d28d9' }}>
                              مجموع ({filtered.length} نفر)
                            </td>
                            <td className="p-3 text-sm font-bold font-mono" style={{ color: '#6d28d9' }}>
                              {fmt(filtered.reduce((s, x) => s + x.totalFee, 0))}
                            </td>
                            <td className="p-3 text-sm font-bold font-mono" style={{ color: '#047857' }}>
                              {fmt(filtered.reduce((s, x) => s + x.paid, 0))}
                            </td>
                            <td className="p-3 text-sm font-bold font-mono" style={{ color: '#dc2626' }}>
                              {fmt(filtered.reduce((s, x) => s + x.remaining, 0))}
                            </td>
                            <td colSpan={3} className="p-3" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* تب مالی */}
              {tab === 'finance' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl text-center" style={{ background: '#fef3c7' }}>
                      <p className="text-xs mb-2" style={{ color: '#b45309' }}>مجموع فیس</p>
                      <p className="text-3xl font-bold font-mono" style={{ color: '#b45309' }}>
                        {fmt(data.stats.totalFee)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#b45309' }}>AFN</p>
                    </div>
                    <div className="p-5 rounded-2xl text-center" style={{ background: '#d1fae5' }}>
                      <p className="text-xs mb-2" style={{ color: '#047857' }}>💵 عاید صنف (پرداخت‌شده)</p>
                      <p className="text-3xl font-bold font-mono" style={{ color: '#047857' }}>
                        {fmt(data.stats.totalPaid)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#047857' }}>AFN</p>
                    </div>
                    <div className="p-5 rounded-2xl text-center" style={{ background: '#fee2e2' }}>
                      <p className="text-xs mb-2" style={{ color: '#dc2626' }}>باقی‌مانده</p>
                      <p className="text-3xl font-bold font-mono" style={{ color: '#dc2626' }}>
                        {fmt(data.stats.remaining)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#dc2626' }}>AFN</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p className="font-bold mb-3" style={{ color: '#0f172a' }}>📊 درصد وصول فیس</p>
                    <div className="rounded-full overflow-hidden mb-2" style={{ height: 16, background: '#e2e8f0' }}>
                      <div
                        className="h-full"
                        style={{
                          width: (data.stats.totalFee > 0 ? (data.stats.totalPaid / data.stats.totalFee) * 100 : 0) + '%',
                          background: 'linear-gradient(90deg, #10b981, #047857)',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: '#047857' }}>
                        ✅ {data.stats.totalFee > 0 ? Math.round((data.stats.totalPaid / data.stats.totalFee) * 100) : 0}% وصول شده
                      </span>
                      <span style={{ color: '#dc2626' }}>
                        ⏳ {data.stats.totalFee > 0 ? Math.round((data.stats.remaining / data.stats.totalFee) * 100) : 0}% باقی
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                    <p className="font-bold mb-3" style={{ color: '#0369a1' }}>📈 خلاصه وضعیت مالی</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: '#0369a1' }}>تعداد دانشجویان:</span>
                        <span className="font-bold" style={{ color: '#0369a1' }}>{data.stats.totalStudents} نفر</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#0369a1' }}>میانگین فیس هر دانشجو:</span>
                        <span className="font-bold font-mono" style={{ color: '#0369a1' }}>
                          {fmt(data.stats.totalStudents > 0 ? data.stats.totalFee / data.stats.totalStudents : 0)} AFN
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#0369a1' }}>میانگین پرداخت هر دانشجو:</span>
                        <span className="font-bold font-mono" style={{ color: '#047857' }}>
                          {fmt(data.stats.totalStudents > 0 ? data.stats.totalPaid / data.stats.totalStudents : 0)} AFN
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#0369a1' }}>میانگین بدهی هر دانشجو:</span>
                        <span className="font-bold font-mono" style={{ color: '#dc2626' }}>
                          {fmt(data.stats.totalStudents > 0 ? data.stats.remaining / data.stats.totalStudents : 0)} AFN
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* تب جدول هفتگی */}
              {tab === 'schedule' && (
                <div>
                  {data.schedules.length === 0 ? (
                    <div className="p-12 text-center">
                      <p style={{ fontSize: 48, marginBottom: 12 }}>🗓️</p>
                      <p style={{ color: '#94a3b8' }}>هیچ تایمی ثبت نشده</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                      <table className="w-full text-sm">
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>روز</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>تایم</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مضمون</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>استاد</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>اتاق</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.schedules.map((s) => (
                            <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td className="p-3">
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-bold"
                                  style={{ background: '#f0f9ff', color: '#0369a1' }}
                                >
                                  {s.dayOfWeek}
                                </span>
                              </td>
                              <td className="p-3 text-xs font-mono" style={{ color: '#475569' }}>
                                {s.timeFrom} - {s.timeTo}
                              </td>
                              <td className="p-3">
                                <p className="font-bold text-xs" style={{ color: '#0f172a' }}>{s.subject.name}</p>
                                <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>{s.subject.code}</p>
                              </td>
                              <td className="p-3 text-xs" style={{ color: '#475569' }}>
                                {s.teacher ? s.teacher.firstName + ' ' + s.teacher.lastName : '—'}
                              </td>
                              <td className="p-3 text-xs" style={{ color: '#475569' }}>{s.room || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}