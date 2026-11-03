import React from 'react';
import Logo from '@/components/ui/Logo';

interface V3SectionDividerProps {
  bg?: string;
  className?: string;
}

/**
 * V3SectionDivider — فاصل الأقسام الوطني كقفل موحّد (lockup):
 * الخطان المتوازيان (الأخضر #006233 فوق والأحمر #d21034 تحت) ينبثقان من جانبي
 * وسام الشعار على ارتفاع الحزام نفسه — صلبان عند نقطة اللقاء بالوسام ويتلاشيان
 * نحو حافتي الصفحة، وحلقة الوسام تُكمل الخطّين لفّاً (قوس أخضر أعلى وقوس أحمر أسفل).
 */
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
            transform: translateY(-2px);
          }
          50% {
            transform: translateY(2px);
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

      {/* القفل الموحّد: خط ← وسام ← خط */}
      <div className="relative z-10 w-full flex items-center justify-center pointer-events-none">
        {/* الشريحة اليسرى: خطان متوازيان يصلبان عند الوسام ويتلاشيان نحو الحافة */}
        <div className="flex flex-col justify-center items-stretch flex-1 min-w-0">
          <div className="w-full h-[2.5px] bg-gradient-to-l from-[#006233] via-[#006233]/80 to-transparent opacity-95 shadow-2xs rounded-full" />
          <div className="h-[7px]" />
          <div className="w-full h-[2.5px] bg-gradient-to-l from-[#d21034] via-[#d21034]/80 to-transparent opacity-95 shadow-2xs rounded-full" />
        </div>

        {/* وسام الشعار المدموج في الحزام */}
        <div
          className="relative z-10 flex items-center justify-center mx-5 sm:mx-7"
          style={{ animation: 'logo-floating 3.2s ease-in-out infinite' }}
        >
          {/* توهج وطني خلف الشعار عند نقطة الدمج */}
          <div
            className="absolute size-14 sm:size-16 rounded-full bg-gradient-to-r from-[#006233]/30 via-white to-[#d21034]/30 blur-md pointer-events-none"
            style={{ animation: 'aura-pulse 3.2s ease-in-out infinite' }}
          />

          {/* قرص الوسام: حلقة تبدأ خضراء من الأعلى وتقفل حمراء من الأسفل */}
          <div className="relative size-12 sm:size-14 rounded-full bg-white border-2 border-[#d8d8d8] shadow-lg flex items-center justify-center p-2 hover:scale-110 transition-transform duration-300">
            {/* الحلقة الوطنية المكمّلة للخطّين */}
            <div className="absolute inset-0 rounded-full border-2 border-l-transparent border-r-transparent border-t-[#006233]/60 border-b-[#d21034]/60 pointer-events-none" />

            {/* شعار المنصة */}
            <div className="size-8 sm:size-9 flex items-center justify-center">
              <Logo size={32} />
            </div>
          </div>
        </div>

        {/* الشريحة اليمنى: خطان متوازيان يصلبان عند الوسام ويتلاشيان نحو الحافة */}
        <div className="flex flex-col justify-center items-stretch flex-1 min-w-0">
          <div className="w-full h-[2.5px] bg-gradient-to-r from-[#006233] via-[#006233]/80 to-transparent opacity-95 shadow-2xs rounded-full" />
          <div className="h-[7px]" />
          <div className="w-full h-[2.5px] bg-gradient-to-r from-[#d21034] via-[#d21034]/80 to-transparent opacity-95 shadow-2xs rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default V3SectionDivider;
