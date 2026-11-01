import i18n, { normalizeLanguage, type AppLanguage } from './i18n';

/**
 * مساعدات التنسيق المحلية (أرقام، مبالغ، تواريخ) عبر Intl.
 *
 * - العربية: أرقام لاتينية بفاصل آلاف «,» ولاحقة «دج» — مثال: 10,000 دج.
 * - الفرنسية: تنسيق fr-DZ (فراغ غير كاسر) ولاحقة «DA» — مثال: 10 000 DA.
 *
 * اللغة تُقرأ من i18next عند كل استدعاء، لذلك تتبع أي تبديل لغة تلقائياً
 * بمجرد إعادة تصيير المكوّن الذي يعرض القيمة.
 */

export type FormatLanguage = AppLanguage;

function resolveLanguage(language?: string | null): AppLanguage {
  return normalizeLanguage(language ?? i18n.language);
}

function resolveNumberLocale(language: AppLanguage): string {
  // ar-DZ يستخدم الفاصلة النقطية للآلاف، بينما المطلوب عربياً 10,000.
  return language === 'ar' ? 'en-US' : 'fr-DZ';
}

function resolveDateLocale(language: AppLanguage): string {
  return language === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-DZ';
}

export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
  language?: string | null,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(resolveNumberLocale(resolveLanguage(language)), options).format(
    value,
  );
}

export function formatDecimal(
  value: number | null | undefined,
  language?: string | null,
): string {
  return formatNumber(
    value,
    { minimumFractionDigits: 1, maximumFractionDigits: 1 },
    language,
  );
}

/** مبلغ بالدينار الجزائري: 10,000 دج (عربية) / 10 000 DA (فرنسية). */
export function formatCurrency(
  value: number | null | undefined,
  language?: string | null,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const lang = resolveLanguage(language);
  const amount = new Intl.NumberFormat(resolveNumberLocale(lang), {
    maximumFractionDigits: 2,
  }).format(value);
  return lang === 'ar' ? `${amount} دج` : `${amount} DA`;
}

export function formatPercent(
  value: number | null | undefined,
  language?: string | null,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const lang = resolveLanguage(language);
  const formatted = new Intl.NumberFormat(resolveNumberLocale(lang), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted}%`;
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** تاريخ طويل: 31 أكتوبر 2026 (عربية) / 31 octobre 2026 (فرنسية). */
export function formatDate(
  value: Date | string | number | null | undefined,
  language?: string | null,
): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(resolveDateLocale(resolveLanguage(language)), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** تاريخ ووقت: 31 أكتوبر 2026، 02:05 م (عربية) / 31 oct. 2026, 14:05 (فرنسية). */
export function formatDateTime(
  value: Date | string | number | null | undefined,
  language?: string | null,
): string {
  const date = toDate(value);
  if (!date) return '—';
  const lang = resolveLanguage(language);
  return new Intl.DateTimeFormat(resolveDateLocale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    // الفرنسية بنظام 24 ساعة؛ العربية تُبقي ص/م.
    hour12: lang === 'fr' ? false : undefined,
  }).format(date);
}
