'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  photo: string | null;
  isActive: boolean;
  classRoom: { id: string; name: string } | null;
};

type SectionItem = {
  subjectId: string;
  name: string;
  code: string;
  category: string;
  hours: number;
  midtermScore: number;
  finalScore: number;
  practicalScore: number;
  totalScore: number;
};

type Transcript = {
  student: any;
  sections: {
    math: { items: SectionItem[]; avg: number; hours: number; count: number };
    computer: { items: SectionItem[]; avg: number; hours: number; count: number };
    english: { items: SectionItem[]; avg: number; hours: number; count: number };
    general: { items: SectionItem[]; avg: number; hours: number; count: number };
  };
  summary: {
    overallAvg: number;
    totalSubjects: number;
    totalHours: number;
  };
};

const CATEGORY_LABELS: Record<string, { fa: string; en: string; icon: string; color: string }> = {
  math: { fa: 'ریاضی', en: 'Mathematics', icon: '📐', color: '#0ea5e9' },
  computer: { fa: 'کمپیوتر', en: 'Computer', icon: '💻', color: '#8b5cf6' },
  english: { fa: 'انگلیسی', en: 'English', icon: '🌐', color: '#10b981' },
  general: { fa: 'عمومی', en: 'General', icon: '📚', color: '#f59e0b' },
};

