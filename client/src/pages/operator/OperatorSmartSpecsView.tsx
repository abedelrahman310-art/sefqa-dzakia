import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, extractApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  RefreshCw,
  FileText,
  FileDown,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardList,
  Clock3,
  ListChecks,
} from 'lucide-react';

/**
 * دفاتر الشروط والتحليل الذكي — بوابة المتعامل الاقتصادي.
 *
 * المصادر الحقيقية:
 * - GET  /api/procurements/deals/            قائمة الصفقات (بما فيها cahier_specs)
 * - GET  /api/procurements/deals/{id}/specs-pdf/  تحميل دفتر الشروط PDF (مولّد في الخادم)
 * - POST /api/ai/analyze-tender/             تحليل ذكي استشاري (deal_id)
 * - POST /api/operator/check-compliance/     فحص توافق الملف (deal_id)
 */

interface SpecDeal {
  id: string;
  reference: string;
  title: string;
  description: string;
  authorityName: string;
  budget: number | null;
  deadline: string | null;
  specsValidated: boolean;
  specsCreatedAt: string | null;
}

interface AnalysisResult {
  summary?: string;
  qualification_conditions?: unknown;
  deadlines?: unknown;
  guarantees?: unknown;
  evaluation_criteria?: unknown;
  warnings?: unknown;
  model_used?: string;
  is_advisory?: boolean;
}

interface MissingDocument {
  code?: string;
  name?: string;
  category?: string;
  legal_ref?: string;
  is_mandatory?: boolean;
}

interface ComplianceResult {
  deal_reference?: string;
  deal_title?: string;
  is_compliant?: boolean;
  compliance_score?: number;
  total_required?: number;
  submitted_count?: number;
  missing_count?: number;
  missing_documents?: MissingDocument[];
  advisory_notes?: string[];
  submission_deadline?: string | null;
}

const numberFormatter = new Intl.NumberFormat('ar-DZ-u-nu-latn', { maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat('ar-DZ-u-nu-latn', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatBudget(value: number | null): string {
  return value === null ? '—' : `${numberFormatter.format(Math.round(value))} دج`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateFormatter.format(parsed);
}

/** تحويل أي مصفوفة قادمة من الخادم إلى نصوص قابلة للعرض. */
function asTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const candidate = record.label ?? record.name ?? record.description ?? record.text;
        if (typeof candidate === 'string') return candidate;
        try {
          return JSON.stringify(item);
        } catch {
          return '';
        }
      }
      return String(item ?? '');
    })
    .filter((text) => text.trim() !== '');
}

