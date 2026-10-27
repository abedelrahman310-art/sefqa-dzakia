import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Lock, FileCheck, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

interface ReceivedOfferItem {
  id: string;
  opportunityId: string;
  status: 'submitted';
  submittedAt: string;
  hasDocument: boolean;
}

interface OpportunityInfo {
  id: string;
  title: string;
  status: string;
}

export function ReceivedOffers() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [opp, setOpp] = useState<OpportunityInfo | null>(null);
  const [offers, setOffers] = useState<ReceivedOfferItem[]>([]);
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    Promise.all([
      api.get(`/procurements/deals/${id}/`),
      api.get('/bids/offers/', { params: { deal: id } }),
    ])
      .then(([dealRes, offersRes]) => {
        const deal = dealRes.data;
        if (deal) {
          setOpp({
            id: deal.id,
            title: deal.title,
            status: deal.stage_display || 'مستمرة',
          });
        }
        const items = Array.isArray(offersRes.data) ? offersRes.data : offersRes.data?.results || [];
        const mapped: ReceivedOfferItem[] = items.map((o: any) => ({
          id: String(o.id),
          opportunityId: String(o.deal || id),
          status: 'submitted',
          submittedAt: o.submission_timestamp || o.created_at || new Date().toISOString(),
          hasDocument: true,
        }));
        setOffers(mapped);
        setOffersCount(mapped.length);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.detail || err?.message || 'حدث خطأ أثناء تحميل البيانات');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">جاري تحميل بيانات الأظرفة المستلمة...</span>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="p-5 bg-card border border-border rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-primary font-bold text-base">
            <Lock className="w-5 h-5" />
            <span>{t('authority.nav.offers')}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            تُعرض الأظرفة المستلمة والمشفرة لكل صفقة على حدة احتراماً لمبدأ السرية وفق أحكام القانون 23-12. لعرض العروض المستلمة الخاصة بصفقة معينة، يرجى التوجه إلى قائمة الصفقات واختيار الصفقة المطلوبة.
          </p>
          <Button
            variant="default"
            className="rounded-xl text-xs"
            onClick={() => setLocation('/authority/drafts')}
          >
            الانتقال إلى الصفقات والمسودات
          </Button>
        </div>
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'الفرصة غير متوفرة'}</span>
        </div>
        <Button
          variant="outline"
          className="rounded-xl text-xs"
          onClick={() => setLocation('/authority/drafts')}
        >
          العودة للمسودات والفرص
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1.5 h-auto rounded-lg"
              onClick={() => setLocation('/authority/drafts')}
            >
              <ArrowIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold text-navy-100 uppercase tracking-wider">
              صفقات ذكية · المصلحة المتعاقدة
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {t('received.title')}
          </h2>
          <p className="text-xs text-navy-100">
            الفرصة: <span className="font-bold text-white">{opp.title}</span>
          </p>
        </div>

        {/* Sealed Envelopes Metric Card */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-3 flex items-center gap-3.5 self-end md:self-center">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-navy-100">{t('received.total')}</div>
            <div className="text-2xl font-black text-white">{offersCount}</div>
          </div>
        </div>
      </section>

      {/* Confidentiality Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed font-medium">{t('received.notice')}</p>
      </div>

      {/* Lifecycle Actions & Progression Bar */}
      <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-navy-900">مرحلة دورة حياة الصفقة الحالية</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {opp.status === 'published' && 'الصفقة مفتوحة لاستقبال عروض المتعاملين الاقتصاديين.'}
              {opp.status === 'submission_closed' && 'تم إغلاق أجل الإيداع. الصفقة جاهزة لانعقاد جلسة فتح الأظرفة.'}
              {opp.status === 'opening_in_progress' && 'جلسة فتح الأظرفة جارية حالياً (المادتان 71 و72 من المرسوم 15-247).'}
              {['opened_pv_signed', 'technical_evaluation', 'financial_evaluation'].includes(opp.status) && 'تم اعتماد محضر الفتح وأرشفته. العروض قيد الفحص والتقييم.'}
              {opp.status === 'provisional_award' && 'تم المنح المؤقت للصفقة واعتماد محضر التقييم النهائي.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="text-xs rounded-xl gap-1.5"
              onClick={() => setLocation(`/authority/opportunities/${id}/committee`)}
            >
              إدارة أعضاء اللجنة
            </Button>

            {opp.status === 'published' && (
              <Button
                size="sm"
                variant="destructive"
                className="text-xs rounded-xl gap-1.5"
                onClick={async () => {
                  if (!window.confirm(t('lifecycle.close_confirm'))) return;
                  const res = await fetch(`/api/authority/opportunities/${id}/close-submissions`, {
                    method: 'POST',
                    headers: { 'x-safaqat-csrf': '1' },
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setOpp((prev) => prev ? { ...prev, status: data.status } : null);
                  }
                }}
              >
                <Lock className="w-3.5 h-3.5" />
                {t('lifecycle.close_submissions')}
              </Button>
            )}

            {opp.status === 'submission_closed' && (
              <Button
                size="sm"
                className="text-xs rounded-xl gap-1.5 bg-navy-900 text-white hover:bg-navy-800"
                onClick={() => setLocation('/authority/opening-sessions')}
              >
                {t('lifecycle.opening.convene_btn')}
              </Button>
            )}

            {opp.status === 'opening_in_progress' && (
              <Button
                size="sm"
                className="text-xs rounded-xl gap-1.5 bg-blue-700 hover:bg-blue-800 text-white"
                onClick={() => setLocation('/authority/opening-sessions')}
              >
                الدخول لجلسة الفتح
              </Button>
            )}

            {['opened_pv_signed', 'technical_evaluation', 'financial_evaluation', 'provisional_award'].includes(opp.status) && (
              <Button
                size="sm"
                className="text-xs rounded-xl gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => setLocation(`/authority/opportunities/${id}/evaluation`)}
              >
                فضاء تقييم العروض
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Offers Envelopes List */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-base font-bold text-navy-900">سجل استلام الأظرفة المودعة</h3>
          <span className="text-xs text-muted-foreground">
            {offers.length} ظرف مودع ومسجل خادمياً
          </span>
        </div>

        {offers.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-3 bg-muted/20">
            <Lock className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h4 className="text-base font-bold text-navy-900">{t('received.empty')}</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              لم يقم أي متعامل اقتصادي بإيداع عرضه بعد. عند استلام أي ظرف مشفر ومودع سيظهر إيصال استلامه هنا تلقائياً.
            </p>
            <Button
              variant="outline"
              className="text-xs rounded-xl"
              onClick={() => setLocation('/authority/drafts')}
            >
              العودة لقائمة الصفقات
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {offers.map((offer, idx) => (
              <div
                key={offer.id}
                className="p-4 bg-background border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-primary/30 transition-colors"
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
                      <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-700" />
                        {t('received.status_sealed')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t('received.submitted_at')}: {new Date(offer.submittedAt).toLocaleString()}
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
