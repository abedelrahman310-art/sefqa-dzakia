import React from 'react';

interface SectionDividerProps {
  label?: string;
  className?: string;
}

/**
 * خط فاصل ملكي فاخر يفصل بين أقسام صفحة الهبوط
 * يحتوي على خطوط متدرجة ذهبية وزمردية مع ختم سيادي مركزي أنيق.
 */
export const SectionDivider: React.FC<SectionDividerProps> = ({ label, className = '' }) => {
  return (
    <div
      className={`relative w-full py-6 sm:py-8 flex items-center justify-center overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* الخط التدرجي الذهبي الزمردي الخلفي */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-emerald-600/25 via-amber-400/40 via-emerald-600/25 to-transparent" />
      </div>

      {/* الختم الزخرفي المركزي الملكي */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-1.5 rounded-full bg-white/95 border border-amber-300/70 shadow-xs backdrop-blur-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-2xs" />
        <span className="w-1 h-1 rounded-full bg-amber-500" />
        <span className="text-[11px] font-bold text-slate-700 tracking-wider font-cairo">
          {label || 'الجمهورية الجزائرية الديمقراطية الشعبية'}
        </span>
        <span className="w-1 h-1 rounded-full bg-amber-500" />
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shadow-2xs" />
      </div>
    </div>
  );
};

export default SectionDivider;
