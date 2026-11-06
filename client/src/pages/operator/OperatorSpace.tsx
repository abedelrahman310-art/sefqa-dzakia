import { useEffect, lazy, Suspense } from 'react';
import { Redirect, Route, Switch, useRoute } from 'wouter';
import { useI18n } from '@/i18n';
import i18n from '@/lib/i18n';
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
  ShieldCheck,
  Calculator,
} from 'lucide-react';

// Code Splitting: Lazy-load portal subviews to accelerate workspace launch
const OperatorOverview = lazy(() => import('./OperatorOverview').then((m) => ({ default: m.OperatorOverview })));
const OperatorOpportunities = lazy(() => import('./OperatorOpportunities').then((m) => ({ default: m.OperatorOpportunities })));
const OpportunityDetails = lazy(() => import('./OpportunityDetails').then((m) => ({ default: m.OpportunityDetails })));
const OffersList = lazy(() => import('./OffersList').then((m) => ({ default: m.OffersList })));
const OfferForm = lazy(() => import('./OfferForm').then((m) => ({ default: m.OfferForm })));
const OperatorContractsView = lazy(() => import('./OperatorContractsView').then((m) => ({ default: m.OperatorContractsView })));
const OperatorProfileView = lazy(() => import('./OperatorProfileView').then((m) => ({ default: m.OperatorProfileView })));
const OperatorSmartSpecsView = lazy(() => import('./OperatorSmartSpecsView').then((m) => ({ default: m.OperatorSmartSpecsView })));
const OperatorArchiveView = lazy(() => import('./OperatorArchiveView').then((m) => ({ default: m.OperatorArchiveView })));
const OperatorSettingsView = lazy(() => import('./OperatorSettingsView').then((m) => ({ default: m.OperatorSettingsView })));
const OperatorNotificationsView = lazy(() => import('./OperatorNotificationsView').then((m) => ({ default: m.OperatorNotificationsView })));
const OperatorAssistantView = lazy(() => import('./OperatorAssistantView').then((m) => ({ default: m.OperatorAssistantView })));
const OperatorPassportView = lazy(() => import('./OperatorPassportView').then((m) => ({ default: m.OperatorPassportView })));
const PriceRevisionCalculator = lazy(() => import('@/features/pricing/PriceRevisionCalculator').then((m) => ({ default: m.PriceRevisionCalculator })));
const RequirementsResponse = lazy(() => import('./RequirementsResponse').then((m) => ({ default: m.RequirementsResponse })));
const OperatorSessionList = lazy(() => import('@/features/opening/components/OperatorSessionList').then((m) => ({ default: m.OperatorSessionList })));
const OperatorSessionLive = lazy(() => import('@/features/opening/components/OperatorSessionLive').then((m) => ({ default: m.OperatorSessionLive })));
const OperatorObjectionsView = lazy(() => import('@/features/objections/components/OperatorObjectionsView').then((m) => ({ default: m.OperatorObjectionsView })));

function PortalLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
      <div className="size-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
    </div>
  );
}

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
  const [isPassportActive] = useRoute('/operator/passport');
  const [isPriceRevisionActive] = useRoute('/operator/price-revision');

  const isAr = lang === 'ar';

  const navItems: OperatorNavItem[] = [
    {
      label: t('nav.operator.workspace'),
      href: '/operator',
      icon: LayoutDashboard,
      isActive: isOverviewActive || isOverviewAliasActive,
      group: 'home',
    },
    {
      label: isAr ? 'جواز السفر الرقمي' : 'Passeport Numérique',
      href: '/operator/passport',
      icon: ShieldCheck,
      isActive: isPassportActive,
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
      label: isAr ? 'مراجعة الأسعار' : 'Révision des Prix',
      href: '/operator/price-revision',
      icon: Calculator,
      isActive: isPriceRevisionActive,
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
      <Suspense fallback={<PortalLoadingFallback />}>
        <Switch>
          <Route path="/operator/opening-sessions/:id" component={OperatorSessionLive} />
          <Route path="/operator/opening-sessions" component={OperatorSessionList} />
          <Route path="/operator/objections" component={OperatorObjectionsView} />
          <Route path="/operator/assistant" component={OperatorAssistantView} />
          <Route path="/operator/deals" component={OperatorOpportunities} />
          <Route path="/operator/opportunities" component={OperatorOpportunities} />
          <Route path="/operator/passport" component={OperatorPassportView} />
          <Route path="/operator/price-revision">{() => <PriceRevisionCalculator />}</Route>
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
      </Suspense>
    </OperatorShell>
  );
}
