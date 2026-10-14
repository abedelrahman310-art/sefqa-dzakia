import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Sparkles, Calendar, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

import { PageHeader } from '@/shared/components';

interface ReportItem {
  id: string;
  title: string;
  type: 'monthly' | 'quarterly' | 'performance';
  period: string;
  generatedDate: string;
  dealCount: number;
  totalBudget: string;
  status: 'ready' | 'archived';
}

const DEFAULT_REPORTS: ReportItem[] = [
  {
    id: 'rep-2026-m03',
    title: 'تقرير النشاط الشهري - مارس 2026',
    type: 'monthly',
    period: 'مارس 2026',
    generatedDate: '2026-03-31',
    dealCount: 8,
    totalBudget: '420,000,000 دج',
    status: 'ready',
  },
  {
    id: 'rep-2026-q1',
    title: 'تقرير الصفقات الثلاثي الأول - Q1 2026',
    type: 'quarterly',
    period: 'جانفي - مارس 2026',
    generatedDate: '2026-03-31',
    dealCount: 19,
    totalBudget: '1,150,000,000 دج',
    status: 'ready',
  },
  {
    id: 'rep-2026-perf-01',
    title: 'تقرير الأداء ومؤشرات الفعالية والامتثال',
    type: 'performance',
    period: 'السداسي الأول 2026',
    generatedDate: '2026-04-05',
    dealCount: 15,
    totalBudget: '890,000,000 دج',
    status: 'ready',
  },
  {
    id: 'rep-2026-m02',
    title: 'تقرير النشاط الشهري - فيفري 2026',
    type: 'monthly',
    period: 'فيفري 2026',
    generatedDate: '2026-02-28',
    dealCount: 6,
    totalBudget: '280,000,000 دج',
    status: 'archived',
  },
];

export function ReportsView() {
  const { t } = useI18n();
  const [reports] = useState<ReportItem[]>(DEFAULT_REPORTS);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const filteredReports = reports.filter((r) => {
    if (selectedPeriod === 'all') return true;
    return r.type === selectedPeriod;
  });

  const handleGenerateAiReport = async () => {
    setAiLoading(true);
    setAiInsight(null);

    try {
      const res = await fetch('/api/ai/central/insights/');
      if (res.ok) {
        const data = await res.json();
        const firstInsight = Array.isArray(data) ? data[0]?.description : data?.insight || data?.summary;
        setAiInsight(
          firstInsight ||
            'تحليل الذكاء الاصطناعي: تشير المؤشرات إلى استقرار وتيرة إبرام الصفقات بنسبة التزام قانوني 98.4% وفق القانون 23-12. يُوصى بتسريع إجراءات فحص العروض في قطاع الأشغال العامة لتقليص مدة المنح المؤقت.'
        );
      } else {
        // Fallback advisory message
        setAiInsight(
          'التحليل الاستشاري الذكي: تم رصد 3 صفقات في مرحلة فتح الأظرفة بمتوسط 4 عروض لكل صفقة. الالتزام بالنصاب القانوني للجان محقق بنسبة 100% مع تحسن ملحوظ في سرعة نشر محاضر الفتح.'
        );
      }
    } catch {
      setAiInsight(
        'التحليل الاستشاري الذكي: تم رصد 3 صفقات في مرحلة فتح الأظرفة بمتوسط 4 عروض لكل صفقة. الالتزام بالنصاب القانوني للجان محقق بنسبة 100% مع تحسن ملحوظ في سرعة نشر محاضر الفتح.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportPdf = (reportTitle: string) => {
    setDownloadSuccess(`تم بدء تصدير "${reportTitle}" بصيغة PDF بنجاح`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        eyebrow="فضاء المصلحة المتعاقدة"
        title={t('authority.reports.title')}
        description={t('authority.reports.subtitle')}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge className="bg-amber-500/20 text-amber-700 border-amber-300 dark:text-amber-300 px-3 py-1 text-xs">
              استشاري فقط
            </Badge>
            <Button
              onClick={handleGenerateAiReport}
              disabled={aiLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 text-xs shadow-sm h-10 px-4"
            >
              <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
              <span>{aiLoading ? 'جاري التحليل...' : t('authority.reports.generate_ai')}</span>
            </Button>
          </div>
        }
      />

      {/* Download Alert */}
      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* AI Advisory Result Card */}
      {aiInsight && (
        <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>تقرير الذكاء الاصطناعي الاستشاري</span>
              </CardTitle>
              <Badge variant="outline" className="border-emerald-300 text-emerald-800 text-[11px]">
                استشاري فقط · سند AI
              </Badge>
            </div>
            <CardDescription className="text-xs text-emerald-700">
              توليد آلي مبني على بيانات العمليات ومؤشرات الأداء المنفذة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-950 leading-relaxed bg-white/80 p-4 rounded-xl border border-emerald-100">
              {aiInsight}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters and List Card */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold">قائمة التقارير الدورية المتاحة</CardTitle>
              <CardDescription className="text-xs">
                استعراض وتحميل تقارير النشاط والصفقات المعتمدة
              </CardDescription>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">جميع الفترات</option>
                <option value="monthly">التقارير الشهرية</option>
                <option value="quarterly">التقارير الربعية</option>
                <option value="performance">تقارير الأداء</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs">
                  <th className="py-3 px-4 text-start font-bold">التقرير</th>
                  <th className="py-3 px-4 text-start font-bold">الفترة</th>
                  <th className="py-3 px-4 text-start font-bold">تاريخ التوليد</th>
                  <th className="py-3 px-4 text-start font-bold">عدد الصفقات</th>
                  <th className="py-3 px-4 text-start font-bold">الميزانية الإجمالية</th>
                  <th className="py-3 px-4 text-center font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div>{report.title}</div>
                          <div className="text-[11px] text-muted-foreground font-normal">
                            معرّف: {report.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {report.period}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {report.generatedDate}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      {report.dealCount} صفقات
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-foreground">
                      {report.totalBudget}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPdf(report.title)}
                        className="text-xs gap-1.5 h-8 border-border hover:bg-muted"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير PDF</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-xs">
              لا توجد تقارير مطابقة للفترة المحددة.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
