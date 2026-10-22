import { useLocation } from 'wouter';
import {
  FileText,
  Search,
  FileCheck2,
  UserCheck,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  BookOpenCheck,
} from 'lucide-react';

/* ============================================================
   القسم 1 — فكرة المنصة (Hero)
   - العنوان: من وثائق متفرقة، إلى فهم أوضح وقرارات مدروسة.
   - الشارة: الذكاء في قلب دورة الصفقة.
   - المشهد البصري: وثيقة → فهم المتطلبات → مخرج قابل للمراجعة → اعتماد المستخدم.
   - زر أساسي: /login
   - زر ثانوي: #features
   ============================================================ */

export function V2Hero() {
  const [, setLocation] = useLocation();

  const pipelineSteps = [
    {
      step: '01',
      title: 'وثيقة',
      desc: 'دفتر شروط، ملحق، أو عرض مشاركة',
      icon: FileText,
      tint: 'bg-[#EFF4F8] text-[#1D6FA5] border-[#D0E2EF]',
    },
    {
      step: '02',
      title: 'فهم المتطلبات',
      desc: 'استخلاص الشروط والتصنيفات والآجال',
      icon: Search,
      tint: 'bg-[#EDF4EE] text-[#167354] border-[#CDE1D3]',
    },
    {
      step: '03',
      title: 'مخرج قابل للمراجعة',
      desc: 'مسودة مهيكلة، تقرير فحص، أو محضر فوري',
      icon: FileCheck2,
      tint: 'bg-[#F3EFF8] text-[#7C3AED] border-[#DDD6FE]',
    },
    {
      step: '04',
      title: 'اعتماد المستخدم',
      desc: 'القرار النهائي والتوقيع للمسؤول المخوّل',
      icon: UserCheck,
      tint: 'bg-[#F7F2E9] text-[#B45309] border-[#E8DFC9]',
    },
  ];

  return (
    <section className="bg-white py-10 md:py-16 text-[#24352E]" id="hero" dir="rtl">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        {/* البطاقة الافتتاحية الكبيرة بأسلوب Notion */}
        <div className="bg-[#F8F9F7] rounded-2xl md:rounded-3xl border border-[#E3E7E2] p-4 sm:p-8 md:p-12 shadow-[0_2px_12px_-4px_rgba(36,53,46,0.04)]">
          {/* رأس البطاقة والشارة */}
          <div className="flex flex-col items-start gap-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#167354] border border-[#CDE1D3] text-xs md:text-sm font-bold shadow-2xs">
              <Sparkles className="size-3.5 text-[#167354]" aria-hidden="true" />
              <span>الذكاء في قلب دورة الصفقة</span>
            </div>

            <h1 className="text-[30px] sm:text-[38px] md:text-[46px] lg:text-[50px] font-extrabold text-[#24352E] leading-[1.22] tracking-tight m-0 text-balance">
              من وثائق متفرقة،
              <br />
              <span className="text-[#167354]">إلى فهم أوضح وقرارات مدروسة.</span>
            </h1>

            <p className="text-[15px] sm:text-[17px] md:text-[18px] text-[#59665F] leading-relaxed m-0 text-balance font-normal">
              صفقات ذكية توظّف أدوات التحليل والمراجعة والمساعدة في إعداد الملفات،
              لربط أطراف الصفقة في مسار واضح، مع بقاء الاعتماد والقرار بيد المستخدم المخوّل.
            </p>

            {/* أزرار الإجراءات الأساسية */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#167354] text-white font-bold text-sm md:text-base hover:bg-[#115840] transition-colors shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167354]"
                onClick={() => setLocation('/login')}
              >
                <span>ادخل مساحة العمل</span>
                <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              </button>

              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#24352E] border border-[#E3E7E2] font-bold text-sm md:text-base hover:bg-[#F8F9F7] hover:border-[#CBD5E1] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167354]"
              >
                <span>استكشف القدرات المتاحة</span>
              </a>
            </div>

            {/* سطر الالتزام المؤسسي والتحفظ المهني */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#59665F] pt-4 border-t border-[#E3E7E2] w-full mt-2">
              <div className="flex items-center gap-1.5">
                <BookOpenCheck className="size-4 text-[#167354]" aria-hidden="true" />
                <span>وفق القانون 23-12 والمرسوم الرئاسي 15-247</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#167354]" aria-hidden="true" />
                <span>سجل تدقيق رقمي موثّق</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#59665F]/85 font-medium">
                <span>نطوّر أدوات استشارية ذكية تدعم التدقيق وصياغة الدفاتر والمطابقة الإجرائية خطوة بخطوة.</span>
              </div>
            </div>
          </div>

          {/* المشهد البصري: تدفق المراحل الأربع (Visual Pipeline) */}
          <div className="mt-10 pt-8 border-t border-[#E3E7E2]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold text-[#59665F] uppercase tracking-wider">
                نموذج مسار التدفق الذكي للعمليات
              </span>
              <span className="text-xs text-[#59665F] font-mono">Workflow Pipeline</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pipelineSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="relative bg-white rounded-xl border border-[#E3E7E2] p-5 flex flex-col justify-between gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:border-[#CBD5E1] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-[#59665F]">
                        المرحلة {step.step}
                      </span>
                      <div className={`size-8 rounded-lg flex items-center justify-center border ${step.tint}`}>
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-[#24352E] m-0 mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs text-[#59665F] leading-relaxed m-0">
                        {step.desc}
                      </p>
                    </div>

                    {/* سهم الربط بين المراحل على الشاشات الكبيرة */}
                    {idx < pipelineSteps.length - 1 && (
                      <div className="hidden lg:block absolute -left-3 top-1/2 -translate-y-1/2 z-10 text-[#CBD5E1] text-xs font-black">
                        ←
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
