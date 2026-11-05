import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';

export interface LiveClockProps {
  className?: string;
  showSeconds?: boolean;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export function LiveClock({
  className = '',
  showSeconds = false,
  variant = 'dark',
  size = 'md',
}: LiveClockProps) {
  const { lang } = useI18n();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // تنسيق التاريخ بتوقيت الجزائر الرسمي (Africa/Algiers · UTC+1)
  const dateLocale = lang === 'ar' ? 'ar-DZ' : 'fr-DZ';
  const rawDate = new Intl.DateTimeFormat(dateLocale, {
    timeZone: 'Africa/Algiers',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(time);

  // إزالة الفواصل والنقاط ليكون النص متناسقاً تماماً مع تصميم شاشة القفل (e.g. الخميس 5 نوفمبر / Jeu 5 nov)
  const formattedDate = rawDate.replace(/،|,|\./g, '').trim();

  // تنسيق الوقت بتوقيت الجزائر (24 ساعة)
  const formatter = new Intl.DateTimeFormat('fr-DZ', {
    timeZone: 'Africa/Algiers',
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: false,
  });

  const parts = formatter.formatToParts(time);
  const hours = parts.find((p) => p.type === 'hour')?.value || '00';
  const minutes = parts.find((p) => p.type === 'minute')?.value || '00';
  const seconds = parts.find((p) => p.type === 'second')?.value || '00';

  const isDark = variant === 'dark';

  // المقاسات
  const sizeClasses = {
    sm: 'h-8 px-2 py-0.5',
    md: 'h-10 px-3 py-1',
    lg: 'h-14 px-4 py-1.5',
  }[size];

  const dateTextSize = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  }[size];

  const timeTextSize = {
    sm: 'text-xs font-black',
    md: 'text-sm sm:text-base font-black',
    lg: 'text-xl sm:text-2xl font-black',
  }[size];

  const dotSize = {
    sm: 'size-0.5',
    md: 'size-1',
    lg: 'size-1.5',
  }[size];

  return (
    <div
      className={`hidden sm:inline-flex flex-col items-center justify-center rounded-xl transition-all select-none ${sizeClasses} ${
        isDark
          ? 'bg-slate-950 text-white border border-slate-800/90 shadow-xs hover:border-slate-700 hover:bg-slate-900'
          : 'bg-white/95 text-slate-900 border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:bg-slate-50/80'
      } ${className}`}
      dir="ltr"
      title="توقيت الجزائر الرسمي (Africa/Algiers · UTC+1)"
      aria-label={`توقيت الجزائر: ${hours}:${minutes} - ${formattedDate}`}
    >
      {/* 1. السطر العلوي: اليوم والتاريخ محاكاةً لتصميم شاشة القفل */}
      <div className="flex items-center justify-center gap-1 leading-none text-center">
        <span
          className={`size-1.5 rounded-full ${
            isDark ? 'bg-emerald-400' : 'bg-emerald-500'
          } animate-pulse shrink-0`}
          aria-hidden="true"
        />
        <span
          className={`${dateTextSize} font-medium tracking-tight ${
            isDark ? 'text-slate-300' : 'text-slate-500'
          }`}
          style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}
        >
          {formattedDate}
        </span>
      </div>

      {/* 2. السطر السفلي: الأرقام الرقمية العريضة المتصلة محاكاةً لتصميم 16:16 */}
      <div
        className={`flex items-center justify-center gap-0.5 tracking-tight leading-none mt-0.5 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        }}
      >
        {/* الساعات */}
        <span className={`${timeTextSize} tabular-nums tracking-wide`}>{hours}</span>

        {/* النقطتان الفاصلتان الدائريتان النابضتان */}
        <span
          className="inline-flex flex-col justify-center items-center gap-[3px] mx-[2px] select-none"
          aria-hidden="true"
        >
          <span
            className={`${dotSize} rounded-full ${
              isDark ? 'bg-emerald-400' : 'bg-emerald-600'
            } animate-pulse`}
          />
          <span
            className={`${dotSize} rounded-full ${
              isDark ? 'bg-emerald-400' : 'bg-emerald-600'
            } animate-pulse`}
          />
        </span>

        {/* الدقائق */}
        <span className={`${timeTextSize} tabular-nums tracking-wide`}>{minutes}</span>

        {/* الثواني (اختياري) */}
        {showSeconds && (
          <>
            <span
              className="inline-flex flex-col justify-center items-center gap-[2px] mx-[1px] select-none"
              aria-hidden="true"
            >
              <span
                className={`size-0.5 rounded-full ${
                  isDark ? 'bg-emerald-400' : 'bg-emerald-600'
                } animate-pulse`}
              />
              <span
                className={`size-0.5 rounded-full ${
                  isDark ? 'bg-emerald-400' : 'bg-emerald-600'
                } animate-pulse`}
              />
            </span>
            <span
              className={`text-[10px] font-bold tabular-nums ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            >
              {seconds}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default LiveClock;
