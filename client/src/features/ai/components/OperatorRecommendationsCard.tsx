import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { useOperatorRecommendations } from '../hooks/useAI';
import type { TenderRecommendation } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface OperatorRecommendationsCardProps {
  onSelectTender?: (tenderId: string) => void;
  onViewAll?: () => void;
  className?: string;
}

export function OperatorRecommendationsCard({
  onSelectTender,
  onViewAll,
  className = '',
}: OperatorRecommendationsCardProps) {
  const { t, dir } = useI18n();
  const [, setLocation] = useLocation();
  const isRtl = dir === 'rtl';

  const { data, isLoading, isError, refetch, isFetching } = useOperatorRecommendations(6);

  const recommendations = data?.recommendations || [];
  // Show top 3 recommendations
  const topRecommendations = recommendations.slice(0, 3);

  const handleViewDetails = (tenderId: string) => {
    if (onSelectTender) {
      onSelectTender(tenderId);
    } else {
      setLocation(`/operator/opportunities/${tenderId}`);
    }
  };

  const getMatchBadgeStyle = (level: TenderRecommendation['match_level']) => {
    switch (level) {
      case 'excellent':
        return {
          container:
            'bg-emerald-50/90 border-emerald-500 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-600 dark:text-emerald-200',
          badge:
            'bg-emerald-600 text-white hover:bg-emerald-700',
          label: t('ai.rec_score_excellent'),
        };
      case 'good':
        return {
          container:
            'bg-blue-50/90 border-blue-500 text-blue-950 dark:bg-blue-950/20 dark:border-blue-600 dark:text-blue-200',
          badge:
            'bg-blue-600 text-white hover:bg-blue-700',
          label: t('ai.rec_score_good'),
        };
      case 'fair':
        return {
          container:
            'bg-amber-50/90 border-amber-500 text-amber-950 dark:bg-amber-950/20 dark:border-amber-600 dark:text-amber-200',
          badge:
            'bg-amber-600 text-white hover:bg-amber-700',
          label: t('ai.rec_score_fair'),
        };
      case 'low':
      default:
        return {
          container:
            'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-900/40 dark:border-slate-700 dark:text-slate-200',
          badge:
            'bg-slate-500 text-white hover:bg-slate-600',
          label: t('ai.rec_score_low'),
        };
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <Card className={`border-border bg-card shadow-sm ${className}`}>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-5 w-44 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <Skeleton className="h-4 w-72 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border/60 rounded-xl p-4 space-y-3 bg-muted/20">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <Skeleton className="h-5 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <div className="space-y-1.5 pt-2">
                  <Skeleton className="h-3 w-32 rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
                <Skeleton className="h-8 w-full rounded-xl pt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <Card className={`border-destructive/30 bg-destructive/5 shadow-sm ${className}`}>
        <CardContent className="p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{t('ai.rec_error')}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-8 gap-1.5 hover:bg-destructive/10 text-destructive font-bold"
          >
            <RefreshCw className="size-3" />
            <span>إعادة المحاولة</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 3. Empty State
  if (recommendations.length === 0) {
    return (
      <Card className={`border-border bg-card shadow-sm ${className}`}>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base font-bold text-navy-900">
                {t('ai.rec_title')}
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-bold">
                🤖 AI
              </Badge>
            </div>
            <Badge
              variant="outline"
              className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 text-[11px] font-bold"
            >
              ⚠️ {t('ai.rec_advisory')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6 text-center space-y-3">
          <FileText className="size-8 text-muted-foreground mx-auto stroke-1" />
          <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
            {t('ai.rec_empty')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/operator/profile')}
            className="text-xs rounded-xl font-bold"
          >
            تحديث ملف المؤسسة
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 4. Success State with Recommendations
  return (
    <Card className={`border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.02] shadow-sm relative overflow-hidden ${className}`}>
      {/* Decorative subtle ambient indicator */}
      <div className="absolute top-0 end-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Title & AI Indicator */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-extrabold text-navy-900">
                  {t('ai.rec_title')}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-bold py-0 h-4">
                  🤖 AI
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t('ai.rec_based_on')}
              </p>
            </div>
          </div>

          {/* Action / Badges */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-navy-900"
              onClick={() => refetch()}
              disabled={isFetching}
              title="تحديث التوصيات"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Badge
              variant="outline"
              className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 text-[11px] font-bold px-2 py-0.5"
            >
              ⚠️ {t('ai.rec_advisory')}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Profile Criteria Summary Bar */}
        <div className="bg-muted/40 border border-border/60 rounded-xl px-4 py-2.5 text-xs flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <span className="font-extrabold text-navy-900">{t('ai.rec_based_on')}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">• {t('ai.rec_sector')}:</span>
            <span className="font-bold text-navy-900">الأشغال العمومية والبناء</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">• {t('ai.rec_wilayas')}:</span>
            <span className="font-bold text-navy-900">الجزائر، البليدة، بومرداس</span>
          </div>
        </div>

        {/* Top 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {topRecommendations.map((rec) => {
            const style = getMatchBadgeStyle(rec.match_level);

            return (
              <div
                key={rec.tender_id}
                className={`border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${style.container}`}
              >
                {/* Header: Score & Level */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={`text-xs font-bold px-2 py-0.5 shadow-none ${style.badge}`}>
                      ⭐ <span className="font-mono tabular-nums ms-1">{rec.match_score}%</span>
                    </Badge>
                    <span className="text-[11px] font-bold opacity-80">
                      {style.label}
                    </span>
                  </div>

                  {/* Tender Title & Reference */}
                  <div className="space-y-1">
                    <h4
                      className="text-xs md:text-sm font-extrabold text-navy-900 line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleViewDetails(rec.tender_id)}
                      title={rec.title}
                    >
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-mono font-medium">
                      {rec.reference}
                    </p>
                  </div>

                  {/* Reasons list */}
                  {rec.reasons && rec.reasons.length > 0 && (
                    <div className="pt-1.5 space-y-1 border-t border-border/40">
                      {rec.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                          <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings list (if any) */}
                  {rec.warnings && rec.warnings.length > 0 && (
                    <div className="pt-1 space-y-1">
                      {rec.warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                          <AlertTriangle className="size-3 text-amber-600 shrink-0" />
                          <span className="truncate">{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 mt-3 border-t border-border/40">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-bold h-8 rounded-lg bg-card/80 hover:bg-card border-border/70 hover:border-primary/50 text-navy-900 justify-between group"
                    onClick={() => handleViewDetails(rec.tender_id)}
                  >
                    <span>{t('ai.rec_view_details')}</span>
                    <ArrowLeft className={`size-3 transition-transform ${isRtl ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1'}`} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View all footer link */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <TrendingUp className="size-3.5 text-primary" />
            <span>يتم تحديث التوصيات دورياً بناءً على الصفقات المفتوحة حديثاً في القطاع</span>
          </div>
          {onViewAll && (
            <Button
              variant="link"
              size="sm"
              onClick={onViewAll}
              className="text-xs font-bold text-primary p-0 h-auto hover:underline"
            >
              <span>{t('ai.rec_view_all')}</span>
              <ArrowLeft className={`size-3 ms-1 ${isRtl ? '' : 'rotate-180'}`} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
