import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Briefcase,
  Landmark,
  Eye,
  ArrowLeft,
  ArrowRight,
  Layers,
} from 'lucide-react';

/* ─── بداية القسم 2: بوابات منظومة الصفقات ─── */
export const V3FivePortalsSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const portals = [
    {
      id: 'operator',
      title: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur Économique',
      tag: isAr ? 'المؤسسات والمقاولون' : 'Entreprises & Fournisseurs',
      desc: isAr
        ? 'فضاء المؤسسات والموردين لدراسة دفاتر الشروط، تحضير العروض المالية والتقنية، وإيداع الأظرفة المشفرة.'
        : 'Espace dédié aux entreprises pour retirer les cahiers des charges, préparer les offres et soumissionner sous pli scellé.',
      icon: Briefcase,
      link: '/operator',
      cardClass: 'bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#075985] text-white border-sky-600/40 shadow-sm hover:shadow-lg',
      titleClass: 'text-white',
      descClass: 'text-sky-100',
      tagClass: 'bg-white/20 text-white border border-white/30',
      iconBox: 'bg-white text-[#0284c7] shadow-2xs',
      btnClass: 'bg-white hover:bg-sky-50 text-[#0284c7] hover:text-[#0369a1] border border-white shadow-2xs font-bold',
      dividerClass: 'border-white/15',
      noteText: isAr ? 'لون القائمة الجانبية للمتعامل' : 'Thème barre latérale opérateur',
      noteClass: 'text-sky-200',
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
      cardClass: 'bg-gradient-to-br from-[#0b4348] via-[#0d4f55] to-[#072f33] text-white border-teal-700/40 shadow-sm hover:shadow-lg',
      titleClass: 'text-white',
      descClass: 'text-teal-100',
      tagClass: 'bg-white/20 text-white border border-white/30',
      iconBox: 'bg-white text-[#0b4348] shadow-2xs',
      btnClass: 'bg-white hover:bg-teal-50 text-[#0b4348] hover:text-[#072f33] border border-white shadow-2xs font-bold',
      dividerClass: 'border-white/15',
      noteText: isAr ? 'لون القائمة الجانبية للمصلحة' : 'Thème barre latérale service',
      noteClass: 'text-teal-200',
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
      cardClass: 'bg-gradient-to-br from-[#0f3154] via-[#143d66] to-[#0a233c] text-white border-slate-700/50 shadow-sm hover:shadow-lg',
      titleClass: 'text-white',
      descClass: 'text-slate-200',
      tagClass: 'bg-amber-400/20 text-amber-300 border border-amber-400/40',
      iconBox: 'bg-amber-400 text-[#0f3154] shadow-2xs',
      btnClass: 'bg-amber-400 hover:bg-amber-300 text-[#0f3154] hover:text-black border border-amber-400 shadow-2xs font-bold',
      dividerClass: 'border-white/15',
      noteText: isAr ? 'لون القائمة الجانبية للرقابة' : 'Thème barre latérale contrôle',
      noteClass: 'text-amber-200/90',
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
            {isAr ? 'بوابات منظومة الصفقات' : 'Portails de la Plateforme'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'بيئة عمل حكومية موحدة توفر واجهات مخصصة لكل متدخل في مسار الطلبيات والمشتريات العمومية.'
              : 'Un écosystème numérique unifié offrant des espaces de travail dédiés avec une gouvernance rigoureuse.'}
          </p>
        </div>

        {/* شبكة البوابات الثلاث التنفيذية بهوية القائمة الجانبية لكل فضاء */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className={`group rounded-2xl p-6 sm:p-7 ${portal.cardClass} hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className={`size-11 rounded-xl flex items-center justify-center ${portal.iconBox}`}>
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${portal.tagClass}`}>
                      {portal.tag}
                    </span>
                  </div>

                  <h3 className={`text-lg sm:text-xl font-bold mb-2.5 leading-snug ${portal.titleClass}`}>
                    {portal.title}
                  </h3>

                  <p className={`text-sm leading-relaxed font-medium mb-6 ${portal.descClass}`}>
                    {portal.desc}
                  </p>
                </div>

                <div>
                  <div className={`pt-3 mb-4 border-t ${portal.dividerClass} flex items-center justify-between text-xs font-medium`}>
                    <span className={portal.noteClass}>{portal.noteText}</span>
                    <span className="size-1.5 rounded-full bg-white/70" />
                  </div>

                  <Link
                    href={portal.link}
                    className={`inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${portal.btnClass} group/btn`}
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
/* ─── نهاية القسم 2: بوابات منظومة الصفقات ─── */

export default V3FivePortalsSection;
