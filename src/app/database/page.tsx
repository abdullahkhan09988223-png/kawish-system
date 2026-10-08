'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Field = {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  isUnique?: boolean;
  ref?: string;
  note?: string;
};

type Table = {
  id: string;
  name: string;
  fa: string;
  icon: string;
  color: string;
  bg: string;
  category: string;
  x: number;
  y: number;
  fields: Field[];
};

const TABLES: Table[] = [
  {
    id: 'User', name: 'users', fa: 'کاربران', icon: '🔐',
    color: '#3b82f6', bg: '#eff6ff', category: 'core',
    x: 580, y: 30,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'email', type: 'String', isUnique: true },
      { name: 'role', type: 'String', note: 'ADMIN/FINANCE' },
    ],
  },
  {
    id: 'Teacher', name: 'teachers', fa: 'استادان', icon: '👨‍🏫',
    color: '#8b5cf6', bg: '#f5f3ff', category: 'people',
    x: 40, y: 220,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'employeeNumber', type: 'String', isUnique: true },
      { name: 'firstName', type: 'String' },
      { name: 'salaryPercent', type: 'Float', note: 'فیصدی' },
    ],
  },
  {
    id: 'Employee', name: 'employees', fa: 'کارمندان', icon: '👷',
    color: '#ec4899', bg: '#fce7f3', category: 'people',
    x: 1180, y: 220,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'employeeNumber', type: 'String', isUnique: true },
      { name: 'firstName', type: 'String' },
      { name: 'position', type: 'String?' },
    ],
  },
  {
    id: 'ClassRoom', name: 'class_rooms', fa: 'صنف‌ها', icon: '🏫',
    color: '#0ea5e9', bg: '#f0f9ff', category: 'academic',
    x: 420, y: 220,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'name', type: 'String', isUnique: true },
      { name: 'teacherId', type: 'String?', isForeign: true, ref: 'Teacher' },
    ],
  },
  {
    id: 'Subject', name: 'subjects', fa: 'مضامین', icon: '📚',
    color: '#f59e0b', bg: '#fef3c7', category: 'academic',
    x: 800, y: 220,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'code', type: 'String', isUnique: true },
      { name: 'teacherId', type: 'String?', isForeign: true, ref: 'Teacher' },
    ],
  },
  {
    id: 'Student', name: 'students', fa: 'دانشجویان', icon: '👥',
    color: '#10b981', bg: '#d1fae5', category: 'people',
    x: 420, y: 420,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'studentNumber', type: 'String', isUnique: true },
      { name: 'classRoomId', type: 'String?', isForeign: true, ref: 'ClassRoom' },
    ],
  },
  {
    id: 'Enrollment', name: 'enrollments', fa: 'ثبت‌نام', icon: '📝',
    color: '#06b6d4', bg: '#cffafe', category: 'academic',
    x: 800, y: 420,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'studentId', type: 'String', isForeign: true, ref: 'Student' },
      { name: 'subjectId', type: 'String', isForeign: true, ref: 'Subject' },
    ],
  },
  {
    id: 'Salary', name: 'salaries', fa: 'معاش استادان', icon: '💵',
    color: '#eab308', bg: '#fef9c3', category: 'finance',
    x: 40, y: 420,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'teacherId', type: 'String', isForeign: true, ref: 'Teacher' },
      { name: 'amount', type: 'Float' },
    ],
  },
  {
    id: 'EmpSalary', name: 'emp_salaries', fa: 'معاش کارمندان', icon: '💼',
    color: '#ec4899', bg: '#fce7f3', category: 'finance',
    x: 1180, y: 420,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'employeeId', type: 'String', isForeign: true, ref: 'Employee' },
      { name: 'amount', type: 'Float' },
    ],
  },
  {
    id: 'Grade', name: 'grades', fa: 'نمرات', icon: '📊',
    color: '#f97316', bg: '#ffedd5', category: 'academic',
    x: 420, y: 620,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'studentId', type: 'String', isForeign: true, ref: 'Student' },
      { name: 'subjectId', type: 'String', isForeign: true, ref: 'Subject' },
      { name: 'totalScore', type: 'Float' },
    ],
  },
  {
    id: 'Fee', name: 'fees', fa: 'فیس', icon: '💰',
    color: '#14b8a6', bg: '#ccfbf1', category: 'finance',
    x: 800, y: 620,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'studentId', type: 'String', isForeign: true, ref: 'Student' },
      { name: 'total', type: 'Float' },
      { name: 'paid', type: 'Float' },
    ],
  },
  {
    id: 'Attendance', name: 'attendances', fa: 'حاضری', icon: '✅',
    color: '#22c55e', bg: '#dcfce7', category: 'academic',
    x: 40, y: 620,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'studentId', type: 'String', isForeign: true, ref: 'Student' },
      { name: 'date', type: 'String' },
      { name: 'status', type: 'String' },
    ],
  },
  {
    id: 'Schedule', name: 'schedules', fa: 'جدول هفتگی', icon: '🗓️',
    color: '#0d9488', bg: '#ccfbf1', category: 'academic',
    x: 1180, y: 620,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'classRoomId', type: 'String', isForeign: true, ref: 'ClassRoom' },
      { name: 'subjectId', type: 'String', isForeign: true, ref: 'Subject' },
      { name: 'teacherId', type: 'String?', isForeign: true, ref: 'Teacher' },
    ],
  },
  {
    id: 'Payment', name: 'payments', fa: 'پرداخت‌ها', icon: '🧾',
    color: '#10b981', bg: '#d1fae5', category: 'finance',
    x: 800, y: 820,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'receiptNumber', type: 'String', isUnique: true, note: 'QR' },
      { name: 'feeId', type: 'String', isForeign: true, ref: 'Fee' },
      { name: 'amount', type: 'Float' },
    ],
  },
  {
    id: 'Certificate', name: 'certificates', fa: 'تقدیرنامه', icon: '📜',
    color: '#a855f7', bg: '#f3e8ff', category: 'documents',
    x: 40, y: 820,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'serialNumber', type: 'String', isUnique: true, note: 'QR' },
      { name: 'studentId', type: 'String?', isForeign: true, ref: 'Student' },
      { name: 'recipientName', type: 'String' },
    ],
  },
  {
    id: 'Expense', name: 'expenses', fa: 'مصارف', icon: '📉',
    color: '#ef4444', bg: '#fee2e2', category: 'finance',
    x: 1180, y: 820,
    fields: [
      { name: 'id', type: 'String', isPrimary: true },
      { name: 'title', type: 'String' },
      { name: 'amount', type: 'Float' },
    ],
  },
];

