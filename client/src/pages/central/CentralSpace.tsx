import { useEffect, lazy, Suspense } from 'react';
import { useI18n } from '@/i18n';
import i18n from '@/lib/i18n';
import { Route, Switch, useRoute, useLocation } from 'wouter';
import { PortalNotFound } from '@/components/common/PortalNotFound';
import CentralAdminTopBar from '@/components/layout/CentralAdminTopBar';
import { PortalShell } from '@/components/layout/PortalShell';
import { PortalSidebar } from '@/components/layout/PortalSidebar';

const CentralOverview = lazy(() => import('./CentralOverview').then((m) => ({ default: m.CentralOverview })));
const CentralMapView = lazy(() => import('./CentralMapView').then((m) => ({ default: m.CentralMapView })));
const CentralDeals = lazy(() => import('./CentralDeals').then((m) => ({ default: m.CentralDeals })));
const CentralAuthorities = lazy(() => import('./CentralAuthorities').then((m) => ({ default: m.CentralAuthorities })));
const CentralOperators = lazy(() => import('./CentralOperators').then((m) => ({ default: m.CentralOperators })));
const CentralAppeals = lazy(() => import('./CentralAppeals').then((m) => ({ default: m.CentralAppeals })));
const CentralReports = lazy(() => import('./CentralReports').then((m) => ({ default: m.CentralReports })));
const CentralPermissions = lazy(() => import('./CentralPermissions').then((m) => ({ default: m.CentralPermissions })));
const CentralIntegrityView = lazy(() => import('./CentralIntegrityView').then((m) => ({ default: m.CentralIntegrityView })));
const CentralInjunctions = lazy(() => import('./CentralInjunctions').then((m) => ({ default: m.CentralInjunctions })));
const CentralPlatformHealth = lazy(() => import('./CentralPlatformHealth').then((m) => ({ default: m.CentralPlatformHealth })));
const OperatorNotificationsView = lazy(() => import('@/pages/operator/OperatorNotificationsView').then((m) => ({ default: m.OperatorNotificationsView })));

function PortalLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
      <div className="size-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
    </div>
  );
}
import {
  LayoutDashboard,
  Map as MapIcon,
  Building,
  Users,
  Briefcase,
  AlertTriangle,
  BarChart,
  Shield,
  Gavel,
  Activity,
} from 'lucide-react';

export function CentralSpace() {
  const { t, lang } = useI18n();
  const [location] = useLocation();

  useEffect(() => {
    document.title = i18n.t('common.central_mobile_title');
  }, [lang]);

  // Route matchers for active highlighting
  const [isDashboardActive] = useRoute('/central/dashboard');
  const [isOverviewActive] = useRoute('/central/overview');
  const [isCentralRootActive] = useRoute('/central');
  const [isMapActive] = useRoute('/central/map');
  const [isAuthoritiesActive] = useRoute('/central/authorities');
  const [isOperatorsActive] = useRoute('/central/operators');
  const [isDealsActive] = useRoute('/central/deals');
  const [isAppealsActive] = useRoute('/central/appeals');
  const [isReportsActive] = useRoute('/central/reports');
  const [isPermissionsActive] = useRoute('/central/permissions');
  const [isIntegrityActive] = useRoute('/central/integrity');
  const [isInjunctionsActive] = useRoute('/central/injunctions');
  const [isPlatformHealthActive] = useRoute('/central/platform-health');
  const [isHealthActive] = useRoute('/central/health');

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.central.dashboard'),
      href: '/central/dashboard',
      icon: LayoutDashboard,
      isActive: isDashboardActive || isOverviewActive || isCentralRootActive,
    },
    {
      id: 'map',
      label: t('nav.central.map'),
      href: '/central/map',
      icon: MapIcon,
      isActive: isMapActive,
    },
    {
      id: 'authorities',
      label: t('nav.central.authorities'),
      href: '/central/authorities',
      icon: Building,
      isActive: isAuthoritiesActive,
    },
    {
      id: 'operators',
      label: t('nav.central.operators'),
      href: '/central/operators',
      icon: Users,
      isActive: isOperatorsActive,
    },
    {
      id: 'deals',
      label: t('nav.central.deals'),
      href: '/central/deals',
      icon: Briefcase,
      isActive: isDealsActive,
    },
    {
      id: 'appeals',
      label: t('nav.central.appeals'),
      href: '/central/appeals',
      icon: AlertTriangle,
      isActive: isAppealsActive,
    },
    {
      id: 'reports',
      label: t('nav.central.reports'),
      href: '/central/reports',
      icon: BarChart,
      isActive: isReportsActive,
    },
    {
      id: 'injunctions',
      label: t('central.injunctions.title'),
      href: '/central/injunctions',
      icon: Gavel,
      isActive: isInjunctionsActive,
    },
    {
      id: 'integrity',
      label: t('central.integrity.nav_label'),
      href: '/central/integrity',
      icon: Shield,
      isActive: isIntegrityActive,
    },
    {
      id: 'permissions',
      label: t('nav.central.permissions'),
      href: '/central/permissions',
      icon: Shield,
      isActive: isPermissionsActive,
    },
    {
      id: 'platform-health',
      label: t('nav.central.health'),
      href: '/central/platform-health',
      icon: Activity,
      isActive: isPlatformHealthActive || isHealthActive,
    },
  ];

  const isMapRoute = location === '/central/map';
  const currentTitle = navItems.find((item) => item.isActive)?.label ?? t('central.workspace.title');

  return (
    <PortalShell
      mobileTitle={t('common.central_mobile_title')}
      topBar={<CentralAdminTopBar title={currentTitle} />}
      hideSidebar={false}
      hideTopBar={false}
      workspaceClassName="bg-white"
      contentClassName={isMapRoute ? 'p-0 h-full overflow-hidden' : 'p-4 md:p-6'}
      sidebar={
        <PortalSidebar
          title={t('common.brand')}
          subtitle={t('common.central_admin')}
          items={navItems}
          accentColor="var(--stamp-green-700)"
          hideUserInfo={true}
          variant="sovereign"
        />
      }
    >
      <Suspense fallback={<PortalLoadingFallback />}>
        <Switch>
          <Route path="/central/dashboard" component={CentralOverview} />
          <Route path="/central/map" component={CentralMapView} />
          <Route path="/central/deals" component={CentralDeals} />
          <Route path="/central/authorities" component={CentralAuthorities} />
          <Route path="/central/operators" component={CentralOperators} />
          <Route path="/central/appeals" component={CentralAppeals} />
          <Route path="/central/reports" component={CentralReports} />
          <Route path="/central/injunctions" component={CentralInjunctions} />
          <Route path="/central/integrity" component={CentralIntegrityView} />
          <Route path="/central/platform-health" component={CentralPlatformHealth} />
          <Route path="/central/health" component={CentralPlatformHealth} />
          <Route path="/central/permissions" component={CentralPermissions} />
          <Route path="/central/settings" component={CentralPermissions} />
          <Route path="/central/notifications" component={OperatorNotificationsView} />
          <Route path="/central/overview" component={CentralOverview} />
          <Route path="/central" component={CentralOverview} />
          <Route>
            <PortalNotFound basePath="/central" baseTitle={t('common.central_not_found')} />
          </Route>
        </Switch>
      </Suspense>
    </PortalShell>
  );
}

