import {
  FileSpreadsheet,
  Clock,
  Calculator,
  Workflow,
  AlertCircle,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';

/* ============================================================
   القسم 2 — المشكلة (The Real Challenge)
   العنوان: ليست المشكلة في نقص الوثائق، بل في تشتّت فهمها.
   4 بطاقات تصف التحديات الواقعية دون إحصاءات أو نسب غير موثقة:
   - متطلبات موزعة بين ملفات وملاحق
   - تفاصيل وآجال تحتاج متابعة دقيقة
   - جداول تتطلب مراجعة حسابية
   - إجراءات يصعب تتبعها بين الأطراف
   ============================================================ */

export function V2Problem() {
  const problems = [
    {
      num: '01',
      title: 'متطلبات موزعة بين ملفات وملاحق',
      desc: 'تتوزع شروط التأهيل والمواصفات الفنية بين دفتر الشروط، الملاحق المتعددة، والنصوص التنظيمية، ما يرفع احتمالية إغفال بنود حاسمة وموجبة للإقصاء.',
      icon: FileSpreadsheet,
      tint: 'bg-[#EDF4EE] text-[#167354] border-[#CDE1D3]',
      kicker: 'تشتت الوثائق',
    },
    {
      num: '02',
      title: 'تفاصيل وآجال تحتاج متابعة دقيقة',
      desc: 'حساب مدد تحضير العروض وصلاحيتها، وفترات الطعون القانونية وفق أيام العمل والتقويم الإجرائي، يتطلب يقظة تامة لتجنب فوات المواعيد الرسمية.',
      icon: Clock,
      tint: 'bg-[#EFF4F8] text-[#1D6FA5] border-[#D0E2EF]',
      kicker: 'حساب الآجال',
    },
    {
      num: '03',
      title: 'جداول تتطلب مراجعة حسابية',
      desc: 'كشوف الأسعار الفردية، جداول الكميات، والمجاميع الإجمالية للعطاءات تتطلب تدقيقاً حسابياً دقيقاً لكشف الأخطاء المادية قبل ترسية الصفقة.',
      icon: Calculator,
      tint: 'bg-[#F7F2E9] text-[#B45309] border-[#E8DFC9]',
      kicker: 'المطابقة المالية',
    },
    {
      num: '04',
      title: 'إجراءات يصعب تتبعها بين الأطراف',
      desc: 'تداخل المسؤوليات وتعدد المتدخلين بين المصلحة المتعاقدة، لجان الفتح والتقييم، الرقابة، والمتعاملين يجعل الحفاظ على تسلسل موثق وموحّد تحدياً إدارياً مستمراً.',
      icon: Workflow,
      tint: 'bg-[#F3EFF8] text-[#7C3AED] border-[#DDD6FE]',
      kicker: 'حوكمة المسار',
    },
  ];

  return (
    <section className="bg-white py-8 md:py-14 text-[#24352E]" id="problem" dir="rtl">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        <SectionHeader
          badge="التحدي الإجرائي"
          title="ليست المشكلة في نقص الوثائق، بل في تشتّت فهمها."
          subtitle="تتسم الصفقات العمومية بكثافة إجرائية عالية؛ وتتولد أغلب الإخفاقات من تشتت المتطلبات، ضغط الآجال، وتعقد المطابقات اليدوية."
        />

        {/* شبكة البطاقات الأربع بنمط Notion */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.num}
                className="bg-[#F8F9F7] rounded-xl border border-[#E3E7E2] p-6 flex flex-col justify-between gap-4 hover:border-[#CBD5E1] hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-bold text-[#59665F]">
                    {item.num}
                  </span>
                  <div className={`size-9 rounded-lg flex items-center justify-center border ${item.tint}`}>
                    <Icon className="size-4.5" aria-hidden="true" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-[#59665F] uppercase tracking-wider">
                    {item.kicker}
                  </span>
                  <h3 className="text-base font-extrabold text-[#24352E] m-0 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#59665F] leading-relaxed m-0 font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E3E7E2] flex items-center gap-1.5 text-[11px] text-[#59665F]">
                  <AlertCircle className="size-3.5 text-[#C83A42] shrink-0" aria-hidden="true" />
                  <span>تأثير مباشر على سلامة الإجراء</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
