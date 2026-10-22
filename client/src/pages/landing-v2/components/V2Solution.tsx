import {
  BookOpenCheck,
  CheckCheck,
  FileEdit,
  ArrowLeft,
  UserCheck,
  Cpu,
  Inbox,
  Send,
  Info,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';

/* ============================================================
   القسم 3 — الحل (Product Vision & Capabilities)
   العنوان: مساحة تربط المعلومة بالإجراء.
   3 قدرات مستهدفة:
   1. فهم: استخراج وتنظيم المتطلبات من المصادر.
   2. مراجعة: إبراز ما يحتاج انتباهًا أو استيضاحًا.
   3. إعداد: المساعدة في تنظيم الملف والجداول.
   لكل قدرة: مدخلات → مساعدة الأداة → مخرج → مراجعة بشرية.
   تمييز صريح بين رؤية المنتج والوظائف المتاحة فعلياً.
   ============================================================ */

export function V2Solution() {
  const capabilities = [
    {
      id: 'cap-understand',
      pillar: 'فهم',
      title: 'استخراج وتنظيم المتطلبات من المصادر',
      summary: 'تفكيك بنود دفتر الشروط واستخلاص شروط التأهيل والتصنيف والالتزامات التعاقدية في هيكل منظم.',
      icon: BookOpenCheck,
      tint: 'bg-[#EDF4EE] text-[#167354] border-[#CDE1D3]',
      tagBg: 'bg-[#EDF4EE] text-[#167354]',
      statusBadge: 'رؤية معمارية — تكامل تدريجي',
      flow: {
        input: 'دفاتر الشروط، الملاحق الفنية، والنصوص التنظيمية المرتبطة.',
        tool: 'استخلاص الالتزامات والمدد وفصل شروط الإقصاء عن معايير التنقيط.',
        output: 'جدول متطلبات مهيكل وقائمة فحص مسبقة واضحة.',
        human: 'مراجعة المستخدم للتأكد من مطابقة الاستخلاص لخصوصية العملية.',
      },
    },
    {
      id: 'cap-review',
      pillar: 'مراجعة',
      title: 'إبراز ما يحتاج انتباهًا أو استيضاحًا',
      summary: 'الكشف المبكر عن النواقص الشكلية في الملفات ومطابقة تواريخ الصلاحية وتنبيه اللجان إلى البنود الحساسة.',
      icon: CheckCheck,
      tint: 'bg-[#EFF4F8] text-[#1D6FA5] border-[#D0E2EF]',
      tagBg: 'bg-[#EFF4F8] text-[#1D6FA5]',
      statusBadge: 'اختبارات داخلية للقواعد المنهجية',
      flow: {
        input: 'ملفات المشاركة، وثائق الترشح، ومسودات دفاتر الشروط.',
        tool: 'فحص التناسق الشكلي، رصد تعارض المواعيد، وتنبيه لنواقص التوقيع والتواريخ.',
        output: 'تقرير ملاحظات استرشادي وقائمة تدقيق لجلسات التقييم.',
        human: 'فحص إلزامي وحصري من قِبل أعضاء اللجنة المخولين نظاماً.',
      },
    },
    {
      id: 'cap-prepare',
      pillar: 'إعداد',
      title: 'المساعدة في تنظيم الملف والجداول',
      summary: 'توليد مسودات أولية لدفاتر الشروط وفق القوالب الاسترشادية، وترتيب أظرفة العرض الثلاثة وحساب الجداول.',
      icon: FileEdit,
      tint: 'bg-[#F3EFF8] text-[#7C3AED] border-[#DDD6FE]',
      tagBg: 'bg-[#F3EFF8] text-[#7C3AED]',
      statusBadge: 'قوالب ومعالج متاح حالياً',
      flow: {
        input: 'بيانات تحديد الحاجة، خيارات الإبرام، وجداول الكميات والأسعار.',
        tool: 'تنظيم هيكل الملف، تطبيق قوالب العقود الاسترشادية، وإعداد جداول المطابقة.',
        output: 'مسودة متكاملة قابلة للتعديل وتصدير PDF لمحاضر الجلسات.',
        human: 'اعتماد وتوقيع وختم رسمي من الآمر بالصرف أو المتعامل.',
      },
    },
  ];

  return (
    <section className="bg-white py-8 md:py-14 text-[#24352E]" id="solution" dir="rtl">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        <SectionHeader
          badge="الرؤية والحل"
          title="مساحة تربط المعلومة بالإجراء."
          subtitle="صُممت منصة صفقات ذكية لتكون حلقة وصل تفاعلية تدمج أدوات المساعدة الذكية ضمن بيئة محكومة، حيث تُقدَّم التوصية ويبقى القرار للإنسان."
        />

        {/* شبكة القدرات الثلاث المستهدفة */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <article
                key={cap.id}
                className="bg-[#F8F9F7] rounded-2xl border border-[#E3E7E2] p-6 sm:p-7 flex flex-col justify-between gap-6 hover:border-[#CBD5E1] transition-all"
              >
                {/* رأس بطاقة القدرة */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${cap.tagBg}`}>
                      {cap.pillar}
                    </span>
                    <div className={`size-10 rounded-xl flex items-center justify-center border ${cap.tint}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-[#24352E] m-0 mb-2 leading-snug">
                      {cap.title}
                    </h3>
                    <p className="text-xs md:text-sm text-[#59665F] leading-relaxed m-0">
                      {cap.summary}
                    </p>
                  </div>
                </div>

                {/* مسار الإجراء: مدخلات → مساعدة الأداة → مخرج → مراجعة بشرية */}
                <div className="bg-white rounded-xl border border-[#E3E7E2] p-4 flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-[#59665F] uppercase tracking-wider block border-b border-[#E3E7E2] pb-2">
                    مسار المعالجة في هذه القدرة:
                  </span>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <Inbox className="size-3.5 text-[#59665F] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <strong className="text-[#24352E]">المدخلات:</strong>{' '}
                        <span className="text-[#59665F]">{cap.flow.input}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Cpu className="size-3.5 text-[#167354] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <strong className="text-[#167354]">مساعدة الأداة:</strong>{' '}
                        <span className="text-[#59665F]">{cap.flow.tool}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Send className="size-3.5 text-[#1D6FA5] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <strong className="text-[#1D6FA5]">المخرج:</strong>{' '}
                        <span className="text-[#59665F]">{cap.flow.output}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-[#EDF4EE]/60 p-2 rounded-lg border border-[#CDE1D3]">
                      <UserCheck className="size-3.5 text-[#167354] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <strong className="text-[#167354]">المراجعة البشرية:</strong>{' '}
                        <span className="text-[#24352E] font-medium">{cap.flow.human}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* شارة حالة الميزة والتمييز بين الرؤية والتنفيذ */}
                <div className="pt-2 flex items-center justify-between text-xs text-[#59665F] border-t border-[#E3E7E2]">
                  <span className="text-[11px] font-bold text-[#59665F]/80">
                    مستوى الجاهزية:
                  </span>
                  <span className="font-bold text-[#24352E]">
                    {cap.statusBadge}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* إشعار التمييز الصريح بين الرؤية والوظائف النشطة */}
        <div className="mt-8 p-4 rounded-xl bg-[#F8F9F7] border border-[#E3E7E2] flex items-center gap-3 text-xs md:text-sm text-[#59665F] max-w-3xl mx-auto">
          <Info className="size-5 text-[#167354] shrink-0" aria-hidden="true" />
          <p className="m-0 leading-relaxed">
            <strong className="text-[#24352E]">توضيح مؤسسي:</strong> تمثل هذه المحطات الثلاث الرؤية المعمارية المتكاملة لمنظومة صفقات ذكية. الوظائف الاستشارية التوليدية يتم إدراجها تدريجياً بعد خضوعها لاختبارات التحقق المنهجية الموثقة.
          </p>
        </div>
      </div>
    </section>
  );
}
