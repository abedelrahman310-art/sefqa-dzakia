import { useState } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import AlgeriaMap from '../assets/AlgeriaMap';

const WILAYA_TRANSLATIONS: Record<string, { nameAr: string; nameFr: string }> = {
  Alger: { nameAr: 'ولاية الجزائر', nameFr: 'Alger' },
  Oran: { nameAr: 'ولاية وهران', nameFr: 'Oran' },
  Constantine: { nameAr: 'ولاية قسنطينة', nameFr: 'Constantine' },
  Annaba: { nameAr: 'ولاية عنابة', nameFr: 'Annaba' },
  Setif: { nameAr: 'ولاية سطيف', nameFr: 'Sétif' },
  'Sétif': { nameAr: 'ولاية سطيف', nameFr: 'Sétif' },
  Blida: { nameAr: 'ولاية البليدة', nameFr: 'Blida' },
  Tlemcen: { nameAr: 'ولاية تلمسان', nameFr: 'Tlemcen' },
  Batna: { nameAr: 'ولاية باتنة', nameFr: 'Batna' },
  Bejaia: { nameAr: 'ولاية بجاية', nameFr: 'Béjaïa' },
  'Béjaïa': { nameAr: 'ولاية بجاية', nameFr: 'Béjaïa' },
  Ouargla: { nameAr: 'ولاية ورقلة', nameFr: 'Ouargla' },
};

interface HeroSectionProps {
  onStartClick?: () => void;
}

