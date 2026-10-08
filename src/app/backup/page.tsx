'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

type Backup = {
  name: string;
  size: number;
  sizeKB: number;
  createdAt: string;
  modifiedAt: string;
};

export default function BackupPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastBackup, setLastBackup] = useState<Backup | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kawish_user') || sessionStorage.getItem('kawish_user');
    if (!saved) { router.push('/login'); return; }
    const u = JSON.parse(saved);
    if (u.role !== 'ADMIN') { router.push('/dashboard'); return; }
    setUser(u);
  }, [router]);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backup', { cache: 'no-store' });
      if (res.ok) {
        const list = (await res.json()).data || [];
        setBackups(list);
        if (list.length > 0) setLastBackup(list[0]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadBackups(); }, [user]);

  const handleCreate = async () => {
    setCreating(true);
    setMessage(null);
    setShowSuccess(false);

    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در بکاپ‌گیری');

      await loadBackups();
      setShowSuccess(true);
      setMessage({
        type: 'success',
        text: `✅ بکاپ با موفقیت ساخته شد — ${json.data.name}`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: '❌ ' + err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (name: string) => {
    window.open('/api/backup/' + encodeURIComponent(name), '_blank');
  };

  const handleDownloadLatest = () => {
    if (lastBackup) handleDownload(lastBackup.name);
  };

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('fa-IR');
    } catch {
      return iso;
    }
  };

  const daysAgo = (iso: string): number => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  if (!user) return null;

  const daysSinceLast = lastBackup ? daysAgo(lastBackup.createdAt) : null;
  const isHealthy = daysSinceLast !== null && daysSinceLast <= 7;
  const isWarning = daysSinceLast !== null && daysSinceLast > 7 && daysSinceLast <= 30;
  const isDanger = daysSinceLast === null || daysSinceLast > 30;

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="backupPage" />

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
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              fontSize: 14,
            }}
          >
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
          {/* هدر */}
          <div className="text-center">
            <div style={{ fontSize: 72, marginBottom: 8 }}>🛡️</div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#0f172a' }}>
              پشتیبان‌گیری از داده‌ها
            </h1>
            <p style={{ color: '#64748b', fontSize: 15 }}>
              با یک کلیک، یک نسخه کامل از تمام داده‌ها ذخیره می‌شود
            </p>
          </div>

          {/* وضعیت سلامت */}
          <div
            className="p-5 rounded-2xl flex items-center gap-4 flex-wrap"
            style={{
              background: isHealthy ? '#d1fae5' : isWarning ? '#fef3c7' : '#fee2e2',
              border: '2px solid ' + (isHealthy ? '#10b981' : isWarning ? '#f59e0b' : '#dc2626'),
            }}
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 60, height: 60,
                background: isHealthy ? '#10b981' : isWarning ? '#f59e0b' : '#dc2626',
                fontSize: 30,
              }}
            >
              {isHealthy ? '✓' : isWarning ? '⚠️' : '🔴'}
            </div>
            <div className="flex-1 min-w-[200px]">
              <p
                className="font-bold text-lg mb-1"
                style={{ color: isHealthy ? '#047857' : isWarning ? '#b45309' : '#dc2626' }}
              >
                {isHealthy && '✅ داده‌های شما امن است'}
                {isWarning && '⚠️ زمان بکاپ‌گیری رسیده'}
                {isDanger && '🔴 هشدار: خیلی وقت است بکاپ نگرفته‌اید'}
              </p>
              <p
                className="text-sm"
                style={{ color: isHealthy ? '#047857' : isWarning ? '#b45309' : '#dc2626' }}
              >
                {lastBackup
                  ? `آخرین بکاپ: ${daysSinceLast === 0 ? 'امروز' : daysSinceLast + ' روز پیش'} (${fmtDate(lastBackup.createdAt)})`
                  : 'هنوز هیچ بکاپی ساخته نشده'}
              </p>
            </div>
          </div>

          {/* دکمه‌های اصلی */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* دکمه بکاپ */}
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="rounded-2xl p-8 text-center transition-all"
              style={{
                background: creating
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: 'white',
                cursor: creating ? 'wait' : 'pointer',
                border: 'none',
                boxShadow: creating ? 'none' : '0 12px 32px rgba(16,185,129,0.4)',
              }}
              onMouseEnter={(e) => {
                if (!creating) e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 12 }}>
                {creating ? '⏳' : '💾'}
              </div>
              <p className="text-xl font-bold mb-2">
                {creating ? 'در حال ساخت بکاپ...' : 'گرفتن بکاپ جدید'}
              </p>
              <p style={{ fontSize: 13, opacity: 0.9 }}>
                {creating ? 'لطفاً صبر کنید، ۵ تا ۱۵ ثانیه' : 'یک نسخه کامل از همه داده‌ها'}
              </p>
            </button>

            {/* دکمه دانلود آخرین بکاپ */}
            <button
              type="button"
              onClick={handleDownloadLatest}
              disabled={!lastBackup}
              className="rounded-2xl p-8 text-center transition-all"
              style={{
                background: lastBackup
                  ? 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)'
                  : '#cbd5e1',
                color: 'white',
                cursor: lastBackup ? 'pointer' : 'not-allowed',
                border: 'none',
                boxShadow: lastBackup ? '0 12px 32px rgba(14,165,233,0.4)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (lastBackup) e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 12 }}>⬇️</div>
              <p className="text-xl font-bold mb-2">
                ذخیره آخرین بکاپ
              </p>
              <p style={{ fontSize: 13, opacity: 0.9 }}>
                {lastBackup
                  ? 'دانلود برای فلش یا هاردیسک'
                  : 'ابتدا یک بکاپ بسازید'}
              </p>
            </button>
          </div>

          {/* پیام موفقیت */}
          {showSuccess && message && message.type === 'success' && (
            <div
              className="p-6 rounded-2xl text-center"
              style={{
                background: '#d1fae5',
                border: '2px solid #10b981',
                animation: 'fadeIn 0.3s ease-in',
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 8 }}>✅</div>
              <p className="font-bold text-lg mb-2" style={{ color: '#047857' }}>
                بکاپ با موفقیت ساخته شد!
              </p>
              <p className="text-sm mb-4" style={{ color: '#047857' }}>
                حالا می‌توانید آن را روی فلش یا هاردیسک ذخیره کنید
              </p>
              <button
                type="button"
                onClick={() => lastBackup && handleDownload(lastBackup.name)}
                className="px-6 py-3 rounded-xl text-white font-bold"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 6px 16px rgba(16,185,129,0.4)',
                }}
              >
                ⬇️ ذخیره روی کامپیوتر
              </button>
            </div>
          )}

          {/* پیام خطا */}
          {message && message.type === 'error' && (
            <div
              className="p-5 rounded-2xl text-center"
              style={{ background: '#fee2e2', border: '2px solid #dc2626' }}
            >
              <div style={{ fontSize: 48, marginBottom: 8 }}>❌</div>
              <p className="font-bold" style={{ color: '#dc2626' }}>
                {message.text}
              </p>
            </div>
          )}

          {/* راهنما */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e2e8f0' }}>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: '#0f172a' }}>
              📌 طریقه استفاده (گام به گام)
            </h2>
            <div className="space-y-4">
              <Step
                num={1}
                icon="💾"
                title="دکمه «گرفتن بکاپ جدید» را بزنید"
                desc="یک نسخه کامل از همه داده‌ها ساخته می‌شود"
                color="#10b981"
              />
              <Step
                num={2}
                icon="⬇️"
                title="دکمه «ذخیره روی کامپیوتر» یا «ذخیره آخرین بکاپ» را بزنید"
                desc="فایل در پوشه Downloads ذخیره می‌شود"
                color="#0ea5e9"
              />
              <Step
                num={3}
                icon="🔌"
                title="فایل را روی فلش یا هاردیسک کپی کنید"
                desc="از پوشه Downloads به فلش USB منتقل کنید"
                color="#f59e0b"
              />
              <Step
                num={4}
                icon="📅"
                title="این کار را هر هفته تکرار کنید"
                desc="حداقل یک بار در هفته، برای امنیت داده‌ها"
                color="#8b5cf6"
              />
            </div>
          </div>

          {/* لیست بکاپ‌ها */}
          {backups.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <h2 className="font-bold" style={{ color: '#0f172a' }}>
                  📋 همه بکاپ‌ها ({backups.length})
                </h2>
                <button
                  type="button"
                  onClick={loadBackups}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
                >
                  🔄 بروزرسانی
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>#</th>
                      <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>تاریخ</th>
                      <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>حجم</th>
                      <th className="text-right p-3 text-xs" style={{ color: '#64748b' }}>وضعیت</th>
                      <th className="text-left p-3 text-xs" style={{ color: '#64748b' }}>دانلود</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((b, i) => {
                      const isSafety = b.name.startsWith('safety-before-restore');
                      return (
                        <tr key={b.name} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td className="p-3 text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                          <td className="p-3">
                            <p className="text-xs font-bold" style={{ color: '#0f172a' }}>
                              {fmtDate(b.createdAt)}
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>
                              {b.name}
                            </p>
                          </td>
                          <td className="p-3 text-xs" style={{ color: '#475569' }}>
                            {b.sizeKB} KB
                          </td>
                          <td className="p-3">
                            {i === 0 ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: '#d1fae5', color: '#047857' }}
                              >
                                🟢 جدیدترین
                              </span>
                            ) : isSafety ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: '#fee2e2', color: '#dc2626' }}
                              >
                                ⚠️ اضطراری
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: '#f1f5f9', color: '#64748b' }}
                              >
                                بکاپ قدیمی
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-left">
                            <button
                              type="button"
                              onClick={() => handleDownload(b.name)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{
                                background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                            >
                              ⬇️ دانلود
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* راهنمای هاردیسک */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: '#f0f9ff', border: '2px solid #0ea5e9' }}
          >
            <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#0369a1' }}>
              💡 توصیه ما برای امنیت بیشتر
            </h2>
            <ul style={{ paddingRight: 20, lineHeight: 2, fontSize: 14, color: '#0369a1' }}>
              <li>هر هفته یک بکاپ تازه بگیرید</li>
              <li>فایل بکاپ را روی <strong>هاردیسک یا فلش USB</strong> کپی کنید</li>
              <li>هاردیسک را در جای دیگری (غیر از اتاق کامپیوتر) نگه دارید</li>
              <li>هر ماه یک نسخه را در جای امن دیگری بگذارید</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}

function Step({ num, icon, title, desc, color }: { num: number; icon: string; title: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
        style={{ width: 40, height: 40, background: color, fontSize: 16 }}
      >
        {num}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: 20 }}>{icon}</span>
          <p className="font-bold text-sm" style={{ color: '#0f172a' }}>{title}</p>
        </div>
        <p className="text-xs" style={{ color: '#64748b' }}>{desc}</p>
      </div>
    </div>
  );
}