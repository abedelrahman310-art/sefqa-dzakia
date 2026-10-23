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
} from 'lucide-react';
import { SuitabilityModal } from './SuitabilityModal';
import { OperatorRecommendationsCard } from '@/features/ai/components/OperatorRecommendationsCard';

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
  const [selectedProc, setSelectedProc] = useState('open');

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
        .map((d: any) => ({
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
          matching: {
            isClassified: true,
            overallSignal: 'relevant' as const,
          },
        }));
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
    if (!q) return opportunities;
    return opportunities.filter(
      (opp) =>
        opp.title.toLowerCase().includes(q) ||
        opp.authorityName.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q) ||
        opp.reference.toLowerCase().includes(q),
    );
  }, [opportunities, searchQuery]);

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

      <section aria-labelledby="procedure-type-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="procedure-type-title" className="op-section-title">
            نوع الإجراء
          </h2>
          <span className="op-muted text-xs">اختر نوع الإجراء لعرض الإعلانات المناسبة</span>
        </div>
        <div className="op-choice-grid" role="group" aria-label="نوع الإجراء">
          {PROC_DEFS.map((proc) => {
            const isSelected = selectedProc === proc.id;
            return (
              <button
                key={proc.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedProc(proc.id)}
                className={`op-choice${isSelected ? ' active' : ''}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="op-choice-title">{proc.title}</span>
                  {isSelected && <Sparkles className="size-4 flex-none text-[var(--op-gold)]" aria-hidden="true" />}
                </span>
                <span className="op-choice-desc">{proc.desc}</span>
              </button>
            );
          })}
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
                <th>الميزانية</th>
                <th>آخر أجل</th>
                <th>المطابقة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="space-y-3 p-5">
                      {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="op-skeleton h-12" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filteredOpportunities.length === 0 ? (
                <tr className="op-empty-row">
                  <td colSpan={7}>
                    <div className="op-empty-state">
                      <Search aria-hidden="true" />
                      <h4>{searchQuery ? t('deals.search.empty_title') : t('opps.empty')}</h4>
                      <p>
                        {searchQuery
                          ? t('deals.search.empty_desc')
                          : 'ستظهر الصفقات المنشورة هنا فور توفرها'}
                      </p>
                      {searchQuery && (
                        <button
                          type="button"
                          className="op-btn op-btn-outline op-btn-sm mt-2"
                          onClick={() => setSearchQuery('')}
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
