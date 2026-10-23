import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  Sparkles,
  AlertTriangle,
  FileText,
  Coins,
  MapPin,
  Plus,
  Minus,
  Maximize2,
  ChevronRight,
  ShieldAlert,
  Filter,
  Layers,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  TrendingUp,
  Building2,
  Info,
} from 'lucide-react';
import AlgeriaMap, { WilayaDataPoint } from '@/pages/landing/assets/AlgeriaMap';
import { WilayaDetailCard, WilayaDetail } from './components/WilayaDetailCard';
import { KPICompact } from './components/KPICompact';
import { SearchBox } from './components/SearchBox';
import { ALGERIA_69_WILAYAS } from '@/lib/wilayas';

// بيانات أولية معيارية للولايات ذات النشاط البارز أو التنبيهات الرقابية
const PRESET_WILAYAS: Record<string, Partial<WilayaDetail>> = {
  '16': { tenders_count: 234, budget: 45.6, warnings: 0, warningDetails: [] },
  '31': { tenders_count: 180, budget: 32.1, warnings: 0, warningDetails: [] },
  '25': { tenders_count: 145, budget: 28.4, warnings: 2, warningDetails: ['شبهة تركيز 70% من مشاريع التهيئة لدى متعاملين اثنين.', 'تأخير ملحوظ في نشر ملخصات فتح الأظرفة على البوابة.'] },
  '23': { tenders_count: 98,  budget: 18.2, warnings: 0, warningDetails: [] },
  '13': { tenders_count: 87,  budget: 12.3, warnings: 3, warningDetails: ['3 صفقات متتالية ممنوحة لنفس المتعامل دون تنافس تقني كافٍ.', 'شبهة تجزئة نفقات الصيانة الدورية بالبلديات (م. 27).', 'اعتراض مسجل في مرحلة إعلان المنح المؤقت.'] },
  '09': { tenders_count: 76,  budget: 15.8, warnings: 0, warningDetails: [] },
  '19': { tenders_count: 65,  budget: 14.2, warnings: 1, warningDetails: ['تأخير تجاوز 35 يوماً في تقييم العروض التقنية مقارنة بالمتوسط الوطني.'] },
  '06': { tenders_count: 54,  budget: 9.8,  warnings: 0, warningDetails: [] },
  '05': { tenders_count: 43,  budget: 8.4,  warnings: 0, warningDetails: [] },
  '30': { tenders_count: 32,  budget: 6.2,  warnings: 1, warningDetails: ['عرض وحيد في استشارة صيانة شبكات التطهير دون إعادة الدعوة للمنافسة.'] },
  '15': { tenders_count: 28,  budget: 4.9,  warnings: 1, warningDetails: ['طعن إجرائي معلق أمام اللجنة الولائية للصفقات العمومية.'] },
  '27': { tenders_count: 24,  budget: 4.1,  warnings: 0, warningDetails: [] },
  '02': { tenders_count: 21,  budget: 3.8,  warnings: 1, warningDetails: ['تعديل غير مبرر لشروط الأهلية بعد نشر المناقصة بالصحافة.'] },
  '28': { tenders_count: 18,  budget: 3.2,  warnings: 1, warningDetails: ['شبهة تقارب سعري متكرر بين العروض المتنافسة في جلسة الفتح.'] },
  '17': { tenders_count: 16,  budget: 2.9,  warnings: 0, warningDetails: [] },
  '07': { tenders_count: 15,  budget: 2.6,  warnings: 1, warningDetails: ['إلغاء إجراء مناقصة دون تقديم تعليل تقني وإداري كافٍ.'] },
  '29': { tenders_count: 14,  budget: 2.4,  warnings: 0, warningDetails: [] },
  '03': { tenders_count: 13,  budget: 2.2,  warnings: 1, warningDetails: ['عدم احترام آجال تحضير العروض الدنيا المحددة قانوناً.'] },
  '01': { tenders_count: 12,  budget: 2.1,  warnings: 0, warningDetails: [] },
};

