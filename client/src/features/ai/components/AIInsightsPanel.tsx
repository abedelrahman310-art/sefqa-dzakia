import { useState, useMemo } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import {
  useInsights,
  useGenerateInsights,
  useResolveInsight,
} from '../hooks/useAI';
import { InsightCard } from './InsightCard';
import { AIHealthBadge } from './AIHealthBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { SeverityLevel } from '../types';
import { useI18n } from '@/i18n';

interface AIInsightsPanelProps {
  className?: string;
}

export function AIInsightsPanel({ className = '' }: AIInsightsPanelProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'all' | SeverityLevel>('all');
  const [collapseMedium, setCollapseMedium] = useState(false);
  const [collapseLow, setCollapseLow] = useState(true);

  const { data: insights = [], isLoading, refetch, isFetching } = useInsights();
  const generateMutation = useGenerateInsights();
  const resolveMutation = useResolveInsight();

  // Group insights by severity
  const groupedInsights = useMemo(() => {
    return {
      critical: insights.filter((i) => i.severity === 'critical'),
      high: insights.filter((i) => i.severity === 'high'),
      medium: insights.filter((i) => i.severity === 'medium'),
      low: insights.filter((i) => i.severity === 'low'),
      info: insights.filter((i) => i.severity === 'info'),
    };
  }, [insights]);

  const filteredInsights = useMemo(() => {
    if (activeTab === 'all') return insights;
    return insights.filter((i) => i.severity === activeTab);
  }, [insights, activeTab]);

  const handleResolve = (id: string, notes: string) => {
    resolveMutation.mutate({ id, notes });
  };

  return (
    <section
      className={`bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5 ${className}`}
      aria-label="National AI Insights Panel"
    >
      {/* 1. Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-navy-900 text-gold-400">
              <Brain className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-extrabold text-navy-900">
              {t('ai.insights_panel_title')}
            </h2>
            <AIHealthBadge compact />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/80 w-fit">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
            <span className="font-semibold">
              {t('ai.insights_advisory_note')}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <Button
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={() => refetch()}
            className="h-8 text-xs font-bold gap-1.5"
            title={t('ai.refresh_title')}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
            />
            <span>{t('ai.refresh')}</span>
          </Button>

          <Button
            size="sm"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
            className="h-8 text-xs font-bold gap-1.5 bg-navy-900 text-white hover:bg-navy-800 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>
              {generateMutation.isPending
                ? t('ai.generating')
                : t('ai.generate_new')}
            </span>
          </Button>
        </div>
      </div>

      {/* 2. Filter Tabs with Dynamic Counters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-navy-900'
          }`}
        >
          <span>{t('common.all')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/30">
            {insights.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('critical')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'critical'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>{t('ai.severity.critical')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/50">
            {groupedInsights.critical.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('high')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'high'
              ? 'bg-orange-700 text-white shadow-xs'
              : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
          }`}
        >
          <span>{t('ai.severity.high')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/50">
            {groupedInsights.high.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('medium')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'medium'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <span>{t('ai.severity.medium')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/50">
            {groupedInsights.medium.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('low')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'low'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <span>{t('ai.severity.low')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/50">
            {groupedInsights.low.length}
          </span>
        </button>
      </div>

      {/* 3. Loading Skeletons */}
      {isLoading && (
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-border/80 space-y-2.5 bg-muted/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Empty State */}
      {!isLoading && filteredInsights.length === 0 && (
        <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-navy-900">
              {t('ai.insights_empty_title')}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t('ai.insights_empty_desc')}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
            className="text-xs font-bold gap-1 mt-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            <span>{t('ai.run_new_scan')}</span>
          </Button>
        </div>
      )}

      {/* 5. Insights List */}
      {!isLoading && filteredInsights.length > 0 && (
        <div className="space-y-4">
          {activeTab !== 'all' ? (
            // Direct flat list for specific filter
            <div className="space-y-3">
              {filteredInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onResolve={handleResolve}
                  isResolving={resolveMutation.isPending}
                />
              ))}
            </div>
          ) : (
            // Grouped view by priority
            <div className="space-y-4">
              {/* Critical Group */}
              {groupedInsights.critical.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                    <span>{t('ai.critical_recommendations', { count: groupedInsights.critical.length })}</span>
                  </div>
                  <div className="space-y-2.5">
                    {groupedInsights.critical.map((insight) => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        onResolve={handleResolve}
                        isResolving={resolveMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* High Group */}
              {groupedInsights.high.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                    <span>{t('ai.high_recommendations', { count: groupedInsights.high.length })}</span>
                  </div>
                  <div className="space-y-2.5">
                    {groupedInsights.high.map((insight) => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        onResolve={handleResolve}
                        isResolving={resolveMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Medium Group (Collapsible) */}
              {groupedInsights.medium.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      <span>{t('ai.medium_recommendations', { count: groupedInsights.medium.length })}</span>
                    </div>
                    <button
                      onClick={() => setCollapseMedium(!collapseMedium)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 hover:text-navy-950"
                    >
                      <span>{collapseMedium ? t('common.show') : t('common.collapse')}</span>
                      {collapseMedium ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {!collapseMedium && (
                    <div className="space-y-2.5 animate-in fade-in-50 duration-200">
                      {groupedInsights.medium.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onResolve={handleResolve}
                          isResolving={resolveMutation.isPending}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Low & Info Group (Collapsible) */}
              {(groupedInsights.low.length > 0 || groupedInsights.info.length > 0) && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-800 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>
                        {t('ai.low_recommendations', { count: groupedInsights.low.length + groupedInsights.info.length })}
                      </span>
                    </div>
                    <button
                      onClick={() => setCollapseLow(!collapseLow)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 hover:text-navy-950"
                    >
                      <span>{collapseLow ? t('common.show') : t('common.collapse')}</span>
                      {collapseLow ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {!collapseLow && (
                    <div className="space-y-2.5 animate-in fade-in-50 duration-200">
                      {[...groupedInsights.low, ...groupedInsights.info].map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onResolve={handleResolve}
                          isResolving={resolveMutation.isPending}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
