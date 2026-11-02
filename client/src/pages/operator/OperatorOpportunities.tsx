import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { useSearch } from 'wouter/use-location';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  Search,
  Lock,
  Sparkles,
  UserCheck,
  RefreshCw,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronDown,
  Filter,
  Radio,
  Briefcase,
  ShieldCheck,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { SuitabilityModal } from './SuitabilityModal';
import { ProcedureTypeCollapsible } from './ProcedureTypeCollapsible';
import { SmartOpportunityRadar } from '@/features/ai/components/SmartOpportunityRadar';
import { BidComplianceShield, type ComplianceData } from '@/features/compliance/BidComplianceShield';

interface OpportunityProcedure {
  form?: string | null;
  method?: string | null;
  nature?: string | null;
  scope?: string | null;
}

interface Opportunity {
  id: string;
  reference: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  authorityName: string;
  status: string;
  submissionDeadline?: string | null;
  hasDocument: boolean;
  procedure: OpportunityProcedure;
  matching?: {
    isClassified: boolean;
    overallSignal: 'relevant' | 'partial' | 'neutral' | 'unclassified';
  };
}

/** ربط معرّفات التصفية بقيم `procurement_form` القادمة من دفتر الشروط. */
const PROC_FILTER_VALUES: Record<string, string> = {
  open: 'open',
  openMin: 'open_with_min_capacity',
  limited: 'restricted',
  contest: 'competition',
  consult: 'after_consultation',
  direct: 'direct',
};

