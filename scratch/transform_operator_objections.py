with open('client/src/features/objections/components/OperatorObjectionsView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = 'import { useI18n } from "@/i18n";\n' + text
text = text.replace("import { GROUND_LABELS, TYPE_LABELS } from '../types';", "import { getGroundLabel, getTypeLabel } from '../types';")

# Inside OperatorObjectionsView
text = text.replace(
    "export function OperatorObjectionsView() {",
    "export function OperatorObjectionsView() {\n  const { t, lang, dir } = useI18n();"
)

# formatRemaining inside or helper
old_fr = """const formatRemaining = (remainingMs: number): string => {
  if (remainingMs <= 0) return 'انقضى الأجل';

  const totalMinutes = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} يوم${hours > 0 ? ` و${hours} ساعة` : ''}`;
  if (hours > 0) return `${hours} ساعة${minutes > 0 ? ` و${minutes} دقيقة` : ''}`;
  return `${Math.max(minutes, 1)} دقيقة`;
};"""

new_fr = """const formatRemaining = (remainingMs: number, t: (k: string, v?: any) => string): string => {
  if (remainingMs <= 0) return t('objections.op_deadline_expired');

  const totalMinutes = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0
      ? t('objections.op_deadline_days_hours', { days, hours })
      : t('objections.op_deadline_days', { days });
  }
  if (hours > 0) {
    return minutes > 0
      ? t('objections.op_deadline_hours_mins', { hours, minutes })
      : t('objections.op_deadline_hours', { hours });
  }
  return t('objections.op_deadline_mins', { minutes: Math.max(minutes, 1) });
};"""

text = text.replace(old_fr, new_fr)

# Update calls to formatRemaining
text = text.replace("formatRemaining(rem)", "formatRemaining(rem, t)")

# Deadline tooltip and format
text = text.replace(
    "title={`آخر أجل: ${formatDeadline(deadlineAt)}`}",
    "title={t('objections.op_deadline_tooltip', { date: formatDeadline(deadlineAt) })}"
)

# Toasts and alerts
text = text.replace("toast.error('تعذر تحميل قائمة الطعون الخاصة بك.');", "toast.error(t('objections.op_load_error'));")
text = text.replace("toast.error('تعذر تحميل تفاصيل الطعن.');", "toast.error(t('objections.op_load_detail_error'));")
text = text.replace(
    "if (!window.confirm('هل أنت متأكد من رغبتك في سحب هذا الطعن؟ الإجراء نهائي ولا يمكن التراجع عنه.')) {",
    "if (!window.confirm(t('objections.op_withdraw_confirm'))) {"
)
text = text.replace("toast.success('تم سحب الطعن وتوثيق الإجراء.');", "toast.success(t('objections.op_withdraw_success'));")
text = text.replace("toast.error(err.response?.data?.detail || 'تعذر سحب الطعن.');", "toast.error(err.response?.data?.detail || t('objections.op_withdraw_error'));")

# Headers & Description
text = text.replace('>سجل الطعون والتظلمات القانونية<', '>{t("objections.op_page_title")}<')
text = text.replace("""متابعة وإيداع الطعون ضد قرارات الإسناد المؤقت طبقاً للمادة 72 من القانون 23-12
            المتعلق بالصفقات العمومية.""", '{t("objections.op_page_desc")}')
text = text.replace('>إيداع طعن جديد<', '>{t("objections.op_btn_new")}<')

# Legal banner
text = text.replace('>المهل القانونية وشروط قبول الطعن (المادة 72 من القانون رقم 23-12):<', '>{t("objections.op_legal_banner_title")}<')
text = text.replace("""يجب إيداع الطعن حصراً خلال مهلة عشرة (10) أيام من تاريخ أول نشر لإعلان المنح
            المؤقت للصفقة. يشترط أن يكون الطاعن قد شارك في الصفقة وقدم عرضاً رسمياً.""", '{t("objections.op_legal_banner_desc")}')

# Filters
text = text.replace('>كافة الطعون<', '>{t("objections.op_filter_all")}<')
text = text.replace('>جارية وقيد الدراسة<', '>{t("objections.op_filter_active")}<')
text = text.replace('>تم الفصل فيها<', '>{t("objections.op_filter_resolved")}<')

# Table columns
text = text.replace('>رقم الطعن<', '>{t("objections.op_table_ref")}<')
text = text.replace('>الصفقة محل الطعن<', '>{t("objections.op_table_deal")}<')
text = text.replace('>موضوع وسبب الطعن<', '>{t("objections.op_table_ground")}<')
text = text.replace('>حالة الطعن<', '>{t("objections.op_table_status")}<')
text = text.replace('>الأجل المتبقي للبت<', '>{t("objections.op_table_deadline")}<')
text = text.replace('>إجراءات<', '>{t("objections.op_table_actions")}<')

# Badges & helper calls
text = text.replace('GROUND_LABELS[obj.ground]', 'getGroundLabel(obj.ground, t)')
text = text.replace('>تفاصيل الملف<', '>{t("objections.op_btn_details")}<')
text = text.replace('>سحب الطعن<', '>{t("objections.op_btn_withdraw")}<')

# Status badge labels inside getStatusBadge
text = text.replace('جديد — مُودع', '{t("objections.badge_new_submitted")}')
text = text.replace('قيد الدراسة أمام اللجنة', '{t("objections.badge_under_review")}')
text = text.replace('مقبول — إلغاء الإسناد', '{t("objections.badge_accepted_cancel")}')
text = text.replace('مرفوض — تثبيت الإسناد', '{t("objections.badge_rejected_confirm")}')
text = text.replace('مسحوب من الطاعن', '{t("objections.badge_withdrawn_by_objector")}')
text = text.replace('مُحال للقضاء', '{t("objections.badge_escalated_judicial")}')

# Empty state
text = text.replace('>لا توجد طعون مودعة لديك<', '>{t("objections.op_empty_title")}<')
text = text.replace("""يمكنك إيداع طعن أمام لجنة الصفقات في حال ملاحظة أي خرق للشروط أو خطأ في تقييم
              العروض خلال مهلة الـ 10 أيام القانونية.""", '{t("objections.op_empty_desc")}')

with open('client/src/features/objections/components/OperatorObjectionsView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("OperatorObjectionsView.tsx updated.")
