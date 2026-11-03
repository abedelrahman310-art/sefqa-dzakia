import { useEffect } from 'react';
import { useI18n } from '@/i18n';
import i18n from '@/lib/i18n';
import { Route, Switch, useRoute, useLocation } from 'wouter';
import { CentralOverview } from './CentralOverview';
import { CentralMapView } from './CentralMapView';
import { CentralDeals } from './CentralDeals';
import { CentralAuthorities } from './CentralAuthorities';
import { CentralOperators } from './CentralOperators';
import { CentralAppeals } from './CentralAppeals';
import { CentralReports } from './CentralReports';
import { CentralPermissions } from './CentralPermissions';
import { CentralIntegrityView } from './CentralIntegrityView';
import { CentralInjunctions } from './CentralInjunctions';
import { OperatorNotificationsView } from '@/pages/operator/OperatorNotificationsView';
import { PortalNotFound } from '@/components/common/PortalNotFound';
import CentralAdminTopBar from '@/components/layout/CentralAdminTopBar';
import { PortalShell } from '@/components/layout/PortalShell';
import { PortalSidebar } from '@/components/layout/PortalSidebar';
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
      label: t('central.injunctions.title') || 'الإعذارات الإدارية',
      href: '/central/injunctions',
      icon: Gavel,
      isActive: isInjunctionsActive,
    },
    {
      id: 'integrity',
      label: 'رادار الرقابة والنزاهة (AI Anti-Fraud)',
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
        <Route path="/central/permissions" component={CentralPermissions} />
        <Route path="/central/notifications" component={OperatorNotificationsView} />
        <Route path="/central/overview" component={CentralOverview} />
        <Route path="/central" component={CentralOverview} />
        <Route>
          <PortalNotFound basePath="/central" baseTitle={t('common.central_not_found')} />
        </Route>
      </Switch>
    </PortalShell>
  );
}

