import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Lock,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  ChevronDown,
  Clock,
  Radio,
  Gavel,
  Shield,
} from 'lucide-react';

interface ReceivedOfferItem {
  id: string;
  opportunityId: string;
  status: 'submitted' | string;
  submittedAt: string;
  hasDocument: boolean;
  operatorName?: string;
  encryptedHash?: string;
}

interface OpportunityInfo {
  id: string;
  title: string;
  reference_number?: string;
  status: string;
  current_stage?: number;
}

interface DealOption {
  id: string;
  title: string;
  reference_number?: string;
  current_stage?: number;
}

export function ReceivedOffers() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, dir, lang } = useI18n();

  const [deals, setDeals] = useState<DealOption[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string>(id || '');
  const [loadingDeals, setLoadingDeals] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [opp, setOpp] = useState<OpportunityInfo | null>(null);
  const [offers, setOffers] = useState<ReceivedOfferItem[]>([]);
  const [offersCount, setOffersCount] = useState(0);

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  // 1. Load Deals List
  useEffect(() => {
    let isMounted = true;
    setLoadingDeals(true);
    api.get('/procurements/deals/')
      .then((res) => {
        if (!isMounted) return;
        const list: DealOption[] = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setDeals(list);
        if (!selectedDealId && list.length > 0) {
          setSelectedDealId(list[0].id);
        }
      })
      .catch((err) => console.error('Failed to load deals', err))
      .finally(() => {
        if (isMounted) setLoadingDeals(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update selectedDealId if URL param id changes
  useEffect(() => {
    if (id) {
      setSelectedDealId(id);
    }
  }, [id]);

  // 2. Load Offers and Deal Details for selectedDealId
  useEffect(() => {
    if (!selectedDealId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    Promise.all([
      api.get(`/procurements/deals/${selectedDealId}/`),
      api.get('/bids/offers/', { params: { deal: selectedDealId } }),
    ])
      .then(([dealRes, offersRes]) => {
        const deal = dealRes.data;
        if (deal) {
          setOpp({
            id: deal.id,
            title: deal.title,
            reference_number: deal.reference_number,
            status: deal.stage_display || t('common.ongoing'),
            current_stage: deal.current_stage,
          });
        }
        const items = Array.isArray(offersRes.data) ? offersRes.data : offersRes.data?.results || [];
        const mapped: ReceivedOfferItem[] = items.map((o: any) => ({
          id: String(o.id),
          opportunityId: String(o.deal || selectedDealId),
          status: o.status || 'submitted',
          submittedAt: o.submission_timestamp || o.created_at || new Date().toISOString(),
          hasDocument: true,
          operatorName: o.operator_name || o.operator_company,
          encryptedHash: o.encrypted_offer_hash || `SHA256-${String(o.id).slice(0, 8)}...`,
        }));
        setOffers(mapped);
        setOffersCount(mapped.length);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.detail || err?.message || t('common.error_loading_data'));
      })
      .finally(() => setLoading(false));
  }, [selectedDealId, t]);

  const currentDeal = deals.find((d) => d.id === selectedDealId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={dir}>
      {/* Hero Header */}
      <section className="rounded-2xl p-6 md:p-8 bg-white border border-slate-200/90 text-slate-900 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1.5 h-auto rounded-lg cursor-pointer"
              onClick={() => setLocation(selectedDealId ? `/authority/deals/${selectedDealId}` : '/authority/deals')}
            >
              <ArrowIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold text-emerald-800">
              {t('authority.topbar.brand_sub')}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">
            {t('received.title')}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            {t('authority.offers.deal_label')}: <span className="font-bold text-slate-900">{opp?.title || '...'}</span>
          </p>
        </div>

        {/* Sealed Envelopes Metric Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 flex items-center gap-3.5 self-end md:self-center shadow-2xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">{t('received.total')}</div>
            <div className="text-2xl font-black text-slate-900">{offersCount}</div>
          </div>
        </div>
      </section>

      {/* Deal Selector Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Briefcase className="size-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground block font-medium">
              {lang === 'ar' ? 'سجل الأظرفة والعطاءات المستلمة للصفقة' : 'Registre des plis reçus du marché'}
            </span>
            <div className="font-bold text-sm text-foreground truncate">
              {currentDeal ? `${currentDeal.reference_number ? `[${currentDeal.reference_number}] ` : ''}${currentDeal.title}` : (opp?.title || '...')}
            </div>
          </div>
        </div>

        {deals.length > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <label htmlFor="deal-select-offers" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {lang === 'ar' ? 'تبديل الصفقة:' : 'Changer :'}
            </label>
            <div className="relative">
              <select
                id="deal-select-offers"
                value={selectedDealId}
                onChange={(e) => {
                  setSelectedDealId(e.target.value);
                  setLocation(`/authority/opportunities/${e.target.value}/received-offers`);
                }}
                className="appearance-none bg-background border border-border text-foreground text-xs font-semibold rounded-xl px-3 py-2 pe-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[240px] truncate"
              >
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.reference_number ? `[${d.reference_number}] ` : ''}{d.title.slice(0, 45)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Confidentiality & Legal Notice (Law 23-12 Articles 70-71) */}
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed font-medium space-y-1">
          <div className="font-bold text-amber-950">
            {lang === 'ar'
              ? 'تشفير سيادي مغلق ومحمي وفق المادتين 70 و71 من القانون 23-12 والمادتين 70-71 من المرسوم 15-247'
              : 'Chiffrement souverain scellé selon les articles 70 et 71 de la loi 23-12'}
          </div>
          <p>{t('received.notice')}</p>
        </div>
      </div>

      {/* Lifecycle Actions */}
      {opp && (
        <section className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-navy-900">{t('authority.offers.current_stage_title')}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {opp.status}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="text-xs rounded-xl gap-1.5"
              onClick={() => setLocation(`/authority/opportunities/${selectedDealId}/committee`)}
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>{t('authority.offers.manage_committee')}</span>
            </Button>

            <Button
              size="sm"
              className="text-xs rounded-xl gap-1.5 bg-[#006233] text-white hover:bg-[#004d28] font-bold shadow-xs cursor-pointer"
              onClick={() => setLocation('/authority/opening-sessions')}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{t('authority.offers.enter_opening_session')}</span>
            </Button>
          </div>
        </section>
      )}

      {/* Offers Envelopes List */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-base font-bold text-navy-900">{t('authority.offers.registry_title')}</h3>
          <span className="text-xs text-muted-foreground">
            {t('authority.offers.registry_count', { count: offers.length })}
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">{t('authority.offers.loading')}</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-3 bg-muted/20">
            <Lock className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h4 className="text-base font-bold text-navy-900">{t('received.empty')}</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {t('authority.offers.empty_desc')}
            </p>
            <Button
              variant="outline"
              className="text-xs rounded-xl"
              onClick={() => setLocation('/authority/deals')}
            >
              {t('authority.offers.back_to_deals')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {offers.map((offer, idx) => (
              <div
                key={offer.id}
                className="p-4 bg-background border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-navy-50 text-navy-900 font-extrabold flex items-center justify-center text-xs shrink-0 border border-navy-100">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-navy-900 text-sm">
                        #OFF-{offer.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-700" />
                        {t('received.status_sealed')}
                      </span>
                      <span className="text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Shield className="w-3 h-3 text-slate-500" />
                        AES-256
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {t('received.submitted_at')}: {new Date(offer.submittedAt).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {offer.hasDocument ? (
                    <span className="text-xs bg-navy-50 text-navy-900 border border-navy-200 font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-navy-700" />
                      {t('received.doc_attached')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-xl border border-border">
                      {t('received.no_doc')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ReceivedOffers;
