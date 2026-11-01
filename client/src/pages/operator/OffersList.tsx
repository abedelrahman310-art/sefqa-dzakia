import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Paperclip,
  ShieldCheck,
  Building2,
  Calendar,
  Info,
  Eye,
  Plus,
  FileSignature,
} from 'lucide-react';

interface DealOption {
  id: string;
  reference_number: string;
  title: string;
  authority_name?: string;
}

interface OfferItem {
  id: string;
  dealId: string;
  opportunityTitle: string;
  dealReference: string;
  authorityName: string;
  financialOffer: string;
  status: string;
  hasDocument: boolean;
  submittedAt: string | null;
  updatedAt: string;
  technicalScore: number | null;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const isNotFound = (err: unknown) =>
  (err as { response?: { status?: number } })?.response?.status === 404;

const unwrapList = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.offers)) return record.offers;
  return [];
};

const getDealId = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const id = (value as { id?: unknown }).id;
    if (typeof id === 'string') return id;
  }
  return '';
};

const fetchOffers = async (): Promise<unknown[]> => {
  try {
    const response = await api.get('/offers/');
    return unwrapList(response.data);
  } catch (err) {
    if (!isNotFound(err)) throw err;
    const response = await api.get('/bids/offers/');
    return unwrapList(response.data);
  }
};

