import React from 'react';
import { useI18n } from '@/i18n';
import {
  Calculator,
  DownloadCloud,
  Lock,
  Gavel,
  ArrowLeft,
  ArrowRight,
  Workflow,
  CheckCircle2,
} from 'lucide-react';

export const V3WorkflowSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

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

  return (
    <section
      id="workflow"
      dir={dir}
      className="relative w-full bg-transparent py-16 sm:py-20 px-4 sm:px-6 overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto">
        {/* رأس القسم: مؤطر وبدون نقاط في العنوان */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/30 bg-white/15 backdrop-blur-md text-white text-xs sm:text-sm font-bold shadow-sm mb-4">
            <Workflow className="size-3.5 text-emerald-300" strokeWidth={2} />
            <span>{isAr ? 'مسار الإبرام الرقمي' : 'Cycle de Vie du Marché'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
            {isAr ? 'كيف تعمل المنصة' : 'Comment Fonctionne la Plateforme'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-blue-100 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'أربع مراحل متسلسلة تضمن الشفافية والامتثال التام لأحكام القانون 23-12 والمرسوم الرئاسي 15-247'
              : 'Quatre étapes interconnectées garantissant la régularité juridique et l’intégrité des deniers publics'}
          </p>
        </div>

        {/* شبكة المراحل الأربع */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* شريط رقم المرحلة والتاج */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <span className="text-2xl font-black text-slate-300 group-hover:text-emerald-700 transition-colors font-mono">
                      {item.step}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                      {item.tag}
                    </span>
                  </div>

                  {/* الأيقونة */}
                  <div className={`size-12 rounded-xl border flex items-center justify-center ${item.color} shadow-2xs mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className="size-6" strokeWidth={1.75} />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5 leading-snug group-hover:text-[#006233] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>

                {/* مؤشر أسفل البطاقة يوضح التقدم */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
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
    </section>
  );
};

export default V3WorkflowSection;