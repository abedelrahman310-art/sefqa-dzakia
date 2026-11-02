import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { PageHeader, KpiCard, AICard } from '@/shared/components';
import {
  Building,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Search,
  Eye,
  Trophy,
  ShieldCheck,
  RefreshCw,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  fetchCentralReports,
  useCentralResource,
  type CentralAuthorityReport,
} from './centralApi';
import { Meter, TableState, formatDZD, formatNumber } from './centralUi';

/**
 * Contracting Authorities Governance — ranking authorities by punctuality
 * and composite transparency score (GET /api/central/reports/).
 */

function getStatusMeta(status: string, t: (key: string) => string) {
  const map: Record<string, { label: string; className: string }> = {
    excellent: {
      label: t('central.authorities.status_excellent'),
      className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    normal: {
      label: t('central.authorities.status_normal'),
      className: 'bg-slate-50 text-slate-700 border-slate-300',
    },
    needs_support: {
      label: t('central.authorities.status_needs_support'),
      className: 'bg-amber-50 text-amber-800 border-amber-300',
    },
    infractions: {
      label: t('central.authorities.status_infractions'),
      className: 'bg-red-50 text-red-800 border-red-300',
    },
  };
  return (
    map[status] ?? {
      label: status || t('central.authorities.status_unspecified'),
      className: 'bg-slate-50 text-slate-700 border-slate-300',
    }
  );
}

type RankedAuthority = CentralAuthorityReport & { rank: number };

export function CentralAuthorities() {
  const { dir, t } = useI18n();
  const { data, loading, error, reload } = useCentralResource(fetchCentralReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAuth, setSelectedAuth] = useState<RankedAuthority | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const summary = data?.national_summary;
  const authorities = useMemo(() => data?.authorities ?? [], [data]);

  /** National ranking: punctuality first, then transparency, then volume. */
  const ranked = useMemo(() => {
    return [...authorities]
      .sort(
        (a, b) =>
          b.compliance_rate - a.compliance_rate ||
          b.transparency_rate - a.transparency_rate ||
          b.deals_count - a.deals_count,
      )
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [authorities]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ranked.filter((item) => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.wilaya.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query)
      );
    });
  }, [ranked, searchQuery, filterStatus]);

  const infractionsCount = authorities.filter((item) => item.status === 'infractions').length;
  const trainingNeeded = authorities.filter((item) => item.ai_training_needed);

  return (
    <div className="space-y-4" dir={dir}>
      <PageHeader
        title={t('central.authorities.title')}
        titleClassName="text-xl font-bold"
        description={t('central.authorities.description')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {t('central.authorities.refresh')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          eyebrow={t('central.authorities.kpi_authorities')}
          value={formatNumber(summary?.total_authorities ?? authorities.length)}
          icon={Building}
          accent="navy"
          description={t('central.authorities.kpi_national_volume', {
            volume: formatDZD(summary?.total_volume_dzd ?? 0),
          })}
        />
        <KpiCard
          eyebrow={t('central.authorities.kpi_avg_punctuality')}
          value={`${formatNumber(summary?.average_compliance_rate ?? 0)}%`}
          icon={CheckCircle2}
          accent="emerald"
          description={t('central.authorities.kpi_deals_counted', {
            count: formatNumber(summary?.total_deals ?? 0),
          })}
        />
        <KpiCard
          eyebrow={t('central.authorities.kpi_avg_transparency')}
          value={`${formatNumber(summary?.average_transparency_rate ?? 0)}%`}
          icon={ShieldCheck}
          accent="gold"
          description={t('central.authorities.kpi_transparency_sub')}
        />
        <KpiCard
          eyebrow={t('central.authorities.kpi_with_infractions')}
          value={formatNumber(infractionsCount)}
          icon={AlertTriangle}
          accent="red"
          description={t('central.authorities.kpi_infractions_sub')}
        />
      </div>

      <AICard
        title={t('central.authorities.advisory_title')}
        subtitle={
          trainingNeeded.length > 0
            ? t('central.authorities.training_needed_count', {
                count: formatNumber(trainingNeeded.length),
              })
            : t('central.authorities.training_not_needed')
        }
      >
        {trainingNeeded.length === 0 ? (
          <p className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <HelpCircle className="size-3.5" aria-hidden="true" />
            {t('central.authorities.all_within_thresholds')}
          </p>
        ) : (
          <ul className="space-y-2">
            {trainingNeeded.slice(0, 4).map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5"
              >
                <Building className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-950">{item.name}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-900">
                    {t('central.authorities.training_card_desc', {
                      compliance: formatNumber(item.compliance_rate),
                      transparency: formatNumber(item.transparency_rate),
                      suspicions: formatNumber(item.suspicions_count),
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AICard>

      <Card className="bg-white shadow-sm border-gray-200">
        <CardHeader className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[var(--ink-900)]">
              {t('central.authorities.ranking_title')}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-gray-500">
              {t('central.authorities.ranking_subtitle')}
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
                placeholder={t('central.authorities.search_placeholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label={t('central.authorities.search_aria')}
                className="ps-8 pe-3 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label={t('central.authorities.filter_eval_aria')}
              className="px-2.5 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
            >
              <option value="all">{t('central.authorities.all_evaluations')}</option>
              <option value="excellent">{t('central.authorities.eval_excellent')}</option>
              <option value="normal">{t('central.authorities.eval_normal')}</option>
              <option value="needs_support">{t('central.authorities.eval_needs_support')}</option>
              <option value="infractions">{t('central.authorities.eval_infractions')}</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px] text-center">{t('central.authorities.col_rank')}</TableHead>
                <TableHead className="min-w-[240px]">{t('central.authorities.col_authority')}</TableHead>
                <TableHead>{t('central.authorities.col_wilaya')}</TableHead>
                <TableHead className="text-center">{t('central.authorities.col_deals')}</TableHead>
                <TableHead className="text-center">{t('central.authorities.col_delayed')}</TableHead>
                <TableHead className="text-end">{t('central.authorities.col_volume')}</TableHead>
                <TableHead className="text-center">{t('central.authorities.col_punctuality')}</TableHead>
                <TableHead className="text-center">{t('central.authorities.col_transparency')}</TableHead>
                <TableHead className="text-center">{t('central.authorities.col_suspicions')}</TableHead>
                <TableHead>{t('central.authorities.col_evaluation')}</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={11}
                loading={loading && !data}
                error={error}
                empty={!loading && filtered.length === 0}
                emptyLabel={
                  authorities.length === 0
                    ? t('central.authorities.no_registered_authorities')
                    : t('central.authorities.empty_authorities')
                }
                onRetry={reload}
              >
                {filtered.map((item) => {
                  const meta = getStatusMeta(item.status, t);
                  return (
                    <TableRow key={item.id} className="transition-colors hover:bg-slate-50/70">
                      <TableCell className="text-center py-2.5">
                        <span
                          className={`inline-flex size-6 items-center justify-center gap-0.5 rounded-full text-xs font-bold ${
                            item.rank <= 3
                              ? 'border border-amber-300 bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.rank <= 3 && (
                            <Trophy className="size-2.5 text-amber-600" aria-hidden="true" />
                          )}
                          <span className="font-mono">{item.rank}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-[var(--ink-900)] py-2.5">
                        <div className="truncate">{item.name || '—'}</div>
                        <div className="font-mono text-xs font-normal text-[var(--ink-500)]">
                          {item.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[var(--ink-700)] py-2.5">
                        {item.wilaya || '—'}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-[var(--ink-900)] py-2.5">
                        {formatNumber(item.deals_count)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold py-2.5">
                        <span
                          className={
                            item.delayed_deals_count > 0
                              ? 'text-[var(--stamp-red-700)]'
                              : 'text-[var(--ink-500)]'
                          }
                        >
                          {formatNumber(item.delayed_deals_count)}
                        </span>
                      </TableCell>
                      <TableCell className="text-end font-mono text-xs font-semibold tabular-nums text-[var(--ink-900)] py-2.5">
                        {formatDZD(item.total_volume_dzd)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Meter value={item.compliance_rate} />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Meter value={item.transparency_rate} tone="navy" />
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold py-2.5">
                        <span
                          className={
                            item.suspicions_count > 0
                              ? 'text-[var(--stamp-red-700)]'
                              : 'text-[var(--ink-500)]'
                          }
                        >
                          {formatNumber(item.suspicions_count)}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-end py-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAuth(item);
                            setIsSheetOpen(true);
                          }}
                          className="h-7 px-2 text-xs text-[var(--stamp-green-700)] hover:bg-slate-100 gap-1"
                        >
                          <Eye className="size-3" aria-hidden="true" />
                          {t('central.authorities.btn_view')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableState>
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-2.5 text-xs text-[var(--ink-500)]">
            <span>
              {t('central.authorities.showing_count', {
                count: formatNumber(filtered.length),
                total: formatNumber(authorities.length),
              })}
            </span>
            <span className="font-mono">
              {t('central.authorities.national_avg_transparency', {
                rate: formatNumber(summary?.average_transparency_rate ?? 0),
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="end" className="overflow-y-auto bg-white p-5 sm:max-w-md">
          {selectedAuth && (
            <div className="space-y-4">
              <SheetHeader className="space-y-1 border-b border-gray-200 pb-3 text-start">
                <span className="text-xs font-semibold text-slate-500">
                  {t('central.authorities.drawer_badge')}
                </span>
                <SheetTitle className="text-base font-bold text-[var(--ink-900)]">
                  {selectedAuth.name || '—'}
                </SheetTitle>
                <SheetDescription className="mt-0.5 text-xs text-[var(--ink-500)]">
                  {t('central.authorities.drawer_header_info', {
                    rank: selectedAuth.rank,
                    wilaya: selectedAuth.wilaya || '—',
                    deals: selectedAuth.deals_count,
                  })}{' '}
                  · {selectedAuth.email}
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <DetailTile
                  label={t('central.authorities.detail_total_deals')}
                  value={formatNumber(selectedAuth.deals_count)}
                />
                <DetailTile
                  label={t('central.authorities.detail_active_deals')}
                  value={formatNumber(selectedAuth.active_deals_count)}
                />
                <DetailTile
                  label={t('central.authorities.detail_completed_deals')}
                  value={formatNumber(selectedAuth.completed_deals_count)}
                />
                <DetailTile
                  label={t('central.authorities.detail_delayed_deals')}
                  value={formatNumber(selectedAuth.delayed_deals_count)}
                  tone="red"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <DetailTile
                  label={t('central.authorities.detail_compliance')}
                  value={`${formatNumber(selectedAuth.compliance_rate)}%`}
                />
                <DetailTile
                  label={t('central.authorities.detail_transparency')}
                  value={`${formatNumber(selectedAuth.transparency_rate)}%`}
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                <div className="mb-0.5 text-xs text-[var(--ink-500)]">
                  {t('central.authorities.detail_total_volume')}
                </div>
                <div className="font-mono text-sm font-bold text-[var(--ink-900)]">
                  {formatDZD(selectedAuth.total_volume_dzd)}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-slate-50 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--ink-900)]">
                  <ShieldCheck className="size-4 text-[var(--stamp-green-700)]" aria-hidden="true" />
                  <span>{t('central.authorities.detail_control_notes')}</span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--ink-700)]">
                  {t('central.authorities.detail_suspicions_line', {
                    suspicions: formatNumber(selectedAuth.suspicions_count),
                    status: getStatusMeta(selectedAuth.status, t).label,
                  })}{' '}
                  ·{' '}
                  {selectedAuth.ai_training_needed
                    ? t('central.authorities.detail_training_needed')
                    : t('central.authorities.detail_training_not_needed')}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-500)]">
                  {t('central.authorities.detail_disclaimer')}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'red';
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2.5">
      <div className="mb-0.5 text-xs text-[var(--ink-500)]">{label}</div>
      <div
        className={`font-mono text-sm font-bold ${
          tone === 'red' ? 'text-[var(--stamp-red-700)]' : 'text-[var(--ink-900)]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default CentralAuthorities;
