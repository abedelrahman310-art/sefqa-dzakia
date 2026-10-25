import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Info,
  ListChecks,
  Loader2,
  Paperclip,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';

interface OfferFormProps {
  offerId?: string;
  opportunityId?: string;
}

type WizardStep = 1 | 2 | 3;

interface ComplianceDocument {
  code: string;
  name: string;
  category?: string;
  description?: string;
  legal_ref?: string;
  is_mandatory?: boolean;
}

interface ComplianceResult {
  deal_id: string;
  deal_reference?: string;
  deal_title?: string;
  is_compliant: boolean;
  compliance_score: number;
  total_required: number;
  submitted_count: number;
  missing_count: number;
  missing_documents: ComplianceDocument[];
  available_documents: ComplianceDocument[];
  advisory_notes?: string[];
  submission_deadline?: string | null;
}

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const WIZARD_STEPS: Array<{ id: WizardStep; title: string; hint: string }> = [
  { id: 1, title: 'العرض المالي', hint: 'تحديد المبلغ الإجمالي' },
  { id: 2, title: 'الوثائق والامتثال', hint: 'رفع الملف وفحص النواقص' },
  { id: 3, title: 'المراجعة والإرسال', hint: 'تأكيد العرض وإيداعه' },
];

interface OfferApiRecord {
  id?: string;
  deal?: string | { id?: string };
  opportunityId?: string;
  opportunity_id?: string;
  opportunityTitle?: string;
  opportunity_title?: string;
  deal_title?: string;
  deal_reference?: string;
  authorityName?: string;
  authority_name?: string;
  authority_entity?: string;
  financialOffer?: string | number | null;
  financial_amount?: string | number | null;
  status?: string;
  hasDocument?: boolean;
  has_document?: boolean;
  encrypted_hash?: string | null;
  document?: unknown;
  document_url?: string | null;
  document_file?: string | null;
  document_name?: string | null;
}

const isNotFound = (err: unknown) =>
  (err as { response?: { status?: number } })?.response?.status === 404;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const unwrapList = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.offers)) return record.offers;
  return [];
};

const getDealId = (value: OfferApiRecord['deal']): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.id === 'string') return value.id;
  return '';
};

const getDocumentUrl = (offer: OfferApiRecord): string => {
  const candidates = [offer.document_url, offer.document_file, offer.document];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    const nested = asRecord(candidate);
    const nestedUrl = nested.url ?? nested.file;
    if (typeof nestedUrl === 'string' && nestedUrl.trim()) return nestedUrl.trim();
  }
  return '';
};

const getDocumentName = (offer: OfferApiRecord): string => {
  if (typeof offer.document_name === 'string' && offer.document_name.trim()) {
    return offer.document_name.trim();
  }
  const url = getDocumentUrl(offer);
  if (!url) return '';
  try {
    return decodeURIComponent(url.split('/').filter(Boolean).pop() || '');
  } catch {
    return url.split('/').filter(Boolean).pop() || '';
  }
};

const getErrorMessage = (err: unknown): string => {
  const response = (err as { response?: { data?: unknown } })?.response;
  const data = response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  const record = asRecord(data);
  const detail = record.detail ?? record.error ?? record.message;
  if (typeof detail === 'string' && detail.trim()) return detail;
  const firstValue = Object.values(record)[0];
  if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0];
  if (typeof firstValue === 'string' && firstValue.trim()) return firstValue;
  if (err instanceof Error && err.message) return err.message;
  return 'تعذر إتمام العملية. يرجى المحاولة مجدداً.';
};

