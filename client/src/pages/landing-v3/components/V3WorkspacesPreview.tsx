import React, { useState } from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import { Logo } from '@/components/ui/Logo';
import {
  Users,
  Shield,
  Brain,
  Search,
  FileText,
  Clock,
  ClipboardCheck,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Map,
  TrendingUp,
  Lock,
  ShieldCheck,
  Activity,
  Settings,
  Bell,
  LogOut,
  Calculator,
  LayoutDashboard,
  Gavel,
  Radio,
  Monitor,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export function V3WorkspacesPreview() {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'operator' | 'authority' | 'central'>('operator');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const tabs = [
    {
      id: 'operator',
      label: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur Économique',
      shortLabel: isAr ? 'المتعامل الاقتصادي' : 'Opérateur',
      icon: Users,
      badge: isAr ? 'سحب وإيداع مشفر' : 'Dépôt Scellé',
    },
    {
      id: 'authority',
      label: isAr ? 'بوابة المصلحة المتعاقدة' : 'Portail Autorité Contractante',
      shortLabel: isAr ? 'المصلحة المتعاقدة' : 'Autorité',
      icon: Shield,
      badge: isAr ? 'فتح وتقييم علني' : 'Ouverture Publique',
    },
    {
      id: 'central',
      label: isAr ? 'بوابة الإدارة المركزية' : 'Portail Administration Centrale',
      shortLabel: isAr ? 'الإدارة المركزية' : 'Centrale',
      icon: Brain,
      badge: isAr ? 'رقابة ونزاهة' : 'Audit & Rapatriement',
    },
  ];

  return (
    <section id="showcase" dir={dir} className="py-20 sm:py-24 bg-slate-50 relative overflow-hidden">
      {/* توهج خلفي خفيف يكرس طابع الأبيض السيادي */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200/80 bg-white/80 backdrop-blur-md text-emerald-800 text-xs sm:text-sm font-bold shadow-xs mb-4">
            <Monitor className="size-3.5 text-emerald-600" strokeWidth={2} />
            <span>{isAr ? 'تجربة حية لمساحات العمل الثلاث' : 'Aperçu Réel des Espaces de Travail'}</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            {isAr ? 'معاينة واجهات المنصة' : 'Aperçu des Interfaces'}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            {isAr
              ? 'تصميم حقيقي مطابق لبيئة العمل الفعلية داخل المنصة، يعكس تجربة المستخدم الرسمية بكل تفاصيلها التشغيلية.'
              : 'Conception authentique et fidèle aux espaces de travail réels de la plateforme, illustrant chaque détail opérationnel.'}
          </p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="bg-slate-200/70 p-1.5 rounded-2xl flex flex-wrap justify-center gap-1.5 border border-slate-200 shadow-2xs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Browser Mockup Chrome Container */}
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl overflow-hidden transition-all duration-300">
            {/* شريط عنوان المتصفح (Browser Chrome) */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 select-none">
              {/* أزرار النافذة */}
              <div className="flex items-center gap-1.5 w-16">
                <span className="size-3 rounded-full bg-red-400 inline-block border border-red-500/30" />
                <span className="size-3 rounded-full bg-amber-400 inline-block border border-amber-500/30" />
                <span className="size-3 rounded-full bg-emerald-400 inline-block border border-emerald-500/30" />
              </div>

              {/* شريط الرابط المشفر السيادي */}
              <div className="flex-1 max-w-[480px] mx-auto">
                <div className="bg-white rounded-lg px-3.5 py-1 text-xs text-slate-600 font-mono border border-slate-200/90 flex items-center justify-center gap-2 shadow-2xs">
                  <Lock className="size-3.5 text-emerald-600" />
                  <span className="truncate">
                    https://safaqat.gov.dz/{activeTab}/dashboard
                  </span>
                </div>
              </div>

              {/* شارة الاتصال الحي */}
              <div className="w-16 flex items-center justify-end gap-1.5 text-[11px] font-mono text-emerald-700 font-bold">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            {/* الإطار المتكامل للمنصة (Sidebar + TopBar + Workspace Body) */}
            <div className="flex flex-col md:flex-row min-h-[580px] bg-white overflow-hidden text-slate-800">
              {/* Sidebar */}
              <RealPortalSidebar
                portal={activeTab}
                isAr={isAr}
                collapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 bg-slate-50/60 overflow-hidden">
                {/* Real TopBar */}
                <RealPortalTopBar portal={activeTab} isAr={isAr} />

                {/* Workspace Body */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[720px]">
                  {activeTab === 'operator' && <RealOperatorWorkspace isAr={isAr} />}
                  {activeTab === 'authority' && <RealAuthorityWorkspace isAr={isAr} />}
                  {activeTab === 'central' && <RealCentralWorkspace isAr={isAr} />}
                </div>
              </div>
            </div>

            {/* Footer الشريط السفلي الأمني للمتصفح */}
            <div className="bg-slate-100/90 border-t border-slate-200/80 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>
                  {isAr
                    ? 'نظام صفقات ذكية — مطابق للمرسوم الرئاسي 15-247 والقانون رقم 23-12'
                    : 'Safaqat Dzakia OS — Conforme Décret 15-247 & Loi 23-12'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200/80">
                  SHA-256 E-SEAL
                </span>
                <span className="hidden sm:inline">ALGERIA · DZ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// الشريط الجانبي المطابق للمنصة الحقيقية (Real Portal Sidebar)
// ─────────────────────────────────────────────────────────────────────────────
function RealPortalSidebar({
  portal,
  isAr,
  collapsed,
  onToggleCollapse,
}: {
  portal: 'operator' | 'authority' | 'central';
  isAr: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const portalMeta = {
    operator: {
      subtitle: isAr ? 'بوابة المتعامل الاقتصادي' : 'Opérateur Économique',
      userInitial: isAr ? 'ش' : 'S',
      userName: isAr ? 'شركة النور' : 'SARL EN-NOUR',
      userRole: isAr ? 'المتعامل الاقتصادي' : 'Opérateur Économique',
      sections: [
        {
          label: isAr ? 'الرئيسية' : 'PRINCIPAL',
          items: [
            { icon: LayoutDashboard, label: isAr ? 'مساحة العمل' : 'Espace de travail', active: true },
            { icon: ShieldCheck, label: isAr ? 'جواز السفر الرقمي' : 'Passeport numérique', active: false },
          ],
        },
        {
          label: isAr ? 'الفرص' : 'OPPORTUNITÉS',
          items: [
            { icon: Megaphone, label: isAr ? 'الإعلانات وفرص الصفقات' : 'Avis et opportunités', active: false },
            { icon: FileText, label: isAr ? 'دفاتر الشروط' : 'Cahiers des charges', active: false },
          ],
        },
        {
          label: isAr ? 'مشاركاتي' : 'ACTIVITÉ',
          items: [
            { icon: ClipboardCheck, label: isAr ? 'إدارة العروض' : 'Gestion des offres', active: false },
            { icon: FileText, label: isAr ? 'العقود والتنفيذ' : 'Contrats et exécution', active: false },
            { icon: Calculator, label: isAr ? 'مراجعة الأسعار' : 'Révision des prix', active: false },
          ],
        },
      ],
    },
    authority: {
      subtitle: isAr ? 'بوابة المصلحة المتعاقدة' : 'Autorité Contractante',
      userInitial: isAr ? 'م' : 'D',
      userName: isAr ? 'مديرية التجهيزات العمومية' : 'Direction des Équipements',
      userRole: isAr ? 'المصلحة المتعاقدة' : 'Autorité Contractante',
      sections: [
        {
          label: isAr ? 'الرئيسية' : 'PRINCIPAL',
          items: [
            { icon: LayoutDashboard, label: isAr ? 'مساحة العمل' : 'Espace de travail', active: true },
            { icon: FileText, label: isAr ? 'إدارة دفاتر الشروط' : 'Cahiers des charges', active: false },
          ],
        },
        {
          label: isAr ? 'الصفقات والمناقصات' : 'MARCHÉS',
          items: [
            { icon: Megaphone, label: isAr ? 'طلبات العروض المنشورة' : 'Appels d’offres', active: false },
            { icon: Calculator, label: isAr ? 'تقدير التكلفة B.O.Q' : 'Estimation B.O.Q', active: false },
          ],
        },
        {
          label: isAr ? 'اللجان والتقييم' : 'COMMISSIONS',
          items: [
            { icon: Radio, label: isAr ? 'فتح الأظرفة (COPEM)' : 'Ouverture des plis', active: false },
            { icon: Gavel, label: isAr ? 'لجنة تقييم العروض' : 'Évaluation des offres', active: false },
            { icon: ShieldCheck, label: isAr ? 'الطعون والنزاهة' : 'Recours et intégrité', active: false },
          ],
        },
      ],
    },
    central: {
      subtitle: isAr ? 'بوابة الإدارة المركزية' : 'Administration Centrale',
      userInitial: isAr ? 'م' : 'I',
      userName: isAr ? 'المفتشية العامة للمالية' : 'Inspection Générale des Finances',
      userRole: isAr ? 'الإدارة المركزية' : 'Administration Centrale',
      sections: [
        {
          label: isAr ? 'الرئيسية' : 'PRINCIPAL',
          items: [
            { icon: LayoutDashboard, label: isAr ? 'لوحة القيادة الوطنية' : 'Tableau de bord national', active: true },
            { icon: Activity, label: isAr ? 'المرصد الوطني للصفقات' : 'Observatoire national', active: false },
          ],
        },
        {
          label: isAr ? 'الرقابة والنزاهة' : 'SURVEILLANCE',
          items: [
            { icon: Map, label: isAr ? 'الخريطة الوطنية (69 ولاية)' : 'Carte nationale (69)', active: false },
            { icon: TrendingUp, label: isAr ? 'رادار الشبهات والتواطؤ' : 'Radar de collusion', active: false },
          ],
        },
        {
          label: isAr ? 'المنظومة والتشغيل' : 'SYSTÈME',
          items: [
            { icon: ShieldCheck, label: isAr ? 'صحة وسلامة المنصة' : 'Santé de la plateforme', active: false },
            { icon: FileText, label: isAr ? 'سجل التدقيق المؤسسي' : 'Journal d’audit', active: false },
          ],
        },
      ],
    },
  }[portal];

  return (
    <aside
      className={`bg-[#0f3154] text-white flex-none flex flex-col transition-all duration-300 select-none border-inline-end border-white/10 ${
        collapsed ? 'w-16' : 'w-60 md:w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-3.5 sm:p-4 border-b border-white/15 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 sm:size-9 rounded-lg bg-white p-1 shrink-0 grid place-items-center shadow-sm">
            <Logo size={24} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col leading-tight">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate">
                {isAr ? 'صفقات ذكية' : 'Safaqat Dzakia'}
              </span>
              <span className="text-[10px] text-white/80 font-medium truncate mt-0.5">
                {portalMeta.subtitle}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="size-6 rounded-md bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title={collapsed ? (isAr ? 'توسيع' : 'Agrandir') : isAr ? 'طي' : 'Réduire'}
        >
          {collapsed ? (
            <ChevronRight className="size-3.5 rtl:rotate-180" />
          ) : (
            <ChevronLeft className="size-3.5 rtl:rotate-180" />
          )}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-3 px-2 sm:px-2.5 space-y-3 overflow-y-auto">
        {portalMeta.sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <span className="block px-2 text-[10px] font-bold text-white/60 tracking-wider">
                {section.label}
              </span>
            )}
            {section.items.map((item, itemIdx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={itemIdx}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-default ${
                    item.active
                      ? 'bg-white text-[#0369a1] font-bold shadow-sm'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                  title={item.label}
                >
                  <ItemIcon className={`size-4 shrink-0 ${item.active ? 'text-[#0369a1]' : 'text-white/90'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Chip Footer */}
      <div className="p-3 border-t border-white/15 bg-black/10">
        <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative size-8 rounded-full bg-white text-[#0369a1] font-bold text-xs grid place-items-center shrink-0 shadow-sm">
            <span>{portalMeta.userInitial}</span>
            <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-1 ring-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <span className="block text-xs font-bold text-white truncate">
                {portalMeta.userName}
              </span>
              <span className="block text-[10px] text-white/75 truncate">
                {portalMeta.userRole}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// الشريط العلوي المطابق للواقع (Real Portal TopBar)
// ─────────────────────────────────────────────────────────────────────────────
function RealPortalTopBar({
  portal,
  isAr,
}: {
  portal: 'operator' | 'authority' | 'central';
  isAr: boolean;
}) {
  const breadcrumb = {
    operator: {
      parent: isAr ? 'المتعامل الاقتصادي' : 'Opérateur Économique',
      child: isAr ? 'مساحة العمل' : 'Espace de travail',
      searchPlaceholder: isAr ? 'بحث في الصفقات والعروض...' : 'Rechercher des marchés...',
    },
    authority: {
      parent: isAr ? 'المصلحة المتعاقدة' : 'Autorité Contractante',
      child: isAr ? 'مساحة العمل' : 'Espace de travail',
      searchPlaceholder: isAr ? 'بحث في دفاتر الشروط والمشاريع...' : 'Rechercher des cahiers des charges...',
    },
    central: {
      parent: isAr ? 'الإدارة المركزية' : 'Administration Centrale',
      child: isAr ? 'لوحة القيادة الوطنية' : 'Tableau de bord national',
      searchPlaceholder: isAr ? 'بحث في الصفقات والولايات...' : 'Recherche nationale...',
    },
  }[portal];

  return (
    <header className="h-13 sm:h-14 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between gap-3 select-none flex-none shadow-2xs">
      {/* Breadcrumb & Search */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 truncate">
          <span>{breadcrumb.parent}</span>
          <span className="text-slate-300">/</span>
          <strong className="text-slate-900 font-bold">{breadcrumb.child}</strong>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <Search className="size-3.5 absolute top-1/2 -translate-y-1/2 start-2.5 text-slate-400" />
          <input
            type="text"
            readOnly
            value=""
            placeholder={breadcrumb.searchPlaceholder}
            className="w-full h-8 ps-8 pe-3 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none cursor-default shadow-2xs"
          />
        </div>
      </div>

      {/* TopBar Actions Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Live Clock Widget */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono shadow-2xs">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isAr ? 'الجمعة 6 نوفمبر • 23:41' : 'Ven 6 Nov • 23:41'}</span>
        </div>

        {/* Language switch */}
        <div className="size-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center cursor-default shadow-2xs">
          {isAr ? 'FR' : 'عربي'}
        </div>

        {/* Sparkles / AI Assistant */}
        <div className="size-8 rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs">
          <Sparkles className="size-4" />
        </div>

        {/* Calendar */}
        <div className="hidden sm:flex size-8 rounded-lg border border-slate-200 bg-white text-slate-600 items-center justify-center shadow-2xs">
          <Calendar className="size-4" />
        </div>

        {/* Notifications */}
        <div className="relative size-8 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center shadow-2xs">
          <Bell className="size-4" />
          <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-emerald-500 ring-1 ring-white" />
        </div>

        {/* Settings */}
        <div className="hidden sm:flex size-8 rounded-lg border border-slate-200 bg-white text-slate-600 items-center justify-center shadow-2xs">
          <Settings className="size-4" />
        </div>

        {/* Building / Org */}
        <div className="hidden sm:flex size-8 rounded-lg border border-slate-200 bg-white text-slate-600 items-center justify-center shadow-2xs">
          <Building2 className="size-4" />
        </div>

        {/* Logout / Exit */}
        <div className="size-8 rounded-lg border border-red-200 bg-red-50 text-red-600 flex items-center justify-center shadow-2xs">
          <LogOut className="size-4 rtl:rotate-180" />
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. مساحة عمل المتعامل الاقتصادي (Real Operator Workspace — المطابقة للصورة)
// ─────────────────────────────────────────────────────────────────────────────
function RealOperatorWorkspace({ isAr }: { isAr: boolean }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* عنوان الصفحة والأزرار الإجرائية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isAr ? 'مساحة العمل' : 'Espace de travail'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'نظرة سريعة على الصفقات المتاحة، عروضك، وجاهزية مشاركتك'
              : 'Aperçu rapide des opportunités, vos offres et votre conformité'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* استكشف الصفقات */}
          <Link
            href="/operator/deals"
            className="inline-flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Search className="size-3.5" />
            <span>{isAr ? 'استكشف الصفقات' : 'Explorer les marchés'}</span>
          </Link>

          {/* إدارة العروض */}
          <Link
            href="/operator/offers"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            <ClipboardCheck className="size-3.5 text-slate-600" />
            <span>{isAr ? 'إدارة العروض' : 'Gérer mes offres'}</span>
          </Link>
        </div>
      </div>

      {/* شبكة المؤشرات الأربعة (KPIs) المطابقة تماماً للصورة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* كارت 1: صفقات متاحة */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'صفقات متاحة' : 'Marchés disponibles'}
            </span>
            <div className="size-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Search className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">1</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isAr ? 'منشورة ومفتوحة للتقديم' : 'Publiés et ouverts'}
          </p>
        </div>

        {/* كارت 2: عروضي المقدمة */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'عروضي المقدمة' : 'Mes offres soumises'}
            </span>
            <div className="size-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-400 font-mono">—</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isAr ? 'لم تقدّم أي عرض بعد' : 'Aucune offre déposée'}
          </p>
        </div>

        {/* كارت 3: مسودات قيد الإعداد */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'مسودات قيد الإعداد' : 'Brouillons en cours'}
            </span>
            <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-400 font-mono">—</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isAr ? 'لا توجد مسودات محفوظة' : 'Aucun brouillon sauvé'}
          </p>
        </div>

        {/* كارت 4: إجمالي مشاركاتي */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'إجمالي مشاركاتي' : 'Total participations'}
            </span>
            <div className="size-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ClipboardCheck className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-400 font-mono">—</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isAr ? 'لا توجد مشاركات مسجلة' : 'Aucune participation'}
          </p>
        </div>
      </div>

      {/* الصف الثاني: آخر الفرص المتاحة + حالة عروضي (مطابقة تماماً للصورة) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* كارت آخر الفرص المتاحة (Right in RTL) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
              {isAr ? 'آخر الفرص المتاحة' : 'Dernières opportunités'}
            </h4>
            <Link
              href="/operator/deals"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
            >
              <span>{isAr ? 'عرض الكل' : 'Voir tout'}</span>
              <ChevronLeft className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>

          {/* عنصر الصفقة المطابق لبيانات الصورة الحقيقية */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                {isAr
                  ? 'إنجاز مجمع مدرسي صنف (ج) ومطعم مدرسي ببلدية زر...'
                  : 'Réalisation d’un groupe scolaire type (C) et cantine...'}
              </h5>
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap text-end">
                145,000,000 دج
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <Building2 className="size-3.5 text-slate-400" />
                <span className="truncate">
                  {isAr ? 'مديرية التجهيزات العمومية - ولاية ...' : 'Direction des Équipements Publics...'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 font-medium">
                <Calendar className="size-3.5 text-slate-400" />
                <span>{isAr ? 'آخر أجل 17 نوفمبر 2026' : 'Délai : 17 Nov 2026'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {isAr ? '2 نوفمبر 2026' : '02 Nov 2026'}
              </span>
            </div>
          </div>
        </div>

        {/* كارت حالة عروضي (Left in RTL) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
              {isAr ? 'حالة عروضي' : 'Statut de mes offres'}
            </h4>
            <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-100">
              {isAr ? 'رسم بياني' : 'Graphique'}
            </span>
          </div>

          {/* الصندوق المنقط الفارغ بحالته الافتراضية كما في الصورة */}
          <div className="border border-dashed border-sky-200 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-sky-50/15 min-h-[140px]">
            <div className="size-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-2 shadow-2xs">
              <FileText className="size-5" />
            </div>
            <h5 className="font-bold text-xs text-slate-800">
              {isAr ? 'لا توجد بيانات لعرضها' : 'Aucune donnée à afficher'}
            </h5>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isAr ? 'سيظهر التوزيع بعد تقديم عروض' : 'La répartition s’affichera après soumission'}
            </p>
            <Link
              href="/operator/deals"
              className="mt-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-sky-200/80 transition-colors inline-block"
            >
              {isAr ? 'إعداد عرض' : 'Préparer une offre'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. مساحة عمل المصلحة المتعاقدة (Real Authority Workspace)
// ─────────────────────────────────────────────────────────────────────────────
function RealAuthorityWorkspace({ isAr }: { isAr: boolean }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* عنوان الصفحة والأزرار الإجرائية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isAr ? 'مساحة العمل' : 'Espace de travail'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'إدارة دفاتر الشروط، جداول B.O.Q، ولجان فتح الأظرفة والتقييم'
              : 'Gestion des cahiers des charges, B.O.Q et commissions de dépouillement'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/authority/deals/new"
            className="inline-flex items-center gap-1.5 bg-[#006233] hover:bg-[#004d28] text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <FileText className="size-3.5" />
            <span>{isAr ? 'إنشاء صفقة جديدة' : 'Nouveau marché'}</span>
          </Link>
          <Link
            href="/authority/opening-sessions"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            <Radio className="size-3.5 text-emerald-600" />
            <span>{isAr ? 'جلسات الفحص' : 'Séances COPEM'}</span>
          </Link>
        </div>
      </div>

      {/* شبكة المؤشرات الأربعة للمصلحة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'طلبات العروض النشطة' : 'Appels d’offres actifs'}
            </span>
            <div className="size-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Megaphone className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">3</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1 truncate">
            {isAr ? 'منشورة في النشرة الرسمية' : 'Publiés au BOMOP'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'عروض مستلمة مشفرة' : 'Offres scellées'}
            </span>
            <div className="size-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Lock className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">14</div>
          <p className="text-[11px] text-blue-700 font-medium mt-1 truncate">
            {isAr ? 'أقفال زمنية SHA-256' : 'Verrous horodatés'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'لجان قيد الانعقاد' : 'Commissions actives'}
            </span>
            <div className="size-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Gavel className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">2</div>
          <p className="text-[11px] text-amber-700 font-medium mt-1 truncate">
            {isAr ? 'نصاب قانوني 5/5 مكتمل' : 'Quorum 5/5 atteint'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'نسبة الامتثال القانوني' : 'Score conformité'}
            </span>
            <div className="size-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">98.4%</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1 truncate">
            {isAr ? 'تأشيرة المرسوم 15-247' : 'Visa Décret 15-247'}
          </p>
        </div>
      </div>

      {/* جدول الصفقات قيد التقييم والمطابقة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
              {isAr ? 'الصفقات المطروحة للتقييم' : 'Marchés en évaluation'}
            </h4>
            <span className="text-[11px] font-mono text-slate-400">SESSION 2026</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-xs text-slate-900">
                  {isAr ? 'تجهيز عتاد طبي متقدم للمستشفى الجامعي' : 'Équipement biomédical pour CHU'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  88,000,000 دج · COPEM (5/5)
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                {isAr ? 'فتح علني' : 'Ouvert'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-xs text-slate-900">
                  {isAr ? 'أشغال صيانة وإعادة تأهيل شبكة المياه' : 'Réhabilitation réseau eau potable'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  42,300,000 دج · طعون (10 أيام)
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                {isAr ? 'منح مؤقت' : 'Provisoire'}
              </span>
            </div>
          </div>
        </div>

        {/* كارت التأشيرة الرقابية والنزاهة */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                {isAr ? 'تأشيرة الرقابة القانونية' : 'Visa de Conformité Légale'}
              </h4>
              <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                VALIDÉ
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'تم فحص الشروط الإدارية والمالية وفق المادتين 65 و72 من المرسوم الرئاسي 15-247، مع التحقق الفوري من التراخيص والشهادات الجبائية وشبه الجبائية.'
                : 'Conformité vérifiée selon les articles 65 et 72 du décret présidentiel 15-247 avec contrôle direct CNAS et CASNOS.'}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-mono">
            <span>COPEM SIGNATURE VERIFIED</span>
            <span className="font-bold">100% AUDITED</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. مساحة عمل الإدارة المركزية (Real Central Workspace)
// ─────────────────────────────────────────────────────────────────────────────
function RealCentralWorkspace({ isAr }: { isAr: boolean }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* عنوان الصفحة والأزرار الإجرائية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isAr ? 'لوحة القيادة الوطنية' : 'Tableau de bord national'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'المرصد الوطني للصفقات العمومية والرقابة اللحظية على النزاهة والمخاطر'
              : 'Observatoire national et supervision en temps réel de l’intégrité'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/central/platform-health"
            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Activity className="size-3.5" />
            <span>{isAr ? 'صحة المنصة 100%' : 'Santé Plateforme'}</span>
          </Link>
          <Link
            href="/central/map"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold shadow-2xs transition-colors"
          >
            <Map className="size-3.5 text-slate-600" />
            <span>{isAr ? 'خريطة الولايات' : 'Carte Wilayas'}</span>
          </Link>
        </div>
      </div>

      {/* شبكة المؤشرات الأربعة للإدارة المركزية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'إجمالي الصفقات الوطنية' : 'Total marchés nationaux'}
            </span>
            <div className="size-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">1,482</div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {isAr ? 'عبر 69 ولاية' : 'Sur 69 wilayas'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'القيمة المرصودة' : 'Volume financier'}
            </span>
            <div className="size-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calculator className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">842 Mrd</div>
          <p className="text-[11px] text-blue-700 font-medium mt-1 truncate">
            {isAr ? 'دينار جزائري' : 'Dinars Algériens'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'تنبيهات رادار النزاهة' : 'Alertes intégrité'}
            </span>
            <div className="size-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">4</div>
          <p className="text-[11px] text-rose-600 font-medium mt-1 truncate">
            {isAr ? 'قيد التحقيق الفوري' : 'Enquête prioritaire'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'مؤشر سلامة المنصة' : 'Santé opérationnelle'}
            </span>
            <div className="size-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">100%</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1 truncate">
            {isAr ? 'جميع الخوادم مستقرة' : 'Tous systèmes OK'}
          </p>
        </div>
      </div>

      {/* بطاقتي الرقابة والتغطية الإقليمية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
              {isAr ? 'الرقابة اللحظية على الصفقات الكبرى' : 'Surveillance des grands projets'}
            </h4>
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              ONLINE
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-xs text-slate-900">
                  {isAr ? 'مشروع خط السكة الحديدية المنجمي الغربي' : 'Ligne ferroviaire minière Ouest'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  بشار - تندوف · مطابقة تامة
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {isAr ? 'مؤشر أخضر' : 'Conforme'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-xs text-slate-900">
                  {isAr ? 'توريد محطات طاقة شمسية كبرى' : 'Centrales solaires photovoltaïques'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ورقلة · تأشيرة رقابة قبلية
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {isAr ? 'معتمد' : 'Approuvé'}
              </span>
            </div>
          </div>
        </div>

        {/* رادار كشف التواطؤ ومؤشرات المخاطر */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
              {isAr ? 'رادار كشف التواطؤ والشبهات' : 'Radar de Risques & Collusion'}
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Law 23-12</span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 bg-rose-50/90 border border-rose-200 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-rose-800 font-bold">
                  {isAr ? 'تحذير بصمة وثيقة:' : 'Alerte métadonnées :'}
                </span>{' '}
                <span className="text-slate-700">
                  {isAr
                    ? 'تشابه في البصمة الرقمية لملفات فنية بين متعهدين اثنين في وهران.'
                    : 'Similarité de métadonnées entre deux soumissionnaires à Oran.'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs flex items-start gap-2">
              <Activity className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-amber-800 font-bold">
                  {isAr ? 'متابعة الآجال:' : 'Suivi des délais :'}
                </span>{' '}
                <span className="text-slate-700">
                  {isAr
                    ? 'تأخر في إصدار أمر بداية الخدمة (ODS) لصفقة بولاية سطيف.'
                    : 'Retard dans l’émission de l’Ordre de Service à Sétif.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default V3WorkspacesPreview;
