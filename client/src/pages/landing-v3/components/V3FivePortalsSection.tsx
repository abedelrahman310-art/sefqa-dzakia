import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Building2,
  Landmark,
  ShieldCheck,
  Check,
  ArrowLeft,
  ArrowRight,
  Layers,
} from 'lucide-react';

/* ─── بداية القسم 2: بوابات المنصة ─── */
export const V3FivePortalsSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const portals = [
    {
      id: 'operator',
      title: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur Économique',
      tag: isAr ? 'للمقاولين والموردين' : 'Entreprises & Fournisseurs',
      desc: isAr
        ? 'استكشف الفرص وطابق نشاطك مع الصفقات المناسبة وجهّز عرضك التقني والمالي وأودعه في أظرفة رقمية محمية'
        : 'Explorez les opportunités, préparez vos offres techniques et financières et soumissionnez sous plis scellés et sécurisés.',
      icon: Building2,
      link: '/operator',
      accentColor: '#0284c7',
      hoverBorder: 'hover:border-sky-300',
      iconBox: 'bg-sky-50 text-[#0284c7] border border-sky-200/90',
      tagClass: 'bg-sky-50 text-[#0284c7] border border-sky-200/80',
      btnClass: 'bg-sky-50/70 hover:bg-[#0284c7] text-[#0284c7] hover:text-white border border-sky-200/90 hover:border-[#0284c7] shadow-2xs',
      features: isAr
        ? [
            'مطابقة ذكية للفرص',
            'تحليل دفاتر الشروط',
            'درع امتثال قبل الإيداع',
            'أظرفة رقمية مشفرة',
          ]
        : [
            'Correspondance intelligente des opportunités',
            'Analyse des cahiers des charges',
            'Bouclier de conformité pré-dépôt',
            'Plis numériques chiffrés',
          ],
    },
    {
      id: 'authority',
      title: isAr ? 'بوابة المصلحة المتعاقدة' : 'Portail Service Contractant',
      tag: isAr ? 'للإدارات والمؤسسات العمومية' : 'Administrations & Établissements Publics',
      desc: isAr
        ? 'أنشئ الصفقات وجهّز دفاتر الشروط وقّيم العروض وأشرف على التنفيذ من منصة واحدة منظمة وآمنة'
        : 'Créez vos marchés, élaborez les cahiers des charges, évaluez les offres et supervisez l’exécution en toute sécurité.',
      icon: Landmark,
      link: '/authority',
      accentColor: '#006233',
      hoverBorder: 'hover:border-emerald-300',
      iconBox: 'bg-emerald-50 text-[#006233] border border-emerald-200/90',
      tagClass: 'bg-emerald-50 text-[#006233] border border-emerald-200/80',
      btnClass: 'bg-emerald-50/70 hover:bg-[#006233] text-[#006233] hover:text-white border border-emerald-200/90 hover:border-[#006233] shadow-2xs',
      features: isAr
        ? [
            'إنشاء الصفقات خطوة بخطوة',
            'تقدير مالي وتوليد BOQ',
            'فتح الأظرفة وتقييم العروض',
            'متابعة التنفيذ والفوترة',
          ]
        : [
            'Création guidée étape par étape',
            'Estimation financière et génération BOQ',
            'Ouverture des plis et évaluation des offres',
            'Suivi d’exécution et facturation',
          ],
    },
    {
      id: 'central',
      title: isAr ? 'بوابة الرقابة المركزية' : 'Portail du Contrôle Central',
      tag: isAr ? 'للرقابة والنزاهة' : 'Contrôle & Conformité',
      desc: isAr
        ? 'راقب الصفقات العمومية عبر مؤشرات لحظية وتحليلات للمخاطر وخرائط جغرافية وتنبيهات استباقية'
        : 'Supervisez les marchés publics via des indicateurs en temps réel, analyses de risques et cartographies géographiques.',
      icon: ShieldCheck,
      link: '/central',
      accentColor: '#d97706',
      hoverBorder: 'hover:border-amber-300',
      iconBox: 'bg-amber-50 text-amber-800 border border-amber-200/90',
      tagClass: 'bg-amber-50 text-amber-800 border border-amber-200/80',
      btnClass: 'bg-amber-50/70 hover:bg-amber-700 text-amber-800 hover:text-white border border-amber-200/90 hover:border-amber-700 shadow-2xs',
      features: isAr
        ? [
            'رصد لحظي للصفقات',
            'تحليل مؤشرات المخاطر',
            'خريطة جغرافية للولايات',
            'تقارير وتنبيهات للرقابة',
          ]
        : [
            'Suivi des marchés en temps réel',
            'Analyse des indicateurs de risque',
            'Cartographie géospatiale des wilayas',
            'Rapports d’audit et alertes préventives',
          ],
    },
  ];

  return (
    <section
      id="portals"
      dir={dir}
      className="relative w-full bg-[#f8fafc] py-16 sm:py-20 px-4 sm:px-6 overflow-hidden"
    >
      {/* خلفية زليج جزائري خفيفة وهادئة جداً */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(#006233 0.75px, transparent 0.75px), radial-gradient(#d21034 0.75px, #f8fafc 0.75px)`,
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto">
        {/* رأس القسم: مؤطر وقصير وخالي تماماً من الفواصل والنقاط في العنوان الكبير */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-bold shadow-2xs mb-4">
            <Layers className="size-3.5 text-[#006233]" strokeWidth={1.75} />
            <span>{isAr ? 'ثلاث فضاءات متكاملة' : 'Trois Espaces Dédiés'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {isAr ? 'بوابات المنصة' : 'Portails de la Plateforme'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'بيئة عمل حكومية موحدة توفر واجهات مخصصة لكل متدخل في مسار الطلبيات والمشتريات العمومية.'
              : 'Un écosystème numérique unifié offrant des espaces de travail dédiés avec une gouvernance rigoureuse.'}
          </p>
        </div>

        {/* شبكة البوابات الثلاث: متجاوبة 1 في الهاتف، 2 في المتوسط، 3 في الكبير */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className={`group rounded-2xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-2xs hover:shadow-md ${portal.hoverBorder} hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
              >
                {/* شريط تمييز علوي بلون البوابة */}
                <div
                  className="absolute top-0 inset-x-0 h-1.5"
                  style={{ backgroundColor: portal.accentColor }}
                />

                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className={`size-11 rounded-xl flex items-center justify-center ${portal.iconBox}`}>
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${portal.tagClass}`}>
                      {portal.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5 leading-snug group-hover:text-slate-950 transition-colors">
                    {portal.title}
                  </h3>

                  <p className="text-sm leading-relaxed font-medium text-slate-600 mb-6">
                    {portal.desc}
                  </p>

                  {/* كتلة أبرز الميزات */}
                  <div className="pt-4 mb-6 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      {isAr ? 'أبرز الميزات' : 'Points clés'}
                    </h4>
                    <ul className="space-y-2.5">
                      {portal.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                          <Check className="size-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={portal.link}
                    className={`inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${portal.btnClass} group/btn cursor-pointer`}
                  >
                    <span>{isAr ? 'استكشاف البوابة' : 'Explorer le portail'}</span>
                    <ArrowIcon className="size-4 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" strokeWidth={2} />
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
/* ─── نهاية القسم 2: بوابات المنصة ─── */

export default V3FivePortalsSection;
