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

/**
 * LegalLayout — إطار الصفحات القانونية بلغة النظام الموحّد V3:
 * ورقة بيضاء على قماش #f0f0f0، حبر #080808، خطوط شعرية #d8d8d8،
 * والأزرق #146ef5 علامة وحيدة (بدل لوحة الأزرق الداكن/الأخضر القديمة).
 * النصوص والبنية كما هي؛ الألوان والمقاسات فقط تمت المواءمة.
 */
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
      className="min-h-screen flex flex-col bg-[#f0f0f0] text-[#080808] font-['Cairo',sans-serif] selection:bg-[#146ef5]/20 selection:text-[#146ef5]"
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. HEADER العلوي السيادي
          ═══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#d8d8d8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* الشعار والاسم الرسمي */}
          <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146ef5] rounded-lg p-1">
            <div className="size-9 rounded-[8px] bg-[#146ef5] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <Logo size={26} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-[16px] tracking-tight text-[#080808] leading-tight">
                {isFr ? 'Safaqat Dhakia' : 'صفقات ذكية'}
              </span>
              <span className="text-[13px] font-semibold text-[#5a5a5a] leading-none">
                {isFr ? 'Plateforme Intelligente' : 'المنصة الذكية'}
              </span>
            </div>
          </Link>

          {/* روابط التنقل السريعة بين الصفحات القانونية */}
          <nav className="hidden md:flex items-center gap-1 bg-[#f0f0f0] p-1 rounded-[8px] border border-[#d8d8d8]" aria-label="التنقل القانوني">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-semibold transition-all ${
                    item.active
                      ? 'bg-white text-[#080808] border border-[#d8d8d8]'
                      : 'text-[#5a5a5a] hover:text-[#080808] hover:bg-white/60'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold border border-[#d8d8d8] bg-white hover:bg-[#f0f0f0] text-[#5a5a5a] hover:text-[#080808] transition-colors cursor-pointer"
              title={isFr ? 'Passer en Arabe' : 'التحويل إلى الفرنسية'}
              aria-label={isFr ? 'Passer en Arabe' : 'التحويل إلى الفرنسية'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isFr ? 'العربية' : 'FR'}</span>
            </button>

            {/* الرجوع إلى الصفحة الرئيسية */}
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold border border-[#d8d8d8] bg-white hover:bg-[#f0f0f0] text-[#5a5a5a] hover:text-[#080808] transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isFr ? 'Accueil' : 'الرئيسية'}</span>
            </Link>

            {/* الدخول للمنصة */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold bg-[#146ef5] hover:bg-[#115ccb] text-white transition-colors"
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
      <section className="bg-white border-b border-[#d8d8d8] py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* مسار التنقل البسيط (Breadcrumb) */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#5a5a5a] mb-5">
            <Link href="/" className="hover:text-[#146ef5] transition-colors">
              {isFr ? 'Accueil' : 'الرئيسية'}
            </Link>
            <span>/</span>
            <span className="text-[#146ef5] font-semibold">{title}</span>
          </div>

          {/* الشارة والرمز */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#146ef5]/10 text-[#146ef5] border border-[#146ef5]/25">
              {icon}
              {kicker}
            </span>
            <span className="text-[13px] text-[#5a5a5a] bg-[#f0f0f0] px-2.5 py-1 rounded-full">
              {isFr ? 'Dernière mise à jour :' : 'آخر تحديث:'} {lastUpdated}
            </span>
          </div>

          {/* العنوان الرئيسي والوصف */}
          <h1 className="text-[26px] sm:text-[40px] font-extrabold text-[#080808] tracking-[-0.4px] leading-[1.08] mb-3">
            {title}
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#5a5a5a] leading-relaxed max-w-3xl">
            {subtitle}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. المحتوى الأساسي (ورقة الوثيقة)
          ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 sm:pb-16">
        <div className="bg-white border border-[#d8d8d8] rounded-[8px] p-6 sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export default LegalLayout;
