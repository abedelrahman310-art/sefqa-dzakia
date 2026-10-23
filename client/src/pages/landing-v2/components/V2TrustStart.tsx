import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  CheckCircle2,
  Coins,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Lock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';

/* ============================================================
   القسم 8 — البداية والثقة (Trust Guardrails, FAQ, & Final CTA)
   العنوان: ابدأ بخطوة واضحة.
   - 3 رسائل محورية عن حدود المساعد:
     1. يقترح ولا يعتمد.
     2. لا يختلق الأسعار.
     3. لا يودع العرض نيابة عن المستخدم.
   - أسئلة شائعة قابلة للتوسيع بلوحة المفاتيح.
   - دعوة واحدة حقيقية للبدء (CTA) ملائمة لحالة التشغيل بالحساب المؤسسي.
   ============================================================ */

export function V2TrustStart() {
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const guardrails = [
    {
      id: 'guard-1',
      title: 'يقترح ولا يعتمد',
      desc: 'الذكاء الاصطناعي في المنصة أداة مساعدة تقدم مسودات وتحليلات وتنبيهات شكلية؛ أما اعتماد دفاتر الشروط، وقرارات التأهيل والإقصاء والمنح، فمسؤولية قانونية حصرية للبشر والمجالس المختصة.',
      icon: CheckCircle2,
      tint: 'bg-[#EDF4EE] text-[#167354] border-[#CDE1D3]',
    },
    {
      id: 'guard-2',
      title: 'لا يختلق الأسعار',
      desc: 'الحسابات والمطابقات المالية مستندة بدقة إلى المعطيات المدخلة وجداول الأسعار الوحدوية دون أي توليد عشوائي أو تخمين أرقام، حفاظاً على نزاهة المنافسة وتكافؤ الفرص.',
      icon: Coins,
      tint: 'bg-[#EFF4F8] text-[#1D6FA5] border-[#D0E2EF]',
    },
    {
      id: 'guard-3',
      title: 'لا يودع العرض نيابة عن المستخدم',
      desc: 'إيداع العرض إجراء إرادي وقانوني ملزم يقوم به المتعامل بنفسه بعد الفحص والمصادقة؛ وتضمن المنصة عدم فتح أو فك تشفير أي عرض قبل موعد الجلسة العلنية المقررة.',
      icon: ShieldAlert,
      tint: 'bg-[#FAEFEF] text-[#C83A42] border-[#F5C2C5]',
    },
  ];

  const faqs = [
    {
      q: 'هل يحل الذكاء الاصطناعي في المنصة محل لجان الصفقات العمومية؟',
      a: 'إطلاقاً. لا يملك الذكاء الاصطناعي أي سلطة تقريرية أو قانونية في المنصة. تقتصر مساهمته على تنظيم المتطلبات، التدقيق الشكلي المسبق، واقتراح صياغات استرشادية، في حين يظل فحص العروض وتنقيطها ومنح الصفقات اختصاصاً أصيلاً ومحفوظاً لأعضاء لجان الفتح والتقييم ولجان الصفقات العمومية.',
    },
    {
      q: 'كيف تضمن المنصة سرية العروض التقنية والمالية قبل جلسة الفتح؟',
      a: 'تطبق المنصة ضوابط وصول نظامية مشددة تحجب تماماً محتويات العروض وأسعارها عن مسؤولي المصلحة المتعاقدة وأي طرف آخر حتى يحين الموعد النظامي المحدد لجلسة فتح الأظرفة العلنية، ولا يسمح بأي تعديل أو استبدال للملفات بعد انقضاء أجل الإيداع.',
    },
    {
      q: 'ما هو السند القانوني الذي يحكم عمل وإجراءات المنصة؟',
      a: 'تستند المنصة وتطابق مساراتها مع أحكام القانون رقم 23-12 الذي يحدد القواعد العامة المتعلقة بالصفقات العمومية، والمرسوم الرئاسي رقم 15-247 المتضمن تنظيم الصفقات العمومية وتفويضات المرفق العام، وقوانين الشفافية ومكافحة الفساد، ونصوص حماية المعطيات ذات الطابع الشخصي في الجزائر.',
    },
    {
      q: 'ما المقصود بـ «القوالب الاسترشادية» لكراس الشروط؟',
      a: 'القوالب المتاحة هي هياكل داخلية نموذجية مهيأة لتسريع صياغة مشاريع دفاتر الشروط بحسب نوع الصفقة وطريقة الإبرام؛ وهي نماذج توجيهية خاضعة للدراسة والمراجعة الإلزامية من قِبل المصلحة المتعاقدة ولجان الرقابة قبل اعتمادها ونشرها.',
    },
  ];

  return (
    <section className="bg-white py-8 md:py-16 text-[#24352E]" id="trust-start" dir="rtl">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        <SectionHeader
          badge="الضوابط والمسؤولية"
          title="ابدأ بخطوة واضحة."
          subtitle="يقوم نموذج عملنا على وضع حدود صارمة للتدخل الرقمي، لحماية القرار الإداري وحفظ حقوق المتعاملين في بيئة تتسم بالشفافية والمساءلة."
        />

        {/* 1. شبكة رسائل حدود المساعد الثلاث */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {guardrails.map((g) => {
            const Icon = g.icon;
            return (
              <article
                key={g.id}
                className="bg-white rounded-2xl border border-[#E3E7E2] p-6 flex flex-col justify-between gap-5 hover:border-[#C9D8D0] hover:shadow-[0_16px_36px_-26px_rgba(9,46,73,0.22)] transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={`size-10 rounded-lg flex items-center justify-center border ${g.tint}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#59665F]">ضابط أساسي</span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#24352E] m-0 mb-2 leading-snug">
                    {g.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#59665F] leading-relaxed m-0 font-normal">
                    {g.desc}
                  </p>
                </div>

                <div className="pt-2 text-[11px] text-[#59665F] border-t border-[#E3E7E2] flex items-center gap-1.5 font-medium">
                  <Lock className="size-3 text-[#167354]" aria-hidden="true" />
                  <span>مبدأ سيادي لا يقبل الاستثناء</span>
                </div>
              </article>
            );
          })}
        </div>

        {/* 2. قسم الأسئلة الشائعة القابلة للتوسيع (FAQ Accordion) */}
        <div id="faq" className="max-w-3xl mx-auto mb-14 scroll-mt-28">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <HelpCircle className="size-5 text-[#167354]" aria-hidden="true" />
            <h3 className="text-lg md:text-xl font-extrabold text-[#24352E] m-0">
              الأسئلة الشائعة حول المنصة
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-[#E3E7E2] overflow-hidden transition-all hover:border-[#C9D8D0]"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-right font-bold text-sm md:text-base text-[#24352E] hover:bg-[#F8FAF8] transition-colors focus-visible:outline-2 focus-visible:outline-[#167354]"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                  >
                    <span className="leading-snug">{faq.q}</span>
                    <div className="size-7 rounded-lg bg-white border border-[#E3E7E2] flex items-center justify-center text-[#59665F] shrink-0 mr-3">
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </div>
                  </button>

                  <div
                    id={`faq-answer-${idx}`}
                    className={`p-4 sm:p-5 pt-0 text-xs sm:text-sm text-[#59665F] leading-relaxed border-t border-[#E3E7E2] bg-[#FBFCFA] ${isOpen ? '' : 'hidden'}`}
                  >
                    {faq.a}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. الدعوة الواحدة الحقيقية للبدء (Single Honest CTA) */}
        <div id="final-cta" className="relative overflow-hidden rounded-[28px] bg-[#092E49] p-8 sm:p-12 md:p-14 text-center max-w-4xl mx-auto shadow-[0_30px_70px_-40px_rgba(9,46,73,0.65)] scroll-mt-28">
          <div className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-[#167354]/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 size-64 rounded-full bg-[#C83A42]/20 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#BDE7D3] border border-white/15 text-xs font-bold mb-5">
              <Sparkles className="size-3.5" aria-hidden="true" />
              <span>بيئة عمل رقمية موحدة</span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-snug m-0 mb-4 text-balance">
              جاهز للانطلاق في بيئة صفقات منظمة؟
            </h3>

            <p className="text-sm md:text-base text-white/70 leading-relaxed m-0 mb-8 max-w-xl mx-auto font-normal">
              سجّل الدخول بحسابك المؤسسي لبدء إدارة الصفقات، صياغة دفاتر الشروط، أو تنظيم ملفات المشاركة بمساعدة استشارية واضحة.
            </p>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#092E49] font-bold text-sm md:text-base hover:bg-[#EDF4EE] transition-colors shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => setLocation('/login')}
            >
              <span>ادخل إلى حسابك المؤسسي</span>
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            </button>

            <p className="text-[11px] text-white/50 mt-4 m-0">
              الدخول مخصص للمصالح العمومية والمتعاملين الاقتصاديين المعتمدين.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
