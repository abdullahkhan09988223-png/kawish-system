'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const LOGO_URL =
  'https://i.ibb.co/5WVzgSt6/C7-B9-CCE3-0367-42-A6-899-D-91-EE83-D25485.png';

type Cert = {
  serialNumber: string;
  type: string;
  title: string;
  recipientName: string;
  fatherName: string | null;
  className: string | null;
  courseName: string | null;
  grade: string | null;
  issuedBy: string | null;
  issuedAt: string | null;
  validUntil: string | null;
  createdAt: string;
};

const TYPE_FA: Record<string, string> = {
  APPRECIATION: 'تقدیرنامه',
  GRADUATION: 'تصدیق‌نامه فراغت',
  COURSE: 'تصدیق‌نامه کورس',
  EMPLOYMENT: 'تصدیق‌نامه اشتغال',
  INTRO: 'معرفی‌نامه',
  TESTIMONIAL: 'گواهی‌نامه',
};

export default function VerifyCertPage() {
  const params = useParams();
  const serial = params?.serial as string;
  const [cert, setCert] = useState<Cert | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!serial) return;
    (async () => {
      try {
        const res = await fetch('/api/verify-cert/' + serial, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.valid) {
          setNotFound(true);
        } else {
          setCert(json.data);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [serial]);

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', fontFamily: 'Vazirmatn, sans-serif' }}
      >
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <p>در حال بررسی...</p>
        </div>
      </div>
    );
  }

  if (notFound || !cert) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', fontFamily: 'Vazirmatn, sans-serif' }}
      >
        <div style={{ background: 'white', borderRadius: 20, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>
            سند معتبر نیست
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            این سریال نمبر در سیستم یافت نشد
          </p>
          <p style={{ marginTop: 16, fontSize: 12, fontFamily: 'monospace', color: '#94a3b8' }}>
            {serial}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen p-4"
      style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', fontFamily: 'Vazirmatn, sans-serif' }}
    >
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 20, paddingBottom: 20 }}>
        {/* هدر */}
        <div
          style={{
            background: 'white', borderRadius: 20, padding: 24, marginBottom: 16,
            textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%', background: '#d1fae5',
              margin: '0 auto 12px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 40,
            }}
          >
            ✅
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#047857', marginBottom: 4 }}>
            سند معتبر است
          </h1>
          <p style={{ fontSize: 12, color: '#64748b' }}>
            این سند در مرکز آموزشی کاوش صادر شده است
          </p>
        </div>

        {/* کارت اطلاعات */}
        <div
          style={{
            background: 'white', borderRadius: 20, padding: 24, marginBottom: 16,
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />
          </div>

          <div
            style={{
              padding: '10px 20px', background: '#fef3c7', color: '#b45309',
              borderRadius: 20, display: 'inline-block', fontWeight: 'bold',
              fontSize: 12, margin: '0 auto 16px', display: 'block',
              textAlign: 'center', width: 'fit-content',
            }}
          >
            {TYPE_FA[cert.type] || cert.type}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 4 }}>
            {cert.title}
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            صادر شده برای
          </p>

          <h3 style={{ fontSize: 22, fontWeight: 'bold', color: '#b45309', textAlign: 'center', marginBottom: 4 }}>
            {cert.recipientName}
          </h3>
          {cert.fatherName && (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              ولد {cert.fatherName}
            </p>
          )}

          <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
            <Row label="سریال نمبر" value={cert.serialNumber} mono />
            {(cert.className || cert.courseName) && (
              <Row label="صنف / کورس" value={cert.className || cert.courseName || ''} />
            )}
            {cert.grade && <Row label="درجه" value={cert.grade} />}
            {cert.issuedBy && <Row label="صادرکننده" value={cert.issuedBy} />}
            {cert.issuedAt && <Row label="تاریخ صدور" value={cert.issuedAt} mono />}
            {cert.validUntil && <Row label="معتبر تا" value={cert.validUntil} mono />}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16,
            textAlign: 'center', color: 'white', fontSize: 12,
          }}
        >
          <p style={{ marginBottom: 6 }}>✅ تأیید شده توسط سیستم مدیریت کاوش</p>
          <p style={{ opacity: 0.8 }}>{new Date().toLocaleString('fa-IR')}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', borderRadius: 12, background: '#f8fafc',
      }}
    >
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  );
}