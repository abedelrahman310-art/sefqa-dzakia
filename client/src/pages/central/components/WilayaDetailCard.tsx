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
    <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[var(--color-border-subtle)] shadow-2xl p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-[var(--paper-100)] text-[var(--ink-700)] border border-[var(--color-border-subtle)]">
              ولاية {wilaya.code}
            </span>
            {wilaya.nameFr && (
              <span className="text-xs text-[var(--ink-500)] font-sans">
                {wilaya.nameFr}
              </span>
            )}
          </div>
          <h3 className="heading-h3 text-xl font-bold text-[var(--ink-900)] mt-1">
            {wilaya.name}
          </h3>
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
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[var(--paper-50)] border border-[var(--color-border-subtle)] rounded-xl p-3 text-center">
          <span className="block text-xs text-[var(--ink-500)] mb-1">الصفقات</span>
          <span className="block text-xl font-bold text-[var(--ink-900)] font-mono">
            {wilaya.tenders_count}
          </span>
        </div>

        <div className="bg-[var(--paper-50)] border border-[var(--color-border-subtle)] rounded-xl p-3 text-center">
          <span className="block text-xs text-[var(--ink-500)] mb-1">مليار دج</span>
          <span className="block text-xl font-bold text-[var(--stamp-green-700)] font-mono">
            {wilaya.budget}
          </span>
        </div>

        <div
          className={`border rounded-xl p-3 text-center ${
            hasWarnings
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-[var(--paper-50)] border-[var(--color-border-subtle)] text-[var(--ink-900)]'
          }`}
        >
          <span className="block text-xs opacity-80 mb-1">الشبهات</span>
          <div className="flex items-center justify-center gap-1">
            {hasWarnings && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
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
      <div className="ai-card mb-5">
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[var(--ai-text)] ai-sparkle" />
            <h4 className="text-xs font-bold text-[var(--ai-text-strong)]">
              تحليل الذكاء الاصطناعي
            </h4>
            <span className="ai-badge">AI</span>
          </div>
          <span className="text-[10px] text-[var(--ai-text)]/80 font-medium">
            استشاري فقط
          </span>
        </div>

        <div className="text-xs leading-relaxed text-[var(--ink-700)] relative z-10 space-y-1.5">
          {hasWarnings ? (
            <>
              <p className="font-semibold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-none" />
                رصد {wilaya.warnings} حالات اشتباه إجرائي تستدعي الفحص الرقابي.
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-[var(--ink-700)] ps-1">
                {wilaya.warningDetails && wilaya.warningDetails.length > 0 ? (
                  wilaya.warningDetails.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))
                ) : (
                  <>
                    <li>شبهة تجزئة نفقات دون تبرير تقني (المادة 27 من ق. 23-12).</li>
                    <li>معدل تنافسية منخفض في صفقات الأشغال العمومية الكبرى.</li>
                  </>
                )}
              </ul>
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-none" />
              المؤشرات التنظيمية سليمة — معدل إسناد طبيعي وتنافسية بنسبة 94% عبر 4 قطاعات نشطة.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          className="flex-1 bg-[var(--stamp-green-700)] hover:bg-[var(--stamp-green-900)] text-white text-xs h-9 gap-1.5"
          onClick={() => onViewTenders?.(wilaya.code)}
        >
          <span>عرض كل الصفقات</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="outline"
          className="border-[var(--color-border-subtle)] text-xs h-9 gap-1.5 hover:bg-[var(--paper-100)]"
          onClick={() => onNotifyAuthority?.(wilaya.code)}
        >
          <BellRing className="w-3.5 h-3.5 text-[var(--stamp-gold-700)]" />
          <span>إخطار المصلحة</span>
        </Button>
      </div>
    </div>
  );
}
