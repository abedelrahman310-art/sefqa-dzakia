import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { PageHeader, KpiCard } from '@/shared/components';
import { FileText, Send, Inbox, Award } from 'lucide-react';

interface DraftSummary {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed';
  estimatedBudget: string | null;
  updatedAt: string;
}

export function AuthorityOverview() {
  const { t, lang } = useI18n();
  const [, setLocation] = useLocation();
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    async function loadDrafts() {
      try {
        const res = await fetch('/api/drafts', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('Failed to fetch drafts');
        const data = await res.json();
        setDrafts(Array.isArray(data) ? data : data.drafts || []);
      } catch (err) {
        console.error('Failed to load drafts', err);
      } finally {
        setLoading(false);
      }
    }
    loadDrafts();
  }, []);

  const preparationDrafts = drafts.filter((d) => d.status === 'draft');
  const publishedDrafts = drafts.filter((d) => d.status === 'published');

  return (
    <div className="font-sans">
      {/* 1. Head Section */}
      <PageHeader
        eyebrow={t('authority.preview.eyebrow')}
        title={t('authority.preview.title')}
        actions={
          <span className="border border-[var(--auth-line)] rounded-lg bg-[var(--auth-card)] px-3 py-2 text-[var(--auth-muted)] text-xs shadow-sm">
            {t('authority.preview.period')}
          </span>
        }
      />

      {/* 2. Metrics Section: 4 KpiCards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="مؤشرات الصفقات">
        <KpiCard
          eyebrow={t('authority.preview.stat_drafts_label')}
          value={preparationDrafts.length > 0 ? preparationDrafts.length : '0'}
          trend={12}
          trendLabel="مقارنة بالشهر السابق"
          icon={FileText}
          accent="navy"
          sparkline={[3, 5, 4, 7, 6, 8, 9]}
          description={preparationDrafts.length > 0 ? `${preparationDrafts.length} مسودات مسجلة` : t('authority.preview.stat_source_req')}
        />

        <KpiCard
          eyebrow={t('authority.preview.stat_published_label')}
          value={publishedDrafts.length > 0 ? publishedDrafts.length : '0'}
          trend={8}
          trendLabel="مقارنة بالشهر السابق"
          icon={Send}
          accent="emerald"
          sparkline={[2, 3, 5, 4, 6, 8, 10]}
          description={publishedDrafts.length > 0 ? `${publishedDrafts.length} صفقات منشورة` : t('authority.preview.stat_source_req')}
        />

        <KpiCard
          eyebrow={t('authority.preview.stat_offers_label')}
          value="18"
          trend={15}
          trendLabel="عروض مستلمة"
          icon={Inbox}
          accent="gold"
          sparkline={[5, 8, 12, 10, 14, 16, 18]}
          description="إجمالي العروض المستلمة"
        />

        <KpiCard
          eyebrow={t('authority.preview.stat_eval_label')}
          value="4"
          trend={0}
          trendLabel="جلسات تقييم جارية"
          icon={Award}
          accent="red"
          sparkline={[2, 2, 3, 3, 4, 4, 4]}
          description="لجان التقييم النشطة"
        />
      </section>

      {/* 3. Main 3-Column Grid: Main Content (2 cols) + Workflow Alerts (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* عمودان: المحتوى الرئيسي */}
        <div className="lg:col-span-2 space-y-6">
          {/* Panel 1: Chart Distribution */}
          <article className="bg-white border border-[var(--color-border-subtle)] rounded-xl shadow-sm overflow-hidden p-5">
            <div className="pb-3 border-b border-[var(--color-border-subtle)]">
              <h2 className="m-0 text-base font-bold text-[var(--ink-900)]">
                {t('authority.preview.chart_title')}
              </h2>
              <span className="text-[var(--ink-500)] text-xs">
                {t('authority.preview.chart_sub')}
              </span>
            </div>
            <div className="py-4 min-h-[220px] grid place-items-center">
              <div className="w-full max-w-[540px]">
                <div
                  className="w-full h-[140px] grid grid-cols-6 items-end gap-3 p-3.5 border-b border-[var(--color-border-subtle)]"
                  style={{
                    background: 'repeating-linear-gradient(to bottom, transparent 0 35px, #edf1f3 36px 37px)',
                  }}
                >
                  <i className="rounded-t-md opacity-40 bg-gradient-to-t from-[var(--stamp-green-700)] to-[#659bc5] transition-all" style={{ height: '28%' }} />
                  <i className="rounded-t-md opacity-40 bg-gradient-to-t from-[var(--stamp-green-700)] to-[#659bc5] transition-all" style={{ height: '52%' }} />
                  <i className="rounded-t-md opacity-40 bg-gradient-to-t from-[var(--stamp-green-700)] to-[#659bc5] transition-all" style={{ height: '38%' }} />
                  <i className="rounded-t-md opacity-40 bg-gradient-to-t from-[var(--stamp-green-700)] to-[#659bc5] transition-all" style={{ height: '66%' }} />
                  <i className="rounded-t-md opacity-40 bg-gradient-to-t from-[var(--stamp-green-700)] to-[#659bc5] transition-all" style={{ height: '45%' }} />
                  <i className="rounded-t-md opacity-40 bg-gradient-to-t from-[var(--stamp-green-700)] to-[#659bc5] transition-all" style={{ height: '35%' }} />
                </div>
                <div className="w-full grid grid-cols-6 gap-3 py-2 px-3.5 text-[var(--ink-500)] text-[11px] text-center font-medium">
                  <span>{t('authority.preview.state_draft')}</span>
                  <span>{t('authority.preview.state_published')}</span>
                  <span>{t('authority.preview.state_frozen')}</span>
                  <span>{t('authority.preview.state_opening')}</span>
                  <span>{t('authority.preview.state_eval')}</span>
                  <span>{t('authority.preview.state_ended')}</span>
                </div>
              </div>
            </div>
          </article>

          {/* Panel 2: Recent Deals Table */}
          <article className="bg-white border border-[var(--color-border-subtle)] rounded-xl shadow-sm overflow-hidden p-5">
            <div className="pb-3 border-b border-[var(--color-border-subtle)]">
              <h2 className="m-0 text-base font-bold text-[var(--ink-900)]">
                {t('authority.preview.table_title')}
              </h2>
              <span className="text-[var(--ink-500)] text-xs">
                {t('authority.preview.table_sub')}
              </span>
            </div>
            <div className="overflow-x-auto pt-2">
              <table className="w-full min-w-[650px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="text-start py-2.5 px-2 text-[var(--ink-500)] text-xs font-semibold">
                      {t('authority.preview.th_deal_num')}
                    </th>
                    <th className="text-start py-2.5 px-2 text-[var(--ink-500)] text-xs font-semibold">
                      {t('authority.preview.th_deal_topic')}
                    </th>
                    <th className="text-start py-2.5 px-2 text-[var(--ink-500)] text-xs font-semibold">
                      {t('authority.preview.th_proc_type')}
                    </th>
                    <th className="text-start py-2.5 px-2 text-[var(--ink-500)] text-xs font-semibold">
                      {t('authority.preview.th_pub_date')}
                    </th>
                    <th className="text-start py-2.5 px-2 text-[var(--ink-500)] text-xs font-semibold">
                      {t('authority.preview.th_status')}
                    </th>
                    <th className="text-start py-2.5 px-2 text-[var(--ink-500)] text-xs font-semibold">
                      {t('authority.preview.th_action')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-[var(--ink-500)] py-8 text-xs">
                        {t('authority.preview.table_empty')}
                      </td>
                    </tr>
                  ) : (
                    drafts.slice(0, 5).map((draft) => (
                      <tr key={draft.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--paper-100)] transition-colors">
                        <td className="py-2.5 px-2 font-mono text-xs text-[var(--ink-500)]">
                          {draft.id.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-2 font-medium text-[var(--ink-900)] max-w-[200px] truncate" title={draft.title}>
                          {draft.title}
                        </td>
                        <td className="py-2.5 px-2 text-xs text-[var(--ink-500)]">
                          طلب عروض مفتوح
                        </td>
                        <td className="py-2.5 px-2 text-xs text-[var(--ink-500)]">
                          {new Date(draft.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            draft.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {draft.status === 'published' ? t('authority.drafts.badge.published') : t('authority.drafts.badge.draft')}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <button
                            type="button"
                            onClick={() => setLocation(`/authority/drafts/${draft.id}/edit`)}
                            className="text-xs text-[var(--stamp-green-700)] hover:underline font-semibold"
                          >
                            {t('authority.preview.action_view')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        {/* عمود: Workflow Alerts & Status */}
        <div className="lg:col-span-1 space-y-6">
          <article className="bg-white border border-[var(--color-border-subtle)] rounded-xl shadow-sm overflow-hidden p-5">
            <div className="pb-3 border-b border-[var(--color-border-subtle)]">
              <h2 className="m-0 text-base font-bold text-[var(--ink-900)]">
                {t('authority.preview.alerts_title')}
              </h2>
              <span className="text-[var(--ink-500)] text-xs">
                {t('authority.preview.alerts_sub')}
              </span>
            </div>
            <div className="pt-2 space-y-3">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--paper-50)] border border-[var(--color-border-subtle)]">
                <i className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 bg-[var(--stamp-gold-500)]" />
                <div>
                  <strong className="block text-xs font-bold text-[var(--ink-900)]">
                    {t('authority.preview.alert1_title')}
                  </strong>
                  <span className="text-[var(--ink-500)] text-xs leading-relaxed">
                    {t('authority.preview.alert1_desc')}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--paper-50)] border border-[var(--color-border-subtle)]">
                <i className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 bg-[var(--stamp-green-500)]" />
                <div>
                  <strong className="block text-xs font-bold text-[var(--ink-900)]">
                    {t('authority.preview.alert2_title')}
                  </strong>
                  <span className="text-[var(--ink-500)] text-xs leading-relaxed">
                    {t('authority.preview.alert2_desc')}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--paper-50)] border border-[var(--color-border-subtle)]">
                <i className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 bg-[var(--stamp-red-500)]" />
                <div>
                  <strong className="block text-xs font-bold text-[var(--ink-900)]">
                    {t('authority.preview.alert3_title')}
                  </strong>
                  <span className="text-[var(--ink-500)] text-xs leading-relaxed">
                    {t('authority.preview.alert3_desc')}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}