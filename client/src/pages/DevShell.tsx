import { useI18n } from '@/i18n';
import { AppShell, NavItem } from '@/components/layout/AppShell';
import { LogOut, Home, Inbox, Settings, User, FileText, Activity } from 'lucide-react';

export function DevShell() {
  const { t } = useI18n();

  const navItems: NavItem[] = [
    { id: '1', labelKey: 'dev.item1', href: '/dev/shell', icon: <Home className="w-4 h-4" /> },
    { id: '2', labelKey: 'dev.item2', href: '/dev/shell/2', icon: <Inbox className="w-4 h-4" /> },
    { id: '3', labelKey: 'dev.item3', href: '/dev/shell/3', icon: <FileText className="w-4 h-4" /> },
    { id: '4', labelKey: 'dev.item4', href: '/dev/shell/4', icon: <Activity className="w-4 h-4" /> },
    { id: '5', labelKey: 'dev.item5', href: '/dev/shell/5', icon: <User className="w-4 h-4" /> },
    { id: '6', labelKey: 'dev.item6', href: '/dev/shell/6', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <AppShell
      navItems={navItems}
      footerItem={{
        id: 'logout',
        labelKey: 'nav.logout',
        icon: <LogOut className="w-4 h-4" />,
        onClick: () => alert('Logout clicked'),
      }}
      header={<h1 className="text-xl font-bold">{t('dev.title')}</h1>}
    >
      <div className="space-y-4">
        <div className="p-6 bg-card rounded-lg border border-border shadow-sm">
          <h2 className="text-2xl font-bold mb-2">مرحباً بك في صفحة التطوير</h2>
          <p className="text-muted-foreground">
            هذه الصفحة تظهر فقط في وضع التطوير لاختبار غلاف التطبيق (AppShell) والترجمة ودعم الاتجاهين.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