// ابعاد هر کارت
const CARD_W = 240;
const CARD_H = 110;

// روابط: از کدام به کدام + نام فیلد کلید خارجی
const CONNECTIONS: Array<{
  from: string;
  to: string;
  field: string;
  type?: '1-N';
}> = [
  { from: 'Teacher', to: 'ClassRoom', field: 'teacherId', type: '1-N' },
  { from: 'Teacher', to: 'Subject', field: 'teacherId', type: '1-N' },
  { from: 'Teacher', to: 'Schedule', field: 'teacherId', type: '1-N' },
  { from: 'Teacher', to: 'Grade', field: 'teacherId', type: '1-N' },
  { from: 'Teacher', to: 'Salary', field: 'teacherId', type: '1-N' },
  { from: 'ClassRoom', to: 'Student', field: 'classRoomId', type: '1-N' },
  { from: 'ClassRoom', to: 'Schedule', field: 'classRoomId', type: '1-N' },
  { from: 'Student', to: 'Enrollment', field: 'studentId', type: '1-N' },
  { from: 'Student', to: 'Fee', field: 'studentId', type: '1-N' },
  { from: 'Student', to: 'Attendance', field: 'studentId', type: '1-N' },
  { from: 'Student', to: 'Grade', field: 'studentId', type: '1-N' },
  { from: 'Student', to: 'Certificate', field: 'studentId', type: '1-N' },
  { from: 'Subject', to: 'Enrollment', field: 'subjectId', type: '1-N' },
  { from: 'Subject', to: 'Schedule', field: 'subjectId', type: '1-N' },
  { from: 'Subject', to: 'Grade', field: 'subjectId', type: '1-N' },
  { from: 'Fee', to: 'Payment', field: 'feeId', type: '1-N' },
  { from: 'Employee', to: 'EmpSalary', field: 'employeeId', type: '1-N' },
];

