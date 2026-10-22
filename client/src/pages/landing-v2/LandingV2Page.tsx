import { useI18n } from '@/i18n';
import './landing-v2.css';

import { LandingHeader } from './components/LandingHeader';
import { V2Hero } from './components/V2Hero';
import { V2Problem } from './components/V2Problem';
import { V2Solution } from './components/V2Solution';
import { V2Portals } from './components/V2Portals';
import { V2Legal } from './components/V2Legal';
import { V2Features } from './components/V2Features';
import { V2Lifecycle } from './components/V2Lifecycle';
import { V2TrustStart } from './components/V2TrustStart';
import { SectionDivider } from './components/SectionHeader';

/* ============================================================
   صفحة هبوط صفقات ذكية — V2
   - 8 أقسام رئيسية متتالية بأسلوب Notion
   - الذكاء الاصطناعي في قلب دورة الصفقة
   - القسم 5 القانوني محمي بالكامل
   - الترويسة والتذييل خارج عد الأقسام الثمانية
   ============================================================ */

export function LandingV2Page() {
  const { t, dir } = useI18n();

  return (
    <div className="landing-v2 font-sans bg-white text-[#24352E]" dir={dir} id="top">
      {/* ─── الترويسة المؤسسية المنسقة (خارج عد الأقسام الثمانية) ─── */}
      <LandingHeader />

      {/* ─── المحتوى الرئيسي: 8 أقسام رئيسية فقط ─── */}
      <main id="main-content">
        {/* القسم 1: فكرة المنصة (Hero) */}
        <V2Hero />
        <SectionDivider />

        {/* القسم 2: المشكلة */}
        <V2Problem />
        <SectionDivider />

        {/* القسم 3: الحل */}
        <V2Solution />
        <SectionDivider />

        {/* القسم 4: البوابات */}
        <V2Portals />
        <SectionDivider />

        {/* القسم 5: الركائز القانونية (المحمي) */}
        <V2Legal />
        <SectionDivider />

        {/* القسم 6: الميزات المتاحة */}
        <V2Features />
        <SectionDivider />

        {/* القسم 7: دورة الصفقة بمساعدة الذكاء */}
        <V2Lifecycle />
        <SectionDivider />

        {/* القسم 8: البداية والثقة */}
        <V2TrustStart />
      </main>

      {/* ─── التذييل الخارجي (خارج عد الأقسام الثمانية) ─── */}
      <footer className="v2-footer" role="contentinfo">
        <div className="v2-container v2-footer-inner">
          <div className="flex items-center gap-3">
            <span className="v2-footer-brand">
              <span className="v2-brand-dot" aria-hidden="true" />
              {t('landing.brand')}
            </span>
            <span className="text-xs text-[#59665F]">· المنصة الذكية للصفقات العمومية</span>
          </div>

          <span className="v2-footer-sub text-xs text-[#59665F]">
            تستند إلى القانون 23-12 والمرسوم الرئاسي 15-247
          </span>

          <div className="flex items-center gap-4 text-xs text-[#59665F] mr-auto">
            <span>{t('landing.footer.rights')}</span>
            <a href="#top" className="text-[#167354] hover:underline font-bold">
              العودة للأعلى ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