const formatAmount = (value: string): string => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString('ar-DZ', { maximumFractionDigits: 2 })} دج`;
};

function ComplianceResultPanel({ result }: { result: ComplianceResult }) {
  const missingDocuments = Array.isArray(result.missing_documents) ? result.missing_documents : [];
  const advisoryNotes = Array.isArray(result.advisory_notes) ? result.advisory_notes : [];

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className={`op-alert ${result.is_compliant ? 'success' : 'warning'}`}>
        {result.is_compliant ? (
          <CheckCircle2 aria-hidden="true" />
        ) : (
          <AlertTriangle aria-hidden="true" />
        )}
        <div>
          <strong className="block text-[13px]">
            {result.is_compliant
              ? 'ملف الامتثال مستوفٍ للوثائق الأساسية'
              : `تم رصد ${result.missing_count} وثيقة ناقصة`}
          </strong>
          <p className="mt-1 text-xs">
            نسبة الامتثال: {result.compliance_score}% — تم العثور على {result.submitted_count} من{' '}
            {result.total_required} وثيقة مطلوبة.
          </p>
        </div>
      </div>

      {missingDocuments.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--op-line)]">
          <div className="flex items-center gap-2 border-b border-[var(--op-line-2)] bg-[var(--op-surface-2)] px-4 py-2.5 text-xs font-extrabold text-[var(--op-ink)]">
            <ListChecks className="size-4 text-[var(--op-gold-dark)]" aria-hidden="true" />
            <span>الوثائق الناقصة</span>
          </div>
          <ul className="divide-y divide-[var(--op-line-2)]">
            {missingDocuments.map((document) => (
              <li key={document.code} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-xs text-[var(--op-ink)]">{document.name}</strong>
                  {document.is_mandatory && <span className="op-chip red">إلزامية</span>}
                </div>
                {document.category && (
                  <p className="mt-1 text-[11px] font-semibold text-[var(--op-muted)]">
                    {document.category}
                    {document.legal_ref ? ` — ${document.legal_ref}` : ''}
                  </p>
                )}
                {document.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--op-text)]">
                    {document.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {advisoryNotes.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-3 text-[11px] leading-relaxed text-[var(--op-text)]">
          {advisoryNotes.map((note) => (
            <li key={note} className="flex items-start gap-2">
              <Info
                className="mt-0.5 size-3.5 shrink-0 text-[var(--op-gold-dark)]"
                aria-hidden="true"
              />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const fetchOffersList = async (): Promise<unknown[]> => {
  try {
    const response = await api.get('/offers/');
    return unwrapList(response.data);
  } catch (err) {
    if (!isNotFound(err)) throw err;
    const response = await api.get('/bids/offers/');
    return unwrapList(response.data);
  }
};

const fetchOffer = async (id: string): Promise<OfferApiRecord> => {
  try {
    const response = await api.get(`/offers/${id}/`);
    return response.data as OfferApiRecord;
  } catch (err) {
    if (!isNotFound(err)) throw err;
    const response = await api.get(`/bids/offers/${id}/`);
    return response.data as OfferApiRecord;
  }
};

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

  const [financialOffer, setFinancialOffer] = useState('');
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
  const [savedDocument, setSavedDocument] = useState<{ name: string; url: string } | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [busyAction, setBusyAction] = useState<'save' | 'submit' | null>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState('');
  const [complianceChecked, setComplianceChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const applyOffer = (offer: OfferApiRecord) => {
      const dealId = getDealId(offer.deal);
      setId(offer.id ? String(offer.id) : activeOfferId);
      if (dealId) setOppId(dealId);
      setOppTitle(
        offer.opportunityTitle || offer.opportunity_title || offer.deal_title || 'صفقة عمومية',
      );
      setAuthorityName(
        offer.authorityName ||
          offer.authority_name ||
          offer.authority_entity ||
          'المصلحة المتعاقدة',
      );
      setFinancialOffer(
        offer.financialOffer !== undefined && offer.financialOffer !== null
          ? String(offer.financialOffer)
          : offer.financial_amount !== undefined && offer.financial_amount !== null
            ? String(offer.financial_amount)
            : '',
      );
      const nextStatus = offer.status === 'draft' ? 'draft' : 'submitted';
      setStatus(nextStatus);
      if (nextStatus === 'submitted') {
        setStep(3);
      }
      const documentUrl = getDocumentUrl(offer);
      if (documentUrl || offer.hasDocument || offer.has_document || offer.encrypted_hash) {
        setSavedDocument({
          name: getDocumentName(offer) || 'وثيقة العرض المرفقة',
          url: documentUrl,
        });
      }
    };

    const load = async () => {
      setLoading(true);
      setError('');
      setStep(1);
      setCompliance(null);
      setComplianceError('');
      setComplianceChecked(false);
      try {
        if (activeOfferId) {
          const offer = await fetchOffer(activeOfferId);
          if (cancelled) return;
          applyOffer(offer);
          const dealId = getDealId(offer.deal);
          if (dealId && (!offer.deal_title || !offer.authority_name)) {
            api
              .get(`/procurements/deals/${dealId}/`)
              .then((response) => {
                if (cancelled) return;
                setOppTitle(response.data?.title || 'صفقة عمومية');
                setAuthorityName(
                  response.data?.authority_entity ||
                    response.data?.authority_name ||
                    'المصلحة المتعاقدة',
                );
              })
              .catch(() => undefined);
          }
        } else if (activeOppId) {
          const offers = await fetchOffersList();
          const existing = offers.find(
            (item) =>
              getDealId(asRecord(item).deal as OfferApiRecord['deal']) === String(activeOppId),
          );
          if (cancelled) return;
          if (existing) {
            const existingId = asRecord(existing).id;
            if (existingId) {
              setLocation(`/operator/offers/${String(existingId)}`);
              return;
            }
          }
          const response = await api.get(`/procurements/deals/${activeOppId}/`);
          if (cancelled) return;
          const deal = response.data;
          setOppTitle(deal?.title || 'صفقة عمومية');
          setAuthorityName(deal?.authority_entity || deal?.authority_name || 'المصلحة المتعاقدة');
          setOppId(String(deal?.id || activeOppId));
        }
      } catch {
        if (!cancelled) {
          setError('تعذر تحميل بيانات العرض. يرجى التحقق من الاتصال والمحاولة مجدداً.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeOfferId, activeOppId, setLocation]);

  const validate = (): string => {
    if (!oppId) return 'يرجى اختيار الصفقة أولاً قبل حفظ العرض.';
    const amount = Number(financialOffer);
    if (!financialOffer.trim() || !Number.isFinite(amount) || amount <= 0) {
      return 'يرجى تحديد مبلغ مالي صحيح أكبر من صفر.';
    }
    return '';
  };

  const runComplianceCheck = async (): Promise<boolean> => {
    if (!oppId) {
      setComplianceError('يرجى اختيار الصفقة أولاً قبل فحص الامتثال.');
      return false;
    }

    setComplianceLoading(true);
    setComplianceError('');
    try {
      const { data } = await api.post<ComplianceResult>('/operator/check-compliance/', {
        deal_id: oppId,
      });
      setCompliance(data);
      setComplianceChecked(true);
      return true;
    } catch (err) {
      setCompliance(null);
      setComplianceChecked(false);
      setComplianceError(getErrorMessage(err) || 'تعذر إجراء فحص الامتثال. يرجى المحاولة مجدداً.');
      return false;
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleContinueToDocuments = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccessMsg('');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleContinueToReview = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccessMsg('');
      setStep(1);
      return;
    }

    setError('');
    const checked = await runComplianceCheck();
    if (checked) {
      setStep(3);
    }
  };

  const buildFormData = (nextStatus: 'draft' | 'submitted'): FormData => {
    const formData = new FormData();
    formData.append('deal', oppId);
    formData.append('financial_amount', String(Number(financialOffer)));
    formData.append('status', nextStatus);
    if (documentFile) {
      formData.append('document', documentFile, documentFile.name);
    }
    return formData;
  };

  const persistOffer = async (nextStatus: 'draft' | 'submitted'): Promise<OfferApiRecord> => {
    const formData = buildFormData(nextStatus);
    const jsonPayload = {
      deal: oppId,
      financial_amount: Number(financialOffer),
      status: nextStatus,
    };

    if (id) {
      try {
        const response = await api.patch(`/offers/${id}/`, formData);
        return response.data as OfferApiRecord;
      } catch (err) {
        if (!isNotFound(err) || documentFile) throw err;
        const response = await api.patch(`/bids/offers/${id}/`, jsonPayload);
        return response.data as OfferApiRecord;
      }
    }

    try {
      const response = await api.post('/offers/', formData);
      return response.data as OfferApiRecord;
    } catch (err) {
      if (!isNotFound(err) || documentFile) throw err;
      const response = await api.post('/bids/offers/', jsonPayload);
      return response.data as OfferApiRecord;
    }
  };

  const saveOffer = async (nextStatus: 'draft' | 'submitted') => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSuccessMsg('');
      return;
    }

    setBusyAction(nextStatus === 'draft' ? 'save' : 'submit');
    setError('');
    setSuccessMsg('');

    try {
      const saved = await persistOffer(nextStatus);
      if (saved.id) setId(String(saved.id));
      if (documentFile) {
        const url = getDocumentUrl(saved);
        setSavedDocument({ name: documentFile.name, url });
        setDocumentFile(null);
      }
      const persistedStatus: 'draft' | 'submitted' =
        saved.status === 'draft' ? 'draft' : saved.status ? 'submitted' : nextStatus;
      if (nextStatus === 'submitted' && persistedStatus === 'draft') {
        setStatus('draft');
        setError(
          'لم يؤكد الخادم إيداع العرض، وما زال محفوظاً كمسودة. يرجى المحاولة مجدداً أو التواصل مع الدعم.',
        );
        return;
      }
      setStatus(persistedStatus);
      if (persistedStatus === 'submitted') {
        setStep(3);
      }
      setSuccessMsg(
        persistedStatus === 'draft' ? t('offers.msg.saved') : t('offers.msg.submitted'),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveDraft = async (event?: FormEvent) => {
    event?.preventDefault();
    await saveOffer('draft');
  };

  const handleSubmitOffer = async () => {
    const confirmed = window.confirm(t('offers.msg.confirm_warn'));
    if (!confirmed) return;
    await saveOffer('submitted');
  };

  const handleDocumentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('يرجى اختيار ملف PDF فقط.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      setError('حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميغابايت).');
      event.target.value = '';
      return;
    }
    setError('');
    setDocumentFile(file);
    setCompliance(null);
    setComplianceChecked(false);
    setComplianceError('');
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
  const isBusy = busyAction !== null;
  const documentName = documentFile?.name || savedDocument?.name || '';
  const documentUrl = savedDocument?.url || '';

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <h1>{id ? (isSubmitted ? t('offers.view') : t('offers.edit')) : t('offers.new')}</h1>
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

      {!isSubmitted && (
        <ol className="grid gap-2 sm:grid-cols-3" aria-label="خطوات تقديم العرض">
          {WIZARD_STEPS.map((wizardStep) => {
            const active = step === wizardStep.id;
            const done = step > wizardStep.id || (wizardStep.id === 2 && complianceChecked);
            return (
              <li key={wizardStep.id}>
                <div
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    active
                      ? 'border-[var(--op-gold-line)] bg-[var(--op-gold-soft)]'
                      : 'border-[var(--op-line)] bg-[var(--op-surface)]'
                  }`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                      done
                        ? 'bg-[var(--op-green-soft)] text-[var(--op-green-dark)]'
                        : active
                          ? 'bg-[var(--op-gold)] text-white'
                          : 'bg-[var(--op-line-2)] text-[var(--op-muted)]'
                    }`}
                  >
                    {done ? <CheckCircle2 className="size-4" aria-hidden="true" /> : wizardStep.id}
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-xs font-extrabold text-[var(--op-ink)]">
                      {wizardStep.title}
                    </strong>
                    <span className="block text-[11px] text-[var(--op-muted)]">
                      {wizardStep.hint}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <form onSubmit={handleSaveDraft} className="flex flex-col gap-[18px]">
        {step === 1 && (
          <>
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
                      يمكنك بدء عرض جديد من صفحة تفاصيل الصفقة، أو متابعة مسودة موجودة من قائمة
                      العروض.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="op-form-block">
              <div className="op-form-block-head">
                <span className="op-num">2</span>
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
          </>
        )}

        {step === 2 && (
          <>
            <section className="op-form-block">
              <div className="op-form-block-head">
                <span className="op-num">1</span>
                <h2>الوثيقة المرفقة</h2>
              </div>
              <div className="op-form-block-body">
                <div className="flex flex-col gap-3">
                  <p className="m-0 text-xs text-[var(--op-muted)]">
                    أرفق العرض الفني والوثائق الإدارية المطلوبة في ملف PDF واحد. لا تُحفظ الملفات في
                    متصفح هذا الجهاز.
                  </p>
                  {documentName ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4">
                      <span className="flex items-center gap-2 text-xs text-[var(--op-text)]">
                        <Paperclip className="size-4 text-[var(--op-muted)]" aria-hidden="true" />
                        <span className="font-mono font-semibold">{documentName}</span>
                        <span className="op-chip green">
                          {isSubmitted ? 'مجمّدة' : documentFile ? 'جاهزة للإرسال' : 'مرفقة'}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        {documentUrl && (
                          <button
                            type="button"
                            className="op-btn op-btn-outline op-btn-sm"
                            onClick={() =>
                              window.open(documentUrl, '_blank', 'noopener,noreferrer')
                            }
                          >
                            {t('drafts.doc.view')}
                          </button>
                        )}
                        {!isSubmitted && documentFile && (
                          <button
                            type="button"
                            className="op-btn op-btn-ghost op-btn-sm"
                            onClick={() => {
                              setDocumentFile(null);
                              setCompliance(null);
                              setComplianceChecked(false);
                              setComplianceError('');
                            }}
                          >
                            <X aria-hidden="true" />
                            <span>إزالة</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4 text-xs text-[var(--op-muted)]">
                      لم يتم إرفاق وثيقة بعد.
                    </div>
                  )}

                  {!isSubmitted && (
                    <div className="op-field">
                      <label htmlFor="offer-document">إضافة أو استبدال الوثيقة (PDF)</label>
                      <input
                        id="offer-document"
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleDocumentChange}
                        disabled={isBusy}
                      />
                      <span className="op-hint">
                        ملف PDF واحد، بحد أقصى 10 ميغابايت. سيتم إرساله ضمن طلب{' '}
                        <code>FormData</code> إلى خدمة العروض عند الحفظ أو الإيداع، دون حفظه في
                        المتصفح.
                      </span>
                    </div>
                  )}

                  {isSubmitted && savedDocument && !savedDocument.url && (
                    <span className="op-hint">
                      الوثيقة محفوظة على الخادم، ولا يتوفر رابط معاينة مباشر لها.
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="op-form-block">
              <div className="op-form-block-head">
                <span className="op-num">2</span>
                <h2>فحص الامتثال</h2>
              </div>
              <div className="op-form-block-body space-y-3">
                <div className="op-info-banner">
                  <FileCheck2 aria-hidden="true" />
                  <div>
                    <strong>فحص آلي للوثائق قبل المراجعة</strong>
                    <p>
                      عند الضغط على «متابعة إلى المراجعة» يتم استدعاء خدمة فحص الامتثال. تعتمد
                      النتيجة على بيانات ملف مؤسستك والوثائق المحفوظة مسبقاً، وتُعرض الوثائق الناقصة
                      إن وجدت.
                    </p>
                  </div>
                </div>

                {complianceError && (
                  <div className="op-alert error" role="alert">
                    <AlertCircle aria-hidden="true" />
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                      <span>{complianceError}</span>
                      <button
                        type="button"
                        className="op-btn op-btn-outline op-btn-sm"
                        onClick={() => void handleContinueToReview()}
                        disabled={complianceLoading}
                      >
                        <RefreshCw aria-hidden="true" />
                        <span>إعادة المحاولة</span>
                      </button>
                    </div>
                  </div>
                )}

                {complianceLoading && (
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4 text-xs font-bold text-[var(--op-text)]">
                    <Loader2
                      className="size-4 animate-spin text-[var(--op-gold-dark)]"
                      aria-hidden="true"
                    />
                    <span>جارٍ فحص ملف الامتثال...</span>
                  </div>
                )}

                {compliance && <ComplianceResultPanel result={compliance} />}

                {compliance && !compliance.is_compliant && (
                  <p className="op-hint">
                    يمكنك متابعة المراجعة، لكن يُنصح باستكمال الوثائق الناقصة قبل الإيداع النهائي.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        {step === 3 && (
          <>
            <section className="op-form-block">
              <div className="op-form-block-head">
                <span className="op-num">1</span>
                <h2>مراجعة العرض</h2>
              </div>
              <div className="op-form-block-body">
                <div className="op-form-grid">
                  <div className="op-field">
                    <label>الصفقة</label>
                    <input type="text" value={oppTitle || '—'} readOnly disabled />
                  </div>
                  <div className="op-field">
                    <label>المصلحة المتعاقدة</label>
                    <input type="text" value={authorityName || '—'} readOnly disabled />
                  </div>
                  <div className="op-field">
                    <label>المبلغ الإجمالي</label>
                    <input type="text" value={formatAmount(financialOffer)} readOnly disabled />
                  </div>
                  <div className="op-field">
                    <label>الوثيقة المرفقة</label>
                    <input
                      type="text"
                      value={documentName || 'لا توجد وثيقة مرفقة'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                {!documentName && (
                  <div className="op-alert warning mt-3">
                    <AlertTriangle aria-hidden="true" />
                    <span>
                      لم تُرفق وثيقة بالعرض. يمكنك الرجوع إلى خطوة الوثائق لإضافتها قبل الإيداع.
                    </span>
                  </div>
                )}
              </div>
            </section>

            {compliance && (
              <section className="op-form-block">
                <div className="op-form-block-head">
                  <span className="op-num">2</span>
                  <h2>نتيجة فحص الامتثال</h2>
                </div>
                <div className="op-form-block-body">
                  <ComplianceResultPanel result={compliance} />
                </div>
              </section>
            )}

            <section className="op-form-block">
              <div className="op-form-block-head">
                <span className="op-num">3</span>
                <h2>التصريح</h2>
              </div>
              <div className="op-form-block-body">
                <div className="op-alert warning">
                  <ShieldCheck aria-hidden="true" />
                  <span>
                    أُقرّ بأن جميع البيانات والوثائق المرفقة صحيحة ومطابقة للواقع، وألتزم بشروط
                    الصفقة ودفتر الشروط. يتطلب الإيداع النهائي تأكيداً قبل الإرسال.
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        <div className="op-action-bar">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/offers')}
            disabled={isBusy || complianceLoading}
          >
            {t('drafts.btn.cancel')}
          </button>

          {!isSubmitted && step > 1 && (
            <button
              type="button"
              className="op-btn op-btn-outline"
              onClick={() => setStep((step - 1) as WizardStep)}
              disabled={isBusy || complianceLoading}
            >
              <ArrowRight aria-hidden="true" />
              <span>رجوع</span>
            </button>
          )}

          {!isSubmitted && step === 1 && (
            <button
              type="button"
              className="op-btn op-btn-gold"
              onClick={handleContinueToDocuments}
              disabled={isBusy}
            >
              <span>متابعة</span>
              <ArrowLeft aria-hidden="true" />
            </button>
          )}

          {!isSubmitted && step === 2 && (
            <button
              type="button"
              className="op-btn op-btn-gold"
              onClick={() => void handleContinueToReview()}
              disabled={isBusy || complianceLoading}
            >
              {complianceLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowLeft aria-hidden="true" />
              )}
              <span>{complianceLoading ? 'جارٍ فحص الامتثال...' : 'متابعة إلى المراجعة'}</span>
            </button>
          )}

          {!isSubmitted && (
            <button
              type="submit"
              className="op-btn op-btn-ghost"
              disabled={isBusy || complianceLoading}
            >
              <Save aria-hidden="true" />
              <span>{busyAction === 'save' ? 'جارٍ الحفظ...' : t('offers.btn.save_draft')}</span>
            </button>
          )}

          {!isSubmitted && step === 3 && (
            <button
              type="button"
              className="op-btn op-btn-gold"
              onClick={handleSubmitOffer}
              disabled={isBusy || complianceLoading}
            >
              {busyAction === 'submit' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send aria-hidden="true" />
              )}
              <span>{busyAction === 'submit' ? 'جارٍ الإيداع...' : t('offers.btn.submit')}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default OfferForm;
