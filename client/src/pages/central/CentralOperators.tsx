import { useMemo, useState } from 'react';
import { PageHeader, KpiCard, AICard } from '@/shared/components';
import {
  Users,
  FileText,
  Trophy,
  AlertOctagon,
  Search,
  RefreshCw,
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
import {
  fetchCentralOffers,
  toNumber,
  useCentralResource,
  type CentralOfferRow,
} from './centralApi';
import { Meter, TableState, formatDZD, formatNumber, formatPercent } from './centralUi';

/**
 * رقابة المتعاملين الاقتصاديين — حساب نسب الفوز والتكرار وكشف تركّز الإسناد.
 *
 * المصدر: GET /api/bids/offers/ — حساب الإدارة المركزية يرى كل العروض ونتائجها.
 * كل المؤشرات هنا استشارية وتُحسب من حالات العروض المسجّلة في الخادم.
 */

interface OperatorAggregate {
  id: string;
  name: string;
  offersCount: number;
  winsCount: number;
  rejectedCount: number;
  dealsCount: number;
  totalAmount: number;
  winRate: number;
  awardShare: number;
  concentrated: boolean;
}

const CONCENTRATION_SHARE_THRESHOLD = 40;
const CONCENTRATION_MIN_WINS = 2;

function aggregateOffers(offers: CentralOfferRow[]): OperatorAggregate[] {
  const buckets = new Map<
    string,
    {
      id: string;
      name: string;
      offersCount: number;
      winsCount: number;
      rejectedCount: number;
      deals: Set<string>;
      totalAmount: number;
    }
  >();

  for (const offer of offers) {
    const key = offer.operator || offer.operatorName || offer.operator_name || 'unknown';
    const name = offer.operatorName || offer.operator_name || 'متعامل غير معروف';
    const current = buckets.get(key) ?? {
      id: key,
      name,
      offersCount: 0,
      winsCount: 0,
      rejectedCount: 0,
      deals: new Set<string>(),
      totalAmount: 0,
    };

    current.offersCount += 1;
    if (offer.status === 'awarded') current.winsCount += 1;
    if (offer.status === 'rejected') current.rejectedCount += 1;
    if (offer.deal) current.deals.add(offer.deal);
    current.totalAmount += toNumber(offer.financial_amount);
    buckets.set(key, current);
  }

  const totalWins = Array.from(buckets.values()).reduce(
    (sum, item) => sum + item.winsCount,
    0,
  );

  return Array.from(buckets.values())
    .map((item) => {
      const awardShare = totalWins > 0 ? (item.winsCount / totalWins) * 100 : 0;
      const winRate = item.offersCount > 0 ? (item.winsCount / item.offersCount) * 100 : 0;
      return {
        id: item.id,
        name: item.name,
        offersCount: item.offersCount,
        winsCount: item.winsCount,
        rejectedCount: item.rejectedCount,
        dealsCount: item.deals.size,
        totalAmount: item.totalAmount,
        winRate,
        awardShare,
        concentrated:
          item.winsCount >= CONCENTRATION_MIN_WINS &&
          awardShare >= CONCENTRATION_SHARE_THRESHOLD,
      };
    })
    .sort(
      (a, b) =>
        b.winsCount - a.winsCount ||
        b.awardShare - a.awardShare ||
        b.offersCount - a.offersCount,
    );
}

export function CentralOperators() {
  const { data, loading, error, reload } = useCentralResource(fetchCentralOffers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConcentration, setFilterConcentration] = useState('all');

  const offers = useMemo(() => data ?? [], [data]);
  const operators = useMemo(() => aggregateOffers(offers), [offers]);

  const totalWins = operators.reduce((sum, item) => sum + item.winsCount, 0);
  const topShare = operators.reduce((max, item) => Math.max(max, item.awardShare), 0);
  const concentrated = operators.filter((item) => item.concentrated);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return operators.filter((item) => {
      if (filterConcentration === 'concentrated' && !item.concentrated) return false;
      if (filterConcentration === 'competitive' && item.concentrated) return false;
      if (!query) return true;
      return item.name.toLowerCase().includes(query);
    });
  }, [operators, searchQuery, filterConcentration]);

  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader
        title="رقابة المتعاملين الاقتصاديين"
        titleClassName="text-xl font-bold"
        description="متابعة مشاركات الشركات ونسب فوزها المتكررة وحصتها من الإسنادات، لكشف حالات تركّز السوق واحتكار الصفقات العمومية."
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

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          eyebrow="متعاملون مشاركون"
          value={formatNumber(operators.length)}
          icon={Users}
          accent="navy"
          description="متعاملون قدّموا عرضاً واحداً على الأقل"
        />
        <KpiCard
          eyebrow="إجمالي العروض"
          value={formatNumber(offers.length)}
          icon={FileText}
          accent="emerald"
          description="عروض مسجّلة في النظام"
        />
        <KpiCard
          eyebrow="إسنادات منجزة"
          value={formatNumber(totalWins)}
          icon={Trophy}
          accent="gold"
          description="عروض بحالة «حائز على الصفقة»"
        />
        <KpiCard
          eyebrow="أعلى حصة إسناد"
          value={formatPercent(topShare)}
          icon={AlertOctagon}
          accent="red"
          description={
            concentrated.length > 0
              ? `${formatNumber(concentrated.length)} متعامل فوق عتبة التركّز`
              : 'لا يوجد تركّز فوق العتبة الحالية'
          }
        />
      </div>

      <AICard
        title="قراءة استشارية لتركّز السوق"
        subtitle={
          concentrated.length > 0
            ? `${formatNumber(concentrated.length)} متعامل بحصة إسناد تتجاوز ${CONCENTRATION_SHARE_THRESHOLD}% وبإسنادين على الأقل`
            : 'لا توجد مؤشرات تركّز تتجاوز العتبة المعتمدة حالياً'
        }
      >
        {concentrated.length === 0 ? (
          <p className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <ShieldAlert className="size-4" aria-hidden="true" />
            توزيع الإسنادات الحالي لا يُظهر تركّزاً غير معتاد بين المتعاملين.
          </p>
        ) : (
          <ul className="space-y-2">
            {concentrated.slice(0, 4).map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5"
              >
                <span className="shrink-0 text-base">⚠️</span>
                <div>
                  <div className="text-xs font-bold text-amber-950">{item.name}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-900">
                    {formatNumber(item.winsCount)} إسناد من أصل {formatNumber(totalWins)} (
                    {formatPercent(item.awardShare)}) مقابل تقديم{' '}
                    {formatNumber(item.offersCount)} عرضاً. التوصية: مراجعة شروط التأهيل وتنافسية
                    دفاتر الشروط قبل أي إجراء، فالمؤشر استشاري ولا يشكّل إدانة.
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
              نسب الفوز وتكرار الإسناد
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-gray-500">
              مؤشر التركّز يُحتسب من حصة كل متعامل من مجموع الإسنادات
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
                placeholder="بحث باسم المتعامل…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="بحث في المتعاملين الاقتصاديين"
                className="ps-8 pe-3 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
              />
            </div>

            <select
              value={filterConcentration}
              onChange={(event) => setFilterConcentration(event.target.value)}
              aria-label="تصفية حسب تركّز الإسناد"
              className="px-2.5 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
            >
              <option value="all">كل المتعاملين</option>
              <option value="concentrated">تركّز مرتفع فقط</option>
              <option value="competitive">تنافسي فقط</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[240px]">المتعامل الاقتصادي</TableHead>
                <TableHead className="text-center">العروض</TableHead>
                <TableHead className="text-center">الإسنادات</TableHead>
                <TableHead className="text-center">المرفوضة</TableHead>
                <TableHead className="text-center">نسبة الفوز</TableHead>
                <TableHead className="text-center">حصة الإسناد</TableHead>
                <TableHead className="text-end">حجم العروض</TableHead>
                <TableHead className="text-center">مؤشر التركّز</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={8}
                loading={loading && !data}
                error={error}
                empty={!loading && filtered.length === 0}
                emptyLabel="لا توجد عروض مسجّلة مطابقة للبحث أو التصفية الحالية."
                onRetry={reload}
              >
                {filtered.map((item) => (
                  <TableRow key={item.id} className="transition-colors hover:bg-slate-50/70">
                    <TableCell className="text-xs font-semibold text-[var(--ink-900)] py-2.5">
                      <div className="truncate">{item.name}</div>
                      <div className="text-xs font-normal text-[var(--ink-500)]">
                        مشارك في {formatNumber(item.dealsCount)} صفقة
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold text-[var(--ink-900)] py-2.5">
                      {formatNumber(item.offersCount)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold py-2.5">
                      <span
                        className={
                          item.winsCount > 0
                            ? 'text-[var(--stamp-green-700)]'
                            : 'text-[var(--ink-500)]'
                        }
                      >
                        {formatNumber(item.winsCount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-[var(--ink-700)] py-2.5">
                      {formatNumber(item.rejectedCount)}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Meter value={item.winRate} tone="emerald" />
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Meter
                        value={item.awardShare}
                        tone={item.concentrated ? 'red' : 'navy'}
                      />
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-semibold tabular-nums text-[var(--ink-900)] py-2.5">
                      {formatDZD(item.totalAmount)}
                    </TableCell>
                    <TableCell className="text-center py-2.5">
                      {item.concentrated ? (
                        <Badge className="bg-amber-50 text-amber-900 border-amber-300">
                          تركّز مرتفع
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[var(--ink-500)]">
                          تنافسي
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableState>
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-2.5 text-xs text-[var(--ink-500)]">
            <span>
              عرض {formatNumber(filtered.length)} من أصل {formatNumber(operators.length)} متعاملاً
              اقتصادياً
            </span>
            <span>عتبة التركّز: {CONCENTRATION_SHARE_THRESHOLD}% من الإسنادات بإسنادين على الأقل</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentralOperators;
