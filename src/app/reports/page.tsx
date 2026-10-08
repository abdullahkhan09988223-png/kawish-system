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
  classStats: Array<{ name: string; count: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
};

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'finance' | 'students' | 'expenses'>('finance');

  useEffect(() => {
    const saved = sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN' && u.role !== 'FINANCE') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadStats(); }, [user]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  if (!user) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="reports" />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between print:hidden"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>
            خوش آمدید، {user.name}
          </h2>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
              cursor: 'pointer',
            }}
          >
            🖨️ چاپ گزارش
          </button>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
              گزارشات
            </h1>
            <p style={{ color: '#64748b' }}>خلاصه وضعیت مالی و آموزشی</p>
          </div>

          {loading || !stats ? (
            <div className="p-12 text-center text-sm" style={{ color: '#94a3b8' }}>
              در حال بارگذاری...
            </div>
          ) : (
            <>
              {/* تب‌ها */}
              <div
                className="bg-white rounded-2xl p-2 flex flex-wrap gap-1 print:hidden"
                style={{ border: '1px solid #e2e8f0' }}
              >
                {[
                  { key: 'finance', label: 'گزارش مالی', icon: '💰' },
                  { key: 'students', label: 'دانشجویان', icon: '👥' },
                  { key: 'expenses', label: 'مصارف', icon: '📉' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as any)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold"
                    style={{
                      background: tab === t.key ? '#eff6ff' : 'transparent',
                      color: tab === t.key ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* گزارش مالی */}
              {tab === 'finance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ReportCard
                      title="کل درآمد"
                      value={fmt(stats.finance.paidFees)}
                      unit="AFN"
                      icon="💵"
                      color="#10b981"
                      bg="#d1fae5"
                    />
                    <ReportCard
                      title="کل مصارف"
                      value={fmt(stats.finance.allExpenses)}
                      unit="AFN"
                      icon="📉"
                      color="#dc2626"
                      bg="#fee2e2"
                    />
                    <ReportCard
                      title={stats.finance.netProfit >= 0 ? 'سود خالص' : 'ضرر خالص'}
                      value={fmt(Math.abs(stats.finance.netProfit))}
                      unit="AFN"
                      icon={stats.finance.netProfit >= 0 ? '📈' : '⚠️'}
                      color={stats.finance.netProfit >= 0 ? '#10b981' : '#dc2626'}
                      bg={stats.finance.netProfit >= 0 ? '#d1fae5' : '#fee2e2'}
                    />
                    <ReportCard
                      title="فیس باقی‌مانده"
                      value={fmt(stats.finance.remainingFees)}
                      unit="AFN"
                      icon="⏳"
                      color="#f59e0b"
                      bg="#fef3c7"
                    />
                  </div>

                  {/* جدول تفصیلی */}
                  <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                    <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>
                      تفصیل مالی
                    </h3>
                    <div className="space-y-2">
                      <FinanceRow
                        label="فیس کل دانشجویان"
                        value={stats.finance.totalFees}
                        fmt={fmt}
                        color="#0ea5e9"
                      />
                      <FinanceRow
                        label="فیس پرداخت‌شده"
                        value={stats.finance.paidFees}
                        fmt={fmt}
                        color="#10b981"
                        bold
                      />
                      <FinanceRow
                        label="فیس باقی‌مانده"
                        value={stats.finance.remainingFees}
                        fmt={fmt}
                        color="#f59e0b"
                      />
                      <div className="my-2" style={{ borderTop: '1px solid #f1f5f9' }} />
                      <FinanceRow
                        label="معاش استادان"
                        value={stats.finance.totalSalaries}
                        fmt={fmt}
                        color="#dc2626"
                      />
                      <FinanceRow
                        label="معاش کارمندان"
                        value={stats.finance.totalEmpSalaries}
                        fmt={fmt}
                        color="#dc2626"
                      />
                      <FinanceRow
                        label="مصارف عمومی"
                        value={stats.finance.totalExpenses}
                        fmt={fmt}
                        color="#dc2626"
                      />
                      <div className="my-2" style={{ borderTop: '2px solid #f1f5f9' }} />
                      <FinanceRow
                        label={stats.finance.netProfit >= 0 ? '✅ سود خالص' : '⚠️ ضرر خالص'}
                        value={stats.finance.netProfit}
                        fmt={fmt}
                        color={stats.finance.netProfit >= 0 ? '#10b981' : '#dc2626'}
                        bold
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* گزارش دانشجویان */}
              {tab === 'students' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MiniCard title="دانشجویان" value={stats.counts.students} icon="👥" color="#0ea5e9" />
                    <MiniCard title="استادان" value={stats.counts.teachers} icon="👨‍🏫" color="#8b5cf6" />
                    <MiniCard title="صنف‌ها" value={stats.counts.classRooms} icon="🏫" color="#f59e0b" />
                    <MiniCard title="مضامین" value={stats.counts.subjects} icon="📚" color="#10b981" />
                    <MiniCard title="کارمندان" value={stats.counts.employees} icon="👷" color="#ec4899" />
                  </div>

                  <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                    <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>
                      توزیع دانشجویان بر اساس صنف
                    </h3>
                    {stats.classStats.length === 0 ? (
                      <p className="text-center py-6 text-sm" style={{ color: '#94a3b8' }}>
                        داده‌ای نیست
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                        <table className="w-full text-sm">
                          <thead style={{ background: '#f8fafc' }}>
                            <tr>
                              <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>#</th>
                              <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>صنف</th>
                              <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>تعداد دانشجو</th>
                              <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>درصد</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.classStats.map((c, i) => {
                              const total = stats.classStats.reduce((s, x) => s + x.count, 0);
                              const percent = total > 0 ? Math.round((c.count / total) * 100) : 0;
                              return (
                                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                  <td className="p-3 text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                                  <td className="p-3 text-xs font-bold" style={{ color: '#0f172a' }}>
                                    {c.name}
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className="px-3 py-1 rounded-full text-xs font-bold"
                                      style={{ background: '#f0f9ff', color: '#0369a1' }}
                                    >
                                      {c.count} دانشجو
                                    </span>
                                  </td>
                                  <td className="p-3 text-xs" style={{ color: '#475569' }}>
                                    {percent}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* گزارش مصارف */}
              {tab === 'expenses' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
                    <h3 className="font-bold mb-4" style={{ color: '#0f172a' }}>
                      مصارف بر اساس دسته
                    </h3>
                    {stats.expensesByCategory.length === 0 ? (
                      <p className="text-center py-6 text-sm" style={{ color: '#94a3b8' }}>
                        داده‌ای نیست
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                        <table className="w-full text-sm">
                          <thead style={{ background: '#f8fafc' }}>
                            <tr>
                              <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>#</th>
                              <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>دسته</th>
                              <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>مبلغ</th>
                              <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>درصد</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.expensesByCategory.map((e, i) => {
                              const total = stats.expensesByCategory.reduce((s, x) => s + x.amount, 0);
                              const percent = total > 0 ? Math.round((e.amount / total) * 100) : 0;
                              return (
                                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                  <td className="p-3 text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                                  <td className="p-3 text-xs font-bold" style={{ color: '#0f172a' }}>
                                    {e.category}
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className="px-3 py-1 rounded-full text-xs font-bold"
                                      style={{ background: '#fef3c7', color: '#b45309' }}
                                    >
                                      {fmt(e.amount)} AFN
                                    </span>
                                  </td>
                                  <td className="p-3 text-xs" style={{ color: '#475569' }}>
                                    {percent}%
                                  </td>
                                </tr>
                              );
                            })}
                            <tr style={{ borderTop: '2px solid #f1f5f9', background: '#fef3c7' }}>
                              <td className="p-3" />
                              <td className="p-3 text-xs font-bold" style={{ color: '#92400e' }}>
                                مجموع
                              </td>
                              <td className="p-3 text-xs font-bold" style={{ color: '#92400e' }}>
                                {fmt(stats.expensesByCategory.reduce((s, x) => s + x.amount, 0))} AFN
                              </td>
                              <td className="p-3 text-xs font-bold" style={{ color: '#92400e' }}>
                                100%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ReportCard({
  title, value, unit, icon, color, bg,
}: { title: string; value: string; unit: string; icon: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs" style={{ color: '#64748b' }}>{title}</span>
        <div
          className="rounded-xl flex items-center justify-center"
          style={{ width: 36, height: 36, background: bg, fontSize: 18 }}
        >
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold" style={{ color }}>
        {value} <span className="text-xs" style={{ color: '#94a3b8' }}>{unit}</span>
      </p>
    </div>
  );
}

function FinanceRow({
  label, value, fmt, color, bold,
}: { label: string; value: number; fmt: (n: number) => string; color: string; bold?: boolean }) {
  return (
    <div
      className="flex justify-between items-center p-3 rounded-xl"
      style={{ background: '#f8fafc' }}
    >
      <span className={'text-sm ' + (bold ? 'font-bold' : '')} style={{ color: '#475569' }}>
        {label}
      </span>
      <span
        className={'text-sm ' + (bold ? 'font-bold' : '')}
        style={{ color, fontFamily: 'monospace' }}
      >
        {fmt(value)} AFN
      </span>
    </div>
  );
}

function MiniCard({
  title, value, icon, color,
}: { title: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e2e8f0' }}>
      <div
        className="rounded-xl flex items-center justify-center mb-2"
        style={{ width: 36, height: 36, background: color + '15', fontSize: 18 }}
      >
        {icon}
      </div>
      <p className="text-xs mb-1" style={{ color: '#64748b' }}>{title}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}