import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Sparkles,
  AlertTriangle,
  FileText,
  Coins,
  MapPin,
  Plus,
  Minus,
  Maximize2,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import AlgeriaMap, { WilayaDataPoint } from '@/pages/landing/assets/AlgeriaMap';
import { WilayaDetailCard, WilayaDetail } from './components/WilayaDetailCard';
import { KPICompact } from './components/KPICompact';
import { SearchBox } from './components/SearchBox';
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
  const [zoom, setZoom] = useState(1);

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

  // Filtered search list
  const searchResults = useMemo(() => {
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

  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 2.0));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.8));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-[var(--paper-50)] text-[var(--ink-900)]" dir="rtl">
      
      {/* 1. الخريطة — البطل (70%) */}
      <main className="flex-1 h-screen relative bg-gradient-to-br from-[var(--paper-50)] via-[#f3f6f9] to-[var(--paper-100)] overflow-hidden flex items-center justify-center">
        
        {/* Floating Top Controls: Search + Back to Dashboard */}
        <div className="absolute top-6 start-6 z-20 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link href="/central/dashboard">
              <a
                className="h-11 px-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-[var(--color-border-subtle)] shadow-lg hover:bg-[var(--paper-100)] text-xs font-bold text-[var(--ink-700)] flex items-center gap-1.5 transition-all"
                title="الرجوع إلى لوحة القيادة المركزية"
              >
                <ArrowRight className="size-4 rtl:rotate-0" />
                <span className="hidden sm:inline">لوحة القيادة</span>
              </a>
            </Link>

            <SearchBox
              compact
              value={searchQuery}
              onChange={setSearchQuery}
              results={searchResults}
              onSelect={(w) => setSelectedWilaya(w)}
            />
          </div>

          {hoveredWilayaName && (
            <div className="text-xs font-semibold text-[var(--ink-700)] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-[var(--color-border-subtle)] shadow-md w-fit animate-in fade-in">
              <span className="size-2 rounded-full bg-[var(--stamp-green-700)]" />
              <span>الولاية:</span>
              <strong className="text-[var(--ink-900)]">{hoveredWilayaName}</strong>
            </div>
          )}
        </div>

        {/* الخريطة تملأ كل شيء بدون حجب */}
        <div
          className="w-full h-full flex items-center justify-center p-6 md:p-12 transition-transform duration-300 ease-out select-none"
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

        {/* WilayaDetailCard — يظهر عند النقر في bottom-start */}
        {selectedWilaya && (
          <div className="absolute bottom-6 start-6 z-30 w-[420px] max-w-[calc(100vw-3rem)]">
            <WilayaDetailCard
              wilaya={selectedWilaya}
              onClose={() => setSelectedWilaya(null)}
              onViewTenders={(code) => setLocation(`/central/deals?wilaya=${code}`)}
              onNotifyAuthority={(code) => {
                alert(`تم توجيه إخطار رقابي فوري إلى المصلحة المتعاقدة بولاية ${selectedWilaya.name} (${code})`);
              }}
            />
          </div>
        )}

        {/* Zoom Controls — صغيرة في الزاوية السفلى */}
        <div className="absolute bottom-6 end-6 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            title="تكبير الخريطة"
            aria-label="تكبير"
            className="size-10 rounded-xl bg-white/95 backdrop-blur-md border border-[var(--color-border-subtle)] shadow-lg hover:bg-[var(--paper-100)] active:scale-95 text-[var(--ink-700)] flex items-center justify-center transition-all"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="تصغير الخريطة"
            aria-label="تصغير"
            className="size-10 rounded-xl bg-white/95 backdrop-blur-md border border-[var(--color-border-subtle)] shadow-lg hover:bg-[var(--paper-100)] active:scale-95 text-[var(--ink-700)] flex items-center justify-center transition-all"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            title="إعادة ضبط الحجم الأصلي"
            aria-label="إعادة ضبط"
            className="size-10 rounded-xl bg-white/95 backdrop-blur-md border border-[var(--color-border-subtle)] shadow-lg hover:bg-[var(--paper-100)] active:scale-95 text-[var(--ink-700)] flex items-center justify-center transition-all"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>

      </main>

      {/* 2. Sidebar معلوماتي (30%) */}
      <aside className="w-full lg:w-[420px] h-screen bg-white border-s border-[var(--color-border-subtle)] overflow-y-auto flex-none flex flex-col shadow-sm">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="eyebrow text-[var(--stamp-green-700)]">المراقبة الوطنية</div>
          <h1 className="heading-h2 text-2xl font-bold text-[var(--ink-900)] mt-1.5">الخريطة الحرارية</h1>
          <p className="text-sm text-[var(--ink-500)] mt-1">
            تغطية 69 ولاية — رصد الأنشطة والتدفقات المالية
          </p>
        </div>

        {/* KPIs — مكدّسة عمودياً (واضحة ومنظمة) */}
        <div className="p-6 space-y-3.5 border-b border-[var(--color-border-subtle)]">
          <KPICompact
            eyebrow="إجمالي الصفقات"
            value="1,248"
            trend={12}
            icon={FileText}
          />
          <KPICompact
            eyebrow="الحجم المالي"
            value="185"
            unit="مليار دج"
            trend={8}
            icon={Coins}
          />
          <KPICompact
            eyebrow="الولايات النشطة"
            value="69"
            unit="ولاية"
            icon={MapPin}
          />
          <KPICompact
            eyebrow="شبهات مرصودة"
            value="12"
            trend={-5}
            urgent
            icon={AlertTriangle}
          />
        </div>

        {/* Legend — هنا (وليس على الخريطة) */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <h3 className="eyebrow mb-3.5 text-[var(--ink-600)]">مستوى النشاط</h3>
          <div className="space-y-2.5">
            <LegendItem color="var(--stamp-green-700)" label="نشاط عالٍ" range="50+" />
            <LegendItem color="var(--stamp-green-500)" label="نشاط متوسط" range="20-49" />
            <LegendItem color="var(--stamp-green-300)" label="نشاط منخفض" range="5-19" />
            <LegendItem color="var(--ink-100)" label="لا نشاط" range="0-4" />
            <LegendItem color="var(--stamp-red-700)" label="⚠ شبهات مرصودة" range="12 حالة" />
          </div>
        </div>

        {/* AI Insights */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="ai-card">
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <Sparkles className="size-4 text-[var(--ai-text)] ai-sparkle" />
              <h3 className="font-bold text-sm text-[var(--ai-text-strong)]">تحليل AI الاستباقي</h3>
              <span className="ai-badge">AI</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--ink-700)] relative z-10 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[var(--stamp-red-700)] text-base leading-none">●</span>
                <span><strong>تلمسان:</strong> 3 صفقات بدون تنافس تقني</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--stamp-gold-700)] text-base leading-none">●</span>
                <span><strong>وهران:</strong> تأخير 30% في الإسناد</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--official-500)] text-base leading-none">●</span>
                <span><strong>الجزائر:</strong> 234 صفقة نشطة</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Top 5 Wilayas */}
        <div className="p-6">
          <h3 className="eyebrow mb-4 text-[var(--ink-600)]">أعلى 5 ولايات نشاطاً</h3>
          <div className="space-y-2">
            {topWilayas.map((w, i) => (
              <button
                key={w.code}
                type="button"
                onClick={() => handleWilayaClick(w.code, w)}
                className={`
                  w-full flex items-center gap-3 
                  p-3 rounded-xl 
                  transition-all text-start border
                  ${
                    selectedWilaya?.code === w.code
                      ? 'bg-emerald-50/70 border-[var(--stamp-green-700)] shadow-xs'
                      : 'bg-white border-[var(--color-border-subtle)] hover:bg-[var(--paper-100)]'
                  }
                `}
              >
                <span className="
                  size-8 rounded-full 
                  bg-[var(--paper-100)]
                  flex items-center justify-center
                  font-mono font-bold text-sm
                  text-[var(--ink-700)] shrink-0
                ">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--ink-900)] truncate flex items-center gap-1.5">
                    <span>{w.name}</span>
                    <span className="text-[11px] font-mono text-[var(--ink-500)]">({w.code})</span>
                    {w.warnings > 0 && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-rose-100 text-rose-700 font-semibold">
                        ⚠️ {w.warnings}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--ink-500)] font-mono mt-0.5">{w.budget} مليار دج</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-sm font-bold text-[var(--stamp-green-700)]">
                    {w.tenders_count}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--ink-400)] rtl:rotate-180" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-auto p-6 border-t border-[var(--color-border-subtle)] bg-[var(--paper-50)] text-xs text-[var(--ink-500)] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            تحديث البيانات: لحظي
          </span>
          <span className="font-mono">القانون 23-12</span>
        </div>

      </aside>

    </div>
  );
}

// Subcomponents: LegendItem
function LegendItem({
  color,
  label,
  range,
}: {
  color: string;
  label: string;
  range?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2.5">
        <span
          className="size-3.5 rounded-md shrink-0 shadow-xs"
          style={{ backgroundColor: color }}
        />
        <span className="text-[var(--ink-700)] font-medium">{label}</span>
      </div>
      {range && (
        <span className="font-mono text-xs text-[var(--ink-500)] font-semibold">
          {range}
        </span>
      )}
    </div>
  );
}

export default CentralMapView;
