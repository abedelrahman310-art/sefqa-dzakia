import { Link } from 'wouter';
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

      {/* ─── التذييل المؤسسي الداكن (خارج عد الأقسام الثمانية) ─── */}
      <footer className="relative bg-[#092E49] text-white" role="contentinfo">
        <div className="h-1 w-full flex" aria-hidden="true">
          <div className="w-1/2 bg-[#167354]" />
          <div className="w-1/2 bg-[#C83A42]" />
        </div>

        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 lg:gap-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-3 group" aria-label={`${t('landing.brand')} — الصفحة الرئيسية`}>
                <span className="size-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center group-hover:border-white/30 transition-colors">
                  <span className="size-2.5 rounded-full bg-[#7DD3AE]" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="text-lg font-black text-white leading-tight">{t('landing.brand')}</span>
                  <span className="text-[10px] font-bold text-white/50 tracking-wide">
                    المنظومة الرقمية للصفقات العمومية
                  </span>
                </span>
              </Link>

              <p className="mt-5 text-xs sm:text-sm leading-relaxed text-white/60 max-w-sm">
                مساحة مؤسسية جزائرية تربط المصالح المتعاقدة بالمتعاملين الاقتصاديين حول دورة صفقة واضحة وموثقة.
              </p>
              <p className="mt-4 text-[11px] text-white/45 leading-relaxed">
                تستند إلى القانون <span dir="ltr">23-12</span> والمرسوم الرئاسي <span dir="ltr">15-247</span>.
              </p>
            </div>

            <nav aria-label="أقسام المنصة">
              <h2 className="text-xs font-bold text-white mb-4">المنصة</h2>
              <ul className="space-y-2.5 m-0 p-0 list-none text-xs sm:text-sm">
                <li><a href="#portals" className="text-white/60 hover:text-white transition-colors">البوابات الثلاث</a></li>
                <li><a href="#features" className="text-white/60 hover:text-white transition-colors">حالة الميزات</a></li>
                <li><a href="#lifecycle" className="text-white/60 hover:text-white transition-colors">دورة الصفقة</a></li>
                <li><a href="#legal" className="text-white/60 hover:text-white transition-colors">الإطار القانوني</a></li>
                <li><a href="#trust-start" className="text-white/60 hover:text-white transition-colors">الضوابط والثقة</a></li>
              </ul>
            </nav>

            <nav aria-label="الحسابات">
              <h2 className="text-xs font-bold text-white mb-4">الحسابات</h2>
              <ul className="space-y-2.5 m-0 p-0 list-none text-xs sm:text-sm">
                <li><Link href="/login" className="text-white/60 hover:text-white transition-colors">تسجيل الدخول</Link></li>
                <li><Link href="/register/authority" className="text-white/60 hover:text-white transition-colors">حساب المصلحة المتعاقدة</Link></li>
                <li><Link href="/register/operator" className="text-white/60 hover:text-white transition-colors">حساب المتعامل الاقتصادي</Link></li>
                <li><a href="#faq" className="text-white/60 hover:text-white transition-colors">الأسئلة الشائعة</a></li>
              </ul>
            </nav>

            <nav aria-label="المرجعية والثقة">
              <h2 className="text-xs font-bold text-white mb-4">المرجعية</h2>
              <ul className="space-y-2.5 m-0 p-0 list-none text-xs sm:text-sm">
                <li><a href="#legal" className="text-white/60 hover:text-white transition-colors">القانون <span dir="ltr">23-12</span></a></li>
                <li><a href="#trust-start" className="text-white/60 hover:text-white transition-colors">المسؤولية والضوابط</a></li>
                <li><a href="#features" className="text-white/60 hover:text-white transition-colors">الشفافية التشغيلية</a></li>
                <li><a href="#top" className="text-white/60 hover:text-white transition-colors">العودة للأعلى ↑</a></li>
              </ul>
            </nav>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px] text-white/45">
            <span>{t('landing.footer.rights')}</span>
            <span>منصة الصفقات العمومية الذكية · الجزائر</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
