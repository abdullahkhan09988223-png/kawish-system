'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

const LOGO_URL =
  'https://i.ibb.co/5WVzgSt6/C7-B9-CCE3-0367-42A6-899-D-91-EE83-D25485.png';

type Payment = {
  id: string;
  receiptNumber: string;
  amount: number;
  date: string | null;
  method: string | null;
  notes: string | null;
  createdAt: string;
  cumulativeAtPayment?: number;
  fee: {
    id: string;
    total: number;
    paid: number;
    semester: string | null;
    status: string;
    student: {
      id: string;
      firstName: string;
      lastName: string | null;
      fatherName: string | null;
      studentNumber: string;
      phone: string | null;
      classRoom: { name: string; room: string | null } | null;
    };
    payments: Array<{ id: string; amount: number }>;
  };
};

const STATUS_FA: Record<string, string> = {
  PAID: 'تصفیه شده',
  PARTIAL: 'نیمه‌پرداخت',
  PENDING: 'پرداخت‌نشده',
};

export default function ReceiptPage() {
  const params = useParams();
  const id = params?.id as string;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch('/api/payments/' + id, { cache: 'no-store' });
        if (res.ok) setPayment((await res.json()).data);
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

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <p style={{ color: '#dc2626' }}>رسید یافت نشد</p>
      </div>
    );
  }

  const student = payment.fee.student;
  const fullName = student.firstName + ' ' + (student.lastName || '');
  const cumulative = payment.cumulativeAtPayment || 0;
  const remaining = Number(payment.fee.total) - cumulative;
  const verifyUrl = origin + '/verify-receipt/' + payment.receiptNumber;

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
          @page { size: A5; margin: 5mm; }
        }
      `}</style>

      <div
        className="no-print"
        style={{
          maxWidth: 600,
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
        <button
          type="button"
          onClick={handlePrint}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
            fontFamily: 'Vazirmatn, sans-serif',
          }}
        >
          🖨️ چاپ رسید
        </button>
      </div>

      <div className="print-bg" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div
          style={{
            background: 'white',
            padding: 32,
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
            border: '2px dashed #10b981',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a', lineHeight: 1.2 }}>
                مرکز آموزشی کاوش
              </p>
              <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                Kawish Educational Center
              </p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 10, color: '#94a3b8' }}>شماره رسید</p>
              <p style={{ fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace', color: '#047857' }}>
                {payment.receiptNumber}
              </p>
            </div>
          </div>

          <div style={{ height: 2, background: 'linear-gradient(90deg, #10b981, transparent)', marginBottom: 20 }} />

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
              🧾 رسید پرداخت فیس
            </h1>
            <p style={{ fontSize: 11, color: '#64748b' }}>Fee Payment Receipt</p>
          </div>

          <div
            style={{
              background: '#f0fdf4',
              padding: 16,
              borderRadius: 10,
              marginBottom: 20,
              border: '1px solid #bbf7d0',
            }}
          >
            <p style={{ fontSize: 11, color: '#047857', marginBottom: 8, fontWeight: 'bold' }}>
              معلومات دانشجو
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
              <Row label="نام کامل" value={fullName} />
              <Row label="ولد" value={student.fatherName || '—'} />
              <Row label="شماره دانشجویی" value={student.studentNumber} mono />
              <Row label="صنف" value={student.classRoom?.name || '—'} />
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: 20,
              borderRadius: 10,
              marginBottom: 20,
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>مبلغ پرداخت‌شده</p>
              <p style={{ fontSize: 32, fontWeight: 'bold', color: '#047857', fontFamily: 'monospace' }}>
                {fmt(payment.amount)}
                <span style={{ fontSize: 14, marginRight: 8, color: '#64748b' }}>AFN</span>
              </p>
            </div>

            <div style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
              <Row label="تاریخ پرداخت" value={payment.date || '—'} mono />
              <Row label="روش پرداخت" value={payment.method || 'نقدی'} />
              <Row label="سمستر" value={payment.fee.semester || '—'} />
              <Row label="وضعیت فیس" value={STATUS_FA[payment.fee.status] || payment.fee.status} />
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 10,
              border: '2px solid #10b981',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>مجموع فیس</p>
                <p style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>
                  {fmt(payment.fee.total)}
                </p>
              </div>
              <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: 10, color: '#047857', marginBottom: 4 }}>مجموع پرداخت‌شده</p>
                <p style={{ fontSize: 14, fontWeight: 'bold', color: '#047857' }}>
                  {fmt(cumulative)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: remaining > 0 ? '#dc2626' : '#047857', marginBottom: 4 }}>
                  باقی‌مانده
                </p>
                <p style={{ fontSize: 14, fontWeight: 'bold', color: remaining > 0 ? '#dc2626' : '#047857' }}>
                  {fmt(remaining)}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  background: 'white',
                  padding: 6,
                  borderRadius: 8,
                  border: '2px solid #10b981',
                  display: 'inline-block',
                }}
              >
                {verifyUrl && (
                  <QRCodeSVG
                    value={verifyUrl}
                    size={80}
                    level="M"
                    fgColor="#047857"
                    bgColor="#ffffff"
                  />
                )}
              </div>
              <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>اسکن برای تأیید</p>
            </div>

            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 30 }}>دریافت‌کننده</p>
              <div style={{ width: 120, borderTop: '1px solid #475569', margin: '0 auto' }} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>تاریخ صدور</p>
              <p style={{ fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace', color: '#0f172a' }}>
                {new Date(payment.createdAt).toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px dashed #cbd5e1',
              textAlign: 'center',
              fontSize: 10,
              color: '#94a3b8',
            }}
          >
            <p>با تشکر از پرداخت شما — این رسید معتبر است</p>
            <p style={{ marginTop: 4, fontFamily: 'monospace' }}>{payment.receiptNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
      <span style={{ color: '#64748b' }}>{label}:</span>
      <span style={{ fontWeight: 'bold', color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  );
}