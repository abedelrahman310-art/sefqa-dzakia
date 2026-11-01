with open('client/src/features/execution/components/ExecutionTracker.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    """            <Clock className="h-5 w-5 text-emerald-700" />
            مراحل تنفيذ الصفقة
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            متابعة نسب الإنجاز وتقارير المراحل
            {dealReference ? ` للصفقة ${dealReference}` : ''}.
          </p>""",
    """            <Clock className="h-5 w-5 text-emerald-700" />
            {t('authority.execution.card_title')}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {t('authority.execution.card_desc')}
            {dealReference ? ` ${t('authority.execution.for_deal_ref', { ref: dealReference })}` : ''}.
          </p>"""
)

content = content.replace(
    """                      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
                        <Upload className="h-4 w-4" />
                        رفع تقرير إنجاز لهذه المرحلة
                      </div>""",
    """                      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
                        <Upload className="h-4 w-4" />
                        {t('authority.execution.upload_report_title')}
                      </div>"""
)

with open('client/src/features/execution/components/ExecutionTracker.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced last 4 lines in ExecutionTracker.tsx.")
