import React from 'react';
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
}: KpiCardProps) {
  const getStrokeColor = () => {
    switch (accent) {
      case 'emerald':
        return 'var(--stamp-green-500, #2D6A4F)';
      case 'gold':
        return 'var(--stamp-gold-500, #B8860B)';
      case 'navy':
        return 'var(--official-500, #1E5A8E)';
      case 'red':
        return 'var(--stamp-red-500, #B02A2A)';
      case 'ai':
        return 'var(--ai-accent, #8b5cf6)';
      default:
        return 'var(--color-primary, var(--stamp-green-500, #2D6A4F))';
    }
  };

  return (
    <div className="group relative bg-[var(--card-bg)] border border-[var(--color-border-subtle)] rounded-xl p-6 transition-all duration-200 hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div className="eyebrow">{eyebrow}</div>
        {Icon && (
          <div className="size-10 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-secondary)]">
            <Icon className="size-5" />
          </div>
        )}
      </div>

      <div className="font-mono text-[var(--text-display)] font-bold tracking-tight leading-none text-[var(--color-text-primary)] mb-2">
        {value}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-2 text-body-sm mb-4">
          <span className={trend >= 0 ? 'text-emerald-600' : 'text-red-600'}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
          {trendLabel && (
            <span className="text-[var(--color-text-muted)]">{trendLabel}</span>
          )}
        </div>
      )}

      {description && trend === undefined && (
        <p className="text-body-sm text-[var(--color-text-muted)] mb-3">{description}</p>
      )}

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
