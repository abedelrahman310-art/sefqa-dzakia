import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AlertTriangle, FileText } from 'lucide-react';

export function CentralOverview() {
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
        setError(err.response?.data?.detail || 'تعذر تحميل بيانات لوحة القيادة السيادية');
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="p-8 text-center text-sm font-medium text-slate-500">
      جاري تحميل المؤشرات السيادية للرقابة المركزية...
    </div>
  );

  if (error || !data) return (
    <div className="p-8 text-center text-sm font-semibold text-rose-600">
      {error || 'فشل تحميل بيانات لوحة القيادة'}
    </div>
  );

  const recentDeals: any[] = data.recent_deals || [];
  const topAlarms: any[] = data.top_alarms || [];

  return (
    <div className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">لوحة القيادة السيادية (عين الصقر)</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          مؤشرات الرقابة والامتثال الميداني على الصفقات العمومية وفق القانون 23-12
        </p>
      </div>

      {/* بطاقات المؤشرات الأساسية */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-sky-300 transition-colors">
          <h3 className="text-xs font-semibold text-slate-600">إجمالي الصفقات الجارية</h3>
          <p className="text-2xl font-bold text-sky-600 mt-1 tabular-nums">{data.active_deals_count ?? 0}</p>
          <span className="text-xs text-slate-500 mt-0.5 block">من أصل {data.total_deals ?? 0} صفقة مسجلة</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-amber-300 transition-colors">
          <h3 className="text-xs font-semibold text-slate-600">صفقات بانتظار التأشيرة</h3>
          <p className="text-2xl font-bold text-amber-500 mt-1 tabular-nums">{data.pending_visa_count ?? 0}</p>
          <span className="text-xs text-slate-500 mt-0.5 block">لدى لجان الصفقات المختصة</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-rose-300 transition-colors">
          <h3 className="text-xs font-semibold text-slate-600">إنذارات الذكاء الاصطناعي</h3>
          <p className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">{data.total_ai_alarms ?? 0}</p>
          <span className="text-xs text-slate-500 mt-0.5 block">{data.total_suspicions_count ?? 0} شبهة تجزئة وتواطؤ</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-300 transition-colors">
          <h3 className="text-xs font-semibold text-slate-600">المصالح النشطة</h3>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{data.active_authorities_count ?? 0}</p>
          <span className="text-xs text-slate-500 mt-0.5 block">من أصل {data.total_authorities_count ?? 0} مصلحة متعاقدة</span>
        </div>
      </div>

      {/* الإنذارات العاجلة وأحدث الصفقات */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* أحدث الصفقات */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-slate-800 mb-2">أحدث الصفقات المسجلة</h3>

          {recentDeals.length === 0 ? (
            <p className="flex items-center gap-2 py-4 text-xs text-slate-500">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              لا توجد صفقات مسجّلة بعد.
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
                    <span className="block text-xs font-bold tabular-nums text-slate-700">
                      {typeof deal.estimated_budget === 'number'
                        ? `${deal.estimated_budget.toLocaleString('ar-DZ')} دج`
                        : '—'}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-sky-600">
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
          <h3 className="text-sm font-bold text-slate-800 mb-2">أبرز الشبهات الرقابية النشطة</h3>

          {topAlarms.length === 0 ? (
            <p className="flex items-center gap-2 py-4 text-xs text-slate-500">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
              لا توجد شبهات رقابية نشطة حالياً.
            </p>
          ) : (
            <div className="space-y-2">
              {topAlarms.map((alarm: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-rose-200/70 bg-rose-50/60 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold leading-snug text-rose-900">
                      {alarm.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-rose-200/70 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-900">
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
