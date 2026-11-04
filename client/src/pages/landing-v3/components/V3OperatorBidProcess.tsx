import React, { useState } from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  CornerDownLeft,
  CornerDownRight,
  ShieldCheck,
  AlertTriangle,
  Megaphone,
  FileText,
  CheckCircle2,
  FolderArchive,
  PenTool,
  Calculator,
  Search,
  Lock,
} from 'lucide-react';

interface OperatorStageItem {
  id: number;
  num: string;
  stageName: string;
  title: string;
  aiRole: string;
  hoverDetail: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'green' | 'red'; // green = 1-4 (#00753A), red = 5-8 (#D21034)
  themeColor: string;
  arrowColor: string;
}

export const V3OperatorBidProcess: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [activeStage, setActiveStage] = useState<number | null>(null);

  // المراحل الثمانية لتحضير العرض للمتعامل الاقتصادي بدعم الذكاء الاصطناعي
  const stages: OperatorStageItem[] = [
    // ══════════════════════════════════════════════════════════════════════════
    // الصف الأول (المراحل 1 إلى 4): الأخضر السيادي #00753A
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 1,
      num: '1',
      stageName: isAr ? 'المرحلة 1: اكتشاف الصفقة' : 'Étape 1 : Découverte',
      title: isAr ? 'اكتشاف الفرصة' : 'Découverte de l’Opportunité',
      aiRole: isAr
        ? 'اقتراح الصفقات المطابقة لنشاط المتعامل.'
        : 'Proposition des marchés ciblés selon le profil.',
      hoverDetail: isAr
        ? 'مسح ذكي لآلاف الصفقات ومطابقتها الفورية مع رمز النشاط التجاري وتصنيف المؤسسة.'
        : 'Criblage intelligent des avis et ciblage direct selon le registre du commerce et la qualification.',
      icon: Megaphone,
      group: 'green',
      themeColor: '#00753A',
      arrowColor: '#00753A',
    },
    {
      id: 2,
      num: '2',
      stageName: isAr ? 'المرحلة 2: قراءة دفتر الشروط' : 'Étape 2 : Cahier des Charges',
      title: isAr ? 'فهم المتطلبات' : 'Compréhension des Exigences',
      aiRole: isAr
        ? 'تلخيص دفتر الشروط واستخراج الوثائق والمواعيد.'
        : 'Synthèse du cahier des charges et échéancier.',
      hoverDetail: isAr
        ? 'استخراج آلي لبنود دفتر الشروط، جدول الوثائق الإلزامية، وآجال صلاحية العروض.'
        : 'Extraction automatique des clauses clés, de la liste des pièces et des délais légaux.',
      icon: FileText,
      group: 'green',
      themeColor: '#00753A',
      arrowColor: '#008544',
    },
    {
      id: 3,
      num: '3',
      stageName: isAr ? 'المرحلة 3: فحص الأهلية' : 'Étape 3 : Éligibilité',
      title: isAr ? 'التحقق من الأهلية' : 'Vérification de l’Éligibilité',
      aiRole: isAr
        ? 'مطابقة وثائق المتعامل مع شروط التأهيل.'
        : 'Conformité des pièces avec les critères requis.',
      hoverDetail: isAr
        ? 'مقارنة مسبقة بين قدرات المؤسسة وشروط التأهيل (رقم الأعمال، الوسائل، التصنيف) لتفادي الإقصاء.'
        : 'Audit préalable des capacités de l’entreprise face aux critères de qualification minimaux.',
      icon: CheckCircle2,
      group: 'green',
      themeColor: '#00753A',
      arrowColor: '#128f4c',
    },
    {
      id: 4,
      num: '4',
      stageName: isAr ? 'المرحلة 4: إعداد ملف الترشح' : 'Étape 4 : Candidature',
      title: isAr ? 'ملف الترشح' : 'Dossier de Candidature',
      aiRole: isAr
        ? 'تنظيم الوثائق والتنبيه إلى النواقص.'
        : 'Organisation des pièces et alerte des manques.',
      hoverDetail: isAr
        ? 'فحص سريان الشهادات الجبائية وشبه الجبائية والتحقق من صحة تصريح الترشح المعتمد.'
        : 'Vérification de la validité des attestations fiscales/sociales et contrôle de la déclaration.',
      icon: FolderArchive,
      group: 'green',
      themeColor: '#00753A',
      arrowColor: '#4f9450',
    },

    // ══════════════════════════════════════════════════════════════════════════
    // الصف الثاني (المراحل 5 إلى 8): الأحمر السيادي #D21034
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 5,
      num: '5',
      stageName: isAr ? 'المرحلة 5: إعداد العرض التقني' : 'Étape 5 : Offre Technique',
      title: isAr ? 'العرض التقني' : 'Offre Technique',
      aiRole: isAr
        ? 'اقتراح هيكل المذكرة التقنية وصياغة مسودة الحل.'
        : 'Structuration du mémoire technique et du projet.',
      hoverDetail: isAr
        ? 'صياغة مسودة المذكرة التقنية وتوزيع الوسائل البشرية والمادية والجدول الزمني للإنجاز.'
        : 'Génération de la trame du mémoire technique et ordonnancement des moyens mobilisés.',
      icon: PenTool,
      group: 'red',
      themeColor: '#D21034',
      arrowColor: '#c41f39',
    },
    {
      id: 6,
      num: '6',
      stageName: isAr ? 'المرحلة 6: إعداد العرض المالي' : 'Étape 6 : Offre Financière',
      title: isAr ? 'العرض المالي' : 'Offre Financière',
      aiRole: isAr
        ? 'حساب التكاليف واقتراح تسعير تنافسي.'
        : 'Calcul des coûts et tarification compétitive.',
      hoverDetail: isAr
        ? 'تدقيق جدول الأسعار الأحادية والتفصيل التقديري ومقارنة هوامش التكلفة لضمان التنافسية والجدوى.'
        : 'Vérification du BPU, du DQE et analyse des marges pour une soumission compétitive et viable.',
      icon: Calculator,
      group: 'red',
      themeColor: '#D21034',
      arrowColor: '#cb1734',
    },
    {
      id: 7,
      num: '7',
      stageName: isAr ? 'المرحلة 7: مراجعة العرض' : 'Étape 7 : Audit de Qualité',
      title: isAr ? 'مراجعة الجودة' : 'Contrôle de Conformité',
      aiRole: isAr
        ? 'كشف الأخطاء والتناقضات والتحقق من اكتمال الملف.'
        : 'Détection des incohérences et contrôle final.',
      hoverDetail: isAr
        ? 'تدقيق تقاطعي شامل بين العرض التقني والمالي والتأكد من مطابقة جميع التوقيعات والأختام.'
        : 'Audit croisé exhaustif entre offres technique et financière pour éliminer tout motif de rejet.',
      icon: Search,
      group: 'red',
      themeColor: '#D21034',
      arrowColor: '#D21034',
    },
    {
      id: 8,
      num: '8',
      stageName: isAr ? 'المرحلة 8: إيداع العرض' : 'Étape 8 : Dépôt Sécurisé',
      title: isAr ? 'الإيداع الآمن' : 'Dépôt Sécurisé',
      aiRole: isAr
        ? 'تنبيه المتعامل إلى الموعد النهائي والتحقق من الاكتمال.'
        : 'Alerte sur les délais et scellement souverain.',
      hoverDetail: isAr
        ? 'قفل وتشفير الأظرفة إلكترونياً بمعيار سيادي AES-256 وإصدار وصل سحب فوري معتمد قانوناً.'
        : 'Chiffrement souverain AES-256 des plis et génération instantanée du récépissé légal de dépôt.',
      icon: Lock,
      group: 'red',
      themeColor: '#D21034',
      arrowColor: '#D21034',
    },
  ];

  // في سطح المكتب، الصف الأول يحتوي المراحل 1 إلى 4
  const row1 = stages.slice(0, 4);

  // الصف الثاني في الخط الزمني المتعرج (Serpentine Zigzag):
  // في العرض العربي (RTL): التدفق يبدأ من المرحلة 1 (يمين) إلى 4 (يسار)،
  // ثم ينعطف يساراً للأسفل نحو المرحلة 5 (يسار)، ويتدفق يميناً 5 -> 6 -> 7 -> 8 (يمين).
  // لذلك في شبكة RTL الرباعية (حيث العمود الأول على اليمين):
  // نضع [8, 7, 6, 5] لتظهر 5 في أقصى اليسار تحت 4 مباشرة، و 8 في أقصى اليمين تحت 1.
  const row2Serpentine = isAr ? [stages[7], stages[6], stages[5], stages[4]] : stages.slice(4, 8);

  return (
    <section
      id="bid-prep"
      dir={dir}
      className="w-full bg-[#FFFFFF] py-14 sm:py-20 overflow-hidden"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* ══════════════════════════════════════════════════════════════════════
            ترويسة القسم: إطار بسيط يحيط بالعنوان الرئيسي مع خلفية بيضاء ناصعة
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center justify-center text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-[#00753A] text-xs sm:text-sm font-bold shadow-2xs mb-3">
            <Sparkles className="size-3.5 text-[#00753A]" />
            <span>{isAr ? 'بوابة المتعامل الاقتصادي والذكاء الاصطناعي' : 'Portail Opérateur Économique & IA'}</span>
          </div>

          {/* إطار العنوان البسيط والأنيق */}
          <div className="inline-block px-6 sm:px-9 py-3 rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'مراحل تحضير العرض للمتعامل' : 'Étapes de Préparation de l’Offre Opérateur'}
            </h2>
            <span className="block mt-1 text-sm sm:text-base font-bold text-[#00753A]">
              {isAr ? 'بدعم الذكاء الاصطناعي' : 'Assisté par l’Intelligence Artificielle'}
            </span>
          </div>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium">
            {isAr
              ? 'مسار ذكي من 8 مراحل يبسط إعداد العروض، يضمن الامتثال لدفتر الشروط، ويرفع فرص الفوز بالصفقة.'
              : 'Un parcours intelligent en 8 étapes pour simplifier la préparation de vos offres, garantir la conformité et maximiser vos chances.'}
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            عرض سطح المكتب: خط زمني أفقي متعرج (Horizontal Serpentine Zigzag)
            الصف الأول: 4 مراحل (1 إلى 4) بالأخضر #00753A
            منعطف ربط انسيابي متدرج من الأخضر إلى الأحمر في أقصى اليسار
            الصف الثاني: 4 مراحل (5 إلى 8) بالأحمر #D21034
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block space-y-6">

          {/* ────── الصف الأول: المراحل 1 إلى 4 (الأخضر #00753A) ────── */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#00753A]" />
                <span className="text-xs font-bold text-[#00753A] tracking-wider uppercase">
                  {isAr ? 'المرحلة 1 إلى 4: الاكتشاف، الفهم والترشح (اللون الأخضر السيادي)' : 'Étapes 1 à 4 : Découverte et Candidature (Vert Souverain)'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#00753A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {isAr ? '1. الفرصة • 2. الشروط • 3. الأهلية • 4. الترشح' : '1. Opportunité • 2. Cahier • 3. Éligibilité • 4. Candidature'}
              </span>
            </div>

            {/* شبكة البطاقات الأربع للصف الأول (من اليمين لليسار في RTL) */}
            <div className="grid grid-cols-4 gap-4 xl:gap-5 relative items-stretch">
              {row1.map((stage, idx) => {
                const IconComponent = stage.icon;
                const isHovered = activeStage === stage.id;
                const isLastInRow = idx === row1.length - 1; // المرحلة 4 في نهاية الصف

                return (
                  <div
                    key={stage.id}
                    className="relative flex flex-col"
                    onMouseEnter={() => setActiveStage(stage.id)}
                    onMouseLeave={() => setActiveStage(null)}
                  >
                    {/* البطاقة الزجاجية الشفافة الأنيقة */}
                    <div
                      className={`group relative h-full flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 border backdrop-blur-xl ${
                        isHovered
                          ? 'bg-white/95 border-[#00753A] shadow-xl -translate-y-2 ring-2 ring-[#00753A]/20'
                          : 'bg-white/70 border-[#00753A]/30 shadow-xs hover:border-[#00753A]'
                      }`}
                    >
                      {/* الشريط العلوي الأخضر الرفيع */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-[#00753A] rounded-t-2xl" />

                      {/* رأس البطاقة: رقم المرحلة داخل دائرة خضراء + أيقونة المرحلة + أيقونة AI */}
                      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                        {/* 1. رقم المرحلة داخل دائرة */}
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-full bg-emerald-50 border-2 border-[#00753A] text-[#00753A] flex items-center justify-center font-mono font-black text-sm shadow-2xs">
                            {stage.num}
                          </div>
                          {/* أيقونة المرحلة المحددة */}
                          <div className="size-8 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-center text-[#00753A]">
                            <IconComponent className="size-4" />
                          </div>
                        </div>

                        {/* أيقونة الذكاء الاصطناعي مع شعار AI */}
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-[#00753A]">
                          <Sparkles className="size-3 text-[#00753A]" />
                          <span className="font-mono text-[10px] font-extrabold tracking-wide">AI</span>
                        </div>
                      </div>

                      {/* جسم البطاقة: 2. عنوان المرحلة + 3. دور الذكاء الاصطناعي في سطر واحد */}
                      <div className="space-y-1.5 flex-1">
                        <div className="text-[11px] font-bold text-[#00753A]/80 tracking-wide">
                          {stage.stageName}
                        </div>
                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#00753A] transition-colors line-clamp-1">
                          {stage.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">
                          {stage.aiRole}
                        </p>
                      </div>

                      {/* وصف إضافي قصير يظهر عند التمرير */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isHovered ? 'max-h-24 opacity-100 pt-2.5 mt-2.5 border-t border-emerald-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                          {stage.hoverDetail}
                        </p>
                      </div>

                      {/* أيقونة شفافة في زاوية البطاقة */}
                      <div className="absolute bottom-3 left-3 rtl:left-auto rtl:left-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <IconComponent className="size-7 text-[#00753A]" />
                      </div>
                    </div>

                    {/* سهم متدرج بين البطاقات في الصف الأول (من اليمين لليسار في RTL) */}
                    {!isLastInRow && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden xl:flex items-center justify-center size-7 rounded-full bg-white border shadow-xs ${
                          isAr ? '-left-3.5' : '-right-3.5'
                        }`}
                        style={{ borderColor: stage.arrowColor }}
                        aria-hidden="true"
                      >
                        {isAr ? (
                          <ArrowLeft className="size-3.5" style={{ color: stage.arrowColor }} />
                        ) : (
                          <ArrowRight className="size-3.5" style={{ color: stage.arrowColor }} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ────── منعطف الربط المتعرج الانسيابي بين الصف الأول والثاني (تدرج أخضر -> أحمر) ────── */}
          <div className="relative py-1 flex items-center justify-start px-2">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-linear-to-r from-emerald-50 via-white to-rose-50 border border-slate-200/90 shadow-2xs">
              <div className="size-6 rounded-full bg-linear-to-b from-[#00753A] to-[#D21034] text-white flex items-center justify-center shadow-xs">
                {isAr ? (
                  <CornerDownRight className="size-3.5" />
                ) : (
                  <CornerDownLeft className="size-3.5" />
                )}
              </div>
              <span className="text-xs font-bold text-slate-700">
                {isAr
                  ? 'منعطف المسار المتعرج: الانتقال المباشر من ملف الترشح (4) إلى إعداد العرض التقني (5)'
                  : 'Connexion en zigzag : Passage direct de la candidature (4) à l’offre technique (5)'}
              </span>
            </div>
          </div>

          {/* ────── الصف الثاني: المراحل 5 إلى 8 (الأحمر #D21034) ────── */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#D21034]" />
                <span className="text-xs font-bold text-[#D21034] tracking-wider uppercase">
                  {isAr ? 'المرحلة 5 إلى 8: العروض، التدقيق والإيداع الآمن (اللون الأحمر السيادي)' : 'Étapes 5 à 8 : Offres, Qualité et Dépôt (Rouge Souverain)'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#D21034] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                {isAr ? '5. التقني • 6. المالي • 7. مراجعة الجودة • 8. الإيداع الآمن' : '5. Technique • 6. Financier • 7. Qualité • 8. Dépôt Sécurisé'}
              </span>
            </div>

            {/* شبكة البطاقات الأربع للصف الثاني في المسار المتعرج */}
            <div className="grid grid-cols-4 gap-4 xl:gap-5 relative items-stretch">
              {row2Serpentine.map((stage, idx) => {
                const IconComponent = stage.icon;
                const isHovered = activeStage === stage.id;
                // في RTL المسار يسير من اليسار (المرحلة 5) نحو اليمين (المرحلة 8)
                // لذلك السهم يربط نحو اليمين حتى المرحلة 8
                const isEndStage = isAr ? stage.id === 8 : stage.id === 8;

                return (
                  <div
                    key={stage.id}
                    className="relative flex flex-col"
                    onMouseEnter={() => setActiveStage(stage.id)}
                    onMouseLeave={() => setActiveStage(null)}
                  >
                    {/* البطاقة الزجاجية الشفافة الأنيقة */}
                    <div
                      className={`group relative h-full flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 border backdrop-blur-xl ${
                        isHovered
                          ? 'bg-white/95 border-[#D21034] shadow-xl -translate-y-2 ring-2 ring-[#D21034]/20'
                          : 'bg-white/70 border-[#D21034]/30 shadow-xs hover:border-[#D21034]'
                      }`}
                    >
                      {/* الشريط العلوي الأحمر الرفيع */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-[#D21034] rounded-t-2xl" />

                      {/* رأس البطاقة: رقم المرحلة داخل دائرة حمراء + أيقونة المرحلة + أيقونة AI */}
                      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                        {/* 1. رقم المرحلة داخل دائرة */}
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-full bg-rose-50 border-2 border-[#D21034] text-[#D21034] flex items-center justify-center font-mono font-black text-sm shadow-2xs">
                            {stage.num}
                          </div>
                          {/* أيقونة المرحلة المحددة */}
                          <div className="size-8 rounded-xl bg-rose-50/80 border border-rose-200/80 flex items-center justify-center text-[#D21034]">
                            <IconComponent className="size-4" />
                          </div>
                        </div>

                        {/* أيقونة الذكاء الاصطناعي مع شعار AI */}
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/90 text-[#D21034]">
                          <Sparkles className="size-3 text-[#D21034]" />
                          <span className="font-mono text-[10px] font-extrabold tracking-wide">AI</span>
                        </div>
                      </div>

                      {/* جسم البطاقة: 2. عنوان المرحلة + 3. دور الذكاء الاصطناعي في سطر واحد */}
                      <div className="space-y-1.5 flex-1">
                        <div className="text-[11px] font-bold text-[#D21034]/80 tracking-wide">
                          {stage.stageName}
                        </div>
                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#D21034] transition-colors line-clamp-1">
                          {stage.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2">
                          {stage.aiRole}
                        </p>
                      </div>

                      {/* وصف إضافي قصير يظهر عند التمرير */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isHovered ? 'max-h-24 opacity-100 pt-2.5 mt-2.5 border-t border-rose-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                          {stage.hoverDetail}
                        </p>
                      </div>

                      {/* أيقونة شفافة في زاوية البطاقة */}
                      <div className="absolute bottom-3 left-3 rtl:left-auto rtl:left-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <IconComponent className="size-7 text-[#D21034]" />
                      </div>
                    </div>

                    {/* سهم متدرج في الصف الثاني يوجه التدفق المتعرج نحو اليمين في RTL */}
                    {!isEndStage && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden xl:flex items-center justify-center size-7 rounded-full bg-white border shadow-xs ${
                          isAr ? '-right-3.5' : '-left-3.5'
                        }`}
                        style={{ borderColor: stage.arrowColor }}
                        aria-hidden="true"
                      >
                        {isAr ? (
                          <ArrowRight className="size-3.5" style={{ color: stage.arrowColor }} />
                        ) : (
                          <ArrowLeft className="size-3.5" style={{ color: stage.arrowColor }} />
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
            عرض الهاتف: خط زمني عمودي متتابع ومترابط بأسهم متدرجة
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="block lg:hidden space-y-4">
          {stages.map((stage, idx) => {
            const IconComponent = stage.icon;
            const isGreen = stage.group === 'green';
            const themeColor = stage.themeColor;
            const isLast = idx === stages.length - 1;

            return (
              <div key={stage.id} className="relative flex flex-col items-center">
                {/* البطاقة الزجاجية الشفافة للهاتف */}
                <div className="w-full relative rounded-2xl p-5 border border-slate-200/90 bg-white/80 backdrop-blur-xl shadow-xs transition-shadow active:shadow-md">
                  {/* شريط علوي ملون */}
                  <div
                    className="absolute top-0 inset-x-0 h-1 rounded-t-2xl"
                    style={{ backgroundColor: themeColor }}
                  />

                  {/* رأس البطاقة */}
                  <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                    <div className="flex items-center gap-3">
                      {/* 1. رقم المرحلة داخل دائرة */}
                      <div
                        className="size-8 rounded-full flex items-center justify-center font-mono font-black text-xs border-2 shadow-2xs"
                        style={{
                          color: themeColor,
                          backgroundColor: `${themeColor}15`,
                          borderColor: themeColor,
                        }}
                      >
                        {stage.num}
                      </div>

                      {/* 2. عنوان المرحلة */}
                      <div>
                        <span className="text-[10px] font-bold block" style={{ color: themeColor }}>
                          {stage.stageName}
                        </span>
                        <h3 className="text-base font-black text-slate-900 leading-tight">
                          {stage.title}
                        </h3>
                      </div>
                    </div>

                    {/* أيقونة ووسم AI */}
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
                      style={{
                        color: themeColor,
                        backgroundColor: `${themeColor}10`,
                        borderColor: `${themeColor}30`,
                      }}
                    >
                      <Sparkles className="size-3" style={{ color: themeColor }} />
                      <span className="font-mono text-[10px] font-extrabold">AI</span>
                    </div>
                  </div>

                  {/* 3. دور الذكاء الاصطناعي في سطر واحد */}
                  <p className="text-xs font-semibold text-slate-700 leading-snug">
                    {stage.aiRole}
                  </p>

                  {/* تفاصيل إضافية واضحة على الهاتف */}
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-100">
                    {stage.hoverDetail}
                  </p>
                </div>

                {/* سهم عمودي يصل بين البطاقات بتدرج لوني */}
                {!isLast && (
                  <div className="py-1 flex items-center justify-center">
                    <ArrowDown
                      className="size-4"
                      style={{ color: stage.arrowColor }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            أسفل القسم: العبارة الإلزامية + التنبيه الصغير + زر التحضير
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="mt-12 sm:mt-16 flex flex-col items-center justify-center gap-6">

          {/* العبارة الإلزامية في بطاقة زجاجية سيادية */}
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-md text-center overflow-hidden">
            {/* شريط العلم الوطني العلوي المزدوج */}
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="w-1/2 bg-[#00753A]" />
              <div className="w-1/2 bg-[#D21034]" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <div className="size-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="size-6 text-[#00753A]" />
              </div>

              <div className="text-center sm:text-start">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-0.5">
                  {isAr ? 'مبدأ المرافقة الذكية والمسؤولية الإنسانية' : 'Principe d’Assistance et Responsabilité'}
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {isAr
                    ? 'الذكاء الاصطناعي يساعد في التحضير، والمتعامل يتحقق ويقرر.'
                    : 'L’intelligence artificielle assiste la préparation, l’opérateur vérifie et décide.'}
                </p>
              </div>
            </div>
          </div>

          {/* التنبيه الصغير القانوني */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs sm:text-sm font-semibold shadow-2xs">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>
              {isAr
                ? 'يجب مراجعة جميع المعلومات والوثائق قبل الإيداع النهائي.'
                : 'Toutes les informations et pièces doivent être scrupuleusement vérifiées avant le dépôt final.'}
            </span>
          </div>

          {/* زر اتخاذ الإجراء (CTA): ابدأ تحضير عرضك */}
          <div className="pt-2">
            <Link
              href="/register/operator"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base text-white bg-[#00753A] hover:bg-[#005e2e] active:scale-[0.99] transition-all shadow-md hover:shadow-lg focus:outline-hidden focus:ring-3 focus:ring-[#00753A]/30"
            >
              <span>{isAr ? 'ابدأ تحضير عرضك' : 'Commencez à Préparer Votre Offre'}</span>
              {isAr ? (
                <ArrowLeft className="size-5" />
              ) : (
                <ArrowRight className="size-5" />
              )}
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};

export default V3OperatorBidProcess;
