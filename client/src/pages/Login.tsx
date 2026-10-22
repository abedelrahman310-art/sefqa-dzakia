import React, { useState } from 'react';
import { useLocation, Link, Redirect } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

export function Login() {
  const { login, logout, user, status } = useAuth();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick fill buttons enabled on localhost, dev, or when explicitly allowed
  const isDemoLoginEnabled =
    import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' ||
    import.meta.env.DEV ||
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

  // 1. While loading session, show short loading state and do NOT show login form
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="text-sm font-medium text-muted-foreground animate-pulse">
          {t('login.loading')}
        </div>
      </div>
    );
  }

  // 2. Once authenticated, redirect immediately to the role's base portal without loop or flash
  if (status === 'authenticated' && user) {
    if (user.role === 'operator') {
      return <Redirect to="/operator" />;
    }
    if (user.role === 'authority') {
      return <Redirect to="/authority" />;
    }
    if (user.role === 'central_admin') {
      return <Redirect to="/central" />;
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 text-center">
        <Card className="w-full max-w-md p-6 space-y-4">
          <CardTitle className="text-destructive text-xl">دور غير معروف</CardTitle>
          <CardDescription>
            حسابك لا يملك دوراً معتمداً في المنصة. يرجى التواصل مع الإدارة.
          </CardDescription>
          <Button variant="outline" onClick={() => logout()}>
            تسجيل الخروج
          </Button>
        </Card>
      </div>
    );
  }

  const fillTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Safaqat@2026');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage =
          data.error ||
          data.detail ||
          (data.non_field_errors && data.non_field_errors[0]) ||
          (data.email && Array.isArray(data.email) ? data.email[0] : null) ||
          (data.password && Array.isArray(data.password) ? data.password[0] : null) ||
          t('login.error');
        throw new Error(errorMessage);
      }

      login(data.user, { access: data.access, refresh: data.refresh });
      
      if (data.user.role === 'operator') setLocation('/operator');
      else if (data.user.role === 'authority') setLocation('/authority');
      else if (data.user.role === 'central_admin') setLocation('/central');
      
    } catch (err: any) {
      setError(err.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper-50)] flex flex-col" dir="rtl">
      {/* ═══ Top Bar ═══ */}
      <header className="fixed top-0 start-0 end-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-[var(--color-border-subtle)]">
        {/* زر العودة للرئيسية */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--ink-700)] hover:text-[var(--official-700)] hover:bg-[var(--paper-100)] transition-all duration-150"
        >
          <ArrowRight className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
          <span>العودة للرئيسية</span>
        </Link>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </header>

      {/* ═══ البطاقة (وسط الصفحة) ═══ */}
      <main className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[var(--color-border-subtle)] p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">صفقات ذكية</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('login.title')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive rounded-md" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                autoComplete="current-password"
              />
            </div>

            {/* Quick-fill buttons displayed ONLY when demo login is explicitly enabled via environment */}
            {isDemoLoginEnabled && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-semibold mb-2">حسابات تجريبية للمعاينة (Demo):</p>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-1 truncate"
                    onClick={() => fillTestAccount('authority@safaqat.dz')}
                  >
                    المصلحة المتعاقدة
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-1 truncate"
                    onClick={() => fillTestAccount('operator@safaqat.dz')}
                  >
                    المتعامل الاقتصادي
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-1 truncate"
                    onClick={() => fillTestAccount('admin@safaqat.dz')}
                  >
                    الرقابة المركزية
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 text-center font-mono">
                  كلمة المرور لجميع الحسابات التجريبية: <span className="font-bold text-primary select-all">Safaqat@2026</span>
                </p>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? t('login.loading') : t('login.submit')}
            </Button>

            <div className="text-center text-xs text-muted-foreground space-y-1.5 pt-2">
              <div>{t('login.no_account')}</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link href="/register/operator" className="text-primary font-bold hover:underline">
                  {t('login.register_operator')}
                </Link>
                <span className="text-muted-foreground/40">•</span>
                <Link href="/register/authority" className="text-primary font-bold hover:underline">
                  {t('login.register_authority')}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