export function OperatorSmartSpecsView() {
  const [specs, setSpecs] = useState<SpecDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisTarget, setAnalysisTarget] = useState<SpecDeal | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  const [complianceOpen, setComplianceOpen] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceTarget, setComplianceTarget] = useState<SpecDeal | null>(null);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [complianceError, setComplianceError] = useState('');

  const loadSpecs = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const { data } = await api.get<unknown>('/procurements/deals/');
      const list = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : (((data as { results?: Record<string, unknown>[] })?.results ?? []) as Record<string, unknown>[]);

      const mapped: SpecDeal[] = list
        .filter((deal) => Boolean(deal.cahier_specs))
        .filter((deal) => Number(deal.current_stage ?? 0) >= 3)
        .map((deal) => {
          const specsData = (deal.cahier_specs ?? {}) as Record<string, unknown>;
          return {
            id: String(deal.id),
            reference: String(deal.reference_number ?? '—'),
            title: String(deal.title ?? 'صفقة بدون عنوان'),
            description: String(deal.description ?? ''),
            authorityName: String(deal.authority_entity || deal.authority_name || 'مصلحة متعاقدة'),
            budget: toNumber(deal.estimated_budget),
            deadline: (deal.submission_deadline as string | null) ?? null,
            specsValidated: Boolean(specsData.is_validated),
            specsCreatedAt: (specsData.created_at as string | null) ?? null,
          };
        });

      setSpecs(mapped);
    } catch (err) {
      const message = extractApiErrorMessage(err);
      setError(message);
      setSpecs([]);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSpecs();
  }, [loadSpecs]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return specs;
    return specs.filter(
      (spec) =>
        spec.title.toLowerCase().includes(query) ||
        spec.reference.toLowerCase().includes(query) ||
        spec.authorityName.toLowerCase().includes(query) ||
        spec.description.toLowerCase().includes(query),
    );
  }, [specs, searchQuery]);

  const downloadSpecs = async (spec: SpecDeal) => {
    setDownloadingId(spec.id);
    try {
      const response = await api.get<Blob>(`/procurements/deals/${spec.id}/specs-pdf/`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cahier_des_charges_${spec.reference.replace(/[^\w-]+/g, '_')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast.success('تم تحميل دفتر الشروط بصيغة PDF.');
    } catch (err) {
      toast.error(extractApiErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  };

  const runAnalysis = async (spec: SpecDeal) => {
    setAnalysisTarget(spec);
    setAnalysis(null);
    setAnalysisError('');
    setAnalysisOpen(true);
    setAnalysisLoading(true);

    try {
      const { data } = await api.post<AnalysisResult>('/ai/analyze-tender/', { deal_id: spec.id });
      setAnalysis(data ?? {});
    } catch (err) {
      const message = extractApiErrorMessage(err);
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const runCompliance = async (spec: SpecDeal) => {
    setComplianceTarget(spec);
    setCompliance(null);
    setComplianceError('');
    setComplianceOpen(true);
    setComplianceLoading(true);

    try {
      const { data } = await api.post<ComplianceResult>('/operator/check-compliance/', {
        deal_id: spec.id,
      });
      setCompliance(data ?? {});
    } catch (err) {
      const message = extractApiErrorMessage(err);
      setComplianceError(message);
      toast.error(message);
    } finally {
      setComplianceLoading(false);
    }
  };

  const analysisSections: Array<{ key: string; title: string; icon: typeof Clock3; items: string[] }> =
    analysis
      ? [
          { key: 'deadlines', title: 'الآجال الحرجة', icon: Clock3, items: asTextList(analysis.deadlines) },
          { key: 'guarantees', title: 'الضمانات المطلوبة', icon: ShieldCheck, items: asTextList(analysis.guarantees) },
          {
            key: 'criteria',
            title: 'معايير التقييم',
            icon: ListChecks,
            items: asTextList(analysis.evaluation_criteria),
          },
          {
            key: 'qualification',
            title: 'شروط التأهيل',
            icon: ClipboardList,
            items: asTextList(analysis.qualification_conditions),
          },
          { key: 'warnings', title: 'تنبيهات الإقصاء', icon: AlertTriangle, items: asTextList(analysis.warnings) },
        ].filter((section) => section.items.length > 0)
      : [];

  const hasAnalysisContent =
    Boolean(analysis?.summary && analysis.summary.trim() !== '') || analysisSections.length > 0;

  return (
    <div className="op-page bg-white" dir="rtl">
      {/* رأس الصفحة */}
      <div className="op-page-head">
        <div>
          <h1>دفاتر الشروط والتحليل الذكي</h1>
          <p>افهم الصفقة قبل التقديم: اقرأ دفتر الشروط، حلّل شروطه بالذكاء الاصطناعي، وافحص توافق ملفك.</p>
        </div>
        <div className="op-page-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSpecs(true)}
            disabled={refreshing}
            className="gap-2 text-sm"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshing ? 'جاري التحديث…' : 'تحديث القائمة'}
          </Button>
        </div>
      </div>

      {/* شريط البحث */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحث برقم الصفقة أو عنوانها أو الجهة المتعاقدة…"
            aria-label="بحث في دفاتر الشروط"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white ps-10 pe-3 text-sm text-[var(--op-ink)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--op-blue)]/30"
          />
        </div>
        <span className="text-sm font-semibold text-[var(--op-muted)]">
          {numberFormatter.format(filtered.length)} دفتر شروط
        </span>
      </div>

      {error && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <Button variant="outline" size="sm" onClick={() => void loadSpecs()} className="h-8 text-sm">
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* المحتوى */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="op-skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <FileText className="size-10 text-gray-300" aria-hidden="true" />
          <h3 className="text-base font-bold text-[var(--op-ink)]">
            {searchQuery ? 'لا نتائج مطابقة لبحثك' : 'لا توجد دفاتر شروط منشورة حالياً'}
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-[var(--op-muted)]">
            {searchQuery
              ? 'جرّب تعديل كلمات البحث أو إلغاء التصفية.'
              : 'ستظهر هنا دفاتر الشروط فور نشرها من المصلحة المتعاقدة، مع إمكانية تحميلها وتحليلها آلياً.'}
          </p>
          {searchQuery && (
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="mt-1 text-sm">
              إلغاء البحث
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((spec) => (
            <Card
              key={spec.id}
              className="flex h-full flex-col rounded-xl border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="op-chip gold op-mono" title="رقم الصفقة">
                  {spec.reference}
                </span>
                <Badge
                  variant="outline"
                  className={
                    spec.specsValidated
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-amber-300 bg-amber-50 text-amber-800'
                  }
                >
                  {spec.specsValidated ? 'معتمد' : 'قيد المراجعة'}
                </Badge>
              </div>

              <h3
                className="line-clamp-2 text-base font-bold leading-snug text-[var(--op-ink)]"
                title={spec.title}
              >
                {spec.title}
              </h3>
              {spec.description && (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--op-muted)]">
                  {spec.description}
                </p>
              )}

              <dl className="mt-3 grid gap-1.5 text-sm text-[var(--op-text)]">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 shrink-0 text-[var(--op-muted)]" aria-hidden="true" />
                  <dt className="sr-only">الجهة المتعاقدة</dt>
                  <dd className="line-clamp-1">{spec.authorityName}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 shrink-0 text-[var(--op-muted)]" aria-hidden="true" />
                  <dt className="sr-only">الميزانية</dt>
                  <dd className="tabular-nums">{formatBudget(spec.budget)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 shrink-0 text-[var(--op-muted)]" aria-hidden="true" />
                  <dt className="sr-only">آخر أجل</dt>
                  <dd className="tabular-nums">{formatDate(spec.deadline)}</dd>
                </div>
              </dl>

              <div className="mt-4 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void downloadSpecs(spec)}
                  disabled={downloadingId === spec.id}
                  className="w-full justify-center gap-2 text-sm"
                >
                  {downloadingId === spec.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <FileDown className="size-4" aria-hidden="true" />
                  )}
                  {downloadingId === spec.id ? 'جاري التحميل…' : 'تحميل دفتر الشروط'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => void runAnalysis(spec)}
                    className="w-full justify-center gap-1.5 bg-[#0f3154] text-sm font-bold text-white hover:bg-[#0b2743]"
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    تحليل ذكي
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void runCompliance(spec)}
                    className="w-full justify-center gap-1.5 text-sm font-bold"
                  >
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    فحص التوافق
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* نافذة التحليل الذكي */}
      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="size-5 text-[#0f3154]" aria-hidden="true" />
              التحليل الذكي لدفتر الشروط
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {analysisTarget
                ? `${analysisTarget.reference} — ${analysisTarget.title}`
                : 'تحليل استشاري آلي لدفتر الشروط.'}
            </DialogDescription>
          </DialogHeader>

          {analysisLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-gray-500">
              <Loader2 className="size-8 animate-spin text-[#0f3154]" aria-hidden="true" />
              جارٍ تحليل دفتر الشروط… قد يستغرق بضع ثوانٍ.
            </div>
          ) : analysisError ? (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {analysisError}
              </div>
              {analysisTarget && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => void runAnalysis(analysisTarget)}
                >
                  إعادة المحاولة
                </Button>
              )}
            </div>
          ) : !hasAnalysisContent ? (
            <p className="py-8 text-center text-sm text-gray-500">
              لم يُرجع الخادم محتوى تحليلاً لهذه الصفقة حالياً.
            </p>
          ) : (
            <div className="space-y-5 py-2">
              {analysis?.summary && (
                <section className="rounded-xl border border-[#0f3154]/15 bg-[#0f3154]/[0.03] p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0f3154]">
                    <FileText className="size-4" aria-hidden="true" />
                    الملخص التنفيذي
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-700">{analysis.summary}</p>
                </section>
              )}

              {analysisSections.map((section) => {
                const Icon = section.icon;
                const isWarning = section.key === 'warnings';
                return (
                  <section
                    key={section.key}
                    className={`rounded-xl border p-4 ${
                      isWarning ? 'border-red-200 bg-red-50/60' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <h4
                      className={`mb-2 flex items-center gap-2 text-sm font-bold ${
                        isWarning ? 'text-red-800' : 'text-[var(--op-ink)]'
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {section.title}
                    </h4>
                    <ul className="space-y-1.5">
                      {section.items.map((item, index) => (
                        <li
                          key={`${section.key}-${index}`}
                          className={`flex gap-2 text-sm leading-relaxed ${
                            isWarning ? 'text-red-900' : 'text-gray-700'
                          }`}
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current opacity-50" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}

              <p className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                هذا التحليل استشاري آلي ولا يُغني عن قراءة دفتر الشروط الأصلي ولا عن قرار لجنة الصفقات.
                {analysis?.model_used ? ` (المحرك: ${analysis.model_used})` : ''}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة فحص التوافق */}
      <Dialog open={complianceOpen} onOpenChange={setComplianceOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck className="size-5 text-[#0f3154]" aria-hidden="true" />
              فحص توافق الملف
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {complianceTarget
                ? `${complianceTarget.reference} — ${complianceTarget.title}`
                : 'فحص الوثائق الأساسية المطلوبة قانوناً.'}
            </DialogDescription>
          </DialogHeader>

          {complianceLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-gray-500">
              <Loader2 className="size-8 animate-spin text-[#0f3154]" aria-hidden="true" />
              جارٍ فحص وثائق ملفك…
            </div>
          ) : complianceError ? (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {complianceError}
              </div>
              {complianceTarget && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => void runCompliance(complianceTarget)}
                >
                  إعادة المحاولة
                </Button>
              )}
            </div>
          ) : compliance ? (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-5">
                <span className="text-sm font-semibold text-gray-500">نسبة التوافق</span>
                <span
                  className={`text-4xl font-bold tabular-nums ${
                    compliance.is_compliant ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {numberFormatter.format(Number(compliance.compliance_score ?? 0))}%
                </span>
                <span className="text-xs text-gray-500">
                  الوثائق المتوفرة {numberFormatter.format(Number(compliance.submitted_count ?? 0))} من{' '}
                  {numberFormatter.format(Number(compliance.total_required ?? 0))}
                </span>
              </div>

              {compliance.is_compliant ? (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  ملفك متوافق وجاهز.
                </div>
              ) : (
                <section className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-red-800">
                    <XCircle className="size-4" aria-hidden="true" />
                    وثائق ناقصة ({numberFormatter.format(Number(compliance.missing_count ?? 0))})
                  </h4>
                  <ul className="space-y-2">
                    {(compliance.missing_documents ?? []).map((doc, index) => (
                      <li
                        key={doc.code ?? `${index}`}
                        className="rounded-lg border border-red-200 bg-white p-3 text-sm"
                      >
                        <p className="font-bold text-red-900">{doc.name ?? doc.code ?? 'وثيقة مطلوبة'}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {doc.category && <span>{doc.category}</span>}
                          {doc.legal_ref && <span className="op-chip">{doc.legal_ref}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {Array.isArray(compliance.advisory_notes) && compliance.advisory_notes.length > 0 && (
                <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                    <ListChecks className="size-4" aria-hidden="true" />
                    ملاحظات إرشادية
                  </h4>
                  <ul className="space-y-1.5">
                    {compliance.advisory_notes.map((note, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OperatorSmartSpecsView;
