'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  fatherName: string | null;
  phone: string | null;
  parentPhone: string | null;
  parentName: string | null;
  parentRelation: string | null;
  address: string | null;
  enrollmentDate: string | null;
  serialNumber: number | null;
  birthDate: string | null;
  gender: string | null;
  tazkiraNumber: string | null;
  tazkiraPhoto: string | null;
  photo: string | null;
  totalFee: number;
  feeType: string | null;
  feeMonthly: number;
  timeFrom: string | null;
  timeTo: string | null;
  isActive: boolean;
  leftDate: string | null;
  leftReason: string | null;
  classRoom: {
    id: string;
    name: string;
    room: string | null;
    teacher: { id: string; firstName: string; lastName: string } | null;
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
  fees: Array<{
    id: string;
    total: number;
    paid: number;
    status: string;
    month: string | null;
    year: string | null;
    dueDate: string | null;
    createdAt: string;
    payments: Array<{
      id: string;
      receiptNumber: string;
      amount: number;
      date: string | null;
      method: string | null;
      createdAt: string;
    }>;
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
    note: string | null;
  }>;
  transfers: Array<{
    id: string;
    fromClassName: string | null;
    toClassName: string;
    transferDate: string;
    reason: string | null;
    notes: string | null;
    createdAt: string;
  }>;
};

type ClassRoom = {
  id: string;
  name: string;
  room: string | null;
};

const STATUS_LABELS: Record<string, { fa: string; color: string; bg: string }> = {
  PRESENT: { fa: 'حاضر', color: '#047857', bg: '#d1fae5' },
  ABSENT: { fa: 'غایب', color: '#dc2626', bg: '#fee2e2' },
  LATE: { fa: 'تأخیر', color: '#b45309', bg: '#fef3c7' },
  EXCUSED: { fa: 'رخصت', color: '#4338ca', bg: '#e0e7ff' },
};

const todayFa = () => new Date().toLocaleDateString('fa-IR');

