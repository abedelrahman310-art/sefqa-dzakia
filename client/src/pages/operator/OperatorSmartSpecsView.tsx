import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckSquare,
  Search,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Building,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface OpportunitySpecItem {
  id: string;
  title: string;
  description: string;
  authorityName: string;
  updatedAt: string;
  status: string;
  hasDocument: boolean;
  estimatedBudget?: string | null;
}

export function OperatorSmartSpecsView() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [opportunities, setOpportunities] = useState<OpportunitySpecItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/opportunities')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.opportunities) {
          setOpportunities(data.opportunities);
        }
      })
      .catch((err) => console.error('Failed to load opportunities:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return opportunities;
    return opportunities.filter(
      (opp) =>
        opp.title.toLowerCase().includes(q) ||
        opp.authorityName.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q)
    );
  }, [opportunities, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/operator')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy-900 ps-0"
        >
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{t('operator.req.back')}</span>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-xs font-semibold text-navy-900">
          {t('operator.specs.title')}
        </span>
      </div>

      {/* Header Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-emerald-300">
            {t('specs.index.title')} — Sanad Provenance
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          {t('operator.specs.title')}
        </h1>
        <p className="text-xs md:text-sm text-navy-100 max-w-2xl leading-relaxed">
          {t('operator.specs.subtitle')}
        </p>
      </section>

      {/* Content & List Section */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-navy-800" />
              <span>{t('operator.specs.deals_with_specs')}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('operator.specs.desc')}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('deals.search.placeholder')}
              className="ps-9 text-xs h-10 rounded-xl border-border bg-background"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">{t('operator.req.loading')}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3 bg-muted/20">
            <FileCheck className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-bold text-navy-900">{t('operator.specs.empty')}</p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-xl"
                onClick={() => setSearchQuery('')}
              >
                إلغاء التصفية
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((opp) => (
              <article
                key={opp.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-navy-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      <span>{opp.authorityName}</span>
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(opp.updatedAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-navy-900 line-clamp-1" title={opp.title}>
                    {opp.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>

                  {opp.estimatedBudget && (
                    <div className="text-xs text-muted-foreground">
                      <strong className="text-navy-900 font-semibold">{t('opps.budget')}:</strong>{' '}
                      <span className="font-mono font-semibold text-navy-900">
                        {Number(opp.estimatedBudget).toLocaleString()} د.ج
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end self-stretch md:self-center shrink-0 pt-2 md:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold gap-1.5 border-border hover:bg-muted rounded-xl"
                    onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                  >
                    <span>{t('opps.details')}</span>
                  </Button>

                  <Button
                    size="sm"
                    className="text-xs font-bold px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                    onClick={() => setLocation(`/operator/opportunities/${opp.id}/requirements`)}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                    <span>{t('operator.specs.respond_btn')}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
