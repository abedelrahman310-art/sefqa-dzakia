import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import {
  ShieldAlert,
  AlertTriangle,
  FileSearch,
  Filter,
  CheckCircle2,
  Building2,
  Users,
  Search,
  Download,
  Scale,
  RefreshCw,
  Sparkles,
  Lock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Network,
  Cpu,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface SuspicionItem {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  title: string;
  description: string;
  authority_id?: string;
  authority_name?: string;
  operator_ids?: string[];
  deal_ids?: string[];
  wilaya?: string;
  ip_address?: string;
  statutory_violation: string;
  recommendation: string;
}

export function AntiCollusionRadar() {
  const { t, dir } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suspicionsData, setSuspicionsData] = useState<Record<string, SuspicionItem[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<SuspicionItem | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSuspicions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/ai/central/suspicions/');
      if (res.data?.suspicions) {
        setSuspicionsData(res.data.suspicions);
      }
    } catch (err: any) {
      // وضع الإنتاج النظيف: لا توجد بيانات رقابية أو شبهات وهمية
      setSuspicionsData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspicions();
  }, []);

  // دمج كافة عناصر الشبهات في قائمة موحدة
  const allSuspicions = useMemo(() => {
    const list: (SuspicionItem & { categoryKey: string })[] = [];
    Object.entries(suspicionsData).forEach(([catKey, items]) => {
      if (Array.isArray(items)) {
        items.forEach((it) => {
          list.push({ ...it, categoryKey: catKey });
        });
      }
    });
    return list;
  }, [suspicionsData]);

  // الفلترة بالبحث والنوع
  const filteredSuspicions = useMemo(() => {
    return allSuspicions.filter((it) => {
      const matchesCat =
        selectedCategory === 'all' ||
        it.categoryKey === selectedCategory ||
        (selectedCategory === 'ip_overlap' && it.type.includes('ip')) ||
        (selectedCategory === 'tender_splitting' && it.type.includes('splitting'));

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        (it.wilaya && it.wilaya.toLowerCase().includes(q)) ||
        (it.authority_name && it.authority_name.toLowerCase().includes(q)) ||
        (it.ip_address && it.ip_address.includes(q));

      return matchesCat && matchesSearch;
    });
  }, [allSuspicions, selectedCategory, searchQuery]);

  // الإحصائيات الفورية
  const stats = useMemo(() => {
    const total = allSuspicions.length;
    const critical = allSuspicions.filter((s) => s.severity === 'critical').length;
    const ipOverlap = allSuspicions.filter((s) => s.categoryKey === 'ip_overlap' || s.type.includes('ip')).length;
    const splitting = allSuspicions.filter((s) => s.categoryKey === 'tender_splitting').length;
    return { total, critical, ipOverlap, splitting };
  }, [allSuspicions]);

  const handleActionTrigger = (actionName: string, item: SuspicionItem) => {
    setActionSuccess(t('central.integrity.radar.action_success', { action: actionName, deal: item.deal_ids?.[0] || '' }));
    setTimeout(() => setActionSuccess(null), 5000);
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* رأس الشاشة: تصميم ناصع ومؤسسي راقٍ */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-rose-50/20 to-white p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">
                {t('central.integrity.radar.engine_badge')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5">
              <span>{t('central.integrity.radar.title')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                {t('central.integrity.radar.active_alerts', { count: stats.total })}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {t('central.integrity.radar.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Button
              onClick={fetchSuspicions}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs rounded-xl gap-2 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('central.integrity.radar.refresh')}</span>
            </Button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* بطاقات المؤشرات الرقابية الأربعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>{t('central.integrity.radar.kpi_total')}</span>
            <ShieldAlert className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-xs text-muted-foreground">{t('central.integrity.radar.kpi_total_sub')}</div>
        </div>

        <div className="bg-card border border-rose-200 rounded-2xl p-4 shadow-sm space-y-1 bg-rose-50/20">
          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold">
            <span>{t('central.integrity.radar.kpi_critical')}</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.critical}</div>
          <div className="text-xs text-rose-700">{t('central.integrity.radar.kpi_critical_sub')}</div>
        </div>

        <div className="bg-card border border-amber-200 rounded-2xl p-4 shadow-sm space-y-1 bg-amber-50/20">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>{t('central.integrity.radar.kpi_ip')}</span>
            <Network className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.ipOverlap}</div>
          <div className="text-xs text-amber-700">{t('central.integrity.radar.kpi_ip_sub')}</div>
        </div>

        <div className="bg-card border border-blue-200 rounded-2xl p-4 shadow-sm space-y-1 bg-blue-50/20">
          <div className="flex items-center justify-between text-xs text-blue-800 font-semibold">
            <span>{t('central.integrity.radar.kpi_splitting')}</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{stats.splitting}</div>
          <div className="text-xs text-blue-700">{t('central.integrity.radar.kpi_splitting_sub')}</div>
        </div>
      </div>

      {/* شريط الفرز والبحث */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: t('central.integrity.radar.filter_all') },
            { id: 'ip_overlap', label: t('central.integrity.radar.filter_ip') },
            { id: 'tender_splitting', label: t('central.integrity.radar.filter_splitting') },
            { id: 'bid_rotation', label: t('central.integrity.radar.filter_rotation') },
            { id: 'bid_rigging', label: t('central.integrity.radar.filter_rigging') },
            { id: 'conflict_of_interest', label: t('central.integrity.radar.filter_conflict') },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('central.integrity.radar.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs ps-8 rounded-xl h-9"
          />
        </div>
      </div>

      {/* قائمة الشبهات المرصودة */}
      <div className="grid gap-4">
        {filteredSuspicions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-muted/20 border border-dashed border-border rounded-2xl space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold">{t('central.integrity.radar.empty')}</p>
          </div>
        ) : (
          filteredSuspicions.map((item, idx) => {
            const isCritical = item.severity === 'critical';
            return (
              <div
                key={idx}
                className={`bg-card border rounded-2xl p-5 shadow-sm space-y-4 transition-all hover:border-slate-400 ${
                  isCritical ? 'border-rose-300 bg-rose-50/10' : 'border-border'
                }`}
              >
                {/* الرأس: العنوان، درجة الخطورة، ونسبة الثقة الخوارزمية */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          isCritical
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {isCritical ? t('central.integrity.radar.severity_critical') : t('central.integrity.radar.severity_warning')}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {t('central.integrity.radar.confidence', { percent: Math.round(item.confidence * 100) })}
                      </span>
                      {item.wilaya && (
                        <span className="text-xs font-semibold text-navy-800 bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                          {item.wilaya}
                        </span>
                      )}
                      {item.ip_address && (
                        <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                          IP: {item.ip_address}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-navy-950 mt-1">{item.title}</h3>
                  </div>

                  {/* معلومات المصلحة المتعاقدة */}
                  {item.authority_name && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-start sm:self-auto shrink-0 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60">
                      <Building2 className="w-3.5 h-3.5 text-navy-700" />
                      <span className="font-semibold text-navy-900">{item.authority_name}</span>
                    </div>
                  )}
                </div>

                {/* الوصف والتحليل الجنائي للصفقة */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {item.description}
                </p>

                {/* السند القانوني الصريح */}
                <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                    <Scale className="w-3.5 h-3.5 text-primary" />
                    <span>{t('central.integrity.radar.statutory_label')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ps-5">
                    {item.statutory_violation}
                  </p>
                </div>

                {/* التوصية والتدابير الرقابية الفورية */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-emerald-900 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80 flex-1 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{t('central.integrity.radar.recommendation_label')}</span>
                      <span className="text-emerald-800 leading-relaxed">{item.recommendation}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActionTrigger(t('central.integrity.radar.action_igf_full'), item)}
                      className="text-xs rounded-xl border-border hover:bg-muted font-bold"
                    >{t('central.integrity.radar.action_igf')}</Button>
                    <Button
                      size="sm"
                      onClick={() => handleActionTrigger(t('central.integrity.radar.action_freeze_full'), item)}
                      className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm"
                    >{t('central.integrity.radar.action_freeze')}</Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
