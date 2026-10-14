import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import AlgeriaMap, { WilayaDataPoint } from '@/pages/landing/assets/AlgeriaMap';
import { WilayaDetailCard, WilayaDetail } from './components/WilayaDetailCard';
import { ALGERIA_69_WILAYAS } from '@/lib/wilayas';

// Seed raw high-activity / flagged wilayas
const PRESET_WILAYAS: Record<string, Partial<WilayaDetail>> = {
  '16': { tenders_count: 234, budget: 45.6, warnings: 0, warningDetails: [] },
  '31': { tenders_count: 180, budget: 32.1, warnings: 0, warningDetails: [] },
  '25': { tenders_count: 145, budget: 28.4, warnings: 2, warningDetails: ['تركيز 70% من مشاريع التهيئة لدى متعاملين اثنين.', 'تأخير في نشر ملخصات فتح الأظرفة على البوابة.'] },
  '23': { tenders_count: 98,  budget: 18.2, warnings: 0, warningDetails: [] },
  '13': { tenders_count: 87,  budget: 12.3, warnings: 3, warningDetails: ['3 صفقات متتالية ممنوحة لنفس المتعامل دون تنافس تقني كافٍ.', 'شبهة تجزئة نفقات الصيانة الدورية بالبلديات (م. 27).', 'اعتراض مسجل في مرحلة إعلان المنح المؤقت.'] },
  '09': { tenders_count: 76,  budget: 15.8, warnings: 0, warningDetails: [] },
  '19': { tenders_count: 65,  budget: 14.2, warnings: 1, warningDetails: ['تأخير تجاوز 35 يوماً في تقييم العروض التقنية.'] },
  '06': { tenders_count: 54,  budget: 9.8,  warnings: 0, warningDetails: [] },
  '05': { tenders_count: 43,  budget: 8.4,  warnings: 0, warningDetails: [] },
  '30': { tenders_count: 32,  budget: 6.2,  warnings: 1, warningDetails: ['عرض وحيد في مناقصة صيانة شبكات مياه التطهير.'] },
  '15': { tenders_count: 28,  budget: 4.9,  warnings: 1, warningDetails: ['طعن إجرائي معلق أمام اللجنة الولائية للصفقات.'] },
  '27': { tenders_count: 24,  budget: 4.1,  warnings: 0, warningDetails: [] },
  '02': { tenders_count: 21,  budget: 3.8,  warnings: 1, warningDetails: ['تعديل غير مبرر لشروط الأهلية بعد نشر المناقصة.'] },
  '28': { tenders_count: 18,  budget: 3.2,  warnings: 1, warningDetails: ['شبهة تقارب سعري متكرر بين العروض المتنافسة.'] },
  '17': { tenders_count: 16,  budget: 2.9,  warnings: 0, warningDetails: [] },
  '07': { tenders_count: 15,  budget: 2.6,  warnings: 1, warningDetails: ['إلغاء إجراء مناقصة دون تعليل تقني كافٍ.'] },
  '29': { tenders_count: 14,  budget: 2.4,  warnings: 0, warningDetails: [] },
  '03': { tenders_count: 13,  budget: 2.2,  warnings: 1, warningDetails: ['عدم احترام آجال تقديم العروض الدنيا القانونية.'] },
  '01': { tenders_count: 12,  budget: 2.1,  warnings: 0, warningDetails: [] },
};

// Generate comprehensive dataset for all 69 Algerian Wilayas
function buildNational69Dataset(): Record<string, WilayaDetail> {
  const result: Record<string, WilayaDetail> = {};

  ALGERIA_69_WILAYAS.forEach((item, index) => {
    const code = item.code;
    const preset = PRESET_WILAYAS[code];

    if (preset) {
      result[code] = {
        code,
        name: item.ar,
        nameFr: item.fr,
        tenders_count: preset.tenders_count ?? 10,
        budget: preset.budget ?? 1.5,
        warnings: preset.warnings ?? 0,
        warningDetails: preset.warningDetails ?? [],
      };
    } else {
      // Deterministic, realistic distribution for other wilayas
      const seed = (index * 7 + 13) % 19;
      const count = Math.max(3, seed);
      const budget = Number((count * 0.16 + 0.3).toFixed(1));
      result[code] = {
        code,
        name: item.ar,
        nameFr: item.fr,
        tenders_count: count,
        budget,
        warnings: 0,
        warningDetails: [],
      };
    }
  });

  return result;
}

