import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { api, extractApiErrorMessage } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Sparkles,
  Calendar,
  Filter,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

import { PageHeader } from '@/shared/components';

/**
 * تقارير المصلحة المتعاقدة — تُحسب من صفقاتها الحقيقية في الخادم
 * (GET /api/procurements/deals/) دون أي بيانات بديلة.
 *
 * التصدير: ملف CSV حقيقي من الصفوف المعروضة (لا يوجد تضليل بحالة نجاح وهمية)،
 * وتقرير PDF الوطني القابل للأرشفة متاح لحسابات الرقابة المركزية عبر
 * GET /api/central/reports/{id}/pdf/.
 */

interface DealRow {
  id: string;
  authority?: string;
  created_at?: string;
  estimated_budget?: string | number | null;
  current_stage?: number;
}

interface PeriodReport {
  key: string;
  label: string;
  dealsCount: number;
  completedCount: number;
  activeCount: number;
  budget: number;
}

interface AuthorityInsight {
  id?: string;
  title?: string;
  description?: string;
  severity?: string;
}

const numberFormatter = new Intl.NumberFormat('ar-DZ-u-nu-latn', { maximumFractionDigits: 0 });
const monthFormatter = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', {
  month: 'long',
  year: 'numeric',
});

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function formatDzd(value: number): string {
  return `${numberFormatter.format(Math.round(value))} دج`;
}

