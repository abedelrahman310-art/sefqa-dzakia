import React, { useEffect } from 'react';
import { useI18n } from '@/i18n';
import SovereignTopBar from './components/SovereignTopBar';
import LandingHeader from './components/LandingHeader';
import HeroSovereign from './components/HeroSovereign';
import PortalsSection from './components/PortalsSection';
import SmartSuiteSection from './components/SmartSuiteSection';
import LifecycleGanttSection from './components/LifecycleGanttSection';
import GovernanceComplianceSection from './components/GovernanceComplianceSection';
import LandingFooter from './components/LandingFooter';

/**
 * صفحة الهبوط السيادية الموحدة لمنصة «صفقات ذكية» (Safaqat Dhakia).
 *
 * معمارية React نقية بالكامل مدعومة بـ Tailwind CSS، تلتزم بالهوية المؤسسية
 * للدولة الجزائرية (القانون 23-12، المادة 67: التجريد المادي، والمرسوم 15-247).
 * متوافقة مع القراءة العربية (RTL) مع دعم كامل للغة الفرنسية والتبديل الحي.
 */
export function LandingV2Page() {
  const { lang, dir, t } = useI18n();

  useEffect(() => {
    document.title =
      lang === 'ar'
        ? 'صفقات ذكية — المنظومة الوطنية الموحدة للصفقات العمومية'
        : 'Safaqat Dhakia — Plateforme Nationale des Marchés Publics';
  }, [lang]);

  // دعم التمرير السلس للروابط المرساة (Anchor links)
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
      className="min-h-screen bg-white text-slate-900 font-cairo antialiased selection:bg-emerald-600 selection:text-white"
    >
      {/* 1. شريط السيادة الوطنية والجمهورية */}
      <SovereignTopBar />

      {/* 2. الترويسة الرئيسية وشريط التنقل */}
      <LandingHeader />

      {/* 3. قسم البطولة السيادي المطور وهوية صفقات ذكية */}
      <main id="main-content">
        <HeroSovereign />

        {/* 4. البوابات السيادية الثلاث (المتعامل، المصلحة، الإدارة) */}
        <PortalsSection />

        {/* 5. ترسانة الذكاء الاصطناعي السيادي (المراحل 1 إلى 4) */}
        <SmartSuiteSection />

        {/* 6. دورة حياة الصفقة وفق القانون 23-12 (7 مراحل) */}
        <LifecycleGanttSection />

        {/* 7. الرقابة والامتثال والحماية القانونية والتشفير */}
        <GovernanceComplianceSection />
      </main>

      {/* 8. التذييل المؤسسي الشامل */}
      <LandingFooter />
    </div>
  );
}

export default LandingV2Page;
