import { useMemo, useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/format';
import { PageHeader, KpiCard, AICard } from '@/shared/components';
import {
  Users,
  FileText,
  Trophy,
  AlertOctagon,
  Search,
  RefreshCw,
  ShieldAlert,
  AlertTriangle,
  UserX,
  Plus,
  RotateCcw,
  Building2,
  FileWarning,
  Loader2,
  Lock,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  fetchCentralOffers,
  fetchCentralExcludedOperators,
  createCentralExcludedOperator,
  deleteCentralExcludedOperator,
  toNumber,
  useCentralResource,
  type CentralOfferRow,
  type CentralExcludedOperator,
} from './centralApi';
import { Meter, TableState, formatDZD, formatNumber, formatPercent } from './centralUi';

/**
 * رقابة المتعاملين الاقتصاديين — حساب نسب الفوز والتكرار وكشف تركّز الإسناد،
 * مع إدارة القائمة السوداء السيادية للمتعاملين المقصيين وفق القانون 23-12 والمرسوم 15-247.
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
  const { t, lang, dir } = useI18n();
  const [activeTab, setActiveTab] = useState<'registered' | 'blacklist'>('registered');

  // 1. مورد المتعاملين المسجلين والعروض
  const { data, loading, error, reload } = useCentralResource(fetchCentralOffers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConcentration, setFilterConcentration] = useState('all');

  // 2. مورد القائمة السوداء
  const {
    data: excludedData,
    loading: excludedLoading,
    error: excludedError,
    reload: reloadExcluded,
  } = useCentralResource(fetchCentralExcludedOperators);
  const [blacklistSearchQuery, setBlacklistSearchQuery] = useState('');

  // 3. حالات النموذج والنوافذ المنبثقة
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [itemToRevoke, setItemToRevoke] = useState<CentralExcludedOperator | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // حقول نموذج الإقصاء
  const [formOperatorName, setFormOperatorName] = useState('');
  const [formNif, setFormNif] = useState('');
  const [formDecisionRef, setFormDecisionRef] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState('');

  // الحسابات المشتقة للمتعاملين المسجلين
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

  // الحسابات المشتقة للقائمة السوداء
  const excludedList = useMemo(() => excludedData ?? [], [excludedData]);
  const activeExclusionsCount = useMemo(
    () => excludedList.filter((item) => item.is_active).length,
    [excludedList],
  );
  const permanentExclusionsCount = useMemo(
    () => excludedList.filter((item) => !item.end_date).length,
    [excludedList],
  );

  const filteredExcluded = useMemo(() => {
    const q = blacklistSearchQuery.trim().toLowerCase();
    if (!q) return excludedList;
    return excludedList.filter(
      (item) =>
        item.operator_name.toLowerCase().includes(q) ||
        item.nif.toLowerCase().includes(q) ||
        item.decision_reference.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q),
    );
  }, [excludedList, blacklistSearchQuery]);

  const handleOpenAddModal = () => {
    setFormOperatorName('');
    setFormNif('');
    setFormDecisionRef('');
    setFormReason('');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate('');
    setSubmitError('');
    setIsAddModalOpen(true);
  };

  const handleSubmitAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !formOperatorName.trim() ||
      !formNif.trim() ||
      !formDecisionRef.trim() ||
      !formReason.trim() ||
      !formStartDate
    ) {
      setSubmitError(
        lang === 'ar'
          ? 'يرجى تعبئة كافة الحقول الإلزامية المطلوبة.'
          : 'Veuillez renseigner tous les champs obligatoires.',
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await createCentralExcludedOperator({
        operator_name: formOperatorName.trim(),
        nif: formNif.trim(),
        decision_reference: formDecisionRef.trim(),
        reason: formReason.trim(),
        start_date: formStartDate,
        end_date: formEndDate.trim() ? formEndDate : null,
        is_active: true,
      });
      setIsAddModalOpen(false);
      reloadExcluded();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : lang === 'ar'
          ? 'تعذر حفظ قرار الإقصاء. يرجى التحقق من صحة البيانات.'
          : "Échec de l'enregistrement de l'exclusion. Veuillez vérifier les données.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!itemToRevoke) return;
    setIsRevoking(true);
    try {
      await deleteCentralExcludedOperator(itemToRevoke.id);
      setItemToRevoke(null);
      reloadExcluded();
    } catch {
      // إبقاء النافذة في حالة الخطأ
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-4" dir={dir}>
      <PageHeader
        title={t('nav.central.operators')}
        titleClassName="text-xl font-bold"
        description={
          activeTab === 'registered'
            ? 'متابعة مشاركات الشركات ونسب فوزها المتكررة وحصتها من الإسنادات، لكشف حالات تركّز السوق واحتكار الصفقات العمومية.'
            : t('central.blacklist.subtitle')
        }
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'blacklist' && (
              <Button
                size="sm"
                onClick={handleOpenAddModal}
                className="gap-1.5 rounded-xl bg-rose-900 text-xs font-bold text-white shadow-sm hover:bg-rose-800"
              >
                <UserX className="size-3.5" aria-hidden="true" />
                <span>{t('central.blacklist.add_button')}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={activeTab === 'registered' ? reload : reloadExcluded}
              disabled={activeTab === 'registered' ? loading : excludedLoading}
              className="text-xs h-8 rounded-xl border-gray-200"
            >
              <RefreshCw
                className={`size-3.5 me-1.5 ${
                  (activeTab === 'registered' ? loading : excludedLoading) ? 'animate-spin' : ''
                }`}
                aria-hidden="true"
              />
              {t('operator.offers.refresh')}
            </Button>
          </div>
        }
      />

      {/* التبويبات السيادية (Tabs) */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('registered')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'registered'
              ? 'bg-[#0f3154] text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="size-4" />
          <span>{t('central.operators.tab_registered')}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
              activeTab === 'registered'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {operators.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('blacklist')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'blacklist'
              ? 'bg-rose-900 text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <UserX className="size-4" />
          <span>{t('central.operators.tab_blacklist')}</span>
          {excludedList.length > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                activeTab === 'blacklist'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {excludedList.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── تبويب المتعاملين المسجلين ─── */}
      {activeTab === 'registered' && (
        <>
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
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
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
        </>
      )}

      {/* ─── تبويب القائمة السوداء (المتعاملون المقصون) ─── */}
      {activeTab === 'blacklist' && (
        <div className="space-y-4">
          {/* مؤشرات سريعة للقائمة السوداء */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              eyebrow="إجمالي المقصين"
              value={formatNumber(excludedList.length)}
              icon={UserX}
              accent="red"
              description="سجلات الإقصاء المسجلة في المنصة"
            />
            <KpiCard
              eyebrow="إقصاءات سارية المفعول"
              value={formatNumber(activeExclusionsCount)}
              icon={FileWarning}
              accent="gold"
              description="متعاملون محظورون من المشاركة حالياً"
            />
            <KpiCard
              eyebrow="إقصاءات غير محددة الأجل"
              value={formatNumber(permanentExclusionsCount)}
              icon={ShieldAlert}
              accent="navy"
              description="إقصاء دائم أو بدون تاريخ انتهاء محدد"
            />
            <KpiCard
              eyebrow="التوثيق والتدقيق"
              value="محصّن 100%"
              icon={Lock}
              accent="emerald"
              description="موثق ببصمة رقمية SHA-256 في AuditLog"
            />
          </div>

          <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-rose-950">
                  <UserX className="size-4 text-rose-700" />
                  <span>{t('central.blacklist.title')}</span>
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs text-gray-500">
                  {t('central.blacklist.subtitle')}
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
                    placeholder={t('central.blacklist.search_placeholder')}
                    value={blacklistSearchQuery}
                    onChange={(event) => setBlacklistSearchQuery(event.target.value)}
                    aria-label="بحث في القائمة السوداء"
                    className="ps-8 pe-3 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-rose-700 w-64"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleOpenAddModal}
                  className="gap-1.5 rounded-xl bg-rose-900 text-xs font-bold text-white shadow-sm hover:bg-rose-800 h-8"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>{t('central.blacklist.add_button')}</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[190px]">{t('central.blacklist.table_operator')}</TableHead>
                    <TableHead className="min-w-[130px] font-mono">{t('central.blacklist.table_nif')}</TableHead>
                    <TableHead className="min-w-[240px]">{t('central.blacklist.table_reason')}</TableHead>
                    <TableHead className="min-w-[140px] font-mono">{t('central.blacklist.table_decision')}</TableHead>
                    <TableHead className="whitespace-nowrap text-center">{t('central.blacklist.table_start_date')}</TableHead>
                    <TableHead className="whitespace-nowrap text-center">{t('central.blacklist.table_end_date')}</TableHead>
                    <TableHead className="text-center">{t('central.blacklist.table_status')}</TableHead>
                    <TableHead className="text-center w-28">{t('central.blacklist.table_actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableState
                    colSpan={8}
                    loading={excludedLoading && !excludedData}
                    error={excludedError}
                    empty={!excludedLoading && filteredExcluded.length === 0}
                    emptyLabel={t('central.blacklist.empty')}
                    onRetry={reloadExcluded}
                  >
                    {filteredExcluded.map((item) => (
                      <TableRow key={item.id} className="transition-colors hover:bg-rose-50/20">
                        <TableCell className="text-xs font-bold text-[var(--ink-900)] py-3">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{item.operator_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-gray-700 py-3">
                          {item.nif}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-3 leading-relaxed max-w-xs">
                          <p className="line-clamp-2" title={item.reason}>
                            {item.reason}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-[#0f3154] py-3">
                          {item.decision_reference}
                        </TableCell>
                        <TableCell className="text-center text-xs text-gray-600 py-3 whitespace-nowrap">
                          {formatDate(item.start_date, lang)}
                        </TableCell>
                        <TableCell className="text-center text-xs text-gray-600 py-3 whitespace-nowrap">
                          {item.end_date ? (
                            formatDate(item.end_date, lang)
                          ) : (
                            <span className="text-rose-700 font-semibold">
                              {t('central.blacklist.status_permanent')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-3 whitespace-nowrap">
                          {item.is_active ? (
                            <Badge className="bg-rose-50 text-rose-800 border-rose-300 font-bold">
                              {t('central.blacklist.status_active')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              منتهي
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setItemToRevoke(item)}
                            className="h-7 px-2 text-[11px] font-bold text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 rounded-lg gap-1"
                            title={t('central.blacklist.revoke_button')}
                          >
                            <RotateCcw className="size-3" />
                            <span>{t('central.blacklist.revoke_button')}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableState>
                </TableBody>
              </Table>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-2.5 text-xs text-gray-500">
                <span>
                  عرض {formatNumber(filteredExcluded.length)} من أصل {formatNumber(excludedList.length)} مسجلاً في القائمة السوداء
                </span>
                <span>المستند القانوني: المرسوم الرئاسي 15-247 (المادة 75) والقانون 23-12</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── نافذة إضافة متعامل إلى القائمة السوداء (Modal Dialog) ─── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-rose-950">
              <UserX className="size-5 text-rose-700" />
              <span>{t('central.blacklist.modal_title')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 leading-relaxed">
              {t('central.blacklist.modal_description')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAdd} className="space-y-3.5 pt-2">
            <div>
              <Label htmlFor="operator-name" className="text-xs font-bold text-gray-700">
                {t('central.blacklist.field_operator_name')} <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="operator-name"
                value={formOperatorName}
                onChange={(e) => setFormOperatorName(e.target.value)}
                placeholder={t('central.blacklist.field_operator_placeholder')}
                required
                className="mt-1 h-9 rounded-xl border-gray-200 text-xs focus:border-rose-700 focus:ring-rose-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="operator-nif" className="text-xs font-bold text-gray-700">
                  {t('central.blacklist.field_nif')} <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="operator-nif"
                  value={formNif}
                  onChange={(e) => setFormNif(e.target.value)}
                  placeholder={t('central.blacklist.field_nif_placeholder')}
                  required
                  className="mt-1 h-9 rounded-xl border-gray-200 font-mono text-xs focus:border-rose-700 focus:ring-rose-700"
                />
              </div>

              <div>
                <Label htmlFor="decision-ref" className="text-xs font-bold text-gray-700">
                  {t('central.blacklist.field_decision')} <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="decision-ref"
                  value={formDecisionRef}
                  onChange={(e) => setFormDecisionRef(e.target.value)}
                  placeholder={t('central.blacklist.field_decision_placeholder')}
                  required
                  className="mt-1 h-9 rounded-xl border-gray-200 text-xs focus:border-rose-700 focus:ring-rose-700"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="exclusion-reason" className="text-xs font-bold text-gray-700">
                {t('central.blacklist.field_reason')} <span className="text-rose-600">*</span>
              </Label>
              <Textarea
                id="exclusion-reason"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder={t('central.blacklist.field_reason_placeholder')}
                required
                rows={3}
                className="mt-1 rounded-xl border-gray-200 text-xs leading-relaxed focus:border-rose-700 focus:ring-rose-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="start-date" className="text-xs font-bold text-gray-700">
                  {t('central.blacklist.field_start_date')} <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                  className="mt-1 h-9 rounded-xl border-gray-200 text-xs focus:border-rose-700 focus:ring-rose-700"
                />
              </div>

              <div>
                <Label htmlFor="end-date" className="text-xs font-bold text-gray-700">
                  {t('central.blacklist.field_end_date')}
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="mt-1 h-9 rounded-xl border-gray-200 text-xs focus:border-rose-700 focus:ring-rose-700"
                />
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-800">
                {submitError}
              </div>
            )}

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className="h-9 rounded-xl border-gray-200 text-xs font-bold text-gray-700"
              >
                {t('central.blacklist.cancel_button')}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-9 gap-1.5 rounded-xl bg-rose-900 text-xs font-bold text-white shadow-sm hover:bg-rose-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{t('central.blacklist.submitting')}</span>
                  </>
                ) : (
                  <>
                    <UserX className="size-3.5" />
                    <span>{t('central.blacklist.submit_button')}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── نافذة تأكيد إلغاء الإقصاء (Revoke Confirmation Modal) ─── */}
      <Dialog
        open={Boolean(itemToRevoke)}
        onOpenChange={(open) => !open && setItemToRevoke(null)}
      >
        <DialogContent className="max-w-md bg-white rounded-2xl p-6" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-gray-900">
              <RotateCcw className="size-5 text-rose-700" />
              <span>{t('central.blacklist.revoke_button')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 leading-relaxed pt-1">
              {t('central.blacklist.revoke_confirm')}
            </DialogDescription>
          </DialogHeader>

          {itemToRevoke && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">{itemToRevoke.operator_name}</span>
                <span className="font-mono text-gray-500">NIF: {itemToRevoke.nif}</span>
              </div>
              <div className="text-gray-500 font-mono text-[11px]">
                {t('central.blacklist.table_decision')}: {itemToRevoke.decision_reference}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItemToRevoke(null)}
              disabled={isRevoking}
              className="h-9 rounded-xl border-gray-200 text-xs font-bold text-gray-700"
            >
              {t('central.blacklist.cancel_button')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRevoke}
              disabled={isRevoking}
              className="h-9 gap-1.5 rounded-xl bg-rose-700 text-xs font-bold text-white hover:bg-rose-800"
            >
              {isRevoking ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="size-3.5" />
                  <span>{t('central.blacklist.revoke_button')}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CentralOperators;
