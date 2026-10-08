'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type MonthData = {
  month: string;
  income: { feeIncome: number; paymentsCount: number };
  expenses: { teacherSalary: number; empSalary: number; expenseTotal: number; total: number };
  netProfit: number;
  profitMargin: number;
};

type ReportData = {
  year: string;
  months: MonthData[];
  yearly: { income: number; expense: number; netProfit: number; profitMargin: number };
};

const YEARS = ['۱۴۰۳', '۱۴۰۴', '۱۴۰۵', '۱۴۰۶'];

export default function MonthlyReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('۱۴۰۴');

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN' && u.role !== 'FINANCE') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/monthly?year=' + year, { cache: 'no-store' });
      if (res.ok) setData((await res.json()).data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadData(); }, [user, year]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fa-AF').format(Math.round(n || 0));

  const handlePrint = () => window.print();

  if (!user) return null;

  const maxValue = data
    ? Math.max(
        ...data.months.map((m) => Math.max(m.income.feeIncome, m.expenses.total)),
        1
      )
    : 1;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="reports" />

      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; padding: 0 !important; }
          @page { size: A4 landscape; margin: 8mm; }
        }
      `}</style>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between no-print"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <a
            href="/reports"
            className="px-4 py-2.5 rounded-xl text-sm font-bold no-underline"
            style={{ background: '#f1f5f9', color: '#475569' }}
          >
            ← بازگشت
          </a>
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>
            خوش آمدید، {user.name}
          </h2>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 no-print">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
                📊 گزارش ماهانه (عاید و مصرف)
              </h1>
              <p style={{ color: '#64748b' }}>مقایسه درآمد و مصارف هر ماه</p>
            </div>
            <div className="flex gap-3">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white font-mono font-bold"
                style={{ borderColor: '#0ea5e9' }}
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-3 rounded-xl text-white font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                🖨️ چاپ
              </button>
            </div>
          </div>

          {loading || !data ? (
            <div className="p-12 text-center" style={{ color: '#94a3b8' }}>
              ⏳ در حال محاسبه...
            </div>
          ) : (
            <>
              {/* خلاصه سال */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '2px solid #10b981' }}
                >
                  <p className="text-xs mb-1" style={{ color: '#047857' }}>مجموع عاید سال</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: '#047857' }}>
                    {fmt(data.yearly.income)} <span className="text-sm">AFN</span>
                  </p>
                </div>
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '2px solid #dc2626' }}
                >
                  <p className="text-xs mb-1" style={{ color: '#991b1b' }}>مجموع مصرف سال</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: '#dc2626' }}>
                    {fmt(data.yearly.expense)} <span className="text-sm">AFN</span>
                  </p>
                </div>
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: data.yearly.netProfit >= 0
                      ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                      : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    border: '2px solid ' + (data.yearly.netProfit >= 0 ? '#0ea5e9' : '#dc2626'),
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: data.yearly.netProfit >= 0 ? '#0369a1' : '#991b1b' }}>
                    {data.yearly.netProfit >= 0 ? 'سود خالص سال' : 'ضرر خالص سال'}
                  </p>
                  <p className="text-2xl font-bold font-mono" style={{ color: data.yearly.netProfit >= 0 ? '#0369a1' : '#dc2626' }}>
                    {fmt(Math.abs(data.yearly.netProfit))} <span className="text-sm">AFN</span>
                  </p>
                </div>
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: data.yearly.profitMargin >= 0 ? '#d1fae5' : '#fee2e2',
                    border: '2px solid ' + (data.yearly.profitMargin >= 0 ? '#10b981' : '#dc2626'),
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: data.yearly.profitMargin >= 0 ? '#047857' : '#991b1b' }}>
                    حاشیه سود
                  </p>
                  <p className="text-2xl font-bold font-mono" style={{ color: data.yearly.profitMargin >= 0 ? '#047857' : '#dc2626' }}>
                    {data.yearly.profitMargin}%
                  </p>
                </div>
              </div>

              {/* نمودار ماهانه */}
              <div className="bg-white rounded-2xl p-6 print-page" style={{ border: '1px solid #e2e8f0' }}>
                <h2 className="font-bold mb-5" style={{ color: '#0f172a' }}>
                  📈 نمودار مقایسه‌ای ماه به ماه
                </h2>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 280 }}>
                  {data.months.map((m) => {
                    const incomeH = (m.income.feeIncome / maxValue) * 100;
                    const expenseH = (m.expenses.total / maxValue) * 100;
                    return (
                      <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
                        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
                          <div
                            title={`عاید: ${fmt(m.income.feeIncome)}`}
                            style={{
                              width: '45%',
                              height: Math.max(incomeH, 1) + '%',
                              background: 'linear-gradient(180deg, #10b981, #047857)',
                              borderRadius: '4px 4px 0 0',
                              minHeight: 4,
                            }}
                          />
                          <div
                            title={`مصرف: ${fmt(m.expenses.total)}`}
                            style={{
                              width: '45%',
                              height: Math.max(expenseH, 1) + '%',
                              background: 'linear-gradient(180deg, #ef4444, #991b1b)',
                              borderRadius: '4px 4px 0 0',
                              minHeight: 4,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold" style={{ color: '#475569' }}>{m.month}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 mt-5 pt-5" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ width: 14, height: 14, background: '#10b981', borderRadius: 4 }} />
                    <span className="text-sm font-bold" style={{ color: '#047857' }}>عاید (فیس)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ width: 14, height: 14, background: '#ef4444', borderRadius: 4 }} />
                    <span className="text-sm font-bold" style={{ color: '#dc2626' }}>مصرف</span>
                  </div>
                </div>
              </div>

              {/* جدول ماهانه */}
              <div className="bg-white rounded-2xl overflow-hidden print-page" style={{ border: '1px solid #e2e8f0' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>ماه</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>💵 عاید فیس</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>💼 معاش استادان</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>👷 معاش کارمندان</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>📉 سایر مصارف</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>مجموع مصرف</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>سود / ضرر</th>
                        <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>حاشیه</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.months.map((m) => {
                        const hasData = m.income.feeIncome > 0 || m.expenses.total > 0;
                        return (
                          <tr
                            key={m.month}
                            style={{
                              borderTop: '1px solid #f1f5f9',
                              opacity: hasData ? 1 : 0.4,
                            }}
                          >
                            <td className="p-4">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{ background: '#fef3c7', color: '#b45309' }}
                              >
                                {m.month}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-mono font-bold" style={{ color: '#10b981' }}>
                              {m.income.feeIncome > 0 ? fmt(m.income.feeIncome) : '—'}
                            </td>
                            <td className="p-4 text-xs font-mono" style={{ color: '#dc2626' }}>
                              {m.expenses.teacherSalary > 0 ? fmt(m.expenses.teacherSalary) : '—'}
                            </td>
                            <td className="p-4 text-xs font-mono" style={{ color: '#dc2626' }}>
                              {m.expenses.empSalary > 0 ? fmt(m.expenses.empSalary) : '—'}
                            </td>
                            <td className="p-4 text-xs font-mono" style={{ color: '#dc2626' }}>
                              {m.expenses.expenseTotal > 0 ? fmt(m.expenses.expenseTotal) : '—'}
                            </td>
                            <td className="p-4 text-xs font-mono font-bold" style={{ color: '#dc2626' }}>
                              {m.expenses.total > 0 ? fmt(m.expenses.total) : '—'}
                            </td>
                            <td className="p-4">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                                style={{
                                  background: m.netProfit >= 0 ? '#d1fae5' : '#fee2e2',
                                  color: m.netProfit >= 0 ? '#047857' : '#dc2626',
                                }}
                              >
                                {m.netProfit >= 0 ? '+' : '−'}{fmt(Math.abs(m.netProfit))}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-bold" style={{ color: m.profitMargin >= 0 ? '#047857' : '#dc2626' }}>
                              {hasData ? m.profitMargin + '%' : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot style={{ background: '#f0f9ff', borderTop: '2px solid #0ea5e9' }}>
                      <tr>
                        <td className="p-4 font-bold" style={{ color: '#0369a1' }}>مجموع سال</td>
                        <td className="p-4 font-bold font-mono" style={{ color: '#047857' }}>{fmt(data.yearly.income)}</td>
                        <td colSpan={3} className="p-4" />
                        <td className="p-4 font-bold font-mono" style={{ color: '#dc2626' }}>{fmt(data.yearly.expense)}</td>
                        <td className="p-4 font-bold font-mono" style={{ color: data.yearly.netProfit >= 0 ? '#047857' : '#dc2626' }}>
                          {data.yearly.netProfit >= 0 ? '+' : '−'}{fmt(Math.abs(data.yearly.netProfit))}
                        </td>
                        <td className="p-4 font-bold" style={{ color: data.yearly.profitMargin >= 0 ? '#047857' : '#dc2626' }}>
                          {data.yearly.profitMargin}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}