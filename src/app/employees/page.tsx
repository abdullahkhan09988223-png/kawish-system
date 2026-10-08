'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';
import { compressImage } from '@/lib/image-compress';

type Employee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  position: string | null;
  department: string | null;
  phone: string | null;
  salary: number;
  photo: string | null;
  _count?: { empSalaries: number };
};

export default function EmployeesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
    position: '',
    department: '',
    phone: '',
    address: '',
    hireDate: '',
    salary: '',
    photo: null as string | null,
  });

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees', { cache: 'no-store' });
      if (res.ok) setEmployees((await res.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const filtered = employees.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q) ||
      (e.position || '').toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({
      employeeNumber: '',
      firstName: '',
      lastName: '',
      fatherName: '',
      position: '',
      department: '',
      phone: '',
      address: '',
      hireDate: '',
      salary: '',
      photo: null,
    });
    setShowModal(true);
  };

  const openEdit = (e: Employee) => {
    setEditingId(e.id);
    setForm({
      employeeNumber: e.employeeNumber,
      firstName: e.firstName,
      lastName: e.lastName,
      fatherName: e.fatherName || '',
      position: e.position || '',
      department: e.department || '',
      phone: e.phone || '',
      address: '',
      hireDate: '',
      salary: String(e.salary || ''),
      photo: e.photo || null,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
  };

  const handlePhoto = () => async (ev: any) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.7,
      });
      setForm((prev: any) => ({ ...prev, photo: compressed }));
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
      const url = editingId ? '/api/employees/' + editingId : '/api/employees';
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
        tableName: 'employees',
        recordName: form.firstName + ' ' + form.lastName,
        details: (editingId ? 'ویرایش' : 'افزودن') + ' کارمند',
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
    if (!confirm('حذف کارمند «' + name + '»؟')) return;
    try {
      await fetch('/api/employees/' + id, { method: 'DELETE' });
      await logAction({
        action: 'DELETE',
        tableName: 'employees',
        recordId: id,
        recordName: name,
        details: 'حذف کارمند',
      });
      await loadAll();
    } catch { alert('خطا'); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="employees" />

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
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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
                مدیریت کارمندان
              </h1>
              <p style={{ color: '#64748b' }}>لیست کارمندان اداری</p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span>+</span><span>افزودن کارمند</span>
            </button>
          </div>

          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="جستجو..."
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
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>وظیفه</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>بخش</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>تماس</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>معاش</th>
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
                        کارمندی یافت نشد
                      </td>
                    </tr>
                  ) : (
                    filtered.map((e) => (
                      <tr key={e.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td className="p-4">
                          {e.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={e.photo}
                              alt={e.firstName}
                              width={40}
                              height={40}
                              style={{ borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{
                                width: 40, height: 40,
                                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                              }}
                            >
                              {e.firstName[0]}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-sm" style={{ color: '#0f172a' }}>
                            {e.firstName} {e.lastName}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: '#be185d' }}>
                          {e.employeeNumber}
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#475569' }}>
                          {e.position || '—'}
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#475569' }}>
                          {e.department || '—'}
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: '#475569' }}>
                          {e.phone || '—'}
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: '#0f172a' }}>
                          {fmt(e.salary)} AFN
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(e)}
                              className="p-2 rounded-lg"
                              style={{ color: '#2563eb', cursor: 'pointer', border: 'none', background: 'transparent' }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(e.id, e.firstName + ' ' + e.lastName)}
                              className="p-2 rounded-lg"
                              style={{ color: '#dc2626', cursor: 'pointer', border: 'none', background: 'transparent' }}
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
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{ borderBottom: '2px solid #ec4899', background: '#f8fafc' }}
            >
              <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                {editingId ? 'ویرایش کارمند' : 'افزودن کارمند'}
              </h3>
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

            <div className="p-5 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
                  style={{
                    width: 100, height: 100, fontSize: 32,
                    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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
                  style={{ background: '#fce7f3', color: '#be185d', cursor: 'pointer' }}
                >
                  انتخاب عکس
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhoto()}
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
                    وظیفه
                  </label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>اسم *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>تخلص *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>ولد</label>
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
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>بخش</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>شماره تماس</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>تاریخ شمولیت</label>
                  <input
                    type="text"
                    placeholder="1404/01/01"
                    value={form.hireDate}
                    onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>معاش (AFN)</label>
                  <input
                    type="text"
                    placeholder="15000"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#334155' }}>نشانی</label>
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
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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