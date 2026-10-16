import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { Link, useLocation } from 'wouter';
import { PageHeader, KpiCard } from '@/shared/components';
import { FileText, Send, Award } from 'lucide-react';
import { DraftsTable, DraftSummary } from './components/DraftsTable';
import { AlertsList, AlertItem } from './components/AlertsList';

export function AuthorityOverview() {
  const { t, lang } = useI18n();
  const [, setLocation] = useLocation();
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);

  useEffect(() => {
    fetch('/api/drafts', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDrafts(Array.isArray(d) ? d : d.drafts || []))
      .catch((err) => console.error('Failed to load drafts', err));
  }, []);

  const preparationDrafts = drafts.filter((d) => d.status === 'draft');
  const publishedDrafts = drafts.filter((d) => d.status === 'published');

  const alerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];
    if (preparationDrafts.length > 0) {
      list.push({
        kind: 'warn',
        text: `${preparationDrafts.length} ${t('authority.overview.alerts.drafts_waiting')}`,
        href: '/authority/drafts?status=draft',
      });
    }
    if (publishedDrafts.length === 0) {
      list.push({
        kind: 'info',
        text: t('authority.overview.alerts.no_published'),
        href: '/authority/drafts/new',
      });
    }
    return list;
  }, [preparationDrafts.length, publishedDrafts.length, t]);

  return (
    <div className="font-sans space-y-6">
      <PageHeader eyebrow={t('authority.preview.eyebrow')} title={t('authority.preview.title')} />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label={t('authority.overview.aria_metrics')}>
        <Link href="/authority/drafts" className="block focus:outline-none focus:ring-2 focus:ring-[var(--official-700)] rounded-xl">
          <KpiCard
            eyebrow={t('authority.preview.stat_drafts_label')}
            value={preparationDrafts.length}
            icon={FileText}
            accent="navy"
            description={
              preparationDrafts.length > 0
                ? `${preparationDrafts.length} ${t('authority.overview.stat_drafts_suffix')}`
                : t('authority.preview.stat_source_req')
            }
          />
        </Link>
        <Link href="/authority/drafts" className="block focus:outline-none focus:ring-2 focus:ring-[var(--stamp-green-700)] rounded-xl">
          <KpiCard
            eyebrow={t('authority.preview.stat_published_label')}
            value={publishedDrafts.length}
            icon={Send}
            accent="emerald"
            description={
              publishedDrafts.length > 0
                ? `${publishedDrafts.length} ${t('authority.overview.stat_published_suffix')}`
                : t('authority.preview.stat_source_req')
            }
          />
        </Link>
        <Link href="/authority/opening-sessions" className="block focus:outline-none focus:ring-2 focus:ring-[var(--stamp-gold-700)] rounded-xl">
          <KpiCard
            eyebrow={t('authority.preview.stat_eval_label')}
            value="—"
            icon={Award}
            accent="gold"
            description={t('authority.overview.stat_eval_desc')}
          />
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <article className="bg-white border border-[var(--color-border-subtle)] rounded-xl shadow-sm overflow-hidden p-5">
            <div className="pb-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
              <div>
                <h2 className="m-0 text-base font-bold text-[var(--ink-900)]">{t('authority.preview.table_title')}</h2>
                <span className="text-[var(--ink-500)] text-xs">{t('authority.preview.table_sub')}</span>
              </div>
              {drafts.length > 0 && (
                <Link href="/authority/drafts" className="text-xs text-[var(--stamp-green-700)] hover:underline font-semibold">
                  {t('authority.overview.view_all')} &larr;
                </Link>
              )}
            </div>
            <DraftsTable drafts={drafts} lang={lang} t={t} onSelect={(id) => setLocation(`/authority/drafts/${id}/edit`)} />
          </article>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <article className="bg-white border border-[var(--color-border-subtle)] rounded-xl shadow-sm overflow-hidden p-5">
            <div className="pb-3 border-b border-[var(--color-border-subtle)]">
              <h2 className="m-0 text-base font-bold text-[var(--ink-900)]">{t('authority.preview.alerts_title')}</h2>
              <span className="text-[var(--ink-500)] text-xs">
                {alerts.length > 0
                  ? `${alerts.length} ${t('authority.overview.alerts_followup_suffix')}`
                  : t('authority.overview.system_regular')}
              </span>
            </div>
            <AlertsList alerts={alerts} t={t} />
          </article>
        </div>
      </div>
    </div>
  );
}

export default AuthorityOverview;