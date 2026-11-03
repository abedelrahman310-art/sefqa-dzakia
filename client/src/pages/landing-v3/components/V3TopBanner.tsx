import React from 'react';
import { useI18n } from '@/i18n';
import { ArrowLeft, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Link } from 'wouter';

export const V3TopBanner: React.FC = () => {
  const { lang } = useI18n();
  const isAr = lang === 'ar';

  return (
    <aside
      aria-label={isAr ? 'إشعار النسخة المعمارية' : 'Bandeau architectural'}
      className="w-full bg-[#146ef5] text-white px-4 py-2 text-[13px] font-medium transition-all select-none"
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-[4px] bg-white/20 text-[10px] font-bold tracking-wider uppercase font-mono">
            {isAr ? 'معمارية V3' : 'V3 STUDIO'}
          </span>
          <span className="truncate">
            {isAr
              ? 'النسخة المعمارية المستقلة بنمط Webflow Studio — قماش أبيض، حبر داكن، وعلامة تقنية واحدة'
              : 'Édition architecturale Webflow Studio — Toile blanche, encre noire et accent bleu précis'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <Link
            href="/landing-v2"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            <SlidersHorizontal className="size-3" />
            <span>{isAr ? 'معاينة النسخة الملكية V2' : 'Comparer avec V2'}</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default V3TopBanner;
