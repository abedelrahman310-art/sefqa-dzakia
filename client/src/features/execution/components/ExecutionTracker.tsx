import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type {
  DealMilestonesResponseApi,
  MilestoneApi,
  MilestoneProgressReportResponseApi,
  MilestoneStatusApi,
} from '@/lib/procurementApiTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  Paperclip,
  PlayCircle,
  RefreshCw,
  Upload,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

type ExecutionTrackerRole = 'authority' | 'operator';

export interface ExecutionTrackerProps {
  dealId: string;
  role: ExecutionTrackerRole;
  className?: string;
}

interface ReportFormState {
  percentage: string;
  reportText: string;
  file: File | null;
  fileInputKey: number;
  saving: boolean;
  error: string;
  success: string;
}

const MILESTONE_STATUS_META: Record<
  MilestoneStatusApi,
  {
    label: string;
    className: string;
    barClassName: string;
    iconClassName: string;
    icon: LucideIcon;
  }
> = {
  pending: {
    label: 'قيد الانتظار',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    barClassName: 'bg-slate-400',
    iconClassName: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: Clock,
  },
  in_progress: {
    label: 'قيد التنفيذ',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
    barClassName: 'bg-blue-600',
    iconClassName: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: PlayCircle,
  },
  completed: {
    label: 'مكتملة ومستلمة',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    barClassName: 'bg-emerald-600',
    iconClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  delayed: {
    label: 'متأخرة عن الأجل',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    barClassName: 'bg-rose-600',
    iconClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: AlertTriangle,
  },
};

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const response = (err as { response?: { data?: unknown } })?.response;
  const data = response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const detail = record.error ?? record.detail ?? record.message;
    if (typeof detail === 'string' && detail.trim()) return detail;
    const firstValue = Object.values(record)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') {
      return firstValue[0];
    }
    if (typeof firstValue === 'string' && firstValue.trim()) return firstValue;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ar-DZ', { dateStyle: 'medium' });
};

