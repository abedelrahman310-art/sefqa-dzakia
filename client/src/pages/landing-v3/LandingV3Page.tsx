import React, { useEffect } from 'react';
import { useI18n } from '@/i18n';
import V3TopBanner from './components/V3TopBanner';
import V3Nav from './components/V3Nav';
import V3Hero from './components/V3Hero';
import V3QuickSearchSection from './components/V3QuickSearchSection';
import V3WhySafaqatSection from './components/V3WhySafaqatSection';
import V3WorkflowAndPortalsSection from './components/V3WorkflowAndPortalsSection';
import V3WorkspacesPreview from './components/V3WorkspacesPreview';
import V3AIToolsSection from './components/V3AIToolsSection';
import V3FAQSection from './components/V3FAQSection';
import V3ComplianceTrustSection from './components/V3ComplianceTrustSection';
import V3QrCodeCard from './components/V3QrCodeCard';
import V3Footer from './components/V3Footer';
import V3SectionDivider from './components/V3SectionDivider';

/**
 * صفحة الهبوط المعمارية الموحدة — منصة «صفقات ذكية»
 *
 * الهيكلية المعتمدة الشاملة:
 * 1. الشريط العلوي الرئاسي (V3TopBanner)
 * 2. شريط التنقل المعماري (V3Nav)
 * 3. قسم البطل والبطاقة الزجاجية السيادية المركزية (V3Hero)
 * 4. محرك البحث السريع والاستكشاف المباشر (V3QuickSearchSection)
 * 5. القسم 1: لماذا صفقات ذكية؟ (V3WhySafaqatSection)
 * 6. القسم 2: مسار الصفقة العمومية خطوة بخطوة (V3WorkflowSection)
 * 7. القسم 3: بوابات المنصة الثلاث (V3FivePortalsSection)
 * 8. القسم 4: المعاينة الحية للشاشات ولوحات التحكم (V3PlatformShowcaseSection)
 * 9. القسم 5: أدوات الذكاء الاصطناعي المساعد (V3AIToolsSection)
 * 10. القسم 6: الأسئلة الشائعة وضمانات المنظومة (V3FAQSection)
 * 11. القسم 7: الامتثال والثقة وبطاقة QR والدخول الموحد (V3ComplianceTrustSection)
 * 12. التذييل المؤسسي الراقي المعتمد (V3Footer)
 */
export function LandingV3Page() {
  const { lang, dir } = useI18n();

  useEffect(() => {
    document.title =
      lang === 'ar'
        ? 'صفقات ذكية — المنظومة الموحدة للصفقات العمومية'
        : 'Safaqat Dhakia — Plateforme Unifiée des Marchés Publics';
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
      className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden font-sans antialiased selection:bg-emerald-700 selection:text-white"
    >
      {/* تدرج علوي خفيف جداً يعطي إيحاء بالعمق دون إجهاد العين */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />

      {/* ─── الشريط العلوي الرئاسي ─── */}
      <V3TopBanner />

      {/* ─── شريط التنقل المعماري ─── */}
      <V3Nav />

      {/* ─── صلب الصفحة ─── */}
      <main id="main-content">
        {/* قسم البطل السيادي والبطاقة الزجاجية المركزية الطافية */}
        <V3Hero />

        {/* ─── الإضافة 2: محرك البحث السريع والاستكشاف الفوري ─── */}
        <V3QuickSearchSection />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-transparent" />

        {/* ─── القسم 1: لماذا صفقات ذكية؟ ─── */}
        <V3WhySafaqatSection />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-transparent" />

        {/* ─── القسم 2: مسار الإبرام الرقمي وبوابات المنظومة (مدمج وموحد) ─── */}
        <V3WorkflowAndPortalsSection />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-transparent" />

        {/* ─── الإضافة 3: المعاينة الحية لواجهات المنصة ─── */}
        <V3WorkspacesPreview />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-transparent" />

        {/* ─── القسم 3: أدوات الذكاء الاصطناعي ─── */}
        <V3AIToolsSection />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-transparent" />

        {/* ─── الإضافة 4: الأسئلة الشائعة وضمانات المنظومة ─── */}
        <V3FAQSection />

        {/* فاصل وطني سيادي مزدوج */}
        <V3SectionDivider bg="bg-transparent" />

        {/* ─── القسم 4: الامتثال والثقة وبطاقة QR وزر الدخول الموحد ─── */}
        <V3ComplianceTrustSection qrSlot={<V3QrCodeCard />} />

        {/* فاصل وطني سيادي ختامي قبل التذييل */}
        <V3SectionDivider bg="bg-transparent" />
      </main>

      {/* ─── التذييل المؤسسي الراقي المعتمد ─── */}
      <V3Footer />
    </div>
  );
}

export default LandingV3Page;