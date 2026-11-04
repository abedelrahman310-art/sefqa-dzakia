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
    },
  ];

  const row1 = stages.slice(0, 4); // مراحل 1 إلى 4 (أخضر)
  const row2 = stages.slice(4, 8); // مراحل 5 إلى 8 (أحمر)

  return (
    <section
      id="bid-prep"
      dir={dir}
      className="w-full bg-[#FFFFFF] py-14 sm:py-20 overflow-hidden"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* ══════════════════════════════════════════════════════════════════════
            ترويسة القسم: إطار بسيط يحيط بالعنوان الرئيسي مع خلفية بيضاء
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
            عرض سطح المكتب: خط زمني أفقي متعرج (Zigzag Timeline)
            الصف الأول: 4 مراحل (1 إلى 4) بالأخضر #00753A
            الصف الثاني: 4 مراحل (5 إلى 8) بالأحمر #D21034
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block space-y-8">

          {/* ────── الصف الأول: المراحل 1 إلى 4 (الأخضر #00753A) ────── */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#00753A]" />
                <span className="text-xs font-bold text-[#00753A] tracking-wider uppercase">
                  {isAr ? 'مرحلة الاكتشاف والتأهيل (المراحل 1 - 4)' : 'Phase Découverte & Éligibilité (Étapes 1 - 4)'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#00753A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {isAr ? 'الفرصة • الشروط • الأهلية • الترشح' : 'Opportunité • Cahier • Éligibilité • Candidature'}
              </span>
            </div>

            {/* شبكة البطاقات الأربع للصف الأول */}
            <div className="grid grid-cols-4 gap-4 xl:gap-5 relative items-stretch">
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
                      className={`group relative h-full flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 border backdrop-blur-xl ${
                        isHovered
                          ? 'bg-white/95 border-[#00753A] shadow-xl -translate-y-1.5 ring-2 ring-[#00753A]/20'
                          : 'bg-white/70 border-[#00753A]/30 shadow-xs hover:border-[#00753A]'
                      }`}
                    >
                      {/* الشريط العلوي الأخضر الرفيع */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-[#00753A] rounded-t-2xl" />

                      {/* رأس البطاقة: رقم المرحلة داخل دائرة خضراء + أيقونة AI */}
                      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                        {/* 1. رقم المرحلة داخل دائرة */}
                        <div className="size-9 rounded-full bg-[#00753A]/10 border-2 border-[#00753A] text-[#00753A] flex items-center justify-center font-mono font-black text-sm shadow-2xs">
                          {stage.num}
                        </div>

                        {/* أيقونة الذكاء الاصطناعي مع شعار AI */}
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-[#00753A]">
                          <Sparkles className="size-3 text-[#00753A]" />
                          <span className="font-mono text-[10px] font-extrabold tracking-wide">AI</span>
                        </div>
                      </div>

                      {/* جسم البطاقة: 2. عنوان المرحلة + 3. دور الذكاء الاصطناعي في سطر واحد */}
                      <div className="space-y-2 flex-1">
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

                      {/* الأيقونة المحددة لكل مرحلة في زاوية البطاقة */}
                      <div className="absolute bottom-3 left-3 rtl:left-auto rtl:left-3 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
                        <IconComponent className="size-8 text-[#00753A]" />
                      </div>
                    </div>

                    {/* سهم متدرج بين البطاقات */}
                    {!isLastInRow && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden xl:flex items-center justify-center size-7 rounded-full bg-white border border-[#00753A]/40 shadow-xs ${
                          isAr ? '-left-3.5' : '-right-3.5'
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

            {/* سهم الانتقال المتعرج المنحني من الصف الأول إلى الصف الثاني (تدرج من الأخضر إلى الأحمر) */}
            <div className="flex items-center justify-end px-6 my-3 text-slate-400">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-linear-to-r from-emerald-50 via-slate-50 to-rose-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                <span>{isAr ? 'الانتقال إلى إعداد العروض الفنية والمالية والإيداع' : 'Passage aux offres technique, financière et dépôt'}</span>
                {isAr ? (
                  <CornerDownLeft className="size-4 text-[#D21034]" />
                ) : (
                  <CornerDownRight className="size-4 text-[#D21034]" />
                )}
              </div>
            </div>
          </div>

          {/* ────── الصف الثاني: المراحل 5 إلى 8 (الأحمر #D21034) ────── */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#D21034]" />
                <span className="text-xs font-bold text-[#D21034] tracking-wider uppercase">
                  {isAr ? 'مرحلة إعداد العروض والإيداع (المراحل 5 - 8)' : 'Phase Offres & Soumission (Étapes 5 - 8)'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#D21034] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                {isAr ? 'التقني • المالي • مراجعة الجودة • الإيداع المشفر' : 'Technique • Financier • Qualité • Dépôt Chiffré'}
              </span>
            </div>

            {/* شبكة البطاقات الأربع للصف الثاني */}
            <div className="grid grid-cols-4 gap-4 xl:gap-5 relative items-stretch">
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
                      className={`group relative h-full flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 border backdrop-blur-xl ${
                        isHovered
                          ? 'bg-white/95 border-[#D21034] shadow-xl -translate-y-1.5 ring-2 ring-[#D21034]/20'
                          : 'bg-white/70 border-[#D21034]/30 shadow-xs hover:border-[#D21034]'
                      }`}
                    >
                      {/* الشريط العلوي الأحمر الرفيع */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-[#D21034] rounded-t-2xl" />

                      {/* رأس البطاقة: رقم المرحلة داخل دائرة حمراء + أيقونة AI */}
                      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                        {/* 1. رقم المرحلة داخل دائرة */}
                        <div className="size-9 rounded-full bg-[#D21034]/10 border-2 border-[#D21034] text-[#D21034] flex items-center justify-center font-mono font-black text-sm shadow-2xs">
                          {stage.num}
                        </div>

                        {/* أيقونة الذكاء الاصطناعي مع شعار AI */}
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/90 text-[#D21034]">
                          <Sparkles className="size-3 text-[#D21034]" />
                          <span className="font-mono text-[10px] font-extrabold tracking-wide">AI</span>
                        </div>
                      </div>

                      {/* جسم البطاقة: 2. عنوان المرحلة + 3. دور الذكاء الاصطناعي في سطر واحد */}
                      <div className="space-y-2 flex-1">
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

                      {/* الأيقونة المحددة لكل مرحلة في زاوية البطاقة */}
                      <div className="absolute bottom-3 left-3 rtl:left-auto rtl:left-3 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
                        <IconComponent className="size-8 text-[#D21034]" />
                      </div>
                    </div>

                    {/* سهم متدرج بين البطاقات */}
                    {!isLastInRow && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden xl:flex items-center justify-center size-7 rounded-full bg-white border border-[#D21034]/40 shadow-xs ${
                          isAr ? '-left-3.5' : '-right-3.5'
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
            عرض الهاتف: خط زمني عمودي متتابع ومترابط بأسهم
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="block lg:hidden space-y-4">
          {stages.map((stage, idx) => {
            const IconComponent = stage.icon;
            const isGreen = stage.group === 'green';
            const themeColor = isGreen ? '#00753A' : '#D21034';
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

                {/* سهم عمودي يصل بين البطاقات */}
                {!isLast && (
                  <div className="py-1 flex items-center justify-center">
                    <ArrowDown
                      className="size-4"
                      style={{ color: idx === 3 ? '#94a3b8' : themeColor }}
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
