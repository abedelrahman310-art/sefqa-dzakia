import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import { Shield, Lock, FileCheck, Sparkles } from 'lucide-react';

/**
 * V3Footer — تذييل فاتح موحّد مع نظام الصفحة (قماش أبيض، حبر أسود، خطوط شعرية #d8d8d8).
 * نفس البنود والمحتوى السابق تماماً؛ الألوان فقط تتبع نظام V3 الفاتح بدل السطح الداكن.
 */
export const V3Footer: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  return (
    <footer
      dir={dir}
      className="w-full bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand Info (4 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-700 text-white shadow-xs">
                <Logo size={20} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[18px] font-bold text-white tracking-tight">
                  {isAr ? 'صفقات ذكية' : 'Safaqat'}
                </span>
                <span className="size-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            <p className="text-[13px] text-slate-400 leading-relaxed max-w-[360px]">
              {isAr
                ? 'المنظومة الموحدة لإدارة وتجريد ومراقبة الصفقات العمومية، مصممة وفق أحدث معايير الأمان والتشفير لحماية المال العام.'
                : 'Plateforme unifiée et souveraine de dématérialisation et de supervision des marchés publics en Algérie.'}
            </p>

            <div className="flex items-center gap-2 text-[13px] text-slate-500 font-mono">
              <span>ALGERIA</span>
              <span>•</span>
              <span>LAW 23-12</span>
              <span>•</span>
              <span>LAW 15-04</span>
              <span>•</span>
              <span>DECREE 15-247</span>
            </div>
          </div>

          {/* Links Column 1: Portals */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider font-mono">
              {isAr ? 'البوابات' : 'Portails'}
            </h4>
            <ul className="space-y-2 text-[13px] text-slate-400">
              <li>
                <Link href="/operator/deals" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'المتعامل الاقتصادي' : 'Opérateur'}
                </Link>
              </li>
              <li>
                <Link href="/authority/deals" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'المصلحة المتعاقدة' : 'Autorité'}
                </Link>
              </li>
              <li>
                <Link href="/central" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'الرقابة المركزية' : 'Contrôle Central'}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'تسجيل الدخول' : 'Connexion'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Legal & Compliance */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider font-mono">
              {isAr ? 'المرجعية القانونية' : 'Cadre Légal'}
            </h4>
            <ul className="space-y-2 text-[13px] text-slate-400">
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'شروط الخدمة والامتثال' : 'Conditions d’utilisation'}
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'إمكانية الوصول والمطابقة' : 'Accessibilité'}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'الأسئلة الشائعة والدعم' : 'Foire aux questions'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Platform Tools */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider font-mono">
              {isAr ? 'الترسانة الذكية' : 'Outils IA'}
            </h4>
            <ul className="space-y-2 text-[13px] text-slate-400">
              <li>
                <Link
                  href="/ai-capabilities"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Sparkles className="size-3.5 text-emerald-400 shrink-0" />
                  <span>{isAr ? 'قوة الذكاء الاصطناعي' : 'Puissance de l’IA'}</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-slate-500">
          <p>
            {isAr
              ? '© 2026 الجمهورية الجزائرية الديمقراطية الشعبية — جميع الحقوق محفوظة لمنظومة صفقات ذكية.'
              : '© 2026 République Algérienne Démocratique et Populaire. Tous droits réservés.'}
          </p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{isAr ? 'البيئة التشغيلية: آمنة ومشفرة' : 'Système opérationnel chiffré'}</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default V3Footer;
