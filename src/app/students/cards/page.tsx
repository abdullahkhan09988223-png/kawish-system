'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '@/components/Sidebar';

const LOGO_URL =
  'https://i.ibb.co/5WVzgSt6/C7-B9-CCE3-0367-42-A6-899-D-91-EE83-D25485.png';

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  fatherName: string | null;
  photo: string | null;
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  enrollmentDate: string | null;
  classRoom: { id: string; name: string; room: string | null } | null;
};

export default function StudentCardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

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
      const res = await fetch('/api/students', { cache: 'no-store' });
      if (res.ok) {
        const list = (await res.json()).data || [];
        setStudents(list);
        if (list.length > 0) setSelected(list[0]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      (s.lastName || '').toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q) ||
      (s.fatherName || '').toLowerCase().includes(q)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="students" />

      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { display: block !important; }
          .card { box-shadow: none !important; }
        }
        @page { size: A4; margin: 10mm; }
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
          <button
            type="button"
            onClick={() => router.push('/students')}
            className="px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
          >
            ← بازگشت
          </button>
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>
            خوش آمدید، {user.name}
          </h2>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="no-print">
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
              🪪 کارت دانشجویی
            </h1>
            <p style={{ color: '#64748b' }}>
              کارت با QR Code (کاملاً آفلاین)
            </p>
          </div>

          <div
            className="bg-white rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 no-print"
            style={{ border: '1px solid #e2e8f0' }}
          >
            <input
              type="text"
              placeholder="🔍 جستجوی نام، ولد یا شماره دانشجویی..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:col-span-2 px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#e2e8f0' }}
            />
            <select
              value={selected?.id || ''}
              onChange={(e) => {
                const s = students.find((x) => x.id === e.target.value);
                if (s) setSelected(s);
              }}
              className="px-4 py-3 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">-- انتخاب دانشجو --</option>
              {filtered.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentNumber} — {s.firstName} {s.lastName || ''}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center" style={{ color: '#94a3b8' }}>
              ⏳ در حال بارگذاری...
            </div>
          ) : !selected ? (
            <div
              className="p-12 text-center bg-white rounded-2xl"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <p style={{ fontSize: 48, marginBottom: 12 }}>🪪</p>
              <p style={{ color: '#94a3b8' }}>دانشجویی انتخاب نشده</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end gap-3 no-print">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-6 py-3 rounded-xl text-white font-bold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
                  }}
                >
                  🖨️ چاپ کارت
                </button>
              </div>

              <div className="print-area space-y-8">
                <div>
                  <p className="text-xs font-bold mb-2 no-print" style={{ color: '#64748b' }}>
                    رو فارسی
                  </p>
                  <CardFarsi student={selected} origin={origin} />
                </div>

                <div>
                  <p className="text-xs font-bold mb-2 no-print" style={{ color: '#64748b' }}>
                    رو انگلیسی
                  </p>
                  <CardEnglish student={selected} origin={origin} />
                </div>
              </div>

              <div
                className="p-4 rounded-xl text-xs no-print"
                style={{ background: '#f0f9ff', color: '#0369a1' }}
              >
                📱 <strong>QR Code آفلاین:</strong> بدون نیاز به اینترنت ساخته می‌شود. با اسکن، صفحه تأیید باز می‌شود.
                {origin && (
                  <span style={{ display: 'block', marginTop: 4, fontFamily: 'monospace' }}>
                    {origin}/verify/{selected.id}
                  </span>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function CardFarsi({ student, origin }: { student: Student; origin: string }) {
  const fullName = student.firstName + ' ' + (student.lastName || '');
  const verifyUrl = origin + '/verify/' + student.id;

  return (
    <div
      className="card"
      style={{
        width: 428,
        height: 270,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
        color: 'white',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute', top: -60, left: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: -80, right: -80,
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_URL}
          alt="logo"
          style={{
            width: 44, height: 44, objectFit: 'contain',
            background: 'white', borderRadius: '50%', padding: 3,
          }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 'bold', lineHeight: 1.2 }}>
            مرکز آموزشی کاوش
          </p>
          <p style={{ fontSize: 9, opacity: 0.85, marginTop: 2 }}>
            Kawish Educational Center
          </p>
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 8, opacity: 0.85 }}>کارت دانشجویی</p>
          <p style={{ fontSize: 10, fontWeight: 'bold' }}>STUDENT ID</p>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.3)', margin: '10px 0', zIndex: 1 }} />

      <div style={{ display: 'flex', gap: 12, zIndex: 1, flex: 1 }}>
        <div
          style={{
            width: 78, height: 96, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 'bold', overflow: 'hidden', flexShrink: 0,
          }}
        >
          {student.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.photo}
              alt={student.firstName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            student.firstName[0]
          )}
        </div>

        <div style={{ flex: 1, fontSize: 10, lineHeight: 1.85 }}>
          <InfoLine label="نام" value={fullName} />
          <InfoLine label="ولد" value={student.fatherName || '—'} />
          <InfoLine label="شماره" value={student.studentNumber} mono />
          <InfoLine label="صنف" value={student.classRoom?.name || '—'} />
          <InfoLine label="اعتبار" value="1404/12/29" mono />
        </div>

        <div
          style={{
            width: 82, height: 82,
            background: 'white', borderRadius: 8, padding: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {verifyUrl ? (
            <QRCodeSVG
              value={verifyUrl}
              size={72}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          ) : (
            <div style={{ fontSize: 8, textAlign: 'center', color: '#64748b' }}>
              در حال ساخت...
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginTop: 6, zIndex: 1,
          fontSize: 8, opacity: 0.9,
        }}
      >
        <span>📞 0700000000</span>
        <span>برای تأیید اسکن کنید →</span>
      </div>
    </div>
  );
}

