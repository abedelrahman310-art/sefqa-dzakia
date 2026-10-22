import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Globe,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Briefcase,
  FileCheck2,
  Workflow,
  Sparkles,
} from 'lucide-react';

/* ============================================================
   الشريط العلوي المنسق لصفحة الهبوط (Landing Institutional Header)
   - شريط مؤسسي رسمي أنيق بأسلوب Notion (بدون خلفيات داكنة ثقيلة)
   - شريط تنقل مثبت (Sticky) مع علامة الهوية الرسمية وروابط الأقسام
   - قائمة متجاوبة كاملة للهواتف والأجهزة اللوحية مع دعم لوحة المفاتيح
   - مبدّل اللغة وزر تسجيل الدخول المباشر إلى /login
   ============================================================ */

export function LandingHeader() {
  const [, setLocation] = useLocation();
  const { t, lang, setLang } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: '#problem', label: 'المشكلة' },
    { href: '#solution', label: 'الحل والقدرات' },
    { href: '#portals', label: 'بوابات المنصة' },
    { href: '#legal', label: 'الإطار القانوني' },
    { href: '#features', label: 'الميزات المتاحة' },
    { href: '#lifecycle', label: 'دورة الصفقة' },
    { href: '#trust-start', label: 'الضوابط والبدء' },
  ];

  // Close mobile menu on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const toggleLanguage = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  return (
    <header className="w-full relative z-50 select-none" dir="rtl" ref={menuRef}>
      {/* ─── 1. الخط العلوي الرفيع للهوية الوطنية (2px أخضر وأحمر) ─── */}
      <div className="w-full flex h-[2.5px]" aria-hidden="true">
        <div className="w-1/2 bg-[#167354]" />
        <div className="w-1/2 bg-[#C83A42]" />
      </div>

      {/* ─── 2. الشريط الرسمي المؤسسي الفاتح (Institutional Strip) ─── */}
      <div className="bg-[#F8F9F7] border-b border-[#E3E7E2] text-[#59665F]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-1.5 flex items-center justify-between gap-3 text-xs">
          {/* النص الرسمي للجمهورية والقانون */}
          <div className="flex items-center gap-2 truncate">
            <span className="size-1.5 rounded-full bg-[#167354] shrink-0" aria-hidden="true" />
            <span className="font-semibold text-[#24352E] truncate">
              الجمهورية الجزائرية الديمقراطية الشعبية
            </span>
            <span className="hidden sm:inline text-[#59665F]/80">·</span>
            <span className="hidden sm:inline text-[#59665F] font-medium">
              القانون رقم 23-12 والمرسوم الرئاسي رقم 15-247
            </span>
          </div>

          {/* زر تبديل اللغة */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-[#E3E7E2] text-[11px] font-bold text-[#24352E] hover:text-[#167354] hover:border-[#167354] hover:bg-[#EDF4EE] transition-colors shrink-0 shadow-2xs focus-visible:outline-2 focus-visible:outline-[#167354]"
            onClick={toggleLanguage}
            title={lang === 'ar' ? 'Passer au français' : 'التحويل إلى العربية'}
            aria-label="تبديل لغة الواجهة"
          >
            <Globe className="size-3 text-[#167354]" aria-hidden="true" />
            <span>{lang === 'ar' ? 'Français' : 'العربية'}</span>
          </button>
        </div>
      </div>

      {/* ─── 3. شريط التنقل الرئيسي المثبت (Sticky Main Navbar) ─── */}
      <nav
        className="bg-white/95 backdrop-blur-md border-b border-[#E3E7E2] shadow-[0_1px_4px_rgba(36,53,46,0.03)]"
        aria-label="التنقل الرئيسي لمنصة صفقات ذكية"
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 h-16 sm:h-17 flex items-center justify-between gap-4">
          {/* الطرف الأيمن: شعار المنصة واسمها */}
          <Link href="/" className="inline-flex items-center gap-2.5 group shrink-0" aria-label="صفقات ذكية — الصفحة الرئيسية">
            <div className="size-9 sm:size-10 rounded-xl bg-[#EDF4EE] border border-[#CDE1D3] flex items-center justify-center text-[#167354] shadow-2xs group-hover:border-[#167354] transition-colors">
              <span className="size-2.5 rounded-full bg-[#167354] shadow-[0_0_0_3px_rgba(22,115,84,0.15)]" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black text-[#24352E] leading-tight tracking-tight group-hover:text-[#167354] transition-colors">
                {t('landing.brand')}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#59665F] tracking-wide leading-none hidden sm:block">
                المنظومة الرقمية للصفقات العمومية
              </span>
            </div>
          </Link>

          {/* الوسط: روابط الأقسام للشاشات الكبيرة (Desktop Links) */}
          <ul className="hidden lg:flex items-center gap-1 xl:gap-2 list-none m-0 p-0" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-bold text-[#59665F] hover:text-[#167354] hover:bg-[#EDF4EE] transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#167354]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* الطرف الأيسر: الإجراءات وزر القائمة للهاتف */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* زر تسجيل الدخول الأساسي */}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#167354] text-white font-bold text-xs sm:text-sm hover:bg-[#115840] transition-colors shadow-xs shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167354]"
              onClick={() => setLocation('/login')}
            >
              <span>{t('landing.nav.login')}</span>
              <ArrowLeft className="size-3.5 sm:size-4 shrink-0" aria-hidden="true" />
            </button>

            {/* زر القائمة المنسدلة للهاتف والأجهزة اللوحية (< 1024px) */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl bg-[#F8F9F7] border border-[#E3E7E2] text-[#24352E] hover:bg-[#EDF4EE] hover:text-[#167354] transition-colors focus-visible:outline-2 focus-visible:outline-[#167354]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة الرئيسية'}
            >
              {mobileMenuOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* ─── 4. القائمة المنسدلة للأجهزة المحمولة (Mobile Drawer Menu) ─── */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E3E7E2] bg-white px-4 py-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col gap-1 mb-4">
              <span className="text-[11px] font-bold text-[#59665F] uppercase tracking-wider px-3 pb-1">
                أقسام الصفحة:
              </span>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-lg text-sm font-bold text-[#24352E] hover:bg-[#EDF4EE] hover:text-[#167354] transition-colors flex items-center justify-between"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{link.label}</span>
                  <span className="text-xs text-[#59665F]">←</span>
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E3E7E2] flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#F8F9F7] border border-[#E3E7E2] text-xs font-bold text-[#24352E]"
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
              >
                <Globe className="size-3.5 text-[#167354]" />
                <span>اللغة: {lang === 'ar' ? 'Français' : 'العربية'}</span>
              </button>

              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#167354] text-white text-xs font-bold"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLocation('/login');
                }}
              >
                <span>دخول مساحة العمل</span>
                <ArrowLeft className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
