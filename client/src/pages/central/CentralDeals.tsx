import { useMemo, useState } from 'react';
import { PageHeader, KpiCard } from '@/shared/components';
import {
  Briefcase,
  Activity,
  CheckCircle2,
  Wallet,
  Search,
  RefreshCw,
  Clock,
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
 * السجل الوطني للصفقات — عرض دورة الحياة الكاملة في 12 مرحلة
 * بالاعتماد على بيانات الخادم (GET /api/procurements/deals/).
 */

interface StageDefinition {
  id: number;
  label: string;
  short: string;
}

const STAGES: StageDefinition[] = [
  { id: 1, label: 'التخطيط والاحتياج', short: 'التخطيط' },
  { id: 2, label: 'إعداد دفتر الشروط', short: 'دفتر الشروط' },
  { id: 3, label: 'نشر الإعلان', short: 'النشر' },
  { id: 4, label: 'استفسارات المتعاملين', short: 'الاستفسارات' },
  { id: 5, label: 'استلام العروض', short: 'استلام العروض' },
  { id: 6, label: 'الفحص الإداري والفني والمالي', short: 'الفحص' },
  { id: 7, label: 'التقييم والمقارنة', short: 'التقييم' },
  { id: 8, label: 'الإسناد والطعون', short: 'الإسناد' },
  { id: 9, label: 'إبرام العقد', short: 'العقد' },
  { id: 10, label: 'التنفيذ والتعديلات', short: 'التنفيذ' },
  { id: 11, label: 'الاستلام المؤقت والنهائي', short: 'الاستلام' },
  { id: 12, label: 'الأداء والدفع والإغلاق', short: 'الإغلاق' },
];

const CLOSED_STAGE = 12;

function stageDefinition(stage: number): StageDefinition {
  return STAGES.find((item) => item.id === stage) ?? STAGES[0];
}

/** تأخر الإيداع: تجاوز الأجل مع بقاء الصفقة في مراحل الاستلام/الفحص/الإسناد. */
function isDelayed(deal: ProcurementDealApi, now: number): boolean {
  if (!deal.submission_deadline) return false;
  const deadline = new Date(deal.submission_deadline).getTime();
  if (Number.isNaN(deadline)) return false;
  const stage = toNumber(deal.current_stage);
  return deadline < now && stage >= 3 && stage <= 8;
}

export function CentralDeals() {
  const { data, loading, error, reload } = useCentralResource(fetchNationalDeals);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [onlyDelayed, setOnlyDelayed] = useState(false);

  const now = useNow(60000);
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

    const perStage = STAGES.map((stage) => {
      const count = deals.filter((deal) => toNumber(deal.current_stage) === stage.id).length;
      return { ...stage, count, share: total > 0 ? (count / total) * 100 : 0 };
    });

    return { total, active, closed, delayed, budget, perStage };
  }, [deals, now]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return deals
      .filter((deal) => {
        const stage = toNumber(deal.current_stage);
        if (filterStage !== 'all' && stage !== Number(filterStage)) return false;
        if (onlyDelayed && !isDelayed(deal, now)) return false;
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
  }, [deals, searchQuery, filterStage, onlyDelayed, now]);

  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader
        title="السجل الوطني للصفقات"
        titleClassName="text-xl font-bold"
        description="سجل موحّد لكل الصفقات العمومية مع مراحل دورة حياتها الاثنتي عشرة، من التخطيط والاحتياج إلى الأداء والدفع والإغلاق."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
            className="h-8 text-xs font-semibold"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            تحديث البيانات
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          eyebrow="إجمالي الصفقات"
          value={formatNumber(stats.total)}
          icon={Briefcase}
          accent="navy"
          description="صفقات مسجّلة في السجل الوطني"
        />
        <KpiCard
          eyebrow="صفقات جارية"
          value={formatNumber(stats.active)}
          icon={Activity}
          accent="emerald"
          description={`منها ${formatNumber(stats.delayed)} صفقة متأخرة عن الأجل`}
        />
        <KpiCard
          eyebrow="صفقات مغلقة"
          value={formatNumber(stats.closed)}
          icon={CheckCircle2}
          accent="gold"
          description="بلغت مرحلة الأداء والدفع والإغلاق"
        />
        <KpiCard
          eyebrow="الحجم الإجمالي"
          value={formatDZD(stats.budget)}
          icon={Wallet}
          accent="red"
          description="مجموع الميزانيات التقديرية المسجّلة"
        />
      </div>

      <Card className="bg-white shadow-xs border-gray-200">
        <CardHeader className="border-b border-gray-200 p-4 pb-3">
          <CardTitle className="text-base font-bold text-[var(--ink-900)]">
            توزيع الصفقات على المراحل الـ 12
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs text-gray-500">
            يُحتسب مباشرة من المرحلة الحالية لكل صفقة
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
                <div className="mt-1 font-mono text-[11px] text-[var(--ink-500)]">
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
              الصفقات المسجّلة
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-[var(--ink-500)]">
              مرحلة كل صفقة معروضة كمؤشر بصري على السلّم الكامل للمراحل الـ12
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
                placeholder="بحث بالمرجع أو العنوان أو المصلحة…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="بحث في الصفقات"
                className="ps-8 pe-3 py-1 text-xs rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)] h-8"
              />
            </div>

            <select
              value={filterStage}
              onChange={(event) => setFilterStage(event.target.value)}
              aria-label="تصفية حسب المرحلة"
              className="px-2 py-1 text-xs rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)] h-8"
            >
              <option value="all">كل المراحل</option>
              {STAGES.map((stage) => (
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
              المتأخرة فقط
            </label>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[110px] text-xs font-bold">المرجع</TableHead>
                <TableHead className="min-w-[200px] text-xs font-bold">عنوان الصفقة</TableHead>
                <TableHead className="text-xs font-bold">المصلحة المتعاقدة</TableHead>
                <TableHead className="text-xs font-bold">الولاية</TableHead>
                <TableHead className="text-end text-xs font-bold">الميزانية</TableHead>
                <TableHead className="min-w-[170px] text-xs font-bold">المرحلة الحالية</TableHead>
                <TableHead className="text-center text-xs font-bold">آخر أجل للإيداع</TableHead>
                <TableHead className="text-center text-xs font-bold">التأخر</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={8}
                loading={loading && !data}
                error={error}
                empty={!loading && filtered.length === 0}
                emptyLabel="لا توجد صفقات مطابقة للبحث أو التصفية الحالية."
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
                      <TableCell className="font-mono text-xs font-bold text-[var(--ink-900)] py-2.5">
                        {deal.reference_number || '—'}
                      </TableCell>
                      <TableCell className="max-w-[280px] text-xs font-semibold text-[var(--ink-900)] py-2.5">
                        <div className="truncate">{deal.title || '—'}</div>
                        <div className="text-[11px] font-normal text-[var(--ink-500)]">
                          أُنشئت في {formatDate(deal.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-[var(--ink-700)] py-2.5">
                        {deal.authority_name || deal.authority_entity || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--ink-700)] py-2.5">
                        {deal.wilaya || '—'}
                      </TableCell>
                      <TableCell className="text-end font-mono text-xs font-semibold tabular-nums text-[var(--ink-900)] py-2.5">
                        {formatDZD(toNumber(deal.estimated_budget))}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-[var(--paper-100)] text-[var(--ink-900)] border-gray-200 font-mono text-[10px] px-1.5 py-0">
                            {String(stage).padStart(2, '0')}
                          </Badge>
                          <span className="truncate text-xs font-semibold text-[var(--ink-700)]">
                            {definition.short}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-0.5" aria-hidden="true">
                          {STAGES.map((item) => (
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
                      <TableCell className="text-center font-mono text-xs text-[var(--ink-700)] py-2.5">
                        {formatDate(deal.submission_deadline)}
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        {delayed ? (
                          <Badge className="bg-red-50 text-red-800 border-red-300 text-[10px] px-1.5 py-0.5">
                            <Clock className="size-2.5" aria-hidden="true" />
                            متأخرة
                          </Badge>
                        ) : (
                          <span className="text-xs text-[var(--ink-500)]">داخل الأجل</span>
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
              عرض {formatNumber(filtered.length)} من أصل {formatNumber(stats.total)} صفقة
            </span>
            <span className="font-mono">
              {formatNumber(stats.delayed)} صفقة متأخرة عن الأجل القانوني
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentralDeals;
