import React from 'react';
import Logo from '@/components/ui/Logo';

interface V3SectionDividerProps {
  bg?: string;
  className?: string;
}

export const V3SectionDivider: React.FC<V3SectionDividerProps> = ({
  bg = 'bg-[#ffffff]',
  className = '',
}) => {
  return (
    <div
      role="separator"
      aria-label="فاصل الأقسام الوطني"
      className={`relative w-full ${bg} py-5 sm:py-7 flex items-center justify-center select-none overflow-hidden ${className}`}
    >
      <style>{`
        @keyframes logo-floating {
          0%, 100% {
            transform: translateY(-5px) scale(1);
          }
          50% {
            transform: translateY(5px) scale(1.05);
          }
        }
        @keyframes aura-pulse {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.92);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.12);
          }
        }
      `}</style>

      {/* الخطان المتوازيان: الأخضر في الأعلى والأحمر في الأسفل */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full flex flex-col justify-center items-center pointer-events-none">
        {/* الخط الأخضر المتوازي الأول (الأخضر الجزائري) */}
        <div className="w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#006233] to-transparent opacity-95 shadow-2xs" />
        
        {/* مسافة فاصلة متوازية دقيقة بين الخطين */}
        <div className="h-[7px]" />

        {/* الخط الأحمر المتوازي الثاني (الأحمر القاني الجزائري) */}
        <div className="w-full h-[2.5px] bg-gradient-to-r from-transparent via-[#d21034] to-transparent opacity-95 shadow-2xs" />
      </div>

      {/* شعار المنصة المتحرك في المركز */}
      <div
        className="relative z-10 flex items-center justify-center"
        style={{ animation: 'logo-floating 3.2s ease-in-out infinite' }}
      >
        {/* توهج وطني خلف الشعار */}
        <div
          className="absolute size-14 sm:size-16 rounded-full bg-gradient-to-r from-[#006233]/30 via-white to-[#d21034]/30 blur-md pointer-events-none"
          style={{ animation: 'aura-pulse 3.2s ease-in-out infinite' }}
        />

        {/* وسام دائري أنيق يحتضن الشعار */}
        <div className="relative size-12 sm:size-14 rounded-full bg-white border-2 border-slate-200/90 shadow-lg flex items-center justify-center p-2 hover:scale-110 transition-transform duration-300">
          {/* إطار جانبي رقيق */}
          <div className="absolute inset-0 rounded-full border border-emerald-400/40 pointer-events-none" />
          
          {/* شعار المنصة ثلاثي الأبعاد بالألوان الوطنية */}
          <div className="size-8 sm:size-9 flex items-center justify-center">
            <Logo size={32} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default V3SectionDivider;
