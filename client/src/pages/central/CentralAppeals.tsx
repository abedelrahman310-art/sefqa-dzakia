import React, { useState, useEffect } from 'react';
import { PageHeader, KpiCard, AICard } from '@/shared/components';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Eye,
  FileCheck,
  FileX,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Lock,
  Copy,
  Check,
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
import { toast } from 'sonner';
import { objectionsApi } from '@/features/objections/api/objections';
import { GROUND_LABELS } from '@/features/objections/types';

interface AppealItem {
  id: string;
  reference: string;
  appellant: string;
  dealRef: string;
  dealTitle: string;
  reason: string;
  submittedDate: string;
  daysRemaining: number;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  aiLegitimacy: 'high' | 'investigate' | 'suspicious' | 'low';
  aiAnalysis: string;
  isLive?: boolean;
  checksum?: string;
}

const INITIAL_APPEALS: AppealItem[] = [
  {
    id: 'app-001',
    reference: 'REC-2026-0042',
    appellant: 'شركة الهدى للأشغال الكبرى (SARL EL HOUDA)',
    dealRef: 'DTP-DZ-2026-042',
    dealTitle: 'صيانة وتأهيل الطريق الوطني رقم 01',
    reason: 'إقصاء غير مبرر للعرض التقني رغم تقديم شهادات الكفاءة المطلوبة',
    submittedDate: '2026-10-08',
    daysRemaining: 4,
    status: 'active',
    aiLegitimacy: 'high',
    aiAnalysis:
      'تحليل AI: نسبة مشروعية الطعن 92%. شهادات الكفاءة مطابقة لدفتر الشروط، وتوجد قرينة قوية لخطأ في تنقيط معيار الخبرة من طرف لجنة التقييم.',
  },
  {
    id: 'app-002',
    reference: 'REC-2026-0038',
    appellant: 'مؤسسة البيئة لحلول الطاقة المستدامة',
    dealRef: 'DWH-DZ-2026-012',
    dealTitle: 'تجهيز المجمعات المدرسية بالطاقة الشمسية',
    reason: 'شبهة تجزئة الصفقة وتغيير معايير الاختيار بعد الإعلان',
    submittedDate: '2026-10-05',
    daysRemaining: 1,
    status: 'active',
    aiLegitimacy: 'investigate',
    aiAnalysis:
      'تحليل AI: يحتاج تحقيقاً استعجالياً. تعديل ملحق دفتر الشروط تم خارج الآجال القانونية المحددة في المادة 68 من القانون 23-12.',
  },
  {
    id: 'app-003',
    reference: 'REC-2026-0031',
    appellant: 'مجمع الأطلس للتجهيزات الطبية والجراحية',
    dealRef: 'MSP-DZ-2026-088',
    dealTitle: 'اقتناء معدات التصوير بالرنين المغناطيسي',
    reason: 'عدم مراعاة معيار بلد المنشأ والضمان الممتد لخمس سنوات',
    submittedDate: '2026-09-28',
    daysRemaining: 0,
    status: 'accepted',
    aiLegitimacy: 'high',
    aiAnalysis:
      'تحليل AI: طعن مشروع ومقبول بقرار لجنة الصفقات المركزية، وأمر بإعادة تقييم العروض التقنية.',
  },
  {
    id: 'app-004',
    reference: 'REC-2026-0029',
    appellant: 'سارل النور للتوريدات الإلكترونية',
    dealRef: 'EDU-DZ-2026-104',
    dealTitle: 'تطوير منصة رقمية لإدارة الأطروحات',
    reason: 'الطعن في السعر المنخفض غير العادي للعرض الفائز',
    submittedDate: '2026-09-20',
    daysRemaining: 0,
    status: 'rejected',
    aiLegitimacy: 'low',
    aiAnalysis:
      'تحليل AI: الطعن غير مبرر، قدم المتعامل الفائز تبريرات اقتصادية وقوائم أسعار رسمية مقبولة قانوناً.',
  },
  {
    id: 'app-005',
    reference: 'REC-2026-0022',
    appellant: 'مؤسسة الري الحديث والتهيئة السطحية',
    dealRef: 'HYD-DZ-2026-009',
    dealTitle: 'بناء خزان مائي سعة 5000 متر مكعب',
    reason: 'تجاوز أجل إيداع الطعن القانوني (10 أيام بعد النشر)',
    submittedDate: '2026-09-12',
    daysRemaining: 0,
    status: 'expired',
    aiLegitimacy: 'low',
    aiAnalysis: 'تحليل AI: الطعن منقضي الأجل الشكلي بقوة المادة 72 من القانون 23-12.',
  },
  {
    id: 'app-006',
    reference: 'REC-2026-0019',
    appellant: 'الشركة المغاربية للأشغال العامة',
    dealRef: 'AGR-DZ-2026-031',
    dealTitle: 'تهيئة المسالك الفلاحية بالجلفة',
    reason: 'ادعاء وجود تواطؤ وتضارب مصالح لأحد أعضاء لجنة الصفقات',
    submittedDate: '2026-10-09',
    daysRemaining: 5,
    status: 'active',
    aiLegitimacy: 'suspicious',
    aiAnalysis:
      'تحليل AI: رصد احتمال تواطؤ بنسبة 78%. عضو اللجنة يمتلك قرابة عائلية مع شريك في المؤسسة الحائزة على الإسناد المؤقت.',
  },
];