export default function TranscriptPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [lang, setLang] = useState<'fa' | 'en'>('fa');

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
      const res = await fetch('/api/students?active=true', { cache: 'no-store' });
      if (res.ok) setStudents((await res.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadStudents(); }, [user]);

  const openTranscript = async (studentId: string) => {
    setLoadingTranscript(true);
    setTranscript(null);
    try {
      const res = await fetch('/api/transcript/' + studentId, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setTranscript(json.data);
        setTimeout(() => {
          document.getElementById('transcript-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (e) { console.error(e); }
    setLoadingTranscript(false);
  };

  const handlePrint = () => window.print();

  if (!user) return null;

  const filtered = search.trim()
    ? students.filter((s) => {
        const q = search.toLowerCase().trim();
        return (
          s.studentNumber.toLowerCase().includes(q) ||
          s.firstName.toLowerCase().includes(q) ||
          (s.lastName || '').toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="transcript" />

      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; padding: 0 !important; }
          .page-break { page-break-before: always; }
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
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              fontSize: 14,
            }}
          >
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="no-print">
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
              🎓 ترانسکرپت (کارنامه)
            </h1>
            <p style={{ color: '#64748b' }}>
              ترانسکرپت سه‌بخشی: ریاضی + کمپیوتر + انگلیسی
            </p>
          </div>

          {/* جستجو */}
          <div className="bg-white rounded-2xl p-6 no-print" style={{ border: '1px solid #e2e8f0' }}>
            <label className="block text-sm font-bold mb-3" style={{ color: '#334155' }}>
              🔍 انتخاب دانشجو
            </label>
            <input
              type="text"
              placeholder="نام یا شماره دانشجویی..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full px-5 py-4 rounded-xl border-2 text-lg outline-none"
              style={{ borderColor: '#10b981', background: '#f0fdf4' }}
            />
          </div>

          {/* نتایج */}
          {!loading && search.trim() && filtered.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden no-print" style={{ border: '1px solid #e2e8f0' }}>
              <div className="p-3 text-xs font-bold" style={{ background: '#d1fae5', color: '#047857' }}>
                {filtered.length} نتیجه — روی هر کارت کلیک کنید
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openTranscript(s.id)}
                    className="bg-white rounded-xl p-4 text-right cursor-pointer transition-all"
                    style={{ border: '1px solid #e2e8f0' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#10b981';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
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
                            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                          }}
                        >
                          {s.firstName[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                          {s.firstName} {s.lastName || ''}
                        </p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: '#047857' }}>
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

          {!search.trim() && !transcript && !loadingTranscript && (
            <div className="p-12 text-center bg-white rounded-2xl no-print" style={{ border: '2px dashed #cbd5e1' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🎓</div>
              <p className="font-bold text-lg mb-2" style={{ color: '#475569' }}>
                دانشجو را انتخاب کنید
              </p>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                ترانسکرپت با سه بخش (ریاضی، کمپیوتر، انگلیسی) صادر می‌شود
              </p>
            </div>
          )}

          {loadingTranscript && (
            <div className="p-12 text-center no-print" style={{ color: '#94a3b8' }}>
              ⏳ در حال آماده‌سازی ترانسکرپت...
            </div>
          )}

          {/* ترانسکرپت */}
          {transcript && (
            <div id="transcript-section" className="space-y-4">
              {/* کنترل‌ها */}
              <div className="flex justify-between items-center flex-wrap gap-3 no-print">
                <button
                  type="button"
                  onClick={() => setTranscript(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
                >
                  ✕ بستن
                </button>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex gap-1 rounded-xl p-1" style={{ background: '#f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => setLang('fa')}
                      className="px-4 py-2 rounded-lg text-sm font-bold"
                      style={{
                        background: lang === 'fa' ? '#10b981' : 'transparent',
                        color: lang === 'fa' ? 'white' : '#475569',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      🇦🇫 دری
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className="px-4 py-2 rounded-lg text-sm font-bold"
                      style={{
                        background: lang === 'en' ? '#10b981' : 'transparent',
                        color: lang === 'en' ? 'white' : '#475569',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      🇬🇧 English
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    🖨️ چاپ / ذخیره PDF
                  </button>
                </div>
              </div>

              {/* راهنما */}
              <div
                className="p-4 rounded-xl text-xs no-print"
                style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}
              >
                <p style={{ fontWeight: 'bold', marginBottom: 6 }}>💡 راهنمای ذخیره PDF:</p>
                <ol style={{ paddingRight: 20, lineHeight: 1.8 }}>
                  <li>روی «🖨️ چاپ / ذخیره PDF» بزنید</li>
                  <li>در پنجره چاپ، <strong>Microsoft Print to PDF</strong> یا <strong>Save as PDF</strong> را انتخاب کنید</li>
                  <li>Save بزنید — فایل PDF آماده است</li>
                  <li>در واتس‌اپ برای دانشجو ارسال کنید یا پرینت بگیرید</li>
                </ol>
              </div>

              {/* سند ترانسکرپت */}
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
                    borderBottom: '3px double #10b981',
                    marginBottom: 24,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://i.ibb.co/5WVzgSt6/C7-B9-CCE3-0367-42A6-899-D-91-EE83-D25485.png"
                    alt="logo"
                    style={{ width: 80, height: 80, objectFit: 'contain' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
                      {lang === 'fa' ? 'مرکز آموزشی کاوش' : 'Kawish Educational Center'}
                    </h1>
                    <p style={{ fontSize: 13, color: '#047857', fontWeight: 'bold' }}>
                      {lang === 'fa' ? 'ترانسکرپت رسمی (کارنامه)' : 'Official Transcript'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div
                      style={{
                        background: '#f0fdf4',
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: '1px solid #86efac',
                      }}
                    >
                      <p style={{ fontSize: 10, color: '#047857' }}>
                        {lang === 'fa' ? 'شماره دانشجویی' : 'Student ID'}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace', color: '#047857' }}>
                        {transcript.student.studentNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* معلومات دانشجو */}
                <div
                  style={{
                    background: '#f0fdf4',
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 24,
                    border: '1px solid #86efac',
                  }}
                >
                  <p style={{ fontSize: 12, color: '#047857', fontWeight: 'bold', marginBottom: 10 }}>
                    {lang === 'fa' ? 'معلومات دانشجو' : 'Student Information'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                    <Row label={lang === 'fa' ? 'نام کامل' : 'Full Name'}
                         value={transcript.student.firstName + ' ' + (transcript.student.lastName || '')} />
                    <Row label={lang === 'fa' ? 'ولد' : 'Father Name'} value={transcript.student.fatherName || '—'} />
                    <Row label={lang === 'fa' ? 'تاریخ تولد' : 'Date of Birth'} value={transcript.student.birthDate || '—'} />
                    <Row label={lang === 'fa' ? 'تاریخ شمولیت' : 'Enrollment Date'} value={transcript.student.enrollmentDate || '—'} />
                    <Row label={lang === 'fa' ? 'صنف' : 'Class'} value={transcript.student.classRoom?.name || '—'} />
                    <Row label={lang === 'fa' ? 'استاد' : 'Teacher'}
                         value={transcript.student.classRoom?.teacher
                           ? transcript.student.classRoom.teacher.firstName + ' ' + transcript.student.classRoom.teacher.lastName
                           : '—'} />
                  </div>
                </div>

                {/* بخش ریاضی */}
                {transcript.sections.math.count > 0 && (
                  <SectionBlock
                    category="math"
                    title={lang === 'fa' ? 'بخش اول — ریاضی' : 'Section 1 — Mathematics'}
                    section={transcript.sections.math}
                    lang={lang}
                  />
                )}

                {/* بخش کمپیوتر */}
                {transcript.sections.computer.count > 0 && (
                  <SectionBlock
                    category="computer"
                    title={lang === 'fa' ? 'بخش دوم — کمپیوتر' : 'Section 2 — Computer'}
                    section={transcript.sections.computer}
                    lang={lang}
                  />
                )}

                {/* بخش انگلیسی */}
                {transcript.sections.english.count > 0 && (
                  <SectionBlock
                    category="english"
                    title={lang === 'fa' ? 'بخش سوم — انگلیسی' : 'Section 3 — English'}
                    section={transcript.sections.english}
                    lang={lang}
                  />
                )}

                {/* بخش عمومی */}
                {transcript.sections.general.count > 0 && (
                  <SectionBlock
                    category="general"
                    title={lang === 'fa' ? 'بخش چهارم — عمومی' : 'Section 4 — General'}
                    section={transcript.sections.general}
                    lang={lang}
                  />
                )}

                {/* خلاصه نهایی */}
                <div
                  style={{
                    marginTop: 24,
                    padding: 20,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '2px solid #3b82f6',
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 'bold', color: '#1e40af', marginBottom: 12 }}>
                    {lang === 'fa' ? '📊 خلاصه نهایی' : '📊 Final Summary'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
                    <div>
                      <p style={{ fontSize: 10, color: '#1e40af', marginBottom: 4 }}>
                        {lang === 'fa' ? 'تعداد مضامین' : 'Total Subjects'}
                      </p>
                      <p style={{ fontSize: 20, fontWeight: 'bold', color: '#1e40af' }}>
                        {transcript.summary.totalSubjects}
                      </p>
                    </div>
                    <div style={{ borderLeft: '1px solid #93c5fd', borderRight: '1px solid #93c5fd' }}>
                      <p style={{ fontSize: 10, color: '#1e40af', marginBottom: 4 }}>
                        {lang === 'fa' ? 'مجموع ساعت' : 'Total Hours'}
                      </p>
                      <p style={{ fontSize: 20, fontWeight: 'bold', color: '#1e40af' }}>
                        {transcript.summary.totalHours}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: '#1e40af', marginBottom: 4 }}>
                        {lang === 'fa' ? 'معدل کل' : 'Overall Average'}
                      </p>
                      <p style={{ fontSize: 20, fontWeight: 'bold', color: '#1e40af' }}>
                        {transcript.summary.overallAvg.toFixed(2)}
                      </p>
                    </div>
                  </div>
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
                    <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 30 }}>
                      {lang === 'fa' ? 'مهر و امضای مدیر' : 'Signature & Stamp'}
                    </p>
                    <div style={{ width: 180, borderTop: '1px solid #475569', margin: '0 auto' }} />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>
                      {lang === 'fa' ? 'تاریخ صدور' : 'Issue Date'}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace', color: '#0f172a' }}>
                      {new Date().toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    textAlign: 'center',
                    fontSize: 9,
                    color: '#94a3b8',
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px dashed #e2e8f0',
                  }}
                >
                  {lang === 'fa'
                    ? 'این سند توسط سیستم مدیریت کاوش صادر شده و بدون مهر و امضا معتبر نیست'
                    : 'This document is issued by Kawish Management System and is valid only with signature and stamp'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
      <span style={{ color: '#047857' }}>{label}:</span>
      <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{value}</span>
    </div>
  );
}

function SectionBlock({
  category, title, section, lang,
}: {
  category: string;
  title: string;
  section: { items: SectionItem[]; avg: number; hours: number; count: number };
  lang: 'fa' | 'en';
}) {
  const info = CATEGORY_LABELS[category] || CATEGORY_LABELS.general;

  return (
    <div
      style={{
        marginBottom: 24,
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid ' + info.color,
      }}
    >
      {/* هدر بخش */}
      <div
        style={{
          padding: '12px 18px',
          background: info.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{info.icon}</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 'bold', color: 'white' }}>{title}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              {info.en}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'white' }}>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: 20, fontWeight: 'bold' }}>
            {lang === 'fa' ? `${section.count} مضمون` : `${section.count} Subjects`}
          </span>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: 20, fontWeight: 'bold' }}>
            {lang === 'fa' ? `${section.hours} ساعت` : `${section.hours} Hours`}
          </span>
          <span style={{ background: 'white', color: info.color, padding: '4px 10px', borderRadius: 20, fontWeight: 'bold' }}>
            {lang === 'fa' ? 'معدل: ' : 'Avg: '}
            {section.avg.toFixed(2)}
          </span>
        </div>
      </div>

      {/* جدول */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748b', fontSize: 11 }}>
              {lang === 'fa' ? '#' : '#'}
            </th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748b', fontSize: 11 }}>
              {lang === 'fa' ? 'نام مضمون' : 'Subject'}
            </th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748b', fontSize: 11 }}>
              {lang === 'fa' ? 'ساعت' : 'Hours'}
            </th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748b', fontSize: 11 }}>
              {lang === 'fa' ? 'میان‌ترم' : 'Midterm'}
            </th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748b', fontSize: 11 }}>
              {lang === 'fa' ? 'فاینل' : 'Final'}
            </th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748b', fontSize: 11 }}>
              {lang === 'fa' ? 'عملی' : 'Practical'}
            </th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748b', fontSize: 11 }}>
              {lang === 'fa' ? 'مجموع' : 'Total'}
            </th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: '#64748b', fontSize: 11 }}>
              {lang === 'fa' ? 'نتیجه' : 'Result'}
            </th>
          </tr>
        </thead>
        <tbody>
          {section.items.map((item, i) => {
            const pass = Number(item.totalScore) >= 50;
            return (
              <tr key={item.subjectId} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 10px', color: '#94a3b8', fontSize: 11 }}>{i + 1}</td>
                <td style={{ padding: '8px 10px' }}>
                  <p style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 12 }}>{item.name}</p>
                  <p style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: 10 }}>{item.code}</p>
                </td>
                <td style={{ padding: '8px 10px', color: '#475569' }}>{item.hours}</td>
                <td style={{ padding: '8px 10px', color: '#475569', fontFamily: 'monospace' }}>{item.midtermScore}</td>
                <td style={{ padding: '8px 10px', color: '#475569', fontFamily: 'monospace' }}>{item.finalScore}</td>
                <td style={{ padding: '8px 10px', color: '#475569', fontFamily: 'monospace' }}>{item.practicalScore}</td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{ fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace', fontSize: 13 }}>
                    {item.totalScore}
                  </span>
                </td>
                <td style={{ padding: '8px 10px' }}>
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
                    {pass
                      ? (lang === 'fa' ? '✓ قبول' : '✓ Pass')
                      : (lang === 'fa' ? '✕ ناکام' : '✕ Fail')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: info.color + '15', borderTop: '2px solid ' + info.color }}>
            <td colSpan={2} style={{ padding: '10px', fontWeight: 'bold', color: info.color, fontSize: 12 }}>
              {lang === 'fa' ? 'معدل بخش' : 'Section Average'}
            </td>
            <td style={{ padding: '10px', fontWeight: 'bold', color: info.color }}>{section.hours}</td>
            <td colSpan={4} style={{ padding: '10px' }} />
            <td style={{ padding: '10px' }}>
              <span
                style={{
                  background: info.color,
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                }}
              >
                {section.avg.toFixed(2)}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}