export function CentralMapView() {
  const [, setLocation] = useLocation();
  const [selectedWilaya, setSelectedWilaya] = useState<WilayaDetail | null>(null);
  const [hoveredWilayaName, setHoveredWilayaName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Full 69-wilayas data
  const nationalData = useMemo(() => buildNational69Dataset(), []);

  // Format data for AlgeriaMap component
  const mapData = useMemo<Record<string, WilayaDataPoint>>(() => {
    const records: Record<string, WilayaDataPoint> = {};
    Object.values(nationalData).forEach((item) => {
      records[item.code] = {
        value: item.tenders_count,
        budget: item.budget,
        warnings: item.warnings,
        name: item.name,
        code: item.code,
      };
      records[item.nameFr || ''] = records[item.code];
      records[item.name] = records[item.code];
    });
    return records;
  }, [nationalData]);

  // Top 5 wilayas by tender activity
  const topWilayas = useMemo(() => {
    return Object.values(nationalData)
      .sort((a, b) => b.tenders_count - a.tenders_count)
      .slice(0, 5);
  }, [nationalData]);

  // Filtered search list for the dropdown/selector
  const filteredSearchList = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return Object.values(nationalData)
      .filter(
        (w) =>
          w.name.includes(query) ||
          w.code.includes(query) ||
          (w.nameFr && w.nameFr.toLowerCase().includes(query))
      )
      .slice(0, 6);
  }, [nationalData, searchQuery]);

  const handleWilayaClick = (identifier: string, details?: any) => {
    // Look up by code, name, or details passed
    let matched: WilayaDetail | undefined;
    if (details?.code && nationalData[details.code]) {
      matched = nationalData[details.code];
    } else if (nationalData[identifier]) {
      matched = nationalData[identifier];
    } else {
      matched = Object.values(nationalData).find(
        (w) => w.name === identifier || w.nameFr === identifier
      );
    }

    if (matched) {
      setSelectedWilaya(matched);
    }
  };

  const handleNotifyAuthority = (code: string) => {
    const target = nationalData[code];
    setNotificationToast(
      `تم إرسال إشعار رقابي فوري إلى المصلحة المتعاقدة بولاية ${target?.name || code} عبر القناة المشفرة.`
    );
    setTimeout(() => setNotificationToast(null), 5000);
  };

  const handleViewTenders = (code: string) => {
    setLocation(`/central/deals?wilaya=${code}`);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-[var(--paper-50)] text-[var(--ink-900)]">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed top-5 start-1/2 -translate-x-1/2 z-50 bg-[var(--ink-900)] text-white px-5 py-3 rounded-xl shadow-2xl text-xs flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Main Area: Map & Overlay Controls */}
      <main className="flex-1 h-[65vh] lg:h-screen overflow-hidden relative flex flex-col">
        {/* Header Overlay */}
        <div className="absolute top-0 start-0 end-0 z-10 p-4 md:p-6 pointer-events-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="bg-white/95 backdrop-blur-md border border-[var(--color-border-subtle)] shadow-sm rounded-xl p-4 inline-block pointer-events-auto">
              <div className="eyebrow mb-1">المراقبة الوطنية المركزية</div>
              <div className="flex items-center gap-3">
                <h1 className="heading-h2 text-xl md:text-2xl font-bold text-[var(--ink-900)]">
                  الخريطة الحرارية للصفقات
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[var(--stamp-green-700)] border border-emerald-200">
                  تغطية 69 ولاية
                </span>
              </div>
            </div>

            {/* Quick Wilaya Search Bar */}
            <div className="relative pointer-events-auto w-full sm:w-64">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن ولاية أو رقم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 ps-9 pe-3 text-xs rounded-xl bg-white/95 backdrop-blur-md border border-[var(--color-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--stamp-green-700)] shadow-sm"
                />
                <Search className="w-4 h-4 text-[var(--ink-500)] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search dropdown results */}
              {filteredSearchList.length > 0 && (
                <div className="absolute top-12 start-0 end-0 bg-white rounded-xl border border-[var(--color-border-subtle)] shadow-xl overflow-hidden z-30 py-1">
                  {filteredSearchList.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setSelectedWilaya(item);
                        setSearchQuery('');
                      }}
                      className="w-full text-start px-3 py-2 text-xs hover:bg-[var(--paper-100)] flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--ink-500)]">
                          {item.code}
                        </span>
                        <span className="font-medium text-[var(--ink-900)]">{item.name}</span>
                        {item.nameFr && (
                          <span className="text-[10px] text-[var(--ink-500)]">({item.nameFr})</span>
                        )}
                      </div>
                      <span className="font-mono text-[var(--stamp-green-700)] font-semibold">
                        {item.tenders_count} صفقة
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {hoveredWilayaName && (
            <div className="mt-2 text-xs font-medium text-[var(--ink-700)] bg-white/80 backdrop-blur px-3 py-1 rounded-lg inline-block border border-[var(--color-border-subtle)] shadow-sm pointer-events-auto">
              المؤشر: <strong className="text-[var(--ink-900)]">{hoveredWilayaName}</strong>
            </div>
          )}
        </div>

        {/* Map Viewport */}
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--paper-50)] via-[#f3f6f9] to-[var(--paper-100)] p-4 pt-20">
          <AlgeriaMap
            data={mapData}
            colorMode="heatmap"
            onWilayaClick={handleWilayaClick}
            onWilayaHover={setHoveredWilayaName}
          />
        </div>

        {/* Legend Overlay — Bottom Start */}
        <div className="absolute bottom-6 start-6 z-10 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[var(--color-border-subtle)] shadow-xl p-4 min-w-[210px]">
            <div className="eyebrow mb-3 flex items-center justify-between">
              <span>مستوى النشاط</span>
              <span className="text-[10px] text-[var(--ink-500)]">صفقات 2026</span>
            </div>
            <div className="space-y-2 text-xs">
              <LegendItem color="#1B4332" label="نشاط عالٍ" count="50+" />
              <LegendItem color="#2D6A4F" label="نشاط متوسط" count="20-49" />
              <LegendItem color="#74C69D" label="نشاط منخفض" count="5-19" />
              <LegendItem color="#D4DCE4" label="لا نشاط" count="0-4" />
              <div className="pt-1 border-t border-[var(--color-border-subtle)]">
                <LegendItem color="#B02A2A" label="شبهات مرصودة" count="⚠️ 12" />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Wilaya Card — Bottom End */}
        {selectedWilaya && (
          <div className="absolute bottom-6 end-6 z-20 w-80 md:w-96 pointer-events-auto max-h-[85vh] overflow-y-auto">
            <WilayaDetailCard
              wilaya={selectedWilaya}
              onClose={() => setSelectedWilaya(null)}
              onNotifyAuthority={handleNotifyAuthority}
              onViewTenders={handleViewTenders}
            />
          </div>
        )}
      </main>

      {/* Sidebar: National KPIs & AI Insights */}
      <aside className="w-full lg:w-[340px] xl:w-[380px] h-[35vh] lg:h-screen overflow-y-auto border-s border-[var(--color-border-subtle)] bg-white p-6 flex flex-col gap-6 shadow-sm">
        {/* National KPIs Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="eyebrow mb-0">المؤشرات الوطنية المركزية</div>
            <span className="text-[11px] text-[var(--ink-500)] font-mono">Q1 2026</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NationalKPI
              eyebrow="إجمالي الصفقات"
              value="1,248"
              trend={12}
            />
            <NationalKPI
              eyebrow="الحجم المالي"
              value="185"
              unit="مليار دج"
              trend={8}
            />
            <NationalKPI
              eyebrow="الولايات النشطة"
              value="69"
              unit="ولاية"
              trend={0}
            />
            <NationalKPI
              eyebrow="شبهات مرصودة"
              value="12"
              trend={-5}
              urgent
            />
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="ai-card">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--ai-text)] ai-sparkle" />
              <h3 className="font-bold text-sm text-[var(--ai-text-strong)]">تحليل AI الاستباقي</h3>
              <span className="ai-badge">AI</span>
            </div>
            <span className="text-[10px] text-[var(--ai-text)]/80 font-medium">استشاري فقط</span>
          </div>

          <ul className="space-y-2.5 text-xs text-[var(--ink-700)] relative z-10 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 flex-none mt-1.5" />
              <div>
                <strong className="text-rose-900 font-bold">تلمسان:</strong> 3 صفقات بدون تنافس تقني — شبهة تجزئة في بلدية الرمشي.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-none mt-1.5" />
              <div>
                <strong className="text-amber-900 font-bold">وهران:</strong> تأخير 30% في وتيرة الإسناد وجلسات الفتح.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 flex-none mt-1.5" />
              <div>
                <strong className="text-blue-900 font-bold">الجزائر:</strong> 234 صفقة نشطة بحجم مالي 45.6 مليار دج.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 flex-none mt-1.5" />
              <div>
                <strong className="text-rose-900 font-bold">قسنطينة:</strong> تركيز 70% من صفقات قطاع الأشغال لدى مقاولتين.
              </div>
            </li>
          </ul>
        </div>

        {/* Top 5 Wilayas List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="eyebrow mb-0">أعلى 5 ولايات نشاطاً</h3>
            <span className="text-[11px] text-[var(--ink-500)]">اضغط للتفاصيل</span>
          </div>

          <div className="space-y-2">
            {topWilayas.map((w, idx) => (
              <TopWilayaItem
                key={w.code}
                rank={idx + 1}
                wilaya={w}
                isSelected={selectedWilaya?.code === w.code}
                onClick={() => handleWilayaClick(w.code)}
              />
            ))}
          </div>
        </div>

        {/* Bottom System Status */}
        <div className="mt-auto pt-4 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--ink-500)] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            تحديث البيانات اللحظي: نشط
          </span>
          <span className="font-mono">قانون 23-12</span>
        </div>
      </aside>
    </div>
  );
}

