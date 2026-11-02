import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
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
  Lightbulb,
  ArrowUpRight,
} from 'lucide-react';

/**
 * Smart Specs & AI Analysis - Economic Operator Portal.
 * Redesigned in Antigravity UI Style (Glassmorphism, Floating 3D Elements, Deep Soft Shadows, Smooth Motion).
 *
 * Endpoints:
 * - GET  /api/procurements/deals/
 * - GET  /api/procurements/deals/{id}/specs-pdf/
 * - POST /api/ai/analyze-tender/
 * - POST /api/operator/check-compliance/
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
  recommendations?: unknown;
  model_used?: string;
  is_advisory?: boolean;
}

type AnalysisSection = {
  key: string;
  title: string;
  icon: typeof Clock3;
  tone: 'default' | 'warning' | 'success' | 'info';
  items: string[];
};

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

function formatBudget(value: number | null, currencyLabel = 'DZD'): string {
  return value === null ? '—' : `${numberFormatter.format(Math.round(value))} ${currencyLabel}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateFormatter.format(parsed);
}

/** Convert array into presentable text list */
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
  const { t, dir } = useI18n();
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

  const loadSpecs = useCallback(
    async (refresh = false) => {
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
              title: String(deal.title ?? t('operator.specs.deal_untitled')),
              description: String(deal.description ?? ''),
              authorityName: String(
                deal.authority_entity || deal.authority_name || t('operator.specs.authority_fallback'),
              ),
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
    },
    [t],
  );

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
      toast.success(t('operator.specs.toast_pdf_downloaded'));
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

  const analysisSections: AnalysisSection[] = analysis
    ? ([
        {
          key: 'deadlines',
          title: t('operator.specs.card_deadlines'),
          icon: Clock3,
          tone: 'info',
          items: asTextList(analysis.deadlines),
        },
        {
          key: 'guarantees',
          title: t('operator.specs.card_guarantees'),
          icon: ShieldCheck,
          tone: 'default',
          items: asTextList(analysis.guarantees),
        },
        {
          key: 'criteria',
          title: t('operator.specs.card_eval_criteria'),
          icon: ListChecks,
          tone: 'default',
          items: asTextList(analysis.evaluation_criteria),
        },
        {
          key: 'qualification',
          title: t('operator.specs.card_qualif_conditions'),
          icon: ClipboardList,
          tone: 'default',
          items: asTextList(analysis.qualification_conditions),
        },
        {
          key: 'warnings',
          title: t('operator.specs.card_warnings'),
          icon: AlertTriangle,
          tone: 'warning',
          items: asTextList(analysis.warnings),
        },
        {
          key: 'recommendations',
          title: t('operator.specs.card_recommendations'),
          icon: Lightbulb,
          tone: 'success',
          items: asTextList(analysis.recommendations),
        },
      ] satisfies AnalysisSection[]).filter((section) => section.items.length > 0)
    : [];

  const hasAnalysisContent =
    Boolean(analysis?.summary && analysis.summary.trim() !== '') || analysisSections.length > 0;

  return (
    <div
      className="relative min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/25 to-emerald-50/20 p-4 sm:p-6 lg:p-8 overflow-hidden font-sans"
      dir={dir}
    >
      {/* Antigravity Ambient Blur Orbs */}
      <div
        className="pointer-events-none absolute -top-32 -start-32 size-96 rounded-full bg-gradient-to-tr from-sky-400/15 to-blue-600/15 blur-3xl animate-antigravity-float-slow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -end-32 size-96 rounded-full bg-gradient-to-tr from-emerald-400/15 to-teal-600/15 blur-3xl animate-antigravity-float-reverse"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 end-1/4 size-80 rounded-full bg-indigo-400/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Floating Header Card */}
      <div className="relative z-10 mb-6 rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[0_10px_35px_-5px_rgba(15,23,42,0.05),0_0_1px_1px_rgba(255,255,255,0.8)_inset] backdrop-blur-xl transition-all">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0f3154] to-sky-600 text-white shadow-lg shadow-[#0f3154]/20 animate-antigravity-float">
              <Sparkles className="size-6 text-sky-200" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                {t('operator.specs.main_title')}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {t('operator.specs.main_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadSpecs(true)}
              disabled={refreshing}
              className="gap-2 rounded-xl border-white/80 bg-white/80 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white hover:text-slate-900 hover:shadow-md transition-all active:scale-95"
            >
              <RefreshCw className={`size-3.5 sm:size-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              {refreshing ? t('operator.specs.btn_refreshing') : t('operator.specs.btn_refresh')}
            </Button>
          </div>
        </div>

        {/* Floating Search Bar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('operator.specs.search_ph')}
              aria-label={t('operator.specs.search_aria')}
              className="h-11 w-full rounded-2xl border border-white/80 bg-white/90 ps-10 pe-4 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 shadow-sm backdrop-blur-md focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 transition-all"
            />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-xs font-bold text-sky-800 shadow-xs backdrop-blur-sm self-start sm:self-center">
            <span className="size-2 rounded-full bg-sky-500 animate-pulse" aria-hidden="true" />
            {numberFormatter.format(filtered.length)} {t('operator.specs.count_specs')}
          </span>
        </div>
      </div>

      {error && (
        <div className="relative z-10 mb-6 flex items-center justify-between gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-xs sm:text-sm text-rose-800 shadow-sm backdrop-blur-md animate-in fade-in-50">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-600" aria-hidden="true" />
            {error}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSpecs()}
            className="h-8 rounded-xl border-rose-300 bg-white text-xs text-rose-700 hover:bg-rose-50"
          >
            {t('operator.specs.btn_retry')}
          </Button>
        </div>
      )}

      {/* Grid of Floating Spec Cards */}
      {loading ? (
        <div className="relative z-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-64 rounded-3xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-md animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="relative z-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300/80 bg-white/60 px-6 py-20 text-center shadow-sm backdrop-blur-xl">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-400 shadow-inner">
            <FileText className="size-7" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchQuery ? t('operator.specs.empty_search') : t('operator.specs.empty_none')}
          </h3>
          <p className="max-w-md text-xs sm:text-sm leading-relaxed text-slate-500">
            {searchQuery ? t('operator.specs.empty_search_hint') : t('operator.specs.empty_none_hint')}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-2 rounded-xl border-slate-200 bg-white text-xs font-semibold"
            >
              {t('operator.specs.btn_cancel_search')}
            </Button>
          )}
        </div>
      ) : (
        <div className="relative z-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((spec) => (
            <Card
              key={spec.id}
              className="group relative flex h-full flex-col justify-between rounded-3xl border border-white/80 bg-white/80 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04),0_0_1px_1px_rgba(255,255,255,0.9)_inset] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-10px_rgba(15,49,84,0.12),0_0_1px_1px_rgba(255,255,255,1)_inset]"
            >
              <div>
                {/* Card Header Chips */}
                <div className="mb-3.5 flex items-start justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 font-mono text-xs font-bold text-amber-900 shadow-xs backdrop-blur-sm"
                    title={t('operator.specs.chip_ref_title')}
                  >
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    {spec.reference}
                  </span>

                  <Badge
                    variant="outline"
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm transition-all ${
                      spec.specsValidated
                        ? 'border-emerald-300/80 bg-emerald-50/80 text-emerald-800 shadow-xs'
                        : 'border-amber-300/80 bg-amber-50/80 text-amber-800 shadow-xs'
                    }`}
                  >
                    {spec.specsValidated ? t('operator.specs.badge_validated') : t('operator.specs.badge_review')}
                  </Badge>
                </div>

                {/* Title & Desc */}
                <h3
                  className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-sky-900"
                  title={spec.title}
                >
                  {spec.title}
                </h3>
                {spec.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-500">
                    {spec.description}
                  </p>
                )}

                {/* Specs Metadata */}
                <dl className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <dt className="sr-only">{t('operator.specs.dt_authority')}</dt>
                    <dd className="line-clamp-1 font-medium">{spec.authorityName}</dd>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Wallet className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <dt className="sr-only">{t('operator.specs.dt_budget')}</dt>
                    <dd className="tabular-nums font-semibold text-slate-900">
                      {formatBudget(spec.budget, t('operator.specs.currency_dzd'))}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <dt className="sr-only">{t('operator.specs.dt_deadline')}</dt>
                    <dd className="tabular-nums text-slate-600">{formatDate(spec.deadline)}</dd>
                  </div>
                </dl>
              </div>

              {/* Floating Action Buttons */}
              <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void downloadSpecs(spec)}
                  disabled={downloadingId === spec.id}
                  className="w-full justify-center gap-2 rounded-xl border-slate-200 bg-white/90 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  {downloadingId === spec.id ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <FileDown className="size-3.5 text-slate-500" aria-hidden="true" />
                  )}
                  {downloadingId === spec.id ? t('operator.specs.btn_downloading') : t('operator.specs.btn_download')}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => void runAnalysis(spec)}
                    className="w-full justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0f3154] to-sky-800 text-xs font-bold text-white shadow-md shadow-[#0f3154]/20 hover:from-[#0b2743] hover:to-sky-900 hover:shadow-lg hover:shadow-[#0f3154]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    <Sparkles className="size-3.5 text-sky-200" aria-hidden="true" />
                    {t('operator.specs.btn_ai_analysis')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void runCompliance(spec)}
                    className="w-full justify-center gap-1.5 rounded-xl border-slate-200 bg-white/90 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
                    {t('operator.specs.btn_check_compliance')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Antigravity AI Analysis Dialog */}
      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent
          className="max-h-[88vh] max-w-3xl overflow-y-auto rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
          dir={dir}
        >
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0f3154] to-sky-600 text-white shadow-md shadow-sky-500/20 animate-antigravity-float">
                <Sparkles className="size-5 text-sky-200" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {t('operator.specs.modal_ai_title')}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 line-clamp-1">
                  {analysisTarget
                    ? `${analysisTarget.reference} — ${analysisTarget.title}`
                    : t('operator.specs.modal_ai_desc')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {analysisLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-xs sm:text-sm text-slate-500">
              <div className="relative flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              </div>
              <p className="font-semibold text-slate-700">{t('operator.specs.modal_ai_loading')}</p>
            </div>
          ) : analysisError ? (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-xs sm:text-sm text-rose-800 shadow-sm backdrop-blur-sm">
                <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
                <span>{analysisError}</span>
              </div>
              {analysisTarget && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                  onClick={() => void runAnalysis(analysisTarget)}
                >
                  {t('operator.specs.btn_retry')}
                </Button>
              )}
            </div>
          ) : !hasAnalysisContent ? (
            <p className="py-12 text-center text-xs sm:text-sm text-slate-500">
              {t('operator.specs.modal_ai_empty')}
            </p>
          ) : (
            <div className="space-y-4 py-3">
              {/* Executive Summary Card */}
              {analysis?.summary && (
                <section className="rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50/50 via-white/40 to-blue-50/30 p-4 sm:p-5 shadow-[0_8px_30px_rgb(14,165,233,0.04)] backdrop-blur-md">
                  <h4 className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-bold text-sky-950">
                    <FileText className="size-4 text-sky-600" aria-hidden="true" />
                    {t('operator.specs.modal_ai_summary')}
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 font-medium">
                    {analysis.summary}
                  </p>
                </section>
              )}

              {/* Analysis Cards (Antigravity Floating Panels) */}
              {analysisSections.map((section) => {
                const Icon = section.icon;
                const isWarning = section.tone === 'warning';
                const isSuccess = section.tone === 'success';
                const isInfo = section.tone === 'info';

                let cardStyle =
                  'border-slate-200/80 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-md';
                let headerStyle = 'text-slate-900';
                let iconStyle = 'text-indigo-600';
                let itemStyle = 'text-slate-700';

                if (isWarning) {
                  cardStyle =
                    'border-rose-200/80 bg-rose-50/60 shadow-[0_8px_30px_rgb(244,63,94,0.06)]';
                  headerStyle = 'text-rose-950 font-bold';
                  iconStyle = 'text-rose-600';
                  itemStyle = 'text-rose-900';
                } else if (isSuccess) {
                  cardStyle =
                    'border-emerald-200/80 bg-emerald-50/60 shadow-[0_8px_30px_rgb(16,185,129,0.06)]';
                  headerStyle = 'text-emerald-950 font-bold';
                  iconStyle = 'text-emerald-600';
                  itemStyle = 'text-emerald-900';
                } else if (isInfo) {
                  cardStyle =
                    'border-sky-200/80 bg-sky-50/50 shadow-[0_8px_30px_rgb(14,165,233,0.06)]';
                  headerStyle = 'text-sky-950 font-bold';
                  iconStyle = 'text-sky-600';
                  itemStyle = 'text-slate-800';
                }

                return (
                  <section
                    key={section.key}
                    className={`rounded-2xl border p-4 sm:p-5 backdrop-blur-md transition-all duration-200 ${cardStyle}`}
                  >
                    <h4 className={`mb-3 flex items-center gap-2 text-xs sm:text-sm ${headerStyle}`}>
                      <Icon className={`size-4 shrink-0 ${iconStyle}`} aria-hidden="true" />
                      <span>{section.title}</span>
                    </h4>
                    <ul className="space-y-2">
                      {section.items.map((item, index) => (
                        <li
                          key={`${section.key}-${index}`}
                          className={`flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed ${itemStyle}`}
                        >
                          <span
                            className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                              isWarning
                                ? 'bg-rose-500'
                                : isSuccess
                                  ? 'bg-emerald-500'
                                  : isInfo
                                    ? 'bg-sky-500'
                                    : 'bg-indigo-400'
                            }`}
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}

              {/* Sovereign & Zero-Paper Disclaimer */}
              <p className="flex items-start gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-xs sm:text-xs leading-relaxed text-slate-500 backdrop-blur-sm">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <span>
                  {t('operator.specs.modal_ai_disclaimer')}
                  {analysis?.model_used ? ` (${t('operator.specs.engine_label')}: ${analysis.model_used})` : ''}
                </span>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Antigravity Compliance Dialog */}
      <Dialog open={complianceOpen} onOpenChange={setComplianceOpen}>
        <DialogContent
          className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
          dir={dir}
        >
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 animate-antigravity-float">
                <ShieldCheck className="size-5 text-emerald-100" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {t('operator.specs.modal_comp_title')}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 line-clamp-1">
                  {complianceTarget
                    ? `${complianceTarget.reference} — ${complianceTarget.title}`
                    : t('operator.specs.modal_comp_desc')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {complianceLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-xs sm:text-sm text-slate-500">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              </div>
              <p className="font-semibold text-slate-700">{t('operator.specs.modal_comp_loading')}</p>
            </div>
          ) : complianceError ? (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-xs sm:text-sm text-rose-800 shadow-sm backdrop-blur-sm">
                <XCircle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
                <span>{complianceError}</span>
              </div>
              {complianceTarget && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                  onClick={() => void runCompliance(complianceTarget)}
                >
                  {t('operator.specs.btn_retry')}
                </Button>
              )}
            </div>
          ) : compliance ? (
            <div className="space-y-4 py-3">
              {/* Compliance Score Gauge Card */}
              <div className="relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-b from-white/90 to-slate-50/80 p-6 shadow-sm backdrop-blur-xl">
                <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                  {t('operator.specs.modal_comp_ratio')}
                </span>
                <span
                  className={`font-mono text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight ${
                    compliance.is_compliant ? 'text-emerald-600' : 'text-amber-500'
                  }`}
                >
                  {numberFormatter.format(Number(compliance.compliance_score ?? 0))}%
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {t('operator.specs.modal_comp_available_docs')}{' '}
                  <strong className="text-slate-800">
                    {numberFormatter.format(Number(compliance.submitted_count ?? 0))}
                  </strong>{' '}
                  {t('common.of')}{' '}
                  <strong className="text-slate-800">
                    {numberFormatter.format(Number(compliance.total_required ?? 0))}
                  </strong>
                </span>
              </div>

              {compliance.is_compliant ? (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-xs sm:text-sm font-semibold text-emerald-900 shadow-sm backdrop-blur-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{t('operator.specs.modal_comp_ready')}</span>
                </div>
              ) : (
                <section className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 sm:p-5 shadow-[0_8px_30px_rgb(244,63,94,0.05)] backdrop-blur-sm">
                  <h4 className="mb-3 flex items-center gap-2 text-xs sm:text-sm font-bold text-rose-950">
                    <XCircle className="size-4 text-rose-600" aria-hidden="true" />
                    <span>
                      {t('operator.specs.modal_comp_missing_docs')} (
                      {numberFormatter.format(Number(compliance.missing_count ?? 0))})
                    </span>
                  </h4>
                  <ul className="space-y-2">
                    {(compliance.missing_documents ?? []).map((doc, index) => (
                      <li
                        key={doc.code ?? `${index}`}
                        className="rounded-xl border border-rose-200/70 bg-white/90 p-3 text-xs sm:text-sm shadow-xs backdrop-blur-sm"
                      >
                        <p className="font-bold text-rose-950">
                          {doc.name ?? doc.code ?? t('operator.specs.modal_comp_doc_fallback')}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {doc.category && <span>{doc.category}</span>}
                          {doc.legal_ref && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-slate-600">
                              {doc.legal_ref}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {Array.isArray(compliance.advisory_notes) && compliance.advisory_notes.length > 0 && (
                <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 sm:p-5 shadow-xs backdrop-blur-sm">
                  <h4 className="mb-2.5 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
                    <ListChecks className="size-4 text-sky-600" aria-hidden="true" />
                    <span>{t('operator.specs.modal_comp_guidance')}</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {compliance.advisory_notes.map((note, index) => (
                      <li key={index} className="flex gap-2 text-xs sm:text-sm leading-relaxed text-slate-700">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-400" aria-hidden="true" />
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

      {/* Antigravity Motion Keyframe Styles */}
      <style>{`
        @keyframes antigravity-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes antigravity-float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-14px) rotate(4deg);
          }
        }
        @keyframes antigravity-float-reverse {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(14px) rotate(-4deg);
          }
        }
        .animate-antigravity-float {
          animation: antigravity-float 4s ease-in-out infinite;
        }
        .animate-antigravity-float-slow {
          animation: antigravity-float-slow 9s ease-in-out infinite;
        }
        .animate-antigravity-float-reverse {
          animation: antigravity-float-reverse 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default OperatorSmartSpecsView;
