import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Briefcase, FileText, CheckCircle2, Clock } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  authorityName: string;
  updatedAt: string;
  hasDocument: boolean;
}

interface OfferItem {
  id: string;
  status: 'draft' | 'submitted';
}

export function OperatorOverview() {
  const { t, dir } = useI18n();
  const [, setLocation] = useLocation();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/opportunities').then((res) => (res.ok ? res.json() : Promise.reject())),
      fetch('/api/offers').then((res) => (res.ok ? res.json() : Promise.reject())),
    ])
      .then(([oppsData, offersData]) => {
        if (oppsData.opportunities) setOpportunities(oppsData.opportunities);
        if (offersData.offers) setOffers(offersData.offers);
      })
      .catch((err) => {
        console.error('Overview data fetch error:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const submittedCount = offers.filter((o) => o.status === 'submitted').length;
  const draftsCount = offers.filter((o) => o.status === 'draft').length;
  const recentOpps = opportunities.slice(0, 4);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-6">
      {/* Header Banner - Clean & Official */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
              {t('overview.hero.eyebrow')}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-navy-900">
            {t('overview.hero.title')}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {t('overview.hero.desc')}
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2 self-stretch sm:self-auto justify-center shrink-0"
          onClick={() => setLocation('/operator/deals')}
        >
          <span>{t('overview.hero.cta')}</span>
          <ArrowIcon className="w-4 h-4" />
        </Button>
      </section>

      {/* Real Statistics derived strictly from API */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Overview Statistics">
        {/* Available Opportunities */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{t('overview.stats.available')}</span>
            <span className="p-2 bg-navy-50 text-navy-900 rounded-xl">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-navy-900">
            {loading ? '—' : error ? '0' : opportunities.length}
          </div>
          <p className="text-xs text-muted-foreground">{t('overview.stats.available_sub')}</p>
        </div>

        {/* Submitted Offers */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">{t('overview.stats.submitted')}</span>
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">
            {loading ? '—' : error ? '0' : submittedCount}
          </div>
          <p className="text-xs text-emerald-700">{t('overview.stats.submitted_sub')}</p>
        </div>

        {/* Draft Offers */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{t('overview.stats.drafts')}</span>
            <span className="p-2 bg-gold-50 text-gold-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-navy-900">
            {loading ? '—' : error ? '0' : draftsCount}
          </div>
          <p className="text-xs text-muted-foreground">{t('overview.stats.drafts_sub')}</p>
        </div>
      </section>

      {/* Discovery Panel */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-navy-900">{t('overview.discovery.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('overview.discovery.desc')}</p>
          </div>
          <Button
            variant="outline"
            className="border-border hover:bg-muted text-xs font-bold self-start sm:self-center rounded-xl"
            onClick={() => setLocation('/operator/deals')}
          >
            {t('overview.discovery.all')}
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-xs">
            جاري استرجاع البيانات...
          </div>
        ) : error || opportunities.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center bg-muted/20 space-y-3">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-bold text-navy-900">{t('overview.discovery.empty')}</p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-xl"
              onClick={() => setLocation('/operator/deals')}
            >
              <span>{t('overview.discovery.all')}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentOpps.map((opp) => (
              <article
                key={opp.id}
                className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-navy-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100"
                      title={opp.authorityName}
                    >
                      {opp.authorityName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(opp.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-navy-900 line-clamp-1" title={opp.title}>
                    {opp.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                  <span className="text-xs font-mono font-semibold text-navy-900">
                    {opp.estimatedBudget ? `${Number(opp.estimatedBudget).toLocaleString()} د.ج` : ''}
                  </span>
                  <Button
                    size="sm"
                    className="text-xs font-bold px-3 py-1.5 h-auto bg-navy-900 hover:bg-navy-800 text-white rounded-xl shadow-sm"
                    onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                  >
                    {t('overview.discovery.view_detail')}
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
