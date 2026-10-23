import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { Link, useLocation } from 'wouter';
import { api } from '@/lib/api';
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
  Inbox,
  ArrowUpRight,
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

interface OfferItem {
  id: string;
  title: string;
  status: 'draft' | 'submitted';
  updatedAt: string;
}

export function OperatorOverview() {
  const { t, lang } = useI18n();
  const [, setLocation] = useLocation();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/procurements/deals/'),
      api.get('/bids/offers/'),
    ])
      .then(([dealsRes, offersRes]) => {
        const deals = Array.isArray(dealsRes.data) ? dealsRes.data : dealsRes.data?.results || [];
        const mappedDeals: Opportunity[] = deals
          .filter((d: any) => d.current_stage >= 3)
          .map((d: any) => ({
            id: String(d.id),
            title: d.title,
            description: d.description || '',
            estimatedBudget: d.estimated_budget
              ? `${Number(d.estimated_budget).toLocaleString('ar-DZ')} دج`
              : null,
            authorityName: d.authority_entity || d.authority_name || 'مصلحة متعاقدة',
            updatedAt: d.updated_at || d.created_at || new Date().toISOString(),
            submissionDeadline: d.submission_deadline || null,
          }));
        setOpportunities(mappedDeals);

        const offersList = Array.isArray(offersRes.data) ? offersRes.data : offersRes.data?.results || [];
        const mappedOffers: OfferItem[] = offersList.map((o: any) => ({
          id: String(o.id),
          title: o.deal_title || 'عرض على صفقة عمومية',
          status: (o.status === 'submitted' ? 'submitted' : 'draft') as 'draft' | 'submitted',
          updatedAt: o.updated_at || o.created_at || new Date().toISOString(),
        }));
        setOffers(mappedOffers);
      })
      .catch((err) => {
        console.error('Overview data fetch error:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const submittedCount = offers.filter((offer) => offer.status === 'submitted').length;
  const draftsCount = offers.filter((offer) => offer.status === 'draft').length;
  const recentOpps = opportunities.slice(0, 4);
  const recentOffers = offers.slice(0, 4);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR');

  const kpiValue = (value: number) => {
    if (loading) return '…';
    return value > 0 ? String(value) : '—';
  };

  return (
    <div className="op-page">
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
            <span className="op-card-tag">حسب الحالة</span>
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
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--op-text)]">
                    <span>عروض مقدمة</span>
                    <span className="font-mono text-[var(--op-ink)]">{submittedCount}</span>
                  </div>
                  <div className="op-progress">
                    <span style={{ width: `${offers.length ? (submittedCount / offers.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--op-text)]">
                    <span>مسودات قيد الإعداد</span>
                    <span className="font-mono text-[var(--op-ink)]">{draftsCount}</span>
                  </div>
                  <div className="op-progress">
                    <span style={{ width: `${offers.length ? (draftsCount / offers.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--op-ink)]">
                    <Inbox className="size-4 text-[var(--op-gold)]" aria-hidden="true" />
                    <span>إجمالي المشاركات: {offers.length}</span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-[var(--op-muted)]">
                    يمكنك متابعة كل عرض وتحديث مسوداتك من قسم إدارة العروض.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

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
                      <span className={`op-chip ${offer.status === 'submitted' ? 'green' : 'gold'}`}>
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
                      <ArrowUpRight className="size-4 flex-none text-[var(--op-muted)]" aria-hidden="true" />
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
