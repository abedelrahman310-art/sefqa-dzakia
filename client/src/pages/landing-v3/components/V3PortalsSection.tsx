import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Briefcase,
  Building,
  Eye,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const V3PortalsSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const portals = [
    {
      id: 'operator',
      title: isAr ? 'بوابة المتعامل الاقتصادي' : 'Opérateur Économique',
      desc: isAr
        ? 'تصفح الصفقات الوطنية، التدقيق بدرع الامتثال القانوني، وتشفير وإيداع العروض المالية بختم AES-256 وسحب الدفاتر رقمياً دون ورق.'
        : 'Explorez les marchés publics, auditez vos dossiers administratifs et chiffrez vos offres financières en toute sécurité.',
      icon: Briefcase,
      link: '/operator/deals',
      tag: isAr ? 'المتعهدون والمؤسسات' : 'Soumissionnaires',
      accentColor: '#047857',
      cardBorder: 'hover:border-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      btnBg: 'bg-emerald-700 hover:bg-emerald-800 text-white',
      features: isAr
        ? ['سحب دفاتر الشروط الفوري', 'درع التحقق المسبق من الامتثال', 'تشفير الأظرفة بختم رقمي AES-256']
        : ['Retrait dématérialisé', 'Audit de conformité pré-dépôt', 'Chiffrement AES-256'],
    },
    {
      id: 'authority',
      title: isAr ? 'بوابة المصلحة المتعاقدة' : 'Autorité Contractante',
      desc: isAr
        ? 'إعداد دفاتر الشروط المحايدة، مصفوفة التقييم المئوية، رئاسة لجان فتح الأظرفة وتقييم العروض (COPEM)، ومتابعة تنفيذ العقود.'
        : 'Élaborez des cahiers des charges neutres, pilotez les commissions d’ouverture et suivez l’exécution des contrats.',
      icon: Building,
      link: '/authority/deals',
      tag: isAr ? 'الإدارات والهيئات العمومية' : 'Acheteurs Publics',
      accentColor: '#0f3154',
      cardBorder: 'hover:border-sky-600',
      badgeBg: 'bg-sky-50 text-sky-900 border-sky-200',
      btnBg: 'bg-[#0f3154] hover:bg-[#143e68] text-white',
      features: isAr
        ? ['صانع دفاتر الشروط المحايدة', 'جلسات فتح وتقييم رقمية علنية', 'إصدار أوامر الخدمة وإبرام العقود']
        : ['Rédaction neutre des charges', 'Commissions d’ouverture dématérialisées', 'Gestion des ODS et contrats'],
    },
    {
      id: 'central',
      title: isAr ? 'بوابة الرقابة والنزاهة المركزية' : 'Supervision Centrale',
      desc: isAr
        ? 'الرقابة الكلية عبر الولايات الـ 69، رادار كشف التواطؤ ومحاكاة العطاءات، ومنع انحراف الآجال والملاحق، وإصدار التوجيهات الإدارية.'
        : 'Contrôle national sur les 69 wilayas, radar anti-collusion algorithmique et prévention des dérives budgétaires.',
      icon: Eye,
      link: '/central',
      tag: isAr ? 'المفتشية العامة والرقابة' : 'Contrôle National',
      accentColor: '#c2410c',
      cardBorder: 'hover:border-amber-500',
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
      btnBg: 'bg-amber-700 hover:bg-amber-800 text-white',
      features: isAr
        ? ['رادار كشف التواطؤ والتحالفات', 'مؤشر التنبؤ المبكر بتعثر المشاريع', 'التوجيهات والإعذارات الإدارية الملزمة']
        : ['Radar anti-collusion algorithmique', 'Prédicteur de retards de projets', 'Injonctions administratives'],
    },
  ];

  return (
    <section id="portals" dir={dir} className="w-full bg-[#ffffff] py-14 sm:py-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Framed Short Section Title */}
        <div className="flex flex-col items-center justify-center text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs mb-2.5">
            <span className="size-2 rounded-full bg-emerald-600" />
            <span>{isAr ? 'البوابات السيادية الثلاث' : 'Trois Espaces Dédiés'}</span>
          </div>
          <div className="inline-block px-5 sm:px-7 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'فضاءات عمل رقمية مترابطة' : 'Espaces Numériques Unifiés'}
            </h2>
          </div>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium">
            {isAr
              ? 'منظومة موحدة تربط أطراف الصفقة العمومية وفق أحكام القانون 23-12 بصلاحيات مؤمنة ومسارات مستقلة.'
              : 'Une plateforme unique synchronisant l’ensemble des intervenants du marché public.'}
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className={`flex flex-col justify-between p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-2xs ${portal.cardBorder} transition-all duration-300 hover:shadow-md relative overflow-hidden`}
              >
                {/* Top Border Indicator */}
                <div
                  className="absolute top-0 inset-x-0 h-1.5"
                  style={{ backgroundColor: portal.accentColor }}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-bold border ${portal.badgeBg}`}>
                      <span className="size-2 rounded-full" style={{ backgroundColor: portal.accentColor }} />
                      <span>{portal.tag}</span>
                    </span>

                    <div className="size-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-800">
                      <Icon className="size-5" style={{ color: portal.accentColor }} />
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5">
                    {portal.title}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mb-6">
                    {portal.desc}
                  </p>

                  <div className="space-y-2 mb-6 pt-2 border-t border-slate-100">
                    {portal.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={portal.link}
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold shadow-2xs transition-colors ${portal.btnBg}`}
                >
                  <span>{isAr ? 'دخول فضاء العمل' : 'Accéder à l’espace'}</span>
                  <ArrowIcon className="size-4" />
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default V3PortalsSection;
