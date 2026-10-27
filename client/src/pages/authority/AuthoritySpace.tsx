import { useI18n } from '@/i18n';
import { Route, Switch, useRoute } from 'wouter';
import { AuthorityOverview } from './AuthorityOverview';
import { AuthorityDealsList } from './AuthorityDealsList';
import { AuthorityDealWizard } from './AuthorityDealWizard';
import { AuthorityDealWorkspace } from './AuthorityDealWorkspace';
import { ReceivedOffers } from './ReceivedOffers';
import { EvaluationWorkspace } from './EvaluationWorkspace';
import { DealCommitteeManager } from './DealCommitteeManager';
import { PortalNotFound } from '@/components/common/PortalNotFound';
import { AuthoritySessionManager } from '@/features/opening/components/AuthoritySessionManager';
import { AuthoritySessionControl } from '@/features/opening/components/AuthoritySessionControl';
import { AuthorityObjectionsView } from '@/features/objections/components/AuthorityObjectionsView';
import { ReportsView } from './ReportsView';
import { AuditView } from './AuditView';
import { SettingsView } from './SettingsView';
import { PortalShell } from '@/components/layout/PortalShell';
import { PortalSidebar } from '@/components/layout/PortalSidebar';
import ServiceTopBar from '@/components/layout/ServiceTopBar';
import {
  LayoutDashboard,
  Briefcase,
  Radio,
  Gavel,
  Inbox,
  BarChart3,
  Shield,
  Scale,
} from 'lucide-react';

export function AuthoritySpace() {
  const { t } = useI18n();

  // Route matchers for active highlighting
  const [isOverviewActive] = useRoute('/authority');
  const [isOverviewAliasActive] = useRoute('/authority/overview');

  // Unified Deals Hub routes & legacy aliases
  const [isDealsActive] = useRoute('/authority/deals');
  const [isDealsNewActive] = useRoute('/authority/deals/new');
  const [isDealsDetailActive] = useRoute('/authority/deals/:id');
  const [isDraftsActive] = useRoute('/authority/drafts');
  const [isDraftsNewActive] = useRoute('/authority/drafts/new');
  const [isDraftsEditActive] = useRoute('/authority/drafts/:id/edit');
  const [isDraftsSpecsActive] = useRoute('/authority/drafts/:id/specs');
  const [isSpecsIndexActive] = useRoute('/authority/specs');

  const [isOpeningSessionsActive] = useRoute('/authority/opening-sessions');
  const [isOpeningSessionDetailActive] = useRoute('/authority/opening-sessions/:id');
  const [isCommitteeActive] = useRoute('/authority/committee');
  const [isCommitteeDetailActive] = useRoute('/authority/opportunities/:id/committee');
  const [isOffersActive] = useRoute('/authority/offers');
  const [isOffersDetailActive] = useRoute('/authority/opportunities/:id/received-offers');
  const [isObjectionsActive] = useRoute('/authority/objections');
  const [isReportsActive] = useRoute('/authority/reports');
  const [isAuditActive] = useRoute('/authority/audit');

  // Final Approved Unified Navigation: "الصفقات" is the unified entry point
  const navItems = [
    {
      label: t('authority.nav.overview'),
      href: '/authority',
      icon: LayoutDashboard,
      isActive: isOverviewActive || isOverviewAliasActive,
    },
    {
      label: 'الصفقات',
      href: '/authority/deals',
      icon: Briefcase,
      isActive:
        isDealsActive ||
        isDealsNewActive ||
        isDealsDetailActive ||
        isDraftsActive ||
        isDraftsNewActive ||
        isDraftsEditActive ||
        isDraftsSpecsActive ||
        isSpecsIndexActive,
    },
    {
      label: t('authority.nav.opening'),
      href: '/authority/opening-sessions',
      icon: Radio,
      isActive: isOpeningSessionsActive || isOpeningSessionDetailActive,
    },
    {
      label: t('authority.nav.committee'),
      href: '/authority/committee',
      icon: Gavel,
      isActive: isCommitteeActive || isCommitteeDetailActive,
    },
    {
      label: t('authority.nav.offers'),
      href: '/authority/offers',
      icon: Inbox,
      isActive: isOffersActive || isOffersDetailActive,
    },
    {
      label: 'الطعون والإسناد',
      href: '/authority/objections',
      icon: Scale,
      isActive: isObjectionsActive,
    },
    {
      label: t('authority.nav.reports'),
      href: '/authority/reports',
      icon: BarChart3,
      isActive: isReportsActive,
    },
    {
      label: t('authority.nav.audit'),
      href: '/authority/audit',
      icon: Shield,
      isActive: isAuditActive,
    },
  ];

  return (
    <PortalShell
      mobileTitle="صفقات ذكية · المصلحة المتعاقدة"
      topBar={<ServiceTopBar />}
      showTopBarOnMobile
      sidebar={
        <PortalSidebar
          title="صفقات ذكية"
          subtitle="فضاء المصلحة المتعاقدة"
          items={navItems}
          variant="authority"
        />
      }
    >
      <Switch>
        {/* ═══ Unified Deals Hub Routes ═══ */}
        <Route path="/authority/deals/new" component={AuthorityDealWizard} />
        <Route path="/authority/deals/:id">
          {(params) => <AuthorityDealWorkspace key={params.id} />}
        </Route>
        <Route path="/authority/deals">{() => <AuthorityDealsList />}</Route>

        {/* ═══ Backward Compatibility Routes (Absorbed Drafts & Specs) ═══ */}
        <Route path="/authority/drafts/new" component={AuthorityDealWizard} />
        <Route path="/authority/drafts/:id/specs">
          {(params) => <AuthorityDealWorkspace key={params.id} initialTab="specs" />}
        </Route>
        <Route path="/authority/drafts/:id/edit">
          {(params) => <AuthorityDealWorkspace key={params.id} initialTab="basics" />}
        </Route>
        <Route path="/authority/drafts">{() => <AuthorityDealsList />}</Route>
        <Route path="/authority/specs">{() => <AuthorityDealsList initialView="specs" />}</Route>

        {/* ═══ Rest of Authority Portal Sections (Preserved Untouched) ═══ */}
        <Route path="/authority/committee" component={DealCommitteeManager} />
        <Route path="/authority/offers" component={ReceivedOffers} />
        <Route path="/authority/objections" component={AuthorityObjectionsView} />
        <Route path="/authority/evaluation/:tenderId" component={EvaluationWorkspace} />
        <Route path="/authority/reports" component={ReportsView} />
        <Route path="/authority/audit" component={AuditView} />
        <Route path="/authority/settings" component={SettingsView} />
        <Route path="/authority/opportunities/:id/received-offers" component={ReceivedOffers} />
        <Route path="/authority/opportunities/:id/committee" component={DealCommitteeManager} />
        <Route path="/authority/opportunities/:id/evaluation" component={EvaluationWorkspace} />
        <Route path="/authority/opening-sessions/:id" component={AuthoritySessionControl} />
        <Route path="/authority/opening-sessions" component={AuthoritySessionManager} />
        <Route path="/authority/overview" component={AuthorityOverview} />
        <Route path="/authority" component={AuthorityOverview} />
        <Route>
          <PortalNotFound basePath="/authority" baseTitle="الرئيسية للمصلحة" />
        </Route>
      </Switch>
    </PortalShell>
  );
}
