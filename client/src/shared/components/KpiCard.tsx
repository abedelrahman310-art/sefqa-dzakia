import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface KpiCardProps {
  eyebrow: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: LucideIcon;
  accent?: 'emerald' | 'gold' | 'navy' | 'red' | 'ai';
  sparkline?: number[];
  description?: string;
  /** أصناف الرقم الرئيسي — الافتراضي 'font-mono text-4xl' */
  valueClassName?: string;
  /** أصناف سطر الوصف — الافتراضي 'text-xs text-[var(--ink-500)]' */
  descriptionClassName?: string;
  /** عنصر مخصص بدل الرقم (مثل رقم + عملة على سطر واحد) */
  valueContent?: ReactNode;
}

export function KpiCard({
  eyebrow,
  value,
  trend,
  trendLabel,
  icon: Icon,
  accent = 'emerald',
  sparkline,
  description,
  valueClassName,
  descriptionClassName,
  valueContent,
}: KpiCardProps) {
  const getStrokeColor = () => {
    switch (accent) {
      case 'emerald':
        return 'var(--stamp-green-700)'; // #1B4332
      case 'gold':
        return 'var(--stamp-gold-700)';  // #8B6914
      case 'red':
        return 'var(--stamp-red-700)';   // #8B1A1A / #B02A2A
      case 'navy':
        return 'var(--official-700)';    // #0A2540
      case 'ai':
        return 'var(--ai-accent)';       // #8b5cf6
      default:
        return 'var(--ink-500)';
    }
  };

  return (
    <div className="group relative bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 transition-all duration-200 hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="eyebrow !text-xs text-[var(--ink-500)]">{eyebrow}</div>
        {Icon && (
          <div className="size-9 rounded-lg bg-[var(--paper-100)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--ink-700)]">
            <Icon className="size-4" strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Hero Number */}
      <div
        className={`${valueClassName ?? 'font-mono text-4xl'} font-bold tracking-tight leading-none text-[var(--ink-900)] mb-2`}
      >
        {valueContent ?? value}
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-2 text-sm mb-3">
          <span
            className={`font-mono tabular-nums font-semibold ${
              trend >= 0 ? 'text-[var(--stamp-green-700)]' : 'text-[var(--stamp-red-700)]'
            }`}
          >
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
          {trendLabel && (
            <span className="text-[var(--ink-500)] text-xs">{trendLabel}</span>
          )}
        </div>
      )}

      {/* Description fallback if no trend */}
      {description && trend === undefined && (
        <p className={`${descriptionClassName ?? 'text-xs text-[var(--ink-500)]'} mb-3`}>
          {description}
        </p>
      )}

      {/* Sparkline — Color accent strictly on stroke */}
      {sparkline && sparkline.length > 1 && (
        <div className="h-8 -mx-2 -mb-2 mt-2">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
            <polyline
              points={sparkline
                .map((v, i) => {
                  const max = Math.max(...sparkline);
                  const min = Math.min(...sparkline);
                  const range = max - min || 1;
                  const x = (i / (sparkline.length - 1)) * 100;
                  const y = 30 - ((v - min) / range) * 30;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={getStrokeColor()}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default KpiCard;
