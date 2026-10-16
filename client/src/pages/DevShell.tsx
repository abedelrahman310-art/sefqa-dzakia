import { useI18n } from '@/i18n';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export function DevShell() {
  const { t, dir } = useI18n();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-[var(--paper-50)] p-6" dir={dir}>
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
          <h1 className="text-xl font-bold text-[var(--ink-900)]">{t('dev.title')}</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--ink-600)] hover:text-[var(--official-700)] transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </header>

        <main className="space-y-4">
          <div className="p-6 bg-white rounded-xl border border-[var(--color-border-subtle)] shadow-xs">
            <h2 className="text-xl font-bold mb-2 text-[var(--ink-900)]">بيئة التطوير والاختبار</h2>
            <p className="text-[var(--ink-600)] text-sm leading-relaxed">
              هذه الصفحة مخصصة لوضع التطوير لاختبار مكونات المنصة ودعم الاتجاهين والترجمة.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DevShell;
