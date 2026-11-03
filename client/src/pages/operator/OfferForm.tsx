import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { formatCurrency, formatDate as intlFormatDate } from '@/lib/format';
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
  Lock,
  Paperclip,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
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

interface ExpiredDocument {
  code: string;
  name: string;
  expiry_date?: string;
  reason?: string;
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
  expired_documents?: ExpiredDocument[];
  has_expired_documents?: boolean;
  advisory_notes?: string[];
  submission_deadline?: string | null;
}

type PriceStatus = 'normal' | 'too_low' | 'too_high' | 'no_reference';

interface ReferencePriceCheckItem {
  name: string;
  unit: string;
  wilaya: string | null;
  proposed_price: number;
  reference_price: number | null;
  reference_unit: string | null;
  reference_wilaya: string | null;
  reference_name: string | null;
  reference_updated_at: string | null;
  deviation_percent: number | null;
  is_normal: boolean | null;
  status: PriceStatus;
  match_type: 'exact' | 'fuzzy' | 'none';
  recommendation: string;
}

interface CheckPricesResponse {
  threshold_percent: number;
  items: ReferencePriceCheckItem[];
}

interface BoqRow {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface RowPriceCheck {
  loading: boolean;
  result: ReferencePriceCheckItem | null;
  error: string;
}

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

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

const formatDzd = (value: number | string | null | undefined, lang?: string): string => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return formatCurrency(amount, lang);
};

const formatReferenceDate = (value?: string | null, lang?: string): string => {
  if (!value) return '';
  return intlFormatDate(value, lang);
};

