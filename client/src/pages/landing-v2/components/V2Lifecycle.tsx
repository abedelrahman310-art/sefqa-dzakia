import React, { useState } from 'react';
import {
  FileText,
  FileEdit,
  Megaphone,
  FolderLock,
  Scale,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Layers,
  Compass,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';

/* ============================================================
   القسم 7 — دورة الصفقة بمساعدة الذكاء (Procurement Lifecycle)
   العنوان: مسار واحد، ومساعدة في مواضعها.
   
   المراحل الست الإجرائية مع تمييز لوني فريد لكل مرحلة:
   01. تحديد الحاجة والبرمجة       -> Teal (#0D9488)
   02. إعداد الملف ودفتر الشروط     -> Royal Blue (#2563EB)
   03. النشر والإعلان والمنافسة     -> Warm Amber (#D97706)
   04. إعداد العرض وإيداعه          -> Amethyst Violet (#7C3AED)
   05. الفتح والتقييم (COP)         -> Coral Ruby (#E11D48)
   06. المنح والمراقبة والتعاقد    -> Emerald Green (#059669)

   المبادئ الجوهرية:
   - تمييز لوني كامل ومتقن لكل مرحلة يعكس طبيعتها ودورها.
   - الفصل التام بين المسؤولية البشرية الإلزامية ومساعدة الأداة الذكية.
   - ضوابط رقابية حاسمة: الذكاء لا يقرر ولا يقصي ولا يمنح.
   - دعم العرض التفاعلي المركّز وعرض المصفوفة المتزامنة.
   ============================================================ */

export interface LifecycleStage {
  num: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  role: string;
  legalAnchor: string;
  color: {
    name: string;
    primary: string;       // اللون الرئيسي للحدود والأزرار
    accentText: string;    // للخطوط البارزة
    bgLight: string;       // للخلفيات النشطة الفاتحة
    borderLight: string;   // للحدود الناعمة
    badgeBg: string;       // لخلفية الشارة
    badgeBorder: string;   // لحدود الشارة
    ringColor: string;     // لتأثير التركيز والظلال
  };
  humanTasks: {
    title: string;
    description: string;
  };
  aiCapabilities: {
    status: 'متاحة' | 'تجريبية' | 'قيد التطوير';
    summary: string;
    points: string[];
    guardrail: string;
  };
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    num: '01',
    name: 'تحديد الحاجة والبرمجة الأولية',
    shortName: 'تحديد الحاجة',
    icon: FileText,
    role: 'المصلحة المتعاقدة (المصالح التقنية والآمر بالصرف)',
    legalAnchor: 'المادة 27 من المرسوم الرئاسي 15-247 (حصر الحاجات وتفادي التجزئة غير المبررة)',
    color: {
      name: 'teal',
      primary: '#0D9488',
      accentText: '#0F766E',
      bgLight: '#F0FDFA',
      borderLight: '#99F6E4',
      badgeBg: '#CCFBF1',
      badgeBorder: '#5EEAD4',
      ringColor: 'rgba(13, 148, 136, 0.25)',
    },
    humanTasks: {
      title: 'حصر الحاجات والتقدير الإداري السري وتوفر الميزانية',
      description:
        'تحديد طبيعة الحاجات الفعلية بدقة وتفادي التجزئة الممنوعة، ضبط المواصفات التقنية وجداول الكميات، وضع التقدير الإداري السري للعملية، والتأكد المسبق من وجود الاعتمادات المالية والتسجيل في المخطط التقديري السنوي.',
    },
    aiCapabilities: {
      status: 'تجريبية',
      summary: 'إسناد تحليلي في التصنيف والتحقق الشكلي من اكتمال البطاقة التقنية.',
      points: [
        'المساعدة في تصنيف موضوع الصفقة ضمن الفئات النظامية (أشغال، لوازم، دراسات، خدمات).',
        'اقتراح بنود التوصيف المعياري وتفادي المصطلحات الموجهة لمورد أو علامة محددة.',
        'التحقق الشكلي من اكتمال محاور البطاقة التقنية وجاهزيتها لصياغة الدفتر.',
      ],
      guardrail:
        'الذكاء الاصطناعي لا يقدّر الأسعار أو الاعتمادات المالية؛ التقدير المالي والإداري مسؤولية حصرية للإدارة.',
    },
  },
  {
    num: '02',
    name: 'إعداد الملف ودفتر الشروط',
    shortName: 'دفتر الشروط',
    icon: FileEdit,
    role: 'المصلحة المتعاقدة ولجان الصياغة والمراجعة',
    legalAnchor: 'المواد 39 إلى 51 من المرسوم 15-247 والقانون 23-12 (طرق الإبرام ودفاتر الشروط)',
    color: {
      name: 'blue',
      primary: '#2563EB',
      accentText: '#1D4ED8',
      bgLight: '#EFF6FF',
      borderLight: '#BFDBFE',
      badgeBg: '#DBEAFE',
      badgeBorder: '#93C5FD',
      ringColor: 'rgba(37, 99, 235, 0.25)',
    },
    humanTasks: {
      title: 'اختيار الإجراء القانوني واعتماد معايير التنقيط ومسودة الدفتر',
      description:
        'اختيار طريقة الإبرام المتطابقة مع طبيعة الصفقة ومبلغها، ضبط شروط التأهيل المهني والمالي، إقرار جدول تنقيط العروض ومعايير المفاضلة، وعرض المشروع على لجنة الصفقات المختصة للتأشير قبل النشر.',
    },
    aiCapabilities: {
      status: 'متاحة',
      summary: 'توليد هياكل دفاتر الشروط وفق قوالب نظامية متطابقة مع النصوص القانونية.',
      points: [
        'توفير هياكل نموذجية لدفاتر الشروط مستمدة من القوالب الاسترشادية المعتمدة.',
        'التدقيق الإجرائي في تضمين البنود الإلزامية كشروط الإقصاء والنزاهة وفترات الضمان.',
        'تنبيه الصائغ إلى الشروط التعجيزية المحتملة التي قد تخل بمبدأ المساواة والمنافسة.',
      ],
      guardrail:
        'كافة الصياغات المقترحة استرشادية، وتتطلب مراجعة قانونية إلزامية ومصادقة الآمر بالصرف ولجنة الصفقات.',
    },
  },
  {
    num: '03',
    name: 'النشر والإعلان والمنافسة',
    shortName: 'النشر والإعلان',
    icon: Megaphone,
    role: 'المصلحة المتعاقدة عبر وسائل الإعلام القانونية (BOMOP والجرائد)',
    legalAnchor: 'المواد 61 إلى 66 من المرسوم الرئاسي 15-247 (الإشهار الصحفي وآجال تحضير العروض)',
    color: {
      name: 'amber',
      primary: '#D97706',
      accentText: '#B45309',
      bgLight: '#FFFBEB',
      borderLight: '#FDE68A',
      badgeBg: '#FEF3C7',
      badgeBorder: '#FCD34D',
      ringColor: 'rgba(217, 119, 6, 0.25)',
    },
    humanTasks: {
      title: 'إرسال الإعلان للصحافة والـ BOMOP وإدارة الردود والتوضيحات',
      description:
        'تحديد آجال تحضير العروض وتاريخ وساعة الجلسة العلنية، نشر الإعلان باللغتين العربية والفرنسية في الجرائد الوطنية والنشرة الرسمية، واستلام استفسارات المتعهدين وإصدار المذكرات التوضيحية الموحدة.',
    },
    aiCapabilities: {
      status: 'قيد التطوير',
      summary: 'حساب الآجال بدقة والتحقق من تطابق نص الإعلان مع بيانات الدفتر.',
      points: [
        'الاحتساب الآلي لآجال تحضير العروض مع مراعاة أيام العطل الرسمية وأيام الراحة القانونية.',
        'المطابقة الآلية بين بيانات إعلان المنافسة والبيانات الجوهرية الواردة في دفتر الشروط.',
        'أرشفة وتصنيف استفسارات المتعهدين وتجهيز مسودات الردود الموحدة لجميع المشاركين.',
      ],
      guardrail:
        'الإعلان الرسمي المنشور في الصحافة الورقية والنشرة الرسمية هو المرجع القانوني الملزم والنافذ.',
    },
  },
  {
    num: '04',
    name: 'إعداد العرض وإيداعه وتأمينه',
    shortName: 'إيداع العرض',
    icon: FolderLock,
    role: 'المتعامل الاقتصادي (المؤسسة المترشحة والمصرح بالصفقة)',
    legalAnchor: 'المواد 67 إلى 69 من المرسوم الرئاسي 15-247 (ملف الترشح والعرضين التقني والمالي)',
    color: {
      name: 'violet',
      primary: '#7C3AED',
      accentText: '#6D28D9',
      bgLight: '#FAF5FF',
      borderLight: '#DDD6FE',
      badgeBg: '#EDE9FE',
      badgeBorder: '#C4B5FD',
      ringColor: 'rgba(124, 58, 237, 0.25)',
    },
    humanTasks: {
      title: 'استكمال الوثائق النظامية وحساب الأسعار وتوقيع التعهد وإيداع الملف',
      description:
        'استخراج الشهادات الجبائية وشبه الجبائية ومراجع الأهلية، إعداد العرض التقني والتعهد المالي بمسؤولية المتعامل، وإيداع الأظرفة الثلاثة المقفلة داخل الأجل القانوني وساعة الإغلاق المحددة.',
    },
    aiCapabilities: {
      status: 'تجريبية',
      summary: 'فحص شكلي لاكتمال الملفات وتنظيمها في الأظرفة الثلاثة مع التشفير.',
      points: [
        'فحص اكتمال المستندات الشكلية الإلزامية وتنبيه المترشح إلى أي نقص شكلي قبل التقديم.',
        'تصنيف المستندات في أظرفتها القانونية الثلاثة (ملف الترشح، التقني، المالي) لمنع الخلط.',
        'التشفير الآلي وحجب العروض المالية والتقنية لضمان سريتها حتى موعد الجلسة العلنية.',
      ],
      guardrail:
        'المنصة لا تقدم استشارات تسعيرية ولا تؤكد تأهيل العرض مسبقاً قبل الفحص الرسمي من اللجنة.',
    },
  },
  {
    num: '05',
    name: 'الفتح العلني والتقييم (لجنة COP)',
    shortName: 'الفتح والتقييم',
    icon: Scale,
    role: 'لجنة فتح الأظرفة وتقييم العروض (COP) حصراً وبحضور المشاركين',
    legalAnchor: 'المواد 70 إلى 72 من المرسوم 15-247 (جلسة فتح الأظرفة العلنية والتقييم الفني والمالي)',
    color: {
      name: 'rose',
      primary: '#E11D48',
      accentText: '#BE123C',
      bgLight: '#FFF1F2',
      borderLight: '#FECDD3',
      badgeBg: '#FFE4E6',
      badgeBorder: '#FDA4AF',
      ringColor: 'rgba(225, 29, 72, 0.25)',
    },
    humanTasks: {
      title: 'الفتح العلني، تلاوة الأسعار، تنقيط العروض، وتطبيق معايير المنح',
      description:
        'التحقق العلني من سلامة الأظرفة، إعلان الأسعار المقترحة والتخفيضات، فحص مطابقة العروض وإقصاء غير المطابق منها، تنقيط الملفات التقنية المقبولة، وإعداد تقرير التقييم واقتراح المنح.',
    },
    aiCapabilities: {
      status: 'متاحة',
      summary: 'تسجيل وقائع الجلسة العلنية فورياً وتفريغ الأسعار في جداول المقارنة.',
      points: [
        'التسجيل اللحظي لمجريات الجلسة العلنية وحصر المتعهدين الحاضرين وأسعارهم المصرح بها.',
        'التفريغ الآلي للأسعار في جداول المقارنة وتوليد محضر فتح الأظرفة الفوري بصيغة PDF.',
        'التدقيق الحسابي الآلي لاكتشاف الأخطاء المادية في جداول الأسعار الانفرادية والتفاصيل.',
      ],
      guardrail:
        'الذكاء الاصطناعي لا يملك أي سلطة تقريرية؛ لا يقصي عرضاً ولا يقيم ولا يمنح؛ التقييم عمل بشري قضائي/إداري بحت.',
    },
  },
  {
    num: '06',
    name: 'المنح المؤقت، الرقابة، والتعاقد النهائي',
    shortName: 'المنح والتعاقد',
    icon: ShieldCheck,
    role: 'المصلحة المتعاقدة، لجان الصفقات المختصة، والمتعامل الفائز',
    legalAnchor: 'المواد 65 و82 وما بعدها من المرسوم 15-247 (المنح المؤقت، حق الطعن، والعقد النهائي)',
    color: {
      name: 'emerald',
      primary: '#059669',
      accentText: '#047857',
      bgLight: '#ECFDF5',
      borderLight: '#A7F3D0',
      badgeBg: '#D1FAE5',
      badgeBorder: '#6EE7B7',
      ringColor: 'rgba(5, 150, 105, 0.25)',
    },
    humanTasks: {
      title: 'نشر جدول المنح المؤقت، البت في الطعون، وإبرام العقد ومتابعة التنفيذ',
      description:
        'نشر إعلان المنح المؤقت وفتح مهلة الطعن القانونية (10 أيام)، دراسة الطعون من لجنة الصفقات المختصة، إبرام العقد بعد استنفاذ الإجراءات الرقابية، ومتابعة تنفيذ الالتزامات والمستحقات.',
    },
    aiCapabilities: {
      status: 'متاحة',
      summary: 'تجميد الإجراءات أثناء مدة الطعن وتوثيق سجل التدقيق غير القابل للتعديل.',
      points: [
        'التجميد الرقمي التلقائي للإجراءات أثناء سريان مهلة الطعن القانونية منعاً للتعاقد المبكر.',
        'توثيق سجل التدقيق الرقمي الكامل (Audit Trail) ببصمة تشفيرية SHA-256 تثبت سلامة المسار.',
        'متابعة آجال الضمان وكفالات حسن التنفيذ ومواعيد إنجاز الملاحق التعاقدية.',
      ],
      guardrail:
        'البت في الطعون والمصادقة على الصفقات اختصاص حصري للجان الصفقات القانونية والآمر بالصرف.',
    },
  },
];

