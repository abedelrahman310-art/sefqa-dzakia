import React, { useState } from 'react';
import { PageHeader, KpiCard, AICard } from '@/shared/components';
import {
  Users,
  CheckCircle,
  Eye,
  Ban,
  AlertOctagon,
  Search,
  Building2,
  Calendar,
  AlertTriangle,
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

interface OperatorItem {
  id: string;
  nif: string;
  name: string;
  category: string;
  wilaya: string;
  offersSubmitted: number;
  dealsWon: number;
  status: 'active' | 'under_surveillance' | 'banned';
  riskScore: number;
  reason?: string;
  banDate?: string;
}

const OPERATORS_DATA: OperatorItem[] = [
  {
    id: 'op-1',
    nif: '000216012345678',
    name: 'شركة البناء والري الكبرى (COSIDER Travaux Publics)',
    category: 'الدرجة 9 (أشغال عمومية وري)',
    wilaya: 'الجزائر (16)',
    offersSubmitted: 64,
    dealsWon: 28,
    status: 'active',
    riskScore: 8,
  },
  {
    id: 'op-2',
    nif: '000319087654321',
    name: 'المؤسسة الوطنية للعتاد الطبي والتقني (ENEMAT)',
    category: 'الدرجة 6 (صحة وتجهيزات)',
    wilaya: 'وهران (31)',
    offersSubmitted: 42,
    dealsWon: 19,
    status: 'active',
    riskScore: 12,
  },
  {
    id: 'op-3',
    nif: '000418055443322',
    name: 'سارل النور للإلكترونيات وحلول الطاقة',
    category: 'الدرجة 4 (طاقة وكهرباء)',
    wilaya: 'سطيف (19)',
    offersSubmitted: 22,
    dealsWon: 7,
    status: 'under_surveillance',
    riskScore: 68,
    reason: 'تزامن دائم في عروض الأسعار مع مؤسسة النجمة لنفس الصفقات',
  },
  {
    id: 'op-4',
    nif: '000517099887766',
    name: 'مؤسسة النجمة للحلول الطاقوية والهندسة',
    category: 'الدرجة 4 (طاقة وكهرباء)',
    wilaya: 'سطيف (19)',
    offersSubmitted: 21,
    dealsWon: 6,
    status: 'under_surveillance',
    riskScore: 65,
    reason: 'نفس العنوان الجبائي ومطابقة صياغة الملفات التقنية',
  },
  {
    id: 'op-5',
    nif: '000115011223344',
    name: 'شركة الرافدين للأشغال العامة والخرسانة',
    category: 'الدرجة 5 (بناء وري)',
    wilaya: 'باتنة (05)',
    offersSubmitted: 15,
    dealsWon: 2,
    status: 'banned',
    riskScore: 98,
    reason: 'تقديم شهادات حسن تنفيذ مزورة في صفقة بلدية بريكة',
    banDate: '2026-05-14',
  },
  {
    id: 'op-6',
    nif: '000214044556677',
    name: 'إيتيروس للتوريدات المكتبية والتأثيث',
    category: 'الدرجة 2 (توريدات)',
    wilaya: 'الجزائر (16)',
    offersSubmitted: 18,
    dealsWon: 0,
    status: 'banned',
    riskScore: 95,
    reason: 'إخلال متعمد بالتزامات تعاقدية بعد الإرساء النهائي',
    banDate: '2026-07-20',
  },
];

const BANNED_LIST = OPERATORS_DATA.filter((o) => o.status === 'banned');

export function CentralOperators() {
  const [operators] = useState<OperatorItem[]>(OPERATORS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = operators.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        o.nif.toLowerCase().includes(q) ||
        o.wilaya.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 page-container py-6">
      <PageHeader
        eyebrow="المراقبة الوطنية"
        title="مراقبة المتعاملين الاقتصاديين"
        description="رصد قاعدة المتعاملين الاقتصاديين والشركات المتنافسة والتحقق من النزاهة وسجلات الإقصاء الوطني"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 section-gap">
        <KpiCard
          eyebrow="إجمالي المتعاملين"
          value="100K"
          trend={12}
          trendLabel="مؤسسة مسجلة بالسجل التجاري"
          sparkline={[85, 88, 92, 95, 97, 99, 100]}
          icon={Users}
          accent="navy"
        />
        <KpiCard
          eyebrow="نشطون ومؤهلون"
          value="45K"
          trend={6}
          trendLabel="ملفات إدارية محينة"
          sparkline={[38, 40, 41, 42, 43, 44, 45]}
          icon={CheckCircle}
          accent="emerald"
        />
        <KpiCard
          eyebrow="تحت المراقبة"
          value="12"
          trend={-2}
          trendLabel="مؤشرات تكرار وتطابق"
          sparkline={[15, 14, 15, 13, 14, 13, 12]}
          icon={Eye}
          accent="gold"
        />
        <KpiCard
          eyebrow="ممنوعون ومقصيون"
          value="5"
          trend={0}
          trendLabel="مقصيون بقرارات رسمية"
          sparkline={[5, 5, 5, 5, 5, 5, 5]}
          icon={Ban}
          accent="red"
        />
      </div>

      {/* AICard */}
      <AICard
        title="🚨 5 شبهات تواطؤ مرصودة بالذكاء الاصطناعي"
        subtitle="خوارزميات التحليل الرقابي كشفت تطابقاً نمطياً في عروض الأسعار والتوقيت الزمني"
      >
        <div className="space-y-3 text-sm">
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-200">
            <div className="flex items-center gap-2 font-bold text-red-950 text-xs mb-1">
              <AlertTriangle className="size-4 text-red-600" />
              <span>تواطؤ ثنائي محتمل: سارل النور & مؤسسة النجمة (سطيف)</span>
            </div>
            <p className="text-xs text-red-900 leading-relaxed">
              تم رصد تقديم عروض متزامنة في 6 مناقصات لنفس الصفقات بأسعار متقاربة بنسبة 0.8% وتكرار
              تناوب الفوز بين الشركتين، مما يشير إلى شبهة اتفاق سري يخل بقواعد المنافسة الحرة وفق
              المادة 85 من القانون 23-12.
            </p>
          </div>
        </div>
      </AICard>

      {/* Main Grid: Operators Table + Banned Side Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* Table Card */}
        <Card className="shadow-sm border border-[var(--color-border-subtle)] bg-[var(--card-bg)]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
            <div>
              <CardTitle className="text-xl font-bold text-[var(--color-text-primary)]">
                سجل المتعاملين الاقتصاديين
              </CardTitle>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                العدد الحالي المعروض: {filtered.length} متعاملاً
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="size-4 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو الرقم الجبائي..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 pe-3 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
                aria-label="تصفية حالة المتعامل"
              >
                <option value="all">كل الحالات</option>
                <option value="active">نشط ومؤهل</option>
                <option value="under_surveillance">تحت المراقبة</option>
                <option value="banned">ممنوع ومقصى</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">الرقم الجبائي (NIF)</TableHead>
                  <TableHead className="min-w-[200px]">المتعامل الاقتصادي</TableHead>
                  <TableHead>الولاية</TableHead>
                  <TableHead className="text-center">العروض</TableHead>
                  <TableHead className="text-center">الصفقات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">مؤشر المخاطر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((op) => (
                  <TableRow key={op.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="font-mono text-xs text-[var(--official-900)]">
                      {op.nif}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm text-[var(--color-text-primary)]">
                        {op.name}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {op.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--color-text-secondary)]">
                      {op.wilaya}
                    </TableCell>
                    <TableCell className="font-mono text-center font-bold text-xs">
                      {op.offersSubmitted}
                    </TableCell>
                    <TableCell className="font-mono text-center font-bold text-xs text-emerald-700">
                      {op.dealsWon}
                    </TableCell>
                    <TableCell>
                      {op.status === 'active' && (
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">
                          نشط ومؤهل
                        </Badge>
                      )}
                      {op.status === 'under_surveillance' && (
                        <Badge className="bg-amber-50 text-amber-800 border-amber-300 font-bold">
                          تحت المراقبة
                        </Badge>
                      )}
                      {op.status === 'banned' && (
                        <Badge className="bg-red-50 text-red-800 border-red-300 font-bold">
                          مقصى وممنوع
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-mono text-xs font-bold ${
                          op.riskScore < 20
                            ? 'bg-emerald-100 text-emerald-800'
                            : op.riskScore < 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {op.riskScore}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
              <span>عرض {filtered.length} من أصل {operators.length} مؤسسة</span>
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

        {/* Banned Operators Sidebar Panel */}
        <aside className="space-y-4">
          <Card className="border border-red-200 bg-red-50/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-red-200/60">
              <div className="flex items-center gap-2 text-red-900">
                <AlertOctagon className="size-5 text-red-600" />
                <CardTitle className="text-base font-bold text-red-950">
                  قائمة الممنوعين وطنياً
                </CardTitle>
              </div>
              <p className="text-xs text-red-800 mt-1">
                المقصيون من المشاركة في الصفقات العمومية طبقاً لأحكام القانون 23-12
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {BANNED_LIST.map((banned) => (
                <div
                  key={banned.id}
                  className="p-3.5 rounded-xl bg-white border border-red-200 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-xs font-bold text-[var(--color-text-primary)] leading-tight">
                      {banned.name}
                    </strong>
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">
                      مقصى
                    </Badge>
                  </div>
                  <div className="font-mono text-[11px] text-[var(--color-text-muted)]">
                    NIF: {banned.nif}
                  </div>
                  <p className="text-xs text-red-900 bg-red-50 p-2 rounded-lg border border-red-100">
                    <strong>السبب:</strong> {banned.reason}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                    <Calendar className="size-3 text-red-500" />
                    <span>تاريخ القرار: {banned.banDate}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default CentralOperators;
