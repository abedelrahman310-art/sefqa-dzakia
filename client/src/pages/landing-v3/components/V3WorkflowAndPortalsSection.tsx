import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Calculator,
  DownloadCloud,
  Lock,
  Gavel,
  Building2,
  Landmark,
  ShieldCheck,
  Check,
  ArrowLeft,
  ArrowRight,
  Workflow,
  Layers,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

/**
 * قسم مدمج موحد: كيف تعمل المنصة وبوابات المنظومة
 * يدمج مسار الصفقة العمومية بمراحله الأربع وفق القانون 23-12 مع البوابات الثلاث المخصصة
 */
export const V3WorkflowAndPortalsSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // ─── 1. مراحل مسار الإبرام الرقمي الأربع ───
  const steps = [
    {
      step: '01',
      title: isAr ? 'الإعداد والتقدير الإداري' : 'Préparation et Estimation',
      tag: isAr ? 'المصلحة المتعاقدة' : 'Service Contractant',
      desc: isAr
        ? 'إعداد دفتر الشروط وجدول الكميات B.O.Q ووضع التقدير المالي الإداري السري وفق أحكام القانون رقم 23-12'
        : 'Élaboration du cahier des charges, du bordereau B.O.Q et de l’estimation administrative confidentielle',
      icon: Calculator,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
    },
    {
      step: '02',
      title: isAr ? 'الإشهار وسحب الدفاتر' : 'Publication et Retrait des CDC',
      tag: isAr ? 'شفافية الإجراءات' : 'Publication Numérique',
      desc: isAr
        ? 'نشر طلب العروض وسحب دفاتر الشروط إلكترونياً بصيغة فورية مع إصدار وصل سحب رقمي رسمي ومؤمن'
        : 'Publication transparente de l’avis et retrait immédiat du CDC avec récépissé numérique authentifié',
      icon: DownloadCloud,
      color: 'text-teal-700 bg-teal-50 border-teal-200/80',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200/70',
    },
    {
      step: '03',
      title: isAr ? 'إيداع العروض وتشفير الأظرفة' : 'Dépôt et Chiffrement des Plis',
      tag: isAr ? 'تشفير SHA-256' : 'Chiffrement SHA-256',
      desc: isAr
        ? 'فحص الامتثال المسبق للشهادات الجبائية وإيداع الأظرفة المالية مشفرة بأقفال زمنية تمنع كشف الأسعار قبل الجلسة'
        : 'Vérification préalable des pièces obligatoires et dépôt des offres chiffrées avec verrou temporel inviolable',
      icon: Lock,
      color: 'text-blue-700 bg-blue-50 border-blue-200/80',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200/70',
    },
    {
      step: '04',
      title: isAr ? 'الفتح العلني والمنح والطعون' : 'Ouverture Publique et Attribution',
      tag: isAr ? 'القانون 15-04' : 'Loi 15-04',
      desc: isAr
        ? 'جلسة فتح أظرفة علنية بحضور المتعهدين، توقيع إلكتروني للمحاضر، إعلان المنح المؤقت، وإتاحة تقديم الطعون'
        : 'Séance publique de déchiffrement, signature électronique des PV, publication de l’attribution et recours',
      icon: Gavel,
      color: 'text-amber-700 bg-amber-50 border-amber-200/80',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/70',
    },
  ];

  // ─── 2. فضاءات وبوابات المنصة الثلاث ───
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
      btnClass:
        'bg-sky-50/70 hover:bg-[#0284c7] text-[#0284c7] hover:text-white border border-sky-200/90 hover:border-[#0284c7] shadow-2xs',
      features: isAr
        ? [
            'مطابقة ذكية للفرص وتصنيف المؤهلات',
            'تحليل دفاتر الشروط واستخراج الشروط',
            'درع امتثال مسبق للملف الإداري والجبائي',
            'إيداع الأظرفة التقنية والمالية المشفرة',
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
      btnClass:
        'bg-emerald-50/70 hover:bg-[#006233] text-[#006233] hover:text-white border border-emerald-200/90 hover:border-[#006233] shadow-2xs',
      features: isAr
        ? [
            'إنشاء وتصميم الصفقات خطوة بخطوة',
            'تقدير مالي إداري وتوليد جدول B.O.Q',
            'إدارة جلسات الفتح والتقييم العلني',
            'متابعة التنفيذ وتوليد الملاحق والفوترة',
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
      tag: isAr ? 'للرقابة والنزاهة والتدقيق' : 'Contrôle & Conformité',
      desc: isAr
        ? 'راقب الصفقات العمومية عبر مؤشرات لحظية وتحليلات للمخاطر وخرائط جغرافية وتنبيهات استباقية'
        : 'Supervisez les marchés publics via des indicateurs en temps réel, analyses de risques et cartographies géographiques.',
      icon: ShieldCheck,
      link: '/central',
      accentColor: '#d97706',
      hoverBorder: 'hover:border-amber-300',
      iconBox: 'bg-amber-50 text-amber-800 border border-amber-200/90',
      tagClass: 'bg-amber-50 text-amber-800 border border-amber-200/80',
      btnClass:
        'bg-amber-50/70 hover:bg-amber-700 text-amber-800 hover:text-white border border-amber-200/90 hover:border-amber-700 shadow-2xs',
      features: isAr
        ? [
            'رصد لحظي لمسارات الإبرام والصفقات',
            'تحليل مؤشرات المخاطر ومطابقة الأسعار',
            'خريطة حرارية وتوزيع جغرافي عبر الولايات',
            'تقارير التدقيق الشاملة وتنبيهات استباقية',
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
      id="workflow"
      dir={dir}
      className="relative w-full bg-transparent py-16 sm:py-24 px-4 sm:px-6 overflow-hidden"
    >
      {/* مرسى الروابط المزدوج لضمان عمل كل من #workflow و #portals بسلاسة */}
      <span id="portals" className="absolute -top-20 block" aria-hidden="true" />

      <div className="relative max-w-[1200px] mx-auto space-y-16 sm:space-y-20">
        
        {/* ══════════════════════════════════════════════════════════════════
            1. رأس القسم الموحد: مسار الإبرام الرقمي وبوابات المنصة
            ══════════════════════════════════════════════════════════════════ */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/30 bg-white/15 backdrop-blur-md text-white text-xs sm:text-sm font-bold shadow-sm mb-4">
            <Workflow className="size-3.5 text-emerald-300" strokeWidth={2} />
            <span>{isAr ? 'مسار الإبرام الرقمي والفضاءات المتكاملة' : 'Cycle de Vie & Espaces Dédiés'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {isAr ? 'كيف تعمل المنظومة وبواباتها' : 'Fonctionnement et Portails Dédiés'}
          </h2>

          <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-blue-100 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'دورة تعاقدية رقمية كاملة من الإعداد إلى المنح النهائي عبر أربع مراحل متسلسلة تنفذ بسلاسة داخل ثلاث بوابات حكومية متخصصة.'
              : 'Un cycle de passation numérique complet en quatre étapes transparentes, orchestré à travers trois portails institutionnels interconnectés.'}
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. مسار الصفقة العمومية خطوة بخطوة (المراحل الأربع)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-white/20 pb-3">
            <div className="flex items-center gap-2 text-white">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider font-mono text-emerald-200">
                {isAr ? 'المسار القانوني والإجرائي خطوة بخطوة' : 'Étapes Réglementaires du Marché'}
              </h3>
            </div>
            <span className="text-xs font-semibold text-blue-200 font-mono">
              {isAr ? 'القانون 23-12 · المرسوم الرئاسي 15-247' : 'Conforme Loi 23-12'}
            </span>
          </div>

          {/* شبكة المراحل الأربع */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="group relative bg-white/95 backdrop-blur-xl rounded-2xl border border-white/90 p-6 shadow-md hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* شريط رقم المرحلة والتاج */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="text-2xl font-black text-slate-300 group-hover:text-emerald-700 transition-colors font-mono">
                        {item.step}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                        {item.tag}
                      </span>
                    </div>

                    {/* الأيقونة */}
                    <div className={`size-11 rounded-xl border flex items-center justify-center ${item.color} shadow-2xs mb-4 group-hover:scale-105 transition-transform`}>
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-[#006233] transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>

                  {/* مؤشر أسفل البطاقة يوضح التقدم */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="inline-flex items-center gap-1.5 text-slate-500 group-hover:text-emerald-800 transition-colors">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span>{isAr ? `المرحلة ${idx + 1}` : `Étape ${idx + 1}`}</span>
                    </span>
                    {idx < steps.length - 1 && (
                      <ArrowIcon className="size-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors hidden lg:block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. جسر الانتقال إلى فضاءات وبوابات المنصة الثلاث
            ══════════════════════════════════════════════════════════════════ */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/20" />
          </div>
          <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/30 bg-[#1e40af]/80 backdrop-blur-md text-white text-xs font-bold shadow-sm">
            <Layers className="size-3.5 text-emerald-300" />
            <span>{isAr ? 'البوابات الرسمية المتخصصة لتنفيذ المسار' : 'Portails Officiels Dédiés'}</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            4. شبكة بوابات المنصة الثلاث
            ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className={`group rounded-2xl p-6 sm:p-7 bg-white border border-white/95 shadow-md hover:shadow-2xl ${portal.hoverBorder} hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
              >
                {/* شريط تمييز علوي بلون البوابة */}
                <div
                  className="absolute top-0 inset-x-0 h-1.5"
                  style={{ backgroundColor: portal.accentColor }}
                />

                {/* أيقونة علامة مائية خافتة جداً في زاوية البطاقة تمنح عمقاً بصرياً */}
                <div className="absolute -bottom-6 -end-6 pointer-events-none opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 group-hover:scale-110">
                  <Icon className="size-36" strokeWidth={1} />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className={`size-11 rounded-xl flex items-center justify-center ${portal.iconBox} shadow-2xs group-hover:scale-105 transition-transform`}>
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${portal.tagClass}`}>
                      {portal.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-snug group-hover:text-slate-950 transition-colors">
                    {portal.title}
                  </h3>

                  <p className="text-xs sm:text-sm leading-relaxed font-medium text-slate-600 mb-5">
                    {portal.desc}
                  </p>

                  {/* كتلة أبرز الميزات */}
                  <div className="pt-4 mb-6 border-t border-slate-100">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 font-mono">
                      {isAr ? 'أبرز الصلاحيات والميزات' : 'Fonctionnalités Clés'}
                    </h4>
                    <ul className="space-y-2">
                      {portal.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                          <span className="size-4.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/80">
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 relative z-10">
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

export default V3WorkflowAndPortalsSection;
