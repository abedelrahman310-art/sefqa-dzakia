with open('client/src/pages/authority/AuthorityDealWizard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace toast promote
text = text.replace(
    """          promoteToSpecs
            ? 'تمت إحالة الصفقة إلى مرحلة إعداد دفتر الشروط واعتماده الداخلي بنجاح.'
            : 'تم حفظ ملف الصفقة ودفتر الشروط كمسودة بنجاح.'""",
    """          promoteToSpecs
            ? t('authority.wizard.toast_promoted_success')
            : t('authority.wizard.toast_draft_saved_success')"""
)

# Replace comments
text = text.replace("STEP 1: بيانات الصفقة الأساسية", "STEP 1: Basic Deal Data")
text = text.replace("STEP 2: طريقة الإبرام والقالب (Method, Form & Template Selection)", "STEP 2: Method, Form & Template Selection")
text = text.replace("STEP 3: تحضير دفتر الشروط والوثائق (Cahier Specs & Bidders Dossier)", "STEP 3: Cahier Specs & Bidders Dossier")
text = text.replace("STEP 4: المراجعة والحفظ (Review & Save)", "STEP 4: Review & Save")

# Officer label in Step 1
old_officer = """              المسؤول: {user?.email || 'حساب مصلحة معتمد'} · الولاية المعتمدة:{' '}
              {(user as any)?.wilaya || '16 - الجزائر'}"""
new_officer = """              {t('authority.wizard.s1_officer_label', {
                email: user?.email || t('authority.wizard.s1_officer_default'),
                wilaya: (user as any)?.wilaya || '16',
              })}"""
text = text.replace(old_officer, new_officer)

# Step 2 header
text = text.replace(
    '<h2 className="text-lg font-bold text-navy-900">الخطوة 2: اختيار طريقة الإبرام والشكل ومكتبة القوالب</h2>',
    '<h2 className="text-lg font-bold text-navy-900">{t(\'authority.wizard.s2_step_eyebrow\')}</h2>'
)

# Step 3 header & subtitle
text = text.replace(
    '<h2 className="text-lg font-bold text-navy-900">الخطوة 3: بنود دفتر الشروط وملف المتعهد</h2>',
    '<h2 className="text-lg font-bold text-navy-900">{t(\'authority.wizard.s3_step_eyebrow\')}</h2>'
)
old_s3_sub = """          <p className="text-xs text-gray-500">
            مراجعة بنود الدفتر المستخرجة من {t('authority.wizard.s2_tpl_selected')}، ضبط جدول الكميات، وتأطير الوثائق المطلوبة من المتنافسين.
          </p>"""
new_s3_sub = """          <p className="text-xs text-muted-foreground">
            {t('authority.wizard.s3_step_subtitle')}
          </p>"""
text = text.replace(old_s3_sub, new_s3_sub)

old_docs_sub = """          <p className="text-xs text-gray-500">
            قائمة الوثائق التي يلزم المتنافسون بإيداعها وفق القانون 23-12 و{t('authority.wizard.s2_tpl_selected')}.
          </p>"""
new_docs_sub = """          <p className="text-xs text-muted-foreground">
            {t('authority.wizard.s3_sec_docs_desc')}
          </p>"""
text = text.replace(old_docs_sub, new_docs_sub)

# Step 4 sections
text = text.replace('<div className="font-bold text-navy-900 text-xs">بيانات الصفقة</div>', '<div className="font-bold text-navy-900 text-xs">{t(\'authority.wizard.s4_sum_sec_deal\')}</div>')
text = text.replace('<div className="font-bold text-navy-900 text-xs">طريقة الإبرام والقالب</div>', '<div className="font-bold text-navy-900 text-xs">{t(\'authority.wizard.s4_sum_sec_method\')}</div>')
text = text.replace('<div className="font-bold text-navy-900 text-xs">دفتر الشروط وملف المتعهد</div>', '<div className="font-bold text-navy-900 text-xs">{t(\'authority.wizard.s4_sum_sec_specs\')}</div>')

with open('client/src/pages/authority/AuthorityDealWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated AuthorityDealWizard.tsx')
