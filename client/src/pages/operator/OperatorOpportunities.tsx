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
} from 'lucide-react';
import { SuitabilityModal } from './SuitabilityModal';
import { ProcedureTypeCollapsible } from './ProcedureTypeCollapsible';
import { OperatorRecommendationsCard } from '@/features/ai/components/OperatorRecommendationsCard';

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

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profileConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuitabilityId, setSelectedSuitabilityId] = useState<string | null>(null);
  const [selectedProc, setSelectedProc] = useState('all');
  const [isProcOpen, setIsProcOpen] = useState(false);

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
            estimatedBudget: d.estimated_budget
              ? formatCurrency(Number(d.estimated_budget), lang)
              : null,
            authorityName: d.authority_entity || d.authority_name || t('operator.opportunities.table_authority'),
            status: d.stage_display || t('operator.proc.open'),
            submissionDeadline: d.submission_deadline || null,
            hasDocument: !!d.cahier_specs,
            procedure: {
              form: admin?.procurement_form ?? null,
              method: admin?.procurement_method ?? null,
              nature: admin?.procurement_nature ?? null,
              scope: admin?.competition_scope ?? null,
            },
            matching: {
              isClassified: true,
              overallSignal: 'relevant' as const,
            },
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

      <OperatorRecommendationsCard
        onSelectTender={(id) => setLocation(`/operator/opportunities/${id}`)}
        onViewAll={() => {
          const el = document.getElementById('opportunities-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

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
                      <div className="flex flex-wrap items-center justify-end gap-2">
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
                          className="op-btn op-btn-gold op-btn-sm whitespace-nowrap inline-flex items-center gap-1"
                          onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                        >
                          <span>{t('opps.details')}</span>
                          <ChevronLeft className="size-3.5 transition-transform rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled
                          title={t('doc.download_suspended')}
                          className="op-icon-btn opacity-60"
                          aria-label={t('doc.download_suspended_short')}
                        >
                          <Lock aria-hidden="true" />
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

      <SuitabilityModal
        opportunityId={selectedSuitabilityId}
        onClose={() => setSelectedSuitabilityId(null)}
      />
    </div>
  );
}

export default OperatorOpportunities;
