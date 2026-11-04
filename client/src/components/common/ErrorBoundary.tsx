import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          dir="rtl"
          className="min-h-[50vh] flex items-center justify-center p-6 font-['Cairo',sans-serif]"
        >
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
              <AlertTriangle className="size-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              تعذر تحميل هذا القسم بالشكل المطلوب
            </h3>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              حدث خطأ تقني غير متوقع أثناء معالجة الواجهة. يمكنك إعادة المحاولة لتحديث البيانات دون فقدان التصفح.
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>إعادة المحاولة</span>
              </button>

              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Home className="size-3.5" />
                <span>الصفحة الرئيسية</span>
              </a>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-start rounded-lg bg-slate-50 p-2 text-[10px] text-rose-700 font-mono overflow-auto max-h-32">
                <summary className="cursor-pointer font-bold mb-1">تفاصيل الخطأ (بيئة التطوير)</summary>
                {this.state.error.toString()}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
