import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Workflow,
  FileCheck,
  FileText,
  Printer,
  ShieldCheck,
  Bot,
  CalendarClock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';

/* ============================================================
   القسم 6 — الميزات المتاحة (Available & Verified Features)
   العنوان: اكتشف ما يمكنك استخدامه الآن.
   مصدر موحد لحالات الميزات:
   - متاحة: تعمل ومختبرة للمستخدم المخول.
   - تجريبية: تعمل ضمن نطاق محدود معلن.
   - قيد التطوير: بدأ التنفيذ البرمجي فعلًا.
   - مخطط لها: تصور مستقبلي في مساحة ثانوية قابلة للتوسيع.
   كل بطاقة تتضمن: الاسم، الفائدة، الحالة، القيد، وإجراء حقيقي.
   ============================================================ */

export type FeatureStatus = 'متاحة' | 'تجريبية' | 'قيد التطوير' | 'مخطط لها';

interface FeatureItem {
  id: string;
  name: string;
  benefit: string;
  status: FeatureStatus;
  limitation: string;
  verificationEvidence?: string;
  actionText: string;
  actionHref?: string;
  icon: any;
  tint: string;
}

const ACTIVE_FEATURES: FeatureItem[] = [
  // 1. ميزات متاحة (مختبرة وتعمل)
  {
    id: 'feat-proc-lifecycle',
    name: 'إدارة دورة حياة الصفقات الإجرائية',
    benefit: 'حوكمة تسلسل مراحل الصفقة (تحديد الحاجة، الإعلان، الفتح، التقييم، المنح) مع التحقق الإجرائي قبل الانتقال.',
    status: 'متاحة',
    limitation: 'يتطلب توفر حساب مؤسسي مصرح به لكل مرحلة إجرائية.',
    verificationEvidence: 'اختبارات دورة الحياة الكاملة (test_full_procurement_lifecycle.py) بنجاح 100%.',
    actionText: 'تجربة الإجراءات في بوابة المصلحة',
    actionHref: '/login',
    icon: Workflow,
    tint: 'bg-[#EDF4EE] text-[#167354] border-[#CDE1D3]',
  },
  {
    id: 'feat-cahier-specs',
    name: 'إعداد كراس الشروط بالقوالب الاسترشادية',
    benefit: 'معالج متكامل لاختيار طريقة الإبرام القانونية وتوليد مسودة كراس الشروط والمواصفات الفنية.',
    status: 'متاحة',
    limitation: 'القوالب نماذج داخلية استرشادية تتطلب مراجعة وتوقيع المصلحة المتعاقدة.',
    verificationEvidence: 'مكتبة القوالب البرمجية المدمجة واختبارات تكامل API (test_cahier_specs_api.py).',
    actionText: 'فتح معالج إعداد الملف',
    actionHref: '/login',
    icon: FileText,
    tint: 'bg-[#EDF4EE] text-[#167354] border-[#CDE1D3]',
  },
  {
    id: 'feat-opening-pdf',
    name: 'تصدير محاضر فتح الأظرفة الرسمية (PDF)',
    benefit: 'توليد محضر جلسة الفتح العلنية فور انتهاء القراءة العلنية مع كشف الأسعار وبصمة التدقيق الرقمية.',
    status: 'متاحة',
    limitation: 'يصدر بصيغة PDF قياسية قابلة للتحميل والطباعة للتوقيع اليدوي للجنة.',
    verificationEvidence: 'اختبارات خدمة توليد الـ PDF (test_pdf_export.py).',
    actionText: 'معاينة محضر تجريبي',
    actionHref: '/login',
    icon: Printer,
    tint: 'bg-[#EDF4EE] text-[#167354] border-[#CDE1D3]',
  },
  {
    id: 'feat-audit-trail',
    name: 'سجل التدقيق الرقمي المشفر بالبصمة',
    benefit: 'توثيق كل حركة إجرائية ببصمة رقمية وتوقيت زمني واسم المستخدم لحماية تسلسل الإجراءات.',
    status: 'متاحة',
    limitation: 'يحمي التسلسل العملياتي داخل المنصة ولا يغني عن توقيعات المحاضر الرسمية.',
    verificationEvidence: 'اختبارات سلامة سجل التدقيق (test_execution_audit.py).',
    actionText: 'الاطلاع على لوحة التدقيق',
    actionHref: '/login',
    icon: ShieldCheck,
    tint: 'bg-[#EDF4EE] text-[#167354] border-[#CDE1D3]',
  },

  // 2. ميزات تجريبية (نطاق محدود معلن)
  {
    id: 'feat-operator-folders',
    name: 'تنظيم أظرفة العرض الثلاثة للمتعامل',
    benefit: 'ترتيب وثائق الترشح، العرض التقني، والعرض المالي مع تطبيق ضوابط حجب العروض قبل موعد الفتح.',
    status: 'تجريبية',
    limitation: 'تنظيم داخلي للمتعامل، ولا يمثل اعتماداً مسبقاً قبل الفحص القانوني للجنة.',
    verificationEvidence: 'فحص واجهات رفع وثائق العرض وتصنيفها في بوابة المتعامل.',
    actionText: 'معاينة بوابة المتعامل',
    actionHref: '/login',
    icon: FileCheck,
    tint: 'bg-[#EFF4F8] text-[#1D6FA5] border-[#D0E2EF]',
  },
  {
    id: 'feat-ai-assistant',
    name: 'المساعد الرقابي والاستشاري الإجرائي',
    benefit: 'إجابات إرشادية حول نصوص المرسوم الرئاسي 15-247 وحساب المهل وشروط الإبرام.',
    status: 'تجريبية',
    limitation: 'مساعد استشاري مسبق القواعد؛ لا يصدر قرارات أو استشارات قانونية ملزمة.',
    verificationEvidence: 'محرك الاستعلامات الاستشارية المدمج في واجهات البوابة.',
    actionText: 'طرح استفسار عبر المنصة',
    actionHref: '/login',
    icon: Bot,
    tint: 'bg-[#EFF4F8] text-[#1D6FA5] border-[#D0E2EF]',
  },

  // 3. ميزات قيد التطوير (تنفيذ نشط)
  {
    id: 'feat-publishing-calendar',
    name: 'مصفوفة مدد النشر التلقائية وفق BOMOP',
    benefit: 'حساب تلقائي لمدد تحضير العروض والطعون وفق مصفوفة الجريدة الرسمية والنشرة الرسمية للصفقات.',
    status: 'قيد التطوير',
    limitation: 'يجري استكمال قواعد استثناءات الحالات الاستعجالية والصفقات المبسطة.',
    verificationEvidence: 'قيد البرمجة في خدمة الحسابات الإجرائية للـ Backend.',
    actionText: 'قيد التطوير البرمجي',
    actionHref: '/login',
    icon: CalendarClock,
    tint: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  },
  {
    id: 'feat-central-monitoring',
    name: 'لوحات المؤشرات والرقابة عبر 58 ولاية',
    benefit: 'تجميع إحصائي لمؤشرات الصفقات والطعون الإدارية وتوزيعها الجغرافي والقطاعي.',
    status: 'قيد التطوير',
    limitation: 'يجري ربط محركات التجميع الإحصائي عبر قواعد البيانات اللامركزية.',
    verificationEvidence: 'نماذج بوابة الإدارة المركزية والتقارير الإحصائية قيد الاستكمال.',
    actionText: 'قيد التطوير البرمجي',
    actionHref: '/login',
    icon: BarChart3,
    tint: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  },
];

