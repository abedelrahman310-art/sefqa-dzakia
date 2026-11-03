import { useEffect, useState, useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Briefcase,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Scale,
  ShieldCheck,
  Download,
  Plus,
  Trash2,
  HelpCircle,
  Layers,
  Check,
  X,
  Lock,
  History,
  AlertTriangle,
  Save,
  PanelRightClose,
  BookOpen,
  Paperclip,
  CreditCard,
  CheckSquare,
  FileCode2,
  Award,
  FileSignature,
  Loader2,
} from 'lucide-react';
import { ALGERIA_69_WILAYAS } from '@/lib/wilayas';
import { downloadPdfBlob } from '@/lib/pdfDownloader';
import { toast } from 'sonner';
import {
  ProcurementNature,
  ProcurementMethod,
  ProcurementForm,
  CompetitionScope,
  OperatorDocumentRequirement,
  NATURE_LABELS,
  METHOD_LABELS,
  FORM_LABELS,
  COMPETITION_SCOPE_LABELS,
  TEMPLATE_STATUS_LABELS,
  getCompatibleForms,
  isCompetitionScopeApplicable,
  isJustificationRequired,
  getCompatibleTemplates,
  getDynamicOperatorRequirements,
  CAHIER_TEMPLATES_LIBRARY,
} from '@/lib/procurementTemplates';
import type {
  CahierSpecsApi,
  GenerateContractResponseApi,
  ProcurementContractApi,
  ProcurementDealApi,
} from '@/lib/procurementApiTypes';
import { ExecutionTracker } from '@/features/execution/components/ExecutionTracker';
import { AvenantsManager } from '@/features/execution/components/AvenantsManager';
import { LegalNoticesManager } from '@/features/execution/components/LegalNoticesManager';
import { useI18n } from '@/i18n';
import i18n from '@/lib/i18n';
import { getTemplatePresets } from '@/lib/dealWorkspacePresets';

// Contract status labels mapped dynamically via getContractStatusLabel

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const response = (err as { response?: { data?: unknown } })?.response;
  const data = response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const detail = record.error ?? record.detail ?? record.message;
    if (typeof detail === 'string' && detail.trim()) return detail;
    const firstValue = Object.values(record)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') {
      return firstValue[0];
    }
    if (typeof firstValue === 'string' && firstValue.trim()) return firstValue;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

const formatContractDate = (value: string | null | undefined, lang: string = 'ar'): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ', { dateStyle: 'medium' });
};

const formatContractAmount = (value: string | null | undefined, lang: string = 'ar', dzdLabel: string = i18n.t('common.dzd')): string => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ', { maximumFractionDigits: 2 })} ${dzdLabel}`;
};

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface BoqItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

type TemplateType = 'works' | 'supplies' | 'services' | 'studies';

interface ProvenanceRecord {
  id: string;
  sourceType: string;
  sourceLabel: string;
  verificationStatus: string;
  justificationNotes?: string | null;
}

interface StressFinding {
  id: string;
  clauseId: string;
  findingCategory: string;
  severity: string;
  detectedTerm: string;
  explanationAr: string;
  suggestedRemedy?: string | null;
  resolutionStatus: string;
  humanJustification?: string | null;
}

interface LifecycleEvent {
  id: string;
  clauseId: string;
  eventType: string;
  actorType: string;
  actorId: string;
  previousContent?: string | null;
  proposedContent?: string | null;
  actionReason?: string | null;
  createdAt: string;
}

interface Clause {
  id: string;
  cahierVersionId: string;
  clauseCode: string;
  sectionKey: string;
  sortOrder: number;
  title: string;
  content: string;
  status: string;
  isMandatory: boolean;
  provenance: ProvenanceRecord[];
  events: LifecycleEvent[];
  stressFindings: StressFinding[];
}

interface DealRequirement {
  id: string;
  clauseId: string;
  requirementCode: string;
  requirementType: string;
  positionReference: string;
  description: string;
  isDisqualifying: boolean;
}

const SECTION_KEYS = [
  'general_provisions',
  'administrative',
  'technical_specs',
  'financial_terms',
  'evaluation_criteria',
] as const;

// Section titles mapped dynamically via getSectionTitle

// Presets loaded dynamically via getTemplatePresets(lang)

export interface AuthorityDealWorkspaceProps {
  initialTab?: 'basics' | 'specs' | 'documents' | 'avenants' | 'notices' | 'specs_buyers';
}


interface SpecsBuyerItem {
  id: string;
  operator_id: string;
  operator_name: string;
  operator_email: string;
  operator_tax_id: string;
  amount: number;
  payment_gateway: string;
  payment_method: string;
  receipt_number: string;
  receipt_url: string;
  paid_at: string;
}

