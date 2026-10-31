import { ReactNode } from 'react';
import { useAuth, UserRole } from './AuthProvider';
import { Redirect, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

interface RequireRoleProps {
  roles: UserRole[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, status, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">{t('common.loading')}</div>;
  }

  if (status === 'unauthenticated' || !user) {
    return <Redirect to="/login" />;
  }

  if (!roles.includes(user.role)) {
    const roleLabels: Record<UserRole, string> = {
      operator: t('login.demo_operator'),
      authority: t('login.demo_authority'),
      central_admin: t('login.demo_central'),
    };
    const ownSpaceUrl = user.role === 'central_admin' ? '/central' : `/${user.role}`;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center max-w-md mx-auto space-y-4" dir={dir}>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-destructive">403</h1>
          <h2 className="text-2xl font-bold">{t('auth.unauthorized_title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('auth.unauthorized_desc')}
          </p>
        </div>

        <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs text-muted-foreground w-full">
          {t('auth.logged_in_as')}{' '}
          <strong className="text-foreground">{roleLabels[user.role] || user.role}</strong> ({user.email})
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button
            className="w-full text-xs rounded-xl"
            onClick={() => setLocation(ownSpaceUrl)}
          >
            {t('auth.go_to_workspace')}
          </Button>
          <Button
            variant="outline"
            className="w-full text-xs rounded-xl"
            onClick={logout}
          >
            {t('common.logout')}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
