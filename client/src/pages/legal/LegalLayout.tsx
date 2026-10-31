import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import {
  Globe,
  HelpCircle,
  FileText,
  Accessibility,
  LogIn,
  Home,
} from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  kicker: string;
  subtitle: string;
  lastUpdated?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function LegalLayout({
  title,
  kicker,
  subtitle,
  lastUpdated = 'أكتوبر 2026 / Octobre 2026',
  icon,
  children,
}: LegalLayoutProps) {
  const { lang, dir, setLang } = useI18n();
  const [currentLocation] = useLocation();

  const isFr = lang === 'fr';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `${title} | ${isFr ? 'Safaqat Dhakia' : 'صفقات ذكية'}`;
  }, [title, isFr]);

  const toggleLanguage = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  const navLinks = [
    {
      href: '/terms',
      label: isFr ? 'Conditions d’utilisation' : 'شروط الاستخدام',
      icon: FileText,
      active: currentLocation === '/terms',
    },
    {
      href: '/faq',
      label: isFr ? 'Foire Aux Questions' : 'الأسئلة الشائعة',
      icon: HelpCircle,
      active: currentLocation === '/faq',
    },
    {
      href: '/accessibility',
      label: isFr ? 'Accessibilité' : 'إمكانية الوصول',
      icon: Accessibility,
      active: currentLocation === '/accessibility',
    },
  ];

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0b1a2b] font-['Cairo',sans-serif] selection:bg-[#10b981]/20 selection:text-[#047857]"
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. HEADER العلوي السيادي
          ═══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* الشعار والاسم الرسمي */}
          <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] rounded-lg p-1">
            <div className="size-9 rounded-xl bg-gradient-to-br from-[#0f3154] to-[#047857] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Logo size={26} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#0f3154] leading-tight">
                {isFr ? 'Safaqat Dhakia' : 'صفقات ذكية'}
              </span>
              <span className="text-[10px] font-semibold text-[#047857] leading-none">
                {isFr ? 'Plateforme Nationale des Marchés Publics' : 'المنصة الوطنية للصفقات العمومية'}
              </span>
            </div>
          </Link>

          {/* روابط التنقل السريعة بين الصفحات القانونية */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60" aria-label="التنقل القانوني">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    item.active
                      ? 'bg-white text-[#0f3154] shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-[#0f3154] hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* أدوات التحكم: العودة للرئيسية، تبديل اللغة، تسجيل الدخول */}
          <div className="flex items-center gap-2">
            {/* تبديل اللغة */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0f3154] shadow-2xs transition-colors"
              title={isFr ? 'Passer en Arabe' : 'التحويل إلى الفرنسية'}
              aria-label={isFr ? 'Passer en Arabe' : 'التحويل إلى الفرنسية'}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{isFr ? 'العربية' : 'FR'}</span>
            </button>

            {/* الرجوع إلى الصفحة الرئيسية */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0f3154] shadow-2xs transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isFr ? 'Accueil' : 'الرئيسية'}</span>
            </Link>

            {/* الدخول للمنصة */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0f3154] hover:bg-[#0b243e] text-white shadow-2xs transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isFr ? 'Connexion' : 'دخول'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. HERO SECTION / رأس الصفحة
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-white via-slate-50/60 to-transparent border-b border-slate-200/60 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* مسار التنقل البسيط (Breadcrumb) */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4">
            <Link href="/" className="hover:text-[#0f3154] transition-colors">
              {isFr ? 'Accueil' : 'الرئيسية'}
            </Link>
            <span>/</span>
            <span className="text-[#047857] font-semibold">{title}</span>
          </div>

          {/* الشارة والرمز */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
              {icon}
              {kicker}
            </span>
            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {isFr ? 'Dernière mise à jour :' : 'آخر تحديث:'} {lastUpdated}
            </span>
          </div>

          {/* العنوان الرئيسي والوصف */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f3154] tracking-tight leading-tight mb-3">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            {subtitle}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. المحتوى الأساسي (Content Card)
          ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 sm:pb-16">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,49,84,0.04)] p-6 sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export default LegalLayout;
