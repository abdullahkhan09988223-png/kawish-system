'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';
import { compressImage } from '@/lib/image-compress';

type Teacher = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  specialization: string | null;
  phone: string | null;
  address: string | null;
  hireDate: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  salary: number;
  salaryPercent: number;
  photo: string | null;
  _count?: {
    classRooms: number;
    subjects: number;
    schedules: number;
  };
};

export default function TeachersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    fatherName: '',
    specialization: '',
    phone: '',
    address: '',
    hireDate: '',
    contractStart: '',
    contractEnd: '',
    salary: '',
    salaryPercent: '',
    tazkiraNumber: '',
    photo: null,
    tazkiraPhoto: null,
  });

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    setUser(u);
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teachers', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setTeachers(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const filtered = teachers.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.firstName.toLowerCase().includes(q) ||
      t.lastName.toLowerCase().includes(q) ||
      t.employeeNumber.toLowerCase().includes(q) ||
      (t.specialization || '').toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({
      employeeNumber: '',
      firstName: '',
      lastName: '',
      fatherName: '',
      specialization: '',
      phone: '',
      address: '',
      hireDate: '',
      contractStart: '',
      contractEnd: '',
      salary: '',
      salaryPercent: '',
      tazkiraNumber: '',
      photo: null,
      tazkiraPhoto: null,
    });
    setShowModal(true);
  };

  const openEdit = (t: Teacher) => {
    setEditingId(t.id);
    setForm({
      employeeNumber: t.employeeNumber,
      firstName: t.firstName,
      lastName: t.lastName,
      fatherName: t.fatherName || '',
      specialization: t.specialization || '',
      phone: t.phone || '',
      address: t.address || '',
      hireDate: t.hireDate || '',
      contractStart: t.contractStart || '',
      contractEnd: t.contractEnd || '',
      salary: String(t.salary || ''),
      salaryPercent: String(t.salaryPercent || ''),
      tazkiraNumber: '',
      photo: t.photo || null,
      tazkiraPhoto: null,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
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
    if (!form.firstName || !form.lastName || !form.employeeNumber) {
      alert('نام، تخلص و شماره کارمندی الزامی است');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? '/api/teachers/' + editingId : '/api/teachers';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا');

      await logAction({
        action: editingId ? 'UPDATE' : 'CREATE',
        tableName: 'teachers',
        recordName: form.firstName + ' ' + form.lastName,
        details: (editingId ? 'ویرایش' : 'افزودن') + ' استاد',
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
    if (!confirm('حذف استاد «' + name + '»؟')) return;
    try {
      await fetch('/api/teachers/' + id, { method: 'DELETE' });
      await logAction({
        action: 'DELETE',
        tableName: 'teachers',
        recordId: id,
        recordName: name,
        details: 'حذف استاد',
      });
      await loadAll();
    } catch {
      alert('خطا');
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="teachers" />

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
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
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
                مدیریت استادان
              </h1>
              <p style={{ color: '#64748b' }}>لیست استادان ثبت‌شده</p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span>+</span>
              <span>افزودن استاد</span>
            </button>
          </div>

          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="جستجو (نام، شماره، تخصص...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: '#e2e8f0' }}
            />
          </div>

          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>عکس</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>نام</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>شماره</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>تخصص</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>قرارداد</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>صنف/مضمون</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>ثابت/فیصدی</th>
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
                        استادی یافت نشد
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr
                        key={t.id}
                        style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer' }}
                        onClick={() => router.push('/teachers/' + t.id)}
                      >
                        <td className="p-4">
                          {t.photo ? (
                            <img
                              src={t.photo}
                              alt={t.firstName}
                              width={40}
                              height={40}
                              style={{ borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{
                                width: 40,
                                height: 40,
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                              }}
                            >
                              {t.firstName[0]}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-sm" style={{ color: '#0f172a' }}>
                            {t.firstName} {t.lastName}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: '#6d28d9' }}>
                          {t.employeeNumber}
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#475569' }}>
                          {t.specialization || '—'}
                        </td>
                        <td className="p-4 text-xs">
                          {t.contractStart || t.contractEnd ? (
                            <div>
                              {t.contractStart && (
                                <p style={{ color: '#10b981', fontFamily: 'monospace', fontSize: 11 }}>
                                  📅 از: {t.contractStart}
                                </p>
                              )}
                              {t.contractEnd && (
                                <p style={{ color: '#dc2626', fontFamily: 'monospace', fontSize: 11 }}>
                                  🔚 تا: {t.contractEnd}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#f5f3ff', color: '#6d28d9' }}
                            >
                              🏫 {t._count?.classRooms || 0}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#d1fae5', color: '#047857' }}
                            >
                              📚 {t._count?.subjects || 0}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs">
                          <div className="flex flex-col gap-1">
                            {t.salary > 0 && (
                              <span className="font-mono" style={{ color: '#0369a1' }}>
                                {fmt(t.salary)}
                              </span>
                            )}
                            {t.salaryPercent > 0 && (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-bold w-fit"
                                style={{ background: '#fef3c7', color: '#b45309' }}
                              >
                                {t.salaryPercent}%
                              </span>
                            )}
                            {t.salary === 0 && t.salaryPercent === 0 && (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => router.push('/teachers/' + t.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                            >
                              👁️ پروفایل
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(t)}
                              className="p-2 rounded-lg"
                              style={{
                                color: '#2563eb',
                                cursor: 'pointer',
                                border: 'none',
                                background: 'transparent',
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(t.id, t.firstName + ' ' + t.lastName)}
                              className="p-2 rounded-lg"
                              style={{
                                color: '#dc2626',
                                cursor: 'pointer',
                                border: 'none',
                                background: 'transparent',
                              }}
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

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            overflowY: 'auto',
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{ borderBottom: '2px solid #8b5cf6', background: '#f8fafc' }}
            >
              <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                {editingId ? 'ویرایش استاد' : 'افزودن استاد'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 rounded-lg text-xl"
                style={{
                  color: '#94a3b8',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                }}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
                  style={{
                    width: 100,
                    height: 100,
                    fontSize: 32,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  }}
                >
                  {form.photo ? (
                    <img
                      src={form.photo}
                      alt="preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    form.firstName?.[0] || '?'
                  )}
                </div>
                <label
                  className="px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer' }}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    شماره کارمندی *
                  </label>
                  <input
                    type="text"
                    value={form.employeeNumber}
                    onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    تخصص
                  </label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    اسم *
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    تخلص *
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    ولد
                  </label>
                  <input
                    type="text"
                    value={form.fatherName}
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    شماره تماس
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    تاریخ شمولیت
                  </label>
                  <input
                    type="text"
                    placeholder="1404/01/01"
                    value={form.hireDate}
                    onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <p className="text-xs font-bold mb-3" style={{ color: '#0369a1' }}>
                  📅 مدت قرارداد
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0369a1' }}>
                      از تاریخ
                    </label>
                    <input
                      type="text"
                      placeholder="1404/01/01"
                      value={form.contractStart}
                      onChange={(e) => setForm({ ...form, contractStart: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                      style={{ borderColor: '#bae6fd', background: 'white' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#0369a1' }}>
                      تا تاریخ
                    </label>
                    <input
                      type="text"
                      placeholder="1404/12/29"
                      value={form.contractEnd}
                      onChange={(e) => setForm({ ...form, contractEnd: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                      style={{ borderColor: '#bae6fd', background: 'white' }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    معاش ثابت (AFN)
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                    فیصدی (%)
                  </label>
                  <input
                    type="text"
                    placeholder="30"
                    value={form.salaryPercent}
                    onChange={(e) => setForm({ ...form, salaryPercent: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                  شماره تذکره
                </label>
                <input
                  type="text"
                  value={form.tazkiraNumber}
                  onChange={(e) => setForm({ ...form, tazkiraNumber: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>
                  نشانی
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
              >
                لغو
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                  border: 'none',
                }}
              >
                {saving ? 'ذخیره...' : editingId ? '✓ ذخیره' : '✓ افزودن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}