import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { downloadPdfBlob } from '@/lib/pdfDownloader';
import type { ProcurementContractApi } from '@/lib/procurementApiTypes';
import { ExecutionTracker } from '@/features/execution/components/ExecutionTracker';
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
} from 'lucide-react';

interface OperatorContractsViewProps {
  dealId?: string;
}

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  CONTRACT_SIGNED: 'موقع ومبرم',
  signed: 'موقع',
  signed_operator: 'موقع من المتعامل',
  signed_authority: 'موقع من المصلحة',
  approved_control: 'مؤشر من هيئة الرقابة',
  notified: 'مبلّغ ببداية الخدمة',
  active: 'قيد التنفيذ',
  completed: 'منجز ومستلم',
  terminated: 'مفسوخ تعاقدياً',
  draft: 'مسودة',
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

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ar-DZ', { dateStyle: 'medium' });
};

const formatAmount = (value: string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString('ar-DZ', { maximumFractionDigits: 2 })} دج`;
};

export function OperatorContractsView({ dealId }: OperatorContractsViewProps) {
  const [, setLocation] = useLocation();

  const [contracts, setContracts] = useState<ProcurementContractApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState(dealId || '');

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
          'تعذر تحميل العقود المؤرشفة. يرجى التحقق من الاتصال والمحاولة مجدداً.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const handleDownload = async (contract: ProcurementContractApi) => {
    if (!contract.contract_pdf_url && !contract.contract_pdf) {
      setDownloadError('نسخة PDF من هذا العقد غير متاحة حالياً.');
      return;
    }

    setDownloadingId(contract.id);
    setDownloadError('');

    try {
      const filename = `contract-${contract.contract_number || contract.deal_reference || contract.id}.pdf`;
      await downloadPdfBlob(`/procurements/contracts/${contract.id}/download/`, filename);
    } catch (err: unknown) {
      setDownloadError(
        getApiErrorMessage(err, 'تعذر تحميل نسخة العقد. يرجى المحاولة مجدداً.'),
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="op-page" dir="rtl">
      <div className="op-page-head">
        <div>
          <h1>العقود والتنفيذ</h1>
          <p>
            راجع العقود المؤرشفة، حمّل نسخة PDF، وتابع مراحل تنفيذ الصفقات وارفع تقارير
            الإنجاز.
          </p>
        </div>
        <div className="op-page-actions">
          {dealId && (
            <button
              type="button"
              className="op-btn op-btn-outline"
              onClick={() => setLocation('/operator/contracts')}
            >
              <FileSignature aria-hidden="true" />
              <span>كل العقود</span>
            </button>
          )}
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => void loadContracts()}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
            <span>{loading ? 'جاري التحديث...' : 'تحديث'}</span>
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
              <span>إعادة المحاولة</span>
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
        <div className="space-y-3" aria-busy="true" aria-label="جارٍ تحميل العقود">
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
              ? 'لم يتم توليد العقد لهذه الصفقة بعد'
              : 'لا توجد عقود مؤرشفة بعد'}
          </h3>
          <p>
            {dealId
              ? 'ستظهر هنا تفاصيل العقد المؤرشف ومراحل التنفيذ فور توليده من المصلحة المتعاقدة.'
              : 'ستظهر هنا العقود التي تبرمها المصلحة المتعاقدة مع مؤسستكم بعد اعتماد الإسناد النهائي.'}
          </p>
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/offers')}
          >
            العودة إلى العروض
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const isSelected = selectedDealId === contract.deal;
            const isDownloading = downloadingId === contract.id;
            const statusLabel =
              CONTRACT_STATUS_LABELS[contract.status] || contract.status || 'موقع';

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
                          {contract.deal_title || 'عقد صفقة عمومية'}
                        </h2>
                        <span className="op-chip green">{statusLabel}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5d6b7e]">
                        <span className="font-mono font-bold text-[#8a6e1c]">
                          {contract.deal_reference || '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="size-3.5" />
                          رقم العقد: {contract.contract_number || '—'}
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
                      <span>{isDownloading ? 'جاري التحميل...' : 'تحميل العقد PDF'}</span>
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
                      <span>{isSelected ? 'إخفاء مراحل التنفيذ' : 'متابعة التنفيذ'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#f3efdf] bg-[#fffdf5] p-3 text-xs sm:grid-cols-3">
                  <div>
                    <span className="block text-[10px] font-bold text-[#8a6e1c]">
                      تاريخ الأرشفة
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 font-bold text-[#3a4555]">
                      <Calendar className="size-3.5" />
                      {formatDate(contract.signed_at)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[#8a6e1c]">
                      مبلغ العقد
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 font-bold text-[#3a4555]">
                      <Banknote className="size-3.5" />
                      {formatAmount(contract.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[#8a6e1c]">
                      المتعامل المتعاقد
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 font-bold text-[#3a4555]">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      {contract.operator_name || 'مؤسستكم'}
                    </span>
                  </div>
                </div>

                {!contract.contract_pdf_url && !contract.contract_pdf && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                    تم تسجيل العقد، لكن نسخة PDF لم تُرفع بعد. يمكنك متابعة مراحل التنفيذ
                    أدناه.
                  </p>
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
