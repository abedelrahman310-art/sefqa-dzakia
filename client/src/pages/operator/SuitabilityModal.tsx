import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, XCircle, HelpCircle, ShieldAlert, Sparkles, Building2, MapPin, Award, Layers, X } from 'lucide-react';

interface Props {
  opportunityId: string | null;
  onClose: () => void;
}

export function SuitabilityModal({ opportunityId, onClose }: Props) {
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!opportunityId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(false);

    fetch(`/api/operator/opportunities/${opportunityId}/suitability`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load suitability');
        return res.json();
      })
      .then((resData) => setData(resData))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [opportunityId]);

  if (!opportunityId) return null;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>مطابق</span>
          </span>
        );
      case 'neutral_cross_wilaya':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-800 border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-slate-600" />
            <span>خارج ولاية المقر</span>
          </span>
        );
      case 'mismatched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>غير مطابق</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>غير محدد</span>
          </span>
        );
    }
  };

  const renderOverallSignal = (signal: string) => {
    switch (signal) {
      case 'relevant':
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <strong className="text-xs font-bold text-emerald-900">
                {t('operator.suitability.signal_relevant')}
              </strong>
            </div>
            <span className="text-[11px] bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded font-semibold">
              تطابق رئيسي
            </span>
          </div>
        );
      case 'partial':
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <strong className="text-xs font-bold text-amber-900">
                {t('operator.suitability.signal_partial')}
              </strong>
            </div>
            <span className="text-[11px] bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded font-semibold">
              تقاطع جزئي
            </span>
          </div>
        );
      case 'unclassified':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <strong className="text-xs font-bold text-blue-900">
                {t('operator.suitability.signal_unclassified')}
              </strong>
            </div>
            <span className="text-[11px] bg-blue-100/70 text-blue-900 px-2 py-0.5 rounded font-semibold">
              يتطلب مراجعة الدفتر
            </span>
          </div>
        );
      default:
        return (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-600" />
              <strong className="text-xs font-bold text-slate-900">
                {t('operator.suitability.signal_neutral')}
              </strong>
            </div>
            <span className="text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-semibold">
              لا يظهر تقاطع مباشر
            </span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>{t('operator.suitability.title')}</span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">جاري تحليل الملاءمة الأولية...</div>
        ) : error || !data ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-xs font-bold">
            تعذر جلب تفاصيل الملاءمة لهذه الفرصة.
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Opportunity Brief */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-1">
              <span className="text-[11px] text-muted-foreground block">{data.opportunity.authorityName}</span>
              <h3 className="text-sm font-extrabold text-navy-900 leading-snug">{data.opportunity.title}</h3>
            </div>

            {/* Overall Signal */}
            {renderOverallSignal(data.suitability.overallSignal)}

            {/* Criteria Breakdown Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-navy-900">مصفوفة الشروط المقارنة:</h4>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Sector */}
                <div className="border border-border rounded-xl p-3 bg-card space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      <span>القطاع الرئيسي</span>
                    </span>
                    {renderStatusBadge(data.suitability.criteria.sector.status)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {data.suitability.criteria.sector.note}
                  </p>
                </div>

                {/* Location */}
                <div className="border border-border rounded-xl p-3 bg-card space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>النطاق الجغرافي وموقع التنفيذ</span>
                    </span>
                    {renderStatusBadge(data.suitability.criteria.location.status)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {data.suitability.criteria.location.note}
                  </p>
                </div>

                {/* Activity Codes */}
                <div className="border border-border rounded-xl p-3 bg-card space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>رموز الأنشطة التجارية (CNRC)</span>
                    </span>
                    {renderStatusBadge(data.suitability.criteria.activity.status)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {data.suitability.criteria.activity.note}
                  </p>
                  {data.suitability.criteria.activity.matchedCodes?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] font-semibold text-emerald-800">الرموز المشتركة:</span>
                      {data.suitability.criteria.activity.matchedCodes.map((code: string) => (
                        <span key={code} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold">
                          {code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qualification Level */}
                <div className="border border-border rounded-xl p-3 bg-card space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      <span>درجة التأهيل والتصنيف المهني</span>
                    </span>
                    {renderStatusBadge(data.suitability.criteria.qualification.status)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {data.suitability.criteria.qualification.note}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Alerts */}
            {data.suitability.verificationAlerts?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                <strong className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>تنبيهات التدقيق والمراجعة البشرية:</span>
                </strong>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-1">
                  {data.suitability.verificationAlerts.map((alert: string, idx: number) => (
                    <li key={idx}>{alert}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mandatory Regulatory Disclaimer */}
            <div className="border border-border bg-muted/40 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-navy-800 flex-none mt-0.5" />
              <div>
                <strong className="block font-bold text-navy-900 mb-0.5">
                  {t('operator.suitability.disclaimer_title')}:
                </strong>
                {data.suitability.disclaimer}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
