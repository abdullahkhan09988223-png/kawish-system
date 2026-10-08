'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Stats = {
  counts: {
    students: number;
    teachers: number;
    employees: number;
    subjects: number;
    classRooms: number;
  };
  finance: {
    totalFees: number;
    paidFees: number;
    remainingFees: number;
    totalSalaries: number;
    totalEmpSalaries: number;
    totalExpenses: number;
    allExpenses: number;
    netProfit: number;
  };
  attendance: {
    presentToday: number;
  };
  monthlyData: Array<{ month: number; year: number; income: number; expense: number }>;
  classStats: Array<{ name: string; count: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
  recentStudents: Array<{
    id: string;
    firstName: string;
    lastName: string | null;
    studentNumber: string;
    createdAt: string;
  }>;
  topTeachers: Array<{
    id: string;
    name: string;
    specialization: string | null;
    classRooms: number;
    subjects: number;
  }>;
};

const MONTH_NAMES = [
  'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله',
  'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت',
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    setUser(JSON.parse(saved));
  }, [router]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const json = await res.json();
        setStats(json);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadStats(); }, [user]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (!user) return null;

  const maxMonthly = stats
    ? Math.max(
        ...stats.monthlyData.map((m) => Math.max(m.income, m.expense)),
        1
      )
    : 1;

  const maxClassCount = stats
    ? Math.max(...stats.classStats.map((c) => c.count), 1)
    : 1;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>
              داشبورد
            </h2>
            <p className="text-xs" style={{ color: '#64748b' }}>
              خوش آمدید، {user.name}
            </p>
          </div>
          <div
            className="rounded-full flex items-center justify-center text-white font-bold"
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
              fontSize: 14,
            }}
          >
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {loading || !stats ? (
            <div className="p-12 text-center text-sm" style={{ color: '#94a3b8' }}>
              در حال بارگذاری...
            </div>
          ) : (
            <>
              {/* کارت‌های اصلی */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard
                  icon="👥"
                  title="دانشجویان"
                  value={stats.counts.students}
                  color="#0ea5e9"
                  bg="#f0f9ff"
                />
                <StatCard
                  icon="👨‍🏫"
                  title="استادان"
                  value={stats.counts.teachers}
                  color="#8b5cf6"
                  bg="#f5f3ff"
                />
                <StatCard
                  icon="🏫"
                  title="صنف‌ها"
                  value={stats.counts.classRooms}
                  color="#f59e0b"
                  bg="#fef3c7"
                />
                <StatCard
                  icon="📚"
                  title="مضامین"
                  value={stats.counts.subjects}
                  color="#10b981"
                  bg="#d1fae5"
                />
                <StatCard
                  icon="👷"
                  title="کارمندان"
                  value={stats.counts.employees}
                  color="#ec4899"
                  bg="#fce7f3"
                />
              </div>

              {/* بخش مالی */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FinanceCard
                  title="مجموع فیس"
                  value={stats.finance.totalFees}
                  icon="💰"
                  color="#0ea5e9"
                  fmt={fmt}
                />
                <FinanceCard
                  title="فیس پرداخت‌شده"
                  value={stats.finance.paidFees}
                  icon="✅"
                  color="#10b981"
                  fmt={fmt}
                />
                <FinanceCard
                  title="فیس باقی‌مانده"
                  value={stats.finance.remainingFees}
                  icon="⏳"
                  color="#f59e0b"
                  fmt={fmt}
                />
                <FinanceCard
                  title={stats.finance.netProfit >= 0 ? 'سود خالص' : 'ضرر خالص'}
                  value={Math.abs(stats.finance.netProfit)}
                  icon={stats.finance.netProfit >= 0 ? '📈' : '📉'}
                  color={stats.finance.netProfit >= 0 ? '#10b981' : '#dc2626'}
                  fmt={fmt}
                />
              </div>

              {/* نمودار ۶ ماه + کارت حاضری */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>
                    📊 درآمد و مصارف ۶ ماه اخیر
                  </h3>
                  <div className="flex items-end gap-3 h-48">
                    {stats.monthlyData.map((m, i) => {
                      const incomeH = (m.income / maxMonthly) * 100;
                      const expenseH = (m.expense / maxMonthly) * 100;
                      const monthName = MONTH_NAMES[(m.month - 1) % 12];
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="flex-1 w-full flex items-end justify-center gap-1 h-full">
                            <div
                              className="rounded-t"
                              style={{
                                width: '45%',
                                height: Math.max(incomeH, 2) + '%',
                                background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                                minHeight: 4,
                              }}
                              title={`درآمد: ${fmt(m.income)}`}
                            />
                            <div
                              className="rounded-t"
                              style={{
                                width: '45%',
                                height: Math.max(expenseH, 2) + '%',
                                background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                                minHeight: 4,
                              }}
                              title={`مصرف: ${fmt(m.expense)}`}
                            />
                          </div>
                          <span className="text-xs" style={{ color: '#64748b' }}>
                            {monthName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full" style={{ width: 10, height: 10, background: '#10b981' }} />
                      <span className="text-xs" style={{ color: '#64748b' }}>درآمد</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full" style={{ width: 10, height: 10, background: '#ef4444' }} />
                      <span className="text-xs" style={{ color: '#64748b' }}>مصرف</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>
                    📅 حاضری امروز
                  </h3>
                  <div className="flex flex-col items-center justify-center py-6">
                    <div
                      className="rounded-full flex items-center justify-center text-white font-bold mb-3"
                      style={{
                        width: 100,
                        height: 100,
                        background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                        fontSize: 32,
                      }}
                    >
                      {stats.attendance.presentToday}
                    </div>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      دانشجوی حاضر امروز
                    </p>
                  </div>
                  <div className="pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <div className="flex justify-between text-xs mb-2">
                      <span style={{ color: '#64748b' }}>کل مصارف</span>
                      <span className="font-bold" style={{ color: '#dc2626' }}>
                        {fmt(stats.finance.allExpenses)} AFN
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: '#64748b' }}>معاش استادان</span>
                      <span className="font-bold" style={{ color: '#0f172a' }}>
                        {fmt(stats.finance.totalSalaries)} AFN
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* دانشجو بر اساس صنف + مصارف بر اساس دسته */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>
                    🏫 دانشجو بر اساس صنف
                  </h3>
                  {stats.classStats.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>
                      داده‌ای نیست
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.classStats.map((c, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold" style={{ color: '#0f172a' }}>{c.name}</span>
                            <span style={{ color: '#64748b' }}>{c.count} دانشجو</span>
                          </div>
                          <div
                            className="rounded-full overflow-hidden"
                            style={{ height: 8, background: '#f1f5f9' }}
                          >
                            <div
                              className="rounded-full"
                              style={{
                                height: '100%',
                                width: (c.count / maxClassCount) * 100 + '%',
                                background: 'linear-gradient(90deg, #0ea5e9 0%, #0369a1 100%)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>
                    📉 مصارف بر اساس دسته
                  </h3>
                  {stats.expensesByCategory.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>
                      داده‌ای نیست
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.expensesByCategory.map((e, i) => {
                        const total = stats.expensesByCategory.reduce((s, x) => s + x.amount, 0);
                        const percent = total > 0 ? (e.amount / total) * 100 : 0;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-bold" style={{ color: '#0f172a' }}>{e.category}</span>
                              <span style={{ color: '#64748b' }}>{fmt(e.amount)} AFN</span>
                            </div>
                            <div
                              className="rounded-full overflow-hidden"
                              style={{ height: 8, background: '#f1f5f9' }}
                            >
                              <div
                                className="rounded-full"
                                style={{
                                  height: '100%',
                                  width: percent + '%',
                                  background: 'linear-gradient(90deg, #f59e0b 0%, #b45309 100%)',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* دانشجویان جدید + استادان برتر */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>
                    🆕 دانشجویان جدید
                  </h3>
                  {stats.recentStudents.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>
                      داده‌ای نیست
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentStudents.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 p-2 rounded-xl"
                          style={{ background: '#f8fafc' }}
                        >
                          <div
                            className="rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{
                              width: 36,
                              height: 36,
                              background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                            }}
                          >
                            {s.firstName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate" style={{ color: '#0f172a' }}>
                              {s.firstName} {s.lastName || ''}
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                              {s.studentNumber}
                            </p>
                          </div>
                          <span
                            className="text-xs"
                            style={{ color: '#64748b' }}
                          >
                            {new Date(s.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                  <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>
                    ⭐ استادان فعال
                  </h3>
                  {stats.topTeachers.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>
                      داده‌ای نیست
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stats.topTeachers.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 p-2 rounded-xl"
                          style={{ background: '#f8fafc' }}
                        >
                          <div
                            className="rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{
                              width: 36,
                              height: 36,
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            }}
                          >
                            {t.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate" style={{ color: '#0f172a' }}>
                              {t.name}
                            </p>
                            <p className="text-xs" style={{ color: '#94a3b8' }}>
                              {t.specialization || 'عمومی'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#f5f3ff', color: '#6d28d9' }}
                              title="صنف‌ها"
                            >
                              🏫 {t.classRooms}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#d1fae5', color: '#047857' }}
                              title="مضامین"
                            >
                              📚 {t.subjects}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  color,
  bg,
}: {
  icon: string;
  title: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
      <div className="flex items-center justify-between mb-3">
        <div
          className="rounded-xl flex items-center justify-center"
          style={{ width: 40, height: 40, background: bg, fontSize: 20 }}
        >
          {icon}
        </div>
      </div>
      <p className="text-xs mb-1" style={{ color: '#64748b' }}>{title}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function FinanceCard({
  title,
  value,
  icon,
  color,
  fmt,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  fmt: (n: number) => string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: '#64748b' }}>{title}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <p className="text-lg font-bold" style={{ color }}>
        {fmt(value)} <span className="text-xs" style={{ color: '#94a3b8' }}>AFN</span>
      </p>
    </div>
  );
}