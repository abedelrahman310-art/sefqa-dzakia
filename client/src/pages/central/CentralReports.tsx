import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { toast } from 'sonner';
import { PageHeader, KpiCard } from '@/shared/components';
import {
  FileText,
  Wallet,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Download,
  Search,
} from 'lucide-react';
import { api, extractApiErrorMessage } from '@/lib/api';
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
  fetchCentralReports,
  useCentralResource,
  type CentralReportCatalogItem,
} from './centralApi';
import { TableState, formatDZD, formatDate, formatNumber, formatPercent } from './centralUi';

/**
 * Consolidated National Reports — generated catalog from GET /api/central/reports/
 * with national summary indicators and PDF export.
 */

function getTypeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    monthly: t('central.reports.type_monthly'),
    quarterly: t('central.reports.type_quarterly'),
    annual: t('central.reports.type_annual'),
    sector: t('central.reports.type_sector'),
  };
  return map[type] ?? type;
}

function getStatusMeta(status: string, t: (key: string) => string) {
  const map: Record<string, { label: string; className: string }> = {
    ready: {
      label: t('central.reports.status_ready'),
      className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    archived: {
      label: t('central.reports.status_archived'),
      className: 'bg-slate-50 text-slate-700 border-slate-300',
    },
    draft: {
      label: t('central.reports.status_draft'),
      className: 'bg-amber-50 text-amber-800 border-amber-300',
    },
  };
  return (
    map[status] ?? {
      label: status || t('central.reports.status_unspecified'),
      className: 'bg-slate-50 text-slate-700 border-slate-300',
    }
  );
}

export function CentralReports() {
  const { dir, t } = useI18n();
  const { data, loading, error, reload } = useCentralResource(fetchCentralReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [exporting, setExporting] = useState(false);

  const summary = data?.national_summary;
  const reports = useMemo(() => data?.reports ?? [], [data]);

  const reportTypes = useMemo(
    () => Array.from(new Set(reports.map((item) => item.type).filter(Boolean))),
    [reports],
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return reports.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (!query) return true;
      return (
        (item.title ?? '').toLowerCase().includes(query) ||
        (item.id ?? '').toLowerCase().includes(query) ||
        (item.period ?? '').toLowerCase().includes(query) ||
        (item.wilaya_scope ?? '').toLowerCase().includes(query)
      );
    });
  }, [reports, searchQuery, filterType]);

  const downloadReportPdf = async (reportId: string) => {
    if (!reportId) {
      toast.error(t('central.reports.no_report_selected'));
      return;
    }

    try {
      setExporting(true);
      const response = await api.get<Blob>(
        `/central/reports/${reportId}/pdf/`,
        { responseType: 'blob' },
      );
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safaqat_report_${reportId.toLowerCase().replace(/-/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success(t('central.reports.pdf_downloaded'));
    } catch (err) {
      toast.error(extractApiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    const targetId = filtered[0]?.id;
    if (!targetId) {
      toast.error(t('central.reports.no_matching_reports'));
      return;
    }
    void downloadReportPdf(targetId);
  };

  return (
    <div className="space-y-4" dir={dir}>
      <PageHeader
        title={t('central.reports.title')}
        titleClassName="text-xl font-bold"
        description={t('central.reports.description')}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
              className="text-xs h-8 gap-1.5"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              {t('central.reports.refresh')}
            </Button>
            <Button
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting || filtered.length === 0}
              className="gap-1.5 bg-[#0f3154] text-xs font-bold text-white hover:bg-[#0b2743] h-8"
            >
              <Download className="size-3.5" aria-hidden="true" />
              {exporting ? t('central.reports.downloading') : t('central.reports.download_pdf')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          eyebrow={t('central.reports.kpi_total_deals')}
          value={formatNumber(summary?.total_deals ?? 0)}
          valueClassName="font-sans text-xl font-bold"
          descriptionClassName="text-xs text-gray-500"
          icon={FileText}
          accent="navy"
          description={t('central.reports.kpi_authorities_covered', {
            count: formatNumber(summary?.total_authorities ?? 0),
          })}
        />
        <KpiCard
          eyebrow={t('central.reports.kpi_national_volume')}
          value=""
          valueClassName="font-sans"
          valueContent={
            <span className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-xl font-bold leading-none">
                {formatNumber(Math.round(summary?.total_volume_dzd ?? 0))}
              </span>
              <span className="text-xs font-semibold text-gray-500">{t('central.ui.dzd')}</span>
            </span>
          }
          descriptionClassName="text-xs text-gray-500"
          icon={Wallet}
          accent="emerald"
          description={t('central.reports.kpi_national_volume_sub')}
        />
        <KpiCard
          eyebrow={t('central.reports.kpi_avg_punctuality')}
          value={formatPercent(summary?.average_compliance_rate ?? 0)}
          valueClassName="font-sans text-xl font-bold"
          descriptionClassName="text-xs text-gray-500"
          icon={TrendingUp}
          accent="gold"
          description={t('central.reports.kpi_avg_punctuality_sub')}
        />
        <KpiCard
          eyebrow={t('central.reports.kpi_avg_transparency')}
          value={formatPercent(summary?.average_transparency_rate ?? 0)}
          valueClassName="font-sans text-xl font-bold"
          descriptionClassName="text-xs text-gray-500"
          icon={ShieldCheck}
          accent="red"
          description={t('central.reports.kpi_avg_transparency_sub')}
        />
      </div>

      <Card className="bg-white shadow-sm border-gray-200">
        <CardHeader className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[var(--ink-900)]">
              {t('central.reports.catalog_title')}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-gray-500">
              {t('central.reports.catalog_subtitle')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder={t('central.reports.search_placeholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label={t('central.reports.search_aria')}
                className="h-8 w-full ps-8 pe-3 text-xs leading-none rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0f3154] sm:w-64"
              />
            </div>

            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              aria-label={t('central.reports.filter_type_aria')}
              className="h-8 px-2.5 text-xs leading-none rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[#0f3154]"
            >
              <option value="all">{t('central.reports.all_types')}</option>
              {reportTypes.map((type) => (
                <option key={type} value={type}>
                  {getTypeLabel(type, t)}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px] whitespace-nowrap text-xs">
                  {t('central.reports.col_id')}
                </TableHead>
                <TableHead className="min-w-[260px] text-xs">{t('central.reports.col_title')}</TableHead>
                <TableHead className="whitespace-nowrap text-xs">{t('central.reports.col_type')}</TableHead>
                <TableHead className="whitespace-nowrap text-xs">{t('central.reports.col_period')}</TableHead>
                <TableHead className="min-w-[160px] text-xs">{t('central.reports.col_scope')}</TableHead>
                <TableHead className="whitespace-nowrap text-center text-xs">{t('central.reports.col_gen_date')}</TableHead>
                <TableHead className="whitespace-nowrap text-center text-xs">{t('central.reports.col_deals')}</TableHead>
                <TableHead className="whitespace-nowrap text-end text-xs">{t('central.reports.col_volume')}</TableHead>
                <TableHead className="whitespace-nowrap text-center text-xs">{t('central.reports.col_compliance')}</TableHead>
                <TableHead className="whitespace-nowrap text-center text-xs">{t('central.reports.col_transparency')}</TableHead>
                <TableHead className="whitespace-nowrap text-xs">{t('central.reports.col_status')}</TableHead>
                <TableHead className="whitespace-nowrap text-center text-xs print:hidden">
                  {t('central.reports.col_download')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={12}
                loading={loading && !data}
                error={error}
                empty={!loading && filtered.length === 0}
                emptyLabel={t('central.reports.empty_reports')}
                onRetry={reload}
              >
                {filtered.map((report: CentralReportCatalogItem) => {
                  const meta = getStatusMeta(report.status, t);
                  return (
                    <TableRow
                      key={report.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <TableCell className="whitespace-nowrap text-xs font-bold text-[var(--ink-900)] py-2.5">
                        {report.id}
                      </TableCell>
                      <TableCell className="min-w-[260px] text-xs font-semibold text-[var(--ink-900)] py-2.5">
                        <span className="line-clamp-2">{report.title}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-[var(--ink-700)] py-2.5">
                        {getTypeLabel(report.type, t)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-[var(--ink-700)] py-2.5">
                        {report.period || '—'}
                      </TableCell>
                      <TableCell className="min-w-[160px] text-xs leading-relaxed text-[var(--ink-700)] py-2.5">
                        {report.wilaya_scope || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-xs tabular-nums text-[var(--ink-700)] py-2.5">
                        {formatDate(report.generated_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-xs font-bold tabular-nums text-[var(--ink-900)] py-2.5">
                        {formatNumber(report.total_deals)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-end text-xs font-semibold tabular-nums text-[var(--ink-900)] py-2.5">
                        {formatDZD(report.total_volume_dzd)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-xs tabular-nums text-[var(--ink-700)] py-2.5">
                        {formatPercent(report.average_compliance_rate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-xs tabular-nums text-[var(--ink-700)] py-2.5">
                        {formatPercent(report.average_transparency_rate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2.5">
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center print:hidden py-2.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void downloadReportPdf(report.id)}
                          disabled={exporting}
                          className="h-7 gap-1 text-xs font-semibold text-[#0f3154] hover:bg-slate-100"
                          title={t('central.reports.download_tooltip')}
                        >
                          <Download className="size-3" />
                          <span>PDF</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableState>
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-2.5 text-xs text-gray-500">
            <span>
              {t('central.reports.summary_footer', {
                count: formatNumber(filtered.length),
                total: formatNumber(reports.length),
              })}
            </span>
            <span className="print:hidden">
              {t('central.reports.download_notice')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentralReports;
