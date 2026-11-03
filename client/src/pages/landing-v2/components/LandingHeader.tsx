import React, { useState } from 'react';
import { Link } from 'wouter';
import Logo from '@/components/ui/Logo';
import { useI18n } from '@/i18n';
import { ArrowLeft, ArrowRight, Menu, X, Globe, LogIn } from 'lucide-react';

export const LandingHeader: React.FC = () => {
  const { lang, setLang } = useI18n();
  const isAr = lang === 'ar';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLang(isAr ? 'fr' : 'ar');
  };

  const navLinks = [
    { label: isAr ? 'الرئيسية' : 'Accueil', href: '#overview' },
    { label: isAr ? 'البوابات السيادية' : 'Portails', href: '#portals' },
    { label: isAr ? 'الترسانة الذكية' : 'Suite IA', href: '#smart-suite' },
    { label: isAr ? 'دورة حياة الصفقة' : 'Cycle de vie', href: '#lifecycle' },
    { label: isAr ? 'الرقابة والامتثال' : 'Conformité', href: '#governance' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* الشعار والهوية البصرية */}
          <a
            href="#overview"
            className="flex items-center gap-3.5 group focus:outline-hidden"
            aria-label={isAr ? 'صفقات ذكية — العودة للرئيسية' : 'Safaqat Dhakia — Accueil'}
          >
            <div className="relative flex items-center justify-center p-1.5 rounded-xl bg-slate-50 border border-slate-200/80 group-hover:border-emerald-500/40 group-hover:bg-emerald-50/30 transition-all shadow-xs">
              <Logo size={42} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-cairo">
                  صفقات ذكية
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {isAr ? 'سيادية' : 'Souverain'}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500 -mt-0.5">
                {isAr ? 'المنظومة الوطنية الموحدة للصفقات العمومية' : 'Plateforme Nationale des Marchés Publics'}
              </span>
            </div>
          </a>

          {/* روابط التنقل الرئيسية (شاشات متوسطة وكبيرة) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label={isAr ? 'التنقل الرئيسي' : 'Navigation principale'}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-100/70 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* أدوات التحكم والإجراءات */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* مبدل اللغة */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              aria-label={isAr ? 'Changer de langue vers le français' : 'تبديل اللغة إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'FR' : 'عربي'}</span>
            </button>

            {/* زر الدخول الموحد */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isAr ? 'دخول المنصة' : 'Connexion'}</span>
              {isAr ? (
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              ) : (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              )}
            </Link>

            {/* زر القائمة للشاشات الصغيرة */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-hidden"
              aria-label={isAr ? 'فتح القائمة' : 'Ouvrir le menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* القائمة المنسدلة للشاشات الصغيرة */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 mt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-emerald-700 text-white font-bold text-base shadow-sm"
              >
                {isAr ? 'دخول المنصة الموحدة' : 'Accéder à la plateforme'}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
