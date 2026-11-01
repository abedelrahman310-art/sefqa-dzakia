with open('client/src/features/execution/components/ExecutionTracker.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's inspect how MILESTONE_STATUS_META is defined and used
old_meta = """const MILESTONE_STATUS_META: Record<
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
};"""

new_meta = """const MILESTONE_STATUS_META: Record<
  MilestoneStatusApi,
  {
    labelKey: string;
    className: string;
    barClassName: string;
    iconClassName: string;
    icon: LucideIcon;
  }
> = {
  pending: {
    labelKey: 'authority.execution.status_pending',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    barClassName: 'bg-slate-400',
    iconClassName: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: Clock,
  },
  in_progress: {
    labelKey: 'authority.execution.status_in_progress',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
    barClassName: 'bg-blue-600',
    iconClassName: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: PlayCircle,
  },
  completed: {
    labelKey: 'authority.execution.status_completed',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    barClassName: 'bg-emerald-600',
    iconClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  delayed: {
    labelKey: 'authority.execution.status_delayed',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    barClassName: 'bg-rose-600',
    iconClassName: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: AlertTriangle,
  },
};"""

content = content.replace(old_meta, new_meta)

old_gsm = """const getStatusMeta = (status: string) =>
  MILESTONE_STATUS_META[status as MilestoneStatusApi] || {
    label: status || 'غير محددة',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    barClassName: 'bg-slate-400',
    iconClassName: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: Clock,
  };"""

new_gsm = """const getStatusMeta = (status: string, t: (k: string) => string) => {
  const meta = MILESTONE_STATUS_META[status as MilestoneStatusApi];
  if (!meta) {
    return {
      label: status || t('authority.execution.status_unspecified'),
      className: 'bg-slate-100 text-slate-700 border-slate-200',
      barClassName: 'bg-slate-400',
      iconClassName: 'border-slate-200 bg-slate-100 text-slate-600',
      icon: Clock,
    };
  }
  return {
    ...meta,
    label: t(meta.labelKey),
  };
};"""

content = content.replace(old_gsm, new_gsm)

# Inside ExecutionTracker component:
content = content.replace("const { lang, dir } = useI18n();", "const { t, lang, dir } = useI18n();")

# Replace getStatusMeta calls inside ExecutionTracker:
# getStatusMeta(milestone.status) -> getStatusMeta(milestone.status, t)
content = content.replace("getStatusMeta(milestone.status)", "getStatusMeta(milestone.status, t)")

# 3. Error / Success messages in callbacks
content = content.replace(
    "setError(getApiErrorMessage(err, 'تعذر تحميل مراحل تنفيذ الصفقة. يرجى المحاولة مجدداً.'));",
    "setError(getApiErrorMessage(err, t('authority.execution.load_milestones_error')));"
)
content = content.replace(
    "error: 'يرجى إدخال نسبة إنجاز صحيحة بين 0 و100.',",
    "error: t('authority.execution.err_invalid_pct'),"
)
content = content.replace(
    "error: 'يرجى كتابة بيان الأعمال المنجزة قبل رفع التقرير.',",
    "error: t('authority.execution.err_desc_required'),"
)
content = content.replace(
    "success: data.message || 'تم رفع تقرير الإنجاز بنجاح.',",
    "success: data.message || t('authority.execution.report_uploaded_success'),"
)
content = content.replace(
    "error: getApiErrorMessage(err, 'تعذر رفع تقرير الإنجاز. يرجى المحاولة مجدداً.'),",
    "error: getApiErrorMessage(err, t('authority.execution.report_uploaded_error')),"
)

# 4. Card Header & Progress
content = content.replace(">مراحل تنفيذ الصفقة<", ">{t('authority.execution.card_title')}<")
content = content.replace(
    """            <p className="mt-0.5 text-xs text-gray-500">
              متابعة نسب الإنجاز وتقارير المراحل
              {dealReference ? ` للصفقة ${dealReference}` : ''}.
            </p>""",
    """            <p className="mt-0.5 text-xs text-gray-500">
              {t('authority.execution.card_desc')}
              {dealReference ? ` ${t('authority.execution.for_deal_ref', { ref: dealReference })}` : ''}.
            </p>"""
)

content = content.replace(
    "التقدم الإجمالي · {completedCount} من {milestones.length} مرحلة مكتملة",
    "{t('authority.execution.total_progress', { completed: completedCount, total: milestones.length })}"
)
content = content.replace(
    'aria-label="التقدم الإجمالي لمراحل التنفيذ"',
    'aria-label={t(\'authority.execution.total_progress_aria\')}'
)
content = content.replace(
    "{milestones.length} مرحلة",
    "{t('authority.execution.milestones_count', { count: milestones.length })}"
)

content = content.replace(">تحديث<", ">{t('common.refresh')}<")
content = content.replace(">إعادة المحاولة<", ">{t('common.retry')}<")

content = content.replace(
    'aria-label="جارٍ تحميل مراحل التنفيذ"',
    'aria-label={t(\'authority.execution.loading_aria\')}'
)
content = content.replace(
    '<p className="mt-2 text-sm font-bold text-slate-700">لم تُسجَّل مراحل تنفيذ بعد</p>',
    '<p className="mt-2 text-sm font-bold text-slate-700">{t(\'authority.execution.empty_title\')}</p>'
)

content = content.replace(
    """              {role === 'operator'
                ? 'ستظهر هنا المراحل التي تعدها المصلحة المتعاقدة لمتابعة الإنجاز.'
                : 'ستظهر هنا مراحل التنفيذ المسجلة لهذه الصفقة.'}""",
    """              {role === 'operator'
                ? t('authority.execution.empty_desc_operator')
                : t('authority.execution.empty_desc_authority')}"""
)

content = content.replace(
    'aria-label="الجدول الزمني لمراحل التنفيذ"',
    'aria-label={t(\'authority.execution.timeline_aria\')}'
)

content = content.replace("المرحلة {index + 1}", "{t('authority.execution.milestone_num', { num: index + 1 })}")
content = content.replace("الاستحقاق: {formatDate(milestone.due_date, lang)}", "{t('authority.execution.due_date_label', { date: formatDate(milestone.due_date, lang) })}")
content = content.replace("الإنجاز: {formatDate(milestone.completion_date, lang)}", "{t('authority.execution.completion_date_label', { date: formatDate(milestone.completion_date, lang) })}")
content = content.replace('<div className="text-[11px] font-bold text-gray-500">نسبة التقدم</div>', '<div className="text-[11px] font-bold text-gray-500">{t(\'authority.execution.progress_pct_label\')}</div>')
content = content.replace('aria-label={`نسبة تقدم ${milestone.title}`}', 'aria-label={t(\'authority.execution.progress_aria\', { title: milestone.title })}')

# 5. Reports Section
content = content.replace("تقارير الإنجاز المرفوعة ({reports.length})", "{t('authority.execution.reports_title', { count: reports.length })}")
content = content.replace(">لم يُرفع أي تقرير إنجاز لهذه المرحلة بعد.<", ">{t('authority.execution.no_reports_yet')}<")
content = content.replace("{report.operator_name || 'المتعامل الاقتصادي'}", "{report.operator_name || t('authority.execution.default_operator_name')}")
content = content.replace(">عرض الملف المرفق<", ">{t('authority.execution.view_attachment')}<")

# 6. Upload Form
content = content.replace(">رفع تقرير إنجاز لهذه المرحلة<", ">{t('authority.execution.upload_report_title')}<")
content = content.replace(">نسبة الإنجاز (%)<", ">{t('authority.execution.form_progress_pct')}<")
content = content.replace(">ملف التقرير أو محضر المعاينة (اختياري)<", ">{t('authority.execution.form_file_label')}<")
content = content.replace(">بيان الأعمال المنجزة والملاحظات الميدانية<", ">{t('authority.execution.form_desc_label')}<")
content = content.replace(
    'placeholder="اذكر الأعمال المنجزة فعلياً، نسب التقدم، وأي ملاحظات أو تحفظات..."',
    'placeholder={t(\'authority.execution.form_desc_placeholder\')}'
)
content = content.replace(
    "{form.saving ? 'جاري رفع التقرير...' : 'رفع تقرير الإنجاز'}",
    "{form.saving ? t('authority.execution.btn_uploading') : t('authority.execution.btn_upload')}"
)

with open('client/src/features/execution/components/ExecutionTracker.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied ExecutionTracker transformations successfully.")
