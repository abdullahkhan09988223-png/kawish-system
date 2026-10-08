'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type ClassRoom = {
  id: string;
  name: string;
  room: string | null;
  teacher: { firstName: string; lastName: string } | null;
};

type Student = {
  id: string;
  studentNumber: string;
};

const EMPTY_FORM = {
  studentNumber: '',
  firstName: '',
  lastName: '',
  fatherName: '',
  classRoomId: '',
  timeFrom: '08:00',
  timeTo: '10:00',
  phone: '',
  parentPhone: '',
  parentName: '',
  parentRelation: 'پدر',
  address: '',
  enrollmentDate: '',
  serialNumber: '',
  birthDate: '',
  gender: 'MALE',
  tazkiraNumber: '',
  tazkiraPhoto: null as string | null,
  totalFee: '',
  feeType: 'داخله',
  feeMonthly: '',
  photo: null as string | null,
};

export default function NewStudentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [autoNumber, setAutoNumber] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const generateNextNumber = (students: Student[]): string => {
    let maxNum = 1000;
    students.forEach((s) => {
      const match = s.studentNumber.match(/S-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return 'S-' + (maxNum + 1);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/classrooms', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' }),
      ]);
      if (cRes.ok) setClasses((await cRes.json()).data || []);
      if (sRes.ok) {
        const students: Student[] = (await sRes.json()).data || [];
        const next = generateNextNumber(students);
        setAutoNumber(next);
        setForm((prev: any) => ({
          ...prev,
          studentNumber: next,
          enrollmentDate: new Date().toLocaleDateString('fa-IR'),
        }));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const handlePhoto = (field: 'photo' | 'tazkiraPhoto') => (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev: any) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.firstName) {
      alert('نام الزامی است');
      return;
    }
    if (!form.studentNumber) {
      alert('شماره دانشجویی تعیین نشده');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');
      alert('دانشجو با موفقیت ثبت شد — شماره: ' + form.studentNumber);
      window.location.href = '/students';
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="students" />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <a
            href="/students"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: '#f1f5f9',
              color: '#475569',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            ← بازگشت
          </a>
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>
            خوش آمدید، {user.name}
          </h2>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
              افزودن دانشجو
            </h1>
            <p style={{ color: '#64748b' }}>ثبت دانشجوی جدید در سیستم</p>
          </div>

          <div className="bg-white rounded-2xl p-6 space-y-6" style={{ border: '1px solid #e2e8f0' }}>
            {/* عکس */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
                style={{
                  width: 110, height: 110, fontSize: 36,
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                }}
              >
                {form.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.photo}
                    alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (form.firstName?.[0] || '?')}
              </div>
              <label
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: '#f0f9ff', color: '#0369a1', cursor: 'pointer' }}
              >
                انتخاب عکس
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto('photo')}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <Section title="معلومات اصلی" icon="👤">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="اسم *">
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
                <Field label="تخلص">
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
                <Field label="ولد">
                  <input
                    type="text"
                    value={form.fatherName}
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="شماره دانشجویی (خودکار)">
                  <div className="relative">
                    <input
                      type="text"
                      value={form.studentNumber}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                      style={{
                        borderColor: '#a7f3d0',
                        background: '#ecfdf5',
                        color: '#047857',
                        cursor: 'not-allowed',
                        fontWeight: 'bold',
                      }}
                    />
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: '#047857' }}
                    >
                      🔒
                    </span>
                  </div>
                </Field>
                <Field label="شماره مسلسل">
                  <input
                    type="text"
                    value={form.serialNumber}
                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
                <Field label="جنسیت">
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <option value="MALE">پسر</option>
                    <option value="FEMALE">دختر</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="تاریخ تولد">
                  <input
                    type="text"
                    placeholder="1389/05/20"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
                <Field label="شماره تذکره">
                  <input
                    type="text"
                    value={form.tazkiraNumber}
                    onChange={(e) => setForm({ ...form, tazkiraNumber: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
                <Field label="تاریخ شمولیت">
                  <input
                    type="text"
                    value={form.enrollmentDate}
                    onChange={(e) => setForm({ ...form, enrollmentDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
              </div>
            </Section>

            <Section title="صنف و تایم" icon="🏫">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="صنف">
                  <select
                    value={form.classRoomId}
                    onChange={(e) => setForm({ ...form, classRoomId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <option value="">-- انتخاب --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="تایم از">
                  <input
                    type="text"
                    value={form.timeFrom}
                    onChange={(e) => setForm({ ...form, timeFrom: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
                <Field label="تایم تا">
                  <input
                    type="text"
                    value={form.timeTo}
                    onChange={(e) => setForm({ ...form, timeTo: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
              </div>
            </Section>

            <Section title="معلومات تماس" icon="📞">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="شماره تماس دانشجو">
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
                <Field label="شماره والد">
                  <input
                    type="text"
                    value={form.parentPhone}
                    onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="اسم والد">
                  <input
                    type="text"
                    value={form.parentName}
                    onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
                <Field label="نسبت">
                  <select
                    value={form.parentRelation}
                    onChange={(e) => setForm({ ...form, parentRelation: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <option value="پدر">پدر</option>
                    <option value="مادر">مادر</option>
                    <option value="برادر">برادر</option>
                    <option value="خواهر">خواهر</option>
                    <option value="سرپرست">سرپرست</option>
                  </select>
                </Field>
              </div>

              <Field label="نشانی">
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </Field>
            </Section>

            <Section title="معلومات فیس" icon="💰">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="فیس کل (AFN)">
                  <input
                    type="text"
                    placeholder="12000"
                    value={form.totalFee}
                    onChange={(e) => setForm({ ...form, totalFee: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
                <Field label="نوع فیس">
                  <select
                    value={form.feeType}
                    onChange={(e) => setForm({ ...form, feeType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <option value="داخله">داخله</option>
                    <option value="خارجه">خارجه</option>
                    <option value="نیمه‌وقت">نیمه‌وقت</option>
                  </select>
                </Field>
                <Field label="فیس ماهانه (AFN)">
                  <input
                    type="text"
                    placeholder="1000"
                    value={form.feeMonthly}
                    onChange={(e) => setForm({ ...form, feeMonthly: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {autoNumber && (
            <div
              className="p-4 rounded-xl text-sm flex items-center gap-3"
              style={{ background: '#d1fae5', color: '#047857' }}
            >
              <span style={{ fontSize: 20 }}>ℹ️</span>
              <span>
                شماره دانشجویی جدید: <strong className="font-mono">{autoNumber}</strong>
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pb-6">
            <a
              href="/students"
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{
                background: '#f1f5f9',
                color: '#475569',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              لغو
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{
                background: saving
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                cursor: saving ? 'wait' : 'pointer',
                border: 'none',
              }}
            >
              {saving ? 'در حال ذخیره...' : '💾 ذخیره دانشجو'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({
  title, icon, children,
}: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h3 className="font-bold" style={{ color: '#0f172a' }}>{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
        {label}
      </label>
      {children}
    </div>
  );
}