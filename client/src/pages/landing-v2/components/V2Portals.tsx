import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Building2,
  Briefcase,
  Shield,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';

/* ============================================================
   القسم 4 — بوابات المنصة (Three Portals, Distinct Responsibilities)
   العنوان: ثلاث بوابات. مسؤوليات واضحة.
   الوصف: اختر مساحة العمل المناسبة لدورك، واكتشف كيف تساعدك المنصة على إنجاز مهامك.
   3 بطاقات مرتبة RTL:
   1. المصلحة المتعاقدة (أيقونة مبنى، مساحة #EDF4EE، العنوان: أعدّ الملفات ونظّم الإجراءات)
   2. المتعامل الاقتصادي (أيقونة حقيبة، مساحة #EFF4F8، العنوان: افهم الفرص وجهّز عرضك)
   3. الإدارة المركزية (أيقونة درع، مساحة #F3EFF8، العنوان: تابع النشاط وفق صلاحياتك)
   - زر «مهام البوابة» يوسع تفاصيل مختصرة عبر aria-expanded وaria-controls
   - رابط مستقل «تسجيل الدخول» يتوجه إلى /login دون تبديل دور أو تجاوز للمصادقة
   ============================================================ */

interface PortalConfig {
  id: string;
  name: string;
  headline: string;
  icon: any;
  tintBg: string;
  tintBorder: string;
  iconColor: string;
  badgeText: string;
  primaryTasks: string[];
  expandedTasks: string[];
}

const PORTALS_DATA: PortalConfig[] = [
  {
    id: 'authority',
    name: 'المصلحة المتعاقدة',
    headline: 'أعدّ الملفات ونظّم الإجراءات.',
    icon: Building2,
    tintBg: 'bg-[#EDF4EE]',
    tintBorder: 'border-[#CDE1D3]',
    iconColor: 'text-[#167354]',
    badgeText: 'للمصالح والإدارات العمومية',
    primaryTasks: [
      'إعداد وثائق الصفقة',
      'متابعة العروض',
      'توثيق الإجراءات',
    ],
    expandedTasks: [
      'صياغة دفاتر الشروط بالقوالب الاسترشادية والمواصفات الفنية',
      'إدارة وبرمجة جلسات فتح الأظرفة وتوليد المحاضر الرسمية (PDF)',
      'متابعة مسار التقييم وتوثيق سجل تدقيق الإجراءات',
    ],
  },
  {
    id: 'operator',
    name: 'المتعامل الاقتصادي',
    headline: 'افهم الفرص وجهّز عرضك.',
    icon: Briefcase,
    tintBg: 'bg-[#EFF4F8]',
    tintBorder: 'border-[#D0E2EF]',
    iconColor: 'text-[#1D6FA5]',
    badgeText: 'للشركات والمؤسسات المترشحة',
    primaryTasks: [
      'استكشاف الصفقات',
      'تجهيز ملف العرض',
      'تتبع الإيداع',
    ],
    expandedTasks: [
      'البحث في إعلانات الصفقات المنشورة وتصفية الفرص المناسبة',
      'تنظيم وتوزيع ملفات المشاركة على الأظرفة الثلاثة (الترشح، التقني، المالي)',
      'الاستفادة من ضوابط حجب العروض وحفظ وصول الملفات قبل موعد الجلسة',
    ],
  },
  {
    id: 'central',
    name: 'الإدارة المركزية',
    headline: 'تابع النشاط وفق صلاحياتك.',
    icon: Shield,
    tintBg: 'bg-[#F3EFF8]',
    tintBorder: 'border-[#DDD6FE]',
    iconColor: 'text-[#7C3AED]',
    badgeText: 'لهيئات الرقابة والتدقيق',
    primaryTasks: [
      'متابعة المؤشرات',
      'مراجعة السجلات',
      'الإشراف المخوّل',
    ],
    expandedTasks: [
      'استعراض لوحات المؤشرات العامة وحجم الصفقات الوطنية',
      'متابعة الطعون الإدارية والنزاعات الإجرائية المسجلة ولائياً',
      'مراجعة سجلات التدقيق الرقمية المقفلة ببصمات التحقق',
    ],
  },
];

