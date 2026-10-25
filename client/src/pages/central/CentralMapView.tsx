import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Sparkles,
  AlertTriangle,
  FileText,
  Coins,
  MapPin,
  Plus,
  Minus,
  ChevronRight,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import AlgeriaMap, { WilayaDataPoint } from '@/pages/landing/assets/AlgeriaMap';
import { WilayaDetailCard, WilayaDetail } from './components/WilayaDetailCard';
import { SearchBox } from './components/SearchBox';
import { ALGERIA_69_WILAYAS } from '@/lib/wilayas';
import { api } from '@/lib/api';
import { useSuspicions } from '@/features/ai';
import type { SuspicionItem } from '@/features/ai';

interface ApiDeal {
  id: string;
  reference_number?: string;
  title?: string;
  wilaya?: string;
  current_stage?: number;
  estimated_budget?: string | number | null;
  submission_deadline?: string | null;
  created_at?: string;
}

interface WilayaStat extends WilayaDetail {
  nameFr: string;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const unwrapList = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.deals)) return record.deals;
  return [];
};

const resolveWilaya = (raw?: string) => {
  const value = String(raw || '').trim();
  if (!value) return null;
  const normalized = value.replace(/^ولاية\s+/, '').trim();
  const byCode = ALGERIA_69_WILAYAS.find(
    (item) =>
      item.code === value ||
      item.code === normalized ||
      String(Number(item.code)) === normalized,
  );
  if (byCode) return byCode;
  return (
    ALGERIA_69_WILAYAS.find(
      (item) =>
        item.ar === normalized ||
        item.fr.toLowerCase() === normalized.toLowerCase(),
    ) || null
  );
};

const flattenSuspicions = (data: { suspicions?: Record<string, SuspicionItem[]> } | undefined) => {
  if (!data?.suspicions) return [] as SuspicionItem[];
  return Object.values(data.suspicions).flat();
};

const formatCompactDzd = (amount: number) => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toLocaleString('ar-DZ', {
      maximumFractionDigits: 1,
    })} مليار دج`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('ar-DZ', {
      maximumFractionDigits: 1,
    })} مليون دج`;
  }
  return `${amount.toLocaleString('ar-DZ')} دج`;
};

