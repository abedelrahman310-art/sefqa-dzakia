import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { formatCurrency } from '@/lib/format';
import { AlertTriangle, FileText } from 'lucide-react';

export function CentralOverview() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // baseURL هو '/api' لذا نستدعي المسار النسبي '/central/dashboard/'
    api.get('/central/dashboard/')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.detail || t('central.dashboard.error'));
        setLoading(false);
      });
  }, [t]);

  if (loading) return (
    <div className="p-8 text-center text-sm font-medium text-slate-500">
      {t('central.dashboard.loading')}
    </div>
  );

  if (error || !data) return (
    <div className="p-8 text-center text-sm font-semibold text-rose-600">
      {error || t('central.dashboard.error')}
    </div>
  );

  const recentDeals: any[] = data.recent_deals || [];
  const topAlarms: any[] = data.top_alarms || [];

  return (
    <div className="space-y-4" dir={dir}>
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t('central.dashboard.title')}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          {t('central.dashboard.subtitle')}
        </p>
      </div>

      {/* بطاقات المؤشرات الأساسية */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-sky-300 transition-colors">
          <h3 className="text-xs font-semibold text-slate-600 truncate">{t('central.dashboard.kpi_active_deals')}</h3>
          <p className="text-2xl font-bold text-sky-600 mt-1 tabular-nums">{data.active_deals_count ?? 0}</p>
          <span className="text-xs text-slate-500 mt-0.5 block truncate">
            {t('central.dashboard.out_of', {
              total: data.total_deals ?? 0,
              label: t('central.dashboard.kpi_active_deals_sub'),
            })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-amber-300 transition-colors">
          <h3 className="text-xs font-semibold text-slate-600 truncate">{t('central.dashboard.kpi_pending_visa')}</h3>
          <p className="text-2xl font-bold text-amber-500 mt-1 tabular-nums">{data.pending_visa_count ?? 0}</p>
          <span className="text-xs text-slate-500 mt-0.5 block truncate">{t('central.dashboard.kpi_pending_visa_sub')}</span>
        </div>

        <div onClick={() => setLocation('/central/integrity')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-rose-400 transition-all cursor-pointer group">
          <h3 className="text-xs font-semibold text-slate-600 truncate">{t('central.dashboard.kpi_ai_alarms')}</h3>
          <p className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">{data.total_ai_alarms ?? 0}</p>
          <span className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1 group-hover:underline">
            فتح رادار النزاهة والرقابة ←
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-300 transition-colors">
          <h3 className="text-xs font-semibold text-slate-600 truncate">{t('central.dashboard.kpi_authorities')}</h3>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{data.active_authorities_count ?? 0}</p>
          <span className="text-xs text-slate-500 mt-0.5 block truncate">
            {t('central.dashboard.out_of', {
              total: data.total_authorities_count ?? 0,
              label: t('central.dashboard.kpi_authorities_sub'),
            })}
          </span>
        </div>
      </div>


      {/* بانر رادار النزاهة والتنبؤ بتعثر المشاريع */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-4 text-white border border-navy-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>رادار النزاهة والتنبؤ بتعثر المشاريع (AI Sovereign Integrity)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                تحديث فوري
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              رصد مؤشرات التواطؤ، تدوير العطاءات، تجزئة الصفقات، وتحليل مخاطر توقف الورشات في 69 ولاية.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setLocation('/central/integrity')}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow transition-colors shrink-0 whitespace-nowrap self-stretch md:self-auto text-center"
        >
          الانتقال لرادار الرقابة والنزاهة
        </button>
      </div>

      {/* الإنذارات العاجلة وأحدث الصفقات */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* أحدث الصفقات */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-slate-800 mb-2">{t('central.dashboard.recent_deals')}</h3>

          {recentDeals.length === 0 ? (
            <p className="flex items-center gap-2 py-4 text-xs text-slate-500">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              {t('central.dashboard.no_deals')}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDeals.map((deal: any) => (
                <div key={deal.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-800" title={deal.title}>
                      {deal.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-slate-500">
                      {deal.authority_name}
                      {deal.wilaya ? ` · ${deal.wilaya}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <span className="block text-xs font-bold tabular-nums text-slate-700 whitespace-nowrap">
                      {typeof deal.estimated_budget === 'number'
                        ? formatCurrency(deal.estimated_budget, lang)
                        : '—'}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-sky-600 whitespace-nowrap">
                      {deal.stage_display}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* أهم إنذارات الشبهات */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-slate-800 mb-2">{t('central.dashboard.top_alarms')}</h3>

          {topAlarms.length === 0 ? (
            <p className="flex items-center gap-2 py-4 text-xs text-slate-500">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
              {t('central.dashboard.no_alarms')}
            </p>
          ) : (
            <div className="space-y-2">
              {topAlarms.map((alarm: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-rose-200/70 bg-rose-50/60 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold leading-snug text-rose-900">
                      {alarm.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-rose-200/70 px-1.5 py-0.5 text-xs font-bold uppercase text-rose-900 whitespace-nowrap">
                      {alarm.severity}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                    {alarm.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CentralOverview;
