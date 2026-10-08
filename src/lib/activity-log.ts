export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PAYMENT'
  | 'BACKUP';

type LogParams = {
  action: ActivityAction;
  tableName: string;
  recordId?: string | null;
  recordName?: string | null;
  details?: string | null;
};

/**
 * ثبت یک فعالیت در سیستم لاگ
 * به صورت خودکار user info را از session می‌گیرد
 */
export async function logAction(params: LogParams): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const saved =
      localStorage.getItem('kawish_user') ||
      sessionStorage.getItem('kawish_user');

    if (!saved) return;

    const user = JSON.parse(saved);

    await fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: params.action,
        tableName: params.tableName,
        recordId: params.recordId || null,
        recordName: params.recordName || null,
        details: params.details || null,
      }),
    });
  } catch (e) {
    // خطا در لاگ نباید عملیات اصلی را متوقف کند
    console.error('Activity log error:', e);
  }
}