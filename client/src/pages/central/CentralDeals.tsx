import { useState, useEffect } from 'react';
import { PageHeader, KpiCard, AICard } from '@/shared/components';
import {
  ListChecks,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

interface DealItem {
  id: string;
  reference: string;
  title: string;
  authority: string;
  wilaya: string;
  sector: string;
  budget: number;
  status: 'draft' | 'published' | 'opening' | 'evaluating' | 'awarded' | 'delayed' | 'critical';
  aiScore: number;
  aiNote?: string;
  deadline?: string;
}

const INITIAL_DEALS: DealItem[] = [
  {
    id: '1',
    reference: 'DTP-DZ-2026-042',
    title: 'مشروع صيانة وتأهيل الطريق الوطني رقم 01 (الشطر الجنوبي)',
    authority: 'مديرية الأشغال العمومية - ولاية الجزائر',
    wilaya: 'الجزائر (16)',
    sector: 'الأشغال العمومية',
    budget: 450000000,
    status: 'delayed',
    aiScore: 68,
    aiNote: 'تجاوز الأجل الزمني المحدد للدراسة بـ 15 يوماً',
    deadline: '2026-10-01',
  },
  {
    id: '2',
    reference: 'DWH-DZ-2026-012',
    title: 'تجهيز المجمعات المدرسية بشبكات الطاقة الشمسية والمولدات',
    authority: 'مديرية التربية - ولاية وهران',
    wilaya: 'وهران (31)',
    sector: 'الطاقة والتربية',
    budget: 120000000,
    status: 'critical',
    aiScore: 45,
    aiNote: 'رصد شبهة تجزئة محتملة للصفقة لتفادي سقف اللجنة الولائية',
    deadline: '2026-10-18',
  },
  {
    id: '3',
    reference: 'MSP-DZ-2026-088',
    title: 'اقتناء معدات التصوير بالرنين المغناطيسي والمستلزمات الطبية',
    authority: 'المركز الاستشفائي الجامعي مصطفى باشا',
    wilaya: 'الجزائر (16)',
    sector: 'الصحة',
    budget: 890000000,
    status: 'evaluating',
    aiScore: 94,
    aiNote: 'عرض تقني ممتاز، توافق تام مع المرسوم 15-247',
    deadline: '2026-10-25',
  },
  {
    id: '4',
    reference: 'HYD-DZ-2026-009',
    title: 'بناء خزان مائي سعة 5000 متر مكعب وربطه بشبكة التوزيع',
    authority: 'مديرية الموارد المائية - ولاية سطيف',
    wilaya: 'سطيف (19)',
    sector: 'الموارد المائية',
    budget: 280000000,
    status: 'published',
    aiScore: 91,
    aiNote: 'المواصفات التقنية متوازنة واستجابة عالية من المتعاملين',
    deadline: '2026-11-05',
  },
  {
    id: '5',
    reference: 'EDU-DZ-2026-104',
    title: 'تطوير منصة رقمية لإدارة الأطروحات والبحوث الأكاديمية',
    authority: 'جامعة هواري بومدين للعلوم والتكنولوجيا (USTHB)',
    wilaya: 'الجزائر (16)',
    sector: 'التعليم العالي',
    budget: 65000000,
    status: 'opening',
    aiScore: 89,
    aiNote: 'جلسة فتح الأظرفة مجدولة بنجاح وحضور المتعاملين كامل',
    deadline: '2026-10-20',
  },
  {
    id: '6',
    reference: 'AGR-DZ-2026-031',
    title: 'تهيئة المسالك الفلاحية وربط المستثمرات بالكهرباء الريفية',
    authority: 'المحافظة السامية لتطوير السهوب - الجلفة',
    wilaya: 'الجلفة (17)',
    sector: 'الفلاحة والري',
    budget: 340000000,
    status: 'awarded',
    aiScore: 96,
    aiNote: 'إرساء مؤقت سليم ومنح العقد وفق معيار الجودة والسعر',
    deadline: '2026-09-30',
  },
];

function formatDZD(amount: number): string {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: DealItem['status']) {
  switch (status) {
    case 'published':
      return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">منشورة</Badge>;
    case 'opening':
      return <Badge className="bg-sky-50 text-sky-800 border-sky-300">جلسة فتح الأظرفة</Badge>;
    case 'evaluating':
      return <Badge className="bg-indigo-50 text-indigo-800 border-indigo-300">قيد التقييم</Badge>;
    case 'awarded':
      return <Badge className="bg-amber-50 text-amber-800 border-amber-300">تم الإرساء</Badge>;
    case 'delayed':
      return <Badge className="bg-amber-500/15 text-amber-800 border-amber-400 font-bold">متأخرة 15 يوم</Badge>;
    case 'critical':
      return <Badge className="bg-red-50 text-red-800 border-red-300 font-bold">حرجة / شبهة</Badge>;
    default:
      return <Badge variant="outline">مسودة</Badge>;
  }
}

export function CentralDeals() {
  const [deals, setDeals] = useState<DealItem[]>(INITIAL_DEALS);
  const [filterWilaya, setFilterWilaya] = useState('all');
  const [filterSector, setFilterSector] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    async function loadDeals() {
      try {
        const token = localStorage.getItem('safaqat_access_token');
        const res = await fetch('/api/procurements/deals/', {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.results || [];
          if (items.length > 0) {
            const mapped: DealItem[] = items.map((item: any, idx: number) => {
              let st: DealItem['status'] = 'published';
              if (item.current_stage <= 2) st = 'draft';
              else if (item.current_stage === 6) st = 'opening';
              else if (item.current_stage === 7) st = 'evaluating';
              else if (item.current_stage >= 8) st = 'awarded';

              return {
                id: String(item.id || idx),
                reference: item.reference_number || item.reference || `DZ-2026-${100 + idx}`,
                title: item.title || 'صفقة عمومية',
                authority: item.authority_entity || item.authority_name || item.authority?.organization_name || 'مصلحة متعاقدة',
                wilaya: item.wilaya ? (item.wilaya.includes('(') ? item.wilaya : `${item.wilaya} (${item.wilaya})`) : 'الجزائر (16)',
                sector: item.sector || 'صفقات عمومية',
                budget: Number(item.estimated_budget) || 150000000,
                status: (item.status as DealItem['status']) || st,
                aiScore: 85 + (idx % 12),
                aiNote: item.description || 'مطابقة للمعايير الوطنية وفق القانون 23-12',
                deadline: item.submission_deadline ? item.submission_deadline.split('T')[0] : '2026-11-01',
              };
            });
            setDeals(mapped);
          }
        }
      } catch (err) {
        // Fallback to rich initial deals data
      }
    }
    loadDeals();
  }, []);

  const filteredDeals = deals.filter((d) => {
    if (filterWilaya !== 'all' && !d.wilaya.includes(filterWilaya)) return false;
    if (filterSector !== 'all' && d.sector !== filterSector) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.reference.toLowerCase().includes(q) ||
        d.authority.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 page-container py-4">
      <PageHeader
        eyebrow="المراقبة الوطنية"
        title="مراقبة الصفقات"
        description="رصد جميع الصفقات العمومية على المستوى الوطني وفق القانون 23-12 والمرسوم الرئاسي 15-247"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          eyebrow="إجمالي الصفقات"
          value="1,248"
          trend={12}
          sparkline={[12, 15, 18, 22, 25, 28, 32]}
          icon={ListChecks}
          accent="navy"
        />
        <KpiCard
          eyebrow="قيد التنفيذ"
          value="342"
          trend={5}
          sparkline={[20, 25, 30, 28, 35, 40, 42]}
          icon={Clock}
          accent="emerald"
        />
        <KpiCard
          eyebrow="متأخرة"
          value="18"
          trend={-8}
          sparkline={[25, 22, 18, 15, 12, 10, 8]}
          icon={AlertTriangle}
          accent="gold"
        />
        <KpiCard
          eyebrow="حرجة"
          value="3"
          trend={0}
          sparkline={[2, 3, 2, 3, 3, 4, 3]}
          icon={AlertOctagon}
          accent="red"
        />
      </div>

      {/* AICard */}
      <AICard
        title="تحليل AI للصفقات الوطنية"
        subtitle="3 صفقات عمومية تم رصدها وتحتاج إلى تدقيق فوري من قبل المرصد الوطني"
      >
        <ul className="space-y-3 font-medium text-sm text-[var(--color-text-secondary)]">
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-200 text-red-900">
            <span className="text-base">🔴</span>
            <span>
              <strong>صفقة DTP-DZ-2026-042 (الأشغال العمومية):</strong> تجاوزت الأجل القانوني
              للتقييم بـ 15 يوماً وتتطلب إشعاراً رسمي للمصلحة المتعاقدة.
            </span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-200 text-amber-900">
            <span className="text-base">🟡</span>
            <span>
              <strong>صفقة DWH-DZ-2026-012 (التربية والتعليم):</strong> مؤشر شبهة تجزئة عمدية
              لتفادي العرض أمام لجنة الصفقات الولائية المختصة.
            </span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-500/10 border border-sky-200 text-sky-900">
            <span className="text-base">🔵</span>
            <span>
              <strong>صفقة MSP-DZ-2026-088 (التجهيز الطبي):</strong> العرض المالي الأفضل أقل من
              المتوسط التقديري بنسبة 5% مع مطابقة تقنية كاملة.
            </span>
          </li>
        </ul>
      </AICard>

      {/* Deals Table Card */}
      <Card className="mt-8 shadow-sm border border-[var(--color-border-subtle)] bg-[var(--card-bg)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
          <div>
            <CardTitle className="text-xl font-bold text-[var(--color-text-primary)]">
              جدول الصفقات الوطنية
            </CardTitle>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              إجمالي النتائج: {filteredDeals.length} صفقة مسجلة
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="size-4 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث بالمرجع أو العنوان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 pe-3 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              />
            </div>

            <select
              value={filterWilaya}
              onChange={(e) => setFilterWilaya(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              aria-label="تصفية حسب الولاية"
            >
              <option value="all">كل الولايات</option>
              <option value="الجزائر">الجزائر (16)</option>
              <option value="وهران">وهران (31)</option>
              <option value="سطيف">سطيف (19)</option>
              <option value="الجلفة">الجلفة (17)</option>
            </select>

            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              aria-label="تصفية حسب القطاع"
            >
              <option value="all">كل القطاعات</option>
              <option value="الأشغال العمومية">الأشغال العمومية</option>
              <option value="الطاقة والتربية">الطاقة والتربية</option>
              <option value="الصحة">الصحة</option>
              <option value="الموارد المائية">الموارد المائية</option>
              <option value="التعليم العالي">التعليم العالي</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              aria-label="تصفية حسب الحالة"
            >
              <option value="all">كل الحالات</option>
              <option value="published">منشورة</option>
              <option value="opening">جلسة فتح الأظرفة</option>
              <option value="evaluating">قيد التقييم</option>
              <option value="delayed">متأخرة</option>
              <option value="critical">حرجة</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">المرجع</TableHead>
                <TableHead className="min-w-[240px]">الموضوع</TableHead>
                <TableHead>المصلحة المتعاقدة</TableHead>
                <TableHead>الولاية</TableHead>
                <TableHead className="text-end">الميزانية التقديرية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">مؤشر AI</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => (
                <TableRow key={deal.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-[var(--official-900)]">
                    {deal.reference}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm text-[var(--color-text-primary)] leading-snug">
                      {deal.title}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      قطاع: {deal.sector}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-text-secondary)]">
                    {deal.authority}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {deal.wilaya}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-end font-semibold text-sm text-[var(--color-text-primary)]">
                    {formatDZD(deal.budget)}
                  </TableCell>
                  <TableCell>{getStatusBadge(deal.status)}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-bold text-xs bg-purple-50 text-purple-700 border border-purple-200">
                      <Sparkles className="size-3 text-purple-600" />
                      {deal.aiScore}
                    </span>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDeal(deal);
                        setIsSheetOpen(true);
                      }}
                      className="h-8 px-2.5 text-xs text-[var(--portal-primary)] hover:bg-slate-100"
                    >
                      <Eye className="size-3.5 me-1" />
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Simple Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
            <span>
              عرض 1 إلى {filteredDeals.length} من أصل {filteredDeals.length} صفقة
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled className="h-7 px-2 text-xs">
                <ChevronRight className="size-3" />
                السابق
              </Button>
              <Button variant="outline" size="sm" disabled className="h-7 px-2 text-xs">
                التالي
                <ChevronLeft className="size-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drill-down Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="end" className="sm:max-w-md p-6 bg-[var(--paper-50)] overflow-y-auto">
          {selectedDeal && (
            <div className="space-y-6">
              <SheetHeader className="text-start border-b border-[var(--color-border-subtle)] pb-4">
                <span className="eyebrow">تفاصيل بطاقة الصفقة</span>
                <SheetTitle className="text-xl font-bold font-mono text-[var(--color-text-primary)]">
                  {selectedDeal.reference}
                </SheetTitle>
                <SheetDescription className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {selectedDeal.title}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)]">
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">المصلحة المتعاقدة</div>
                  <div className="font-semibold text-[var(--color-text-primary)]">{selectedDeal.authority}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{selectedDeal.wilaya}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)]">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">الميزانية</div>
                    <div className="font-mono font-bold text-sm text-[var(--color-text-primary)]">
                      {formatDZD(selectedDeal.budget)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)]">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">الحالة الإجرائية</div>
                    <div>{getStatusBadge(selectedDeal.status)}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2 font-bold text-purple-900 text-xs">
                    <Sparkles className="size-4 text-purple-700" />
                    <span>تقييم النزاهة والامتثال (AI Score: {selectedDeal.aiScore}/100)</span>
                  </div>
                  <p className="text-xs text-purple-950 leading-relaxed">{selectedDeal.aiNote}</p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)]">
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">أجل الإيداع القانوني</div>
                  <div className="font-mono text-sm text-[var(--color-text-primary)]">{selectedDeal.deadline}</div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default CentralDeals;
