import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  Sparkles,
  X,
  FileCheck2,
  CheckCircle2,
  Building2,
  Calendar,
  Coins,
  ShieldCheck,
  Scale,
  Wand2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { ClauseLinterWidget } from './ClauseLinterWidget';

export interface GeneratedSpecsClause {
  sectionKey: string;
  clauseCode: string;
  title: string;
  content: string;
  isMandatory: boolean;
}

interface SmartSpecsGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedClauses: (clauses: GeneratedSpecsClause[]) => void;
}

export function SmartSpecsGeneratorModal({
  isOpen,
  onClose,
  onApplyGeneratedClauses,
}: SmartSpecsGeneratorModalProps) {
  const { dir, lang } = useI18n();
  const isAr = lang === 'ar';
  const isRtl = dir === 'rtl';

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // إعدادات التوليد
  const [contractType, setContractType] = useState<'works' | 'supplies' | 'services' | 'studies'>('works');
  const [procMethod, setProcMethod] = useState<'open' | 'open_min' | 'limited'>('open');
  const [projectTitle, setProjectTitle] = useState('مشروع تهيئة وتعبيد المسالك الحضرية وتصريف مياه الأمطار');
  const [executionMonths, setExecutionMonths] = useState(6);
  const [estimatedBudget, setEstimatedBudget] = useState('45000000');
  const [includeNationalPref, setIncludeNationalPref] = useState(true);
  const [includeSMEQuota, setIncludeSMEQuota] = useState(true);
  const [evaluationSystem, setEvaluationSystem] = useState<'lowest_price' | 'technical_financial_ratio'>('technical_financial_ratio');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedClauses, setGeneratedClauses] = useState<GeneratedSpecsClause[]>([]);

  if (!isOpen) return null;

  // توليد بنود كراس الشروط الذكي المتوافق قانونياً مع القانون 23-12
  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const typeLabels = {
        works: 'صفقة أشغال عمومية وبناء',
        supplies: 'صفقة اقتناء وتوريد عتاد ولوازم',
        services: 'صفقة خدمات وصيانة ونظافة',
        studies: 'صفقة دراسات ومتابعة تقنية ومراقبة جودة',
      };

      const clauses: GeneratedSpecsClause[] = [
        {
          sectionKey: 'general_provisions',
          clauseCode: 'GEN-01',
          title: 'موضوع الصفقة والإطار القانوني المعتمد',
          content: `تخضع هذه الصفقة لأحكام القانون رقم 23-12 المؤرخ في 18 محرم 1445 الموافق لـ 5 غشت 2023 المحدد للقواعد العامة المتعلقة بالصفقات العمومية والمرسوم الرئاسي 15-247. موضوعها هو: ${projectTitle} بصفته ${typeLabels[contractType]}. تلتزم المصلحة المتعاقدة بمبادئ حرية الوصول للطلب العمومي، المساواة في معاملة المرشحين، وشفافية الإجراءات.`,
          isMandatory: true,
        },
        {
          sectionKey: 'administrative',
          clauseCode: 'ADM-01',
          title: 'مكونات ملف الترشح والعرضين التقني والمالي',
          content: `وفقاً للمادة 67 من القانون 23-12، تشتمل العروض وجوباً على ثلاثة أظرفة منفصلة ومقفلة:\n1. ملف الترشح: تصريح بالترشح، تصريح بالنزاهة، القانون الأساسي للشركة، مستخرج السجل التجاري الإلكتروني، شهادة السوابق القضائية، والحسابات المالية المعتمدة.\n2. العرض التقني: تصريح بالاكتتاب، مذكرة تقنية تبريرية، الكفالات المصرفية المطلوبة، وشهادات التأهيل والتصنيف المهنيين.\n3. العرض المالي: رسالة التعهد، جدول الأسعار بالوحدة (BPU)، والتفصيل الكمي والتقديري (DQE).`,
          isMandatory: true,
        },
        {
          sectionKey: 'administrative',
          clauseCode: 'ADM-02',
          title: 'إلزامية التفضيل الوطني للمنتجات والمؤسسات المحلية',
          content: includeNationalPref
            ? `تطبيقاً لأحكام المادة 85 من القانون 23-12، يُمنح هامش تفضيل سعري قدره 25% لصالح المنتجات ذات المنشأ الجزائري والمؤسسات الخاضعة للقانون الجزائري التي يحوز أغلبية رأسمالها مواطنون جزائريون مقيمون.`
            : `تخضع العروض للمنافسة العامة مع إعطاء الأولوية لليد العاملة والمواد المحلية متى استوفت معايير الجودة والمطابقة الفنية.`,
          isMandatory: true,
        },
        {
          sectionKey: 'administrative',
          clauseCode: 'ADM-03',
          title: 'تخصيص حصة للمؤسسات المصغرة والناشئة',
          content: includeSMEQuota
            ? `تطبيقاً للمادة 87 من القانون 23-12، يُخصص ما نسبته 20% من الطلب العمومي للمؤسسات المصغرة والمؤسسات الناشئة الحاملة لعلامة «مشروع مبتكر»، مع إعفائها من تقديم كفالة التعهد المالي لتسهيل مشاركتها.`
            : `يُشجع المتعهدون على إشراك المؤسسات المصغرة والحرفيين في إطار المناولة القانونية المصرح بها وفق المادة 140.`,
          isMandatory: true,
        },
        {
          sectionKey: 'technical_specs',
          clauseCode: 'TECH-01',
          title: 'المواصفات التقنية ومعايير الجودة والمطابقة',
          content: `يجب أن تستوفي كافة المواد والتجهيزات المستخدمة المعايير والمقاييس الوطنية الجزائرية (IANOR) أو ما يعادلها المعتمد دولياً. يحظر استخدام أي علامة تجارية أو طراز إلا على سبيل الاستئناس مع عبارة «أو ما يعادلها المعتمد تقنياً». مدة الإنجاز التعاقدية محددة بـ (${executionMonths} أشهر) ابتداءً من تاريخ تبليغ أمر الخدمة (ODS).`,
          isMandatory: true,
        },
        {
          sectionKey: 'financial_terms',
          clauseCode: 'FIN-01',
          title: 'الأسعار وطرق الدفع والفوترة والتسبيقات',
          content: `تُحدد الأسعار بالدينار الجزائري (DZD) شاملة كافة الرسوم والضرائب (TTC). تتم التسوية المالية عبر كشوف حساب دورية (Situations mensuelles) معتمدة من المصالح التقنية خلال أجل لا يتجاوز 30 يوماً من إيداع الفاتورة. يُمنح المتعامل تسبيقاً جزافياً بنسبة 15% مقابل كفالة مصرفية بنكية تعادل قيمته وفق المادة 110.`,
          isMandatory: true,
        },
        {
          sectionKey: 'evaluation_criteria',
          clauseCode: 'EVAL-01',
          title: 'منهجية اختيار العرض الأفضل وتفادي الأسعار المنخفضة غير الطبيعية',
          content:
            evaluationSystem === 'technical_financial_ratio'
              ? `يتم اختيار العرض الأفضل اقتصادياً بناءً على ترجيح التنقيط التقني (70%) والتنقيط المالي (30%). تطبق لجنة فتح الأظرفة وتقييم العروض أحكام المادة 72 من القانون 23-12 بشأن العروض المنخفضة بشكل غير طبيعي، ويُلزم المتعهد بتقديم تبريرات كتابية مفصلة عن كلفة موارده وأسعاره الأحادية متى قل عرضه بنسبة تتجاوز 25% عن المتوسط المعتمد.`
              : `يُمنح المشروع للمتعهد صاحب العرض {isAr ? "الأقل ثمناً من بين العروض المقبولة تقنياً" : "Moins-disant parmi les offres techniquement recevables"} والمستوفية للشروط الإدارية والمالية وفق المادة 72، بعد التحقق من واقعية الأسعار ومطابقتها للمعايير المعمول بها.`,
          isMandatory: true,
        },
        {
          sectionKey: 'guarantees_and_penalties',
          clauseCode: 'PEN-01',
          title: 'الكفالات المصرفية وغرامات التأخير والفسخ',
          content: `يُلزم صاحب الصفقة بتقديم كفالة حسن التنفيذ بنسبة 5% من المبلغ الإجمالي للصفقة خلال 10 أيام من تبليغ المنح. في حال التأخر غير المبرر في وتيرة الإنجاز عن الجدولة المعتمدة، تُطبق غرامات تأخير يومية بنسبة 1/1000 من قيمة الصفقة بحد أقصى 10%، قبل اللجوء لإجراءات الإعذار والفسخ على عاتق المتعامل وفق المادة 150.`,
          isMandatory: true,
        },
      ];

      setGeneratedClauses(clauses);
      setIsGenerating(false);
      setStep(3);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-50"
      dir={dir}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col justify-between">
        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 z-20 size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* ─── الرأس ─── */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-950 via-[#0f3154] to-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md">
              <Wand2 className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                  المولّد الذكي 2.0 (Smart Specs Generator)
                </span>
                <span className="text-xs text-slate-300">القانون 23-12</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                توليد دفتر شروط نموذجي مطابق للمعايير الوطنية
              </h2>
            </div>
          </div>

          {/* الخطوات */}
          <div className="mt-4 flex items-center gap-2 text-xs">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${step === 1 ? 'bg-white/20 font-bold text-white' : 'text-slate-400'}`}>
              <span className="size-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">1</span>
              <span>بيانات المشروع ونطاق العقد</span>
            </div>
            <span className="text-slate-500">←</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${step === 2 ? 'bg-white/20 font-bold text-white' : 'text-slate-400'}`}>
              <span className="size-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">2</span>
              <span>الشروط والضمانات الإلزامية</span>
            </div>
            <span className="text-slate-500">←</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${step === 3 ? 'bg-white/20 font-bold text-white' : 'text-slate-400'}`}>
              <span className="size-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">3</span>
              <span>المعاينة والفحص الآلي للبنود</span>
            </div>
          </div>
        </div>

        {/* ─── جسم النافذة بحسب الخطوة ─── */}
        <div className="p-6 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">الخطوة 1: حدد طبيعة ونطاق الصفقة العمومية</h3>

              {/* اختيار نوع العقد */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">نوع وطبيعة العقد:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'works', label: 'أشغال (Travaux)', desc: 'بناء، تهيئة، طرقات، شبكات' },
                    { id: 'supplies', label: 'لوازم (Fournitures)', desc: 'عتاد، تجهيزات، أجهزة' },
                    { id: 'services', label: 'خدمات (Services)', desc: 'صيانة، نظافة، حراسة' },
                    { id: 'studies', label: 'دراسات (Études)', desc: 'هندسة معمارية، متابعة' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setContractType(item.id as any)}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        contractType === item.id
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                      }`}
                    >
                      <strong className="text-xs font-bold text-slate-900 block">{item.label}</strong>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* عنوان المشروع */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">{isAr ? "عنوان وموضوع الصفقة:" : "Objet et intitulé du marché :"}</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* الميزانية التقديرية ومدة الإنجاز */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{isAr ? "الغلاف المالي التقديري (د.ج):" : "Montant prévisionnel estimé (DZD) :"}</label>
                  <input
                    type="number"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">{isAr ? "مدة الإنجاز التعاقدية (بالأشهر):" : "Délai d’exécution contractuel (en mois) :"}</label>
                  <input
                    type="number"
                    value={executionMonths}
                    onChange={(e) => setExecutionMonths(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">{isAr ? "الخطوة 2: الشروط القانونية الإلزامية ومعايير الاختيار" : "Étape 2 : Clauses obligatoires et critères d’évaluation"}</h3>

              <div className="space-y-3">
                {/* التفضيل الوطني */}
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={includeNationalPref}
                    onChange={(e) => setIncludeNationalPref(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      {isAr ? "إدراج بند هامش التفضيل الوطني 25% (المادة 85)" : "Clause de préférence nationale de 25% (Article 85)"}
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug">
                      منح أفضلية سعرية للمنتجات والمؤسسات الوطنية ذات المنشأ الجزائري لدعم الإنتاج الوطني.
                    </span>
                  </div>
                </label>

                {/* كوتة المؤسسات المصغرة */}
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={includeSMEQuota}
                    onChange={(e) => setIncludeSMEQuota(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      {isAr ? "إدراج بند حصة المؤسسات المصغرة والناشئة 20% (المادة 87)" : "Quota réservé aux start-up et PME 20% (Article 87)"}
                    </strong>
                    <span className="text-[11px] text-slate-500 leading-snug">
                      تخصيص حصة للمؤسسات الناشئة مع إعفائها من كفالة التعهد المالي لتسهيل ولوجها للصفقات العمومية.
                    </span>
                  </div>
                </label>

                {/* نظام التنقيط */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">نظام تقييم واختيار العرض الفائز:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEvaluationSystem('technical_financial_ratio')}
                      className={`p-3 rounded-xl border text-start cursor-pointer ${
                        evaluationSystem === 'technical_financial_ratio'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-bold">{isAr ? "الأفضل اقتصادياً (ترجيح تقني 70% + مالي 30%)" : "Mieux-disant (Technique 70% + Financier 30%)"}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">موصى به للمشاريع ذات التعقيد الفني</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEvaluationSystem('lowest_price')}
                      className={`p-3 rounded-xl border text-start cursor-pointer ${
                        evaluationSystem === 'lowest_price'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="block text-xs font-bold">الأقل ثمناً من بين العروض المقبولة تقنياً</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">موصى به للوازم والخدمات النمطية القياسية</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAr ? "الخطوة 3: معاينة البنود المولّدة وفحص السلامة القانونية" : "Étape 3 : Aperçu des clauses générées et contrôle de conformité"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    تم توليد ({generatedClauses.length}) بنود نموذجية مطابقة بنسبة 100% لنماذج القانون 23-12.
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold border border-emerald-200">
                  جاهز للاعتماد
                </span>
              </div>

              {/* استعراض البنود مع الفحص الآلي */}
              <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                {generatedClauses.map((clause, idx) => (
                  <div key={clause.clauseCode} className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {clause.clauseCode}
                        </span>
                        <strong className="text-xs font-bold text-slate-900">{clause.title}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{clause.sectionKey}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {clause.content}
                    </p>

                    {/* الفاحص الآلي للبنود التمييزية في كل بند */}
                    <ClauseLinterWidget
                      content={clause.content}
                      onApplyFix={(fixedText) => {
                        const updated = [...generatedClauses];
                        updated[idx].content = fixedText;
                        setGeneratedClauses(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── أزرار التنقل السفلية ─── */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isRtl ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
              <span>{isAr ? "السابق" : "Précédent"}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1) setStep(2);
                else handleGenerate();
              }}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#006233] to-[#0f3154] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>جارٍ التوليد الآلي للبنود...</span>
                </>
              ) : (
                <>
                  <span>{step === 1 ? 'متابعة إلى الشروط' : 'توليد دفتر الشروط الذكي'}</span>
                  {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onApplyGeneratedClauses(generatedClauses);
                onClose();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              <span>اعتماد وتطبيق البنود في دفتر الشروط</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SmartSpecsGeneratorModal;
