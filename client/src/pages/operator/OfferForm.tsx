import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Paperclip,
  Save,
  Send,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';

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
          setError('لم يتم العثور على الصفقة المطلوبة.');
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

    if (!oppId) {
      setError('يرجى اختيار الصفقة أولاً قبل حفظ العرض.');
      return;
    }
    if (technicalProposal.length < 5) {
      setError('المقترح الفني يجب ألا يقل عن 5 أحرف.');
      return;
    }
    if (!financialOffer) {
      setError('يرجى تحديد المبلغ المقترح.');
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
      setError(err?.response?.data?.detail || err?.message || 'تعذر حفظ العرض.');
    }
  };

  const handleSubmitOffer = async () => {
    if (!id) {
      setError('يرجى حفظ المسودة أولاً قبل الإيداع.');
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
      setError(err?.response?.data?.detail || err?.message || 'تعذر إيداع العرض.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="op-page">
        <div className="op-page-head">
          <div>
            <div className="op-skeleton h-7 w-52" />
            <div className="op-skeleton mt-2 h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="op-skeleton h-28 w-full" />
        <div className="op-skeleton h-56 w-full" />
        <div className="op-skeleton h-44 w-full" />
      </div>
    );
  }

  const isSubmitted = status === 'submitted';

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <h1>
            {id ? (isSubmitted ? t('offers.view') : t('offers.edit')) : t('offers.new')}
          </h1>
          {oppTitle ? (
            <p>
              الفرصة: <strong className="text-[var(--op-ink)]">{oppTitle}</strong>
              {authorityName ? ` — ${authorityName}` : ''}
            </p>
          ) : (
            <p>قدّم عرضك التقني والمالي مع الوثائق المطلوبة على إحدى الصفقات.</p>
          )}
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/offers')}
          >
            <X aria-hidden="true" />
            <span>{t('offers.title')}</span>
          </button>
        </div>
      </div>

      <div className="op-info-banner">
        <Info aria-hidden="true" />
        <div>
          <strong>{isSubmitted ? 'تم إيداع العرض رسمياً' : 'يمكنك الحفظ كمسودة'}</strong>
          <p>
            {isSubmitted
              ? 'العرض مقفل بعد الإيداع ولا يمكن تعديل مضمونه. يمكنك مراجعة تفاصيله من قائمة العروض.'
              : 'سيتم حفظ العرض كمسودة ولن يُرسل إلى المصلحة المتعاقدة حتى تضغط «تقديم العرض».'}
          </p>
        </div>
      </div>

      {isSubmitted && (
        <div className="op-alert success">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong className="block text-[13px]">{t('offers.status.submitted')}</strong>
            <span>{t('offers.msg.frozen')}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="op-alert error" role="alert">
          <AlertCircle aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="op-alert success" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveDraft} className="flex flex-col gap-[18px]">
        <section className="op-form-block">
          <div className="op-form-block-head">
            <span className="op-num">1</span>
            <h2>الصفقة</h2>
          </div>
          <div className="op-form-block-body">
            <div className="op-form-grid">
              <div className="op-field full">
                <label htmlFor="offer-deal">الصفقة المراد التقديم عليها</label>
                <input
                  id="offer-deal"
                  type="text"
                  value={oppTitle || 'لم يتم اختيار صفقة'}
                  readOnly
                  disabled
                />
                <span className="op-hint">
                  يمكنك بدء عرض جديد من صفحة تفاصيل الصفقة، أو متابعة مسودة موجودة من قائمة العروض.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="op-form-block">
          <div className="op-form-block-head">
            <span className="op-num">2</span>
            <h2>العرض التقني</h2>
          </div>
          <div className="op-form-block-body">
            <div className="op-form-grid">
              <div className="op-field full">
                <label htmlFor="technical-proposal">
                  المنهجية المقترحة <span className="op-required">*</span>
                </label>
                <textarea
                  id="technical-proposal"
                  value={technicalProposal}
                  onChange={(event) => setTechnicalProposal(event.target.value)}
                  required
                  minLength={5}
                  rows={6}
                  disabled={isSubmitted}
                  placeholder="اشرح منهجيتك في تنفيذ الصفقة، والمواصفات الفنية للحل المقترح..."
                />
              </div>

              <div className="op-field">
                <label htmlFor="delivery-time">المدة المقترحة للتنفيذ</label>
                <input
                  id="delivery-time"
                  type="number"
                  min={1}
                  value={deliveryTimeDays}
                  onChange={(event) => setDeliveryTimeDays(event.target.value)}
                  disabled={isSubmitted}
                  placeholder="عدد الأيام"
                />
                <span className="op-hint">اختياري — يمكن تحديد المدة بالأيام.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="op-form-block">
          <div className="op-form-block-head">
            <span className="op-num">3</span>
            <h2>العرض المالي</h2>
          </div>
          <div className="op-form-block-body">
            <div className="op-form-grid">
              <div className="op-field">
                <label htmlFor="financial-offer">
                  المبلغ الإجمالي <span className="op-required">*</span>
                </label>
                <input
                  id="financial-offer"
                  type="number"
                  min={0}
                  step="0.01"
                  value={financialOffer}
                  onChange={(event) => setFinancialOffer(event.target.value)}
                  required
                  disabled={isSubmitted}
                  placeholder="0.00"
                />
                <span className="op-hint">المبلغ بالدينار الجزائري (DZD).</span>
              </div>

              <div className="op-field">
                <label htmlFor="financial-currency">العملة</label>
                <input
                  id="financial-currency"
                  type="text"
                  value="دينار جزائري (DZD)"
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>
        </section>

        {id && (
          <section className="op-form-block">
            <div className="op-form-block-head">
              <span className="op-num">4</span>
              <h2>الوثيقة المرفقة</h2>
            </div>
            <div className="op-form-block-body">
              {isSubmitted ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4">
                  <span className="flex items-center gap-2 text-xs text-[var(--op-text)]">
                    <Paperclip className="size-4 text-[var(--op-muted)]" aria-hidden="true" />
                    {hasDocument ? 'تم إيداع الوثيقة وهي مجمّدة.' : 'لم يتم إرفاق وثيقة.'}
                  </span>
                  {hasDocument && (
                    <button
                      type="button"
                      className="op-btn op-btn-outline op-btn-sm"
                      onClick={() => window.open(`/api/offers/${id}/document`, '_blank')}
                    >
                      {t('drafts.doc.view')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="op-field">
                  <label htmlFor="offer-document">الوثيقة (PDF)</label>
                  <input
                    id="offer-document"
                    type="file"
                    accept="application/pdf"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
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
                          throw new Error(data.error || 'فشل رفع الوثيقة');
                        }
                        setHasDocument(true);
                        alert(t('drafts.doc.success'));
                      } catch (err: any) {
                        alert(err.message || t('drafts.doc.error'));
                      }
                    }}
                  />
                  <span className="op-hint">
                    يمكنك إرفاق نسخة PDF واحدة. {hasDocument ? 'تم رفع وثيقة مسبقاً.' : 'لم يتم رفع وثيقة بعد.'}
                  </span>
                  {hasDocument && (
                    <button
                      type="button"
                      className="op-btn op-btn-ghost op-btn-sm mt-1 self-start"
                      onClick={() => window.open(`/api/offers/${id}/document`, '_blank')}
                    >
                      <Upload aria-hidden="true" />
                      <span>{t('drafts.doc.view')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="op-form-block">
          <div className="op-form-block-head">
            <span className="op-num">{id ? 5 : 4}</span>
            <h2>التصريح</h2>
          </div>
          <div className="op-form-block-body">
            <div className="op-alert warning">
              <ShieldCheck aria-hidden="true" />
              <span>
                أُقرّ بأن جميع البيانات والوثائق المرفقة صحيحة ومطابقة للواقع، وألتزم بشروط الصفقة
                ودفتر الشروط. يتطلب الإيداع النهائي تأكيداً قبل الإرسال.
              </span>
            </div>
          </div>
        </section>

        <div className="op-action-bar">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/offers')}
          >
            {t('drafts.btn.cancel')}
          </button>

          {!isSubmitted && (
            <>
              <button type="submit" className="op-btn op-btn-ghost">
                <Save aria-hidden="true" />
                <span>{t('offers.btn.save_draft')}</span>
              </button>

              {id && (
                <button
                  type="button"
                  className="op-btn op-btn-gold"
                  onClick={handleSubmitOffer}
                  disabled={isSubmitting}
                >
                  <Send aria-hidden="true" />
                  <span>{isSubmitting ? 'جارٍ الإيداع...' : t('offers.btn.submit')}</span>
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default OfferForm;
