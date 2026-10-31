import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { PageHeader, KpiCard } from '@/shared/components';
import {
  Gavel,
  FileWarning,
  Clock,
  CalendarX,
  Search,
  RefreshCw,
  Scale,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  fetchCentralObjections,
  useCentralResource,
  type CentralObjectionRow,
} from './centralApi';
import {
  TableState,
  formatCountdown,
  formatDateTime,
  formatNumber,
  useNow,
} from './centralUi';

/**
 * الطعون على قرارات الإسناد — متابعة المهل القانونية (10 أيام من الإعلان)
 * مع عدّاد تنازلي حيّ لكل طعن.
 *
 * المصدر: GET /api/objections/ — حساب الإدارة المركزية يرى كل الطعون،
 * ويُعيد الخادم deadline_at و days_remaining و is_within_deadline.
 */

const LEGAL_WINDOW_DAYS = 10;
const LEGAL_WINDOW_MS = LEGAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const TYPE_LABELS: Record<string, string> = {
  administrative: 'طعن إداري',
  judicial: 'طعن قضائي',
};

const GROUND_LABELS: Record<string, string> = {
  procedural: 'مخالفة إجرائية',
  evaluation: 'خطأ في التقييم',
  price: 'سعر غير منطقي',
  capacity: 'عدم استيفاء القدرات',
  conflict: 'تنازع مصالح',
  discrimination: 'تمييز غير قانوني',
  other: 'أسباب أخرى',
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: 'مسودة', className: 'bg-slate-50 text-slate-700 border-slate-300' },
  submitted: { label: 'مُودع', className: 'bg-sky-50 text-sky-800 border-sky-300' },
  under_review: {
    label: 'قيد الدراسة',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  accepted: {
    label: 'مقبول',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  rejected: { label: 'مرفوض', className: 'bg-red-50 text-red-800 border-red-300' },
  withdrawn: {
    label: 'مسحوب',
    className: 'bg-slate-50 text-slate-700 border-slate-300',
  },
  escalated: {
    label: 'مُحال للقضاء',
    className: 'bg-slate-100 text-slate-800 border-slate-300',
  },
};

const OPEN_STATUSES = new Set(['submitted', 'under_review']);

function statusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status || 'غير محدّد',
      className: 'bg-slate-50 text-slate-700 border-slate-300',
    }
  );
}

function groundsLabel(row: CentralObjectionRow): string {
  if (!Array.isArray(row.grounds) || row.grounds.length === 0) return '—';
  return row.grounds.map((ground) => GROUND_LABELS[ground] ?? ground).join(' · ');
}

