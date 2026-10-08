'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

const LOGO_URL =
  'https://i.ibb.co/5WVzgSt6/C7-B9-CCE3-0367-42-A6-899-D-91-EE83-D25485.png';

type Cert = {
  id: string;
  serialNumber: string;
  type: string;
  title: string;
  recipientName: string;
  fatherName: string | null;
  className: string | null;
  courseName: string | null;
  startDate: string | null;
  endDate: string | null;
  grade: string | null;
  body: string;
  issuedBy: string | null;
  issuedAt: string | null;
  validUntil: string | null;
  template: string;
};

const TYPE_FA: Record<string, string> = {
  APPRECIATION: 'تقدیرنامه',
  GRADUATION: 'تصدیق‌نامه فراغت',
  COURSE: 'تصدیق‌نامه کورس',
  EMPLOYMENT: 'تصدیق‌نامه اشتغال',
  INTRO: 'معرفی‌نامه',
  TESTIMONIAL: 'گواهی‌نامه',
};

const TEMPLATE_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  classic: { primary: '#b45309', secondary: '#fbbf24', accent: '#78350f' },
  modern: { primary: '#0369a1', secondary: '#38bdf8', accent: '#0c4a6e' },
  elegant: { primary: '#047857', secondary: '#34d399', accent: '#064e3b' },
};

export default function CertificatePrintPage() {
  const params = useParams();
  const id = params?.id as string;
  const [cert, setCert] = useState<Cert | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch('/api/certificates/' + id, { cache: 'no-store' });
        if (res.ok) setCert((await res.json()).data);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <p style={{ color: '#94a3b8' }}>⏳ در حال بارگذاری...</p>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <p style={{ color: '#dc2626' }}>سند یافت نشد</p>
      </div>
    );
  }

  const colors = TEMPLATE_COLORS[cert.template] || TEMPLATE_COLORS.classic;
  const verifyUrl = origin + '/verify-cert/' + cert.serialNumber;

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
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-bg { background: white !important; padding: 0 !important; }
        }
        @page { size: A4 landscape; margin: 8mm; }
      `}</style>

      <div className="no-print" style={{ maxWidth: 1100, margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
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
          }}
        >
          ← بستن
        </button>
        <button
          type="button"
          onClick={handlePrint}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
          }}
        >
          🖨️ چاپ سند
        </button>
      </div>

      <div className="print-bg" style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
        <div
          style={{
            width: '100%',
            aspectRatio: '1.414 / 1',
            background: 'white',
            padding: 50,
            position: 'relative',
            boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid ' + colors.primary,
          }}
        >
          {/* قاب داخلی */}
          <div
            style={{
              position: 'absolute',
              top: 15, left: 15, right: 15, bottom: 15,
              border: '3px double ' + colors.secondary,
              borderRadius: 6,
              pointerEvents: 'none',
            }}
          />

          {/* گوشه‌های تزئینی */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => {
            const top = pos.includes('top') ? 25 : 'auto';
            const bottom = pos.includes('bottom') ? 25 : 'auto';
            const left = pos.includes('left') ? 25 : 'auto';
            const right = pos.includes('right') ? 25 : 'auto';
            return (
              <div
                key={pos}
                style={{
                  position: 'absolute',
                  top, bottom, left, right,
                  width: 50, height: 50,
                  borderTop: pos.includes('top') ? '4px solid ' + colors.secondary : 'none',
                  borderBottom: pos.includes('bottom') ? '4px solid ' + colors.secondary : 'none',
                  borderLeft: pos.includes('left') ? '4px solid ' + colors.secondary : 'none',
                  borderRight: pos.includes('right') ? '4px solid ' + colors.secondary : 'none',
                  pointerEvents: 'none',
                }}
              />
            );
          })}

          {/* محتوا */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* هدر */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOGO_URL}
                  alt="logo"
                  style={{ width: 70, height: 70, objectFit: 'contain' }}
                />
                <div>
                  <p style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary, lineHeight: 1.2 }}>
                    مرکز آموزشی کاوش
                  </p>
                  <p style={{ fontSize: 11, color: colors.accent, marginTop: 2 }}>
                    Kawish Educational Center
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>سریال نمبر</p>
                <p style={{ fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace', color: colors.primary }}>
                  {cert.serialNumber}
                </p>
              </div>
            </div>

            {/* عنوان */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '10px 40px',
                  borderTop: '2px solid ' + colors.secondary,
                  borderBottom: '2px solid ' + colors.secondary,
                }}
              >
                <p style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary, letterSpacing: 4 }}>
                  {cert.title || TYPE_FA[cert.type] || 'تقدیرنامه'}
                </p>
              </div>
            </div>

            {/* بدنه */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* نام */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>به نام</p>
                <p style={{ fontSize: 28, fontWeight: 'bold', color: colors.accent, marginBottom: 4 }}>
                  {cert.recipientName}
                </p>
                {cert.fatherName && (
                  <p style={{ fontSize: 14, color: '#64748b' }}>ولد {cert.fatherName}</p>
                )}
              </div>

              {/* متن */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 15,
                  lineHeight: 2.2,
                  color: '#334155',
                  maxWidth: 800,
                  margin: '0 auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {cert.body}
              </div>

              {/* اطلاعات */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginTop: 'auto',
                  paddingTop: 16,
                }}
              >
                {(cert.className || cert.courseName) && (
                  <Box label="صنف / کورس" value={cert.className || cert.courseName || ''} colors={colors} />
                )}
                {cert.startDate && (
                  <Box label="تاریخ شروع" value={cert.startDate} colors={colors} />
                )}
                {cert.endDate && (
                  <Box label="تاریخ ختم" value={cert.endDate} colors={colors} />
                )}
                {cert.grade && (
                  <Box label="درجه" value={cert.grade} colors={colors} />
                )}
              </div>
            </div>

            {/* پاورقی */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24 }}>
              {/* QR */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    background: 'white',
                    padding: 6,
                    borderRadius: 8,
                    border: '2px solid ' + colors.primary,
                    display: 'inline-block',
                  }}
                >
                  {verifyUrl && (
                    <QRCodeSVG
                      value={verifyUrl}
                      size={90}
                      level="M"
                      fgColor={colors.primary}
                      bgColor="#ffffff"
                    />
                  )}
                </div>
                <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
                  برای تأیید اسکن کنید
                </p>
              </div>

              {/* امضا */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 200,
                    borderTop: '2px solid ' + colors.primary,
                    paddingTop: 8,
                    marginBottom: 4,
                  }}
                />
                <p style={{ fontSize: 13, fontWeight: 'bold', color: colors.accent }}>
                  {cert.issuedBy || 'مدیر مرکز'}
                </p>
                <p style={{ fontSize: 10, color: '#64748b' }}>مهر و امضاء</p>
              </div>

              {/* تاریخ */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>تاریخ صدور</p>
                <p style={{ fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace', color: colors.accent }}>
                  {cert.issuedAt || '—'}
                </p>
                {cert.validUntil && (
                  <>
                    <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>معتبر تا</p>
                    <p style={{ fontSize: 12, fontFamily: 'monospace', color: colors.accent }}>
                      {cert.validUntil}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Box({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <div
      style={{
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.03)',
        border: '1px solid ' + colors.secondary + '40',
        borderRadius: 10,
        textAlign: 'center',
        minWidth: 100,
      }}
    >
      <p style={{ fontSize: 10, color: '#64748b' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 'bold', color: colors.accent, fontFamily: 'monospace' }}>
        {value}
      </p>
    </div>
  );
}