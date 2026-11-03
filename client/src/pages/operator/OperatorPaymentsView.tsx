import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import {
  CreditCard,
  Shield,
  Download,
  FileCheck,
  ExternalLink,
  Search,
  Receipt,
  Coins,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertCircle,
  FileText
} from 'lucide-react';

interface SpecsPurchaseItem {
  id: string;
  deal_id: string;
  deal_reference: string;
  deal_title: string;
  deal_wilaya: string;
  authority_name: string;
  amount: number;
  payment_gateway: string;
  payment_method: string;
  payment_id: string;
  status: string;
  receipt_number: string;
  created_at: string;
  paid_at: string | null;
  download_url: string | null;
  receipt_url: string | null;
  deal_url: string;
}

export function OperatorPaymentsView() {
  const { t, lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const [purchases, setPurchases] = useState<SpecsPurchaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [paidCount, setPaidCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurements/specs/my-purchases/');
      const data = res.data;
      setPurchases(data.purchases || []);
      setTotalSpent(data.total_spent || 0);
      setPaidCount(data.paid_count || 0);
    } catch (err) {
      console.error('Error fetching specs purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSpecs = (receiptNum: string) => {
    window.open(`/api/procurements/specs/download/${receiptNum}/`, '_blank');
  };

  const handleDownloadReceipt = (receiptNum: string) => {
    window.open(`/api/procurements/specs/receipt/${receiptNum}/`, '_blank');
  };

  const handleCopyReceipt = (receiptNum: string) => {
    navigator.clipboard.writeText(receiptNum);
    setCopiedId(receiptNum);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat(isAr ? 'ar-DZ' : 'fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const filteredPurchases = purchases.filter((item) => {
    const matchesSearch =
      item.deal_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deal_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.authority_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'paid'
        ? item.status === 'paid'
        : item.status !== 'paid';

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans" dir={dir}>
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-cairo">
              {t('operator.payments.title')}
            </h1>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Chargily Pay V2 • CIB / EDAHABIA</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('operator.payments.subtitle')}
          </p>
        </div>

        <Link
          href="/operator/deals"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600 text-xs sm:text-sm font-bold shadow-xs transition-colors"
        >
          <Search className="size-4" />
          <span>{isAr ? 'تصفح الصفقات وسحب دفاتر الشروط' : 'Explorer les marchés'}</span>
        </Link>
      </div>

      {/* ═══ KPI Summary Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Purchases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {t('operator.payments.kpi_total_purchases')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {loading ? '—' : paidCount}
            </span>
          </div>
          <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
            <FileText className="size-5" />
          </div>
        </div>

        {/* KPI 2: Total Spent */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {t('operator.payments.kpi_total_spent')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {loading ? '—' : totalSpent.toLocaleString(isAr ? 'ar-DZ' : 'fr-FR')}
              <span className="text-xs font-bold font-sans text-slate-400 ms-1.5">{t('common.dzd')}</span>
            </span>
          </div>
          <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900">
            <Coins className="size-5" />
          </div>
        </div>

        {/* KPI 3: Official Receipts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {t('operator.payments.kpi_receipts_count')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400 font-mono">
              {loading ? '—' : paidCount}
            </span>
          </div>
          <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900">
            <Receipt className="size-5" />
          </div>
        </div>

        {/* KPI 4: Legal & Security Standard */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {isAr ? 'الامتثال والأمان' : 'Conformité & Sécurité'}
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block font-cairo">
              {isAr ? 'المادة 67 • القانون 23-12' : 'Art. 67 • Loi 23-12'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isAr ? 'تجريد مادي ووصل رقمي' : 'Dématérialisation'}
            </span>
          </div>
          <div className="size-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900">
            <Shield className="size-5" />
          </div>
        </div>
      </div>

      {/* ═══ Institutional Framework Notice ═══ */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
        <div className="flex items-start gap-3">
          <Shield className="size-5 text-emerald-700 dark:text-emerald-400 flex-none mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-cairo">
              {t('operator.payments.framework_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {isAr
                ? 'يتم تحصيل رسوم سحب دفاتر الشروط إلكترونياً وبطريقة غير قابلة للاسترداد وفقاً لأحكام القانون رقم 23-12 والمرسوم الرئاسي 15-247 عبر بوابات الدفع الوطنية الآمنة (الذهبية وCIB). يعتبر وصل السحب الرقمي وثيقة إثبات قانونية ملزمة للمشاركة في المناقصة.'
                : t('operator.payments.framework_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Search & Filters Bar ═══ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search className="size-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('operator.payments.search_placeholder')}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2 ps-10 pe-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-emerald-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'الكل' : 'Tous'} ({purchases.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'paid'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('operator.payments.status_paid')} ({paidCount})
          </button>
        </div>
      </div>

      {/* ═══ Purchases Table / Cards ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse w-1/4" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <CreditCard className="size-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-cairo">
                {t('operator.payments.empty')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('operator.payments.empty_desc')}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/operator/deals"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Search className="size-4" />
                <span>{isAr ? 'استعراض الصفقات النشطة الآن' : 'Consulter les marchés actifs'}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 text-start">{t('operator.payments.table_deal')}</th>
                  <th className="py-3.5 px-4 text-start">{t('operator.payments.table_authority')}</th>
                  <th className="py-3.5 px-4 text-start">{t('operator.payments.table_receipt')}</th>
                  <th className="py-3.5 px-4 text-start">{t('operator.payments.table_amount')}</th>
                  <th className="py-3.5 px-4 text-start">{t('operator.payments.table_method')}</th>
                  <th className="py-3.5 px-4 text-start">{t('operator.payments.table_date')}</th>
                  <th className="py-3.5 px-4 text-start">{t('operator.payments.table_status')}</th>
                  <th className="py-3.5 px-4 text-end">{t('operator.payments.table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPurchases.map((purchase) => {
                  const isPaid = purchase.status === 'paid';
                  const isCopied = copiedId === purchase.receipt_number;

                  return (
                    <tr
                      key={purchase.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Deal Title & Ref */}
                      <td className="py-4 px-4 max-w-[220px]">
                        <span className="font-mono font-bold text-[11px] text-emerald-700 dark:text-emerald-400 block mb-0.5">
                          {purchase.deal_reference}
                        </span>
                        <strong className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                          {purchase.deal_title}
                        </strong>
                      </td>

                      {/* Contracting Authority */}
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{purchase.authority_name || '—'}</span>
                        </div>
                      </td>

                      {/* Receipt Number */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {purchase.receipt_number ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                              {purchase.receipt_number}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyReceipt(purchase.receipt_number)}
                              title={isAr ? 'نسخ رقم الوصل' : 'Copier'}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              {isCopied ? (
                                <Check className="size-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          {purchase.amount.toLocaleString(isAr ? 'ar-DZ' : 'fr-FR')}
                        </span>{' '}
                        <span className="text-[10px] text-slate-400 font-sans">{t('common.dzd')}</span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="size-3.5 text-slate-500" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                            {purchase.payment_method === 'FREE'
                              ? isAr ? 'مجاني' : 'Gratuit'
                              : purchase.payment_method === 'CIB'
                              ? 'CIB'
                              : 'الذهبية EDAHABIA'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {purchase.payment_gateway === 'chargily' ? 'Chargily Pay' : 'National Gateway'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="size-3 text-slate-400 shrink-0" />
                          <span>{formatDate(purchase.paid_at || purchase.created_at)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            <span>{t('operator.payments.status_paid')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                            <Clock className="size-3 text-amber-600" />
                            <span>{t('operator.payments.status_pending')}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid && purchase.receipt_number ? (
                            <>
                              {/* Download Specs PDF */}
                              <button
                                type="button"
                                onClick={() => handleDownloadSpecs(purchase.receipt_number)}
                                title={t('operator.specs.download_pdf')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-colors"
                              >
                                <Download className="size-3.5" />
                                <span>{t('operator.payments.download_specs')}</span>
                              </button>

                              {/* Download Receipt PDF */}
                              <button
                                type="button"
                                onClick={() => handleDownloadReceipt(purchase.receipt_number)}
                                title={t('operator.specs.download_receipt')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
                              >
                                <FileCheck className="size-3.5 text-emerald-600" />
                                <span>{t('operator.payments.download_receipt')}</span>
                              </button>
                            </>
                          ) : (
                            <Link
                              href={purchase.deal_url}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
                            >
                              <CreditCard className="size-3.5" />
                              <span>{isAr ? 'إتمام الدفع' : 'Payer'}</span>
                            </Link>
                          )}

                          {/* Link to Deal Details */}
                          <Link
                            href={purchase.deal_url}
                            title={t('operator.payments.view_deal')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OperatorPaymentsView;