const createBoqRow = (overrides: Partial<BoqRow> = {}, defaultUnit = 'unité'): BoqRow => ({
  id: `boq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  unit: overrides.unit ?? defaultUnit,
  quantity: 1,
  unitPrice: 0,
  ...overrides,
});

const getBoqRowsFromDeal = (deal: unknown, defaultUnit = 'unité'): BoqRow[] => {
  const record = asRecord(deal);
  const specs = asRecord(record.cahier_specs);
  const technicalRequirements = asRecord(specs.technical_requirements);
  const items = technicalRequirements.items;

  if (!Array.isArray(items) || items.length === 0) {
    return [createBoqRow({}, defaultUnit)];
  }

  return items.map((rawItem, index) => {
    const item = asRecord(rawItem);
    const quantity = Number(item.quantity);
    return {
      id: `boq-${index + 1}`,
      name: typeof item.name === 'string' ? item.name : '',
      unit: typeof item.unit === 'string' && item.unit.trim() ? item.unit : defaultUnit,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      // Prices filled by operator; do not copy estimated specs prices.
      unitPrice: 0,
    };
  });
};

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

const getErrorMessage = (err: unknown, fallback = 'Operation failed. Please try again.'): string => {
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
  return fallback;
};

const formatAmount = (value: string): string => formatDzd(value);

import { BidComplianceShield } from '@/features/compliance/BidComplianceShield';

function ComplianceResultPanel({ result }: { result: ComplianceResult }) {
  return <BidComplianceShield data={result} />;
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

  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [id, setId] = useState<string | undefined>(activeOfferId);
  const [oppId, setOppId] = useState<string>(activeOppId || '');
  const [oppTitle, setOppTitle] = useState('');
  const [authorityName, setAuthorityName] = useState('');

  const [financialOffer, setFinancialOffer] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [boqItems, setBoqItems] = useState<BoqRow[]>(() => [createBoqRow({}, t('operator.form.unit_default'))]);
  const [priceChecks, setPriceChecks] = useState<Record<string, RowPriceCheck>>({});
  const latestPriceCheckRef = useRef<Record<string, string>>({});
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
  const [savedDocument, setSavedDocument] = useState<{ name: string; url: string } | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [busyAction, setBusyAction] = useState<'save' | 'submit' | null>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState('');
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [sealConfirmed, setSealConfirmed] = useState(false);
  const [signLaw1504, setSignLaw1504] = useState(true);
  const [isExpiredDeal, setIsExpiredDeal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const applyOffer = (offer: OfferApiRecord) => {
      const dealId = getDealId(offer.deal);
      setId(offer.id ? String(offer.id) : activeOfferId);
      if (dealId) setOppId(dealId);
      setOppTitle(
        offer.opportunityTitle || offer.opportunity_title || offer.deal_title || t('operator.form.deal_fallback'),
      );
      setAuthorityName(
        offer.authorityName ||
          offer.authority_name ||
          offer.authority_entity ||
          t('operator.form.authority_fallback'),
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
          name: getDocumentName(offer) || t('operator.form.doc_attached_fallback'),
          url: documentUrl,
        });
      }
    };

    const applyDealDetails = (deal: unknown) => {
      const record = asRecord(deal);
      setOppTitle(
        typeof record.title === 'string' && record.title.trim()
          ? record.title
          : t('operator.form.deal_fallback'),
      );
      setAuthorityName(
        typeof record.authority_entity === 'string' && record.authority_entity.trim()
          ? record.authority_entity
          : typeof record.authority_name === 'string' && record.authority_name.trim()
            ? record.authority_name
            : t('operator.form.authority_fallback'),
      );
      setWilaya(typeof record.wilaya === 'string' ? record.wilaya : '');
      setBoqItems(getBoqRowsFromDeal(record, t('operator.form.unit_default')));
      const isExp = Boolean(
        record.is_expired ?? (record.submission_deadline ? new Date(String(record.submission_deadline)) < new Date() : false)
      );
      setIsExpiredDeal(isExp);
    };

    const load = async () => {
      setLoading(true);
      setError('');
      setStep(1);
      setCompliance(null);
      setComplianceError('');
      setComplianceChecked(false);
      setWilaya('');
      setBoqItems([createBoqRow({}, t('operator.form.unit_default'))]);
      setPriceChecks({});
      latestPriceCheckRef.current = {};
      try {
        if (activeOfferId) {
          const offer = await fetchOffer(activeOfferId);
          if (cancelled) return;
          applyOffer(offer);
          const dealId = getDealId(offer.deal);
          if (dealId) {
            try {
              const dealResponse = await api.get(`/procurements/deals/${dealId}/`);
              if (cancelled) return;
              applyDealDetails(dealResponse.data);
            } catch {
              // Deal details are secondary; offer record suffices to proceed.
            }
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
          applyDealDetails(response.data);
          setOppId(String(asRecord(response.data).id || activeOppId));
        }
      } catch {
        if (!cancelled) {
          setError(t('operator.form.err_load_offer'));
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

  // Automatically run compliance check upon page load or deal change
  useEffect(() => {
    if (oppId) {
      void runComplianceCheck();
    }
  }, [oppId]);

  const hasComplianceBlock = Boolean(
    compliance && (
      !compliance.is_compliant ||
      (compliance.missing_documents && compliance.missing_documents.length > 0) ||
      (compliance.expired_documents && compliance.expired_documents.length > 0)
    )
  );

  const validate = (): string => {
    if (!oppId) return t('operator.form.err_select_deal');
    const amount = Number(financialOffer);
    if (!financialOffer.trim() || !Number.isFinite(amount) || amount <= 0) {
      return t('operator.form.err_invalid_amount');
    }
    return '';
  };

  const invalidateRowPriceCheck = (rowId: string) => {
    latestPriceCheckRef.current[rowId] = '';
    setPriceChecks((prev) => {
      if (!prev[rowId]) return prev;
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const handleAddBoqRow = () => {
    setBoqItems((prev) => [...prev, createBoqRow({}, t('operator.form.unit_default'))]);
  };

  const handleRemoveBoqRow = (rowId: string) => {
    setBoqItems((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== rowId)));
    latestPriceCheckRef.current[rowId] = '';
    setPriceChecks((prev) => {
      if (!prev[rowId]) return prev;
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const handleUpdateBoqRow = (
    rowId: string,
    field: 'name' | 'unit' | 'quantity' | 'unitPrice',
    value: string | number,
  ) => {
    setBoqItems((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
    if (field === 'name' || field === 'unit' || field === 'unitPrice') {
      invalidateRowPriceCheck(rowId);
    }
  };

  const handlePriceBlur = async (row: BoqRow) => {
    const name = row.name.trim();
    const price = Number(row.unitPrice);

    if (!name || !Number.isFinite(price) || price <= 0) {
      invalidateRowPriceCheck(row.id);
      return;
    }

    const requestKey = `${row.id}|${name}|${price}|${wilaya}`;
    latestPriceCheckRef.current[row.id] = requestKey;
    setPriceChecks((prev) => ({
      ...prev,
      [row.id]: { loading: true, result: null, error: '' },
    }));

    try {
      const { data } = await api.post<CheckPricesResponse>('/procurements/check-prices/', {
        ...(wilaya ? { wilaya } : {}),
        items: [
          {
            name,
            proposed_price: price,
            ...(row.unit.trim() ? { unit: row.unit.trim() } : {}),
          },
        ],
      });

      if (latestPriceCheckRef.current[row.id] !== requestKey) return;
      const result = Array.isArray(data.items) && data.items.length > 0 ? data.items[0] : null;
      setPriceChecks((prev) => ({
        ...prev,
        [row.id]: { loading: false, result, error: '' },
      }));
    } catch {
      if (latestPriceCheckRef.current[row.id] !== requestKey) return;
      setPriceChecks((prev) => ({
        ...prev,
        [row.id]: {
          loading: false,
          result: null,
          error: t('operator.form.err_ref_price'),
        },
      }));
    }
  };

  const buildReferenceTooltip = (rowId: string): string => {
    const check = priceChecks[rowId];
    if (!check) {
      return t('operator.form.ref_price_idle');
    }
    if (check.loading) {
      return t('operator.form.ref_price_loading');
    }
    if (check.error) {
      return check.error;
    }

    const result = check.result;
    if (!result || result.reference_price === null) {
      return wilaya
        ? t('operator.form.ref_price_none_wilaya')
        : t('operator.form.ref_price_none');
    }

    const updatedAt = formatReferenceDate(result.reference_updated_at, lang);
    const fuzzyMatch =
      result.match_type === 'fuzzy' && result.reference_name
        ? ` (${t('operator.form.ref_price_approx')}${result.reference_name})`
        : '';
    return `${t('operator.form.ref_price_expected')}${formatDzd(result.reference_price, lang)}${fuzzyMatch}${t('operator.form.ref_price_wilaya')}${
      result.reference_wilaya || wilaya || '—'
    }${updatedAt ? `${t('operator.form.ref_price_updated')}${updatedAt}` : ''}`;
  };

  const getSeverePriceWarning = (
    check?: RowPriceCheck,
  ): 'low' | 'high' | null => {
    const proposed = Number(check?.result?.proposed_price);
    const reference = Number(check?.result?.reference_price);
    if (
      !Number.isFinite(proposed) ||
      !Number.isFinite(reference) ||
      proposed <= 0 ||
      reference <= 0
    ) {
      return null;
    }

    const ratio = proposed / reference;
    if (ratio < 0.6) return 'low';
    if (ratio > 1.4) return 'high';
    return null;
  };

  const runComplianceCheck = async (): Promise<boolean> => {
    if (!oppId) {
      setComplianceError(t('operator.form.err_select_deal_comp'));
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
      setComplianceError(getErrorMessage(err, t('operator.form.err_comp_failed')));
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
    if (isExpiredDeal) {
      throw new Error(t('operator.opp.submission_closed_art68'));
    }
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

    if (nextStatus === 'submitted' && !hasOfferDocument) {
      setError(t('operator.form.err_doc_required_to_submit'));
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
          t('operator.form.err_submit_unconfirmed'),
        );
        return;
      }
      setStatus(persistedStatus);
      if (persistedStatus === 'submitted') {
        if (signLaw1504 && saved.id) {
          try {
            await api.post(`/offers/${saved.id}/sign/`, {
              certificate_serial: `DZ-PKI-${Date.now()}`,
              signer_role: 'الممثل القانوني للمتعامل الاقتصادي',
            });
          } catch (signErr) {
            console.warn('Law 15-04 qualified signature auto-sign notice:', signErr);
          }
        }
        setStep(3);
      }
      setSuccessMsg(
        persistedStatus === 'draft' ? t('offers.msg.saved') : t('offers.msg.submitted'),
      );
    } catch (err) {
      setError(getErrorMessage(err, t('operator.form.err_generic_op')));
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
      setError(t('operator.form.err_pdf_only'));
      event.target.value = '';
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      setError(t('operator.form.err_file_size'));
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
      <div className="op-page" dir={dir}>
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
  const hasOfferDocument = Boolean(documentFile || (savedDocument && savedDocument.name));
  const canWithdraw = Boolean(isSubmitted && !isExpiredDeal && id);

  const handleWithdrawOffer = async () => {
    if (!id) return;
    const confirmed = window.confirm(t('offers.withdraw_confirm_msg'));
    if (!confirmed) return;

    setIsWithdrawing(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post(`/offers/${id}/withdraw/`, {
        reason: 'سحب العرض لإعادة استكماله وتعديله قبل انقضاء الأجل القانوني',
      });
      setStatus('draft');
      setStep(1);
      setSealConfirmed(false);
      setSuccessMsg(t('offers.withdraw_success_msg'));
    } catch (err) {
      try {
        await api.post(`/bids/offers/${id}/withdraw/`, {
          reason: 'سحب العرض لإعادة استكماله وتعديله قبل انقضاء الأجل القانوني',
        });
        setStatus('draft');
        setStep(1);
        setSealConfirmed(false);
        setSuccessMsg(t('offers.withdraw_success_msg'));
      } catch (innerErr) {
        setError(getErrorMessage(innerErr || err, t('offers.withdraw_err_msg')));
      }
    } finally {
      setIsWithdrawing(false);
    }
  };
  const boqTotal = boqItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );

  return (
    <div className="op-page" dir={dir}>
      <div className="op-page-head">
        <div>
          <h1>{id ? (isSubmitted ? t('offers.view') : t('offers.edit')) : t('offers.new')}</h1>
          {oppTitle ? (
            <p>
              {t('operator.form.opp_label')}<strong className="text-[var(--op-ink)]">{oppTitle}</strong>
              {authorityName ? ` — ${authorityName}` : ''}
            </p>
          ) : (
            <p>{t('operator.form.opp_hint')}</p>
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
          <strong>{isSubmitted ? t('operator.form.status_submitted_strong') : t('operator.form.status_draft_strong')}</strong>
          <p>
            {isSubmitted
              ? t('operator.form.status_submitted_desc')
              : t('operator.form.status_draft_desc')}
          </p>
        </div>
      </div>

      {/* Protective lock if deal is expired pursuant to Law 23-12 Art. 68 */}
      {isExpiredDeal && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/95 p-4 text-rose-950 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="size-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <span>{t('operator.opp.expired_title')}</span>
              <span className="rounded-full bg-rose-200/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-900 dark:bg-rose-900/60 dark:text-rose-200">
                {t('operator.opp.expired_badge')}
              </span>
            </h4>
            <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-300">
              {t('operator.opp.expired_desc_art68')}
            </p>
          </div>
        </div>
      )}

      {/* Protective lock for operator docs & compliance */}
      {compliance && (
        <div className="space-y-3">
          {hasComplianceBlock ? (
            <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/95 p-4 shadow-xs" role="alert">
              <div className="flex items-start gap-3">
                <ShieldAlert className="size-6 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm font-bold text-rose-900">
                      {t('operator.form.lock_title')}
                    </strong>
                    <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                      {t('operator.form.lock_badge')}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed font-medium">
                    {t('operator.form.lock_desc')}
                  </p>

                  <div className="mt-3 space-y-2 rounded-xl border border-rose-200 bg-white/90 p-3">
                    <span className="text-xs font-bold text-slate-800 block">
                      {t('operator.form.lock_docs_required')}
                    </span>
                    <ul className="divide-y divide-rose-100">
                      {compliance.expired_documents && compliance.expired_documents.map((doc) => (
                        <li key={`expired-${doc.code}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-rose-500" />
                            <strong className="text-slate-800">{doc.name}</strong>
                            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-xs font-bold text-rose-700">
                              {t('operator.form.doc_expired')} {doc.expiry_date ? `(${doc.expiry_date})` : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLocation('/operator/profile')}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1 text-xs font-bold text-white transition-colors cursor-pointer"
                          >
                            <span>{t('operator.form.btn_update_doc_now')}</span>
                            <ArrowLeft className="size-3 rtl:rotate-180" />
                          </button>
                        </li>
                      ))}
                      {compliance.missing_documents && compliance.missing_documents.map((doc) => (
                        <li key={`missing-${doc.code}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-amber-500" />
                            <strong className="text-slate-800">{doc.name}</strong>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                              {t('operator.form.doc_missing_in_file')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLocation('/operator/profile')}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#0A2540] hover:bg-[#1e3a8a] px-3 py-1 text-xs font-bold text-white transition-colors cursor-pointer"
                          >
                            <span>{t('operator.form.btn_update_doc_now')}</span>
                            <ArrowLeft className="size-3 rtl:rotate-180" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" aria-hidden="true" />
                <div>
                  <strong className="text-xs font-bold text-emerald-900">
                    {t('operator.form.docs_valid_title')}
                  </strong>
                  <p className="text-xs text-emerald-700">
                    {t('operator.form.docs_valid_desc')}
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 shrink-0">
                {t('operator.form.ready_for_submission')}
              </span>
            </div>
          )}
        </div>
      )}

      {isSubmitted && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-slate-800 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-6 text-[#1e3a8a] dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-[#0A2540] dark:text-blue-200">{t('offers.status.submitted')}</strong>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {t('operator.form.sealed_badge')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {canWithdraw
                    ? t('offers.msg.frozen_with_withdraw_hint')
                    : isExpiredDeal
                    ? t('offers.msg.frozen_final_expired')
                    : t('offers.msg.frozen')}
                </p>
              </div>
            </div>

            {canWithdraw && (
              <button
                type="button"
                className="op-btn op-btn-outline shrink-0 text-xs font-bold border-blue-300 text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200 flex items-center gap-2"
                onClick={() => void handleWithdrawOffer()}
                disabled={isWithdrawing || isBusy}
              >
                {isWithdrawing ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="size-4" aria-hidden="true" />
                )}
                <span>{isWithdrawing ? t('offers.btn.withdrawing') : t('offers.btn.withdraw')}</span>
              </button>
            )}
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
        <ol className="grid gap-2 sm:grid-cols-3" aria-label={t('operator.form.wizard_aria')}>
          {[
            { id: 1 as WizardStep, title: t('operator.form.step1_title'), hint: t('operator.form.step1_hint') },
            { id: 2 as WizardStep, title: t('operator.form.step2_title'), hint: t('operator.form.step2_hint') },
            { id: 3 as WizardStep, title: t('operator.form.step3_title'), hint: t('operator.form.step3_hint') },
          ].map((wizardStep) => {
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
                    <span className="block text-xs text-[var(--op-muted)]">
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
                <h2>{t('operator.form.lbl_deal')}</h2>
              </div>
              <div className="op-form-block-body">
                <div className="op-form-grid">
                  <div className="op-field full">
                    <label htmlFor="offer-deal">{t('operator.form.deal_target_label')}</label>
                    <input
                      id="offer-deal"
                      type="text"
                      value={oppTitle || t('operator.form.no_deal_selected')}
                      readOnly
                      disabled
                    />
                    <span className="op-hint">
                      {t('operator.form.deal_target_hint')}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="op-form-block">
              <div className="op-form-block-head">
                <span className="op-num">2</span>
                <h2>{t('operator.form.step1_title')}</h2>
              </div>
              <div className="op-form-block-body">
                <div className="op-form-grid">
                  <div className="op-field">
                    <label htmlFor="financial-offer">
                      {t('operator.form.lbl_total_amount')} <span className="op-required">*</span>
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
                    <span className="op-hint">{t('operator.form.financial_amount_hint')}</span>
                  </div>

                  <div className="op-field">
                    <label htmlFor="financial-currency">{t('operator.form.currency_label')}</label>
                    <input
                      id="financial-currency"
                      type="text"
                      value={t('operator.form.currency_dzd_full')}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </div>
            </section>
            <section className="op-form-block">
              <div className="op-form-block-head">
                <span className="op-num">3</span>
                <h2>{t('operator.form.financial_schedules_title')}</h2>
              </div>
              <div className="op-form-block-body space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-xs font-bold text-[var(--op-ink)]">
                      {t('operator.form.boq_detailed_items')}
                    </p>
                    <p className="op-hint">
                      {t('operator.form.boq_benchmark_notice')}
                    </p>
                  </div>
                  {!isSubmitted && (
                    <button
                      type="button"
                      className="op-btn op-btn-outline op-btn-sm"
                      onClick={handleAddBoqRow}
                    >
                      <Plus aria-hidden="true" />
                      <span>{t('operator.form.btn_add_item')}</span>
                    </button>
                  )}
                </div>

                <div className="op-table-wrap">
                  <div className="op-table-scroll">
                    <table className="op-table">
                      <thead>
                        <tr>
                          <th className="w-10">#</th>
                          <th>{t('operator.form.th_item')}</th>
                          <th className="w-24">{t('operator.form.th_unit')}</th>
                          <th className="w-20">{t('operator.form.th_qty')}</th>
                          <th className="w-64">{t('operator.form.th_unit_price')}</th>
                          <th className="w-32">{t('operator.form.th_total')}</th>
                          <th className="w-12">{t('operator.form.th_delete')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boqItems.map((item, index) => {
                          const check = priceChecks[item.id];
                          const referencePrice = check?.result?.reference_price;
                          const severeWarning = getSeverePriceWarning(check);

                          return (
                            <tr key={item.id}>
                              <td className="text-center text-[var(--op-muted)]">{index + 1}</td>
                              <td>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(event) =>
                                    handleUpdateBoqRow(item.id, 'name', event.target.value)
                                  }
                                  placeholder={t('operator.form.ph_item_name')}
                                  disabled={isSubmitted}
                                  className="w-full rounded-lg border border-[var(--op-line)] bg-[var(--op-surface-2)] px-2.5 py-2 text-xs text-[var(--op-ink)] focus:border-[var(--op-sky)] focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.15)]"
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(event) =>
                                    handleUpdateBoqRow(item.id, 'unit', event.target.value)
                                  }
                                  placeholder={t('operator.form.ph_unit')}
                                  disabled={isSubmitted}
                                  className="w-full rounded-lg border border-[var(--op-line)] bg-[var(--op-surface-2)] px-2.5 py-2 text-xs text-[var(--op-ink)] focus:border-[var(--op-sky)] focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.15)]"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min={1}
                                  step="1"
                                  value={item.quantity}
                                  onChange={(event) =>
                                    handleUpdateBoqRow(
                                      item.id,
                                      'quantity',
                                      event.target.value === ''
                                        ? 0
                                        : Number.parseFloat(event.target.value) || 0,
                                    )
                                  }
                                  disabled={isSubmitted}
                                  className="w-full rounded-lg border border-[var(--op-line)] bg-[var(--op-surface-2)] px-2.5 py-2 text-center text-xs text-[var(--op-ink)] focus:border-[var(--op-sky)] focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.15)]"
                                />
                              </td>
                              <td>
                                <div className="flex items-start gap-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={item.unitPrice === 0 ? '' : item.unitPrice}
                                    onChange={(event) =>
                                      handleUpdateBoqRow(
                                        item.id,
                                        'unitPrice',
                                        event.target.value === ''
                                          ? 0
                                          : Number.parseFloat(event.target.value) || 0,
                                      )
                                    }
                                    onBlur={() => void handlePriceBlur(item)}
                                    placeholder="0.00"
                                    disabled={isSubmitted}
                                    className="w-full rounded-lg border border-[var(--op-line)] bg-[var(--op-surface-2)] px-2.5 py-2 font-mono text-xs text-[var(--op-ink)] focus:border-[var(--op-sky)] focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.15)]"
                                  />
                                  <span
                                    className="mt-0.5 inline-flex size-7 shrink-0 cursor-help items-center justify-center rounded-lg border border-[var(--op-line)] bg-[var(--op-surface)] text-[var(--op-sky)]"
                                    title={buildReferenceTooltip(item.id)}
                                    aria-label={buildReferenceTooltip(item.id)}
                                  >
                                    {check?.loading ? (
                                      <Loader2
                                        className="size-3.5 animate-spin"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <Info className="size-3.5" aria-hidden="true" />
                                    )}
                                  </span>
                                </div>

                                {severeWarning && referencePrice !== null && (
                                  <div
                                    className={`mt-1.5 flex items-start gap-1.5 rounded-lg border px-2 py-1.5 text-xs leading-relaxed ${
                                      severeWarning === 'low'
                                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                                        : 'border-amber-200 bg-amber-50 text-amber-900'
                                    }`}
                                    role="alert"
                                  >
                                    <AlertTriangle
                                      className="mt-0.5 size-3.5 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span>
                                      {t('operator.form.warn_price_diff').replace('{refPrice}', formatDzd(referencePrice, lang))}
                                    </span>
                                  </div>
                                )}

                                {!severeWarning &&
                                  referencePrice !== null &&
                                  referencePrice !== undefined && (
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-[var(--op-muted)]">
                                      <Info className="size-3" aria-hidden="true" />
                                      <span>{t('operator.form.ref_price_label')}{formatDzd(referencePrice, lang)}</span>
                                      {check?.result?.deviation_percent !== null &&
                                        check?.result?.deviation_percent !== undefined && (
                                          <span>
                                            {t('operator.form.deviation_label')}
                                            {check.result.deviation_percent > 0 ? '+' : ''}
                                            {check.result.deviation_percent.toFixed(1)}%
                                          </span>
                                        )}
                                    </div>
                                  )}

                                {check &&
                                  !check.loading &&
                                  !check.error &&
                                  referencePrice === null && (
                                    <div className="mt-1.5 text-xs text-[var(--op-muted)]">
                                      {t('operator.form.no_ref_price_item')}
                                    </div>
                                  )}

                                {check?.error && (
                                  <div className="mt-1.5 text-xs text-[var(--op-red)]">
                                    {check.error}
                                  </div>
                                )}
                              </td>
                              <td className="font-mono text-xs font-bold text-[var(--op-ink)]">
                                {formatDzd(
                                  (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
                                  lang,
                                )}
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="rounded-lg p-1.5 text-[var(--op-red)] transition-colors hover:bg-[var(--op-red-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                                  onClick={() => handleRemoveBoqRow(item.id)}
                                  disabled={boqItems.length <= 1 || isSubmitted}
                                  title={t('operator.form.btn_delete_item')}
                                  aria-label={t('operator.form.btn_delete_item')}
                                >
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="op-hint">
                    {t('operator.form.boq_total_label')}<strong>{formatDzd(boqTotal, lang)}</strong>
                  </span>
                  {boqTotal > 0 && Math.abs(Number(financialOffer) - boqTotal) > 0.01 && (
                    <span className="op-hint">
                      {t('operator.form.boq_total_note')}
                    </span>
                  )}
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
                <h2>{t('operator.form.section_doc_title')}</h2>
              </div>
              <div className="op-form-block-body">
                <div className="flex flex-col gap-3">
                  <p className="m-0 text-xs text-[var(--op-muted)]">
                    {t('operator.form.section_doc_desc')}
                  </p>
                  {documentName ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4">
                      <span className="flex items-center gap-2 text-xs text-[var(--op-text)]">
                        <Paperclip className="size-4 text-[var(--op-muted)]" aria-hidden="true" />
                        <span className="font-mono font-semibold">{documentName}</span>
                        <span className="op-chip green">
                          {isSubmitted ? t('operator.form.status_doc_frozen') : documentFile ? t('operator.form.status_doc_ready') : t('operator.form.status_doc_attached')}
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
                            <span>{t('operator.form.btn_remove_doc')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4 text-xs text-[var(--op-muted)]">
                      {t('operator.form.no_doc_yet')}
                    </div>
                  )}

                  {!isSubmitted && (
                    <div className="op-field">
                      <label htmlFor="offer-document">{t('operator.form.label_add_replace_doc')}</label>
                      <input
                        id="offer-document"
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleDocumentChange}
                        disabled={isBusy}
                      />
                      <span className="op-hint">
                        {t('operator.form.doc_upload_rules')}
                      </span>
                    </div>
                  )}

                  {isSubmitted && savedDocument && !savedDocument.url && (
                    <span className="op-hint">
                      {t('operator.form.doc_server_stored')}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="op-form-block">
              <div className="op-form-block-head">
                <span className="op-num">2</span>
                <h2>{t('operator.form.section_comp_title')}</h2>
              </div>
              <div className="op-form-block-body space-y-3">
                <div className="op-info-banner">
                  <FileCheck2 aria-hidden="true" />
                  <div>
                    <strong>{t('operator.form.comp_precheck_title')}</strong>
                    <p>
                      {t('operator.form.comp_precheck_desc')}
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
                        <span>{t('operator.form.btn_retry')}</span>
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
                    <span>{t('operator.form.comp_checking')}</span>
                  </div>
                )}

                {compliance && <ComplianceResultPanel result={compliance} />}

                {compliance && !compliance.is_compliant && (
                  <p className="op-hint">
                    {t('operator.form.comp_advice_incomplete')}
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
                <h2>{t('operator.form.section_review_title')}</h2>
              </div>
              <div className="op-form-block-body">
                <div className="op-form-grid">
                  <div className="op-field">
                    <label>{t('operator.form.lbl_deal')}</label>
                    <input type="text" value={oppTitle || '—'} readOnly disabled />
                  </div>
                  <div className="op-field">
                    <label>{t('operator.form.lbl_authority')}</label>
                    <input type="text" value={authorityName || '—'} readOnly disabled />
                  </div>
                  <div className="op-field">
                    <label>{t('operator.form.lbl_total_amount')}</label>
                    <input type="text" value={formatAmount(financialOffer)} readOnly disabled />
                  </div>
                  <div className="op-field">
                    <label>{t('operator.form.lbl_attached_doc')}</label>
                    <input
                      type="text"
                      value={documentName || t('operator.form.no_doc_attached_val')}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                {!hasOfferDocument ? (
                  <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/95 p-4 text-rose-950 shadow-xs mt-3" role="alert">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="size-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1">
                        <strong className="text-sm font-bold text-rose-900 block">
                          {t('operator.form.missing_doc_block_title')}
                        </strong>
                        <p className="text-xs text-rose-800 leading-relaxed font-medium">
                          {t('operator.form.missing_doc_block_desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {compliance && (
              <section className="op-form-block">
                <div className="op-form-block-head">
                  <span className="op-num">2</span>
                  <h2>{t('operator.form.comp_result_title')}</h2>
                </div>
                <div className="op-form-block-body">
                  <ComplianceResultPanel result={compliance} />
                </div>
              </section>
            )}

            <section className="op-form-block">
              <div className="op-form-block-head">
                <span className="op-num">3</span>
                <h2>{t('operator.form.crypto_section_title')}</h2>
              </div>
              <div className="op-form-block-body space-y-4">
                {/* Crypto seal notice for bids */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="size-5 text-[#1e3a8a] shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-1">
                      <strong className="text-xs font-bold text-[#0A2540] block">
                        {t('operator.form.crypto_badge_title')}
                      </strong>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                        {t('operator.form.crypto_badge_desc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Crypto seal declaration */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="seal-confirmation-checkbox"
                      checked={sealConfirmed}
                      onChange={(e) => setSealConfirmed(e.target.checked)}
                      className="mt-0.5 size-4 rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a] cursor-pointer"
                    />
                    <div className="text-xs font-bold text-slate-800">
                      <span>{t('operator.form.crypto_checkbox_label')}</span>
                      <p className="mt-0.5 text-xs font-normal text-slate-500">
                        {t('operator.form.crypto_declaration_text')}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Qualified Electronic Signature Law 15-04 declaration */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="law1504-signature-checkbox"
                      checked={signLaw1504}
                      onChange={(e) => setSignLaw1504(e.target.checked)}
                      className="mt-0.5 size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                        <span>التوقيع الإلكتروني المؤهل (القانون رقم 15-04)</span>
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                          حجية قانونية قاطعة
                        </span>
                      </div>
                      <p className="text-xs font-normal text-slate-600 leading-relaxed">
                        تثبيت بصمة تشفيرية موحدة للوثائق والمبلغ المالي (SHA-256 + RSA-PSS) مع ختم زمني إلكتروني معتمد يضمن عدم إنكار العرض والالتزام الكامل بأحكامه.
                      </p>
                    </div>
                  </label>
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
              <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
              <span>{t('operator.form.btn_back')}</span>
            </button>
          )}

          {!isSubmitted && step === 1 && (
            <button
              type="button"
              className="op-btn op-btn-gold"
              onClick={handleContinueToDocuments}
              disabled={isBusy}
            >
              <span>{t('operator.form.btn_next')}</span>
              <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
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
                <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
              )}
              <span>{complianceLoading ? t('operator.form.comp_checking') : t('operator.form.btn_proceed_review')}</span>
            </button>
          )}

          {!isSubmitted && (
            <button
              type="submit"
              className="op-btn op-btn-ghost"
              disabled={isBusy || complianceLoading || isExpiredDeal}
              title={isExpiredDeal ? t('operator.opp.submission_closed_art68') : undefined}
            >
              <Save aria-hidden="true" />
              <span>{busyAction === 'save' ? t('operator.form.btn_saving_draft') : t('offers.btn.save_draft')}</span>
            </button>
          )}

          {!isSubmitted && step === 3 && (
            <button
              type="button"
              className="op-btn op-btn-gold"
              onClick={handleSubmitOffer}
              disabled={isBusy || complianceLoading || hasComplianceBlock || isExpiredDeal || !hasOfferDocument || !sealConfirmed}
              title={
                isExpiredDeal
                  ? t('operator.opp.submission_closed_art68')
                  : !hasOfferDocument
                  ? t('operator.form.err_doc_required_to_submit')
                  : hasComplianceBlock
                  ? t('operator.form.lock_submit_tooltip')
                  : !sealConfirmed
                  ? t('operator.form.crypto_submit_tooltip')
                  : t('operator.form.btn_submit_final')
              }
            >
              {busyAction === 'submit' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send aria-hidden="true" />
              )}
              <span>{busyAction === 'submit' ? t('operator.form.btn_submitting') : t('offers.btn.submit')}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default OfferForm;