export function V2Lifecycle() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'stepper' | 'grid'>('stepper');

  const current = LIFECYCLE_STAGES[activeStage];
  const CurrentIcon = current.icon;

  const handleNext = () => {
    setActiveStage((prev) => (prev < LIFECYCLE_STAGES.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setActiveStage((prev) => (prev > 0 ? prev - 1 : LIFECYCLE_STAGES.length - 1));
  };

  const renderStatusBadge = (status: 'متاحة' | 'تجريبية' | 'قيد التطوير', stageColor: LifecycleStage['color']) => {
    switch (status) {
      case 'متاحة':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            style={{
              backgroundColor: '#EDF4EE',
              color: '#167354',
              borderColor: '#CDE1D3',
            }}
          >
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            <span>مساعدة تشغيلية متاحة</span>
          </span>
        );
      case 'تجريبية':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            style={{
              backgroundColor: stageColor.bgLight,
              color: stageColor.accentText,
              borderColor: stageColor.borderLight,
            }}
          >
            <Clock className="size-3.5" aria-hidden="true" />
            <span>مساعدة استرشادية تجريبية</span>
          </span>
        );
      case 'قيد التطوير':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            style={{
              backgroundColor: '#FFFBEB',
              color: '#B45309',
              borderColor: '#FDE68A',
            }}
          >
            <AlertCircle className="size-3.5" aria-hidden="true" />
            <span>قيد التطوير البرمجي</span>
          </span>
        );
    }
  };

  return (
    <section className="bg-[#FBFCFA] py-10 md:py-16 text-[#24352E]" id="lifecycle" dir="rtl">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        {/* رأس القسم: الذكاء الاصطناعي والتحليلات داخل دورة الصفقة */}
        <SectionHeader
          badge="الذكاء الاصطناعي والتحليلات في دورة الصفقة"
          title="مسار واحد، ومساعدة في مواضعها."
          subtitle="تنتظم دورة الصفقة العمومية عبر 6 مراحل إجرائية متتالية واضحة المعالم. تميَّز كل مرحلة بطبيعتها وفاعلها القانوني، وتتدخل الأدوات الذكية للإسناد والتدقيق الحسابي والشكلي دون المساس بحصرية القرار البشري."
        />

        {/* أزرار نمط العرض */}
        <div className="flex justify-center -mt-3 mb-8">
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#E3E7E2] shadow-sm">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'stepper'
                  ? 'bg-[#EDF4EE] text-[#167354] border border-[#CDE1D3]'
                  : 'text-[#59665F] hover:text-[#24352E]'
              }`}
              onClick={() => setViewMode('stepper')}
              aria-label="عرض المرحلة المركزة"
            >
              <Compass className="size-3.5" aria-hidden="true" />
              <span>المسار التفاعلي</span>
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#EDF4EE] text-[#167354] border border-[#CDE1D3]'
                  : 'text-[#59665F] hover:text-[#24352E]'
              }`}
              onClick={() => setViewMode('grid')}
              aria-label="عرض جميع المراحل جنباً إلى جنب"
            >
              <Layers className="size-3.5" aria-hidden="true" />
              <span>نظرة شاملة للمراحل الست</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            النمط الأول: المسار التفاعلي المركز (Stepper Focus Mode)
            ============================================================ */}
        {viewMode === 'stepper' ? (
          <div className="space-y-6">
            {/* شريط المراحل الست — كل مسار مُميّز بلونه الخاص */}
            <div className="bg-[#F8F9F7] p-2 sm:p-2.5 rounded-2xl border border-[#E3E7E2] shadow-2xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {LIFECYCLE_STAGES.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isActive = idx === activeStage;
                  return (
                    <button
                      key={stage.num}
                      type="button"
                      className={`relative group rounded-xl p-3 flex flex-col items-start text-right transition-all overflow-hidden border ${
                        isActive
                          ? 'bg-white shadow-sm'
                          : 'bg-white/50 border-[#E3E7E2] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                      style={{
                        borderColor: isActive ? stage.color.primary : undefined,
                        boxShadow: isActive ? `0 4px 12px ${stage.color.ringColor}` : undefined,
                      }}
                      onClick={() => setActiveStage(idx)}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {/* شريط علوي ملون خاص بالمرحلة */}
                      <div
                        className="absolute top-0 right-0 left-0 h-1 transition-all"
                        style={{
                          backgroundColor: stage.color.primary,
                          opacity: isActive ? 1 : 0.45,
                        }}
                      />

                      {/* رأس زر المرحلة: الرقم والأيقونة */}
                      <div className="flex items-center justify-between w-full mb-2">
                        <span
                          className="font-mono text-xs font-black px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: isActive ? stage.color.badgeBg : '#F1F5F0',
                            color: stage.color.accentText,
                          }}
                        >
                          {stage.num}
                        </span>
                        <div
                          className="size-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: stage.color.badgeBg,
                            color: stage.color.accentText,
                          }}
                        >
                          <Icon className="size-3.5" aria-hidden="true" />
                        </div>
                      </div>

                      {/* اسم المرحلة */}
                      <span
                        className="text-xs font-extrabold truncate w-full"
                        style={{
                          color: isActive ? stage.color.accentText : '#24352E',
                        }}
                      >
                        {stage.shortName}
                      </span>

                      {/* مؤشر الحالة الصغيرة */}
                      <span className="text-[10px] text-[#59665F] truncate w-full mt-0.5 font-medium">
                        {stage.aiCapabilities.status === 'متاحة' ? 'مساعدة جاهزة' : 'إسناد استرشادي'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* شريط التحكم السريع والتنقل */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E3E7E2]/70 px-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#59665F]">المرحلة النشطة:</span>
                  <span
                    className="font-mono text-xs font-black px-2 py-0.5 rounded-md text-white shadow-2xs"
                    style={{ backgroundColor: current.color.primary }}
                    dir="ltr"
                  >
                    {current.num} / 06
                  </span>
                  <span className="font-bold text-[#24352E] hidden sm:inline">
                    {current.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E3E7E2] text-xs font-bold text-[#24352E] hover:bg-[#F8F9F7] transition-colors shadow-2xs"
                    aria-label="المرحلة السابقة"
                  >
                    <ChevronRight className="size-3.5" />
                    <span>السابق</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold transition-all shadow-xs"
                    style={{ backgroundColor: current.color.primary }}
                    aria-label="المرحلة التالية"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* بطاقة العرض التفصيلية المتطورة للمرحلة المحددة */}
            <div
              className="bg-white rounded-2xl border transition-all overflow-hidden shadow-[0_4px_24px_-6px_rgba(36,53,46,0.06)]"
              style={{
                borderColor: current.color.borderLight,
              }}
            >
              {/* شريط علوي ملون بارز بلون المرحلة (4px) */}
              <div
                className="w-full h-1.5"
                style={{ backgroundColor: current.color.primary }}
              />

              <div className="p-6 sm:p-8">
                {/* 1. رأس بطاقة المرحلة */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E3E7E2]">
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* أيقونة المرحلة الكبيرة مع خلفية متدرجة */}
                    <div
                      className="size-13 sm:size-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs"
                      style={{
                        backgroundColor: current.color.bgLight,
                        borderColor: current.color.borderLight,
                        color: current.color.accentText,
                      }}
                    >
                      <CurrentIcon className="size-7" aria-hidden="true" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className="font-mono text-xs font-black px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: current.color.badgeBg,
                            color: current.color.accentText,
                            border: `1px solid ${current.color.badgeBorder}`,
                          }}
                        >
                          المرحلة {current.num}
                        </span>
                        {renderStatusBadge(current.aiCapabilities.status, current.color)}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-[#24352E] m-0">
                        {current.name}
                      </h3>
                    </div>
                  </div>

                  {/* شارة المسؤولية القانونية */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-[#F8F9F7] border border-[#E3E7E2] px-3.5 py-2 rounded-xl text-xs">
                    <span className="font-extrabold text-[#24352E] flex items-center gap-1.5">
                      <UserCheck className="size-4 text-[#167354]" />
                      <span>صاحب الصفة والقرار:</span>
                    </span>
                    <span className="text-[#59665F] font-bold">
                      {current.role}
                    </span>
                  </div>
                </div>

                {/* 2. تفصيل المهام: المسؤولية البشرية مقابل مساعدة الذكاء الاصطناعي */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* العمود الأيمن: المسؤولية الإدارية والبشرية الإلزامية */}
                  <div className="bg-[#F8F9F7] rounded-xl border border-[#E3E7E2] p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E3E7E2] text-xs font-black text-[#24352E]">
                        <div className="size-6 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center text-[#24352E]">
                          <UserCheck className="size-3.5" />
                        </div>
                        <span>المهمة البشرية الإلزامية (صاحب القرار القانوني)</span>
                      </div>

                      <h4 className="text-sm font-extrabold text-[#24352E] mb-2 leading-snug">
                        {current.humanTasks.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-[#59665F] leading-relaxed m-0 font-medium">
                        {current.humanTasks.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E3E7E2] flex items-center gap-2 text-[11px] font-bold text-[#59665F]">
                      <span className="size-1.5 rounded-full bg-[#167354] shrink-0" />
                      <span>اختصاص بشري حصري لا يقبل التفويض أو الاستبدال بالأنظمة الآلية.</span>
                    </div>
                  </div>

                  {/* العمود الأيسر: أين وكيف تساعد الأداة الذكية؟ */}
                  <div
                    className="rounded-xl border p-5 flex flex-col justify-between gap-4"
                    style={{
                      backgroundColor: current.color.bgLight,
                      borderColor: current.color.borderLight,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E3E7E2]/60 text-xs font-black">
                        <div
                          className="flex items-center gap-2"
                          style={{ color: current.color.accentText }}
                        >
                          <div
                            className="size-6 rounded-md flex items-center justify-center text-white"
                            style={{ backgroundColor: current.color.primary }}
                          >
                            <Sparkles className="size-3.5" />
                          </div>
                          <span>أين تتدخل الأداة الذكية؟ (نطاق الإسناد الرقمي)</span>
                        </div>

                        <span
                          className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: current.color.badgeBg,
                            color: current.color.accentText,
                          }}
                        >
                          {current.aiCapabilities.status}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-[#24352E] mb-3 leading-snug">
                        {current.aiCapabilities.summary}
                      </p>

                      <ul className="space-y-2 m-0 p-0 list-none">
                        {current.aiCapabilities.points.map((point, pIdx) => (
                          <li
                            key={pIdx}
                            className="flex items-start gap-2 text-xs sm:text-sm text-[#59665F] leading-relaxed font-medium"
                          >
                            <span
                              className="size-1.5 rounded-full mt-2 shrink-0"
                              style={{ backgroundColor: current.color.primary }}
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* صندوق الضابط الرقابي والمحدد القانوني */}
                    <div className="mt-2 bg-white/90 border border-[#F5C2C5] rounded-lg p-3 flex items-start gap-2.5 text-[11px] text-[#C83A42] font-semibold shadow-2xs">
                      <ShieldAlert className="size-4 shrink-0 mt-0.5 text-[#C83A42]" aria-hidden="true" />
                      <div className="leading-relaxed">
                        <strong className="block text-[#991B1B] font-extrabold mb-0.5">
                          الضابط الرقابي والمحدد النظامي:
                        </strong>
                        {current.aiCapabilities.guardrail}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. شريط السند الإجرائي والقانوني السفلي */}
                <div className="mt-6 pt-4 border-t border-[#E3E7E2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#59665F]">
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className="size-3.5 text-[#167354] shrink-0" />
                    <span className="font-bold text-[#24352E]">المرجعية النظامية للمرحلة:</span>
                    <span className="font-medium text-[#59665F] truncate">
                      {current.legalAnchor}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-[#59665F] shrink-0">
                    صفقات ذكية · دورة الشفافية والامتثال
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             النمط الثاني: نظرة شاملة للمراحل الست (All Stages Grid Mode)
             ============================================================ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {LIFECYCLE_STAGES.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.num}
                  className="bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden"
                  style={{
                    borderColor: stage.color.borderLight,
                  }}
                >
                  {/* خط علوي ملون بلون المرحلة */}
                  <div
                    className="absolute top-0 right-0 left-0 h-1.5"
                    style={{ backgroundColor: stage.color.primary }}
                  />

                  <div>
                    {/* رأس بطاقة المرحلة */}
                    <div className="flex items-center justify-between mb-3 pt-1">
                      <span
                        className="font-mono text-xs font-black px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: stage.color.badgeBg,
                          color: stage.color.accentText,
                          border: `1px solid ${stage.color.badgeBorder}`,
                        }}
                      >
                        المرحلة {stage.num}
                      </span>
                      <div
                        className="size-8 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: stage.color.bgLight,
                          color: stage.color.accentText,
                        }}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                    </div>

                    <h4 className="text-base font-extrabold text-[#24352E] mb-1">
                      {stage.name}
                    </h4>

                    <div className="text-[11px] text-[#59665F] font-bold mb-3 pb-2 border-b border-[#E3E7E2]">
                      <span className="text-[#24352E]">المسؤول:</span> {stage.role}
                    </div>

                    {/* المهمة البشرية مختصرة */}
                    <div className="mb-3">
                      <span className="text-[11px] font-bold text-[#24352E] block mb-1">
                        المهمة البشرية الإلزامية:
                      </span>
                      <p className="text-xs text-[#59665F] leading-relaxed line-clamp-3 m-0 font-medium">
                        {stage.humanTasks.description}
                      </p>
                    </div>

                    {/* مساعدة الأداة */}
                    <div
                      className="p-3 rounded-lg border mb-3"
                      style={{
                        backgroundColor: stage.color.bgLight,
                        borderColor: stage.color.borderLight,
                      }}
                    >
                      <div
                        className="text-[11px] font-bold mb-1 flex items-center gap-1"
                        style={{ color: stage.color.accentText }}
                      >
                        <Sparkles className="size-3" />
                        <span>موضع الإسناد الذكي:</span>
                      </div>
                      <p className="text-xs text-[#24352E] leading-relaxed m-0 font-medium">
                        {stage.aiCapabilities.summary}
                      </p>
                    </div>
                  </div>

                  {/* الضابط الرقابي */}
                  <div className="pt-2 border-t border-[#E3E7E2] text-[10px] text-[#C83A42] font-semibold flex items-center gap-1">
                    <ShieldAlert className="size-3 shrink-0" />
                    <span className="truncate">{stage.aiCapabilities.guardrail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
