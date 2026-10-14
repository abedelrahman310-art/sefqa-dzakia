import { useRef, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Route, Switch, useRoute, useLocation, Link } from 'wouter';
import { CentralOverview } from './CentralOverview';
import { CentralMapView } from './CentralMapView';
import { CentralSectionView } from './CentralSectionView';
import { CentralDeals } from './CentralDeals';
import { CentralAuthorities } from './CentralAuthorities';
import { CentralOperators } from './CentralOperators';
import { CentralAppeals } from './CentralAppeals';
import { CentralReports } from './CentralReports';
import { CentralPermissions } from './CentralPermissions';
import { PortalNotFound } from '@/components/common/PortalNotFound';
import { LogoutButton, DesktopAppButton } from '@/shared/components';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Map as MapIcon,
  Building,
  Users,
  Briefcase,
  AlertTriangle,
  BarChart,
  Shield,
  Menu,
  Languages,
} from 'lucide-react';

export function CentralSpace() {
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
  const [isDashboardActive] = useRoute('/central/dashboard');
  const [isOverviewActive] = useRoute('/central/overview');
  const [isCentralRootActive] = useRoute('/central');
  const [isMapActive] = useRoute('/central/map');
  const [isAuthoritiesActive] = useRoute('/central/authorities');
  const [isOperatorsActive] = useRoute('/central/operators');
  const [isDealsActive] = useRoute('/central/deals');
  const [isAppealsActive] = useRoute('/central/appeals');
  const [isReportsActive] = useRoute('/central/reports');
  const [isPermissionsActive] = useRoute('/central/permissions');

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.central.dashboard'),
      href: '/central/dashboard',
      icon: LayoutDashboard,
      isActive: isDashboardActive || isOverviewActive || isCentralRootActive,
    },
    {
      id: 'map',
      label: t('nav.central.map'),
      href: '/central/map',
      icon: MapIcon,
      isActive: isMapActive,
    },
    {
      id: 'authorities',
      label: t('nav.central.authorities'),
      href: '/central/authorities',
      icon: Building,
      isActive: isAuthoritiesActive,
    },
    {
      id: 'operators',
      label: t('nav.central.operators'),
      href: '/central/operators',
      icon: Users,
      isActive: isOperatorsActive,
    },
    {
      id: 'deals',
      label: t('nav.central.deals'),
      href: '/central/deals',
      icon: Briefcase,
      isActive: isDealsActive,
    },
    {
      id: 'appeals',
      label: t('nav.central.appeals'),
      href: '/central/appeals',
      icon: AlertTriangle,
      isActive: isAppealsActive,
    },
    {
      id: 'reports',
      label: t('nav.central.reports'),
      href: '/central/reports',
      icon: BarChart,
      isActive: isReportsActive,
    },
    {
      id: 'permissions',
      label: t('nav.central.permissions'),
      href: '/central/permissions',
      icon: Shield,
      isActive: isPermissionsActive,
    },
  ];

  const orgName = user?.organizationName || user?.displayName || t('central.topbar.default_org');
  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'إ';

  const isMapRoute = location === '/central/map';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. Header — ثابت أعلى */}
      <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--stamp-green-700)] to-[#0A2540] text-white font-bold text-base flex items-center justify-center shadow-sm flex-none">
            ص
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--ink-900)] leading-tight truncate">
              صفقات ذكية
            </h2>
            <p className="text-xs text-[var(--ink-500)] mt-0.5 truncate">
              الإدارة المركزية والرقابة
            </p>
          </div>
        </div>
      </div>

      {/* 2. Nav — scrollable وسط */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href}>
              <a
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors duration-150 ${
                  item.isActive
                    ? 'bg-[var(--stamp-green-700)] text-white font-semibold shadow-sm'
                    : 'text-[var(--ink-700)] hover:bg-[var(--paper-100)] hover:text-[var(--stamp-green-700)]'
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
            <div className="size-10 rounded-full bg-[var(--stamp-green-700)] flex items-center justify-center text-white font-semibold text-sm flex-none shadow-sm">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--ink-900)] truncate">
                {user?.displayName || orgName}
              </p>
              <p className="text-xs text-[var(--ink-500)] truncate">
                {user?.email || 'admin@safaqat.dz'}
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
      {/* Desktop Sidebar: 280px fixed (hidden on map route so the map is the hero) */}
      {!isMapRoute && (
        <aside className="hidden md:flex flex-col w-[280px] h-screen bg-white border-e border-[var(--color-border-subtle)] flex-none">
          {sidebarContent}
        </aside>
      )}

      {/* Main Content Area */}
      <main
        ref={mainRef}
        className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0"
      >
        {/* Mobile Header Bar with Sheet (side="start") */}
        {!isMapRoute && (
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
              صفقات ذكية · الإدارة المركزية
            </span>

            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--paper-100)] text-[var(--ink-700)] border border-[var(--color-border-subtle)]"
            >
              {lang === 'ar' ? 'FR' : 'عربي'}
            </button>
          </div>
        )}

        {/* Dynamic Route View */}
        <div
          className={`page-transition flex-1 ${
            isMapRoute ? 'p-0 h-full overflow-hidden' : 'p-6 md:p-8'
          }`}
        >
          <Switch>
            <Route path="/central/dashboard" component={CentralOverview} />
            <Route path="/central/map" component={CentralMapView} />
            <Route path="/central/deals" component={CentralDeals} />
            <Route path="/central/authorities" component={CentralAuthorities} />
            <Route path="/central/operators" component={CentralOperators} />
            <Route path="/central/appeals" component={CentralAppeals} />
            <Route path="/central/reports" component={CentralReports} />
            <Route path="/central/permissions" component={CentralPermissions} />
            <Route path="/central/overview" component={CentralOverview} />
            <Route path="/central" component={CentralOverview} />
            <Route>
              <PortalNotFound basePath="/central" baseTitle="الرئيسية المركزية" />
            </Route>
          </Switch>
        </div>
      </main>
    </div>
  );
}
