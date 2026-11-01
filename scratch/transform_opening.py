import re

# 1. Clean types.ts and api/opening.ts comments
with open('client/src/features/opening/types.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('// للـ authority فقط', '// for authority only')
text = text.replace('// من الباك إند', '// from backend')
with open('client/src/features/opening/types.ts', 'w', encoding='utf-8') as f:
    f.write(text)

with open('client/src/features/opening/api/opening.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('// إضافات مساعدة لإدارة الجلسة لدى المصلحة المتعاقدة', '// Helper utilities for authority session management')
with open('client/src/features/opening/api/opening.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. useOpening.ts
with open('client/src/features/opening/hooks/useOpening.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = 'import { useI18n } from "@/i18n";\n' + text
text = text.replace('refetchInterval: 3000, // Polling كل 3 ثوان وفق المتطلبات', 'refetchInterval: 3000, // Polling every 3s as required')

text = text.replace(
    """export const useStartSession = () => {
  const qc = useQueryClient();""",
    """export const useStartSession = () => {
  const { t } = useI18n();
  const qc = useQueryClient();"""
)
text = text.replace('toast.success("بدأت الجلسة بنجاح");', 'toast.success(t("opening.toast_session_started"));')
text = text.replace('const msg = err.response?.data?.detail || "فشل بدء الجلسة";', 'const msg = err.response?.data?.detail || t("opening.toast_session_start_failed");')

text = text.replace(
    """export const useOpenOffer = () => {
  const qc = useQueryClient();""",
    """export const useOpenOffer = () => {
  const { t } = useI18n();
  const qc = useQueryClient();"""
)
text = text.replace('toast.success("تم فتح العرض وإعلان السعر بنجاح");', 'toast.success(t("opening.toast_offer_opened"));')
text = text.replace('const msg = err.response?.data?.detail || "فشل تسجيل فتح العرض";', 'const msg = err.response?.data?.detail || t("opening.toast_offer_open_failed");')

text = text.replace(
    """export const useEndSession = () => {
  const qc = useQueryClient();""",
    """export const useEndSession = () => {
  const { t } = useI18n();
  const qc = useQueryClient();"""
)
text = text.replace('toast.success("انتهت الجلسة وتم توثيق الوقائع");', 'toast.success(t("opening.toast_session_ended"));')
text = text.replace('const msg = err.response?.data?.detail || "فشل إنهاء الجلسة";', 'const msg = err.response?.data?.detail || t("opening.toast_session_end_failed");')

text = text.replace(
    """export const useScheduleSession = () => {
  const qc = useQueryClient();""",
    """export const useScheduleSession = () => {
  const { t } = useI18n();
  const qc = useQueryClient();"""
)
text = text.replace('toast.success("تمت برمجة جلسة فتح الأظرفة بنجاح");', 'toast.success(t("opening.toast_session_scheduled"));')
text = text.replace('const msg = err.response?.data?.detail || "فشل برمجة الجلسة";', 'const msg = err.response?.data?.detail || t("opening.toast_session_schedule_failed");')

text = text.replace(
    """export const useOpenEnvelope = () => {
  const qc = useQueryClient();""",
    """export const useOpenEnvelope = () => {
  const { t } = useI18n();
  const qc = useQueryClient();"""
)
text = text.replace(
    """      const typeLabel =
        vars.payload.envelope_type.includes("financial")
          ? "الظرف المالي"
          : "الظرف التقني";
      toast.success(`تم فتح ${typeLabel} بنجاح وبث الوقائع`);""",
    """      const typeLabel =
        vars.payload.envelope_type.includes("financial")
          ? t("opening.envelope_financial")
          : t("opening.envelope_technical");
      toast.success(t("opening.toast_envelope_opened", { type: typeLabel }));"""
)
text = text.replace('const msg = err.response?.data?.detail || "فشل فتح الظرف المحدد";', 'const msg = err.response?.data?.detail || t("opening.toast_envelope_failed");')

with open('client/src/features/opening/hooks/useOpening.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("types.ts, api/opening.ts and useOpening.ts updated successfully.")
