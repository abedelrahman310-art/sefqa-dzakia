with open('client/src/pages/authority/AuthorityDealWizard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "          ? 'تمت إحالة الصفقة إلى مرحلة إعداد دفتر الشروط واعتماده الداخلي بنجاح.'\n          : 'تم حفظ ملف الصفقة ودفتر الشروط كمسودة بنجاح.'",
    "          ? t('authority.wizard.toast_promoted_success')\n          : t('authority.wizard.toast_draft_saved_success')"
)

old_officer = """                  <p className="text-gray-500">
                    المسؤول: {user?.email || 'حساب مصلحة معتمد'} · الولاية المعتمدة:{' '}
                    {(user as any)?.wilaya || '16 - الجزائر'}
                  </p>"""
new_officer = """                  <p className="text-gray-500">
                    {t('authority.wizard.s1_officer_label', {
                      email: user?.email || t('authority.wizard.s1_officer_default'),
                      wilaya: (user as any)?.wilaya || '16',
                    })}
                  </p>"""
text = text.replace(old_officer, new_officer)

text = text.replace(
    '                الخطوة 2: اختيار طريقة الإبرام والشكل ومكتبة القوالب\n',
    '                {t(\'authority.wizard.s2_step_eyebrow\')}\n'
)

text = text.replace(
    '                  الخطوة 3: بنود دفتر الشروط وملف المتعهد\n',
    '                  {t(\'authority.wizard.s3_step_eyebrow\')}\n'
)

text = text.replace(
    "                  مراجعة بنود الدفتر المستخرجة من {t('authority.wizard.s2_tpl_selected')}، ضبط جدول الكميات، وتأطير الوثائق المطلوبة من المتنافسين.\n",
    "                  {t('authority.wizard.s3_step_subtitle')}\n"
)

text = text.replace(
    "                    قائمة الوثائق التي يلزم المتنافسون بإيداعها وفق القانون 23-12 و{t('authority.wizard.s2_tpl_selected')}.\n",
    "                    {t('authority.wizard.s3_sec_docs_desc')}\n"
)

text = text.replace(
    '                  بيانات الصفقة\n',
    '                  {t(\'authority.wizard.s4_sum_sec_deal\')}\n'
)

text = text.replace(
    '                  طريقة الإبرام والقالب\n',
    '                  {t(\'authority.wizard.s4_sum_sec_method\')}\n'
)

text = text.replace(
    '                  دفتر الشروط وملف المتعهد\n',
    '                  {t(\'authority.wizard.s4_sum_sec_specs\')}\n'
)

with open('client/src/pages/authority/AuthorityDealWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Done fixing final wizard lines.')
