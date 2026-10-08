'use client';

import { useEffect, useState } from 'react';
import { getSavedLanguage, type Language } from '@/lib/translations';

export default function LanguageToggle() {
  const [lang, setLang] = useState<Language>('fa');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLang(getSavedLanguage());
    setMounted(true);
  }, []);

  const changeLang = (newLang: Language) => {
    if (newLang === lang) return;
    localStorage.setItem('kawish_lang', newLang);
    window.location.reload();
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
      <button
        onClick={() => changeLang('fa')}
        className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all"
        style={{
          background: lang === 'fa' ? '#fff' : 'transparent',
          color: lang === 'fa' ? '#1d4ed8' : '#64748b',
          boxShadow: lang === 'fa' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          cursor: 'pointer',
          fontFamily: 'Vazirmatn, sans-serif',
        }}
      >
        فارسی
      </button>
      <button
        onClick={() => changeLang('en')}
        className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all"
        style={{
          background: lang === 'en' ? '#fff' : 'transparent',
          color: lang === 'en' ? '#1d4ed8' : '#64748b',
          boxShadow: lang === 'en' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          cursor: 'pointer',
        }}
      >
        EN
      </button>
    </div>
  );
}