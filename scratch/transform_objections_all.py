import re

# 1. AuthorityObjectionsView.tsx
with open('client/src/features/objections/components/AuthorityObjectionsView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = 'import { useI18n } from "@/i18n";\n' + text
text = text.replace("import { GROUND_LABELS } from '../types';", "import { getGroundLabel } from '../types';")

# Inside AuthorityObjectionsView
text = text.replace(
    "export function AuthorityObjectionsView() {",
    "export function AuthorityObjectionsView() {\n  const { t, lang, dir } = useI18n();"
)

# Status badges
text = text.replace('جديد — مُودع', '{t("objections.badge_new_submitted")}')
text = text.replace('قيد الدراسة أمام اللجنة', '{t("objections.badge_under_review")}')
text = text.replace('مقبول — إلغاء الإسناد', '{t("objections.badge_accepted_cancel")}')
text = text.replace('مرفوض — تثبيت الإسناد', '{t("objections.badge_rejected_confirm")}')
text = text.replace('مسحوب من الطاعن', '{t("objections.badge_withdrawn_by_objector")}')
text = text.replace('مُحال للقضاء', '{t("objections.badge_escalated_judicial")}')

# Toasts
text = text.replace("toast.error('تعذر تحميل قائمة الطعون الواردة للمصلحة المتعاقدة.');", "toast.error(t('objections.auth_load_error'));")
text = text.replace("toast.success('تم تسجيل بدء دراسة الطعن وتوثيق الإجراء في سجل التدقيق.');", "toast.success(t('objections.auth_start_review_success'));")
text = text.replace("toast.error(err.response?.data?.detail || 'تعذر بدء دراسة الطعن.');", "toast.error(err.response?.data?.detail || t('objections.auth_start_review_error'));")
text = text.replace("toast.error('تعذر تحميل تفاصيل الطعن.');", "toast.error(t('objections.auth_load_detail_error'));")

# Headers & Description
text = text.replace('>إدارة الطعون ونزاعات الإسناد المؤقت<', '>{t("objections.auth_page_title")}<')
text = text.replace("""معالجة وفحص الطعون المودعة من قبل المتعاملين الاقتصاديين وفقاً للمادة 72 من القانون رقم 23-12.""", '{t("objections.auth_page_desc")}')
text = text.replace('>تحديث السجل<', '>{t("objections.auth_btn_refresh")}<')

# Suspensive alert
text = text.replace('>الأثر الواقف للطعن والمهل القانونية (المادة 72 من القانون 23-12):<', '>{t("objections.auth_suspensive_title")}<')
text = text.replace("""إيداع الطعن يوقف وجوباً إبرام الصفقة وتوقيع العقد حتى صدور قرار لجنة الصفقات
                المختصة في أجل 15 يوماً. أي إبرام خلال فترة الطعن يعد باطلاً بطلاناً مطلقاً.""", '{t("objections.auth_suspensive_desc")}')

# Stats
text = text.replace('>إجمالي الطعون الواردة<', '>{t("objections.auth_stat_total")}<')
text = text.replace('>قيد الدراسة أمام اللجنة<', '>{t("objections.auth_stat_under_review")}<')
text = text.replace('>طعون مقبولة (إلغاء)<', '>{t("objections.auth_stat_accepted")}<')
text = text.replace('>طعون مرفوضة (تثبيت)<', '>{t("objections.auth_stat_rejected")}<')

# Filters
text = text.replace('>كافة الحالات<', '>{t("objections.auth_filter_all")}<')
text = text.replace('>جديد ومُودع<', '>{t("objections.auth_filter_new")}<')
text = text.replace('>قيد الدراسة<', '>{t("objections.auth_filter_under_review")}<')
text = text.replace('>مقبول<', '>{t("objections.auth_filter_accepted")}<')
text = text.replace('>مرفوض<', '>{t("objections.auth_filter_rejected")}<')
text = text.replace('>مُحال للقضاء<', '>{t("objections.auth_filter_escalated")}<')
text = text.replace("placeholder=\"بحث برقم الطعن، مرجع الصفقة، أو اسم المتعامل...\"", "placeholder={t('objections.auth_search_placeholder')}")

# Table columns
text = text.replace('>رقم الطعن<', '>{t("objections.auth_table_ref")}<')
text = text.replace('>الصفقة المعنية<', '>{t("objections.auth_table_deal")}<')
text = text.replace('>المتعامل الطاعن<', '>{t("objections.auth_table_objector")}<')
text = text.replace('>سبب الطعن الأساسي<', '>{t("objections.auth_table_ground")}<')
text = text.replace('>الحالة<', '>{t("objections.auth_table_status")}<')
text = text.replace('>تاريخ الإيداع<', '>{t("objections.auth_table_date")}<')
text = text.replace('>إجراءات<', '>{t("objections.auth_table_actions")}<')

# Actions
text = text.replace('GROUND_LABELS[obj.ground]', 'getGroundLabel(obj.ground, t)')
text = text.replace('>بدء الدراسة<', '>{t("objections.auth_btn_start_review")}<')
text = text.replace('>عرض الملف<', '>{t("objections.auth_btn_view_details")}<')
text = text.replace('>إصدار القرار<', '>{t("objections.auth_btn_issue_decision")}<')

# Empty state
text = text.replace('>لا توجد طعون مسجلة حالياً<', '>{t("objections.auth_empty_title")}<')
text = text.replace('>لم يتم إيداع أي طعن من قبل المتعاملين على صفقات هذه المصلحة حتى الآن.<', '>{t("objections.auth_empty_desc")}<')

# Fix date format
text = text.replace("new Date(obj.submitted_at).toLocaleDateString('ar-DZ')", "new Date(obj.submitted_at).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')")

with open('client/src/features/objections/components/AuthorityObjectionsView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("AuthorityObjectionsView.tsx updated.")
