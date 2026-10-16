import { useI18n } from '@/i18n';
import { Route, Switch, useRoute } from 'wouter';
import { OperatorOverview } from './OperatorOverview';
import { OperatorOpportunities } from './OperatorOpportunities';
import { OpportunityDetails } from './OpportunityDetails';
import { OffersList } from './OffersList';
import { OfferForm } from './OfferForm';
import { OperatorProfileView } from './OperatorProfileView';
import { OperatorSmartSpecsView } from './OperatorSmartSpecsView';
import { OperatorArchiveView } from './OperatorArchiveView';
import { OperatorSettingsView } from './OperatorSettingsView';
import { RequirementsResponse } from './RequirementsResponse';
import { OperatorSessionList } from '@/features/opening/components/OperatorSessionList';
import { OperatorSessionLive } from '@/features/opening/components/OperatorSessionLive';
import { OperatorObjectionsView } from '@/features/objections/components/OperatorObjectionsView';
import { PortalNotFound } from '@/components/common/PortalNotFound';
import OperatorTopBar from '@/components/layout/OperatorTopBar';
import { PortalShell } from '@/components/layout/PortalShell';
import { PortalSidebar } from '@/components/layout/PortalSidebar';
import {
  LayoutDashboard,
  Briefcase,
  UserCheck,
  Inbox,
  Radio,
  CheckSquare,
  Archive,
  Settings as SettingsIcon,
  ShieldAlert,
} from 'lucide-react';

export function OperatorSpace() {
  const { t } = useI18n();

  // Route matchers for active highlighting
  const [isOverviewActive] = useRoute('/operator');
  const [isOverviewAliasActive] = useRoute('/operator/overview');
  const [isDealsActive] = useRoute('/operator/deals');
  const [isOppsActive] = useRoute('/operator/opportunities');
  const [isProfileActive] = useRoute('/operator/profile');
  const [isOffersActive] = useRoute('/operator/offers');
  const [isOffersIdActive] = useRoute('/operator/offers/:id');
  const [isSessionsActive] = useRoute('/operator/opening-sessions');
  const [isSessionsIdActive] = useRoute('/operator/opening-sessions/:id');
  const [isObjectionsActive] = useRoute('/operator/objections');
  const [isSmartSpecsActive] = useRoute('/operator/smart-specs');
  const [isArchiveActive] = useRoute('/operator/archive');
  const [isSettingsActive] = useRoute('/operator/settings');

  const navItems = [
    {
      label: t('nav.operator.overview'),
      href: '/operator',
      icon: LayoutDashboard,
      isActive: isOverviewActive || isOverviewAliasActive,
    },
    {
      label: t('nav.operator.deals'),
      href: '/operator/deals',
      icon: Briefcase,
      isActive: isDealsActive || isOppsActive,
    },
    {
      label: t('nav.operator.profile'),
      href: '/operator/profile',
      icon: UserCheck,
      isActive: isProfileActive,
    },
    {
      label: t('nav.operator.offers'),
      href: '/operator/offers',
      icon: Inbox,
      isActive: isOffersActive || isOffersIdActive,
    },
    {
      label: t('nav.operator.opening_sessions'),
      href: '/operator/opening-sessions',
      icon: Radio,
      isActive: isSessionsActive || isSessionsIdActive,
    },
    {
      label: 'الطعون والمنازعات',
      href: '/operator/objections',
      icon: ShieldAlert,
      isActive: isObjectionsActive,
    },
    {
      label: t('nav.operator.smart_specs'),
      href: '/operator/smart-specs',
      icon: CheckSquare,
      isActive: isSmartSpecsActive,
    },
    {
      label: t('nav.operator.archive'),
      href: '/operator/archive',
      icon: Archive,
      isActive: isArchiveActive,
    },
    {
      label: t('nav.operator.settings'),
      href: '/operator/settings',
      icon: SettingsIcon,
      isActive: isSettingsActive,
    },
  ];

  return (
    <PortalShell
      mobileTitle="صفقات ذكية · المتعامل الاقتصادي"
      topBar={<OperatorTopBar />}
      sidebar={
        <PortalSidebar
          title="صفقات ذكية"
          subtitle="فضاء المتعامل الاقتصادي"
          items={navItems}
          accentColor="var(--stamp-green-700)"
          showDesktopAppButton
        />
      }
    >
      <Switch>
        <Route path="/operator/opening-sessions/:id" component={OperatorSessionLive} />
        <Route path="/operator/opening-sessions" component={OperatorSessionList} />
        <Route path="/operator/objections" component={OperatorObjectionsView} />
        <Route path="/operator/deals" component={OperatorOpportunities} />
        <Route path="/operator/opportunities" component={OperatorOpportunities} />
        <Route path="/operator/profile" component={OperatorProfileView} />
        <Route path="/operator/smart-specs" component={OperatorSmartSpecsView} />
        <Route path="/operator/archive" component={OperatorArchiveView} />
        <Route path="/operator/settings" component={OperatorSettingsView} />
        <Route path="/operator/opportunities/:oppId/requirements" component={RequirementsResponse} />
        <Route path="/operator/opportunities/:oppId/offer">
          {(params) => <OfferForm opportunityId={params.oppId} />}
        </Route>
        <Route path="/operator/opportunities/:id" component={OpportunityDetails} />
        <Route path="/operator/offers" component={OffersList} />
        <Route path="/operator/offers/:id">
          {(params) => <OfferForm offerId={params.id} />}
        </Route>
        <Route path="/operator/overview" component={OperatorOverview} />
        <Route path="/operator" component={OperatorOverview} />
        <Route>
          <PortalNotFound basePath="/operator" baseTitle="الرئيسية للمتعامل" />
        </Route>
      </Switch>
    </PortalShell>
  );
}