export function OperatorOpportunities() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const isRtl = dir === 'rtl';

  // نمط العرض: الرادار التنبؤي الذكي أم استعراض كافة الصفقات
  const [viewMode, setViewMode] = useState<'radar' | 'all'>('radar');

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profileConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuitabilityId, setSelectedSuitabilityId] = useState<string | null>(null);
  const [selectedProc, setSelectedProc] = useState('all');
  const [isProcOpen, setIsProcOpen] = useState(false);

  // حالة نافذة درع الامتثال المنبثقة
  const [complianceModalDealId, setComplianceModalDealId] = useState<string | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  const handleOpenComplianceModal = async (dealId: string) => {
    setComplianceModalDealId(dealId);
    setComplianceLoading(true);
    setComplianceError(null);
    setComplianceData(null);
    try {
      const res = await api.post<ComplianceData>('/operator/check-compliance/', { deal_id: dealId });
      setComplianceData(res.data);
    } catch (err: any) {
      setComplianceError(err.response?.data?.error || 'تعذر تشغيل درع الفحص على هذه الصفقة حالياً.');
    } finally {
      setComplianceLoading(false);
    }
  };

  const procDefs = useMemo(() => [
    { id: 'open', title: t('operator.proc.open'), desc: t('operator.proc.open_desc') },
    { id: 'openMin', title: t('operator.proc.open_min'), desc: t('operator.proc.open_min_desc') },
    { id: 'limited', title: t('operator.proc.limited'), desc: t('operator.proc.limited_desc') },
    { id: 'contest', title: t('operator.proc.contest'), desc: t('operator.proc.contest_desc') },
    { id: 'consult', title: t('operator.proc.consult'), desc: t('operator.proc.consult_desc') },
    { id: 'direct', title: t('operator.proc.direct'), desc: t('operator.proc.direct_desc') },
  ], [t]);

  useEffect(() => {
    const q = new URLSearchParams(search).get('q') || '';
    setSearchQuery(q);
  }, [search]);

  const loadOpportunities = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/procurements/deals/');
      const data = res.data;
      const items = Array.isArray(data) ? data : data?.results || [];
      const mapped: Opportunity[] = items
        .filter((d: any) => d.current_stage >= 3)
        .map((d: any) => {
          const admin = d.cahier_specs?.administrative_clauses ?? null;
          return {
            id: String(d.id),
            reference: d.reference_number || `DZ-${String(d.id).slice(0, 6)}`,
            title: d.title,
            description: d.description || '',
            estimatedBudget: d.estimated_budget ? formatCurrency(Number(d.estimated_budget)) : null,
            authorityName:
              d.authority?.organization_name || d.authority?.display_name || t('common.unspecified'),
            status: d.status || 'open',
            submissionDeadline: d.submission_deadline || null,
            hasDocument: Boolean(d.cahier_specs?.document_url || d.cahier_specs?.document_file),
            procedure: {
              form: admin?.procurement_form ?? null,
              method: admin?.procedure_type ?? null,
              nature: admin?.contract_nature ?? null,
              scope: admin?.geographic_scope ?? null,
            },
            matching: d.matching ?? undefined,
          };
        });
      setOpportunities(mapped);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const filteredOpportunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const procValue = selectedProc === 'all' ? null : PROC_FILTER_VALUES[selectedProc];

    return opportunities.filter((opp) => {
      if (procValue && opp.procedure.form !== procValue) return false;
      if (!q) return true;
      return (
        opp.title.toLowerCase().includes(q) ||
        opp.authorityName.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q) ||
        opp.reference.toLowerCase().includes(q)
      );
    });
  }, [opportunities, searchQuery, selectedProc]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedProc !== 'all';

  const currentProcLabel =
    selectedProc === 'all'
      ? t('operator.opportunities.all_procs')
      : (procDefs.find((proc) => proc.id === selectedProc)?.title ?? t('operator.opportunities.all_procs'));

  const renderSignalPill = (signal?: string) => {
    switch (signal) {
      case 'relevant':
        return <span className="op-chip green whitespace-nowrap">{t('operator.suitability.signal_relevant')}</span>;
      case 'partial':
        return <span className="op-chip gold whitespace-nowrap">{t('operator.suitability.signal_partial')}</span>;
      case 'unclassified':
        return <span className="op-chip blue whitespace-nowrap">{t('operator.suitability.signal_unclassified')}</span>;
      default:
        return <span className="op-chip whitespace-nowrap">{t('operator.suitability.signal_neutral')}</span>;
    }
  };

  return (
    <div className="op-page" dir={dir}>
      {/* ─── ترويسة الصفحة ─── */}
      <div className="op-page-head">
        <div>
          <h1>{t('operator.opportunities.title')}</h1>
          <p>{t('operator.opportunities.subtitle')}</p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline whitespace-nowrap"
            onClick={() => loadOpportunities(true)}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{refreshing ? t('operator.opportunities.refreshing') : t('operator.opportunities.refresh')}</span>
          </button>
        </div>
      </div>

      {/* ─── محوّل العرض بين رادار الصفقات التنبؤي وكافة الصفقات ─── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xs">
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('radar')}
            className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg px-4 py-2 transition-all cursor-pointer ${
              viewMode === 'radar'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="size-4 animate-pulse" />
            <span>رادار الصفقات التنبؤي الذكي (AI Radar)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg px-4 py-2 transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="size-4" />
            <span>كافة الصفقات المنشورة ({opportunities.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-semibold px-2">
          <Sparkles className="size-3.5 text-emerald-600" />
          <span>مطابقة ذكية لولايات الجزائر الـ 69 وفق القانون 23-12</span>
        </div>
      </div>

      {/* ─── عرض رادار الصفقات التنبؤي ─── */}
      {viewMode === 'radar' ? (
        <SmartOpportunityRadar onCheckCompliance={handleOpenComplianceModal} />
      ) : (
        /* ─── عرض كافة الصفقات العادية ─── */
        <>
          <section aria-label={t('operator.opportunities.proc_filter')}>
            <div className={`op-proc-filter${isProcOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="op-proc-filter-toggle"
                onClick={() => setIsProcOpen((current) => !current)}
                aria-expanded={isProcOpen}
                aria-controls="procedure-filter-panel"
              >
                <span className="op-proc-filter-icon" aria-hidden="true">
                  <Filter />
                </span>
                <span className="op-proc-filter-text">
                  <span className="op-proc-filter-label">{t('operator.opportunities.proc_filter')}:</span>
                  <strong className="op-proc-filter-value">{currentProcLabel}</strong>
                </span>
                <span className="op-proc-filter-meta whitespace-nowrap">
                  {filteredOpportunities.length} {t('operator.opportunities.ad_unit')}
                </span>
                <ChevronDown className="op-proc-filter-chevron" aria-hidden="true" />
              </button>

              <div
                className="op-proc-filter-panel"
                id="procedure-filter-panel"
                role="region"
                aria-label={t('operator.opportunities.proc_filter')}
                aria-hidden={!isProcOpen}
              >
                <div className="op-proc-filter-panel-inner">
                  <div className="op-choice-grid" role="group" aria-label={t('operator.opportunities.proc_filter')}>
                    <button
                      type="button"
                      aria-pressed={selectedProc === 'all'}
                      tabIndex={isProcOpen ? 0 : -1}
                      onClick={() => {
                        setSelectedProc('all');
                        setIsProcOpen(false);
                      }}
                      className={`op-choice${selectedProc === 'all' ? ' active' : ''}`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="op-choice-title">{t('operator.opportunities.all_procs')}</span>
                        {selectedProc === 'all' && (
                          <Sparkles className="size-4 flex-none text-[var(--op-gold)]" aria-hidden="true" />
                        )}
                      </span>
                      <span className="op-choice-desc">{t('operator.opportunities.all_procs_desc')}</span>
                    </button>
                    {procDefs.map((proc) => {
                      const isSelected = selectedProc === proc.id;
                      return (
                        <button
                          key={proc.id}
                          type="button"
                          aria-pressed={isSelected}
                          tabIndex={isProcOpen ? 0 : -1}
                          onClick={() => {
                            setSelectedProc(proc.id);
                            setIsProcOpen(false);
                          }}
                          className={`op-choice${isSelected ? ' active' : ''}`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <span className="op-choice-title">{proc.title}</span>
                            {isSelected && (
                              <Sparkles className="size-4 flex-none text-[var(--op-gold)]" aria-hidden="true" />
                            )}
                          </span>
                          <span className="op-choice-desc">{proc.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {!profileConfigured && (
            <div className="op-info-banner">
              <UserCheck aria-hidden="true" />
              <div>
                <strong>{t('operator.opportunities.profile_nudge_title')}</strong>
                <p>{t('operator.opportunities.profile_nudge_desc')}</p>
                <button
                  type="button"
                  className="op-btn op-btn-ghost op-btn-sm mt-3"
                  onClick={() => setLocation('/operator/profile')}
                >
                  {t('operator.opportunities.profile_nudge_btn')}
                </button>
              </div>
            </div>
          )}

          <section id="opportunities-section" className="op-card" aria-labelledby="opportunities-list-title">
            <div className="op-card-head">
              <div>
                <h3 id="opportunities-list-title">{t('toolbar.pill_deals')}</h3>
                <p className="mt-0.5 text-xs text-[var(--op-muted)]">{t('overview.discovery.desc')}</p>
              </div>
              <div className="op-search-lg w-full sm:w-80">
                <Search aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t('operator.opportunities.search_ph')}
                  aria-label={t('operator.opportunities.search_label')}
                />
              </div>
            </div>

            <div className="op-table-scroll">
              <table className="op-table">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap">{t('operator.opportunities.table_ref')}</th>
                    <th className="whitespace-nowrap">{t('operator.opportunities.table_subject')}</th>
                    <th className="whitespace-nowrap">{t('operator.opportunities.table_authority')}</th>
                    <th className="whitespace-nowrap">{t('operator.opportunities.table_proc')}</th>
                    <th className="whitespace-nowrap">{t('operator.opportunities.table_budget')}</th>
                    <th className="whitespace-nowrap">{t('operator.opportunities.table_deadline')}</th>
                    <th className="whitespace-nowrap">{t('operator.opportunities.table_match')}</th>
                    <th className="whitespace-nowrap">{t('operator.opportunities.table_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="space-y-3 p-5">
                          {[1, 2, 3, 4].map((row) => (
                            <div key={row} className="op-skeleton h-12" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : filteredOpportunities.length === 0 ? (
                    <tr className="op-empty-row">
                      <td colSpan={8}>
                        <div className="op-empty-state">
                          <Search aria-hidden="true" />
                          <h4>{hasActiveFilters ? t('deals.search.empty_title') : t('opps.empty')}</h4>
                          <p>
                            {hasActiveFilters
                              ? searchQuery
                                ? t('deals.search.empty_desc')
                                : t('operator.opportunities.no_results_filtered')
                              : t('operator.opportunities.no_results')}
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              className="op-btn op-btn-outline op-btn-sm mt-2 whitespace-nowrap"
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedProc('all');
                              }}
                            >
                              {t('operator.opportunities.reset_filter')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOpportunities.map((opp) => (
                      <tr key={opp.id}>
                        <td>
                          <span className="op-mono text-xs font-bold text-[var(--op-ink)]">{opp.reference}</span>
                        </td>
                        <td>
                          <div className="max-w-[320px]">
                            <div className="line-clamp-1 font-bold text-[var(--op-ink)]" title={opp.title}>
                              {opp.title}
                            </div>
                            <div className="mt-0.5 line-clamp-1 text-xs text-[var(--op-muted)]">
                              {opp.description || '—'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="flex items-center gap-1.5 text-xs">
                            <Building2 className="size-3.5 flex-none text-[var(--op-muted)]" aria-hidden="true" />
                            <span className="line-clamp-1">{opp.authorityName}</span>
                          </span>
                        </td>
                        <td>
                          <ProcedureTypeCollapsible info={opp.procedure} />
                        </td>
                        <td>
                          <span className="font-mono text-xs font-bold text-[var(--op-ink)] whitespace-nowrap">
                            {opp.estimatedBudget || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                            <Calendar className="size-3.5 flex-none text-[var(--op-muted)]" aria-hidden="true" />
                            <span>{formatDate(opp.submissionDeadline, lang)}</span>
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-col items-start gap-1">
                            {opp.status === 'submission_closed' ? (
                              <span className="op-chip red whitespace-nowrap">{t('operator.opportunities.deadline_passed')}</span>
                            ) : (
                              renderSignalPill(opp.matching?.overallSignal)
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {/* زر درع الفحص السريع */}
                            <button
                              type="button"
                              className="op-btn op-btn-outline op-btn-sm whitespace-nowrap text-emerald-700 hover:border-emerald-500 inline-flex items-center gap-1 cursor-pointer"
                              onClick={() => handleOpenComplianceModal(opp.id)}
                              title="فحص العرض بدرع مكافحة الإقصاء الشكلي"
                            >
                              <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
                              <span>درع الفحص</span>
                            </button>

                            <button
                              type="button"
                              className="op-btn op-btn-outline op-btn-sm whitespace-nowrap"
                              onClick={() => setSelectedSuitabilityId(opp.id)}
                            >
                              <Sparkles aria-hidden="true" />
                              <span>{t('operator.suitability.view_btn')}</span>
                            </button>

                            <button
                              type="button"
                              className="op-btn op-btn-gold op-btn-sm whitespace-nowrap inline-flex items-center gap-1 cursor-pointer"
                              onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                            >
                              <span>{t('opps.details')}</span>
                              <ChevronLeft className="size-3.5 transition-transform rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-[var(--op-muted)]">
            {t('operator.opportunities.docs_notice')}
          </p>
        </>
      )}

      {/* ─── نافذة منبثقة لدرع مكافحة الإقصاء الشكلي (Bid Compliance Modal) ─── */}
      {complianceModalDealId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100">
            {/* زر إغلاق النافذة */}
            <button
              type="button"
              onClick={() => {
                setComplianceModalDealId(null);
                setComplianceData(null);
              }}
              className="absolute top-4 end-4 z-20 size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="size-4" />
            </button>

            {complianceLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="size-10 text-emerald-600 animate-spin mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900">جارٍ إجراء الفحص التلقائي بدرع الامتثال...</h3>
                <p className="text-xs text-slate-500 mt-1">مطابقة ملف مؤسستك والوثائق الإلزامية وفق المادة 67 من القانون 23-12</p>
              </div>
            ) : complianceError ? (
              <div className="p-8 text-center space-y-3">
                <div className="size-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                  <X className="size-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">تعذر استكمال الفحص</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">{complianceError}</p>
                <button
                  type="button"
                  onClick={() => handleOpenComplianceModal(complianceModalDealId)}
                  className="op-btn op-btn-outline op-btn-sm"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : complianceData ? (
              <div className="p-4 sm:p-6 space-y-4">
                <BidComplianceShield data={complianceData} />

                {/* شريط الإجراء النهائي */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500">
                    يمكنك استكمال النواقص أو البدء في تعبئة العرض المالي والتقني مباشرة.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const id = complianceModalDealId;
                      setComplianceModalDealId(null);
                      setLocation(`/operator/offers/new?dealId=${id}`);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#006233] to-[#0f3154] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>المتابعة إلى إعداد العرض</span>
                    {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* نافذة الملاءمة الأصلية */}
      <SuitabilityModal
        opportunityId={selectedSuitabilityId}
        onClose={() => setSelectedSuitabilityId(null)}
      />
    </div>
  );
}

export default OperatorOpportunities;
