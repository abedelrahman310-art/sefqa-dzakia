import { ReactNode } from 'react';
import { useAuth, UserRole } from './AuthProvider';
import { Redirect, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

interface RequireRoleProps {
  roles: UserRole[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, status, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">جاري التحميل...</div>;
  }

  if (status === 'unauthenticated' || !user) {
    return <Redirect to="/login" />;
  }

  if (!roles.includes(user.role)) {
    const roleLabels: Record<UserRole, string> = {
      operator: 'متعامل اقتصادي',
      authority: 'مصلحة متعاقدة',
      central_admin: 'إدارة مركزية',
    };
    const ownSpaceUrl = user.role === 'central_admin' ? '/central' : `/${user.role}`;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-destructive">403</h1>
          <h2 className="text-2xl font-bold">غير مصرح لك</h2>
          <p className="text-sm text-muted-foreground">
            لا تملك الصلاحيات الكافية للوصول إلى هذه الصفحة.
          </p>
        </div>

        <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs text-muted-foreground w-full">
          أنت مسجل حالياً بحساب: <strong className="text-foreground">{roleLabels[user.role] || user.role}</strong> ({user.email})
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button
            className="w-full text-xs rounded-xl"
            onClick={() => setLocation(ownSpaceUrl)}
          >
            الانتقال إلى مساحة عملك
          </Button>
          <Button
            variant="outline"
            className="w-full text-xs rounded-xl"
            onClick={logout}
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
