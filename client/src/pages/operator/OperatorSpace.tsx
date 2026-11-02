import { useEffect } from 'react';
import { Redirect, Route, Switch, useRoute } from 'wouter';
import { useI18n } from '@/i18n';
import i18n from '@/lib/i18n';
import { OperatorOverview } from './OperatorOverview';
import { OperatorOpportunities } from './OperatorOpportunities';
import { OpportunityDetails } from './OpportunityDetails';
import { OffersList } from './OffersList';
import { OfferForm } from './OfferForm';
import { OperatorContractsView } from './OperatorContractsView';
import { OperatorProfileView } from './OperatorProfileView';
import { OperatorSmartSpecsView } from './OperatorSmartSpecsView';
import { OperatorArchiveView } from './OperatorArchiveView';
import { OperatorSettingsView } from './OperatorSettingsView';
import { OperatorNotificationsView } from './OperatorNotificationsView';
import { OperatorAssistantView } from './OperatorAssistantView';
import { RequirementsResponse } from './RequirementsResponse';
import { OperatorSessionList } from '@/features/opening/components/OperatorSessionList';
import { OperatorSessionLive } from '@/features/opening/components/OperatorSessionLive';
import { OperatorObjectionsView } from '@/features/objections/components/OperatorObjectionsView';
import { PortalNotFound } from '@/components/common/PortalNotFound';
import { OperatorShell, type OperatorNavItem } from './OperatorShell';
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  ClipboardCheck,
  Scale,
  Users,
  FileSignature,
} from 'lucide-react';

export function OperatorSpace() {
  const { t, lang } = useI18n();

  useEffect(() => {
    document.title = i18n.t('common.operator_mobile_title');
  }, [lang]);

  // Route matchers for active highlighting
  const [isOverviewActive] = useRoute('/operator');
  const [isOverviewAliasActive] = useRoute('/operator/overview');
  const [isDealsActive] = useRoute('/operator/deals');
  const [isOppsActive] = useRoute('/operator/opportunities');
  const [isOppsDetailsActive] = useRoute('/operator/opportunities/:rest*');
  const [isOffersActive] = useRoute('/operator/offers');
  const [isOffersIdActive] = useRoute('/operator/offers/:id');
  const [isContractsActive] = useRoute('/operator/contracts');
  const [isContractDealActive] = useRoute('/operator/contracts/:dealId');
  const [isObjectionsActive] = useRoute('/operator/objections');
  const [isSmartSpecsActive] = useRoute('/operator/smart-specs');
  const [isSettingsActive] = useRoute('/operator/settings');

  const navItems: OperatorNavItem[] = [
    {
      label: t('nav.operator.workspace'),
      href: '/operator',
      icon: LayoutDashboard,
      isActive: isOverviewActive || isOverviewAliasActive,
      group: 'home',
    },
    {
      label: t('nav.operator.announcements'),
      href: '/operator/deals',
      icon: Megaphone,
      isActive: isDealsActive || isOppsActive || isOppsDetailsActive,
      group: 'opportunities',
    },
    {
      label: t('nav.operator.specs'),
      href: '/operator/smart-specs',
      icon: FileText,
      isActive: isSmartSpecsActive,
      group: 'opportunities',
    },
    {
      label: t('nav.operator.offers_manage'),
      href: '/operator/offers',
      icon: ClipboardCheck,
      isActive: isOffersActive || isOffersIdActive,
      group: 'activity',
    },
    {
      label: t('nav.operator.contracts'),
      href: '/operator/contracts',
      icon: FileSignature,
      isActive: isContractsActive || isContractDealActive,
      group: 'activity',
    },
    {
      label: t('nav.operator.objections'),
      href: '/operator/objections',
      icon: Scale,
      isActive: isObjectionsActive,
      group: 'activity',
    },
    {
      label: t('nav.operator.team'),
      href: '/operator/settings',
      icon: Users,
      isActive: isSettingsActive,
      group: 'system',
    },
  ];

  return (
    <OperatorShell navItems={navItems} mobileTitle={t('common.operator_mobile_title')}>
      <Switch>
        <Route path="/operator/opening-sessions/:id" component={OperatorSessionLive} />
        <Route path="/operator/opening-sessions" component={OperatorSessionList} />
        <Route path="/operator/objections" component={OperatorObjectionsView} />
        <Route path="/operator/assistant" component={OperatorAssistantView} />
        <Route path="/operator/deals" component={OperatorOpportunities} />
        <Route path="/operator/opportunities" component={OperatorOpportunities} />
        <Route path="/operator/profile" component={OperatorProfileView} />
        <Route path="/operator/smart-specs" component={OperatorSmartSpecsView} />
        <Route path="/operator/archive" component={OperatorArchiveView} />
        <Route path="/operator/notifications" component={OperatorNotificationsView} />
        <Route path="/operator/settings" component={OperatorSettingsView} />
        <Route path="/operator/opportunities/:oppId/requirements" component={RequirementsResponse} />
        <Route path="/operator/opportunities/:oppId/offer">
          {(params) => <OfferForm opportunityId={params.oppId} />}
        </Route>
        <Route path="/operator/opportunities/:id" component={OpportunityDetails} />
        <Route path="/operator/offers" component={OffersList} />
        <Route path="/operator/offers/new">
          <Redirect to="/operator/opportunities" />
        </Route>
        <Route path="/operator/offers/:id">
          {(params) => <OfferForm offerId={params.id} />}
        </Route>
        <Route path="/operator/contracts/:dealId">
          {(params) => <OperatorContractsView dealId={params.dealId} />}
        </Route>
        <Route path="/operator/contracts">
          {() => <OperatorContractsView />}
        </Route>
        <Route path="/operator/overview" component={OperatorOverview} />
        <Route path="/operator" component={OperatorOverview} />
        <Route>
          <PortalNotFound basePath="/operator" baseTitle={t('common.operator_not_found')} />
        </Route>
      </Switch>
    </OperatorShell>
  );
}