function CardEnglish({ student, origin }: { student: Student; origin: string }) {
  const fullName = student.firstName + ' ' + (student.lastName || '');
  const verifyUrl = origin + '/verify/' + student.id;

  return (
    <div
      className="card"
      style={{
        width: 428, height: 270, borderRadius: 16,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: 'white', padding: 16, position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', direction: 'ltr',
      }}
    >
      <div
        style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(14,165,233,0.15)',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(14,165,233,0.1)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_URL}
          alt="logo"
          style={{
            width: 44, height: 44, objectFit: 'contain',
            background: 'white', borderRadius: '50%', padding: 3,
          }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 'bold', lineHeight: 1.2 }}>
            Kawish Educational Center
          </p>
          <p style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>
            Official Student Card
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 8, opacity: 0.7 }}>STUDENT ID</p>
          <p style={{ fontSize: 10, fontWeight: 'bold', color: '#38bdf8' }}>
            {student.studentNumber}
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '10px 0', zIndex: 1 }} />

      <div style={{ display: 'flex', gap: 12, zIndex: 1, flex: 1 }}>
        <div
          style={{
            width: 78, height: 96, borderRadius: 8,
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(56,189,248,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 'bold', overflow: 'hidden', flexShrink: 0,
          }}
        >
          {student.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.photo}
              alt={student.firstName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            student.firstName[0]
          )}
        </div>

        <div style={{ flex: 1, fontSize: 10, lineHeight: 1.85 }}>
          <InfoLineEn label="Name" value={fullName} />
          <InfoLineEn label="Father" value={student.fatherName || '—'} />
          <InfoLineEn label="Class" value={student.classRoom?.name || '—'} />
          <InfoLineEn label="Valid" value="1404/12/29" mono />
          <InfoLineEn label="Type" value="Student" />
        </div>

        <div
          style={{
            width: 82, height: 82, background: 'white', borderRadius: 8, padding: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          {verifyUrl ? (
            <QRCodeSVG
              value={verifyUrl}
              size={72}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          ) : (
            <div style={{ fontSize: 8, textAlign: 'center', color: '#64748b' }}>
              Loading...
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginTop: 6, zIndex: 1,
          fontSize: 8, opacity: 0.7,
        }}
      >
        <span>www.kawish.edu</span>
        <span>Scan to verify →</span>
      </div>
    </div>
  );
}

function InfoLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <span style={{ opacity: 0.75, minWidth: 40 }}>{label}:</span>
      <span style={{ fontWeight: 'bold', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  );
}

function InfoLineEn({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <span style={{ opacity: 0.6, minWidth: 44 }}>{label}:</span>
      <span style={{ fontWeight: 'bold', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  );
}