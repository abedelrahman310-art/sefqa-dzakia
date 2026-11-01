export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type InsightCategory =
  | 'fraud_suspicion'
  | 'price_anomaly'
  | 'delay'
  | 'compliance'
  | 'pattern'
  | 'recommendation';

export interface AIInsight {
  id: string;
  severity: SeverityLevel;
  severity_display?: string;
  category: InsightCategory;
  category_display?: string;
  title: string;
  description: string;
  related_tenders?: string[];
  related_authorities?: string[];
  related_operators?: string[];
  recommendation?: string;
  action_url?: string;
  confidence: number;
  is_advisory: boolean;
  human_verification_required: boolean;
  is_resolved: boolean;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolved_by_email?: string | null;
  resolution_notes?: string;
  generated_at: string;
  expires_at?: string | null;
}

export interface AIInsightFilters {
  severity?: string;
  category?: string;
}

export interface GenerateInsightsResponse {
  generated: number;
  is_advisory: boolean;
  insights: AIInsight[];
}

export interface SuspicionItem {
  type: string;
  severity: SeverityLevel;
  confidence?: number;
  title: string;
  description: string;
  recommendation?: string;
  authority_id?: string;
  deal_ids?: string[];
  operator_ids?: string[];
  statutory_violation?: string;
}

export interface SuspicionsResponse {
  is_advisory: boolean;
  human_verification_required: boolean;
  statutory_reference: string;
  total_suspicions: number;
  suspicions: {
    bid_rigging: SuspicionItem[];
    price_manipulation: SuspicionItem[];
    phantom_competition: SuspicionItem[];
    conflict_of_interest: SuspicionItem[];
    [key: string]: SuspicionItem[];
  };
}

export interface SmartAlertItem {
  value: number;
  alert: 'low' | 'medium' | 'high' | 'critical';
  trend?: number;
  message?: string;
}

export interface SmartAlertsResponse {
  is_advisory: boolean;
  alerts: {
    compliance_rate: SmartAlertItem;
    objections: SmartAlertItem;
    critical_tenders: SmartAlertItem;
    delayed_tenders: SmartAlertItem;
    [key: string]: SmartAlertItem;
  };
}

export interface AIHealthResponse {
  provider: string;
  is_available: boolean;
  is_advisory: boolean;
  human_verification_required: boolean;
}

/**
 * A legal reference returned by the RAG assistant.
 *
 * `label` is always present after client-side normalization, even when the
 * backend only returns a plain string (the legacy contract).
 */
export interface LegalArticle {
  id?: string;
  label: string;
  article_number?: string;
  law?: string;
  law_source?: string;
  title?: string;
  content?: string;
  text?: string;
  legal_text?: string;
  similarity_score?: number;
  match_percentage?: string;
}

/**
 * Raw `legal_articles` entry. The RAG backend returns objects containing the
 * full article text, while older backend versions returned plain strings.
 */
export type LegalArticleSource = LegalArticle | string | Record<string, unknown>;

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  role_display?: string;
  content: string;
  sources?: string[];
  legal_articles?: LegalArticle[];
  no_legal_answer?: boolean;
  is_advisory?: boolean;
  created_at?: string;
}

export interface ChatResponse {
  conversation_id: string;
  answer: string;
  reply?: string;
  sources: string[];
  legal_articles?: LegalArticleSource[];
  retrieved_articles?: any[];
  /** Optional top-level full text when the backend returns a single article. */
  legal_text?: string;
  /** Explicit RAG signals used by newer backend versions. */
  found_in_law?: boolean;
  no_answer?: boolean;
  is_advisory: boolean;
  human_verification_required: boolean;
}

export interface TenderAnalysisRequirement {
  category: string;
  title: string;
  detail: string;
}

export type TenderAnalysisSeverity = 'high' | 'medium' | 'low';

export interface TenderAnalysisPoint {
  severity: TenderAnalysisSeverity;
  title: string;
  detail: string;
}

export interface TenderAnalysisDeal {
  id: string;
  reference: string;
  title: string;
  authority: string;
  wilaya: string;
  estimated_budget: string | null;
  submission_deadline: string | null;
  current_stage: number | null;
}

export interface TenderAnalysisResponse {
  deal: TenderAnalysisDeal;
  summary: string;
  key_requirements: TenderAnalysisRequirement[];
  points_of_attention: TenderAnalysisPoint[];
  recommendations: string[];
  legal_references: string[];
  is_advisory: boolean;
  human_verification_required: boolean;
  statutory_reference: string;
}

export interface PriceEstimateRequest {
  template_type: "works" | "supplies" | "services" | "studies";
  category?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  wilaya?: string;
}

export interface PriceEstimateReference {
  wilaya: string;
  unit_price: number;
  year: number;
}

export interface PriceEstimateResponse {
  estimated_min: number;
  estimated_max: number;
  estimated_avg: number;
  currency: "DZD";
  template_type: string;
  template_type_ar: string;
  category: string;
  subcategory?: string;
  unit: string;
  unit_price: number;
  quantity: number;
  wilaya: string;
  wilaya_name: { ar: string; fr: string };
  confidence: number;
  confidence_level: "high" | "medium" | "low";
  margin_percent: number;
  references?: PriceEstimateReference[];
  source: string;
  last_updated?: string;
  is_advisory: boolean;
  human_verification_required: boolean;
  disclaimer?: string;
}

export interface TenderRecommendation {
  tender_id: string;
  reference: string;
  title: string;
  match_score: number;
  match_level: 'excellent' | 'good' | 'fair' | 'low';
  score_breakdown: {
    sector: number;
    wilaya: number;
    budget: number;
    deadline: number;
    experience: number;
  };
  reasons: string[];
  warnings: string[];
  is_advisory: boolean;
}

export interface RecommendationsResponse {
  recommendations: TenderRecommendation[];
  count: number;
  is_advisory: boolean;
  human_verification_required: boolean;
}


