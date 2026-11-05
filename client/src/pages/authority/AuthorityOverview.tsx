import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { Link, useLocation } from 'wouter';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { PageHeader, KpiCard } from '@/shared/components';
import { FileText, Send, Award, Plus, Radio, BookOpen, Gavel, ChevronLeft, ChevronRight } from 'lucide-react';
import { DraftsTable, DraftSummary } from './components/DraftsTable';
import { AlertsList, AlertItem } from './components/AlertsList';

export function AuthorityOverview() {
  const { t, lang } = useI18n();
  const [, setLocation] = useLocation();
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);

  useEffect(() => {
    api.get('/procurements/deals/')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : res.data?.results || [];
        const mapped: DraftSummary[] = items.map((d: any) => ({
          id: String(d.id),
          title: d.title,
          reference: d.reference_number || undefined,
          status: d.current_stage >= 3 ? 'published' : 'draft',
          updatedAt: d.updated_at || d.created_at || new Date().toISOString(),
          estimatedBudget: d.estimated_budget ? formatCurrency(d.estimated_budget, lang) : undefined,
        }));
        setDrafts(mapped);
      })
      .catch((err) => console.error('Failed to load deals', err));
  }, []);

  const preparationDrafts = drafts.filter((d) => d.status === 'draft');
  const publishedDrafts = drafts.filter((d) => d.status === 'published');

  const alerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];
    if (preparationDrafts.length > 0) {
      list.push({
        kind: 'warn',
        text: `${preparationDrafts.length} ${t('authority.overview.alerts.drafts_waiting')}`,
        href: '/authority/deals',
      });
    }
    if (publishedDrafts.length === 0) {
      list.push({
        kind: 'info',
        text: t('authority.overview.alerts.no_published'),
        href: '/authority/deals/new',
      });
    }
    return list;
  }, [preparationDrafts.length, publishedDrafts.length, t]);

  return (
    <div className="font-sans space-y-6">
      <PageHeader
        eyebrow={t('authority.preview.eyebrow')}
        title={t('authority.preview.title')}
        description={t('authority.preview.table_sub')}
        actions={
          <Link
            href="/authority/deals/new"
            className="inline-flex items-center gap-1.5 bg-[var(--stamp-green-700)] hover:bg-[var(--stamp-green-800)] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('authority.overview.hero.cta')}</span>
          </Link>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label={t('authority.overview.aria_metrics')}>
        <Link href="/authority/deals" className="block focus:outline-none focus:ring-2 focus:ring-[var(--official-700)] rounded-xl">
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
        <Link href="/authority/deals" className="block focus:outline-none focus:ring-2 focus:ring-[var(--stamp-green-700)] rounded-xl">
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
            value={0}
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
                <Link href="/authority/deals" className="text-xs text-[var(--stamp-green-700)] hover:underline font-semibold flex items-center gap-1">
                  <span>{t('authority.overview.view_all')}</span>
                  {lang === 'ar' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </Link>
              )}
            </div>
            <DraftsTable drafts={drafts} lang={lang} t={t} onSelect={(id) => setLocation(`/authority/deals/${id}`)} />
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

          <article className="bg-white border border-[var(--color-border-subtle)] rounded-xl shadow-sm p-5 space-y-3">
            <h3 className="m-0 text-sm font-bold text-[var(--ink-900)]">
              {t('authority.preview.nav_title')}
            </h3>
            <div className="space-y-2">
              <Link
                href="/authority/opening-sessions"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--paper-50)] hover:bg-[var(--paper-100)] text-xs font-semibold text-[var(--ink-800)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[var(--stamp-green-700)]" />
                  {t('authority.preview.nav_opening_committee')}
                </span>
                {lang === 'ar' ? <ChevronLeft className="w-4 h-4 text-[var(--ink-400)]" /> : <ChevronRight className="w-4 h-4 text-[var(--ink-400)]" />}
              </Link>
              <Link
                href="/authority/deals?initialView=specs"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--paper-50)] hover:bg-[var(--paper-100)] text-xs font-semibold text-[var(--ink-800)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--official-700)]" />
                  {t('authority.preview.nav_specs_sanad')}
                </span>
                {lang === 'ar' ? <ChevronLeft className="w-4 h-4 text-[var(--ink-400)]" /> : <ChevronRight className="w-4 h-4 text-[var(--ink-400)]" />}
              </Link>
              <Link
                href="/authority/committee"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--paper-50)] hover:bg-[var(--paper-100)] text-xs font-semibold text-[var(--ink-800)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-[var(--stamp-gold-700)]" />
                  {t('authority.nav.committee')}
                </span>
                {lang === 'ar' ? <ChevronLeft className="w-4 h-4 text-[var(--ink-400)]" /> : <ChevronRight className="w-4 h-4 text-[var(--ink-400)]" />}
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default AuthorityOverview;