export function ReportsView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const authorityId = user?.id ?? '';

  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const [aiLoading, setAiLoading] = useState(false);
  const [insights, setInsights] = useState<AuthorityInsight[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<unknown>('/procurements/deals/');
      const payload = res.data;
      const list = Array.isArray(payload)
        ? (payload as DealRow[])
        : ((payload as { results?: DealRow[] })?.results ?? []);
      setDeals(list.filter((deal) => !authorityId || deal.authority === authorityId));
    } catch (err) {
      setError(extractApiErrorMessage(err));
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [authorityId]);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  /** تجميع الصفقات في تقارير شهرية حقيقية. */
  const periodReports = useMemo<PeriodReport[]>(() => {
    const buckets = new Map<string, PeriodReport>();

    for (const deal of deals) {
      const created = deal.created_at ? new Date(deal.created_at) : null;
      if (!created || Number.isNaN(created.getTime())) continue;

      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      const current = buckets.get(key) ?? {
        key,
        label: monthFormatter.format(created),
        dealsCount: 0,
        completedCount: 0,
        activeCount: 0,
        budget: 0,
      };

      const stage = toNumber(deal.current_stage);
      current.dealsCount += 1;
      if (stage >= 12) current.completedCount += 1;
      else current.activeCount += 1;
      current.budget += toNumber(deal.estimated_budget);
      buckets.set(key, current);
    }

    return Array.from(buckets.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [deals]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(periodReports.map((report) => report.key.slice(0, 4)))).sort(
      (a, b) => b.localeCompare(a),
    );
  }, [periodReports]);

  const filteredReports = useMemo(() => {
    if (selectedYear === 'all') return periodReports;
    return periodReports.filter((report) => report.key.startsWith(selectedYear));
  }, [periodReports, selectedYear]);

  const totals = useMemo(() => {
    return filteredReports.reduce(
      (acc, report) => ({
        deals: acc.deals + report.dealsCount,
        completed: acc.completed + report.completedCount,
        budget: acc.budget + report.budget,
      }),
      { deals: 0, completed: 0, budget: 0 },
    );
  }, [filteredReports]);

  const handleGenerateInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    setInsights([]);

    try {
      const res = await api.get<unknown>('/ai/authority/insights/');
      const payload = res.data;
      const list = Array.isArray(payload)
        ? (payload as AuthorityInsight[])
        : ((payload as { insights?: AuthorityInsight[]; results?: AuthorityInsight[] })?.insights ??
          (payload as { results?: AuthorityInsight[] })?.results ??
          []);

      if (list.length === 0) {
        setAiError('لا توجد توصيات استشارية منشورة حالياً لهذه المصلحة.');
      } else {
        setInsights(list.slice(0, 3));
      }
    } catch (err) {
      setAiError(extractApiErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  };

  /** تصدير حقيقي: ملف CSV من الصفوف المعروضة حالياً. */
  const handleExportCsv = () => {
    if (filteredReports.length === 0) return;

    const header = ['الفترة', 'عدد الصفقات', 'المكتملة', 'الجارية', 'الميزانية الإجمالية (دج)'];
    const rows = filteredReports.map((report) => [
      report.label,
      String(report.dealsCount),
      String(report.completedCount),
      String(report.activeCount),
      String(Math.round(report.budget)),
    ]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.join(';')).join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `safaqat_reports_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="فضاء المصلحة المتعاقدة"
        title={t('authority.reports.title')}
        description={t('authority.reports.subtitle')}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge className="bg-amber-500/20 text-amber-700 border-amber-300 dark:text-amber-300 px-3 py-1 text-xs">
              استشاري فقط
            </Badge>
            <Button
              onClick={handleGenerateInsights}
              disabled={aiLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 text-xs shadow-sm h-10 px-4"
            >
              <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
              <span>{aiLoading ? 'جاري التحليل...' : t('authority.reports.generate_ai')}</span>
            </Button>
          </div>
        }
      />

      {aiError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">توصيات الذكاء الاصطناعي</p>
            <p className="mt-1 leading-relaxed">{aiError}</p>
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>توصيات استشارية من الخادم</span>
              </CardTitle>
              <Badge variant="outline" className="border-emerald-300 text-emerald-800 text-[11px]">
                استشاري فقط · لا يُغني عن قرار اللجنة
              </Badge>
            </div>
            <CardDescription className="text-xs text-emerald-700">
              نصوص صادرة من محرك التحليل في الخادم، دون أي صياغة محلية.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {insights.map((insight, index) => (
              <div
                key={insight.id ?? index}
                className="rounded-xl border border-emerald-100 bg-white/80 p-3"
              >
                {insight.title && (
                  <p className="text-sm font-bold text-emerald-950">{insight.title}</p>
                )}
                <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                  {insight.description || '—'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold">تقارير النشاط الشهرية</CardTitle>
              <CardDescription className="text-xs">
                محسوبة من صفقات مصلحتك المسجّلة في المنصة
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                aria-label="تصفية حسب السنة"
                className="text-xs bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">كل السنوات</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={filteredReports.length === 0}
                className="text-xs gap-1.5 h-8 border-border hover:bg-muted"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>تصدير CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadDeals()}
                disabled={loading}
                className="text-xs gap-1.5 h-8 border-border hover:bg-muted"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>تحديث</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                {error}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void loadDeals()}
                className="h-7 text-xs"
              >
                إعادة المحاولة
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs">
                  <th className="py-3 px-4 text-start font-bold">الفترة</th>
                  <th className="py-3 px-4 text-start font-bold">عدد الصفقات</th>
                  <th className="py-3 px-4 text-start font-bold">المكتملة</th>
                  <th className="py-3 px-4 text-start font-bold">الجارية</th>
                  <th className="py-3 px-4 text-start font-bold">الميزانية الإجمالية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                      جارٍ تحميل الصفقات من الخادم…
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredReports.map((report) => (
                    <tr key={report.key} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                            <FileText className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <span>{report.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        {numberFormatter.format(report.dealsCount)} صفقات
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {numberFormatter.format(report.completedCount)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {numberFormatter.format(report.activeCount)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono font-bold text-foreground">
                        {formatDzd(report.budget)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!loading && !error && filteredReports.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              {deals.length === 0
                ? 'لا توجد صفقات مسجّلة باسم مصلحتك بعد، فلا توجد تقارير لعرضها.'
                : 'لا توجد صفقات مطابقة للسنة المحددة.'}
            </div>
          )}

          {!loading && filteredReports.length > 0 && (
            <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {filteredReports.length} تقريراً شهرياً
              </span>
              <span className="font-mono">
                {numberFormatter.format(totals.deals)} صفقة · {formatDzd(totals.budget)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
