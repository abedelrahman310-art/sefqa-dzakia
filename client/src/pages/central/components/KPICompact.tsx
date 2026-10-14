import type { LucideIcon } from 'lucide-react';

export interface KPICompactProps {
  eyebrow: string;
  value: string;
  unit?: string;
  trend?: number;
  icon: LucideIcon;
  urgent?: boolean;
}

export function KPICompact({
  eyebrow,
  value,
  unit,
  trend,
  icon: Icon,
  urgent,
}: KPICompactProps) {
  return (
    <div
      className={`
        flex items-center gap-3.5 
        p-4 rounded-xl 
        bg-white border transition-colors shadow-2xs
        ${
          urgent
            ? 'border-[var(--stamp-red-700)]/40 hover:border-[var(--stamp-red-700)]'
            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
        }
      `}
    >
      <div
        className={`
          size-11 rounded-lg flex items-center justify-center shrink-0 border border-[var(--color-border-subtle)]
          ${
            urgent
              ? 'bg-[var(--paper-100)] text-[var(--stamp-red-700)]'
              : 'bg-[var(--paper-100)] text-[var(--ink-700)]'
          }
        `}
      >
        <Icon className="size-5" strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="eyebrow text-[10px] text-[var(--ink-500)] mb-0.5 truncate">{eyebrow}</div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-mono text-2xl font-bold text-[var(--ink-900)] leading-none">
            {value}
          </span>
          {unit && (
            <span className="text-xs text-[var(--ink-500)] font-medium ms-1">
              {unit}
            </span>
          )}
          {trend !== undefined && (
            <span
              className={`
                text-xs font-mono font-semibold ms-2 flex items-center
                ${
                  trend >= 0
                    ? 'text-[var(--stamp-green-700)]'
                    : urgent
                    ? 'text-[var(--stamp-red-700)]'
                    : 'text-[var(--stamp-green-700)]'
                }
              `}
            >
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default KPICompact;
