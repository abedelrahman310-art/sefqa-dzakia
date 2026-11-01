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
 * Appeals on provisional awards — monitoring legal deadlines (10 days from notice)
 * with a live countdown for each appeal (GET /api/objections/).
 */

const LEGAL_WINDOW_DAYS = 10;
const LEGAL_WINDOW_MS = LEGAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;

function getTypeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    administrative: t('central.appeals.type_administrative'),
    judicial: t('central.appeals.type_judicial'),
  };
  return map[type] ?? type ?? '—';
}

function getGroundsLabel(row: CentralObjectionRow, t: (key: string) => string): string {
  if (!Array.isArray(row.grounds) || row.grounds.length === 0) return '—';
  const groundMap: Record<string, string> = {
    procedural: t('central.appeals.ground_procedural'),
    evaluation: t('central.appeals.ground_evaluation'),
    price: t('central.appeals.ground_price'),
    capacity: t('central.appeals.ground_capacity'),
    conflict: t('central.appeals.ground_conflict'),
    discrimination: t('central.appeals.ground_discrimination'),
    other: t('central.appeals.ground_other'),
  };
  return row.grounds.map((ground) => groundMap[ground] ?? ground).join(' · ');
}

function getStatusMeta(status: string, t: (key: string) => string) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: t('central.appeals.status_draft'), className: 'bg-slate-50 text-slate-700 border-slate-300' },
    submitted: { label: t('central.appeals.status_submitted'), className: 'bg-sky-50 text-sky-800 border-sky-300' },
    under_review: {
      label: t('central.appeals.status_under_review'),
      className: 'bg-amber-50 text-amber-800 border-amber-300',
    },
    accepted: {
      label: t('central.appeals.status_accepted'),
      className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    rejected: { label: t('central.appeals.status_rejected'), className: 'bg-red-50 text-red-800 border-red-300' },
    withdrawn: {
      label: t('central.appeals.status_withdrawn'),
      className: 'bg-slate-50 text-slate-700 border-slate-300',
    },
    escalated: {
      label: t('central.appeals.status_escalated'),
      className: 'bg-slate-100 text-slate-800 border-slate-300',
    },
  };
  return (
    map[status] ?? {
      label: status || t('central.appeals.status_unspecified'),
      className: 'bg-slate-50 text-slate-700 border-slate-300',
    }
  );
}

const OPEN_STATUSES = new Set(['submitted', 'under_review']);

export function CentralAppeals() {
  const { dir, t } = useI18n();
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
        title={t('central.appeals.title')}
        titleClassName="text-xl font-bold"
        description={t('central.appeals.description')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {t('central.appeals.refresh')}
          </Button>
        }
      />

      <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-[var(--ink-700)] shadow-sm">
        <Scale className="mt-0.5 size-4 shrink-0 text-[var(--stamp-green-700)]" aria-hidden="true" />
        <p dangerouslySetInnerHTML={{ __html: t('central.appeals.legal_basis') }} />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          eyebrow={t('central.appeals.kpi_total')}
          value={formatNumber(stats.total)}
          icon={Gavel}
          accent="navy"
          description={t('central.appeals.kpi_total_sub')}
        />
        <KpiCard
          eyebrow={t('central.appeals.kpi_open')}
          value={formatNumber(stats.open)}
          icon={FileWarning}
          accent="emerald"
          description={t('central.appeals.kpi_open_sub')}
        />
        <KpiCard
          eyebrow={t('central.appeals.kpi_within_deadline')}
          value={formatNumber(stats.withinDeadline)}
          icon={Clock}
          accent="gold"
          description={t('central.appeals.kpi_within_deadline_sub', {
            days: LEGAL_WINDOW_DAYS,
          })}
        />
        <KpiCard
          eyebrow={t('central.appeals.kpi_expired')}
          value={formatNumber(stats.expired)}
          icon={CalendarX}
          accent="red"
          description={t('central.appeals.kpi_expired_sub')}
        />
      </div>

      <Card className="bg-white shadow-sm border-gray-200">
        <CardHeader className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[var(--ink-900)]">
              {t('central.appeals.registry_title')}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-gray-500">
              {t('central.appeals.registry_subtitle')}
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
                placeholder={t('central.appeals.search_placeholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label={t('central.appeals.search_aria')}
                className="ps-8 pe-3 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label={t('central.appeals.filter_status_aria')}
              className="px-2.5 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
            >
              <option value="all">{t('central.appeals.all_statuses')}</option>
              <option value="submitted">{t('central.appeals.status_submitted')}</option>
              <option value="under_review">{t('central.appeals.status_under_review')}</option>
              <option value="accepted">{t('central.appeals.status_accepted')}</option>
              <option value="rejected">{t('central.appeals.status_rejected')}</option>
              <option value="escalated">{t('central.appeals.status_escalated')}</option>
              <option value="withdrawn">{t('central.appeals.status_withdrawn')}</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-700)] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(event) => setOnlyOpen(event.target.checked)}
                className="size-3.5 accent-[var(--stamp-green-700)]"
              />
              {t('central.appeals.filter_open_only')}
            </label>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[110px]">{t('central.appeals.col_ref')}</TableHead>
                <TableHead className="min-w-[200px]">{t('central.appeals.col_deal')}</TableHead>
                <TableHead className="min-w-[150px]">{t('central.appeals.col_objector')}</TableHead>
                <TableHead>{t('central.appeals.col_type')}</TableHead>
                <TableHead className="min-w-[170px]">{t('central.appeals.col_grounds')}</TableHead>
                <TableHead>{t('central.appeals.col_status')}</TableHead>
                <TableHead className="text-center">{t('central.appeals.col_submitted_at')}</TableHead>
                <TableHead className="text-center">{t('central.appeals.col_deadline')}</TableHead>
                <TableHead className="min-w-[150px] text-center">{t('central.appeals.col_countdown')}</TableHead>
                <TableHead className="text-center">{t('central.appeals.col_window_status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={10}
                loading={loading && !data}
                error={error}
                empty={!loading && filtered.length === 0}
                emptyLabel={t('central.appeals.empty_appeals')}
                onRetry={reload}
              >
                {filtered.map((item) => {
                  const meta = getStatusMeta(item.status, t);
                  const countdown = formatCountdown(item.deadline_at, now, {
                    lang: dir === 'rtl' ? 'ar' : 'fr',
                  });
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
                        {getTypeLabel(item.objection_type, t)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-[var(--ink-700)] py-2.5">
                        {getGroundsLabel(item, t)}
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
                            {t('central.appeals.within_deadline')}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-800 border-red-300">
                            {t('central.appeals.outside_deadline')}
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
              {t('central.appeals.showing_count', {
                count: formatNumber(filtered.length),
                total: formatNumber(stats.total),
              })}
            </span>
            <span className="font-mono">
              {t('central.appeals.legal_window_info', {
                days: LEGAL_WINDOW_DAYS,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentralAppeals;
