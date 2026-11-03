import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import { X } from 'lucide-react';

export const V3TopBanner: React.FC = () => {
  const { lang } = useI18n();
  const isAr = lang === 'ar';
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <aside
      aria-label={isAr ? 'الإعلان المؤسسي' : 'Bandeau institutionnel'}
      className="w-full bg-[#146ef5] text-white px-4 py-2 text-[13px] font-medium transition-all select-none"
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-[4px] bg-white/20 text-[10px] font-bold tracking-wider uppercase font-mono">
            {isAr ? 'القانون 23-12' : 'LOI 23-12'}
          </span>
          <span className="truncate">
            {isAr
              ? 'الجمهورية الجزائرية الديمقراطية الشعبية • المادة 67: التجريد المادي الكامل للصفقات العمومية 2026'
              : 'République Algérienne • Dématérialisation intégrale des marchés publics selon l’Article 67'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setClosed(true)}
          className="text-white/80 hover:text-white p-1 rounded-[4px] transition-colors cursor-pointer"
          aria-label={isAr ? 'إغلاق الإشعار' : 'Fermer le bandeau'}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </aside>
  );
};

export default V3TopBanner;
