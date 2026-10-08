'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '@/components/Sidebar';

const LOGO_URL =
  'https://i.ibb.co/5WVzgSt6/C7-B9-CCE3-0367-42A6-899-D-91-EE83-D25485.png';

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  fatherName: string | null;
  photo: string | null;
  classRoom: { id: string; name: string; room: string | null } | null;
};

type FullStudent = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  fatherName: string | null;
  gender: string | null;
  birthDate: string | null;
  enrollmentDate: string | null;
  phone: string | null;
  parentPhone: string | null;
  parentName: string | null;
  parentRelation: string | null;
  address: string | null;
  tazkiraNumber: string | null;
  photo: string | null;
  classRoom: {
    id: string;
    name: string;
    room: string | null;
    teacher: { firstName: string; lastName: string } | null;
  } | null;
  enrollments: Array<{
    id: string;
    subject: {
      id: string;
      name: string;
      code: string;
      credits: number;
      teacher: { firstName: string; lastName: string } | null;
    };
  }>;
  grades: Array<{
    id: string;
    semester: string | null;
    midtermScore: number;
    finalScore: number;
    practicalScore: number;
    totalScore: number;
    subject: { name: string; code: string };
  }>;
  attendances: Array<{
    id: string;
    date: string;
    status: string;
  }>;
  fees: Array<{
    id: string;
    total: number;
    paid: number;
    status: string;
  }>;
};