function getStatusBadge(status: AppealItem['status']) {
  switch (status) {
    case 'active':
      return <Badge className="bg-amber-50 text-amber-800 border-amber-300 font-bold">نشط قيد الدراسة</Badge>;
    case 'accepted':
      return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">مقبول</Badge>;
    case 'rejected':
      return <Badge className="bg-red-50 text-red-800 border-red-300">مرفوض</Badge>;
    case 'expired':
      return <Badge className="bg-slate-100 text-slate-700 border-slate-300">منتهي الأجل</Badge>;
    default:
      return <Badge variant="outline">غير محدد</Badge>;
  }
}

export function CentralAppeals() {
  const [appeals, setAppeals] = useState<AppealItem[]>(INITIAL_APPEALS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAppeal, setSelectedAppeal] = useState<AppealItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealObjections = async () => {
      try {
        setLoading(true);
        const live = await objectionsApi.list();
        if (live && live.length > 0) {
          const mapped: AppealItem[] = live.map((item) => {
            let status: AppealItem['status'] = 'active';
            if (item.status === 'accepted') status = 'accepted';
            else if (item.status === 'rejected') status = 'rejected';
            else if (item.status === 'withdrawn') status = 'expired';
            else status = 'active';

            return {
              id: item.id,
              reference: item.reference,
              appellant: item.objector_name || 'متعامل اقتصادي مسجل',
              dealRef: item.tender_reference || 'REF-N/A',
              dealTitle: item.tender_title || 'صفقة عمومية',
              reason:
                item.grounds?.map((g) => GROUND_LABELS[g] || g).join('، ') || 'طعن موضوعي',
              submittedDate: item.submitted_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              daysRemaining: item.days_remaining ?? 10,
              status,
              aiLegitimacy: item.is_within_deadline ? 'high' : 'low',
              aiAnalysis: `تحليل الذكاء الاصطناعي: طعن موثق ببصمة SHA-256 مشفرة (${item.checksum?.slice(0, 16)}...). المهلة القانونية: ${item.is_within_deadline ? 'مستوفاة ضمن 10 أيام من الإسناد' : 'منقضية الأجل'}.`,
              isLive: true,
              checksum: item.checksum,
            };
          });
          setAppeals([...mapped, ...INITIAL_APPEALS]);
        }
      } catch (err) {
        console.warn('Could not fetch live central objections, falling back to initial data');
      } finally {
        setLoading(false);
      }
    };
    fetchRealObjections();
  }, []);

  const filtered = appeals.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.reference.toLowerCase().includes(q) ||
        a.appellant.toLowerCase().includes(q) ||
        a.dealRef.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDecision = async (id: string, decision: 'accepted' | 'rejected') => {
    const target = appeals.find((a) => a.id === id);
    if (target?.isLive) {
      try {
        await objectionsApi.decide(id, {
          decision,
          reason:
            decision === 'accepted'
              ? 'قبول الطعن بقرار سلطة الرقابة المركزية وإلغاء الإسناد المؤقت.'
              : 'رفض الطعن لعدم ثبوت المخالفة وتثبيت الإسناد المؤقت.',
        });
        toast.success(
          decision === 'accepted'
            ? 'تم قبول الطعن وتوثيق إلغاء الإسناد في سجل التدقيق.'
            : 'تم رفض الطعن وتثبيت الإسناد في سجل التدقيق.'
        );
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'فشل تسجيل القرار في النظام المركزي.');
        return;
      }
    }

    setAppeals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision, daysRemaining: 0 } : item))
    );
    if (selectedAppeal && selectedAppeal.id === id) {
      setSelectedAppeal((prev) => (prev ? { ...prev, status: decision, daysRemaining: 0 } : null));
    }
    setActionMessage(
      decision === 'accepted'
        ? 'تم قبول الطعن رسمياً وإخطار المصلحة المتعاقدة بإلغاء الإسناد المؤقت وتوثيقه بسجل التدقيق.'
        : 'تم رفض الطعن رسمياً لعدم التأسيس القانوني وفق المادة 72 وتوثيقه بسجل التدقيق.'
    );
    setTimeout(() => setActionMessage(null), 4000);
  };

  const activeCount = appeals.filter((a) => a.status === 'active').length;
  const acceptedCount = appeals.filter((a) => a.status === 'accepted').length;
  const rejectedCount = appeals.filter((a) => a.status === 'rejected').length;
  const expiredCount = appeals.filter((a) => a.status === 'expired').length;

  return (
    <div className="space-y-6 page-container py-4">
      <PageHeader
        eyebrow="المراقبة الوطنية"
        title="الطعون على الإسناد"
        description="إدارة ومتابعة طعون المتعاملين الاقتصاديين في الإسناد المؤقت وفقاً لأحكام المادة 72 من القانون 23-12"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          eyebrow="طعون نشطة قيد البت"
          value={String(activeCount)}
          trend={2}
          trendLabel="خلال الآجال القانونية (10 أيام)"
          sparkline={[4, 5, 5, 6, 7, 7, activeCount]}
          icon={AlertTriangle}
          accent="navy"
        />
        <KpiCard
          eyebrow="طعون مقبولة"
          value={String(acceptedCount)}
          trend={5}
          trendLabel="أُعيد فيها التقييم"
          sparkline={[8, 9, 10, 11, 12, 13, acceptedCount]}
          icon={CheckCircle2}
          accent="emerald"
        />
        <KpiCard
          eyebrow="طعون مرفوضة"
          value={String(rejectedCount)}
          trend={-3}
          trendLabel="لعدم التأسيس الموضوعي"
          sparkline={[35, 33, 31, 30, 29, 29, rejectedCount]}
          icon={XCircle}
          accent="red"
        />
        <KpiCard
          eyebrow="طعون منتهية الأجل"
          value={String(expiredCount)}
          trend={0}
          trendLabel="سقطت لمرور الآجال"
          sparkline={[2, 3, 3, 3, 3, 3, 3]}
          icon={Clock}
          accent="gold"
        />
      </div>

      {/* AICard */}
      <AICard
        title="🤖 تحليل الذكاء الاصطناعي للطعون الوطنية"
        subtitle="تقييم استشاري أوتوماتيكي لمطابقة أسباب الطعون مع نصوص المادة 72 وشروط المنافسة"
      >
        <ul className="space-y-2.5 text-sm text-[var(--color-text-secondary)]">
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-200 text-emerald-950 font-medium">
            <span>✅</span>
            <span>
              <strong>5 طعون بناءً على أسباب مشروعة:</strong> توافر أدلة كتابية تثبت استيفاء المعايير التقنية التي تم إقصاؤها بشكل غير معلل.
            </span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-200 text-amber-950 font-medium">
            <span>⚠️</span>
            <span>
              <strong>2 طعون تحتاج تحقيقاً فورياً:</strong> ادعاءات بتعديل الشروط في مرحلة التقييم ومخالفة مبدأ المساواة.
            </span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-200 text-red-950 font-medium">
            <span>🚨</span>
            <span>
              <strong>احتمال تواطؤ في 1 طعن (REC-2026-0019):</strong> تقاطع مصالح موثق بين أحد أعضاء لجنة الصفقات وصاحب العرض الفائز.
            </span>
          </li>
        </ul>
      </AICard>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold animate-in fade-in">
          {actionMessage}
        </div>
      )}

      {/* Appeals Table Card */}
      <Card className="shadow-sm border border-[var(--color-border-subtle)] bg-[var(--card-bg)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
          <div>
            <CardTitle className="text-xl font-bold text-[var(--color-text-primary)]">
              سجل الطعون على الإسناد المؤقت
            </CardTitle>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              الطعون المودعة أمام لجنة الصفقات العمومية المختصة إقليمياً
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="size-4 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث برقم الطعن أو المتعامل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 pe-3 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
              aria-label="تصفية حالة الطعن"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشطة</option>
              <option value="accepted">مقبولة</option>
              <option value="rejected">مرفوضة</option>
              <option value="expired">منتهية الأجل</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">رقم الطعن</TableHead>
                <TableHead className="min-w-[200px]">المتعامل الطاعن</TableHead>
                <TableHead>الصفقة محل الطعن</TableHead>
                <TableHead className="min-w-[220px]">سبب الطعن</TableHead>
                <TableHead>تاريخ الإيداع</TableHead>
                <TableHead className="text-center">الأجل المتبقي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((appeal) => (
                <TableRow key={appeal.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-[var(--official-900)]">
                    {appeal.reference}
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-[var(--color-text-primary)]">
                    {appeal.appellant}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs font-semibold text-[var(--portal-primary)]">
                      {appeal.dealRef}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                      {appeal.dealTitle}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    {appeal.reason}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[var(--color-text-muted)]">
                    {appeal.submittedDate}
                  </TableCell>
                  <TableCell className="text-center">
                    {appeal.daysRemaining > 0 ? (
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        {appeal.daysRemaining} أيام
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(appeal.status)}</TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAppeal(appeal);
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
            <span>عرض {filtered.length} من أصل {appeals.length} طعون مسجلة</span>
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

      {/* Drill-down Appeal Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="end" className="sm:max-w-md p-6 bg-[var(--paper-50)] overflow-y-auto">
          {selectedAppeal && (
            <div className="space-y-6">
              <SheetHeader className="text-start border-b border-[var(--color-border-subtle)] pb-4">
                <span className="eyebrow">تفاصيل الطعن الإداري</span>
                <SheetTitle className="text-xl font-bold font-mono text-[var(--color-text-primary)]">
                  {selectedAppeal.reference}
                </SheetTitle>
                <SheetDescription className="text-xs text-[var(--color-text-secondary)] mt-1">
                  المتعامل الطاعن: {selectedAppeal.appellant}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                <div className="p-3.5 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)] space-y-1">
                  <div className="text-xs text-[var(--color-text-muted)]">الصفقة المعنية</div>
                  <div className="font-mono font-bold text-xs text-[var(--portal-primary)]">
                    {selectedAppeal.dealRef}
                  </div>
                  <div className="text-xs text-[var(--color-text-primary)]">{selectedAppeal.dealTitle}</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)] space-y-1">
                  <div className="text-xs text-[var(--color-text-muted)]">سبب وتأسيس الطعن</div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {selectedAppeal.reason}
                  </p>
                </div>

                {/* AI Insights on Appeal */}
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-purple-900">
                    <Sparkles className="size-4 text-purple-700" />
                    <span>تحليل الذكاء الاصطناعي للمشروعية (سند AI)</span>
                  </div>
                  <p className="text-xs text-purple-950 leading-relaxed">
                    {selectedAppeal.aiAnalysis}
                  </p>
                </div>

                {/* Audit Checksum if available */}
                {selectedAppeal.checksum && (
                  <div className="p-3.5 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)] space-y-1.5">
                    <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 font-medium">
                      <Lock className="size-3.5 text-primary" />
                      بصمة التدقيق المشفرة (SHA-256):
                    </div>
                    <code className="text-[11px] font-mono break-all text-slate-800 dark:text-slate-200 block bg-slate-50 dark:bg-slate-900/60 p-2 rounded border border-border/40">
                      {selectedAppeal.checksum}
                    </code>
                  </div>
                )}

                {/* Decision Actions */}
                {selectedAppeal.status === 'active' && (
                  <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2.5">
                    <div className="text-xs font-bold text-[var(--color-text-primary)]">
                      اتخاذ القرار الرقابي (المادة 72):
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Button
                        onClick={() => handleDecision(selectedAppeal.id, 'accepted')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5"
                      >
                        <FileCheck className="size-3.5" />
                        قبول الطعن
                      </Button>
                      <Button
                        onClick={() => handleDecision(selectedAppeal.id, 'rejected')}
                        variant="destructive"
                        className="text-xs h-9 gap-1.5"
                      >
                        <FileX className="size-3.5" />
                        رفض الطعن
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default CentralAppeals;
