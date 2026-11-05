import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  Radio,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Zap,
  Briefcase,
  Clock,
} from 'lucide-react';

export interface RecommendedDeal {
  id: string;
  deal_id: string;
  reference_number: string;
  title: string;
  description: string;
  authority_name: string;
  wilaya?: string | null;
  estimated_budget?: string | null;
  submission_deadline?: string | null;
  is_expired?: boolean;
  days_left?: number;
  current_stage: number;
  current_stage_display?: string;
  match_score: number;
  match_level: 'excellent' | 'good' | 'fair' | 'low';
  level_display: string;
  reasons: string[];
  warnings: string[];
}

/** فحص صارم في الواجهة لاستبعاد الصفقات المنتهية وفق أحكام المادة 68 من القانون 23-12 */
export const isDealExpired = (deal: { is_expired?: boolean; submission_deadline?: string | null }): boolean => {
  if (deal.is_expired) return true;
  if (!deal.submission_deadline) return false;
  const deadlineTime = new Date(deal.submission_deadline).getTime();
  return Number.isFinite(deadlineTime) && deadlineTime <= Date.now();
};

interface SmartOpportunityRadarProps {
  onCheckCompliance?: (dealId: string) => void;
  className?: string;
}

export function SmartOpportunityRadar({
  onCheckCompliance,
  className = '',
}: SmartOpportunityRadarProps) {
  const { t, dir, lang } = useI18n();
  const [, setLocation] = useLocation();
  const isRtl = dir === 'rtl';

  const [deals, setDeals] = useState<RecommendedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'excellent' | 'good'>('all');

  const loadRecommendedDeals = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await api.get<RecommendedDeal[]>('/operator/recommended-deals/');
      const data = response.data;
      const rawList: RecommendedDeal[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray((data as any).results)
        ? (data as any).results
        : [];
      // طبقة حماية صلبة: تصفية أي صفقات منتهية أو خارج مرحلة استلام العروض (3-5)
      const activeDeals = rawList.filter((d) => !isDealExpired(d) && (!d.current_stage || (d.current_stage >= 3 && d.current_stage <= 5)));
      setDeals(activeDeals);
    } catch (err: any) {
      // وضع الإنتاج النظيف: خلو تام من أي صفقات أو نسب تطابق وهمية
      setDeals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecommendedDeals();
  }, []);

  const filteredDeals = useMemo(() => {
    // طبقة حماية صلبة إضافية تمنع ظهور أي صفقة منتهية في الرادار
    const activeOnly = deals.filter((d) => !isDealExpired(d));
    if (filterLevel === 'all') return activeOnly;
    if (filterLevel === 'excellent') return activeOnly.filter((d) => d.match_score >= 80);
    if (filterLevel === 'good') return activeOnly.filter((d) => d.match_score >= 60);
    return activeOnly;
  }, [deals, filterLevel]);

  return (
    <div className={`space-y-4 ${className}`} dir={dir}>
      {/* ─── 1. ترويسة الرادار التنبؤي ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 text-slate-900 shadow-xs">
        {/* رادار الخلفية المتحرك */}
        <div className="pointer-events-none absolute -end-10 -top-10 size-48 rounded-full border border-sky-500/15 opacity-60 animate-ping duration-1000" />
        <div className="pointer-events-none absolute -end-24 -bottom-24 size-72 rounded-full border border-sky-500/10" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0284c7] to-sky-500 text-white shadow-sm">
              <Radio className="size-6 animate-pulse" />
              <span className="absolute -top-1 -end-1 flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-300 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-sky-400" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sky-50 border border-sky-200/90 px-2 py-0.5 text-[10px] font-extrabold text-sky-800 uppercase tracking-wider">
                  {t('operator.radar.badge_algorithm')}
                </span>
                <span className="text-xs text-slate-500 font-semibold">{t('operator.radar.status_active')}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 mt-0.5">
                {t('operator.radar.title')}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed font-medium">
                {t('operator.radar.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadRecommendedDeals(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t('operator.radar.refresh')}</span>
          </button>
        </div>

        {/* فلاتر الرادار */}
        <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3 text-xs">
          <span className="text-slate-500 font-semibold text-[11px] me-1 flex items-center gap-1">
            <Filter className="size-3" /> {t('operator.radar.match_level')}
          </span>
          <button
            type="button"
            onClick={() => setFilterLevel('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              filterLevel === 'all'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t('operator.radar.filter_all', { count: deals.length })}
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('excellent')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              filterLevel === 'excellent'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t('operator.radar.filter_excellent', { count: deals.filter((d) => d.match_score >= 80).length })}
          </button>
          <button
            type="button"
            onClick={() => setFilterLevel('good')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              filterLevel === 'good'
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t('operator.radar.filter_good', { count: deals.filter((d) => d.match_score >= 60).length })}
          </button>
        </div>
      </div>

      {/* ─── 2. شبكة كروت الصفقات المرصودة ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="size-10 animate-spin rounded-full border-3 border-sky-600 border-t-transparent mb-3" />
          <p className="text-xs font-bold text-slate-700">{t('operator.radar.loading_title')}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{t('operator.radar.loading_subtitle')}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="relative mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-sky-50 border border-sky-200/80 text-sky-700">
            <Radio className="size-8" />
            <span className="absolute -top-1 -end-1 flex size-3">
              <span className="relative inline-flex size-3 rounded-full bg-sky-500" />
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900">
            {t('operator.radar.empty_title')}
          </h4>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            {t('operator.radar.empty_desc')}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className="op-btn op-btn-outline op-btn-sm cursor-pointer"
              onClick={() => void loadRecommendedDeals(true)}
              disabled={refreshing || loading}
            >
              <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t('operator.radar.restart')}</span>
            </button>
            <button
              type="button"
              className="op-btn op-btn-gold op-btn-sm cursor-pointer"
              onClick={() => setLocation('/operator/deals')}
            >
              <Briefcase className="size-3.5" />
              <span>{t('operator.radar.browse_all')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredDeals.map((deal) => {
            const isHighMatch = deal.match_score >= 80;
            return (
              <div
                key={deal.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-md"
              >
                <div>
                  {/* رأس الكارت: شارة نسبة التطابق والرقم المرجعي */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      {deal.reference_number}
                    </span>

                    {/* شارة نسبة التطابق الراداري */}
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-black shadow-2xs ${
                        isHighMatch
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                          : 'bg-sky-50 border border-sky-300 text-sky-800'
                      }`}
                    >
                      <Sparkles className="size-3 text-emerald-600" />
                      <span>{t('operator.radar.match_badge', { score: deal.match_score })}</span>
                    </div>
                  </div>

                  {/* عنوان الصفقة */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                    {deal.title}
                  </h3>

                  {/* تفاصيل المصلحة والولاية والميزانية */}
                  <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{deal.authority_name}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="size-3 text-slate-400 shrink-0" />
                        <span>{deal.wilaya || t('operator.radar.default_wilaya')}</span>
                      </div>
                      {deal.estimated_budget && (
                        <span className="font-bold text-slate-700">
                          {formatCurrency(Number(deal.estimated_budget))}
                        </span>
                      )}
                    </div>

                    {deal.submission_deadline && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                        <Calendar className="size-3 shrink-0" />
                        <span>{t('operator.radar.deadline', { date: formatDate(deal.submission_deadline) })}</span>
                      </div>
                    )}
                  </div>

                  {/* أسباب التطابق الراداري */}
                  {deal.reasons && deal.reasons.length > 0 && (
                    <div className="mt-3 rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 space-y-1">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">
                        {t('operator.radar.reasons_title')}
                      </span>
                      {deal.reasons.slice(0, 2).map((reason, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-emerald-900 font-medium">
                          <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* أزرار الإجراء السريع */}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  {/* فحص درع الامتثال المسبق */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onCheckCompliance) onCheckCompliance(deal.id);
                      else setLocation(`/operator/offers/new?dealId=${deal.id}`);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck className="size-3.5 text-emerald-700" />
                    <span>{t('operator.radar.check_shield')}</span>
                  </button>

                  {/* إعداد العرض فوراً */}
                  <button
                    type="button"
                    onClick={() => setLocation(`/operator/opportunities/${deal.deal_id || deal.id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#006233] to-[#0f3154] px-3 py-2 text-xs font-bold text-white shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>{t('operator.radar.submit_offer')}</span>
                    {isRtl ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SmartOpportunityRadar;
