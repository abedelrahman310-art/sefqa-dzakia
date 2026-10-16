import React from 'react';
import { Link } from 'wouter';
import { TranslationKey } from '@/i18n';

export interface AlertItem {
  kind: 'warn' | 'info' | 'success';
  text: string;
  href: string;
}

export interface AlertsListProps {
  alerts: AlertItem[];
  t: (key: TranslationKey) => string;
}

export function AlertsList({ alerts, t }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="pt-3">
        <div className="p-4 rounded-lg bg-[var(--paper-50)] border border-[var(--color-border-subtle)] text-center text-xs text-[var(--ink-500)]">
          {t('authority.overview.no_alerts')}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-3 space-y-3">
      {alerts.map((alert, idx) => (
        <Link
          key={idx}
          href={alert.href}
          className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--paper-50)] border border-[var(--color-border-subtle)] hover:bg-[var(--paper-100)] transition-colors group block"
        >
          <i
            className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
              alert.kind === 'warn'
                ? 'bg-[var(--stamp-gold-500)]'
                : alert.kind === 'info'
                ? 'bg-[var(--official-700)]'
                : 'bg-[var(--stamp-green-500)]'
            }`}
          />
          <div className="min-w-0 flex-1">
            <strong className="block text-xs font-bold text-[var(--ink-900)] group-hover:text-[var(--official-700)] transition-colors">
              {alert.text}
            </strong>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default AlertsList;
