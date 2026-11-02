import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n, type TranslationKey } from '@/i18n';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { analyzeTender } from '@/features/ai/api/ai';
import type { TenderAnalysisResponse, TenderAnalysisSeverity } from '@/features/ai/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  Building,
  Calendar,
  CheckCircle2,
  FileSearch,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  authorityName: string;
  updatedAt: string;
  hasDocument: boolean;
}

const SEVERITY_STYLES: Record<TenderAnalysisSeverity, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-950',
  medium: 'border-amber-200 bg-amber-50 text-amber-950',
  low: 'border-sky-200 bg-sky-50 text-sky-950',
};

const SEVERITY_LABEL_KEYS: Record<TenderAnalysisSeverity, TranslationKey> = {
  high: 'operator.opp.severity_high',
  medium: 'operator.opp.severity_medium',
  low: 'operator.opp.severity_low',
};

const getAnalysisErrorMessage = (err: unknown, t: (k: TranslationKey) => string): string => {
  if (typeof err === 'object' && err !== null) {
    const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
  }
  if (err instanceof Error && err.message) return err.message;
  return t('operator.opp.analysis_error');
};

export function OpportunityDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, dir, lang } = useI18n();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [existingOfferId, setExistingOfferId] = useState<string | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TenderAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    if (!id) return;

    api.get(`/procurements/deals/${id}/`)
      .then((res) => {
        const deal = res.data;
        if (deal) {
          setOpp({
            id: String(deal.id),
            title: deal.title,
            description: deal.description || '',
            estimatedBudget: deal.estimated_budget ? formatCurrency(Number(deal.estimated_budget), lang) : null,
            authorityName: deal.authority_entity || deal.authority_name || t('operator.opportunities.table_authority'),
            updatedAt: deal.updated_at || deal.created_at || new Date().toISOString(),
            hasDocument: !!deal.cahier_specs,
          });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    api.get('/bids/offers/')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data?.results || [];
        const found = items.find((o: any) => String(o.deal) === String(id));
        if (found) setExistingOfferId(found.id);
      })
      .catch(() => {});
  }, [id, lang, t]);

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const handleAnalyzeTender = async () => {
    if (!id || analysisLoading) return;

    setAnalysisOpen(true);
    setAnalysisLoading(true);
    setAnalysisError('');

    try {
      const result = await analyzeTender(id);
      setAnalysis(result);
    } catch (err) {
      const message = getAnalysisErrorMessage(err, t);
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="op-page" aria-label={t('operator.req.loading')}>
        <div className="op-card p-8">
          <div className="op-skeleton mb-4 h-8 w-2/3" />
          <div className="op-skeleton mb-3 h-4 w-1/3" />
          <div className="op-skeleton h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="op-page">
        <div className="op-alert error">
          <AlertTriangle aria-hidden="true" />
          <span>{t('operator.opp.not_found')}</span>
        </div>
        <div>
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/deals')}
          >
            <ArrowIcon aria-hidden="true" />
            <span>{t('operator.opp.back_to_deals')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="op-page" dir={dir}>
      <div className="op-page-head">
        <div>
          <span className="op-chip gold mb-2">
            <Building aria-hidden="true" />
            <span>{opp.authorityName}</span>
          </span>
          <h1>{opp.title}</h1>
          <p className="flex items-center gap-1.5 text-xs text-[var(--op-muted)]">
            <Calendar className="size-3.5" aria-hidden="true" />
            <span>{t('operator.offers.last_updated')} {formatDate(opp.updatedAt, lang)}</span>
          </p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-gold"
            onClick={() => void handleAnalyzeTender()}
            disabled={analysisLoading}
          >
            {analysisLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            <span>{analysisLoading ? t('operator.opp.analyzing_specs') : t('operator.opp.smart_analysis')}</span>
          </button>
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/deals')}
          >
            <ArrowIcon aria-hidden="true" />
            <span>{t('operator.opp.back_to_deals')}</span>
          </button>
        </div>
      </div>

      <section className="op-card" aria-labelledby="opportunity-details-title">
        <div className="op-card-head">
          <h2 id="opportunity-details-title" className="flex items-center gap-2">
            <FileText className="size-4 text-[var(--op-gold)]" aria-hidden="true" />
            <span>{t('operator.opp.details_and_subject')}</span>
          </h2>
        </div>

        <div className="op-card-body space-y-5">
          <p className="whitespace-pre-wrap rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4 text-sm leading-relaxed text-[var(--op-text)]">
            {opp.description}
          </p>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-4">
              <dt className="flex items-center gap-1.5 text-xs text-[var(--op-muted)]">
                <Building className="size-3.5" aria-hidden="true" />
                <span>{t('operator.opp.contracting_authority')}</span>
              </dt>
              <dd className="mt-1 text-sm font-bold text-[var(--op-ink)]">{opp.authorityName}</dd>
            </div>

            <div className="rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-4">
              <dt className="flex items-center gap-1.5 text-xs text-[var(--op-muted)]">
                <Banknote className="size-3.5" aria-hidden="true" />
                <span>{t('opps.budget')}</span>
              </dt>
              <dd className="op-mono mt-1 text-sm font-bold text-[var(--op-ink)]">
                {opp.estimatedBudget || t('operator.opp.not_specified')}
              </dd>
            </div>
          </dl>

          <div className="op-alert warning">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong className="mb-1 block text-sm font-bold">
                {t('operator.opp.download_alert_title')}
              </strong>
              <p>
                {t('doc.download_suspended')}. {t('operator.opp.download_suspended_rule')}
              </p>
            </div>
          </div>

          <div className="op-action-bar">
            <button
              type="button"
              disabled
              title={t('doc.download_suspended')}
              className="op-btn op-btn-outline"
            >
              <Lock aria-hidden="true" />
              <span>{t('doc.download_suspended')}</span>
            </button>

            {existingOfferId ? (
              <button
                type="button"
                className="op-btn op-btn-green"
                onClick={() => setLocation(`/operator/offers/${existingOfferId}`)}
              >
                <span>{t('opps.btn.view_offer')}</span>
              </button>
            ) : (
              <button
                type="button"
                className="op-btn op-btn-gold"
                onClick={() => setLocation(`/operator/opportunities/${id}/offer`)}
              >
                <span>{t('opps.btn.make_offer')}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent
          dir="rtl"
          className="max-h-[90vh] max-w-3xl overflow-y-auto border-[var(--op-line)] bg-white p-0 font-sans text-start"
        >
          <div className="sticky top-0 z-10 border-b border-[var(--op-line-2)] bg-white px-6 py-5 pe-12">
            <DialogHeader>
              <span className="op-chip gold mb-2 w-fit">
                <Sparkles aria-hidden="true" />
                <span>{t('operator.opp.advisory_analysis')}</span>
              </span>
              <DialogTitle className="text-lg font-extrabold text-[var(--op-ink)]">
                {t('operator.opp.smart_analysis')}
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-[var(--op-muted)]">
                {t('operator.opp.advisory_desc')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-5">
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-[#1B4332] text-[#F6E7B4]">
                  <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[var(--op-ink)]">{t('operator.opp.analyzing_specs')}</p>
                  <p className="mt-1 text-xs text-[var(--op-muted)]">
                    {t('operator.opp.analyzing_reviewing_data')}
                  </p>
                </div>
              </div>
            ) : analysisError ? (
              <div className="op-alert error">
                <AlertTriangle aria-hidden="true" />
                <div>
                  <strong className="mb-1 block text-sm font-bold">{t('operator.opp.analysis_failed')}</strong>
                  <p>{analysisError}</p>
                  <button
                    type="button"
                    className="op-btn op-btn-outline op-btn-sm mt-3"
                    onClick={() => void handleAnalyzeTender()}
                  >
                    <RefreshCw aria-hidden="true" />
                    <span>{t('operator.opp.retry')}</span>
                  </button>
                </div>
              </div>
            ) : analysis ? (
              <>
                <div className="rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4332] text-[#F6E7B4]">
                      <FileSearch className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-[var(--op-ink)]">
                        {analysis.deal.title}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--op-muted)]">
                        <span className="op-mono">{analysis.deal.reference}</span>
                        <span aria-hidden="true">·</span>
                        <span>{analysis.deal.authority}</span>
                        {analysis.deal.wilaya ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{analysis.deal.wilaya}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--op-text)]">
                    {analysis.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="op-chip green">{t('operator.opp.chip_advisory')}</span>
                    <span className="op-chip gold">{analysis.statutory_reference}</span>
                    <span className="op-chip">{t('operator.opp.chip_human_review')}</span>
                  </div>
                </div>

                <section aria-labelledby="analysis-requirements-title">
                  <h3
                    id="analysis-requirements-title"
                    className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[var(--op-ink)]"
                  >
                    <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                    <span>{t('operator.opp.key_requirements')}</span>
                  </h3>
                  <div className="space-y-2.5">
                    {analysis.key_requirements.map((requirement, index) => (
                      <article
                        key={`${requirement.category}-${index}`}
                        className="rounded-xl border border-[var(--op-line)] bg-white p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="op-chip text-xs">{requirement.category}</span>
                          <h4 className="text-xs font-bold text-[var(--op-ink)]">
                            {requirement.title}
                          </h4>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-[var(--op-muted)]">
                          {requirement.detail}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <section aria-labelledby="analysis-attention-title">
                  <h3
                    id="analysis-attention-title"
                    className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[var(--op-ink)]"
                  >
                    <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
                    <span>{t('operator.opp.attention_points')}</span>
                  </h3>
                  {analysis.points_of_attention.length === 0 ? (
                    <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                      {t('operator.opp.no_critical_points')}
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {analysis.points_of_attention.map((point, index) => (
                        <article
                          key={`${point.title}-${index}`}
                          className={`rounded-xl border p-3 ${
                            SEVERITY_STYLES[point.severity] || SEVERITY_STYLES.low
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-black/10 bg-white/60 px-2 py-0.5 text-xs font-bold">
                              {SEVERITY_LABEL_KEYS[point.severity] ? t(SEVERITY_LABEL_KEYS[point.severity]) : t('operator.opp.severity_low')}
                            </span>
                            <h4 className="text-xs font-bold">{point.title}</h4>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed opacity-90">{point.detail}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section aria-labelledby="analysis-recommendations-title">
                  <h3
                    id="analysis-recommendations-title"
                    className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[var(--op-ink)]"
                  >
                    <Sparkles className="size-4 text-[var(--op-gold)]" aria-hidden="true" />
                    <span>{t('operator.opp.practical_recommendations')}</span>
                  </h3>
                  <ul className="space-y-2 rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-4">
                    {analysis.recommendations.map((recommendation, index) => (
                      <li
                        key={`${recommendation}-${index}`}
                        className="flex items-start gap-2 text-xs leading-relaxed text-[var(--op-text)]"
                      >
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-xl border border-[var(--op-line)] bg-white p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[var(--op-ink)]">
                    <BookOpen className="size-4 text-[var(--op-gold)]" aria-hidden="true" />
                    <span>{t('operator.opp.legal_references')}</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--op-muted)]">
                    {analysis.legal_references.map((reference) => (
                      <li key={reference} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--op-gold)]"
                          aria-hidden="true"
                        />
                        <span>{reference}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="op-alert warning">
                  <ShieldCheck aria-hidden="true" />
                  <div>
                    <strong className="mb-1 block text-xs font-bold">{t('operator.opp.disclaimer_title')}</strong>
                    <p className="text-xs leading-relaxed">
                      {t('operator.opp.disclaimer_text')}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <DialogFooter className="border-t border-[var(--op-line-2)] bg-white px-6 py-4">
            {analysis ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleAnalyzeTender()}
                disabled={analysisLoading}
              >
                <RefreshCw aria-hidden="true" />
                <span>{t('operator.opp.reanalyze')}</span>
              </Button>
            ) : null}
            <Button type="button" onClick={() => setAnalysisOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