export function HeroSection({ onStartClick }: HeroSectionProps) {
  const [, setLocation] = useLocation();
  const { t, lang, dir } = useI18n();

  // Active / Selected wilaya displayed in top pill
  const [activeWilaya, setActiveWilaya] = useState({
    nameAr: 'ولاية الجزائر',
    nameFr: 'Alger',
    deals: 234,
  });

  const handleStart = () => {
    if (onStartClick) {
      onStartClick();
    } else {
      setLocation('/login');
    }
  };

  return (
    <section
      id="hero"
      dir={dir}
      className="hero-official-section w-full py-8 sm:py-10 lg:py-12 px-6 sm:px-12 bg-[var(--paper-50)] text-start relative select-none"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Right Column (5 cols): Institutional Text, CTAs & Compliance Badges */}
          <div className="lg:col-span-5 flex flex-col items-start hero-fade-in z-10">
            
            {/* Top Official National Ribbon */}
            <div className="hero-badge-ribbon mb-3 sm:mb-4">
              <span>{t('landing.hero.republic_badge')}</span>
            </div>

            {/* Main Institutional Headline (h1) */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[var(--ink-900)] tracking-tight leading-[1.15] mb-3 sm:mb-4">
              {t('landing.hero.title')}
            </h1>

            {/* Explanatory Paragraph */}
            <p className="text-base sm:text-lg text-[var(--ink-700)] leading-[1.7] max-w-xl mb-6 sm:mb-8">
              {t('landing.hero.description')}
            </p>

            {/* Action CTAs: Primary and Secondary */}
            <div className="flex flex-wrap items-center gap-4 mb-6 sm:mb-8 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleStart}
                style={{ backgroundColor: 'var(--stamp-green-700)', color: '#ffffff' }}
                className="hero-btn-primary cursor-pointer w-full sm:w-auto shadow-xs text-white font-semibold"
                aria-label={t('landing.hero.cta_start')}
              >
                <span style={{ color: '#ffffff' }} className="text-white font-semibold">{t('landing.hero.cta_start')}</span>
              </button>

              <a
                href="#journey"
                className="hero-btn-secondary cursor-pointer w-full sm:w-auto text-center font-semibold"
                aria-label={t('landing.hero.cta_how_it_works')}
              >
                <span>{t('landing.hero.cta_how_it_works')}</span>
              </a>
            </div>

            {/* Bottom Official Trust & Integrity Badges */}
            <div className="w-full flex flex-wrap items-center gap-6 pt-5 border-t border-[var(--ink-100)] text-xs text-[var(--ink-700)] font-medium">
              <div className="inline-flex items-center gap-2">
                <span className="text-base" aria-hidden="true">⚖️</span>
                <span>{t('landing.hero.badge_law')}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="text-base" aria-hidden="true">🛡️</span>
                <span>{t('landing.hero.badge_sha')}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="text-base" aria-hidden="true">🤖</span>
                <span>{t('landing.hero.badge_ai')}</span>
              </div>
            </div>

          </div>

          {/* Left Column (7 cols): Interactive National Mesh Map & Tabular Stats */}
          <div className="lg:col-span-7 w-full hero-fade-in z-10">
            {/* Map Frame */}
            <div className="hero-map-frame p-4 sm:p-6 w-full flex flex-col justify-between rounded-[4px]">
              
              {/* Map Header with Dynamic Tooltip Pill */}
              <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-[var(--ink-100)] text-xs">
                <span className="text-[var(--ink-500)] font-medium font-sans">
                  {lang === 'ar' ? 'التغطية الجغرافية للصفقات' : 'Couverture territoriale des marchés'}
                </span>
                
                {/* Active / Hovered Wilaya Tooltip Pill */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[var(--paper-50)] border border-[var(--ink-100)] text-[var(--ink-900)] font-semibold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[var(--stamp-gold-500)]" aria-hidden="true" />
                  <span className="font-sans">
                    {lang === 'ar' ? activeWilaya.nameAr : activeWilaya.nameFr}
                  </span>
                  <span className="text-[var(--ink-500)] font-mono tabular-nums">
                    ({activeWilaya.deals} {lang === 'ar' ? 'صفقة' : 'marchés'})
                  </span>
                </span>
              </div>

              {/* Vector Algeria 58-Wilaya Map */}
              <div className="relative w-full h-[380px] sm:h-[430px] lg:h-[470px] max-h-[65vh] mx-auto flex items-center justify-center py-2 overflow-visible">
                <AlgeriaMap
                  height="100%"
                  width="100%"
                  onWilayaClick={(wilaya, value) => {
                    const trans = WILAYA_TRANSLATIONS[wilaya] || { nameAr: `ولاية ${wilaya}`, nameFr: wilaya };
                    setActiveWilaya({
                      nameAr: trans.nameAr,
                      nameFr: trans.nameFr,
                      deals: typeof value === 'number' ? value : Number(value) || 15,
                    });
                  }}
                />
              </div>

            </div>

            {/* Tabular Stats Grid (font-mono, tabular-nums) — Below the Map Frame */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-5">
              
              {/* Stat 1: 58 ولاية */}
              <div className="hero-stat-box text-center py-3 px-3 sm:px-4">
                <span className="block font-mono tabular-nums text-lg sm:text-2xl font-bold text-[var(--ink-900)]">
                  58
                </span>
                <span className="block text-[11px] sm:text-xs text-[var(--ink-500)] font-medium mt-0.5">
                  {t('landing.hero.stat_wilayas')}
                </span>
              </div>

              {/* Stat 2: 1,248 صفقة نشطة */}
              <div className="hero-stat-box text-center py-3 px-3 sm:px-4">
                <span className="block font-mono tabular-nums text-lg sm:text-2xl font-bold text-[var(--ink-900)]">
                  1,248
                </span>
                <span className="block text-[11px] sm:text-xs text-[var(--ink-500)] font-medium mt-0.5">
                  {t('landing.hero.stat_tenders')}
                </span>
              </div>

              {/* Stat 3: 45.6 مليار دج */}
              <div className="hero-stat-box text-center py-3 px-3 sm:px-4">
                <span className="block font-mono tabular-nums text-lg sm:text-2xl font-bold text-[var(--ink-900)]">
                  45.6
                </span>
                <span className="block text-[11px] sm:text-xs text-[var(--ink-500)] font-medium mt-0.5">
                  {t('landing.hero.stat_amount')}
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
