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

export const GROUND_LABEL_KEYS: Record<ObjectionGround, string> = {
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
};
