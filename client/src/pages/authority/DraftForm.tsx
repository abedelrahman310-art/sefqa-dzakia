import React, { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FileText, ArrowRight, ArrowLeft, Upload, FileCheck, Send, AlertCircle } from 'lucide-react';
import { usePriceEstimate } from '@/features/ai/hooks/useAI';
import { AIPriceAssistant } from '@/features/ai/components/AIPriceAssistant';
import { ALGERIA_69_WILAYAS } from '@/lib/wilayas';

export function DraftForm({ id }: { id?: string }) {
  const { t, dir } = useI18n();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const defaultWilaya = (user as any)?.wilaya || '16';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<'works' | 'supplies' | 'services' | 'studies'>('works');
  const [wilaya, setWilaya] = useState<string>(defaultWilaya);
  const [budget, setBudget] = useState('');
  const [showPriceAssistant, setShowPriceAssistant] = useState(true);
  const [loading, setLoading] = useState(id ? true : false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [hasDoc, setHasDoc] = useState(false);

  // Hook for advisory budget estimation
  const priceEstimatePayload = useMemo(() => {
    if (!description || description.trim().length < 10) return null;
    return {
      template_type: templateType,
      description: description.trim(),
      wilaya: wilaya || defaultWilaya,
    };
  }, [templateType, description, wilaya, defaultWilaya]);

  const {
    estimate,
    isLoading: isEstimating,
    error: priceError,
    refetch: refetchPrice,
  } = usePriceEstimate(priceEstimatePayload);

  useEffect(() => {
    if (id) {
      api.get(`/procurements/deals/${id}/`)
        .then((res) => {
          const deal = res.data;
          if (deal) {
            setTitle(deal.title || '');
            setDescription(deal.description || '');
            setBudget(deal.estimated_budget ? String(deal.estimated_budget) : '');
            if (deal.wilaya) setWilaya(deal.wilaya);
            setStatus(deal.current_stage >= 3 ? 'published' : 'draft');
            setHasDoc(!!deal.cahier_specs);
          }
        })
        .catch(() => {
          setLocation('/authority/drafts');
        })
        .finally(() => setLoading(false));
    }
  }, [id, setLocation]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    if (!showPriceAssistant) {
      setShowPriceAssistant(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (title.length < 3) {
      setSubmitting(false);
      return setError(t('drafts.msg.error'));
    }
    if (description.length < 5) {
      setSubmitting(false);
      return setError(t('drafts.msg.error'));
    }

    try {
      const payload: Record<string, any> = {
        title,
        description,
        wilaya,
        estimated_budget: budget ? parseFloat(budget) : null,
      };

      if (id) {
        await api.patch(`/procurements/deals/${id}/`, payload);
        toast.success(t('authority.drafts.update_success'));
      } else {
        await api.post('/procurements/deals/', payload);
        toast.success(t('authority.drafts.create_success'));
      }

      setLocation('/authority/drafts');
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || t('drafts.msg.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    if (!window.confirm(t('authority.drafts.publish_confirm'))) {
      return;
    }
    try {
      await api.patch(`/procurements/deals/${id}/`, {
        current_stage: 3,
      });
      toast.success(t('authority.drafts.publish_success'));
      setStatus('published');
      setLocation('/authority/drafts');
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || t('drafts.msg.error'));
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">{t('authority.drafts.loading_single')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-navy-900 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1.5 h-auto rounded-lg"
              onClick={() => setLocation('/authority/drafts')}
            >
              <ArrowIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold text-navy-100">
              {id ? (status === 'published' ? t('authority.drafts.preview_published') : t('authority.drafts.edit_draft')) : t('authority.drafts.create_new')}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {id ? title || t('drafts.btn.edit') : t('drafts.new')}
          </h2>
          <p className="text-xs text-navy-100">
            {status === 'published'
              ? t('authority.drafts.published_frozen_notice')
              : t('authority.drafts.draft_initial_notice')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          {status === 'published' ? (
            <span className="text-xs bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 px-3 py-1.5 rounded-xl font-bold">
              {t('authority.drafts.badge.published')}
            </span>
          ) : (
            id && (
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-2 shadow"
                onClick={handlePublish}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('drafts.btn.publish')}</span>
              </Button>
            )
          )}
        </div>
      </section>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Panel */}
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 block">
              {t('drafts.field.title')} <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={255}
              disabled={status === 'published'}
              placeholder={t('authority.drafts.title_placeholder')}
              className="rounded-xl"
            />
            <span className="text-xs text-muted-foreground block">
              {t('authority.drafts.title_help')}
            </span>
          </div>

          {/* Template Type & Wilaya Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Template Type */}
            <div className="space-y-2 text-start">
              <label className="text-sm font-bold text-navy-900 block">
                {t('ai.price_template')} <span className="text-destructive">*</span>
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as any)}
                disabled={status === 'published'}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="works">{t('ai.price_template_works')}</option>
                <option value="supplies">{t('ai.price_template_supplies')}</option>
                <option value="services">{t('ai.price_template_services')}</option>
                <option value="studies">{t('ai.price_template_studies')}</option>
              </select>
              <span className="text-xs text-muted-foreground block">
                {t('authority.drafts.type_help')}
              </span>
            </div>

            {/* Wilaya (58 wilayas) */}
            <div className="space-y-2 text-start">
              <label className="text-sm font-bold text-navy-900 block">
                {t('ai.price_wilaya')} <span className="text-destructive">*</span>
              </label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                disabled={status === 'published'}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ALGERIA_69_WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {dir === 'rtl' ? w.ar : w.fr} ({dir === 'rtl' ? w.fr : w.ar})
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground block">
                {t('authority.drafts.wilaya_help')}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 text-start">
            <label className="text-sm font-bold text-navy-900 block">
              {t('drafts.field.desc')} <span className="text-destructive">*</span>
            </label>
            <textarea
              className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={description}
              onChange={handleDescriptionChange}
              required
              minLength={5}
              maxLength={2000}
              rows={4}
              disabled={status === 'published'}
              placeholder={t('authority.drafts.desc_placeholder')}
            />
            <span className="text-xs text-muted-foreground block">
              {t('authority.drafts.desc_help')}
            </span>
          </div>

          {/* AI Price Assistant appears automatically while typing description */}
          {description.trim().length >= 10 && showPriceAssistant && (
            <AIPriceAssistant
              estimate={estimate}
              isLoading={isEstimating}
              error={priceError}
              onRefetch={refetchPrice}
              onUseEstimate={(avg) => {
                setBudget(String(avg));
                toast.success(t('ai.price_applied'));
              }}
              onDismiss={() => setShowPriceAssistant(false)}
            />
          )}

          {/* Budget */}
          <div className="space-y-2 text-start">
            <label className="text-sm font-bold text-navy-900 block">
              {t('drafts.field.budget')}
            </label>
            <Input
              type="number"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={status === 'published'}
              placeholder="1500000"
              className="rounded-xl font-mono tabular-nums"
            />
            <span className="text-xs text-muted-foreground block">
              {t('authority.drafts.budget_help')}
            </span>
          </div>

          {/* Document Section */}
          {id && (
            <div className="pt-4 pb-2 border-t border-border space-y-3">
              <label className="text-sm font-bold text-navy-900 block">
                {t('drafts.doc.upload')}
              </label>

              {status === 'published' ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <span className="text-xs font-semibold block text-navy-900">
                        {t('authority.drafts.specs_doc_label')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('drafts.doc.frozen')}
                      </span>
                    </div>
                  </div>
                  {hasDoc && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-xl"
                      onClick={() => window.open(`/api/drafts/${id}/document`, '_blank')}
                    >
                      {t('drafts.doc.view')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-navy-50 text-navy-900 rounded-xl">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy-900">
                          {hasDoc ? t('authority.drafts.update_pdf') : t('authority.drafts.upload_pdf')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('authority.drafts.pdf_max_size')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="text-xs w-auto file:rounded-lg file:border-0 file:bg-navy-900 file:text-white file:text-xs file:font-semibold"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const formData = new FormData();
                          formData.append('document', file);

                          try {
                            const res = await fetch(`/api/drafts/${id}/document`, {
                              method: 'POST',
                              headers: {
                                'x-safaqat-csrf': '1',
                              },
                              body: formData,
                            });
                            if (!res.ok) {
                              const errData = await res.json().catch(() => ({}));
                              throw new Error(errData.error || t('authority.drafts.upload_failed'));
                            }
                            setHasDoc(true);
                            alert(t('drafts.doc.success'));
                          } catch (err: any) {
                            alert(err.message || t('drafts.doc.error'));
                          }
                        }}
                      />
                      {hasDoc && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs rounded-xl shrink-0"
                          onClick={() => window.open(`/api/drafts/${id}/document`, '_blank')}
                        >
                          <FileCheck className="w-3.5 h-3.5 me-1 text-emerald-600" />
                          <span>{t('drafts.doc.view')}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="text-xs rounded-xl"
              onClick={() => setLocation('/authority/drafts')}
            >
              {t('drafts.btn.cancel')}
            </Button>
            {status === 'draft' && (
              <Button
                type="submit"
                disabled={submitting}
                className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl px-5"
              >
                {submitting ? t('common.saving') : t('drafts.btn.save')}
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