export function OffersList() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();

  const [deals, setDeals] = useState<DealOption[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const getStatusMeta = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: t('operator.offers.status_draft'), className: 'bg-amber-50 text-amber-900 border-amber-200' },
      submitted: {
        label: t('operator.offers.status_encrypted'),
        className: 'bg-blue-50 text-[#1e3a8a] border-blue-300 font-bold',
      },
      admitted: {
        label: t('operator.offers.status_accepted'),
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      },
      rejected: { label: t('operator.offers.status_rejected'), className: 'bg-rose-50 text-rose-800 border-rose-200' },
      evaluated: { label: t('operator.offers.status_qualified'), className: 'bg-teal-50 text-teal-800 border-teal-200' },
      awarded: { label: t('operator.offers.status_awarded'), className: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
    };
    return (
      map[status] || {
        label: status || t('operator.offers.undefined'),
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      }
    );
  };

  const formatAmount = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return t('operator.offers.undefined');
    const amount = Number(value);
    if (!Number.isFinite(amount)) return t('operator.offers.undefined');
    return formatCurrency(amount, lang);
  };

  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [offersResult, dealsResult] = await Promise.allSettled([
        fetchOffers(),
        api.get('/procurements/deals/'),
      ]);

      if (offersResult.status === 'rejected') throw offersResult.reason;

      const availableDeals: DealOption[] =
        dealsResult.status === 'fulfilled'
          ? unwrapList(dealsResult.value.data).map((item) => {
              const deal = asRecord(item);
              return {
                id: String(deal.id || ''),
                reference_number: String(deal.reference_number || ''),
                title: String(deal.title || t('common.public_deal')),
                authority_name: String(deal.authority_name || deal.authority_entity || ''),
              };
            })
          : [];

      setDeals(availableDeals.filter((deal) => deal.id));
      const dealById = new Map(availableDeals.map((deal) => [deal.id, deal]));

      const mappedOffers: OfferItem[] = offersResult.value.map((item) => {
        const offer = asRecord(item);
        const dealId =
          getDealId(offer.deal) ||
          (typeof offer.opportunityId === 'string'
            ? offer.opportunityId
            : typeof offer.opportunity_id === 'string'
              ? offer.opportunity_id
              : '');
        const deal = dealById.get(dealId);
        return {
          id: String(offer.id || ''),
          dealId,
          opportunityTitle: String(
            offer.opportunityTitle ||
              offer.opportunity_title ||
              offer.deal_title ||
              deal?.title ||
              t('common.public_deal'),
          ),
          dealReference: String(
            offer.deal_reference || offer.dealReference || deal?.reference_number || '',
          ),
          authorityName: String(
            offer.authorityName ||
              offer.authority_name ||
              offer.authority_entity ||
              deal?.authority_name ||
              t('common.contracting_authority'),
          ),
          financialOffer: formatAmount(offer.financialOffer ?? offer.financial_amount),
          status: String(offer.status || 'draft'),
          hasDocument:
            offer.hasDocument === true ||
            offer.has_document === true ||
            Boolean(
              offer.document_url ||
                offer.document_file ||
                offer.document ||
                offer.encrypted_hash,
            ),
          submittedAt:
            typeof offer.submittedAt === 'string'
              ? offer.submittedAt
              : typeof offer.submission_timestamp === 'string'
                ? offer.submission_timestamp
                : typeof offer.submitted_at === 'string'
                  ? offer.submitted_at
                  : null,
          updatedAt: String(offer.updatedAt || offer.updated_at || offer.created_at || ''),
          technicalScore:
            offer.technical_score !== null &&
            offer.technical_score !== undefined &&
            Number.isFinite(Number(offer.technical_score))
              ? Number(offer.technical_score)
              : null,
        };
      });

      setOffers(mappedOffers.filter((offer) => offer.id));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setFetchError(
        status === 404
          ? t('operator.offers.error_404')
          : t('operator.offers.error_default'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const dealOptions = useMemo(() => {
    const map = new Map<string, DealOption>();
    deals.forEach((deal) => map.set(deal.id, deal));
    offers.forEach((offer) => {
      if (offer.dealId && !map.has(offer.dealId)) {
        map.set(offer.dealId, {
          id: offer.dealId,
          reference_number: offer.dealReference,
          title: offer.opportunityTitle,
          authority_name: offer.authorityName,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, lang === 'fr' ? 'fr' : 'ar'));
  }, [deals, offers, lang]);

  const filteredOffers = useMemo(
    () =>
      offers.filter((offer) => {
        if (selectedDealId !== 'all' && offer.dealId !== selectedDealId) return false;
        if (selectedStatus !== 'all' && offer.status !== selectedStatus) return false;
        return true;
      }),
    [offers, selectedDealId, selectedStatus],
  );

  const draftsCount = offers.filter((offer) => offer.status === 'draft').length;
  const submittedCount = offers.filter((offer) => offer.status !== 'draft').length;
  const documentsCount = offers.filter((offer) => offer.hasDocument).length;

  const statusFilterOptions = useMemo(
    () => [
      { id: 'draft', label: t('operator.offers.status_draft') },
      { id: 'submitted', label: t('operator.offers.status_encrypted') },
      { id: 'admitted', label: t('operator.offers.status_accepted') },
      { id: 'rejected', label: t('operator.offers.status_rejected') },
      { id: 'evaluated', label: t('operator.offers.status_qualified') },
      { id: 'awarded', label: t('operator.offers.status_awarded') },
    ],
    [t],
  );

  return (
    <div className="op-page" dir={dir}>
      <div className="op-page-head">
        <div>
          <h1>{t('operator.offers.title')}</h1>
          <p>{t('operator.offers.subtitle')}</p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline whitespace-nowrap"
            onClick={() => void loadData()}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
            <span>{t('operator.offers.refresh')}</span>
          </button>
          <Button
            className="bg-[#8a6e1c] hover:bg-[#3a4555] text-white text-xs font-bold whitespace-nowrap"
            onClick={() => setLocation('/operator/deals')}
          >
            <Plus className="size-4" />
            <span>{t('operator.offers.explore_deals')}</span>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t('operator.offers.kpi_aria')}>
        <div className="op-card flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg border border-[#ece7d6] bg-[#fdf6df] text-[#8a6e1c]">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#3a4555]">{offers.length}</div>
            <div className="text-xs font-bold text-[#5d6b7e] whitespace-nowrap">{t('operator.offers.kpi_total')}</div>
          </div>
        </div>

        <div className="op-card flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
            <Clock className="size-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#3a4555]">{draftsCount}</div>
            <div className="text-xs font-bold text-[#5d6b7e] whitespace-nowrap">{t('operator.offers.kpi_drafts')}</div>
          </div>
        </div>

        <div className="op-card flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-800">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#3a4555]">{submittedCount}</div>
            <div className="text-xs font-bold text-[#5d6b7e] whitespace-nowrap">{t('operator.offers.kpi_submitted')}</div>
          </div>
        </div>

        <div className="op-card flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800">
            <Paperclip className="size-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#3a4555]">{documentsCount}</div>
            <div className="text-xs font-bold text-[#5d6b7e] whitespace-nowrap">{t('operator.offers.kpi_docs')}</div>
          </div>
        </div>
      </section>

      <section className="op-card flex flex-col gap-3 p-4 md:flex-row md:items-end">
        <div className="op-field min-w-[240px] flex-1">
          <label htmlFor="deal-filter" className="text-xs font-bold text-[#8a6e1c]">
            {t('operator.offers.filter_deal')}
          </label>
          <select
            id="deal-filter"
            value={selectedDealId}
            onChange={(event) => setSelectedDealId(event.target.value)}
            className="op-select h-10 w-full cursor-pointer"
          >
            <option value="all">{t('operator.offers.all_deals')}</option>
            {dealOptions.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.reference_number ? `${deal.reference_number} — ` : ''}
                {deal.title}
              </option>
            ))}
          </select>
        </div>

        <div className="op-field min-w-[180px]">
          <label htmlFor="status-filter" className="text-xs font-bold text-[#8a6e1c]">
            {t('operator.offers.filter_status')}
          </label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="op-select h-10 w-full cursor-pointer"
          >
            <option value="all">{t('operator.offers.all_statuses')}</option>
            {statusFilterOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <span className="ms-auto text-xs font-bold text-[#5d6b7e] whitespace-nowrap">
          {filteredOffers.length} {t('operator.offers.count_label')}
        </span>
      </section>

      {fetchError && (
        <div className="op-alert error" role="alert">
          <AlertCircle aria-hidden="true" />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <span>{fetchError}</span>
            <button
              type="button"
              className="op-btn op-btn-outline op-btn-sm whitespace-nowrap"
              onClick={() => void loadData()}
            >
              <RefreshCw aria-hidden="true" />
              <span>{t('operator.offers.retry')}</span>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label={t('operator.offers.loading_aria')}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="op-card p-4">
              <div className="flex items-start gap-3">
                <div className="op-skeleton size-10 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="op-skeleton h-4 w-2/5" />
                  <div className="op-skeleton h-3 w-3/5" />
                  <div className="op-skeleton h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !fetchError && filteredOffers.length === 0 ? (
        <div className="op-big-empty">
          <div className="op-big-empty-icon">
            <FileText aria-hidden="true" />
          </div>
          <h3>{offers.length === 0 ? t('operator.offers.empty_title') : t('operator.offers.empty_filtered')}</h3>
          <p>
            {offers.length === 0
              ? t('operator.offers.empty_desc')
              : t('operator.offers.empty_filtered_desc')}
          </p>
          {offers.length === 0 && (
            <Button
              className="bg-[#8a6e1c] hover:bg-[#3a4555] text-white text-xs font-bold whitespace-nowrap"
              onClick={() => setLocation('/operator/deals')}
            >
              <Plus className="size-4" />
              <span>{t('operator.offers.explore_deals')}</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map((offer) => {
            const statusMeta = getStatusMeta(offer.status);
            const isDraft = offer.status === 'draft';
            const canOpenContract = ['awarded', 'evaluated', 'admitted'].includes(
              offer.status,
            );
            return (
              <article key={offer.id} className="op-card p-4 transition-colors hover:border-[#d9cfae]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#ece7d6] bg-[#fdf6df] text-[#8a6e1c]">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 text-sm font-extrabold text-[#3a4555]">
                          {offer.opportunityTitle}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5d6b7e]">
                        {offer.dealReference && (
                          <span className="font-mono font-bold text-[#8a6e1c]">
                            {offer.dealReference}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="size-3.5" />
                          <span className="line-clamp-1">{offer.authorityName}</span>
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#5d6b7e]">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="size-3.5" />
                          {isDraft
                            ? offer.updatedAt
                              ? `${t('operator.offers.last_updated')} ${formatDate(offer.updatedAt, lang)}`
                              : t('operator.offers.draft_in_progress')
                            : offer.submittedAt
                              ? `${t('operator.offers.submitted_at')} ${formatDate(offer.submittedAt, lang)}`
                              : t('operator.offers.not_submitted')}
                        </span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Paperclip className="size-3.5" />
                          {offer.hasDocument ? t('operator.offers.has_doc') : t('operator.offers.no_doc')}
                        </span>
                        {offer.technicalScore !== null && (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap">
                            <ShieldCheck className="size-3.5" />
                            {t('operator.offers.technical_score')}: {offer.technicalScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#f3efdf] pt-3 lg:border-0 lg:pt-0">
                    <div className="text-start">
                      <span className="block text-[10px] font-bold text-[#5d6b7e] whitespace-nowrap">
                        {t('operator.offers.financial_amount')}
                      </span>
                      <span className="block text-sm font-extrabold text-[#3a4555] whitespace-nowrap">
                        {offer.financialOffer}
                      </span>
                    </div>

                    {canOpenContract && offer.dealId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold whitespace-nowrap"
                        onClick={() => setLocation(`/operator/contracts/${offer.dealId}`)}
                      >
                        <FileSignature className="size-3.5" />
                        <span>{t('operator.offers.contracts_link')}</span>
                      </Button>
                    )}

                    <Button
                      variant={isDraft ? 'default' : 'outline'}
                      size="sm"
                      className={
                        isDraft
                          ? 'bg-[#8a6e1c] hover:bg-[#3a4555] text-white text-xs font-bold whitespace-nowrap'
                          : 'border-[#ece7d6] bg-white text-[#8a6e1c] hover:bg-[#fffdf5] text-xs font-bold whitespace-nowrap'
                      }
                      onClick={() => setLocation(`/operator/offers/${offer.id}`)}
                    >
                      <Eye className="size-3.5" />
                      <span>{isDraft ? t('operator.offers.continue_draft') : t('operator.offers.view_details')}</span>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-[#f3efdf] bg-[#fffdf5] p-3 text-xs text-[#5d6b7e]">
        <Info className="mt-0.5 size-4 shrink-0 text-[#8a6e1c]" />
        <p className="m-0 leading-relaxed">
          {t('operator.offers.info_banner')}
        </p>
      </div>
    </div>
  );
}

export default OffersList;
