import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Search, Calendar, DollarSign } from 'lucide-react';

interface Draft {
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  status: string;
  updatedAt: string;
}

export function DraftsList() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/procurements/deals/');
      const data = res.data;
      const items = Array.isArray(data) ? data : (data?.results || data?.drafts || []);
      const mapped: Draft[] = items.map((d: any) => ({
        id: String(d.id),
        title: d.title,
        description: d.description || '',
        estimatedBudget: d.estimated_budget ? String(d.estimated_budget) : null,
        status: d.current_stage >= 3 ? 'published' : 'draft',
        updatedAt: d.updated_at || d.created_at || new Date().toISOString(),
      }));
      setDrafts(mapped);
      setError(false);
    } catch (err) {
      console.error('Error fetching deals/drafts:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const filteredDrafts = useMemo(() => {
    return drafts.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = filter === 'all' || d.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [drafts, search, filter]);

  return (
    <div className="space-y-6">
      {/* Header Banner - Streamlined & Official */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
              {t('authority.overview.hero.eyebrow')}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-navy-900">
            {t('nav.authority.deals_drafts')}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {t('authority.overview.recent.desc')}
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-2 self-stretch sm:self-auto justify-center shrink-0"
          onClick={() => setLocation('/authority/drafts/new')}
        >
          <Plus className="w-4 h-4" />
          <span>{t('drafts.new')}</span>
        </Button>
      </section>

      {/* Main Panel */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        {/* Controls: Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-navy-900 text-white'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {t('authority.drafts.filter.all')} ({drafts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('draft')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filter === 'draft'
                  ? 'bg-navy-900 text-white'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {t('authority.drafts.filter.drafts')} ({drafts.filter((d) => d.status === 'draft').length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('published')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filter === 'published'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {t('authority.drafts.filter.published')} ({drafts.filter((d) => d.status === 'published').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المسودات..."
              className="ps-9 text-xs rounded-xl h-9"
            />
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">جاري تحميل المسودات...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm">
            حدث خطأ أثناء تحميل المسودات. يرجى إعادة المحاولة.
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-3 bg-muted/20">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h4 className="text-base font-bold text-navy-900">{t('drafts.msg.empty')}</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {search
                ? 'لا توجد نتائج تطابق معايير البحث الحالية.'
                : 'ابدأ بإنشاء مسودة صفقة جديدة لتنظيم متطلبات الشراء.'}
            </p>
            {!search && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                onClick={() => setLocation('/authority/drafts/new')}
              >
                + {t('drafts.new')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDrafts.map((draft) => (
              <div
                key={draft.id}
                className="p-4 bg-background border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-colors shadow-sm"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-900 line-clamp-1" title={draft.title}>{draft.title}</h3>
                    {draft.status === 'published' ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {t('authority.drafts.badge.published')}
                      </span>
                    ) : draft.status === 'submission_closed' ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        مغلق للإيداع
                      </span>
                    ) : draft.status === 'opening_in_progress' ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        جلسة الفتح جارية
                      </span>
                    ) : ['opened_pv_signed', 'technical_evaluation', 'financial_evaluation'].includes(draft.status) ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        قيد التقييم
                      </span>
                    ) : draft.status === 'provisional_award' ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                        منح مؤقت
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-200">
                        {t('authority.drafts.badge.draft')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {draft.description || t('authority.drafts.no_desc')}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-navy-700" />
                      <span>
                        {t('authority.drafts.budget_label')}:{' '}
                        <strong className="text-navy-900">
                          {draft.estimatedBudget
                            ? `${Number(draft.estimatedBudget).toLocaleString()} دج`
                            : t('authority.drafts.no_budget')}
                        </strong>
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-navy-700" />
                      <span>{new Date(draft.updatedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end self-stretch sm:self-center shrink-0 pt-2 sm:pt-0">
                  {draft.status !== 'draft' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-navy-900 border-navy-200 hover:bg-navy-50 text-xs rounded-xl px-3 py-1.5 shadow-sm font-medium"
                      onClick={() => setLocation(`/authority/opportunities/${draft.id}/received-offers`)}
                    >
                      {t('drafts.action.received_offers')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-navy-900 hover:bg-navy-800 text-white text-xs rounded-xl px-3 py-1.5 shadow-sm font-medium"
                    onClick={() => setLocation(`/authority/drafts/${draft.id}/specs`)}
                  >
                    {t('specs.view_specs')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs rounded-xl px-3 py-1.5"
                    onClick={() => setLocation(`/authority/drafts/${draft.id}/edit`)}
                  >
                    {draft.status !== 'draft' ? 'عرض' : t('drafts.btn.edit')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
