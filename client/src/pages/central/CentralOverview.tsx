import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
    <div className="p-8 text-center text-slate-500 font-medium">
      جاري تحميل المؤشرات السيادية للرقابة المركزية...
    </div>
  );

  if (error || !data) return (
    <div className="p-8 text-center text-rose-600 font-semibold">
      {error || 'فشل تحميل بيانات لوحة القيادة'}
    </div>
  );

  return (
    <div className="p-6 space-y-8" dir="rtl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">لوحة القيادة السيادية (عين الصقر)</h2>
        <p className="text-sm text-slate-500 mt-1">مؤشرات الرقابة والامتثال الميداني على الصفقات العمومية وفق القانون 23-12</p>
      </div>
      
      {/* بطاقات المؤشرات الأساسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 hover:border-sky-300 transition-colors">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">إجمالي الصفقات الجارية</h3>
          <p className="text-3xl font-black text-sky-600 mt-2">{data.active_deals_count ?? 0}</p>
          <span className="text-xs text-slate-400 mt-1 block">من أصل {data.total_deals ?? 0} صفقة مسجلة</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 hover:border-amber-300 transition-colors">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">صفقات بانتظار التأشيرة</h3>
          <p className="text-3xl font-black text-amber-500 mt-2">{data.pending_visa_count ?? 0}</p>
          <span className="text-xs text-slate-400 mt-1 block">لدى لجان الصفقات المختصة</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 hover:border-rose-300 transition-colors">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">إنذارات الذكاء الاصطناعي</h3>
          <p className="text-3xl font-black text-rose-600 mt-2">{data.total_ai_alarms ?? 0}</p>
          <span className="text-xs text-rose-500/80 mt-1 block">{data.total_suspicions_count ?? 0} شبهة تجزئة وتواطؤ</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 hover:border-emerald-300 transition-colors">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">المصالح النشطة</h3>
          <p className="text-3xl font-black text-emerald-600 mt-2">{data.active_authorities_count ?? 0}</p>
          <span className="text-xs text-slate-400 mt-1 block">من أصل {data.total_authorities_count ?? 0} مصلحة متعاقدة</span>
        </div>
      </div>

      {/* الإنذارات العاجلة وأحدث الصفقات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أحدث الصفقات */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <h3 className="text-base font-bold text-slate-800 mb-4">أحدث الصفقات المسجلة</h3>
          <div className="divide-y divide-slate-100">
            {(data.recent_deals || []).map((deal: any) => (
              <div key={deal.id} className="py-3 flex items-center justify-between text-sm">
                <div className="min-w-0 flex-1 pe-4">
                  <p className="font-bold text-slate-800 truncate">{deal.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{deal.authority_name} · {deal.wilaya}</p>
                </div>
                <div className="text-end shrink-0">
                  <span className="font-mono font-bold text-slate-700 block">{deal.estimated_budget?.toLocaleString('ar-DZ')} دج</span>
                  <span className="text-[11px] text-sky-600 font-semibold">{deal.stage_display}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* أهم إنذارات الشبهات */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <h3 className="text-base font-bold text-slate-800 mb-4">أبرز الشبهات الرقابية النشطة</h3>
          <div className="space-y-3">
            {(data.top_alarms || []).map((alarm: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/60 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-rose-800">{alarm.title}</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200/60 text-rose-900">
                    {alarm.severity}
                  </span>
                </div>
                <p className="text-xs text-rose-700/90 mt-1 leading-relaxed">{alarm.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CentralOverview;