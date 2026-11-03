import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building,
  Eye,
  CheckCircle2,
  FileCheck2,
  Lock,
  Layers,
  Receipt,
  FileSignature
} from 'lucide-react';

export const V3Hero: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const choices = [
    {
      id: 'operator',
      title: isAr ? 'المتعامل الاقتصادي' : 'Opérateur Économique',
      desc: isAr
        ? 'تصفح الصفقات الوطنية، التدقيق بدرع الامتثال، وتشفير وإيداع العروض المالية بختم AES-256.'
        : 'Explorez les marchés publics, validez vos pièces administratives et chiffrez vos offres.',
      icon: Briefcase,
      link: '/operator/deals',
      tag: isAr ? 'المتعهدون' : 'Soumissionnaires',
      accentColor: '#146ef5',
      badgeBg: 'rgba(20, 110, 245, 0.1)',
      textColor: '#146ef5',
    },
    {
      id: 'authority',
      title: isAr ? 'المصلحة المتعاقدة' : 'Autorité Contractante',
      desc: isAr
        ? 'إعداد دفاتر الشروط المحايدة، مصفوفة التقييم المئوية، وترؤس لجان الفتح والتقييم رقمياً.'
        : 'Rédigez des cahiers des charges neutres, pilotez l’ouverture et l’évaluation multicritères.',
      icon: Building,
      link: '/authority/deals',
      tag: isAr ? 'الإدارات' : 'Services Publics',
      accentColor: '#60ed76',
      badgeBg: 'rgba(96, 237, 118, 0.18)',
      textColor: '#15803d',
    },
    {
      id: 'central',
      title: isAr ? 'عين الصقر (الإدارة المركزية)' : 'Supervision Centrale',
      desc: isAr
        ? 'الرقابة الكلية عبر 58 ولاية، رادار كشف التواطؤ، ومنع انحراف الآجال والملاحق القانونية.'
        : 'Supervision nationale sur 58 wilayas, radar anti-collusion et détection des dérives.',
      icon: Eye,
      link: '/central',
      tag: isAr ? 'الرقابة والنزاهة' : 'Contrôle National',
      accentColor: '#ffa666',
      badgeBg: 'rgba(255, 166, 102, 0.2)',
      textColor: '#c2410c',
    },
  ];

  return (
    <header
      id="overview"
      dir={dir}
      className="w-full bg-[#ffffff] pt-16 sm:pt-20 pb-16 sm:pb-24"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Centered Hero Stack */}
        <div className="max-w-[840px] mx-auto text-center space-y-6 mb-16">
          
          {/* Platform Name within Prestige National Frame (Algerian Tricolor: Green, White, Red) */}
          <div className="relative inline-block mx-auto max-w-full my-1">
            {/* Algerian Tricolor Ambient Border Glow */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#006233] via-white to-[#d21034] opacity-90 blur-xs" />

            {/* Main Prestige Frame */}
            <div className="relative rounded-3xl border-2 border-slate-200/90 bg-white shadow-xl px-6 py-6 sm:px-14 sm:py-8 overflow-hidden">
              {/* Top National Ribbon Accent: 50% Green, 50% Red */}
              <div className="absolute top-0 left-0 right-0 h-2 flex">
                <div className="w-1/2 bg-[#006233]" />
                <div className="w-1/2 bg-[#d21034]" />
              </div>

              {/* Algerian Republic Header with Emblem & Flanking National Lines */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
                <span className="h-[2px] w-8 sm:w-16 bg-gradient-to-r from-transparent via-[#006233]/70 to-[#006233] rounded-full" />
                <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-50/95 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="size-5 sm:size-6 flex items-center justify-center shrink-0">
                    <Logo size={22} />
                  </div>
                  <span className={`text-[12px] sm:text-[13px] font-bold text-slate-800 select-none ${isAr ? 'font-sans tracking-normal' : 'font-mono tracking-wider uppercase'}`}>
                    {isAr
                      ? 'الجمهورية الجزائرية الديمقراطية الشعبية'
                      : 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE'}
                  </span>
                </div>
                <span className="h-[2px] w-8 sm:w-16 bg-gradient-to-l from-transparent via-[#d21034]/70 to-[#d21034] rounded-full" />
              </div>

              {/* Monumental Platform Name inside the National Frame */}
              <h1 className="text-[44px] sm:text-[62px] lg:text-[78px] font-black text-[#080808] leading-[1.05] tracking-tight font-sans">
                {isAr ? 'صفقات ذكية' : 'Safaqat Dhakia'}
              </h1>

              {/* Official Status Subtitle & Legal Badges in National Colors */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#006233]/10 text-[#006233] border border-[#006233]/30">
                  <span className="size-2 rounded-full bg-[#006233]" />
                  <span>{isAr ? 'المنظومة الوطنية الرسمية' : 'Portail Officiel'}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#d21034]/10 text-[#d21034] border border-[#d21034]/30">
                  <span className="size-2 rounded-full bg-[#d21034]" />
                  <span>{isAr ? 'القانون 23-12 • المادة 67' : 'Loi 23-12 • Art. 67'}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold bg-[#146ef5]/10 text-[#146ef5] border border-[#146ef5]/30">
                  <span className="size-2 rounded-full bg-[#146ef5]" />
                  <span>{isAr ? 'التوقيع المؤهل • القانون 15-04' : 'Signature Qualifiée • Loi 15-04'}</span>
                </span>
              </div>

              {/* Bottom National Ribbon Accent: 50% Green, 50% Red */}
              <div className="absolute bottom-0 left-0 right-0 h-2 flex">
                <div className="w-1/2 bg-[#006233]" />
                <div className="w-1/2 bg-[#d21034]" />
              </div>
            </div>
          </div>

          {/* Subtext (20px, weight 400, #5a5a5a, max-width 640px) */}
          <p className="text-[18px] sm:text-[20px] font-normal text-[#5a5a5a] leading-[1.4] max-w-[640px] mx-auto">
            {isAr
              ? 'تجريد مادي كامل بموجب المادة 67. فضاء رقمي موحد يربط المتعاملين والمصالح المتعاقدة وهيئات الرقابة المركزية بأعلى معايير النزاهة والتشفير.'
              : 'Dématérialisation intégrale selon l’Article 67. Un environnement unifié liant acheteurs, soumissionnaires et régulateurs.'}
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/operator/deals"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[14px] font-medium text-[#ffffff] bg-[#146ef5] hover:bg-[#1366e2] active:bg-[#115ccb] rounded-[4px] transition-colors cursor-pointer select-none"
            >
              <span>{isAr ? 'استكشاف الفرص والمناقصات' : 'Explorer les marchés ouverts'}</span>
              {isAr ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </Link>

            <a
              href="#live-demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[14px] font-medium text-[#080808] hover:bg-[#f0f0f0] border border-[#d8d8d8] rounded-[4px] transition-colors cursor-pointer"
            >
              <Layers className="size-4 text-[#5a5a5a]" />
              <span>{isAr ? 'معاينة وثيقة الصفقة الحية' : 'Voir le prototype interactif'}</span>
            </a>
          </div>

          {/* Micro Trust Indicators */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[13px] text-[#5a5a5a]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#006233]" />
              <span>{isAr ? 'تجريد كامل (المادة 67)' : 'Zéro Papier (Art. 67)'}</span>
            </span>
            <span className="text-[#d8d8d8]">•</span>
            <span className="flex items-center gap-1.5">
              <FileSignature className="size-4 text-[#146ef5]" />
              <span>{isAr ? 'توقيع مؤهل (القانون 15-04)' : 'Signature Légale (Loi 15-04)'}</span>
            </span>
            <span className="text-[#d8d8d8]">•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-4 text-[#080808]" />
              <span>{isAr ? 'تشفير مالي AES-256' : 'Chiffrement AES-256'}</span>
            </span>
            <span className="text-[#d8d8d8]">•</span>
            <span className="flex items-center gap-1.5">
              <Receipt className="size-4 text-[#146ef5]" />
              <span>{isAr ? 'وصل سحب رقمي معتمد' : 'Reçu numérique certifié'}</span>
            </span>
          </div>

        </div>

        {/* 3-Card Choice Row with portal-specific color branding */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {choices.map((choice) => {
            const Icon = choice.icon;
            return (
              <Link
                key={choice.id}
                href={choice.link}
                className="group relative flex flex-col justify-between p-6 bg-[#ffffff] border border-[#d8d8d8] rounded-[10px] hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                style={{
                  borderTop: `4px solid ${choice.accentColor}`,
                }}
              >
                {/* Subtle top background gradient glow in the card's specific color */}
                <div
                  className="absolute top-0 inset-x-0 h-28 opacity-25 pointer-events-none transition-opacity group-hover:opacity-40"
                  style={{
                    background: `linear-gradient(180deg, ${choice.accentColor} 0%, transparent 100%)`,
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[13px] font-mono font-bold uppercase tracking-wider border"
                      style={{
                        backgroundColor: choice.badgeBg,
                        borderColor: choice.accentColor,
                        color: choice.textColor,
                      }}
                    >
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: choice.accentColor }} />
                      <span>{choice.tag}</span>
                    </span>

                    <div
                      className="p-2.5 rounded-[6px] transition-all duration-200 group-hover:scale-105"
                      style={{
                        backgroundColor: choice.badgeBg,
                        color: choice.textColor,
                      }}
                    >
                      <Icon className="size-4" style={{ color: choice.textColor }} />
                    </div>
                  </div>

                  <h2 className="text-[17px] font-bold text-[#080808] mb-2 leading-snug">
                    {choice.title}
                  </h2>

                  <p className="text-[14px] font-normal text-[#5a5a5a] leading-relaxed">
                    {choice.desc}
                  </p>
                </div>

                <div
                  className="relative z-10 pt-5 mt-4 border-t border-[#f0f0f0] flex items-center justify-between text-[13px] font-bold group-hover:underline"
                  style={{ color: choice.textColor }}
                >
                  <span>{isAr ? 'دخول فضاء العمل' : 'Ouvrir l’espace'}</span>
                  {isAr ? (
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
                  ) : (
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </header>
  );
};

export default V3Hero;