export default function StudentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'subjects' | 'fees' | 'grades' | 'attendance' | 'history'>('info');
  const [saving, setSaving] = useState(false);

  // مودال انتقال
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    toClassRoomId: '',
    transferDate: todayFa(),
    reason: '',
    notes: '',
  });

  // مودال غیرفعال
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateForm, setDeactivateForm] = useState({
    leftDate: todayFa(),
    leftReason: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/students/' + id, { cache: 'no-store' }),
        fetch('/api/classrooms', { cache: 'no-store' }),
      ]);
      if (sRes.ok) {
        const json = await sRes.json();
        setStudent(json.data);
      }
      if (cRes.ok) setClasses((await cRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user && id) loadAll(); }, [user, id]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  const handlePrint = () => window.print();

  // انتقال صنف
  const handleTransfer = async () => {
    if (!transferForm.toClassRoomId) {
      alert('صنف جدید را انتخاب کنید');
      return;
    }
    if (!student) return;
    if (transferForm.toClassRoomId === student.classRoom?.id) {
      alert('این همان صنف فعلی است');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/students/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          toClassRoomId: transferForm.toClassRoomId,
          transferDate: transferForm.transferDate,
          reason: transferForm.reason || null,
          notes: transferForm.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      await logAction({
        action: 'UPDATE',
        tableName: 'students',
        recordId: id,
        recordName: student.firstName + ' ' + (student.lastName || ''),
        details: 'انتقال از ' + (student.classRoom?.name || '—') + ' به ' +
                 (classes.find((c) => c.id === transferForm.toClassRoomId)?.name || ''),
      });

      setShowTransferModal(false);
      setTransferForm({ toClassRoomId: '', transferDate: todayFa(), reason: '', notes: '' });
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // غیرفعال کردن
  const handleDeactivate = async () => {
    if (!deactivateForm.leftReason.trim()) {
      alert('دلیل ترک را وارد کنید');
      return;
    }
    if (!student) return;

    setSaving(true);
    try {
      const res = await fetch('/api/students/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deactivate',
          leftDate: deactivateForm.leftDate,
          leftReason: deactivateForm.leftReason,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      await logAction({
        action: 'UPDATE',
        tableName: 'students',
        recordId: id,
        recordName: student.firstName + ' ' + (student.lastName || ''),
        details: 'غیرفعال کردن دانشجو — دلیل: ' + deactivateForm.leftReason,
      });

      setShowDeactivateModal(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // فعال کردن مجدد
  const handleActivate = async () => {
    if (!confirm('این دانشجو دوباره فعال شود؟')) return;
    if (!student) return;

    setSaving(true);
    try {
      const res = await fetch('/api/students/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      await logAction({
        action: 'UPDATE',
        tableName: 'students',
        recordId: id,
        recordName: student.firstName + ' ' + (student.lastName || ''),
        details: 'فعال کردن مجدد دانشجو',
      });

      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <Sidebar active="students" />
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: '#94a3b8' }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
        <Sidebar active="students" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-6xl">🔍</p>
          <p className="font-bold" style={{ color: '#0f172a' }}>دانشجو یافت نشد</p>
          <a
            href="/students"
            className="px-5 py-2.5 rounded-xl text-white font-bold text-sm no-underline"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)' }}
          >
            بازگشت به لیست
          </a>
        </div>
      </div>
    );
  }

  const totalPaid = student.fees.reduce((s, f) => s + Number(f.paid || 0), 0);
  const totalFee = student.fees.reduce((s, f) => s + Number(f.total || 0), 0);
  const remaining = totalFee - totalPaid;
  const avgScore =
    student.grades.length > 0
      ? student.grades.reduce((s, g) => s + Number(g.totalScore || 0), 0) / student.grades.length
      : 0;
  const presentCount = student.attendances.filter((a) => a.status === 'PRESENT').length;
  const absentCount = student.attendances.filter((a) => a.status === 'ABSENT').length;
  const lateCount = student.attendances.filter((a) => a.status === 'LATE').length;
  const attendanceRate =
    student.attendances.length > 0
      ? Math.round((presentCount / student.attendances.length) * 100)
      : 0;

  const TABS: Array<{ key: typeof tab; label: string; icon: string; count?: number }> = [
    { key: 'info', label: 'معلومات شخصی', icon: '👤' },
    { key: 'subjects', label: 'مضامین', icon: '📚' },
    { key: 'fees', label: 'فیس و پرداخت', icon: '💰' },
    { key: 'grades', label: 'نمرات', icon: '📝' },
    { key: 'attendance', label: 'حاضری', icon: '📅' },
    { key: 'history', label: 'تاریخچه انتقال', icon: '🔄', count: student.transfers?.length || 0 },
  ];

  const otherClasses = classes.filter((c) => c.id !== student.classRoom?.id);

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="students" />

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
            href="/students"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold no-underline"
            style={{ background: '#f1f5f9', color: '#475569' }}
          >
            ← بازگشت
          </a>
          <div className="flex gap-2 flex-wrap">
            {student.isActive && otherClasses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTransferForm({
                    toClassRoomId: '',
                    transferDate: todayFa(),
                    reason: '',
                    notes: '',
                  });
                  setShowTransferModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', cursor: 'pointer', border: 'none' }}
              >
                🔄 انتقال صنف
              </button>
            )}

            {student.isActive ? (
              <button
                type="button"
                onClick={() => {
                  setDeactivateForm({ leftDate: todayFa(), leftReason: '' });
                  setShowDeactivateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', cursor: 'pointer', border: 'none' }}
              >
                ⛔ غیرفعال کردن
              </button>
            ) : (
              <button
                type="button"
                onClick={handleActivate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', cursor: 'pointer', border: 'none' }}
              >
                ✅ فعال کردن مجدد
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', cursor: 'pointer', border: 'none' }}
            >
              🖨️ چاپ
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* هشدار غیرفعال */}
          {!student.isActive && (
            <div
              className="p-4 rounded-2xl flex items-center gap-3"
              style={{ background: '#fee2e2', border: '2px solid #dc2626' }}
            >
              <div style={{ fontSize: 32 }}>⚠️</div>
              <div className="flex-1">
                <p className="font-bold" style={{ color: '#991b1b' }}>این دانشجو غیرفعال است</p>
                <p className="text-xs" style={{ color: '#991b1b' }}>
                  تاریخ ترک: {student.leftDate || '—'} — دلیل: {student.leftReason || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleActivate}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-white text-sm font-bold"
                style={{ background: '#10b981', cursor: 'pointer', border: 'none' }}
              >
                ✅ فعال کن
              </button>
            </div>
          )}

          {/* کارت بالا */}
          <div
            className="bg-white rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6"
            style={{ border: '1px solid #e2e8f0', opacity: student.isActive ? 1 : 0.7 }}
          >
            <div
              className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{
                width: 110, height: 110, fontSize: 40,
                background: student.isActive
                  ? 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)'
                  : 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)',
                overflow: 'hidden',
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

            <div className="flex-1 min-w-0 text-center md:text-right">
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
                {student.firstName} {student.lastName || ''}
                {!student.isActive && (
                  <span
                    className="text-sm px-2 py-1 rounded-full mr-2"
                    style={{ background: '#fee2e2', color: '#dc2626' }}
                  >
                    غیرفعال
                  </span>
                )}
              </h1>
              <p className="text-sm mb-3" style={{ color: '#64748b' }}>
                {student.fatherName ? 'ولد ' + student.fatherName : ''}
              </p>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                  style={{ background: '#f0f9ff', color: '#0369a1' }}
                >
                  🆔 {student.studentNumber}
                </span>
                {student.classRoom && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#f5f3ff', color: '#6d28d9' }}
                  >
                    🏫 {student.classRoom.name}
                  </span>
                )}
                {student.gender && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#fce7f3', color: '#be185d' }}
                  >
                    {student.gender === 'MALE' ? '👦 پسر' : '👧 دختر'}
                  </span>
                )}
                {student.classRoom?.teacher && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#d1fae5', color: '#047857' }}
                  >
                    👨‍🏫 {student.classRoom.teacher.firstName} {student.classRoom.teacher.lastName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* کارت‌های آماری */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MiniStat icon="📚" title="مضامین" value={student.enrollments.length.toString()} color="#8b5cf6" bg="#f5f3ff" />
            <MiniStat icon="📊" title="معدل" value={avgScore.toFixed(1)} color="#0ea5e9" bg="#f0f9ff" />
            <MiniStat icon="✅" title="نرخ حاضری" value={attendanceRate + '%'} color="#10b981" bg="#d1fae5" />
            <MiniStat
              icon="💰"
              title="باقی‌مانده فیس"
              value={fmt(remaining) + ' AFN'}
              color={remaining > 0 ? '#dc2626' : '#10b981'}
              bg={remaining > 0 ? '#fee2e2' : '#d1fae5'}
            />
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
                    background: tab === t.key ? '#eff6ff' : 'transparent',
                    color: tab === t.key ? '#1d4ed8' : '#475569',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.count !== undefined && t.count > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: tab === t.key ? '#1d4ed8' : '#e2e8f0',
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
              {tab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="شماره دانشجویی" value={student.studentNumber} mono />
                  <InfoRow label="شماره مسلسل" value={student.serialNumber?.toString() || '—'} mono />
                  <InfoRow label="تاریخ تولد" value={student.birthDate || '—'} />
                  <InfoRow label="تاریخ شمولیت" value={student.enrollmentDate || '—'} />
                  <InfoRow label="جنسیت" value={student.gender === 'MALE' ? 'پسر' : student.gender === 'FEMALE' ? 'دختر' : '—'} />
                  <InfoRow label="شماره تذکره" value={student.tazkiraNumber || '—'} mono />
                  <InfoRow label="شماره تماس" value={student.phone || '—'} mono />
                  <InfoRow label="والد/سرپرست" value={student.parentName || '—'} />
                  <InfoRow label="شماره والد" value={student.parentPhone || '—'} mono />
                  <InfoRow label="نسبت" value={student.parentRelation || '—'} />
                  <InfoRow label="تایم از" value={student.timeFrom || '—'} mono />
                  <InfoRow label="تایم تا" value={student.timeTo || '—'} mono />
                  <InfoRow label="نوع فیس" value={student.feeType || '—'} />
                  <InfoRow label="فیس ماهانه" value={fmt(student.feeMonthly) + ' AFN'} />
                  <InfoRow label="فیس کل" value={fmt(student.totalFee) + ' AFN'} />
                  <InfoRow label="اتاق" value={student.classRoom?.room || '—'} />
                  <div className="md:col-span-2">
                    <InfoRow label="نشانی" value={student.address || '—'} />
                  </div>
                  {student.tazkiraPhoto && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-bold mb-2" style={{ color: '#64748b' }}>عکس تذکره</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={student.tazkiraPhoto}
                        alt="tazkira"
                        style={{ maxWidth: 400, borderRadius: 12, border: '1px solid #e2e8f0' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {tab === 'subjects' && (
                <div>
                  {student.enrollments.length === 0 ? (
                    <EmptyState icon="📚" text="در هیچ مضمونی ثبت‌نام نشده" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {student.enrollments.map((e) => (
                        <div
                          key={e.id}
                          className="p-4 rounded-xl flex items-center gap-3"
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                        >
                          <div
                            className="rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{
                              width: 42, height: 42,
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                              fontSize: 14,
                            }}
                          >
                            {e.subject.code.slice(0, 3)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                              {e.subject.name}
                            </p>
                            <p className="text-xs" style={{ color: '#94a3b8' }}>
                              {e.subject.code}
                              {e.subject.teacher
                                ? ` — ${e.subject.teacher.firstName} ${e.subject.teacher.lastName}`
                                : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'fees' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryBox label="مجموع فیس" value={fmt(totalFee) + ' AFN'} color="#0ea5e9" />
                    <SummaryBox label="پرداخت‌شده" value={fmt(totalPaid) + ' AFN'} color="#10b981" />
                    <SummaryBox label="باقی‌مانده" value={fmt(remaining) + ' AFN'} color={remaining > 0 ? '#dc2626' : '#10b981'} />
                  </div>

                  {student.fees.length === 0 ? (
                    <EmptyState icon="💰" text="فیسی ثبت نشده" />
                  ) : (
                    <div className="space-y-4">
                      {student.fees.map((fee) => (
                        <div
                          key={fee.id}
                          className="p-4 rounded-xl"
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                        >
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div>
                              <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                                📅 فیس ماه {fee.month || '—'} — {fee.year || ''}
                              </p>
                              <p className="text-xs" style={{ color: '#94a3b8' }}>
                                {fee.dueDate ? 'سررسید: ' + fee.dueDate : ''}
                              </p>
                            </div>
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold"
                              style={{
                                background: fee.status === 'PAID' ? '#d1fae5' : fee.status === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                                color: fee.status === 'PAID' ? '#047857' : fee.status === 'PARTIAL' ? '#b45309' : '#dc2626',
                              }}
                            >
                              {fee.status === 'PAID' ? 'پرداخت‌شده' : fee.status === 'PARTIAL' ? 'نیمه‌پرداخت' : 'پرداخت‌نشده'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                            <div>
                              <p style={{ color: '#64748b' }}>کل</p>
                              <p className="font-bold" style={{ color: '#0f172a' }}>{fmt(fee.total)} AFN</p>
                            </div>
                            <div>
                              <p style={{ color: '#64748b' }}>پرداخت</p>
                              <p className="font-bold" style={{ color: '#10b981' }}>{fmt(fee.paid)} AFN</p>
                            </div>
                            <div>
                              <p style={{ color: '#64748b' }}>باقی</p>
                              <p className="font-bold" style={{ color: '#dc2626' }}>{fmt(fee.total - fee.paid)} AFN</p>
                            </div>
                          </div>

                          {fee.payments.length > 0 && (
                            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                              <p className="text-xs font-bold mb-2" style={{ color: '#64748b' }}>
                                پرداخت‌ها ({fee.payments.length})
                              </p>
                              <div className="space-y-1">
                                {fee.payments.map((p) => (
                                  <div key={p.id} className="flex justify-between items-center text-xs">
                                    <div>
                                      <span style={{ color: '#475569' }}>
                                        {p.method || 'نقدی'} — {p.date || ''}
                                      </span>
                                      {p.receiptNumber && (
                                        <span
                                          className="mr-2 px-2 py-0.5 rounded text-xs font-mono"
                                          style={{ background: '#f0f9ff', color: '#0369a1' }}
                                        >
                                          {p.receiptNumber}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold" style={{ color: '#10b981' }}>
                                        {fmt(p.amount)} AFN
                                      </span>
                                      <a
                                        href={'/fees/receipt/' + p.id}
                                        target="_blank"
                                        className="text-xs font-bold no-underline"
                                        style={{ color: '#047857' }}
                                      >
                                        🖨️
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'grades' && (
                <div>
                  {student.grades.length === 0 ? (
                    <EmptyState icon="📝" text="نمره‌ای ثبت نشده" />
                  ) : (
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                      <table className="w-full text-sm">
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مضمون</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>سمستر</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>میان‌ترم</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>فاینل</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>عملی</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مجموع</th>
                          </tr>
                        </thead>
                        <tbody>
                          {student.grades.map((g) => (
                            <tr key={g.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td className="p-3">
                                <p className="font-bold text-xs" style={{ color: '#0f172a' }}>{g.subject.name}</p>
                                <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>{g.subject.code}</p>
                              </td>
                              <td className="p-3 text-xs" style={{ color: '#64748b' }}>{g.semester || '—'}</td>
                              <td className="p-3 text-xs" style={{ color: '#475569' }}>{g.midtermScore}</td>
                              <td className="p-3 text-xs" style={{ color: '#475569' }}>{g.finalScore}</td>
                              <td className="p-3 text-xs" style={{ color: '#475569' }}>{g.practicalScore}</td>
                              <td className="p-3">
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-bold"
                                  style={{
                                    background: g.totalScore >= 50 ? '#d1fae5' : '#fee2e2',
                                    color: g.totalScore >= 50 ? '#047857' : '#dc2626',
                                  }}
                                >
                                  {g.totalScore}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'attendance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SummaryBox label="حاضر" value={presentCount.toString()} color="#10b981" small />
                    <SummaryBox label="غایب" value={absentCount.toString()} color="#dc2626" small />
                    <SummaryBox label="تأخیر" value={lateCount.toString()} color="#f59e0b" small />
                    <SummaryBox label="نرخ کلی" value={attendanceRate + '%'} color="#0ea5e9" small />
                  </div>

                  {student.attendances.length === 0 ? (
                    <EmptyState icon="📅" text="حاضری ثبت نشده" />
                  ) : (
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                      <table className="w-full text-sm">
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>تاریخ</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>وضعیت</th>
                            <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>یادداشت</th>
                          </tr>
                        </thead>
                        <tbody>
                          {student.attendances.map((a) => {
                            const st = STATUS_LABELS[a.status] || STATUS_LABELS.PRESENT;
                            return (
                              <tr key={a.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td className="p-3 text-xs font-mono" style={{ color: '#0f172a' }}>{a.date}</td>
                                <td className="p-3">
                                  <span
                                    className="px-3 py-1 rounded-full text-xs font-bold"
                                    style={{ background: st.bg, color: st.color }}
                                  >
                                    {st.fa}
                                  </span>
                                </td>
                                <td className="p-3 text-xs" style={{ color: '#64748b' }}>{a.note || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'history' && (
                <div>
                  {(!student.transfers || student.transfers.length === 0) ? (
                    <EmptyState icon="🔄" text="هیچ انتقالی ثبت نشده" />
                  ) : (
                    <div className="space-y-3">
                      {student.transfers.map((t) => (
                        <div
                          key={t.id}
                          className="p-4 rounded-xl flex items-start gap-4"
                          style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
                        >
                          <div
                            className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{ width: 44, height: 44, background: '#8b5cf6', fontSize: 18 }}
                          >
                            🔄
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{ background: '#e9d5ff', color: '#6d28d9' }}
                              >
                                {t.fromClassName || 'بدون صنف'}
                              </span>
                              <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>→</span>
                              <span
                                className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{ background: '#d1fae5', color: '#047857' }}
                              >
                                {t.toClassName}
                              </span>
                            </div>
                            <p className="text-xs mb-1" style={{ color: '#6d28d9' }}>
                              📅 تاریخ انتقال: {t.transferDate}
                            </p>
                            {t.reason && (
                              <p className="text-xs mb-1" style={{ color: '#6d28d9' }}>
                                💬 دلیل: {t.reason}
                              </p>
                            )}
                            {t.notes && (
                              <p className="text-xs" style={{ color: '#8b5cf6' }}>
                                📝 {t.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* مودال انتقال */}
      {showTransferModal && student && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{
                borderBottom: '3px solid #8b5cf6',
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#8b5cf6', fontSize: 22 }}
                >
                  🔄
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                    انتقال صنف
                  </h3>
                  <p className="text-xs" style={{ color: '#6d28d9' }}>
                    {student.firstName} {student.lastName || ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                disabled={saving}
                className="p-2 rounded-lg text-xl"
                style={{ color: '#94a3b8', cursor: 'pointer', border: 'none', background: 'transparent' }}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div
                className="p-4 rounded-xl flex items-center gap-3"
                style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
              >
                <span style={{ fontSize: 20 }}>🏫</span>
                <div>
                  <p className="text-xs" style={{ color: '#0369a1' }}>صنف فعلی:</p>
                  <p className="font-bold text-sm" style={{ color: '#0369a1' }}>
                    {student.classRoom?.name || 'بدون صنف'}
                  </p>
                </div>
              </div>

              <div className="text-center" style={{ fontSize: 28 }}>⬇️</div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  🏫 صنف جدید *
                </label>
                <select
                  value={transferForm.toClassRoomId}
                  onChange={(e) => setTransferForm({ ...transferForm, toClassRoomId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white font-bold"
                  style={{ borderColor: '#8b5cf6' }}
                >
                  <option value="">-- انتخاب صنف جدید --</option>
                  {otherClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.room ? '(' + c.room + ')' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  📅 تاریخ انتقال
                </label>
                <input
                  type="text"
                  value={transferForm.transferDate}
                  onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none font-mono"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  💬 دلیل انتقال
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: ارتقا به صنف بالاتر"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  📝 یادداشت
                </label>
                <textarea
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div
                className="p-3 rounded-xl text-xs"
                style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}
              >
                💡 تمام سابقه (نمرات، حاضری، فیس) حفظ می‌شود
              </div>
            </div>

            <div
              className="flex justify-end gap-3 p-5"
              style={{
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                  border: 'none',
                }}
              >
                {saving ? '⏳ انتقال...' : '🔄 انتقال کن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال غیرفعال */}
      {showDeactivateModal && student && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{
                borderBottom: '3px solid #dc2626',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#dc2626', fontSize: 22 }}
                >
                  ⛔
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                    غیرفعال کردن دانشجو
                  </h3>
                  <p className="text-xs" style={{ color: '#991b1b' }}>
                    {student.firstName} {student.lastName || ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                disabled={saving}
                className="p-2 rounded-lg text-xl"
                style={{ color: '#94a3b8', cursor: 'pointer', border: 'none', background: 'transparent' }}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div
                className="p-4 rounded-xl text-sm"
                style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}
              >
                <p style={{ fontWeight: 'bold', marginBottom: 6 }}>💡 توجه:</p>
                <ul style={{ paddingRight: 20, lineHeight: 1.9, fontSize: 12 }}>
                  <li>داده‌های دانشجو <strong>پاک نمی‌شوند</strong></li>
                  <li>در لیست‌های اصلی نمایش داده نمی‌شود</li>
                  <li>سابقه فیس، نمرات و حاضری حفظ می‌شود</li>
                  <li>می‌توانی هر وقت دوباره فعالش کنی</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  📅 تاریخ ترک
                </label>
                <input
                  type="text"
                  value={deactivateForm.leftDate}
                  onChange={(e) => setDeactivateForm({ ...deactivateForm, leftDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none font-mono"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                  💬 دلیل ترک *
                </label>
                <textarea
                  value={deactivateForm.leftReason}
                  onChange={(e) => setDeactivateForm({ ...deactivateForm, leftReason: e.target.value })}
                  rows={3}
                  placeholder="مثلاً: ترک تحصیل، مهاجرت، مشکلات مالی، اتمام کورس..."
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                  style={{ borderColor: '#dc2626' }}
                  autoFocus
                />
              </div>
            </div>

            <div
              className="flex justify-end gap-3 p-5"
              style={{
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={saving}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                  border: 'none',
                }}
              >
                {saving ? '⏳ غیرفعال...' : '⛔ غیرفعال کن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, title, value, color, bg }: { icon: string; title: string; value: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
      <div className="rounded-xl flex items-center justify-center mb-2" style={{ width: 38, height: 38, background: bg, fontSize: 18 }}>
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
      <span className={'text-sm font-bold ' + (mono ? 'font-mono' : '')} style={{ color: '#0f172a' }}>
        {value}
      </span>
    </div>
  );
}

function SummaryBox({ label, value, color, small }: { label: string; value: string; color: string; small?: boolean }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: color + '15' }}>
      <p className="text-xs mb-1" style={{ color }}>{label}</p>
      <p className={'font-bold ' + (small ? 'text-lg' : 'text-xl')} style={{ color }}>{value}</p>
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