import type {
  CompetitionScope,
  OperatorDocumentRequirement,
  ProcurementForm,
  ProcurementMethod,
  ProcurementNature,
} from './procurementTemplates';

/**
 * Shapes returned by the procurement API.
 *
 * Mirrors `ProcurementDealSerializer` and `CahierSpecsSerializer` in
 * `backend/apps/procurements/serializers.py`. JSON fields are intentionally
 * typed from the values the authority portal writes and reads back.
 */

export interface BoqItemApi {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export interface AdministrativeClausesApi {
  procurement_nature?: ProcurementNature;
  template_type?: ProcurementNature;
  procurement_method?: ProcurementMethod;
  procurement_form?: ProcurementForm;
  competition_scope?: CompetitionScope;
  procedure_justification?: string;
  statutory_basis?: string;
  supporting_docs_ref?: string;
  template_id?: string | null;
  template_version?: string;
  is_manual_draft?: boolean;
  tax_regime?: 'ttc' | 'ht';
  required_documents?: OperatorDocumentRequirement[];
  general?: string;
  rules?: string;
}

export interface ProcurementTechnicalRequirementsApi {
  details?: string;
  warranty?: string;
  duration?: string;
  items?: BoqItemApi[];
  required_documents?: OperatorDocumentRequirement[];
}

export interface ProcurementFinancialCriteriaApi {
  terms?: string;
  scoring?: string;
}

export interface CahierSpecsApi {
  id: string;
  deal: string;
  administrative_clauses: AdministrativeClausesApi;
  technical_requirements: ProcurementTechnicalRequirementsApi;
  financial_criteria: ProcurementFinancialCriteriaApi;
  is_validated: boolean;
  created_at: string;
}

export interface ProcurementDealApi {
  id: string;
  reference_number: string;
  title: string;
  description: string;
  current_stage: number;
  stage_display?: string;
  estimated_budget: string | number | null;
  wilaya?: string;
  submission_deadline?: string | null;
  created_at: string;
  updated_at: string;
  authority_name?: string;
  authority_entity?: string;
  cahier_specs?: CahierSpecsApi | null;
}

/**
 * Shapes returned by the authority evaluation endpoints.
 *
 * Mirrors `EvaluationDataView`, `EvaluateOfferView` / `OfferViewSet.evaluate`
 * and `ConcludeEvaluationView` in `backend/apps/procurements/views.py` and
 * `backend/apps/bids/views.py`.
 */

export type OfferEvaluationStatusApi =
  | 'pending'
  | 'admitted'
  | 'evaluated'
  | 'rejected';

export interface EvaluationOpportunityApi {
  id: string;
  reference: string;
  reference_number: string;
  title: string;
  description: string;
  authorityName: string;
  authority_name: string;
  estimatedBudget: string | null;
  current_stage: number;
  status: string;
  wilaya: string;
  submissionDeadline: string | null;
  cahierVersion: string;
}

export interface EvaluationOfferApi {
  id: string;
  bidderId: string;
  bidderName: string;
  financialAmount: string | null;
  durationDays: number | null;
  hasDocument: boolean;
  evaluationStatus: OfferEvaluationStatusApi;
  rejectionReason: string | null;
  technicalScore: string | null;
  financialScore: string | null;
  evaluatorNotes: string | null;
  submittedAt: string;
}

export interface EvaluationDataApi {
  opportunity: EvaluationOpportunityApi;
  offers: EvaluationOfferApi[];
}

export interface OfferEvaluationPayloadApi {
  evaluationStatus: OfferEvaluationStatusApi;
  technicalScore?: string;
  financialScore?: string;
  rejectionReason?: string;
  evaluatorNotes?: string;
}

export interface OfferEvaluationResponseApi {
  message: string;
  id: string;
  offer?: Record<string, unknown>;
  status?: 'evaluated' | 'rejected';
  technical_score?: string | null;
  financial_score?: string | null;
  evaluator_notes?: string;
  audit_log_id?: string;
  checksum?: string;
}

export interface ConcludeEvaluationPayloadApi {
  winningOfferId: string;
  method: 'least_cost' | 'best_value';
  observations?: string;
}

export interface ConcludeEvaluationResponseApi {
  message: string;
  dealId: string;
  winningOfferId: string;
}

/**
 * Shapes returned by the contract and execution endpoints in
 * `backend/apps/procurements/views.py`.
 */

export interface ProcurementContractApi {
  id: string;
  deal: string;
  deal_reference: string;
  deal_title: string;
  operator: string;
  operator_name: string;
  operator_email: string;
  contract_number: string;
  contract_pdf: string | null;
  contract_pdf_url: string | null;
  signed_at: string | null;
  status: string;
  amount: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateContractResponseApi {
  message: string;
  contract: ProcurementContractApi;
  deal_status: string;
  current_stage: number;
  audit_log_id: string;
  checksum: string;
}

export type MilestoneStatusApi = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface MilestoneProgressReportApi {
  id: string;
  milestone: string;
  operator: string;
  operator_name: string;
  progress_percentage: number;
  report_text: string;
  report_file: string | null;
  report_file_url: string | null;
  submitted_at: string;
}

export interface MilestoneApi {
  id: string;
  deal: string;
  deal_reference: string;
  title: string;
  description: string;
  amount: string | null;
  due_date: string | null;
  status: MilestoneStatusApi;
  status_display: string;
  completion_date: string | null;
  progress_percentage: number;
  progress_reports: MilestoneProgressReportApi[];
  created_at: string;
  updated_at: string;
}

export interface DealMilestonesResponseApi {
  deal_id: string;
  deal_reference: string;
  milestones: MilestoneApi[];
  count: number;
}

export interface MilestoneProgressReportResponseApi {
  message: string;
  report: MilestoneProgressReportApi;
  milestone: MilestoneApi;
  audit_log_id: string;
  checksum: string;
}
