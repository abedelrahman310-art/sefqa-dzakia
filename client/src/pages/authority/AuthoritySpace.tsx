import { useI18n } from '@/i18n';
import { Route, Switch, useRoute } from 'wouter';
import { AuthorityOverview } from './AuthorityOverview';
import { DraftsList } from './DraftsList';
import { DraftForm } from './DraftForm';
import { ReceivedOffers } from './ReceivedOffers';
import { OpeningSessionView } from './OpeningSessionView';
import { EvaluationWorkspace } from './EvaluationWorkspace';
import { DealCommitteeManager } from './DealCommitteeManager';
import { PortalNotFound } from '@/components/common/PortalNotFound';
import { CahierSpecsEditor } from './CahierSpecsEditor';
import { SpecsIndex } from './SpecsIndex';
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
  FileText,
  BookOpen,
  Radio,
  Gavel,
  Inbox,
  BarChart3,
  Shield,
  Settings as SettingsIcon,
  Scale,
} from 'lucide-react';

export function AuthoritySpace() {
  const { t } = useI18n();

  // Route matchers for active highlighting
  const [isOverviewActive] = useRoute('/authority');
  const [isOverviewAliasActive] = useRoute('/authority/overview');
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
  const [isSettingsActive] = useRoute('/authority/settings');

  const navItems = [
    {
      label: t('authority.nav.overview'),
      href: '/authority',
      icon: LayoutDashboard,
      isActive: isOverviewActive || isOverviewAliasActive,
    },
    {
      label: t('authority.nav.drafts'),
      href: '/authority/drafts',
      icon: FileText,
      isActive: isDraftsActive || isDraftsNewActive || isDraftsEditActive || isDraftsSpecsActive,
    },
    {
      label: t('authority.nav.specs'),
      href: '/authority/specs',
      icon: BookOpen,
      isActive: isSpecsIndexActive,
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
    {
      label: t('authority.nav.settings'),
      href: '/authority/settings',
      icon: SettingsIcon,
      isActive: isSettingsActive,
    },
  ];

  return (
    <PortalShell
      mobileTitle="صفقات ذكية · المصلحة المتعاقدة"
      topBar={<ServiceTopBar />}
      sidebar={
        <PortalSidebar
          title="صفقات ذكية"
          subtitle="فضاء المصلحة المتعاقدة"
          items={navItems}
          accentColor="var(--stamp-green-700)"
          showDesktopAppButton
        />
      }
    >
      <Switch>
        <Route path="/authority/drafts" component={DraftsList} />
        <Route path="/authority/committee" component={DealCommitteeManager} />
        <Route path="/authority/offers" component={ReceivedOffers} />
        <Route path="/authority/objections" component={AuthorityObjectionsView} />
        <Route path="/authority/evaluation/:tenderId" component={EvaluationWorkspace} />
        <Route path="/authority/reports" component={ReportsView} />
        <Route path="/authority/audit" component={AuditView} />
        <Route path="/authority/settings" component={SettingsView} />
        <Route path="/authority/opportunities/:id/received-offers" component={ReceivedOffers} />
        <Route path="/authority/opportunities/:id/committee" component={DealCommitteeManager} />
        <Route path="/authority/opportunities/:id/opening" component={OpeningSessionView} />
        <Route path="/authority/opportunities/:id/evaluation" component={EvaluationWorkspace} />
        <Route path="/authority/drafts/new">{() => <DraftForm />}</Route>
        <Route path="/authority/drafts/:id/edit">
          {(params) => <DraftForm id={params.id} />}
        </Route>
        <Route path="/authority/drafts/:id/specs">
          {(params) => <CahierSpecsEditor draftId={params.id} />}
        </Route>
        <Route path="/authority/opening-sessions/:id" component={AuthoritySessionControl} />
        <Route path="/authority/opening-sessions" component={AuthoritySessionManager} />
        <Route path="/authority/specs" component={SpecsIndex} />
        <Route path="/authority/overview" component={AuthorityOverview} />
        <Route path="/authority" component={AuthorityOverview} />
        <Route>
          <PortalNotFound basePath="/authority" baseTitle="الرئيسية للمصلحة" />
        </Route>
      </Switch>
    </PortalShell>
  );
}
