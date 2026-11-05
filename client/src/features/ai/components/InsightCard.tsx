import React, { useState } from 'react';
import {
  ShieldAlert,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import type { AIInsight, InsightCategory, SeverityLevel } from '../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n';

interface InsightCardProps {
  insight: AIInsight;
  onResolve: (id: string, notes: string) => void;
  isResolving?: boolean;
}

const CATEGORY_ICONS: Record<InsightCategory, { icon: React.ElementType; color: string }> = {
  fraud_suspicion: { icon: ShieldAlert, color: 'text-rose-600' },
  price_anomaly: { icon: TrendingUp, color: 'text-orange-600' },
  delay: { icon: Clock, color: 'text-amber-600' },
  compliance: { icon: CheckCircle, color: 'text-purple-600' },
  pattern: { icon: Activity, color: 'text-indigo-600' },
  recommendation: { icon: Lightbulb, color: 'text-emerald-600' },
};

const SEVERITY_STYLES: Record<SeverityLevel, { badgeClass: string; cardClass: string }> = {
  critical: {
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    cardClass: 'bg-rose-50/40 border-rose-300 hover:border-rose-400',
  },
  high: {
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
    cardClass: 'bg-orange-50/40 border-orange-300 hover:border-orange-400',
  },
  medium: {
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    cardClass: 'bg-amber-50/40 border-amber-300 hover:border-amber-400',
  },
  low: {
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-semibold',
    cardClass: 'bg-blue-50/40 border-blue-300 hover:border-blue-400',
  },
  info: {
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
    cardClass: 'bg-slate-50/40 border-slate-300 hover:border-slate-400',
  },
};

const getCategoryLabel = (cat: InsightCategory, t: (k: string, v?: any) => string): string => {
  switch (cat) {
    case 'fraud_suspicion': return t('ai.cat_fraud_collusion');
    case 'price_anomaly': return t('ai.cat_price_anomaly');
    case 'delay': return t('ai.cat_procedural_delay');
    case 'compliance': return t('ai.cat_non_compliance');
    case 'pattern': return t('ai.cat_suspicious_pattern');
    case 'recommendation': return t('ai.cat_proactive_audit');
    default: return t('ai.cat_proactive_audit');
  }
};

const getSeverityLabel = (sev: SeverityLevel, t: (k: string, v?: any) => string): string => {
  switch (sev) {
    case 'critical': return t('ai.severity.critical');
    case 'high': return t('ai.severity.high');
    case 'medium': return t('ai.severity.medium');
    case 'low': return t('ai.severity.low');
    case 'info': return t('ai.severity.info');
    default: return t('ai.severity.info');
  }
};

function formatRelativeTime(dateString: string, t: (k: string, v?: any) => string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) return t('ai.time_few_minutes');
    if (diffHours === 1) return t('ai.time_one_hour');
    if (diffHours === 2) return t('ai.time_two_hours');
    if (diffHours <= 10) return t('ai.time_hours', { count: diffHours });
    if (diffHours < 24) return t('ai.time_hours', { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return t('ai.time_one_day');
    return t('ai.time_days', { count: diffDays });
  } catch {
    return dateString;
  }
}

export function InsightCard({
  insight,
  onResolve,
  isResolving = false,
}: InsightCardProps) {
  const { t, dir } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const catMeta = CATEGORY_ICONS[insight.category] || CATEGORY_ICONS.recommendation;
  const sevMeta = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
  const CategoryIcon = catMeta.icon;
  const categoryLabel = getCategoryLabel(insight.category, t);
  const severityLabel = getSeverityLabel(insight.severity, t);

  const handleOpenResolve = () => {
    setNotes('');
    setErrorMsg('');
    setResolveDialogOpen(true);
  };

  const handleSubmitResolve = () => {
    if (notes.trim().length < 10) {
      setErrorMsg(t('ai.err_notes_min_length'));
      return;
    }
    setErrorMsg('');
    onResolve(insight.id, notes.trim());
    setResolveDialogOpen(false);
  };

  return (
    <>
      <div
        className={`rounded-2xl border p-4.5 transition-all shadow-xs ${sevMeta.cardClass}`}
      >
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Severity Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs border ${sevMeta.badgeClass}`}
            >
              {severityLabel}
            </span>

            {/* Category */}
            <span className="flex items-center gap-1.5 text-xs font-bold text-navy-900 bg-background/80 px-2.5 py-0.5 rounded-full border border-border/80">
              <CategoryIcon className={`w-3.5 h-3.5 ${catMeta.color}`} />
              <span>{categoryLabel}</span>
            </span>

            {/* Statutory Advisory Badge */}
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1"
              title={t('ai.advisory_legal_principle')}
            >
              <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
              <span>{t('ai.advisory_badge')}</span>
            </span>
          </div>

          {/* Time & Confidence */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground self-start sm:self-auto">
            <span className="text-[11px] font-medium">
              {formatRelativeTime(insight.generated_at, t)}
            </span>

            <div
              className="flex items-center gap-1.5 bg-background/90 px-2 py-0.5 rounded-md border text-[11px] font-bold text-navy-900"
              title={t('ai.confidence_metric_title')}
            >
              <span>{t('ai.price_confidence')}</span>
              <span className="text-emerald-700 font-black">
                {Math.round(insight.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-3">
          <h4 className="text-sm font-bold text-navy-900 leading-snug">
            {insight.title}
          </h4>
        </div>

        {/* Description & Recommendations (Collapsible) */}
        <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
          <p className={isExpanded ? '' : 'line-clamp-2'}>
            {insight.description}
          </p>

          {isExpanded && (
            <div className="mt-3.5 pt-3 border-t border-border/60 space-y-2.5 animate-in fade-in-50 duration-200">
              {insight.recommendation && (
                <div className="p-3 rounded-xl bg-background border border-border/80 text-xs">
                  <span className="font-bold text-navy-900 block mb-1">
                    {t('ai.proposed_action_title')}
                  </span>
                  <p className="text-navy-950">{insight.recommendation}</p>
                </div>
              )}

              {/* Related metadata tags */}
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                {insight.related_tenders?.map((tRef, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-muted text-navy-900 font-mono font-bold"
                  >
                    {t('ai.deal_ref')}: {tRef}
                  </span>
                ))}
                {insight.related_authorities?.map((auth, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-muted text-navy-800 font-medium"
                  >
                    {t('ai.authority_ref')}: {auth}
                  </span>
                ))}
                {insight.related_operators?.map((op, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-muted text-navy-800 font-medium"
                  >
                    {t('ai.operator_ref')}: {op}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-3.5 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs font-bold text-navy-800 hover:text-navy-950 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>{t('common.hide_details')}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{t('ai.show_details_recommendations')}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {insight.action_url && (
              <a
                href={insight.action_url}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-navy-900 transition-colors"
              >
                <span>{t('ai.preview_deal')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <Button
              size="sm"
              variant="outline"
              disabled={isResolving}
              onClick={handleOpenResolve}
              className="h-7 px-3 text-xs font-bold border-navy-300 hover:bg-[#006233] hover:text-white transition-colors"
            >
              <CheckSquare className="w-3 h-3 ms-1" />
              <span>{t('ai.resolve')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mandatory Human Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-navy-900">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <span>{t('ai.resolve_modal_title')}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              {t('ai.recommendation_label')}: <span className="font-bold text-navy-900">{insight.title}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Legal warning */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>{t('ai.audit_trail_mandatory')}</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                {t('ai.audit_trail_notice')}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy-900 block">
                {t('ai.human_notes_label')} <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('ai.notes_placeholder')}
                className="text-xs resize-none"
              />
              <span className="text-[10px] text-muted-foreground block text-end">
                {notes.length} / {t('ai.min_chars_suffix')}
              </span>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {errorMsg}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResolveDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isResolving || notes.trim().length < 10}
              onClick={handleSubmitResolve}
              className="bg-[#006233] text-white hover:bg-[#004d28]"
            >
              {isResolving ? t('common.saving') : t('ai.confirm_resolution')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
