'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Student = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  fatherName: string | null;
  photo: string | null;
  classRoom: { id: string; name: string } | null;
};

export default function StudentDocSearchPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
      const res = await fetch('/api/students', { cache: 'no-store' });
      if (res.ok) setStudents((await res.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const filtered = search.trim()
    ? students.filter((s) => {
        const q = search.toLowerCase().trim();
        return (
          s.studentNumber.toLowerCase().includes(q) ||
          s.firstName.toLowerCase().includes(q) ||
          (s.lastName || '').toLowerCase().includes(q) ||
          (s.fatherName || '').toLowerCase().includes(q)
        );
      })
    : [];

  if (!user) return null;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="studentDoc" />

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
              📋 سند جامع آموزشی
            </h1>
            <p style={{ color: '#64748b' }}>
              شماره دانشجویی یا نام را جستجو کنید تا سند کامل صادر شود
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e2e8f0' }}>
            <label className="block text-sm font-bold mb-3" style={{ color: '#334155' }}>
              🔍 جستجوی دانشجو
            </label>
            <input
              type="text"
              placeholder="مثلاً: S-1001 یا علی احمدی یا شماره..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full px-5 py-4 rounded-xl border-2 text-lg outline-none"
              style={{ borderColor: '#8b5cf6', background: '#faf5ff' }}
            />
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              💡 حداقل ۱ حرف بنویسید تا نتایج ظاهر شوند
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm" style={{ color: '#94a3b8' }}>
              ⏳ در حال بارگذاری...
            </div>
          ) : !search.trim() ? (
            <div
              className="p-12 text-center bg-white rounded-2xl"
              style={{ border: '2px dashed #cbd5e1' }}
            >
              <div style={{ fontSize: 64, marginBottom: 12 }}>🔎</div>
              <p className="font-bold text-lg mb-2" style={{ color: '#475569' }}>
                دانشجو را جستجو کنید
              </p>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                بعد از پیدا کردن، سند جامع با تمام معلومات باز می‌شود
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="p-12 text-center bg-white rounded-2xl"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: 64, marginBottom: 12 }}>😕</div>
              <p className="font-bold" style={{ color: '#475569' }}>
                دانشجویی یافت نشد
              </p>
              <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                عبارت دیگری را امتحان کنید
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-5 cursor-pointer transition-all"
                  style={{ border: '2px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  onClick={() => router.push('/student-doc/' + s.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8b5cf6';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  <div className="flex items-center gap-3">
                    {s.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo}
                        alt={s.firstName}
                        width={56}
                        height={56}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{
                          width: 56, height: 56,
                          fontSize: 22,
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        }}
                      >
                        {s.firstName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: '#0f172a' }}>
                        {s.firstName} {s.lastName || ''}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                        {s.fatherName ? 'ولد ' + s.fatherName : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                          style={{ background: '#f5f3ff', color: '#6d28d9' }}
                        >
                          {s.studentNumber}
                        </span>
                        {s.classRoom && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold"
                            style={{ background: '#f0f9ff', color: '#0369a1' }}
                          >
                            {s.classRoom.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-4 pt-3 text-center text-xs font-bold"
                    style={{ borderTop: '1px solid #f1f5f9', color: '#8b5cf6' }}
                  >
                    📄 باز کردن سند جامع
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}