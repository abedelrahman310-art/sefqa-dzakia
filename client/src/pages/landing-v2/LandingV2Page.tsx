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
import SectionDivider from './components/SectionDivider';

/**
 * صفحة الهبوط السيادية الموحدة لمنصة «صفقات ذكية» (Safaqat Dhakia).
 *
 * معمارية React نقية بالكامل مدعومة بـ Tailwind CSS، تلتزم بالهوية المؤسسية
 * للدولة الجزائرية (القانون 23-12، المادة 67: التجريد المادي، والمرسوم 15-247).
 * متوافقة مع القراءة العربية (RTL) مع دعم كامل للغة الفرنسية والتبديل الحي.
 */
export function LandingV2Page() {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

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

      {/* 3. قسم البطولة السيادي المطور وهوية صفقات ذكية بالإطار الملكي */}
      <main id="main-content">
        <HeroSovereign />

        {/* فاصل ملكي مذهب بين البطولة والبوابات */}
        <SectionDivider
          label={isAr ? 'البوابات السيادية الموحدة للجمهورية' : 'Portails Souverains Nationaux'}
        />

        {/* 4. البوابات السيادية الثلاث (المتعامل، المصلحة، الإدارة) */}
        <PortalsSection />

        {/* فاصل ملكي مذهب بين البوابات وترسانة الذكاء */}
        <SectionDivider
          label={isAr ? 'الترسانة التقنية والذكاء الاصطناعي السيادي' : 'Suite Technologique & IA'}
        />

        {/* 5. ترسانة الذكاء الاصطناعي السيادي (المراحل 1 إلى 4) */}
        <SmartSuiteSection />

        {/* فاصل ملكي مذهب بين الترسانة ومسار الصفقة */}
        <SectionDivider
          label={isAr ? 'دورة حياة الصفقة وفق القانون 23-12' : 'Cycle de Vie du Marché'}
        />

        {/* 6. دورة حياة الصفقة وفق القانون 23-12 (7 مراحل) */}
        <LifecycleGanttSection />

        {/* فاصل ملكي مذهب بين مسار الصفقة والرقابة والامتثال */}
        <SectionDivider
          label={isAr ? 'المرجعية الدستورية والرقابة والسيادة الرقمية' : 'Gouvernance & Conformité'}
        />

        {/* 7. الرقابة والامتثال والحماية القانونية والتشفير */}
        <GovernanceComplianceSection />
      </main>

      {/* 8. التذييل المؤسسي الشامل */}
      <LandingFooter />
    </div>
  );
}

export default LandingV2Page;
