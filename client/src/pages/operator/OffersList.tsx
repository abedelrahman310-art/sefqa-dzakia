import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface OfferItem {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  authorityName: string;
  technicalProposal: string;
  financialOffer: string;
  deliveryTimeDays: string | null;
  hasDocument: boolean;
  status: 'draft' | 'submitted';
  submittedAt: string | null;
  updatedAt: string;
}

export function OffersList() {
  const { t, dir } = useI18n();
  const [, setLocation] = useLocation();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/offers')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch offers');
        return res.json();
      })
      .then((data) => {
        if (data.offers) setOffers(data.offers);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-2xl p-6 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-navy-100 uppercase tracking-wider">
            {t('topbar.brand_sub')}
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            {t('offers.title')}
          </h2>
          <p className="text-xs text-navy-100">
            متابعة العروض المودعة والمسودات قيد التحضير.
          </p>
        </div>
        <Button
          className="bg-gold-500 hover:bg-gold-700 text-navy-900 font-bold text-xs px-4 py-2 rounded-xl self-start sm:self-center transition-colors flex items-center gap-2"
          onClick={() => setLocation('/operator/deals')}
        >
          <span>{t('nav.operator.deals')}</span>
          <ArrowIcon className="w-4 h-4" />
        </Button>
      </section>

      {/* Main Panel */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-border">
          <h3 className="text-lg font-bold text-navy-900">{t('offers.title')}</h3>
          <p className="text-xs text-muted-foreground">قائمة العروض والملفات المرتبطة بها في المنصة.</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            ...
          </div>
        ) : offers.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center bg-muted/20 space-y-3">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-bold text-navy-900">{t('offers.empty')}</p>
            <Button
              variant="outline"
              className="text-xs font-bold"
              onClick={() => setLocation('/operator/deals')}
            >
              {t('opps.title')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {offers.map((offer) => (
              <article
                key={offer.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-navy-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-navy-900">{offer.opportunityTitle}</h4>
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
                      <strong className="text-foreground font-semibold">{t('offers.field.financial')}:</strong>{' '}
                      <span className="font-mono text-navy-900">{offer.financialOffer} د.ج</span>
                    </span>
                    {offer.deliveryTimeDays && (
                      <span>
                        ({offer.deliveryTimeDays} {t('offers.field.delivery')})
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {offer.status === 'submitted' && offer.submittedAt
                      ? `${t('offers.status.submitted')}: ${new Date(offer.submittedAt).toLocaleDateString()}`
                      : `آخر تعديل: ${new Date(offer.updatedAt).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    className={`text-xs font-bold px-4 py-2 rounded-xl ${
                      offer.status === 'draft'
                        ? 'bg-navy-900 hover:bg-navy-700 text-white'
                        : 'border border-border bg-card hover:bg-muted text-foreground'
                    }`}
                    onClick={() => setLocation(`/operator/offers/${offer.id}`)}
                  >
                    {offer.status === 'draft' ? t('offers.edit') : t('offers.view')}
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
