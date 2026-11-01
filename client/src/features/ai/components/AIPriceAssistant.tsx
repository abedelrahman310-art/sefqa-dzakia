import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bot,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Pencil,
  Sparkles,
  Layers,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PriceEstimateResponse } from '../types';

interface AIPriceAssistantProps {
  estimate: PriceEstimateResponse | null;
  isLoading: boolean;
  error: string | null;
  onUseEstimate?: (avg: number) => void;
  onDismiss?: () => void;
  onRefetch?: () => void;
}

export function AIPriceAssistant({
  estimate,
  isLoading,
  error,
  onUseEstimate,
  onDismiss,
  onRefetch,
}: AIPriceAssistantProps) {
  const { t, lang } = useI18n();
  const [showConfirm, setShowConfirm] = useState(false);

  // 1. Loading State
  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-200">
        <CardHeader className="py-3 px-5 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Bot className="size-4 animate-pulse" />
              </div>
              <span className="text-xs font-bold text-primary">
                {t('ai.price_thinking')}
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {t('ai.price_advisory')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. No Match State (404)
  if (error === 'no_match') {
    return (
      <Card className="border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertCircle className="size-4" />
            </div>
            <div className="space-y-1 text-start flex-1">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {t('ai.price_no_match_title')}
              </h4>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                {t('ai.price_no_match_hint')}
              </p>
            </div>
            {onRefetch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRefetch}
                title={t('ai.price_refresh')}
                className="h-7 w-7 p-0 text-amber-700 hover:bg-amber-100/50 rounded-lg shrink-0"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. Generic Error State
  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 text-start">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="size-4 text-destructive shrink-0" />
              <span className="text-xs font-medium text-destructive">
                {t('ai.price_error')}
              </span>
            </div>
            {onRefetch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRefetch}
                className="h-7 px-2 text-xs text-muted-foreground hover:bg-destructive/10 rounded-lg"
              >
                <RefreshCw className="size-3 me-1.5" />
                <span>{t('ai.price_refresh')}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 4. No estimate yet
  if (!estimate) {
    return null;
  }

  // Format currency helpers
  const locale = lang === 'ar' ? 'ar-DZ' : 'fr-DZ';
  const formatMoney = (val: number) => val.toLocaleString(locale);

  // Confidence styling
  const confidencePercent = Math.round(estimate.confidence * 100);
  const confidenceLevelKey = `ai.price_confidence_${estimate.confidence_level}` as const;

  return (
    <>
      <Card className="border-emerald-500/20 bg-gradient-to-b from-card to-emerald-500/5 shadow-sm rounded-2xl overflow-hidden">
        {/* Header */}
        <CardHeader className="py-3 px-5 border-b border-border/60 bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="size-4" />
              </div>
              <span className="text-xs font-bold text-navy-900">
                {t('ai.price_title')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold"
              >
                {t('ai.price_advisory')}
              </Badge>

              {onRefetch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRefetch}
                  title={t('ai.price_refresh')}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-5 space-y-4 text-start">
          {/* Reference Meta Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground me-1">{t('ai.price_based_on')}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
              <Layers className="size-3" />
              {t('ai.price_basis_58')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
              {estimate.template_type_ar || estimate.template_type}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-50 text-navy-800 font-medium">
              {estimate.category}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground font-medium">
              <MapPin className="size-3" />
              {estimate.wilaya_name?.ar || estimate.wilaya} ({estimate.wilaya})
            </span>
          </div>

          {/* Central Highlight Box */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t('ai.price_expected')}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-emerald-600 font-bold">≈</span>
                <span className="text-2xl font-black tracking-tight text-navy-900 font-mono tabular-nums">
                  {formatMoney(estimate.estimated_avg)}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {estimate.currency}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              {/* Range */}
              <div>
                <span className="text-muted-foreground block">{t('ai.price_range')}</span>
                <span className="font-mono tabular-nums font-semibold text-navy-900 block mt-0.5">
                  {formatMoney(estimate.estimated_min)} — {formatMoney(estimate.estimated_max)} {t('common.dzd')}
                </span>
              </div>

              {/* Unit Price & Quantity */}
              <div>
                <span className="text-muted-foreground block">
                  {t('ai.price_unit')} {formatMoney(estimate.unit_price)} {t('common.dzd')}/{estimate.unit}
                </span>
                <span className="font-semibold text-navy-900 block mt-0.5">
                  {t('ai.price_qty')} {estimate.quantity} {estimate.unit}
                </span>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('ai.price_confidence')}</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                    {confidencePercent}% ({t(confidenceLevelKey)})
                  </span>
                </div>
                {/* Visual confidence bar */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1.5">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      estimate.confidence_level === 'high'
                        ? 'bg-emerald-500'
                        : estimate.confidence_level === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-primary'
                    )}
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowConfirm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="size-3.5" />
                <span>{t('ai.price_use_estimate')}</span>
              </Button>

              {onDismiss && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDismiss}
                  className="text-xs rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3 me-1.5" />
                  <span>{t('ai.price_edit_manually')}</span>
                </Button>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3" />
              <span>{t('ai.price_source')} {estimate.source}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md text-start">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Sparkles className="size-5" />
              </div>
              <DialogTitle className="text-base font-bold text-navy-900">
                {t('ai.price_confirm_title')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              {t('ai.price_confirm_desc')}
            </DialogDescription>
          </DialogHeader>

          {/* Amount Box */}
          <div className="my-2 p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-1">
            <span className="text-2xl font-black text-navy-900 font-mono tabular-nums tracking-tight">
              {formatMoney(estimate.estimated_avg)} {t('common.dzd')}
            </span>
            <div className="text-[11px] text-muted-foreground">
              {estimate.category} • {estimate.quantity} {estimate.unit} ({estimate.wilaya_name?.ar || estimate.wilaya})
            </div>
          </div>

          {/* Legal Advisory Warning */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <span>{t('ai.price_confirm_disclaimer')}</span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(false)}
              className="rounded-xl text-xs"
            >
              {t('ai.price_confirm_cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onUseEstimate?.(estimate.estimated_avg);
                setShowConfirm(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              {t('ai.price_confirm_apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
