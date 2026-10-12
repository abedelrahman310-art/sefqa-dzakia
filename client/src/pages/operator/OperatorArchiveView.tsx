import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Archive,
  Search,
  ArrowRight,
  Briefcase,
  Inbox,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';

interface ArchiveOpportunity {
  id: string;
  title: string;
  description: string;
  authorityName: string;
  updatedAt: string;
  status: string;
  estimatedBudget?: string | null;
}

interface ArchiveOffer {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  authorityName: string;
  financialOffer: string;
  deliveryTimeDays?: string | null;
  status: 'draft' | 'submitted';
  submittedAt?: string | null;
  updatedAt: string;
}

export function OperatorArchiveView() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<'deals' | 'offers'>('deals');
  const [opportunities, setOpportunities] = useState<ArchiveOpportunity[]>([]);
  const [offers, setOffers] = useState<ArchiveOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/opportunities').then((res) => (res.ok ? res.json() : Promise.reject())),
      fetch('/api/offers').then((res) => (res.ok ? res.json() : Promise.reject())),
    ])
      .then(([oppsData, offersData]) => {
        if (oppsData.opportunities) {
          setOpportunities(oppsData.opportunities);
        }
        if (offersData.offers) {
          setOffers(offersData.offers);
        }
      })
      .catch((err) => console.error('Failed to load archive data:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter deals: closed, past, or all with search
  const filteredDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    // In archive, prioritize deals that have submission closed or past statuses
    const target = opportunities.filter((opp) => {
      const isPastOrClosed =
        opp.status === 'submission_closed' ||
        opp.status === 'opening_in_progress' ||
        opp.status === 'opened_pv_signed' ||
        opp.status === 'technical_evaluation' ||
        opp.status === 'financial_evaluation' ||
        opp.status === 'provisional_award' ||
        opp.status === 'infructuous';
      return isPastOrClosed || true; // Show all completed/archived list
    });

    if (!q) return target;
    return target.filter(
      (opp) =>
        opp.title.toLowerCase().includes(q) ||
        opp.authorityName.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q)
    );
  }, [opportunities, searchQuery]);

  // Filter offers: submitted offers are historical archived offers
  const filteredOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const target = offers;
    if (!q) return target;
    return target.filter(
      (o) =>
        o.opportunityTitle.toLowerCase().includes(q) ||
        o.authorityName.toLowerCase().includes(q)
    );
  }, [offers, searchQuery]);

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
          {t('operator.archive.title')}
        </span>
      </div>

      {/* Header Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <Archive className="w-4 h-4 text-gold-400" />
          <span className="font-bold text-gold-300">
            {t('nav.operator.archive')} — السجل الرقمي الموثق
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          {t('operator.archive.title')}
        </h1>
        <p className="text-xs md:text-sm text-navy-100 max-w-2xl leading-relaxed">
          {t('operator.archive.subtitle')}
        </p>
      </section>

      {/* Main Archive Workspace */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        {/* Tab Selection & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'deals' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('deals')}
              className={`rounded-xl text-xs font-bold gap-1.5 ${
                activeTab === 'deals'
                  ? 'bg-navy-900 text-white hover:bg-navy-800'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{t('operator.archive.tab_deals')}</span>
              <span className="ms-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {filteredDeals.length}
              </span>
            </Button>

            <Button
              variant={activeTab === 'offers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('offers')}
              className={`rounded-xl text-xs font-bold gap-1.5 ${
                activeTab === 'offers'
                  ? 'bg-navy-900 text-white hover:bg-navy-800'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>{t('operator.archive.tab_offers')}</span>
              <span className="ms-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {filteredOffers.length}
              </span>
            </Button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'deals'
                  ? t('operator.archive.search_deals_ph')
                  : t('operator.archive.search_offers_ph')
              }
              className="ps-9 text-xs h-10 rounded-xl border-border bg-background"
            />
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">{t('operator.req.loading')}</span>
          </div>
        ) : activeTab === 'deals' ? (
          filteredDeals.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3 bg-muted/20">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-navy-900">
                {t('operator.archive.empty_deals')}
              </p>
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
              {filteredDeals.map((opp) => (
                <article
                  key={opp.id}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-navy-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        <span>{opp.authorityName}</span>
                      </span>
                      {opp.status === 'submission_closed' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                          {t('operator.archive.closed_status')}
                        </span>
                      )}
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
                  </div>

                  <div className="flex items-center gap-2 self-stretch md:self-center shrink-0 pt-2 md:pt-0">
                    <Button
                      size="sm"
                      className="text-xs font-bold px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl shadow-sm"
                      onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                    >
                      {t('operator.archive.view_deal')}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : filteredOffers.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3 bg-muted/20">
            <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-bold text-navy-900">
              {t('operator.archive.empty_offers')}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredOffers.map((offer) => (
              <article
                key={offer.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-navy-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-900 line-clamp-1">
                      {offer.opportunityTitle}
                    </h3>
                    {offer.status === 'submitted' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('offers.status.submitted')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-gold-50 text-gold-900 border border-gold-200 font-bold px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>{t('offers.status.draft')}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-100 px-2.5 py-0.5 rounded-md text-[11px]">
                      {offer.authorityName}
                    </span>
                    <span>
                      <strong className="text-navy-900 font-semibold">{t('offers.field.financial')}:</strong>{' '}
                      <span className="font-mono text-navy-900 font-bold">{offer.financialOffer} د.ج</span>
                    </span>
                    <span className="text-muted-foreground">
                      {offer.submittedAt
                        ? `${t('offers.status.submitted')}: ${new Date(offer.submittedAt).toLocaleDateString()}`
                        : `آخر تعديل: ${new Date(offer.updatedAt).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-center shrink-0 pt-2 md:pt-0">
                  <Button
                    size="sm"
                    className="text-xs font-bold px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl shadow-sm"
                    onClick={() => setLocation(`/operator/offers/${offer.id}`)}
                  >
                    {t('operator.archive.view_offer')}
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