// توليد قاعدة البيانات الجغرافية الشاملة للـ 69 ولاية جزائرية
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
  const [filterMode, setFilterMode] = useState<'all' | 'warnings' | 'high' | 'medium'>('all');
  const [zoom, setZoom] = useState(1);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  // قاعدة بيانات الولايات الـ 69
  const nationalData = useMemo(() => buildNational69Dataset(), []);

  // تجهيز البيانات لمكون الخريطة مع تطبيق الفلتر
  const mapData = useMemo<Record<string, WilayaDataPoint>>(() => {
    const records: Record<string, WilayaDataPoint> = {};

    Object.values(nationalData).forEach((item) => {
      // تطبيق معايير التصفية اللونية
      let matchFilter = true;
      if (filterMode === 'warnings') matchFilter = item.warnings > 0;
      else if (filterMode === 'high') matchFilter = item.tenders_count >= 50;
      else if (filterMode === 'medium') matchFilter = item.tenders_count >= 20 && item.tenders_count < 50;

      const effectiveValue = matchFilter ? item.tenders_count : 1;
      const effectiveWarnings = matchFilter ? item.warnings : 0;

      records[item.code] = {
        value: effectiveValue,
        budget: item.budget,
        warnings: effectiveWarnings,
        name: item.name,
        code: item.code,
      };
      records[item.nameFr || ''] = records[item.code];
      records[item.name] = records[item.code];
    });

    return records;
  }, [nationalData, filterMode]);

  // إحصائيات عامة
  const totalTenders = 1248;
  const totalBudget = 185;
  const totalWarnings = 12;

  // أعلى الولايات نشاطاً
  const topWilayas = useMemo(() => {
    return Object.values(nationalData)
      .sort((a, b) => b.tenders_count - a.tenders_count)
      .slice(0, 5);
  }, [nationalData]);

  // الولايات التي بها تنبيهات رقابية
  const flaggedWilayas = useMemo(() => {
    return Object.values(nationalData)
      .filter((w) => w.warnings > 0)
      .sort((a, b) => b.warnings - a.warnings);
  }, [nationalData]);

  // نتائج البحث
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
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#F8F9F7] text-[#24352E]" dir="rtl">
      
      {/* ─── 1. شريط التحكم والأدوات العلوي الخاص بالمرصد الجغرافي ─── */}
      <header className="flex-none bg-white border-b border-[#E3E7E2] px-4 sm:px-6 py-2.5 z-20 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* عنوان الخريطة ونطاق التغطية */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-[#EDF4EE] border border-[#CDE1D3] flex items-center justify-center text-[#167354] shrink-0 shadow-2xs">
              <MapPin className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-[#24352E] leading-tight m-0">
                  المرصد الجغرافي والرقابي
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDF4EE] text-[#167354] border border-[#CDE1D3]">
                  تغطية 69 ولاية
                </span>
              </div>
              <p className="text-[11px] text-[#59665F] font-medium leading-none mt-0.5 hidden sm:block">
                رصد تدفقات الصفقات العمومية والإنذار المبكر وفق القانون 23-12
              </p>
            </div>
          </div>

          {/* محرك البحث والفلاتر السريعة */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* مربع البحث عن ولاية */}
            <div className="w-48 sm:w-60">
              <SearchBox
                compact
                value={searchQuery}
                onChange={setSearchQuery}
                results={searchResults}
                onSelect={(w) => setSelectedWilaya(w)}
                placeholder="ابحث باسم أو رقم الولاية..."
              />
            </div>

            {/* أزرار الفلترة السريعة */}
            <div className="hidden md:flex items-center gap-1 bg-[#F8F9F7] p-1 rounded-xl border border-[#E3E7E2]">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-[#24352E] shadow-2xs border border-[#E3E7E2]'
                    : 'text-[#59665F] hover:text-[#24352E]'
                }`}
              >
                الكل (69)
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('warnings')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  filterMode === 'warnings'
                    ? 'bg-[#FFF1F2] text-[#E11D48] shadow-2xs border border-[#FECDD3]'
                    : 'text-[#59665F] hover:text-[#E11D48]'
                }`}
              >
                <AlertTriangle className="size-3" />
                <span>شبهات ({totalWarnings})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('high')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'high'
                    ? 'bg-[#EDF4EE] text-[#167354] shadow-2xs border border-[#CDE1D3]'
                    : 'text-[#59665F] hover:text-[#167354]'
                }`}
              >
                نشاط عالٍ (50+)
              </button>
            </div>

            {/* زر إظهار/إخفاء لوحة التحليل الجانبية */}
            <button
              type="button"
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E3E7E2] hover:bg-[#F8F9F7] text-xs font-bold text-[#24352E] transition-colors shadow-2xs"
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

      {/* ─── 2. الجسم الرئيسي: الخريطة التفاعلية + لوحة التحليل الجانبية ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* مساحة الخريطة التفاعلية */}
        <main className="flex-1 relative bg-gradient-to-br from-[#FAFBFA] via-[#F4F6F5] to-[#E9ECE9] overflow-hidden flex items-center justify-center min-h-[350px]">
          
          {/* مؤشر الولاية الممرر عليها الفأرة (Hover Pill) */}
          {hoveredWilayaName && (
            <div className="absolute top-4 start-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#E3E7E2] shadow-md flex items-center gap-2 text-xs animate-in fade-in duration-150">
              <span className="size-2 rounded-full bg-[#167354] animate-pulse" />
              <span className="font-medium text-[#59665F]">الولاية المحددة:</span>
              <strong className="text-[#24352E] font-black">{hoveredWilayaName}</strong>
            </div>
          )}

          {/* الخريطة الجغرافية */}
          <div
            className="w-full h-full flex items-center justify-center p-4 sm:p-8 md:p-12 transition-transform duration-300 ease-out select-none"
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

          {/* بطاقة تفاصيل الولاية المحددة (تنفتح عند النقر على أي ولاية) */}
          {selectedWilaya && (
            <div className="absolute bottom-4 start-4 z-30 w-[410px] max-w-[calc(100vw-2rem)]">
              <WilayaDetailCard
                wilaya={selectedWilaya}
                onClose={() => setSelectedWilaya(null)}
                onViewTenders={(code) => setLocation(`/central/deals?wilaya=${code}`)}
                onNotifyAuthority={(code) => {
                  alert(`تم إرسال إخطار رقابي نظامي إلى المصلحة المتعاقدة لولاية ${selectedWilaya.name} (رمز ${code}) وتوثيقه في سجل التدقيق.`);
                }}
              />
            </div>
          )}

          {/* أزرار التحكم في الزوم (Zoom Controls) */}
          <div className="absolute bottom-4 end-4 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-[#E3E7E2] shadow-md">
            <button
              type="button"
              onClick={handleZoomIn}
              title="تكبير الخريطة"
              aria-label="تكبير"
              className="size-8 rounded-xl hover:bg-[#EDF4EE] text-[#24352E] hover:text-[#167354] flex items-center justify-center transition-colors"
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="تصغير الخريطة"
              aria-label="تصغير"
              className="size-8 rounded-xl hover:bg-[#EDF4EE] text-[#24352E] hover:text-[#167354] flex items-center justify-center transition-colors"
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              title="إعادة ضبط الحجم الأصلي"
              aria-label="إعادة ضبط"
              className="size-8 rounded-xl hover:bg-[#EDF4EE] text-[#24352E] hover:text-[#167354] flex items-center justify-center transition-colors border-t border-[#E3E7E2]/60 pt-1"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>

          {/* شريط حالة التحديث السفلي */}
          <div className="absolute bottom-4 start-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-[#E3E7E2] text-[11px] text-[#59665F] font-medium shadow-2xs">
            <span className="size-2 rounded-full bg-[#167354] animate-ping" />
            <span>رصد رقابي لحظي متصل بالسجل الوطني للصفقات</span>
          </div>
        </main>

        {/* ─── 3. لوحة التحليل والمراقبة الجانبية (380px) ─── */}
        {isSidePanelOpen && (
          <aside className="w-full lg:w-[380px] xl:w-[410px] h-auto lg:h-full bg-white border-t lg:border-t-0 lg:border-s border-[#E3E7E2] overflow-y-auto flex-none flex flex-col shadow-xs z-10">
            
            {/* 1. المؤشرات الرقابية الوطنية */}
            <div className="p-4 sm:p-5 border-b border-[#E3E7E2]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#59665F] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-[#167354]" />
                  <span>المؤشرات الوطنية التراكمية</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-[#167354] bg-[#EDF4EE] px-2 py-0.5 rounded-md">
                  نشط الآن
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#F8F9F7] border border-[#E3E7E2] shadow-2xs">
                  <div className="flex items-center justify-between text-[#59665F] mb-1">
                    <span className="text-[11px] font-bold">إجمالي الصفقات</span>
                    <FileText className="size-3.5 text-[#167354]" />
                  </div>
                  <div className="font-mono text-xl font-black text-[#24352E]">1,248</div>
                  <span className="text-[10px] font-bold text-[#167354]">↑ 12% نمو سنوي</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F9F7] border border-[#E3E7E2] shadow-2xs">
                  <div className="flex items-center justify-between text-[#59665F] mb-1">
                    <span className="text-[11px] font-bold">الحجم المالي</span>
                    <Coins className="size-3.5 text-[#2563EB]" />
                  </div>
                  <div className="font-mono text-xl font-black text-[#24352E]">185 <span className="text-xs font-bold text-[#59665F]">مليار دج</span></div>
                  <span className="text-[10px] font-bold text-[#2563EB]">اعتمادات مرصودة</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F9F7] border border-[#E3E7E2] shadow-2xs">
                  <div className="flex items-center justify-between text-[#59665F] mb-1">
                    <span className="text-[11px] font-bold">الولايات النشطة</span>
                    <MapPin className="size-3.5 text-[#167354]" />
                  </div>
                  <div className="font-mono text-xl font-black text-[#24352E]">69 <span className="text-xs font-bold text-[#59665F]">ولاية</span></div>
                  <span className="text-[10px] font-bold text-[#59665F]">تغطية وطنية شاملة</span>
                </div>

                <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] shadow-2xs">
                  <div className="flex items-center justify-between text-[#E11D48] mb-1">
                    <span className="text-[11px] font-bold">شبهات مرصودة</span>
                    <AlertTriangle className="size-3.5 text-[#E11D48]" />
                  </div>
                  <div className="font-mono text-xl font-black text-[#E11D48]">12 <span className="text-xs font-bold text-[#BE123C]">حالة</span></div>
                  <span className="text-[10px] font-bold text-[#E11D48]">تستدعي تدقيقاً</span>
                </div>
              </div>
            </div>

            {/* 2. التحليل الاستباقي للذكاء الاصطناعي (AI Vigilance) */}
            <div className="p-4 sm:p-5 border-b border-[#E3E7E2] bg-[#FDFEFC]">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#167354]" />
                  <span className="text-xs font-extrabold text-[#24352E]">
                    رادار الذكاء الاصطناعي الاستباقي
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EDF4EE] text-[#167354]">
                  AI Monitor
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-[#E3E7E2] hover:border-[#167354] transition-colors cursor-pointer" onClick={() => handleWilayaClick('13')}>
                  <div className="flex items-center justify-between font-bold text-[#24352E] mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#E11D48]" />
                      <span>تلمسان (13)</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#E11D48] bg-rose-50 px-1.5 py-0.2 rounded">3 تنبيهات</span>
                  </div>
                  <p className="text-[11px] text-[#59665F] leading-relaxed m-0 font-medium">
                    شبهة تجزئة نفقات الصيانة الدورية وتكرار المنح لنفس المتعامل دون تنافس تقني كافٍ.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#E3E7E2] hover:border-[#167354] transition-colors cursor-pointer" onClick={() => handleWilayaClick('25')}>
                  <div className="flex items-center justify-between font-bold text-[#24352E] mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#E11D48]" />
                      <span>قسنطينة (25)</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#E11D48] bg-rose-50 px-1.5 py-0.2 rounded">تنبيهان</span>
                  </div>
                  <p className="text-[11px] text-[#59665F] leading-relaxed m-0 font-medium">
                    تركيز 70% من مشاريع التهيئة لدى شريكين تجاريين وتأخير في نشر ملخصات فتح الأظرفة.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. ترتيب الولايات حسب حجم النشاط */}
            <div className="p-4 sm:p-5 border-b border-[#E3E7E2]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#59665F]">
                  أعلى الولايات نشاطاً في الصفقات
                </span>
                <span className="text-[11px] font-bold text-[#167354]">
                  ترتيب وطني
                </span>
              </div>

              <div className="space-y-1.5">
                {topWilayas.map((w, idx) => {
                  const isSelected = selectedWilaya?.code === w.code;
                  return (
                    <button
                      key={w.code}
                      type="button"
                      onClick={() => handleWilayaClick(w.code, w)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-all border ${
                        isSelected
                          ? 'bg-[#EDF4EE] border-[#167354] shadow-xs'
                          : 'bg-white border-[#E3E7E2] hover:bg-[#F8F9F7]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="size-6 rounded-lg bg-[#F8F9F7] border border-[#E3E7E2] flex items-center justify-center font-mono text-xs font-black text-[#59665F] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="text-xs font-bold text-[#24352E] block truncate">
                            {w.name}
                          </span>
                          <span className="text-[10px] font-mono text-[#59665F]">
                            {w.budget} مليار دج
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-black text-[#167354] bg-white border border-[#CDE1D3] px-2 py-0.5 rounded-md">
                          {w.tenders_count} صفقة
                        </span>
                        <ChevronRight className="size-3.5 text-[#59665F] rtl:rotate-180" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. مفتاح التدرج الحراري (Heatmap Legend) */}
            <div className="p-4 sm:p-5 mt-auto bg-[#F8F9F7] text-xs">
              <span className="text-[11px] font-bold text-[#59665F] block mb-2">
                دليل التدرج الحراري للخريطة:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#1B4332] shrink-0" />
                  <span className="font-medium text-[#24352E]">نشاط عالٍ (50+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#2D6A4F] shrink-0" />
                  <span className="font-medium text-[#24352E]">نشاط متوسط (20-49)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#74C69D] shrink-0" />
                  <span className="font-medium text-[#24352E]">نشاط منخفض (5-19)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded bg-[#B02A2A] shrink-0 animate-pulse" />
                  <span className="font-bold text-[#E11D48]">شبهات مرصودة (⚠️)</span>
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
