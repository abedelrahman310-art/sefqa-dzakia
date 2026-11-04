import React, { useState } from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import {
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  UserPlus,
} from 'lucide-react';

export const V3FAQSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: isAr
        ? 'كيف يكرس النظام مبدأ «صفر ورقة» بموجب المادة 67 من القانون 23-12؟'
        : 'Comment s’applique le principe Zéro Papier selon l’Article 67 ?',
      a: isAr
        ? 'تتيح المنصة سحب دفاتر الشروط إلكترونياً بصفة فورية، وإيداع الأظرفة التقنية والمالية مشفرة بختم AES-256، مع التحقق الآلي من الوثائق الجبائية والشبه جبائية عبر الربط البيني دون الحاجة لإحضار أي وثيقة ورقية.'
        : 'La plateforme permet le retrait électronique immédiat, le dépôt scellé chiffré AES-256 et la validation directe auprès des registres officiels sans support papier.',
    },
    {
      q: isAr
        ? 'هل يملك الذكاء الاصطناعي صلاحية إقصاء المتعهدين أو الإسناد؟'
        : 'L’Intelligence Artificielle a-t-elle un pouvoir décisionnel ?',
      a: isAr
        ? 'قطعاً لا. تنص المبادئ التأسيسية للمنظومة على أن الذكاء الاصطناعي أداة مساعدة ورقابية استشارية فقط. تقتصر مهامه على فحص الاكتمال وكشف البنود الإقصائية واقتراح التقييم الرياضي، بينما يظل القرار حصرياً للجان فتح الأظرفة والتقييم (COPEM).'
        : 'Absolument pas. L’IA est un outil d’audit et d’assistance purement consultatif. Les décisions finales relèvent de la compétence souveraine des commissions.',
    },
    {
      q: isAr
        ? 'كيف تضمن المنصة سرية العروض المالية قبل جلسة الفتح العلنية؟'
        : 'Comment est garantie la confidentialité des offres financières ?',
      a: isAr
        ? 'تُشفر الأظرفة المالية فور إيداعها بمفاتيح تشفير غير متماثلة (Asymmetric Encryption)، ويستحيل فتحها أو فك تشفيرها حتى من قبل مسؤولي المنظومة، إلا بحضور النصاب القانوني لأعضاء لجنة الفتح وإدخال المفاتيح المشتركة في التوقيت القانوني المحدد.'
        : 'Les plis sont scellés cryptographiquement dès soumission. Leur déchiffrement requiert la présence et la validation conjointe des membres de la commission.',
    },
    {
      q: isAr
        ? 'من يحق له التسجيل في منصة «صفقات ذكية»؟'
        : 'Qui peut s’inscrire sur la plateforme Safaqat Dhakia ?',
      a: isAr
        ? 'التسجيل متاح لكافة المصالح والهيئات المتعاقدة في الدولة (الوزارات، الولايات، البلديات، والمؤسسات العمومية)، ولجميع المتعاملين الاقتصاديين (شركات، مؤسسات مصغرة، مقاولون ذاتيون) المسجلين في السجل التجاري الجزائري.'
        : 'L’inscription est ouverte à tous les acheteurs publics (ministères, wilayas, communes) et aux opérateurs économiques immatriculés au registre du commerce algérien.',
    },
  ];

  return (
    <section id="faq" dir={dir} className="w-full bg-[#ffffff] py-14 sm:py-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Framed Short Section Title */}
        <div className="flex flex-col items-center justify-center text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs mb-2.5">
            <span className="size-2 rounded-full bg-emerald-600" />
            <span>{isAr ? 'النزاهة والشفافية' : 'Questions Fréquentes'}</span>
          </div>
          <div className="inline-block px-5 sm:px-7 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'الأسئلة الشائعة وضمانات المنظومة' : 'Garanties et Questions Fréquentes'}
            </h2>
          </div>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium">
            {isAr
              ? 'إجابات واضحة وموثوقة تؤكد الالتزام التام بأحكام القانون 23-12 والمرسوم الرئاسي 15-247.'
              : 'Éclaircissements juridiques et techniques sur le fonctionnement souverain de la plateforme.'}
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-[840px] mx-auto space-y-3.5 mb-14">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full text-start p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <div className="size-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                    {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed font-normal border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grand Sovereign CTA Box */}
        <div className="max-w-[960px] mx-auto rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/80 p-8 sm:p-12 text-center shadow-xs relative overflow-hidden">
          {/* Top National Ribbon Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex">
            <div className="w-1/2 bg-[#006233]" />
            <div className="w-1/2 bg-[#d21034]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs mb-4">
            <Logo size={20} />
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {isAr ? 'الجمهورية الجزائرية الديمقراطية الشعبية' : 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE'}
            </span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-[#0f3154] tracking-tight mb-3">
            {isAr ? 'انضم الآن إلى المنظومة الرقمية الموحدة' : 'Rejoignez la Plateforme Nationale'}
          </h3>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed mb-6 font-medium">
            {isAr
              ? 'بادر بإنشاء حساب مؤسستك أو مصلحتك المتعاقدة للاستفادة من مبدأ «صفر ورقة» والولوج الحر لكافة الصفقات العمومية.'
              : 'Créez votre compte certifié pour dématérialiser vos procédures et accéder à l’ensemble des marchés.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="size-4" />
              <span>{isAr ? 'فتح حساب جديد مجاناً' : 'Créer un compte'}</span>
              <ArrowIcon className="size-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
            >
              <span>{isAr ? 'تسجيل الدخول للمنظومة' : 'Connexion'}</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default V3FAQSection;
