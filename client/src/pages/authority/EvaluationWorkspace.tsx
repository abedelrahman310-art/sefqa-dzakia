import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

interface EvaluationFormState {
  evaluationStatus: OfferEvaluationStatusApi;
  technicalScore: string;
  financialScore: string;
  rejectionReason: string;
  evaluatorNotes: string;
  saving?: boolean;
}

const EVALUATION_STATUS_LABELS: Record<OfferEvaluationStatusApi, string> = {
  pending: 'قيد الانتظار',
  admitted: 'مقبول',
  evaluated: 'مُقيّم',
  rejected: 'مرفوض',
};

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
  const { t, dir } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deal, setDeal] = useState<EvaluationOpportunityApi | null>(null);
  const [offers, setOffers] = useState<EvaluationOfferApi[]>([]);

  // Per-offer form edits
  const [evalForms, setEvalForms] = useState<Record<string, EvaluationFormState>>({});

  // Provisional award form
  const [winningOfferId, setWinningOfferId] = useState('');
  const [awardMethod, setAwardMethod] = useState<'least_cost' | 'best_value'>('least_cost');
  const [awardNotes, setAwardNotes] = useState('');
  const [awarding, setAwarding] = useState(false);
  const [awardSuccess, setAwardSuccess] = useState<ConcludeEvaluationResponseApi | null>(null);

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

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
      setError(getApiErrorMessage(err, 'حدث خطأ أثناء تحميل فضاء التقييم'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSaveOfferEval = async (offerId: string) => {
    const form = evalForms[offerId];
    if (!form) return;

    if (form.evaluationStatus === 'rejected' && !form.rejectionReason.trim()) {
      setError('يرجى تحديد سبب الإقصاء/عدم المطابقة وفق دفتر الشروط.');
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

      setSuccess(
        `${data.message || 'تم حفظ تقييم العرض بنجاح.'} حالة العرض الآن: ${
          EVALUATION_STATUS_LABELS[nextStatus]
        }.`
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'حدث خطأ أثناء حفظ التقييم'));
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
      setError('يرجى اختيار العرض الفائز المقترح للمنح المؤقت.');
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
      setSuccess(data.message || 'تم اعتماد التقييم النهائي للجنة والمنح المؤقت بنجاح.');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'حدث خطأ أثناء اعتماد المنح المؤقت'));
    } finally {
      setAwarding(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">جاري فتح فضاء فحص وتقييم العروض...</span>
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
            تتطلب ورشة فحص وتقييم العروض تحديد الصفقة المستهدفة وفقاً للإجراءات القانونية. يرجى اختيار الصفقة من قائمة الصفقات للبدء في تقييم العروض المقبولة.
          </p>
          <Button
            variant="default"
            className="rounded-xl text-xs"
            onClick={() => setLocation('/authority/drafts')}
          >
            الانتقال إلى الصفقات والمسودات
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
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1.5 h-auto rounded-lg"
              onClick={() => setLocation(`/authority/opportunities/${id}/opening`)}
            >
              <ArrowIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold text-navy-100 uppercase tracking-wider">
              {t('lifecycle.opening.decree_ref')}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {t('lifecycle.eval.title')}
          </h2>
          <p className="text-xs text-navy-100">
            الصفقة: <span className="font-bold text-white">{deal?.title}</span>
          </p>
        </div>

        {/* Status Pill */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className="p-2.5 rounded-xl border bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-navy-100">مرحلة التقييم</div>
            <div className="text-sm font-black text-white">
              {isAwardConcluded ? 'تم المنح المؤقت' : 'فحص العروض والترتيب'}
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
            تم اعتماد التقييم النهائي للجنة والمنح المؤقت للصفقة رسمياً، وتمت ترقية الصفقة إلى مرحلة الإسناد والطعون.
          </p>
          <div className="text-xs font-mono bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-1">
            {awardSuccess?.message && (
              <div className="text-emerald-900">{awardSuccess.message}</div>
            )}
            {awardSuccess?.winningOfferId && (
              <div className="break-all text-slate-700">
                العرض الفائز:{' '}
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
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            {t('lifecycle.eval.candidature_tech')}
          </h3>
          <span className="text-xs text-muted-foreground">
            {offers.length} عروض قيد الدراسة
          </span>
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
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}
                        >
                          {EVALUATION_STATUS_LABELS[offer.evaluationStatus]}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>مبلغ العرض: <strong className="text-navy-900 font-mono">{offer.financialAmount ? Number(offer.financialAmount).toLocaleString() + ' دج' : '—'}</strong></span>
                        <span>· مدة الإنجاز: {offer.durationDays ? `${offer.durationDays} يوم` : '—'}</span>
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
                      <span className="text-xs text-muted-foreground">لا يوجد ملف مرفق</span>
                    )}
                  </div>
                </div>

                {/* Evaluation Form for this Offer */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">قرار المطابقة والقبول</Label>
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
                      placeholder="مثال: 85 (وفق شبكة التنقيط)"
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">العلامة المالية</Label>
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
                      placeholder="مثال: 90 (وفق معايير التقييم المالي)"
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
                      placeholder="إلزامي في حال الإقصاء أو عدم المطابقة"
                      className="text-xs rounded-xl"
                      disabled={
                        form.saving ||
                        isAwardConcluded ||
                        form.evaluationStatus !== 'rejected'
                      }
                    />
                  </div>

                  <div className="md:col-span-2 xl:col-span-4 space-y-1.5">
                    <Label className="text-xs font-semibold">{t('lifecycle.eval.notes')}</Label>
                    <Textarea
                      value={form.evaluatorNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEvalForms((prev) => ({
                          ...prev,
                          [offer.id]: { ...prev[offer.id], evaluatorNotes: e.target.value },
                        }))
                      }
                      placeholder="تفاصيل التقييم التقني والمالي، المؤهلات، التحفظات..."
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
                      {form.saving ? 'جاري حفظ التقييم...' : t('lifecycle.eval.save_eval')}
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
            {admittedOffers.length} عروض مقبولة مؤهلة للمنح
          </span>
        </div>

        {admittedOffers.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
            لم يتم قبول أي عرض بعد في التقييم التقني. يرجى إتمام فحص وتأهيل العروض أولاً.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-navy-900">
                    <th className="p-3 font-bold">الترتيب</th>
                    <th className="p-3 font-bold">المتعامل الاقتصادي</th>
                    <th className="p-3 font-bold">العلامة التقنية</th>
                    <th className="p-3 font-bold">العلامة المالية</th>
                    <th className="p-3 font-bold">المبلغ المقترح (دج)</th>
                    <th className="p-3 font-bold">مدة الإنجاز</th>
                    <th className="p-3 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {admittedOffers
                    .slice()
                    .sort((a, b) => Number(a.financialAmount || 0) - Number(b.financialAmount || 0))
                    .map((item, idx) => (
                      <tr key={item.id} className="hover:bg-muted/10">
                        <td className="p-3 font-mono font-black text-amber-700">#{idx + 1}</td>
                        <td className="p-3 font-bold text-navy-900">{item.bidderName}</td>
                        <td className="p-3 font-mono">{item.technicalScore || '—'} / 100</td>
                        <td className="p-3 font-mono">{item.financialScore || '—'} / 100</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">
                          {item.financialAmount
                            ? Number(item.financialAmount).toLocaleString() + ' دج'
                            : '—'}
                        </td>
                        <td className="p-3 text-muted-foreground">{item.durationDays ? `${item.durationDays} يوم` : '—'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.evaluationStatus === 'evaluated'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {EVALUATION_STATUS_LABELS[item.evaluationStatus]}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Provisional Award Form */}
            {!isAwardConcluded && (
              <div className="p-5 bg-navy-50/50 border border-navy-100 rounded-xl space-y-4 mt-4">
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
                      <option value="">-- اختر العارض الفائز المقترح --</option>
                      {admittedOffers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.bidderName} ({o.financialAmount ? Number(o.financialAmount).toLocaleString() + ' دج' : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">طريقة اختيار العرض *</Label>
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
                    <Label className="text-xs font-semibold">ملاحظات ومبررات اقتراح المنح</Label>
                    <Textarea
                      value={awardNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAwardNotes(e.target.value)}
                      placeholder="مبررات الاختيار وفق دفتر الشروط والنتائج التقنية والمالية..."
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
                  {awarding ? 'جاري اعتماد التقييم النهائي...' : t('lifecycle.eval.conclude_btn')}
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
