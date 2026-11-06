import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';

export const V3FAQSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: isAr
        ? 'كيف تكرس المنصة مبدأ «صفر ورقة» بموجب المادة 67 من القانون 23-12؟'
        : 'Comment s’applique le principe Zéro Papier selon l’Article 67 de la Loi 23-12 ?',
      a: isAr
        ? 'تتيح المنصة سحب دفاتر الشروط إلكترونياً بصفة فورية مع وصل سحب رقمي مؤمن، وإيداع الأظرفة التقنية والمالية مشفرة بـ SHA-256، مع التحقق الآلي من الوثائق الجبائية والشبه جبائية عبر الربط البيني دون الحاجة لإحضار أي وثيقة ورقية'
        : 'La plateforme permet le retrait électronique instantané des CDC, le dépôt scellé chiffré SHA-256 et la validation directe auprès des registres officiels sans support papier',
    },
    {
      q: isAr
        ? 'كيف تضمن المنصة سرية العروض المالية قبل جلسة الفتح العلنية؟'
        : 'Comment est garantie la confidentialité des offres financières ?',
      a: isAr
        ? 'تُشفر الأظرفة المالية فور إيداعها بمفاتيح تشفير غير متماثلة وأقفال زمنية تمنع كشف الأسعار أو التعديل عليها، ويستحيل فتحها أو فك تشفيرها حتى من قبل مسؤولي المنظومة، إلا بحضور النصاب القانوني لأعضاء لجنة الفتح وإدخال المفاتيح المشتركة في التوقيت الرسمي للجلسة'
        : 'Les plis financiers sont scellés cryptographiquement dès soumission avec verrou temporel. Leur ouverture requiert le quorum légal de la commission lors de la séance officielle',
    },
    {
      q: isAr
        ? 'هل يملك الذكاء الاصطناعي أي صلاحية لإقصاء المتعهدين أو منح الصفقات؟'
        : 'L’Intelligence Artificielle a-t-elle un pouvoir décisionnel ou d’exclusion ?',
      a: isAr
        ? 'قطعاً لا. تنص المبادئ التأسيسية للمنظومة على أن الذكاء الاصطناعي أداة مساعدة ورقابية استشارية فقط. تقتصر مهامه على فحص الاكتمال وكشف الشبهات واقتراح التقييم الرياضي، بينما يظل القرار والمسؤولية حصرياً للجان فتح الأظرفة والتقييم (COPEM) والآمر بالصرف'
        : 'Absolument pas. L’IA est un outil consultatif d’assistance et d’audit. Les décisions et responsabilités demeurent exclusivement du ressort des commissions et ordonnateurs humains',
    },
    {
      q: isAr
        ? 'ما هي الحجية القانونية للتوقيع الإلكتروني والمحاضر الرقمية (القانون 15-04)؟'
        : 'Quelle est la force probante de la signature électronique (Loi 15-04) ?',
      a: isAr
        ? 'تعتمد المنصة منظومة توقيع رقمي ذات حجية ثبوتية وفق القانون رقم 15-04، حيث تُوقع كافة محاضر جلسات الفتح والتقييم وقرارات المنح المؤقت إلكترونياً مع ختم زمني رقمي مشفر موثق بالبصمة الإلكترونية SHA-256'
        : 'La plateforme intègre un dispositif de signature électronique à valeur probante (Loi 15-04), avec horodatage cryptographique SHA-256 pour l’ensemble des procès-verbaux et actes',
    },
    {
      q: isAr
        ? 'من يحق له التسجيل في منصة «صفقات ذكية»؟'
        : 'Qui peut s’inscrire sur la plateforme Safaqat Dhakia ?',
      a: isAr
        ? 'التسجيل متاح لكافة المصالح والهيئات المتعاقدة في الدولة (الوزارات، الولايات، البلديات، والمؤسسات العمومية)، ولجميع المتعاملين الاقتصاديين (شركات، مؤسسات مصغرة، مقاولون، ومكاتب دراسات) المسجلين في السجل التجاري الجزائري'
        : 'L’accès est ouvert à tous les acheteurs publics (ministères, wilayas, communes, établissements) et aux opérateurs économiques immatriculés au registre du commerce algérien',
    },
  ];

  return (
    <section id="faq" dir={dir} className="relative w-full bg-transparent py-16 sm:py-20 px-4 sm:px-6 overflow-hidden">
      <div className="relative max-w-[1200px] mx-auto">
        {/* رأس القسم */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200/80 bg-white/80 backdrop-blur-md text-emerald-800 text-xs sm:text-sm font-bold shadow-xs mb-4">
            <HelpCircle className="size-3.5 text-emerald-600" strokeWidth={2} />
            <span>{isAr ? 'النزاهة والشفافية' : 'Questions Fréquentes'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {isAr ? 'الأسئلة الشائعة وضمانات المنظومة' : 'Garanties et Questions Fréquentes'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'إجابات واضحة وموثوقة تؤكد الالتزام التام بأحكام القانون 23-12 والمرسوم الرئاسي 15-247'
              : 'Éclaircissements juridiques et techniques sur le fonctionnement souverain de la plateforme'}
          </p>
        </div>

        {/* قائمة الأسئلة التفاعلية (Accordion) */}
        <div className="max-w-[860px] mx-auto space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-2xs hover:border-emerald-300 transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full text-start p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-emerald-800 transition-colors cursor-pointer select-none"
                >
                  <span className="text-sm sm:text-base leading-snug">{faq.q}</span>
                  <div className={`size-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                    isOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 text-sm sm:text-base text-slate-600 leading-relaxed font-medium border-t border-slate-100 bg-slate-50/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default V3FAQSection;