export default function StudentDocPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FullStudent | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students', { cache: 'no-store' });
      if (res.ok) setStudents((await res.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadStudents(); }, [user]);

  const openStudent = async (id: string) => {
    setLoadingDoc(true);
    setSelected(null);
    try {
      const res = await fetch('/api/students/' + id, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setSelected(json.data);
        setTimeout(() => {
          document.getElementById('doc-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (e) { console.error(e); }
    setLoadingDoc(false);
  };

  const filtered = search.trim()
    ? students.filter((s) => {
        const q = search.toLowerCase().trim();
        return (
          s.studentNumber.toLowerCase().includes(q) ||
          s.firstName.toLowerCase().includes(q) ||
          (s.lastName || '').toLowerCase().includes(q) ||
          (s.fatherName || '').toLowerCase().includes(q)
        );
      })
    : [];

  const handlePrint = () => window.print();

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  const calculateMonths = (faDate: string): number => {
    try {
      const parts = faDate.split('/').map((p) => parseInt(p.replace(/[^0-9]/g, ''), 10));
      if (parts.length < 3 || parts.some(isNaN)) return 0;
      const [y, m] = parts;
      const now = new Date().toLocaleDateString('fa-IR');
      const nowParts = now.split('/').map((p) => parseInt(p.replace(/[^0-9]/g, ''), 10));
      const [ny, nm] = nowParts;
      return Math.max(0, (ny - y) * 12 + (nm - m));
    } catch { return 0; }
  };

  if (!user) return null;

  // آمار
  const totalAtt = selected?.attendances?.length || 0;
  const presentCount = selected?.attendances?.filter((a) => a.status === 'PRESENT').length || 0;
  const absentCount = selected?.attendances?.filter((a) => a.status === 'ABSENT').length || 0;
  const lateCount = selected?.attendances?.filter((a) => a.status === 'LATE').length || 0;
  const excusedCount = selected?.attendances?.filter((a) => a.status === 'EXCUSED').length || 0;
  const attRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;
  const avgScore = selected && selected.grades.length > 0
    ? selected.grades.reduce((sum, g) => sum + Number(g.totalScore || 0), 0) / selected.grades.length
    : 0;
  const durationMonths = selected?.enrollmentDate ? calculateMonths(selected.enrollmentDate) : 0;

  const teachers = new Set<string>();
  selected?.enrollments?.forEach((e) => {
    if (e.subject.teacher) {
      teachers.add(e.subject.teacher.firstName + ' ' + e.subject.teacher.lastName);
    }
  });
  if (selected?.classRoom?.teacher) {
    teachers.add(selected.classRoom.teacher.firstName + ' ' + selected.classRoom.teacher.lastName);
  }
  const teacherList = Array.from(teachers);

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="studentDoc" />

      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; padding: 0 !important; }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between no-print"
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
          <div className="no-print">
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
              📋 سند جامع آموزشی
            </h1>
            <p style={{ color: '#64748b' }}>
              دانشجو را جستجو کنید تا سند کامل صادر شود
            </p>
          </div>

          {/* جستجو */}
          <div className="bg-white rounded-2xl p-6 no-print" style={{ border: '1px solid #e2e8f0' }}>
            <label className="block text-sm font-bold mb-3" style={{ color: '#334155' }}>
              🔍 جستجوی دانشجو
            </label>
            <input
              type="text"
              placeholder="مثلاً: S-1001 یا علی احمدی یا شماره..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full px-5 py-4 rounded-xl border-2 text-lg outline-none"
              style={{ borderColor: '#8b5cf6', background: '#faf5ff' }}
            />
          </div>

          {/* نتایج جستجو */}
          {!loading && search.trim() && filtered.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden no-print" style={{ border: '1px solid #e2e8f0' }}>
              <div className="p-3 text-xs font-bold" style={{ background: '#faf5ff', color: '#6d28d9' }}>
                {filtered.length} نتیجه پیدا شد — روی هر کارت کلیک کنید
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openStudent(s.id)}
                    className="bg-white rounded-xl p-4 text-right cursor-pointer transition-all"
                    style={{
                      border: selected?.id === s.id ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                      boxShadow: selected?.id === s.id ? '0 8px 24px rgba(139,92,246,0.2)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {s.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.photo}
                          alt={s.firstName}
                          width={48}
                          height={48}
                          style={{ borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{
                            width: 48, height: 48, fontSize: 18,
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                          }}
                        >
                          {s.firstName[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                          {s.firstName} {s.lastName || ''}
                        </p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: '#6d28d9' }}>
                          {s.studentNumber}
                        </p>
                        {s.classRoom && (
                          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                            {s.classRoom.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && search.trim() && filtered.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl no-print" style={{ border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>😕</div>
              <p className="font-bold" style={{ color: '#475569' }}>دانشجویی یافت نشد</p>
            </div>
          )}

          {!search.trim() && !selected && !loadingDoc && (
            <div className="p-12 text-center bg-white rounded-2xl no-print" style={{ border: '2px dashed #cbd5e1' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🔎</div>
              <p className="font-bold text-lg mb-2" style={{ color: '#475569' }}>
                دانشجو را جستجو کنید
              </p>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                بعد از پیدا کردن، سند جامع با تمام معلومات در همین صفحه باز می‌شود
              </p>
            </div>
          )}

          {loadingDoc && (
            <div className="p-12 text-center no-print" style={{ color: '#94a3b8' }}>
              ⏳ در حال آماده‌سازی سند...
            </div>
          )}

          {/* سند کامل */}
          {selected && (
            <div id="doc-section" className="space-y-4">
              {/* دکمه‌های کنترل */}
              <div className="flex justify-between items-center no-print flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
                >
                  ✕ بستن سند
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
                  }}
                >
                  🖨️ چاپ / ذخیره PDF
                </button>
              </div>

              {/* راهنما */}
              <div
                className="p-4 rounded-xl text-xs no-print"
                style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}
              >
                <p style={{ fontWeight: 'bold', marginBottom: 6 }}>💡 راهنمای ذخیره PDF برای واتس‌اپ:</p>
                <ol style={{ paddingRight: 20, lineHeight: 1.8 }}>
                  <li>روی «🖨️ چاپ / ذخیره PDF» بزنید</li>
                  <li>در پنجره چاپ، در قسمت Printer گزینه <strong>Microsoft Print to PDF</strong> یا <strong>Save as PDF</strong> را انتخاب کنید</li>
                  <li>Save بزنید و محل ذخیره را انتخاب کنید</li>
                  <li>فایل PDF آماده است — در واتس‌اپ ارسال کنید</li>
                </ol>
              </div>

              {/* سند */}
              <div
                className="print-page bg-white rounded-2xl"
                style={{ padding: 40, boxShadow: '0 12px 32px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}
              >
                {/* سربرگ */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    paddingBottom: 20,
                    borderBottom: '3px double #8b5cf6',
                    marginBottom: 24,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={LOGO_URL} alt="logo" style={{ width: 90, height: 90, objectFit: 'contain' }} />
                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
                      مرکز آموزشی کاوش
                    </h1>
                    <p style={{ fontSize: 14, color: '#6d28d9', fontWeight: 'bold' }}>
                      Kawish Educational Center
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      سند جامع آموزشی دانشجو
                    </p>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div
                      style={{
                        background: '#f5f3ff',
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: '1px solid #c4b5fd',
                      }}
                    >
                      <p style={{ fontSize: 10, color: '#6d28d9' }}>شماره سند</p>
                      <p style={{ fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace', color: '#6d28d9' }}>
                        DOC-{selected.studentNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* بخش ۱: معلومات شخصی */}
                <SectionTitle icon="👤" title="معلومات شخصی دانشجو" />

                <div style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div
                      style={{
                        width: 130, height: 160, borderRadius: 10,
                        border: '2px solid #8b5cf6',
                        overflow: 'hidden',
                        background: '#f5f3ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {selected.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selected.photo}
                          alt={selected.firstName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ fontSize: 60, fontWeight: 'bold', color: '#8b5cf6' }}>
                          {selected.firstName[0]}
                        </div>
                      )}
                    </div>
                    <p style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                      عکس ۳×۴
                    </p>
                  </div>

                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <InfoRow label="نام کامل" value={selected.firstName + ' ' + (selected.lastName || '')} />
                    <InfoRow label="ولد" value={selected.fatherName || '—'} />
                    <InfoRow label="شماره دانشجویی" value={selected.studentNumber} mono />
                    <InfoRow label="شماره تذکره" value={selected.tazkiraNumber || '—'} mono />
                    <InfoRow
                      label="جنسیت"
                      value={selected.gender === 'MALE' ? 'پسر' : selected.gender === 'FEMALE' ? 'دختر' : '—'}
                    />
                    <InfoRow label="تاریخ تولد" value={selected.birthDate || '—'} mono />
                    <InfoRow label="صنف / کورس" value={selected.classRoom?.name || '—'} highlight />
                    <InfoRow label="اتاق" value={selected.classRoom?.room || '—'} />
                    <InfoRow label="تاریخ شمولیت" value={selected.enrollmentDate || '—'} mono />
                    <InfoRow label="مدت تحصیل" value={durationMonths > 0 ? durationMonths + ' ماه' : '—'} highlight />
                    <InfoRow label="شماره تماس" value={selected.phone || '—'} mono />
                    <InfoRow label="شماره والد" value={selected.parentPhone || '—'} mono />
                    <div style={{ gridColumn: '1 / -1' }}>
                      <InfoRow label="نشانی" value={selected.address || '—'} />
                    </div>
                  </div>
                </div>

                {/* بخش ۲: مضامین */}
                <SectionTitle icon="📚" title="مضامین خوانده‌شده در کورس" />

                {selected.enrollments.length === 0 ? (
                  <EmptyBox text="هیچ مضمونی ثبت نشده" />
                ) : (
                  <TableBox>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f5f3ff' }}>
                          <Th>#</Th>
                          <Th>کد</Th>
                          <Th>نام مضمون</Th>
                          <Th>کریدیت</Th>
                          <Th>استاد</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.enrollments.map((e, i) => (
                          <tr key={e.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <Td>{i + 1}</Td>
                            <Td mono>{e.subject.code}</Td>
                            <Td bold>{e.subject.name}</Td>
                            <Td>{e.subject.credits}</Td>
                            <Td>{e.subject.teacher ? e.subject.teacher.firstName + ' ' + e.subject.teacher.lastName : '—'}</Td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#faf5ff', fontWeight: 'bold' }}>
                          <Td colSpan={3}>مجموع</Td>
                          <Td>{selected.enrollments.reduce((s, e) => s + (e.subject.credits || 0), 0)} کریدیت</Td>
                          <Td>{selected.enrollments.length} مضمون</Td>
                        </tr>
                      </tfoot>
                    </table>
                  </TableBox>
                )}

                {/* بخش ۳: استادان */}
                <SectionTitle icon="👨‍🏫" title="استادان دوره" />

                {teacherList.length === 0 ? (
                  <EmptyBox text="هیچ استادی ثبت نشده" />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
                    {teacherList.map((name, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 12,
                          background: '#f5f3ff',
                          borderRadius: 10,
                          border: '1px solid #ddd6fe',
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: 'bold',
                          color: '#6d28d9',
                        }}
                      >
                        🎓 {name}
                      </div>
                    ))}
                  </div>
                )}

                {/* بخش ۴: حاضری */}
                <SectionTitle icon="📅" title="گزارش حاضری" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <StatBox label="کل روزها" value={totalAtt.toString()} color="#0369a1" bg="#f0f9ff" />
                  <StatBox label="حاضر" value={presentCount.toString()} color="#047857" bg="#d1fae5" />
                  <StatBox label="غایب" value={absentCount.toString()} color="#dc2626" bg="#fee2e2" />
                  <StatBox label="نرخ حاضری" value={attRate + '%'} color="#6d28d9" bg="#f5f3ff" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  <StatBox label="تأخیر" value={lateCount.toString()} color="#b45309" bg="#fef3c7" />
                  <StatBox label="رخصت" value={excusedCount.toString()} color="#4338ca" bg="#e0e7ff" />
                </div>

                {/* بخش ۵: نمرات */}
                <SectionTitle icon="📝" title="نتایج امتحانات" />

                {selected.grades.length === 0 ? (
                  <EmptyBox text="هنوز نمره‌ای ثبت نشده" />
                ) : (
                  <TableBox>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f5f3ff' }}>
                          <Th>#</Th>
                          <Th>مضمون</Th>
                          <Th>سمستر</Th>
                          <Th>میان‌ترم</Th>
                          <Th>فاینل</Th>
                          <Th>عملی</Th>
                          <Th>مجموع</Th>
                          <Th>نتیجه</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.grades.map((g, i) => {
                          const pass = Number(g.totalScore) >= 50;
                          return (
                            <tr key={g.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                              <Td>{i + 1}</Td>
                              <Td bold>{g.subject.name}</Td>
                              <Td>{g.semester || '—'}</Td>
                              <Td>{g.midtermScore}</Td>
                              <Td>{g.finalScore}</Td>
                              <Td>{g.practicalScore}</Td>
                              <Td bold>{g.totalScore}</Td>
                              <Td>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 10,
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    background: pass ? '#d1fae5' : '#fee2e2',
                                    color: pass ? '#047857' : '#dc2626',
                                  }}
                                >
                                  {pass ? '✓ قبول' : '✕ ناکام'}
                                </span>
                              </Td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#faf5ff', fontWeight: 'bold' }}>
                          <Td colSpan={6}>معدل کل</Td>
                          <Td colSpan={2}>{avgScore.toFixed(2)}</Td>
                        </tr>
                      </tfoot>
                    </table>
                  </TableBox>
                )}

                {/* بخش ۶: خلاصه */}
                <SectionTitle icon="📊" title="خلاصه وضعیت" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
                  <SummaryBox
                    icon="📚"
                    label="مضامین خوانده‌شده"
                    value={selected.enrollments.length + ' مضمون'}
                    color="#8b5cf6"
                  />
                  <SummaryBox
                    icon="📊"
                    label="معدل کل"
                    value={avgScore.toFixed(2)}
                    color="#0ea5e9"
                  />
                  <SummaryBox
                    icon="✅"
                    label="نرخ حاضری"
                    value={attRate + '%'}
                    color="#10b981"
                  />
                </div>

                {/* پاورقی */}
                <div
                  style={{
                    marginTop: 32,
                    paddingTop: 20,
                    borderTop: '2px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    gap: 20,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        background: 'white',
                        padding: 8,
                        borderRadius: 10,
                        border: '2px solid #8b5cf6',
                        display: 'inline-block',
                      }}
                    >
                      {origin && (
                        <QRCodeSVG
                          value={origin + '/verify/' + selected.id}
                          size={90}
                          level="M"
                          fgColor="#6d28d9"
                          bgColor="#ffffff"
                        />
                      )}
                    </div>
                    <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>اسکن برای تأیید</p>
                  </div>

                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 40 }}>امضای مدیر مرکز</p>
                    <div style={{ width: 180, borderTop: '1px solid #475569', margin: '0 auto' }} />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>تاریخ صدور</p>
                    <p style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace', color: '#0f172a' }}>
                      {new Date().toLocaleDateString('fa-IR')}
                    </p>
                    <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>مهر مرکز</p>
                  </div>
                </div>

                <p
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    color: '#94a3b8',
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px dashed #e2e8f0',
                  }}
                >
                  این سند توسط سیستم مدیریت کاوش صادر شده و بدون مهر و امضا معتبر نیست
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 14, paddingBottom: 8,
        borderBottom: '2px solid #f5f3ff',
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#6d28d9' }}>{title}</h2>
    </div>
  );
}

function InfoRow({
  label, value, mono, highlight,
}: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div
      style={{
        padding: '8px 12px', borderRadius: 8,
        background: highlight ? '#f5f3ff' : '#f8fafc',
        border: '1px solid ' + (highlight ? '#c4b5fd' : '#e2e8f0'),
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12,
      }}
    >
      <span style={{ color: '#64748b' }}>{label}:</span>
      <span style={{ fontWeight: 'bold', color: highlight ? '#6d28d9' : '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  );
}

function StatBox({
  label, value, color, bg,
}: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ padding: 12, background: bg, borderRadius: 10, textAlign: 'center', border: '1px solid ' + color + '30' }}>
      <p style={{ fontSize: 10, color, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
}

function SummaryBox({
  icon, label, value, color,
}: { icon: string; label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 16, background: color + '10', borderRadius: 12, textAlign: 'center', border: '2px solid ' + color + '40' }}>
      <div style={{ fontSize: 32, marginBottom: 6 }}>{icon}</div>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 24, background: '#f8fafc', borderRadius: 10,
        border: '1px dashed #cbd5e1', textAlign: 'center',
        fontSize: 12, color: '#94a3b8', marginBottom: 24,
      }}
    >
      {text}
    </div>
  );
}

function TableBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: 24 }}>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 11, fontWeight: 'bold', color: '#6d28d9' }}>
      {children}
    </th>
  );
}

function Td({
  children, mono, bold, colSpan,
}: { children: React.ReactNode; mono?: boolean; bold?: boolean; colSpan?: number }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: '8px 10px', fontSize: 12, color: '#0f172a',
        fontFamily: mono ? 'monospace' : 'inherit',
        fontWeight: bold ? 'bold' : 'normal',
      }}
    >
      {children}
    </td>
  );
}