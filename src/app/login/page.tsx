'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LOGO_URL =
  'https://i.ibb.co/5WVzgSt6/C7-B9-CCE3-0367-42-A6-899-D-91-EE83-D25485.png';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('kawish_user');
    if (saved) {
      try {
        JSON.parse(saved);
        router.replace('/dashboard');
        return;
      } catch {
        sessionStorage.removeItem('kawish_user');
      }
    }
    setChecking(false);
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'نام کاربری یا رمز عبور نادرست است');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('kawish_user', JSON.stringify(json.data));
      router.replace('/dashboard');
    } catch (err: any) {
      setError('خطا در ارتباط با سرور');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)',
          fontFamily: 'Vazirmatn, sans-serif',
          color: 'white',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
          <p style={{ fontSize: 16 }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 50%, #38bdf8 100%)',
        fontFamily: 'Vazirmatn, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -150,
          right: -150,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -200,
          left: -200,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: 'white',
          borderRadius: 28,
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          width: '100%',
          maxWidth: 440,
          padding: '40px 36px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* لوگو */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div
            style={{
              width: 120,
              height: 120,
              margin: '0 auto',
              borderRadius: '50%',
              background: '#f0f9ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #0ea5e9',
              boxShadow: '0 8px 24px rgba(14,165,233,0.25)',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="Kawish Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: 8,
              }}
            />
          </div>
        </div>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#0f172a',
            marginTop: 20,
            marginBottom: 4,
          }}
        >
          مرکز آموزشی کاوش
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: '#0ea5e9',
            fontSize: 12,
            marginBottom: 28,
            fontWeight: 'bold',
            letterSpacing: 1,
          }}
        >
          KAWISH EDUCATIONAL CENTER
        </p>

        <div
          style={{
            textAlign: 'center',
            marginBottom: 24,
            paddingTop: 20,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#0f172a',
              marginBottom: 4,
            }}
          >
            ورود به سیستم
          </h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            برای دسترسی، اطلاعات خود را وارد کنید
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 'bold',
                color: '#334155',
                marginBottom: 8,
              }}
            >
              👤 نام کاربری
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="نام کاربری خود را وارد کنید"
              autoComplete="username"
              autoFocus
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                background: '#f8fafc',
                color: '#0f172a',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0ea5e9')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 'bold',
                color: '#334155',
                marginBottom: 8,
              }}
            >
              🔒 رمز عبور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  paddingLeft: 44,
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  background: '#f8fafc',
                  color: '#0f172a',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0ea5e9')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 6,
                  borderRadius: 8,
                }}
                title={showPassword ? 'پنهان کردن' : 'نمایش رمز'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: 12,
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 16,
                textAlign: 'center',
                fontWeight: 'bold',
                border: '1px solid #fecaca',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px 0',
              borderRadius: 14,
              border: 'none',
              color: 'white',
              fontSize: 15,
              fontWeight: 'bold',
              background: loading
                ? '#94a3b8'
                : 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: loading ? 'none' : '0 10px 24px rgba(14,165,233,0.4)',
              transition: 'all 0.2s',
              fontFamily: 'Vazirmatn, sans-serif',
            }}
          >
            {loading ? '⏳ در حال ورود...' : 'ورود به سیستم'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#cbd5e1',
            marginTop: 24,
          }}
        >
          © ۱۴۰۴ مرکز آموزشی کاوش
        </p>
      </div>
    </div>
  );
}