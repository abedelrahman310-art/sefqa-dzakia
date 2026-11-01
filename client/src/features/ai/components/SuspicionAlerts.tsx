import { useState } from 'react';
import type { ElementType } from 'react';
import {
  ShieldAlert,
  Target,
  BadgePercent,
  Ghost,
  Scale,
  AlertTriangle,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
import { useSuspicions } from '../hooks/useAI';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { SuspicionItem } from '../types';
import { useI18n } from '@/i18n';

interface SuspicionAlertsProps {
  className?: string;
}

const TYPE_CONFIG: Record<
  string,
  { icon: ElementType; colorClass: string; badgeClass: string }
> = {
  bid_rigging: {
    icon: Target,
    colorClass: 'text-rose-600',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  price_manipulation: {
    icon: BadgePercent,
    colorClass: 'text-orange-600',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  phantom_competition: {
    icon: Ghost,
    colorClass: 'text-purple-600',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  conflict_of_interest: {
    icon: Scale,
    colorClass: 'text-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
};

const getTypeLabel = (type: string, t: (k: string, v?: any) => string): string => {
  switch (type) {
    case 'bid_rigging': return t('ai.suspicion_bid_rigging');
    case 'price_manipulation': return t('ai.suspicion_price_manipulation');
    case 'phantom_competition': return t('ai.suspicion_fictitious_bids');
    case 'conflict_of_interest': return t('ai.suspicion_conflict_interest');
    default: return t('ai.observed_suspicions');
  }
};

export function SuspicionAlerts({ className = '' }: SuspicionAlertsProps) {
  const { t, dir } = useI18n();
  const { data, isLoading } = useSuspicions();
  const [selectedTypeForDialog, setSelectedTypeForDialog] = useState<string | null>(null);

  const rawSuspicions = data?.suspicions || {
    bid_rigging: [],
    price_manipulation: [],
    phantom_competition: [],
    conflict_of_interest: [],
  };

  // Filter out types with 0 suspicions
  const activeTypes = Object.entries(rawSuspicions).filter(
    ([, items]) => Array.isArray(items) && items.length > 0
  );

  const totalCount = data?.total_suspicions ?? activeTypes.reduce((acc, [, items]) => acc + items.length, 0);

  return (
    <section
      className={`bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 ${className}`}
      aria-label="Suspicions Monitoring Panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-navy-900">
              {t('ai.suspicions_detected_title')}
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t('ai.suspicions_detected_desc')}
          </p>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
          {totalCount} {t('ai.active_indicators')}
        </span>
      </div>

      {/* Statutory warning */}
      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-1.5 font-medium">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>
          {t('ai.suspicions_disclaimer')}
        </span>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl border border-border/80 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && activeTypes.length === 0 && (
        <div className="py-8 text-center rounded-xl border border-dashed border-border bg-muted/20 space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-navy-900">
            {t('ai.no_suspicions_title')}
          </h4>
          <p className="text-[11px] text-muted-foreground">
            {t('ai.no_suspicions_desc')}
          </p>
        </div>
      )}

      {/* Active Non-empty Suspicions Types */}
      {!isLoading && activeTypes.length > 0 && (
        <div className="space-y-3 pt-1">
          {activeTypes.map(([typeKey, items]) => {
            const config = TYPE_CONFIG[typeKey] || {
              label: typeKey,
              icon: ShieldAlert,
              colorClass: 'text-navy-700',
              badgeClass: 'bg-muted text-navy-900 border-border',
            };
            const Icon = config.icon;
            const firstItem: SuspicionItem = items[0];

            return (
              <div
                key={typeKey}
                className="p-3.5 rounded-xl border border-border/80 bg-background hover:border-navy-400/50 transition-all space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.colorClass}`} />
                    <span className="text-xs font-extrabold text-navy-900">
                      {getTypeLabel(typeKey, t)}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                  >
                    {items.length} {items.length === 1 ? t('ai.single_case') : t('ai.multiple_cases')}
                  </span>
                </div>

                {/* First item preview */}
                {firstItem && (
                  <div className="text-xs text-muted-foreground leading-relaxed pt-1 ps-6 border-s-2 border-border/60 ms-2">
                    <p className="font-semibold text-navy-900">
                      {firstItem.title}
                    </p>
                    <p className="text-[11px] line-clamp-2 mt-0.5">
                      {firstItem.description}
                    </p>
                  </div>
                )}

                {/* View all button */}
                <div className="pt-1 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedTypeForDialog(typeKey)}
                    className="h-6 text-[11px] font-bold text-navy-800 hover:text-navy-950 p-1"
                  >
                    <span>{t('ai.view_details_count', { count: items.length })}</span>
                    <ChevronLeft className="w-3 h-3 ms-0.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Modal List for a Category */}
      <Dialog
        open={Boolean(selectedTypeForDialog)}
        onOpenChange={(open) => !open && setSelectedTypeForDialog(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-navy-900">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>
                {selectedTypeForDialog ? getTypeLabel(selectedTypeForDialog, t) : t('ai.observed_suspicions')}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              {data?.statutory_reference || t('ai.statutory_reference_default')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {selectedTypeForDialog &&
              rawSuspicions[selectedTypeForDialog]?.map((item: SuspicionItem, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-900">{item.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                      {t('ai.severity_label')}: {item.severity}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    {item.description}
                  </p>

                  {item.recommendation && (
                    <div className="p-2 rounded-lg bg-muted/40 text-[11px] text-navy-950">
                      <span className="font-bold">{t('ai.recommendation_prefix')}:</span> {item.recommendation}
                    </div>
                  )}

                  {item.statutory_violation && (
                    <p className="text-[10px] text-amber-800 font-semibold">
                      {t('ai.potential_violation')}: {item.statutory_violation}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