export function V2Portals() {
  const [, setLocation] = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="bg-white py-8 md:py-14 text-[#243B36]" id="portals" dir="rtl">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        {/* 1. عنوان القسم والوصف المعتمد */}
        <SectionHeader
          title="ثلاث بوابات. مسؤوليات واضحة."
          subtitle="اختر مساحة العمل المناسبة لدورك، واكتشف كيف تساعدك المنصة على إنجاز مهامك."
        />

        {/* 2. شبكة البطاقات الثلاث بنمط Notion */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {PORTALS_DATA.map((portal) => {
            const Icon = portal.icon;
            const isExpanded = !!expanded[portal.id];
            const detailsId = `portal-details-${portal.id}`;

            return (
              <article
                key={portal.id}
                className="group relative bg-white rounded-[15px] border border-[#DFE7E3] p-5 md:p-6 flex flex-col justify-between transition-colors transition-shadow duration-200 motion-reduce:transition-none hover:border-[#167354] focus-within:border-[#167354] hover:shadow-[0_4px_16px_-2px_rgba(22,115,84,0.08)]"
              >
                {/* الجزء العلوي: رأس البطاقة والمساحة الملونة الخفيفة */}
                <div className="flex flex-col gap-4">
                  {/* مساحة لون خفيفة قرب الأيقونة والعنوان */}
                  <div className={`p-4 rounded-xl border ${portal.tintBg} ${portal.tintBorder} flex items-center justify-between gap-3`}>
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-lg bg-white border border-[#DFE7E3] flex items-center justify-center shrink-0 shadow-2xs">
                        <Icon className={`size-6 ${portal.iconColor}`} aria-hidden="true" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-[#52665F] block">البوابة الرسمية</span>
                        <h3 className="text-base font-extrabold text-[#243B36] m-0 leading-snug">
                          {portal.name}
                        </h3>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-white/90 text-[#52665F] border border-[#DFE7E3] shrink-0">
                      {portal.badgeText}
                    </span>
                  </div>

                  {/* عنوان البطاقة المعتمد */}
                  <div>
                    <h4 className="text-base md:text-lg font-bold text-[#243B36] m-0 leading-snug">
                      «{portal.headline}»
                    </h4>
                  </div>

                  {/* المهام المختصرة الأساسية */}
                  <div className="bg-[#F8F9F7] rounded-xl border border-[#DFE7E3] p-3.5 flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-[#52665F] uppercase tracking-wider block border-b border-[#DFE7E3] pb-1.5">
                      المهام الأساسية:
                    </span>
                    <ul className="space-y-1.5 m-0 p-0 list-none">
                      {portal.primaryTasks.map((task, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs md:text-sm font-semibold text-[#243B36]">
                          <CheckCircle2 className="size-3.5 text-[#167354] shrink-0" aria-hidden="true" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* التفاصيل الموسعة عند النقر على زر «مهام البوابة» */}
                  {isExpanded && (
                    <div
                      id={detailsId}
                      className="bg-white rounded-xl border border-[#DFE7E3] p-3.5 flex flex-col gap-2 text-xs text-[#52665F] leading-relaxed transition-all motion-reduce:transition-none"
                    >
                      <span className="text-[11px] font-bold text-[#167354] block border-b border-[#DFE7E3] pb-1">
                        تفاصيل المهام الإجرائية المنفذة:
                      </span>
                      <ul className="space-y-1.5 m-0 p-0 list-none">
                        {portal.expandedTasks.map((extTask, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-[#243B36]">
                            <span className="text-[#167354] font-bold text-xs" aria-hidden="true">•</span>
                            <span className="leading-relaxed">{extTask}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* أزرار الإجراءات المتساوية في المحاذاة على الحاسوب */}
                <div className="pt-4 mt-5 border-t border-[#DFE7E3] flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    {/* زر التوسيع: مهام البوابة */}
                    <button
                      type="button"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8F9F7] border border-[#DFE7E3] text-[#243B36] font-bold text-xs hover:bg-[#EDF4EE] hover:text-[#167354] hover:border-[#CDE1D3] transition-colors focus-visible:outline-2 focus-visible:outline-[#167354]"
                      onClick={() => toggleExpand(portal.id)}
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                    >
                      <span>مهام البوابة</span>
                      {isExpanded ? (
                        <ChevronUp className="size-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
                      )}
                    </button>

                    {/* رابط مستقل: تسجيل الدخول */}
                    <button
                      type="button"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#167354] text-white font-bold text-xs hover:bg-[#115840] transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-[#167354]"
                      onClick={() => setLocation('/login')}
                    >
                      <span>تسجيل الدخول</span>
                      <ArrowLeft className="size-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* 3. ملاحظة أسفل القسم مطابقة للتعليمات */}
        <div className="mt-8 p-4 rounded-xl bg-[#F8F9F7] border border-[#DFE7E3] flex items-center justify-center gap-2 text-xs md:text-sm text-[#52665F] text-center max-w-2xl mx-auto">
          <Lock className="size-4 text-[#167354] shrink-0" aria-hidden="true" />
          <p className="m-0 leading-relaxed font-medium">
            الدخول حسب صلاحيات الحساب، ولا يؤدي اختيار البوابة إلى تغيير دور المستخدم.
          </p>
        </div>
      </div>
    </section>
  );
}
