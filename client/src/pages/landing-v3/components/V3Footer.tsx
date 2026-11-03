import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import { Shield, Lock, FileCheck } from 'lucide-react';

export const V3Footer: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  return (
    <footer
      dir={dir}
      className="w-full bg-[#080808] text-[#ffffff] pt-16 pb-12 border-t border-[#222222]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#222222]">
          
          {/* Brand Info (4 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center size-8 rounded-[4px] bg-[#ffffff] text-[#080808]">
                <Logo size={20} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[18px] font-bold text-[#ffffff] tracking-tight">
                  {isAr ? 'صفقات ذكية' : 'Safaqat'}
                </span>
                <span className="size-1.5 rounded-full bg-[#146ef5]" />
              </div>
            </div>

            <p className="text-[13px] text-[#bdbdbd] leading-relaxed max-w-[360px]">
              {isAr
                ? 'المنظومة الوطنية الموحدة لإدارة وتجريد ومراقبة الصفقات العمومية، مصممة وفق أحدث معايير الأمان والتشفير لحماية المال العام.'
                : 'Plateforme nationale souveraine de dématérialisation et de supervision des marchés publics en Algérie.'}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-[#5a5a5a] font-mono">
              <span>ALGERIA</span>
              <span>•</span>
              <span>LAW 23-12</span>
              <span>•</span>
              <span>DECREE 15-247</span>
            </div>
          </div>

          {/* Links Column 1: Portals */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[13px] font-semibold text-[#ffffff] uppercase tracking-wider font-mono">
              {isAr ? 'البوابات' : 'Portails'}
            </h4>
            <ul className="space-y-2 text-[13px] text-[#bdbdbd]">
              <li>
                <Link href="/operator/deals" className="hover:text-white transition-colors">
                  {isAr ? 'المتعامل الاقتصادي' : 'Opérateur'}
                </Link>
              </li>
              <li>
                <Link href="/authority/deals" className="hover:text-white transition-colors">
                  {isAr ? 'المصلحة المتعاقدة' : 'Autorité'}
                </Link>
              </li>
              <li>
                <Link href="/central" className="hover:text-white transition-colors">
                  {isAr ? 'عين الصقر المركزية' : 'Supervision'}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {isAr ? 'تسجيل الدخول' : 'Connexion'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Legal & Compliance */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[13px] font-semibold text-[#ffffff] uppercase tracking-wider font-mono">
              {isAr ? 'المرجعية القانونية' : 'Cadre Légal'}
            </h4>
            <ul className="space-y-2 text-[13px] text-[#bdbdbd]">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  {isAr ? 'شروط الخدمة والامتثال' : 'Conditions d’utilisation'}
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-white transition-colors">
                  {isAr ? 'إمكانية الوصول والمطابقة' : 'Accessibilité'}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  {isAr ? 'الأسئلة الشائعة والدعم' : 'Foire aux questions'}
                </Link>
              </li>
              <li>
                <a href="#compliance" className="hover:text-white transition-colors">
                  {isAr ? 'المادة 67: التجريد المادي' : 'Article 67 Dématérialisation'}
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Compare & Versions */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[13px] font-semibold text-[#ffffff] uppercase tracking-wider font-mono">
              {isAr ? 'إصدارات التصميم' : 'Éditions'}
            </h4>
            <ul className="space-y-2 text-[13px] text-[#bdbdbd]">
              <li>
                <span className="text-[#146ef5] font-medium">
                  {isAr ? 'V3 Studio (الحالية)' : 'V3 Studio (Actuel)'}
                </span>
              </li>
              <li>
                <Link href="/landing-v2" className="hover:text-white transition-colors">
                  {isAr ? 'V2 الملكية السيادية' : 'V2 Royal Edition'}
                </Link>
              </li>
              <li>
                <Link href="/landing-old" className="hover:text-white transition-colors">
                  {isAr ? 'الإصدار الأول V1' : 'V1 Classic'}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#5a5a5a]">
          <p>
            {isAr
              ? '© 2026 الجمهورية الجزائرية الديمقراطية الشعبية — جميع الحقوق محفوظة لمنظومة صفقات ذكية.'
              : '© 2026 République Algérienne Démocratique et Populaire. Tous droits réservés.'}
          </p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#146ef5]" />
              <span>{isAr ? 'البيئة التشغيلية: آمنة ومشفرة' : 'Système opérationnel chiffré'}</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default V3Footer;
