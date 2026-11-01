import re

# 1. Update types.ts
with open('client/src/features/objections/types.ts', 'r', encoding='utf-8') as f:
    text = f.read()

old_labels = """export const GROUND_LABELS: Record<ObjectionGround, string> = {
  procedural: 'مخالفة إجرائية',
  evaluation: 'خطأ في التقييم والتنقيط',
  price: 'سعر غير منطقي أو منخفض بشكل غير عادي',
  capacity: 'عدم استيفاء شروط القدرات والتأهيل',
  conflict: 'تنازع مصالح',
  discrimination: 'تمييز غير قانوني ومساس بالمساواة',
  other: 'أسباب قانونية أخرى',
};

export const TYPE_LABELS: Record<ObjectionType, string> = {
  administrative: 'طعن إداري أمام لجنة الصفقات',
  judicial: 'طعن قضائي أمام المحكمة الإدارية',
};

export const STATUS_LABELS: Record<ObjectionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'outline' },
  submitted: { label: 'مُودع رسمياً', variant: 'secondary' },
  under_review: { label: 'قيد الدراسة', variant: 'default' },
  accepted: { label: 'مقبول — إلغاء الإسناد', variant: 'default' },
  rejected: { label: 'مرفوض — تثبيت الإسناد', variant: 'destructive' },
  withdrawn: { label: 'مسحوب', variant: 'outline' },
  escalated: { label: 'مُحال للقضاء', variant: 'outline' },
};"""

new_labels = """export const GROUND_LABEL_KEYS: Record<ObjectionGround, string> = {
  procedural: 'objections.ground_procedural',
  evaluation: 'objections.ground_evaluation',
  price: 'objections.ground_price',
  capacity: 'objections.ground_capacity',
  conflict: 'objections.ground_conflict',
  discrimination: 'objections.ground_discrimination',
  other: 'objections.ground_other',
};

export const TYPE_LABEL_KEYS: Record<ObjectionType, string> = {
  administrative: 'objections.type_administrative',
  judicial: 'objections.type_judicial',
};

export const STATUS_LABEL_KEYS: Record<
  ObjectionStatus,
  { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  draft: { labelKey: 'objections.status_draft', variant: 'outline' },
  submitted: { labelKey: 'objections.status_submitted', variant: 'secondary' },
  under_review: { labelKey: 'objections.status_under_review', variant: 'default' },
  accepted: { labelKey: 'objections.status_accepted', variant: 'default' },
  rejected: { labelKey: 'objections.status_rejected', variant: 'destructive' },
  withdrawn: { labelKey: 'objections.status_withdrawn', variant: 'outline' },
  escalated: { labelKey: 'objections.status_escalated', variant: 'outline' },
};

export const getGroundLabel = (ground: ObjectionGround, t: (k: string) => string): string =>
  t(GROUND_LABEL_KEYS[ground] || 'objections.ground_other');

export const getTypeLabel = (type: ObjectionType, t: (k: string) => string): string =>
  t(TYPE_LABEL_KEYS[type] || 'objections.type_administrative');

export const getStatusMeta = (
  status: ObjectionStatus,
  t: (k: string) => string
): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  const meta = STATUS_LABEL_KEYS[status];
  return {
    label: meta ? t(meta.labelKey) : status,
    variant: meta ? meta.variant : 'outline',
  };
};"""

text = text.replace(old_labels, new_labels)
with open('client/src/features/objections/types.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("types.ts in objections updated.")
