import { useRef, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Route, Switch, useRoute, useLocation, Link } from 'wouter';
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
import { ReportsView } from './ReportsView';
import { AuditView } from './AuditView';
import { SettingsView } from './SettingsView';
import { LogoutButton, DesktopAppButton } from '@/shared/components';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  Menu,
  Languages,
} from 'lucide-react';

export function AuthoritySpace() {
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

  const orgName = user?.organizationName || user?.displayName || user?.email || t('authority.preview.account');
  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'م';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. Header — ثابت أعلى */}
      <div className="p-5 border-b border-[var(--color-border-subtle)]">
        <h2 className="text-lg font-bold text-[var(--ink-900)] leading-tight">
          صفقات ذكية
        </h2>
        <p className="text-xs text-[var(--ink-500)] mt-0.5">
          فضاء المصلحة المتعاقدة
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
                className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-[15px] transition-colors duration-150 ${
                  item.isActive
                    ? 'bg-[var(--stamp-green-700)] text-white font-semibold shadow-sm'
                    : 'text-[var(--ink-700)] hover:bg-[var(--paper-100)] hover:text-[var(--stamp-green-700)]'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
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
            <div className="size-10 rounded-full bg-[var(--stamp-green-700)] flex items-center justify-center text-white font-semibold text-sm flex-none shadow-sm">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--ink-900)] truncate">
                {user?.displayName || orgName}
              </p>
              <p className="text-xs text-[var(--ink-500)] truncate">
                {user?.email || 'authority@safaqat.dz'}
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

          <span className="font-bold text-sm text-[var(--ink-900)]">
            صفقات ذكية · المصلحة المتعاقدة
          </span>

          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--paper-100)] text-[var(--ink-700)] border border-[var(--color-border-subtle)]"
          >
            {lang === 'ar' ? 'FR' : 'عربي'}
          </button>
        </div>

        {/* Dynamic Route View */}
        <div className="page-transition p-6 md:p-8 flex-1">
          <Switch>
            <Route path="/authority/drafts" component={DraftsList} />
            <Route path="/authority/committee" component={DealCommitteeManager} />
            <Route path="/authority/offers" component={ReceivedOffers} />
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
        </div>
      </main>
    </div>
  );
}
