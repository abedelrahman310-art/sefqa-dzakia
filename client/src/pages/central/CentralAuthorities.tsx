import { useState } from 'react';
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
  ChevronRight,
  ChevronLeft,
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

interface AuthorityItem {
  id: string;
  rank: number;
  name: string;
  type: string;
  wilaya: string;
  dealsCount: number;
  totalVolume: number;
  complianceRate: number; // percentage
  status: 'excellent' | 'needs_support' | 'infractions' | 'normal';
  aiTrainingNeeded: boolean;
  notes?: string;
}

const AUTHORITIES_DATA: AuthorityItem[] = [
  {
    id: 'auth-1',
    rank: 1,
    name: 'مديرية الأشغال العمومية - ولاية الجزائر',
    type: 'مديرية ولائية',
    wilaya: 'الجزائر (16)',
    dealsCount: 42,
    totalVolume: 8500000000,
    complianceRate: 98,
    status: 'excellent',
    aiTrainingNeeded: false,
    notes: 'التزام تام بالمواعيد الرقمية ومحاضر جلسات الفتح خالية من التحفظات',
  },
  {
    id: 'auth-2',
    rank: 2,
    name: 'المركز الاستشفائي الجامعي مصطفى باشا',
    type: 'مؤسسة استشفائية جامعية',
    wilaya: 'الجزائر (16)',
    dealsCount: 28,
    totalVolume: 4200000000,
    complianceRate: 95,
    status: 'excellent',
    aiTrainingNeeded: false,
    notes: 'إجراءات طلب العروض سريعة وشفافة ومطابقة للمرسوم 15-247',
  },
  {
    id: 'auth-3',
    rank: 3,
    name: 'مديرية الموارد المائية - ولاية وهران',
    type: 'مديرية ولائية',
    wilaya: 'وهران (31)',
    dealsCount: 19,
    totalVolume: 3100000000,
    complianceRate: 92,
    status: 'excellent',
    aiTrainingNeeded: false,
    notes: 'أداء منتظم مع استخدام متقدم لمنظومة دفاتر الشروط النموذجية',
  },
  {
    id: 'auth-4',
    rank: 12,
    name: 'بلدية عين البيضاء - ولاية أم البواقي',
    type: 'جماعة محلية (بلدية)',
    wilaya: 'أم البواقي (04)',
    dealsCount: 14,
    totalVolume: 650000000,
    complianceRate: 74,
    status: 'needs_support',
    aiTrainingNeeded: true,
    notes: 'تأخر في رقمنة محاضر لجان الصفقات البلدية ونقص في إتقان تقييم العروض',
  },
  {
    id: 'auth-5',
    rank: 15,
    name: 'مديرية التجهيزات العمومية - ولاية تندوف',
    type: 'مديرية ولائية',
    wilaya: 'تندوف (37)',
    dealsCount: 8,
    totalVolume: 890000000,
    complianceRate: 71,
    status: 'needs_support',
    aiTrainingNeeded: true,
    notes: 'صعوبات في تشفير العروض عن بُعد وتطبيق المعايير التقنية الجديدة',
  },
  {
    id: 'auth-6',
    rank: 24,
    name: 'بلدية بريكة - ولاية باتنة',
    type: 'جماعة محلية (بلدية)',
    wilaya: 'باتنة (05)',
    dealsCount: 11,
    totalVolume: 480000000,
    complianceRate: 58,
    status: 'infractions',
    aiTrainingNeeded: true,
    notes: 'تسجيل مخالفتين تتعلقان بتجاوز آجال البت القانونية وشبهة عدم تكافؤ الفرص',
  },
];

function formatDZD(amount: number): string {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: AuthorityItem['status']) {
  switch (status) {
    case 'excellent':
      return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">أداء ممتاز</Badge>;
    case 'needs_support':
      return <Badge className="bg-amber-50 text-amber-800 border-amber-300 font-medium">تحتاج دعم وتدريب</Badge>;
    case 'infractions':
      return <Badge className="bg-red-50 text-red-800 border-red-300 font-bold">بمخالفات مسجلة</Badge>;
    default:
      return <Badge variant="outline">عادي</Badge>;
  }
}

