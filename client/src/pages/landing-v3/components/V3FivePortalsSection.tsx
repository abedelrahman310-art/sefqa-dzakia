import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Globe,
  Briefcase,
  Landmark,
  Eye,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Layers,
} from 'lucide-react';

/* ─── بداية القسم 2: البوابات الخمس ─── */
export const V3FivePortalsSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const portals = [
    {
      id: 'national',
      title: isAr ? 'البوابة الوطنية' : 'Portail National',
      tag: isAr ? 'وصول عام' : 'Accès Public',
      desc: isAr
        ? 'استعراض شامل لجميع الاستشارات وطلبات العروض والمناقصات الوطنية عبر 69 ولاية جزائرية في الوقت الفعلي.'
        : 'Consultation libre de tous les avis d’appels d’offres et consultations nationales à travers les 69 wilayas.',
      icon: Globe,
      link: '/tenders',
      accent: 'border-slate-200 hover:border-emerald-500',
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'operator',
      title: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur Économique',
      tag: isAr ? 'المؤسسات والمقاولون' : 'Entreprises & Fournisseurs',
      desc: isAr
        ? 'فضاء المؤسسات والموردين لدراسة دفاتر الشروط، تحضير العروض المالية والتقنية، وإيداع الأظرفة المشفرة.'
        : 'Espace dédié aux entreprises pour retirer les cahiers des charges, préparer les offres et soumissionner sous pli scellé.',
      icon: Briefcase,
      link: '/operator',
      accent: 'border-slate-200 hover:border-teal-500',
      iconColor: 'text-teal-700 bg-teal-50 border-teal-100',
    },
    {
      id: 'authority',
      title: isAr ? 'بوابة المصلحة المتعاقدة' : 'Portail Service Contractant',
      tag: isAr ? 'الهيئات العمومية' : 'Services Publics',
      desc: isAr
        ? 'فضاء الإدارات والهيئات العمومية لإعداد الصفقات، حساب التقدير الإداري، وتنظيم جلسات فتح وتقييم العروض.'
        : 'Outil de gestion pour les administrations publiques: estimation B.O.Q, commission d’ouverture et attribution.',
      icon: Landmark,
      link: '/authority',
      accent: 'border-slate-200 hover:border-[#006233]',
      iconColor: 'text-[#006233] bg-emerald-50 border-emerald-200/70',
    },
    {
      id: 'central',
      title: isAr ? 'بوابة الرقابة المركزية عين الصقر' : 'Supervision Centrale Œil de Faucon',
      tag: isAr ? 'الرقابة والنزاهة' : 'Supervision & Audit',
      desc: isAr
        ? 'منصة القيادة والنزاهة للجهات الرقابية والمفتشية العامة لتحليل مؤشرات الصفقات ورصد شبهات التواطؤ.'
        : 'Tableau de bord pour les autorités de contrôle afin de suivre les flux budgétaires et détecter les collusions.',
      icon: Eye,
      link: '/central',
      accent: 'border-slate-200 hover:border-amber-600',
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      id: 'auth',
      title: isAr ? 'بوابة الهوية والتحقق الموحد' : 'Portail Identité & Authentification',
      tag: isAr ? 'التوثيق السيادي' : 'Authentification Sécurisée',
      desc: isAr
        ? 'منظومة الدخول الموحد والتحقق الرقمي الدقيق من السجلات التجارية وأرقام NIF والنطاقات الإدارية الرسمية.'
        : 'Point d’accès unifié vérifiant le registre de commerce, le code NIF et les domaines administratifs officiels.',
      icon: ShieldCheck,
      link: '/login',
      accent: 'border-slate-200 hover:border-slate-500',
      iconColor: 'text-slate-700 bg-slate-100 border-slate-200',
    },
  ];

  return (
    <section
      id="portals"
      dir={dir}
      className="relative w-full bg-[#f8fafc] py-16 sm:py-20 px-4 sm:px-6 overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto">
        {/* رأس القسم: مؤطر وقصير وخالي تماماً من الفواصل والنقاط في العنوان الكبير */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-bold shadow-2xs mb-4">
            <Layers className="size-3.5 text-[#006233]" strokeWidth={1.75} />
            <span>{isAr ? 'فضاءات العمل المتخصصة' : 'Espaces Dédiés'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {isAr ? 'البوابات الخمس لمنظومة الصفقات' : 'Les Cinq Portails de la Plateforme'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'بيئة عمل حكومية موحدة توفر واجهات مخصصة لكل متدخل في مسار الطلبيات والمشتريات العمومية.'
              : 'Un écosystème numérique unifié offrant des espaces de travail dédiés avec une gouvernance rigoureuse.'}
          </p>
        </div>

        {/* شبكة البوابات الخمس: 3 في الصف الأول و2 في الصف الثاني المتوازن */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {portals.slice(0, 3).map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className={`group bg-white rounded-2xl border ${portal.accent} p-6 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className={`size-11 rounded-xl border flex items-center justify-center ${portal.iconColor} shadow-2xs`}>
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full">
                      {portal.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5 leading-snug group-hover:text-[#006233] transition-colors">
                    {portal.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                    {portal.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href={portal.link}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-[#006233] text-slate-700 hover:text-white border border-slate-200/90 hover:border-[#006233] text-sm font-bold transition-all duration-200 shadow-2xs group/btn"
                  >
                    <span>{isAr ? 'استكشاف البوابة' : 'Explorer le portail'}</span>
                    <ArrowIcon className="size-4 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* الصف الثاني: البوابتان المتبقيتان (الرقابة المركزية عين الصقر + بوابة الهوية) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 mt-6 sm:mt-7 max-w-4xl mx-auto">
          {portals.slice(3, 5).map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className={`group bg-white rounded-2xl border ${portal.accent} p-6 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className={`size-11 rounded-xl border flex items-center justify-center ${portal.iconColor} shadow-2xs`}>
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full">
                      {portal.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5 leading-snug group-hover:text-[#006233] transition-colors">
                    {portal.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                    {portal.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href={portal.link}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-[#006233] text-slate-700 hover:text-white border border-slate-200/90 hover:border-[#006233] text-sm font-bold transition-all duration-200 shadow-2xs group/btn"
                  >
                    <span>{isAr ? 'استكشاف البوابة' : 'Explorer le portail'}</span>
                    <ArrowIcon className="size-4 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" strokeWidth={1.75} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
/* ─── نهاية القسم 2: البوابات الخمس ─── */

export default V3FivePortalsSection;
