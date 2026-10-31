import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { Link, useLocation } from 'wouter';
import { api } from '@/lib/api';
import { formatCurrency, formatDate as intlFormatDate } from '@/lib/format';
import {
  Search,
  FileText,
  Clock,
  ClipboardCheck,
  Building2,
  Calendar,
  ChevronLeft,
  Megaphone,
  BookOpen,
  Scale,
  Archive,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Coins,
} from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  authorityName: string;
  updatedAt: string;
  submissionDeadline?: string | null;
}

type OfferStatus = 'draft' | 'submitted' | 'admitted' | 'evaluated' | 'rejected' | 'awarded';

const OFFER_STATUSES: OfferStatus[] = [
  'draft',
  'submitted',
  'admitted',
  'evaluated',
  'rejected',
  'awarded',
];

interface OfferItem {
  id: string;
  title: string;
  status: OfferStatus;
  updatedAt: string;
}

interface RecommendedDeal {
  id: string;
  deal_id?: string;
  reference_number: string;
  title: string;
  authority_name: string;
  wilaya?: string;
  estimated_budget?: string | null;
  submission_deadline?: string | null;
  match_score: number;
  match_level_display?: string;
  reasons?: string[];
  warnings?: string[];
  current_stage_display?: string;
}

export function OperatorOverview() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recommendedDeals, setRecommendedDeals] = useState<RecommendedDeal[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [recommendedError, setRecommendedError] = useState(false);
  const [recommendedRefreshKey, setRecommendedRefreshKey] = useState(0);

  useEffect(() => {
    Promise.all([api.get('/procurements/deals/'), api.get('/bids/offers/')])
      .then(([dealsRes, offersRes]) => {
        const deals = Array.isArray(dealsRes.data) ? dealsRes.data : dealsRes.data?.results || [];
        const mappedDeals: Opportunity[] = deals
          .filter((d: any) => d.current_stage >= 3)
          .map((d: any) => ({
            id: String(d.id),
            title: d.title,
            description: d.description || '',
            estimatedBudget: d.estimated_budget
              ? formatCurrency(Number(d.estimated_budget), lang)
              : null,
            authorityName: d.authority_entity || d.authority_name || t('operator.opportunities.table_authority'),
            updatedAt: d.updated_at || d.created_at || new Date().toISOString(),
            submissionDeadline: d.submission_deadline || null,
          }));
        setOpportunities(mappedDeals);

        const offersList = Array.isArray(offersRes.data)
          ? offersRes.data
          : offersRes.data?.results || [];
        const mappedOffers: OfferItem[] = offersList.map((o: any) => {
          const rawStatus = String(o.status || 'draft') as OfferStatus;
          return {
            id: String(o.id),
            title: o.deal_title || o.opportunity_title || 'عرض على صفقة عمومية',
            status: OFFER_STATUSES.includes(rawStatus) ? rawStatus : 'draft',
            updatedAt: o.updated_at || o.created_at || new Date().toISOString(),
          };
        });
        setOffers(mappedOffers);
      })
      .catch((err) => {
        console.error('Overview data fetch error:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRecommendedLoading(true);
    setRecommendedError(false);

    api
      .get('/operator/recommended-deals/')
      .then((response) => {
        if (cancelled) return;
        const payload = response.data;
        const items = Array.isArray(payload) ? payload : payload?.deals || payload?.results || [];
        setRecommendedDeals(Array.isArray(items) ? items.slice(0, 3) : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Recommended deals fetch error:', err);
        setRecommendedError(true);
      })
      .finally(() => {
        if (!cancelled) setRecommendedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recommendedRefreshKey]);

  const submittedCount = offers.filter((offer) => offer.status !== 'draft').length;
  const draftsCount = offers.filter((offer) => offer.status === 'draft').length;
  const underEvaluationCount = offers.filter((offer) =>
    ['submitted', 'admitted', 'evaluated'].includes(offer.status),
  ).length;
  const awardedCount = offers.filter((offer) => offer.status === 'awarded').length;
  const rejectedCount = offers.filter((offer) => offer.status === 'rejected').length;
  const recentOpps = opportunities.slice(0, 4);
  const recentOffers = offers.slice(0, 4);

  const offerChartData = [
    { key: 'draft', label: 'مسودات', value: draftsCount, color: '#c9a227' },
    { key: 'evaluation', label: 'قيد التقييم', value: underEvaluationCount, color: '#2f80ed' },
    { key: 'awarded', label: 'فائزة', value: awardedCount, color: '#0ea968' },
    { key: 'rejected', label: 'مرفوضة', value: rejectedCount, color: '#e63946' },
  ];
  const offerChartTotal = offerChartData.reduce((sum, item) => sum + item.value, 0);
  const offerChartGradient = (() => {
    if (offerChartTotal === 0) {
      return 'conic-gradient(#e5e7eb 0% 100%)'; /* taste-skill-ignore */
    }
    let cursor = 0;
    const segments = offerChartData
      .filter((item) => item.value > 0)
      .map((item) => {
        const start = cursor;
        cursor += (item.value / offerChartTotal) * 100;
        return `${item.color} ${start}% ${cursor}%`;
      });
    return `conic-gradient(${segments.join(', ')})`; /* taste-skill-ignore */
  })();
  const offerChartSummary = `مسودات ${draftsCount}، قيد التقييم ${underEvaluationCount}، فائزة ${awardedCount}، مرفوضة ${rejectedCount}`;

  const formatDate = (value: string) => intlFormatDate(value, lang);

  const kpiValue = (value: number) => {
    if (loading) return '…';
    return value > 0 ? String(value) : '—';
  };

  return (
    <div className="op-page" dir={dir}>
      <div className="op-page-head">
        <div>
          <h1>مساحة العمل</h1>
          <p>نظرة سريعة على الصفقات المتاحة، عروضك، وجاهزية مشاركتك.</p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-gold"
            onClick={() => setLocation('/operator/deals')}
          >
            <Search aria-hidden="true" />
            <span>استكشف الصفقات</span>
          </button>
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/offers')}
          >
            <ClipboardCheck aria-hidden="true" />
            <span>إدارة العروض</span>
          </button>
        </div>
      </div>

      <section className="op-kpi-grid" aria-label="مؤشرات سريعة">
        <article className="op-kpi">
          <div className="op-kpi-icon gold">
            <Search aria-hidden="true" />
          </div>
          <div className="op-kpi-label">صفقات متاحة</div>
          <div className={`op-kpi-value${loading || opportunities.length === 0 ? ' empty' : ''}`}>
            {kpiValue(opportunities.length)}
          </div>
          <div className="op-kpi-sub">
            {loading
              ? 'جاري تحميل البيانات...'
              : opportunities.length > 0
                ? 'منشورة ومفتوحة للتقديم'
                : 'لم تُنشر صفقات بعد'}
          </div>
        </article>

        <article className="op-kpi">
          <div className="op-kpi-icon blue">
            <FileText aria-hidden="true" />
          </div>
          <div className="op-kpi-label">عروضي المقدمة</div>
          <div className={`op-kpi-value${loading || submittedCount === 0 ? ' empty' : ''}`}>
            {kpiValue(submittedCount)}
          </div>
          <div className="op-kpi-sub">
            {loading
              ? 'جاري تحميل البيانات...'
              : submittedCount > 0
                ? 'عروض مودعة رسمياً'
                : 'لم تقدّم أي عرض بعد'}
          </div>
        </article>

        <article className="op-kpi">
          <div className="op-kpi-icon green">
            <Clock aria-hidden="true" />
          </div>
          <div className="op-kpi-label">مسودات قيد الإعداد</div>
          <div className={`op-kpi-value${loading || draftsCount === 0 ? ' empty' : ''}`}>
            {kpiValue(draftsCount)}
          </div>
          <div className="op-kpi-sub">
            {loading
              ? 'جاري تحميل البيانات...'
              : draftsCount > 0
                ? 'يمكنك استكمالها في أي وقت'
                : 'لا توجد مسودات محفوظة'}
          </div>
        </article>

        <article className="op-kpi">
          <div className="op-kpi-icon rose">
            <ClipboardCheck aria-hidden="true" />
          </div>
          <div className="op-kpi-label">إجمالي مشاركاتي</div>
          <div className={`op-kpi-value${loading || offers.length === 0 ? ' empty' : ''}`}>
            {kpiValue(offers.length)}
          </div>
          <div className="op-kpi-sub">
            {loading
              ? 'جاري تحميل البيانات...'
              : offers.length > 0
                ? 'مسودات وعروض مودعة'
                : 'لا توجد مشاركات مسجلة'}
          </div>
        </article>
      </section>

      <div className="op-grid-2">
        <section className="op-card" aria-labelledby="latest-opportunities-title">
          <div className="op-card-head">
            <h3 id="latest-opportunities-title">آخر الفرص المتاحة</h3>
            <button
              type="button"
              className="op-btn op-btn-ghost op-btn-sm"
              onClick={() => setLocation('/operator/deals')}
            >
              عرض الكل
              <ChevronLeft aria-hidden="true" />
            </button>
          </div>
          <div className="op-card-body">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="op-skeleton h-14" />
                ))}
              </div>
            ) : error || recentOpps.length === 0 ? (
              <div className="op-empty-chart">
                <Search aria-hidden="true" />
                <h4>{t('overview.discovery.empty')}</h4>
                <p>ستظهر الصفقات المنشورة هنا فور توفرها</p>
                <button
                  type="button"
                  className="op-btn op-btn-ghost op-btn-sm mt-2"
                  onClick={() => setLocation('/operator/deals')}
                >
                  تصفح الصفقات
                </button>
              </div>
            ) : (
              <div className="op-list">
                {recentOpps.map((opp) => (
                  <Link key={opp.id} href={`/operator/opportunities/${opp.id}`}>
                    <a href={`/operator/opportunities/${opp.id}`} className="op-list-item">
                      <div className="op-list-main">
                        <span className="op-list-title" title={opp.title}>
                          {opp.title}
                        </span>
                        <span className="op-list-sub">
                          <Building2 aria-hidden="true" className="size-3.5" />
                          <span className="truncate">{opp.authorityName}</span>
                          {opp.submissionDeadline && (
                            <>
                              <span aria-hidden="true">·</span>
                              <Calendar aria-hidden="true" className="size-3.5" />
                              <span>آخر أجل {formatDate(opp.submissionDeadline)}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="op-list-meta">
                        <strong>{opp.estimatedBudget || '—'}</strong>
                        <span>{formatDate(opp.updatedAt)}</span>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="op-card" aria-labelledby="offers-status-title">
          <div className="op-card-head">
            <h3 id="offers-status-title">حالة عروضي</h3>
            <span className="op-card-tag">رسم بياني</span>
          </div>
          <div className="op-card-body">
            {loading ? (
              <div className="op-skeleton h-[210px]" />
            ) : offers.length === 0 ? (
              <div className="op-empty-chart">
                <FileText aria-hidden="true" />
                <h4>لا توجد بيانات لعرضها</h4>
                <p>سيظهر التوزيع بعد تقديم عروض</p>
                <button
                  type="button"
                  className="op-btn op-btn-ghost op-btn-sm mt-2"
                  onClick={() => setLocation('/operator/offers')}
                >
                  إعداد عرض
                </button>
              </div>
            ) : (
              <div className="grid items-center gap-5 sm:grid-cols-[160px_1fr]">
                <div
                  className="relative mx-auto h-40 w-40 rounded-full"
                  style={{ background: offerChartGradient }}
                  role="img"
                  aria-label={offerChartSummary}
                >
                  <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[var(--op-surface)] shadow-inner">
                    <span className="text-3xl font-extrabold leading-none text-[var(--op-ink)]">
                      {offers.length}
                    </span>
                    <span className="mt-1 text-[10px] font-bold text-[var(--op-muted)]">
                      إجمالي العروض
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {offerChartData.map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs font-bold text-[var(--op-text)]">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                            aria-hidden="true"
                          />
                          {item.label}
                        </span>
                        <span className="font-mono text-[var(--op-ink)]">{item.value}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--op-line-2)]">
                        <span
                          className="block h-full rounded-full transition-all"
                          style={{
                            width: `${offerChartTotal ? (item.value / offerChartTotal) * 100 : 0}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="pt-1 text-[11px] leading-relaxed text-[var(--op-muted)]">
                    يشمل «قيد التقييم» العروض المودعة والمقبولة إدارياً والتي تم تقييمها ولم تصدر
                    بشأنها نتيجة نهائية بعد.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="op-card" aria-labelledby="recommended-deals-title">
        <div className="op-card-head">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-[var(--op-gold)]" aria-hidden="true" />
            <h3 id="recommended-deals-title">الصفقات المقترحة لك</h3>
            <span className="op-card-tag">مطابقة حسب ملف مؤسستك</span>
          </div>
          <button
            type="button"
            className="op-btn op-btn-ghost op-btn-sm"
            onClick={() => setLocation('/operator/deals')}
          >
            عرض الكل
            <ChevronLeft aria-hidden="true" />
          </button>
        </div>
        <div className="op-card-body">
          {recommendedLoading ? (
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-xl border border-[var(--op-line-2)] p-4">
                  <div className="op-skeleton h-4 w-24" />
                  <div className="op-skeleton mt-3 h-5 w-full" />
                  <div className="op-skeleton mt-2 h-3 w-3/4" />
                  <div className="op-skeleton mt-4 h-8 w-full" />
                </div>
              ))}
            </div>
          ) : recommendedError ? (
            <div className="op-alert error" role="alert">
              <AlertTriangle aria-hidden="true" />
              <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                <span>تعذر تحميل الصفقات المقترحة حالياً. يمكنك تصفح كل الصفقات المتاحة.</span>
                <button
                  type="button"
                  className="op-btn op-btn-outline op-btn-sm"
                  onClick={() => setRecommendedRefreshKey((value) => value + 1)}
                >
                  <RefreshCw aria-hidden="true" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            </div>
          ) : recommendedDeals.length === 0 ? (
            <div className="op-empty-chart">
              <Sparkles aria-hidden="true" />
              <h4>لا توجد صفقات مقترحة حالياً</h4>
              <p>أكمل ملف مؤسستك (القطاع والولاية) لتحصل على مطابقة أدق.</p>
              <button
                type="button"
                className="op-btn op-btn-ghost op-btn-sm mt-2"
                onClick={() => setLocation('/operator/profile')}
              >
                تحديث ملف المؤسسة
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {recommendedDeals.map((deal) => {
                const matchScore = Math.max(0, Math.min(100, Number(deal.match_score) || 0));
                const reasons = Array.isArray(deal.reasons) ? deal.reasons : [];
                const warnings = Array.isArray(deal.warnings) ? deal.warnings : [];
                return (
                  <Link
                    key={deal.id}
                    href={`/operator/opportunities/${deal.id}`}
                    className="flex h-full flex-col rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--op-gold-line)] hover:shadow-[var(--op-shadow-md)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="op-chip green">{matchScore}% توافق</span>
                      <span className="text-[11px] font-bold text-[var(--op-muted)]">
                        {deal.match_level_display || 'مقترحة'}
                      </span>
                    </div>
                    <h4 className="mt-3 line-clamp-2 text-sm font-extrabold leading-snug text-[var(--op-ink)]">
                      {deal.title}
                    </h4>
                    <p className="mt-1 font-mono text-[11px] text-[var(--op-muted)]">
                      {deal.reference_number}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--op-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="size-3.5" aria-hidden="true" />
                        <span className="truncate">{deal.authority_name || 'مصلحة متعاقدة'}</span>
                      </span>
                      {deal.wilaya && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {deal.wilaya}
                        </span>
                      )}
                      {deal.estimated_budget && (
                        <span className="inline-flex items-center gap-1 font-mono font-bold">
                          <Coins className="size-3.5" aria-hidden="true" />
                          {formatCurrency(Number(deal.estimated_budget), lang)}
                        </span>
                      )}
                    </div>
                    {reasons.length > 0 && (
                      <p className="mt-3 flex items-start gap-1.5 text-[11px] font-semibold text-emerald-800">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        <span className="line-clamp-2">{reasons[0]}</span>
                      </p>
                    )}
                    {warnings.length > 0 && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-[11px] font-semibold text-amber-800">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        <span className="line-clamp-2">{warnings[0]}</span>
                      </p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-bold text-[var(--op-gold-dark)]">
                      معاينة الصفقة
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="op-grid-2">
        <section className="op-card" aria-labelledby="recent-activity-title">
          <div className="op-card-head">
            <h3 id="recent-activity-title">آخر النشاطات</h3>
          </div>
          <div className="op-card-body">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="op-skeleton h-12" />
                ))}
              </div>
            ) : recentOffers.length === 0 ? (
              <div className="op-empty-chart min-h-[190px]">
                <Clock aria-hidden="true" />
                <h4>لا يوجد نشاط بعد</h4>
                <p>ستظهر هنا آخر إجراءاتك على المنصة</p>
              </div>
            ) : (
              <div className="op-list">
                {recentOffers.map((offer) => (
                  <Link key={offer.id} href={`/operator/offers/${offer.id}`}>
                    <a href={`/operator/offers/${offer.id}`} className="op-list-item">
                      <div className="op-list-main">
                        <span className="op-list-title" title={offer.title}>
                          {offer.title}
                        </span>
                        <span className="op-list-sub">{formatDate(offer.updatedAt)}</span>
                      </div>
                      <span
                        className={`op-chip ${offer.status === 'submitted' ? 'green' : 'gold'}`}
                      >
                        {offer.status === 'submitted' ? 'مودع' : 'مسودة'}
                      </span>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="op-card" aria-labelledby="quick-links-title">
          <div className="op-card-head">
            <h3 id="quick-links-title">روابط سريعة</h3>
          </div>
          <div className="op-card-body">
            <div className="op-list">
              {[
                { href: '/operator/deals', label: 'الإعلانات وفرص الصفقات', icon: Megaphone },
                { href: '/operator/smart-specs', label: 'دفاتر الشروط', icon: BookOpen },
                { href: '/operator/offers', label: 'إدارة العروض', icon: ClipboardCheck },
                { href: '/operator/objections', label: 'الطعون والتظلمات', icon: Scale },
                { href: '/operator/profile', label: 'ملف المؤسسة', icon: Building2 },
                { href: '/operator/archive', label: 'الأرشيف', icon: Archive },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <a href={item.href} className="op-list-item">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-8 flex-none items-center justify-center rounded-lg bg-[var(--op-gold-soft)] text-[var(--op-gold-dark)]">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="op-list-title">{item.label}</span>
                      </span>
                      <ArrowUpRight
                        className="size-4 flex-none text-[var(--op-muted)]"
                        aria-hidden="true"
                      />
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default OperatorOverview;
