import re

# 1. ObjectionDecisionModal.tsx
with open('client/src/features/objections/components/ObjectionDecisionModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = 'import { useI18n } from "@/i18n";\n' + text

text = text.replace(
    "export function ObjectionDecisionModal({",
    "export function ObjectionDecisionModal({\n  objection,\n  open,\n  onOpenChange,\n  onSuccess,\n}: ObjectionDecisionModalProps) {\n  const { t, lang, dir } = useI18n();"
)
# Remove duplicate signature if needed
text = re.sub(r'export function ObjectionDecisionModal\(\{[^}]+\}: ObjectionDecisionModalProps\) \{\s*const \{ t, lang, dir \} = useI18n\(\);', 'export function ObjectionDecisionModal({\n  objection,\n  open,\n  onOpenChange,\n  onSuccess,\n}: ObjectionDecisionModalProps) {\n  const { t, lang, dir } = useI18n();', text)

text = text.replace("toast.error('يجب كتابة تبرير معلل للقرار (10 أحرف على الأقل).');", "toast.error(t('objections.decision_err_rationale_short'));")
text = text.replace("? 'تم قبول الطعن وإلغاء الإسناد المؤقت وتوثيقه في سجل التدقيق.'", "? t('objections.decision_toast_accepted')")
text = text.replace(": 'تم رفض الطعن وتثبيت قرار الإسناد وتوثيقه في سجل التدقيق.'", ": t('objections.decision_toast_rejected')")
text = text.replace("const msg = err.response?.data?.detail || 'تعذر تسجيل القرار.';", "const msg = err.response?.data?.detail || t('objections.decision_toast_error');")

text = text.replace("<span>إصدار قرار لجنة الصفقات: {objection.reference}</span>", "<span>{t('objections.decision_modal_title', { ref: objection.reference })}</span>")
text = text.replace("الصفقة: {objection.tender_reference} · المُطعِن: {objection.objector_name}", "{t('objections.decision_deal_sub', { deal: objection.tender_reference, objector: objection.objector_name })}")
text = text.replace('>مضمون قرار اللجنة:<', '>{t("objections.decision_content_label")}<')
text = text.replace('>قبول الطعن<', '>{t("objections.decision_accept_title")}<')
text = text.replace('>إلغاء الإسناد المؤقت وإعادة فحص العروض<', '>{t("objections.decision_accept_desc")}<')
text = text.replace('>رفض الطعن<', '>{t("objections.decision_reject_title")}<')
text = text.replace('>تثبيت المنح ومواصلة إجراءات إبرام الصفقة<', '>{t("objections.decision_reject_desc")}<')
text = text.replace('>التسبيب القانوني والحيثيات الصادرة عن اللجنة *<', '>{t("objections.decision_rationale_label")}<')
text = text.replace("placeholder=\"اذكر الأسباب النظامية والحيثيات التي بنت عليها اللجنة قرارها (طبقاً للمادة 72)...\"", "placeholder={t('objections.decision_rationale_placeholder')}")
text = text.replace('>إلغاء<', '>{t("common.cancel")}<')
text = text.replace("{loading ? 'جاري توثيق القرار...' : 'اعتماد وتوثيق قرار اللجنة رسمياً'}", "{loading ? t('objections.decision_btn_saving') : t('objections.decision_btn_submit')}")

with open('client/src/features/objections/components/ObjectionDecisionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. ObjectionDetailModal.tsx
with open('client/src/features/objections/components/ObjectionDetailModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = 'import { useI18n } from "@/i18n";\n' + text
text = text.replace("import { GROUND_LABELS, TYPE_LABELS } from '../types';", "import { getGroundLabel, getTypeLabel } from '../types';")

text = text.replace(
    "export function ObjectionDetailModal({",
    "export function ObjectionDetailModal({\n  objection,\n  open,\n  onOpenChange,\n  onWithdraw,\n  canWithdraw,\n}: ObjectionDetailModalProps) {\n  const { t, lang, dir } = useI18n();"
)
text = re.sub(r'export function ObjectionDetailModal\(\{[^}]+\}: ObjectionDetailModalProps\) \{\s*const \{ t, lang, dir \} = useI18n\(\);', 'export function ObjectionDetailModal({\n  objection,\n  open,\n  onOpenChange,\n  onWithdraw,\n  canWithdraw,\n}: ObjectionDetailModalProps) {\n  const { t, lang, dir } = useI18n();', text)

text = text.replace('مُودع رسمياً', '{t("objections.status_submitted")}')
text = text.replace('قيد الدراسة أمام اللجنة', '{t("objections.badge_under_review")}')
text = text.replace('مقبول — إلغاء الإسناد المؤقت', '{t("objections.badge_accepted_cancel")}')
text = text.replace('مرفوض — تثبيت الإسناد', '{t("objections.badge_rejected_confirm")}')
text = text.replace('مسحوب بطلب المُطعِن', '{t("objections.badge_withdrawn_by_objector")}')

text = text.replace("<span>ملف الطعن: {objection.reference}</span>", "<span>{t('objections.detail_modal_title', { ref: objection.reference })}</span>")
text = text.replace("وفق أحكام المادة 72 من القانون 23-12 المتعلق بالصفقات العمومية", "{t('objections.detail_legal_basis')}")
text = text.replace('>الصفقة محل الطعن:<', '>{t("objections.detail_deal_label")}<')
text = text.replace('>نوع الطعن:<', '>{t("objections.detail_type_label")}<')
text = text.replace('>المُطعِن:<', '>{t("objections.detail_objector_label")}<')
text = text.replace('>تاريخ الإيداع:<', '>{t("objections.detail_deposit_date")}<')
text = text.replace('>السبب الأساسي للطعن:<', '>{t("objections.detail_ground_label")}<')
text = text.replace('GROUND_LABELS[objection.ground]', 'getGroundLabel(objection.ground, t)')
text = text.replace('TYPE_LABELS[objection.objection_type]', 'getTypeLabel(objection.objection_type, t)')

text = text.replace('>تفاصيل الوقائع والحجج القانونية للمُطعِن:<', '>{t("objections.detail_arguments_title")}<')
text = text.replace('>المؤيدات والمستندات المرفقة:<', '>{t("objections.detail_proof_title")}<')
text = text.replace('>لم ترفق ملفات مؤيدة إضافية مع هذا الطعن.<', '>{t("objections.detail_no_files")}<')
text = text.replace('>قرار لجنة الصفقات الصادر:<', '>{t("objections.detail_decision_title")}<')
text = text.replace('>تاريخ البت:<', '>{t("objections.detail_decision_date")}<')
text = text.replace('>حيثيات وأسباب القرار:<', '>{t("objections.detail_decision_rationale")}<')
text = text.replace('>بصمة التوثيق الرقمية (SHA-256):<', '>{t("objections.detail_sha_fingerprint")}<')
text = text.replace('>إغلاق<', '>{t("objections.detail_btn_close")}<')

with open('client/src/features/objections/components/ObjectionDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 3. ObjectionSubmissionModal.tsx
with open('client/src/features/objections/components/ObjectionSubmissionModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = 'import { useI18n } from "@/i18n";\n' + text
text = text.replace("import { GROUND_LABELS, TYPE_LABELS } from '../types';", "import { getGroundLabel, getTypeLabel, GROUND_LABEL_KEYS } from '../types';")

text = text.replace(
    "export function ObjectionSubmissionModal({",
    "export function ObjectionSubmissionModal({\n  open,\n  onOpenChange,\n  onSuccess,\n}: ObjectionSubmissionModalProps) {\n  const { t, lang, dir } = useI18n();"
)
text = re.sub(r'export function ObjectionSubmissionModal\(\{[^}]+\}: ObjectionSubmissionModalProps\) \{\s*const \{ t, lang, dir \} = useI18n\(\);', 'export function ObjectionSubmissionModal({\n  open,\n  onOpenChange,\n  onSuccess,\n}: ObjectionSubmissionModalProps) {\n  const { t, lang, dir } = useI18n();', text)

text = text.replace("toast.error('تعذر جلب الصفقات المتاحة.');", "toast.error(t('objections.submit_err_load_deals'));")
text = text.replace("toast.error('يرجى اختيار الصفقة محل الطعن.');", "toast.error(t('objections.submit_err_deal_required'));")
text = text.replace("toast.error('يرجى اختيار سبب واحد للطعن على الأقل.');", "toast.error(t('objections.submit_err_ground_required'));")
text = text.replace("toast.error('يرجى كتابة تفاصيل الطعن وأسبابه (20 حرفاً على الأقل).');", "toast.error(t('objections.submit_err_desc_short'));")
text = text.replace("toast.success('تم إيداع الطعن وتوثيقه بنجاح مع بصمة SHA-256.');", "toast.success(t('objections.submit_toast_success'));")
text = text.replace("const msg = err.response?.data?.detail || 'تعذر إيداع الطعن. يرجى مراجعة الشروط والآجال.';", "const msg = err.response?.data?.detail || t('objections.submit_toast_error');")

text = text.replace('>إيداع طعن على قرار الإسناد المؤقت<', '>{t("objections.submit_modal_title")}<')
text = text.replace("""المادة 72 من القانون 23-12: يجب إيداع الطعن خلال مهلة 10 أيام من تاريخ الإعلان،
            مع وجوب تقديم عرض مسبق في الصفقة.""", '{t("objections.submit_modal_desc")}')
text = text.replace('>الصفقة المعنية بالطعن:<', '>{t("objections.submit_deal_label")}<')
text = text.replace('>جاري تحميل الصفقات...<', '>{t("objections.submit_loading_deals")}<')
text = text.replace("""لا توجد صفقات مؤهلة للإيداع حالياً (يشترط تقديم عرض منشور له منح مؤقت).""", '{t("objections.submit_no_deals")}')
text = text.replace('<option value="">-- اختر الصفقة --</option>', '<option value="">{t("objections.submit_select_deal")}</option>')
text = text.replace('>أسباب الطعن الموضوعية (حدد كل ما ينطبق) *:<', '>{t("objections.submit_grounds_label")}<')

# Ground checkbox labels: Object.entries(GROUND_LABELS).map(([key, label]) => ...
# replace with Object.entries(GROUND_LABEL_KEYS).map(([key, labelKey]) => ... t(labelKey)
text = text.replace("Object.entries(GROUND_LABELS).map(([key, label]) =>", "Object.entries(GROUND_LABEL_KEYS).map(([key, labelKey]) =>")
text = text.replace("{label}", "{t(labelKey)}")

text = text.replace('>تفاصيل الوقائع والأسباب والطلبات *:<', '>{t("objections.submit_desc_label")}<')
text = text.replace("placeholder=\"اشرح بدقة المخالفة الإجرائية، الأخطاء في حساب العلامات، أو الحيثيات التي تستند إليها في طعنك...\"", "placeholder={t('objections.submit_desc_placeholder')}")
text = text.replace('>المستندات والمؤيدات الثبوتية (اختياري):<', '>{t("objections.submit_files_label")}<')
text = text.replace('>إلغاء<', '>{t("common.cancel")}<')
text = text.replace("{loading ? 'جاري الإيداع والتوثيق...' : 'إيداع وتوثيق الطعن رسمياً'}", "{loading ? t('objections.submit_btn_uploading') : t('objections.submit_btn_confirm')}")

with open('client/src/features/objections/components/ObjectionSubmissionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Objection modals transformed successfully.")
