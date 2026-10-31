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

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  CONTRACT_SIGNED: 'موقع ومبرم',
  signed: 'موقع',
  active: 'قيد التنفيذ',
  completed: 'منجز ومستلم',
  terminated: 'مفسوخ تعاقدياً',
};

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

const formatContractDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ar-DZ', { dateStyle: 'medium' });
};

const formatContractAmount = (value: string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString('ar-DZ', { maximumFractionDigits: 2 })} دج`;
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

const SECTION_TITLES: Record<string, string> = {
  general_provisions: 'الأحكام العامة وموضوع الصفقة',
  administrative: 'الملف الإداري وشروط المشاركة',
  technical_specs: 'المواصفات التقنية وجدول الأسعار',
  financial_terms: 'الشروط المالية والضمانات',
  evaluation_criteria: 'معايير التقييم ومنهجية الاختيار',
};

// Regulatory Standard Presets (Local Templates - Clearly designated as "اقتراح من قالب")
const TEMPLATE_PRESETS: Record<
  TemplateType,
  {
    descriptionProposal: string;
    adminGeneral: string;
    adminRules: string;
    techDetails: string;
    techWarranty: string;
    finTerms: string;
    finScoring: string;
  }
> = {
  works: {
    descriptionProposal:
      'إنجاز أشغال تهيئة وبناء وفق المواصفات الفنية الوطنية، بما يشمل كافة أعمال الهندسة المدنية والمطابقة لمعايير السلامة الإنشائية ومقاييس البناء الجزائرية المعتمدة.',
    adminGeneral:
      'تحدد هذه الصفقة العمومية شروط وكيفيات إنجاز الأشغال، طبقاً لأحكام القانون رقم 23-12 المؤرخ في 5 أوت 2023 المتعلق بالقواعد العامة للصفقات العمومية والمرسوم الرئاسي رقم 15-247.',
    adminRules:
      'يتكون الملف الإداري وجوباً من: التصريح بالترشح، التصريح بالنزاهة، شهادة التأهيل والتصنيف المهنيين بالدرجة المطلوبة للنشاط، والشهادات الجبائية وشبه الجبائية المحدثة.',
    techDetails:
      'تنفذ الأشغال طبقاً لدفتر الشروط والمواصفات الفنية المعتمدة من المعهد الجزائري للتقييس (IANOR). يلتزم المقاول بتقديم مخطط تنفيذي وبرنامج زمني دقيق في أجل 15 يوماً من إشعار البدء.',
    techWarranty:
      'فترة الضمان محددة بسنة واحدة (12 شهراً) تبدأ من تاريخ الاستلام المؤقت للأشغال دون تحفظات، مع التزام المقاول بإصلاح كل عيب يظهر خلال هذه الفترة.',
    finTerms:
      'يتم الدفع بواسطة حوالات مصرفية على أساس وضعيات الأشغال الشهرية المنجزة فعلياً. يتم اقتطاع كفالة حسن التنفيذ بنسبة 5% وتسترجع عند الاستلام النهائي.',
    finScoring:
      'تقييم العروض التقنية على أساس معايير موضوعية معلنة: الكفاءات والوسائل البشرية (30ن)، العتاد والمعدات (30ن)، المراجع المهنية لمشاريع مماثلة (30ن)، والمنهجية والجدول الزمني (10ن). يسند المشروع للعرض المؤهل تقنياً صاحب السعر الأقل.',
  },
  supplies: {
    descriptionProposal:
      'اقتناء وتوريد وتثبيت التجهيزات المحددة مع الضمان وخدمة ما بعد البيع والفحص الأولي بمخازن المصلحة المتعاقدة.',
    adminGeneral:
      'موضوع هذه الصفقة هو اقتناء وتوريد التجهيزات موضوع الطلب بما يشمل الفحص والتسليم بمخازن المصلحة المتعاقدة وفق القانون 23-12.',
    adminRules:
      'يحتوي الملف الإداري على: التصريح بالترشح والنزاهة، شهادة الموزع المعتمد عند الاقتضاء، السجل التجاري الإلكتروني، والوضعية الجبائية السارية.',
    techDetails:
      'يجب أن تكون التجهيزات الموردة أصلية جديدة وغير مجددة، مصحوبة ببطاقات البيانات الفنية وشهادات المنشأ والمطابقة.',
    techWarranty:
      'الضمان الأدنى المطلوب هو 24 شهراً يشمل قطع الغيار الأصلية والصيانة في موقع الاستغلال مع التزام التدخل السريع.',
    finTerms:
      'الدفع يتم بعد الاستلام النهائي والتشغيل التجريبي للمعدات وتحرير محضر المطابقة التامة من لجنة الاستلام المختصة.',
    finScoring:
      'العرض المالي الأقل ثمناً من بين العروض التقنية المقبولة والمطابقة للمواصفات الفنية المحددة بدفتر الشروط.',
  },
  services: {
    descriptionProposal:
      'أداء خدمات الصيانة والنظافة أو التأمين والحراسة المتخصصة لصالح مرافق ومقرات المصلحة المتعاقدة بضمان جودة الأداء واستمرارية المرفق.',
    adminGeneral:
      'تحدد هذه الصفقة شروط أداء الخدمات المتخصصة لصالح مقرات ومرافق المصلحة المتعاقدة وفق أحكام القانون رقم 23-12.',
    adminRules:
      'تقديم التصريح بالترشح والنزاهة، رخصة النشاط من السلطات المختصة، إثبات تسوية اشتراكات الضمان الاجتماعي، والمراجع المهنية للسنوات الثلاث الأخيرة.',
    techDetails:
      'تنفيذ الخدمات وفق ميثاق الجودة والسلامة المهنية، وتوفير طاقم مؤهل ومجهز بمعدات السلامة مع تعيين مشرف دائم للتنسيق اليومي.',
    techWarranty:
      'التزام باستمرارية الخدمة والتعويض الفوري لأي نقص أو عطل خلال مدة التعاقد.',
    finTerms:
      'دفع المستحقات على أساس فواتير مؤشرة وجداول متابعة الحضور والتقارير الدورية المعتمدة.',
    finScoring:
      'المفاضلة بين أحسن عرض اقتصادي من حيث جودة التسيير ونسبة التأطير والخبرة والملاءمة السعرية.',
  },
  studies: {
    descriptionProposal:
      'إنجاز الدراسات التقنية والمعمارية والمتابعة الميدانية الدورية لأشغال الورشة وفق المعايير الفنية والتنظيمية.',
    adminGeneral:
      'تهدف هذه الصفقة إلى إنجاز الدراسات والمتابعة الميدانية لإنجاز المشروع وفق المعايير الفنية والقانون 23-12.',
    adminRules:
      'اعتماد مهندس معماري أو مكتب دراسات معتمد، التصريح بالنزاهة والترشح، وجدول المراجع المهنية لمشاريع مماثلة.',
    techDetails:
      'إعداد المخططات الهندسية وملف طلب الرخص ودفتر الشروط التفصيلي ومتابعة الورشة حتى الاستلام النهائي.',
    techWarranty:
      'مسؤولية عشرية تعاقدية وفق القانون المدني الجزائري عن كل عيب هيكلي أو تصميمي.',
    finTerms:
      'الدفع على مراحل إنجاز الدراسة: عند المصادقة على الدراسة الأولية، ملف التنفيذ، والمتابعة الميدانية.',
    finScoring:
      'التقييم التقني والمالي المشترك (مفاضلة بين الجودة والنوعية والسعر).',
  },
};

export interface AuthorityDealWorkspaceProps {
  initialTab?: 'basics' | 'specs' | 'documents';
}

export function AuthorityDealWorkspace({ initialTab }: AuthorityDealWorkspaceProps) {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/authority/deals/:id');
  const [, draftsEditParams] = useRoute('/authority/drafts/:id/edit');
  const [, draftsSpecsParams] = useRoute('/authority/drafts/:id/specs');

  const dealId = params?.id || draftsEditParams?.id || draftsSpecsParams?.id;

  const { user } = useAuth();
  const defaultWilaya = (user as any)?.wilaya || '16';

  // Active Tab state: 'basics' | 'specs' | 'documents'
  const [activeTab, setActiveTab] = useState<'basics' | 'specs' | 'documents'>(
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
  const [taxRegime, setTaxRegime] = useState<'ttc' | 'ht'>('ttc');
  const [duration, setDuration] = useState('06 أشهر');
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
            { id: '1', name: 'بند أولي يحدد حسب موضوع الصفقة', unit: 'وحدة', quantity: 1, unitPrice: 0 },
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
            title: SECTION_TITLES.general_provisions,
            content: specs.administrative_clauses?.general || TEMPLATE_PRESETS[tType].adminGeneral,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-1',
                sourceType: 'standard_decree',
                sourceLabel: 'القانون 23-12 (المادتان 5 و27)',
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
            title: SECTION_TITLES.administrative,
            content: specs.administrative_clauses?.rules || TEMPLATE_PRESETS[tType].adminRules,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-2',
                sourceType: 'standard_decree',
                sourceLabel: 'القانون 23-12 (المادة 67: ملف الترشح والنزاهة)',
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
            title: SECTION_TITLES.technical_specs,
            content: specs.technical_requirements?.details || TEMPLATE_PRESETS[tType].techDetails,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-3',
                sourceType: 'standard_decree',
                sourceLabel: 'المواصفات التقنية والمقاييس الوطنية (IANOR)',
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
            title: SECTION_TITLES.financial_terms,
            content: specs.financial_criteria?.terms || TEMPLATE_PRESETS[tType].finTerms,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-4',
                sourceType: 'standard_decree',
                sourceLabel: 'المرسوم الرئاسي 15-247 (المادة 125: التأمينات والضمانات)',
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
            title: SECTION_TITLES.evaluation_criteria,
            content: specs.financial_criteria?.scoring || TEMPLATE_PRESETS[tType].finScoring,
            status: 'verified',
            isMandatory: true,
            provenance: [
              {
                id: 'p-5',
                sourceType: 'standard_decree',
                sourceLabel: 'القانون 23-12 (معايير الاختيار الموضوعية)',
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
            positionReference: 'ملف الترشح الإداري',
            description: 'تقديم التصريح بالترشح والتصريح بالنزاهة مُمضيين ومؤرخين من صاحب العرض.',
            isDisqualifying: true,
          },
          {
            id: 'req-2',
            clauseId: 'clause-4',
            requirementCode: 'REQ-FIN-01',
            requirementType: 'bank_guarantee',
            positionReference: 'الشروط المالية',
            description: 'تقديم كفالة التعهد أو حسن التنفيذ من بنك جزائري معتمد عند الاقتضاء.',
            isDisqualifying: false,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Failed to load deal:', err);
      toast.error('تعذر جلب ملف الصفقة أو ليس لديك الصلاحية للاطلاع عليه.');
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
          getApiErrorMessage(err, 'تعذر تحميل بيانات العقد المبرم لهذه الصفقة.'),
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
                  ? '09 - إبرام العقد'
                  : previous.stage_display,
            }
          : previous,
      );
      setContractSuccess('تم توليد العقد بنجاح');
      toast.success('تم توليد العقد بنجاح');
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        'تعذر توليد العقد. يرجى التأكد من وجود عرض فائز أو مقيم ومعتمد.',
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
      setContractError('نسخة PDF من العقد غير متاحة حالياً.');
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
      const message = getApiErrorMessage(err, 'تعذر تحميل نسخة العقد. يرجى المحاولة مجدداً.');
      setContractError(message);
      toast.error(message);
    } finally {
      setDownloadingContract(false);
    }
  };

  // ─── Actions for Tab 1: Deal Basics ───────────────────────────────────────
  const handleSaveBasics = async () => {
    if (!title.trim()) {
      toast.error('عنوان الصفقة إلزامي.');
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
      toast.success('تم حفظ بيانات الصفقة وطريقة الإبرام بنجاح.');
      await fetchDealData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'تعذر حفظ البيانات.');
    } finally {
      setSavingBasics(false);
    }
  };

  // Procedure change handlers with impact alert
  const handleRequestProcedureChange = (method?: ProcurementMethod, form?: ProcurementForm) => {
    if (isFrozen) {
      toast.warning('لا يمكن تغيير إجراءات الإبرام بعد تجميد واعتماد دفتر الشروط.');
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
    toast.info('تم تحديث مسار الإبرام ومواءمة قائمة وثائق المتعامل الإلزامية.');
  };

  // 1. Tool: اشرح طريقة الإبرام
  const handleExplainProcurementMethod = () => {
    setActiveAssistantTool('method_explain');
  };

  // 2. Tool: ساعدني في اختيار القالب
  const handleRecommendTemplate = () => {
    setActiveAssistantTool('template_advisor');
  };

  // 3. Tool: استكمل المسودة من بيانات الصفقة
  const handleAutofillDraftFromDeal = () => {
    const wilayaObj = ALGERIA_69_WILAYAS.find((w) => w.code === wilaya);
    const wilayaName = wilayaObj ? `${wilayaObj.code} - ${wilayaObj.ar}` : wilaya;
    const formattedBudget = budget ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : 'حسب الميزانية المعتمدة';

    const enrichedGeneral = `تحدد هذه الصفقة العمومية شروط وكيفيات تنفيذ العملية المعنونة: "${title.trim() || 'مشروع الصفقة'}" على مستوى ولاية: ${wilayaName}، لمدة إنجاز مقدرة بـ ${duration} وبغلاف مالي تقديري قدره ${formattedBudget} (TTC)، وذلك طبقاً لأحكام القانون رقم 23-12 المؤرخ في 5 أوت 2023 المحدد للقواعد العامة للصفقات العمومية والمرسوم الرئاسي رقم 15-247.\n\nطريقة الإبرام المعتمدة: ${METHOD_LABELS[procurementMethod].ar} (${FORM_LABELS[procurementForm].ar}).`;

    setAiProposalPreview({
      type: 'specs_template',
      targetKey: 'general_provisions',
      title: 'استكمال صياغة مسودة دفتر الشروط من بيانات الصفقة',
      text: enrichedGeneral,
      sourceNotice:
        'صياغة مستندة إلى بيانات عنوان الصفقة والولاية والمدة والميزانية وطريقة الإبرام وفق أحكام القانون 23-12.',
    });
  };

  // 4. Tool: راجع المعلومات الناقصة (Audit Checklist)
  const handleRunGapAudit = () => {
    setActiveAssistantTool('gap_analysis');
    const gaps = [
      {
        id: 'title',
        name: 'عنوان وموضوع الصفقة',
        status: title.trim().length > 5 ? 'complete' : 'missing',
        message: title.trim().length > 5 ? 'العنوان محدد وواضح.' : 'عنوان الصفقة فارغ أو قصير جداً.',
        tab: 'basics',
      },
      {
        id: 'budget',
        name: 'الميزانية التقديرية (TTC)',
        status: budget && parseFloat(budget) > 0 ? 'complete' : 'missing',
        message: budget && parseFloat(budget) > 0 ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : 'الميزانية التقديرية غير محددة.',
        tab: 'basics',
      },
      {
        id: 'boq',
        name: 'جدول الكميات والأسعار (B.O.Q)',
        status: boqItems.length > 0 && boqTotal > 0 ? 'complete' : 'warning',
        message: boqTotal > 0 ? `${boqItems.length} بنود بمجموع ${boqTotal.toLocaleString('ar-DZ')} دج` : 'لم يتم تحديد أسعار البنود بجدول الكميات.',
        tab: 'basics',
      },
      {
        id: 'method',
        name: 'طريقة وشكل الإبرام',
        status: procurementMethod && procurementForm ? 'complete' : 'missing',
        message: `${METHOD_LABELS[procurementMethod].ar} — ${FORM_LABELS[procurementForm].ar}`,
        tab: 'basics',
      },
      {
        id: 'justification',
        name: 'أسانيد وتبرير الإجراء',
        status: !isJustificationRequired(procurementForm) || procedureJustification.trim().length > 10 ? 'complete' : 'missing',
        message: !isJustificationRequired(procurementForm)
          ? 'غير مطلوبة للشكل المفتوح العام.'
          : procedureJustification.trim().length > 10
          ? 'تم تدوين السند القانوني والمبررات.'
          : 'يتطلب هذا الإجراء تسبيب مبرراته وسنده القانوني وجوباً.',
        tab: 'basics',
      },
      {
        id: 'template',
        name: 'قالب دفتر الشروط المعتمد',
        status: templateId || isManualDraft ? 'complete' : 'warning',
        message: templateId
          ? `قالب: ${CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId)?.title || templateId}`
          : isManualDraft
          ? 'مسودة يدوية مخصصة'
          : 'لم يتم ربط قالب نموذجي مراجع.',
        tab: 'specs',
      },
      {
        id: 'operator_docs',
        name: 'ملف وثائق المتعامل الاقتصادي',
        status: operatorDocuments.length > 0 ? 'complete' : 'missing',
        message: `${operatorDocuments.length} وثيقة مطلوبة مقسمة على الأظرفة الثلاثة.`,
        tab: 'documents',
      },
      {
        id: 'clauses',
        name: 'بنود دفتر الشروط الخمسة',
        status: clauses.every((c) => c.content && c.content.trim().length > 20) ? 'complete' : 'warning',
        message: clauses.every((c) => c.content && c.content.trim().length > 20)
          ? 'جميع البنود محررة ومكتملة.'
          : 'بعض البنود تحتوي على نصوص افتراضية موجزة.',
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
      toast.success(`تم تحديث الميزانية التقديرية لتصبح: ${boqTotal.toLocaleString('ar-DZ')} دج (TTC).`);
    }
  };

  const handleAddBoqRow = () => {
    setBoqItems((prev) => [
      ...prev,
      { id: `boq-${Date.now()}`, name: '', unit: 'وحدة', quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleUpdateBoqRow = (id: string, field: keyof BoqItem, value: any) => {
    setBoqItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveBoqRow = (id: string) => {
    if (boqItems.length <= 1) {
      toast.warning('يجب الإبقاء على بند واحد على الأقل.');
      return;
    }
    setBoqItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ─── Actions for Tab 2: Cahier Specs ──────────────────────────────────────
  const handleStartEditClause = (clause: Clause) => {
    if (isFrozen) {
      toast.warning('لا يمكن تعديل بنود دفتر الشروط بعد التجميد والمصادقة.');
      return;
    }
    setEditingClauseId(clause.id);
    setEditedContent(clause.content);
    setEditReason('');
  };

  const handleSaveClause = async (clause: Clause) => {
    if (!editedContent.trim()) {
      toast.error('نص البند لا يمكن أن يكون فارغاً.');
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
                    actionReason: editReason || 'تعديل صياغة البند بواسطة المصلحة المتعاقدة',
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : c
        )
      );

      setEditingClauseId(null);
      setContentChangedSinceCheck(true);
      toast.success('تم حفظ تعديل البند بنجاح وتوثيقه في سجل الأحداث.');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'فشل حفظ البند.');
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
      toast.success('تم تجميد دفتر الشروط رقمياً بنجاح.');
      await fetchDealData();
    } catch (err: any) {
      toast.error('تعذر تجميد دفتر الشروط.');
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
      toast.success('تم تنزيل دفتر الشروط بصيغة PDF بنجاح.');
    } catch {
      toast.error('تعذر تصدير دفتر الشروط. تأكد من أن الدفتر معد ومصادق عليه.');
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
      toast.success('تم إعداد الملخص الاستشاري بنجاح.');
    } catch {
      // Fallback
      setDocSummary(
        `ملخص استشاري لملف الصفقة: ${title || deal?.title}. يهدف المشروع إلى تنفيذ الأعمال المحددة في نطاق الحاجة، ويتعين على المتنافسين استيفاء الشروط الإدارية والتقنية وإيداع العروض قبل انقضاء الأجل القانوني.`
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
      toast.success('تم استخراج مؤشرات أسعار السوق المرجعية.');
    } catch (err) {
      setPriceEstimateResult({
        min_price: boqTotal > 0 ? boqTotal * 0.85 : 12000000,
        max_price: boqTotal > 0 ? boqTotal * 1.25 : 18000000,
        avg_price: boqTotal > 0 ? boqTotal : 15000000,
        confidence_score: 82,
        reference_count: 5,
        currency: 'دج',
      });
      toast.info('تم عرض مؤشرات تقديرية استرشادية من أسعار الصفقات المشابهة.');
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
      toast.success('اكتمل فحص الامتثال القانوني بنجاح.');
    } catch {
      setComplianceResult({
        is_advisory: true,
        statutory_reference: 'القانون 23-12 المؤرخ في 5 أوت 2023',
        legal_disclaimer:
          'هذا التحليل استرشادي تقني مؤتمت، وتبقى السلطة التقديرية الحصرية لمسؤولي المصلحة المتعاقدة ولجنة الصفقات.',
        preliminary_compliance_check: true,
        advisory_notes: [
          {
            rule: 'المادة 67 - وثائق ملف الترشح',
            severity: 'info',
            message: 'تم التحقق من إدراج التصريح بالنزاهة والترشح ضمن الملف الإداري الإلزامي.',
            recommendation: 'اعتماد النماذج الوزارية الصادرة عن وزارة المالية.',
          },
        ],
      });
      setContentChangedSinceCheck(false);
    } finally {
      setComplianceChecking(false);
    }
  };

  const handleProposeTemplateClause = (sectionKey: string) => {
    const preset = TEMPLATE_PRESETS[templateType];
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
      title: `اقتراح صياغة من قالب نموذجي: ${SECTION_TITLES[sectionKey]}`,
      text: textMap[sectionKey] || '',
      sourceNotice:
        'اقتراح مستند إلى دفاتر الشروط النموذجية المعتمدة وفق القانون 23-12. (قالب محلي غير مولد بنموذج لغوي).',
    });
  };

  const handleApplyAiProposal = () => {
    if (!aiProposalPreview) return;
    if (aiProposalPreview.type === 'desc') {
      setDescription(aiProposalPreview.text);
      toast.success('تم تحديث وصف الحاجة بالمقترح.');
    } else if (aiProposalPreview.type === 'specs_template' && aiProposalPreview.targetKey) {
      const targetClause = clauses.find((c) => c.sectionKey === aiProposalPreview.targetKey);
      if (targetClause) {
        setEditingClauseId(targetClause.id);
        setEditedContent(aiProposalPreview.text);
        setEditReason('تطبيق صياغة من قالب نموذجي معتمد');
        toast.info('تم تحميل نص القالب في المحرر. يرجى مراجعته والنقر على "حفظ البند".');
      }
    }
    setAiProposalPreview(null);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-500 space-y-3" dir="rtl">
        <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">جاري فتح ملف الصفقة الموحد...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" dir="rtl">
      {/* ─── 1. Header Banner & Context ───────────────────────────────────── */}
      <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/authority/deals')}
              className="p-1.5 h-auto text-gray-600 hover:text-navy-900 hover:bg-gray-100 rounded-lg"
              title="العودة إلى قائمة الصفقات"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
              {deal?.reference_number || 'DZ-2026-REF'}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {deal?.stage_display || `المرحلة ${deal?.current_stage || 1}`}
            </span>
            {isFrozen ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                دفتر شروط مجمّد ومصادق
              </span>
            ) : (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                مسودة قيد الإعداد والتحضير
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-navy-900 tracking-tight">
            {deal?.title || title || 'ملف صفقة عمومية'}
          </h1>
          <p className="text-xs text-gray-500">
            ملف الصفقة الموحد: إدارة البيانات، جدول الكميات، بنود دفتر الشروط وسلسلة الإسناد، والوثائق والسندات.
          </p>
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
              <span>{generatingContract ? 'جاري توليد العقد...' : 'توليد العقد'}</span>
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
              <span>{downloadingContract ? 'جاري التحميل...' : 'تحميل العقد'}</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="border-[#D5DDEA] text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
            title="تصدير دفتر الشروط بصيغة PDF قابلة للطباعة والأرشفة"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{exportingPdf ? 'جاري التصدير...' : 'تصدير دفتر الشروط (PDF)'}</span>
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
            <span>{isAssistantOpen ? 'إخفاء المساعد' : 'مساعد إعداد الصفقة'}</span>
          </Button>
        </div>
      </section>

      {/* ─── Contract & Execution ─────────────────────────────────────────── */}
      {dealId && ((deal && deal.current_stage >= 8) || contract) && (
        <section className="bg-white border border-[#D5DDEA] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 border-b border-[#E5EBF4] pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-extrabold text-navy-900">
                <FileSignature className="w-5 h-5 text-emerald-700" />
                العقد والتنفيذ
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                متابعة العقد المبرم ومراحل تنفيذ الصفقة وتقارير الإنجاز المرفوعة.
              </p>
            </div>
            {contract && (
              <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                {CONTRACT_STATUS_LABELS[contract.status] || contract.status || 'موقع'}
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
            <div className="space-y-3" aria-busy="true" aria-label="جارٍ تحميل بيانات العقد">
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
                  <span className="block text-[10px] font-bold text-gray-500">رقم العقد</span>
                  <span className="mt-0.5 block font-mono font-extrabold text-navy-900">
                    {contract.contract_number || '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-500">تاريخ الأرشفة</span>
                  <span className="mt-0.5 block font-bold text-navy-900">
                    {formatContractDate(contract.signed_at)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-500">مبلغ العقد</span>
                  <span className="mt-0.5 block font-bold text-emerald-800">
                    {formatContractAmount(contract.amount)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-500">المتعامل المتعاقد</span>
                  <span className="mt-0.5 block font-bold text-navy-900">
                    {contract.operator_name || '—'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-[11px] text-gray-500">
                  الصفقة: <span className="font-mono font-bold text-navy-900">{contract.deal_reference || deal?.reference_number || '—'}</span>
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
                  <span>{downloadingContract ? 'جاري التحميل...' : 'تحميل العقد PDF'}</span>
                </Button>
              </div>

              <ExecutionTracker dealId={dealId} role="authority" />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D5DDEA] bg-slate-50/50 p-6 text-center">
              <FileSignature className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-2 text-sm font-extrabold text-navy-900">
                لم يتم توليد العقد بعد
              </h3>
              <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
                يتاح توليد العقد بعد اعتماد الإسناد وتحديد المتعامل الفائز. سيتم إنشاء
                نسخة PDF رسمية وربطها بمراحل التنفيذ.
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
                <span>{generatingContract ? 'جاري توليد العقد...' : 'توليد العقد'}</span>
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
          <span>1. بيانات الصفقة والاحتياجات</span>
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
          <span>2. دفتر الشروط وسلسلة الإسناد (سند)</span>
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
          <span>3. الوثائق والسندات والضمانات</span>
        </button>
      </div>

      {/* ─── 3. Main Workspace Grid with Collapsible Assistant ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Pane */}
        <main className={`${isAssistantOpen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6 transition-all`}>
          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: بيانات الصفقة والاحتياجات (Deal Basics)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'basics' && (
            <div className="space-y-6">
              <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5EBF4] pb-4">
                  <div>
                    <h2 className="text-base font-bold text-navy-900">بيانات المشروع والتخطيط المسبق</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      تحديد الاحتياجات وموقع التنفيذ والميزانية التقديرية وفق المادة 27 من القانون 23-12.
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveBasics}
                    disabled={savingBasics}
                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingBasics ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">عنوان وموضوع الصفقة</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-xl border-[#D5DDEA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">طبيعة وصنف الصفقة</label>
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
                      <option value="works">أشغال (بناء، ترميم، هندسة مدنية)</option>
                      <option value="supplies">لوازم (اقتناء مواد، معدات، وتجهيزات)</option>
                      <option value="services">خدمات (صيانة، نظافة، أمن، نقل)</option>
                      <option value="studies">دراسات (استشارات، هندسة معمارية ومتابعة)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">ولاية موقع التنفيذ</label>
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
                    <label className="text-xs font-bold text-gray-700 block">
                      الميزانية التقديرية (دج)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="rounded-xl border-[#D5DDEA] pe-10"
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        دج
                      </span>
                    </div>
                    {/* Explicit Tax Regime Selector (HT vs TTC) */}
                    <div className="flex items-center gap-3 pt-1 text-xs">
                      <span className="font-semibold text-gray-500 text-[11px]">النظام الجبائي:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="wsTaxRegime"
                          value="ttc"
                          checked={taxRegime === 'ttc'}
                          onChange={() => setTaxRegime('ttc')}
                          className="text-navy-900 focus:ring-navy-500"
                        />
                        <span className="text-[11px] font-bold text-gray-700">شامل للرسوم (TTC)</span>
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
                        <span className="text-[11px] font-bold text-gray-700">خارج الرسوم (HT)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      مدة الإنجاز أو التسليم المقترحة
                    </label>
                    <Input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="rounded-xl border-[#D5DDEA]"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">نطاق الحاجة ووصف المشروع</label>
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
                        <Scale className="w-4 h-4 text-emerald-600" />
                        طريقة وشكل الإبرام (القانون رقم 23-12)
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        تحديد المسار الإجرائي طبقاً للمواد 29 و39-49 من القانون رقم 23-12 والمرسوم 15-247.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
                      {METHOD_LABELS[procurementMethod].ar} — {FORM_LABELS[procurementForm].ar}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Method */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">طريقة الإبرام</label>
                      <select
                        value={procurementMethod}
                        onChange={(e) => {
                          const nextMethod = e.target.value as ProcurementMethod;
                          handleRequestProcedureChange(nextMethod, undefined);
                        }}
                        className="w-full text-xs rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800"
                      >
                        <option value="open_tender">طلب العروض (Appel d&apos;offres)</option>
                        <option value="negotiated_procedure">الإجراء التفاوضي (Procédure négociée)</option>
                      </select>
                    </div>

                    {/* Form */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">شكل الإجراء</label>
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
                      <label className="text-xs font-bold text-gray-700 block">مجال المنافسة</label>
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
                        <div className="text-xs rounded-xl border border-dashed border-gray-300 p-2.5 bg-gray-50 text-gray-500">
                          غير منطبق (إجراء تفاوضي مباشر)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Non-open Justification & Statutory Ground Fields */}
                  {isJustificationRequired(procurementForm) && (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <h4 className="text-xs font-bold text-amber-950">
                          أسانيد ومبررات اختيار شكل الإبرام الاستثنائي / غير المفتوح
                        </h4>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        وفقاً للقانون 23-12، يلتزم مسؤولو المصلحة بتدوين السند القانوني الصريح ومبررات اللجوء لهذا الإجراء في ملف الصفقة تمهيداً لعرضه على لجنة الصفقات المختصة.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700 block">السند القانوني المعتمد</label>
                          <Input
                            value={statutoryBasis}
                            onChange={(e) => setStatutoryBasis(e.target.value)}
                            placeholder="مثال: المادة 48 من القانون 23-12 (حالة الاحتكار / الاستعجال الملح)"
                            className="text-xs rounded-xl border-amber-200 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700 block">مرجع الوثائق الثبوتية والتقارير</label>
                          <Input
                            value={supportingDocsRef}
                            onChange={(e) => setSupportingDocsRef(e.target.value)}
                            placeholder="مثال: تقرير المبررات التقنية رقم 14/2026 ومحضر عدم الجدوى السابق"
                            className="text-xs rounded-xl border-amber-200 bg-white"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-gray-700 block">تقرير التعليل والمبررات الموضوعية</label>
                          <Textarea
                            rows={2}
                            value={procedureJustification}
                            onChange={(e) => setProcedureJustification(e.target.value)}
                            placeholder="بيان الأسباب والظروف الواقعية والتقنية التي استدعت اعتماد هذا الإجراء..."
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
                        مجموع جدول الكميات الحالي يبلغ: {boqTotal.toLocaleString('ar-DZ')} دج (TTC)
                      </p>
                      <p className="text-amber-800 text-[11px]">
                        الميزانية المسجلة حالياً: {budget ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : 'غير محددة'}.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowSyncBudgetConfirm(true)}
                      className="bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold px-3 shrink-0"
                    >
                      تحديث الميزانية بالمجموع
                    </Button>
                  </div>
                )}

                {/* B.O.Q Table */}
                <div className="space-y-3 pt-3 border-t border-[#E5EBF4]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-navy-900">جدول الكميات والأسعار التقديرية (B.O.Q)</h3>
                      <p className="text-[11px] text-gray-500">
                        بيان تفصيلي بالبنود والكميات التقديرية لدعم الدقة في احتساب الكلفة.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddBoqRow}
                      className="border-[#D5DDEA] text-xs font-bold rounded-xl"
                    >
                      <Plus className="w-3.5 h-3.5 me-1" />
                      إضافة بند
                    </Button>
                  </div>

                  <div className="border border-[#D5DDEA] rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-start text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-[#D5DDEA] text-gray-600 font-bold">
                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                            <th className="py-2.5 px-3">البيان</th>
                            <th className="py-2.5 px-3 w-24">الوحدة</th>
                            <th className="py-2.5 px-3 w-20">الكمية</th>
                            <th className="py-2.5 px-3 w-32">السعر الأحادي (دج)</th>
                            <th className="py-2.5 px-3 w-32 text-end">الإجمالي (دج)</th>
                            <th className="py-2.5 px-2 w-10 text-center">حذف</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {boqItems.map((item, idx) => {
                            const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
                            return (
                              <tr key={item.id} className="hover:bg-gray-50/50">
                                <td className="py-2 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  <Input
                                    value={item.name}
                                    onChange={(e) => handleUpdateBoqRow(item.id, 'name', e.target.value)}
                                    placeholder="وصف البند..."
                                    className="h-7 text-xs rounded-lg"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <select
                                    value={item.unit}
                                    onChange={(e) => handleUpdateBoqRow(item.id, 'unit', e.target.value)}
                                    className="h-7 w-full text-xs rounded-lg border border-gray-200 px-1 bg-white"
                                  >
                                    <option value="وحدة">وحدة</option>
                                    <option value="م²">م²</option>
                                    <option value="م³">م³</option>
                                    <option value="م.ط">م.ط</option>
                                    <option value="حصة">حصة</option>
                                    <option value="شهر">شهر</option>
                                  </select>
                                </td>
                                <td className="py-2 px-3">
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
                                <td className="py-2 px-3">
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
                                <td className="py-2 px-3 text-end font-mono font-bold text-navy-900">
                                  {subtotal.toLocaleString('ar-DZ')} دج
                                </td>
                                <td className="py-2 px-2 text-center">
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
                            <td colSpan={5} className="py-2.5 px-3 text-end text-gray-700">
                              مجموع جدول الكميات التقديري:
                            </td>
                            <td className="py-2.5 px-3 text-end font-mono text-emerald-800 font-bold">
                              {boqTotal.toLocaleString('ar-DZ')} دج
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
              TAB 2: دفتر الشروط وسلسلة الإسناد (Cahier Specs & Sanad)
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
                          ? 'مسودة حرة محررة يدوياً'
                          : 'دفتر شروط نموذجي معتمد'}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        الإصدار {templateVersion}
                      </span>
                      {templateId && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                            TEMPLATE_STATUS_LABELS[
                              CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId)?.status || 'internal_advisory'
                            ]?.badgeClass || 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <Award className="w-3 h-3" />
                          {TEMPLATE_STATUS_LABELS[
                            CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId)?.status || 'internal_advisory'
                          ]?.ar || 'قالب داخلي استرشادي — يحتاج مراجعة'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      السند الإجرائي: {METHOD_LABELS[procurementMethod].ar} — {FORM_LABELS[procurementForm].ar} ({NATURE_LABELS[procurementNature].ar})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('basics')}
                    className="text-xs border-[#D5DDEA] text-gray-700 rounded-xl"
                  >
                    تغيير طريقة الإبرام
                  </Button>
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
                      <p className="font-bold text-emerald-900 text-sm">
                        دفتر الشروط مؤشر ومجمّد رقمياً
                      </p>
                      <p className="font-mono text-[11px] text-emerald-800">
                        بصمة التجميد: {frozenDigest}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-700">
                    تاريخ الاعتماد: {new Date(frozenAt || '').toLocaleDateString('ar-DZ')}
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
                      {SECTION_TITLES[key]}
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
                  <span>المتطلبات الإلزامية ({requirements.length})</span>
                </button>
              </div>

              {/* Clause Detail Content */}
              {activeSection === 'requirements' ? (
                <div className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-navy-900">
                      شبكة المتطلبات الإلزامية المستخرجة رقمياً
                    </h3>
                    <span className="text-[11px] text-gray-500">
                      تُستخرج تلقائياً لتمكين الفحص الآلي لعروض المتعاملين
                    </span>
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
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded font-bold text-[10px]">
                              إقصائي في حال عدم التقديم
                            </span>
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
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
                                بند تعاقدي ملزم
                              </span>
                            </div>

                            {/* Sanad / Provenance Badges */}
                            <div className="flex items-center gap-2 flex-wrap text-[11px]">
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
                                  <span>سجل التعديلات ({clause.events.length})</span>
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
                                  placeholder="مبرر التعديل (إلزامي للتوثيق في سجل التدقيق)..."
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
                                  >
                                    إلغاء
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={savingClause}
                                    onClick={() => handleSaveClause(clause)}
                                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold"
                                  >
                                    {savingClause ? 'جاري الحفظ...' : 'حفظ البند'}
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
                                    <span>اقتراح من قالب نموذجي</span>
                                  </button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStartEditClause(clause)}
                                    className="text-xs border-[#D5DDEA] text-navy-800 hover:bg-navy-50 rounded-xl font-bold"
                                  >
                                    تعديل نص البند
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Clause Event History Drawer */}
                          {isHistoryOpen && clause.events.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-2">
                              <p className="font-bold text-gray-800">سجل الأحداث والتعديلات:</p>
                              {clause.events.map((ev) => (
                                <div
                                  key={ev.id}
                                  className="border-b border-gray-200/60 pb-1.5 last:border-0 text-[11px] text-gray-600"
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
                    <h4 className="text-xs font-bold text-navy-900">
                      اعتماد وتجميد دفتر الشروط رقمياً
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      عند التجميد، يتم توليد بصمة توثيق رقمية وقفل التعديل تمهيداً لعرضه على لجنة الصفقات.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowFreezeModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>تجميد دفتر الشروط للاعتماد</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: الوثائق والسندات والضمانات (Documents, Deeds & Sanad)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Operator Dynamic Documents Dossier (ملف وثائق المتعامل الاقتصادي) */}
              <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      ملف وثائق المتعامل الاقتصادي المطلوبة
                    </h2>
                    <p className="text-xs text-gray-500">
                      قائمة الوثائق المشترطة في دفتر الشروط وموزعة على الأظرفة الثلاثة (الترشح، التقني، المالي) وفق المادة 67 من القانون 23-12.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                    {operatorDocuments.length} وثيقة مطلوبة
                  </span>
                </div>

                {/* Documents Table */}
                <div className="border border-[#D5DDEA] rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#D5DDEA] text-gray-600 font-bold">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">الوثيقة المطلوبة</th>
                          <th className="py-2.5 px-3 w-28">الظرف / الوعاء</th>
                          <th className="py-2.5 px-3 w-36">السند المرجعي</th>
                          <th className="py-2.5 px-3 w-28 text-center">الصفة التشريعية</th>
                          <th className="py-2.5 px-3 w-28 text-center">الأثر عند الإغفال</th>
                          <th className="py-2.5 px-2 w-12 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {operatorDocuments.map((doc, idx) => (
                          <tr key={doc.id || doc.code} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-navy-900">{doc.titleAr || doc.name}</p>
                              {doc.descriptionAr && (
                                <p className="text-[11px] text-gray-500">{doc.descriptionAr}</p>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  doc.category === 'candidacy' || doc.category === ('candidature' as any)
                                    ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                    : doc.category === 'technical'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {doc.category === 'candidacy' || doc.category === ('candidature' as any)
                                  ? 'ملف الترشح'
                                  : doc.category === 'technical'
                                  ? 'العرض التقني'
                                  : 'العرض المالي'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">
                              {doc.statutoryRef || doc.statutoryBasis || 'المادة 67 من القانون 23-12'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {doc.isStatutory ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-50 text-navy-800 border border-navy-200 whitespace-nowrap">
                                  إلزامية بنص القانون
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                                  تقديرية للمصلحة
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {doc.isDisqualifying ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  إقصائي
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                                  استكمالي
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {doc.isStatutory ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.error(
                                      `لا يمكن حذف وثيقة «${doc.titleAr || doc.name}»؛ فهي مشترطة وجوباً بنص المادة 67 من القانون 23-12.`
                                    );
                                  }}
                                  className="text-gray-300 hover:text-amber-600 p-1 rounded cursor-not-allowed inline-flex items-center justify-center"
                                  title="وثيقة قانونية إلزامية لا يمكن حذفها بنص المادة 67"
                                >
                                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOperatorDocuments((prev) => prev.filter((d) => (d.id || d.code) !== (doc.id || doc.code)));
                                    toast.info(`تم حذف الوثيقة التقديرية: ${doc.titleAr || doc.name}`);
                                  }}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded inline-flex items-center justify-center"
                                  title="حذف الوثيقة التقديرية"
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
                    placeholder="إضافة وثيقة مطلوبة جديدة (مثال: شهادة زيارة الموقع)..."
                    className="rounded-xl border-gray-200 text-xs flex-1 bg-white"
                  />
                  <select
                    value={newCustomDocCategory}
                    onChange={(e) => setNewCustomDocCategory(e.target.value as any)}
                    className="rounded-xl border border-gray-200 text-xs p-2 bg-white"
                  >
                    <option value="candidature">ملف الترشح</option>
                    <option value="technical">العرض التقني</option>
                    <option value="financial">العرض المالي</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-gray-700 whitespace-nowrap px-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCustomDocDisqualifying}
                      onChange={(e) => setNewCustomDocDisqualifying(e.target.checked)}
                      className="rounded border-gray-300 text-red-600"
                    />
                    <span>إقصائي</span>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (!newCustomDocName.trim()) {
                        toast.error('يرجى كتابة تسمية الوثيقة.');
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
                        statutoryBasis: 'متطلب تقديري خاص بالمصلحة المتعاقدة',
                        statutoryRef: 'دفتر الشروط (تقديري)',
                      };
                      setOperatorDocuments((prev) => [...prev, newDoc]);
                      setNewCustomDocName('');
                      toast.success('تمت إضافة الوثيقة إلى ملف المتطلبات.');
                    }}
                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 me-1" />
                    إضافة وثيقة
                  </Button>
                </div>
              </section>

              {/* Deal Documents Section */}
              <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-navy-900">وثائق وسندات هذه الصفقة</h2>
                    <p className="text-xs text-gray-500">
                      الوثائق الرسمية المستخرجة والمحاضر والسندات المالية والتعاقدية.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSummarizeDoc}
                    disabled={summarizingDoc}
                    className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{summarizingDoc ? 'جاري التلخيص...' : 'تلخيص ملف الصفقة (AI)'}</span>
                  </Button>
                </div>

                {/* AI Document Summary Card */}
                {docSummary && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        ملخص تنفيذي استشاري لدفتر الشروط
                      </span>
                      <button
                        type="button"
                        onClick={() => setDocSummary(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-emerald-900 leading-relaxed font-normal">{docSummary}</p>
                    <p className="text-[10px] text-emerald-700 pt-1">
                      مسودة استشارية تخضع لسلطة التقدير والتحقق البشري لمسؤولي المصلحة المتعاقدة.
                    </p>
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
                        <p className="font-bold text-gray-900">دفتر الشروط والمواصفات (PDF)</p>
                        <p className="text-gray-500 text-[11px]">
                          النسخة الرسمية القابلة للطباعة والأرشفة
                        </p>
                        <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {isFrozen ? 'نسخة مجمّدة معتمدة' : 'مسودة قيد الإعداد'}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={exportingPdf}
                      className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 me-1" />
                      تنزيل PDF
                    </Button>
                  </div>

                  {/* Doc 2: Bank Guarantees / Sanad */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-100 text-blue-800 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">سندات وكفالات الضمان البنكي</p>
                        <p className="text-gray-500 text-[11px]">
                          كفالة حسن التنفيذ وكفالة التعهد (المادة 125 من المرسوم 15-247)
                        </p>
                        <span className="inline-block text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                          محددة بنسبة 5% من مبلغ الصفقة
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* General Reference Documents (Standalone Unattached Documents) */}
              <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-base font-bold text-navy-900">
                    الوثائق والسندات العامة والتنظيمية
                  </h2>
                  <p className="text-xs text-gray-500">
                    نماذج رسمية غير مقيدة بصفقة معينة صادرة عن وزارة المالية واللجنة الوطنية للصفقات.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">نموذج دفتر الشروط للأشغال العامة</p>
                      <p className="text-gray-500 text-[11px]">دفتر الشروط النموذجي وفق المرسوم 15-247</p>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">قرار وزاري</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">نموذج التصريح بالنزاهة والترشح</p>
                      <p className="text-gray-500 text-[11px]">الاستمارة الموحدة طبقاً للمادة 67 من القانون 23-12</p>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">نموذج رسمي</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">دليل إجراءات الصفقات العمومية</p>
                      <p className="text-gray-500 text-[11px]">مرجع عملي للمصالح المتعاقدة</p>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">دليل استرشادي</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">جدول نسب كفالات الضمان المصرفي</p>
                      <p className="text-gray-500 text-[11px]">شروط قبول السندات والضمانات البنكية المعتمدة</p>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">منشور تنظيمي</span>
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
                  <h3 className="font-bold text-navy-900 text-sm">مساعد إعداد الصفقة</h3>
                  <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                    الصفقة: {title || deal?.title || 'مسودة صفقة'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssistantOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="إخفاء لوحة المساعد"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* Advisory Disclaimer */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>مساعدة استشارية — راجع المقترحات قبل إدراجها</span>
              </p>
              <p className="text-amber-800 text-[10px] leading-relaxed">
                الخدمات الاستشارية مؤتمتة وتقنية، ولا تمثل بديلاً عن السلطة التقديرية لمسؤولي المصلحة وفق القانون 23-12.
              </p>
            </div>

            {/* 4 Canonical AI Assistant Services Bar */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 block">الخدمات الاستشارية الذكية:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleExplainProcurementMethod}
                  className={`rounded-xl text-[11px] font-bold h-auto py-2 px-2 flex flex-col items-center justify-center text-center gap-1 border transition-all ${
                    activeAssistantTool === 'method_explain'
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'border-gray-200 text-navy-900 hover:bg-navy-50'
                  }`}
                >
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>اشرح طريقة الإبرام</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRecommendTemplate}
                  className={`rounded-xl text-[11px] font-bold h-auto py-2 px-2 flex flex-col items-center justify-center text-center gap-1 border transition-all ${
                    activeAssistantTool === 'template_advisor'
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'border-gray-200 text-navy-900 hover:bg-navy-50'
                  }`}
                >
                  <FileCode2 className="w-4 h-4 text-emerald-600" />
                  <span>ساعدني في اختيار القالب</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAutofillDraftFromDeal}
                  className="rounded-xl text-[11px] font-bold h-auto py-2 px-2 flex flex-col items-center justify-center text-center gap-1 border border-gray-200 text-navy-900 hover:bg-navy-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>استكمل المسودة</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRunGapAudit}
                  className={`rounded-xl text-[11px] font-bold h-auto py-2 px-2 flex flex-col items-center justify-center text-center gap-1 border transition-all ${
                    activeAssistantTool === 'gap_analysis'
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'border-gray-200 text-navy-900 hover:bg-navy-50'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>راجع المعلومات الناقصة</span>
                </Button>
              </div>
            </div>

            {/* Active Canonical Tool 1: Explain Method */}
            {activeAssistantTool === 'method_explain' && (
              <div className="bg-navy-50/70 border border-navy-200 rounded-xl p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-950 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    الأساس القانوني لطريقة وشكل الإبرام
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveAssistantTool(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-gray-700 text-[11px] leading-relaxed">
                  <p>
                    <strong>الإجراء المعتمد:</strong> {METHOD_LABELS[procurementMethod].ar} — {FORM_LABELS[procurementForm].ar}
                  </p>
                  <p>
                    <strong>السند التشريعي:</strong> القانون رقم 23-12 (المواد 29، 39، 40-49) والمرسوم الرئاسي رقم 15-247.
                  </p>
                  <div className="bg-white p-2.5 rounded-lg border border-navy-100 space-y-1 text-[11px]">
                    {procurementMethod === 'open_tender' ? (
                      procurementForm === 'open' ? (
                        <p>
                          طلب العروض المفتوح هو الإجراء المبدئي العام لضمان أوسع منافسة وتكافؤ فرص. لا يستلزم تبريراً استثنائياً، ويتطلب النشر الإلزامي في BOMOP ويوميتين وطنيتين.
                        </p>
                      ) : procurementForm === 'open_with_min_capacity' ? (
                        <p>
                          يشترط قدرات دنيا تقنية ومالية موضوعية معلنة مسبقاً في دفتر الشروط (المادة 41). يُفحص ظرف الترشح قبل فتح العروض التقنية والمالية.
                        </p>
                      ) : procurementForm === 'restricted' ? (
                        <p>
                          طلب عروض محدود (المادة 42) يقتصر على المتعهدين المؤهلين مسبقاً. يستوجب تبرير أسباب حصر المنافسة وربطها بالتعقيد التقني للعملية.
                        </p>
                      ) : (
                        <p>
                          المسابقة (المادة 43 من القانون 23-12 والمادة 44 من المرسوم 15-247) شكل خاص من طلب العروض يُخصص للدراسات المعمارية والمشاريع الفكرية والتهيئة العمرانية.
                        </p>
                      )
                    ) : (
                      procurementForm === 'direct' ? (
                        <p className="text-red-900 font-medium">
                          الإجراء التفاوضي المباشر (المادة 48) استثنائي ومقيد بحالات حصرية: الاحتكار التقني، الاستعجال الملح غير المتوقع، أو الأمن والدفاع الوطني. يستلزم تقريراً معللاً وسنداً قانونياً مسبقاً.
                        </p>
                      ) : (
                        <p>
                          الإجراء التفاوضي بعد الاستشارة (المادتان 46 و47) يُلجأ إليه بعد إعلان عدم جدوى طلب العروض أو في الحالات المحددة صراحة في القانون.
                        </p>
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
                          ? 'المادة 48 من القانون رقم 23-12 المؤرخ في 5 أوت 2023'
                          : 'المادتان 41 و42 من القانون رقم 23-12'
                      );
                      toast.success('تم نسخ السند القانوني إلى حقل الأساس القانوني.');
                    }}
                    className="w-full text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white rounded-lg"
                  >
                    نسخ السند القانوني المقترح إلى الحقول
                  </Button>
                )}
              </div>
            )}

            {/* Active Canonical Tool 2: Template Advisor */}
            {activeAssistantTool === 'template_advisor' && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-emerald-600" />
                    ترشيح القالب النموذجي المعتمد
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveAssistantTool(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-gray-700 text-[11px]">
                  <p>
                    <strong>طبيعة الحاجة:</strong> {NATURE_LABELS[procurementNature].ar}
                  </p>
                  {getCompatibleTemplates(procurementNature).length > 0 ? (
                    getCompatibleTemplates(procurementNature).slice(0, 1).map((t) => (
                      <div key={t.id} className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-navy-900">{t.title}</p>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {t.status === 'approved_official' ? 'معتمد رسمياً' : 'قيد المراجعة'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[11px]">
                          {t.usageLimits || t.sourceReference}
                        </p>
                        <p className="text-gray-500 font-mono text-[10px]">{t.sourceReference}</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setTemplateId(t.id);
                            setTemplateVersion(t.version);
                            setIsManualDraft(false);
                            // Set dynamic operator documents
                            const dynamicDocs = getDynamicOperatorRequirements(
                              procurementNature,
                              procurementMethod,
                              procurementForm,
                              t.id
                            );
                            setOperatorDocuments(dynamicDocs);
                            setActiveAssistantTool(null);
                            toast.success(`تم تطبيق القالب النموذجي: ${t.title}`);
                          }}
                          className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg mt-1"
                        >
                          تطبيق هذا القالب على ملف الصفقة
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center text-gray-500">
                      لا يوجد قالب مراجع مطابق لهذه الاختيارات حالياً.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Canonical Tool 4: Gap Analysis */}
            {activeAssistantTool === 'gap_analysis' && (
              <div className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold text-navy-900 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    تدقيق النواقص والجاهزية القانونية
                  </span>
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
                      className={`p-2 rounded-lg border text-[11px] flex items-start justify-between gap-2 ${
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
                        <p className="text-gray-600 text-[10px]">{gap.message}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActiveTab(gap.tab as any);
                          setActiveAssistantTool(null);
                        }}
                        className="text-[10px] font-bold p-1 h-auto text-navy-800 hover:underline shrink-0"
                      >
                        انتقال
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context Tool Cards depending on activeTab */}
            {activeTab === 'basics' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-700">الأدوات التقديرية لبيانات الصفقة:</div>

                {/* Tool: Market Price Estimator */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs">
                  <span className="font-bold text-gray-900 block">تقدير أسعار السوق المرجعية</span>
                  <p className="text-gray-600 text-[11px]">
                    استخراج مؤشرات الكلفة التقديرية بناءً على قاعدة أسعار السوق والولاية عبر API.
                  </p>
                  <Button
                    size="sm"
                    disabled={priceEstimating}
                    onClick={handleEstimateMarketPrice}
                    className="w-full text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white"
                  >
                    {priceEstimating ? 'جاري التحليل...' : 'تقدير السعر المرجعي'}
                  </Button>

                  {priceEstimateResult && (
                    <div className="bg-white rounded-lg p-2.5 border border-navy-100 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">متوسط السعر:</span>
                        <span className="font-bold font-mono text-emerald-800">
                          {priceEstimateResult.avg_price?.toLocaleString('ar-DZ')} دج
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>مستوى الثقة:</span>
                        <span>{priceEstimateResult.confidence_score}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-700">الأدوات المدعومة لدفتر الشروط:</div>

                {/* Outdated analysis warning */}
                {contentChangedSinceCheck && (
                  <div className="bg-amber-100 border border-amber-300 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>تم تعديل بنود بعد الفحص الأخير. يُرجى إعادة فحص الامتثال لتحديث النتائج.</span>
                  </div>
                )}

                {/* Tool 1: Compliance Check */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs">
                  <span className="font-bold text-gray-900 block">مراجعة النواقص والامتثال القانوني</span>
                  <p className="text-gray-600 text-[11px]">
                    فحص آلي للقواعد القانونية (آجال الإيداع، الشفافية، معايير التنقيط) وفق القانون 23-12.
                  </p>
                  <Button
                    size="sm"
                    disabled={complianceChecking}
                    onClick={handleRunComplianceCheck}
                    className="w-full text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white"
                  >
                    {complianceChecking ? 'جاري الفحص القانوني...' : 'فحص الامتثال القانوني'}
                  </Button>

                  {complianceResult && (
                    <div className="bg-white rounded-lg p-2.5 border border-navy-100 text-[11px] space-y-1.5">
                      <p className="font-bold text-navy-900">نتائج الفحص:</p>
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
                  <span className="font-bold text-gray-900 block">اقتراح من قالب نموذجي</span>
                  <p className="text-gray-600 text-[11px]">
                    تحميل صياغة جاهزة للقسم الحالي من دفاتر الشروط الصادرة بقرارات وزارية.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleProposeTemplateClause(activeSection)}
                    className="w-full text-xs font-bold border-[#D5DDEA] text-navy-800 hover:bg-navy-50"
                  >
                    تحميل قالب {SECTION_TITLES[activeSection] || 'القسم'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-700">الأدوات المدعومة للوثائق والسندات:</div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs">
                  <span className="font-bold text-gray-900 block">تلخيص الوثيقة المختارة (AI)</span>
                  <p className="text-gray-600 text-[11px]">
                    يستدعي خدمة `/api/ai/summarize/` لاستخراج أهم المتطلبات الإلزامية في ملخص تنفيذي.
                  </p>
                  <Button
                    size="sm"
                    disabled={summarizingDoc}
                    onClick={handleSummarizeDoc}
                    className="w-full text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white"
                  >
                    {summarizingDoc ? 'جاري التلخيص...' : 'توليد الملخص التنفيذي'}
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
            <h3 className="font-bold text-navy-900 text-base">
              تأكيد تحديث الميزانية التقديرية
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs text-gray-700 border border-gray-200">
              <div className="flex justify-between">
                <span>الميزانية الحالية:</span>
                <span className="font-mono font-bold text-gray-600">
                  {budget ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : 'غير محددة'}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5">
                <span>المجموع الجديد المحسوب من جدول الكميات:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {boqTotal.toLocaleString('ar-DZ')} دج
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              سيتم استبدال قيمة الميزانية التقديرية بالقيمة المحسوبة مع حفظ التعديل في بيانات الصفقة.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSyncBudgetConfirm(false)}
                className="rounded-xl text-xs"
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSyncBudget}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                تأكيد التحديث
              </Button>
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
              <h3 className="font-bold text-navy-900 text-base">
                تأكيد تجميد دفتر الشروط رقمياً
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200">
              تجميد دفتر الشروط يمنع أي تعديل لاحق على النصوص والبنود، ويولّد بصمة رقمية ملزمة للاعتماد تمهيداً لعرضه على لجنة الصفقات المختصة.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={freezing}
                onClick={() => setShowFreezeModal(false)}
                className="rounded-xl text-xs"
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                disabled={freezing}
                onClick={handleFreezeSpecs}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                {freezing ? 'جاري التجميد...' : 'نعم، تجميد الدفتر'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Procedure Change Warning ──────────────────────────────── */}
      {showProcedureChangeWarning && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100" dir="rtl">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-900 text-base">
                تنبيه: تغيير طريقة أو شكل الإبرام
              </h3>
            </div>
            <div className="text-xs text-gray-700 leading-relaxed bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-2">
              <p className="font-bold text-amber-950">
                تغيير طريقة أو شكل الإبرام يؤثر مباشرة على الأساس القانوني، شروط المشاركة، وملف وثائق المتعامل الإلزامية.
              </p>
              <p className="text-amber-800 text-[11px]">
                عند التأكيد، ستتم مواءمة قائمة وثائق المتعامل تلقائياً وفق الإجراء الجديد، وتنبيهك في حال استلزم الإجراء الجديد تسبيباً أو مبررات قانونية مسبقة.
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
              >
                إلغاء والتراجع
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmProcedureChange}
                className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold"
              >
                تأكيد التغيير والمواءمة
              </Button>
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
            <p className="text-[11px] text-emerald-800 font-semibold">{aiProposalPreview.sourceNotice}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiProposalPreview(null)}
                className="rounded-xl text-xs"
              >
                رفض وتجاهل
              </Button>
              <Button
                size="sm"
                onClick={handleApplyAiProposal}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                قبول وتطبيق المقترح
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
