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
    <section className="bg-[#FBFCFA] py-10 md:py-16 text-[#24352E]" id="portals" dir="rtl">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        <SectionHeader
          badge="البوابات الثلاث"
          title="ثلاث بوابات. مسؤوليات واضحة."
          subtitle="اختر مساحة العمل المناسبة لدورك، واكتشف كيف تساعدك المنصة على إنجاز مهامك."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
          {PORTALS_DATA.map((portal, idx) => {
            const Icon = portal.icon;
            const isExpanded = !!expanded[portal.id];
            const detailsId = `portal-details-${portal.id}`;

            return (
              <article
                key={portal.id}
                className="group relative overflow-hidden bg-white rounded-[22px] border border-[#E3E7E2] p-6 md:p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9D8D0] hover:shadow-[0_18px_40px_-24px_rgba(9,46,73,0.28)] focus-within:border-[#167354]"
              >
                {/* رقم البوابة كعنصر تحريري خافت في الخلفية */}
                <span
                  className="pointer-events-none absolute -top-4 left-4 text-[76px] font-black leading-none text-[#F1F5F2] select-none"
                  aria-hidden="true"
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`size-12 rounded-2xl border ${portal.tintBg} ${portal.tintBorder} flex items-center justify-center shrink-0`}>
                      <Icon className={`size-6 ${portal.iconColor}`} aria-hidden="true" />
                    </div>
                    <span className="max-w-[62%] text-left text-[10px] sm:text-[11px] font-bold text-[#59665F] leading-snug">
                      {portal.badgeText}
                    </span>
                  </div>

                  <div className="mt-6">
                    <span className="text-[11px] font-bold text-[#167354]">البوابة {idx + 1}</span>
                    <h3 className="mt-1 text-xl sm:text-[22px] font-extrabold text-[#24352E] m-0 leading-snug">
                      {portal.name}
                    </h3>
                    <p className="mt-2 text-sm text-[#59665F] leading-relaxed m-0">
                      {portal.headline}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#EDF1ED]">
                    <span className="text-[10px] font-bold text-[#59665F] tracking-[0.06em]">المهام الأساسية</span>
                    <ul className="mt-3 space-y-2.5 m-0 p-0 list-none">
                      {portal.primaryTasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm font-semibold text-[#24352E]">
                          <CheckCircle2 className="size-4 text-[#167354] shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="leading-relaxed">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    id={detailsId}
                    className={`mt-4 rounded-xl border border-[#DCE8E1] bg-[#F7FAF8] p-4 ${isExpanded ? 'flex' : 'hidden'} flex-col gap-2 text-xs text-[#59665F] leading-relaxed`}
                  >
                    <span className="text-[11px] font-bold text-[#167354] block border-b border-[#DCE8E1] pb-2">
                      تفاصيل المهام الإجرائية
                    </span>
                    <ul className="space-y-2 m-0 p-0 list-none">
                      {portal.expandedTasks.map((extTask, extIdx) => (
                        <li key={extIdx} className="flex items-start gap-2 text-xs text-[#31443B]">
                          <span className="text-[#167354] font-bold text-sm leading-none mt-0.5" aria-hidden="true">•</span>
                          <span className="leading-relaxed">{extTask}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="relative pt-5 mt-6 border-t border-[#EDF1ED] flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-[#DDE6E0] text-[#24352E] font-bold text-[11px] sm:text-xs hover:bg-[#EDF4EE] hover:text-[#167354] hover:border-[#CDE1D3] transition-colors focus-visible:outline-2 focus-visible:outline-[#167354]"
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

                  <button
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#167354] text-white font-bold text-[11px] sm:text-xs hover:bg-[#115840] transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167354]"
                    onClick={() => setLocation('/login')}
                  >
                    <span>تسجيل الدخول</span>
                    <ArrowLeft className="size-3.5 shrink-0" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-[#F5F8F5] border border-[#E3E7E2] px-5 py-4 flex items-center justify-center gap-2.5 text-xs md:text-sm text-[#59665F] text-center max-w-2xl mx-auto">
          <Lock className="size-4 text-[#167354] shrink-0" aria-hidden="true" />
          <p className="m-0 leading-relaxed font-medium">
            الدخول حسب صلاحيات الحساب، ولا يؤدي اختيار البوابة إلى تغيير دور المستخدم.
          </p>
        </div>
      </div>
    </section>
  );
}
