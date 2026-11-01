import { useEffect, useState, type ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import {
  formatCurrency,
  formatDate as formatIntlDate,
  formatDateTime as formatIntlDateTime,
  formatDecimal as formatIntlDecimal,
  formatNumber as formatIntlNumber,
  formatPercent as formatIntlPercent,
} from '@/lib/format';

/**
 * Shared UI elements for central oversight space:
 * Number and date formatting, percentage meters, and table states (loading/error/empty).
 */

export function formatNumber(value: number | null | undefined): string {
  return formatIntlNumber(value, { maximumFractionDigits: 0 });
}

export function formatDecimal(value: number | null | undefined): string {
  return formatIntlDecimal(value);
}

/** Unified DZD currency formatting. */
export function formatDZD(value: number | null | undefined): string {
  return formatCurrency(value === null || value === undefined ? value : Math.round(value));
}

export function formatPercent(value: number | null | undefined): string {
  return formatIntlPercent(value);
}

export function formatDate(value: string | null | undefined): string {
  return formatIntlDate(value);
}

export function formatDateTime(value: string | null | undefined): string {
  return formatIntlDateTime(value);
}

/** Shared clock updated periodically for countdown timers without creating a timer per row. */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}

export interface CountdownState {
  expired: boolean;
  empty: boolean;
  label: string;
}

export interface CountdownOptions {
  lang?: string;
  expiredLabel?: string;
  daysLabel?: string;
  hoursLabel?: string;
  minutesLabel?: string;
  andLabel?: string;
  lessThanMinuteLabel?: string;
}

/** Readable countdown timer for legal deadlines (days/hours/minutes). */
export function formatCountdown(
  deadlineIso: string | null | undefined,
  now: number,
  options: CountdownOptions | string = 'ar',
): CountdownState {
  const opts: CountdownOptions = typeof options === 'string' ? { lang: options } : options;
  const isFr = opts.lang === 'fr';

  const expiredStr = opts.expiredLabel ?? (isFr ? 'Délai expiré' : 'انقضى الأجل');
  const daysStr = opts.daysLabel ?? (isFr ? 'j' : 'يوم');
  const hoursStr = opts.hoursLabel ?? (isFr ? 'h' : 'ساعة');
  const minutesStr = opts.minutesLabel ?? (isFr ? 'min' : 'دقيقة');
  const andStr = opts.andLabel ?? (isFr ? ' et ' : ' و');
  const lessThanMinuteStr = opts.lessThanMinuteLabel ?? (isFr ? "Moins d'une minute" : 'أقل من دقيقة');

  if (!deadlineIso) return { expired: false, empty: true, label: '—' };

  const deadline = new Date(deadlineIso).getTime();
  if (Number.isNaN(deadline)) return { expired: false, empty: true, label: '—' };

  const diff = deadline - now;
  if (diff <= 0) {
    return { expired: true, empty: false, label: expiredStr };
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${formatNumber(days)} ${daysStr}`);
  if (hours > 0) parts.push(`${formatNumber(hours)} ${hoursStr}`);
  if (days === 0 && minutes > 0) parts.push(`${formatNumber(minutes)} ${minutesStr}`);

  return {
    expired: false,
    empty: false,
    label: parts.length > 0 ? parts.join(andStr) : lessThanMinuteStr,
  };
}

type MeterTone = 'auto' | 'emerald' | 'amber' | 'red' | 'navy';

const meterColors: Record<Exclude<MeterTone, 'auto'>, string> = {
  emerald: 'var(--stamp-green-700)',
  amber: 'var(--stamp-gold-500)',
  red: 'var(--stamp-red-700)',
  navy: 'var(--official-700)',
};

/** Percentage meter bar with numeric value. */
export function Meter({
  value,
  tone = 'auto',
}: {
  value: number | null | undefined;
  tone?: MeterTone;
}) {
  const safe = Math.max(0, Math.min(100, value ?? 0));
  const resolvedTone: Exclude<MeterTone, 'auto'> =
    tone !== 'auto' ? tone : safe >= 90 ? 'emerald' : safe >= 70 ? 'amber' : 'red';

  return (
    <div className="flex items-center justify-center gap-2">
      <div
        className="h-2 w-16 overflow-hidden rounded-full bg-[var(--paper-200)]"
        role="progressbar"
        aria-valuenow={Math.round(safe)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${safe}%`, backgroundColor: meterColors[resolvedTone] }}
        />
      </div>
      <span className="font-mono text-xs font-bold tabular-nums text-[var(--ink-900)]">
        {formatPercent(value)}
      </span>
    </div>
  );
}

export interface TableStateProps {
  colSpan: number;
  loading?: boolean;
  loadingLabel?: string;
  error?: string;
  empty?: boolean;
  emptyLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
}

/** Standard row displaying table states: loading, error with retry, or empty results. */
export function TableState({
  colSpan,
  loading = false,
  loadingLabel,
  error = '',
  empty = false,
  emptyLabel,
  onRetry,
  retryLabel,
  children,
}: TableStateProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="py-8 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--ink-500)]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {loadingLabel ?? t('central.ui.loading_data')}
          </span>
        </TableCell>
      </TableRow>
    );
  }

  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="py-8 text-center">
          <div className="mx-auto max-w-md space-y-2">
            <p className="text-xs font-bold text-[var(--stamp-red-700)]">{error}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="h-8 text-xs font-semibold">
                <RefreshCw className="size-3.5" aria-hidden="true" />
                {retryLabel ?? t('central.ui.retry')}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (empty) {
    return (
      <TableRow>
        <TableCell
          colSpan={colSpan}
          className="py-8 text-center text-xs font-medium text-[var(--ink-500)]"
        >
          {emptyLabel ?? t('central.ui.no_matching_data')}
        </TableCell>
      </TableRow>
    );
  }

  return <>{children}</>;
}
