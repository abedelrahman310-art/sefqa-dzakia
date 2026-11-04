import React, { useEffect } from 'react';
import { useI18n } from '@/i18n';
import V3TopBanner from './components/V3TopBanner';
import V3Nav from './components/V3Nav';
import V3Hero from './components/V3Hero';
import V3PortalsSection from './components/V3PortalsSection';
import V3BrowserMockup from './components/V3BrowserMockup';
import V3LifecycleProcess from './components/V3LifecycleProcess';
import V3SplitFeature from './components/V3SplitFeature';
import V3GovernanceSection from './components/V3GovernanceSection';
import V3InteroperabilitySection from './components/V3InteroperabilitySection';
import V3FAQSection from './components/V3FAQSection';
import V3Footer from './components/V3Footer';
import V3SectionDivider from './components/V3SectionDivider';

/**
 * صفحة الهبوط الوطنية المعمارية الموحدة (Safaqat Dzakia Landing Page)
 *
 * تصميم GovTech سيادي ناصع البياض (#ffffff):
 * - 8 أقسام متكاملة مفصولة بخطين وطنيين (أخضر وأحمر) يتوسطهما شعار المنصة المدمج.
 * - اسم المنصة داخل بطاقة زجاجية فاخرة طافية (Frosted Glassmorphic Card).
 * - عناوين الأقسام مؤطرة وقصيرة وخالية من النصوص الدقيقة.
 * - الحفاظ على التذييل المؤسسي الحالي وتعزيز الهوية الوطنية السيادية.
 */
export function LandingV3Page() {
  const { lang, dir } = useI18n();

  useEffect(() => {
    document.title =
      lang === 'ar'
        ? 'صفقات ذكية — المنظومة الوطنية الموحدة للصفقات العمومية'
        : 'Safaqat Dhakia — Plateforme Nationale des Marchés Publics';
  }, [lang]);

  // دعم التمرير السلس للروابط
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('hashchange', handleHashScroll);
    if (window.location.hash) {
      setTimeout(handleHashScroll, 100);
    }

    return () => {
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, []);

  return (
    <div
      dir={dir}
      lang={lang}
      className="min-h-screen bg-[#ffffff] text-[#080808] font-sans antialiased selection:bg-[#006233] selection:text-white"
    >
      {/* الشريط العلوي الإرشادي */}
      <V3TopBanner />

      {/* شريط التنقل المعماري */}
      <V3Nav />

      {/* صلب الصفحة بـ 8 أقسام متكاملة ومفصولة بخطي العلم الوطني مع الشعار */}
      <main id="main-content">
        {/* القسم 1: قسم البطولة والبطاقة الزجاجية السيادية لاسم المنصة */}
        <V3Hero />

        {/* فاصل وطني سيادي مزدوج (خط أخضر وخط أحمر يتوسطهما الشعار) */}
        <V3SectionDivider bg="bg-[#ffffff]" />

        {/* القسم 2: بوابات المنظومة الثلاث المترابطة */}
        <V3PortalsSection />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#ffffff]" />

        {/* القسم 3: المعمل الرقمي والصفقة المشفرة الحية */}
        <V3BrowserMockup />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#ffffff]" />

        {/* القسم 4: دورة حياة الصفقة القانونية الموحدة (7 مراحل تشريعية) */}
        <V3LifecycleProcess />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#ffffff]" />

        {/* القسم 5: ترسانة الذكاء الاصطناعي الرقابي والاستشاري */}
        <V3SplitFeature />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#ffffff]" />

        {/* القسم 6: الركائز القانونية والسيادية للجمهورية */}
        <V3GovernanceSection />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#ffffff]" />

        {/* القسم 7: الربط البيني الحكومي والتغطية الوطنية للـ 58 ولاية */}
        <V3InteroperabilitySection />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#ffffff]" />

        {/* القسم 8: الأسئلة الشائعة، مركز النزاهة والدعوة المباشرة للانضمام */}
        <V3FAQSection />

        {/* فاصل وطني سيادي ختامي قبل التذييل */}
        <V3SectionDivider bg="bg-[#ffffff]" />
      </main>

      {/* التذييل المؤسسي الراقي المعتمد */}
      <V3Footer />
    </div>
  );
}

export default LandingV3Page;
