import { useRef, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Route, Switch, useRoute, useLocation, Link } from 'wouter';
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
import { LogoutButton, DesktopAppButton } from '@/shared/components';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Briefcase,
  UserCheck,
  Inbox,
  Radio,
  CheckSquare,
  Archive,
  Settings as SettingsIcon,
  Menu,
  Languages,
  ShieldAlert,
} from 'lucide-react';

export function OperatorSpace() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const [location] = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-scroll main container to top upon route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    setMobileOpen(false);
  }, [location]);

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

  const orgName = user?.organizationName || user?.displayName || 'المتعامل الاقتصادي';
  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'م';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. Header — ثابت أعلى */}
      <div className="p-5 border-b border-[var(--color-border-subtle)]">
        <h2 className="text-lg font-bold text-[var(--ink-900)] leading-tight">
          صفقات ذكية
        </h2>
        <p className="text-xs text-[var(--ink-500)] mt-0.5">
          فضاء المتعامل الاقتصادي
        </p>
      </div>

      {/* 2. Nav — scrollable وسط */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors duration-150 ${
                  item.isActive
                    ? 'bg-[#4F3824] text-white font-semibold shadow-sm'
                    : 'text-[var(--ink-700)] hover:bg-[var(--paper-100)] hover:text-[#4F3824]'
                }`}
              >
                <Icon className="size-5 shrink-0" strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* 3. User Info + Language Switcher + Logout — ثابت أسفل */}
      <div className="border-t border-[var(--color-border-subtle)] p-4 bg-[var(--paper-100)] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-full bg-[#4F3824] flex items-center justify-center text-white font-semibold text-sm flex-none shadow-sm">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--ink-900)] truncate">
                {user?.displayName || orgName}
              </p>
              <p className="text-xs text-[var(--ink-500)] truncate">
                {user?.email || 'operator@safaqat.dz'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-[var(--ink-700)] hover:bg-[var(--paper-200)] transition-colors border border-[var(--color-border-subtle)] shadow-xs flex-none"
            title="تبديل اللغة / Changer de langue"
          >
            <Languages className="w-3.5 h-3.5 text-[var(--ink-500)]" />
            <span>{lang === 'ar' ? 'FR' : 'عربي'}</span>
          </button>
        </div>

        <DesktopAppButton className="w-full justify-center bg-white hover:bg-[var(--paper-200)] text-[var(--ink-800)] border border-[var(--color-border-subtle)]" />
        <LogoutButton variant="sidebar" />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--paper-50)]" dir="rtl">
      {/* Desktop Sidebar: 280px fixed */}
      <aside className="hidden md:flex flex-col w-[280px] h-screen bg-white border-e border-[var(--color-border-subtle)] flex-none">
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main
        ref={mainRef}
        className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0"
      >
        {/* Mobile Header Bar with Sheet (side="start") */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[var(--color-border-subtle)] sticky top-0 z-30">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="p-2 rounded-lg bg-[var(--paper-100)] text-[var(--ink-900)] hover:bg-[var(--paper-200)] transition-colors"
                aria-label="فتح القائمة"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="start" className="p-0 w-[280px] border-e border-[var(--color-border-subtle)]">
              {sidebarContent}
            </SheetContent>
          </Sheet>

          <span className="font-bold text-lg text-[var(--ink-900)]">
            صفقات ذكية · المتعامل الاقتصادي
          </span>

            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--paper-100)] text-[var(--ink-700)] border border-[var(--color-border-subtle)]"
            >
              {lang === 'ar' ? 'FR' : 'عربي'}
            </button>
          </div>

        {/* Desktop Operator TopBar (56px) */}
        <div className="hidden md:block sticky top-0 z-20">
          <OperatorTopBar />
        </div>

        {/* Dynamic Route View */}
        <div className="page-transition p-6 md:p-8 flex-1">
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
        </div>
      </main>
    </div>
  );
}
