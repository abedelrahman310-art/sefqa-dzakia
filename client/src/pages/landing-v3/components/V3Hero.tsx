import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSignature,
  Lock,
  Layers,
  Receipt,
  Shield,
} from 'lucide-react';

export const V3Hero: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  return (
    <header
      id="overview"
      dir={dir}
      className="w-full bg-[#ffffff] pt-12 sm:pt-16 pb-12 sm:pb-16"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Centered Hero Stack */}
        <div className="max-w-[920px] mx-auto text-center space-y-6">
          
          {/* Framed Short Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
            <span>{isAr ? 'المنظومة الرقمية الوطنية المعتمدة' : 'Plateforme Nationale Certifiée'}</span>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              البطاقة الزجاجية الطافية لاسم المنصة (Sovereign Glassmorphic Card)
              ══════════════════════════════════════════════════════════════════════ */}
          <div className="relative inline-block mx-auto max-w-full my-2">
            {/* Algerian Tricolor Ambient Border Glow */}
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-[#006233]/30 via-emerald-100/50 to-[#d21034]/30 blur-md pointer-events-none" />

            {/* The Glassmorphic Floating Card */}
            <div className="relative rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl shadow-xl px-6 py-6 sm:px-14 sm:py-8 overflow-hidden">
              {/* Top National Ribbon Accent: 50% Green, 50% Red */}
              <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                <div className="w-1/2 bg-[#006233]" />
                <div className="w-1/2 bg-[#d21034]" />
              </div>

              {/* Algerian Republic Header with Emblem & Flanking National Lines */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                <span className="h-[2px] w-8 sm:w-16 bg-gradient-to-r from-transparent via-[#006233]/70 to-[#006233] rounded-full" />
                <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-50/95 border border-slate-200/90 shadow-2xs">
                  <div className="size-5 sm:size-6 flex items-center justify-center shrink-0">
                    <Logo size={22} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 select-none">
                    {isAr
                      ? 'الجمهورية الجزائرية الديمقراطية الشعبية'
                      : 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE'}
                  </span>
                </div>
                <span className="h-[2px] w-8 sm:w-16 bg-gradient-to-l from-transparent via-[#d21034]/70 to-[#d21034] rounded-full" />
              </div>

              {/* Monumental Platform Name inside the Glass Card */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#0f3154] leading-[1.08] tracking-tight font-sans my-1">
                {isAr ? 'صفقات ذكية' : 'Safaqat Dhakia'}
              </h1>

              {/* Bottom National Ribbon Accent: 50% Green, 50% Red */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
                <div className="w-1/2 bg-[#006233]" />
                <div className="w-1/2 bg-[#d21034]" />
              </div>
            </div>
          </div>

          {/* Subtext: Clear, Legible, No Tiny Text */}
          <p className="text-base sm:text-lg font-medium text-slate-600 leading-relaxed max-w-[720px] mx-auto">
            {isAr
              ? 'تجريد مادي كامل بموجب المادة 67 من القانون رقم 23-12. فضاء رقمي وطني موحد يربط المتعاملين الاقتصاديين والمصالح المتعاقدة وهيئات الرقابة المركزية بأعلى معايير النزاهة والتشفير السيادي.'
              : 'Dématérialisation intégrale selon l’Article 67 de la Loi 23-12. Un environnement unifié liant acheteurs publics, soumissionnaires et corps de contrôle.'}
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-xl shadow-xs transition-colors cursor-pointer select-none"
            >
              <span>{isAr ? 'تسجيل جديد في المنظومة' : 'Créer un compte'}</span>
              {isAr ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </Link>

            <Link
              href="/operator/deals"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Layers className="size-4 text-emerald-700" />
              <span>{isAr ? 'استكشاف الفرص والمناقصات' : 'Explorer les marchés'}</span>
            </Link>
          </div>

          {/* Trust Indicators: High Contrast & Legible */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{isAr ? 'مبدأ صفر ورقة (المادة 67)' : 'Zéro Papier (Art. 67)'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-900">
              <FileSignature className="size-4 text-sky-600 shrink-0" />
              <span>{isAr ? 'توقيع إلكتروني مؤهل (15-04)' : 'Signature Légale (15-04)'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800">
              <Lock className="size-4 text-slate-700 shrink-0" />
              <span>{isAr ? 'تشفير سيادي للأظرفة AES-256' : 'Chiffrement AES-256'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900">
              <Receipt className="size-4 text-amber-600 shrink-0" />
              <span>{isAr ? 'وصل سحب فوري معتمد' : 'Récépissé certifié'}</span>
            </span>
          </div>

        </div>
      </div>
    </header>
  );
};

export default V3Hero;