const formatAmount = (value: string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString('ar-DZ', { maximumFractionDigits: 2 })} دج`;
};

const createReportForm = (milestone: MilestoneApi): ReportFormState => ({
  percentage: String(milestone.progress_percentage ?? 0),
  reportText: '',
  file: null,
  fileInputKey: 0,
  saving: false,
  error: '',
  success: '',
});

const getStatusMeta = (status: string) =>
  MILESTONE_STATUS_META[status as MilestoneStatusApi] || {
    label: status || 'غير محددة',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    barClassName: 'bg-slate-400',
    iconClassName: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: Clock,
  };

export function ExecutionTracker({ dealId, role, className = '' }: ExecutionTrackerProps) {
  const [milestones, setMilestones] = useState<MilestoneApi[]>([]);
  const [dealReference, setDealReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportForms, setReportForms] = useState<Record<string, ReportFormState>>({});
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});

  const loadMilestones = useCallback(async () => {
    if (!dealId) {
      setMilestones([]);
      setDealReference('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setMilestones([]);
    setDealReference('');

    try {
      const { data } = await api.get<DealMilestonesResponseApi>(
        `/procurements/deals/${dealId}/milestones/`,
      );
      const items = Array.isArray(data.milestones) ? data.milestones : [];
      setMilestones(items);
      setDealReference(data.deal_reference || '');

      setReportForms((previous) => {
        const next: Record<string, ReportFormState> = {};
        items.forEach((milestone) => {
          next[milestone.id] = previous[milestone.id]
            ? {
                ...previous[milestone.id],
                saving: false,
                error: '',
                success: '',
              }
            : createReportForm(milestone);
        });
        return next;
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'تعذر تحميل مراحل تنفيذ الصفقة. يرجى المحاولة مجدداً.'));
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void loadMilestones();
  }, [loadMilestones]);

  const updateReportForm = (milestoneId: string, patch: Partial<ReportFormState>) => {
    setReportForms((previous) => ({
      ...previous,
      [milestoneId]: {
        ...(previous[milestoneId] || {
          percentage: '0',
          reportText: '',
          file: null,
          fileInputKey: 0,
          saving: false,
          error: '',
          success: '',
        }),
        ...patch,
      },
    }));
  };

  const handleSubmitReport = async (milestone: MilestoneApi) => {
    if (role !== 'operator') return;
    const form = reportForms[milestone.id] || createReportForm(milestone);

    const percentage = Number(form.percentage);
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      updateReportForm(milestone.id, {
        error: 'يرجى إدخال نسبة إنجاز صحيحة بين 0 و100.',
        success: '',
      });
      return;
    }

    if (!form.reportText.trim()) {
      updateReportForm(milestone.id, {
        error: 'يرجى كتابة بيان الأعمال المنجزة قبل رفع التقرير.',
        success: '',
      });
      return;
    }

    const formData = new FormData();
    formData.append('progress_percentage', String(Math.round(percentage)));
    formData.append('report_text', form.reportText.trim());
    if (form.file) {
      formData.append('report_file', form.file, form.file.name);
    }

    updateReportForm(milestone.id, {
      saving: true,
      error: '',
      success: '',
    });

    try {
      const { data } = await api.post<MilestoneProgressReportResponseApi>(
        `/procurements/milestones/${milestone.id}/progress-report/`,
        formData,
      );

      setMilestones((previous) =>
        previous.map((item) => (item.id === milestone.id ? data.milestone : item)),
      );

      setReportForms((previous) => ({
        ...previous,
        [milestone.id]: {
          ...(previous[milestone.id] || createReportForm(milestone)),
          percentage: String(data.milestone.progress_percentage ?? percentage),
          reportText: '',
          file: null,
          fileInputKey: (previous[milestone.id]?.fileInputKey || 0) + 1,
          saving: false,
          error: '',
          success: data.message || 'تم رفع تقرير الإنجاز بنجاح.',
        },
      }));
    } catch (err: unknown) {
      updateReportForm(milestone.id, {
        saving: false,
        error: getApiErrorMessage(err, 'تعذر رفع تقرير الإنجاز. يرجى المحاولة مجدداً.'),
      });
    }
  };

  const overallProgress =
    milestones.length === 0
      ? 0
      : Math.round(
          milestones.reduce(
            (sum, milestone) =>
              sum + Math.max(0, Math.min(100, Number(milestone.progress_percentage) || 0)),
            0,
          ) / milestones.length,
        );
  const completedCount = milestones.filter((milestone) => milestone.status === 'completed').length;

  return (
    <section
      className={`rounded-2xl border border-[#D5DDEA] bg-white p-5 shadow-sm space-y-4 ${className}`}
      dir="rtl"
      aria-labelledby={`execution-tracker-${dealId}`}
    >
      <div className="flex flex-col gap-3 border-b border-[#E5EBF4] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3
            id={`execution-tracker-${dealId}`}
            className="flex items-center gap-2 text-base font-extrabold text-navy-900"
          >
            <Clock className="h-5 w-5 text-emerald-700" />
            مراحل تنفيذ الصفقة
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            متابعة نسب الإنجاز وتقارير المراحل
            {dealReference ? ` للصفقة ${dealReference}` : ''}.
          </p>
          <div className="mt-3 max-w-md">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
              <span>
                التقدم الإجمالي · {completedCount} من {milestones.length} مرحلة مكتملة
              </span>
              <span className="font-mono text-emerald-800">{overallProgress}%</span>
            </div>
            <div
              className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="التقدم الإجمالي لمراحل التنفيذ"
            >
              <div
                className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-700 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#D5DDEA] bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700">
            {milestones.length} مرحلة
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadMilestones()}
            disabled={loading}
            className="gap-1.5 rounded-xl border-[#D5DDEA] text-xs font-bold text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMilestones()}
              className="rounded-lg border-rose-200 bg-white text-[11px] font-bold text-rose-800"
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="جارٍ تحميل مراحل التنفيذ">
          {[0, 1].map((item) => (
            <div key={item} className="rounded-xl border border-[#E5EBF4] p-4">
              <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-2 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : milestones.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-[#D5DDEA] bg-slate-50/50 p-6 text-center">
          <Clock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">لم تُسجَّل مراحل تنفيذ بعد</p>
          <p className="mt-1 text-xs text-gray-500">
            {role === 'operator'
              ? 'ستظهر هنا المراحل التي تعدها المصلحة المتعاقدة لمتابعة الإنجاز.'
              : 'ستظهر هنا مراحل التنفيذ المسجلة لهذه الصفقة.'}
          </p>
        </div>
      ) : (
        <ol className="relative space-y-0" aria-label="الجدول الزمني لمراحل التنفيذ">
          {milestones.map((milestone, index) => {
            const statusMeta = getStatusMeta(milestone.status);
            const StatusIcon = statusMeta.icon;
            const isLast = index === milestones.length - 1;
            const form = reportForms[milestone.id] || createReportForm(milestone);
            const progress = Math.max(0, Math.min(100, Number(milestone.progress_percentage) || 0));
            const reports = milestone.progress_reports || [];
            const reportsOpen = expandedReports[milestone.id] ?? reports.length > 0;

            return (
              <li key={milestone.id} className={`relative ps-12 ${isLast ? '' : 'pb-6'}`}>
                {!isLast && (
                  <span
                    className="absolute start-[19px] top-10 bottom-0 w-0.5 bg-[#E5EBF4]"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`absolute start-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border-2 ${statusMeta.iconClassName}`}
                  aria-hidden="true"
                >
                  <StatusIcon className="h-5 w-5" />
                </span>
                <article className="rounded-xl border border-[#E5EBF4] bg-white p-4 space-y-3 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold text-gray-400">
                          المرحلة {index + 1}
                        </span>
                        <h4 className="text-sm font-extrabold text-navy-900">{milestone.title}</h4>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      {milestone.description && (
                        <p className="mt-1 text-xs leading-relaxed text-gray-600">
                          {milestone.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          الاستحقاق: {formatDate(milestone.due_date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Wallet className="h-3.5 w-3.5" />
                          {formatAmount(milestone.amount)}
                        </span>
                        {milestone.completion_date && (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            الإنجاز: {formatDate(milestone.completion_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-[130px] shrink-0 text-left">
                      <div className="text-[11px] font-bold text-gray-500">نسبة التقدم</div>
                      <div className="text-lg font-extrabold text-emerald-800">{progress}%</div>
                    </div>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`نسبة تقدم ${milestone.title}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${statusMeta.barClassName}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedReports((previous) => ({
                        ...previous,
                        [milestone.id]: !reportsOpen,
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-[#E5EBF4] bg-slate-50/60 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                    aria-expanded={reportsOpen}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      تقارير الإنجاز المرفوعة ({reports.length})
                    </span>
                    {reportsOpen ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {reportsOpen && (
                    <div className="space-y-2">
                      {reports.length === 0 ? (
                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-gray-500">
                          لم يُرفع أي تقرير إنجاز لهذه المرحلة بعد.
                        </p>
                      ) : (
                        reports.map((report) => (
                          <div
                            key={report.id}
                            className="rounded-lg border border-[#E5EBF4] bg-white p-3 text-[11px]"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-navy-900">
                                {report.operator_name || 'المتعامل الاقتصادي'}
                              </span>
                              <span className="font-mono font-bold text-emerald-800">
                                {report.progress_percentage}%
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap leading-relaxed text-gray-600">
                              {report.report_text}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
                              <span>{formatDate(report.submitted_at)}</span>
                              {report.report_file_url && (
                                <a
                                  href={report.report_file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  عرض الملف المرفق
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {role === 'operator' && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
                        <Upload className="h-4 w-4" />
                        رفع تقرير إنجاز لهذه المرحلة
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor={`percentage-${milestone.id}`}
                            className="text-[11px] font-bold text-slate-700"
                          >
                            نسبة الإنجاز (%)
                          </Label>
                          <Input
                            id={`percentage-${milestone.id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={form.percentage}
                            disabled={form.saving}
                            onChange={(event) =>
                              updateReportForm(milestone.id, {
                                percentage: event.target.value,
                                error: '',
                                success: '',
                              })
                            }
                            className="rounded-xl border-[#D5DDEA] bg-white text-xs"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <Label
                            htmlFor={`report-file-${milestone.id}`}
                            className="text-[11px] font-bold text-slate-700"
                          >
                            ملف التقرير أو محضر المعاينة (اختياري)
                          </Label>
                          <Input
                            key={`${milestone.id}-${form.fileInputKey}`}
                            id={`report-file-${milestone.id}`}
                            type="file"
                            accept=".pdf,image/*"
                            disabled={form.saving}
                            onChange={(event) =>
                              updateReportForm(milestone.id, {
                                file: event.target.files?.[0] || null,
                                error: '',
                                success: '',
                              })
                            }
                            className="cursor-pointer rounded-xl border-[#D5DDEA] bg-white text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:text-emerald-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`report-text-${milestone.id}`}
                          className="text-[11px] font-bold text-slate-700"
                        >
                          بيان الأعمال المنجزة والملاحظات الميدانية
                        </Label>
                        <Textarea
                          id={`report-text-${milestone.id}`}
                          value={form.reportText}
                          disabled={form.saving}
                          onChange={(event) =>
                            updateReportForm(milestone.id, {
                              reportText: event.target.value,
                              error: '',
                              success: '',
                            })
                          }
                          placeholder="اذكر الأعمال المنجزة فعلياً، نسب التقدم، وأي ملاحظات أو تحفظات..."
                          rows={2}
                          className="rounded-xl border-[#D5DDEA] bg-white text-xs"
                        />
                      </div>

                      {form.error && (
                        <div
                          className="flex items-start gap-1.5 text-[11px] text-rose-700"
                          role="alert"
                        >
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{form.error}</span>
                        </div>
                      )}

                      {form.success && (
                        <div
                          className="flex items-start gap-1.5 text-[11px] text-emerald-700"
                          role="status"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{form.success}</span>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          disabled={form.saving}
                          aria-busy={form.saving}
                          onClick={() => void handleSubmitReport(milestone)}
                          className="gap-2 rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
                        >
                          {form.saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {form.saving ? 'جاري رفع التقرير...' : 'رفع تقرير الإنجاز'}
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export default ExecutionTracker;
