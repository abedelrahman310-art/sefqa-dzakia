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
  AlertOctagon,
  CreditCard,
  Download,
  FileCheck,
} from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  authorityName: string;
  updatedAt: string;
  hasDocument: boolean;
  hasActiveInjunction?: boolean;
  submissionDeadline?: string | null;
  isExpired?: boolean;
  daysLeft?: number;
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
  const [specsStatus, setSpecsStatus] = useState<{
    specs_price: number;
    is_specs_free: boolean;
    has_purchased: boolean;
    purchase?: {
      receipt_number: string;
      amount: number;
      paid_at: string;
      download_url: string;
      receipt_url: string;
    } | null;
  } | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'edahabia' | 'cib'>('edahabia');
  const [checkingOut, setCheckingOut] = useState(false);

  const loadSpecsStatus = () => {
    if (!id) return;
    api.get(`/procurements/deals/${id}/specs/status/`)
      .then((res) => {
        setSpecsStatus(res.data);
      })
      .catch(() => {});
  };
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
            hasActiveInjunction: !!deal.has_active_injunction,
            submissionDeadline: deal.submission_deadline || null,
            isExpired: Boolean(deal.is_expired ?? (deal.submission_deadline ? new Date(deal.submission_deadline) < new Date() : false)),
            daysLeft: typeof deal.days_left === 'number' ? deal.days_left : 0,
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

    // Check payment redirect parameters
    const urlParams = new URLSearchParams(window.location.search);
    const specsPayment = urlParams.get('specs_payment');
    const checkoutId = urlParams.get('checkout_id') || urlParams.get('purchase_id');

    if (specsPayment === 'success' && checkoutId) {
      api.get(`/procurements/specs/purchase/${checkoutId}/verify/`)
        .then((res) => {
          if (res.data.status === 'paid') {
            toast.success(t('operator.specs.payment_success'));
            try {
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (_) {}
          }
        })
        .catch(() => {})
        .finally(() => {
          loadSpecsStatus();
        });
    } else {
      loadSpecsStatus();
    }
  }, [id, lang, t]);

  const handleDownloadSpecs = (receiptNum?: string) => {
    if (!receiptNum) {
      window.open(`/api/procurements/deals/${id}/specs-pdf/`, '_blank');
      return;
    }
    window.open(`/api/procurements/specs/download/${receiptNum}/`, '_blank');
  };

  const handleDownloadReceipt = (receiptNum: string) => {
    window.open(`/api/procurements/specs/receipt/${receiptNum}/`, '_blank');
  };

  const handleProceedPayment = async () => {
    if (!id) return;
    setCheckingOut(true);
    try {
      const res = await api.post(`/procurements/deals/${id}/specs/checkout/`);
      const data = res.data;
      if (data.status === 'paid' || data.already_paid || data.is_free) {
        toast.success(t('operator.specs.payment_success'));
        setPaymentModalOpen(false);
        loadSpecsStatus();
        return;
      }
      if (data.checkout_url) {
        if (data.is_mock) {
          const verifyRes = await api.get(`/procurements/specs/purchase/${data.payment_id}/verify/`);
          if (verifyRes.data.status === 'paid') {
            toast.success(t('operator.specs.payment_success'));
            setPaymentModalOpen(false);
            loadSpecsStatus();
            return;
          }
        }
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || t('common.error_occurred'));
    } finally {
      setCheckingOut(false);
    }
  };

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
          {opp.hasActiveInjunction && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertOctagon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{t('operator.opportunity.under_injunction')}</span>
            </div>
          )}
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className={`op-btn op-btn-gold ${opp.isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => void handleAnalyzeTender()}
            disabled={analysisLoading || opp.isExpired}
            title={opp.isExpired ? t('operator.opp.expired_tooltip') : undefined}
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

      {opp.isExpired && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/95 p-4 text-rose-950 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertOctagon className="size-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <span>{t('operator.opp.expired_title')}</span>
              <span className="rounded-full bg-rose-200/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-900 dark:bg-rose-900/60 dark:text-rose-200">
                {t('operator.opp.expired_badge')}
              </span>
            </h4>
            <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-300">
              {t('operator.opp.expired_desc_art68')}
              {opp.submissionDeadline && (
                <span className="block mt-1 font-semibold">
                  {t('operator.opp.deadline_label')}: {formatDate(opp.submissionDeadline, lang)}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

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

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

            <div className={`rounded-xl border p-4 ${opp.isExpired ? 'border-rose-300 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20' : 'border-[var(--op-line)] bg-[var(--op-surface-2)]'}`}>
              <dt className="flex items-center gap-1.5 text-xs text-[var(--op-muted)]">
                <Calendar className="size-3.5" aria-hidden="true" />
                <span>{t('operator.opp.deadline_label')}</span>
              </dt>
              <dd className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[var(--op-ink)]">
                  {opp.submissionDeadline ? formatDate(opp.submissionDeadline, lang) : t('operator.opp.not_specified')}
                </span>
                {opp.isExpired ? (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
                    {t('operator.opp.expired_badge')}
                  </span>
                ) : opp.daysLeft !== undefined && opp.daysLeft > 0 ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {opp.daysLeft} {t('operator.opp.days_left_label')}
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>

          {/* Specs Withdrawal & E-Payment Section */}
          <div className="rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="size-4 text-[var(--op-gold)]" />
                  <h3 className="text-sm font-bold text-[var(--op-ink)]">
                    {t('operator.specs.checkout_title')}
                  </h3>
                  {specsStatus?.has_purchased ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" />
                      <span>{t('operator.specs.purchased_badge')}</span>
                    </span>
                  ) : specsStatus?.is_specs_free ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                      <span>{t('operator.specs.free')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <span>{specsStatus ? `${specsStatus.specs_price.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} ${t('common.dzd')}` : '...'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--op-muted)]">
                  {specsStatus?.has_purchased && specsStatus.purchase?.receipt_number ? (
                    <span>
                      {t('operator.specs.receipt_number')}: <code className="font-mono font-bold text-[var(--op-ink)]">{specsStatus.purchase.receipt_number}</code>
                    </span>
                  ) : specsStatus?.is_specs_free ? (
                    <span>{t('operator.specs.free')} — وفق أحكام القانون 23-12</span>
                  ) : (
                    <span>{t('operator.specs.non_refundable')} — Chargily Pay (الذهبية / CIB)</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {!specsStatus?.has_purchased && !specsStatus?.is_specs_free ? (
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(true)}
                    className="op-btn op-btn-gold"
                  >
                    <CreditCard className="size-4" />
                    <span>{t('operator.specs.buy_and_download')} ({specsStatus?.specs_price.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} {t('common.dzd')})</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadSpecs(specsStatus?.purchase?.receipt_number)}
                      className="op-btn op-btn-gold"
                    >
                      <Download className="size-4" />
                      <span>{t('operator.specs.download_pdf')}</span>
                    </button>
                    {specsStatus?.purchase?.receipt_number && (
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(specsStatus.purchase!.receipt_number)}
                        className="op-btn op-btn-outline"
                      >
                        <FileCheck className="size-4" />
                        <span>{t('operator.specs.download_receipt')}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="op-action-bar">
            {opp.isExpired ? (
              <button
                type="button"
                className="op-btn op-btn-outline cursor-not-allowed opacity-60 border-rose-300 text-rose-700 bg-rose-50/50 dark:border-rose-800 dark:text-rose-300 dark:bg-rose-950/20"
                disabled
                title={t('operator.opp.submission_closed_art68')}
              >
                <Lock className="size-4" />
                <span>{t('operator.opp.submission_closed')}</span>
              </button>
            ) : existingOfferId ? (
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

      {/* Specs Payment Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent
          dir={dir}
          className="max-w-md border-[var(--op-line)] bg-white p-6 font-sans text-start rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[var(--op-ink)]">
              <CreditCard className="size-5 text-[var(--op-gold)]" />
              <span>{t('operator.specs.checkout_title')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-[var(--op-muted)]">
              {t('operator.specs.checkout_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[var(--op-muted)]">{t('operator.opp.details_and_subject')}:</span>
                <span className="font-bold text-[var(--op-ink)] max-w-[200px] truncate">{opp?.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--op-muted)]">{t('operator.specs.price')}:</span>
                <span className="font-mono font-black text-sm text-[var(--op-gold)]">
                  {specsStatus?.specs_price.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} {t('common.dzd')}
                </span>
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                ⚠️ {t('operator.specs.non_refundable')}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--op-ink)]">{t('operator.specs.payment_method')}:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('edahabia')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'edahabia'
                      ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332] ring-1 ring-[#1B4332]'
                      : 'border-[var(--op-line)] bg-white text-[var(--op-muted)] hover:bg-muted/30'
                  }`}
                >
                  <span className="text-sm">💳</span>
                  <span>{t('operator.specs.edahabia')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cib')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'cib'
                      ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332] ring-1 ring-[#1B4332]'
                      : 'border-[var(--op-line)] bg-white text-[var(--op-muted)] hover:bg-muted/30'
                  }`}
                >
                  <span className="text-sm">🏦</span>
                  <span>{t('operator.specs.cib')}</span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <button
              type="button"
              className="op-btn op-btn-outline op-btn-sm"
              onClick={() => setPaymentModalOpen(false)}
              disabled={checkingOut}
            >
              <span>{t('common.cancel')}</span>
            </button>
            <button
              type="button"
              className="op-btn op-btn-gold op-btn-sm"
              onClick={() => void handleProceedPayment()}
              disabled={checkingOut}
            >
              {checkingOut && <Loader2 className="size-3.5 animate-spin" />}
              <span>{t('operator.specs.proceed_payment')}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