export function CentralAppeals() {
  const { dir } = useI18n();
  const { data, loading, error, reload } = useCentralResource(fetchCentralObjections);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const now = useNow(30000);

  const objections = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const total = objections.length;
    const open = objections.filter((item) => OPEN_STATUSES.has(item.status)).length;
    const expired = objections.filter((item) => {
      if (!item.deadline_at) return false;
      const deadline = new Date(item.deadline_at).getTime();
      return !Number.isNaN(deadline) && deadline < now;
    }).length;
    const withinDeadline = objections.filter((item) => {
      if (!item.deadline_at) return false;
      const deadline = new Date(item.deadline_at).getTime();
      return !Number.isNaN(deadline) && deadline >= now;
    }).length;
    return { total, open, expired, withinDeadline };
  }, [objections, now]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return objections
      .filter((item) => {
        if (filterStatus !== 'all' && item.status !== filterStatus) return false;
        if (onlyOpen && !OPEN_STATUSES.has(item.status)) return false;
        if (!query) return true;
        return (
          (item.reference ?? '').toLowerCase().includes(query) ||
          (item.tender_reference ?? '').toLowerCase().includes(query) ||
          (item.tender_title ?? '').toLowerCase().includes(query) ||
          (item.objector_name ?? '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const aDeadline = a.deadline_at ? new Date(a.deadline_at).getTime() : 0;
        const bDeadline = b.deadline_at ? new Date(b.deadline_at).getTime() : 0;
        return aDeadline - bDeadline;
      });
  }, [objections, searchQuery, filterStatus, onlyOpen]);

  return (
    <div className="space-y-4" dir={dir}>
      <PageHeader
        title="الطعون على قرارات الإسناد"
        titleClassName="text-xl font-bold"
        description="متابعة الطعون الإدارية والقضائية ومهلها القانونية: عشرة أيام من تاريخ الإعلان عن الإسناد المؤقت، مع عدّاد تنازلي حيّ لكل طعن."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
            className="text-xs h-8"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            تحديث البيانات
          </Button>
        }
      />

      <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-[var(--ink-700)] shadow-sm">
        <Scale className="mt-0.5 size-4 shrink-0 text-[var(--stamp-green-700)]" aria-hidden="true" />
        <p>
          الأساس القانوني: المادة 72 من القانون 23-12 — أجل الطعن عشرة أيام من تاريخ الإعلان عن
          الإسناد. العدّاد أدناه محسوب من <span className="font-mono">deadline_at</span> الذي
          يُرجعه الخادم، ويُحدَّث تلقائياً كل 30 ثانية.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          eyebrow="إجمالي الطعون"
          value={formatNumber(stats.total)}
          icon={Gavel}
          accent="navy"
          description="طعون مسجّلة في السجل الوطني"
        />
        <KpiCard
          eyebrow="طعون مفتوحة"
          value={formatNumber(stats.open)}
          icon={FileWarning}
          accent="emerald"
          description="مُودعة أو قيد الدراسة"
        />
        <KpiCard
          eyebrow="داخل الأجل القانوني"
          value={formatNumber(stats.withinDeadline)}
          icon={Clock}
          accent="gold"
          description={`مهلة ${LEGAL_WINDOW_DAYS} أيام من الإعلان`}
        />
        <KpiCard
          eyebrow="انقضى أجلها"
          value={formatNumber(stats.expired)}
          icon={CalendarX}
          accent="red"
          description="تجاوزت المهلة القانونية للطعن"
        />
      </div>

      <Card className="bg-white shadow-sm border-gray-200">
        <CardHeader className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[var(--ink-900)]">
              سجل الطعون والعدّادات التنازلية
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-gray-500">
              مرتّب تصاعدياً حسب أقرب أجل قانوني
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="size-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="بحث بالمرجع أو الصفقة أو المُطعِن…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="بحث في الطعون"
                className="ps-8 pe-3 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label="تصفية حسب حالة الطعن"
              className="px-2.5 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
            >
              <option value="all">كل الحالات</option>
              <option value="submitted">مُودع</option>
              <option value="under_review">قيد الدراسة</option>
              <option value="accepted">مقبول</option>
              <option value="rejected">مرفوض</option>
              <option value="escalated">مُحال للقضاء</option>
              <option value="withdrawn">مسحوب</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-700)]">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(event) => setOnlyOpen(event.target.checked)}
                className="size-3.5 accent-[var(--stamp-green-700)]"
              />
              المفتوحة فقط
            </label>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[110px]">مرجع الطعن</TableHead>
                <TableHead className="min-w-[200px]">الصفقة</TableHead>
                <TableHead className="min-w-[150px]">مُقدّم الطعن</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead className="min-w-[170px]">أسباب الطعن</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">تاريخ الإيداع</TableHead>
                <TableHead className="text-center">آخر أجل</TableHead>
                <TableHead className="min-w-[150px] text-center">العدّاد التنازلي</TableHead>
                <TableHead className="text-center">وضع الأجل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={10}
                loading={loading && !data}
                error={error}
                empty={!loading && filtered.length === 0}
                emptyLabel="لا توجد طعون مطابقة للبحث أو التصفية الحالية."
                onRetry={reload}
              >
                {filtered.map((item) => {
                  const meta = statusMeta(item.status);
                  const countdown = formatCountdown(item.deadline_at, now);
                  const deadlineMs = item.deadline_at
                    ? new Date(item.deadline_at).getTime()
                    : Number.NaN;
                  const hasDeadline = !Number.isNaN(deadlineMs);
                  const remainingShare = hasDeadline
                    ? Math.max(
                        0,
                        Math.min(100, ((deadlineMs - now) / LEGAL_WINDOW_MS) * 100),
                      )
                    : 0;
                  const withinDeadline = hasDeadline && deadlineMs >= now;

                  return (
                    <TableRow
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <TableCell className="font-mono text-xs font-bold text-[var(--ink-900)] py-2.5">
                        {item.reference || '—'}
                      </TableCell>
                      <TableCell className="max-w-[240px] py-2.5">
                        <div className="font-mono text-xs font-bold text-[var(--ink-700)]">
                          {item.tender_reference || '—'}
                        </div>
                        <div className="truncate text-xs text-[var(--ink-500)]">
                          {item.tender_title || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs font-semibold text-[var(--ink-900)] py-2.5">
                        {item.objector_name || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--ink-700)] py-2.5">
                        {TYPE_LABELS[item.objection_type] ?? item.objection_type ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-[var(--ink-700)] py-2.5">
                        {groundsLabel(item)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-[var(--ink-700)] py-2.5">
                        {formatDateTime(item.submitted_at)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-[var(--ink-700)] py-2.5">
                        {formatDateTime(item.deadline_at)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="space-y-1">
                          <span
                            className={`block font-mono text-xs font-bold ${
                              countdown.expired
                                ? 'text-[var(--stamp-red-700)]'
                                : 'text-[var(--ink-900)]'
                            }`}
                          >
                            {countdown.label}
                          </span>
                          {!countdown.empty && !countdown.expired && (
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--paper-200)]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${remainingShare}%`,
                                  backgroundColor:
                                    remainingShare <= 20
                                      ? 'var(--stamp-red-700)'
                                      : remainingShare <= 50
                                        ? 'var(--stamp-gold-500)'
                                        : 'var(--stamp-green-700)',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        {!hasDeadline ? (
                          <span className="text-xs text-[var(--ink-500)]">—</span>
                        ) : withinDeadline ? (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">
                            داخل الأجل
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-800 border-red-300">
                            خارج الأجل
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableState>
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-2.5 text-xs text-[var(--ink-500)]">
            <span>
              عرض {formatNumber(filtered.length)} من أصل {formatNumber(stats.total)} طعناً
            </span>
            <span className="font-mono">
              المهلة القانونية: {LEGAL_WINDOW_DAYS} أيام من الإعلان
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentralAppeals;
