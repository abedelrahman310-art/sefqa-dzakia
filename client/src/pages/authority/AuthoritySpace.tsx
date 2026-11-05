import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import i18n from '@/lib/i18n';
import { api } from '@/lib/api';
import { Redirect, Route, Switch, useLocation, useRoute } from 'wouter';
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
import { AuthorityAssistantView } from './AuthorityAssistantView';
import { PriceRevisionCalculator } from '@/features/pricing/PriceRevisionCalculator';
import { OperatorNotificationsView } from '@/pages/operator/OperatorNotificationsView';
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
  AlertOctagon,
  Calculator,
} from 'lucide-react';

export function AuthoritySpace() {
  const { t, lang } = useI18n();
  const [, setLocation] = useLocation();
  const [activeInjunction, setActiveInjunction] = useState<{
    reference: string;
    violation_type: string;
    violation_type_display: string;
    deadline_date: string;
    days_remaining: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    document.title = i18n.t('common.authority_mobile_title');
  }, [lang]);

  useEffect(() => {
    let isMounted = true;
    api.get('/procurements/my-injunctions/')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data?.injunctions) ? res.data.injunctions : [];
        const escalated = list.find((inj: any) => inj.status === 'escalated_to_court');
        const active = list.find((inj: any) => inj.status === 'issued' || inj.status === 'acknowledged');
        setActiveInjunction(escalated || active || null);
      })
      .catch(() => {
        // Silently catch if not authenticated or error
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
  const [isPriceRevisionActive] = useRoute('/authority/price-revision');

  // Final Approved Unified Navigation: "Deals" is the unified entry point
  const navItems = [
    {
      label: t('authority.nav.overview'),
      href: '/authority',
      icon: LayoutDashboard,
      isActive: isOverviewActive || isOverviewAliasActive,
    },
    {
      label: t('authority.nav.deals'),
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
      label: lang === 'ar' ? 'مراجعة الأسعار والملاحق' : 'Révision des Prix',
      href: '/authority/price-revision',
      icon: Calculator,
      isActive: isPriceRevisionActive,
    },
    {
      label: t('authority.nav.objections'),
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
      mobileTitle={t('common.authority_mobile_title')}
      topBar={<ServiceTopBar />}
      showTopBarOnMobile
      sidebar={
        <PortalSidebar
          title={t('common.brand')}
          subtitle={t('common.authority_space')}
          items={navItems}
          variant="authority"
        />
      }
    >
      {activeInjunction && (
        <div
          role="alert"
          className={`mb-4 mx-4 md:mx-6 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs border ${
            activeInjunction.status === 'escalated_to_court'
              ? 'bg-rose-50 text-rose-950 border-rose-200'
              : 'bg-amber-50 text-amber-950 border-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                activeInjunction.status === 'escalated_to_court'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm tracking-wide">
                  {activeInjunction.status === 'escalated_to_court'
                    ? (lang === 'ar' ? '🚨 إعذار إداري رقابي محال للقضاء ومجلس المحاسبة' : '🚨 Injonction administrative transmise à la justice')
                    : (lang === 'ar' ? '⚠️ إعذار إداري رقابي ملزم من الإدارة المركزية' : '⚠️ Injonction administrative impérative de régularisation')}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold border ${
                  activeInjunction.status === 'escalated_to_court'
                    ? 'bg-rose-100/90 text-rose-800 border-rose-300'
                    : 'bg-amber-100/90 text-amber-800 border-amber-300'
                }`}>
                  {activeInjunction.reference}
                </span>
              </div>
              <p className={`text-xs mt-1.5 leading-relaxed font-medium ${
                activeInjunction.status === 'escalated_to_court' ? 'text-rose-800' : 'text-amber-800'
              }`}>
                {activeInjunction.status === 'escalated_to_court'
                  ? (lang === 'ar'
                      ? `تمت إحالة الملف للجهات القضائية ومجلس المحاسبة لعدم الاستجابة خلال المهلة القانونية بخصوص (${activeInjunction.violation_type_display || activeInjunction.violation_type}).`
                      : `Dossier transmis aux juridictions compétentes et à la Cour des comptes suite à l'expiration du délai légal pour (${activeInjunction.violation_type_display || activeInjunction.violation_type}).`)
                  : (lang === 'ar'
                      ? `بخصوص (${activeInjunction.violation_type_display || activeInjunction.violation_type}). ينتهي الأجل في ${activeInjunction.deadline_date || ''} (متبقي ${activeInjunction.days_remaining ?? 0} يوماً). يرجى تقديم تقرير التصحيح فوراً تجنباً للإحالة القضائية.`
                      : `Concernant (${activeInjunction.violation_type_display || activeInjunction.violation_type}). Échéance impérative le ${activeInjunction.deadline_date || ''} (${activeInjunction.days_remaining ?? 0} jours restants). Régularisation requise.`)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => setLocation('/authority/audit?tab=injunctions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                activeInjunction.status === 'escalated_to_court'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <span>{lang === 'ar' ? 'رفع تقرير التصحيح والرد' : 'Soumettre le rapport de régularisation'}</span>
              <Gavel className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
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
        <Route path="/authority/assistant" component={AuthorityAssistantView} />
        <Route path="/authority/committee" component={DealCommitteeManager} />
        <Route path="/authority/offers" component={ReceivedOffers} />
        <Route path="/authority/price-revision">{() => <PriceRevisionCalculator />}</Route>
        <Route path="/authority/objections" component={AuthorityObjectionsView} />
        <Route path="/authority/evaluation/:tenderId" component={EvaluationWorkspace} />
        <Route path="/authority/reports" component={ReportsView} />
        <Route path="/authority/audit" component={AuditView} />
        <Route path="/authority/settings" component={SettingsView} />
        <Route path="/authority/notifications" component={OperatorNotificationsView} />
        <Route path="/authority/opportunities/:id/received-offers" component={ReceivedOffers} />
        <Route path="/authority/opportunities/:id/committee" component={DealCommitteeManager} />
        <Route path="/authority/opportunities/:id/evaluation" component={EvaluationWorkspace} />
        <Route path="/authority/opening-sessions/:id" component={AuthoritySessionControl} />
        <Route path="/authority/opening-sessions" component={AuthoritySessionManager} />
        <Route path="/authority/dashboard">
          <Redirect to="/authority/overview" />
        </Route>
        <Route path="/authority/overview" component={AuthorityOverview} />
        <Route path="/authority" component={AuthorityOverview} />
        <Route>
          <PortalNotFound basePath="/authority" baseTitle={t('common.authority_not_found')} />
        </Route>
      </Switch>
    </PortalShell>
  );
}
