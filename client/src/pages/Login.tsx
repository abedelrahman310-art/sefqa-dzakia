import React, { useState } from 'react';
import { useLocation, Link, Redirect } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function Login() {
  const { login, logout, user, status } = useAuth();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick fill buttons enabled strictly when VITE_ENABLE_DEMO_LOGIN is explicitly true
  const isDemoLoginEnabled = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

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
        throw new Error(data.error || t('login.error'));
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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">صفقات ذكية</CardTitle>
          <CardDescription>{t('login.title')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('login.loading') : t('login.submit')}
            </Button>
            <div className="text-center text-xs text-muted-foreground space-y-1.5 pt-1">
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
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
