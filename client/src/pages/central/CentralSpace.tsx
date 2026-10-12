import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppShell, NavItem } from '@/components/layout/AppShell';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  AlertTriangle,
  BarChart,
  Shield,
  LogOut,
  Building,
} from 'lucide-react';
import { Route, Switch } from 'wouter';
import { CentralOverview } from './CentralOverview';
import { CentralSectionView } from './CentralSectionView';
import { PortalNotFound } from '@/components/common/PortalNotFound';

export function CentralSpace() {
  const { t } = useI18n();
  const { logout, user } = useAuth();

  const orgName = user?.organizationName || user?.displayName || t('central.topbar.default_org');
  const avatarInitials = orgName.trim().slice(0, 2);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      labelKey: 'nav.central.dashboard',
      href: '/central/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'authorities',
      labelKey: 'nav.central.authorities',
      href: '/central/authorities',
      icon: <Building className="w-4 h-4" />,
      badge: t('badge.unavailable'),
    },
    {
      id: 'operators',
      labelKey: 'nav.central.operators',
      href: '/central/operators',
      icon: <Users className="w-4 h-4" />,
      badge: t('badge.unavailable'),
    },
    {
      id: 'deals',
      labelKey: 'nav.central.deals',
      href: '/central/deals',
      icon: <Briefcase className="w-4 h-4" />,
      badge: t('badge.unavailable'),
    },
    {
      id: 'appeals',
      labelKey: 'nav.central.appeals',
      href: '/central/appeals',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: t('badge.unavailable'),
    },
    {
      id: 'reports',
      labelKey: 'nav.central.reports',
      href: '/central/reports',
      icon: <BarChart className="w-4 h-4" />,
      badge: t('badge.unavailable'),
    },
    {
      id: 'permissions',
      labelKey: 'nav.central.permissions',
      href: '/central/permissions',
      icon: <Shield className="w-4 h-4" />,
      badge: t('badge.unavailable'),
    },
  ];

  return (
    <AppShell
      navItems={navItems}
      footerItem={{
        id: 'logout',
        labelKey: 'nav.logout',
        icon: <LogOut className="w-4 h-4" />,
        onClick: logout,
      }}
      header={
        <div className="w-full flex items-center justify-between gap-4 py-2">
          {/* Identity Card matching .dealer from reference design */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold-500 text-navy-900 font-extrabold flex items-center justify-center text-sm shadow-sm flex-none">
              {avatarInitials}
            </div>
            <div className="leading-tight min-w-0">
              <span className="text-xs text-muted-foreground block">
                {t('central.topbar.account_label')}
              </span>
              <strong className="text-sm font-bold text-navy-900 line-clamp-1" title={orgName}>
                {orgName}
              </strong>
            </div>
          </div>

          {/* Status Pills */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-navy-50 text-navy-800 border border-navy-100 font-medium">
              {t('central.topbar.pill_supervision')}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gold-50 text-gold-900 border border-gold-200/80 font-medium">
              {t('central.topbar.pill_stage')}
            </span>
          </div>
        </div>
      }
    >
      <Switch>
        <Route path="/central/dashboard" component={CentralOverview} />
        <Route path="/central/authorities">
          {() => (
            <CentralSectionView
              titleKey="nav.central.authorities"
              descKey="central.section.desc.authorities"
              icon={<Building className="w-5 h-5 text-navy-800" />}
            />
          )}
        </Route>
        <Route path="/central/operators">
          {() => (
            <CentralSectionView
              titleKey="nav.central.operators"
              descKey="central.section.desc.operators"
              icon={<Users className="w-5 h-5 text-navy-800" />}
            />
          )}
        </Route>
        <Route path="/central/deals">
          {() => (
            <CentralSectionView
              titleKey="nav.central.deals"
              descKey="central.section.desc.deals"
              icon={<Briefcase className="w-5 h-5 text-navy-800" />}
            />
          )}
        </Route>
        <Route path="/central/appeals">
          {() => (
            <CentralSectionView
              titleKey="nav.central.appeals"
              descKey="central.section.desc.appeals"
              icon={<AlertTriangle className="w-5 h-5 text-navy-800" />}
            />
          )}
        </Route>
        <Route path="/central/reports">
          {() => (
            <CentralSectionView
              titleKey="nav.central.reports"
              descKey="central.section.desc.reports"
              icon={<BarChart className="w-5 h-5 text-navy-800" />}
            />
          )}
        </Route>
        <Route path="/central/permissions">
          {() => (
            <CentralSectionView
              titleKey="nav.central.permissions"
              descKey="central.section.desc.permissions"
              icon={<Shield className="w-5 h-5 text-navy-800" />}
            />
          )}
        </Route>
        <Route path="/central/overview" component={CentralOverview} />
        <Route path="/central" component={CentralOverview} />
        <Route>
          <PortalNotFound basePath="/central" baseTitle="الرئيسية المركزية" />
        </Route>
      </Switch>
    </AppShell>
  );
}
