import { useMemo, useState } from 'react';
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
 * التقارير الوطنية الموحدة — كتالوج التقارير المولّد من الخادم
 * (GET /api/central/reports/) مع مؤشرات الحصيلة الوطنية.
 *
 * التصدير: تحميل التقرير المحدد بصيغة PDF من الخادم عبر
 * GET /api/central/reports/{report_id}/pdf/
 */

const TYPE_LABELS: Record<string, string> = {
  monthly: 'تقرير شهري',
  quarterly: 'حصيلة ثلاثية',
  annual: 'تقرير سنوي',
  sector: 'تقرير قطاعي',
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  ready: {
    label: 'جاهز',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  archived: {
    label: 'مؤرشف',
    className: 'bg-slate-50 text-slate-700 border-slate-300',
  },
  draft: {
    label: 'مسودة',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
  },
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

function statusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status || 'غير محدّد',
      className: 'bg-slate-50 text-slate-700 border-slate-300',
    }
  );
}

export function CentralReports() {
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

  /**
   * تحميل ملف PDF من الخادم عبر نقطة النهاية المعتمدة.
   * نستخدم عميل api حتى يُضاف Access Token ويُجدَّد تلقائياً عند 401.
   * GET /api/central/reports/{report_id}/pdf/
   */
  const downloadReportPdf = async (reportId: string) => {
    if (!reportId) {
      toast.error('لا يوجد تقرير محدد للتصدير.');
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
      toast.success('تم تحميل التقرير بصيغة PDF.');
    } catch (err) {
      toast.error(extractApiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    const targetId = filtered[0]?.id;
    if (!targetId) {
      toast.error('لا توجد تقارير مطابقة للتصدير.');
      return;
    }
    void downloadReportPdf(targetId);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="التقارير الوطنية الموحدة"
        titleClassName="text-2xl font-bold"
        description="كتالوج التقارير الوطنية المولّدة من الخادم مع مؤشرات الحصيلة الوطنية للصفقات والشفافية."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
              className="text-base"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              تحديث
            </Button>
            <Button
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting || filtered.length === 0}
              className="gap-2 bg-[#0f3154] text-base font-bold text-white hover:bg-[#0b2743]"
            >
              <Download className="size-4" aria-hidden="true" />
              {exporting ? 'جاري التحميل…' : 'تحميل تقرير PDF'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          eyebrow="إجمالي الصفقات"
          value={formatNumber(summary?.total_deals ?? 0)}
          valueClassName="font-sans text-2xl"
          descriptionClassName="text-sm text-gray-500"
          icon={FileText}
          accent="navy"
          description={`${formatNumber(summary?.total_authorities ?? 0)} مصلحة متعاقدة مشمولة`}
        />
        <KpiCard
          eyebrow="الحجم المالي الوطني"
          value=""
          valueClassName="font-sans"
          valueContent={
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl leading-none">
                {formatNumber(Math.round(summary?.total_volume_dzd ?? 0))}
              </span>
              <span className="text-base font-semibold text-gray-500">دج</span>
            </span>
          }
          descriptionClassName="text-sm text-gray-500"
          icon={Wallet}
          accent="emerald"
          description="مجموع الميزانيات التقديرية المسجّلة"
        />
        <KpiCard
          eyebrow="متوسط الالتزام بالآجال"
          value={formatPercent(summary?.average_compliance_rate ?? 0)}
          valueClassName="font-sans text-2xl"
          descriptionClassName="text-sm text-gray-500"
          icon={TrendingUp}
          accent="gold"
          description="متوسط وطني على كل المصالح"
        />
        <KpiCard
          eyebrow="متوسط مؤشر الشفافية"
          value={formatPercent(summary?.average_transparency_rate ?? 0)}
          valueClassName="font-sans text-2xl"
          descriptionClassName="text-sm text-gray-500"
          icon={ShieldCheck}
          accent="red"
          description="دفاتر شروط مؤشّرة وجلسات فتح علنية"
        />
      </div>

      <Card className="bg-white shadow-sm border-gray-200">
        <CardHeader className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[var(--ink-900)]">
              كتالوج التقارير الوطنية
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-500">
              تقارير دورية مولّدة آلياً من بيانات الصفقات والرقابة
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="بحث في التقارير…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="بحث في التقارير الوطنية"
                className="h-10 w-full ps-9 pe-3 text-sm leading-none rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0f3154] sm:w-64"
              />
            </div>

            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              aria-label="تصفية حسب نوع التقرير"
              className="h-10 px-3 text-sm leading-none rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[#0f3154]"
            >
              <option value="all">كل الأنواع</option>
              {reportTypes.map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px] whitespace-nowrap text-sm">
                  معرّف التقرير
                </TableHead>
                <TableHead className="min-w-[260px] text-sm">عنوان التقرير</TableHead>
                <TableHead className="whitespace-nowrap text-sm">النوع</TableHead>
                <TableHead className="whitespace-nowrap text-sm">الفترة</TableHead>
                <TableHead className="min-w-[160px] text-sm">النطاق</TableHead>
                <TableHead className="whitespace-nowrap text-center text-sm">تاريخ التوليد</TableHead>
                <TableHead className="whitespace-nowrap text-center text-sm">الصفقات</TableHead>
                <TableHead className="whitespace-nowrap text-end text-sm">الحجم المالي</TableHead>
                <TableHead className="whitespace-nowrap text-center text-sm">الالتزام</TableHead>
                <TableHead className="whitespace-nowrap text-center text-sm">الشفافية</TableHead>
                <TableHead className="whitespace-nowrap text-sm">الحالة</TableHead>
                <TableHead className="whitespace-nowrap text-center text-sm print:hidden">
                  التحميل
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={12}
                loading={loading && !data}
                error={error}
                empty={!loading && filtered.length === 0}
                emptyLabel="لا توجد تقارير مطابقة للبحث أو التصفية الحالية."
                onRetry={reload}
              >
                {filtered.map((report: CentralReportCatalogItem) => {
                  const meta = statusMeta(report.status);
                  return (
                    <TableRow
                      key={report.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <TableCell className="whitespace-nowrap text-sm font-bold text-[var(--ink-900)]">
                        {report.id}
                      </TableCell>
                      <TableCell className="min-w-[260px] text-sm font-semibold text-[var(--ink-900)]">
                        <span className="line-clamp-2">{report.title}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-[var(--ink-700)]">
                        {typeLabel(report.type)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-[var(--ink-700)]">
                        {report.period || '—'}
                      </TableCell>
                      <TableCell className="min-w-[160px] text-sm leading-relaxed text-[var(--ink-700)]">
                        {report.wilaya_scope || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-sm tabular-nums text-[var(--ink-700)]">
                        {formatDate(report.generated_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-sm font-bold tabular-nums text-[var(--ink-900)]">
                        {formatNumber(report.total_deals)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-end text-sm font-semibold tabular-nums text-[var(--ink-900)]">
                        {formatDZD(report.total_volume_dzd)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-sm tabular-nums text-[var(--ink-700)]">
                        {formatPercent(report.average_compliance_rate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center text-sm tabular-nums text-[var(--ink-700)]">
                        {formatPercent(report.average_transparency_rate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center print:hidden">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void downloadReportPdf(report.id)}
                          disabled={exporting}
                          className="h-8 gap-1 text-sm font-semibold text-[#0f3154] hover:bg-slate-100"
                          title="تحميل التقرير بصيغة PDF"
                        >
                          <Download className="size-3.5" />
                          <span>PDF</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableState>
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-6 py-4 text-sm text-gray-500">
            <span>
              عرض {formatNumber(filtered.length)} من أصل {formatNumber(reports.length)} تقريراً
            </span>
            <span className="print:hidden">
              زر التحميل في الأعلى يعرض أول تقرير مطابق؛ ويمكنك تحميل أي تقرير مباشرة من عمود PDF.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentralReports;
