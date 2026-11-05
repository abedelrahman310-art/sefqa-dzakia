import { useState, useEffect } from 'react';

export interface LiveClockProps {
  className?: string;
}

export function LiveClock({ className = '' }: LiveClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // تنسيق الوقت بتوقيت الجزائر (24 ساعة)
  const formatter = new Intl.DateTimeFormat('fr-DZ', {
    timeZone: 'Africa/Algiers',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(time);
  const hours = parts.find((p) => p.type === 'hour')?.value || '00';
  const minutes = parts.find((p) => p.type === 'minute')?.value || '00';

  return (
    <div
      className={`hidden sm:flex items-center gap-1.5 font-mono text-sm font-bold tracking-widest select-none ${className}`}
      dir="ltr"
      title="توقيت الجزائر (UTC+1)"
      aria-label={`توقيت الجزائر: ${hours}:${minutes}`}
    >
      {/* المربع الرقمي للساعات */}
      <div className="flex items-center justify-center bg-slate-900 dark:bg-slate-800 text-white rounded-md px-2.5 py-1.5 shadow-sm border border-slate-700/50 min-w-[3rem]">
        {hours}
      </div>

      {/* النقطتان الفاصلتان */}
      <span className="text-slate-400 animate-pulse text-lg leading-none">:</span>

      {/* المربع الرقمي للدقائق */}
      <div className="flex items-center justify-center bg-slate-900 dark:bg-slate-800 text-white rounded-md px-2.5 py-1.5 shadow-sm border border-slate-700/50 min-w-[3rem]">
        {minutes}
      </div>
    </div>
  );
}

export default LiveClock;
