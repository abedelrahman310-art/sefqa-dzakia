import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  CornerDownLeft,
  CornerDownRight,
  ShieldCheck,
  Bot,
  Search,
  FileText,
  FileCode,
  GitBranch,
  Megaphone,
  Inbox,
  FolderOpen,
  BarChart3,
  AlertTriangle,
  Award,
} from 'lucide-react';

interface StageItem {
  id: number;
  num: string;
  title: string;
  aiRole: string;
  hoverDetail: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'prep' | 'award'; // prep = 1-5 (Green), award = 6-10 (Red)
}

export const V3LifecycleProcess: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [activeStage, setActiveStage] = useState<number | null>(null);

  // المراحل العشر القانونية مع دور الذكاء الاصطناعي الاستشاري والرقابي
  const stages: StageItem[] = [
    // ══════════════════════════════════════════════════════════════════════════
    // الصف الأول (المراحل 1 إلى 5): مرحلة التحضير والإشهار — اللون الأخضر #00753A
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 1,
      num: '01',
      title: isAr ? 'تحديد الحاجة' : 'Définition du Besoin',
      aiRole: isAr
        ? 'تحليل البيانات التاريخية والتنبؤ بالاحتياجات.'
        : 'Analyse des données historiques et prévision des besoins.',
      hoverDetail: isAr
        ? 'دراسة استهلاك السنوات السابقة وتقدير الكميات المطلوبة بدقة لتفادي العجز أو الهدر.'
        : 'Étude prédictive des consommations passées et estimation précise des volumes nécessaires.',
      icon: Search,
      group: 'prep',
    },
    {
      id: 2,
      num: '02',
      title: isAr ? 'إعداد الملف' : 'Préparation du Dossier',
      aiRole: isAr
        ? 'اقتراح المواصفات وتقدير التكلفة الأولية.'
        : 'Proposition des spécifications et estimation préalable du coût.',
      hoverDetail: isAr
        ? 'استخراج بنود المواصفات القياسية وحساب التقدير المالي استناداً إلى الأسعار المرجعية.'
        : 'Extraction des normes techniques types et calcul prévisionnel basé sur les mercuriales officielles.',
      icon: FileText,
      group: 'prep',
    },
    {
      id: 3,
      num: '03',
      title: isAr ? 'دفتر الشروط' : 'Cahier des Charges',
      aiRole: isAr
        ? 'مساعدة في صياغة الشروط والتحقق من اكتمالها.'
        : 'Assistance à la rédaction des clauses et contrôle d’exhaustivité.',
      hoverDetail: isAr
        ? 'فحص البنود الإلزامية ومنع الشروط الإقصائية وضمان مطابقة القانون 23-12.'
        : 'Contrôle automatique des clauses obligatoires et exclusion des conditions discriminatoires.',
      icon: FileCode,
      group: 'prep',
    },
    {
      id: 4,
      num: '04',
      title: isAr ? 'طريقة الإبرام' : 'Mode de Passation',
      aiRole: isAr
        ? 'اقتراح طريقة الإبرام المناسبة حسب طبيعة الصفقة.'
        : 'Recommandation du mode de passation adapté selon la nature du marché.',
      hoverDetail: isAr
        ? 'المقارنة الآلية مع العتبات المالية وحالات طلب العروض والتراضي القانونية.'
        : 'Vérification automatisée des seuils financiers et des critères de recours aux procédures légales.',
      icon: GitBranch,
      group: 'prep',
    },
    {
      id: 5,
      num: '05',
      title: isAr ? 'الإشهار' : 'Publication & Avis',
      aiRole: isAr
        ? 'تحديد المزودين المحتملين ونشر الصفقة للجمهور المستهدف.'
        : 'Ciblage des prestataires qualifiés et diffusion ciblée de l’avis.',
      hoverDetail: isAr
        ? 'إشعار المؤسسات والمؤسسات الناشئة المؤهلة وتوزيع الإعلان عبر القنوات الرسمية.'
        : 'Notification ciblée des opérateurs qualifiés et diffusion multicanale certifiée.',
      icon: Megaphone,
      group: 'prep',
    },

    // ══════════════════════════════════════════════════════════════════════════
    // الصف الثاني (المراحل 6 إلى 10): مرحلة العروض والإسناد — اللون الأحمر #D21034
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 6,
      num: '06',
      title: isAr ? 'استلام العروض' : 'Réception des Offres',
      aiRole: isAr
        ? 'فحص آلي للوثائق والتنبيه إلى النواقص.'
        : 'Vérification automatisée des pièces et détection des omissions.',
      hoverDetail: isAr
        ? 'التدقيق اللحظي في صلاحية السجل التجاري والشهادات الجبائية وكفالات التعهد.'
        : 'Vérification instantanée de la validité fiscale, parafiscale et bancaire des dossiers.',
      icon: Inbox,
      group: 'award',
    },
    {
      id: 7,
      num: '07',
      title: isAr ? 'فتح الأظرفة' : 'Ouverture des Plis',
      aiRole: isAr
        ? 'تسجيل العروض واستخراج البيانات الأساسية آلياً.'
        : 'Enregistrement des offres et extraction automatisée des données clés.',
      hoverDetail: isAr
        ? 'قراءة OCR الذكية وتفريغ المبالغ والضمانات وتوليد مسودة محضر الفتح فوراً.'
        : 'Extraction OCR sécurisée des montants, vérification des cautions et pré-génération du PV.',
      icon: FolderOpen,
      group: 'award',
    },
    {
      id: 8,
      num: '08',
      title: isAr ? 'تقييم العروض' : 'Évaluation des Offres',
      aiRole: isAr
        ? 'مقارنة العروض وترتيبها وفق معايير دفتر الشروط.'
        : 'Comparaison et classement objectif selon les critères fixés.',
      hoverDetail: isAr
        ? 'تطبيق مصفوفة التنقيط ورصد العروض المنخفضة بشكل غير طبيعي أو الشاذة.'
        : 'Application du barème de notation et identification prédictive des offres anormalement basses.',
      icon: BarChart3,
      group: 'award',
    },
    {
      id: 9,
      num: '09',
      title: isAr ? 'المنح المؤقت' : 'Attribution Provisoire',
      aiRole: isAr
        ? 'رصد المخالفات والتنبيه إلى الطعون المحتملة.'
        : 'Détection des anomalies et anticipation des recours éventuels.',
      hoverDetail: isAr
        ? 'تشغيل خوارزميات النزاهة واحتساب آجال الطعون القانونية (10 أيام) بدقة.'
        : 'Audit continu de probité et suivi rigoureux du délai légal de recours de 10 jours.',
      icon: AlertTriangle,
      group: 'award',
    },
    {
      id: 10,
      num: '10',
      title: isAr ? 'الإسناد النهائي' : 'Attribution Définitive',
      aiRole: isAr
        ? 'إعداد تقرير دعم القرار والتحقق من اكتمال الإجراءات.'
        : 'Rapport d’aide à la décision et validation de la conformité légale.',
      hoverDetail: isAr
        ? 'مراجعة ملف الرقابة القبلية والتأشيرة المالية وتجهيز مسودة عقد الصفقة النهائي.'
        : 'Synthèse pour les corps de contrôle, visa financier et finalisation contractuelle.',
      icon: Award,
      group: 'award',
    },
  ];

  const row1 = stages.slice(0, 5); // مراحل 1 إلى 5
  const row2 = stages.slice(5, 10); // مراحل 6 إلى 10

  return (
    <section
      id="lifecycle"
      dir={dir}
      className="w-full bg-[#FFFFFF] py-14 sm:py-20 overflow-hidden"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* ══════════════════════════════════════════════════════════════════════
            ترويسة القسم المؤطرة والمختصرة
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center justify-center text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-[#00753A] text-xs sm:text-sm font-bold shadow-2xs mb-3">
            <Sparkles className="size-3.5 text-[#00753A]" />
            <span>{isAr ? 'المسار الإجرائي والذكاء الاصطناعي' : 'Cycle Procédural & Intelligence Artificielle'}</span>
          </div>

          <div className="inline-block px-5 sm:px-7 py-2 rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'مراحل الصفقة العمومية' : 'Étapes du Marché Public'}
            </h2>
          </div>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium">
            {isAr
              ? 'مرافقة ذكية وشاملة عبر المراحل العشر للصفقة وفق القانون 23-12، لتعزيز النزاهة والسرعة.'
              : 'Accompagnement intelligent des 10 étapes légales selon la Loi 23-12, alliant probité et efficacité.'}
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            عرض سطح المكتب / الأجهزة اللوحية الكبيرة: خط زمني في صفّين (2 Rows Timeline)
            الصف الأول: مراحل 1 إلى 5 (أخضر #00753A)
            الصف الثاني: مراحل 6 إلى 10 (أحمر #D21034)
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block space-y-8">
          
          {/* ────── الصف الأول: المراحل 1 إلى 5 (الأخضر السيادي #00753A) ────── */}
          <div className="relative">
            {/* عنوان فرعي لمجموعة التحضير والإشهار */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#00753A]" />
                <span className="text-xs font-bold text-[#00753A] tracking-wider uppercase">
                  {isAr ? 'المرحلة التحضيرية والإشهار (المراحل 1 - 5)' : 'Phase Préparatoire & Avis (Étapes 1 - 5)'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                {isAr ? 'القانون 23-12 • المواد 16 إلى 43' : 'Loi 23-12 • Articles 16 à 43'}
              </span>
            </div>

            {/* شبكة البطاقات الخمس للصف الأول مع الأسهم البينية */}
            <div className="grid grid-cols-5 gap-3 xl:gap-4 relative items-stretch">
              {row1.map((stage, idx) => {
                const IconComponent = stage.icon;
                const isHovered = activeStage === stage.id;
                const isLastInRow = idx === row1.length - 1;

                return (
                  <div
                    key={stage.id}
                    className="relative flex flex-col"
                    onMouseEnter={() => setActiveStage(stage.id)}
                    onMouseLeave={() => setActiveStage(null)}
                  >
                    {/* البطاقة الزجاجية الشفافة الأنيقة */}
                    <div
                      className={`group relative h-full flex flex-col justify-between rounded-2xl p-4 sm:p-5 transition-all duration-300 border backdrop-blur-xl ${
                        isHovered
                          ? 'bg-white/95 border-[#00753A] shadow-xl -translate-y-1.5 ring-2 ring-[#00753A]/20'
                          : 'bg-white/80 border-slate-200/90 shadow-sm hover:border-[#00753A]/60'
                      }`}
                    >
                      {/* الشريط العلوي الدقيق الملون بالأخضر #00753A */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-[#00753A] rounded-t-2xl" />

                      {/* رأس البطاقة: رقم المرحلة + وسم AI + الأيقونة */}
                      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                        {/* 1. رقم المرحلة */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-[#00753A] px-2 py-0.5 rounded-md bg-[#00753A]/10 border border-[#00753A]/20">
                            {stage.num}
                          </span>
                        </div>

                        {/* أيقونة الذكاء الاصطناعي مع شعار AI */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#00753A]">
                          <Sparkles className="size-3 text-[#00753A]" />
                          <span className="font-mono text-[10px] font-extrabold tracking-wide">AI</span>
                        </div>
                      </div>

                      {/* جسم البطاقة الأساسي (العناصر الثلاثة المطلوبة حصراً) */}
                      <div className="space-y-2 flex-1">
                        {/* 2. عنوان المرحلة */}
                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#00753A] transition-colors line-clamp-1">
                          {stage.title}
                        </h3>

                        {/* 3. دور الذكاء الاصطناعي في سطر واحد */}
                        <p className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">
                          {stage.aiRole}
                        </p>
                      </div>

                      {/* وصف إضافي قصير يظهر بسلاسة عند التمرير (Hover Reveal Effect) */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isHovered ? 'max-h-24 opacity-100 pt-2.5 mt-2.5 border-t border-emerald-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                          {stage.hoverDetail}
                        </p>
                      </div>

                      {/* أيقونة المرحلة الجانبية الشفافة بالخلفية */}
                      <div className="absolute bottom-2.5 left-2.5 rtl:left-auto rtl:left-2.5 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <IconComponent className="size-7 text-[#00753A]" />
                      </div>
                    </div>

                    {/* سهم الربط بين البطاقات (في الاتجاه الطبيعي لـ RTL: من اليمين لليسار) */}
                    {!isLastInRow && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden xl:flex items-center justify-center size-6 rounded-full bg-white border border-[#00753A]/30 shadow-xs ${
                          isAr ? '-left-3' : '-right-3'
                        }`}
                        aria-hidden="true"
                      >
                        {isAr ? (
                          <ArrowLeft className="size-3.5 text-[#00753A]" />
                        ) : (
                          <ArrowRight className="size-3.5 text-[#00753A]" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* سهم الانتقال المنحني من نهاية الصف الأول إلى بداية الصف الثاني */}
            <div className="flex items-center justify-end px-6 my-2 text-slate-400">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                <span>{isAr ? 'الانتقال إلى مرحلة فتح العروض والتقييم' : 'Passage à la phase d’ouverture et évaluation'}</span>
                {isAr ? (
                  <CornerDownLeft className="size-4 text-[#D21034]" />
                ) : (
                  <CornerDownRight className="size-4 text-[#D21034]" />
                )}
              </div>
            </div>
          </div>

          {/* ────── الصف الثاني: المراحل 6 إلى 10 (الأحمر السيادي #D21034) ────── */}
          <div className="relative">
            {/* عنوان فرعي لمجموعة استلام العروض والتقييم والإسناد */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#D21034]" />
                <span className="text-xs font-bold text-[#D21034] tracking-wider uppercase">
                  {isAr ? 'مرحلة العروض والتقييم والإسناد (المراحل 6 - 10)' : 'Phase Offres & Attribution (Étapes 6 - 10)'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                {isAr ? 'القانون 23-12 • المواد 48 إلى 82' : 'Loi 23-12 • Articles 48 à 82'}
              </span>
            </div>

            {/* شبكة البطاقات الخمس للصف الثاني مع الأسهم البينية */}
            <div className="grid grid-cols-5 gap-3 xl:gap-4 relative items-stretch">
              {row2.map((stage, idx) => {
                const IconComponent = stage.icon;
                const isHovered = activeStage === stage.id;
                const isLastInRow = idx === row2.length - 1;

                return (
                  <div
                    key={stage.id}
                    className="relative flex flex-col"
                    onMouseEnter={() => setActiveStage(stage.id)}
                    onMouseLeave={() => setActiveStage(null)}
                  >
                    {/* البطاقة الزجاجية الشفافة الأنيقة */}
                    <div
                      className={`group relative h-full flex flex-col justify-between rounded-2xl p-4 sm:p-5 transition-all duration-300 border backdrop-blur-xl ${
                        isHovered
                          ? 'bg-white/95 border-[#D21034] shadow-xl -translate-y-1.5 ring-2 ring-[#D21034]/20'
                          : 'bg-white/80 border-slate-200/90 shadow-sm hover:border-[#D21034]/60'
                      }`}
                    >
                      {/* الشريط العلوي الدقيق الملون بالأحمر #D21034 */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-[#D21034] rounded-t-2xl" />

                      {/* رأس البطاقة: رقم المرحلة + وسم AI + الأيقونة */}
                      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                        {/* 1. رقم المرحلة */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-[#D21034] px-2 py-0.5 rounded-md bg-[#D21034]/10 border border-[#D21034]/20">
                            {stage.num}
                          </span>
                        </div>

                        {/* أيقونة الذكاء الاصطناعي مع شعار AI */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-[#D21034]">
                          <Sparkles className="size-3 text-[#D21034]" />
                          <span className="font-mono text-[10px] font-extrabold tracking-wide">AI</span>
                        </div>
                      </div>

                      {/* جسم البطاقة الأساسي (العناصر الثلاثة المطلوبة حصراً) */}
                      <div className="space-y-2 flex-1">
                        {/* 2. عنوان المرحلة */}
                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#D21034] transition-colors line-clamp-1">
                          {stage.title}
                        </h3>

                        {/* 3. دور الذكاء الاصطناعي في سطر واحد */}
                        <p className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">
                          {stage.aiRole}
                        </p>
                      </div>

                      {/* وصف إضافي قصير يظهر بسلاسة عند التمرير (Hover Reveal Effect) */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isHovered ? 'max-h-24 opacity-100 pt-2.5 mt-2.5 border-t border-rose-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                          {stage.hoverDetail}
                        </p>
                      </div>

                      {/* أيقونة المرحلة الجانبية الشفافة بالخلفية */}
                      <div className="absolute bottom-2.5 left-2.5 rtl:left-auto rtl:left-2.5 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <IconComponent className="size-7 text-[#D21034]" />
                      </div>
                    </div>

                    {/* سهم الربط بين البطاقات (في الاتجاه الطبيعي لـ RTL: من اليمين لليسار) */}
                    {!isLastInRow && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden xl:flex items-center justify-center size-6 rounded-full bg-white border border-[#D21034]/30 shadow-xs ${
                          isAr ? '-left-3' : '-right-3'
                        }`}
                        aria-hidden="true"
                      >
                        {isAr ? (
                          <ArrowLeft className="size-3.5 text-[#D21034]" />
                        ) : (
                          <ArrowRight className="size-3.5 text-[#D21034]" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            عرض الهاتف والأجهزة المحمولة: بطاقات عمودية متجاوبة ومتسلسلة
            (Mobile Stacked Timeline with Vertical Progression)
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="block lg:hidden space-y-4">
          {stages.map((stage, idx) => {
            const IconComponent = stage.icon;
            const isGreenGroup = stage.group === 'prep';
            const themeColor = isGreenGroup ? '#00753A' : '#D21034';
            const isLast = idx === stages.length - 1;

            return (
              <div key={stage.id} className="relative flex flex-col items-center">
                {/* البطاقة الزجاجية للهاتف */}
                <div
                  className="w-full relative rounded-2xl p-5 border border-slate-200/90 bg-white/90 backdrop-blur-xl shadow-xs transition-shadow active:shadow-md"
                >
                  {/* شريط علوي ملون */}
                  <div
                    className="absolute top-0 inset-x-0 h-1 rounded-t-2xl"
                    style={{ backgroundColor: themeColor }}
                  />

                  {/* رأس البطاقة */}
                  <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                    {/* 1. رقم المرحلة */}
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-sm font-black px-2 py-0.5 rounded-md"
                        style={{
                          color: themeColor,
                          backgroundColor: `${themeColor}15`,
                          borderColor: `${themeColor}30`,
                        }}
                      >
                        {stage.num}
                      </span>
                      {/* 2. عنوان المرحلة */}
                      <h3 className="text-base font-black text-slate-900">
                        {stage.title}
                      </h3>
                    </div>

                    {/* أيقونة ووسم AI */}
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
                      style={{
                        color: themeColor,
                        backgroundColor: `${themeColor}10`,
                        borderColor: `${themeColor}25`,
                      }}
                    >
                      <Sparkles className="size-3" style={{ color: themeColor }} />
                      <span className="font-mono text-[10px] font-extrabold">AI</span>
                    </div>
                  </div>

                  {/* 3. دور الذكاء الاصطناعي في سطر واحد */}
                  <p className="text-xs font-semibold text-slate-700 leading-snug mt-1">
                    {stage.aiRole}
                  </p>

                  {/* وصف تفصيلي على الهاتف لتوضيح القيمة */}
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-100">
                    {stage.hoverDetail}
                  </p>
                </div>

                {/* سهم عمودي يصل بين كل بطاقة والتي تليها على الهاتف */}
                {!isLast && (
                  <div className="py-1 flex items-center justify-center text-slate-300">
                    <ArrowDown className="size-4" style={{ color: themeColor }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            العبارة الإلزامية في أسفل القسم:
            «الذكاء الاصطناعي يدعم القرار، والإنسان يبقى مسؤولًا عن القرار النهائي.»
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="mt-12 sm:mt-16 flex items-center justify-center">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-md text-center overflow-hidden">
            {/* شريط العلم الوطني العلوي المزدوج */}
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="w-1/2 bg-[#00753A]" />
              <div className="w-1/2 bg-[#D21034]" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <div className="size-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="size-5 text-[#00753A]" />
              </div>

              <div className="text-center sm:text-start">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-0.5">
                  {isAr ? 'المبدأ السيادي الحاكم للمنظومة' : 'Principe Souverain Directeur'}
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {isAr
                    ? 'الذكاء الاصطناعي يدعم القرار، والإنسان يبقى مسؤولًا عن القرار النهائي.'
                    : 'L’intelligence artificielle assiste la décision, l’humain demeure seul responsable de la décision finale.'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default V3LifecycleProcess;
