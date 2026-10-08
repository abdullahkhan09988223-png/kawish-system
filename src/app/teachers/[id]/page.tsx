'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Teacher = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  specialization: string | null;
  phone: string | null;
  address: string | null;
  hireDate: string | null;
  salary: number;
  photo: string | null;
  tazkiraNumber: string | null;
  tazkiraPhoto: string | null;
  classRooms: Array<{ id: string; name: string; room: string | null; _count?: { students: number } }>;
  subjects: Array<{ id: string; name: string; code: string; credits: number }>;
  schedules: Array<{
    id: string;
    dayOfWeek: string;
    timeFrom: string;
    timeTo: string;
    room: string | null;
    classRoom: { name: string };
    subject: { name: string; code: string };
  }>;
  salaries: Array<{
    id: string;
    amount: number;
    month: string | null;
    year: string | null;
    isPaid: boolean;
    paidDate: string | null;
    notes: string | null;
  }>;
  grades: Array<{
    id: string;
    semester: string | null;
    totalScore: number;
    student: { firstName: string; lastName: string | null; studentNumber: string };
    subject: { name: string };
  }>;
};

export default function TeacherProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'classes' | 'subjects' | 'schedule' | 'salaries'>('info');

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadTeacher = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/teachers/' + id);
      if (!res.ok) throw new Error('یافت نشد');
      const json = await res.json();
      setTeacher(json.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { if (user && id) loadTeacher(); }, [user, id]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  const handlePrint = () => {
    window.print();
  };

  if (!user) return null;

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <Sidebar active="teachers" />
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: '#94a3b8' }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <Sidebar active="teachers" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-6xl">🔍</p>
          <p className="font-bold" style={{ color: '#0f172a' }}>استاد یافت نشد</p>
          <button
            onClick={() => router.push('/teachers')}
            className="px-5 py-2.5 rounded-xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', cursor: 'pointer' }}
          >
            بازگشت به لیست
          </button>
        </div>
      </div>
    );
  }

  const totalStudents = teacher.classRooms.reduce(
    (s, c) => s + (c._count?.students || 0),
    0
  );
  const totalSalariesPaid = teacher.salaries
    .filter((s) => s.isPaid)
    .reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalSalariesUnpaid = teacher.salaries
    .filter((s) => !s.isPaid)
    .reduce((s, x) => s + Number(x.amount || 0), 0);

  const TABS: Array<{ key: typeof tab; label: string; icon: string; count: number }> = [
    { key: 'info', label: 'معلومات', icon: '👤', count: 0 },
    { key: 'classes', label: 'صنف‌ها', icon: '🏫', count: teacher.classRooms.length },
    { key: 'subjects', label: 'مضامین', icon: '📚', count: teacher.subjects.length },
    { key: 'schedule', label: 'جدول هفتگی', icon: '🗓️', count: teacher.schedules.length },
    { key: 'salaries', label: 'معاشات', icon: '💵', count: teacher.salaries.length },
  ];

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="teachers" />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between print:hidden"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <button
            onClick={() => router.push('/teachers')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
            style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer' }}
          >
            ← بازگشت
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', cursor: 'pointer' }}
          >
            🖨️ چاپ پروفایل
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* کارت بالا */}
          <div
            className="bg-white rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6"
            style={{ border: '1px solid #e2e8f0' }}
          >
            <div
              className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{
                width: 110,
                height: 110,
                fontSize: 40,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                overflow: 'hidden',
              }}
            >
              {teacher.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teacher.photo}
                  alt={teacher.firstName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                teacher.firstName[0]
              )}
            </div>

            <div className="flex-1 min-w-0 text-center md:text-right">
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
                {teacher.firstName} {teacher.lastName}
              </h1>
              <p className="text-sm mb-3" style={{ color: '#64748b' }}>
                {teacher.fatherName ? 'ولد ' + teacher.fatherName : ''}
              </p>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                  style={{ background: '#f5f3ff', color: '#6d28d9' }}
                >
                  🆔 {teacher.employeeNumber}
                </span>
                {teacher.specialization && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#d1fae5', color: '#047857' }}
                  >
                    🎓 {teacher.specialization}
                  </span>
                )}
                {teacher.phone && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                    style={{ background: '#f0f9ff', color: '#0369a1' }}
                  >
                    📞 {teacher.phone}
                  </span>
                )}
                {teacher.hireDate && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#fef3c7', color: '#b45309' }}
                  >
                    📅 شمولیت: {teacher.hireDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* کارت‌های آماری */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat
              icon="🏫"
              title="صنف‌ها"
              value={teacher.classRooms.length.toString()}
              color="#8b5cf6"
              bg="#f5f3ff"
            />
            <MiniStat
              icon="📚"
              title="مضامین"
              value={teacher.subjects.length.toString()}
              color="#0ea5e9"
              bg="#f0f9ff"
            />
            <MiniStat
              icon="👥"
              title="کل دانشجویان"
              value={totalStudents.toString()}
              color="#10b981"
              bg="#d1fae5"
            />
            <MiniStat
              icon="💵"
              title="معاش ماهانه"
              value={fmt(teacher.salary) + ' AFN'}
              color="#f59e0b"
              bg="#fef3c7"
            />
          </div>

          {/* تب‌ها */}
          <div className="bg-white rounded-2xl" style={{ border: '1px solid #e2e8f0' }}>
            <div
              className="flex flex-wrap p-2 gap-1"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  style={{
                    background: tab === t.key ? '#f5f3ff' : 'transparent',
                    color: tab === t.key ? '#6d28d9' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.count > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: tab === t.key ? '#8b5cf6' : '#e2e8f0',
                        color: tab === t.key ? '#fff' : '#64748b',
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
              {/* تب معلومات */}
              {tab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="شماره کارمندی" value={teacher.employeeNumber} mono />
                  <InfoRow label="ولد" value={teacher.fatherName || '—'} />
                  <InfoRow label="تخصص" value={teacher.specialization || '—'} />
                  <InfoRow label="شماره تماس" value={teacher.phone || '—'} mono />
                  <InfoRow label="تاریخ شمولیت" value={teacher.hireDate || '—'} />
                  <InfoRow label="شماره تذکره" value={teacher.tazkiraNumber || '—'} mono />
                  <InfoRow label="معاش ماهانه" value={fmt(teacher.salary) + ' AFN'} />
                  <div className="md:col-span-2">
                    <InfoRow label="نشانی" value={teacher.address || '—'} />
                  </div>

                  {/* خلاصه معاش */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-3 mt-2">
                    <div className="p-4 rounded-xl" style={{ background: '#d1fae5' }}>
                      <p className="text-xs mb-1" style={{ color: '#047857' }}>معاش پرداخت‌شده</p>
                      <p className="text-lg font-bold" style={{ color: '#047857' }}>
                        {fmt(totalSalariesPaid)} AFN
                      </p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: '#fee2e2' }}>
                      <p className="text-xs mb-1" style={{ color: '#dc2626' }}>معاش پرداخت‌نشده</p>
                      <p className="text-lg font-bold" style={{ color: '#dc2626' }}>
                        {fmt(totalSalariesUnpaid)} AFN
                      </p>
                    </div>
                  </div>

                  {teacher.tazkiraPhoto && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-bold mb-2" style={{ color: '#64748b' }}>عکس تذکره</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={teacher.tazkiraPhoto}
                        alt="tazkira"
                        style={{
                          maxWidth: 400,
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* تب صنف‌ها */}
              {tab === 'classes' && (
                <div>
                  {teacher.classRooms.length === 0 ? (
                    <EmptyState icon="🏫" text="به هیچ صنفی تخصیص نیافته" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {teacher.classRooms.map((c) => (
                        <div
                          key={c.id}
                          className="p-4 rounded-xl flex items-center gap-3"
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                        >
                          <div
                            className="rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ width: 44, height: 44, background: '#f5f3ff', fontSize: 20 }}
                          >
                            🏫
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                              {c.name}
                            </p>
                            <p className="text-xs" style={{ color: '#94a3b8' }}>
                              {c.room ? 'اتاق ' + c.room : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* تب مضامین */}
              {tab === 'subjects' && (
                <div>
                  {teacher.subjects.length === 0 ? (
                    <EmptyState icon="📚" text="هیچ مضمونی تخصیص نیافته" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {teacher.subjects.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-4 rounded-xl flex items-center gap-3"
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                        >
                          <div
                            className="rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{
                              width: 44,
                              height: 44,
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                              fontSize: 14,
                            }}
                          >
                            {sub.code.slice(0, 3)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                              {sub.name}
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                              {sub.code} — {sub.credits} کریدیت
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* تب جدول هفتگی */}
              {tab === 'schedule' && (
                <div>
                  {teacher.schedules.length === 0 ? (
                    <EmptyState icon="🗓️" text="هیچ تایمی ثبت نشده" />
                  ) : (
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                      <table className="w-full text-sm">
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>روز</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>تایم</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>صنف</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مضمون</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>اتاق</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacher.schedules.map((s) => (
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
                              <td className="p-3 text-xs font-bold" style={{ color: '#0f172a' }}>
                                {s.classRoom.name}
                              </td>
                              <td className="p-3">
                                <p className="font-bold text-xs" style={{ color: '#0f172a' }}>
                                  {s.subject.name}
                                </p>
                                <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                                  {s.subject.code}
                                </p>
                              </td>
                              <td className="p-3 text-xs" style={{ color: '#475569' }}>
                                {s.room || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* تب معاشات */}
              {tab === 'salaries' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl" style={{ background: '#d1fae5' }}>
                      <p className="text-xs mb-1" style={{ color: '#047857' }}>کل پرداخت‌شده</p>
                      <p className="text-lg font-bold" style={{ color: '#047857' }}>
                        {fmt(totalSalariesPaid)} AFN
                      </p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: '#fee2e2' }}>
                      <p className="text-xs mb-1" style={{ color: '#dc2626' }}>کل پرداخت‌نشده</p>
                      <p className="text-lg font-bold" style={{ color: '#dc2626' }}>
                        {fmt(totalSalariesUnpaid)} AFN
                      </p>
                    </div>
                  </div>

                  {teacher.salaries.length === 0 ? (
                    <EmptyState icon="💵" text="معاشی ثبت نشده" />
                  ) : (
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                      <table className="w-full text-sm">
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>ماه</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>سال</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مبلغ</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>وضعیت</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>تاریخ پرداخت</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacher.salaries.map((s) => (
                            <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td className="p-3 text-xs" style={{ color: '#0f172a' }}>{s.month || '—'}</td>
                              <td className="p-3 text-xs" style={{ color: '#64748b' }}>{s.year || '—'}</td>
                              <td className="p-3 text-xs font-bold" style={{ color: '#0f172a' }}>
                                {fmt(s.amount)} AFN
                              </td>
                              <td className="p-3">
                                {s.isPaid ? (
                                  <span
                                    className="px-3 py-1 rounded-full text-xs font-bold"
                                    style={{ background: '#d1fae5', color: '#047857' }}
                                  >
                                    ✓ پرداخت‌شده
                                  </span>
                                ) : (
                                  <span
                                    className="px-3 py-1 rounded-full text-xs font-bold"
                                    style={{ background: '#fee2e2', color: '#dc2626' }}
                                  >
                                    پرداخت‌نشده
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-xs" style={{ color: '#64748b' }}>
                                {s.paidDate || '—'}
                              </td>
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

function MiniStat({
  icon, title, value, color, bg,
}: { icon: string; title: string; value: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
      <div
        className="rounded-xl flex items-center justify-center mb-2"
        style={{ width: 38, height: 38, background: bg, fontSize: 18 }}
      >
        {icon}
      </div>
      <p className="text-xs mb-1" style={{ color: '#64748b' }}>{title}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: '#f8fafc' }}>
      <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
      <span
        className={'text-sm font-bold ' + (mono ? 'font-mono' : '')}
        style={{ color: '#0f172a' }}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="p-12 text-center">
      <p className="text-5xl mb-3">{icon}</p>
      <p className="text-sm" style={{ color: '#94a3b8' }}>{text}</p>
    </div>
  );
}