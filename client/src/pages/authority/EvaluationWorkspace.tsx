import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import type {
  ConcludeEvaluationPayloadApi,
  ConcludeEvaluationResponseApi,
  EvaluationDataApi,
  EvaluationOfferApi,
  EvaluationOpportunityApi,
  OfferEvaluationPayloadApi,
  OfferEvaluationResponseApi,
  OfferEvaluationStatusApi,
} from '@/lib/procurementApiTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EvaluationMatrixTable, type EvaluationMatrixOffer } from '@/features/evaluation/EvaluationMatrixTable';
import { VoiceDictationButton } from '@/features/voice/VoiceDictationButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Trophy,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  CheckSquare,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

interface EvaluationFormState {
  evaluationStatus: OfferEvaluationStatusApi;
  technicalScore: string;
  financialScore: string;
  rejectionReason: string;
  evaluatorNotes: string;
  saving?: boolean;
}

/** Response from /api/authority/analyze-prices/ */
interface PriceOfferAnalysisApi {
  offer_id: string;
  operator_name: string;
  amount: number | null;
  deviation_percent: number | null;
  status: 'normal' | 'abnormally_low' | 'abnormally_high' | 'outlier' | 'unknown';
  warnings?: string[];
  ai_recommendation?: string;
  recommendation: string;
}

interface PriceAnalysisApi {
  deal_id: string;
  deal_reference: string;
  deal_title: string;
  estimated_budget?: number | null;
  average?: number | null;
  standard_deviation?: number | null;
  baseline: { amount: number | null; source: string | null; source_label: string };
  threshold_percent: number;
  offers: PriceOfferAnalysisApi[];
  summary: {
    offers_count: number;
    outliers_count: number;
    normal_count: number;
    abnormally_low_count?: number;
    abnormally_high_count?: number;
    average?: number | null;
    average_amount: number | null;
    standard_deviation?: number | null;
    estimated_budget?: number | null;
    min_amount: number | null;
    max_amount: number | null;
  };
  is_advisory: boolean;
  disclaimer: string;
}

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; detail?: string } | undefined;
    return data?.error || data?.detail || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

