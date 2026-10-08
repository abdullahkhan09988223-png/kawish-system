'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

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
  enrollmentDate: string | null;
  classRoom: {
    id: string;
    name: string;
    grade: string | null;
    section: string | null;
    room: string | null;
  } | null;
  enrollments: Array<{
    id: string;
    subject: { id: string; name: string; code: string };
  }>;
};

export default function VerifyPage() {
  const params = useParams();
  const id = params?.id as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch('/api/students/' + id, { cache: 'no-store' });
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const json = await res.json();
        setStudent(json.data);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
          fontFamily: 'Vazirmatn, sans-serif',
        }}
      >
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <p>در حال بررسی...</p>
        </div>
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          fontFamily: 'Vazirmatn, sans-serif',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            padding: 40,
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>
            کارت معتبر نیست
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            این کارت در سیستم ثبت نشده یا حذف شده است
          </p>
        </div>
      </div>
    );
  }

  const fullName = student.firstName + ' ' + (student.lastName || '');

  return (
    <div
      dir="rtl"
      className="min-h-screen p-4"
      style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
        fontFamily: 'Vazirmatn, sans-serif',
      }}
    >
      <div style={{ maxWidth: 480, margin: '0 auto', paddingTop: 20, paddingBottom: 20 }}>
        {/* هدر موفقیت */}
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            padding: 24,
            marginBottom: 16,
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#d1fae5', margin: '0 auto 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40,
            }}
          >
            ✅
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#047857', marginBottom: 4 }}>
            کارت معتبر است
          </h1>
          <p style={{ fontSize: 12, color: '#64748b' }}>
            این دانشجو در مرکز آموزشی کاوش ثبت است
          </p>
        </div>

        {/* کارت اطلاعات */}
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            padding: 24,
            marginBottom: 16,
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          }}
        >
          {/* لوگو */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="logo"
              style={{ width: 70, height: 70, objectFit: 'contain' }}
            />
          </div>

          {/* عکس */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div
              style={{
                width: 110, height: 110, borderRadius: '50%', margin: '0 auto',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 44, fontWeight: 'bold',
                overflow: 'hidden',
                border: '4px solid #e0f2fe',
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
          </div>

          {/* نام */}
          <h2
            style={{
              fontSize: 22, fontWeight: 'bold', color: '#0f172a',
              textAlign: 'center', marginBottom: 4,
            }}
          >
            {fullName}
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            {student.fatherName ? 'ولد ' + student.fatherName : ''}
          </p>

          {/* اطلاعات */}
          <div style={{ display: 'grid', gap: 10 }}>
            <InfoRow label="شماره دانشجویی" value={student.studentNumber} mono />
            <InfoRow label="صنف / کورس" value={student.classRoom?.name || '—'} highlight />
            {student.classRoom?.room && (
              <InfoRow label="اتاق" value={student.classRoom.room} />
            )}
            <InfoRow
              label="جنسیت"
              value={student.gender === 'MALE' ? 'پسر' : student.gender === 'FEMALE' ? 'دختر' : '—'}
            />
            {student.enrollmentDate && (
              <InfoRow label="تاریخ شمولیت" value={student.enrollmentDate} mono />
            )}
            {student.birthDate && (
              <InfoRow label="تاریخ تولد" value={student.birthDate} mono />
            )}
            <InfoRow
              label="تعداد مضامین"
              value={(student.enrollments?.length || 0).toString()}
            />
          </div>

          {/* مضامین */}
          {student.enrollments && student.enrollments.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 }}>
                📚 مضامین ثبت‌نام‌شده
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {student.enrollments.map((e) => (
                  <span
                    key={e.id}
                    style={{
                      background: '#f0f9ff', color: '#0369a1',
                      padding: '6px 12px', borderRadius: 20,
                      fontSize: 12, fontWeight: 'bold',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    {e.subject.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* پاورقی */}
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 16,
            padding: 16,
            textAlign: 'center',
            color: 'white',
            fontSize: 12,
          }}
        >
          <p style={{ marginBottom: 6 }}>
            ✅ تأیید شده توسط سیستم مدیریت کاوش
          </p>
          <p style={{ opacity: 0.8 }}>
            {new Date().toLocaleString('fa-IR')}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', padding: '10px 14px',
        borderRadius: 12,
        background: highlight ? '#d1fae5' : '#f8fafc',
      }}
    >
      <span style={{ fontSize: 12, color: highlight ? '#047857' : '#64748b' }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13, fontWeight: 'bold',
          color: highlight ? '#047857' : '#0f172a',
          fontFamily: mono ? 'monospace' : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  );
}