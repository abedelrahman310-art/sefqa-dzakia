import re

with open('client/src/pages/authority/AuthorityDealWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if "import { useI18n } from '@/i18n';" not in content:
    content = content.replace("import { useAuth } from '@/components/auth/AuthProvider';", "import { useAuth } from '@/components/auth/AuthProvider';\nimport { useI18n } from '@/i18n';")

# 2. Add useI18n call inside component
comp_start = "export function AuthorityDealWizard({ dealId, initialStep = 1 }: AuthorityDealWizardProps) {"
replacement_start = """export function AuthorityDealWizard({ dealId, initialStep = 1 }: AuthorityDealWizardProps) {
  const { t, lang, dir } = useI18n();"""
content = content.replace(comp_start, replacement_start)

# 3. Helpers for labels
label_helpers = """
  const getNatureLabel = (natureKey: ProcurementNature) => {
    const map: Record<string, string> = {
      works: t('common.nature.works'),
      supplies: t('common.nature.supplies'),
      services: t('common.nature.services'),
      studies: t('common.nature.studies'),
    };
    return map[natureKey] || NATURE_LABELS[natureKey]?.ar || natureKey;
  };

  const getMethodLabel = (methodKey: string) => {
    const map: Record<string, string> = {
      call_for_tenders: t('authority.wizard.s2_method_call_tenders'),
      negotiated_procedure: t('authority.wizard.s2_method_negotiated'),
    };
    return map[methodKey] || METHOD_LABELS[methodKey]?.ar || methodKey;
  };

  const getFormLabel = (formKey: ProcurementForm) => {
    const map: Record<string, string> = {
      open: t('authority.wizard.s2_form_open'),
      restricted: t('authority.wizard.s2_form_restricted'),
      open_with_minimum_capacities: t('authority.wizard.s2_form_open_min_capacities'),
      two_stage: t('authority.wizard.s2_form_two_stage'),
    };
    return map[formKey] || FORM_LABELS[formKey]?.ar || formKey;
  };
"""

content = content.replace("  const [exportingPdf, setExportingPdf] = useState(false);", "  const [exportingPdf, setExportingPdf] = useState(false);" + label_helpers)

# Replace comments containing Arabic
content = re.sub(r'// 1: بيانات الصفقة \| 2: طريقة الإبرام والقالب.*', '// 1: Deal Data | 2: Method & Template | 3: Specs & Docs | 4: Review & Save', content)
content = re.sub(r'// ─── Step 1 State: بيانات الصفقة الأساسية ───.*', '// ─── Step 1 State: Basic Deal Data ─────────────────────────────────', content)
content = re.sub(r'// ─── Step 2 State: طريقة الإبرام والقالب ───.*', '// ─── Step 2 State: Method & Template ──────────────────────────────────', content)
content = re.sub(r'// ─── Step 3 State: تحضير دفتر الشروط والوثائق ───.*', '// ─── Step 3 State: Specs & Documents ────────────────────────────', content)
content = re.sub(r'// STEP 1: بيانات الصفقة الأساسية.*', '// STEP 1: Basic Deal Data', content)
content = re.sub(r'// STEP 2: طريقة الإبرام والقالب.*', '// STEP 2: Method & Template Selection', content)
content = re.sub(r'// STEP 3: تحضير دفتر الشروط والوثائق.*', '// STEP 3: Cahier Specs & Bidders Dossier', content)
content = re.sub(r'// STEP 4: المراجعة والحفظ.*', '// STEP 4: Review & Save', content)

# Replace initial states
content = content.replace(
    "const [duration, setDuration] = useState('06 أشهر');",
    "const [duration, setDuration] = useState('');"
)
content = content.replace(
    "{ id: '1', name: 'بند أولي يحدد حسب موضوع الصفقة', unit: 'وحدة', quantity: 1, unitPrice: 0 }",
    "{ id: '1', name: '', unit: '', quantity: 1, unitPrice: 0 }"
)

# Replace toast in BOQ
content = content.replace(
    "toast.info(`تم تحديث الميزانية التقديرية لتصبح: ${boqTotal.toLocaleString('ar-DZ')} دج.`);",
    "toast.info(t('authority.wizard.toast_budget_updated', { budget: boqTotal.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') }));"
)

# Replace toast template applied
content = content.replace(
    "toast.success(`تم اختيار وتطبيق القالب: ${tpl.title}`);",
    "toast.success(t('authority.wizard.toast_template_applied', { title: tpl.title }));"
)

# Replace applyManualDraft defaults
content = content.replace(
    "`تحدد هذه الصفقة الشروط الإدارية والتعاقدية المطبقة لإبرام وتنفيذ العملية وفق القانون 23-12.`",
    "t('authority.wizard.default_clause_general')"
)
content = content.replace(
    "`تقديم ملف الترشح والعرض الإداري المنصوص عليه بالمادة 67 من القانون 23-12 شاملاً التصريح بالترشح والنزاهة.`",
    "t('authority.wizard.default_clause_rules')"
)
content = content.replace(
    "setTechDetails(`المواصفات الفنية التفصيلية للأشغال أو الخدمات المطلوبة.`);",
    "setTechDetails(t('authority.wizard.default_clause_tech_details'));"
)
content = content.replace(
    "setTechWarranty(`الضمان التعاقدي وفق الأحكام القانونية والتنظيمية.`);",
    "setTechWarranty(t('authority.wizard.default_clause_warranty'));"
)
content = content.replace(
    "setFinTerms(`شروط الدفع والتسديد والضمانات البنكية المعتمدة.`);",
    "setFinTerms(t('authority.wizard.default_clause_fin_terms'));"
)
content = content.replace(
    "setFinScoring(`معايير التقييم الموضوعية لاختيار العرض الأفضل اقتصادياً.`);",
    "setFinScoring(t('authority.wizard.default_clause_scoring'));"
)

# Default basic documents
content = content.replace(
    "name: 'التصريح بالترشح (الاستمارة الموحدة)',",
    "name: t('authority.wizard.default_doc_candidacy'),"
)
content = content.replace(
    "name: 'التصريح بالنزاهة (الاستمارة الموحدة)',",
    "name: t('authority.wizard.default_doc_integrity'),"
)
content = content.replace(
    "name: 'رسالة التعهد والعرض المالي',",
    "name: t('authority.wizard.default_doc_financial'),"
)
content = content.replace(
    "statutoryBasis: 'المادة 67 من القانون 23-12',",
    "statutoryBasis: t('authority.wizard.default_doc_basis'),"
)

# Toast manual draft started
content = content.replace(
    "toast.info('تم بدء مسودة يدوية مخصصة بدون قالب معتمد.');",
    "toast.info(t('authority.wizard.toast_manual_draft_started'));"
)

# Toast load error
content = content.replace(
    "toast.error('تعذر تحميل بيانات الصفقة.');",
    "toast.error(t('authority.wizard.toast_load_error'));"
)

# Compliance check simulation
content = content.replace(
    "toast.success('تم إجراء فحص الامتثال القانوني بنجاح.');",
    "toast.success(t('authority.wizard.toast_compliance_success'));"
)
content = content.replace(
    "statutory_reference: 'القانون 23-12 المؤرخ في 5 أوت 2023 والمتعلق بالقواعد العامة للصفقات العمومية',",
    "statutory_reference: t('authority.wizard.default_compliance_ref'),"
)
content = content.replace(
    "'هذا التحليل استرشادي تقني مؤتمت، وتبقى السلطة التقديرية الحصرية لمسؤولي المصلحة المتعاقدة ولجنة الصفقات.',",
    "t('authority.wizard.default_compliance_disclaimer'),"
)
content = content.replace(
    "rule: 'المادة 67 - وثائق ملف الترشح',",
    "rule: t('authority.wizard.default_compliance_rule'),"
)
content = content.replace(
    "message: 'تم التحقق من إدراج التصريح بالنزاهة والتصريح بالترشح ضمن الملف الإداري الإلزامي.',",
    "message: t('authority.wizard.default_compliance_msg'),"
)
content = content.replace(
    "recommendation: 'التأكد من اعتماد النماذج الرسمية الصادرة عن وزارة المالية.',",
    "recommendation: t('authority.wizard.default_compliance_rec'),"
)
content = content.replace(
    "toast.info('تم إظهار التدقيق الاستشاري المستند إلى القانون 23-12.');",
    "toast.info(t('authority.wizard.toast_advisory_shown'));"
)

# BOQ add/remove
content = content.replace(
    "toast.warning('يجب الإبقاء على بند واحد على الأقل.');",
    "toast.warning(t('authority.wizard.toast_min_one_boq'));"
)
content = content.replace(
    "{ id: `boq-${Date.now()}`, name: '', unit: 'وحدة', quantity: 1, unitPrice: 0 },",
    "{ id: `boq-${Date.now()}`, name: '', unit: t('authority.wizard.default_boq_unit'), quantity: 1, unitPrice: 0 },"
)
content = content.replace(
    "statutoryBasis: 'متطلب تقديري خاص بالمصلحة المتعاقدة',",
    "statutoryBasis: t('authority.wizard.default_doc_discretionary_basis'),"
)
content = content.replace(
    "toast.success('تمت إضافة الوثيقة التقديرية بنجاح.');",
    "toast.success(t('authority.wizard.toast_doc_added'));"
)
content = content.replace(
    "toast.error(`لا يمكن حذف وثيقة «${doc.name}»؛ فهي مشترطة وجوباً بنص المادة 67 من القانون 23-12.`);",
    "toast.error(t('authority.wizard.toast_doc_cannot_delete', { name: doc.name }));"
)

# Validation toasts
content = content.replace(
    "toast.error('يرجى إدخال عنوان وموضوع الصفقة أولاً.');",
    "toast.error(t('authority.wizard.toast_title_required'));"
)
content = content.replace(
    "? 'تمت إحالة الصفقة إلى مرحلة إعداد دفتر الشروط واعتماده الداخلي بنجاح.'\n            : 'تم حفظ ملف الصفقة ودفتر الشروط كمسودة بنجاح.'",
    "? t('authority.wizard.toast_promoted_success')\n            : t('authority.wizard.toast_draft_saved_success')"
)
content = content.replace(
    "toast.error(err?.response?.data?.detail || 'تعذر حفظ ملف الصفقة. يرجى التحقق من المدخلات.');",
    "toast.error(err?.response?.data?.detail || t('authority.wizard.toast_save_error'));"
)
content = content.replace(
    "toast.success('تم تصدير وتحميل دفتر الشروط بصيغة PDF بنجاح.');",
    "toast.success(t('authority.wizard.toast_pdf_success'));"
)
content = content.replace(
    "toast.error('تعذر تصدير دفتر الشروط.');",
    "toast.error(t('authority.wizard.toast_pdf_error'));"
)

# Checklist
content = content.replace("label: 'عنوان وموضوع الصفقة وطبيعة الطلب',", "label: t('authority.wizard.chk_title'),")
content = content.replace("label: 'نطاق الحاجة ووصف المشروع',", "label: t('authority.wizard.chk_desc'),")
content = content.replace("label: 'طريقة الإبرام والشكل القانوني',", "label: t('authority.wizard.chk_method'),")
content = content.replace(
    "label: needJustif ? 'مبرر اللجوء للإجراء والسند القانوني' : 'المبررات القانونية (غير مطلوبة للطلب المفتوح)',",
    "label: needJustif ? t('authority.wizard.chk_justif_required') : t('authority.wizard.chk_justif_not_required'),"
)
content = content.replace("label: 'اختيار القالب المعتمد أو اعتماد مسودة يدوية',", "label: t('authority.wizard.chk_template'),")
content = content.replace("label: 'بنود دفتر الشروط (الإدارية، الفنية، والمالية)',", "label: t('authority.wizard.chk_clauses'),")
content = content.replace("label: 'تحديد وثائق ملف المتعهد المطلوبة',", "label: t('authority.wizard.chk_docs'),")

# Loading state
content = content.replace('dir="rtl"', 'dir={dir}')
content = content.replace('<span className="text-sm font-medium">جاري تحميل بيانات ملف الصفقة...</span>', '<span className="text-sm font-medium">{t(\'authority.wizard.btn_saving\')}</span>')

# Header
content = content.replace('title="العودة إلى قائمة الصفقات"', "title={t('authority.wizard.nav_back_to_deals')}")
content = content.replace("{referenceNumber || 'ملف صفقة جديد'}", "{referenceNumber || t('authority.wizard.new_deal_ref')}")
content = content.replace('مرحلة 01: التخطيط والاحتياج', "{t('authority.wizard.stage_planning')}")
content = content.replace(
    "{dealId ? (title ? `إعداد ملف الصفقة: ${title}` : 'تعديل ملف الصفقة') : 'إعداد ملف صفقة ودفتر شروط جديد'}",
    "{dealId ? (title ? t('authority.wizard.title_edit', { title }) : t('authority.wizard.title_edit_fallback')) : t('authority.wizard.title_new')}"
)
content = content.replace(
    'معالج تفاعلي من 4 خطوات: بيانات الصفقة ← طريقة الإبرام والقالب ← تحضير دفتر الشروط والوثائق ← المراجعة والحفظ.',
    "{t('authority.wizard.subtitle')}"
)
content = content.replace("<span>{saving ? 'جاري الحفظ...' : 'حفظ كمسودة وفتح الملف'}</span>", "<span>{saving ? t('authority.wizard.btn_saving') : t('authority.wizard.btn_save_draft')}</span>")
content = content.replace("<span>{exportingPdf ? 'جاري التصدير...' : 'تصدير PDF'}</span>", "<span>{exportingPdf ? t('authority.wizard.btn_exporting_pdf') : t('authority.wizard.btn_export_pdf')}</span>")

# Stepper nav
content = content.replace('<nav aria-label="مراحل الإعداد"', '<nav aria-label={t(\'authority.wizard.nav_aria\')}')
content = content.replace("{ step: 1, title: '1. بيانات الصفقة', desc: 'الموضوع، الطبيعة، ونطاق الحاجة' },", "{ step: 1, title: t('authority.wizard.step1_title'), desc: t('authority.wizard.step1_desc') },")
content = content.replace("{ step: 2, title: '2. طريقة الإبرام والقالب', desc: 'الطريقة، الشكل، واختيار القالب' },", "{ step: 2, title: t('authority.wizard.step2_title'), desc: t('authority.wizard.step2_desc') },")
content = content.replace("{ step: 3, title: '3. دفتر الشروط والوثائق', desc: 'صياغة البنود وملف المتعهد' },", "{ step: 3, title: t('authority.wizard.step3_title'), desc: t('authority.wizard.step3_desc') },")
content = content.replace("{ step: 4, title: '4. المراجعة والحفظ', desc: 'فحص النواقص والاعتماد' },", "{ step: 4, title: t('authority.wizard.step4_title'), desc: t('authority.wizard.step4_desc') },")

# Step 1
content = content.replace('<h2 className="text-lg font-bold text-navy-900">الخطوة 1: البيانات العامة وموضوع الصفقة</h2>', '<h2 className="text-lg font-bold text-navy-900">{t(\'authority.wizard.s1_title\')}</h2>')
content = content.replace('حدد موضوع الصفقة، طبيعة الطلب، والتقدير الأولي للميزانية وفق المادة 27 من القانون 23-12.', "{t('authority.wizard.s1_desc')}")
content = content.replace(
    "المصلحة المتعاقدة: {(user as any)?.organizationName || (user as any)?.displayName || 'المصلحة المتعاقدة'}",
    "{t('authority.wizard.s1_authority_label', { org: (user as any)?.organizationName || (user as any)?.displayName || t('authority.wizard.s1_authority_default') })}"
)
content = content.replace(
    "المسؤول: {user?.email || 'حساب مصلحة معتمد'} · الولاية المعتمدة:{' '}\n                {(user as any)?.wilaya || '16 - الجزائر'}",
    "{t('authority.wizard.s1_officer_label', { email: user?.email || t('authority.wizard.s1_officer_default'), wilaya: (user as any)?.wilaya || '16' })}"
)
content = content.replace('بيانات مسترجعة تلقائياً', "{t('authority.wizard.s1_auto_data')}")
content = content.replace('عنوان وموضوع الصفقة العمومية <span className="text-red-500">*</span>', "{t('authority.wizard.s1_deal_title')} <span className=\"text-red-500\">*</span>")
content = content.replace('placeholder="مثال: أشغال تهيئة وصيانة المقرات الإدارية التابعة للمصلحة المتعاقدة..."', "placeholder={t('authority.wizard.s1_deal_title_placeholder')}")
content = content.replace('طبيعة الطلب (صنف الصفقة) <span className="text-red-500">*</span>', "{t('authority.wizard.s1_nature_label')} <span className=\"text-red-500\">*</span>")
content = content.replace('<option value="works">أشغال (بناء، ترميم، هندسة مدنية، منشآت)</option>', '<option value="works">{t(\'authority.wizard.s1_nature_works\')}</option>')
content = content.replace('<option value="supplies">لوازم (اقتناء مواد، أجهزة، تجهيزات ومعدات)</option>', '<option value="supplies">{t(\'authority.wizard.s1_nature_supplies\')}</option>')
content = content.replace('<option value="studies">دراسات (هندسة معمارية، استشارات، مكاتب دراسات)</option>', '<option value="studies">{t(\'authority.wizard.s1_nature_studies\')}</option>')
content = content.replace('<option value="services">خدمات (صيانة، نظافة، أمن، نقل وتأمين)</option>', '<option value="services">{t(\'authority.wizard.s1_nature_services\')}</option>')
content = content.replace('ولاية موقع التنفيذ <span className="text-red-500">*</span>', "{t('authority.wizard.s1_wilaya_exec')} <span className=\"text-red-500\">*</span>")
content = content.replace('التقدير الأولي للميزانية (دج)', "{t('authority.wizard.s1_initial_budget')}")
content = content.replace('placeholder="مثال: 45000000"', "placeholder={t('authority.wizard.s1_budget_placeholder')}")
content = content.replace('دج\n                  </span>', "{t('common.dzd')}\n                  </span>")
content = content.replace('<span className="font-semibold text-gray-600">النظام الجبائي:</span>', '<span className="font-semibold text-gray-600">{t(\'authority.wizard.s1_tax_system\')}</span>')
content = content.replace('<span className="text-[11px] font-bold text-gray-700">شامل للرسوم (TTC)</span>', '<span className="text-[11px] font-bold text-gray-700">{t(\'authority.wizard.s1_ttc\')}</span>')
content = content.replace('<span className="text-[11px] font-bold text-gray-700">خارج الرسوم (HT)</span>', '<span className="text-[11px] font-bold text-gray-700">{t(\'authority.wizard.s1_ht\')}</span>')
content = content.replace(
    "استخدام مجموع جدول الكميات ({boqTotal.toLocaleString('ar-DZ')} دج)",
    "{t('authority.wizard.s1_use_boq_total', { total: boqTotal.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') })}"
)
content = content.replace('مدة الإنجاز أو التسليم المقترحة <span className="text-red-500">*</span>', "{t('authority.wizard.s1_proposed_duration')} <span className=\"text-red-500\">*</span>")
content = content.replace('placeholder="مثال: 06 أشهر، أو 90 يوماً من تاريخ الإشعار بالبدء"', "placeholder={t('authority.wizard.s1_duration_placeholder')}")
content = content.replace('نطاق الحاجة ووصف المشروع <span className="text-red-500">*</span>', "{t('authority.wizard.s1_scope_required')} <span className=\"text-red-500\">*</span>")
content = content.replace('placeholder="صف الاحتياج والأعمال المطلوبة، والهدف المرجو من الصفقة بالتفصيل..."', "placeholder={t('authority.wizard.s1_scope_placeholder')}")
content = content.replace("toast.error('يرجى تحديد عنوان وموضوع الصفقة أولاً للمتابعة.');", "toast.error(t('authority.wizard.s1_title_req_toast'));")
content = content.replace('<span>المتابعة إلى الخطوة 2: طريقة الإبرام والقالب</span>', "<span>{t('authority.wizard.s1_btn_next')}</span>")

# Step 2
content = content.replace('<h2 className="text-lg font-bold text-navy-900">الخطوة 2: اختيار طريقة الإبرام والشكل ومكتبة القوالب</h2>', '<h2 className="text-lg font-bold text-navy-900">{t(\'authority.wizard.s2_step_eyebrow\')}</h2>')
content = content.replace('حدد الإجراء القانوني المعتمد وفق أحكام القانون 23-12 والمرسوم 15-247، واختر القالب المطابق من المكتبة.', "{t('authority.wizard.s2_step_subtitle')}")
content = content.replace('طريقة الإبرام <span className="text-red-500">*</span>', "{t('authority.wizard.s2_method_label')} <span className=\"text-red-500\">*</span>")
content = content.replace('<option value="call_for_tenders">طلب العروض (الأصل العام)</option>', '<option value="call_for_tenders">{t(\'authority.wizard.s2_method_tenders\')}</option>')
content = content.replace('<option value="negotiated_procedure">الإجراء التفاوضي (استثنائي)</option>', '<option value="negotiated_procedure">{t(\'authority.wizard.s2_method_negotiated\')}</option>')
content = content.replace('شكل الإجراء <span className="text-red-500">*</span>', "{t('authority.wizard.s2_form_title')} <span className=\"text-red-500\">*</span>")
content = content.replace('نطاق المنافسة <span className="text-red-500">*</span>', "{t('authority.wizard.s2_scope_title')} <span className=\"text-red-500\">*</span>")
content = content.replace('<option value="national">وطني (للمتعاملين المقيمين في الجزائر)</option>', '<option value="national">{t(\'authority.wizard.s2_scope_national\')}</option>')
content = content.replace('<option value="national_and_international">وطني و/أو دولي (مفتوح للتنافس الدولي)</option>', '<option value="national_and_international">{t(\'authority.wizard.s2_scope_national_international\')}</option>')
content = content.replace('وفق متطلبات المادة 81 من القانون 23-12 (الأفضلية للمنتوج الوطني).', "{t('authority.wizard.s2_scope_art81')}")
content = content.replace('<label className="text-xs font-bold text-gray-400 block">نطاق المنافسة</label>', '<label className="text-xs font-bold text-muted-foreground block">{t(\'authority.wizard.s2_scope_title\')}</label>')
content = content.replace('غير منطبق على الإجراء المباشر', "{t('authority.wizard.s2_scope_not_applicable')}")
content = content.replace(
    "تسجيل مبررات اللجوء للإجراء الاستثنائي ({FORM_LABELS[procurementForm].ar})",
    "{t('authority.wizard.s2_record_justif_title', { form: getFormLabel(procurementForm) })}"
)
content = content.replace(
    'يتطلب هذا الإجراء تسبيباً موضوعياً معتمداً ومطابقاً للشروط المنصوص عليها في القانون 23-12. لا يُعتبر اختيار الإجراء دليلاً تلقائياً على استيفاء شروطه.',
    "{t('authority.wizard.s2_record_justif_desc')}"
)
content = content.replace('مبرر الاختيار والضرورة العملية <span className="text-red-500">*</span>', "{t('authority.wizard.s2_justif_motive_label')} <span className=\"text-red-500\">*</span>")
content = content.replace('placeholder="اذكر بالتفصيل الأسباب التقنية أو الاستعجالية أو القانونية التي تبرر اللجوء لهذا الإجراء..."', "placeholder={t('authority.wizard.s2_justif_motive_placeholder')}")
content = content.replace('<label className="text-[11px] font-bold text-amber-900 block">السند القانوني المعتمد</label>', '<label className="text-[11px] font-bold text-amber-900 block">{t(\'authority.wizard.s2_statutory_basis_label\')}</label>')
content = content.replace('مراجع الوثائق المؤيدة والتراخيص المسبقة', "{t('authority.wizard.s2_supporting_docs_label')}")
content = content.replace('placeholder="مثال: محضر عدم الجدوى رقم 24/05، أو ترخيص السلطة الوصية..."', "placeholder={t('authority.wizard.s2_supporting_docs_placeholder')}")
content = content.replace('<span>مكتبة القوالب المتوافقة مع الاختيارات</span>', "<span>{t('authority.wizard.s2_templates_lib_title')}</span>")
content = content.replace(
    "القوالب المطابقة لطبيعة الطلب ({NATURE_LABELS[procurementNature].ar}) وشكل الإجراء ({FORM_LABELS[procurementForm].ar}).",
    "{t('authority.wizard.s2_templates_lib_desc', { nature: getNatureLabel(procurementNature), form: getFormLabel(procurementForm) })}"
)
content = content.replace('بدء مسودة يدوية مخصصة', "{t('authority.wizard.s2_start_manual_btn')}")
content = content.replace('لا يوجد قالب مراجع مطابق لهذه الاختيارات', "{t('authority.wizard.s2_no_matching_tpl')}")
content = content.replace(
    'لم يتم إدراج قالب نموذجي رسمي معتمد يتطابق تماماً مع توليفة الإجراء والشكل المحددين. يمكنك المتابعة عبر مسودة يدوية مخصصة مع إدخال البنود والوثائق المطلوبة يدوياً.',
    "{t('authority.wizard.s2_no_matching_tpl_desc')}"
)
content = content.replace('متابعة بمسودة يدوية', "{t('authority.wizard.s2_continue_manual')}")
content = content.replace(
    "{TEMPLATE_STATUS_LABELS[tpl.status]?.ar || 'قالب داخلي استرشادي — يحتاج مراجعة'}",
    "TEMPLATE_STATUS_LABELS[tpl.status]?.ar || 'Modèle indicatif'"
)
content = content.replace(
    "النسخة {tpl.version} ({tpl.revisionDate})",
    "{t('authority.wizard.s2_tpl_version', { version: tpl.version, date: tpl.revisionDate })}"
)
content = content.replace("المصدر: {tpl.sourceReference}", "{t('authority.wizard.s2_tpl_source', { source: tpl.sourceReference })}")
content = content.replace("<span>الوثائق المطلوبة: {tpl.requiredDocuments.length} وثائق</span>", "<span>{t('authority.wizard.s2_tpl_required_docs', { count: tpl.requiredDocuments.length })}</span>")
content = content.replace('معاينة القالب', "{t('authority.wizard.s2_tpl_preview')}")
content = content.replace('القالب المختار', "{t('authority.wizard.s2_tpl_selected')}")
content = content.replace("'استخدام هذا القالب'", "t('authority.wizard.s2_tpl_use')")
content = content.replace('الرجوع للخطوة 1', "{t('authority.wizard.s2_btn_prev')}")
content = content.replace("toast.error('يرجى تسجيل مبرر اللجوء للإجراء الاستثنائي للمتابعة.');", "toast.error(t('authority.wizard.s2_justif_required_toast'));")
content = content.replace('<span>المتابعة إلى الخطوة 3: دفتر الشروط والوثائق</span>', "<span>{t('authority.wizard.s2_btn_next')}</span>")

# Step 3
content = content.replace('<h2 className="text-lg font-bold text-navy-900">الخطوة 3: بنود دفتر الشروط وملف المتعهد</h2>', '<h2 className="text-lg font-bold text-navy-900">{t(\'authority.wizard.s3_step_eyebrow\')}</h2>')
content = content.replace('مراجعة بنود الدفتر المستخرجة من القالب المختار، ضبط جدول الكميات، وتأطير الوثائق المطلوبة من المتنافسين.', "{t('authority.wizard.s3_step_subtitle')}")
content = content.replace("<span>{complianceChecking ? 'جاري الفحص...' : 'فحص الامتثال القانوني'}</span>", "<span>{complianceChecking ? t('authority.wizard.s3_compliance_checking') : t('authority.wizard.s3_compliance_btn')}</span>")
content = content.replace('تقرير فحص الامتثال الاستشاري للقانون 23-12', "{t('authority.wizard.s3_compliance_report')}")
content = content.replace('1. الأحكام العامة وشروط المشاركة الإدارية', "{t('authority.wizard.s3_sec_admin')}")
content = content.replace('2. المواصفات الفنية وشروط الاستلام والضمان', "{t('authority.wizard.s3_sec_tech')}")
content = content.replace('3. الشروط المالية ومعايير التقييم والمفاضلة', "{t('authority.wizard.s3_sec_fin')}")
content = content.replace('<h3 className="text-sm font-bold text-navy-900">جدول الكميات والأسعار التقديرية (B.O.Q)</h3>', '<h3 className="text-sm font-bold text-navy-900">{t(\'authority.wizard.s3_boq_title\')}</h3>')
content = content.replace(
    "بيان تقديري لحساب الكلفة الإجمالية (المجموع الحالي: {boqTotal.toLocaleString('ar-DZ')} دج).",
    "{t('authority.wizard.s3_boq_desc', { total: boqTotal.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') })}"
)
content = content.replace('إضافة بند', "{t('authority.wizard.s3_boq_add_btn')}")
content = content.replace('<th className="py-2 px-3">البيان</th>', '<th className="py-2 px-3">{t(\'authority.wizard.s3_boq_th_desc\')}</th>')
content = content.replace('<th className="py-2 px-3 w-24">الوحدة</th>', '<th className="py-2 px-3 w-24">{t(\'authority.wizard.s3_boq_th_unit\')}</th>')
content = content.replace('<th className="py-2 px-3 w-20">الكمية</th>', '<th className="py-2 px-3 w-20">{t(\'authority.wizard.s3_boq_th_qty\')}</th>')
content = content.replace('<th className="py-2 px-3 w-32">السعر الأحادي (دج)</th>', '<th className="py-2 px-3 w-32">{t(\'authority.wizard.s3_boq_th_price\')}</th>')
content = content.replace('<th className="py-2 px-3 w-32 text-end">الإجمالي (دج)</th>', '<th className="py-2 px-3 w-32 text-end">{t(\'authority.wizard.s3_boq_th_total\')}</th>')
content = content.replace('<th className="py-2 px-2 w-10 text-center">حذف</th>', '<th className="py-2 px-2 w-10 text-center">{t(\'authority.wizard.s3_boq_th_delete\')}</th>')
content = content.replace("{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('ar-DZ')} دج", "{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} {t('common.dzd')}")
content = content.replace('ملف المتعهد والوثائق الإلزامية المطلوبة (Bidders Dossier)', "{t('authority.wizard.s3_sec_docs')}")
content = content.replace('قائمة الوثائق التي يلزم المتنافسون بإيداعها وفق القانون 23-12 والقالب المختار.', "{t('authority.wizard.s3_sec_docs_desc')}")
content = content.replace('إلزامية بنص القانون', "{t('authority.wizard.s3_doc_statutory')}")
content = content.replace('تقديرية للمصلحة', "{t('authority.wizard.s3_doc_discretionary')}")
content = content.replace('<p className="text-[11px] text-gray-500">السند: {doc.statutoryBasis}</p>', '<p className="text-[11px] text-muted-foreground">{t(\'authority.wizard.s3_doc_basis\', { basis: doc.statutoryBasis })}</p>')
content = content.replace('شرط خاص: {doc.conditionNotes}', "{t('authority.wizard.s3_doc_cond', { cond: doc.conditionNotes })}")
content = content.replace('title="وثيقة قانونية إلزامية بنص المادة 67 من القانون 23-12"', "title={t('authority.wizard.s3_doc_title_tooltip')}")
content = content.replace('title="حذف الوثيقة التقديرية"', "title={t('authority.wizard.s3_doc_delete_tooltip')}")
content = content.replace('placeholder="إضافة وثيقة إضافية مطلوبة في العرض..."', "placeholder={t('authority.wizard.s3_doc_add_placeholder')}")
content = content.replace('إضافة وثيقة', "{t('authority.wizard.s3_doc_add_btn')}")
content = content.replace('الرجوع للخطوة 2', "{t('authority.wizard.s3_btn_prev')}")
content = content.replace('<span>المتابعة إلى الخطوة 4: المراجعة والحفظ</span>', "<span>{t('authority.wizard.s3_btn_next')}</span>")

# Step 4
content = content.replace('قائمة تدقيق الجاهزية والنواقص (Readiness Checklist)', "{t('authority.wizard.s4_checklist_title')}")
content = content.replace('تحقق من استيفاء المتطلبات الأساسية قبل اعتماد مسودة الصفقة أو تصديرها.', "{t('authority.wizard.s4_checklist_desc')}")
content = content.replace("{allReady ? 'كافة المتطلبات مستوفاة' : 'توجد بنود تحتاج استكمال'}", "{allReady ? t('authority.wizard.s4_all_ready') : t('authority.wizard.s4_needs_completion')}")
content = content.replace('استكمال (الخطوة {item.step})', "{t('authority.wizard.s4_complete_step', { step: item.step })}")
content = content.replace('<h2 className="text-base font-bold text-navy-900">ملخص ملف الصفقة</h2>', '<h2 className="text-base font-bold text-navy-900">{t(\'authority.wizard.s4_summary_title\')}</h2>')
content = content.replace('<p className="text-xs text-gray-500">معاينة شاملة لكافة الخيارات والبنود</p>', '<p className="text-xs text-muted-foreground">{t(\'authority.wizard.s4_summary_desc\')}</p>')
content = content.replace('<div className="font-bold text-navy-900 text-xs">بيانات الصفقة</div>', '<div className="font-bold text-navy-900 text-xs">{t(\'authority.wizard.s4_sum_sec_deal\')}</div>')
content = content.replace('<strong className="text-gray-900">الموضوع:</strong>', '<strong className="text-foreground">{t(\'authority.wizard.s4_sum_subject\')}</strong>')
content = content.replace('<strong className="text-gray-900">طبيعة الطلب:</strong> {NATURE_LABELS[procurementNature].ar}', '<strong className="text-foreground">{t(\'authority.wizard.s4_sum_nature\')}</strong> {getNatureLabel(procurementNature)}')
content = content.replace("<strong className=\"text-gray-900\">الميزانية:</strong>{' '}\n                  {budget ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : 'غير محددة'}", "<strong className=\"text-foreground\">{t('authority.wizard.s4_sum_budget')}</strong>{' '}{budget ? `${parseFloat(budget).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} ${t('common.dzd')}` : t('authority.wizard.s4_sum_unspecified')}")
content = content.replace("<strong className=\"text-gray-900\">الولاية:</strong> ولاية {wilaya}", "<strong className=\"text-foreground\">{t('authority.wizard.s4_sum_wilaya')}</strong> {t('authority.wizard.s4_sum_wilaya_val', { wilaya })}")
content = content.replace('<div className="font-bold text-navy-900 text-xs">طريقة الإبرام والقالب</div>', '<div className="font-bold text-navy-900 text-xs">{t(\'authority.wizard.s4_sum_sec_method\')}</div>')
content = content.replace('<strong className="text-gray-900">الطريقة:</strong> {METHOD_LABELS[procurementMethod].ar}', '<strong className="text-foreground">{t(\'authority.wizard.s4_sum_method\')}</strong> {getMethodLabel(procurementMethod)}')
content = content.replace('<strong className="text-gray-900">الشكل:</strong> {FORM_LABELS[procurementForm].ar}', '<strong className="text-foreground">{t(\'authority.wizard.s4_sum_form\')}</strong> {getFormLabel(procurementForm)}')
content = content.replace(
    "<strong className=\"text-gray-900\">نطاق المنافسة:</strong>{' '}\n                  {competitionScope === 'national' ? 'وطني' : 'وطني ودولي'}",
    "<strong className=\"text-foreground\">{t('authority.wizard.s4_sum_scope')}</strong>{' '}{competitionScope === 'national' ? t('authority.wizard.s4_sum_scope_nat') : t('authority.wizard.s4_sum_scope_intl')}"
)
content = content.replace(
    "<strong className=\"text-gray-900\">القالب:</strong>{' '}\n                  {isManualDraft ? 'مسودة يدوية' : selectedTemplateId || 'نموذجي معتمد'}",
    "<strong className=\"text-foreground\">{t('authority.wizard.s4_sum_template')}</strong>{' '}{isManualDraft ? t('authority.wizard.s4_sum_manual_draft') : selectedTemplateId || t('authority.wizard.s4_sum_approved_tpl')}"
)
content = content.replace('<div className="font-bold text-navy-900 text-xs">دفتر الشروط وملف المتعهد</div>', '<div className="font-bold text-navy-900 text-xs">{t(\'authority.wizard.s4_sum_sec_specs\')}</div>')
content = content.replace("<strong className=\"text-gray-900\">عدد بنود الكميات:</strong> {boqItems.length} بنود", "<strong className=\"text-foreground\">{t('authority.wizard.s4_sum_boq_items')}</strong> {t('authority.wizard.s4_sum_boq_items_count', { count: boqItems.length })}")
content = content.replace("<strong className=\"text-gray-900\">مجموع الكميات:</strong> {boqTotal.toLocaleString('ar-DZ')} دج", "<strong className=\"text-foreground\">{t('authority.wizard.s4_sum_boq_total')}</strong> {boqTotal.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} {t('common.dzd')}")
content = content.replace("<strong className=\"text-gray-900\">الوثائق المطلوبة:</strong> {operatorDocs.length} وثائق", "<strong className=\"text-foreground\">{t('authority.wizard.s4_sum_docs_count')}</strong> {t('authority.wizard.s4_sum_docs_val', { count: operatorDocs.length })}")
content = content.replace("<strong className=\"text-gray-900\">الامتثال القانوني:</strong> القانون رقم 23-12", "<strong className=\"text-foreground\">{t('authority.wizard.s4_sum_compliance')}</strong> {t('authority.wizard.s4_sum_law_val')}")
content = content.replace('<p className="font-bold">تنبيه تنظيمي بشأن التأشيرة والنشر:</p>', '<p className="font-bold">{t(\'authority.wizard.s4_visa_warning_title\')}</p>')
content = content.replace(
    'حفظ المسودة أو إحالتها لا ينشر الإعلان للعموم ولا يفتح إيداع العروض. النشر الرسمي يستوجب استيفاء التأشيرات والمصادقات القانونية من لجنة الصفقات المختصة وفق المادة 52 من القانون 23-12.',
    "{t('authority.wizard.s4_visa_warning_desc')}"
)
content = content.replace('الرجوع للخطوة 3', "{t('authority.wizard.s4_btn_prev')}")
content = content.replace("<span>{exportingPdf ? 'جاري التصدير...' : 'تصدير مسودة دفتر الشروط (PDF)'}</span>", "<span>{exportingPdf ? t('authority.wizard.btn_exporting_pdf') : t('authority.wizard.s4_btn_export_pdf')}</span>")
content = content.replace("<span>{saving ? 'جاري الحفظ...' : 'حفظ كمسودة وفتح الملف'}</span>", "<span>{saving ? t('authority.wizard.btn_saving') : t('authority.wizard.s4_btn_save_draft')}</span>")
content = content.replace('<span>إحالة للمراجعة الداخلية (المرحلة 2)</span>', "<span>{t('authority.wizard.s4_btn_promote')}</span>")

# Template preview modal
content = content.replace(
    "المصدر: {previewingTemplate.sourceReference} · النسخة {previewingTemplate.version} ({previewingTemplate.revisionDate})",
    "{t('authority.wizard.modal_preview_source', { source: previewingTemplate.sourceReference, version: previewingTemplate.version, date: previewingTemplate.revisionDate })}"
)
content = content.replace('<span className="font-bold text-gray-800 block">المراجع القانونية:</span>', '<span className="font-bold text-foreground block">{t(\'authority.wizard.modal_legal_refs\')}</span>')
content = content.replace('<span className="font-bold text-navy-900 block">الأحكام العامة وموضوع الصفقة:</span>', '<span className="font-bold text-navy-900 block">{t(\'authority.wizard.modal_general_provisions\')}</span>')
content = content.replace('<span className="font-bold text-navy-900 block">الوثائق المطلوبة من المتعهد:</span>', '<span className="font-bold text-navy-900 block">{t(\'authority.wizard.modal_required_docs\')}</span>')
content = content.replace('إغلاق المعاينة', "{t('authority.wizard.modal_close')}")
content = content.replace('استخدام هذا القالب', "{t('authority.wizard.modal_use_template')}")

with open('client/src/pages/authority/AuthorityDealWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Transformation written to AuthorityDealWizard.tsx')
