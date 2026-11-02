import { useI18n } from '@/i18n';
import { CreditCard, Shield } from 'lucide-react';

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
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
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
              {t('operator.payments.framework_title')}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('operator.payments.framework_desc')}
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
            {t('operator.payments.empty_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
