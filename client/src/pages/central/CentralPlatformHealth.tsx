import { useEffect, useState, useCallback, useRef } from 'react';
import { useI18n } from '@/i18n';
import {
  fetchPlatformHealth,
  type PlatformHealthResponse,
  type HealthCheckStatus,
} from './centralApi';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Radio,
  Sparkles,
  Clock,
  Layers,
  ShieldAlert,
  Zap,
} from 'lucide-react';

function StatusBadge({
  status,
  size = 'md',
}: {
  status: HealthCheckStatus | 'critical' | 'healthy';
  size?: 'sm' | 'md' | 'lg';
}) {
  const { t } = useI18n();

  const configs: Record<
    string,
    { bg: string; border: string; label: string; icon: any }
  > = {
    operational: {
      bg: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-200',
      label: 'تشغيلي ومستقر',
      icon: CheckCircle2,
    },
    healthy: {
      bg: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-200',
      label: 'سليم',
      icon: CheckCircle2,
    },
    degraded: {
      bg: 'bg-amber-50 text-amber-700',
      border: 'border-amber-200',
      label: 'أداء منخفض (Degraded)',
      icon: AlertTriangle,
    },
    down: {
      bg: 'bg-rose-50 text-rose-700',
      border: 'border-rose-200',
      label: 'متوقف (Down)',
      icon: XCircle,
    },
    critical: {
      bg: 'bg-rose-50 text-rose-700',
      border: 'border-rose-200',
      label: 'حالة حرجة (Critical)',
      icon: XCircle,
    },
    not_configured: {
      bg: 'bg-slate-50 text-slate-600',
      border: 'border-slate-200',
      label: 'غير مهيأ',
      icon: Radio,
    },
    unknown: {
      bg: 'bg-gray-50 text-gray-600',
      border: 'border-gray-200',
      label: 'غير محدد',
      icon: Activity,
    },
  };

  const c = configs[status] || configs.unknown;
  const Icon = c.icon;

  const sizeClass =
    size === 'lg'
      ? 'px-3.5 py-1.5 text-sm gap-2'
      : size === 'sm'
        ? 'px-2 py-0.5 text-xs gap-1'
        : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${c.bg} ${c.border} ${sizeClass}`}
    >
      <Icon className={size === 'lg' ? 'size-4' : 'size-3.5'} />
      <span>{c.label}</span>
    </span>
  );
}

function ResourceBar({
  percent,
  thresholds = [70, 90],
}: {
  percent?: number;
  thresholds?: [number, number];
}) {
  const val = Math.min(100, Math.max(0, percent ?? 0));
  const [warn, crit] = thresholds;

  let barColor = 'bg-emerald-500';
  if (val >= crit) barColor = 'bg-rose-500';
  else if (val >= warn) barColor = 'bg-amber-500';

  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1.5">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${val}%` }}
      />
    </div>
  );
}

