import { useEffect, useState, type ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  formatCurrency,
  formatDate as formatIntlDate,
  formatDateTime as formatIntlDateTime,
  formatDecimal as formatIntlDecimal,
  formatNumber as formatIntlNumber,
  formatPercent as formatIntlPercent,
} from '@/lib/format';

/**
 * عناصر عرض مشتركة لفضاء الرقابة المركزية:
 * تنسيق الأرقام والتواريخ، مؤشرات النسب، وحالات الجداول (تحميل/خطأ/فراغ).
 *
 * التنسيق يمرّ عبر @/lib/format حتى يتبع لغة الواجهة الحالية (ar/fr) بدل
 * تثبيت ar-DZ في الثوابت.
 */

export function formatNumber(value: number | null | undefined): string {
  return formatIntlNumber(value, { maximumFractionDigits: 0 });
}

export function formatDecimal(value: number | null | undefined): string {
  return formatIntlDecimal(value);
}

/** المبالغ بالدينار الجزائري بصيغة موحّدة. */
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

/** ساعة مشتركة تتحدّث دورياً — تُستعمل للعدّادات التنازلية دون مؤقّت لكل صف. */
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

/** عدّاد تنازلي مقروء للمهل القانونية (أيام/ساعات/دقائق). */
export function formatCountdown(
  deadlineIso: string | null | undefined,
  now: number,
): CountdownState {
  if (!deadlineIso) return { expired: false, empty: true, label: '—' };

  const deadline = new Date(deadlineIso).getTime();
  if (Number.isNaN(deadline)) return { expired: false, empty: true, label: '—' };

  const diff = deadline - now;
  if (diff <= 0) {
    return { expired: true, empty: false, label: 'انقضى الأجل' };
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${formatNumber(days)} يوم`);
  if (hours > 0) parts.push(`${formatNumber(hours)} ساعة`);
  if (days === 0 && minutes > 0) parts.push(`${formatNumber(minutes)} دقيقة`);

  return {
    expired: false,
    empty: false,
    label: parts.length > 0 ? parts.join(' و') : 'أقل من دقيقة',
  };
}

type MeterTone = 'auto' | 'emerald' | 'amber' | 'red' | 'navy';

const meterColors: Record<Exclude<MeterTone, 'auto'>, string> = {
  emerald: 'var(--stamp-green-700)',
  amber: 'var(--stamp-gold-500)',
  red: 'var(--stamp-red-700)',
  navy: 'var(--official-700)',
};

/** شريط نسبة مع قيمة رقمية — يُستخدم لمؤشرات الالتزام والشفافية. */
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
  error?: string;
  empty?: boolean;
  emptyLabel?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

/** صفّ موحّد يعرض حالة الجدول: تحميل، خطأ مع إعادة المحاولة، أو لا نتائج. */
export function TableState({
  colSpan,
  loading = false,
  error = '',
  empty = false,
  emptyLabel = 'لا توجد بيانات مطابقة للمعايير الحالية.',
  onRetry,
  children,
}: TableStateProps) {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="py-8 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--ink-500)]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            جارٍ تحميل البيانات من الخادم…
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
                إعادة المحاولة
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
          {emptyLabel}
        </TableCell>
      </TableRow>
    );
  }

  return <>{children}</>;
}
