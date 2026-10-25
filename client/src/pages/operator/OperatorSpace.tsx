import { Route, Switch, useRoute } from 'wouter';
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
  Sparkles,
} from 'lucide-react';

export function OperatorSpace() {
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
  const [isAssistantActive] = useRoute('/operator/assistant');
  const [isSmartSpecsActive] = useRoute('/operator/smart-specs');
  const [isSettingsActive] = useRoute('/operator/settings');

  const navItems: OperatorNavItem[] = [
    {
      label: 'مساحة العمل',
      href: '/operator',
      icon: LayoutDashboard,
      isActive: isOverviewActive || isOverviewAliasActive,
      group: 'home',
    },
    {
      label: 'الإعلانات وفرص الصفقات',
      href: '/operator/deals',
      icon: Megaphone,
      isActive: isDealsActive || isOppsActive || isOppsDetailsActive,
      group: 'opportunities',
    },
    {
      label: 'دفاتر الشروط',
      href: '/operator/smart-specs',
      icon: FileText,
      isActive: isSmartSpecsActive,
      group: 'opportunities',
    },
    {
      label: 'إدارة العروض',
      href: '/operator/offers',
      icon: ClipboardCheck,
      isActive: isOffersActive || isOffersIdActive,
      group: 'activity',
    },
    {
      label: 'العقود والتنفيذ',
      href: '/operator/contracts',
      icon: FileSignature,
      isActive: isContractsActive || isContractDealActive,
      group: 'activity',
    },
    {
      label: 'الطعون والتظلمات',
      href: '/operator/objections',
      icon: Scale,
      isActive: isObjectionsActive,
      group: 'activity',
    },
    {
      label: 'المساعد القانوني',
      href: '/operator/assistant',
      icon: Sparkles,
      isActive: isAssistantActive,
      group: 'activity',
    },
    {
      label: 'الفريق والصلاحيات',
      href: '/operator/settings',
      icon: Users,
      isActive: isSettingsActive,
      group: 'system',
    },
  ];

  return (
    <OperatorShell navItems={navItems} mobileTitle="صفقات ذكية · المتعامل الاقتصادي">
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
          <PortalNotFound basePath="/operator" baseTitle="الرئيسية للمتعامل" />
        </Route>
      </Switch>
    </OperatorShell>
  );
}
