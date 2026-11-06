import React from 'react';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';

export const V3Hero: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  return (
    <header
      id="overview"
      dir={dir}
      className="w-full bg-transparent pt-10 sm:pt-14 pb-12 sm:pb-16"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Centered Hero Stack: Flex Column with perfect horizontal alignment */}
        <div className="max-w-[980px] mx-auto flex flex-col items-center justify-center text-center space-y-6 sm:space-y-7">
          
          {/* Framed Short Eyebrow: Isolated Centered Row */}
          <div className="flex items-center justify-center w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200/80 bg-white/80 backdrop-blur-md text-emerald-800 text-xs sm:text-sm font-bold shadow-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
              </span>
              <span>{isAr ? 'المنظومة الرقمية المعتمدة' : 'Plateforme Numérique Certifiée'}</span>
              <span className="text-slate-300 select-none">|</span>
              <span className="text-[11px] font-semibold text-emerald-700">{isAr ? 'جاهزة للخدمة' : 'Opérationnelle'}</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              بطاقة اسم المنصة الموسعة (Expanded Sovereign Glassmorphic Card)
              بطاقة زجاجية فسيحة تتوسط القسم مع توهج سيادي وتعريف قصير ومختصر
              ══════════════════════════════════════════════════════════════════════ */}
          <div className="w-full flex items-center justify-center my-1">
            <div className="relative w-full max-w-[940px] mx-auto">
              {/* Algerian Tricolor Ambient Border Glow with Gentle Breathing Effect */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-[#006233]/15 via-emerald-100/30 to-[#d21034]/15 blur-2xl pointer-events-none transition-all duration-1000" />

              {/* The Glassmorphic Floating Card */}
              <div className="relative w-full rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-2xl shadow-xl px-6 py-10 sm:px-14 sm:py-14 md:py-16 overflow-hidden flex flex-col items-center justify-center text-center">
                {/* Top National Ribbon Accent: 50% Green, 50% Red */}
                <div className="absolute top-0 left-0 right-0 h-2 flex">
                  <div className="w-1/2 bg-[#006233]" />
                  <div className="w-1/2 bg-[#d21034]" />
                </div>

                {/* Algerian Republic Header with Emblem & Flanking National Lines */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
                  <span className="h-[2px] w-10 sm:w-24 bg-gradient-to-r from-transparent via-[#006233]/70 to-[#006233] rounded-full shrink-0" />
                  <div className="inline-flex items-center gap-2 sm:gap-2.5 px-4 py-1.5 rounded-full bg-slate-50/95 border border-slate-200/90 shadow-2xs">
                    <div className="size-5 sm:size-6 flex items-center justify-center shrink-0">
                      <Logo size={22} />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 select-none">
                      {isAr
                        ? 'الجمهورية الجزائرية الديمقراطية الشعبية'
                        : 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE'}
                    </span>
                  </div>
                  <span className="h-[2px] w-10 sm:w-24 bg-gradient-to-l from-transparent via-[#d21034]/70 to-[#d21034] rounded-full shrink-0" />
                </div>

                {/* Monumental Platform Name inside the Glass Card */}
                <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.08] tracking-tight font-sans my-2 sm:my-3 text-center w-full">
                  {isAr ? 'صفقات ذكية' : 'Safaqat Dhakia'}
                </h1>

                {/* Short & Concise Platform Definition inside the Card */}
                <div className="mt-3 sm:mt-5 max-w-2xl mx-auto">
                  <p className="text-base sm:text-xl lg:text-2xl font-bold text-slate-600 leading-snug">
                    {isAr
                      ? 'المنظومة الرقمية الموحدة لإدارة ورقمنة الصفقات العمومية'
                      : 'Plateforme Numérique Unifiée des Marchés Publics'}
                  </p>
                </div>

                {/* الشارات السيادية الثلاث لضمانات الثقة والأمان */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50/90 border border-slate-200/90 text-slate-700 text-xs font-bold shadow-2xs hover:border-emerald-300 transition-colors">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    <span>{isAr ? 'تشفير الأظرفة بـ SHA-256' : 'Chiffrement SHA-256'}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50/90 border border-slate-200/90 text-slate-700 text-xs font-bold shadow-2xs hover:border-emerald-300 transition-colors">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    <span>{isAr ? 'مطابقة لأحكام القانون 23-12' : 'Conformité Loi 23-12'}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50/90 border border-slate-200/90 text-slate-700 text-xs font-bold shadow-2xs hover:border-emerald-300 transition-colors">
                    <span className="size-1.5 rounded-full bg-[#006233]" />
                    <span>{isAr ? 'سيادة رقمية جزائرية وتوطين محلي' : 'Souveraineté Numérique et Hébergement Local'}</span>
                  </div>
                </div>

                {/* Bottom National Ribbon Accent: 50% Green, 50% Red */}
                <div className="absolute bottom-0 left-0 right-0 h-2 flex">
                  <div className="w-1/2 bg-[#006233]" />
                  <div className="w-1/2 bg-[#d21034]" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default V3Hero;
