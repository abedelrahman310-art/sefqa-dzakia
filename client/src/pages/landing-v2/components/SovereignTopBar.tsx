import React from 'react';
import { useI18n } from '@/i18n';
import { ShieldCheck, FileText, Lock } from 'lucide-react';

export const SovereignTopBar: React.FC = () => {
  const { lang } = useI18n();
  const isAr = lang === 'ar';

  return (
    <div className="w-full bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-2 px-4 sm:px-6 relative z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* الجمهورية الجزائرية الديمقراطية الشعبية */}
        <div className="flex items-center gap-2.5">
          {/* الرمز الوطني: ألوان العلم الجزائري */}
          <div className="flex items-center gap-0.5" aria-hidden="true">
            <span className="w-2.5 h-3.5 bg-emerald-600 rounded-sm inline-block shadow-sm" />
            <span className="w-2.5 h-3.5 bg-white rounded-sm inline-block shadow-sm" />
            <span className="w-2.5 h-3.5 bg-rose-600 rounded-sm inline-block shadow-sm" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide text-white">
              {isAr ? 'الجمهورية الجزائرية الديمقراطية الشعبية' : 'République Algérienne Démocratique et Populaire'}
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-300 font-medium">
              {isAr ? 'المنظومة الوطنية الموحدة للصفقات العمومية' : 'Système National Unifié des Marchés Publics'}
            </span>
          </div>
        </div>

        {/* المرجعيات القانونية والأمان السيادي */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700/60 transition-colors">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'القانون 23-12 (المادة 67: التجريد المادي)' : 'Loi 23-12 (Art. 67 Dématérialisation)'}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'المرسوم الرئاسي 15-247' : 'Décret Présidentiel 15-247'}</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-emerald-400 font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>AES-256 + SHA-256</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SovereignTopBar;
