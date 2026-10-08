'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type ClassRoom = { id: string; name: string };
type Student = {
  id: string;
  firstName: string;
  lastName: string | null;
  studentNumber: string;
  classRoomId: string | null;
};
type Subject = { id: string; name: string; code: string; credits: number };

type Enrollment = {
  id: string;
  studentId: string;
  subjectId: string;
  enrolledAt: string;
  student: { id: string; firstName: string; lastName: string | null; studentNumber: string };
  subject: { id: string; name: string; code: string; credits: number };
};

export default function EnrollmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // فیلترها
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  // مودال ثبت‌نام
  const [showModal, setShowModal] = useState(false);
  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

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
      const [cRes, sRes, subRes, eRes] = await Promise.all([
        fetch('/api/classrooms'),
        fetch('/api/students'),
        fetch('/api/subjects'),
        fetch('/api/enrollments'),
      ]);
      if (cRes.ok) setClasses((await cRes.json()).data || []);
      if (sRes.ok) setAllStudents((await sRes.json()).data || []);
      if (subRes.ok) setSubjects((await subRes.json()).data || []);
      if (eRes.ok) setEnrollments((await eRes.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const students = filterClass
    ? allStudents.filter((s) => s.classRoomId === filterClass)
    : allStudents;

  // مضمون‌های هر دانشجو
  const getStudentSubjects = (studentId: string) =>
    enrollments.filter((e) => e.studentId === studentId);

  const getFilteredEnrollments = () =>
    enrollments.filter((e) => {
      if (filterClass && e.student) {
        const stu = allStudents.find((s) => s.id === e.studentId);
        if (!stu || stu.classRoomId !== filterClass) return false;
      }
      if (filterSubject && e.subjectId !== filterSubject) return false;
      return true;
    });

  const openModal = (student: Student) => {
    setModalStudent(student);
    const existing = getStudentSubjects(student.id).map((e) => e.subjectId);
    setSelectedSubjects(existing);
    setShowModal(true);
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSaveEnrollments = async () => {
    if (!modalStudent) return;
    setSaving(true);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: modalStudent.id,
          subjectIds: selectedSubjects,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در ذخیره');
      setShowModal(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!confirm('حذف این ثبت‌نام؟')) return;
    try {
      await fetch('/api/enrollments/' + id, { method: 'DELETE' });
      await loadAll();
    } catch { alert('خطا در حذف'); }
  };

  if (!user) return null;

  const filteredEnrollments = getFilteredEnrollments();

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="enrollments" />

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
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
              ثبت‌نام در مضمون
            </h1>
            <p style={{ color: '#64748b' }}>انتخاب مضامین برای هر دانشجو</p>
          </div>

          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#334155' }}>
                  فیلتر صنف
                </label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">همه صنف‌ها</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: '#334155' }}>
                  فیلتر مضمون (در جدول پایین)
                </label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="">همه مضامین</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center" style={{ color: '#94a3b8' }}>
                در حال بارگذاری...
              </div>
            ) : students.length === 0 ? (
              <div className="p-6 text-center rounded-xl" style={{ background: '#fef3c7', color: '#92400e' }}>
                ⚠️ دانشجویی یافت نشد
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                <table className="w-full text-sm">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>#</th>
                      <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>دانشجو</th>
                      <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>شماره</th>
                      <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مضامین ثبت‌شده</th>
                      <th className="text-left p-3 text-xs" style={{ color: '#64748b' }}>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const studentSubs = getStudentSubjects(s.id);
                      return (
                        <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td className="p-3 text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                          <td className="p-3">
                            <span className="font-bold text-xs" style={{ color: '#0f172a' }}>
                              {s.firstName} {s.lastName || ''}
                            </span>
                          </td>
                          <td className="p-3 text-xs font-mono" style={{ color: '#64748b' }}>
                            {s.studentNumber}
                          </td>
                          <td className="p-3">
                            {studentSubs.length === 0 ? (
                              <span className="text-xs" style={{ color: '#94a3b8' }}>— هیچ مضمونی —</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {studentSubs.map((e) => (
                                  <span
                                    key={e.id}
                                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                                    style={{ background: '#ede9fe', color: '#6d28d9' }}
                                  >
                                    {e.subject.code}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-left">
                            <button
                              onClick={() => openModal(s)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold"
                              style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                color: '#fff',
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ ویرایش مضامین
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* لیست کل ثبت‌نام‌ها */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #e2e8f0' }}
          >
            <div
              className="p-4 flex items-center justify-between flex-wrap gap-3"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <h2 className="font-bold" style={{ color: '#0f172a' }}>
                📋 لیست ثبت‌نام‌ها
              </h2>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: '#ede9fe', color: '#6d28d9' }}
              >
                {filteredEnrollments.length} ثبت‌نام
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>دانشجو</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>شماره</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مضمون</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>کد</th>
                    <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>کریدیت</th>
                    <th className="text-left p-3 text-xs" style={{ color: '#64748b' }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center" style={{ color: '#94a3b8' }}>
                        در حال بارگذاری...
                      </td>
                    </tr>
                  ) : filteredEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center" style={{ color: '#94a3b8' }}>
                        هیچ ثبت‌نامی یافت نشد
                      </td>
                    </tr>
                  ) : (
                    filteredEnrollments.map((e) => (
                      <tr key={e.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td className="p-3">
                          <span className="font-bold text-xs" style={{ color: '#0f172a' }}>
                            {e.student.firstName} {e.student.lastName || ''}
                          </span>
                        </td>
                        <td className="p-3 text-xs font-mono" style={{ color: '#64748b' }}>
                          {e.student.studentNumber}
                        </td>
                        <td className="p-3 text-xs" style={{ color: '#0f172a' }}>
                          {e.subject.name}
                        </td>
                        <td className="p-3 text-xs font-mono" style={{ color: '#64748b' }}>
                          {e.subject.code}
                        </td>
                        <td className="p-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: '#ede9fe', color: '#6d28d9' }}
                          >
                            {e.subject.credits}
                          </span>
                        </td>
                        <td className="p-3 text-left">
                          <button
                            onClick={() => handleDeleteEnrollment(e.id)}
                            className="p-2 rounded-lg"
                            style={{ color: '#dc2626', cursor: 'pointer' }}
                          >
                            🗑️
                          </button>
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

      {/* مودال انتخاب مضامین */}
      {showModal && modalStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            <div
              className="flex items-center justify-between p-5"
              style={{ borderBottom: '2px solid #8b5cf6', background: '#f8fafc' }}
            >
              <div>
                <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                  انتخاب مضامین
                </h3>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                  {modalStudent.firstName} {modalStudent.lastName || ''} — {modalStudent.studentNumber}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-xl"
                style={{ color: '#94a3b8', cursor: 'pointer' }}
              >
                X
              </button>
            </div>

            <div className="p-5">
              {subjects.length === 0 ? (
                <div className="p-6 text-center rounded-xl" style={{ background: '#fef3c7', color: '#92400e' }}>
                  ⚠️ هنوز مضمونی تعریف نشده
                </div>
              ) : (
                <>
                  <p className="text-xs mb-3" style={{ color: '#64748b' }}>
                    {selectedSubjects.length} از {subjects.length} مضمون انتخاب شده
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {subjects.map((sub) => {
                      const isSelected = selectedSubjects.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => toggleSubject(sub.id)}
                          className="p-3 rounded-xl text-right flex items-center gap-3 transition-all"
                          style={{
                            background: isSelected ? '#ede9fe' : '#f8fafc',
                            border: isSelected ? '2px solid #8b5cf6' : '2px solid #e2e8f0',
                            cursor: 'pointer',
                          }}
                        >
                          <span
                            className="flex items-center justify-center rounded-md text-white text-xs font-bold"
                            style={{
                              width: 22,
                              height: 22,
                              background: isSelected ? '#8b5cf6' : '#cbd5e1',
                            }}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate" style={{ color: '#0f172a' }}>
                              {sub.name}
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                              {sub.code} — {sub.credits} کریدیت
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer' }}
              >
                لغو
              </button>
              <button
                onClick={handleSaveEnrollments}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? 'ذخیره...' : '💾 ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}