const PLANNED_FEATURES: { name: string; desc: string; trigger: string }[] = [
  {
    name: 'تكامل التوقيع والختم الإلكتروني الحكومي المؤهل',
    desc: 'ربط عمليات توقيع دفاتر الشروط ومحاضر اللجان بشهادات رقمية معتمدة عند اكتمال الربط مع مزود الخدمة الوطني.',
    trigger: 'يتطلب توفر مزود الشهادات الرقمية المعتمد وطنياً.',
  },
  {
    name: 'الربط المباشر مع النشرة الرسمية لصفقات المتعامل العمومي (BOMOP)',
    desc: 'إرسال الإعلانات الرسمية آلياً ونشرها دون الحاجة إلى معاملات ورقية أو بريدية يدوية.',
    trigger: 'يتطلب واجهة برمجة تطبيقات رسمية مخصصة للنشر الحكومي.',
  },
  {
    name: 'فحص التطابق التقني التوليدي لملفات المشاركة',
    desc: 'مقارنة آلية متقدمة بين وثائق العرض ومواصفات دفتر الشروط لكشف الفروق الدقيقة قبل بدء التقييم.',
    trigger: 'يتطلب استكمال معايير السلامة الإجرائية ونماذج الاستدلال المتخصصة.',
  },
];

export function V2Features() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<'all' | 'متاحة' | 'تجريبية' | 'قيد التطوير'>('all');
  const [showPlanned, setShowPlanned] = useState(false);

  const filteredFeatures = ACTIVE_FEATURES.filter((f) => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case 'متاحة':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EDF4EE] text-[#167354] border border-[#CDE1D3]">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            <span>متاحة ومختبرة</span>
          </span>
        );
      case 'تجريبية':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EFF4F8] text-[#1D6FA5] border border-[#D0E2EF]">
            <Clock className="size-3" aria-hidden="true" />
            <span>تجريبية (نطاق محدود)</span>
          </span>
        );
      case 'قيد التطوير':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            <AlertCircle className="size-3" aria-hidden="true" />
            <span>قيد التطوير النشط</span>
          </span>
        );
      case 'مخطط لها':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3EFF8] text-[#7C3AED] border border-[#DDD6FE]">
            <Layers className="size-3" aria-hidden="true" />
            <span>مخطط لها</span>
          </span>
        );
    }
  };

  return (
    <section className="bg-white py-8 md:py-14 text-[#24352E]" id="features" dir="rtl">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        <SectionHeader
          badge="الشفافية التشغيلية"
          title="اكتشف ما يمكنك استخدامه الآن."
          subtitle="دليل صادق وموثّق لحالة كل قدرة في النظام؛ نعلن بوضوح ما هو جاهز ومختبر، وما هو تجريبي، وما يجري تطويره."
        />

        {/* أزرار التصفية السريعة */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'all', label: 'كافة الميزات المنفذة' },
            { id: 'متاحة', label: 'متاحة (مختبرة)' },
            { id: 'تجريبية', label: 'تجريبية' },
            { id: 'قيد التطوير', label: 'قيد التطوير' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all border ${
                filter === tab.id
                  ? 'bg-[#167354] text-white border-[#167354] shadow-2xs'
                  : 'bg-white text-[#59665F] border-[#E3E7E2] hover:bg-[#F8F9F7] hover:text-[#24352E]'
              }`}
              onClick={() => setFilter(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* شبكة بطاقات الميزات بأسلوب Notion */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <article
                key={feat.id}
                className="bg-[#F8F9F7] rounded-xl border border-[#E3E7E2] p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-[#CBD5E1] transition-all"
              >
                <div className="flex flex-col gap-3">
                  {/* الرأس: الأيقونة وشارة الحالة */}
                  <div className="flex items-center justify-between gap-2">
                    <div className={`size-10 rounded-lg flex items-center justify-center border ${feat.tint}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    {getStatusBadge(feat.status)}
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#24352E] m-0 mb-1.5 leading-snug">
                      {feat.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#59665F] leading-relaxed m-0">
                      {feat.benefit}
                    </p>
                  </div>

                  {/* القيد الصريح ودليل الفحص */}
                  <div className="bg-white rounded-lg border border-[#E3E7E2] p-3 text-xs space-y-1.5 mt-1">
                    <div className="flex items-start gap-1.5 text-[#59665F]">
                      <strong className="text-[#C83A42] shrink-0 font-bold">القيد:</strong>
                      <span>{feat.limitation}</span>
                    </div>
                    {feat.verificationEvidence && (
                      <div className="flex items-start gap-1.5 text-[#59665F] pt-1.5 border-t border-[#E3E7E2]">
                        <strong className="text-[#167354] shrink-0 font-bold">التحقق:</strong>
                        <span className="font-mono text-[11px] text-[#24352E]">{feat.verificationEvidence}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* الإجراء الحقيقي */}
                <div className="pt-3 border-t border-[#E3E7E2] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#59665F]">
                    {feat.status === 'متاحة' ? 'جاهز للاستخدام' : 'متاح للتجربة والتقييم'}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#167354] hover:text-[#115840] transition-colors"
                    onClick={() => setLocation(feat.actionHref || '/login')}
                  >
                    <span>{feat.actionText}</span>
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* المساحة الثانوية القابلة للتوسيع للميزات المخطط لها */}
        <div className="mt-8 pt-4 border-t border-[#E3E7E2]">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[#F8F9F7] border border-[#E3E7E2] text-right hover:bg-[#F3F4F1] transition-colors"
            onClick={() => setShowPlanned(!showPlanned)}
            aria-expanded={showPlanned}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="size-4.5 text-[#7C3AED]" aria-hidden="true" />
              <div>
                <span className="text-sm font-extrabold text-[#24352E] block">
                  ميزات مخطط لها (تصورات مستقبلية قيد الدراسة)
                </span>
                <span className="text-xs text-[#59665F]">
                  انقر للاطلاع على القدرات المقررة ضمن مراحل التكامل اللاحقة
                </span>
              </div>
            </div>
            <div className="size-8 rounded-lg bg-white border border-[#E3E7E2] flex items-center justify-center text-[#59665F] shrink-0">
              {showPlanned ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </div>
          </button>

          {showPlanned && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 rounded-xl bg-white border border-[#E3E7E2]">
              {PLANNED_FEATURES.map((item, i) => (
                <div key={i} className="p-4 rounded-lg bg-[#F8F9F7] border border-[#E3E7E2] flex flex-col justify-between gap-3">
                  <div>
                    <span className="inline-block text-[11px] font-bold text-[#7C3AED] bg-[#F3EFF8] px-2 py-0.5 rounded mb-2">
                      مخطط مستقبلي
                    </span>
                    <h4 className="text-sm font-extrabold text-[#24352E] m-0 mb-1 leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-xs text-[#59665F] leading-relaxed m-0">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#E3E7E2] text-[11px] text-[#59665F]">
                    <strong className="text-[#24352E]">الشرط الأساسي:</strong> {item.trigger}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
