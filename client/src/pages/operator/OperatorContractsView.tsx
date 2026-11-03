import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useI18n, type TranslationKey } from '@/i18n';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { downloadPdfBlob } from '@/lib/pdfDownloader';
import type { ProcurementContractApi } from '@/lib/procurementApiTypes';
import { ExecutionTracker } from '@/features/execution/components/ExecutionTracker';
import { AvenantsManager } from '@/features/execution/components/AvenantsManager';
import { LegalNoticesManager } from '@/features/execution/components/LegalNoticesManager';
import {
  AlertCircle,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileSignature,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Scale,
} from 'lucide-react';

interface OperatorContractsViewProps {
  dealId?: string;
}

const CONTRACT_STATUS_KEYS: Record<string, TranslationKey> = {
  CONTRACT_SIGNED: 'operator.contracts.status_signed_concluded',
  signed: 'operator.contracts.status_signed',
  signed_operator: 'operator.contracts.status_signed_operator',
  signed_authority: 'operator.contracts.status_signed_authority',
  approved_control: 'operator.contracts.status_approved_control',
  notified: 'operator.contracts.status_notified',
  active: 'operator.contracts.status_active',
  completed: 'operator.contracts.status_completed',
  terminated: 'operator.contracts.status_terminated',
  draft: 'operator.contracts.status_draft',
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const unwrapContracts = (data: unknown): ProcurementContractApi[] => {
  if (Array.isArray(data)) return data as ProcurementContractApi[];
  const record = asRecord(data);
  if (Array.isArray(record.results)) {
    return record.results as ProcurementContractApi[];
  }
  return [];
};

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const response = (err as { response?: { data?: unknown } })?.response;
  const data = response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const detail = record.error ?? record.detail ?? record.message;
    if (typeof detail === 'string' && detail.trim()) return detail;
    const firstValue = Object.values(record)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') {
      return firstValue[0];
    }
    if (typeof firstValue === 'string' && firstValue.trim()) return firstValue;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export function OperatorContractsView({ dealId }: OperatorContractsViewProps) {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();

  const [contracts, setContracts] = useState<ProcurementContractApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState(dealId || '');
  const [avenantDealId, setAvenantDealId] = useState<string>('');
  const [noticesDealId, setNoticesDealId] = useState<string>('');

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError('');
    setDownloadError('');

    try {
      const response = await api.get('/procurements/contracts/', {
        params: dealId ? { deal: dealId } : undefined,
      });
      const list = unwrapContracts(response.data);
      setContracts(list);
      setSelectedDealId((previous) => {
        if (dealId) return dealId;
        if (previous && list.some((contract) => contract.deal === previous)) {
          return previous;
        }
        return list[0]?.deal || '';
      });
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          t('operator.contracts.err_load'),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [dealId, t]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const handleDownload = async (contract: ProcurementContractApi) => {
    if (!contract.contract_pdf_url && !contract.contract_pdf) {
      setDownloadError(t('operator.contracts.err_pdf_unavailable'));
      return;
    }

    setDownloadingId(contract.id);
    setDownloadError('');

    try {
      const filename = `contract-${contract.contract_number || contract.deal_reference || contract.id}.pdf`;
      await downloadPdfBlob(`/procurements/contracts/${contract.id}/download/`, filename);
    } catch (err: unknown) {
      setDownloadError(
        getApiErrorMessage(err, t('operator.contracts.err_download')),
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="op-page" dir={dir}>
      <div className="op-page-head">
        <div>
          <h1>{t('operator.contracts.title')}</h1>
          <p>{t('operator.contracts.subtitle')}</p>
        </div>
        <div className="op-page-actions">
          {dealId && (
            <button
              type="button"
              className="op-btn op-btn-outline"
              onClick={() => setLocation('/operator/contracts')}
            >
              <FileSignature aria-hidden="true" />
              <span>{t('operator.contracts.all_contracts')}</span>
            </button>
          )}
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => void loadContracts()}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
            <span>{loading ? t('operator.contracts.updating') : t('operator.contracts.refresh')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="op-alert error" role="alert">
          <AlertCircle aria-hidden="true" />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              className="op-btn op-btn-outline op-btn-sm"
              onClick={() => void loadContracts()}
            >
              <RefreshCw aria-hidden="true" />
              <span>{t('operator.contracts.retry')}</span>
            </button>
          </div>
        </div>
      )}

      {downloadError && (
        <div className="op-alert error" role="alert">
          <AlertCircle aria-hidden="true" />
          <span>{downloadError}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label={t('operator.contracts.loading_aria')}>
          {[0, 1].map((item) => (
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
      ) : contracts.length === 0 && !error ? (
        <div className="op-big-empty">
          <div className="op-big-empty-icon">
            <FileSignature aria-hidden="true" />
          </div>
          <h3>
            {dealId
              ? t('operator.contracts.empty_deal')
              : t('operator.contracts.empty_all')}
          </h3>
          <p>
            {dealId
              ? t('operator.contracts.empty_deal_desc')
              : t('operator.contracts.empty_all_desc')}
          </p>
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/offers')}
          >
            {t('operator.contracts.back_to_offers')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const isSelected = selectedDealId === contract.deal;
            const isDownloading = downloadingId === contract.id;
            const statusLabel =
              CONTRACT_STATUS_KEYS[contract.status]
                ? t(CONTRACT_STATUS_KEYS[contract.status])
                : (contract.status || t('operator.contracts.status_signed'));

            return (
              <section key={contract.id} className="op-card p-4 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                      <FileSignature className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="m-0 text-sm font-extrabold text-[#3a4555]">
                          {contract.deal_title || t('operator.contracts.deal_fallback')}
                        </h2>
                        <span className="op-chip green">{statusLabel}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5d6b7e]">
                        <span className="font-mono font-bold text-[#8a6e1c]">
                          {contract.deal_reference || '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="size-3.5" />
                          {t('operator.contracts.contract_number_label')}{contract.contract_number || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="op-btn op-btn-green"
                      onClick={() => void handleDownload(contract)}
                      disabled={isDownloading || (!contract.contract_pdf_url && !contract.contract_pdf)}
                    >
                      {isDownloading ? (
                        <Loader2 className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Download aria-hidden="true" />
                      )}
                      <span>{isDownloading ? t('operator.contracts.downloading') : t('operator.contracts.download_pdf')}</span>
                    </button>
                    <button
                      type="button"
                      className={`op-btn ${avenantDealId === contract.deal ? 'op-btn-slate' : 'op-btn-outline'}`}
                      onClick={() =>
                        setAvenantDealId((prev) => (prev === contract.deal ? '' : contract.deal))
                      }
                    >
                      <Scale className="size-3.5" aria-hidden="true" />
                      <span>{t('operator.contracts.avenants_title') || 'الملاحق المعتمدة'}</span>
                    </button>

                    <button
                      type="button"
                      className={`op-btn ${noticesDealId === contract.deal ? 'op-btn-slate' : 'op-btn-outline'}`}
                      onClick={() =>
                        setNoticesDealId((prev) => (prev === contract.deal ? '' : contract.deal))
                      }
                    >
                      <AlertTriangle className="size-3.5 text-amber-600" aria-hidden="true" />
                      <span>{t('execution.notices.title') || 'الاعذارات القانونية'}</span>
                    </button>

                    <button
                      type="button"
                      className={`op-btn ${isSelected ? 'op-btn-slate' : 'op-btn-outline'}`}
                      onClick={() =>
                        setSelectedDealId((previous) =>
                          previous === contract.deal ? '' : contract.deal,
                        )
                      }
                    >
                      <Building2 aria-hidden="true" />
                      <span>{isSelected ? t('operator.contracts.hide_milestones') : t('operator.contracts.track_execution')}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#f3efdf] bg-[#fffdf5] p-3 text-xs sm:grid-cols-3">
                  <div>
                    <span className="block text-xs font-bold text-[#8a6e1c]">
                      {t('operator.contracts.archive_date')}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 font-bold text-[#3a4555]">
                      <Calendar className="size-3.5" />
                      {formatDate(contract.signed_at, lang)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#8a6e1c]">
                      {t('operator.contracts.contract_amount')}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 font-bold text-[#3a4555]">
                      <Banknote className="size-3.5" />
                      {formatCurrency(Number(contract.amount), lang)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#8a6e1c]">
                      {t('operator.contracts.contractor_label')}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 font-bold text-[#3a4555]">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      {contract.operator_name || t('operator.contracts.your_company')}
                    </span>
                  </div>
                </div>

                {!contract.contract_pdf_url && !contract.contract_pdf && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {t('operator.contracts.no_pdf_notice')}
                  </p>
                )}

                {avenantDealId === contract.deal && (
                  <div className="pt-2">
                    <AvenantsManager
                      dealId={contract.deal}
                      dealReference={contract.deal_reference}
                      baseAmount={Number(contract.amount)}
                      readOnly={true}
                    />
                  </div>
                )}

                {noticesDealId === contract.deal && (
                  <div className="pt-2">
                    <LegalNoticesManager
                      dealId={contract.deal}
                      dealReference={contract.deal_reference}
                      dealTitle={contract.deal_reference}
                      userRole="operator"
                    />
                  </div>
                )}

                {isSelected && (
                  <ExecutionTracker
                    dealId={contract.deal}
                    role="operator"
                    className="border-[#f3efdf] bg-white"
                  />
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OperatorContractsView;
