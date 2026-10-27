import { Sparkles, X, AlertTriangle, ShieldCheck, ArrowUpRight, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface WilayaDetail {
  code: string;
  name: string;
  nameFr?: string;
  tenders_count: number;
  budget: number; // in billion DZD
  warnings: number;
  warningDetails?: string[];
  activeSectors?: string[];
  risk_level?: 'critical' | 'high' | 'medium' | 'low' | string;
  risk_color?: string;
}

interface Props {
  wilaya: WilayaDetail;
  onClose: () => void;
  onViewTenders?: (code: string) => void;
  onNotifyAuthority?: (code: string) => void;
}

export function WilayaDetailCard({
  wilaya,
  onClose,
  onViewTenders,
  onNotifyAuthority,
}: Props) {
  const hasWarnings = wilaya.warnings > 0;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-gray-50 text-gray-600 border border-gray-200">
              ولاية {wilaya.code}
            </span>
            {wilaya.nameFr && (
              <span className="text-xs text-gray-500 font-sans">
                {wilaya.nameFr}
              </span>
            )}
          </div>
          <h3 className="heading-h3 text-lg font-bold text-[var(--ink-900)] mt-1">
            {wilaya.name}
          </h3>
          {wilaya.risk_level && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mt-2"
              style={{
                backgroundColor:
                  wilaya.risk_level === 'critical'
                    ? '#FEE2E2'
                    : wilaya.risk_level === 'high'
                    ? '#FFEDD5'
                    : wilaya.risk_level === 'medium'
                    ? '#FEF9C3'
                    : '#DCFCE7',
                color:
                  wilaya.risk_level === 'critical'
                    ? '#991B1B'
                    : wilaya.risk_level === 'high'
                    ? '#9A3412'
                    : wilaya.risk_level === 'medium'
                    ? '#854D0E'
                    : '#166534',
                border: `1px solid ${
                  wilaya.risk_level === 'critical'
                    ? '#F87171'
                    : wilaya.risk_level === 'high'
                    ? '#FB923C'
                    : wilaya.risk_level === 'medium'
                    ? '#FACC15'
                    : '#86EFAC'
                }`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: wilaya.risk_color || '#DC2626' }}
              />
              {wilaya.risk_level === 'critical' && 'شبهات رقابية حرجة (Critical)'}
              {wilaya.risk_level === 'high' && 'شبهات رقابية عالية (High)'}
              {wilaya.risk_level === 'medium' && 'شبهات رقابية متوسطة (Medium)'}
              {wilaya.risk_level === 'low' && 'نشاط نظامي متوافق (Low)'}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="إغلاق"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--paper-100)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <span className="block text-sm text-gray-500 mb-1">الصفقات</span>
          <span className="block text-xl font-bold text-[var(--ink-900)] font-mono">
            {wilaya.tenders_count}
          </span>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <span className="block text-sm text-gray-500 mb-1">مليار دج</span>
          <span className="block text-xl font-bold text-[var(--stamp-green-700)] font-mono">
            {wilaya.budget}
          </span>
        </div>

        <div
          className={`border rounded-xl p-3 text-center ${
            hasWarnings
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-gray-50 border-gray-200 text-[var(--ink-900)]'
          }`}
        >
          <span className="block text-sm opacity-80 mb-1">الشبهات</span>
          <div className="flex items-center justify-center gap-1">
            {hasWarnings && <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />}
            <span
              className={`block text-xl font-bold font-mono ${
                hasWarnings ? 'text-rose-700' : 'text-[var(--ink-900)]'
              }`}
            >
              {wilaya.warnings}
            </span>
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      <div className="ai-card mb-4">
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[var(--ai-text)] ai-sparkle" />
            <h4 className="text-sm font-bold text-[var(--ai-text-strong)]">
              تحليل الذكاء الاصطناعي
            </h4>
            <span className="ai-badge">AI</span>
          </div>
          <span className="text-xs text-[var(--ai-text)]/80 font-medium">
            استشاري فقط
          </span>
        </div>

        <div className="text-sm leading-relaxed text-[var(--ink-700)] relative z-10 space-y-1.5">
          {hasWarnings ? (
            <>
              <p className="font-semibold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-none" />
                رصد {wilaya.warnings} حالات اشتباه إجرائي تستدعي الفحص الرقابي.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-[var(--ink-700)] ps-1">
                {wilaya.warningDetails && wilaya.warningDetails.length > 0 ? (
                  wilaya.warningDetails.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))
                ) : (
                  <li>شبهة مسجلة تستدعي المراجعة الرقابية.</li>
                )}
              </ul>
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-none" />
              لم تُرصد شبهات مرتبطة بهذه الولاية في التحليل الاستشاري الحالي.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          className="flex-1 bg-[var(--stamp-green-700)] hover:bg-[var(--stamp-green-900)] text-white text-sm h-10 gap-1.5"
          onClick={() => onViewTenders?.(wilaya.code)}
        >
          <span>عرض كل الصفقات</span>
          <ArrowUpRight className="w-4 h-4" />
        </Button>

        {onNotifyAuthority && (
          <Button
            variant="outline"
            className="border-gray-200 text-sm h-10 gap-1.5 hover:bg-gray-50"
            onClick={() => onNotifyAuthority(wilaya.code)}
          >
            <BellRing className="w-4 h-4 text-[var(--stamp-gold-700)]" />
            <span>إخطار المصلحة</span>
          </Button>
        )}
      </div>
    </div>
  );
}
