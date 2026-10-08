'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Ranking = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  fatherName: string | null;
  photo: string | null;
  gender: string | null;
  classRoom: { id: string; name: string } | null;
  avgGrade: number;
  attendanceRate: number;
  finalScore: number;
  gradesCount: number;
  attendanceTotal: number;
  attendancePresent: number;
  rank: number;
};

type ClassGroup = {
  classRoom: { id: string; name: string; room: string | null };
  rankings: Ranking[];
  top3: Ranking[];
  stats: { total: number; avgGrade: number; avgAttendance: number; avgScore: number };
};

type ClassRoom = { id: string; name: string };

export default function RankingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [unassigned, setUnassigned] = useState<Ranking[] | null>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [search, setSearch] = useState('');
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadClasses = async () => {
    try {
      const res = await fetch('/api/classrooms', { cache: 'no-store' });
      if (res.ok) setClasses((await res.json()).data || []);
    } catch (e) { console.error(e); }
  };

  const loadRankings = async () => {
    setLoading(true);
    try {
      const url = filterClass
        ? '/api/rankings?classRoomId=' + filterClass
        : '/api/rankings';
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setGroups(json.data || []);
        setUnassigned(json.unassigned || null);

        // همه باز باشند
        const expanded: Record<string, boolean> = {};
        (json.data || []).forEach((g: ClassGroup) => {
          expanded[g.classRoom.id] = true;
        });
        setExpandedClasses(expanded);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadClasses();
      loadRankings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterClass]);

  const toggleClass = (id: string) => {
    setExpandedClasses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => window.print();

  if (!user) return null;

  const totalClasses = groups.length;
  const totalStudents = groups.reduce((s, g) => s + g.rankings.length, 0);

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="rankings" />

      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
          .no-print-collapse { display: block !important; }
          @page { size: A4; margin: 10mm; }
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
          <h2 className="font-bold text-lg" style={{ color: '#0f172a' }}>
            خوش آمدید، {user.name}
          </h2>
          <div
            className="rounded-full flex items-center justify-center text-white font-bold"
            style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
              fontSize: 14,
            }}
          >
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 no-print">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
                🏆 رتبه‌بندی به تفکیک صنف
              </h1>
              <p style={{ color: '#64748b' }}>
                هر صنف، سه نفر برتر خودش را دارد
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
              }}
            >
              🖨️ چاپ همه
            </button>
          </div>

          {/* آمار کلی */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>تعداد صنف‌ها</p>
              <p className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{totalClasses}</p>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>مجموع دانشجویان</p>
              <p className="text-2xl font-bold" style={{ color: '#0ea5e9' }}>{totalStudents}</p>
            </div>
          </div>

          {/* فیلتر */}
          <div className="flex flex-wrap gap-3 no-print">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-3 rounded-xl border text-sm outline-none bg-white min-w-[200px] font-bold"
              style={{ borderColor: '#e2e8f0' }}
            >
              <option value="">🏫 همه صنف‌ها</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center" style={{ color: '#94a3b8' }}>
              ⏳ در حال محاسبه رتبه‌ها...
            </div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl" style={{ border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
              <p className="font-bold" style={{ color: '#475569' }}>داده‌ای برای رتبه‌بندی نیست</p>
              <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
                باید نمرات و حاضری ثبت شده باشد
              </p>
            </div>
          ) : (
            <>
              {groups.map((g) => (
                <ClassRankingCard
                  key={g.classRoom.id}
                  group={g}
                  expanded={expandedClasses[g.classRoom.id] !== false}
                  onToggle={() => toggleClass(g.classRoom.id)}
                />
              ))}

              {unassigned && unassigned.length > 0 && (
                <div className="bg-white rounded-2xl overflow-hidden print-page" style={{ border: '1px solid #e2e8f0' }}>
                  <div className="p-4" style={{ background: '#fef3c7', borderBottom: '2px solid #f59e0b' }}>
                    <h2 className="font-bold text-lg" style={{ color: '#92400e' }}>
                      ⚠️ دانشجویان بدون صنف ({unassigned.length} نفر)
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>#</th>
                          <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>دانشجو</th>
                          <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>معدل</th>
                          <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>حاضری</th>
                          <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>امتیاز</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unassigned.map((r, i) => (
                          <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td className="p-4 text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                            <td className="p-4 font-bold text-xs" style={{ color: '#0f172a' }}>
                              {r.firstName} {r.lastName || ''}
                            </td>
                            <td className="p-4 text-xs font-mono" style={{ color: '#0369a1' }}>
                              {r.avgGrade.toFixed(1)}
                            </td>
                            <td className="p-4 text-xs font-mono" style={{ color: '#047857' }}>
                              {r.attendanceRate}%
                            </td>
                            <td className="p-4 text-xs font-mono font-bold" style={{ color: '#0f172a' }}>
                              {r.finalScore.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* راهنما */}
              <div
                className="p-4 rounded-xl text-xs no-print"
                style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
              >
                <p style={{ fontWeight: 'bold', marginBottom: 6 }}>💡 طریقه محاسبه امتیاز:</p>
                <code style={{ background: '#e0f2fe', padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 8 }}>
                  امتیاز = (معدل نمرات × ۰.۶) + (نرخ حاضری × ۰.۴)
                </code>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                  <span>🥇 <strong>عالی:</strong> بالای ۸۵</span>
                  <span>🥈 <strong>خوب:</strong> ۷۰ تا ۸۵</span>
                  <span>🥉 <strong>متوسط:</strong> ۵۰ تا ۷۰</span>
                  <span>⚠️ <strong>ضعیف:</strong> پایین‌تر از ۵۰</span>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function getLevel(score: number) {
  if (score >= 85) return { fa: 'عالی', color: '#047857', bg: '#d1fae5', icon: '🥇' };
  if (score >= 70) return { fa: 'خوب', color: '#0369a1', bg: '#f0f9ff', icon: '🥈' };
  if (score >= 50) return { fa: 'متوسط', color: '#b45309', bg: '#fef3c7', icon: '🥉' };
  return { fa: 'ضعیف', color: '#dc2626', bg: '#fee2e2', icon: '⚠️' };
}

function ClassRankingCard({
  group,
  expanded,
  onToggle,
}: {
  group: ClassGroup;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden print-page"
      style={{ border: '2px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
    >
      {/* هدر صنف */}
      <div
        className="p-5 flex items-center justify-between flex-wrap gap-3"
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          borderBottom: '2px solid #93c5fd',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl flex items-center justify-center"
            style={{ width: 50, height: 50, background: '#3b82f6', fontSize: 24 }}
          >
            🏫
          </div>
          <div>
            <h2 className="font-bold text-xl" style={{ color: '#1e3a8a' }}>
              {group.classRoom.name}
            </h2>
            <div className="flex gap-3 mt-1 text-xs" style={{ color: '#475569' }}>
              <span>👥 {group.stats.total} دانشجو</span>
              <span>📊 معدل صنف: {group.stats.avgGrade.toFixed(1)}</span>
              <span>✅ حاضری: {group.stats.avgAttendance}%</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="px-4 py-2 rounded-lg text-sm font-bold no-print"
          style={{ background: 'white', color: '#1e40af', cursor: 'pointer', border: '1px solid #93c5fd' }}
        >
          {expanded ? '▲ بستن' : '▼ باز کردن'}
        </button>
      </div>

      {expanded && (
        <>
          {/* سکوی افتخار صنف */}
          {group.top3.length > 0 && (
            <div className="p-6" style={{ background: '#f8fafc' }}>
              <p className="font-bold text-sm mb-4" style={{ color: '#64748b' }}>
                🏆 سه نفر برتر این صنف
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {group.top3[0] && <PodiumCard ranking={group.top3[0]} position={1} />}
                {group.top3[1] && <PodiumCard ranking={group.top3[1]} position={2} />}
                {group.top3[2] && <PodiumCard ranking={group.top3[2]} position={3} />}
              </div>
            </div>
          )}

          {/* جدول کامل صنف */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>رتبه</th>
                  <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>دانشجو</th>
                  <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>معدل</th>
                  <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>حاضری</th>
                  <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>امتیاز نهایی</th>
                  <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>سطح</th>
                </tr>
              </thead>
              <tbody>
                {group.rankings.map((r) => {
                  const level = getLevel(r.finalScore);
                  return (
                    <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td className="p-4">
                        <RankBadge rank={r.rank} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {r.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.photo}
                              alt={r.firstName}
                              width={38}
                              height={38}
                              style={{ borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                              style={{
                                width: 38, height: 38, fontSize: 14,
                                background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                              }}
                            >
                              {r.firstName[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-xs" style={{ color: '#0f172a' }}>
                              {r.firstName} {r.lastName || ''}
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                              {r.studentNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                          style={{
                            background: r.avgGrade >= 80 ? '#d1fae5' : r.avgGrade >= 60 ? '#fef3c7' : '#fee2e2',
                            color: r.avgGrade >= 80 ? '#047857' : r.avgGrade >= 60 ? '#b45309' : '#dc2626',
                          }}
                        >
                          {r.avgGrade.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold font-mono"
                          style={{
                            background: r.attendanceRate >= 90 ? '#d1fae5' : r.attendanceRate >= 70 ? '#fef3c7' : '#fee2e2',
                            color: r.attendanceRate >= 90 ? '#047857' : r.attendanceRate >= 70 ? '#b45309' : '#dc2626',
                          }}
                        >
                          {r.attendanceRate}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-base font-mono" style={{ color: '#0f172a' }}>
                          {r.finalScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"
                          style={{ background: level.bg, color: level.color }}
                        >
                          {level.icon} {level.fa}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{
          width: 40, height: 40, fontSize: 18,
          background: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
          boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
        }}
      >
        🥇
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{
          width: 40, height: 40, fontSize: 18,
          background: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
        }}
      >
        🥈
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-white font-bold"
        style={{
          width: 40, height: 40, fontSize: 18,
          background: 'linear-gradient(135deg, #fb923c 0%, #9a3412 100%)',
        }}
      >
        🥉
      </div>
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold"
      style={{
        width: 40, height: 40, fontSize: 14,
        background: '#f1f5f9',
        color: '#475569',
      }}
    >
      {rank}
    </div>
  );
}

function PodiumCard({ ranking, position }: { ranking: Ranking; position: number }) {
  const colors = {
    1: { border: '#fbbf24', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', medal: '🥇', label: 'اول' },
    2: { border: '#94a3b8', bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', medal: '🥈', label: 'دوم' },
    3: { border: '#fb923c', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', medal: '🥉', label: 'سوم' },
  }[position as 1 | 2 | 3];

  return (
    <div
      className="rounded-2xl p-5 text-center"
      style={{
        background: colors.bg,
        border: '3px solid ' + colors.border,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 6 }}>{colors.medal}</div>
      <p className="font-bold text-xs mb-3" style={{ color: '#64748b' }}>
        نفر {colors.label}
      </p>

      {ranking.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ranking.photo}
          alt={ranking.firstName}
          width={80}
          height={80}
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            border: '4px solid ' + colors.border,
            margin: '0 auto 10px',
          }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-white font-bold"
          style={{
            width: 80, height: 80, fontSize: 28,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
            border: '4px solid ' + colors.border,
            margin: '0 auto 10px',
          }}
        >
          {ranking.firstName[0]}
        </div>
      )}

      <p className="font-bold text-base" style={{ color: '#0f172a' }}>
        {ranking.firstName} {ranking.lastName || ''}
      </p>
      <p className="text-xs font-mono mb-3" style={{ color: '#64748b' }}>
        {ranking.studentNumber}
      </p>

      <div
        className="rounded-xl p-3"
        style={{ background: 'white', border: '1px solid #e2e8f0' }}
      >
        <p className="text-xs mb-1" style={{ color: '#64748b' }}>امتیاز نهایی</p>
        <p className="text-2xl font-bold font-mono" style={{ color: '#0f172a' }}>
          {ranking.finalScore.toFixed(1)}
        </p>
        <div className="flex justify-center gap-3 mt-2 text-xs">
          <span style={{ color: '#0369a1' }}>معدل: {ranking.avgGrade.toFixed(1)}</span>
          <span style={{ color: '#047857' }}>حاضری: {ranking.attendanceRate}%</span>
        </div>
      </div>
    </div>
  );
}