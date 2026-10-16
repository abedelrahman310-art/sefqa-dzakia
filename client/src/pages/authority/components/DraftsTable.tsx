import React from 'react';
import { Link } from 'wouter';
import { TranslationKey } from '@/i18n';
import { EmptyState } from '@/shared/components';
import { FileText } from 'lucide-react';

export interface DraftSummary {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'closed';
  updatedAt: string;
}

export interface DraftsTableProps {
  drafts: DraftSummary[];
  lang: string;
  t: (key: TranslationKey) => string;
  onSelect: (id: string) => void;
}

export function DraftsTable({ drafts, lang, t, onSelect }: DraftsTableProps) {
  if (drafts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={t('authority.preview.table_empty')}
        description={t('authority.overview.empty_drafts_desc')}
        action={
          <Link
            href="/authority/drafts/new"
            className="inline-flex items-center gap-1.5 bg-[var(--stamp-green-700)] hover:bg-[var(--stamp-green-800)] text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
          >
            + {t('drafts.new')}
          </Link>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto pt-2">
      <table className="w-full min-w-[550px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)] text-[var(--ink-500)] text-xs font-semibold">
            <th className="text-start py-2.5 px-3">{t('authority.preview.th_deal_topic')}</th>
            <th className="text-start py-2.5 px-3">{t('authority.preview.th_proc_type')}</th>
            <th className="text-start py-2.5 px-3">{t('authority.preview.th_pub_date')}</th>
            <th className="text-start py-2.5 px-3">{t('authority.preview.th_status')}</th>
            <th className="text-start py-2.5 px-3">{t('authority.preview.th_action')}</th>
          </tr>
        </thead>
        <tbody>
          {drafts.slice(0, 3).map((d) => (
            <tr
              key={d.id}
              className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--paper-100)] transition-colors"
            >
              <td
                className="py-3 px-3 font-medium text-[var(--ink-900)] max-w-[220px] truncate"
                title={d.title}
              >
                {d.title}
              </td>
              <td className="py-3 px-3 text-xs text-[var(--ink-500)]">
                {t('authority.overview.proc_type_open')}
              </td>
              <td className="py-3 px-3 text-xs text-[var(--ink-500)]">
                {new Date(d.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')}
              </td>
              <td className="py-3 px-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    d.status === 'published'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  {d.status === 'published'
                    ? t('authority.drafts.badge.published')
                    : t('authority.drafts.badge.draft')}
                </span>
              </td>
              <td className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => onSelect(d.id)}
                  className="text-xs text-[var(--stamp-green-700)] hover:underline font-semibold"
                >
                  {t('authority.preview.action_view')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DraftsTable;
