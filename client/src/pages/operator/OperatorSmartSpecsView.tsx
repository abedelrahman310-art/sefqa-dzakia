import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import {
  Search,
  FileCheck,
  Building,
  Calendar,
  Sparkles,
  ChevronLeft,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface OpportunitySpecItem {
  id: string;
  reference?: string;
  title: string;
  description: string;
  authorityName: string;
  updatedAt: string;
  status: string;
  hasDocument: boolean;
  estimatedBudget?: string | null;
}

export function OperatorSmartSpecsView() {
  const { t, lang } = useI18n();
  const [, setLocation] = useLocation();
  const [opportunities, setOpportunities] = useState<OpportunitySpecItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSpecs = (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    fetch('/api/opportunities')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.opportunities) {
          setOpportunities(data.opportunities);
        }
      })
      .catch((err) => console.error('Failed to load opportunities:', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadSpecs();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return opportunities;
    return opportunities.filter(
      (opp) =>
        opp.title.toLowerCase().includes(q) ||
        opp.authorityName.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q) ||
        (opp.reference || '').toLowerCase().includes(q),
    );
  }, [opportunities, searchQuery]);

  const formatDate = (value: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR');
  };

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <h1>{t('operator.specs.title')}</h1>
          <p>{t('operator.specs.subtitle')}</p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => loadSpecs(true)}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{refreshing ? 'جاري التحديث...' : 'تحديث القائمة'}</span>
          </button>
        </div>
      </div>

      <div className="op-info-banner">
        <FileCheck aria-hidden="true" />
        <div>
          <strong>{t('specs.index.title')} — Sanad Provenance</strong>
          <p>يمكنك الاطلاع على دفاتر الشروط والرد على متطلباتها ضمن مسار المشاركة.</p>
        </div>
      </div>

      <section className="op-card" aria-labelledby="specs-list-title">
        <div className="op-card-head">
          <div>
            <h3 id="specs-list-title">{t('operator.specs.deals_with_specs')}</h3>
            <p className="mt-0.5 text-xs text-[var(--op-muted)]">{t('operator.specs.desc')}</p>
          </div>
          <div className="op-search-lg w-full sm:w-80">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('deals.search.placeholder')}
              aria-label="بحث في دفاتر الشروط"
            />
          </div>
        </div>

        <div className="op-table-scroll">
          <table className="op-table">
            <thead>
              <tr>
                <th>الصفقة</th>
                <th>المصلحة المتعاقدة</th>
                <th>الميزانية</th>
                <th>آخر تحديث</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="space-y-3 p-5">
                      {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="op-skeleton h-12" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr className="op-empty-row">
                  <td colSpan={5}>
                    <div className="op-empty-state">
                      <FileText aria-hidden="true" />
                      <h4>{searchQuery ? t('deals.search.empty_title') : t('operator.specs.empty')}</h4>
                      <p>
                        {searchQuery
                          ? t('deals.search.empty_desc')
                          : 'ستظهر دفاتر الشروط المرتبطة بالصفقات المنشورة هنا.'}
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
                filtered.map((opp) => (
                  <tr key={opp.id}>
                    <td>
                      <div className="max-w-[360px]">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          {opp.reference && (
                            <span className="op-chip gold op-mono">{opp.reference}</span>
                          )}
                          <span className="op-chip">{opp.status || 'دفتر شروط'}</span>
                        </div>
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
                        <Building className="size-3.5 flex-none text-[var(--op-muted)]" aria-hidden="true" />
                        <span className="line-clamp-1">{opp.authorityName}</span>
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-[var(--op-ink)]">
                        {opp.estimatedBudget
                          ? `${Number(opp.estimatedBudget).toLocaleString('ar-DZ')} دج`
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs">
                        <Calendar className="size-3.5 flex-none text-[var(--op-muted)]" aria-hidden="true" />
                        <span>{formatDate(opp.updatedAt)}</span>
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          className="op-btn op-btn-outline op-btn-sm"
                          onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                        >
                          {t('opps.details')}
                        </button>
                        <button
                          type="button"
                          className="op-btn op-btn-gold op-btn-sm"
                          onClick={() => setLocation(`/operator/opportunities/${opp.id}/requirements`)}
                        >
                          <Sparkles aria-hidden="true" />
                          <span>{t('operator.specs.respond_btn')}</span>
                          <ChevronLeft aria-hidden="true" />
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
    </div>
  );
}

export default OperatorSmartSpecsView;
