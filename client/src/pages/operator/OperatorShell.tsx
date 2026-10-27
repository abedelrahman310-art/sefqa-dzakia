import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import OperatorTopBar from '@/components/layout/OperatorTopBar';
import { LucideIcon } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import './operator.css';

export type OperatorNavGroup = 'home' | 'opportunities' | 'activity' | 'system';

export interface OperatorNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  group: OperatorNavGroup;
}

export interface OperatorShellProps {
  navItems: OperatorNavItem[];
  mobileTitle?: string;
  children: React.ReactNode;
}

const GROUP_LABELS: Record<OperatorNavGroup, string> = {
  home: 'الرئيسية',
  opportunities: 'الفرص',
  activity: 'مشاركاتي',
  system: 'النظام',
};

const GROUP_ORDER: OperatorNavGroup[] = ['home', 'opportunities', 'activity', 'system'];

const EXTRA_ROUTE_LABELS: Array<[string, string]> = [
  ['/operator/profile', 'ملف المؤسسة'],
  ['/operator/notifications', 'الإشعارات'],
  ['/operator/archive', 'الأرشيف'],
  ['/operator/opening-sessions', 'جلسات فتح الأظرفة'],
  ['/operator/opportunities', 'الإعلانات وفرص الصفقات'],
];

function routeLabel(location: string, navItems: OperatorNavItem[]) {
  const matches = [
    ...navItems.map((item) => [item.href, item.label] as [string, string]),
    ...EXTRA_ROUTE_LABELS,
  ].sort((a, b) => b[0].length - a[0].length);

  const match = matches.find(
    ([href]) => location === href || location.startsWith(`${href}/`),
  );

  return match?.[1] || 'مساحة العمل';
}

export function OperatorShell({
  navItems,
  mobileTitle = 'صفقات ذكية · المتعامل الاقتصادي',
  children,
}: OperatorShellProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const orgName =
    (user?.organizationName || '').trim() ||
    (user?.displayName || '').trim() ||
    'المؤسسة';
  const initial = orgName.charAt(0) || 'م';
  const crumb = routeLabel(location, navItems);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    setMobileOpen(false);
  }, [location]);

  const sidebarContent = (onNavigate?: () => void) => (
    <>
      <div className="op-brand">
        <div className="op-brand-logo">
          <Logo size={44} />
        </div>
        <div className="op-brand-text">
          <h1>صفقات ذكية</h1>
          <span>بوابة المتعامل الاقتصادي</span>
        </div>
      </div>

      <nav className="op-nav" aria-label="التنقل الرئيسي">
        {GROUP_ORDER.map((group) => {
          const groupItems = navItems.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;

          return (
            <div key={group}>
              <span className="op-nav-label">{GROUP_LABELS[group]}</span>
              {groupItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={item.isActive ? 'page' : undefined}
                      className={`op-nav-item${item.isActive ? ' active' : ''}`}
                    >
                      <Icon strokeWidth={1.8} aria-hidden="true" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="op-sidebar-foot">
        <div className="op-user-chip">
          <div className="op-avatar" aria-hidden="true">
            {initial}
          </div>
          <div className="op-user-info">
            <strong title={orgName}>{orgName}</strong>
            <span>متعامل اقتصادي</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="operator-app">
      <aside className="op-sidebar op-sidebar-desktop" aria-label="القائمة الجانبية">
        {sidebarContent()}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="start" className="op-sheet" aria-label={mobileTitle}>
          <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
          {sidebarContent(() => setMobileOpen(false))}
        </SheetContent>
      </Sheet>

      <div className="op-main">
        <OperatorTopBar
          breadcrumb={crumb}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main ref={mainRef} className="op-scroll">
          <div className="op-content">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default OperatorShell;
