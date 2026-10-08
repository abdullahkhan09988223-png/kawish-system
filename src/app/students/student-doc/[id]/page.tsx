'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

const LOGO_URL =
  'https://i.ibb.co/5WVzgSt6/C7-B9-CCE3-0367-42A6-899-D-91-EE83-D25485.png';

type Data = {
  student: {
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
  };
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

const STATUS_FA: Record<string, string> = {
  PRESENT: 'حاضر',
  ABSENT: 'غایب',
  LATE: 'تأخیر',
  EXCUSED: 'رخصت',
};

export default function StudentDocPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch('/api/students/' + id, { cache: 'no-store' });
        if (res.ok) setData((await res.json()).data);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [id]);

  const handlePrint = () => window.print();

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <p style={{ color: '#94a3b8' }}>⏳ در حال بارگذاری...</p>
      </div>
    );
  }

  if (!data || !data.student) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <p style={{ color: '#dc2626' }}>دانشجو یافت نشد</p>
      </div>
    );
  }

  const s = data.student;
  const fullName = s.firstName + ' ' + (s.lastName || '');

  // محاسبه حاضری
  const totalAtt = data.attendances?.length || 0;
  const presentCount = data.attendances.filter((a) => a.status === 'PRESENT').length;
  const absentCount = data.attendances.filter((a) => a.status === 'ABSENT').length;
  const lateCount = data.attendances.filter((a) => a.status === 'LATE').length;
  const excusedCount = data.attendances.filter((a) => a.status === 'EXCUSED').length;
  const attRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;

  // محاسبه معدل
  const avgScore = data.grades.length > 0
    ? data.grades.reduce((sum, g) => sum + Number(g.totalScore || 0), 0) / data.grades.length
    : 0;

  // محاسبه مدت تحصیل (ماه)
  const durationMonths = s.enrollmentDate ? calculateMonths(s.enrollmentDate) : 0;

  // استادان مجزا
  const teachers = new Set<string>();
  data.enrollments.forEach((e) => {
    if (e.subject.teacher) {
      teachers.add(e.subject.teacher.firstName + ' ' + e.subject.teacher.lastName);
    }
  });
  if (s.classRoom?.teacher) {
    teachers.add(s.classRoom.teacher.firstName + ' ' + s.classRoom.teacher.lastName);
  }
  const teacherList = Array.from(teachers);

  const verifyUrl = origin + '/verify/' + s.id;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        padding: 20,
        fontFamily: 'Vazirmatn, sans-serif',
      }}
    >
      <style>{`
        @media print {
          body { margin: 0; background: white !important; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; }
          .page-break { page-break-before: always; }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>

      {/* دکمه‌های کنترل */}
      <div
        className="no-print"
        style={{
          maxWidth: 900,
          margin: '0 auto 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => window.close()}
          style={{
            padding: '12px 20px',
            background: '#f1f5f9',
            color: '#475569',
            border: 'none',
            borderRadius: 12,
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'Vazirmatn, sans-serif',
          }}
        >
          ← بستن
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
              fontFamily: 'Vazirmatn, sans-serif',
            }}
          >
            🖨️ چاپ / ذخیره PDF
          </button>
        </div>
      </div>

      {/* راهنما */}
      <div
        className="no-print"
        style={{
          maxWidth: 900,
          margin: '0 auto 16px',
          background: '#fef3c7',
          color: '#b45309',
          padding: 16,
          borderRadius: 12,
          fontSize: 13,
          border: '1px solid #fcd34d',
        }}
      >
        <p style={{ fontWeight: 'bold', marginBottom: 6 }}>💡 راهنمای ذخیره PDF:</p>
        <ol style={{ paddingRight: 20, lineHeight: 1.8 }}>
          <li>روی دکمه «🖨️ چاپ / ذخیره PDF» بزنید</li>
          <li>در پنجره چاپ، در بخش <strong>Destination/Printer</strong>، گزینه <strong>Save as PDF</strong> را انتخاب کنید</li>
          <li>روی <strong>Save</strong> بزنید و محل ذخیره را انتخاب کنید</li>
          <li>فایل PDF آماده است — می‌توانید در واتس‌اپ برای دانشجو بفرستید</li>
        </ol>
      </div>

      {/* سند */}
      <div
        className="print-page"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: 'white',
          padding: 40,
          borderRadius: 12,
          boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
        }}
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
          <img
            src={LOGO_URL}
            alt="logo"
            style={{ width: 90, height: 90, objectFit: 'contain' }}
          />
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
                DOC-{s.studentNumber}
              </p>
            </div>
          </div>
        </div>

        {/* بخش ۱: معلومات شخصی */}
        <SectionTitle icon="👤" title="معلومات شخصی دانشجو" />

        <div
          style={{
            display: 'flex',
            gap: 20,
            marginBottom: 24,
            alignItems: 'flex-start',
          }}
        >
          {/* عکس */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: 130,
                height: 160,
                borderRadius: 10,
                border: '2px solid #8b5cf6',
                overflow: 'hidden',
                background: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {s.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.photo}
                  alt={s.firstName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 60,
                    fontWeight: 'bold',
                    color: '#8b5cf6',
                  }}
                >
                  {s.firstName[0]}
                </div>
              )}
            </div>
            <p
              style={{
                textAlign: 'center',
                fontSize: 10,
                color: '#94a3b8',
                marginTop: 6,
              }}
            >
              عکس ۳×۴
            </p>
          </div>

          {/* جدول معلومات */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <InfoRow label="نام کامل" value={fullName} />
            <InfoRow label="ولد" value={s.fatherName || '—'} />
            <InfoRow label="شماره دانشجویی" value={s.studentNumber} mono />
            <InfoRow label="شماره تذکره" value={s.tazkiraNumber || '—'} mono />
            <InfoRow
              label="جنسیت"
              value={s.gender === 'MALE' ? 'پسر' : s.gender === 'FEMALE' ? 'دختر' : '—'}
            />
            <InfoRow label="تاریخ تولد" value={s.birthDate || '—'} mono />
            <InfoRow label="صنف / کورس" value={s.classRoom?.name || '—'} highlight />
            <InfoRow label="اتاق" value={s.classRoom?.room || '—'} />
            <InfoRow label="تاریخ شمولیت" value={s.enrollmentDate || '—'} mono />
            <InfoRow label="مدت تحصیل" value={durationMonths > 0 ? durationMonths + ' ماه' : '—'} highlight />
            <InfoRow label="شماره تماس" value={s.phone || '—'} mono />
            <InfoRow label="شماره والد" value={s.parentPhone || '—'} mono />
            <div style={{ gridColumn: '1 / -1' }}>
              <InfoRow label="نشانی" value={s.address || '—'} />
            </div>
          </div>
        </div>

        {/* بخش ۲: مضامین خوانده‌شده */}
        <SectionTitle icon="📚" title="مضامین خوانده‌شده در کورس" />

        {data.enrollments.length === 0 ? (
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
                {data.enrollments.map((e, i) => (
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
                  <Td>{data.enrollments.reduce((s, e) => s + (e.subject.credits || 0), 0)} کریدیت</Td>
                  <Td>{data.enrollments.length} مضمون</Td>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          <StatBox label="کل روزهای ثبت‌شده" value={totalAtt.toString()} color="#0369a1" bg="#f0f9ff" />
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

        {data.grades.length === 0 ? (
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
                {data.grades.map((g, i) => {
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            marginBottom: 24,
          }}
        >
          <SummaryBox
            icon="📚"
            label="مضامین خوانده‌شده"
            value={data.enrollments.length + ' مضمون'}
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
          {/* QR */}
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
              {verifyUrl && (
                <QRCodeSVG
                  value={verifyUrl}
                  size={90}
                  level="M"
                  fgColor="#6d28d9"
                  bgColor="#ffffff"
                />
              )}
            </div>
            <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
              اسکن برای تأیید
            </p>
          </div>

          {/* امضا */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 40 }}>امضای مدیر مرکز</p>
            <div style={{ width: 180, borderTop: '1px solid #475569', margin: '0 auto' }} />
          </div>

          {/* تاریخ */}
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
  );
}

function calculateMonths(faDate: string): number {
  try {
    const parts = faDate.split('/').map((p) => parseInt(p.replace(/[^0-9]/g, ''), 10));
    if (parts.length < 3 || parts.some(isNaN)) return 0;
    const [y, m, d] = parts;
    const now = new Date().toLocaleDateString('fa-IR');
    const nowParts = now.split('/').map((p) => parseInt(p.replace(/[^0-9]/g, ''), 10));
    const [ny, nm, nd] = nowParts;
    const months = (ny - y) * 12 + (nm - m);
    return Math.max(0, months);
  } catch {
    return 0;
  }
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        paddingBottom: 8,
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
        padding: '8px 12px',
        borderRadius: 8,
        background: highlight ? '#f5f3ff' : '#f8fafc',
        border: '1px solid ' + (highlight ? '#c4b5fd' : '#e2e8f0'),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
      }}
    >
      <span style={{ color: '#64748b' }}>{label}:</span>
      <span
        style={{
          fontWeight: 'bold',
          color: highlight ? '#6d28d9' : '#0f172a',
          fontFamily: mono ? 'monospace' : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function StatBox({
  label, value, color, bg,
}: { label: string; value: string; color: string; bg: string }) {
  return (
    <div
      style={{
        padding: 12,
        background: bg,
        borderRadius: 10,
        textAlign: 'center',
        border: '1px solid ' + color + '30',
      }}
    >
      <p style={{ fontSize: 10, color, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
}

function SummaryBox({
  icon, label, value, color,
}: { icon: string; label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: 16,
        background: color + '10',
        borderRadius: 12,
        textAlign: 'center',
        border: '2px solid ' + color + '40',
      }}
    >
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
        padding: 24,
        background: '#f8fafc',
        borderRadius: 10,
        border: '1px dashed #cbd5e1',
        textAlign: 'center',
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 24,
      }}
    >
      {text}
    </div>
  );
}

function TableBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: '10px 8px',
        textAlign: 'right',
        fontSize: 11,
        fontWeight: 'bold',
        color: '#6d28d9',
      }}
    >
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
        padding: '8px 10px',
        fontSize: 12,
        color: '#0f172a',
        fontFamily: mono ? 'monospace' : 'inherit',
        fontWeight: bold ? 'bold' : 'normal',
      }}
    >
      {children}
    </td>
  );
}