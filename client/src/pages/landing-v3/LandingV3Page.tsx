import React, { useEffect } from 'react';
import { useI18n } from '@/i18n';
import V3TopBanner from './components/V3TopBanner';
import V3Nav from './components/V3Nav';
import V3Hero from './components/V3Hero';
import V3WhySafaqatSection from './components/V3WhySafaqatSection';
import V3FivePortalsSection from './components/V3FivePortalsSection';
import V3AIToolsSection from './components/V3AIToolsSection';
import V3ComplianceTrustSection from './components/V3ComplianceTrustSection';
import V3Footer from './components/V3Footer';
import V3SectionDivider from './components/V3SectionDivider';

/**
 * صفحة الهبوط الوطنية المعمارية الموحدة — منصة «صفقات ذكية»
 *
 * الهيكلية المعتمدة بدقة:
 * 1. الشريط العلوي الرئاسي (V3TopBanner)
 * 2. شريط التنقل المعماري (V3Nav)
 * 3. قسم البطل والبطاقة الزجاجية السيادية المركزية (V3Hero) - دون أي مساس
 * 4. القسم 1: لماذا صفقات ذكية؟ (V3WhySafaqatSection)
 * 5. القسم 2: البوابات الخمس (V3FivePortalsSection)
 * 6. القسم 3: أدوات الذكاء الاصطناعي (V3AIToolsSection)
 * 7. القسم 4: الامتثال والثقة (V3ComplianceTrustSection) مع بطاقة مشروع مبتكر وزر الدخول الموحد
 * 8. التذييل المؤسسي الراقي المعتمد (V3Footer) - دون أي مساس
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
      {/* ─── الشريط العلوي الرئاسي ─── */}
      <V3TopBanner />

      {/* ─── شريط التنقل المعماري ─── */}
      <V3Nav />

      {/* ─── صلب الصفحة ─── */}
      <main id="main-content">
        {/* قسم البطل السيادي والبطاقة الزجاجية المركزية الطافية (دون أي تعديل) */}
        <V3Hero />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#ffffff]" />

        {/* ─── بداية القسم 1: لماذا صفقات ذكية؟ ─── */}
        <V3WhySafaqatSection />
        {/* ─── نهاية القسم 1: لماذا صفقات ذكية؟ ─── */}

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#f8fafc]" />

        {/* ─── بداية القسم 2: البوابات الخمس ─── */}
        <V3FivePortalsSection />
        {/* ─── نهاية القسم 2: البوابات الخمس ─── */}

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#ffffff]" />

        {/* ─── بداية القسم 3: أدوات الذكاء الاصطناعي ─── */}
        <V3AIToolsSection />
        {/* ─── نهاية القسم 3: أدوات الذكاء الاصطناعي ─── */}

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-[#f8fafc]" />

        {/* ─── بداية القسم 4: الامتثال والثقة ─── */}
        <V3ComplianceTrustSection />
        {/* ─── نهاية القسم 4: الامتثال والثقة ─── */}

        {/* فاصل وطني سيادي ختامي قبل التذييل */}
        <V3SectionDivider bg="bg-[#ffffff]" />
      </main>

      {/* ─── التذييل المؤسسي الراقي المعتمد (دون أي تعديل) ─── */}
      <V3Footer />
    </div>
  );
}

export default LandingV3Page;