const CATEGORIES = [
  { key: 'all', fa: 'همه', icon: '📋', color: '#0f172a' },
  { key: 'people', fa: 'افراد', icon: '👥', color: '#10b981' },
  { key: 'academic', fa: 'آموزشی', icon: '📚', color: '#0ea5e9' },
  { key: 'finance', fa: 'مالی', icon: '💰', color: '#f59e0b' },
  { key: 'documents', fa: 'اسناد', icon: '📜', color: '#a855f7' },
  { key: 'core', fa: 'سیستمی', icon: '⚙️', color: '#3b82f6' },
];

export default function DatabasePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'cards' | 'diagram'>('diagram');
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const handlePrint = () => window.print();

  if (!user) return null;

  const filtered = TABLES.filter((t) => {
    if (filterCat !== 'all' && t.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.fa.includes(search) ||
        t.fields.some((f) => f.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredIds = filtered.map((t) => t.id);
  const filteredConns = CONNECTIONS.filter(
    (c) => filteredIds.includes(c.from) && filteredIds.includes(c.to)
  );

  const totalFields = TABLES.reduce((sum, t) => sum + t.fields.length, 0);

  const grouped: Record<string, Table[]> = {};
  filtered.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="database" />

      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; }
          @page { size: A4 landscape; margin: 8mm; }
        }
        .db-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .db-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .db-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
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
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              fontSize: 14,
            }}
          >
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* هدر */}
          <div className="flex items-center justify-between flex-wrap gap-4 no-print">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
                🗄️ ساختار دیتابیس
              </h1>
              <p style={{ color: '#64748b' }}>
                {TABLES.length} جدول، {totalFields} فیلد، {CONNECTIONS.length} رابطه
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 8px 24px rgba(139,92,246,0.35)',
              }}
            >
              🖨️ چاپ
            </button>
          </div>

          {/* تب‌ها */}
          <div className="bg-white rounded-2xl p-2 flex gap-2 no-print" style={{ border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setView('diagram')}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{
                background: view === 'diagram' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
                color: view === 'diagram' ? 'white' : '#64748b',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              🕸️ دیاگرام گرافیکی
            </button>
            <button
              type="button"
              onClick={() => setView('cards')}
              className="flex-1 px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{
                background: view === 'cards' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
                color: view === 'cards' ? 'white' : '#64748b',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              📋 نمایش کارتی
            </button>
          </div>

          {/* فیلترها */}
          <div className="flex flex-wrap gap-3 no-print">
            <input
              type="text"
              placeholder="🔍 جستجوی جدول یا فیلد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[220px] px-4 py-3 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: '#e2e8f0' }}
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFilterCat(c.key)}
                  className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
                  style={{
                    background: filterCat === c.key ? c.color : 'white',
                    color: filterCat === c.key ? 'white' : c.color,
                    border: '2px solid ' + (filterCat === c.key ? c.color : '#e2e8f0'),
                    cursor: 'pointer',
                  }}
                >
                  <span>{c.icon}</span>
                  <span>{c.fa}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ═══ نمای دیاگرام ═══ */}
          {view === 'diagram' && (
            <>
              {/* راهنما */}
              <div
                className="p-4 rounded-xl text-xs no-print flex flex-wrap gap-4 items-center"
                style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
              >
                <span>💡 <strong>راهنما:</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#fbbf24', color: 'white' }}>PK</span>
                  کلید اصلی
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#3b82f6', color: 'white' }}>FK</span>
                  کلید خارجی
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ display: 'inline-block', width: 30, height: 2, background: '#6366f1' }} />
                  خط رابطه با نام فیلد
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#10b981', color: 'white' }}>U</span>
                  یکتا
                </span>
              </div>

              {/* کنترل زوم */}
              <div className="flex items-center gap-2 no-print">
                <span className="text-xs font-bold" style={{ color: '#64748b' }}>بزرگ‌نمایی:</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  className="px-3 py-1.5 rounded-lg font-bold text-sm"
                  style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
                >
                  ➖
                </button>
                <span className="text-sm font-bold font-mono" style={{ color: '#0f172a', minWidth: 50, textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
                  className="px-3 py-1.5 rounded-lg font-bold text-sm"
                  style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
                >
                  ➕
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs"
                  style={{ background: '#fef3c7', color: '#b45309', cursor: 'pointer', border: 'none' }}
                >
                  بازنشانی
                </button>
              </div>

              {/* بوم دیاگرام */}
              <div
                className="bg-white rounded-2xl overflow-auto db-scroll print-page"
                style={{ border: '1px solid #e2e8f0', maxHeight: '75vh' }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: 1480 * zoom,
                    height: 1000 * zoom,
                    backgroundImage:
                      'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top right',
                    }}
                  >
                    {/* SVG برای خطوط */}
                    <svg
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                      }}
                    >
                      <defs>
                        <marker
                          id="arrow-1"
                          viewBox="0 0 10 10"
                          refX="9"
                          refY="5"
                          markerWidth="7"
                          markerHeight="7"
                          orient="auto"
                        >
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                        </marker>
                        <marker
                          id="dot-1"
                          viewBox="0 0 10 10"
                          refX="5"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                        >
                          <circle cx="5" cy="5" r="3" fill="#6366f1" />
                        </marker>
                      </defs>

                      {filteredConns.map((c, i) => {
                        const fromTable = TABLES.find((t) => t.id === c.from);
                        const toTable = TABLES.find((t) => t.id === c.to);
                        if (!fromTable || !toTable) return null;

                        // شروع: از وسط کارت مبدأ
                        const x1 = fromTable.x + CARD_W / 2;
                        const y1 = fromTable.y + CARD_H / 2;

                        // پایان: به وسط کارت مقصد
                        const x2 = toTable.x + CARD_W / 2;
                        const y2 = toTable.y + CARD_H / 2;

                        // کنترل برای bezier - با انحراف ملایم
                        const mx = (x1 + x2) / 2;
                        const my = (y1 + y2) / 2;

                        // label در نیمه راه
                        const lx = mx;
                        const ly = my;

                        // رنگ بر اساس دسته مبدأ
                        const color = '#6366f1';

                        // محاسبه جهت برای تعیین offset
                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        // نقطه‌ی edge کارت مبدأ (روی محیط کارت)
                        const startEdgeX = x1 + (dx / dist) * (CARD_W / 2 + 5);
                        const startEdgeY = y1 + (dy / dist) * (CARD_H / 2 + 5);
                        const endEdgeX = x2 - (dx / dist) * (CARD_W / 2 + 5);
                        const endEdgeY = y2 - (dy / dist) * (CARD_H / 2 + 5);

                        // Bezier: منحنی ملایم
                        const cx = (startEdgeX + endEdgeX) / 2 + dy * 0.1;
                        const cy = (startEdgeY + endEdgeY) / 2 - dx * 0.1;

                        return (
                          <g key={i}>
                            {/* نقطه مبدأ */}
                            <circle cx={startEdgeX} cy={startEdgeY} r={5} fill="#6366f1" />
                            {/* منحنی */}
                            <path
                              d={`M ${startEdgeX} ${startEdgeY} Q ${cx} ${cy} ${endEdgeX} ${endEdgeY}`}
                              stroke="#6366f1"
                              strokeWidth={2}
                              fill="none"
                              opacity={0.7}
                              markerEnd="url(#arrow-1)"
                            />
                            {/* خط دایره‌ای برای ۱ و N */}
                            <text
                              x={startEdgeX + 10}
                              y={startEdgeY - 6}
                              fontSize={11}
                              fill="#1d4ed8"
                              fontWeight="bold"
                            >
                              1
                            </text>
                            <text
                              x={endEdgeX - 14}
                              y={endEdgeY - 6}
                              fontSize={11}
                              fill="#b45309"
                              fontWeight="bold"
                            >
                              N
                            </text>
                            {/* برچسب نام فیلد */}
                            <rect
                              x={lx - 55}
                              y={ly - 12}
                              width={110}
                              height={22}
                              rx={10}
                              fill="white"
                              stroke={color}
                              strokeWidth={1.5}
                              opacity={0.95}
                            />
                            <text
                              x={lx}
                              y={ly + 3}
                              fontSize={11}
                              fill={color}
                              textAnchor="middle"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {c.field}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* کارت‌های جداول */}
                    {filtered.map((t) => (
                      <DiagramCard
                        key={t.id}
                        table={t}
                        onClick={() => setSelectedTable(t)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══ نمای کارتی ═══ */}
          {view === 'cards' && (
            <>
              {Object.keys(grouped).length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl" style={{ border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 64, marginBottom: 12 }}>🔍</div>
                  <p className="font-bold" style={{ color: '#475569' }}>نتیجه‌ای یافت نشد</p>
                </div>
              ) : (
                Object.entries(grouped).map(([cat, tables]) => {
                  const catInfo = CATEGORIES.find((c) => c.key === cat) || CATEGORIES[0];
                  return (
                    <div key={cat} className="print-page">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="rounded-xl flex items-center justify-center"
                          style={{ width: 44, height: 44, background: catInfo.color + '20', fontSize: 22 }}
                        >
                          {catInfo.icon}
                        </div>
                        <div>
                          <h2 className="font-bold text-lg" style={{ color: catInfo.color }}>
                            {catInfo.fa}
                          </h2>
                          <p className="text-xs" style={{ color: '#94a3b8' }}>
                            {tables.length} جدول
                          </p>
                        </div>
                        <div className="flex-1 h-px" style={{ background: catInfo.color + '40' }} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tables.map((t) => (
                          <TableCard key={t.id} table={t} onExpand={() => setSelectedTable(t)} />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </main>
      </div>

      {/* مودال جزئیات */}
      {selectedTable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSelectedTable(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl"
            style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-5"
              style={{
                borderBottom: '3px solid ' + selectedTable.color,
                background: selectedTable.bg,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 52, height: 52, background: selectedTable.color, fontSize: 26 }}
                >
                  {selectedTable.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: selectedTable.color }}>
                    {selectedTable.fa}
                  </h3>
                  <p className="text-xs font-mono" style={{ color: '#64748b' }}>
                    {selectedTable.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="p-2 rounded-lg text-xl"
                style={{ color: '#94a3b8', cursor: 'pointer', border: 'none', background: 'transparent' }}
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto db-scroll">
              <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                {selectedTable.fields.length} فیلد
              </p>
              <div className="space-y-2">
                {selectedTable.fields.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl flex items-center justify-between gap-3 flex-wrap"
                    style={{
                      background: f.isPrimary ? '#fffbeb' : f.isForeign ? '#eff6ff' : '#f8fafc',
                      border: '1px solid ' + (f.isPrimary ? '#fbbf24' : f.isForeign ? '#93c5fd' : '#e2e8f0'),
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm" style={{ color: '#0f172a' }}>
                        {f.name}
                      </span>
                      <span className="text-xs" style={{ color: '#64748b' }}>{f.type}</span>
                      {f.isPrimary && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#fbbf24', color: 'white' }}>PK</span>}
                      {f.isForeign && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#3b82f6', color: 'white' }}>FK</span>}
                      {f.isUnique && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#10b981', color: 'white' }}>U</span>}
                    </div>
                    <div className="text-xs" style={{ color: '#64748b' }}>
                      {f.ref && <span>🔗 {f.ref}</span>}
                      {f.note && <span style={{ marginRight: 8 }}>💬 {f.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiagramCard({ table, onClick }: { table: Table; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: table.x,
        top: table.y,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 14,
        background: 'white',
        border: '3px solid ' + table.color,
        boxShadow: '0 8px 24px ' + table.color + '30',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.15s',
        zIndex: 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.zIndex = '10';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.zIndex = '1';
      }}
    >
      {/* هدر */}
      <div
        style={{
          padding: '8px 12px',
          background: table.color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 20 }}>{table.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 'bold', lineHeight: 1.2 }}>{table.fa}</p>
          <p style={{ fontSize: 10, opacity: 0.9, fontFamily: 'monospace' }}>{table.name}</p>
        </div>
      </div>

      {/* فیلدهای کلیدی */}
      <div style={{ padding: '6px 10px', fontSize: 10 }}>
        {table.fields.slice(0, 3).map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
            {f.isPrimary && (
              <span style={{ background: '#fbbf24', color: 'white', padding: '1px 5px', borderRadius: 4, fontSize: 8, fontWeight: 'bold' }}>PK</span>
            )}
            {f.isForeign && (
              <span style={{ background: '#3b82f6', color: 'white', padding: '1px 5px', borderRadius: 4, fontSize: 8, fontWeight: 'bold' }}>FK</span>
            )}
            <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 'bold' }}>
              {f.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableCard({ table, onExpand }: { table: Table; onExpand: () => void }) {
  const pkFields = table.fields.filter((f) => f.isPrimary);
  const fkFields = table.fields.filter((f) => f.isForeign);
  const otherFields = table.fields.filter((f) => !f.isPrimary && !f.isForeign);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{ border: '2px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      onClick={onExpand}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = table.color;
        e.currentTarget.style.boxShadow = '0 12px 32px ' + table.color + '30';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}
    >
      <div
        className="p-4 flex items-center justify-between"
        style={{ background: table.bg, borderBottom: '2px solid ' + table.color + '40' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl flex items-center justify-center"
            style={{ width: 44, height: 44, background: table.color, fontSize: 22 }}
          >
            {table.icon}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: table.color }}>{table.fa}</p>
            <p className="text-xs font-mono" style={{ color: '#64748b' }}>{table.name}</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'white', color: table.color }}>
          {table.fields.length} فیلد
        </span>
      </div>

      <div className="p-4 space-y-1.5">
        {pkFields.length > 0 && (
          <div className="mb-2">
            <p className="text-xs mb-1 font-bold" style={{ color: '#b45309' }}>🔑 کلید اصلی</p>
            {pkFields.slice(0, 2).map((f, i) => (
              <FieldRow key={i} field={f} color="#b45309" />
            ))}
          </div>
        )}
        {fkFields.length > 0 && (
          <div className="mb-2">
            <p className="text-xs mb-1 font-bold" style={{ color: '#1d4ed8' }}>🔗 روابط ({fkFields.length})</p>
            {fkFields.slice(0, 3).map((f, i) => (
              <FieldRow key={i} field={f} color="#1d4ed8" />
            ))}
            {fkFields.length > 3 && (
              <p className="text-xs" style={{ color: '#94a3b8', paddingRight: 8 }}>
                و {fkFields.length - 3} رابطه دیگر...
              </p>
            )}
          </div>
        )}
        {otherFields.length > 0 && (
          <div>
            <p className="text-xs mb-1 font-bold" style={{ color: '#475569' }}>📋 فیلدها ({otherFields.length})</p>
            {otherFields.slice(0, 4).map((f, i) => (
              <FieldRow key={i} field={f} color="#475569" />
            ))}
            {otherFields.length > 4 && (
              <p className="text-xs" style={{ color: '#94a3b8', paddingRight: 8 }}>
                و {otherFields.length - 4} فیلد دیگر...
              </p>
            )}
          </div>
        )}
      </div>

      <div
        className="p-3 text-center text-xs font-bold"
        style={{ background: '#f8fafc', color: table.color, borderTop: '1px solid #f1f5f9' }}
      >
        👆 کلیک برای جزئیات کامل
      </div>
    </div>
  );
}

function FieldRow({ field, color }: { field: Field; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: '#f8fafc' }}>
      <span className="font-mono font-bold" style={{ color }}>{field.name}</span>
      <span style={{ color: '#94a3b8' }}>{field.type}</span>
      {field.ref && <span style={{ color: '#3b82f6' }}>→ {field.ref}</span>}
    </div>
  );
}