export function CentralMapView() {
  const [, setLocation] = useLocation();
  const [selectedWilaya, setSelectedWilaya] = useState<WilayaDetail | null>(null);
  const [hoveredWilayaName, setHoveredWilayaName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'warnings' | 'high' | 'medium'>('all');
  const [zoom, setZoom] = useState(1);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    data: suspicionsData,
    isLoading: suspicionsLoading,
    isError: suspicionsError,
  } = useSuspicions();

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/procurements/deals/');
      const mapped: ApiDeal[] = unwrapList(response.data).map((item) => {
        const deal = asRecord(item);
        return {
          id: String(deal.id || ''),
          reference_number: typeof deal.reference_number === 'string' ? deal.reference_number : '',
          title: typeof deal.title === 'string' ? deal.title : '',
          wilaya: typeof deal.wilaya === 'string' ? deal.wilaya : '',
          current_stage: typeof deal.current_stage === 'number' ? deal.current_stage : undefined,
          estimated_budget:
            typeof deal.estimated_budget === 'string' || typeof deal.estimated_budget === 'number'
              ? deal.estimated_budget
              : null,
          submission_deadline:
            typeof deal.submission_deadline === 'string' ? deal.submission_deadline : null,
          created_at: typeof deal.created_at === 'string' ? deal.created_at : undefined,
        };
      });
      setDeals(mapped.filter((deal) => deal.id));
      setLastUpdated(new Date());
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 401 || status === 403
          ? 'تعذر الوصول إلى سجل الصفقات. يرجى التحقق من صلاحيات الحساب.'
          : 'تعذر تحميل بيانات الصفقات من السجل الوطني. يرجى المحاولة مجدداً.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  const suspicionItems = useMemo(() => flattenSuspicions(suspicionsData), [suspicionsData]);

  const nationalData = useMemo<Record<string, WilayaStat>>(() => {
    const result: Record<string, WilayaStat> = {};
    ALGERIA_69_WILAYAS.forEach((item) => {
      result[item.code] = {
        code: item.code,
        name: item.ar,
        nameFr: item.fr,
        tenders_count: 0,
        budget: 0,
        warnings: 0,
        warningDetails: [],
      };
    });

    deals.forEach((deal) => {
      const wilaya = resolveWilaya(deal.wilaya);
      if (!wilaya) return;
      const stat = result[wilaya.code];
      stat.tenders_count += 1;
      stat.budget += Number(deal.estimated_budget || 0) / 1_000_000_000;
    });

    const dealsById = new Map(deals.map((deal) => [String(deal.id), deal]));
    const seenWarnings = new Map<string, Set<string>>();

    suspicionItems.forEach((suspicion) => {
      const detail = [suspicion.title, suspicion.description].filter(Boolean).join(' — ');
      if (!detail) return;
      (suspicion.deal_ids || []).forEach((dealId) => {
        const deal = dealsById.get(String(dealId));
        if (!deal) return;
        const wilaya = resolveWilaya(deal.wilaya);
        if (!wilaya) return;
        const stat = result[wilaya.code];
        const seen = seenWarnings.get(wilaya.code) || new Set<string>();
        if (!seen.has(detail)) {
          seen.add(detail);
          stat.warnings += 1;
          stat.warningDetails = [...(stat.warningDetails || []), detail];
          seenWarnings.set(wilaya.code, seen);
        }
      });
    });

    Object.values(result).forEach((stat) => {
      stat.budget = Number(stat.budget.toFixed(2));
    });

    return result;
  }, [deals, suspicionItems]);

  const totalBudgetDzd = useMemo(
    () => deals.reduce((sum, deal) => sum + Number(deal.estimated_budget || 0), 0),
    [deals],
  );
  const totalWarnings = suspicionItems.length;
  const activeWilayas = Object.values(nationalData).filter((item) => item.tenders_count > 0).length;
  const maxTenders = Math.max(
    ...Object.values(nationalData).map((item) => item.tenders_count),
    1,
  );
  const highThreshold = Math.max(1, Math.ceil(maxTenders * 0.66));
  const mediumThreshold = Math.max(1, Math.ceil(maxTenders * 0.33));

  const getRelativeColor = (count: number, warnings: number) => {
    if (warnings > 0) return '#B02A2A';
    if (count <= 0) return '#D4DCE4';
    const ratio = count / maxTenders;
    if (ratio >= 0.66) return '#1B4332';
    if (ratio >= 0.33) return '#2D6A4F';
    return '#74C69D';
  };

  const mapData = useMemo<Record<string, WilayaDataPoint>>(() => {
    const records: Record<string, WilayaDataPoint> = {};

    Object.values(nationalData).forEach((item) => {
      let matchFilter = true;
      if (filterMode === 'warnings') matchFilter = item.warnings > 0;
      else if (filterMode === 'high') matchFilter = item.tenders_count >= highThreshold;
      else if (filterMode === 'medium') {
        matchFilter =
          item.tenders_count >= mediumThreshold && item.tenders_count < highThreshold;
      }

      const point: WilayaDataPoint = {
        value: matchFilter ? item.tenders_count : 0,
        budget: item.budget,
        warnings: matchFilter ? item.warnings : 0,
        name: item.name,
        code: item.code,
        color: matchFilter ? getRelativeColor(item.tenders_count, item.warnings) : '#D4DCE4',
      };

      records[item.code] = point;
      records[item.nameFr] = point;
      records[item.name] = point;
    });

    return records;
  }, [nationalData, filterMode, highThreshold, mediumThreshold, maxTenders]);

  const topWilayas = useMemo(
    () =>
      Object.values(nationalData)
        .filter((item) => item.tenders_count > 0)
        .sort((a, b) => b.tenders_count - a.tenders_count)
        .slice(0, 5),
    [nationalData],
  );

  const flaggedWilayas = useMemo(
    () =>
      Object.values(nationalData)
        .filter((item) => item.warnings > 0)
        .sort((a, b) => b.warnings - a.warnings),
    [nationalData],
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return Object.values(nationalData)
      .filter(
        (item) =>
          item.name.includes(query) ||
          item.code.includes(query) ||
          item.nameFr.toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [nationalData, searchQuery]);

  const handleWilayaClick = (identifier: string, details?: unknown) => {
    const detailRecord = asRecord(details);
    let matched: WilayaDetail | undefined;
    if (typeof detailRecord.code === 'string' && nationalData[detailRecord.code]) {
      matched = nationalData[detailRecord.code];
    } else if (nationalData[identifier]) {
      matched = nationalData[identifier];
    } else {
      matched = Object.values(nationalData).find(
        (item) => item.name === identifier || item.nameFr === identifier,
      );
    }

    if (matched) setSelectedWilaya(matched);
  };

  const handleZoomIn = () => setZoom((value) => Math.min(Number((value + 0.15).toFixed(2)), 2));
  const handleZoomOut = () => setZoom((value) => Math.max(Number((value - 0.15).toFixed(2)), 0.8));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#F8F9F7] text-[#24352E]" dir="rtl">
      <header className="z-20 flex-none border-b border-[#E3E7E2] bg-white px-4 py-2.5 shadow-2xs sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#CDE1D3] bg-[#EDF4EE] text-[#167354] shadow-2xs">
              <MapPin className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="m-0 text-sm font-extrabold leading-tight text-[#24352E] sm:text-base">
                  المرصد الجغرافي والرقابي
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE1D3] bg-[#EDF4EE] px-2 py-0.5 text-[10px] font-bold text-[#167354]">
                  تغطية 69 ولاية
                </span>
              </div>
              <p className="mt-0.5 hidden text-[11px] font-medium leading-none text-[#59665F] sm:block">
                رصد تدفقات الصفقات العمومية والإنذار المبكر وفق القانون 23-12
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48 sm:w-60">
              <SearchBox
                compact
                value={searchQuery}
                onChange={setSearchQuery}
                results={searchResults}
                onSelect={(wilaya) => setSelectedWilaya(wilaya)}
                placeholder="ابحث باسم أو رقم الولاية..."
              />
            </div>

            <div className="hidden items-center gap-1 rounded-xl border border-[#E3E7E2] bg-[#F8F9F7] p-1 md:flex">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  filterMode === 'all'
                    ? 'border border-[#E3E7E2] bg-white text-[#24352E] shadow-2xs'
                    : 'text-[#59665F] hover:text-[#24352E]'
                }`}
              >
                الكل (69)
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('warnings')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  filterMode === 'warnings'
                    ? 'border border-[#FECDD3] bg-[#FFF1F2] text-[#E11D48] shadow-2xs'
                    : 'text-[#59665F] hover:text-[#E11D48]'
                }`}
              >
                <AlertTriangle className="size-3" />
                <span>شبهات ({totalWarnings})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('high')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  filterMode === 'high'
                    ? 'border border-[#CDE1D3] bg-[#EDF4EE] text-[#167354] shadow-2xs'
                    : 'text-[#59665F] hover:text-[#167354]'
                }`}
              >
                نشاط عالٍ
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('medium')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  filterMode === 'medium'
                    ? 'border border-[#CDE1D3] bg-[#EDF4EE] text-[#167354] shadow-2xs'
                    : 'text-[#59665F] hover:text-[#167354]'
                }`}
              >
                نشاط متوسط
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSidePanelOpen((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7E2] bg-white px-3 py-1.5 text-xs font-bold text-[#24352E] shadow-2xs transition-colors hover:bg-[#F8F9F7]"
              title={isSidePanelOpen ? 'تصغير لوحة التحليل' : 'فتح لوحة التحليل'}
            >
              {isSidePanelOpen ? (
                <>
                  <PanelRightClose className="size-3.5 text-[#59665F]" />
                  <span className="hidden xl:inline">طي اللوحة</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="size-3.5 text-[#167354]" />
                  <span>فتح لوحة التحليل</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
        <main className="relative flex min-h-[350px] flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[#FAFBFA] via-[#F4F6F5] to-[#E9ECE9]">
          {hoveredWilayaName && (
            <div className="absolute start-4 top-4 z-20 flex animate-in items-center gap-2 rounded-xl border border-[#E3E7E2] bg-white/95 px-3.5 py-1.5 text-xs shadow-md backdrop-blur-md duration-150 fade-in">
              <span className="size-2 animate-pulse rounded-full bg-[#167354]" />
              <span className="font-medium text-[#59665F]">الولاية المحددة:</span>
              <strong className="font-black text-[#24352E]">{hoveredWilayaName}</strong>
            </div>
          )}

          <div
            className="flex h-full w-full select-none items-center justify-center p-4 transition-transform duration-300 ease-out sm:p-8 md:p-12"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <AlgeriaMap
              data={mapData}
              colorMode="heatmap"
              onWilayaClick={handleWilayaClick}
              onWilayaHover={setHoveredWilayaName}
              height="100%"
              width="100%"
            />
          </div>

          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-xl border border-[#E3E7E2] bg-white px-4 py-2.5 text-xs font-bold text-[#24352E] shadow-lg">
                <RefreshCw className="size-4 animate-spin text-[#167354]" />
                <span>جارٍ تحميل الصفقات من السجل الوطني...</span>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="absolute start-1/2 top-4 z-20 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-white/95 px-3.5 py-2.5 text-xs text-rose-800 shadow-lg backdrop-blur-md">
              <span className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4 shrink-0" />
                {error}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 font-bold text-rose-800 hover:bg-rose-50"
                onClick={() => void loadDeals()}
              >
                <RefreshCw className="size-3.5" />
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loading && !error && deals.length === 0 && (
            <div className="absolute start-1/2 top-1/2 z-20 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#E3E7E2] bg-white/95 p-5 text-center shadow-xl backdrop-blur-md">
              <FileText className="mx-auto mb-2 size-7 text-[#59665F]" />
              <h3 className="m-0 text-sm font-extrabold text-[#24352E]">
                لا توجد صفقات مسجلة حالياً
              </h3>
              <p className="mb-0 mt-1 text-xs leading-relaxed text-[#59665F]">
                ستظهر الولايات على الخريطة فور تسجيل صفقات حقيقية في السجل الوطني.
              </p>
            </div>
          )}

          {selectedWilaya && (
            <div className="absolute bottom-4 start-4 z-30 w-[410px] max-w-[calc(100vw-2rem)]">
              <WilayaDetailCard
                wilaya={selectedWilaya}
                onClose={() => setSelectedWilaya(null)}
                onViewTenders={(code) => setLocation(`/central/deals?wilaya=${code}`)}
              />
            </div>
          )}

          <div className="absolute bottom-4 end-4 z-20 flex flex-col gap-1.5 rounded-2xl border border-[#E3E7E2] bg-white/90 p-1 shadow-md backdrop-blur-md">
            <button
              type="button"
              onClick={handleZoomIn}
              title="تكبير الخريطة"
              aria-label="تكبير"
              className="flex size-8 items-center justify-center rounded-xl text-[#24352E] transition-colors hover:bg-[#EDF4EE] hover:text-[#167354]"
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="تصغير الخريطة"
              aria-label="تصغير"
              className="flex size-8 items-center justify-center rounded-xl text-[#24352E] transition-colors hover:bg-[#EDF4EE] hover:text-[#167354]"
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              title="إعادة ضبط الحجم الأصلي"
              aria-label="إعادة ضبط"
              className="flex size-8 items-center justify-center rounded-xl border-t border-[#E3E7E2]/60 pt-1 text-[#24352E] transition-colors hover:bg-[#EDF4EE] hover:text-[#167354]"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>

          <div className="absolute bottom-4 start-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-[#E3E7E2] bg-white/80 px-3 py-1 text-[11px] font-medium text-[#59665F] shadow-2xs backdrop-blur-md sm:flex">
            <span className="size-2 rounded-full bg-[#167354]" />
            <span>
              {lastUpdated
                ? `آخر تحديث من السجل الوطني: ${lastUpdated.toLocaleTimeString('ar-DZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'بانتظار بيانات السجل الوطني'}
            </span>
          </div>
        </main>

        {isSidePanelOpen && (
          <aside className="z-10 flex h-auto w-full flex-none flex-col overflow-y-auto border-t border-[#E3E7E2] bg-white shadow-xs lg:h-full lg:w-[380px] lg:border-s lg:border-t-0 xl:w-[410px]">
            <div className="border-b border-[#E3E7E2] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#59665F]">
                  <TrendingUp className="size-3.5 text-[#167354]" />
                  <span>المؤشرات الوطنية التراكمية</span>
                </span>
                <span className="rounded-md bg-[#EDF4EE] px-2 py-0.5 font-mono text-[11px] font-bold text-[#167354]">
                  {loading ? 'جارٍ التحديث' : 'محدّث'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-[#E3E7E2] bg-[#F8F9F7] p-3 shadow-2xs">
                  <div className="mb-1 flex items-center justify-between text-[#59665F]">
                    <span className="text-[11px] font-bold">إجمالي الصفقات</span>
                    <FileText className="size-3.5 text-[#167354]" />
                  </div>
                  <div className="font-mono text-xl font-black text-[#24352E]">
                    {deals.length.toLocaleString('ar-DZ')}
                  </div>
                  <span className="text-[10px] font-bold text-[#167354]">
                    من السجل الوطني
                  </span>
                </div>

                <div className="rounded-xl border border-[#E3E7E2] bg-[#F8F9F7] p-3 shadow-2xs">
                  <div className="mb-1 flex items-center justify-between text-[#59665F]">
                    <span className="text-[11px] font-bold">الحجم المالي</span>
                    <Coins className="size-3.5 text-[#2563EB]" />
                  </div>
                  <div
                    className="truncate font-mono text-lg font-black text-[#24352E]"
                    title={formatCompactDzd(totalBudgetDzd)}
                  >
                    {formatCompactDzd(totalBudgetDzd)}
                  </div>
                  <span className="text-[10px] font-bold text-[#2563EB]">
                    الميزانيات التقديرية
                  </span>
                </div>

                <div className="rounded-xl border border-[#E3E7E2] bg-[#F8F9F7] p-3 shadow-2xs">
                  <div className="mb-1 flex items-center justify-between text-[#59665F]">
                    <span className="text-[11px] font-bold">الولايات النشطة</span>
                    <MapPin className="size-3.5 text-[#167354]" />
                  </div>
                  <div className="font-mono text-xl font-black text-[#24352E]">
                    {activeWilayas.toLocaleString('ar-DZ')}{' '}
                    <span className="text-xs font-bold text-[#59665F]">ولاية</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#59665F]">
                    ذات صفقات مسجلة
                  </span>
                </div>

                <div className="rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-3 shadow-2xs">
                  <div className="mb-1 flex items-center justify-between text-[#E11D48]">
                    <span className="text-[11px] font-bold">شبهات مرصودة</span>
                    <AlertTriangle className="size-3.5 text-[#E11D48]" />
                  </div>
                  <div className="font-mono text-xl font-black text-[#E11D48]">
                    {totalWarnings.toLocaleString('ar-DZ')}{' '}
                    <span className="text-xs font-bold text-[#BE123C]">حالة</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#E11D48]">
                    تحليل استشاري
                  </span>
                </div>
              </div>
            </div>

            <div className="border-b border-[#E3E7E2] bg-[#FDFEFC] p-4 sm:p-5">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#167354]" />
                  <span className="text-xs font-extrabold text-[#24352E]">
                    رادار الذكاء الاصطناعي الاستباقي
                  </span>
                </div>
                <span className="rounded bg-[#EDF4EE] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#167354]">
                  AI Monitor
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {suspicionsLoading ? (
                  <div className="space-y-2">
                    <div className="h-16 w-full animate-pulse rounded-lg bg-[#E3E7E2]" />
                    <div className="h-16 w-full animate-pulse rounded-lg bg-[#E3E7E2]" />
                  </div>
                ) : suspicionsError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] font-semibold text-rose-800">
                    تعذر تحميل نتائج التحليل الاستشاري حالياً.
                  </div>
                ) : flaggedWilayas.length === 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] font-semibold text-emerald-900">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                    <span>لا توجد شبهات مرتبطة بصفقات الولايات في التحليل الحالي.</span>
                  </div>
                ) : (
                  flaggedWilayas.slice(0, 2).map((wilaya) => (
                    <button
                      key={wilaya.code}
                      type="button"
                      className="w-full cursor-pointer rounded-lg border border-[#E3E7E2] bg-white p-2.5 text-right transition-colors hover:border-[#167354]"
                      onClick={() => handleWilayaClick(wilaya.code)}
                    >
                      <div className="mb-1 flex items-center justify-between font-bold text-[#24352E]">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-[#E11D48]" />
                          <span>
                            {wilaya.name} ({wilaya.code})
                          </span>
                        </span>
                        <span className="rounded bg-rose-50 px-1.5 py-0.2 font-mono text-[11px] text-[#E11D48]">
                          {wilaya.warnings} تنبيهات
                        </span>
                      </div>
                      <p className="m-0 line-clamp-2 text-[11px] font-medium leading-relaxed text-[#59665F]">
                        {wilaya.warningDetails?.[0] || 'شبهة مسجلة تستدعي المراجعة الرقابية.'}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="border-b border-[#E3E7E2] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-[#59665F]">
                  أعلى الولايات نشاطاً في الصفقات
                </span>
                <span className="text-[11px] font-bold text-[#167354]">ترتيب وطني</span>
              </div>

              {topWilayas.length === 0 ? (
                <p className="m-0 rounded-lg border border-dashed border-[#E3E7E2] p-3 text-center text-[11px] font-semibold text-[#59665F]">
                  لا توجد ولايات ذات صفقات مسجلة بعد.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {topWilayas.map((wilaya, index) => {
                    const isSelected = selectedWilaya?.code === wilaya.code;
                    return (
                      <button
                        key={wilaya.code}
                        type="button"
                        onClick={() => handleWilayaClick(wilaya.code, wilaya)}
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-right transition-all ${
                          isSelected
                            ? 'border-[#167354] bg-[#EDF4EE] shadow-xs'
                            : 'border-[#E3E7E2] bg-white hover:bg-[#F8F9F7]'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-[#E3E7E2] bg-[#F8F9F7] font-mono text-xs font-black text-[#59665F]">
                            {index + 1}
                          </span>
                          <div className="truncate">
                            <span className="block truncate text-xs font-bold text-[#24352E]">
                              {wilaya.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#59665F]">
                              {wilaya.budget.toLocaleString('ar-DZ', {
                                maximumFractionDigits: 1,
                              })}{' '}
                              مليار دج
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {wilaya.warnings > 0 && (
                            <span className="rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-700">
                              {wilaya.warnings} شبهة
                            </span>
                          )}
                          <span className="rounded-md border border-[#CDE1D3] bg-white px-2 py-0.5 font-mono text-xs font-black text-[#167354]">
                            {wilaya.tenders_count} صفقة
                          </span>
                          <ChevronRight className="size-3.5 text-[#59665F] rtl:rotate-180" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-auto bg-[#F8F9F7] p-4 text-xs sm:p-5">
              <span className="mb-2 block text-[11px] font-bold text-[#59665F]">
                دليل التدرج الحراري للخريطة:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="size-3 shrink-0 rounded bg-[#1B4332]" />
                  <span className="font-medium text-[#24352E]">نشاط عالٍ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 shrink-0 rounded bg-[#2D6A4F]" />
                  <span className="font-medium text-[#24352E]">نشاط متوسط</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 shrink-0 rounded bg-[#74C69D]" />
                  <span className="font-medium text-[#24352E]">نشاط منخفض</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 shrink-0 animate-pulse rounded bg-[#B02A2A]" />
                  <span className="font-bold text-[#E11D48]">شبهات مرصودة</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default CentralMapView;
