import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import './landing.css';
import { HeroSection } from './components/HeroSection';

export function LandingPage() {
  const { user, status } = useAuth();
  const [, setLocation] = useLocation();
  const { t, dir, lang, setLang } = useI18n();
  const [activeStage, setActiveStage] = useState(0);

  const getPortalPath = () => {
    if (!user) return '/login';
    if (user.role === 'central_admin') return '/central';
    return `/${user.role}`;
  };

  return (
    <div className="landing-root min-h-screen w-full flex flex-col font-sans" dir={dir}>
      {/* Top Banner if user is already authenticated */}
      {status === 'authenticated' && user && (
        <aside className="w-full bg-slate-900 border-b border-slate-700/60 px-4 py-2.5 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-2 z-50">
          <div className="truncate max-w-[280px] sm:max-w-none">
            أنت مسجل بحساب: <strong className="text-emerald-400 font-semibold">{user.displayName || user.email}</strong>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-emerald-600/70 text-emerald-300 hover:bg-emerald-950/80 whitespace-nowrap"
            onClick={() => setLocation(getPortalPath())}
          >
            الانتقال إلى مساحة عملك
          </Button>
        </aside>
      )}

      {/* Header / Institutional Navbar */}
      <nav className="inst-navbar sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="wrap flex items-center justify-between h-16 sm:h-20">
          {/* Framed National Identity Brand Pill */}
          <Link href="/" className="inst-brand-pill flex items-center gap-3 group">
            <span className="inst-brand-dot" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-tight group-hover:text-emerald-800 transition-colors">
                {t('landing.brand')}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wider">
                {t('landing.subbrand')}
              </span>
            </div>
          </Link>

          {/* Navigation Anchors (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#problem" className="hover:text-emerald-700 transition-colors py-1">{t('landing.nav.problem')}</a>
            <a href="#solution" className="hover:text-emerald-700 transition-colors py-1">{t('landing.nav.solution')}</a>
            <a href="#journey" className="hover:text-emerald-700 transition-colors py-1">{t('landing.nav.journey')}</a>
            <a href="#innovation" className="hover:text-emerald-700 transition-colors py-1">{t('landing.nav.innovation')}</a>
            <a href="#agents" className="hover:text-emerald-700 transition-colors py-1">{t('landing.nav.agents')}</a>
            <a href="#governance" className="hover:text-emerald-700 transition-colors py-1">{t('landing.nav.governance')}</a>
            <a href="#legal" className="hover:text-emerald-700 transition-colors py-1">{t('landing.nav.legal')}</a>
          </div>

          {/* Actions: Language Switcher + Login CTA */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
              className="inst-lang-btn px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              aria-label="تبديل لغة العرض"
            >
              {lang === 'ar' ? 'Français' : 'العربية'}
            </button>
            <Link
              href="/login"
              className="inst-btn-primary inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-all hover:shadow active:scale-98"
            >
              <span>{t('landing.nav.login')}</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full">
        {/* ============================================================
            SECTION 01 — HERO (OFFICIAL LEDGER DESIGN SYSTEM)
        ============================================================= */}
        <HeroSection onStartClick={() => setLocation(getPortalPath())} />

        {/* ============================================================
            SECTION 02 — المشكلة (The Problem)
        ============================================================= */}
        <section className="section-padding bg-slate-50/70 border-t border-slate-200/70" id="problem">
          <div className="wrap">
            <header className="section-head text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inst-badge mb-3">{t('landing.problem.badge')}</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                {t('landing.problem.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('landing.problem.subtitle')}
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Card 01 — تعدد الأطراف */}
              <article className="inst-card bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-5 font-bold" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 tracking-wider block mb-1">01</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {t('landing.problem.c1_title')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t('landing.problem.c1_desc')}
                  </p>
                </div>
              </article>

              {/* Card 02 — تعدد الوثائق */}
              <article className="inst-card bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-5 font-bold" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 tracking-wider block mb-1">02</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {t('landing.problem.c2_title')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t('landing.problem.c2_desc')}
                  </p>
                </div>
              </article>

              {/* Card 03 — تعدد المراحل */}
              <article className="inst-card bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-5 font-bold" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="4" y1="21" x2="4" y2="14" />
                      <line x1="4" y1="10" x2="4" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="3" />
                      <line x1="20" y1="21" x2="20" y2="16" />
                      <line x1="20" y1="12" x2="20" y2="3" />
                      <line x1="1" y1="14" x2="7" y2="14" />
                      <line x1="9" y1="8" x2="15" y2="8" />
                      <line x1="17" y1="16" x2="23" y2="16" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 tracking-wider block mb-1">03</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {t('landing.problem.c3_title')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t('landing.problem.c3_desc')}
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 03 — الحل (The Solution)
        ============================================================= */}
        <section className="section-padding bg-white border-t border-slate-200/80" id="solution">
          <div className="wrap">
            <header className="section-head text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inst-badge mb-3">{t('landing.solution.badge')}</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                {t('landing.solution.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('landing.solution.subtitle')}
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Actor 1: المتعامل الاقتصادي */}
              <article className="inst-actor-card bg-slate-50/70 p-6 sm:p-8 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-emerald-600/50 transition-colors">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center mb-5" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {t('landing.solution.actor1_role')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t('landing.solution.actor1_desc')}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>مشاركة ومتابعة العروض</span>
                  <span className="text-emerald-700">✓ مفعّل</span>
                </div>
              </article>

              {/* Actor 2: المصلحة المتعاقدة */}
              <article className="inst-actor-card bg-slate-50/70 p-6 sm:p-8 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-emerald-600/50 transition-colors">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center mb-5" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18" />
                      <path d="M5 21V7l8-4v18" />
                      <path d="M19 21V11l-6-4" />
                      <path d="M9 9h.01" />
                      <path d="M9 12h.01" />
                      <path d="M9 15h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {t('landing.solution.actor2_role')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t('landing.solution.actor2_desc')}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>تسيير وإبرام الصفقة</span>
                  <span className="text-emerald-700">✓ مفعّل</span>
                </div>
              </article>

              {/* Actor 3: الإدارة المركزية */}
              <article className="inst-actor-card bg-slate-50/70 p-6 sm:p-8 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-emerald-600/50 transition-colors">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center mb-5" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {t('landing.solution.actor3_role')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    {t('landing.solution.actor3_desc')}
                  </p>
                  <div className="bg-amber-50 text-amber-900 text-xs px-3 py-2 rounded-lg border border-amber-200/80 font-medium">
                    {t('landing.solution.central_note')}
                  </div>
                </div>
                <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>رقابة وتحليل مستقل</span>
                  <span className="text-emerald-700">✓ مفعّل</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 04 — دورة الصفقة (Procurement Lifecycle Journey)
        ============================================================= */}
        <section className="section-padding bg-slate-50/70 border-t border-slate-200/80" id="journey">
          <div className="wrap">
            <header className="section-head text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inst-badge mb-3">{t('landing.journey.badge')}</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                {t('landing.journey.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('landing.journey.subtitle')}
              </p>
            </header>

            {/* Three Conceptual Macro-Zones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-white border border-slate-200 text-center">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  {t('landing.journey.zone_prep')}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {t('landing.journey.zone_prep_sub')}
                </span>
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200 text-center">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  {t('landing.journey.zone_award')}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {t('landing.journey.zone_award_sub')}
                </span>
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200 text-center">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  {t('landing.journey.zone_exec')}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {t('landing.journey.zone_exec_sub')}
                </span>
              </div>
            </div>

            {/* Visual Procurement Journey Track (Responsive horizontal desktop / vertical mobile) */}
            <div className="journey-track-wrapper bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-4 relative">
                {/* Horizontal connector line for Desktop */}
                <div className="hidden md:block absolute top-7 start-10 end-10 h-0.5 bg-slate-200 -z-0" aria-hidden="true" />

                {/* Stage 01: التخطيط */}
                <div
                  className={`journey-node flex flex-col items-center text-center relative z-10 cursor-pointer ${activeStage === 0 ? 'is-active' : ''}`}
                  onClick={() => setActiveStage(0)}
                >
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm mb-4 border-4 border-white shadow-sm ring-2 ring-slate-900/10">
                    01
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.journey.stage1_title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-[220px]">{t('landing.journey.stage1_desc')}</p>
                </div>

                {/* Stage 02: الإعلان */}
                <div
                  className={`journey-node flex flex-col items-center text-center relative z-10 cursor-pointer ${activeStage === 1 ? 'is-active' : ''}`}
                  onClick={() => setActiveStage(1)}
                >
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm mb-4 border-4 border-white shadow-sm ring-2 ring-slate-900/10">
                    02
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.journey.stage2_title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-[220px]">{t('landing.journey.stage2_desc')}</p>
                </div>

                {/* Stage 03: التقييم */}
                <div
                  className={`journey-node flex flex-col items-center text-center relative z-10 cursor-pointer ${activeStage === 2 ? 'is-active' : ''}`}
                  onClick={() => setActiveStage(2)}
                >
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm mb-4 border-4 border-white shadow-sm ring-2 ring-slate-900/10">
                    03
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.journey.stage3_title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-[220px]">{t('landing.journey.stage3_desc')}</p>
                </div>

                {/* Stage 04: التنفيذ */}
                <div
                  className={`journey-node flex flex-col items-center text-center relative z-10 cursor-pointer ${activeStage === 3 ? 'is-active' : ''}`}
                  onClick={() => setActiveStage(3)}
                >
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm mb-4 border-4 border-white shadow-sm ring-2 ring-slate-900/10">
                    04
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.journey.stage4_title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-[220px]">{t('landing.journey.stage4_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 05 — الابتكار (Innovation with Readiness Levels)
        ============================================================= */}
        <section className="section-padding bg-white border-t border-slate-200/80" id="innovation">
          <div className="wrap">
            <header className="section-head text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inst-badge mb-3">{t('landing.innovation.badge')}</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                {t('landing.innovation.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('landing.innovation.subtitle')}
              </p>
            </header>

            {/* Subsection 1: الميزات المتاحة (Available in Code) */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 rounded-full bg-emerald-600" aria-hidden="true" />
                <h3 className="text-lg font-bold text-slate-900">
                  {t('landing.innovation.available_heading')}
                </h3>
                <span className="inst-status-badge inst-status-available text-xs ms-auto">
                  🟢 {t('landing.innovation.status_available')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. وكلاء الذكاء الاصطناعي */}
                <div className="p-5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-available text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_available')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.f_ai_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.f_ai_desc')}</p>
                  </div>
                </div>

                {/* 2. تحليل الوثائق */}
                <div className="p-5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-available text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_available')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.f_docs_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.f_docs_desc')}</p>
                  </div>
                </div>

                {/* 3. كشف المخاطر والحالات غير العادية */}
                <div className="p-5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-available text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_available')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.f_risk_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.f_risk_desc')}</p>
                  </div>
                </div>

                {/* 4. تتبع دورة الصفقة */}
                <div className="p-5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-available text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_available')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.f_cycle_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.f_cycle_desc')}</p>
                  </div>
                </div>

                {/* 5. إدارة الصلاحيات والأدوار */}
                <div className="p-5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-available text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_available')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.f_roles_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.f_roles_desc')}</p>
                  </div>
                </div>

                {/* 6. الرقابة والتحليل المركزي */}
                <div className="p-5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-available text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_available')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.f_central_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.f_central_desc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subsection 2: ميزات قيد التطوير (In Development) */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 rounded-full bg-amber-500" aria-hidden="true" />
                <h3 className="text-lg font-bold text-slate-900">
                  {t('landing.innovation.dev_heading')}
                </h3>
                <span className="inst-status-badge inst-status-dev text-xs ms-auto">
                  🟠 {t('landing.innovation.status_dev')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. التكامل مع الأنظمة الحكومية */}
                <div className="p-5 rounded-xl border border-amber-200/70 bg-amber-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-dev text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_dev')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.d_gov_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.d_gov_desc')}</p>
                  </div>
                </div>

                {/* 2. الدفع الإلكتروني */}
                <div className="p-5 rounded-xl border border-amber-200/70 bg-amber-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-dev text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_dev')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.d_pay_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.d_pay_desc')}</p>
                  </div>
                </div>

                {/* 3. التوقيع الإلكتروني */}
                <div className="p-5 rounded-xl border border-amber-200/70 bg-amber-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-dev text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_dev')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.d_sign_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.d_sign_desc')}</p>
                  </div>
                </div>

                {/* 4. التكامل مع CNRC والهيئات ذات الصلة */}
                <div className="p-5 rounded-xl border border-amber-200/70 bg-amber-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-dev text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_dev')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.d_cnrc_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.d_cnrc_desc')}</p>
                  </div>
                </div>

                {/* 5. أتمتة متقدمة لعمل اللجان */}
                <div className="p-5 rounded-xl border border-amber-200/70 bg-amber-50/30 flex flex-col justify-between">
                  <div>
                    <span className="inst-status-badge inst-status-dev text-[11px] mb-2.5 inline-block">
                      {t('landing.innovation.status_dev')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.innovation.d_comm_title')}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('landing.innovation.d_comm_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 06 — الوكلاء الذكيون (Smart Agents Flow)
        ============================================================= */}
        <section className="section-padding bg-slate-50/70 border-t border-slate-200/80" id="agents">
          <div className="wrap">
            <header className="section-head text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inst-badge mb-3">{t('landing.agents.badge')}</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                {t('landing.agents.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('landing.agents.subtitle')}
              </p>
            </header>

            {/* Core Message Card */}
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 text-center shadow-xs mb-10">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                {t('landing.agents.core_sub')}
              </span>
              <p className="text-lg sm:text-xl font-black text-slate-900 leading-relaxed">
                « {t('landing.agents.core_rule')} »
              </p>
            </div>

            {/* Visual Workflow Flow (Strictly Institutional, No Chatbot) */}
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 text-center items-center">
                {/* Step 1: AI Agent */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xl mb-1.5" aria-hidden="true">🤖</div>
                  <div className="text-xs font-extrabold text-slate-900">{t('landing.agents.step1')}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{t('landing.agents.step1_sub')}</div>
                </div>

                {/* Step 2: تحليل */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xl mb-1.5" aria-hidden="true">🔍</div>
                  <div className="text-xs font-extrabold text-slate-900">{t('landing.agents.step2')}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{t('landing.agents.step2_sub')}</div>
                </div>

                {/* Step 3: توصية */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xl mb-1.5" aria-hidden="true">💡</div>
                  <div className="text-xs font-extrabold text-slate-900">{t('landing.agents.step3')}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{t('landing.agents.step3_sub')}</div>
                </div>

                {/* Step 4: مراجعة بشرية */}
                <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-300 font-bold">
                  <div className="text-xl mb-1.5" aria-hidden="true">👤</div>
                  <div className="text-xs font-extrabold text-emerald-950">{t('landing.agents.step4')}</div>
                  <div className="text-[10px] text-emerald-800 mt-1">{t('landing.agents.step4_sub')}</div>
                </div>

                {/* Step 5: قرار */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xl mb-1.5" aria-hidden="true">⚖️</div>
                  <div className="text-xs font-extrabold text-slate-900">{t('landing.agents.step5')}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{t('landing.agents.step5_sub')}</div>
                </div>

                {/* Step 6: سجل تدقيق */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xl mb-1.5" aria-hidden="true">🔒</div>
                  <div className="text-xs font-extrabold text-slate-900">{t('landing.agents.step6')}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{t('landing.agents.step6_sub')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 07 — الذكاء داخل دورة الصفقة (Intelligence Grid)
        ============================================================= */}
        <section className="section-padding bg-white border-t border-slate-200/80" id="intelligence">
          <div className="wrap">
            <header className="section-head text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inst-badge mb-3">{t('landing.intelligence.badge')}</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                {t('landing.intelligence.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('landing.intelligence.subtitle')}
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. الوثائق */}
              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold mb-4" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.intelligence.c1_title')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t('landing.intelligence.c1_desc')}</p>
              </article>

              {/* 2. المخاطر */}
              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold mb-4" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.intelligence.c2_title')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t('landing.intelligence.c2_desc')}</p>
              </article>

              {/* 3. الميزانية */}
              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold mb-4" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.intelligence.c3_title')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t('landing.intelligence.c3_desc')}</p>
              </article>

              {/* 4. الرقابة */}
              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold mb-4" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.intelligence.c4_title')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t('landing.intelligence.c4_desc')}</p>
              </article>

              {/* 5. التحليلات */}
              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold mb-4" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.intelligence.c5_title')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t('landing.intelligence.c5_desc')}</p>
              </article>

              {/* 6. المتعاملون */}
              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold mb-4" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('landing.intelligence.c6_title')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t('landing.intelligence.c6_desc')}</p>
              </article>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 08 — الثقة والحوكمة (Trust & Governance)
        ============================================================= */}
        <section className="section-padding bg-slate-50/70 border-t border-slate-200/80" id="governance">
          <div className="wrap">
            <header className="section-head text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inst-badge mb-3">{t('landing.governance.badge')}</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                {t('landing.governance.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('landing.governance.subtitle')}
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Pillar 1: التتبع */}
              <article className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold mb-4" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landing.governance.p1_title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('landing.governance.p1_desc')}</p>
              </article>

              {/* Pillar 2: الصلاحيات */}
              <article className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold mb-4" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landing.governance.p2_title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('landing.governance.p2_desc')}</p>
              </article>

              {/* Pillar 3: المراجعة البشرية */}
              <article className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold mb-4" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landing.governance.p3_title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('landing.governance.p3_desc')}</p>
              </article>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 09 — الركائز القانونية (Legal Pillars)
        ============================================================= */}
        <section className="section-padding bg-white border-t border-slate-200/80" id="legal">
          <div className="wrap">
            <header className="section-head text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inst-badge mb-3">{t('landing.legal.badge')}</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                {t('landing.legal.title')}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {t('landing.legal.subtitle')}
              </p>
            </header>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-800 tracking-wider block mb-2">01</span>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{t('landing.legal.r1_title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{t('landing.legal.r1_desc')}</p>
                </div>
              </article>

              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-800 tracking-wider block mb-2">02</span>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{t('landing.legal.r2_title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{t('landing.legal.r2_desc')}</p>
                </div>
              </article>

              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-800 tracking-wider block mb-2">03</span>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{t('landing.legal.r3_title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{t('landing.legal.r3_desc')}</p>
                </div>
              </article>

              <article className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-800 tracking-wider block mb-2">04</span>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{t('landing.legal.r4_title')}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{t('landing.legal.r4_desc')}</p>
                </div>
              </article>
            </div>

            {/* Visual Legal Flow */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold text-slate-500 mb-3 block">
                {t('landing.legal.flow_title')}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-extrabold text-slate-800">
                <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">{t('landing.legal.flow_law')}</span>
                <span className="text-slate-400">➔</span>
                <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">{t('landing.legal.flow_proc')}</span>
                <span className="text-slate-400">➔</span>
                <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">{t('landing.legal.flow_digit')}</span>
                <span className="text-slate-400">➔</span>
                <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">{t('landing.legal.flow_trace')}</span>
                <span className="text-slate-400">➔</span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs">{t('landing.legal.flow_audit')}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed">
                {t('landing.legal.disclaimer')}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 10 — CTA النهائي (Final Call to Action)
        ============================================================= */}
        <section className="section-padding bg-slate-900 text-white relative overflow-hidden" id="cta">
          {/* Subtle national green & red ambient lighting */}
          <div className="absolute top-0 start-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 end-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="wrap relative z-10 text-center max-w-3xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold tracking-wider mb-4">
              {t('landing.cta.badge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {t('landing.cta.title')}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8 max-w-xl mx-auto">
              {t('landing.cta.subtitle')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-6 sm:px-8 py-3 text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-lg shadow-md transition-all active:scale-98"
              >
                {t('landing.cta.btn_primary')}
              </Link>
              <a
                href="#journey"
                className="px-6 sm:px-8 py-3 text-sm font-bold text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all active:scale-98"
              >
                {t('landing.cta.btn_secondary')}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 text-slate-600 text-xs">
        <div className="wrap">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand */}
            <div className="md:col-span-2">
              <div className="inst-brand-pill inline-flex items-center gap-3 mb-3">
                <span className="inst-brand-dot" aria-hidden="true" />
                <span className="font-extrabold text-slate-900 text-base">{t('landing.brand')}</span>
              </div>
              <p className="text-slate-500 leading-relaxed max-w-sm mb-3">
                {t('landing.footer.sub')}
              </p>
              <span className="text-[11px] font-semibold text-slate-400 block">
                {t('landing.subbrand')}
              </span>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">{t('landing.footer.sections')}</h4>
              <ul className="flex flex-col gap-2">
                <li><a href="#problem" className="hover:text-emerald-700 transition-colors">{t('landing.nav.problem')}</a></li>
                <li><a href="#solution" className="hover:text-emerald-700 transition-colors">{t('landing.nav.solution')}</a></li>
                <li><a href="#journey" className="hover:text-emerald-700 transition-colors">{t('landing.nav.journey')}</a></li>
                <li><a href="#innovation" className="hover:text-emerald-700 transition-colors">{t('landing.nav.innovation')}</a></li>
                <li><a href="#agents" className="hover:text-emerald-700 transition-colors">{t('landing.nav.agents')}</a></li>
              </ul>
            </div>

            {/* Col 3: Portals & Access */}
            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">{t('landing.footer.portals')}</h4>
              <ul className="flex flex-col gap-2">
                <li><Link href="/login" className="hover:text-emerald-700 transition-colors">{t('landing.solution.actor1_role')}</Link></li>
                <li><Link href="/login" className="hover:text-emerald-700 transition-colors">{t('landing.solution.actor2_role')}</Link></li>
                <li><Link href="/login" className="hover:text-emerald-700 transition-colors">{t('landing.solution.actor3_role')}</Link></li>
                <li><a href="#legal" className="hover:text-emerald-700 transition-colors">{t('landing.nav.legal')}</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-slate-500">
            <div>{t('landing.footer.rights')}</div>
            <div className="flex items-center gap-4">
              <span>GovTech · LegalTech · AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
