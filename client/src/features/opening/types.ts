export type SessionStatus = "scheduled" | "live" | "ended" | "cancelled";
export type AccessPolicy = "participants_only" | "authority_only" | "public";
export type EventType =
  | "offer_opened"
  | "offer_rejected"
  | "session_paused"
  | "session_resumed"
  | "session_ended"
  | "session_started";

export interface OpeningSessionList {
  id: string;
  tender_id?: string;
  tender_reference: string;
  tender_title: string;
  scheduled_at: string;
  status: SessionStatus;
  status_display?: string;
  access_policy: AccessPolicy;
  access_policy_display?: string;
  total_offers: number;
  opened_count: number;
  location?: string;
}

export interface OpeningEvent {
  id: string;
  event_type: EventType;
  order: number | null;
  announced_price: number | null;
  is_accepted: boolean;
  notes: string;
  created_at: string;
  is_my_offer?: boolean;
  operator_display?: string; // for authority only
  operator_label?: string; // from backend
  offer_id?: string;
}

export interface OpeningSessionDetail {
  id: string;
  tender_id?: string;
  tender_reference: string;
  tender_title: string;
  authority_name?: string;
  authority_entity?: string;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  location: string;
  stream_url?: string;
  recording_url?: string;
  status: SessionStatus;
  status_display?: string;
  access_policy: AccessPolicy;
  access_policy_display?: string;
  total_offers: number;
  opened_count: number;
  events: OpeningEvent[];
  created_at: string;
}

export interface ScheduleSessionPayload {
  tender_id: string;
  scheduled_at: string;
  location: string;
  stream_url?: string;
}

export interface OpenOfferPayload {
  offer_id: string;
  announced_price: number;
  is_accepted: boolean;
  notes?: string;
}

export interface EligibleTender {
  id: string;
  title: string;
  reference_number?: string;
  reference?: string;
  current_stage?: number;
  status?: string;
}

export interface DealOfferSummary {
  id: string;
  deal?: string;
  operator_name?: string;
  operator?: string;
  status?: string;
  financial_amount?: number | string | null;
  submission_timestamp?: string;
  created_at?: string;
}
