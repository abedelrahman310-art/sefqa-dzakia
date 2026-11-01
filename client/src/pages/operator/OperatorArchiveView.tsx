import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { formatCurrency, formatDate } from '@/lib/format';
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
  const { t, lang } = useI18n();
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

  const filteredDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const target = opportunities.filter((opp) => {
      const isPastOrClosed =
        opp.status === 'submission_closed' ||
        opp.status === 'opening_in_progress' ||
        opp.status === 'opened_pv_signed' ||
        opp.status === 'technical_evaluation' ||
        opp.status === 'financial_evaluation' ||
        opp.status === 'provisional_award' ||
        opp.status === 'infructuous';
      return isPastOrClosed || true;
    });

    if (!q) return target;
    return target.filter(
      (opp) =>
        opp.title.toLowerCase().includes(q) ||
        opp.authorityName.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q),
    );
  }, [opportunities, searchQuery]);

  const filteredOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const target = offers;
    if (!q) return target;
    return target.filter(
      (o) =>
        o.opportunityTitle.toLowerCase().includes(q) ||
        o.authorityName.toLowerCase().includes(q),
    );
  }, [offers, searchQuery]);

  const activeCount = activeTab === 'deals' ? filteredDeals.length : filteredOffers.length;

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <span className="op-chip gold mb-2">
            <Archive aria-hidden="true" />
            <span>{t('nav.operator.archive')} — {t('operator.archive.certified_record')}</span>
          </span>
          <h1>{t('operator.archive.title')}</h1>
          <p>{t('operator.archive.subtitle')}</p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator')}
          >
            <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
            <span>{t('operator.archive.back_workspace')}</span>
          </button>
        </div>
      </div>

      <section className="op-card" aria-labelledby="archive-workspace-title">
        <div className="op-card-head">
          <div className="op-tabs" role="tablist" aria-label={t('operator.archive.sections_aria')}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'deals'}
              onClick={() => setActiveTab('deals')}
              className={`op-tab${activeTab === 'deals' ? ' active' : ''}`}
            >
              <Briefcase aria-hidden="true" />
              <span>{t('operator.archive.tab_deals')}</span>
              <span className="archive-count">{filteredDeals.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'offers'}
              onClick={() => setActiveTab('offers')}
              className={`op-tab${activeTab === 'offers' ? ' active' : ''}`}
            >
              <Inbox aria-hidden="true" />
              <span>{t('operator.archive.tab_offers')}</span>
              <span className="archive-count">{filteredOffers.length}</span>
            </button>
          </div>

          <div className="op-search-lg w-full sm:w-80">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'deals'
                  ? t('operator.archive.search_deals_ph')
                  : t('operator.archive.search_offers_ph')
              }
              aria-label={
                activeTab === 'deals'
                  ? t('operator.archive.search_deals_aria')
                  : t('operator.archive.search_offers_aria')
              }
            />
          </div>
        </div>

        <div className="op-card-body">
          {loading ? (
            <div className="space-y-3" aria-label={t('operator.req.loading')}>
              {[1, 2, 3].map((row) => (
                <div key={row} className="op-skeleton h-24" />
              ))}
            </div>
          ) : activeCount === 0 ? (
            <div className="op-empty-chart min-h-[240px]">
              {activeTab === 'deals' ? (
                <FileText aria-hidden="true" />
              ) : (
                <Inbox aria-hidden="true" />
              )}
              <h4>
                {activeTab === 'deals'
                  ? t('operator.archive.empty_deals')
                  : t('operator.archive.empty_offers')}
              </h4>
              <p>
                {searchQuery
                  ? t('operator.archive.empty_search_hint')
                  : t('operator.archive.empty_default_hint')}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="op-btn op-btn-outline op-btn-sm mt-2"
                  onClick={() => setSearchQuery('')}
                >
                  {t('operator.archive.reset_filter')}
                </button>
              )}
            </div>
          ) : activeTab === 'deals' ? (
            <div className="flex flex-col gap-3">
              {filteredDeals.map((opp) => (
                <article
                  key={opp.id}
                  className="flex flex-col gap-4 rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-5 transition-colors hover:border-[var(--op-gold-line)] md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="op-chip green">
                        <Building aria-hidden="true" />
                        <span>{opp.authorityName}</span>
                      </span>
                      {opp.status === 'submission_closed' && (
                        <span className="op-chip gold">{t('operator.archive.closed_status')}</span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--op-muted)]">
                        <Calendar className="size-3.5" aria-hidden="true" />
                        <span>{formatDate(opp.updatedAt, lang)}</span>
                      </span>
                    </div>

                    <h3
                      className="line-clamp-1 text-sm font-bold text-[var(--op-ink)]"
                      title={opp.title}
                    >
                      {opp.title}
                    </h3>

                    <p className="line-clamp-2 text-xs leading-relaxed text-[var(--op-text)]">
                      {opp.description}
                    </p>
                  </div>

                  <div className="flex flex-none items-center gap-2">
                    <button
                      type="button"
                      className="op-btn op-btn-outline op-btn-sm"
                      onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                    >
                      <span>{t('operator.archive.view_deal')}</span>
                      <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredOffers.map((offer) => (
                <article
                  key={offer.id}
                  className="flex flex-col gap-4 rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-5 transition-colors hover:border-[var(--op-gold-line)] md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="line-clamp-1 text-sm font-bold text-[var(--op-ink)]">
                        {offer.opportunityTitle}
                      </h3>
                      {offer.status === 'submitted' ? (
                        <span className="op-chip green">
                          <CheckCircle2 aria-hidden="true" />
                          <span>{t('offers.status.submitted')}</span>
                        </span>
                      ) : (
                        <span className="op-chip gold">
                          <Clock aria-hidden="true" />
                          <span>{t('offers.status.draft')}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--op-muted)]">
                      <span className="op-chip">{offer.authorityName}</span>
                      <span>
                        <strong className="font-bold text-[var(--op-ink)]">
                          {t('offers.field.financial')}:
                        </strong>{' '}
                        <span className="op-mono font-bold text-[var(--op-ink)]">
                          {formatCurrency(Number(offer.financialOffer), lang)}
                        </span>
                      </span>
                      <span>
                        {offer.submittedAt
                          ? `${t('offers.status.submitted')}: ${formatDate(offer.submittedAt, lang)}`
                          : `${t('operator.offers.last_updated')} ${formatDate(offer.updatedAt, lang)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-none items-center gap-2">
                    <button
                      type="button"
                      className="op-btn op-btn-outline op-btn-sm"
                      onClick={() => setLocation(`/operator/offers/${offer.id}`)}
                    >
                      <span>{t('operator.archive.view_offer')}</span>
                      <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
