export type ObjectionType = 'administrative' | 'judicial';

export type ObjectionGround =
  | 'procedural'
  | 'evaluation'
  | 'price'
  | 'capacity'
  | 'conflict'
  | 'discrimination'
  | 'other';

export type ObjectionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'escalated';

export interface ObjectionTimelineItem {
  id: string;
  event: string;
  actor_name: string;
  notes: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ObjectionListItem {
  id: string;
  reference: string;
  tender_reference: string;
  tender_title?: string;
  objector_name: string;
  objection_type: ObjectionType;
  grounds: ObjectionGround[];
  status: ObjectionStatus;
  submitted_at?: string | null;
  deadline_at: string;
  days_remaining: number;
  is_within_deadline?: boolean;
  checksum?: string;
  created_at: string;
}

export interface ObjectionDetailItem extends ObjectionListItem {
  tender: string;
  tender_title?: string;
  objector: string;
  objector_email: string;
  contested_operator?: string | null;
  contested_operator_name?: string | null;
  description: string;
  award_announced_at: string;
  submitted_at: string | null;
  reviewer?: string | null;
  review_started_at?: string | null;
  review_ended_at?: string | null;
  decision?: string;
  decision_reason?: string;
  judicial_reference?: string;
  judicial_court?: string;
  checksum: string;
  objector_ip?: string | null;
  updated_at: string;
  timeline: ObjectionTimelineItem[];
}

export interface CreateObjectionPayload {
  tender_id: string;
  objection_type: ObjectionType;
  grounds: ObjectionGround[];
  description: string;
  contested_operator_id?: string | null;
}

export interface DecideObjectionPayload {
  decision: 'accepted' | 'rejected';
  reason: string;
}

export const GROUND_LABELS: Record<ObjectionGround, string> = {
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
};
