export type Role = 'ADMIN' | 'FINANCE';

// این جدول مشخص می‌کند هر آدرس کدام نقش‌ها اجازه دارند
export const ROLE_ROUTES: Record<string, Role[]> = {
  '/dashboard': ['ADMIN', 'FINANCE'],
  '/reports': ['ADMIN', 'FINANCE'],
  '/fees': ['ADMIN', 'FINANCE'],
  '/salaries': ['ADMIN', 'FINANCE'],
  '/emp-salaries': ['ADMIN', 'FINANCE'],
  '/expenses': ['ADMIN', 'FINANCE'],
  '/classes': ['ADMIN'],
  '/students': ['ADMIN'],
  '/teachers': ['ADMIN'],
  '/employees': ['ADMIN'],
  '/subjects': ['ADMIN'],
  '/schedule': ['ADMIN'],
  '/attendance': ['ADMIN'],
  '/enrollments': ['ADMIN'],
  '/grades': ['ADMIN'],
  '/certificates': ['ADMIN'],
};

export function getCurrentUser(): any | null {
  if (typeof window === 'undefined') return null;
  const saved = sessionStorage.getItem('kawish_user');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function hasAccess(role: string, pathname: string): boolean {
  // چک آدرس دقیق
  if (ROLE_ROUTES[pathname]) {
    return ROLE_ROUTES[pathname].includes(role as Role);
  }
  // چک آدرس‌های تودرتو مثل /students/123 یا /certificates/abc/print
  for (const key of Object.keys(ROLE_ROUTES)) {
    if (pathname.startsWith(key + '/')) {
      return ROLE_ROUTES[key].includes(role as Role);
    }
  }
  // اگر آدرس در جدول نبود، آزاد است (مثل /login)
  return true;
}

export function defaultHomeFor(_role: string): string {
  return '/dashboard';
}

export function logout() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('kawish_user');
}