export function CentralAuthorities() {
  const [authorities] = useState<AuthorityItem[]>(AUTHORITIES_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAuth, setSelectedAuth] = useState<AuthorityItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filtered = authorities.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.wilaya.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 page-container py-4">
      <PageHeader
        eyebrow="المراقبة الوطنية"
        title="مراقبة المصالح المتعاقدة"
        description="متابعة وتقييم أداء المصالح والهيئات الإدارية المتعاقدة وترتيبها حسب معايير الامتثال والحوكمة"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          eyebrow="إجمالي المصالح المتعاقدة"
          value="87"
          trend={4}
          trendLabel="هيئات مسجلة رسمياً"
          sparkline={[75, 78, 80, 82, 85, 86, 87]}
          icon={Building}
          accent="navy"
        />
        <KpiCard
          eyebrow="مصالح ممتازة"
          value="45"
          trend={10}
          trendLabel="امتثال أعلى من 90%"
          sparkline={[30, 32, 35, 38, 40, 42, 45]}
          icon={CheckCircle2}
          accent="emerald"
        />
        <KpiCard
          eyebrow="تحتاج دعم وتدريب"
          value="12"
          trend={-3}
          trendLabel="معدل امتثال أقل من 75%"
          sparkline={[18, 16, 15, 14, 13, 12, 12]}
          icon={HelpCircle}
          accent="gold"
        />
        <KpiCard
          eyebrow="بمخالفات وإخطارات"
          value="3"
          trend={0}
          trendLabel="مخالفات قيد التحقيق"
          sparkline={[3, 4, 3, 2, 3, 3, 3]}
          icon={AlertTriangle}
          accent="red"
        />
      </div>

      {/* AICard */}
      <AICard
        title="تحليل التدريب والدعم الذكي"
        subtitle="3 مصالح متعاقدة تم تشخيص حاجتها الملحة إلى دورة تكوينية استعجالية"
      >
        <div className="space-y-2.5 text-sm text-[var(--color-text-secondary)]">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-200">
            <span className="text-xl shrink-0">🏛️</span>
            <div>
              <div className="font-bold text-purple-950">
                بلدية عين البيضاء (أم البواقي) & بلدية بريكة (باتنة)
              </div>
              <p className="text-xs text-purple-900 mt-1">
                التوصية الاستشارية: تنظيم ورشة عمل ميدانية حول إجراءات الرقابة القبلية للجان
                الصفقات البلدية، ومطابقة دفاتر الشروط الإلكترونية تفادياً لإلغاء المناقصات.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-200">
            <span className="text-xl shrink-0">📡</span>
            <div>
              <div className="font-bold text-purple-950">
                مديرية التجهيزات العمومية - ولاية تندوف
              </div>
              <p className="text-xs text-purple-900 mt-1">
                التوصية الاستشارية: تقديم دعم تقني حول التوقيع الإلكتروني وتشفير الأظرفة لتفادي
                تأخير مواعيد الجلسات العلنية لفتح العروض.
              </p>
            </div>
          </div>
        </div>
      </AICard>

      {/* Table Card */}
      <Card className="shadow-sm border border-[var(--color-border-subtle)] bg-[var(--card-bg)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
          <div>
            <CardTitle className="text-xl font-bold text-[var(--color-text-primary)]">
              الترتيب الوطني لأداء المصالح المتعاقدة
            </CardTitle>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              مبني على مؤشرات الشفافية، احترام الآجال، وتطبيق القانون 23-12
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="size-4 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث باسم المصلحة أو الولاية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 pe-3 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              aria-label="تصفية التقييم"
            >
              <option value="all">كل التقييمات</option>
              <option value="excellent">ممتازة</option>
              <option value="needs_support">تحتاج دعم</option>
              <option value="infractions">بمخالفات</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">الرتبة</TableHead>
                <TableHead className="min-w-[260px]">المصلحة المتعاقدة</TableHead>
                <TableHead>النوع / الهيئة</TableHead>
                <TableHead>الولاية</TableHead>
                <TableHead className="text-center">عدد الصفقات</TableHead>
                <TableHead className="text-end">حجم الصفقات الإجمالي</TableHead>
                <TableHead className="text-center">نسبة الامتثال</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center justify-center size-7 rounded-full text-xs font-mono font-bold ${
                        item.rank <= 3
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.rank <= 3 && <Trophy className="size-3 me-0.5 text-amber-600" />}
                      {item.rank}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-[var(--color-text-primary)]">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-text-secondary)]">
                    {item.type}
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-text-secondary)]">
                    {item.wilaya}
                  </TableCell>
                  <TableCell className="font-mono text-center font-bold text-sm">
                    {item.dealsCount}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-end text-xs font-semibold text-[var(--color-text-primary)]">
                    {formatDZD(item.totalVolume)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-xs">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            item.complianceRate >= 90
                              ? 'bg-emerald-500'
                              : item.complianceRate >= 70
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${item.complianceRate}%` }}
                        />
                      </div>
                      <span>{item.complianceRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAuth(item);
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

          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
            <span>
              عرض {filtered.length} من أصل {authorities.length} مصلحة متعاقدة
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled className="h-7 px-2 text-xs">
                <ChevronRight className="size-3" /> السابق
              </Button>
              <Button variant="outline" size="sm" disabled className="h-7 px-2 text-xs">
                التالي <ChevronLeft className="size-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drill-down Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="end" className="sm:max-w-md p-6 bg-[var(--paper-50)] overflow-y-auto">
          {selectedAuth && (
            <div className="space-y-6">
              <SheetHeader className="text-start border-b border-[var(--color-border-subtle)] pb-4">
                <span className="eyebrow">بطاقة الرقابة الإدارية</span>
                <SheetTitle className="text-xl font-bold text-[var(--color-text-primary)]">
                  {selectedAuth.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-[var(--color-text-secondary)] mt-1">
                  الرتبة الوطنية: #{selectedAuth.rank} | الولاية: {selectedAuth.wilaya}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)]">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">الصفقات المدارة</div>
                    <div className="font-mono font-bold text-lg text-[var(--color-text-primary)]">
                      {selectedAuth.dealsCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)]">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">معدل الامتثال</div>
                    <div className="font-mono font-bold text-lg text-emerald-600">
                      {selectedAuth.complianceRate}%
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)]">
                  <div className="text-xs text-[var(--color-text-muted)] mb-1">الحجم المالي الكلي</div>
                  <div className="font-mono font-bold text-sm text-[var(--color-text-primary)]">
                    {formatDZD(selectedAuth.totalVolume)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-[var(--color-text-primary)]">
                    <ShieldCheck className="size-4 text-[var(--portal-primary)]" />
                    <span>سجل التدقيق والملاحظات الرقابية</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {selectedAuth.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default CentralAuthorities;
