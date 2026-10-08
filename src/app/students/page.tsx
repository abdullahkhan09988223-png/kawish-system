'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';
import { compressImage } from '@/lib/image-compress';

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  fatherName: string | null;
  phone: string | null;
  photo: string | null;
  classRoomId: string | null;
  classRoom: { id: string; name: string } | null;
  totalFee: number;
  feeMonthly: number;
  isActive: boolean;
};

type ClassRoom = {
  id: string;
  name: string;
};

const EMPTY_FORM = {
  studentNumber: '',
  firstName: '',
  lastName: '',
  fatherName: '',
  classRoomId: '',
  timeFrom: '',
  timeTo: '',
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

export default function StudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [autoNumber, setAutoNumber] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const generateNextNumber = (list: Student[]): string => {
    let maxNum = 1000;
    list.forEach((s) => {
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
      const [sRes, cRes] = await Promise.all([
        fetch('/api/students', { cache: 'no-store' }),
        fetch('/api/classrooms', { cache: 'no-store' }),
      ]);
      let list: Student[] = [];
      if (sRes.ok) {
        list = (await sRes.json()).data || [];
        setStudents(list);
      }
      if (cRes.ok) setClasses((await cRes.json()).data || []);
      return list;
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const openAdd = async () => {
    const list = await loadAll();
    const next = generateNextNumber(list);
    setAutoNumber(next);
    setForm({
      ...EMPTY_FORM,
      studentNumber: next,
      enrollmentDate: new Date().toLocaleDateString('fa-IR'),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handlePhoto = (field: 'photo' | 'tazkiraPhoto') => async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let compressed: string;
      if (field === 'photo') {
        compressed = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.7,
        });
      } else {
        compressed = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.7,
        });
      }
      setForm((prev: any) => ({ ...prev, [field]: compressed }));
    } catch (err) {
      alert('خطا در پردازش عکس');
    }
  };

  const handleSave = async () => {
    if (!form.firstName || !form.firstName.trim()) {
      alert('نام الزامی است');
      return;
    }
    if (!form.studentNumber) { alert('شماره دانشجویی تعیین نشده'); return; }
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

      await logAction({
        action: 'CREATE',
        tableName: 'students',
        recordName: form.firstName + ' ' + (form.lastName || ''),
        details: 'ثبت دانشجوی جدید با شماره ' + form.studentNumber,
      });

      closeModal();
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm('حذف دانشجو «' + name + '»؟\n\nاگر فقط می‌خواهی غیرفعال شود، از پروفایل استفاده کن.')) return;
    try {
      await fetch('/api/students/' + id, { method: 'DELETE' });
      await logAction({
        action: 'DELETE',
        tableName: 'students',
        recordId: id,
        recordName: name,
        details: 'حذف دانشجو',
      });
      await loadAll();
    } catch { alert('خطا'); }
  };

  const filtered = students.filter((s) => {
    if (filterStatus === 'active' && !s.isActive) return false;
    if (filterStatus === 'inactive' && s.isActive) return false;
    if (filterClass && s.classRoomId !== filterClass) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      (s.lastName || '').toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q) ||
      (s.fatherName || '').toLowerCase().includes(q)
    );
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (!user) return null;

  const activeCount = students.filter((s) => s.isActive).length;
  const inactiveCount = students.filter((s) => !s.isActive).length;

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
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>
            خوش آمدید، {user.name}
          </h2>
          <div
            className="rounded-full flex items-center justify-center text-white font-bold"
            style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
              fontSize: 14,
            }}
          >
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
                مدیریت دانشجویان
              </h1>
              <p style={{ color: '#64748b' }}>لیست دانشجویان ثبت‌شده</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => router.push('/students/cards')}
                className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
                style={{
                  background: '#f1f5f9',
                  color: '#0369a1',
                  cursor: 'pointer',
                  border: '2px solid #0ea5e9',
                }}
              >
                <span>🪪</span>
                <span>چاپ کارت دانشجویی</span>
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span>+</span><span>افزودن دانشجو</span>
              </button>
            </div>
          </div>

          {/* آمار */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#f0f9ff', fontSize: 22 }}
                >
                  👥
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#64748b' }}>کل دانشجویان</p>
                  <p className="text-2xl font-bold" style={{ color: '#0ea5e9' }}>{students.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#d1fae5', fontSize: 22 }}
                >
                  ✅
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#64748b' }}>فعال</p>
                  <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{activeCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 44, height: 44, background: '#fee2e2', fontSize: 22 }}
                >
                  ⛔
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#64748b' }}>غیرفعال</p>
                  <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>{inactiveCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* فیلترها */}
          <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3" style={{ border: '1px solid #e2e8f0' }}>
            <input
              type="text"
              placeholder="🔍 جستجو..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#e2e8f0' }}
            />

            <div className="flex gap-1 rounded-xl p-1" style={{ background: '#f1f5f9' }}>
              <button
                type="button"
                onClick={() => setFilterStatus('active')}
                className="px-4 py-2 rounded-lg text-sm font-bold"
                style={{
                  background: filterStatus === 'active' ? '#10b981' : 'transparent',
                  color: filterStatus === 'active' ? 'white' : '#475569',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                ✅ فعال ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('inactive')}
                className="px-4 py-2 rounded-lg text-sm font-bold"
                style={{
                  background: filterStatus === 'inactive' ? '#dc2626' : 'transparent',
                  color: filterStatus === 'inactive' ? 'white' : '#475569',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                ⛔ غیرفعال ({inactiveCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className="px-4 py-2 rounded-lg text-sm font-bold"
                style={{
                  background: filterStatus === 'all' ? '#0ea5e9' : 'transparent',
                  color: filterStatus === 'all' ? 'white' : '#475569',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                📋 همه ({students.length})
              </button>
            </div>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2.5 rounded-xl border text-sm outline-none bg-white min-w-[180px]"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">همه صنف‌ها</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* جدول */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>عکس</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>نام</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>ولد</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>شماره</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>صنف</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>تماس</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>وضعیت</th>
                    <th className="text-left p-4 text-xs" style={{ color: '#64748b' }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center" style={{ color: '#94a3b8' }}>
                        در حال بارگذاری...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center" style={{ color: '#94a3b8' }}>
                        دانشجویی یافت نشد
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr
                        key={s.id}
                        style={{
                          borderTop: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          opacity: s.isActive ? 1 : 0.7,
                          background: s.isActive ? 'white' : '#fef2f2',
                        }}
                        onClick={() => router.push('/students/' + s.id)}
                      >
                        <td className="p-4">
                          {s.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.photo}
                              alt={s.firstName}
                              width={40}
                              height={40}
                              style={{ borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{
                                width: 40, height: 40,
                                background: s.isActive
                                  ? 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)'
                                  : 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)',
                              }}
                            >
                              {s.firstName[0]}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-sm" style={{ color: '#0f172a' }}>
                            {s.firstName} {s.lastName || ''}
                          </span>
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#64748b' }}>
                          {s.fatherName || '—'}
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: '#0369a1' }}>
                          {s.studentNumber}
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#475569' }}>
                          {s.classRoom ? (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#f5f3ff', color: '#6d28d9' }}
                            >
                              {s.classRoom.name}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: '#475569' }}>
                          {s.phone || '—'}
                        </td>
                        <td className="p-4">
                          {s.isActive ? (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#d1fae5', color: '#047857' }}
                            >
                              ✅ فعال
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#fee2e2', color: '#dc2626' }}
                            >
                              ⛔ غیرفعال
                            </span>
                          )}
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => router.push('/students/' + s.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{
                                background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                            >
                              👁️ پروفایل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id, s.firstName + ' ' + (s.lastName || ''))}
                              className="p-2 rounded-lg"
                              style={{ color: '#dc2626', cursor: 'pointer', border: 'none', background: 'transparent' }}
                              title="حذف"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* مودال افزودن */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-6"
            style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            <div
              className="flex items-center justify-between p-5 sticky top-0 z-10"
              style={{
                borderBottom: '2px solid #0ea5e9',
                background: '#f8fafc',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div>
                <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                  افزودن دانشجو
                </h3>
                {autoNumber && (
                  <p className="text-xs mt-1" style={{ color: '#047857' }}>
                    شماره خودکار: <strong className="font-mono">{autoNumber}</strong>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 rounded-lg text-xl"
                style={{ color: '#94a3b8', cursor: 'pointer', border: 'none', background: 'transparent' }}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto" style={{ flex: 1 }}>
              <div className="flex flex-col items-center gap-3">
                <div
                  className="rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
                  style={{
                    width: 100, height: 100, fontSize: 32,
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
                      placeholder="08:00"
                      value={form.timeFrom}
                      onChange={(e) => setForm({ ...form, timeFrom: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                  </Field>
                  <Field label="تایم تا">
                    <input
                      type="text"
                      placeholder="10:00"
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

              <Section title="عکس تذکره" icon="📷">
                <div className="flex flex-col items-start gap-3">
                  {form.tazkiraPhoto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.tazkiraPhoto}
                      alt="tazkira"
                      style={{ maxWidth: 400, borderRadius: 12, border: '1px solid #e2e8f0' }}
                    />
                  )}
                  <label
                    className="px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: '#f0f9ff', color: '#0369a1', cursor: 'pointer' }}
                  >
                    {form.tazkiraPhoto ? 'تغییر عکس تذکره' : 'انتخاب عکس تذکره'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto('tazkiraPhoto')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </Section>
            </div>

            <div
              className="flex justify-end gap-3 p-5 sticky bottom-0"
              style={{
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                  border: 'none',
                }}
              >
                {saving ? 'در حال ذخیره...' : '💾 ذخیره دانشجو'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
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