export function CentralPlatformHealth() {
  const { t, dir } = useI18n();
  const [data, setData] = useState<PlatformHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetchPlatformHealth();
      setData(res);
      setError(null);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Failed to load platform health', err);
      setError(err?.response?.data?.detail || 'تعذر تحميل تقرير صحة المنصة');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh interval (every 10 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 space-y-4" dir={dir}>
        <div className="size-10 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">جاري فحص جميع مكونات المنصة والخوادم...</p>
      </div>
    );
  }

  const overall = data?.overall_status ?? 'unknown';
  const checks = data?.checks;

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir={dir}>
      {/* ─── Header & Control Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              لوحة مراقبة حالة المنصة التشغيلية
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-md font-semibold border border-slate-200">
              Operations Center
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            مراقبة حية وحصرية للإدارة المركزية لمؤشرات الأداء اللحظي لخوادم التطبيق، محرك الذكاء الاصطناعي، وقواعد البيانات وحوادث التدقيق وفق القانون 23-12.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Last Refreshed Stamp */}
          {lastRefreshedAt && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Clock className="size-3.5 text-slate-400" />
              <span>آخر تحديث:</span>
              <span className="font-mono font-semibold text-slate-700">
                {lastRefreshedAt.toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <span>{autoRefresh ? 'تحديث حي مفعل (10ث)' : 'تحديث يدوي'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>تحديث الآن</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="size-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* ─── Overall Status Banner ────────────────────────────────────────────── */}
      <div
        className={`p-5 rounded-2xl border transition-all shadow-xs ${
          overall === 'operational'
            ? 'bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/30 border-emerald-200'
            : overall === 'degraded'
              ? 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/30 border-amber-200'
              : 'bg-gradient-to-r from-rose-50/80 via-white to-rose-50/30 border-rose-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-xl border ${
                overall === 'operational'
                  ? 'bg-emerald-100/70 border-emerald-200 text-emerald-700'
                  : overall === 'degraded'
                    ? 'bg-amber-100/70 border-amber-200 text-amber-700'
                    : 'bg-rose-100/70 border-rose-200 text-rose-700'
              }`}
            >
              <Activity className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  الحالة التشغيلية العامة للمنصة:
                </h2>
                <StatusBadge status={overall} size="md" />
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {overall === 'operational'
                  ? 'جميع البنى التحتية، خوادم قواعد البيانات، وبوابة الذكاء الاصطناعي تعمل بكفاءة وبأزمنة استجابة قياسية.'
                  : overall === 'degraded'
                    ? 'تعمل المنصة مع وجود انخفاض في أداء بعض الخدمات أو تفعيل محرك القواعد البديل للذكاء الاصطناعي.'
                    : 'يوجد انقطاع أو عطل حرج في قاعدة البيانات أو التخزين المؤقت يتطلب تدخل المهندسين فوراً.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-r border-slate-200 pt-3 md:pt-0 md:pr-6 text-xs text-slate-500">
            <div>
              <span className="block text-slate-400 font-medium">البيئة:</span>
              <span className="font-bold text-slate-700 uppercase tracking-wider font-mono">
                {data?.environment || 'PROD'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">الإصدار:</span>
              <span className="font-bold text-slate-700 font-mono">
                {data?.platform_version || 'Safaqat v2.0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Metric Highlights ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DB Latency */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">استجابة قاعدة البيانات</span>
            <Database className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {checks?.database?.latency_ms !== null && checks?.database?.latency_ms !== undefined
                ? checks.database.latency_ms
                : '—'}
            </span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 truncate">
            المحرك: <span className="font-semibold text-slate-700">{checks?.database?.engine || 'PostgreSQL'}</span>
          </p>
        </div>

        {/* Cache Latency */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">استجابة التخزين المؤقت</span>
            <Zap className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {checks?.cache?.latency_ms !== null && checks?.cache?.latency_ms !== undefined
                ? checks.cache.latency_ms
                : '—'}
            </span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 truncate">
            الحالة: <span className="font-semibold text-slate-700">{checks?.cache?.status || 'Active'}</span>
          </p>
        </div>

        {/* 24h Security Incidents */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">حوادث وتدقيق (24 ساعة)</span>
            <ShieldAlert className="size-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {data?.recent_incidents_24h ?? 0}
            </span>
            <span className="text-xs text-slate-500">حادثة حرجة</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 truncate">
            إجمالي العمليات: <span className="font-semibold text-slate-700">{data?.total_actions_24h ?? 0}</span>
          </p>
        </div>

        {/* Critical AI Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">تنبيهات الذكاء الاصطناعي الحرجة</span>
            <Sparkles className="size-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {data?.critical_ai_insights ?? 0}
            </span>
            <span className="text-xs text-slate-500">تنبيه حرج غير محلول</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 truncate">
            المزود: <span className="font-semibold text-slate-700 truncate">{checks?.ai_engine?.provider_key || 'Active'}</span>
          </p>
        </div>
      </div>

      {/* ─── Core Services Health Details ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Service 1: Database */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Database className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">قاعدة البيانات المركزية</h3>
                <p className="text-xs text-slate-500">سجل الصفقات الوطنية، العطاءات، والمستخدمين</p>
              </div>
            </div>
            <StatusBadge status={checks?.database?.status ?? 'unknown'} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">المحرك</span>
              <span className="font-bold text-slate-800 font-mono">{checks?.database?.engine || 'postgresql'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">زمن الاستجابة</span>
              <span className="font-bold text-slate-800 font-mono">
                {checks?.database?.latency_ms !== null && checks?.database?.latency_ms !== undefined
                  ? `${checks.database.latency_ms} ms`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {checks?.database?.error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-mono break-all">
              {checks.database.error}
            </div>
          )}
        </div>

        {/* Service 2: Redis / Cache */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                <Zap className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">الذاكرة المؤقتة (Redis Cache)</h3>
                <p className="text-xs text-slate-500">التخزين السريع للجلسات والحد من الطلبات (Throttling)</p>
              </div>
            </div>
            <StatusBadge status={checks?.cache?.status ?? 'unknown'} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">مشغل الكاش</span>
              <span className="font-bold text-slate-800 font-mono">{checks?.cache?.backend || 'Redis'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">زمن الاستجابة</span>
              <span className="font-bold text-slate-800 font-mono">
                {checks?.cache?.latency_ms !== null && checks?.cache?.latency_ms !== undefined
                  ? `${checks.cache.latency_ms} ms`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {checks?.cache?.error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-mono break-all">
              {checks.cache.error}
            </div>
          )}
        </div>

        {/* Service 3: AI Gateway */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">بوابة الذكاء الاصطناعي (AI Gateway)</h3>
                <p className="text-xs text-slate-500">التحليل القانوني، كشف الشبهات، وتقدير كلفة دفاتر الشروط</p>
              </div>
            </div>
            <StatusBadge status={checks?.ai_engine?.status ?? 'unknown'} />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">المزود النشط:</span>
              <span className="font-semibold text-slate-800">{checks?.ai_engine?.provider || 'RuleBasedFallback'}</span>
            </div>
            {checks?.ai_engine?.latency_ms !== null && checks?.ai_engine?.latency_ms !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">زمن الفحص:</span>
                <span className="font-mono font-semibold text-slate-800">{checks.ai_engine.latency_ms} ms</span>
              </div>
            )}
          </div>

          {checks?.ai_engine?.error && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-mono break-all">
              {checks.ai_engine.error}
            </div>
          )}
        </div>

        {/* Service 4: Realtime Channels & Background Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
                <Layers className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">الاتصال الفوري والمهام (Realtime & Async)</h3>
                <p className="text-xs text-slate-500">قنوات الـ WebSockets وإشعارات فتح الأظرفة المباشرة</p>
              </div>
            </div>
            <StatusBadge status={checks?.realtime_channels?.status ?? 'operational'} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">طبقة القنوات</span>
              <span className="font-bold text-slate-800 font-mono">
                {checks?.realtime_channels?.backend || 'RedisChannelLayer'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 block">مهام الخلفية</span>
              <span className="font-bold text-slate-800 text-[11px]">
                {checks?.celery?.note || 'Django Channels'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Server Hardware & System Resources (psutil) ────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="size-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">موارد خادم التطبيق (Host Hardware)</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Platform: {checks?.server?.platform || 'Linux/Windows'} | Cores: {checks?.server?.cpu_cores ?? '—'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CPU Usage */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Cpu className="size-4 text-slate-500" />
                المعالج المركزي (CPU)
              </span>
              <span className="font-mono text-base font-bold text-slate-900">
                {checks?.server?.cpu_percent ?? 0}%
              </span>
            </div>
            <ResourceBar percent={checks?.server?.cpu_percent} />
            <p className="mt-2 text-[11px] text-slate-500">
              عدد الأنوية: <span className="font-semibold">{checks?.server?.cpu_cores ?? '—'} Core</span>
            </p>
          </div>

          {/* RAM Usage */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Activity className="size-4 text-slate-500" />
                الذاكرة العشوائية (RAM)
              </span>
              <span className="font-mono text-base font-bold text-slate-900">
                {checks?.server?.ram_percent ?? 0}%
              </span>
            </div>
            <ResourceBar percent={checks?.server?.ram_percent} />
            <p className="mt-2 text-[11px] text-slate-500">
              المستخدم: <span className="font-semibold font-mono">{checks?.server?.ram_used_gb ?? 0} GB</span> /{' '}
              <span className="font-mono">{checks?.server?.ram_total_gb ?? 0} GB</span>
            </p>
          </div>

          {/* Disk Usage */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <HardDrive className="size-4 text-slate-500" />
                مساحة التخزين (Disk)
              </span>
              <span className="font-mono text-base font-bold text-slate-900">
                {checks?.server?.disk_percent ?? 0}%
              </span>
            </div>
            <ResourceBar percent={checks?.server?.disk_percent} />
            <p className="mt-2 text-[11px] text-slate-500">
              المتبقي: <span className="font-semibold font-mono">{checks?.server?.disk_free_gb ?? 0} GB</span> من{' '}
              <span className="font-mono">{checks?.server?.disk_total_gb ?? 0} GB</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default CentralPlatformHealth;
