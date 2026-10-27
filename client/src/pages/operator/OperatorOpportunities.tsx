import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { useSearch } from 'wouter/use-location';
import { api } from '@/lib/api';
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

const PROC_DEFS = [
  { id: 'open', title: 'طلب العروض المفتوح', desc: 'إجراء يتاح فيه لكل متعامل اقتصادي مؤهل تقديم عرضه.' },
  { id: 'openMin', title: 'طلب العروض المفتوح مع اشتراط قدرات دنيا', desc: 'مفتوح للمتعاملين الذين يستوفون القدرات الدنيا المحددة في دفتر الشروط.' },
  { id: 'limited', title: 'طلب العروض المحدود', desc: 'يُوجَّه إلى متعاملين اقتصاديين تم انتقاؤهم مسبقًا.' },
  { id: 'contest', title: 'المسابقة', desc: 'إجراء يُختار فيه مشروع أو دراسة بعد المنافسة بين المشاركين.' },
  { id: 'consult', title: 'الاستشارة', desc: 'إجراء مبسّط تُستشار فيه عدة متعاملين لتلبية حاجات محدودة.' },
  { id: 'direct', title: 'التراضي', desc: 'إبرام الصفقة مع متعامل واحد في الحالات التي يحددها التنظيم.' },
];

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
  const { t, lang } = useI18n();
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
              ? `${Number(d.estimated_budget).toLocaleString('ar-DZ')} دج`
              : null,
            authorityName: d.authority_entity || d.authority_name || 'مصلحة متعاقدة',
            status: d.stage_display || 'طلب عروض مفتوح',
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
      ? 'الكل'
      : (PROC_DEFS.find((proc) => proc.id === selectedProc)?.title ?? 'الكل');

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR');
  };

  const renderSignalPill = (signal?: string) => {
    switch (signal) {
      case 'relevant':
        return <span className="op-chip green">{t('operator.suitability.signal_relevant')}</span>;
      case 'partial':
        return <span className="op-chip gold">{t('operator.suitability.signal_partial')}</span>;
      case 'unclassified':
        return <span className="op-chip blue">{t('operator.suitability.signal_unclassified')}</span>;
      default:
        return <span className="op-chip">{t('operator.suitability.signal_neutral')}</span>;
    }
  };

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <h1>الإعلانات وفرص الصفقات</h1>
          <p>تصفح الإعلانات المنشورة وقدّم عروضك على ما يناسب مؤسستك.</p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => loadOpportunities(true)}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{refreshing ? 'جاري التحديث...' : 'تحديث القائمة'}</span>
          </button>
        </div>
      </div>

      <section aria-label="تصفية حسب نوع الإجراء">
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
              <span className="op-proc-filter-label">نوع الإجراء:</span>
              <strong className="op-proc-filter-value">{currentProcLabel}</strong>
            </span>
            <span className="op-proc-filter-meta">
              {filteredOpportunities.length} إعلان
            </span>
            <ChevronDown className="op-proc-filter-chevron" aria-hidden="true" />
          </button>

          <div
            className="op-proc-filter-panel"
            id="procedure-filter-panel"
            role="region"
            aria-label="خيارات نوع الإجراء"
            aria-hidden={!isProcOpen}
          >
            <div className="op-proc-filter-panel-inner">
              <div className="op-choice-grid" role="group" aria-label="نوع الإجراء">
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
                    <span className="op-choice-title">كل الإجراءات</span>
                    {selectedProc === 'all' && (
                      <Sparkles className="size-4 flex-none text-[var(--op-gold)]" aria-hidden="true" />
                    )}
                  </span>
                  <span className="op-choice-desc">عرض جميع الإعلانات بغض النظر عن نوع الإجراء.</span>
                </button>
                {PROC_DEFS.map((proc) => {
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
            <strong>خصص ملف نشاطك وشهاداتك المصرح بها للحصول على مطابقة دقيقة</strong>
            <p>أدخل قطاعك الرئيسي وولايتك ورموز الأنشطة التجارية لتسهيل فرز ومطابقة الفرص.</p>
            <button
              type="button"
              className="op-btn op-btn-ghost op-btn-sm mt-3"
              onClick={() => setLocation('/operator/profile')}
            >
              إعداد ملف النشاط
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
              placeholder={t('deals.search.placeholder')}
              aria-label="بحث في الصفقات"
            />
          </div>
        </div>

        <div className="op-table-scroll">
          <table className="op-table">
            <thead>
              <tr>
                <th>رقم الصفقة</th>
                <th>الموضوع</th>
                <th>المصلحة المتعاقدة</th>
                <th>نوع الإجراء</th>
                <th>الميزانية</th>
                <th>آخر أجل</th>
                <th>المطابقة</th>
                <th>إجراء</th>
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
                            : 'لا توجد إعلانات مسجّلة بهذا النوع من الإجراء حالياً.'
                          : 'ستظهر الصفقات المنشورة هنا فور توفرها'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="op-btn op-btn-outline op-btn-sm mt-2"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedProc('all');
                          }}
                        >
                          إلغاء التصفية
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
                        <div className="mt-0.5 line-clamp-1 text-[11.5px] text-[var(--op-muted)]">
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
                      <span className="font-mono text-xs font-bold text-[var(--op-ink)]">
                        {opp.estimatedBudget || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs">
                        <Calendar className="size-3.5 flex-none text-[var(--op-muted)]" aria-hidden="true" />
                        <span>{formatDate(opp.submissionDeadline)}</span>
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        {opp.status === 'submission_closed' ? (
                          <span className="op-chip red">أجل الإيداع منتهٍ</span>
                        ) : (
                          renderSignalPill(opp.matching?.overallSignal)
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          className="op-btn op-btn-outline op-btn-sm"
                          onClick={() => setSelectedSuitabilityId(opp.id)}
                        >
                          <Sparkles aria-hidden="true" />
                          <span>{t('operator.suitability.view_btn')}</span>
                        </button>
                        <button
                          type="button"
                          className="op-btn op-btn-gold op-btn-sm"
                          onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                        >
                          {t('opps.details')}
                          <ChevronLeft aria-hidden="true" />
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

      <p className="text-[11px] text-[var(--op-muted)]">
        الوثائق المرفقة غير قابلة للتنزيل حالياً من قائمة الصفقات؛ يمكنك الاطلاع على التفاصيل من صفحة الصفقة.
      </p>

      <SuitabilityModal
        opportunityId={selectedSuitabilityId}
        onClose={() => setSelectedSuitabilityId(null)}
      />
    </div>
  );
}

export default OperatorOpportunities;