export function EvaluationWorkspace() {
  const params = useParams<{ id?: string; tenderId?: string }>();
  const id = params.id || params.tenderId;
  const [, setLocation] = useLocation();
  const { t, lang, dir } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deal, setDeal] = useState<EvaluationOpportunityApi | null>(null);
  const [offers, setOffers] = useState<EvaluationOfferApi[]>([]);

  // Smart Price Analysis (Advisory)
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [priceData, setPriceData] = useState<PriceAnalysisApi | null>(null);

  // Per-offer form edits
  const [evalForms, setEvalForms] = useState<Record<string, EvaluationFormState>>({});
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');

  const matrixOffers: EvaluationMatrixOffer[] = useMemo(() => {
    return offers.map((o) => {
      const techScoreNum = parseFloat(evalForms[o.id]?.technicalScore || o.technicalScore || '0') || 0;
      const finAmountNum = o.financialAmount ? Number(o.financialAmount) : 0;
      const formStatus = evalForms[o.id]?.evaluationStatus || o.evaluationStatus;
      const statusMapped: 'pending' | 'accepted' | 'rejected' | 'abnormally_low' =
        formStatus === 'rejected' ? 'rejected' : formStatus === 'evaluated' ? 'accepted' : 'pending';

      return {
        id: o.id,
        operatorName: o.bidderName,
        technicalScore: techScoreNum,
        financialAmount: finAmountNum,
        isCandidacyCompliant: formStatus !== 'rejected',
        status: statusMapped,
        rejectionReason: evalForms[o.id]?.rejectionReason || o.rejectionReason || undefined,
      };
    });
  }, [offers, evalForms]);

  // Provisional award form
  const [winningOfferId, setWinningOfferId] = useState('');
  const [awardMethod, setAwardMethod] = useState<'least_cost' | 'best_value'>('least_cost');
  const [awardNotes, setAwardNotes] = useState('');
  const [awarding, setAwarding] = useState(false);
  const [awardSuccess, setAwardSuccess] = useState<ConcludeEvaluationResponseApi | null>(null);

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const formatPrice = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    const formatter = new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-FR', {
      maximumFractionDigits: 0,
    });
    return `${formatter.format(Math.round(value))} ${t('common.dzd')}`;
  };

  const getStatusLabel = (status: OfferEvaluationStatusApi) => {
    const map: Record<OfferEvaluationStatusApi, string> = {
      pending: t('authority.eval.status.pending'),
      admitted: t('authority.eval.status.admitted'),
      evaluated: t('authority.eval.status.evaluated'),
      rejected: t('authority.eval.status.rejected'),
    };
    return map[status] || status;
  };

  const loadData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    setWinningOfferId('');
    setAwardSuccess(null);

    try {
      const { data } = await api.get<EvaluationDataApi>(
        `/authority/opportunities/${id}/evaluation-data/`
      );
      setDeal(data.opportunity);
      setOffers(data.offers || []);

      // Initialize form states
      const initialForms: Record<string, EvaluationFormState> = {};
      (data.offers || []).forEach((o) => {
        initialForms[o.id] = {
          evaluationStatus: o.evaluationStatus || 'pending',
          technicalScore: o.technicalScore || '',
          financialScore: o.financialScore || '',
          rejectionReason: o.rejectionReason || '',
          evaluatorNotes: o.evaluatorNotes || '',
        };
      });
      setEvalForms(initialForms);

      // Default winner to the first offer eligible for award.
      const firstEligible = (data.offers || []).find(
        (o) => o.evaluationStatus === 'admitted' || o.evaluationStatus === 'evaluated'
      );
      if (firstEligible) {
        setWinningOfferId(firstEligible.id);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t('authority.eval.fetch_error')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const runPriceAnalysis = async () => {
    if (!id) return;
    setPriceModalOpen(true);
    setPriceLoading(true);
    setPriceError('');
    setPriceData(null);

    try {
      const { data } = await api.post<PriceAnalysisApi>('/authority/analyze-prices/', {
        deal_id: id,
      });
      setPriceData(data);
    } catch (err: unknown) {
      setPriceError(getApiErrorMessage(err, t('authority.eval.price_error')));
    } finally {
      setPriceLoading(false);
    }
  };

  const handleSaveOfferEval = async (offerId: string) => {
    const form = evalForms[offerId];
    if (!form) return;

    if (form.evaluationStatus === 'rejected' && !form.rejectionReason.trim()) {
      setError(t('authority.eval.rejection_reason_req'));
      return;
    }

    setEvalForms((prev) => ({
      ...prev,
      [offerId]: { ...prev[offerId], saving: true },
    }));
    setError('');
    setSuccess('');

    try {
      const payload: OfferEvaluationPayloadApi = {
        evaluationStatus: form.evaluationStatus,
        technicalScore: form.technicalScore.trim() || undefined,
        financialScore: form.financialScore.trim() || undefined,
        rejectionReason:
          form.evaluationStatus === 'rejected' ? form.rejectionReason.trim() : '',
        evaluatorNotes: form.evaluatorNotes.trim() || undefined,
      };

      const { data } = await api.post<OfferEvaluationResponseApi>(
        `/authority/offers/${offerId}/evaluate/`,
        payload
      );

      const nextStatus: OfferEvaluationStatusApi =
        data.status || (form.evaluationStatus === 'rejected' ? 'rejected' : 'evaluated');

      setOffers((prev) =>
        prev.map((offer) =>
          offer.id === offerId
            ? {
                ...offer,
                evaluationStatus: nextStatus,
                technicalScore: data.technical_score ?? (form.technicalScore.trim() || null),
                financialScore: data.financial_score ?? (form.financialScore.trim() || null),
                rejectionReason: nextStatus === 'rejected' ? form.rejectionReason.trim() : '',
                evaluatorNotes: data.evaluator_notes ?? form.evaluatorNotes.trim(),
              }
            : offer
        )
      );

      setEvalForms((prev) => ({
        ...prev,
        [offerId]: {
          ...prev[offerId],
          evaluationStatus: nextStatus,
          technicalScore: data.technical_score ?? form.technicalScore,
          financialScore: data.financial_score ?? form.financialScore,
          rejectionReason: nextStatus === 'rejected' ? form.rejectionReason : '',
          evaluatorNotes: data.evaluator_notes ?? form.evaluatorNotes,
        },
      }));

      const baseSuccessMsg = data.message || t('authority.eval.save_success');
      setSuccess(`${baseSuccessMsg} ${t('authority.eval.save_status_prefix', { status: getStatusLabel(nextStatus) })}`);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t('authority.eval.save_error')));
    } finally {
      setEvalForms((prev) => ({
        ...prev,
        [offerId]: { ...prev[offerId], saving: false },
      }));
    }
  };

  const handleConcludeAward = async () => {
    if (!id) return;
    if (!winningOfferId) {
      setError(t('authority.eval.award_select_req'));
      return;
    }

    setAwarding(true);
    setError('');
    setSuccess('');

    try {
      const payload: ConcludeEvaluationPayloadApi = {
        winningOfferId,
        method: awardMethod,
        observations: awardNotes.trim() || undefined,
      };

      const { data } = await api.post<ConcludeEvaluationResponseApi>(
        `/authority/opportunities/${id}/conclude-evaluation/`,
        payload
      );

      setAwardSuccess(data);
      setDeal((prev) => (prev ? { ...prev, current_stage: 8 } : prev));
      setOffers((prev) =>
        prev.map((offer) =>
          offer.id === winningOfferId
            ? { ...offer, evaluationStatus: 'admitted' }
            : offer
        )
      );
      setSuccess(data.message || t('authority.eval.award_success'));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t('authority.eval.award_error')));
    } finally {
      setAwarding(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">{t('authority.eval.loading')}</span>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-primary font-bold text-base">
            <FileCheck className="w-5 h-5" />
            <span>{t('authority.nav.evaluation')}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('authority.eval.no_deal_selected')}
          </p>
          <Button
            variant="default"
            className="rounded-xl text-xs"
            onClick={() => setLocation('/authority/drafts')}
          >
            {t('authority.eval.go_to_deals')}
          </Button>
        </div>
      </div>
    );
  }

  const isAwardConcluded = Boolean(
    deal && (deal.current_stage >= 8 || deal.status === 'provisional_award')
  );
  const admittedOffers = offers.filter(
    (o) => o.evaluationStatus === 'admitted' || o.evaluationStatus === 'evaluated'
  );
  const winningOffer = awardSuccess
    ? offers.find((offer) => offer.id === awardSuccess.winningOfferId)
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-navy-900 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1.5 h-auto rounded-lg"
              onClick={() => setLocation('/authority/opening-sessions')}
            >
              <ArrowIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold text-navy-100">
              {t('lifecycle.opening.decree_ref')}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {t('lifecycle.eval.title')}
          </h2>
          <p className="text-xs text-navy-100">
            {t('authority.eval.deal_label')} <span className="font-bold text-white">{deal?.title}</span>
          </p>
        </div>

        {/* Status Pill */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className="p-2.5 rounded-xl border bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-navy-100">{t('authority.eval.eval_stage_label')}</div>
            <div className="text-sm font-bold text-white">
              {isAwardConcluded ? t('authority.eval.awarded_status') : t('authority.eval.examining_status')}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Provisional Award Success Banner */}
      {isAwardConcluded && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-800 font-extrabold text-base">
            <Trophy className="w-6 h-6 text-emerald-600" />
            <span>{t('lifecycle.eval.award_notice')}</span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed font-medium">
            {t('authority.eval.awarded_banner')}
          </p>
          <div className="text-xs font-mono bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-1">
            {awardSuccess?.message && (
              <div className="text-emerald-900">{awardSuccess.message}</div>
            )}
            {awardSuccess?.winningOfferId && (
              <div className="break-all text-slate-700">
                {t('authority.eval.winning_offer_label')}{' '}
                <strong className="text-emerald-900">
                  {winningOffer?.bidderName || awardSuccess.winningOfferId}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offers Evaluation Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              {t('lifecycle.eval.candidature_tech')}
            </h3>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'matrix'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-navy-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>مصفوفة الترتيب والتقييم الذكي (COP Matrix)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-navy-900'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>الاستمارات الفردية ({offers.length})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {t('authority.eval.offers_under_study', { count: offers.length })}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => void runPriceAnalysis()}
              disabled={offers.length === 0}
              className="gap-1.5 rounded-xl bg-navy-900 text-xs font-bold text-white hover:bg-navy-800"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {t('authority.eval.smart_price_analysis')}
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {offers.map((offer, idx) => {
            const form = evalForms[offer.id] || {
              evaluationStatus: offer.evaluationStatus,
              technicalScore: offer.technicalScore || '',
              financialScore: offer.financialScore || '',
              rejectionReason: offer.rejectionReason || '',
              evaluatorNotes: offer.evaluatorNotes || '',
            };
            const statusBadgeClass =
              offer.evaluationStatus === 'rejected'
                ? 'bg-red-50 text-red-700 border-red-200'
                : offer.evaluationStatus === 'evaluated'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : offer.evaluationStatus === 'admitted'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-amber-50 text-amber-800 border-amber-200';

            const formattedOfferAmount = offer.financialAmount
              ? `${Number(offer.financialAmount).toLocaleString()} ${t('common.dzd')}`
              : '—';

            return (
              <div
                key={offer.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-navy-50 text-navy-900 font-extrabold flex items-center justify-center text-xs shrink-0 border border-navy-100">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-navy-900">{offer.bidderName}</h4>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}
                        >
                          {getStatusLabel(offer.evaluationStatus)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{t('authority.eval.offer_amount_label')} <strong className="text-navy-900 font-mono">{formattedOfferAmount}</strong></span>
                        <span>· {t('authority.eval.duration_label')} {offer.durationDays ? t('authority.eval.duration_days', { days: offer.durationDays }) : '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {offer.hasDocument ? (
                      <a
                        href={`/api/authority/offers/${offer.id}/document`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-navy-200 bg-navy-50 text-navy-900 hover:bg-navy-100 text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {t('lifecycle.eval.download_doc')}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('authority.eval.no_attachment')}</span>
                    )}
                  </div>
                </div>

                {/* Evaluation Form for this Offer */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t('authority.eval.conformity_decision')}</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={form.evaluationStatus === 'admitted' ? 'default' : 'outline'}
                        className={`text-xs rounded-xl flex-1 gap-1.5 ${form.evaluationStatus === 'admitted' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                        disabled={form.saving || isAwardConcluded}
                        onClick={() =>
                          setEvalForms((prev) => ({
                            ...prev,
                            [offer.id]: { ...prev[offer.id], evaluationStatus: 'admitted' },
                          }))
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('lifecycle.eval.admit')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={form.evaluationStatus === 'rejected' ? 'destructive' : 'outline'}
                        className="text-xs rounded-xl flex-1 gap-1.5"
                        disabled={form.saving || isAwardConcluded}
                        onClick={() =>
                          setEvalForms((prev) => ({
                            ...prev,
                            [offer.id]: { ...prev[offer.id], evaluationStatus: 'rejected' },
                          }))
                        }
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {t('lifecycle.eval.reject')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t('lifecycle.eval.technical_score')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.technicalScore}
                      disabled={form.saving || isAwardConcluded}
                      onChange={(e) =>
                        setEvalForms((prev) => ({
                          ...prev,
                          [offer.id]: { ...prev[offer.id], technicalScore: e.target.value },
                        }))
                      }
                      placeholder={t('authority.eval.score_tech_placeholder')}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t('authority.eval.financial_score_label')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.financialScore}
                      disabled={form.saving || isAwardConcluded}
                      onChange={(e) =>
                        setEvalForms((prev) => ({
                          ...prev,
                          [offer.id]: { ...prev[offer.id], financialScore: e.target.value },
                        }))
                      }
                      placeholder={t('authority.eval.score_fin_placeholder')}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t('lifecycle.eval.rejection_reason')}</Label>
                    <Input
                      value={form.rejectionReason}
                      onChange={(e) =>
                        setEvalForms((prev) => ({
                          ...prev,
                          [offer.id]: { ...prev[offer.id], rejectionReason: e.target.value },
                        }))
                      }
                      placeholder={t('authority.eval.rejection_placeholder')}
                      className="text-xs rounded-xl"
                      disabled={
                        form.saving ||
                        isAwardConcluded ||
                        form.evaluationStatus !== 'rejected'
                      }
                    />
                  </div>

                  <div className="md:col-span-2 xl:col-span-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">{t('lifecycle.eval.notes')}</Label>
                      <VoiceDictationButton
                        onTranscript={(spoken) => {
                          setEvalForms((prev) => ({
                            ...prev,
                            [offer.id]: {
                              ...prev[offer.id],
                              evaluatorNotes: (prev[offer.id]?.evaluatorNotes ? prev[offer.id].evaluatorNotes + ' ' : '') + spoken,
                            },
                          }));
                        }}
                      />
                    </div>
                    <Textarea
                      value={form.evaluatorNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEvalForms((prev) => ({
                          ...prev,
                          [offer.id]: { ...prev[offer.id], evaluatorNotes: e.target.value },
                        }))
                      }
                      placeholder={t('authority.eval.notes_placeholder')}
                      className="text-xs rounded-xl"
                      rows={2}
                      disabled={form.saving || isAwardConcluded}
                    />
                  </div>

                  <div className="md:col-span-2 xl:col-span-4 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleSaveOfferEval(offer.id)}
                      disabled={form.saving || isAwardConcluded}
                      aria-busy={form.saving}
                      className="text-xs rounded-xl font-bold gap-2"
                    >
                      {form.saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileCheck className="w-4 h-4" />
                      )}
                      {form.saving ? t('authority.eval.saving_eval') : t('lifecycle.eval.save_eval')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Financial Ranking & Provisional Award Section */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            {t('lifecycle.eval.financial')}
          </h3>
          <span className="text-xs text-muted-foreground">
            {t('authority.eval.admitted_count', { count: admittedOffers.length })}
          </span>
        </div>

        {admittedOffers.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
            {t('authority.eval.no_admitted_offers')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-navy-900">
                    <th className="px-4 py-4 font-bold text-start">{t('authority.eval.col_rank')}</th>
                    <th className="px-4 py-4 font-bold text-start">{t('authority.eval.col_operator')}</th>
                    <th className="px-4 py-4 font-bold text-start">{t('authority.eval.col_score_tech')}</th>
                    <th className="px-4 py-4 font-bold text-start">{t('authority.eval.col_score_fin')}</th>
                    <th className="px-4 py-4 font-bold text-start">{t('authority.eval.col_proposed_amount')}</th>
                    <th className="px-4 py-4 font-bold text-start">{t('authority.eval.col_duration')}</th>
                    <th className="px-4 py-4 font-bold text-start">{t('authority.eval.col_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {admittedOffers
                    .slice()
                    .sort((a, b) => Number(a.financialAmount || 0) - Number(b.financialAmount || 0))
                    .map((item, idx) => (
                      <tr key={item.id} className="hover:bg-muted/10">
                        <td className="px-4 py-3 font-mono font-bold text-amber-700">#{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-navy-900">{item.bidderName}</td>
                        <td className="px-4 py-3 font-mono">{item.technicalScore || '—'} / 100</td>
                        <td className="px-4 py-3 font-mono">{item.financialScore || '—'} / 100</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-800">
                          {item.financialAmount
                            ? `${Number(item.financialAmount).toLocaleString()} ${t('common.dzd')}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.durationDays ? t('authority.eval.duration_days', { days: item.durationDays }) : '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${
                              item.evaluationStatus === 'evaluated'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {getStatusLabel(item.evaluationStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Provisional Award Form */}
            {!isAwardConcluded && (
              <div id="provisional-award-section" className="p-5 bg-navy-50/50 border border-navy-100 rounded-xl space-y-4 mt-4">
                <h4 className="text-xs font-bold text-navy-900 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-700" />
                  {t('lifecycle.eval.conclude_btn')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t('lifecycle.eval.winner_label')} *</Label>
                    <select
                      value={winningOfferId}
                      onChange={(e) => setWinningOfferId(e.target.value)}
                      disabled={awarding}
                      className="w-full text-xs rounded-xl border border-input bg-background px-3 py-2"
                    >
                      <option value="">{t('authority.eval.select_winner_placeholder')}</option>
                      {admittedOffers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.bidderName} ({o.financialAmount ? `${Number(o.financialAmount).toLocaleString()} ${t('common.dzd')}` : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{t('authority.eval.selection_method_label')}</Label>
                    <select
                      value={awardMethod}
                      onChange={(e) =>
                        setAwardMethod(e.target.value as 'least_cost' | 'best_value')
                      }
                      disabled={awarding}
                      className="w-full text-xs rounded-xl border border-input bg-background px-3 py-2"
                    >
                      <option value="least_cost">{t('lifecycle.eval.method_least_cost')}</option>
                      <option value="best_value">{t('lifecycle.eval.method_advantageous')}</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">{t('authority.eval.selection_justification_label')}</Label>
                    <Textarea
                      value={awardNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAwardNotes(e.target.value)}
                      placeholder={t('authority.eval.selection_justification_placeholder')}
                      className="text-xs rounded-xl"
                      rows={2}
                      disabled={awarding}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleConcludeAward}
                  disabled={awarding || !winningOfferId}
                  aria-busy={awarding}
                  className="rounded-xl text-xs font-bold gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {awarding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trophy className="w-4 h-4" />
                  )}
                  {awarding ? t('authority.eval.concluding_status') : t('lifecycle.eval.conclude_btn')}
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Smart Price Analysis Dialog */}
      <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-navy-900" aria-hidden="true" />
              {t('authority.eval.smart_price_analysis')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {priceData
                ? `${priceData.deal_reference} — ${priceData.deal_title}`
                : deal
                  ? `${deal.reference} — ${deal.title}`
                  : t('authority.eval.smart_analysis_desc')}
            </DialogDescription>
          </DialogHeader>

          {priceLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-xs text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-navy-900" aria-hidden="true" />
              {t('authority.eval.smart_analyzing')}
            </div>
          ) : priceError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold leading-relaxed text-destructive">
              {priceError}
            </div>
          ) : priceData ? (
            <div className="space-y-4 py-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-xl border border-border bg-muted/30 p-2.5 text-center">
                  <span className="block text-xs font-bold text-muted-foreground truncate">
                    {priceData.baseline.source_label}
                  </span>
                  <span className="mt-1 block text-xs sm:text-sm font-extrabold text-navy-900">
                    {formatPrice(priceData.baseline.amount)}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-2.5 text-center">
                  <span className="block text-xs font-bold text-muted-foreground">
                    {t('authority.eval.average_offers')}
                  </span>
                  <span className="mt-1 block text-xs sm:text-sm font-extrabold text-navy-900">
                    {formatPrice(priceData.average ?? priceData.summary.average_amount)}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-2.5 text-center">
                  <span className="block text-xs font-bold text-muted-foreground">
                    {t('authority.eval.std_deviation')}
                  </span>
                  <span className="mt-1 block text-xs sm:text-sm font-extrabold text-navy-900 font-mono">
                    {formatPrice(priceData.standard_deviation ?? priceData.summary.standard_deviation)}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-2.5 text-center">
                  <span className="block text-xs font-bold text-muted-foreground">
                    {t('authority.eval.abnormal_offers')}
                  </span>
                  <span
                    className={`mt-1 block text-xs sm:text-sm font-extrabold ${
                      (priceData.summary.outliers_count || 0) > 0 ? 'text-destructive' : 'text-emerald-600'
                    }`}
                  >
                    {priceData.summary.outliers_count || 0}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {t('authority.eval.threshold_desc', { percent: priceData.threshold_percent })}
              </p>

              {priceData.offers.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  {t('authority.eval.no_financial_offers')}
                </p>
              ) : (
                <div className="space-y-3">
                  {priceData.offers.map((offer) => {
                    const isAbnormallyLow = offer.status === 'abnormally_low';
                    const isAbnormallyHigh = offer.status === 'abnormally_high';
                    const isOutlier = isAbnormallyLow || isAbnormallyHigh || offer.status === 'outlier';
                    const deviation = offer.deviation_percent;
                    const badgeClass = isAbnormallyLow
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : isAbnormallyHigh
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : offer.status === 'normal'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600';

                    const statusLabel = isAbnormallyLow
                      ? t('authority.eval.price_anomaly.abnormally_low')
                      : isAbnormallyHigh
                        ? t('authority.eval.price_anomaly.abnormally_high')
                        : offer.status === 'normal'
                          ? t('authority.eval.price_anomaly.normal')
                          : isOutlier
                            ? t('authority.eval.price_anomaly.outlier')
                            : t('authority.eval.price_anomaly.indeterminate');

                    return (
                      <div
                        key={offer.offer_id}
                        className="rounded-xl border border-border bg-card p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-navy-900">
                            {offer.operator_name}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeClass}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono font-bold text-navy-900">
                            {formatPrice(offer.amount)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              isOutlier ? (isAbnormallyLow ? 'text-amber-700' : 'text-destructive') : 'text-emerald-600'
                            }`}
                          >
                            {deviation !== null && deviation < 0 ? (
                              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {deviation === null
                              ? '—'
                              : `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`}
                          </span>
                        </div>

                        {offer.warnings && offer.warnings.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {offer.warnings.map((w, wIdx) => (
                              <div
                                key={wIdx}
                                className="flex items-start gap-1.5 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-1.5"
                              >
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-xs leading-relaxed text-navy-950 font-medium">
                          <span className="font-bold text-navy-900 block mb-0.5">{t('authority.eval.smart_recommendation_label')}</span>
                          {offer.ai_recommendation || offer.recommendation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold leading-relaxed text-blue-800">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t('authority.eval.advisory_disclaimer')}</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
