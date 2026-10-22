import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OfferDetail {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  authorityName: string;
  technicalProposal: string;
  financialOffer: string;
  deliveryTimeDays: string | null;
  hasDocument: boolean;
  status: 'draft' | 'submitted';
  submittedAt: string | null;
}

interface OfferFormProps {
  offerId?: string;
  opportunityId?: string;
}

export function OfferForm({ offerId, opportunityId }: OfferFormProps) {
  const params = useParams<{ id?: string; oppId?: string }>();
  const activeOfferId = offerId || (params.id && !params.oppId ? params.id : undefined);
  const activeOppId = opportunityId || params.oppId;

  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [id, setId] = useState<string | undefined>(activeOfferId);
  const [oppId, setOppId] = useState<string>(activeOppId || '');
  const [oppTitle, setOppTitle] = useState('');
  const [authorityName, setAuthorityName] = useState('');

  const [technicalProposal, setTechnicalProposal] = useState('');
  const [financialOffer, setFinancialOffer] = useState('');
  const [deliveryTimeDays, setDeliveryTimeDays] = useState('');
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
  const [hasDocument, setHasDocument] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeOfferId) {
      api.get(`/bids/offers/${activeOfferId}/`)
        .then((res) => {
          const o = res.data;
          setId(o.id);
          setOppId(o.deal);
          setOppTitle(o.deal_title || 'صفقة عمومية');
          setAuthorityName(o.authority_name || 'المصلحة المتعاقدة');
          setTechnicalProposal(typeof o.technical_offer === 'string' ? o.technical_offer : 'ملف العرض التقني مكتمل');
          setFinancialOffer(o.financial_amount ? String(o.financial_amount) : '');
          setStatus(o.status === 'submitted' ? 'submitted' : 'draft');
          setHasDocument(!!o.encrypted_hash);
        })
        .catch(() => {
          setError(t('offers.empty'));
        })
        .finally(() => setLoading(false));
    } else if (activeOppId) {
      api.get('/bids/offers/')
        .then((res) => {
          const items = Array.isArray(res.data) ? res.data : res.data?.results || [];
          const existing = items.find((o: any) => String(o.deal) === String(activeOppId));
          if (existing) {
            setLocation(`/operator/offers/${existing.id}`);
            return;
          }
          return api.get(`/procurements/deals/${activeOppId}/`)
            .then((dealRes) => {
              const deal = dealRes.data;
              if (deal) {
                setOppTitle(deal.title);
                setAuthorityName(deal.authority_entity || deal.authority_name || 'المصلحة المتعاقدة');
                setOppId(deal.id);
              }
            });
        })
        .catch(() => {
          setError('Opportunity not found');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeOfferId, activeOppId, setLocation, t]);

  const handleSaveDraft = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (technicalProposal.length < 5) {
      setError('المقترح الفني يجب أن لا يقل عن 5 أحرف');
      return;
    }
    if (!financialOffer) {
      setError('يرجى تحديد المبلغ المقترح');
      return;
    }

    try {
      const payload: Record<string, any> = {
        deal: oppId,
        financial_amount: parseFloat(financialOffer),
        status: 'draft',
      };

      if (id) {
        const res = await api.patch(`/bids/offers/${id}/`, payload);
        if (res.data?.id) setId(res.data.id);
      } else {
        const res = await api.post('/bids/offers/', payload);
        if (res.data?.id) setId(res.data.id);
      }

      setSuccessMsg(t('offers.msg.saved'));
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Error saving offer');
    }
  };

  const handleSubmitOffer = async () => {
    if (!id) {
      setError('يرجى حفظ المسودة أولاً قبل الإيداع');
      return;
    }

    const confirmed = window.confirm(t('offers.msg.confirm_warn'));
    if (!confirmed) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.patch(`/bids/offers/${id}/`, {
        status: 'submitted',
      });

      setStatus('submitted');
      setSuccessMsg(t('offers.msg.submitted'));
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {id ? (status === 'draft' ? t('offers.edit') : t('offers.view')) : t('offers.new')}
          </h1>
          {oppTitle && (
            <p className="text-sm text-gray-600 mt-1">
              الفرصة: <span className="font-semibold text-navy-950">{oppTitle}</span> ({authorityName})
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setLocation('/operator/offers')}>
          {t('offers.title')}
        </Button>
      </div>

      {status === 'submitted' && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-md">
          <p className="font-bold">{t('offers.status.submitted')}</p>
          <p className="text-sm mt-1">{t('offers.msg.frozen')}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSaveDraft} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('offers.field.technical')} *
          </label>
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={technicalProposal}
            onChange={(e) => setTechnicalProposal(e.target.value)}
            required
            minLength={5}
            rows={5}
            disabled={status === 'submitted'}
            placeholder="اذكر المنهجية، والمواصفات الفنية للحل المقترح..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('offers.field.financial')} *
            </label>
            <Input
              value={financialOffer}
              onChange={(e) => setFinancialOffer(e.target.value)}
              required
              disabled={status === 'submitted'}
              placeholder="مثال: 4500000 د.ج"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('offers.field.delivery')}
            </label>
            <Input
              type="number"
              value={deliveryTimeDays}
              onChange={(e) => setDeliveryTimeDays(e.target.value)}
              disabled={status === 'submitted'}
              placeholder="مثال: 45"
            />
          </div>
        </div>

        {id && (
          <div className="pt-3 pb-3 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('offers.field.doc')}
            </label>
            {status === 'submitted' ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-sm text-gray-600">
                  {hasDocument ? 'تم إيداع الوثيقة وهي مجمّدة.' : 'لم يتم إرفاق وثيقة.'}
                </span>
                {hasDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(`/api/offers/${id}/document`, '_blank')}
                  >
                    {t('drafts.doc.view')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append('document', file);

                    try {
                      const res = await fetch(`/api/offers/${id}/document`, {
                        method: 'POST',
                        headers: {
                          'x-safaqat-csrf': '1',
                        },
                        body: formData,
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data.error || 'Upload failed');
                      }
                      setHasDocument(true);
                      alert(t('drafts.doc.success'));
                    } catch (err: any) {
                      alert(err.message || t('drafts.doc.error'));
                    }
                  }}
                />
                {hasDocument && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(`/api/offers/${id}/document`, '_blank')}
                  >
                    {t('drafts.doc.view')}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
          <Button type="button" variant="outline" onClick={() => setLocation('/operator/offers')}>
            {t('drafts.btn.cancel')}
          </Button>

          {status === 'draft' && (
            <div className="flex gap-2">
              <Button type="submit" variant="outline">
                {t('offers.btn.save_draft')}
              </Button>
              {id && (
                <Button
                  type="button"
                  onClick={handleSubmitOffer}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? '...' : t('offers.btn.submit')}
                </Button>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
