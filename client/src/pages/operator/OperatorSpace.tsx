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
  Megaphone,
  FileText,
  ClipboardCheck,
  Scale,
  Users,
} from 'lucide-react';

export function OperatorSpace() {
  const { t } = useI18n();

  // Route matchers for active highlighting
  const [isOverviewActive] = useRoute('/operator');
  const [isOverviewAliasActive] = useRoute('/operator/overview');
  const [isDealsActive] = useRoute('/operator/deals');
  const [isOppsActive] = useRoute('/operator/opportunities');
  const [isOffersActive] = useRoute('/operator/offers');
  const [isOffersIdActive] = useRoute('/operator/offers/:id');
  const [isObjectionsActive] = useRoute('/operator/objections');
  const [isSmartSpecsActive] = useRoute('/operator/smart-specs');
  const [isArchiveActive] = useRoute('/operator/archive');
  const [isSettingsActive] = useRoute('/operator/settings');

  const navItems = [
    {
      label: 'مساحة العمل',
      href: '/operator',
      icon: LayoutDashboard,
      isActive: isOverviewActive || isOverviewAliasActive,
    },
    {
      label: 'الإعلانات وفرص الصفقات',
      href: '/operator/deals',
      icon: Megaphone,
      isActive: isDealsActive || isOppsActive,
    },
    {
      label: 'دفاتر الشروط',
      href: '/operator/smart-specs',
      icon: FileText,
      isActive: isSmartSpecsActive,
    },
    {
      label: 'إدارة العروض',
      href: '/operator/offers',
      icon: ClipboardCheck,
      isActive: isOffersActive || isOffersIdActive,
    },
    {
      label: 'الطعون والتظلمات',
      href: '/operator/objections',
      icon: Scale,
      isActive: isObjectionsActive,
    },
    {
      label: 'الفريق والصلاحيات',
      href: '/operator/settings',
      icon: Users,
      isActive: isSettingsActive,
    },
  ];

  return (
    <PortalShell
      mobileTitle="صفقات ذكية · المتعامل الاقتصادي"
      topBar={<OperatorTopBar />}
      showTopBarOnMobile
      sidebarWidth="w-[270px]"
      contentClassName="flex-1 min-h-0 flex flex-col p-4 md:px-7 md:py-4 bg-[#F4F7FB] overflow-y-auto text-[16px]"
      sidebar={
        <PortalSidebar
          title="صفقات ذكية"
          subtitle="فضاء المتعامل الاقتصادي"
          badgeTitle="• بوابة المتعامل الاقتصادي"
          items={navItems}
          variant="operator"
          hideUserInfo
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

