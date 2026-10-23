import { useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import {
  AIInsightsPanel,
  SuspicionAlerts,
  SmartKpiBadge,
  AIHealthBadge,
  useAlerts,
} from '@/features/ai';
import {
  Building,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  RotateCcw,
  Search,
  ChevronLeft,
  ShieldCheck,
  MapPin,
  PieChart,
  BarChart3,
  FileText,
  Activity,
  Briefcase,
  AlertCircle,
  Eye,
  ArrowUpRight,
  Scale
} from 'lucide-react';

// --- Governance Datatypes & Reference Data ---
export interface DealRecord {
  id: string;
  reference: string;
  title: string;
  authorityName: string;
  wilayaCode: string;
  wilayaName: string;
  sector: 'construction_public_works' | 'hydraulics' | 'it_telecom' | 'supplies' | 'services' | 'studies_consulting';
  procedureType: 'open_tender' | 'restricted_tender' | 'direct_negotiation';
  estimatedBudget: number; // in DZD
  status: 'published' | 'opening_in_progress' | 'technical_evaluation' | 'provisional_award' | 'infructuous' | 'canceled';
  submissionDeadline: string;
  daysRemainingOrOverdue: number; // negative if overdue
  completionRate: number; // 0 - 100
  riskScore: 'low' | 'medium' | 'high';
  riskReason?: string;
  year: number;
  month: string; // e.g. '2026-01'
  auditTrail: {
    event: string;
    timestamp: string;
    actor: string;
    verified: boolean;
  }[];
}

// Representative National Governance Records
const MOCK_GOVERNANCE_DEALS: DealRecord[] = [
  {
    id: 'deal-001',
    reference: 'DZ-2026-TP-014',
    title: 'إنجاز شطر الطريق الالتفافي الشمالي المزدوج والممرات السفلية',
    authorityName: 'مديرية الأشغال العمومية لولاية الجزائر',
    wilayaCode: '16',
    wilayaName: 'الجزائر',
    sector: 'construction_public_works',
    procedureType: 'open_tender',
    estimatedBudget: 450000000,
    status: 'technical_evaluation',
    submissionDeadline: '2026-03-15',
    daysRemainingOrOverdue: -12, // overdue in evaluation
    completionRate: 65,
    riskScore: 'high',
    riskReason: 'تجاوز الأجل القانوني لتقييم العروض (م. 72)',
    year: 2026,
    month: '2026-03',
    auditTrail: [
      { event: 'نشر إعلان المناقصة في النشرة الرسمية', timestamp: '2026-01-15 09:30', actor: 'لجنة الصفقات', verified: true },
      { event: 'جلسة فتح الأظرفة العلنية والتوقيع على المحضر', timestamp: '2026-02-18 11:00', actor: 'رئيس لجنة الفتح', verified: true },
      { event: 'تنبيه آلي: تجاوز 30 يوماً في التقييم الفني', timestamp: '2026-03-20 14:15', actor: 'نظام المراقبة المركزي', verified: true }
    ]
  },
  {
    id: 'deal-002',
    reference: 'DZ-2026-HY-009',
    title: 'تأهيل شبكة التطهير ومحطة الضخ الرئيسية بالمنطقة الحضرية',
    authorityName: 'مديرية الموارد المائية لولاية وهران',
    wilayaCode: '31',
    wilayaName: 'وهران',
    sector: 'hydraulics',
    procedureType: 'open_tender',
    estimatedBudget: 280000000,
    status: 'provisional_award',
    submissionDeadline: '2026-02-28',
    daysRemainingOrOverdue: 8,
    completionRate: 90,
    riskScore: 'low',
    riskReason: 'سريان مهلة الطعن القانونية (10 أيام)',
    year: 2026,
    month: '2026-02',
    auditTrail: [
      { event: 'إيداع دفتر الشروط واعتماده', timestamp: '2026-01-05 10:00', actor: 'المصلحة المتعاقدة', verified: true },
      { event: 'فتح الأظرفة واعتماد 4 عروض مقبولة', timestamp: '2026-02-02 10:30', actor: 'لجنة الفتح', verified: true },
      { event: 'نشر إعلان المنح المؤقت للصفقة', timestamp: '2026-03-25 16:00', actor: 'المصلحة المتعاقدة', verified: true }
    ]
  },
  {
    id: 'deal-003',
    reference: 'DZ-2026-IT-003',
    title: 'تجهيز مراكز البيانات وتحديث البنية التحتية الرقمية الموحدة',
    authorityName: 'وزارة الرقمنة والإحصائيات',
    wilayaCode: '16',
    wilayaName: 'الجزائر',
    sector: 'it_telecom',
    procedureType: 'restricted_tender',
    estimatedBudget: 320000000,
    status: 'published',
    submissionDeadline: '2026-04-30',
    daysRemainingOrOverdue: 25,
    completionRate: 35,
    riskScore: 'medium',
    riskReason: 'معايير اعتماد دولية دقيقة تتطلب مرافقة تقنية',
    year: 2026,
    month: '2026-04',
    auditTrail: [
      { event: 'إعداد المسودة واعتماد التشفير الرقمي', timestamp: '2026-03-01 08:45', actor: 'مديرية الأنظمة', verified: true },
      { event: 'نشر دفتر الشروط للتحميل الإلكتروني', timestamp: '2026-03-10 12:00', actor: 'مسؤول النشر', verified: true }
    ]
  },
  {
    id: 'deal-004',
    reference: 'DZ-2026-ST-021',
    title: 'دراسة ومتابعة إنجاز القطب الاستشفائي الجامعي 500 سرير',
    authorityName: 'مديرية التجهيزات العمومية لولاية قسنطينة',
    wilayaCode: '25',
    wilayaName: 'قسنطينة',
    sector: 'studies_consulting',
    procedureType: 'open_tender',
    estimatedBudget: 150000000,
    status: 'opening_in_progress',
    submissionDeadline: '2026-04-05',
    daysRemainingOrOverdue: 1,
    completionRate: 45,
    riskScore: 'low',
    riskReason: 'إجراءات فتح الأظرفة مستوفاة للشروط',
    year: 2026,
    month: '2026-04',
    auditTrail: [
      { event: 'نشر طلب العروض الوطني', timestamp: '2026-02-20 09:00', actor: 'لجنة الصفقات', verified: true },
      { event: 'غلق سجل إيداع العروض (12 ظرفاً مودعاً)', timestamp: '2026-04-04 12:00', actor: 'مكتب الضبط', verified: true }
    ]
  },
  {
    id: 'deal-005',
    reference: 'DZ-2025-SP-088',
    title: 'اقتناء معدات تقنية وتجهيزات الصيانة لشبكات الري الكبرى',
    authorityName: 'الديوان الوطني للسقي وصرف المياه - ورقلة',
    wilayaCode: '30',
    wilayaName: 'ورقلة',
    sector: 'supplies',
    procedureType: 'open_tender',
    estimatedBudget: 190000000,
    status: 'infructuous',
    submissionDeadline: '2025-11-20',
    daysRemainingOrOverdue: 0,
    completionRate: 50,
    riskScore: 'high',
    riskReason: 'إعلان عدم الجدوى بسبب عدم مطابقة العروض الفنية',
    year: 2025,
    month: '2025-11',
    auditTrail: [
      { event: 'نشر المناقصة للمرة الثانية', timestamp: '2025-10-01 10:00', actor: 'إدارة الديوان', verified: true },
      { event: 'محضر إثبات عدم الجدوى لغياب العروض المطابقة', timestamp: '2025-11-25 15:30', actor: 'لجنة تقييم العروض', verified: true }
    ]
  },
  {
    id: 'deal-006',
    reference: 'DZ-2025-SV-044',
    title: 'خدمات الحراسة وصيانة المنشآت الإدارية والخدمية',
    authorityName: 'مديرية الإدارة المحلية لولاية سطيف',
    wilayaCode: '19',
    wilayaName: 'سطيف',
    sector: 'services',
    procedureType: 'open_tender',
    estimatedBudget: 85000000,
    status: 'provisional_award',
    submissionDeadline: '2025-12-15',
    daysRemainingOrOverdue: 0,
    completionRate: 98,
    riskScore: 'low',
    riskReason: 'صفقة مبرمة ومصادق عليها دون طعون',
    year: 2025,
    month: '2025-12',
    auditTrail: [
      { event: 'نشر المنح المؤقت', timestamp: '2025-12-20 11:00', actor: 'لجنة الصفقات', verified: true },
      { event: 'انقضاء مهلة الطعون والمصادقة النهائية', timestamp: '2026-01-05 09:15', actor: 'المصلحة المتعاقدة', verified: true }
    ]
  },
  {
    id: 'deal-007',
    reference: 'DZ-2026-TP-032',
    title: 'صيانة وتعبيد المحاور الجبلية المتضررة من التقلبات الجوية',
    authorityName: 'مديرية الأشغال العمومية لولاية تيزي وزو',
    wilayaCode: '15',
    wilayaName: 'تيزي وزو',
    sector: 'construction_public_works',
    procedureType: 'open_tender',
    estimatedBudget: 210000000,
    status: 'technical_evaluation',
    submissionDeadline: '2026-03-28',
    daysRemainingOrOverdue: -3,
    completionRate: 60,
    riskScore: 'medium',
    riskReason: 'تأخر استلام تقارير الخبرة الجيوتقنية',
    year: 2026,
    month: '2026-03',
    auditTrail: [
      { event: 'نشر الاستشارة الموسعة', timestamp: '2026-02-15 08:30', actor: 'المصلحة المتعاقدة', verified: true },
      { event: 'فتح الأظرفة وإحالة العروض على التقييم', timestamp: '2026-03-29 11:30', actor: 'لجنة الفتح', verified: true }
    ]
  },
  {
    id: 'deal-008',
    reference: 'DZ-2026-HY-018',
    title: 'إنجاز منشآت حماية التجمعات السكنية من الفيضانات',
    authorityName: 'مديرية الموارد المائية لولاية بشار',
    wilayaCode: '08',
    wilayaName: 'بشار',
    sector: 'hydraulics',
    procedureType: 'open_tender',
    estimatedBudget: 175000000,
    status: 'published',
    submissionDeadline: '2026-05-10',
    daysRemainingOrOverdue: 34,
    completionRate: 20,
    riskScore: 'medium',
    riskReason: 'ضعف تاريخي في عدد العروض بالمنطقة الصحراوية',
    year: 2026,
    month: '2026-05',
    auditTrail: [
      { event: 'اعتماد الميزانية القطاعية', timestamp: '2026-03-10 14:00', actor: 'الولاية', verified: true },
      { event: 'إطلاق الإعلان في البوابة الوطنية', timestamp: '2026-03-25 10:00', actor: 'المصلحة المتعاقدة', verified: true }
    ]
  }
];

// Reference Wilayas for National Map & Regional Filtering
const WILAYAS_LIST = [
  { code: '16', name: 'الجزائر', region: 'الوسط' },
  { code: '31', name: 'وهران', region: 'الغرب' },
  { code: '25', name: 'قسنطينة', region: 'الشرق' },
  { code: '30', name: 'ورقلة', region: 'الجنوب' },
  { code: '19', name: 'سطيف', region: 'الهضاب' },
  { code: '15', name: 'تيزي وزو', region: 'الوسط' },
  { code: '08', name: 'بشار', region: 'الجنوب' },
  { code: '23', name: 'عنابة', region: 'الشرق' },
  { code: '13', name: 'تلمسان', region: 'الغرب' }
];

export function CentralOverview() {
  const { t } = useI18n();
  const { data: alertsData } = useAlerts();
  const alerts = alertsData?.alerts;

  // --- Filter State Engine (Cross-filtering & Drill-down) ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<'all' | '2026' | '2025'>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('all');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Time Series Trend Metric
  const [trendMetric, setTrendMetric] = useState<'volume' | 'count' | 'delay'>('volume');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  
  // --- Filtered Data Calculation ---
  const filteredDeals = useMemo(() => {
    return MOCK_GOVERNANCE_DEALS.filter((deal) => {
      if (selectedYear !== 'all' && deal.year.toString() !== selectedYear) return false;
      if (selectedSector !== 'all' && deal.sector !== selectedSector) return false;
      if (selectedWilaya !== 'all' && deal.wilayaCode !== selectedWilaya) return false;
      if (selectedStage !== 'all' && deal.status !== selectedStage) return false;
      if (selectedRisk !== 'all' && deal.riskScore !== selectedRisk) return false;
      if (selectedAuthority !== 'all' && deal.authorityName !== selectedAuthority) return false;
      if (selectedMonth && deal.month !== selectedMonth) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = deal.reference.toLowerCase().includes(query);
        const matchesTitle = deal.title.toLowerCase().includes(query);
        const matchesAuth = deal.authorityName.toLowerCase().includes(query);
        const matchesWilaya = deal.wilayaName.toLowerCase().includes(query);
        if (!matchesRef && !matchesTitle && !matchesAuth && !matchesWilaya) return false;
      }
      return true;
    });
  }, [
    selectedYear,
    selectedSector,
    selectedWilaya,
    selectedStage,
    selectedRisk,
    selectedAuthority,
    selectedMonth,
    searchQuery
  ]);

  const activeDeal = useMemo(() => {
    if (!selectedDealId) return null;
    return MOCK_GOVERNANCE_DEALS.find((d) => d.id === selectedDealId) || null;
  }, [selectedDealId]);

  // Reset all filters back to national consolidated view
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedYear('all');
    setSelectedSector('all');
    setSelectedWilaya('all');
    setSelectedStage('all');
    setSelectedRisk('all');
    setSelectedAuthority('all');
    setSelectedDealId(null);
    setSelectedMonth(null);
  };

  // --- Aggregate Metrics & KPIs ---
  const totalDeals = filteredDeals.length;
  const totalBudgetDzd = filteredDeals.reduce((sum, d) => sum + d.estimatedBudget, 0);
  const activeDealsCount = filteredDeals.filter(
    (d) => d.status === 'published' || d.status === 'opening_in_progress' || d.status === 'technical_evaluation'
  ).length;
  const delayedDealsCount = filteredDeals.filter((d) => d.daysRemainingOrOverdue < 0).length;
  const highRiskCount = filteredDeals.filter((d) => d.riskScore === 'high').length;
  const averageCompletion =
    totalDeals > 0 ? Math.round(filteredDeals.reduce((sum, d) => sum + d.completionRate, 0) / totalDeals) : 0;

  // --- Format Currency (DZD) ---
  const formatDzd = (amount: number) => {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(2) + ' مليار د.ج';
    }
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + ' مليون د.ج';
    }
    return amount.toLocaleString('ar-DZ') + ' د.ج';
  };

  // --- Entity Ranking Aggregation ---
  const entityRanking = useMemo(() => {
    const map = new Map<
      string,
      { name: string; dealsCount: number; budget: number; delayedCount: number; highRiskCount: number }
    >();
    filteredDeals.forEach((deal) => {
      const existing = map.get(deal.authorityName) || {
        name: deal.authorityName,
        dealsCount: 0,
        budget: 0,
        delayedCount: 0,
        highRiskCount: 0
      };
      existing.dealsCount += 1;
      existing.budget += deal.estimatedBudget;
      if (deal.daysRemainingOrOverdue < 0) existing.delayedCount += 1;
      if (deal.riskScore === 'high') existing.highRiskCount += 1;
      map.set(deal.authorityName, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.budget - a.budget);
  }, [filteredDeals]);

  // --- Sectoral Distribution Aggregation ---
  const sectorDistribution = useMemo(() => {
    const map = new Map<string, { count: number; budget: number }>();
    filteredDeals.forEach((d) => {
      const cur = map.get(d.sector) || { count: 0, budget: 0 };
      cur.count += 1;
      cur.budget += d.estimatedBudget;
      map.set(d.sector, cur);
    });
    return Array.from(map.entries()).map(([sectorKey, val]) => ({
      sectorKey,
      count: val.count,
      budget: val.budget,
      percentage: totalDeals > 0 ? Math.round((val.count / totalDeals) * 100) : 0
    }));
  }, [filteredDeals, totalDeals]);

  // --- Monthly Temporal Trend Data ---
  const monthlyTrends = useMemo(() => {
    const months = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];
    return months.map((m) => {
      const monthDeals = MOCK_GOVERNANCE_DEALS.filter((d) => {
        if (selectedWilaya !== 'all' && d.wilayaCode !== selectedWilaya) return false;
        if (selectedSector !== 'all' && d.sector !== selectedSector) return false;
        return d.month === m;
      });
      return {
        month: m,
        count: monthDeals.length,
        volume: monthDeals.reduce((sum, d) => sum + d.estimatedBudget, 0),
        delayed: monthDeals.filter((d) => d.daysRemainingOrOverdue < 0).length
      };
    });
  }, [selectedWilaya, selectedSector]);

  // Helper labels
  const getSectorLabel = (sector: string) => {
    switch (sector) {
      case 'construction_public_works':
        return 'أشغال عمومية وبناء';
      case 'hydraulics':
        return 'ري وموارد مائية';
      case 'it_telecom':
        return 'رقمنة وتكنولوجيا';
      case 'supplies':
        return 'تجهيزات ومواد';
      case 'services':
        return 'خدمات وصيانة';
      case 'studies_consulting':
        return 'دراسات واستشارات';
      default:
        return sector;
    }
  };

  const getStatusBadge = (status: DealRecord['status']) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">إعلان سارٍ</span>;
      case 'opening_in_progress':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">فتح الأظرفة</span>;
      case 'technical_evaluation':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">تقييم العروض</span>;
      case 'provisional_award':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">منح مؤقت</span>;
      case 'infructuous':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">غير مجدية</span>;
      case 'canceled':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">ملغاة</span>;
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ==============================================================
          1. HEADER & STRICT RBAC NOTICE (Read-only Oversight)
          ============================================================== */}
      <section className="bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-navy-900 text-white inline-flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                {t('central.audit.rbac_badge')}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                مؤشرات حية متصلة
              </span>
              <AIHealthBadge />
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-900">
              {t('central.workspace.title')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-4xl leading-relaxed">
              {t('central.workspace.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-border bg-background hover:bg-muted/60 text-navy-900 transition-colors shadow-xs"
              title={t('central.filter.reset')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('central.filter.reset')}</span>
            </button>
          </div>
        </div>

        {/* ==============================================================
            TOP BAR: SEARCH, GLOBAL FILTERS & DRILL-DOWN TRACKER
            ============================================================== */}
        <div className="pt-4 border-t border-border space-y-3">
          {/* Search and Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('central.filter.search_placeholder')}
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-navy-600 transition-all placeholder:text-muted-foreground/70"
              />
            </div>

            {/* Year Filter */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as any)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-border bg-background text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-600 transition-all font-medium"
              >
                <option value="all">{t('central.filter.year_all')}</option>
                <option value="2026">السنة المالية 2026</option>
                <option value="2025">السنة المالية 2025</option>
              </select>
            </div>

            {/* Sector Filter */}
            <div>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-border bg-background text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-600 transition-all font-medium"
              >
                <option value="all">{t('central.filter.sector_all')}</option>
                <option value="construction_public_works">أشغال عمومية وبناء</option>
                <option value="hydraulics">ري وموارد مائية</option>
                <option value="it_telecom">رقمنة وتكنولوجيا</option>
                <option value="supplies">تجهيزات ومواد</option>
                <option value="services">خدمات وصيانة</option>
                <option value="studies_consulting">دراسات واستشارات</option>
              </select>
            </div>

            {/* Wilaya Filter */}
            <div>
              <select
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-border bg-background text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-600 transition-all font-medium"
              >
                <option value="all">{t('central.filter.wilaya_all')}</option>
                {WILAYAS_LIST.map((w) => (
                  <option key={w.code} value={w.code}>
                    ولاية {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Filter */}
            <div>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-border bg-background text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-600 transition-all font-medium"
              >
                <option value="all">{t('central.filter.risk_all')}</option>
                <option value="low">مخاطر منخفضة (امتثال عادي)</option>
                <option value="medium">مخاطر متوسطة (ملاحظات تدقيق)</option>
                <option value="high">مخاطر حرجة (تأخر أو طعون)</option>
              </select>
            </div>
          </div>

          {/* Drill-down Interactive Breadcrumb */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs bg-muted/30 p-2.5 rounded-xl border border-border/80">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold pe-1">
              <Filter className="w-3.5 h-3.5 text-navy-800" />
              مسار التدرج الرقابي:
            </span>

            <button
              onClick={() => {
                setSelectedWilaya('all');
                setSelectedAuthority('all');
                setSelectedDealId(null);
              }}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                selectedWilaya === 'all'
                  ? 'bg-navy-900 text-white'
                  : 'text-navy-900 hover:bg-muted text-underline'
              }`}
            >
              {t('central.filter.breadcrumb_national')}
            </button>

            {selectedWilaya !== 'all' && (
              <>
                <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                <button
                  onClick={() => {
                    setSelectedAuthority('all');
                    setSelectedDealId(null);
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    selectedAuthority === 'all'
                      ? 'bg-navy-900 text-white'
                      : 'text-navy-900 hover:bg-muted'
                  }`}
                >
                  ولاية {WILAYAS_LIST.find((w) => w.code === selectedWilaya)?.name || selectedWilaya}
                </button>
              </>
            )}

            {selectedAuthority !== 'all' && (
              <>
                <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                <button
                  onClick={() => setSelectedDealId(null)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    !selectedDealId
                      ? 'bg-navy-900 text-white'
                      : 'text-navy-900 hover:bg-muted'
                  }`}
                >
                  {selectedAuthority}
                </button>
              </>
            )}

            {activeDeal && (
              <>
                <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-white font-bold">
                  {activeDeal.reference}
                </span>
              </>
            )}

            <span className="ms-auto text-muted-foreground text-[11px] font-semibold">
              {filteredDeals.length} {t('central.filter.selected_count')}
            </span>
          </div>
        </div>
      </section>

      {/* ==============================================================
          2. KPI STRIP: 6 LIVE NATIONAL METRICS + AI BADGES
          ============================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" aria-label="National KPI Strip">
        {/* KPI 1: Total Deals */}
        <div className="group bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-xs space-y-2 hover:border-[var(--stamp-green-700)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-[var(--ink-500)]">{t('central.kpi.total_deals')}</span>
            <span className="size-8 rounded-lg bg-[var(--paper-100)] border border-[var(--color-border-subtle)] flex items-center justify-center text-navy-800">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[var(--ink-900)] tracking-tight">{totalDeals}</div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]/70">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>رقابة نظامية</span>
            </div>
            <SmartKpiBadge alert="low" message="رصد نظامي" />
          </div>
        </div>

        {/* KPI 2: Total Financial Volume */}
        <div className="group bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-xs space-y-2 hover:border-[var(--stamp-green-700)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-[var(--ink-500)]">{t('central.kpi.total_budget')}</span>
            <span className="size-8 rounded-lg bg-[var(--stamp-green-50)] border border-[var(--stamp-green-200)] flex items-center justify-center text-[var(--stamp-green-800)]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-900 truncate" title={formatDzd(totalBudgetDzd)}>
            {formatDzd(totalBudgetDzd)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]/70">
            <div className="text-[11px] text-muted-foreground font-medium">
              المخصصات
            </div>
            <SmartKpiBadge alert="medium" message="مراقبة مالية" />
          </div>
        </div>

        {/* KPI 3: Active Ongoing Deals */}
        <div className="group bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-xs space-y-2 hover:border-[var(--stamp-green-700)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-[var(--ink-500)]">{t('central.kpi.active_deals')}</span>
            <span className="size-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-blue-900 tracking-tight">{activeDealsCount}</div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]/70">
            <div className="text-[11px] text-muted-foreground font-medium">
              قيد الإجراء
            </div>
            <SmartKpiBadge
              alert={alerts?.critical_tenders?.alert}
              value={alerts?.critical_tenders?.value}
              message={alerts?.critical_tenders?.message ? "1 مشددة" : "على الأجل"}
            />
          </div>
        </div>

        {/* KPI 4: Overdue/Delayed Deals */}
        <div className="group bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-xs space-y-2 hover:border-rose-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-[var(--ink-500)]">{t('central.kpi.delayed_deals')}</span>
            <span className="size-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-800">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-rose-900 tracking-tight">{delayedDealsCount}</div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]/70">
            <div className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>تجاوزت المهل</span>
            </div>
            <SmartKpiBadge
              alert={alerts?.delayed_tenders?.alert}
              value={alerts?.delayed_tenders?.value}
              message={alerts?.delayed_tenders?.message ? "على الأجل" : undefined}
            />
          </div>
        </div>

        {/* KPI 5: Risks & Disputes Index */}
        <div className="group bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-xs space-y-2 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-[var(--ink-500)]">{t('central.kpi.risk_disputes')}</span>
            <span className="size-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-900 tracking-tight">{highRiskCount}</div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]/70">
            <div className="text-[11px] text-muted-foreground font-medium">
              مخاطر وطعون
            </div>
            <SmartKpiBadge
              alert={alerts?.objections?.alert}
              value={alerts?.objections?.value}
              message={alerts?.objections?.message ? "لا طعون" : undefined}
            />
          </div>
        </div>

        {/* KPI 6: Average Completion & Legal Compliance */}
        <div className="group bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-xs space-y-2 hover:border-[var(--stamp-green-700)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold text-[var(--ink-500)]">{t('central.kpi.compliance_rate')}</span>
            <span className="size-8 rounded-lg bg-navy-50 border border-[var(--color-border-subtle)] flex items-center justify-center text-navy-800">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-navy-900 tracking-tight">{averageCompletion}%</div>
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]/70">
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>تدقيق إجرائي</span>
            </div>
            <SmartKpiBadge
              alert={alerts?.compliance_rate?.alert}
              message={alerts?.compliance_rate?.message ? "100% ممتازة" : undefined}
            />
          </div>
        </div>
      </section>

      {/* ==============================================================
          3. MAIN RESPONSIVE DASHBOARD: 2-COLUMN OPS + 1-COLUMN AI INTELLIGENCE
          ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* عمودان: المحتوى التشغيلي والتحليلي الرئيسي */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Area & National Interactive Map */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Trend Area (7 cols on XL) */}
            <section className="xl:col-span-7 bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-navy-800" />
                {t('central.trend.title')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('central.trend.subtitle')}
              </p>
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/80 self-start sm:self-auto text-xs">
              <button
                onClick={() => setTrendMetric('volume')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  trendMetric === 'volume'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-navy-900'
                }`}
              >
                {t('central.trend.metric_volume')}
              </button>
              <button
                onClick={() => setTrendMetric('count')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  trendMetric === 'count'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-navy-900'
                }`}
              >
                {t('central.trend.metric_count')}
              </button>
              <button
                onClick={() => setTrendMetric('delay')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  trendMetric === 'delay'
                    ? 'bg-rose-800 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-navy-900'
                }`}
              >
                {t('central.trend.metric_delay')}
              </button>
            </div>
          </div>

          {/* Temporal Bars with Cross-filtering on Click */}
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-7 gap-2 items-end h-44 border-b border-border pb-2 px-1">
              {monthlyTrends.map((item) => {
                const maxVal =
                  trendMetric === 'volume'
                    ? Math.max(...monthlyTrends.map((m) => m.volume), 1)
                    : Math.max(...monthlyTrends.map((m) => (trendMetric === 'count' ? m.count : m.delayed)), 1);
                const currentVal =
                  trendMetric === 'volume'
                    ? item.volume
                    : trendMetric === 'count'
                    ? item.count
                    : item.delayed;
                const heightPercent = Math.max(Math.round((currentVal / maxVal) * 100), 12);
                const isSelected = selectedMonth === item.month;

                return (
                  <div
                    key={item.month}
                    onClick={() => setSelectedMonth(isSelected ? null : item.month)}
                    className="flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group"
                    title={`الشهر: ${item.month} - القيمة: ${
                      trendMetric === 'volume' ? formatDzd(item.volume) : currentVal
                    } (انقر للتصفية المتبادلة)`}
                  >
                    <div
                      className={`text-[10px] font-bold px-1 rounded transition-opacity ${
                        isSelected ? 'bg-navy-900 text-white' : 'text-muted-foreground opacity-70 group-hover:opacity-100'
                      }`}
                    >
                      {trendMetric === 'volume'
                        ? (item.volume / 1000000).toFixed(0) + 'م'
                        : currentVal}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                        isSelected
                          ? 'bg-emerald-600 ring-2 ring-emerald-400'
                          : trendMetric === 'delay'
                          ? 'bg-rose-500/80 group-hover:bg-rose-600'
                          : 'bg-navy-800/80 group-hover:bg-navy-900'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold truncate max-w-full ${
                        isSelected ? 'text-navy-900 underline' : 'text-muted-foreground'
                      }`}
                    >
                      {item.month.split('-')[1]}/{item.month.split('-')[0].slice(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-navy-800 inline-block"></span>
                مؤشر التدفق الزمني
              </span>
              {selectedMonth && (
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="text-emerald-800 font-bold hover:underline"
                >
                  إلغاء تصفية الشهر ({selectedMonth})
                </button>
              )}
            </div>
          </div>
        </section>

        {/* National Interactive Map (5 cols on XL) */}
        <section className="xl:col-span-5 bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                {t('central.map.title')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('central.map.subtitle')}
              </p>
            </div>
          </div>

          {/* Interactive Wilayas Grid & Regional Hubs */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-2">
              {WILAYAS_LIST.map((wilaya) => {
                const isSelected = selectedWilaya === wilaya.code;
                const wilayaDeals = MOCK_GOVERNANCE_DEALS.filter((d) => d.wilayaCode === wilaya.code);
                const count = wilayaDeals.length;

                return (
                  <button
                    key={wilaya.code}
                    onClick={() => {
                      setSelectedWilaya(isSelected ? 'all' : wilaya.code);
                      setSelectedAuthority('all');
                      setSelectedDealId(null);
                    }}
                    className={`p-2.5 rounded-xl border text-start transition-all ${
                      isSelected
                        ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                        : 'bg-muted/30 border-border hover:border-navy-500/50 hover:bg-muted/60 text-navy-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold">{wilaya.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-gold-500 text-navy-900' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {wilaya.code}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] opacity-80">
                      <span>{wilaya.region}</span>
                      <span className="font-bold">{count} صفقات</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900">
                {selectedWilaya === 'all'
                  ? t('central.map.national_view')
                  : `${t('central.map.selected_wilaya')} ولاية ${
                      WILAYAS_LIST.find((w) => w.code === selectedWilaya)?.name
                    }`}
              </span>
              <span className="text-emerald-800 font-semibold">
                {filteredDeals.length} صفقة تحت الرقابة
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ==============================================================
          4. ENTITY RANKING & 5. SECTOR ANALYTICS & RISK PANEL
          ============================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Entity Ranking Table */}
        <section className="bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-navy-800" />
              {t('central.ranking.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('central.ranking.subtitle')}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)]">
            <table className="w-full text-xs text-start border-collapse">
              <thead className="bg-[var(--paper-100)] border-b border-[var(--color-border-subtle)]">
                <tr className="text-[var(--ink-700)]">
                  <th className="py-2.5 px-3 text-start font-bold">{t('central.ranking.col_entity')}</th>
                  <th className="py-2.5 px-2 text-center font-bold">{t('central.ranking.col_deals')}</th>
                  <th className="py-2.5 px-2 text-start font-bold">{t('central.kpi.total_budget')}</th>
                  <th className="py-2.5 px-2 text-center font-bold">{t('central.ranking.col_punctuality')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] bg-white">
                {entityRanking.map((entity, idx) => {
                  const isSelected = selectedAuthority === entity.name;
                  return (
                    <tr
                      key={entity.name}
                      onClick={() => {
                        setSelectedAuthority(isSelected ? 'all' : entity.name);
                        setSelectedDealId(null);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-navy-50 font-bold text-navy-900'
                          : 'hover:bg-muted/40 text-navy-900'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {idx + 1}
                          </span>
                          <span className="line-clamp-1 font-semibold" title={entity.name}>
                            {entity.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-bold">{entity.dealsCount}</td>
                      <td className="py-3 px-2 text-start text-emerald-800 font-bold whitespace-nowrap">
                        {formatDzd(entity.budget)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {entity.delayedCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-bold text-[10px]">
                            {entity.delayedCount} متأخر
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                            ملتزم 100%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sector Analytics & Risk Matrix */}
        <section className="bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-navy-800" />
              {t('central.analytics.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('central.analytics.subtitle')}
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {sectorDistribution.map((sec) => (
              <div
                key={sec.sectorKey}
                onClick={() =>
                  setSelectedSector(selectedSector === sec.sectorKey ? 'all' : sec.sectorKey)
                }
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  selectedSector === sec.sectorKey
                    ? 'border-navy-900 bg-navy-50/50'
                    : 'border-border hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-navy-900">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-navy-800"></span>
                    {getSectorLabel(sec.sectorKey)}
                  </span>
                  <span>
                    {sec.count} صفقات ({sec.percentage}%) — {formatDzd(sec.budget)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    style={{ width: `${sec.percentage}%` }}
                    className="h-full bg-navy-800 rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Procedural Deviation Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
              <span>مؤشرات الإنذار المبكر والانحراف:</span>
            </div>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              رصد {delayedDealsCount} صفقات متجاوزة للأجل القانوني المحدد في المرسوم 15-247 لدراسة العروض الفنية، مع تسجيل {highRiskCount} حالات ذات مخاطرة مرتفعة تتطلب مرافقة رقابية مباشرة.
            </p>
          </div>
        </section>
      </div>

      {/* ==============================================================
          6. FILTERED DEALS DIRECTORY & AUDIT TRAIL LOG
          ============================================================== */}
      <section className="bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-800" />
              {t('central.audit.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('central.audit.subtitle')}
            </p>
          </div>
          <span className="text-xs font-bold text-navy-800 bg-muted/50 px-3 py-1 rounded-xl">
            {filteredDeals.length} صفقة معروضة
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)]">
          <table className="w-full text-xs text-start border-collapse">
            <thead className="bg-[var(--paper-100)] border-b border-[var(--color-border-subtle)]">
              <tr className="text-[var(--ink-700)]">
                <th className="py-2.5 px-3 text-start font-bold">المرجع والعنوان</th>
                <th className="py-2.5 px-2 text-start font-bold">{t('central.audit.authority_col')}</th>
                <th className="py-2.5 px-2 text-start font-bold">الولاية / القطاع</th>
                <th className="py-2.5 px-2 text-start font-bold">الميزانية</th>
                <th className="py-2.5 px-2 text-center font-bold">المرحلة</th>
                <th className="py-2.5 px-2 text-center font-bold">المخاطر</th>
                <th className="py-2.5 px-2 text-center font-bold">سجل التدقيق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] bg-white">
              {filteredDeals.map((deal) => {
                const isSelected = selectedDealId === deal.id;
                return (
                  <tr
                    key={deal.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-navy-50/70 font-semibold' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-navy-900 block">{deal.reference}</span>
                        <span className="text-muted-foreground line-clamp-1 max-w-xs" title={deal.title}>
                          {deal.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-navy-900 font-medium">
                      <span className="line-clamp-1 max-w-[180px]" title={deal.authorityName}>
                        {deal.authorityName}
                      </span>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className="font-bold text-navy-900">ولاية {deal.wilayaName}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {getSectorLabel(deal.sector)}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-bold text-emerald-800 whitespace-nowrap">
                      {formatDzd(deal.estimatedBudget)}
                    </td>
                    <td className="py-3 px-2 text-center">{getStatusBadge(deal.status)}</td>
                    <td className="py-3 px-2 text-center">
                      {deal.riskScore === 'high' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-bold text-[10px]" title={deal.riskReason}>
                          حرج
                        </span>
                      ) : deal.riskScore === 'medium' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px]" title={deal.riskReason}>
                          متوسط
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                          عادي
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setSelectedDealId(isSelected ? null : deal.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-navy-900 text-white shadow-xs'
                            : 'border border-border bg-background hover:bg-muted text-navy-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'إخفاء' : 'معاينة'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Deal Drill-Down Audit Detail View */}
        {activeDeal && (
          <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-navy-300 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  سجل التدقيق الرقمي الموثق للصفقة: {activeDeal.reference}
                </span>
                <p className="text-[11px] text-muted-foreground">{activeDeal.title}</p>
              </div>
              <button
                onClick={() => setSelectedDealId(null)}
                className="text-xs font-bold text-muted-foreground hover:text-navy-900"
              >
                إغلاق المعاينة
              </button>
            </div>

            <div className="space-y-2">
              {activeDeal.auditTrail.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-card p-2.5 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="font-bold text-navy-900">{ev.event}</span>
                    <span className="text-muted-foreground">({ev.actor})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-muted-foreground">{ev.timestamp}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      محقق ومجمد
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
        </div>

        {/* عمود: AI + Insights */}
        <div className="lg:col-span-1 space-y-6">
          <AIInsightsPanel />
          <SuspicionAlerts />

          
        </div>
      </div>

    </div>
  );
}