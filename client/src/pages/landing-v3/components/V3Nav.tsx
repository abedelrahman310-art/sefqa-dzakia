import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import { Globe, ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';

export const V3Nav: React.FC = () => {
  const { lang, setLang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: isAr ? 'لماذا صفقات ذكية' : 'Pourquoi Safaqat', href: '#why-safaqat' },
    { label: isAr ? 'مسار العمل والبوابات' : 'Fonctionnement & Portails', href: '#workflow' },
    { label: isAr ? 'أدوات الذكاء الاصطناعي' : 'Outils IA', href: '#ai-tools' },
    { label: isAr ? 'الأسئلة الشائعة' : 'FAQ', href: '#faq' },
    { label: isAr ? 'الامتثال' : 'Conformité', href: '#compliance' },
  ];

  return (
    <nav
      dir={dir}
      className={`sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md transition-all duration-200 ${
        scrolled ? 'border-b border-slate-200/80 shadow-2xs' : 'border-b border-transparent'
      }`}
      style={{ height: '56px' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Brand Wordmark with Studio Signature */}
        <a
          href="#overview"
          className="flex items-center gap-2.5 group focus:outline-hidden"
          aria-label="Safaqat Dhakia"
        >
          <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-700 text-white shadow-2xs">
            <Logo size={20} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-[17px] font-bold text-slate-900 tracking-tight">
              {isAr ? 'صفقات ذكية' : 'Safaqat'}
            </span>
            <span className="size-1.5 rounded-full bg-emerald-600" />
          </div>
        </a>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6" aria-label="Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-slate-700 hover:text-emerald-700 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA & Language */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLang(isAr ? 'fr' : 'ar')}
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Globe className="size-3.5" />
            <span>{isAr ? 'FR' : 'عربي'}</span>
          </button>

          {/* Ghost Log In */}
          <Link
            href="/login"
            className="hidden sm:inline-flex text-[14px] font-medium text-slate-800 hover:text-emerald-700 hover:underline cursor-pointer px-2 py-1"
          >
            {isAr ? 'تسجيل الدخول' : 'Connexion'}
          </Link>

          {/* Primary Action Button */}
          <Link
            href="/operator/deals"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[14px] font-medium text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg transition-colors cursor-pointer select-none shadow-xs"
          >
            <span>{isAr ? 'دخول المنصة' : 'Accéder'}</span>
            {isAr ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-800 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[14px] font-medium text-slate-700 hover:text-emerald-700"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <Link
              href="/operator/deals"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 text-[14px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              {isAr ? 'دخول المنصة' : 'Accéder à la plateforme'}
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2 text-[14px] font-medium text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              {isAr ? 'تسجيل الدخول' : 'Connexion'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default V3Nav;
