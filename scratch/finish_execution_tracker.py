with open('client/src/features/execution/components/ExecutionTracker.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Header title & desc
content = content.replace(
    """          <h3
            id="execution-tracker-heading"
            className="flex items-center gap-2 text-sm font-bold text-navy-900"
          >
            <Clock className="h-5 w-5 text-emerald-700" />
            مراحل تنفيذ الصفقة
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            متابعة نسب الإنجاز وتقارير المراحل
            {dealReference ? ` للصفقة ${dealReference}` : ''}.
          </p>""",
    """          <h3
            id="execution-tracker-heading"
            className="flex items-center gap-2 text-sm font-bold text-navy-900"
          >
            <Clock className="h-5 w-5 text-emerald-700" />
            {t('authority.execution.card_title')}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {t('authority.execution.card_desc')}
            {dealReference ? ` ${t('authority.execution.for_deal_ref', { ref: dealReference })}` : ''}.
          </p>"""
)

# 2. Buttons: Refresh & Retry
content = content.replace(
    """          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadMilestones()}
            disabled={loading}
            className="gap-1.5 rounded-xl border-[#D5DDEA] text-xs font-bold text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>""",
    """          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadMilestones()}
            disabled={loading}
            className="gap-1.5 rounded-xl border-[#D5DDEA] text-xs font-bold text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>"""
)

content = content.replace(
    """            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMilestones()}
              className="rounded-lg border-rose-200 bg-white text-[11px] font-bold text-rose-800"
            >
              إعادة المحاولة
            </Button>""",
    """            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMilestones()}
              className="rounded-lg border-rose-200 bg-white text-[11px] font-bold text-rose-800"
            >
              {t('common.retry')}
            </Button>"""
)

# 3. Empty description
content = content.replace(
    """            {role === 'operator'
              ? 'ستظهر هنا المراحل التي تعدها المصلحة المتعاقدة لمتابعة الإنجاز.'
              : 'ستظهر هنا مراحل التنفيذ المسجلة لهذه الصفقة.'}""",
    """            {role === 'operator'
              ? t('authority.execution.empty_desc_operator')
              : t('authority.execution.empty_desc_authority')}"""
)

# 4. Reports and upload
content = content.replace(
    """                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-gray-500">
                          لم يُرفع أي تقرير إنجاز لهذه المرحلة بعد.
                        </p>""",
    """                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-gray-500">
                          {t('authority.execution.no_reports_yet')}
                        </p>"""
)

content = content.replace(
    """                                  <Paperclip className="h-3 w-3" />
                                  عرض الملف المرفق
                                </a>""",
    """                                  <Paperclip className="h-3 w-3" />
                                  {t('authority.execution.view_attachment')}
                                </a>"""
)

content = content.replace(
    """                      <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                        <Upload className="h-4 w-4" />
                        رفع تقرير إنجاز لهذه المرحلة
                      </div>""",
    """                      <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                        <Upload className="h-4 w-4" />
                        {t('authority.execution.upload_report_title')}
                      </div>"""
)

content = content.replace(
    """                          >
                            نسبة الإنجاز (%)
                          </Label>""",
    """                          >
                            {t('authority.execution.form_progress_pct')}
                          </Label>"""
)

content = content.replace(
    """                          >
                            ملف التقرير أو محضر المعاينة (اختياري)
                          </Label>""",
    """                          >
                            {t('authority.execution.form_file_label')}
                          </Label>"""
)

content = content.replace(
    """                        >
                          بيان الأعمال المنجزة والملاحظات الميدانية
                        </Label>""",
    """                        >
                          {t('authority.execution.form_desc_label')}
                        </Label>"""
)

with open('client/src/features/execution/components/ExecutionTracker.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied finish_execution_tracker successfully.")
