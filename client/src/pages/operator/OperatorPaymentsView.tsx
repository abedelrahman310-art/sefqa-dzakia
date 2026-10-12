import { useI18n } from '@/i18n';
import { CreditCard, AlertCircle, FileCheck2, ArrowUpRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OperatorPaymentsView() {
  const { t, lang } = useI18n();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-slate-100">
              {t('operator.payments.title')}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {t('operator.payments.epay_badge')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t('operator.payments.subtitle')}
          </p>
        </div>
      </div>

      {/* Institutional Explanatory Card */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs text-slate-700 dark:text-slate-300 space-y-3">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-navy-900 dark:text-gold-400 flex-none mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-navy-900 dark:text-slate-100 text-sm">
              {lang === 'ar' ? 'الإطار التنظيمي للمدفوعات وحقوق المشاركة' : 'Cadre réglementaire des paiements et droits de participation'}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'يتم دفع حقوق سحب دفاتر الشروط والضمانات المالية (ضمان التعهد وحسن التنفيذ) وفق القنوات المالية الرسمية المعتمدة لدى الخزينة العمومية والمصالح المتعاقدة وفقاً لأحكام المرسوم الرئاسي 15-247. يجري حالياً الربط التقني لتفعيل الدفع الرقمي الحكومي المباشر.'
                : 'Le règlement des droits de retrait des cahiers des charges et des cautions (soumission et bonne exécution) s\'effectue via les canaux financiers officiels du Trésor Public et des services contractants conformément au décret présidentiel 15-247.'}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Receipts & Records Table / Empty State */}
      <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <CreditCard className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="text-sm font-bold text-navy-900 dark:text-slate-100">
            {t('operator.payments.empty')}
          </h4>
          <p className="text-xs text-muted-foreground">
            {lang === 'ar'
              ? 'عند إيداع وصولات الدفع الورقية أو تفعيل بوابات الدفع البنكية، ستظهر كافة الوصولات الموثقة وسجلات التحقق المالي هنا تلقائياً.'
              : 'Dès l\'enregistrement des quittances physiques ou l\'activation des passerelles bancaires, tous vos reçus certifiés apparaîtront automatiquement ici.'}
          </p>
        </div>
      </div>
    </div>
  );
}
