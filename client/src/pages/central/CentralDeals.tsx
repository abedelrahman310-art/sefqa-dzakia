import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { PageHeader, KpiCard } from '@/shared/components';
import {
  Briefcase,
  Activity,
  CheckCircle2,
  Wallet,
  Search,
  RefreshCw,
  Clock,
  Scale,
  ShieldAlert,
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
import { fetchNationalDeals, toNumber, useCentralResource } from './centralApi';
import {
  TableState,
  formatDate,
  formatDZD,
  formatNumber,
  formatPercent,
  useNow,
} from './centralUi';
import type { ProcurementDealApi } from '@/lib/procurementApiTypes';

/**
 * National Deals Registry — 12 lifecycle stages oversight
 * based on live server data (GET /api/procurements/deals/).
 */

interface StageDefinition {
  id: number;
  label: string;
  short: string;
}

function getStages(t: (key: string) => string): StageDefinition[] {
  return [
    { id: 1, label: t('central.deals.stage_1'), short: t('central.deals.stage_1_short') },
    { id: 2, label: t('central.deals.stage_2'), short: t('central.deals.stage_2_short') },
    { id: 3, label: t('central.deals.stage_3'), short: t('central.deals.stage_3_short') },
    { id: 4, label: t('central.deals.stage_4'), short: t('central.deals.stage_4_short') },
    { id: 5, label: t('central.deals.stage_5'), short: t('central.deals.stage_5_short') },
    { id: 6, label: t('central.deals.stage_6'), short: t('central.deals.stage_6_short') },
    { id: 7, label: t('central.deals.stage_7'), short: t('central.deals.stage_7_short') },
    { id: 8, label: t('central.deals.stage_8'), short: t('central.deals.stage_8_short') },
    { id: 9, label: t('central.deals.stage_9'), short: t('central.deals.stage_9_short') },
    { id: 10, label: t('central.deals.stage_10'), short: t('central.deals.stage_10_short') },
    { id: 11, label: t('central.deals.stage_11'), short: t('central.deals.stage_11_short') },
    { id: 12, label: t('central.deals.stage_12'), short: t('central.deals.stage_12_short') },
  ];
}

const CLOSED_STAGE = 12;

function isDelayed(deal: ProcurementDealApi, now: number): boolean {
  if (!deal.submission_deadline) return false;
  const deadline = new Date(deal.submission_deadline).getTime();
  if (Number.isNaN(deadline)) return false;
  const stage = toNumber(deal.current_stage);
  return deadline < now && stage >= 3 && stage <= 8;
}

export function CentralDeals() {
  const { dir, t } = useI18n();
  const { data, loading, error, reload } = useCentralResource(fetchNationalDeals);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [onlyDelayed, setOnlyDelayed] = useState(false);
  const [onlyAvenantAlerts, setOnlyAvenantAlerts] = useState(false);
  const [onlyNoticeAlerts, setOnlyNoticeAlerts] = useState(false);

  const now = useNow(60000);
  const stages = useMemo(() => getStages(t), [t]);
  const deals = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const total = deals.length;
    const active = deals.filter((deal) => {
      const stage = toNumber(deal.current_stage);
      return stage >= 1 && stage < CLOSED_STAGE;
    }).length;
    const closed = deals.filter((deal) => toNumber(deal.current_stage) === CLOSED_STAGE).length;
    const delayed = deals.filter((deal) => isDelayed(deal, now)).length;
    const budget = deals.reduce((sum, deal) => sum + toNumber(deal.estimated_budget), 0);
    const avenantAlerts = deals.filter((deal) => {
      const pct = (deal as any).total_avenant_percentage;
      return (typeof pct === 'number' && pct >= 20.0) || (deal as any).has_avenant_warning;
    });
    const avenantAlertsCount = avenantAlerts.length;
    const noticeAlerts = deals.filter((deal) => {
      return Boolean(
        (deal as any).has_expired_notice ||
        ((deal as any).active_legal_notices_count && (deal as any).active_legal_notices_count > 0) ||
        ((deal as any).legal_notices_count && (deal as any).legal_notices_count > 0)
      );
    });
    const noticeAlertsCount = noticeAlerts.length;
    const expiredNoticesCount = deals.filter((deal) => Boolean((deal as any).has_expired_notice)).length;

    const perStage = stages.map((stage) => {
      const count = deals.filter((deal) => toNumber(deal.current_stage) === stage.id).length;
      return { ...stage, count, share: total > 0 ? (count / total) * 100 : 0 };
    });

    return { total, active, closed, delayed, budget, perStage, avenantAlertsCount, avenantAlerts, noticeAlertsCount, expiredNoticesCount };
  }, [deals, now, stages]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return deals
      .filter((deal) => {
        const stage = toNumber(deal.current_stage);
        if (filterStage !== 'all' && stage !== Number(filterStage)) return false;
        if (onlyDelayed && !isDelayed(deal, now)) return false;
        if (onlyNoticeAlerts) {
          const hasNotice = Boolean(
            (deal as any).has_expired_notice ||
            ((deal as any).active_legal_notices_count && (deal as any).active_legal_notices_count > 0) ||
            ((deal as any).legal_notices_count && (deal as any).legal_notices_count > 0)
          );
          if (!hasNotice) return false;
        }
        if (onlyAvenantAlerts) {
          const pct = (deal as any).total_avenant_percentage;
          if (!((typeof pct === 'number' && pct >= 20.0) || (deal as any).has_avenant_warning)) return false;
        }
        if (!query) return true;
        return (
          (deal.title ?? '').toLowerCase().includes(query) ||
          (deal.reference_number ?? '').toLowerCase().includes(query) ||
          (deal.authority_name ?? '').toLowerCase().includes(query) ||
          (deal.wilaya ?? '').toLowerCase().includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [deals, searchQuery, filterStage, onlyDelayed, onlyAvenantAlerts, onlyNoticeAlerts, now]);

  const stageDefinition = (stage: number): StageDefinition => {
    return stages.find((item) => item.id === stage) ?? stages[0];
  };

  return (
    <div className="space-y-4" dir={dir}>
      <PageHeader
        title={t('central.deals.title')}
        titleClassName="text-xl font-bold"
        description={t('central.deals.description')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {t('central.deals.refresh')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          eyebrow={t('central.deals.kpi_total')}
          value={formatNumber(stats.total)}
          icon={Briefcase}
          accent="navy"
          description={t('central.deals.kpi_total_sub')}
        />
        <KpiCard
          eyebrow={t('central.deals.kpi_active')}
          value={formatNumber(stats.active)}
          icon={Activity}
          accent="emerald"
          description={t('central.deals.kpi_delayed_sub', {
            count: formatNumber(stats.delayed),
          })}
        />
        <KpiCard
          eyebrow={t('central.deals.kpi_closed')}
          value={formatNumber(stats.closed)}
          icon={CheckCircle2}
          accent="gold"
          description={t('central.deals.kpi_closed_sub')}
        />
        <KpiCard
          eyebrow={t('central.deals.kpi_volume')}
          value={formatDZD(stats.budget)}
          icon={Wallet}
          accent="red"
          description={t('central.deals.kpi_volume_sub')}
        />
        <KpiCard
          eyebrow={t('central.deals.avenantAlerts') || 'صفقات تجاوزت نسبة الملاحق'}
          value={formatNumber(stats.avenantAlertsCount)}
          icon={Scale}
          accent={stats.avenantAlertsCount > 0 ? 'red' : 'emerald'}
          description={stats.avenantAlertsCount > 0 ? 'مخالفات سقف 20% - 25% (مرسوم 15-247)' : 'كافة الملاحق مطابقة للسقف'}
          className={onlyAvenantAlerts ? 'ring-2 ring-rose-500' : ''}
        />
        <KpiCard
          eyebrow={t('central.deals.noticesAlerts') || 'الاعذارات القانونية والمهل'}
          value={formatNumber(stats.noticeAlertsCount)}
          icon={AlertTriangle}
          accent={stats.expiredNoticesCount > 0 ? 'red' : stats.noticeAlertsCount > 0 ? 'amber' : 'emerald'}
          description={
            stats.expiredNoticesCount > 0
              ? `${stats.expiredNoticesCount} صفقات بها غرامات تأخير`
              : stats.noticeAlertsCount > 0
              ? `${stats.noticeAlertsCount} صفقات بإعذارات نشطة`
              : 'لا توجد اعذارات قانونية'
          }
          className={onlyNoticeAlerts ? 'ring-2 ring-amber-500' : ''}
        />
      </div>

      {stats.expiredNoticesCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-bold">
              متابعة التأخيرات المركزية: يوجد {stats.expiredNoticesCount} صفقات انتهت مهلتها القانونية دون تسوية وتخضع لاقتطاع غرامات التأخير آلياً (المادة 147 من المرسوم 15-247).
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOnlyNoticeAlerts(!onlyNoticeAlerts)}
            className="h-7 text-xs font-bold border-amber-400 text-amber-900 hover:bg-amber-100 shrink-0"
          >
            {onlyNoticeAlerts ? 'عرض كافة الصفقات' : 'تصفية صفقات الاعذارات'}
          </Button>
        </div>
      )}

      {stats.avenantAlertsCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-bold">
              تنبيه رقابي وطني: يوجد {stats.avenantAlertsCount} صفقات تجاوزت فيها الملاحق التعاقدية الحدود القانونية (20% أو 25%) وفقاً للمادتين 138 و139 من المرسوم الرئاسي 15-247.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOnlyAvenantAlerts(!onlyAvenantAlerts)}
            className="h-7 text-xs font-bold border-rose-300 text-rose-800 hover:bg-rose-100 shrink-0"
          >
            {onlyAvenantAlerts ? 'عرض كافة الصفقات' : 'تصفية الصفقات المخالفة'}
          </Button>
        </div>
      )}

      <Card className="bg-white shadow-xs border-gray-200">
        <CardHeader className="border-b border-gray-200 p-4 pb-3">
          <CardTitle className="text-base font-bold text-[var(--ink-900)]">
            {t('central.deals.stages_distribution_title')}
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs text-gray-500">
            {t('central.deals.stages_distribution_subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-3.5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {stats.perStage.map((stage) => (
              <div
                key={stage.id}
                className="rounded-lg border border-gray-200 bg-white p-2.5"
                title={`${stage.id}. ${stage.label}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--ink-500)]">
                    {String(stage.id).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-sm font-bold text-[var(--ink-900)]">
                    {formatNumber(stage.count)}
                  </span>
                </div>
                <div className="mt-1 truncate text-xs font-semibold text-[var(--ink-700)]">
                  {stage.short}
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--paper-200)]">
                  <div
                    className="h-full rounded-full bg-[var(--stamp-green-700)]"
                    style={{ width: `${Math.min(100, stage.share)}%` }}
                  />
                </div>
                <div className="mt-1 font-mono text-xs text-[var(--ink-500)]">
                  {formatPercent(stage.share)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-xs border-gray-200">
        <CardHeader className="flex flex-col gap-3 border-b border-gray-200 p-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[var(--ink-900)]">
              {t('central.deals.registry_title')}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-[var(--ink-500)]">
              {t('central.deals.registry_subtitle')}
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
                placeholder={t('central.deals.search_placeholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label={t('central.deals.search_aria')}
                className="ps-8 pe-3 py-1 text-xs rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)] h-8"
              />
            </div>

            <select
              value={filterStage}
              onChange={(event) => setFilterStage(event.target.value)}
              aria-label={t('central.deals.filter_stage_aria')}
              className="px-2 py-1 text-xs rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)] h-8"
            >
              <option value="all">{t('central.deals.all_stages')}</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {String(stage.id).padStart(2, '0')} — {stage.label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-700)] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyDelayed}
                onChange={(event) => setOnlyDelayed(event.target.checked)}
                className="size-3.5 accent-[var(--stamp-green-700)]"
              />
              {t('central.deals.filter_delayed_only')}
            </label>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[110px] text-xs font-bold">{t('central.deals.col_ref')}</TableHead>
                <TableHead className="min-w-[200px] text-xs font-bold">{t('central.deals.col_title')}</TableHead>
                <TableHead className="text-xs font-bold">{t('central.deals.col_authority')}</TableHead>
                <TableHead className="text-xs font-bold">{t('central.deals.col_wilaya')}</TableHead>
                <TableHead className="text-end text-xs font-bold">{t('central.deals.col_budget')}</TableHead>
                <TableHead className="min-w-[170px] text-xs font-bold">{t('central.deals.col_stage')}</TableHead>
                <TableHead className="text-center text-xs font-bold">{t('central.deals.col_deadline')}</TableHead>
                <TableHead className="text-center text-xs font-bold">{t('central.deals.col_delay')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={8}
                loading={loading && !data}
                error={error}
                empty={!loading && filtered.length === 0}
                emptyLabel={
                  deals.length === 0
                    ? t('central.deals.no_registered_deals')
                    : t('central.deals.empty_deals')
                }
                onRetry={reload}
              >
                {filtered.map((deal) => {
                  const stage = toNumber(deal.current_stage);
                  const definition = stageDefinition(stage);
                  const delayed = isDelayed(deal, now);
                  return (
                    <TableRow
                      key={deal.id}
                      className="transition-colors hover:bg-slate-50/70 text-xs"
                    >
                      <TableCell className="font-mono text-xs font-bold text-[var(--ink-900)]">
                        {deal.reference_number || '—'}
                      </TableCell>
                      <TableCell className="max-w-[280px] text-xs font-semibold text-[var(--ink-900)]">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{deal.title || '—'}</span>
                          {Boolean((deal as any).total_avenant_percentage && (deal as any).total_avenant_percentage >= 20.0) && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                                (deal as any).total_avenant_percentage >= 25.0
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                              title="نسبة الملاحق التعاقدية (المرسوم 15-247)"
                            >
                              ملحق {((deal as any).total_avenant_percentage as number).toFixed(0)}%
                            </span>
                          )}
                          {Boolean((deal as any).has_expired_notice) && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 bg-rose-100 text-rose-800 border border-rose-200"
                              title="إعذار منتهي المهلة وغرامات مفروضة (المرسوم 15-247)"
                            >
                              إعذار منتهي
                            </span>
                          )}
                          {Boolean(!(deal as any).has_expired_notice && (deal as any).active_legal_notices_count > 0) && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 bg-amber-100 text-amber-800 border border-amber-200"
                              title="إعذار قانوني نشط ضمن المهلة"
                            >
                              إعذار نشط
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-normal text-[var(--ink-500)]">
                          {t('central.deals.created_at', { date: formatDate(deal.created_at) })}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-[var(--ink-700)]">
                        {deal.authority_name || deal.authority_entity || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--ink-700)]">
                        {deal.wilaya || '—'}
                      </TableCell>
                      <TableCell className="text-end font-mono text-xs font-semibold tabular-nums text-[var(--ink-900)]">
                        {formatDZD(toNumber(deal.estimated_budget))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-[var(--paper-100)] text-[var(--ink-900)] border-gray-200 font-mono text-xs px-1.5 py-0">
                            {String(stage).padStart(2, '0')}
                          </Badge>
                          <span className="truncate text-xs font-semibold text-[var(--ink-700)]">
                            {definition.short}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-0.5" aria-hidden="true">
                          {stages.map((item) => (
                            <span
                              key={item.id}
                              title={`${item.id}. ${item.label}`}
                              className={`h-1 flex-1 rounded-full ${
                                item.id <= stage
                                  ? 'bg-[var(--stamp-green-700)]'
                                  : 'bg-[var(--paper-200)]'
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-[var(--ink-700)]">
                        {formatDate(deal.submission_deadline)}
                      </TableCell>
                      <TableCell className="text-center">
                        {delayed ? (
                          <Badge className="bg-red-50 text-red-800 border-red-300 text-xs px-1.5 py-0.5">
                            <Clock className="size-2.5" aria-hidden="true" />
                            {t('central.deals.delayed')}
                          </Badge>
                        ) : (
                          <span className="text-xs text-[var(--ink-500)]">{t('central.deals.on_time')}</span>
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
              {t('central.deals.showing_count', {
                count: formatNumber(filtered.length),
                total: formatNumber(stats.total),
              })}
            </span>
            <span className="font-mono">
              {t('central.deals.delayed_count', {
                count: formatNumber(stats.delayed),
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentralDeals;