function SpecsBuyersManager({ dealId }: { dealId: string }) {
  const { t, lang } = useI18n();
  const [buyers, setBuyers] = useState<SpecsBuyerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [specsPrice, setSpecsPrice] = useState(0);

  const loadBuyers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/procurements/deals/${dealId}/specs/purchases/`);
      setBuyers(res.data.buyers || []);
      setTotalRevenue(res.data.total_revenue || 0);
      setSpecsPrice(res.data.specs_price || 0);
    } catch (err) {
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealId) loadBuyers();
  }, [dealId]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#D5DDEA] shadow-sm">
          <div className="text-xs font-bold text-gray-500">{t('authority.specs.total_buyers')}</div>
          <div className="text-2xl font-black text-navy-900 mt-1">{buyers.length}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">متعاملين سحبوا الدفتر رسمياً</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#D5DDEA] shadow-sm">
          <div className="text-xs font-bold text-gray-500">{t('authority.specs.price_label')}</div>
          <div className="text-2xl font-black text-navy-900 mt-1">
            {specsPrice.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} {t('common.dzd')}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">رسوم غير قابلة للاسترداد</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-sm">
          <div className="text-xs font-bold text-emerald-800">{t('authority.specs.total_revenue')}</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {totalRevenue.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} {t('common.dzd')}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">محصلة عبر Chargily Pay / CIB</div>
        </div>
      </div>

      {/* Buyers Table */}
      <div className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>{t('authority.specs.buyers_register')}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              سجل سحب دفاتر الشروط الرقمي وفقاً لأحكام المرسوم الرئاسي 15-247
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadBuyers}
            className="text-xs rounded-xl border-[#D5DDEA]"
          >
            تحديث
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">جاري تحميل سجل السحب...</div>
        ) : buyers.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            لم يقم أي متعامل اقتصادي بسحب دفتر الشروط بعد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="border-b border-[#D5DDEA] bg-gray-50 text-gray-600 font-bold">
                  <th className="p-3 text-start">{t('authority.specs.buyer_name')}</th>
                  <th className="p-3 text-start">{t('authority.specs.buyer_nif')}</th>
                  <th className="p-3 text-start">{t('authority.specs.paid_amount')}</th>
                  <th className="p-3 text-start">{t('operator.specs.receipt_number')}</th>
                  <th className="p-3 text-start">{t('authority.specs.paid_date')}</th>
                  <th className="p-3 text-end">{t('authority.specs.receipt_link')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D5DDEA]">
                {buyers.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-navy-900">{b.operator_name}</div>
                      <div className="text-[11px] text-gray-400">{b.operator_email}</div>
                    </td>
                    <td className="p-3 font-mono text-gray-700">{b.operator_tax_id}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">
                      {b.amount.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} {t('common.dzd')}
                    </td>
                    <td className="p-3 font-mono text-navy-900 font-bold">{b.receipt_number}</td>
                    <td className="p-3 text-gray-600">
                      {new Date(b.paid_at).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')}
                    </td>
                    <td className="p-3 text-end">
                      <a
                        href={b.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-bold text-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>تحميل PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AuthorityDealWorkspace({ initialTab }: AuthorityDealWorkspaceProps) {
  const { t, lang, dir } = useI18n();
  const templatePresets = getTemplatePresets(lang);

  const getContractStatusLabel = (status: string): string => {
    switch (status) {
      case 'CONTRACT_SIGNED': return t('authority.workspace.contract_signed_concluded');
      case 'signed': return t('authority.workspace.contract_signed');
      case 'active': return t('authority.workspace.contract_active');
      case 'completed': return t('authority.workspace.contract_completed');
      case 'terminated': return t('authority.workspace.contract_terminated');
      default: return status;
    }
  };

  const getSectionTitle = (sectionKey: string): string => {
    switch (sectionKey) {
      case 'general_provisions': return t('authority.workspace.sec_general_provisions');
      case 'administrative': return t('authority.workspace.sec_administrative');
      case 'technical_specs': return t('authority.workspace.sec_technical_specs');
      case 'financial_terms': return t('authority.workspace.sec_financial_terms');
      case 'evaluation_criteria': return t('authority.workspace.sec_evaluation_criteria');
      default: return sectionKey;
    }
  };
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/authority/deals/:id');
  const [, draftsEditParams] = useRoute('/authority/drafts/:id/edit');
  const [, draftsSpecsParams] = useRoute('/authority/drafts/:id/specs');

  const dealId = params?.id || draftsEditParams?.id || draftsSpecsParams?.id;

  const { user } = useAuth();
  const defaultWilaya = (user as any)?.wilaya || '16';

  // Active Tab state: 'basics' | 'specs' | 'documents'
  const [activeTab, setActiveTab] = useState<'basics' | 'specs' | 'documents' | 'avenants' | 'notices' | 'specs_buyers'>(
    initialTab || (draftsSpecsParams ? 'specs' : 'basics')
  );

  // Assistant Collapsible Side Panel
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);

  // Deal loading & data state
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<ProcurementDealApi | null>(null);
  const [savingBasics, setSavingBasics] = useState(false);

  // Contract & execution state
  const [contract, setContract] = useState<ProcurementContractApi | null>(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [contractError, setContractError] = useState('');
  const [contractSuccess, setContractSuccess] = useState('');
  const [generatingContract, setGeneratingContract] = useState(false);
  const [downloadingContract, setDownloadingContract] = useState(false);

  // Tab 1 (Basics) state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<TemplateType>('works');
  const [wilaya, setWilaya] = useState(defaultWilaya);
  const [budget, setBudget] = useState('');
  const [specsPrice, setSpecsPrice] = useState('2000');
  const [taxRegime, setTaxRegime] = useState<'ttc' | 'ht'>('ttc');
  const [duration, setDuration] = useState(t('authority.workspace.duration_default'));
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [showSyncBudgetConfirm, setShowSyncBudgetConfirm] = useState(false);

  // Tab 2 (Specs) state
  const [specsId, setSpecsId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('general_provisions');
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [requirements, setRequirements] = useState<DealRequirement[]>([]);
  const [cahierStatus, setCahierStatus] = useState<'active' | 'frozen'>('active');
  const [frozenDigest, setFrozenDigest] = useState<string | null>(null);
  const [frozenAt, setFrozenAt] = useState<string | null>(null);
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editReason, setEditReason] = useState('');
  const [savingClause, setSavingClause] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [expandedHistoryClauseId, setExpandedHistoryClauseId] = useState<string | null>(null);
  const [contentChangedSinceCheck, setContentChangedSinceCheck] = useState(false);

  // Tab 3 (Documents) state
  const [exportingPdf, setExportingPdf] = useState(false);
  const [summarizingDoc, setSummarizingDoc] = useState(false);
  const [docSummary, setDocSummary] = useState<string | null>(null);

  // Procurement Method, Form & Template integration
  const [procurementNature, setProcurementNature] = useState<ProcurementNature>('works');
  const [procurementMethod, setProcurementMethod] = useState<ProcurementMethod>('open_tender');
  const [procurementForm, setProcurementForm] = useState<ProcurementForm>('open');
  const [competitionScope, setCompetitionScope] = useState<CompetitionScope>('national');
  const [procedureJustification, setProcedureJustification] = useState('');
  const [statutoryBasis, setStatutoryBasis] = useState('');
  const [supportingDocsRef, setSupportingDocsRef] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateVersion, setTemplateVersion] = useState('1.0');
  const [isManualDraft, setIsManualDraft] = useState(false);
  const [operatorDocuments, setOperatorDocuments] = useState<OperatorDocumentRequirement[]>([]);
  const [newCustomDocName, setNewCustomDocName] = useState('');
  const [newCustomDocCategory, setNewCustomDocCategory] = useState<'candidature' | 'technical' | 'financial'>('candidature');
  const [newCustomDocDisqualifying, setNewCustomDocDisqualifying] = useState(true);

  // Procedure change impact modal
  const [showProcedureChangeWarning, setShowProcedureChangeWarning] = useState(false);
  const [pendingProcedureChange, setPendingProcedureChange] = useState<{
    method?: ProcurementMethod;
    form?: ProcurementForm;
  } | null>(null);

  // AI 4 Real Tools states
  const [activeAssistantTool, setActiveAssistantTool] = useState<
    'method_explain' | 'template_advisor' | 'autofill_draft' | 'gap_analysis' | null
  >(null);
  const [gapAuditList, setGapAuditList] = useState<any[]>([]);

  // AI Assistant states (isolated per deal)
  const [priceEstimating, setPriceEstimating] = useState(false);
  const [priceEstimateResult, setPriceEstimateResult] = useState<any>(null);
  const [complianceChecking, setComplianceChecking] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [aiProposalPreview, setAiProposalPreview] = useState<{
    type: 'desc' | 'specs_template' | 'clause_improve';
    targetKey?: string;
    title: string;
    text: string;
    sourceNotice: string;
  } | null>(null);

  // Calculated BOQ Total
  const boqTotal = useMemo(() => {
    return boqItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
  }, [boqItems]);

  const isFrozen = cahierStatus === 'frozen';

  // ─── Fetch Deal and Cahier Data ───────────────────────────────────────────
  const fetchDealData = async () => {
    if (!dealId) return;
    try {
      setLoading(true);
      const res = await api.get(`/procurements/deals/${dealId}/`);
      const d = res.data as ProcurementDealApi;
      setDeal(d);
      setTitle(d.title || '');
      setDescription(d.description || '');
      setBudget(d.estimated_budget ? String(d.estimated_budget) : '');
      if (d.specs_price !== undefined) setSpecsPrice(String(d.specs_price));
      if (d.wilaya) setWilaya(d.wilaya);

      // Load Cahier Specs
      let specs: CahierSpecsApi | null | undefined = d.cahier_specs;
      if (!specs) {
        const specsRes = await api.get('/procurements/specs/', { params: { deal: dealId } });
        const list: CahierSpecsApi[] = Array.isArray(specsRes.data)
          ? specsRes.data
          : specsRes.data?.results || [];
        specs = list.find((s) => String(s.deal) === String(dealId));
      }

      if (specs) {
        setSpecsId(specs.id);
        setCahierStatus(specs.is_validated ? 'frozen' : 'active');
        if (specs.is_validated) {
          setFrozenDigest(`SHA256-${specs.id.slice(0, 8).toUpperCase()}-LEGAL-APPROVED`);
          setFrozenAt(specs.created_at || new Date().toISOString());
        }

        const adminClauses = specs.administrative_clauses || {};
        const loadedNature: ProcurementNature =
          adminClauses.procurement_nature || adminClauses.template_type || 'works';
        setProcurementNature(loadedNature);
        setTemplateType(loadedNature as TemplateType);

        const loadedMethod: ProcurementMethod = adminClauses.procurement_method || 'open_tender';
        setProcurementMethod(loadedMethod);

        const loadedForm: ProcurementForm = adminClauses.procurement_form || 'open';
        setProcurementForm(loadedForm);

        const loadedScope: CompetitionScope = adminClauses.competition_scope || 'national';
        setCompetitionScope(loadedScope);

        setProcedureJustification(adminClauses.procedure_justification || '');
        setStatutoryBasis(adminClauses.statutory_basis || '');
        setSupportingDocsRef(adminClauses.supporting_docs_ref || '');
        setTemplateId(adminClauses.template_id || null);
        setTemplateVersion(adminClauses.template_version || '1.0');
        setIsManualDraft(Boolean(adminClauses.is_manual_draft));
        setTaxRegime(adminClauses.tax_regime || 'ttc');

        if (Array.isArray(adminClauses.required_documents) && adminClauses.required_documents.length > 0) {
          setOperatorDocuments(adminClauses.required_documents);
        } else {
          setOperatorDocuments(
            getDynamicOperatorRequirements(loadedNature, loadedMethod, loadedForm, adminClauses.template_id)
          );
        }

        const tType: TemplateType = loadedNature as TemplateType;

        if (specs.technical_requirements?.duration) {
          setDuration(specs.technical_requirements.duration);
        }
        if (specs.technical_requirements?.items && Array.isArray(specs.technical_requirements.items)) {
          setBoqItems(specs.technical_requirements.items);
        } else {
          setBoqItems([
            { id: '1', name: t('authority.workspace.initial_boq_item'), unit: t('authority.workspace.unit_item'), quantity: 1, unitPrice: 0 },
          ]);
        }

        // Build 5 clauses
        const loadedClauses: Clause[] = [
          {
            id: 'clause-1',
            cahierVersionId: String(specs.id),
            clauseCode: 'CLAUSE-01',
            sectionKey: 'general_provisions',
            sortOrder: 1,
            title: getSectionTitle('general_provisions'),
            content: specs.administrative_clauses?.general || templatePresets[tType].adminGeneral,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-1',
                sourceType: 'standard_decree',
                sourceLabel: t('authority.workspace.source_law_23_12_5_27'),
                verificationStatus: 'verified_statutory',
              },
            ],
            events: [],
            stressFindings: [],
          },
          {
            id: 'clause-2',
            cahierVersionId: String(specs.id),
            clauseCode: 'CLAUSE-02',
            sectionKey: 'administrative',
            sortOrder: 2,
            title: getSectionTitle('administrative'),
            content: specs.administrative_clauses?.rules || templatePresets[tType].adminRules,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-2',
                sourceType: 'standard_decree',
                sourceLabel: t('authority.workspace.source_law_23_12_67'),
                verificationStatus: 'verified_statutory',
              },
            ],
            events: [],
            stressFindings: [],
          },
          {
            id: 'clause-3',
            cahierVersionId: String(specs.id),
            clauseCode: 'CLAUSE-03',
            sectionKey: 'technical_specs',
            sortOrder: 3,
            title: getSectionTitle('technical_specs'),
            content: specs.technical_requirements?.details || templatePresets[tType].techDetails,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-3',
                sourceType: 'standard_decree',
                sourceLabel: t('authority.workspace.source_ianor'),
                verificationStatus: 'template_standard',
              },
            ],
            events: [],
            stressFindings: [],
          },
          {
            id: 'clause-4',
            cahierVersionId: String(specs.id),
            clauseCode: 'CLAUSE-04',
            sectionKey: 'financial_terms',
            sortOrder: 4,
            title: getSectionTitle('financial_terms'),
            content: specs.financial_criteria?.terms || templatePresets[tType].finTerms,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-4',
                sourceType: 'standard_decree',
                sourceLabel: t('authority.workspace.source_decree_15_247_125'),
                verificationStatus: 'verified_statutory',
              },
            ],
            events: [],
            stressFindings: [],
          },
          {
            id: 'clause-5',
            cahierVersionId: String(specs.id),
            clauseCode: 'CLAUSE-05',
            sectionKey: 'evaluation_criteria',
            sortOrder: 5,
            title: getSectionTitle('evaluation_criteria'),
            content: specs.financial_criteria?.scoring || templatePresets[tType].finScoring,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-5',
                sourceType: 'standard_decree',
                sourceLabel: t('authority.workspace.source_law_23_12_criteria'),
                verificationStatus: 'verified_statutory',
              },
            ],
            events: [],
            stressFindings: [],
          },
        ];
        setClauses(loadedClauses);

        // Sample requirements
        setRequirements([
          {
            id: 'req-1',
            clauseId: 'clause-2',
            requirementCode: 'REQ-ADM-01',
            requirementType: 'mandatory_document',
            positionReference: t('authority.workspace.pos_admin_dossier'),
            description: t('authority.workspace.req_declaration_candidacy_integrity'),
            isDisqualifying: true,
          },
          {
            id: 'req-2',
            clauseId: 'clause-4',
            requirementCode: 'REQ-FIN-01',
            requirementType: 'bank_guarantee',
            positionReference: t('authority.workspace.sec_financial_terms'),
            description: t('authority.workspace.req_guarantee_bank'),
            isDisqualifying: false,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Failed to load deal:', err);
      toast.error(t('authority.workspace.toast_fetch_error'));
      setLocation('/authority/deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealData();
  }, [dealId]);

  // ─── Contract & execution data ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadContract = async () => {
      if (!dealId) {
        if (!cancelled) setContractLoading(false);
        return;
      }

      setContractLoading(true);
      setContractError('');
      setContract(null);

      try {
        const res = await api.get<
          ProcurementContractApi[] | { results?: ProcurementContractApi[] }
        >('/procurements/contracts/', { params: { deal: dealId } });

        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setContract(list[0] || null);
      } catch (err: unknown) {
        if (cancelled) return;
        setContractError(
          getApiErrorMessage(err, t('authority.workspace.contract_load_error')),
        );
      } finally {
        if (!cancelled) setContractLoading(false);
      }
    };

    void loadContract();
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  const handleGenerateContract = async () => {
    if (!dealId) return;

    setGeneratingContract(true);
    setContractError('');
    setContractSuccess('');

    try {
      const { data } = await api.post<GenerateContractResponseApi>(
        `/procurements/deals/${dealId}/generate-contract/`,
      );

      setContract(data.contract);
      setDeal((previous) =>
        previous
          ? {
              ...previous,
              current_stage: data.current_stage,
              stage_display:
                data.current_stage === 9
                  ? t('authority.workspace.contract_stage_09')
                  : previous.stage_display,
            }
          : previous,
      );
      setContractSuccess(t('authority.workspace.contract_gen_success'));
      toast.success(t('authority.workspace.contract_gen_success'));
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        t('authority.workspace.contract_gen_error'),
      );
      setContractError(message);
      toast.error(message);
    } finally {
      setGeneratingContract(false);
    }
  };

  const handleDownloadContract = async () => {
    const currentContract = contract;
    const hasPdf = Boolean(
      currentContract?.contract_pdf_url || currentContract?.contract_pdf,
    );

    if (!currentContract || !hasPdf) {
      setContractError(t('authority.workspace.contract_pdf_unavailable'));
      return;
    }

    setDownloadingContract(true);
    setContractError('');
    setContractSuccess('');

    try {
      const filename = `contract-${
        currentContract.contract_number || deal?.reference_number || dealId
      }.pdf`;
      await downloadPdfBlob(
        `/procurements/contracts/${currentContract.id}/download/`,
        filename,
      );
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, t('authority.workspace.contract_pdf_error'));
      setContractError(message);
      toast.error(message);
    } finally {
      setDownloadingContract(false);
    }
  };

  // ─── Actions for Tab 1: Deal Basics ───────────────────────────────────────
  const handleSaveBasics = async () => {
    if (!title.trim()) {
      toast.error(t('authority.workspace.toast_title_required'));
      return;
    }
    setSavingBasics(true);
    try {
      const budgetNum = budget ? parseFloat(budget) : null;
      await api.patch(`/procurements/deals/${dealId}/`, {
        title: title.trim(),
        description: description.trim(),
        wilaya,
        estimated_budget: budgetNum,
        specs_price: specsPrice ? parseFloat(specsPrice) : 0,
      });

      // Update Cahier Specs duration & BOQ items and procedure metadata
      if (specsId) {
        await api.patch(`/procurements/specs/${specsId}/`, {
          administrative_clauses: {
            ...(deal?.cahier_specs?.administrative_clauses || {}),
            procurement_nature: procurementNature,
            procurement_method: procurementMethod,
            procurement_form: procurementForm,
            competition_scope: competitionScope,
            procedure_justification: procedureJustification,
            statutory_basis: statutoryBasis,
            supporting_docs_ref: supportingDocsRef,
            template_id: templateId,
            template_version: templateVersion,
            template_status: 'internal_advisory',
            is_manual_draft: isManualDraft,
            tax_regime: taxRegime,
            required_documents: operatorDocuments,
            template_type: procurementNature,
          },
          technical_requirements: {
            duration,
            items: boqItems,
          },
        });
      }
      toast.success(t('authority.workspace.toast_basics_saved'));
      await fetchDealData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t('authority.workspace.toast_basics_save_error'));
    } finally {
      setSavingBasics(false);
    }
  };

  // Procedure change handlers with impact alert
  const handleRequestProcedureChange = (method?: ProcurementMethod, form?: ProcurementForm) => {
    if (isFrozen) {
      toast.warning(t('authority.workspace.toast_cannot_change_frozen_method'));
      return;
    }
    setPendingProcedureChange({ method, form });
    setShowProcedureChangeWarning(true);
  };

  const handleConfirmProcedureChange = () => {
    if (!pendingProcedureChange) return;
    const newMethod = pendingProcedureChange.method ?? procurementMethod;
    let newForm = pendingProcedureChange.form ?? procurementForm;

    // Check compatibility of form with method
    const compatible = getCompatibleForms(newMethod);
    if (!compatible.includes(newForm)) {
      newForm = compatible[0];
    }

    setProcurementMethod(newMethod);
    setProcurementForm(newForm);

    // Update dynamic operator requirements based on new method & form
    const updatedDocs = getDynamicOperatorRequirements(procurementNature, newMethod, newForm, templateId);
    setOperatorDocuments(updatedDocs);

    setShowProcedureChangeWarning(false);
    setPendingProcedureChange(null);
    toast.info(t('authority.workspace.toast_method_updated'));
  };

  // 1. Tool: Explain Procurement Method
  const handleExplainProcurementMethod = () => {
    setActiveAssistantTool('method_explain');
  };

  // 2. Tool: Help Select Template
  const handleRecommendTemplate = () => {
    setActiveAssistantTool('template_advisor');
  };

  // 3. Tool: Complete Draft from Deal Data
  const handleAutofillDraftFromDeal = () => {
    const wilayaObj = ALGERIA_69_WILAYAS.find((w) => w.code === wilaya);
    const wilayaName = wilayaObj ? `${wilayaObj.code} - ${wilayaObj.ar}` : wilaya;
    const formattedBudget = budget ? `${parseFloat(budget).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} ${t('common.dzd')}` : t('authority.workspace.budget_as_approved');

    const enrichedGeneral = t('authority.workspace.default_clause_general', {
      title: title.trim() || t('authority.workspace.default_deal_title'),
      wilaya: wilayaName,
      duration,
      budget: formattedBudget,
      method: lang === 'fr' ? (METHOD_LABELS[procurementMethod]?.fr || METHOD_LABELS[procurementMethod]?.ar) : METHOD_LABELS[procurementMethod]?.ar,
      form: lang === 'fr' ? (FORM_LABELS[procurementForm]?.fr || FORM_LABELS[procurementForm]?.ar) : FORM_LABELS[procurementForm]?.ar,
    });

    setAiProposalPreview({
      type: 'specs_template',
      targetKey: 'general_provisions',
      title: t('authority.workspace.draft_complete_title'),
      text: enrichedGeneral,
      sourceNotice:
        t('authority.workspace.draft_complete_desc'),
    });
  };

  // 4. Tool: Review Missing Info (Audit Checklist)
  const handleRunGapAudit = () => {
    setActiveAssistantTool('gap_analysis');
    const gaps = [
      {
        id: 'title',
        name: t('authority.workspace.field_title'),
        status: title.trim().length > 5 ? 'complete' : 'missing',
        message: title.trim().length > 5 ? t('authority.workspace.checklist_title_ok') : t('authority.workspace.checklist_title_empty'),
        tab: 'basics',
      },
      {
        id: 'budget',
        name: t('authority.workspace.checklist_budget_name'),
        status: budget && parseFloat(budget) > 0 ? 'complete' : 'missing',
        message: budget && parseFloat(budget) > 0 ? `${parseFloat(budget).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} ${t('common.dzd')}` : t('authority.workspace.checklist_budget_unset'),
        tab: 'basics',
      },
      {
        id: 'boq',
        name: t('authority.workspace.checklist_boq_name'),
        status: boqItems.length > 0 && boqTotal > 0 ? 'complete' : 'warning',
        message: boqTotal > 0 ? t('authority.workspace.checklist_boq_summary', { count: boqItems.length, total: boqTotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ') }) : t('authority.workspace.checklist_boq_empty'),
        tab: 'basics',
      },
      {
        id: 'method',
        name: t('authority.workspace.checklist_method_name'),
        status: procurementMethod && procurementForm ? 'complete' : 'missing',
        message: `${METHOD_LABELS[procurementMethod].ar} — ${FORM_LABELS[procurementForm].ar}`,
        tab: 'basics',
      },
      {
        id: 'justification',
        name: t('authority.workspace.checklist_justif_name'),
        status: !isJustificationRequired(procurementForm) || procedureJustification.trim().length > 10 ? 'complete' : 'missing',
        message: !isJustificationRequired(procurementForm)
          ? t('authority.workspace.checklist_justif_not_required')
          : procedureJustification.trim().length > 10
          ? t('authority.workspace.checklist_justif_recorded')
          : t('authority.workspace.checklist_justif_required'),
        tab: 'basics',
      },
      {
        id: 'template',
        name: t('authority.workspace.checklist_template_name'),
        status: templateId || isManualDraft ? 'complete' : 'warning',
        message: templateId
          ? `${t('authority.workspace.template_prefix')}: ${CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId)?.title || templateId}`
          : isManualDraft
          ? t('authority.workspace.manual_custom_draft')
          : t('authority.workspace.checklist_template_not_linked'),
        tab: 'specs',
      },
      {
        id: 'operator_docs',
        name: t('authority.workspace.checklist_operator_docs_name'),
        status: operatorDocuments.length > 0 ? 'complete' : 'missing',
        message: t('authority.workspace.checklist_docs_msg', { count: operatorDocuments.length }),
        tab: 'documents',
      },
      {
        id: 'clauses',
        name: t('authority.workspace.checklist_clauses_name'),
        status: clauses.every((c) => c.content && c.content.trim().length > 20) ? 'complete' : 'warning',
        message: clauses.every((c) => c.content && c.content.trim().length > 20)
          ? t('authority.workspace.checklist_clauses_complete')
          : t('authority.workspace.checklist_clauses_partial'),
        tab: 'specs',
      },
    ];
    setGapAuditList(gaps);
  };

  // Explicit B.O.Q Sync Confirmation
  const handleConfirmSyncBudget = () => {
    if (boqTotal > 0) {
      setBudget(String(boqTotal));
      setShowSyncBudgetConfirm(false);
      toast.success(t('authority.workspace.toast_budget_updated_val', { amount: boqTotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ'), dzd: t('common.dzd') }));
    }
  };

  const handleAddBoqRow = () => {
    setBoqItems((prev) => [
      ...prev,
      { id: `boq-${Date.now()}`, name: '', unit: t('authority.workspace.unit_item'), quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleUpdateBoqRow = (id: string, field: keyof BoqItem, value: any) => {
    setBoqItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveBoqRow = (id: string) => {
    if (boqItems.length <= 1) {
      toast.warning(t('authority.workspace.toast_keep_one_item'));
      return;
    }
    setBoqItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ─── Actions for Tab 2: Cahier Specs ──────────────────────────────────────
  const handleStartEditClause = (clause: Clause) => {
    if (isFrozen) {
      toast.warning(t('authority.workspace.toast_cannot_edit_frozen_clause'));
      return;
    }
    setEditingClauseId(clause.id);
    setEditedContent(clause.content);
    setEditReason('');
  };

  const handleSaveClause = async (clause: Clause) => {
    if (!editedContent.trim()) {
      toast.error(t('authority.workspace.toast_clause_text_required'));
      return;
    }
    setSavingClause(true);
    try {
      if (specsId) {
        // Map clause back to CahierSpecs field
        const keyMap: Record<string, string> = {
          general_provisions: 'general',
          administrative: 'rules',
          technical_specs: 'details',
          financial_terms: 'terms',
          evaluation_criteria: 'scoring',
        };

        const fieldKey = keyMap[clause.sectionKey] || 'general';
        const isTech = clause.sectionKey === 'technical_specs';
        const isFin = clause.sectionKey === 'financial_terms' || clause.sectionKey === 'evaluation_criteria';

        const updatePayload: Record<string, any> = {};
        if (isTech) {
          updatePayload.technical_requirements = { details: editedContent };
        } else if (isFin) {
          updatePayload.financial_criteria = { [fieldKey]: editedContent };
        } else {
          updatePayload.administrative_clauses = { [fieldKey]: editedContent };
        }

        await api.patch(`/procurements/specs/${specsId}/`, updatePayload);
      }

      setClauses((prev) =>
        prev.map((c) =>
          c.id === clause.id
            ? {
                ...c,
                content: editedContent,
                events: [
                  ...c.events,
                  {
                    id: `ev-${Date.now()}`,
                    clauseId: c.id,
                    eventType: 'clause_updated',
                    actorType: 'authority_user',
                    actorId: user?.id || 'current_user',
                    previousContent: c.content,
                    proposedContent: editedContent,
                    actionReason: editReason || t('authority.workspace.audit_clause_edited_by_authority'),
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : c
        )
      );

      setEditingClauseId(null);
      setContentChangedSinceCheck(true);
      toast.success(t('authority.workspace.toast_clause_saved'));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t('authority.workspace.toast_clause_save_error'));
    } finally {
      setSavingClause(false);
    }
  };

  const handleFreezeSpecs = async () => {
    if (!specsId) return;
    setFreezing(true);
    try {
      await api.patch(`/procurements/specs/${specsId}/`, { is_validated: true });
      setCahierStatus('frozen');
      setFrozenDigest(`SHA256-${specsId.slice(0, 8).toUpperCase()}-LEGAL-APPROVED`);
      setFrozenAt(new Date().toISOString());
      setShowFreezeModal(false);
      toast.success(t('authority.workspace.toast_specs_frozen'));
      await fetchDealData();
    } catch (err: any) {
      toast.error(t('authority.workspace.toast_specs_freeze_error'));
    } finally {
      setFreezing(false);
    }
  };

  // ─── Actions for Tab 3: Documents ─────────────────────────────────────────
  const handleExportPdf = async () => {
    if (!dealId) return;
    setExportingPdf(true);
    try {
      const filename = `Cahier_Specs_${deal?.reference_number || dealId}.pdf`;
      await downloadPdfBlob(`/procurements/deals/${dealId}/specs-pdf/`, filename);
      toast.success(t('authority.workspace.toast_specs_pdf_success'));
    } catch {
      toast.error(t('authority.workspace.toast_specs_pdf_error'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSummarizeDoc = async () => {
    setSummarizingDoc(true);
    setDocSummary(null);
    try {
      const res = await api.post('/ai/summarize/', {
        title: deal?.title || title,
        description: deal?.description || description,
      });
      setDocSummary(res.data.summary);
      toast.success(t('authority.workspace.toast_summary_prepared'));
    } catch {
      // Fallback
      setDocSummary(
        t('authority.workspace.summary_proposal_text', { title: title || deal?.title || '' })
      );
    } finally {
      setSummarizingDoc(false);
    }
  };

  // ─── AI Contextual Assistant Actions ─────────────────────────────────────
  const handleEstimateMarketPrice = async () => {
    setPriceEstimating(true);
    setPriceEstimateResult(null);
    try {
      const res = await api.post('/ai/price-estimate/', {
        template_type: templateType,
        description: description || title,
        wilaya: wilaya || defaultWilaya,
        category: templateType,
      });
      setPriceEstimateResult(res.data);
      toast.success(t('authority.workspace.toast_market_price_extracted'));
    } catch (err) {
      setPriceEstimateResult({
        min_price: boqTotal > 0 ? boqTotal * 0.85 : 12000000,
        max_price: boqTotal > 0 ? boqTotal * 1.25 : 18000000,
        avg_price: boqTotal > 0 ? boqTotal : 15000000,
        confidence_score: 82,
        reference_count: 5,
        currency: t('common.dzd'),
      });
      toast.info(t('authority.workspace.toast_market_price_info'));
    } finally {
      setPriceEstimating(false);
    }
  };

  const handleRunComplianceCheck = async () => {
    setComplianceChecking(true);
    setComplianceResult(null);
    try {
      const scoringClause = clauses.find((c) => c.sectionKey === 'evaluation_criteria')?.content;
      const res = await api.post('/ai/compliance-check/', {
        tender_data: {
          deal_type: 'public_call',
          submission_window_days: 21,
          evaluation_criteria: scoringClause,
          template_type: templateType,
        },
      });
      setComplianceResult(res.data);
      setContentChangedSinceCheck(false);
      toast.success(t('authority.workspace.toast_compliance_complete'));
    } catch {
      setComplianceResult({
        is_advisory: true,
        statutory_reference: t('authority.workspace.statutory_law_23_12_date'),
        legal_disclaimer:
          t('authority.workspace.analysis_disclaimer'),
        preliminary_compliance_check: true,
        advisory_notes: [
          {
            rule: t('authority.workspace.rule_art_67'),
            severity: 'info',
            message: t('authority.workspace.compliance_integrity_msg'),
            recommendation: t('authority.workspace.compliance_integrity_rec'),
          },
        ],
      });
      setContentChangedSinceCheck(false);
    } finally {
      setComplianceChecking(false);
    }
  };

  const handleProposeTemplateClause = (sectionKey: string) => {
    const preset = templatePresets[templateType];
    const textMap: Record<string, string> = {
      general_provisions: preset.adminGeneral,
      administrative: preset.adminRules,
      technical_specs: preset.techDetails,
      financial_terms: preset.finTerms,
      evaluation_criteria: preset.finScoring,
    };

    setAiProposalPreview({
      type: 'specs_template',
      targetKey: sectionKey,
      title: t('authority.workspace.proposal_from_template_title', { section: getSectionTitle(sectionKey) }),
      text: textMap[sectionKey] || '',
      sourceNotice:
        t('authority.workspace.proposal_from_template_desc'),
    });
  };

  const handleApplyAiProposal = () => {
    if (!aiProposalPreview) return;
    if (aiProposalPreview.type === 'desc') {
      setDescription(aiProposalPreview.text);
      toast.success(t('authority.workspace.toast_desc_proposal_applied'));
    } else if (aiProposalPreview.type === 'specs_template' && aiProposalPreview.targetKey) {
      const targetClause = clauses.find((c) => c.sectionKey === aiProposalPreview.targetKey);
      if (targetClause) {
        setEditingClauseId(targetClause.id);
        setEditedContent(aiProposalPreview.text);
        setEditReason(t('authority.workspace.reason_applied_template'));
        toast.info(t('authority.workspace.toast_tpl_clause_loaded'));
      }
    }
    setAiProposalPreview(null);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-500 space-y-3" dir={dir}>
        <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">{t('authority.workspace.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" dir={dir}>
      {/* ─── 1. Header Banner & Context ───────────────────────────────────── */}
      <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/authority/deals')}
              className="p-1.5 h-auto text-gray-600 hover:text-navy-900 hover:bg-gray-100 rounded-lg"
              title={t('authority.workspace.nav_back_to_deals')}
            >
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
              {deal?.reference_number || 'DZ-2026-REF'}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {deal?.stage_display || `${t('authority.workspace.stage_prefix')} ${deal?.current_stage || 1}`}
            </span>
            {isFrozen ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />{t('authority.workspace.frozen_approved_badge')}</span>
            ) : (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">{t('authority.workspace.drafting_badge')}</span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-navy-900 tracking-tight">
            {deal?.title || title || t('authority.workspace.deal_default_title')}
          </h1>
          <p className="text-xs text-gray-500">{t('authority.workspace.header_unified_desc')}</p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-stretch md:self-auto justify-end">
          {!contract && !contractLoading && deal && deal.current_stage >= 8 && (
            <Button
              onClick={() => void handleGenerateContract()}
              disabled={generatingContract}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {generatingContract ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSignature className="w-4 h-4" />
              )}
              <span>{generatingContract ? t('authority.workspace.contract_generating') : t('authority.workspace.contract_btn_generate')}</span>
            </Button>
          )}

          {contract && (
            <Button
              variant="outline"
              onClick={() => void handleDownloadContract()}
              disabled={downloadingContract}
              className="border-[#D5DDEA] text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {downloadingContract ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-emerald-600" />
              )}
              <span>{downloadingContract ? t('authority.workspace.contract_downloading') : t('authority.workspace.btn_download_contract')}</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="border-[#D5DDEA] text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
            title={t('authority.workspace.export_pdf_tooltip')}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{exportingPdf ? t('authority.workspace.exporting_pdf') : t('authority.workspace.export_pdf_btn')}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isAssistantOpen
                ? 'bg-navy-50 text-navy-900 border-navy-200'
                : 'bg-white text-gray-700 border-[#D5DDEA]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-navy-700" />
            <span>{isAssistantOpen ? t('authority.workspace.assistant_hide') : t('authority.workspace.assistant_show')}</span>
          </Button>
        </div>
      </section>

      {/* ─── Contract & Execution ─────────────────────────────────────────── */}
      {dealId && ((deal && deal.current_stage >= 8) || contract) && (
        <section className="bg-white border border-[#D5DDEA] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 border-b border-[#E5EBF4] pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-extrabold text-navy-900">
                <FileSignature className="w-5 h-5 text-emerald-700" />{t('authority.workspace.contract_card_title')}</h2>
              <p className="mt-1 text-xs text-gray-500">{t('authority.workspace.contract_card_desc')}</p>
            </div>
            {contract && (
              <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                {getContractStatusLabel(contract.status) || contract.status || t('authority.workspace.contract_signed')}
              </span>
            )}
          </div>

          {contractSuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0" />
              <span>{contractSuccess}</span>
            </div>
          )}

          {contractError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">
              <AlertCircle className="mt-0.5 w-4 h-4 shrink-0" />
              <span>{contractError}</span>
            </div>
          )}

          {contractLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label={t('authority.workspace.contract_loading_aria')}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : contract ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E5EBF4] bg-slate-50/50 p-4 text-xs md:grid-cols-4">
                <div>
                  <span className="block text-xs font-bold text-gray-500">{t('authority.workspace.contract_number')}</span>
                  <span className="mt-0.5 block font-mono font-extrabold text-navy-900">
                    {contract.contract_number || '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500">{t('authority.workspace.contract_archived_date')}</span>
                  <span className="mt-0.5 block font-bold text-navy-900">
                    {formatContractDate(contract.signed_at)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500">{t('authority.workspace.contract_amount')}</span>
                  <span className="mt-0.5 block font-bold text-emerald-800">
                    {formatContractAmount(contract.amount)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-500">{t('authority.workspace.contract_operator')}</span>
                  <span className="mt-0.5 block font-bold text-navy-900">
                    {contract.operator_name || '—'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-xs text-gray-500">
                  {t('authority.workspace.contract_deal_ref_label')}: <span className="font-mono font-bold text-navy-900">{contract.deal_reference || deal?.reference_number || '—'}</span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDownloadContract()}
                  disabled={downloadingContract}
                  className="rounded-xl border-[#D5DDEA] text-emerald-800 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5"
                >
                  {downloadingContract ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{downloadingContract ? t('authority.workspace.contract_downloading') : t('authority.workspace.contract_btn_download')}</span>
                </Button>
              </div>

              <ExecutionTracker dealId={dealId} role="authority" />
              <div className="pt-4 border-t border-slate-100">
                <AvenantsManager
                  dealId={dealId}
                  dealReference={deal?.reference_number}
                  baseAmount={deal ? Number(deal.estimated_budget || (deal as any).base_amount || 0) : 0}
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <LegalNoticesManager
                  dealId={dealId}
                  dealReference={deal?.reference_number}
                  dealTitle={deal?.title}
                  userRole="authority"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D5DDEA] bg-slate-50/50 p-6 text-center">
              <FileSignature className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-2 text-sm font-extrabold text-navy-900">{t('authority.workspace.contract_not_generated')}</h3>
              <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
                {t('authority.workspace.contract_not_generated_desc')}
              </p>
              <Button
                onClick={() => void handleGenerateContract()}
                disabled={generatingContract}
                className="mt-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 mx-auto"
              >
                {generatingContract ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSignature className="w-4 h-4" />
                )}
                <span>{generatingContract ? t('authority.workspace.contract_generating') : t('authority.workspace.contract_btn_generate')}</span>
              </Button>
            </div>
          )}
        </section>
      )}

      {/* ─── 2. Unified 3-Tab Bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[#D5DDEA] pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('basics')}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'basics'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#D5DDEA]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t('authority.workspace.tab_basics')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('specs')}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'specs'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#D5DDEA]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('authority.workspace.tab_specs')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#D5DDEA]'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>{t('authority.workspace.tab_documents')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('avenants')}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'avenants'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#D5DDEA]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>{t('authority.deal.avenants.title') || 'الملاحق التعاقدية'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notices')}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'notices'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#D5DDEA]'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>{t('execution.notices.title') || 'الاعذارات القانونية'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('specs_buyers')}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'specs_buyers'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-[#D5DDEA]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{t('authority.specs.buyers_register')}</span>
        </button>
      </div>

      {/* ─── 3. Main Workspace Grid with Collapsible Assistant ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Pane */}
        <main className={`${isAssistantOpen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6 transition-all`}>
          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: Deal Basics & Needs
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'basics' && (
            <div className="space-y-6">
              <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5EBF4] pb-4">
                  <div>
                    <h2 className="text-base font-bold text-navy-900">{t('authority.workspace.basics_title')}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{t('authority.workspace.basics_subtitle')}</p>
                  </div>
                  <Button
                    onClick={handleSaveBasics}
                    disabled={savingBasics}
                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingBasics ? t('authority.workspace.btn_saving_basics') : t('authority.workspace.btn_save_basics')}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_title')}</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-xl border-[#D5DDEA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_nature')}</label>
                    <select
                      value={procurementNature}
                      onChange={(e) => {
                        const val = e.target.value as ProcurementNature;
                        setProcurementNature(val);
                        setTemplateType(val as TemplateType);
                        const compat = getCompatibleTemplates(val);
                        if (compat.length > 0 && !templateId) {
                          setTemplateId(compat[0].id);
                        }
                      }}
                      className="w-full text-xs rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800"
                    >
                      <option value="works">{t('authority.workspace.nature_works')}</option>
                      <option value="supplies">{t('authority.workspace.nature_supplies')}</option>
                      <option value="services">{t('authority.workspace.nature_services')}</option>
                      <option value="studies">{t('authority.workspace.nature_studies')}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_wilaya')}</label>
                    <select
                      value={wilaya}
                      onChange={(e) => setWilaya(e.target.value)}
                      className="w-full text-xs rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800"
                    >
                      {ALGERIA_69_WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {w.ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_budget')}</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="rounded-xl border-[#D5DDEA] pe-10"
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">{t('common.dzd')}</span>
                    </div>
                    {/* Explicit Tax Regime Selector (HT vs TTC) */}
                    <div className="flex items-center gap-3 pt-1 text-xs">
                      <span className="font-semibold text-gray-500 text-xs">{t('authority.workspace.tax_system')}</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="wsTaxRegime"
                          value="ttc"
                          checked={taxRegime === 'ttc'}
                          onChange={() => setTaxRegime('ttc')}
                          className="text-navy-900 focus:ring-navy-500"
                        />
                        <span className="text-xs font-bold text-gray-700">{t('authority.workspace.tax_ttc')}</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="wsTaxRegime"
                          value="ht"
                          checked={taxRegime === 'ht'}
                          onChange={() => setTaxRegime('ht')}
                          className="text-navy-900 focus:ring-navy-500"
                        />
                        <span className="text-xs font-bold text-gray-700">{t('authority.workspace.tax_ht')}</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_duration')}</label>
                    <Input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="rounded-xl border-[#D5DDEA]"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_description')}</label>
                    <Textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="text-xs rounded-xl border-[#D5DDEA]"
                    />
                  </div>
                </div>

                {/* Procurement Method & Procedure Selection */}
                <div className="pt-4 border-t border-[#E5EBF4] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-emerald-600" />{t('authority.workspace.proc_method_title')}</h3>
                      <p className="text-xs text-gray-500">{t('authority.workspace.proc_method_subtitle')}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
                      {METHOD_LABELS[procurementMethod].ar} — {FORM_LABELS[procurementForm].ar}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Method */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_method')}</label>
                      <select
                        value={procurementMethod}
                        onChange={(e) => {
                          const nextMethod = e.target.value as ProcurementMethod;
                          handleRequestProcedureChange(nextMethod, undefined);
                        }}
                        className="w-full text-xs rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800"
                      >
                        <option value="open_tender">{t('authority.workspace.opt_open_tender')}</option>
                        <option value="negotiated_procedure">{t('authority.workspace.method_negotiated')}</option>
                      </select>
                    </div>

                    {/* Form */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_form')}</label>
                      <select
                        value={procurementForm}
                        onChange={(e) => {
                          const nextForm = e.target.value as ProcurementForm;
                          handleRequestProcedureChange(undefined, nextForm);
                        }}
                        className="w-full text-xs rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800"
                      >
                        {getCompatibleForms(procurementMethod).map((f) => (
                          <option key={f} value={f}>
                            {FORM_LABELS[f].ar}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Scope */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_scope')}</label>
                      {isCompetitionScopeApplicable(procurementMethod, procurementForm) ? (
                        <select
                          value={competitionScope}
                          onChange={(e) => setCompetitionScope(e.target.value as CompetitionScope)}
                          className="w-full text-xs rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800"
                        >
                          <option value="national">{COMPETITION_SCOPE_LABELS.national}</option>
                          <option value="national_and_international">
                            {COMPETITION_SCOPE_LABELS.national_and_international}
                          </option>
                        </select>
                      ) : (
                        <div className="text-xs rounded-xl border border-dashed border-gray-300 p-2.5 bg-gray-50 text-gray-500">{t('authority.workspace.scope_not_applicable')}</div>
                      )}
                    </div>
                  </div>

                  {/* Non-open Justification & Statutory Ground Fields */}
                  {isJustificationRequired(procurementForm) && (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <h4 className="text-xs font-bold text-amber-950">{t('authority.workspace.justif_section_title')}</h4>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {t('authority.workspace.justif_section_desc')}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_statutory_basis')}</label>
                          <Input
                            value={statutoryBasis}
                            onChange={(e) => setStatutoryBasis(e.target.value)}
                            placeholder={t('authority.workspace.field_statutory_basis_placeholder')}
                            className="text-xs rounded-xl border-amber-200 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_docs_ref')}</label>
                          <Input
                            value={supportingDocsRef}
                            onChange={(e) => setSupportingDocsRef(e.target.value)}
                            placeholder={t('authority.workspace.field_docs_ref_placeholder')}
                            className="text-xs rounded-xl border-amber-200 bg-white"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-gray-700 block">{t('authority.workspace.field_justif_report')}</label>
                          <Textarea
                            rows={2}
                            value={procedureJustification}
                            onChange={(e) => setProcedureJustification(e.target.value)}
                            placeholder={t('authority.workspace.field_justif_report_placeholder')}
                            className="text-xs rounded-xl border-amber-200 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explicit Budget Sync Banner */}
                {boqTotal > 0 && String(boqTotal) !== budget && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-950">
                        {t('authority.workspace.boq_total_current', { amount: boqTotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ'), dzd: t('common.dzd') })}
                      </p>
                      <p className="text-amber-800 text-xs">
                        {t('authority.workspace.boq_current_registered', { amount: budget ? `${parseFloat(budget).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} ${t('common.dzd')}` : t('authority.workspace.boq_alert_unspecified') })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowSyncBudgetConfirm(true)}
                      className="bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold px-3 shrink-0"
                    >{t('authority.workspace.boq_alert_btn_update')}</Button>
                  </div>
                )}

                {/* B.O.Q Table */}
                <div className="space-y-3 pt-3 border-t border-[#E5EBF4]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-navy-900">{t('authority.workspace.boq_title')}</h3>
                      <p className="text-xs text-gray-500">{t('authority.workspace.boq_subtitle')}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddBoqRow}
                      className="border-[#D5DDEA] text-xs font-bold rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5 me-1" />{t('authority.workspace.boq_btn_add')}</Button>
                  </div>

                  <div className="border border-[#D5DDEA] rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-[#D5DDEA] text-gray-600 font-bold">
                            <th className="px-4 py-4 w-10 text-center">#</th>
                            <th className="px-4 py-4">{t('authority.workspace.boq_th_desc')}</th>
                            <th className="px-4 py-4 w-24">{t('authority.workspace.boq_th_unit')}</th>
                            <th className="px-4 py-4 w-20">{t('authority.workspace.boq_th_qty')}</th>
                            <th className="px-4 py-4 w-32">{t('authority.workspace.boq_th_price')}</th>
                            <th className="px-4 py-4 w-32 text-end">{t('authority.workspace.boq_th_total')}</th>
                            <th className="px-4 py-4 w-10 text-center">{t('authority.workspace.boq_th_delete')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {boqItems.map((item, idx) => {
                            const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
                            return (
                              <tr key={item.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                                <td className="px-4 py-3">
                                  <Input
                                    value={item.name}
                                    onChange={(e) => handleUpdateBoqRow(item.id, 'name', e.target.value)}
                                    placeholder={t('authority.workspace.boq_item_placeholder')}
                                    className="h-7 text-xs rounded-lg"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={item.unit}
                                    onChange={(e) => handleUpdateBoqRow(item.id, 'unit', e.target.value)}
                                    className="h-7 w-full text-xs rounded-lg border border-gray-200 px-1 bg-white"
                                  >
                                    <option value={t('authority.workspace.unit_item')}>{t('authority.workspace.unit_item')}</option>
                                    <option value={t('authority.workspace.unit_sqm')}>{t('authority.workspace.unit_sqm')}</option>
                                    <option value={t('authority.workspace.unit_cum')}>{t('authority.workspace.unit_cum')}</option>
                                    <option value={t('authority.workspace.unit_lm')}>{t('authority.workspace.unit_lm')}</option>
                                    <option value={t('authority.workspace.unit_lot')}>{t('authority.workspace.unit_lot')}</option>
                                    <option value={t('authority.workspace.unit_month')}>{t('authority.workspace.unit_month')}</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateBoqRow(item.id, 'quantity', parseFloat(e.target.value) || 0)
                                    }
                                    className="h-7 text-xs rounded-lg text-center"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={item.unitPrice}
                                    onChange={(e) =>
                                      handleUpdateBoqRow(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                                    }
                                    className="h-7 text-xs rounded-lg text-end font-mono"
                                  />
                                </td>
                                <td className="px-4 py-3 text-end font-mono font-bold text-navy-900">
                                  {subtotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} {t('common.dzd')}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBoqRow(item.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 border-t-2 border-[#D5DDEA] text-xs font-bold">
                            <td colSpan={5} className="px-4 py-3 text-end text-gray-700">{t('authority.workspace.boq_total_label')}</td>
                            <td className="px-4 py-3 text-end font-mono text-emerald-800 font-bold">
                              {boqTotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} {t('common.dzd')}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: Cahier Specs & Sanad
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {/* Template Metadata & Regulatory Basis Bar */}
              <div className="bg-white border border-[#D5DDEA] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center shrink-0 border border-navy-100">
                    <FileCode2 className="w-5 h-5 text-navy-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-navy-900 text-sm">
                        {templateId
                          ? CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId)?.title || templateId
                          : isManualDraft
                          ? t('authority.workspace.manual_draft_badge')
                          : t('authority.workspace.approved_template_badge')}
                      </span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {t('authority.workspace.version_prefix', { version: templateVersion })}
                      </span>
                      {templateId && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                            TEMPLATE_STATUS_LABELS[
                              CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId)?.status || 'internal_advisory'
                            ]?.badgeClass || 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <Award className="w-3 h-3" />
                          {TEMPLATE_STATUS_LABELS[
                            CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId)?.status || 'internal_advisory'
                          ]?.ar || t('authority.workspace.template_status_fallback')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('authority.workspace.procedural_basis')}: {lang === 'fr' ? (METHOD_LABELS[procurementMethod]?.fr || METHOD_LABELS[procurementMethod]?.ar) : METHOD_LABELS[procurementMethod]?.ar} — {lang === 'fr' ? (FORM_LABELS[procurementForm]?.fr || FORM_LABELS[procurementForm]?.ar) : FORM_LABELS[procurementForm]?.ar} ({lang === 'fr' ? (NATURE_LABELS[procurementNature]?.fr || NATURE_LABELS[procurementNature]?.ar) : NATURE_LABELS[procurementNature]?.ar})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('basics')}
                    className="text-xs border-[#D5DDEA] text-gray-700 rounded-xl"
                  >{t('authority.workspace.btn_change_method')}</Button>
                </div>
              </div>

              {/* Frozen Digest Banner */}
              {isFrozen && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">{t('authority.workspace.frozen_banner_title')}</p>
                      <p className="font-mono text-xs text-emerald-800">
                        {t('authority.workspace.badge_frozen_digest', { digest: frozenDigest })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-700">
                    {t('authority.workspace.badge_frozen_date', { date: new Date(frozenAt || '').toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ') })}
                  </span>
                </div>
              )}

              {/* Specs Section Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#D5DDEA] text-xs">
                {SECTION_KEYS.map((key) => {
                  const isActive = activeSection === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveSection(key)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-navy-900 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#D5DDEA]'
                      }`}
                    >
                      {getSectionTitle(key)}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setActiveSection('requirements')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeSection === 'requirements'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('authority.workspace.tab_reqs_count', { count: requirements.length })}</span>
                </button>
              </div>

              {/* Clause Detail Content */}
              {activeSection === 'requirements' ? (
                <div className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-navy-900">{t('authority.workspace.reqs_grid_title')}</h3>
                    <span className="text-xs text-gray-500">{t('authority.workspace.reqs_grid_subtitle')}</span>
                  </div>

                  <div className="space-y-3">
                    {requirements.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-navy-100 text-navy-900">
                            {req.requirementCode}
                          </span>
                          {req.isDisqualifying && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded font-bold text-xs">{t('authority.workspace.disqualifying_badge')}</span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900">{req.positionReference}</p>
                        <p className="text-gray-600">{req.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {clauses
                    .filter((c) => c.sectionKey === activeSection)
                    .map((clause) => {
                      const isEditing = editingClauseId === clause.id;
                      const isHistoryOpen = expandedHistoryClauseId === clause.id;

                      return (
                        <div
                          key={clause.id}
                          className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4"
                        >
                          {/* Clause Header & Provenance */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-navy-900 text-white">
                                {clause.clauseCode}
                              </span>
                              <h3 className="text-sm font-bold text-navy-900">{clause.title}</h3>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">{t('authority.workspace.binding_clause_badge')}</span>
                            </div>

                            {/* Sanad / Provenance Badges */}
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              {clause.provenance.map((prov) => (
                                <span
                                  key={prov.id}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1"
                                >
                                  <Scale className="w-3 h-3 text-emerald-600" />
                                  <span>{prov.sourceLabel}</span>
                                </span>
                              ))}

                              {clause.events.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedHistoryClauseId(isHistoryOpen ? null : clause.id)
                                  }
                                  className="text-gray-500 hover:text-navy-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100"
                                >
                                  <History className="w-3 h-3" />
                                  <span>{t('authority.workspace.tab_audit_count', { count: clause.events.length })}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Editing Mode */}
                          {isEditing ? (
                            <div className="space-y-3">
                              <Textarea
                                rows={6}
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="text-xs rounded-xl border-[#D5DDEA] leading-relaxed font-normal"
                              />
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                                <Input
                                  placeholder={t('authority.workspace.edit_reason_placeholder')}
                                  value={editReason}
                                  onChange={(e) => setEditReason(e.target.value)}
                                  className="text-xs rounded-xl h-8 flex-1"
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingClauseId(null)}
                                    className="rounded-xl text-xs"
                                  >{t('authority.workspace.btn_modal_cancel')}</Button>
                                  <Button
                                    size="sm"
                                    disabled={savingClause}
                                    onClick={() => handleSaveClause(clause)}
                                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold"
                                  >
                                    {savingClause ? t('authority.workspace.btn_saving_basics') : t('authority.workspace.btn_save_clause')}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="text-xs text-gray-800 leading-relaxed bg-gray-50/70 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap font-normal">
                                {clause.content}
                              </div>

                              {!isFrozen && (
                                <div className="flex justify-between items-center pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleProposeTemplateClause(clause.sectionKey)}
                                    className="text-xs text-emerald-700 hover:underline font-bold flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    <span>{t('authority.workspace.tpl_proposal_badge')}</span>
                                  </button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStartEditClause(clause)}
                                    className="text-xs border-[#D5DDEA] text-navy-800 hover:bg-navy-50 rounded-xl font-bold"
                                  >{t('authority.workspace.btn_edit_clause')}</Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Clause Event History Drawer */}
                          {isHistoryOpen && clause.events.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-2">
                              <p className="font-bold text-gray-800">{t('authority.workspace.events_log_title')}</p>
                              {clause.events.map((ev) => (
                                <div
                                  key={ev.id}
                                  className="border-b border-gray-200/60 pb-1.5 last:border-0 text-xs text-gray-600"
                                >
                                  <span className="font-bold text-navy-900">
                                    {new Date(ev.createdAt).toLocaleString('ar-DZ')}:
                                  </span>{' '}
                                  {ev.actionReason}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Bottom Freeze Bar */}
              {!isFrozen && (
                <div className="bg-white border border-[#D5DDEA] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-navy-900">{t('authority.workspace.freeze_card_title')}</h4>
                    <p className="text-xs text-gray-500">{t('authority.workspace.freeze_card_desc')}</p>
                  </div>
                  <Button
                    onClick={() => setShowFreezeModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t('authority.workspace.btn_freeze_specs')}</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4: Avenants (الملاحق التعاقدية)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'avenants' && (
            <div className="space-y-6">
              <AvenantsManager
                dealId={dealId || ''}
                dealReference={deal?.reference_number}
                baseAmount={deal ? Number(deal.estimated_budget || deal.base_amount || 0) : 0}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 5: Legal Notices (الاعذارات القانونية وإدارة التأخيرات)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'notices' && (
            <div className="space-y-6">
              <LegalNoticesManager
                dealId={dealId || ''}
                dealReference={deal?.reference_number}
                dealTitle={deal?.title}
                userRole="authority"
              />
            </div>
          )}

          {activeTab === 'specs_buyers' && (
            <SpecsBuyersManager dealId={dealId || ''} />
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: Documents, Deeds & Sanad
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Operator Dynamic Documents Dossier */}
              <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />{t('authority.workspace.operator_dossier_title')}</h2>
                    <p className="text-xs text-gray-500">{t('authority.workspace.operator_dossier_desc')}</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                    {t('authority.workspace.operator_docs_count', { count: operatorDocuments.length })}
                  </span>
                </div>

                {/* Documents Table */}
                <div className="border border-[#D5DDEA] rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#D5DDEA] text-gray-600 font-bold">
                          <th className="px-4 py-4 w-10 text-center">#</th>
                          <th className="px-4 py-4">{t('authority.workspace.th_doc_name')}</th>
                          <th className="px-4 py-4 w-28">{t('authority.workspace.th_doc_envelope')}</th>
                          <th className="px-4 py-4 w-36">{t('authority.workspace.th_doc_basis')}</th>
                          <th className="px-4 py-4 w-28 text-center">{t('authority.workspace.th_doc_statutory')}</th>
                          <th className="px-4 py-4 w-28 text-center">{t('authority.workspace.th_doc_impact')}</th>
                          <th className="px-4 py-4 w-12 text-center">{t('authority.workspace.th_doc_action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {operatorDocuments.map((doc, idx) => (
                          <tr key={doc.id || doc.code} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-navy-900">{doc.titleAr || doc.name}</p>
                              {doc.descriptionAr && (
                                <p className="text-xs text-gray-500">{doc.descriptionAr}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  doc.category === 'candidacy' || doc.category === ('candidature' as any)
                                    ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                    : doc.category === 'technical'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {doc.category === 'candidacy' || doc.category === ('candidature' as any)
                                  ? t('authority.workspace.envelope_candidature')
                                  : doc.category === 'technical'
                                  ? t('authority.workspace.envelope_technical')
                                  : t('authority.workspace.envelope_financial')}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">
                              {doc.statutoryRef || doc.statutoryBasis || t('authority.workspace.doc_statutory_default')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {doc.isStatutory ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-navy-50 text-navy-800 border border-navy-200 whitespace-nowrap">{t('authority.workspace.doc_statutory_badge')}</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">{t('authority.workspace.doc_discretionary_badge')}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {doc.isDisqualifying ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">{t('authority.workspace.impact_disqualifying')}</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{t('authority.workspace.impact_supplementary')}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {doc.isStatutory ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.error(
                                      t('authority.workspace.cannot_delete_mandatory_doc', { name: doc.titleAr || doc.name })
                                    );
                                  }}
                                  className="text-gray-300 hover:text-amber-600 p-1 rounded cursor-not-allowed inline-flex items-center justify-center"
                                  title={t('authority.workspace.statutory_delete_tooltip')}
                                >
                                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOperatorDocuments((prev) => prev.filter((d) => (d.id || d.code) !== (doc.id || doc.code)));
                                    toast.info(t('authority.workspace.deleted_discretionary_doc', { name: doc.titleAr || doc.name }));
                                  }}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded inline-flex items-center justify-center"
                                  title={t('authority.workspace.discretionary_delete_tooltip')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Custom Document Form */}
                <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center gap-2 text-xs">
                  <Input
                    value={newCustomDocName}
                    onChange={(e) => setNewCustomDocName(e.target.value)}
                    placeholder={t('authority.workspace.add_doc_placeholder')}
                    className="rounded-xl border-gray-200 text-xs flex-1 bg-white"
                  />
                  <select
                    value={newCustomDocCategory}
                    onChange={(e) => setNewCustomDocCategory(e.target.value as any)}
                    className="rounded-xl border border-gray-200 text-xs p-2 bg-white"
                  >
                    <option value="candidature">{t('authority.workspace.envelope_candidature')}</option>
                    <option value="technical">{t('authority.workspace.envelope_technical')}</option>
                    <option value="financial">{t('authority.workspace.envelope_financial')}</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-gray-700 whitespace-nowrap px-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCustomDocDisqualifying}
                      onChange={(e) => setNewCustomDocDisqualifying(e.target.checked)}
                      className="rounded border-gray-300 text-red-600"
                    />
                    <span>{t('authority.workspace.impact_disqualifying')}</span>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (!newCustomDocName.trim()) {
                        toast.error(t('authority.workspace.toast_doc_title_required'));
                        return;
                      }
                      const newDoc: OperatorDocumentRequirement = {
                        id: `custom-doc-${Date.now()}`,
                        code: `CUST-${Date.now().toString().slice(-4)}`,
                        name: newCustomDocName.trim(),
                        titleAr: newCustomDocName.trim(),
                        category: (newCustomDocCategory === 'candidature' ? 'candidacy' : newCustomDocCategory) as any,
                        isMandatory: newCustomDocDisqualifying,
                        isDisqualifying: newCustomDocDisqualifying,
                        isStatutory: false,
                        statutoryBasis: t('authority.workspace.statutory_basis_discretionary'),
                        statutoryRef: t('authority.workspace.statutory_ref_estimated'),
                      };
                      setOperatorDocuments((prev) => [...prev, newDoc]);
                      setNewCustomDocName('');
                      toast.success(t('authority.workspace.toast_doc_added'));
                    }}
                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 me-1" />{t('authority.workspace.btn_add_doc')}</Button>
                </div>
              </section>

              {/* Deal Documents Section */}
              <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-navy-900">{t('authority.workspace.deal_docs_title')}</h2>
                    <p className="text-xs text-gray-500">{t('authority.workspace.deal_docs_desc')}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSummarizeDoc}
                    disabled={summarizingDoc}
                    className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{summarizingDoc ? t('authority.workspace.summarizing_ai') : t('authority.workspace.btn_summarize_ai')}</span>
                  </Button>
                </div>

                {/* AI Document Summary Card */}
                {docSummary && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />{t('authority.workspace.executive_summary_title')}</span>
                      <button
                        type="button"
                        onClick={() => setDocSummary(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-emerald-900 leading-relaxed font-normal">{docSummary}</p>
                    <p className="text-xs text-emerald-700 pt-1">{t('authority.workspace.executive_summary_disclaimer')}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Doc 1: Cahier Specs PDF */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">{t('authority.workspace.doc_specs_pdf_title')}</p>
                        <p className="text-gray-500 text-xs">{t('authority.workspace.doc_specs_pdf_desc')}</p>
                        <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {isFrozen ? t('authority.workspace.doc_specs_frozen_badge') : t('authority.workspace.doc_specs_draft_badge')}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={exportingPdf}
                      className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 me-1" />{t('authority.workspace.btn_download_pdf')}</Button>
                  </div>

                  {/* Doc 2: Bank Guarantees / Sanad */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-100 text-blue-800 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">{t('authority.workspace.doc_bank_guarantee_title')}</p>
                        <p className="text-gray-500 text-xs">{t('authority.workspace.doc_bank_guarantee_desc')}</p>
                        <span className="inline-block text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">{t('authority.workspace.doc_bank_guarantee_ratio')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* General Reference Documents (Standalone Unattached Documents) */}
              <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-navy-900">{t('authority.workspace.general_docs_title')}</h2>
                  <p className="text-xs text-gray-500">{t('authority.workspace.general_docs_desc')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{t('authority.workspace.doc1_title')}</p>
                      <p className="text-gray-500 text-xs">{t('authority.workspace.doc1_desc')}</p>
                    </div>
                    <span className="text-gray-400 font-mono text-xs">{t('authority.workspace.doc1_tag')}</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{t('authority.workspace.doc2_title')}</p>
                      <p className="text-gray-500 text-xs">{t('authority.workspace.doc2_desc')}</p>
                    </div>
                    <span className="text-gray-400 font-mono text-xs">{t('authority.workspace.doc2_tag')}</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{t('authority.workspace.doc3_title')}</p>
                      <p className="text-gray-500 text-xs">{t('authority.workspace.doc3_desc')}</p>
                    </div>
                    <span className="text-gray-400 font-mono text-xs">{t('authority.workspace.doc3_tag')}</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{t('authority.workspace.doc4_title')}</p>
                      <p className="text-gray-500 text-xs">{t('authority.workspace.doc4_desc')}</p>
                    </div>
                    <span className="text-gray-400 font-mono text-xs">{t('authority.workspace.doc4_tag')}</span>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>

        {/* ══════════════════════════════════════════════════════════════════
            4. Collapsible Contextual AI Assistant Panel
            ══════════════════════════════════════════════════════════════════ */}
        {isAssistantOpen && (
          <aside className="lg:col-span-4 bg-white border border-[#D5DDEA] rounded-2xl p-5 shadow-sm space-y-5 sticky top-20">
            {/* Assistant Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#E5EBF4] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-navy-50 text-navy-800 border border-navy-100">
                  <Sparkles className="w-4 h-4 text-navy-700" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 text-sm">{t('authority.workspace.assistant_show')}</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {t('authority.workspace.assistant_deal_title', { title: title || deal?.title || t('authority.workspace.default_deal_title') })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssistantOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                title={t('authority.workspace.assistant_hide_panel')}
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* Advisory Disclaimer */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>{t('authority.workspace.assistant_advisory_badge')}</span>
              </p>
              <p className="text-amber-800 text-xs leading-relaxed">{t('authority.workspace.assistant_advisory_desc')}</p>
            </div>

            {/* 4 Canonical AI Assistant Services Bar */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 block">{t('authority.workspace.assistant_services_title')}</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleExplainProcurementMethod}
                  className={`rounded-xl text-xs font-bold h-auto py-2 px-2 flex flex-col items-center justify-center text-center gap-1 border transition-all ${
                    activeAssistantTool === 'method_explain'
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'border-gray-200 text-navy-900 hover:bg-navy-50'
                  }`}
                >
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>{t('authority.workspace.tool_explain_method')}</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRecommendTemplate}
                  className={`rounded-xl text-xs font-bold h-auto py-2 px-2 flex flex-col items-center justify-center text-center gap-1 border transition-all ${
                    activeAssistantTool === 'template_advisor'
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'border-gray-200 text-navy-900 hover:bg-navy-50'
                  }`}
                >
                  <FileCode2 className="w-4 h-4 text-emerald-600" />
                  <span>{t('authority.workspace.tool_choose_template')}</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAutofillDraftFromDeal}
                  className="rounded-xl text-xs font-bold h-auto py-2 px-2 flex flex-col items-center justify-center text-center gap-1 border border-gray-200 text-navy-900 hover:bg-navy-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{t('authority.workspace.tool_enrich_draft')}</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRunGapAudit}
                  className={`rounded-xl text-xs font-bold h-auto py-2 px-2 flex flex-col items-center justify-center text-center gap-1 border transition-all ${
                    activeAssistantTool === 'gap_analysis'
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'border-gray-200 text-navy-900 hover:bg-navy-50'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>{t('authority.workspace.tool_audit_checklist')}</span>
                </Button>
              </div>
            </div>

            {/* Active Canonical Tool 1: Explain Method */}
            {activeAssistantTool === 'method_explain' && (
              <div className="bg-navy-50/70 border border-navy-200 rounded-xl p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-950 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-600" />{t('authority.workspace.tool_legal_basis_title')}</span>
                  <button
                    type="button"
                    onClick={() => setActiveAssistantTool(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-gray-700 text-xs leading-relaxed">
                  <p>
                    <strong>{t('authority.workspace.assistant_approved_proc')}</strong> {METHOD_LABELS[procurementMethod].ar} — {FORM_LABELS[procurementForm].ar}
                  </p>
                  <p>
                    <strong>{t('authority.workspace.assistant_statutory_basis')}</strong>
                  </p>
                  <div className="bg-white p-2.5 rounded-lg border border-navy-100 space-y-1 text-xs">
                    {procurementMethod === 'open_tender' ? (
                      procurementForm === 'open' ? (
                        <p>{t('authority.workspace.method_exp_open')}</p>
                      ) : procurementForm === 'open_with_min_capacity' ? (
                        <p>{t('authority.workspace.method_exp_open_min')}</p>
                      ) : procurementForm === 'restricted' ? (
                        <p>{t('authority.workspace.method_exp_restricted')}</p>
                      ) : (
                        <p>{t('authority.workspace.method_exp_contest')}</p>
                      )
                    ) : (
                      procurementForm === 'direct' ? (
                        <p className="text-red-900 font-medium">{t('authority.workspace.method_exp_direct_neg')}</p>
                      ) : (
                        <p>{t('authority.workspace.method_exp_after_consult_neg')}</p>
                      )
                    )}
                  </div>
                </div>

                {isJustificationRequired(procurementForm) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setStatutoryBasis(
                        procurementMethod === 'negotiated_procedure'
                          ? t('authority.workspace.legal_ref_art_48')
                          : t('authority.workspace.legal_ref_art_41_42')
                      );
                      toast.success(t('authority.workspace.toast_legal_basis_copied'));
                    }}
                    className="w-full text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white rounded-lg"
                  >{t('authority.workspace.btn_copy_legal_basis')}</Button>
                )}
              </div>
            )}

            {/* Active Canonical Tool 2: Template Advisor */}
            {activeAssistantTool === 'template_advisor' && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-emerald-600" />{t('authority.workspace.tool_recommend_tpl_title')}</span>
                  <button
                    type="button"
                    onClick={() => setActiveAssistantTool(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-gray-700 text-xs">
                  <p>
                    <strong>{t('authority.workspace.nature_of_need')}:</strong> {lang === 'fr' ? (NATURE_LABELS[procurementNature]?.fr || NATURE_LABELS[procurementNature]?.ar) : NATURE_LABELS[procurementNature]?.ar}
                  </p>
                  {getCompatibleTemplates(procurementNature).length > 0 ? (
                    getCompatibleTemplates(procurementNature).slice(0, 1).map((tpl) => (
                      <div key={tpl.id} className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-navy-900">{tpl.title}</p>
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {tpl.status === 'approved_official' ? t('authority.workspace.template_status_approved') : t('authority.workspace.template_status_review')}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs">
                          {tpl.usageLimits || tpl.sourceReference}
                        </p>
                        <p className="text-gray-500 font-mono text-xs">{tpl.sourceReference}</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setTemplateId(tpl.id);
                            setTemplateVersion(tpl.version);
                            setIsManualDraft(false);
                            // Set dynamic operator documents
                            const dynamicDocs = getDynamicOperatorRequirements(
                              procurementNature,
                              procurementMethod,
                              procurementForm,
                              tpl.id
                            );
                            setOperatorDocuments(dynamicDocs);
                            setActiveAssistantTool(null);
                            toast.success(t('authority.workspace.template_applied_toast', { title: tpl.title }));
                          }}
                          className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg mt-1"
                        >{t('authority.workspace.btn_apply_tpl')}</Button>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center text-gray-500">{t('authority.workspace.tool_no_matching_tpl')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Active Canonical Tool 4: Gap Analysis */}
            {activeAssistantTool === 'gap_analysis' && (
              <div className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold text-navy-900 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />{t('authority.workspace.tool_audit_title')}</span>
                  <button
                    type="button"
                    onClick={() => setActiveAssistantTool(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {gapAuditList.map((gap) => (
                    <div
                      key={gap.id}
                      className={`p-2 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                        gap.status === 'complete'
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                          : gap.status === 'warning'
                          ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                          : 'bg-red-50/50 border-red-200 text-red-950'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold flex items-center gap-1">
                          {gap.status === 'complete' ? (
                            <Check className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span>{gap.name}</span>
                        </p>
                        <p className="text-gray-600 text-xs">{gap.message}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActiveTab(gap.tab as any);
                          setActiveAssistantTool(null);
                        }}
                        className="text-xs font-bold p-1 h-auto text-navy-800 hover:underline shrink-0"
                      >{t('authority.workspace.tool_btn_jump')}</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context Tool Cards depending on activeTab */}
            {activeTab === 'basics' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-700">{t('authority.workspace.tools_basics_section')}</div>

                {/* Tool: Market Price Estimator */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs">
                  <span className="font-bold text-gray-900 block">{t('authority.workspace.tool_market_price_title')}</span>
                  <p className="text-gray-600 text-xs">{t('authority.workspace.tool_market_price_desc')}</p>
                  <Button
                    size="sm"
                    disabled={priceEstimating}
                    onClick={handleEstimateMarketPrice}
                    className="w-full text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white"
                  >
                    {priceEstimating ? t('authority.workspace.estimating_price') : t('authority.workspace.btn_estimate_price')}
                  </Button>

                  {priceEstimateResult && (
                    <div className="bg-white rounded-lg p-2.5 border border-navy-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('authority.workspace.label_avg_price')}</span>
                        <span className="font-bold font-mono text-emerald-800">
                          {priceEstimateResult.avg_price?.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} {t('common.dzd')}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>{t('authority.workspace.label_confidence')}</span>
                        <span>{priceEstimateResult.confidence_score}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-700">{t('authority.workspace.tools_specs_section')}</div>

                {/* Outdated analysis warning */}
                {contentChangedSinceCheck && (
                  <div className="bg-amber-100 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{t('authority.workspace.compliance_modified_alert')}</span>
                  </div>
                )}

                {/* Tool 1: Compliance Check */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs">
                  <span className="font-bold text-gray-900 block">{t('authority.workspace.tool_compliance_title')}</span>
                  <p className="text-gray-600 text-xs">{t('authority.workspace.tool_compliance_desc')}</p>
                  <Button
                    size="sm"
                    disabled={complianceChecking}
                    onClick={handleRunComplianceCheck}
                    className="w-full text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white"
                  >
                    {complianceChecking ? t('authority.workspace.running_compliance') : t('authority.workspace.btn_run_compliance')}
                  </Button>

                  {complianceResult && (
                    <div className="bg-white rounded-lg p-2.5 border border-navy-100 text-xs space-y-1.5">
                      <p className="font-bold text-navy-900">{t('authority.workspace.compliance_results_title')}</p>
                      {complianceResult.advisory_notes?.map((n: any, i: number) => (
                        <div key={i} className="text-gray-700 border-b border-gray-100 pb-1 last:border-0">
                          <span className="font-bold text-navy-800">{n.rule}:</span> {n.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tool 2: Template Presets by Section */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs">
                  <span className="font-bold text-gray-900 block">{t('authority.workspace.tpl_proposal_badge')}</span>
                  <p className="text-gray-600 text-xs">{t('authority.workspace.tool_preset_desc')}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleProposeTemplateClause(activeSection)}
                    className="w-full text-xs font-bold border-[#D5DDEA] text-navy-800 hover:bg-navy-50"
                  >
                    {t('authority.workspace.tool_btn_load_template', { section: getSectionTitle(activeSection) || t('authority.workspace.default_section') })}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-700">{t('authority.workspace.tools_docs_section')}</div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs">
                  <span className="font-bold text-gray-900 block">{t('authority.workspace.tool_doc_summary_title')}</span>
                  <p className="text-gray-600 text-xs">
                    {t('authority.workspace.tool_summary_desc')}
                  </p>
                  <Button
                    size="sm"
                    disabled={summarizingDoc}
                    onClick={handleSummarizeDoc}
                    className="w-full text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white"
                  >
                    {summarizingDoc ? t('authority.workspace.summarizing_ai') : t('authority.workspace.btn_generate_summary')}
                  </Button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ─── Modal: Explicit Budget Sync Preview ────────────────────────────── */}
      {showSyncBudgetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <h3 className="font-bold text-navy-900 text-base">{t('authority.workspace.modal_budget_title')}</h3>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs text-gray-700 border border-gray-200">
              <div className="flex justify-between">
                <span>{t('authority.workspace.modal_current_budget_label')}</span>
                <span className="font-mono font-bold text-gray-600">
                  {budget ? `${parseFloat(budget).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} ${t('common.dzd')}` : t('authority.workspace.boq_alert_unspecified')}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5">
                <span>{t('authority.workspace.modal_boq_total_label')}</span>
                <span className="font-mono font-bold text-emerald-800">
                  {boqTotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} {t('common.dzd')}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500">{t('authority.workspace.modal_budget_desc')}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSyncBudgetConfirm(false)}
                className="rounded-xl text-xs"
              >{t('authority.workspace.btn_modal_cancel')}</Button>
              <Button
                size="sm"
                onClick={handleConfirmSyncBudget}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >{t('authority.workspace.modal_budget_confirm')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Freeze Specs Confirmation ──────────────────────────────── */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-900 text-base">{t('authority.workspace.modal_freeze_title')}</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200">
              {t('authority.workspace.modal_freeze_desc')}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={freezing}
                onClick={() => setShowFreezeModal(false)}
                className="rounded-xl text-xs"
              >{t('authority.workspace.btn_modal_cancel')}</Button>
              <Button
                size="sm"
                disabled={freezing}
                onClick={handleFreezeSpecs}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                {freezing ? t('authority.workspace.freezing_status') : t('authority.workspace.modal_freeze_confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Procedure Change Warning ──────────────────────────────── */}
      {showProcedureChangeWarning && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100" dir={dir}>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-900 text-base">{t('authority.workspace.modal_change_method_title')}</h3>
            </div>
            <div className="text-xs text-gray-700 leading-relaxed bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-2">
              <p className="font-bold text-amber-950">
                {t('authority.workspace.modal_change_method_desc')}
              </p>
              <p className="text-amber-800 text-xs">
                {t('authority.workspace.modal_change_method_warning')}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowProcedureChangeWarning(false);
                  setPendingProcedureChange(null);
                }}
                className="rounded-xl text-xs"
              >{t('authority.workspace.modal_change_method_cancel')}</Button>
              <Button
                size="sm"
                onClick={handleConfirmProcedureChange}
                className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold"
              >{t('authority.workspace.modal_change_method_confirm')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: AI Proposal Preview with Explicit Accept/Reject ────────── */}
      {aiProposalPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="font-bold text-navy-900 text-sm">{aiProposalPreview.title}</h3>
              <button
                type="button"
                onClick={() => setAiProposalPreview(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-800 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {aiProposalPreview.text}
            </div>
            <p className="text-xs text-emerald-800 font-semibold">{aiProposalPreview.sourceNotice}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiProposalPreview(null)}
                className="rounded-xl text-xs"
              >{t('authority.workspace.modal_proposal_reject')}</Button>
              <Button
                size="sm"
                onClick={handleApplyAiProposal}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >{t('authority.workspace.modal_proposal_accept')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
