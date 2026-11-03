import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building,
  Eye,
  CheckCircle2,
  FileCheck2,
  Lock,
  Layers
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
    },
    {
      id: 'central',
      title: isAr ? 'عين الصقر (الإدارة المركزية)' : 'Supervision Centrale',
      desc: isAr
        ? 'الرقابة الكلية عبر 69 ولاية، رادار كشف التواطؤ، ومنع انحراف الآجال والملاحق القانونية.'
        : 'Supervision nationale sur 69 wilayas, radar anti-collusion et détection des dérives.',
      icon: Eye,
      link: '/central',
      tag: isAr ? 'الرقابة والنزاهة' : 'Contrôle National',
    },
  ];

  return (
    <header
      id="overview"
      dir={dir}
      className="w-full bg-[#ffffff] pt-16 sm:pt-20 pb-16 sm:pb-24 border-b border-[#d8d8d8]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Centered Hero Stack */}
        <div className="max-w-[840px] mx-auto text-center space-y-6 mb-16">
          
          {/* Eyebrow Label (13px, weight 500, +0.1em tracking, uppercase, #5a5a5a) */}
          <div className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#146ef5]" />
            <p className="text-[13px] font-medium tracking-[0.1em] uppercase text-[#5a5a5a] font-mono">
              {isAr
                ? 'الجمهورية الجزائرية الديمقراطية الشعبية • القانون 23-12'
                : 'RÉPUBLIQUE ALGÉRIENNE • LOI 23-12 DES MARCHÉS PUBLICS'}
            </p>
          </div>

          {/* Monumental Headline (56–72px, weight 600, #080808, line-height 1.04, letter-spacing -0.01em) */}
          <h1 className="text-[42px] sm:text-[56px] lg:text-[70px] font-bold text-[#080808] leading-[1.04] tracking-[-0.01em] font-sans">
            {isAr ? (
              <>
                المنظومة الوطنية الموحدة <br />
                <span className="text-[#146ef5]">للصفقات العمومية</span>
              </>
            ) : (
              <>
                La plateforme souveraine des <br />
                <span className="text-[#146ef5]">marchés publics</span>
              </>
            )}
          </h1>

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
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[13px] text-[#5a5a5a]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#146ef5]" />
              <span>{isAr ? 'ورق 0% (المادة 67)' : 'Zéro Papier (Art. 67)'}</span>
            </span>
            <span className="text-[#d8d8d8]">•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-4 text-[#080808]" />
              <span>{isAr ? 'تشفير مالي AES-256' : 'Chiffrement AES-256'}</span>
            </span>
            <span className="text-[#d8d8d8]">•</span>
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="size-4 text-[#146ef5]" />
              <span>{isAr ? 'وصل سحب رقمي معتمد' : 'Reçu numérique certifié'}</span>
            </span>
          </div>

        </div>

        {/* 3-Card Choice Row (Spec: 8px radius, 1px #d8d8d8 border, 24px padding, 16px gap) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {choices.map((choice) => {
            const Icon = choice.icon;
            return (
              <Link
                key={choice.id}
                href={choice.link}
                className="group flex flex-col justify-between p-6 bg-[#ffffff] border border-[#d8d8d8] rounded-[8px] hover:border-[#080808] transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#5a5a5a]">
                      {choice.tag}
                    </span>
                    <div className="p-2 rounded-[4px] bg-[#f0f0f0] text-[#080808] group-hover:bg-[#146ef5] group-hover:text-white transition-colors">
                      <Icon className="size-4" />
                    </div>
                  </div>

                  <h2 className="text-[16px] font-semibold text-[#080808] mb-2 leading-snug">
                    {choice.title}
                  </h2>

                  <p className="text-[14px] font-normal text-[#5a5a5a] leading-relaxed">
                    {choice.desc}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-[#d8d8d8] flex items-center justify-between text-[13px] font-medium text-[#146ef5] group-hover:underline">
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
