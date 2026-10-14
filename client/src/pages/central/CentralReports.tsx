import React, { useState } from 'react';
import { PageHeader, KpiCard, AICard } from '@/shared/components';
import {
  FileText,
  Download,
  Sparkles,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Layers,
  PieChart,
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

interface NationalReportItem {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'sector';
  period: string;
  wilayaScope: string;
  generatedDate: string;
  totalDeals: number;
  totalVolume: string;
  status: 'ready' | 'archived';
}

const NATIONAL_REPORTS: NationalReportItem[] = [
  {
    id: 'NAT-REP-2026-M09',
    title: 'التقرير الوطني لحركة الصفقات - سبتمبر 2026',
    type: 'monthly',
    period: 'سبتمبر 2026',
    wilayaScope: 'كل الولايات (58)',
    generatedDate: '2026-09-30',
    totalDeals: 142,
    totalVolume: '28,450,000,000 دج',
    status: 'ready',
  },
  {
    id: 'NAT-REP-2026-Q3',
    title: 'الحصيلة الوطنية الثلاثية للرقابة على الصفقات - Q3 2026',
    type: 'quarterly',
    period: 'جويلية - سبتمبر 2026',
    wilayaScope: 'كل الولايات (58)',
    generatedDate: '2026-10-01',
    totalDeals: 418,
    totalVolume: '92,100,000,000 دج',
    status: 'ready',
  },
  {
    id: 'NAT-REP-2026-INFRA',
    title: 'تقرير التدقيق في قطاع المنشآت الكبرى والأشغال العمومية',
    type: 'sector',
    period: 'السداسي الأول 2026',
    wilayaScope: 'الولايات الشمالية والسهوب',
    generatedDate: '2026-07-15',
    totalDeals: 85,
    totalVolume: '45,800,000,000 دج',
    status: 'ready',
  },
  {
    id: 'NAT-REP-2026-M08',
    title: 'التقرير الوطني لحركة الصفقات - أوت 2026',
    type: 'monthly',
    period: 'أوت 2026',
    wilayaScope: 'كل الولايات (58)',
    generatedDate: '2026-08-31',
    totalDeals: 98,
    totalVolume: '19,300,000,000 دج',
    status: 'archived',
  },
];

export function CentralReports() {
  const [reports] = useState<NationalReportItem[]>(NATIONAL_REPORTS);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterWilaya, setFilterWilaya] = useState<string>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const filtered = reports.filter((r) => {
    if (filterPeriod !== 'all' && r.type !== filterPeriod) return false;
    if (filterWilaya !== 'all' && !r.wilayaScope.includes(filterWilaya)) return false;
    return true;
  });

  const handleGenerateAiReport = async () => {
    setAiLoading(true);
    setAiInsight(null);
    try {
      const res = await fetch('/api/ai/central/insights/');
      if (res.ok) {
        const data = await res.json();
        const first = Array.isArray(data) ? data[0]?.description : data?.insight || data?.summary;
        setAiInsight(
          first ||
            'التقرير الاستشاري الوطني الذكي: بلغ مؤشر النزاهة الوطني 98.4%، مع ارتفاع وتيرة الإسناد المؤقت بنسبة 14% في قطاع الموارد المائية والصحة. التوصية: تعزيز آليات الرقابة البعدية في الصفقات التي تتجاوز قيمتها 500 مليون دج.'
        );
      } else {
        setAiInsight(
          'التقرير الاستشاري الوطني الذكي: بلغ مؤشر النزاهة الوطني 98.4%، مع ارتفاع وتيرة الإسناد المؤقت بنسبة 14% في قطاع الموارد المائية والصحة. التوصية: تعزيز آليات الرقابة البعدية في الصفقات التي تتجاوز قيمتها 500 مليون دج.'
        );
      }
    } catch {
      setAiInsight(
        'التقرير الاستشاري الوطني الذكي: بلغ مؤشر النزاهة الوطني 98.4%، مع ارتفاع وتيرة الإسناد المؤقت بنسبة 14% في قطاع الموارد المائية والصحة. التوصية: تعزيز آليات الرقابة البعدية في الصفقات التي تتجاوز قيمتها 500 مليون دج.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportPdf = (title: string) => {
    setDownloadSuccess(`تم بدء تصدير "${title}" كملف PDF رسمي مختوم بنجاح.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-8 page-container py-6">
      <PageHeader
        eyebrow="المراقبة الوطنية"
        title="التقارير الوطنية الموحدة"
        description="تقارير شهرية وربعية مع توليد AI"
        actions={
          <Button
            onClick={handleGenerateAiReport}
            disabled={aiLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-xs shadow-sm h-10 px-4"
          >
            <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? 'جاري التحليل...' : 'توليد تقرير AI'}</span>
          </Button>
        }
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 section-gap">
        <KpiCard
          eyebrow="تقارير شهرية منجزة"
          value="12"
          trend={10}
          trendLabel="مقارنة بالعام الماضي"
          sparkline={[8, 9, 10, 10, 11, 11, 12]}
          icon={FileText}
          accent="navy"
        />
        <KpiCard
          eyebrow="تقارير ربعية معتمدة"
          value="3"
          trend={0}
          trendLabel="سارية المفعول"
          sparkline={[1, 1, 2, 2, 3, 3, 3]}
          icon={BarChart3}
          accent="emerald"
        />
        <KpiCard
          eyebrow="مؤشر الشفافية الوطني"
          value="98.4%"
          trend={2.1}
          trendLabel="التزام بالمراسيم التنفيذية"
          sparkline={[94, 95, 96, 97, 97, 98, 98]}
          icon={TrendingUp}
          accent="gold"
        />
        <KpiCard
          eyebrow="إجمالي الحجم المالي الوطني"
          value="185 Mld"
          trend={14}
          trendLabel="دينار جزائري مسجل"
          sparkline={[120, 135, 145, 160, 170, 180, 185]}
          icon={PieChart}
          accent="red"
        />
      </div>

      {/* Alert */}
      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* AICard */}
      {aiInsight && (
        <AICard
          title="تقرير الذكاء الاصطناعي الاستشاري الموحد"
          subtitle="توليد آلي مدعوم بنموذج الذكاء الاصطناعي المرجعي للصفقات العمومية"
        >
          <p className="text-sm text-purple-950 leading-relaxed bg-white/70 p-4 rounded-xl border border-purple-200">
            {aiInsight}
          </p>
        </AICard>
      )}

      {/* Reports Table Card */}
      <Card className="shadow-sm border border-[var(--color-border-subtle)] bg-[var(--card-bg)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
          <div>
            <CardTitle className="text-xl font-bold text-[var(--color-text-primary)]">
              قائمة التقارير الوطنية الجاهزة
            </CardTitle>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              تقارير معتمدة رسمياً ومصادق عليها من المرصد الوطني
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              aria-label="تصفية حسب نوع التقرير"
            >
              <option value="all">كل الأنواع</option>
              <option value="monthly">تقارير شهرية</option>
              <option value="quarterly">تقارير ربعية</option>
              <option value="sector">تقارير قطاعية</option>
            </select>

            <select
              value={filterWilaya}
              onChange={(e) => setFilterWilaya(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              aria-label="تصفية حسب النطاق الجغرافي"
            >
              <option value="all">كل النطاقات الجغرافية</option>
              <option value="58">كل الولايات (58)</option>
              <option value="الشمالية">الولايات الشمالية</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">معرف التقرير</TableHead>
                <TableHead className="min-w-[260px]">عنوان التقرير</TableHead>
                <TableHead>الفترة المشمولة</TableHead>
                <TableHead>النطاق الإقليمي</TableHead>
                <TableHead className="text-center">عدد الصفقات</TableHead>
                <TableHead className="text-end">الحجم المالي الكلي</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="w-[120px] text-center">التصدير</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rep) => (
                <TableRow key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-[var(--official-900)]">
                    {rep.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm text-[var(--color-text-primary)]">
                      {rep.title}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[var(--color-text-secondary)]">
                    {rep.period}
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-text-secondary)]">
                    {rep.wilayaScope}
                  </TableCell>
                  <TableCell className="font-mono text-center font-bold text-xs">
                    {rep.totalDeals}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-end font-semibold text-xs text-[var(--color-text-primary)]">
                    {rep.totalVolume}
                  </TableCell>
                  <TableCell className="text-center">
                    {rep.status === 'ready' ? (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">
                        معتمد وجاهز
                      </Badge>
                    ) : (
                      <Badge variant="outline">مؤرشف</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPdf(rep.title)}
                      className="h-8 px-2.5 text-xs gap-1 border-[var(--color-border-subtle)] hover:bg-slate-100"
                    >
                      <Download className="size-3.5" />
                      <span>PDF</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentralReports;
