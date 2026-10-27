import { useMemo, useState } from 'react';
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
 * حوكمة المصالح المتعاقدة — ترتيب المصالح حسب مؤشر الالتزام بالآجال
 * ومؤشر الشفافية المحسوبين في الخادم (GET /api/central/reports/).
 */

const STATUS_META: Record<string, { label: string; className: string }> = {
  excellent: {
    label: 'أداء ممتاز',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  normal: {
    label: 'أداء عادي',
    className: 'bg-slate-50 text-slate-700 border-slate-300',
  },
  needs_support: {
    label: 'تحتاج دعماً وتدريباً',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  infractions: {
    label: 'بمخالفات مسجلة',
    className: 'bg-red-50 text-red-800 border-red-300',
  },
};

function statusMeta(status: string) {
  return (
    STATUS_META[status] ?? {
      label: status || 'غير محدّد',
      className: 'bg-slate-50 text-slate-700 border-slate-300',
    }
  );
}

type RankedAuthority = CentralAuthorityReport & { rank: number };

export function CentralAuthorities() {
  const { data, loading, error, reload } = useCentralResource(fetchCentralReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAuth, setSelectedAuth] = useState<RankedAuthority | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const summary = data?.national_summary;
  const authorities = useMemo(() => data?.authorities ?? [], [data]);

  /** الترتيب الوطني: الالتزام بالآجال أولاً ثم الشفافية ثم حجم النشاط. */
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
    <div className="space-y-4" dir="rtl">
      <PageHeader
        title="حوكمة المصالح المتعاقدة"
        titleClassName="text-xl font-bold"
        description="ترتيب المصالح والهيئات المتعاقدة وفق مؤشر الالتزام بالآجال القانونية ومؤشر الشفافية المركب المحسوبين من بيانات الصفقات والجلسات والإنذارات."
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
          eyebrow="المصالح المتعاقدة"
          value={formatNumber(summary?.total_authorities ?? authorities.length)}
          icon={Building}
          accent="navy"
          description={`الحجم الوطني المسجّل: ${formatDZD(summary?.total_volume_dzd ?? 0)}`}
        />
        <KpiCard
          eyebrow="متوسط الالتزام بالآجال"
          value={`${formatNumber(summary?.average_compliance_rate ?? 0)}%`}
          icon={CheckCircle2}
          accent="emerald"
          description={`على ${formatNumber(summary?.total_deals ?? 0)} صفقة مسجّلة`}
        />
        <KpiCard
          eyebrow="متوسط مؤشر الشفافية"
          value={`${formatNumber(summary?.average_transparency_rate ?? 0)}%`}
          icon={ShieldCheck}
          accent="gold"
          description="دفاتر شروط مؤشّرة وجلسات فتح علنية"
        />
        <KpiCard
          eyebrow="مصالح بمخالفات"
          value={formatNumber(infractionsCount)}
          icon={AlertTriangle}
          accent="red"
          description="تحتاج متابعة رقابية فورية"
        />
      </div>

      <AICard
        title="توصيات الدعم والتدريب (استشارية)"
        subtitle={
          trainingNeeded.length > 0
            ? `${formatNumber(trainingNeeded.length)} مصلحة مصنّفة بحاجة إلى دعم تقني أو تكويني`
            : 'لا توجد حالياً مصالح مصنّفة بحاجة إلى تدريب وفق المؤشرات الحالية'
        }
      >
        {trainingNeeded.length === 0 ? (
          <p className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <HelpCircle className="size-3.5" aria-hidden="true" />
            جميع المصالح داخل العتبات المقبولة لمؤشرَي الالتزام والشفافية.
          </p>
        ) : (
          <ul className="space-y-2">
            {trainingNeeded.slice(0, 4).map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2.5 rounded-xl border border-purple-200 bg-purple-500/10 p-2.5"
              >
                <span className="shrink-0 text-base">🏛️</span>
                <div>
                  <div className="text-xs font-bold text-purple-950">{item.name}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-purple-900">
                    الالتزام بالآجال {formatNumber(item.compliance_rate)}% · الشفافية{' '}
                    {formatNumber(item.transparency_rate)}% · شبهات مسجّلة{' '}
                    {formatNumber(item.suspicions_count)} — التوصية: مراجعة إجراءات الإعداد وفتح
                    الأظرفة مع هذه المصلحة.
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
              الترتيب الوطني لأداء المصالح المتعاقدة
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-gray-500">
              ترتيب تنازلي حسب مؤشر الالتزام بالآجال ثم مؤشر الشفافية
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
                placeholder="بحث باسم المصلحة أو الولاية…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="بحث في المصالح المتعاقدة"
                className="ps-8 pe-3 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label="تصفية حسب التقييم"
              className="px-2.5 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
            >
              <option value="all">كل التقييمات</option>
              <option value="excellent">ممتازة</option>
              <option value="normal">عادية</option>
              <option value="needs_support">تحتاج دعماً</option>
              <option value="infractions">بمخالفات</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px] text-center">الرتبة</TableHead>
                <TableHead className="min-w-[240px]">المصلحة المتعاقدة</TableHead>
                <TableHead>الولاية</TableHead>
                <TableHead className="text-center">الصفقات</TableHead>
                <TableHead className="text-center">المتأخرة</TableHead>
                <TableHead className="text-end">حجم الصفقات</TableHead>
                <TableHead className="text-center">الالتزام بالآجال</TableHead>
                <TableHead className="text-center">الشفافية</TableHead>
                <TableHead className="text-center">شبهات</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={11}
                loading={loading && !data}
                error={error}
                empty={!loading && filtered.length === 0}
                emptyLabel="لا توجد مصالح متعاقدة مطابقة للبحث أو التصفية الحالية."
                onRetry={reload}
              >
                {filtered.map((item) => {
                  const meta = statusMeta(item.status);
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
                          className="h-7 px-2 text-xs text-[var(--stamp-green-700)] hover:bg-slate-100"
                        >
                          <Eye className="size-3" aria-hidden="true" />
                          عرض
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
              عرض {formatNumber(filtered.length)} من أصل {formatNumber(authorities.length)} مصلحة
              متعاقدة
            </span>
            <span className="font-mono">
              متوسط الشفافية الوطني: {formatNumber(summary?.average_transparency_rate ?? 0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="end" className="overflow-y-auto bg-white p-5 sm:max-w-md">
          {selectedAuth && (
            <div className="space-y-4">
              <SheetHeader className="space-y-1 border-b border-gray-200 pb-3 text-start">
                <span className="eyebrow text-[11px]">بطاقة الرقابة الإدارية</span>
                <SheetTitle className="text-base font-bold text-[var(--ink-900)]">
                  {selectedAuth.name || '—'}
                </SheetTitle>
                <SheetDescription className="mt-0.5 text-xs text-[var(--ink-500)]">
                  الرتبة الوطنية #{selectedAuth.rank} · الولاية: {selectedAuth.wilaya || '—'} ·{' '}
                  {selectedAuth.email}
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <DetailTile label="الصفقات المدارة" value={formatNumber(selectedAuth.deals_count)} />
                <DetailTile
                  label="الصفقات النشطة"
                  value={formatNumber(selectedAuth.active_deals_count)}
                />
                <DetailTile
                  label="المكتملة"
                  value={formatNumber(selectedAuth.completed_deals_count)}
                />
                <DetailTile
                  label="المتأخرة"
                  value={formatNumber(selectedAuth.delayed_deals_count)}
                  tone="red"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <DetailTile label="الالتزام بالآجال" value={`${formatNumber(selectedAuth.compliance_rate)}%`} />
                <DetailTile
                  label="مؤشر الشفافية"
                  value={`${formatNumber(selectedAuth.transparency_rate)}%`}
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                <div className="mb-0.5 text-xs text-[var(--ink-500)]">الحجم المالي الكلي</div>
                <div className="font-mono text-sm font-bold text-[var(--ink-900)]">
                  {formatDZD(selectedAuth.total_volume_dzd)}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-slate-50 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--ink-900)]">
                  <ShieldCheck className="size-4 text-[var(--stamp-green-700)]" aria-hidden="true" />
                  <span>الملاحظات الرقابية</span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--ink-700)]">
                  شبهات مسجّلة: {formatNumber(selectedAuth.suspicions_count)} · التقييم:{' '}
                  {statusMeta(selectedAuth.status).label} ·{' '}
                  {selectedAuth.ai_training_needed
                    ? 'مصنّفة ضمن المصالح التي تحتاج دعماً وتدريباً.'
                    : 'لا توجد حاجة تدريبية مسجّلة حالياً.'}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-500)]">
                  المؤشرات محسوبة آلياً من الصفقات ودفاتر الشروط وجلسات فتح الأظرفة؛ وهي استشارية
                  ولا تُغني عن المراجعة البشرية المختصة.
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
