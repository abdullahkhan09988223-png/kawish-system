'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { logAction } from '@/lib/activity-log';

type Backup = {
  name: string;
  size: number;
  sizeKB: number;
  createdAt: string;
  modifiedAt: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // مودال بازیابی
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [restoreStep, setRestoreStep] = useState<'confirm' | 'progress' | 'done'>('confirm');
  const [restoreResult, setRestoreResult] = useState<any>(null);

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
      if (res.ok) setBackups((await res.json()).data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadBackups(); }, [user]);

  const handleCreate = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در بکاپ‌گیری');

      await logAction({
        action: 'BACKUP',
        tableName: 'backup',
        recordName: json.data.name,
        details: 'ساخت بکاپ دستی (' + json.data.sizeKB + ' KB)',
      });

      setMessage({
        type: 'success',
        text: `✅ بکاپ با موفقیت ساخته شد: ${json.data.name} (${json.data.sizeKB} KB)`,
      });
      await loadBackups();
    } catch (err: any) {
      setMessage({ type: 'error', text: '❌ ' + err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (name: string) => {
    window.open('/api/backup/' + encodeURIComponent(name), '_blank');
  };

  const handleDelete = async (name: string) => {
    if (!confirm('حذف بکاپ «' + name + '»؟')) return;
    try {
      const res = await fetch('/api/backup/' + encodeURIComponent(name), { method: 'DELETE' });
      if (!res.ok) throw new Error('خطا در حذف');
      setMessage({ type: 'success', text: '🗑️ بکاپ حذف شد' });
      await loadBackups();
    } catch (err: any) {
      setMessage({ type: 'error', text: '❌ ' + err.message });
    }
  };

  const openRestoreModal = (b: Backup) => {
    setRestoreTarget(b);
    setConfirmText('');
    setRestoreStep('confirm');
    setRestoreResult(null);
  };

  const closeRestoreModal = () => {
    if (restoreStep === 'progress') return;
    setRestoreTarget(null);
    setConfirmText('');
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    if (confirmText !== 'بازیابی') {
      alert('لطفاً کلمه «بازیابی» را دقیقاً تایپ کنید');
      return;
    }

    setRestoreStep('progress');

    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: restoreTarget.name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'خطا در بازیابی');

      await logAction({
        action: 'BACKUP',
        tableName: 'backup',
        recordName: restoreTarget.name,
        details: 'بازیابی از بکاپ — بکاپ اضطراری: ' + json.safetyBackup,
      });

      setRestoreResult(json);
      setRestoreStep('done');
      await loadBackups();
    } catch (err: any) {
      setMessage({ type: 'error', text: '❌ خطا در بازیابی: ' + err.message });
      setRestoreStep('confirm');
    }
  };

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('fa-IR');
    } catch {
      return iso;
    }
  };

  if (!user) return null;

  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <Sidebar active="settings" />

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
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
              fontSize: 14,
            }}
          >
            {user.name ? user.name[0] : '?'}
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>
              ⚙️ تنظیمات سیستم
            </h1>
            <p style={{ color: '#64748b' }}>پشتیبان‌گیری، بازیابی و مدیریت داده‌ها</p>
          </div>

          {/* آمار */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 40, height: 40, background: '#f0f9ff', fontSize: 20 }}
                >
                  💾
                </div>
              </div>
              <p className="text-xs" style={{ color: '#64748b' }}>تعداد بکاپ‌ها</p>
              <p className="text-2xl font-bold" style={{ color: '#0ea5e9' }}>{backups.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 40, height: 40, background: '#d1fae5', fontSize: 20 }}
                >
                  📦
                </div>
              </div>
              <p className="text-xs" style={{ color: '#64748b' }}>حجم کل</p>
              <p className="text-2xl font-bold" style={{ color: '#10b981' }}>
                {Math.round(totalSize / 1024)} <span className="text-sm" style={{ color: '#94a3b8' }}>KB</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 40, height: 40, background: '#fef3c7', fontSize: 20 }}
                >
                  🕐
                </div>
              </div>
              <p className="text-xs" style={{ color: '#64748b' }}>آخرین بکاپ</p>
              <p className="text-sm font-bold" style={{ color: '#b45309' }}>
                {backups[0] ? fmtDate(backups[0].createdAt) : '—'}
              </p>
            </div>
          </div>

          {/* پیام */}
          {message && (
            <div
              className="p-4 rounded-xl text-sm font-bold"
              style={{
                background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: message.type === 'success' ? '#047857' : '#dc2626',
                border: '1px solid ' + (message.type === 'success' ? '#a7f3d0' : '#fecaca'),
              }}
            >
              {message.text}
            </div>
          )}

          {/* دکمه بکاپ */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: '2px solid #0ea5e9', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-bold text-lg mb-1" style={{ color: '#0f172a' }}>
                  🛡️ پشتیبان‌گیری از دیتابیس
                </h2>
                <p className="text-sm" style={{ color: '#0369a1' }}>
                  یک نسخه کامل از داده‌ها ذخیره می‌شود. در صورت خرابی، می‌توانید بازیابی کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="px-8 py-4 rounded-xl text-white font-bold text-base flex items-center gap-2"
                style={{
                  background: creating ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                  cursor: creating ? 'wait' : 'pointer',
                  border: 'none',
                  boxShadow: creating ? 'none' : '0 8px 24px rgba(16,185,129,0.35)',
                  fontSize: 16,
                }}
              >
                {creating ? '⏳ در حال ساخت...' : '💾 پشتیبان‌گیری الان'}
              </button>
            </div>
          </div>

          {/* راهنما */}
          <div
            className="p-4 rounded-xl text-xs"
            style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}
          >
            <p style={{ fontWeight: 'bold', marginBottom: 6 }}>📌 نکات مهم:</p>
            <ul style={{ paddingRight: 20, lineHeight: 1.9 }}>
              <li>بکاپ‌ها در پوشه <code style={{ background: '#fde68a', padding: '2px 6px', borderRadius: 4 }}>backups/</code> ذخیره می‌شوند</li>
              <li>روی هر بکاپ می‌توانید کلیک کنید تا دانلود شود (برای نگه‌داری در فلش یا فضای ابری)</li>
              <li>
                <strong>بازیابی:</strong> با یک کلیک، همه داده‌ها به آن تاریخ برمی‌گردند
              </li>
              <li>قبل از بازیابی، سیستم خودکار یک بکاپ اضطراری می‌سازد</li>
              <li>هر روز یک بکاپ تازه بگیرید — مطمئن‌ترین راه</li>
            </ul>
          </div>

          {/* لیست بکاپ‌ها */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div
              className="p-4 flex items-center justify-between flex-wrap gap-3"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <h2 className="font-bold" style={{ color: '#0f172a' }}>
                📁 لیست بکاپ‌ها
              </h2>
              <button
                type="button"
                onClick={loadBackups}
                className="px-4 py-2 rounded-lg text-xs font-bold"
                style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
              >
                🔄 بروزرسانی
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>#</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>نام فایل</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>حجم</th>
                    <th className="text-right p-4 text-xs" style={{ color: '#64748b' }}>تاریخ ساخت</th>
                    <th className="text-left p-4 text-xs" style={{ color: '#64748b' }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center" style={{ color: '#94a3b8' }}>
                        ⏳ در حال بارگذاری...
                      </td>
                    </tr>
                  ) : backups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                        <p style={{ color: '#94a3b8', marginBottom: 12 }}>
                          هنوز بکاپی ساخته نشده
                        </p>
                        <button
                          type="button"
                          onClick={handleCreate}
                          disabled={creating}
                          className="px-5 py-2.5 rounded-xl text-white font-bold text-sm"
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                            cursor: 'pointer',
                            border: 'none',
                          }}
                        >
                          + اولین بکاپ را بساز
                        </button>
                      </td>
                    </tr>
                  ) : backups.map((b, i) => {
                    const isSafety = b.name.startsWith('safety-before-restore');
                    return (
                      <tr key={b.name} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td className="p-4 text-xs" style={{ color: '#94a3b8' }}>{i + 1}</td>
                        <td className="p-4">
                          <p className="text-xs font-mono font-bold" style={{ color: '#0f172a' }}>
                            {b.name}
                          </p>
                          {isSafety && (
                            <span
                              className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: '#fee2e2', color: '#dc2626' }}
                            >
                              ⚠️ بکاپ اضطراری
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#475569' }}>
                          {b.sizeKB} KB
                        </td>
                        <td className="p-4 text-xs" style={{ color: '#64748b' }}>
                          {fmtDate(b.createdAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleDownload(b.name)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{
                                background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                              title="دانلود"
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              onClick={() => openRestoreModal(b)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                                cursor: 'pointer',
                                border: 'none',
                              }}
                              title="بازیابی از این بکاپ"
                            >
                              🔄 بازیابی
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(b.name)}
                              className="p-2 rounded-lg"
                              style={{ color: '#dc2626', cursor: 'pointer', border: 'none', background: 'transparent' }}
                              title="حذف"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* مودال بازیابی */}
      {restoreTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
            {/* هدر */}
            <div
              className="flex items-center justify-between p-5"
              style={{
                borderBottom: '3px solid #f59e0b',
                background: restoreStep === 'done' ? '#d1fae5' : '#fef3c7',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{
                    width: 44, height: 44,
                    background: restoreStep === 'done' ? '#10b981' : '#f59e0b',
                    fontSize: 22,
                  }}
                >
                  {restoreStep === 'done' ? '✅' : '🔄'}
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0f172a' }}>
                    {restoreStep === 'done' ? 'بازیابی موفق' : 'بازیابی از بکاپ'}
                  </h3>
                  <p className="text-xs font-mono" style={{ color: '#64748b' }}>
                    {restoreTarget.name}
                  </p>
                </div>
              </div>
              {restoreStep !== 'progress' && (
                <button
                  type="button"
                  onClick={closeRestoreModal}
                  className="p-2 rounded-lg text-xl"
                  style={{ color: '#94a3b8', cursor: 'pointer', border: 'none', background: 'transparent' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {restoreStep === 'confirm' && (
                <>
                  <div
                    className="p-4 rounded-xl text-sm"
                    style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                  >
                    <p style={{ fontWeight: 'bold', marginBottom: 8 }}>⚠️ توجه کنید!</p>
                    <ul style={{ paddingRight: 20, lineHeight: 1.9, fontSize: 13 }}>
                      <li>تمام داده‌های فعلی <strong>پاک</strong> و با این بکاپ <strong>جایگزین</strong> می‌شوند</li>
                      <li>اطلاعات بعد از تاریخ این بکاپ از دست می‌رود</li>
                      <li><strong>قبل از بازیابی، سیستم خودکار یک بکاپ اضطراری می‌سازد</strong></li>
                    </ul>
                  </div>

                  <div
                    className="p-4 rounded-xl text-xs space-y-2"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <div className="flex justify-between">
                      <span style={{ color: '#64748b' }}>نام فایل:</span>
                      <span className="font-mono font-bold" style={{ color: '#0f172a' }}>
                        {restoreTarget.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#64748b' }}>حجم:</span>
                      <span className="font-bold" style={{ color: '#0f172a' }}>
                        {restoreTarget.sizeKB} KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#64748b' }}>تاریخ:</span>
                      <span className="font-bold" style={{ color: '#0f172a' }}>
                        {fmtDate(restoreTarget.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: '#334155' }}>
                      برای تأیید، کلمه <span style={{ color: '#dc2626' }}>بازیابی</span> را تایپ کنید:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="بازیابی"
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl border-2 text-center text-lg outline-none font-bold"
                      style={{
                        borderColor: confirmText === 'بازیابی' ? '#10b981' : '#e2e8f0',
                        background: confirmText === 'بازیابی' ? '#f0fdf4' : 'white',
                        color: confirmText === 'بازیابی' ? '#047857' : '#0f172a',
                      }}
                    />
                  </div>
                </>
              )}

              {restoreStep === 'progress' && (
                <div className="p-8 text-center">
                  <div style={{ fontSize: 64, marginBottom: 16 }} className="animate-pulse">⏳</div>
                  <p className="font-bold text-lg mb-2" style={{ color: '#0f172a' }}>
                    در حال بازیابی...
                  </p>
                  <p className="text-sm" style={{ color: '#64748b', marginBottom: 20 }}>
                    لطفاً صفحه را نبندید و صبر کنید. این کار ممکن است ۱۰ تا ۳۰ ثانیه طول بکشد.
                  </p>
                  <div className="space-y-2 text-xs text-right" style={{ color: '#64748b' }}>
                    <p>✅ ساخت بکاپ اضطراری</p>
                    <p>⏳ پاک کردن داده‌های فعلی</p>
                    <p>⏳ بازیابی از بکاپ</p>
                  </div>
                </div>
              )}

              {restoreStep === 'done' && restoreResult && (
                <>
                  <div className="p-6 rounded-xl text-center" style={{ background: '#d1fae5' }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                    <p className="font-bold text-lg" style={{ color: '#047857', marginBottom: 6 }}>
                      بازیابی با موفقیت انجام شد
                    </p>
                    <p className="text-xs" style={{ color: '#047857' }}>
                      همه داده‌ها به این بکاپ بازگشتند
                    </p>
                  </div>

                  <div
                    className="p-4 rounded-xl text-xs space-y-2"
                    style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
                  >
                    <div className="flex justify-between">
                      <span style={{ color: '#0369a1' }}>بازیابی از:</span>
                      <span className="font-mono font-bold" style={{ color: '#0369a1' }}>
                        {restoreResult.restoredFrom}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#0369a1' }}>بکاپ اضطراری:</span>
                      <span className="font-mono font-bold" style={{ color: '#0369a1' }}>
                        {restoreResult.safetyBackup}
                      </span>
                    </div>
                    <p style={{ marginTop: 8, fontSize: 11, color: '#0369a1', lineHeight: 1.7 }}>
                      💡 اگر بازیابی اشتباه بود، می‌توانید از فایل «بکاپ اضطراری» بالا برگردید.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeRestoreModal();
                      window.location.reload();
                    }}
                    className="w-full py-3 rounded-xl text-white font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    ✓ متوجه شدم، بارگذاری مجدد
                  </button>
                </>
              )}
            </div>

            {restoreStep === 'confirm' && (
              <div
                className="flex justify-end gap-3 p-5"
                style={{
                  borderTop: '1px solid #f1f5f9',
                  background: '#f8fafc',
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                }}
              >
                <button
                  type="button"
                  onClick={closeRestoreModal}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: '#f1f5f9', color: '#475569', cursor: 'pointer', border: 'none' }}
                >
                  لغو
                </button>
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={confirmText !== 'بازیابی'}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{
                    background: confirmText === 'بازیابی'
                      ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
                      : '#94a3b8',
                    cursor: confirmText === 'بازیابی' ? 'pointer' : 'not-allowed',
                    border: 'none',
                    boxShadow: confirmText === 'بازیابی' ? '0 6px 16px rgba(220,38,38,0.35)' : 'none',
                  }}
                >
                  🔄 بازیابی کن
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}