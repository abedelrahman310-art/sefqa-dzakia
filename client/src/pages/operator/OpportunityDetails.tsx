import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { ArrowLeft, ArrowRight, Lock, AlertTriangle, Building, Calendar, Banknote, FileText } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  authorityName: string;
  updatedAt: string;
  hasDocument: boolean;
}

export function OpportunityDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [existingOfferId, setExistingOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    api.get(`/procurements/deals/${id}/`)
      .then((res) => {
        const deal = res.data;
        if (deal) {
          setOpp({
            id: String(deal.id),
            title: deal.title,
            description: deal.description || '',
            estimatedBudget: deal.estimated_budget ? `${Number(deal.estimated_budget).toLocaleString('ar-DZ')} دج` : null,
            authorityName: deal.authority_entity || deal.authority_name || 'مصلحة متعاقدة',
            updatedAt: deal.updated_at || deal.created_at || new Date().toISOString(),
            hasDocument: !!deal.cahier_specs,
          });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    api.get('/bids/offers/')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data?.results || [];
        const found = items.find((o: any) => String(o.deal) === String(id));
        if (found) setExistingOfferId(found.id);
      })
      .catch(() => {});
  }, [id]);

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="op-page" aria-label={t('operator.req.loading')}>
        <div className="op-card p-8">
          <div className="op-skeleton mb-4 h-8 w-2/3" />
          <div className="op-skeleton mb-3 h-4 w-1/3" />
          <div className="op-skeleton h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !opp) {
    return (
      <div className="op-page">
        <div className="op-alert error">
          <AlertTriangle aria-hidden="true" />
          <span>الفرصة غير متوفرة أو تم سحبها.</span>
        </div>
        <div>
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/deals')}
          >
            <ArrowIcon aria-hidden="true" />
            <span>العودة للصفقات</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <span className="op-chip gold mb-2">
            <Building aria-hidden="true" />
            <span>{opp.authorityName}</span>
          </span>
          <h1>{opp.title}</h1>
          <p className="flex items-center gap-1.5">
            <Calendar className="size-3.5" aria-hidden="true" />
            <span>تاريخ التحديث: {new Date(opp.updatedAt).toLocaleDateString('ar-DZ')}</span>
          </p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/deals')}
          >
            <ArrowIcon aria-hidden="true" />
            <span>العودة لقائمة الصفقات</span>
          </button>
        </div>
      </div>

      <section className="op-card" aria-labelledby="opportunity-details-title">
        <div className="op-card-head">
          <h2 id="opportunity-details-title" className="flex items-center gap-2">
            <FileText className="size-4 text-[var(--op-gold)]" aria-hidden="true" />
            <span>تفاصيل وموضوع الصفقة</span>
          </h2>
        </div>

        <div className="op-card-body space-y-5">
          <p className="whitespace-pre-wrap rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4 text-sm leading-relaxed text-[var(--op-text)]">
            {opp.description}
          </p>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-4">
              <dt className="flex items-center gap-1.5 text-xs text-[var(--op-muted)]">
                <Building className="size-3.5" aria-hidden="true" />
                <span>المصلحة المتعاقدة</span>
              </dt>
              <dd className="mt-1 text-sm font-bold text-[var(--op-ink)]">{opp.authorityName}</dd>
            </div>

            <div className="rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-4">
              <dt className="flex items-center gap-1.5 text-xs text-[var(--op-muted)]">
                <Banknote className="size-3.5" aria-hidden="true" />
                <span>{t('opps.budget')}</span>
              </dt>
              <dd className="op-mono mt-1 text-sm font-bold text-[var(--op-ink)]">
                {opp.estimatedBudget || 'غير محدد'}
              </dd>
            </div>
          </dl>

          <div className="op-alert warning">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong className="mb-1 block text-sm font-bold">
                تنبيه تنزيل وثائق دفتر الشروط:
              </strong>
              <p>
                {t('doc.download_suspended')}. وفقاً للقواعد المعتمدة، لا يُتاح تنزيل دفتر الشروط
                للمتعاملين إلا بعد إتمام والتحقق من عملية الدفع خادمياً.
              </p>
            </div>
          </div>

          <div className="op-action-bar">
            <button
              type="button"
              disabled
              title={t('doc.download_suspended')}
              className="op-btn op-btn-outline"
            >
              <Lock aria-hidden="true" />
              <span>{t('doc.download_suspended')}</span>
            </button>

            {existingOfferId ? (
              <button
                type="button"
                className="op-btn op-btn-green"
                onClick={() => setLocation(`/operator/offers/${existingOfferId}`)}
              >
                <span>{t('opps.btn.view_offer')}</span>
              </button>
            ) : (
              <button
                type="button"
                className="op-btn op-btn-gold"
                onClick={() => setLocation(`/operator/opportunities/${id}/offer`)}
              >
                <span>{t('opps.btn.make_offer')}</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