// Subcomponents: LegendItem
function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span
          className="w-3.5 h-3.5 rounded-md flex-none shadow-sm"
          style={{ backgroundColor: color }}
        />
        <span className="text-[var(--ink-700)] font-medium">{label}</span>
      </div>
      {count && (
        <span className="font-mono font-bold text-[var(--ink-500)] text-[11px]">
          {count}
        </span>
      )}
    </div>
  );
}

// Subcomponents: NationalKPI
function NationalKPI({
  eyebrow,
  value,
  unit,
  trend,
  urgent,
}: {
  eyebrow: string;
  value: string;
  unit?: string;
  trend?: number;
  urgent?: boolean;
}) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        urgent
          ? 'bg-rose-50/70 border-rose-200'
          : 'bg-[var(--paper-50)] border-[var(--color-border-subtle)]'
      }`}
    >
      <div className="text-[11px] text-[var(--ink-500)] mb-1 truncate">{eyebrow}</div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-xl font-bold font-mono ${
            urgent ? 'text-rose-700' : 'text-[var(--ink-900)]'
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-[10px] text-[var(--ink-500)]">{unit}</span>}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold">
          {isPositive && (
            <span className="text-emerald-700 flex items-center">
              <TrendingUp className="w-3 h-3 inline me-0.5" />+{trend}%
            </span>
          )}
          {isNegative && (
            <span className={urgent ? 'text-rose-700 flex items-center' : 'text-emerald-700 flex items-center'}>
              <TrendingDown className="w-3 h-3 inline me-0.5" />
              {trend}%
            </span>
          )}
          {trend === 0 && <span className="text-[var(--ink-500)]">0% ثابت</span>}
          <span className="text-[var(--ink-500)] font-normal">مقارنة بـ 2025</span>
        </div>
      )}
    </div>
  );
}

// Subcomponents: TopWilayaItem
function TopWilayaItem({
  rank,
  wilaya,
  isSelected,
  onClick,
}: {
  rank: number;
  wilaya: WilayaDetail;
  isSelected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-start p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
        isSelected
          ? 'bg-emerald-50 border-[var(--stamp-green-700)] shadow-sm'
          : 'bg-[var(--paper-50)] border-[var(--color-border-subtle)] hover:bg-[var(--paper-100)]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-5 h-5 rounded-full bg-[var(--paper-200)] text-[var(--ink-700)] font-mono text-[10px] font-bold flex items-center justify-center flex-none">
          {rank}
        </span>
        <div className="truncate">
          <div className="text-xs font-bold text-[var(--ink-900)] truncate flex items-center gap-1.5">
            <span>{wilaya.name}</span>
            <span className="text-[10px] font-mono text-[var(--ink-500)]">({wilaya.code})</span>
            {wilaya.warnings > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-semibold">
                ⚠️ {wilaya.warnings}
              </span>
            )}
          </div>
          <div className="text-[10px] text-[var(--ink-500)]">{wilaya.budget} مليار دج</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-none">
        <span className="font-mono text-xs font-bold text-[var(--stamp-green-700)]">
          {wilaya.tenders_count}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-500)] rtl:rotate-180" />
      </div>
    </button>
  );
}
