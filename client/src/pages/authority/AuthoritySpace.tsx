import { useState } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Route, Switch, useRoute, Link } from 'wouter';
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
import { LogOut } from 'lucide-react';

export function AuthoritySpace() {
  const { t, lang, setLang } = useI18n();
  const { logout, user } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const [isOverviewActive] = useRoute('/authority');
  const [isOverviewAliasActive] = useRoute('/authority/overview');
  const [isDraftsActive] = useRoute('/authority/drafts');
  const [isDraftsNewActive] = useRoute('/authority/drafts/new');
  const [isDraftsEditActive] = useRoute('/authority/drafts/:id/edit');
  const [isDraftsSpecsActive] = useRoute('/authority/drafts/:id/specs');
  const [isSpecsIndexActive] = useRoute('/authority/specs');

  const overviewCurrent = isOverviewActive || isOverviewAliasActive;
  const draftsCurrent = isDraftsActive || isDraftsNewActive || isDraftsEditActive || isDraftsSpecsActive;
  const specsCurrent = isSpecsIndexActive;

  const orgName = user?.organizationName || user?.displayName || user?.email || t('authority.preview.account');

  return (
    <div className="min-h-screen flex flex-col bg-[var(--auth-bg)] font-sans antialiased">
      {/* Topbar: Unified Navy, 72px min-height, full-width */}
      <header className="min-h-[72px] bg-[var(--auth-navy)] text-white px-4 sm:px-8 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 sticky top-0 z-40 shadow-sm border-b border-white/10">
        {/* Brand Area */}
        <div className="flex items-center gap-2.5">
          <span className="w-[38px] h-[38px] grid place-items-center border border-white/50 rounded-[10px] bg-gradient-to-br from-[var(--auth-emerald)] to-[var(--auth-gold)] text-xl font-bold text-white shrink-0 select-none">
            ص
          </span>
          <div>
            <strong className="block text-sm sm:text-base font-bold text-white leading-tight">
              {t('authority.preview.brand')}
            </strong>
            <small className="text-xs text-white/75 hidden sm:block leading-none">
              {t('authority.preview.space_label')}
            </small>
          </div>
        </div>

        {/* Actions Area */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
          <button
            type="button"
            className="border border-white/20 rounded-lg bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-xs transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            title={t('authority.preview.search')}
          >
            <span>⌕</span>
            <span>{t('authority.preview.search')}</span>
          </button>

          <button
            type="button"
            className="border border-white/20 rounded-lg bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-xs transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            title={t('authority.preview.notifications')}
          >
            <span>◌</span>
            <span>{t('authority.preview.notifications')}</span>
          </button>

          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            className="border border-white/20 rounded-lg bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-xs transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <span>{lang === 'ar' ? 'Français' : 'العربية'}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="border border-white/20 rounded-lg bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-xs transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-expanded={isAccountOpen}
            >
              <span className="truncate max-w-[120px]">{orgName}</span>
              <span className="text-[10px]">▾</span>
            </button>

            {isAccountOpen && (
              <div className="absolute end-0 top-full mt-1.5 w-48 bg-white border border-[var(--auth-line)] rounded-lg shadow-lg py-1.5 z-50 text-[var(--auth-text)] animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[var(--auth-line)] text-xs">
                  <div className="text-[var(--auth-muted)] text-[11px]">{t('authority.preview.space_label')}</div>
                  <div className="font-bold truncate text-[var(--auth-text)]">{orgName}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    logout();
                  }}
                  className="w-full text-start px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="min-h-[calc(100vh-72px)] grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] bg-[var(--auth-bg)]">
        {/* Sidebar: 260px desktop, horizontal scroll on mobile <=760px */}
        <aside className="bg-[var(--auth-card)] border-b md:border-b-0 md:border-e border-[var(--auth-line)] p-2.5 md:p-3 md:py-4.5 overflow-x-auto md:overflow-visible">
          <div className="hidden md:block text-[var(--auth-muted)] text-xs font-bold px-2.5 pb-2.5">
            {t('authority.preview.nav_title')}
          </div>

          <nav className="flex md:grid md:gap-1.5 w-max md:w-full gap-1.5" aria-label={t('authority.preview.nav_title')}>
            {/* 1. لوحة المتابعة */}
            <Link href="/authority">
              <a
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  overviewCurrent
                    ? 'text-white bg-[var(--auth-navy)] font-bold shadow-sm'
                    : 'text-[#41505c] hover:bg-slate-100 hover:text-[var(--auth-navy)]'
                }`}
                aria-current={overviewCurrent ? 'page' : undefined}
              >
                <span>▦</span>
                <span>{t('authority.preview.nav_dashboard')}</span>
              </a>
            </Link>

            {/* 2. الصفقات (غير نشط - لا يوجد مسار عام منفصل) */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#41505c]/50 cursor-not-allowed select-none whitespace-nowrap"
              title={t('badge.under_development')}
            >
              <span>▤</span>
              <span>{t('authority.preview.nav_deals')}</span>
            </div>

            {/* 3. المسودات */}
            <Link href="/authority/drafts">
              <a
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  draftsCurrent
                    ? 'text-white bg-[var(--auth-navy)] font-bold shadow-sm'
                    : 'text-[#41505c] hover:bg-slate-100 hover:text-[var(--auth-navy)]'
                }`}
                aria-current={draftsCurrent ? 'page' : undefined}
              >
                <span>◫</span>
                <span>{t('authority.preview.nav_drafts')}</span>
              </a>
            </Link>

            {/* 4. لجنة فتح الأظرفة (مرتبط بصفقة محددة إجرائياً) */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#41505c]/50 cursor-not-allowed select-none whitespace-nowrap"
              title={t('badge.under_development')}
            >
              <span>◈</span>
              <span>{t('authority.preview.nav_opening_committee')}</span>
            </div>

            {/* 5. العروض المستلمة (مرتبط بصفقة محددة إجرائياً) */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#41505c]/50 cursor-not-allowed select-none whitespace-nowrap"
              title={t('badge.under_development')}
            >
              <span>▣</span>
              <span>{t('authority.preview.nav_received_offers')}</span>
            </div>

            {/* 6. دفتر الشروط وسند */}
            <Link href="/authority/specs">
              <a
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  specsCurrent
                    ? 'text-white bg-[var(--auth-navy)] font-bold shadow-sm'
                    : 'text-[#41505c] hover:bg-slate-100 hover:text-[var(--auth-navy)]'
                }`}
                aria-current={specsCurrent ? 'page' : undefined}
              >
                <span>◉</span>
                <span>{t('authority.preview.nav_specs_sanad')}</span>
              </a>
            </Link>

            {/* 7. التقارير (غير نشط) */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#41505c]/50 cursor-not-allowed select-none whitespace-nowrap"
              title={t('badge.under_development')}
            >
              <span>▥</span>
              <span>{t('authority.preview.nav_reports')}</span>
            </div>

            {/* 8. سجل التدقيق (غير نشط) */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#41505c]/50 cursor-not-allowed select-none whitespace-nowrap"
              title={t('badge.under_development')}
            >
              <span>◌</span>
              <span>{t('authority.preview.nav_audit_log')}</span>
            </div>

            {/* 9. الإعدادات (غير نشط) */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#41505c]/50 cursor-not-allowed select-none whitespace-nowrap"
              title={t('badge.under_development')}
            >
              <span>⚙</span>
              <span>{t('authority.preview.nav_settings')}</span>
            </div>
          </nav>
        </aside>

        {/* Content View Area */}
        <main className="min-w-0 p-4 sm:p-6 md:p-8">
          <Switch>
            <Route path="/authority/drafts" component={DraftsList} />
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
            <Route path="/authority/specs" component={SpecsIndex} />
            <Route path="/authority/overview" component={AuthorityOverview} />
            <Route path="/authority" component={AuthorityOverview} />
            <Route>
              <PortalNotFound basePath="/authority" baseTitle="الرئيسية للمصلحة" />
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}
