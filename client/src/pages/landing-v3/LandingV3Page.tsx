import React, { useEffect } from 'react';
import { useI18n } from '@/i18n';
import V3TopBanner from './components/V3TopBanner';
import V3Nav from './components/V3Nav';
import V3Hero from './components/V3Hero';
import V3BrowserMockup from './components/V3BrowserMockup';
import V3SplitFeature from './components/V3SplitFeature';
import V3LifecycleProcess from './components/V3LifecycleProcess';
import V3GovernanceSection from './components/V3GovernanceSection';
import V3Footer from './components/V3Footer';

/**
 * صفحة الهبوط التجريبية المعمارية V3 (Webflow Style Reference)
 *
 * تصميم استوديو فائق النقاء:
 * - قماش أبيض نقي (#ffffff)، نصوص حبرية سوداء (#080808)، وعلامة زرقاء واحدة (#146ef5).
 * - زوايا 4px للأزرار وحقول الإدخال، و8px للبطاقات والحاويات.
 * - خطوط شعرية فاصلة دقيقة 1px (#d8d8d8) ومسافات تنفس رأسية رحبة (80px).
 * - إطار متصفح واقعي (Browser-Frame Mockup) لعرض وثيقة الصفقة الحية.
 */
export function LandingV3Page() {
  const { lang, dir } = useI18n();

  useEffect(() => {
    document.title =
      lang === 'ar'
        ? 'صفقات ذكية (V3 Studio) — المنظومة الوطنية الموحدة للصفقات العمومية'
        : 'Safaqat Dhakia (V3 Studio) — Plateforme des Marchés Publics';
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
      className="min-h-screen bg-[#ffffff] text-[#080808] font-sans antialiased selection:bg-[#146ef5] selection:text-white"
    >
      {/* 1. الشريط العلوي الترويجي ومقارنة النسخ */}
      <V3TopBanner />

      {/* 2. شريط التنقل المعماري بنمط Webflow Studio */}
      <V3Nav />

      {/* 3. صلب الصفحة */}
      <main id="main-content">
        {/* قسم البطولة والعناوين المعمارية وشبكة الخيارات الثلاثة */}
        <V3Hero />

        {/* إطار المتصفح الواقعي (Browser-Frame Mockup) والصفقة المشفرة الحية */}
        <V3BrowserMockup />

        {/* ترسانة الذكاء الاصطناعي بنمط العرض المزدوج والروابط المتفاعلة */}
        <V3SplitFeature />

        {/* مسار حياة الصفقة وفق القانون 23-12 (7 مراحل بتوزيع رباعي) */}
        <V3LifecycleProcess />

        {/* شبكة الامتثال والركائز الدستورية الست */}
        <V3GovernanceSection />
      </main>

      {/* 4. تذييل الصفحة الداكن الفخم */}
      <V3Footer />
    </div>
  );
}

export default LandingV3Page;
