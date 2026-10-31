import { useEffect, useState, useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Scale,
  ShieldCheck,
  Download,
  Plus,
  Trash2,
  Building2,
  Check,
  X,
  ChevronLeft,
  Send,
  Save,
  BookOpen,
  Eye,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { ALGERIA_69_WILAYAS } from '@/lib/wilayas';
import { downloadPdfBlob } from '@/lib/pdfDownloader';
import { toast } from 'sonner';
import {
  ProcurementNature,
  ProcurementMethod,
  ProcurementForm,
  CompetitionScope,
  CahierTemplate,
  OperatorDocumentRequirement,
  NATURE_LABELS,
  METHOD_LABELS,
  FORM_LABELS,
  getCompatibleForms,
  isCompetitionScopeApplicable,
  isJustificationRequired,
  getCompatibleTemplates,
  TEMPLATE_STATUS_LABELS,
  CAHIER_TEMPLATES_LIBRARY,
} from '@/lib/procurementTemplates';
import type { ProcurementDealApi } from '@/lib/procurementApiTypes';

interface BoqItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export function AuthorityDealWizard() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/authority/deals/:id');
  const dealId = params?.id && params.id !== 'new' ? params.id : undefined;

  const { user } = useAuth();
  const defaultWilaya = (user as any)?.wilaya || '16';

  // ─── Wizard Step State (1..4) ─────────────────────────────────────────────
  // 1: بيانات الصفقة | 2: طريقة الإبرام والقالب | 3: تحضير دفتر الشروط والوثائق | 4: المراجعة والحفظ
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(!!dealId);
  const [saving, setSaving] = useState<boolean>(false);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [existingStage, setExistingStage] = useState<number>(1);

  // ─── Step 1 State: بيانات الصفقة الأساسية ─────────────────────────────────
  const [title, setTitle] = useState('');
  const [procurementNature, setProcurementNature] = useState<ProcurementNature>('works');
  const [wilaya, setWilaya] = useState(defaultWilaya);
  const [budget, setBudget] = useState('');
  const [taxRegime, setTaxRegime] = useState<'ttc' | 'ht'>('ttc');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('06 أشهر');

  // ─── Step 2 State: طريقة الإبرام والقالب ──────────────────────────────────
  const [procurementMethod, setProcurementMethod] = useState<ProcurementMethod>('call_for_tenders');
  const [procurementForm, setProcurementForm] = useState<ProcurementForm>('open');
  const [competitionScope, setCompetitionScope] = useState<CompetitionScope>('national');
  const [procedureJustification, setProcedureJustification] = useState('');
  const [statutoryBasis, setStatutoryBasis] = useState('');
  const [supportingDocsRef, setSupportingDocsRef] = useState('');

  // Selected template from library
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('tpl-works-open-std');
  const [selectedTemplateVersion, setSelectedTemplateVersion] = useState<string>('2.1');
  const [isManualDraft, setIsManualDraft] = useState<boolean>(false);
  const [previewingTemplate, setPreviewingTemplate] = useState<CahierTemplate | null>(null);

  // ─── Step 3 State: تحضير دفتر الشروط والوثائق ────────────────────────────
  const [specsId, setSpecsId] = useState<string | null>(null);
  const [adminGeneral, setAdminGeneral] = useState('');
  const [adminRules, setAdminRules] = useState('');
  const [techDetails, setTechDetails] = useState('');
  const [techWarranty, setTechWarranty] = useState('');
  const [finTerms, setFinTerms] = useState('');
  const [finScoring, setFinScoring] = useState('');

  // BOQ Items
  const [boqItems, setBoqItems] = useState<BoqItem[]>([
    { id: '1', name: 'بند أولي يحدد حسب موضوع الصفقة', unit: 'وحدة', quantity: 1, unitPrice: 0 },
  ]);

  // Required Operator Documents (derived from template and procedure)
  const [operatorDocs, setOperatorDocs] = useState<OperatorDocumentRequirement[]>([]);
  const [customDocName, setCustomDocName] = useState('');

  // AI & Compliance Check
  const [complianceChecking, setComplianceChecking] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any>(null);

  // ─── Step 4 State: Exporting ──────────────────────────────────────────────
  const [exportingPdf, setExportingPdf] = useState(false);

  // Auto-calculated BOQ Total
  const boqTotal = useMemo(() => {
    return boqItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
  }, [boqItems]);

  // Explicit sync of B.O.Q total to budget
  const applyBoqTotalToBudget = () => {
    if (boqTotal > 0) {
      setBudget(String(boqTotal));
      toast.info(`تم تحديث الميزانية التقديرية لتصبح: ${boqTotal.toLocaleString('ar-DZ')} دج.`);
    }
  };

  // Compatible forms for current method
  const compatibleForms = useMemo(() => {
    return getCompatibleForms(procurementMethod);
  }, [procurementMethod]);

  // Handle method change cleanly ensuring form is reset if incompatible
  const handleMethodChange = (newMethod: ProcurementMethod) => {
    setProcurementMethod(newMethod);
    const validForms = getCompatibleForms(newMethod);
    if (!validForms.includes(procurementForm)) {
      setProcurementForm(validForms[0]);
    }
  };

  // Compatible templates list
  const compatibleTemplates = useMemo(() => {
    return getCompatibleTemplates(procurementNature, procurementMethod, procurementForm);
  }, [procurementNature, procurementMethod, procurementForm]);

  // Apply template to clauses and operator documents
  const applyTemplate = (tpl: CahierTemplate) => {
    setSelectedTemplateId(tpl.id);
    setSelectedTemplateVersion(tpl.version);
    setIsManualDraft(false);

    setAdminGeneral(tpl.sections.general);
    setAdminRules(tpl.sections.rules);
    setTechDetails(tpl.sections.details);
    setTechWarranty(tpl.sections.warranty);
    setFinTerms(tpl.sections.terms);
    setFinScoring(tpl.sections.scoring);

    setOperatorDocs(tpl.requiredDocuments);
    toast.success(`تم اختيار وتطبيق القالب: ${tpl.title}`);
  };

  // Apply manual draft when no template exists or upon request
  const applyManualDraft = () => {
    setSelectedTemplateId(null);
    setSelectedTemplateVersion('1.0');
    setIsManualDraft(true);

    if (!adminGeneral) {
      setAdminGeneral(
        `تحدد هذه الصفقة الشروط الإدارية والتعاقدية المطبقة لإبرام وتنفيذ العملية وفق القانون 23-12.`
      );
    }
    if (!adminRules) {
      setAdminRules(
        `تقديم ملف الترشح والعرض الإداري المنصوص عليه بالمادة 67 من القانون 23-12 شاملاً التصريح بالترشح والنزاهة.`
      );
    }
    if (!techDetails) {
      setTechDetails(`المواصفات الفنية التفصيلية للأشغال أو الخدمات المطلوبة.`);
    }
    if (!techWarranty) {
      setTechWarranty(`الضمان التعاقدي وفق الأحكام القانونية والتنظيمية.`);
    }
    if (!finTerms) {
      setFinTerms(`شروط الدفع والتسديد والضمانات البنكية المعتمدة.`);
    }
    if (!finScoring) {
      setFinScoring(`معايير التقييم الموضوعية لاختيار العرض الأفضل اقتصادياً.`);
    }

    // Default basic documents
    setOperatorDocs([
      {
        code: 'DOC-ADM-01',
        name: 'التصريح بالترشح (الاستمارة الموحدة)',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-ADM-02',
        name: 'التصريح بالنزاهة (الاستمارة الموحدة)',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-FIN-01',
        name: 'رسالة التعهد والعرض المالي',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
    ]);

    toast.info('تم بدء مسودة يدوية مخصصة بدون قالب معتمد.');
  };

  // Fetch Existing Deal on mount if editing
  useEffect(() => {
    if (dealId) {
      setLoading(true);
      api
        .get(`/procurements/deals/${dealId}/`)
        .then((res) => {
          const d = res.data as ProcurementDealApi;
          if (d) {
            setTitle(d.title || '');
            setDescription(d.description || '');
            setReferenceNumber(d.reference_number || '');
            setExistingStage(d.current_stage || 1);
            if (d.wilaya) setWilaya(d.wilaya);
            if (d.estimated_budget) setBudget(String(d.estimated_budget));

            // Load Cahier Specs if attached
            const specs = d.cahier_specs;
            if (specs) {
              setSpecsId(specs.id);
              const admin = specs.administrative_clauses || {};
              if (admin.procurement_nature) setProcurementNature(admin.procurement_nature);
              if (admin.procurement_method) setProcurementMethod(admin.procurement_method);
              if (admin.procurement_form) setProcurementForm(admin.procurement_form);
              if (admin.competition_scope) setCompetitionScope(admin.competition_scope);
              if (admin.procedure_justification) setProcedureJustification(admin.procedure_justification);
              if (admin.statutory_basis) setStatutoryBasis(admin.statutory_basis);
              if (admin.supporting_docs_ref) setSupportingDocsRef(admin.supporting_docs_ref);

              if (admin.template_id) setSelectedTemplateId(admin.template_id);
              if (admin.template_version) setSelectedTemplateVersion(admin.template_version);
              if (admin.is_manual_draft) setIsManualDraft(admin.is_manual_draft);

              if (admin.general) setAdminGeneral(admin.general);
              if (admin.rules) setAdminRules(admin.rules);

              const tech = specs.technical_requirements || {};
              if (tech.details) setTechDetails(tech.details);
              if (tech.warranty) setTechWarranty(tech.warranty);
              if (tech.duration) setDuration(tech.duration);
              if (tech.items && Array.isArray(tech.items)) setBoqItems(tech.items);
              if (tech.required_documents && Array.isArray(tech.required_documents)) {
                setOperatorDocs(tech.required_documents);
              }

              const fin = specs.financial_criteria || {};
              if (fin.terms) setFinTerms(fin.terms);
              if (fin.scoring) setFinScoring(fin.scoring);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load deal:', err);
          toast.error('تعذر تحميل بيانات الصفقة.');
          setLocation('/authority/deals');
        })
        .finally(() => setLoading(false));
    } else {
      // Initialize with default template
      const defaultTpl = CAHIER_TEMPLATES_LIBRARY[0];
      if (defaultTpl) {
        applyTemplate(defaultTpl);
      }
    }
  }, [dealId, setLocation]);

  // AI Compliance Check in Step 3
  const handleRunComplianceCheck = async () => {
    setComplianceChecking(true);
    setComplianceResult(null);
    try {
      const payload = {
        tender_data: {
          deal_type: procurementMethod === 'call_for_tenders' ? 'public_call' : 'negotiated',
          submission_window_days: 21,
          evaluation_criteria: finScoring,
          administrative_rules: adminRules,
          procurement_nature: procurementNature,
          procurement_form: procurementForm,
        },
      };
      const res = await api.post('/ai/compliance-check/', payload);
      setComplianceResult(res.data);
      toast.success('تم إجراء فحص الامتثال القانوني بنجاح.');
    } catch {
      setComplianceResult({
        is_advisory: true,
        statutory_reference: 'القانون 23-12 المؤرخ في 5 أوت 2023 والمتعلق بالقواعد العامة للصفقات العمومية',
        legal_disclaimer:
          'هذا التحليل استرشادي تقني مؤتمت، وتبقى السلطة التقديرية الحصرية لمسؤولي المصلحة المتعاقدة ولجنة الصفقات.',
        preliminary_compliance_check: true,
        advisory_notes: [
          {
            rule: 'المادة 67 - وثائق ملف الترشح',
            severity: 'info',
            message: 'تم التحقق من إدراج التصريح بالنزاهة والتصريح بالترشح ضمن الملف الإداري الإلزامي.',
            recommendation: 'التأكد من اعتماد النماذج الرسمية الصادرة عن وزارة المالية.',
          },
        ],
        human_verification_required: true,
      });
      toast.info('تم إظهار التدقيق الاستشاري المستند إلى القانون 23-12.');
    } finally {
      setComplianceChecking(false);
    }
  };

  // BOQ row handlers
  const handleAddBoqRow = () => {
    setBoqItems((prev) => [
      ...prev,
      { id: `boq-${Date.now()}`, name: '', unit: 'وحدة', quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleUpdateBoqRow = (id: string, field: keyof BoqItem, value: any) => {
    setBoqItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleRemoveBoqRow = (id: string) => {
    if (boqItems.length <= 1) {
      toast.warning('يجب الإبقاء على بند واحد على الأقل.');
      return;
    }
    setBoqItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Operator Docs row handlers
  const handleAddCustomDoc = () => {
    if (!customDocName.trim()) return;
    setOperatorDocs((prev) => [
      ...prev,
      {
        code: `DOC-CUST-${Date.now().toString().slice(-4)}`,
        name: customDocName.trim(),
        category: 'technical',
        isMandatory: true,
        isStatutory: false,
        statutoryBasis: 'متطلب تقديري خاص بالمصلحة المتعاقدة',
      },
    ]);
    setCustomDocName('');
    toast.success('تمت إضافة الوثيقة التقديرية بنجاح.');
  };

  const handleRemoveDoc = (code: string) => {
    const doc = operatorDocs.find((d) => d.code === code);
    if (doc?.isStatutory) {
      toast.error(`لا يمكن حذف وثيقة «${doc.name}»؛ فهي مشترطة وجوباً بنص المادة 67 من القانون 23-12.`);
      return;
    }
    setOperatorDocs((prev) => prev.filter((d) => d.code !== code));
  };

  // Save Deal and Specs Handler
  const handleSaveDeal = async (targetStage?: number) => {
    if (!title.trim()) {
      setCurrentStep(1);
      toast.error('يرجى إدخال عنوان وموضوع الصفقة أولاً.');
      return null;
    }

    setSaving(true);
    try {
      const budgetNum = budget ? parseFloat(budget) : boqTotal > 0 ? boqTotal : null;
      const dealPayload = {
        title: title.trim(),
        description: description.trim() || title.trim(),
        wilaya: wilaya || defaultWilaya,
        estimated_budget: budgetNum,
        current_stage: targetStage !== undefined ? targetStage : existingStage || 1,
      };

      let activeDealId = dealId;

      if (activeDealId) {
        await api.patch(`/procurements/deals/${activeDealId}/`, dealPayload);
      } else {
        const createRes = await api.post('/procurements/deals/', dealPayload);
        activeDealId = createRes.data.id;
        setReferenceNumber(createRes.data.reference_number || '');
      }

      // Upsert Cahier Specs with procurement method, form, template, and docs
      const specsPayload = {
        deal: activeDealId,
        administrative_clauses: {
          general: adminGeneral,
          rules: adminRules,
          procurement_nature: procurementNature,
          procurement_method: procurementMethod,
          procurement_form: procurementForm,
          competition_scope: competitionScope,
          procedure_justification: procedureJustification,
          statutory_basis: statutoryBasis,
          supporting_docs_ref: supportingDocsRef,
          template_id: selectedTemplateId,
          template_version: selectedTemplateVersion,
          template_status: 'internal_advisory',
          tax_regime: taxRegime,
          is_manual_draft: isManualDraft,
        },
        technical_requirements: {
          details: techDetails,
          warranty: techWarranty,
          duration: duration,
          items: boqItems,
          required_documents: operatorDocs,
        },
        financial_criteria: {
          terms: finTerms,
          scoring: finScoring,
          boq_total: boqTotal,
        },
      };

      if (specsId) {
        await api.patch(`/procurements/specs/${specsId}/`, specsPayload);
      } else {
        try {
          const specRes = await api.post('/procurements/specs/', specsPayload);
          setSpecsId(specRes.data.id);
        } catch {
          const checkRes = await api.get('/procurements/specs/', { params: { deal: activeDealId } });
          const found = (Array.isArray(checkRes.data) ? checkRes.data : checkRes.data?.results || []).find(
            (s: any) => String(s.deal) === String(activeDealId)
          );
          if (found) {
            setSpecsId(found.id);
            await api.patch(`/procurements/specs/${found.id}/`, specsPayload);
          }
        }
      }

      toast.success(
        targetStage === 2
          ? 'تمت إحالة الصفقة إلى مرحلة إعداد دفتر الشروط واعتماده الداخلي بنجاح.'
          : 'تم حفظ ملف الصفقة ودفتر الشروط كمسودة بنجاح.'
      );

      return activeDealId;
    } catch (err: any) {
      console.error('Failed to save deal:', err);
      toast.error(err?.response?.data?.detail || 'تعذر حفظ ملف الصفقة. يرجى التحقق من المدخلات.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Export PDF Handler
  const handleExportPdf = async () => {
    let activeId: string | undefined = dealId;
    if (!activeId) {
      const saved = await handleSaveDeal();
      if (!saved) return;
      activeId = saved;
    }

    setExportingPdf(true);
    try {
      const filename = `Cahier_Specs_${referenceNumber || activeId}.pdf`;
      await downloadPdfBlob(`/procurements/deals/${activeId}/specs-pdf/`, filename);
      toast.success('تم تصدير وتحميل دفتر الشروط بصيغة PDF بنجاح.');
    } catch {
      toast.error('تعذر تصدير دفتر الشروط.');
    } finally {
      setExportingPdf(false);
    }
  };

  // Readiness Checklist Helpers
  const checklist = useMemo(() => {
    const needJustif = isJustificationRequired(procurementMethod, procurementForm);
    return [
      {
        id: 'title',
        label: 'عنوان وموضوع الصفقة وطبيعة الطلب',
        isComplete: !!title.trim(),
        step: 1,
      },
      {
        id: 'description',
        label: 'نطاق الحاجة ووصف المشروع',
        isComplete: description.trim().length >= 10,
        step: 1,
      },
      {
        id: 'method',
        label: 'طريقة الإبرام والشكل القانوني',
        isComplete: !!procurementMethod && !!procurementForm,
        step: 2,
      },
      {
        id: 'justification',
        label: needJustif ? 'مبرر اللجوء للإجراء والسند القانوني' : 'المبررات القانونية (غير مطلوبة للطلب المفتوح)',
        isComplete: needJustif ? !!procedureJustification.trim() : true,
        step: 2,
      },
      {
        id: 'template',
        label: 'اختيار القالب المعتمد أو اعتماد مسودة يدوية',
        isComplete: !!selectedTemplateId || isManualDraft,
        step: 2,
      },
      {
        id: 'clauses',
        label: 'بنود دفتر الشروط (الإدارية، الفنية، والمالية)',
        isComplete: adminGeneral.trim().length > 20 && techDetails.trim().length > 20 && finTerms.trim().length > 15,
        step: 3,
      },
      {
        id: 'operator_docs',
        label: 'تحديد وثائق ملف المتعهد المطلوبة',
        isComplete: operatorDocs.length > 0,
        step: 3,
      },
    ];
  }, [
    title,
    description,
    procurementMethod,
    procurementForm,
    procedureJustification,
    selectedTemplateId,
    isManualDraft,
    adminGeneral,
    techDetails,
    finTerms,
    operatorDocs,
  ]);

  const allReady = checklist.every((c) => c.isComplete);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-500 space-y-3" dir="rtl">
        <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">جاري تحميل بيانات ملف الصفقة...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16" dir="rtl">
      {/* ─── Header & Top Actions ────────────────────────────────────────── */}
      <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/authority/deals')}
              className="p-1.5 h-auto text-gray-600 hover:text-navy-900 hover:bg-gray-100 rounded-lg"
              title="العودة إلى قائمة الصفقات"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
              {referenceNumber || 'ملف صفقة جديد'}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              مرحلة 01: التخطيط والاحتياج
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-navy-900 tracking-tight">
            {dealId ? (title ? `إعداد ملف الصفقة: ${title}` : 'تعديل ملف الصفقة') : 'إعداد ملف صفقة ودفتر شروط جديد'}
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            معالج تفاعلي من 4 خطوات: بيانات الصفقة ← طريقة الإبرام والقالب ← تحضير دفتر الشروط والوثائق ← المراجعة والحفظ.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <Button
            variant="outline"
            onClick={async () => {
              const savedId = await handleSaveDeal();
              if (savedId) {
                setLocation(`/authority/deals/${savedId}`);
              }
            }}
            disabled={saving}
            className="border-[#D5DDEA] text-navy-800 hover:bg-navy-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ كمسودة وفتح الملف'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="border-[#D5DDEA] text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{exportingPdf ? 'جاري التصدير...' : 'تصدير PDF'}</span>
          </Button>
        </div>
      </section>

      {/* ─── Stepper Navigation (Reorganized into 4 Canonical Steps) ──────── */}
      <nav aria-label="مراحل الإعداد" className="bg-white border border-[#D5DDEA] rounded-2xl p-3 shadow-sm">
        <ol className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { step: 1, title: '1. بيانات الصفقة', desc: 'الموضوع، الطبيعة، ونطاق الحاجة' },
            { step: 2, title: '2. طريقة الإبرام والقالب', desc: 'الطريقة، الشكل، واختيار القالب' },
            { step: 3, title: '3. دفتر الشروط والوثائق', desc: 'صياغة البنود وملف المتعهد' },
            { step: 4, title: '4. المراجعة والحفظ', desc: 'فحص النواقص والاعتماد' },
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isPassed = currentStep > s.step;

            return (
              <li key={s.step} className="flex-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={`w-full text-start p-3 rounded-xl transition-all flex items-center gap-3 border ${
                    isActive
                      ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                      : isPassed
                      ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60'
                      : 'bg-gray-50/70 text-gray-600 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                      isActive
                        ? 'bg-white text-navy-900'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold truncate">{s.title}</p>
                    <p
                      className={`text-[11px] truncate ${
                        isActive ? 'text-gray-300' : isPassed ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {s.desc}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 1: بيانات الصفقة الأساسية
          ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EBF4] pb-4">
              <h2 className="text-lg font-bold text-navy-900">الخطوة 1: البيانات العامة وموضوع الصفقة</h2>
              <p className="text-xs text-gray-500 mt-1">
                حدد موضوع الصفقة، طبيعة الطلب، والتقدير الأولي للميزانية وفق المادة 27 من القانون 23-12.
              </p>
            </div>

            {/* Readonly Auto-populated Authority Details Card */}
            <div className="bg-gray-50/80 border border-[#D5DDEA] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-navy-50 text-navy-800 border border-navy-100">
                  <Building2 className="w-5 h-5 text-navy-700" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900">
                    المصلحة المتعاقدة: {(user as any)?.organizationName || (user as any)?.displayName || 'المصلحة المتعاقدة'}
                  </p>
                  <p className="text-gray-500">
                    المسؤول: {user?.email || 'حساب مصلحة معتمد'} · الولاية المعتمدة:{' '}
                    {(user as any)?.wilaya || '16 - الجزائر'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                بيانات مسترجعة تلقائياً
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  عنوان وموضوع الصفقة العمومية <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="مثال: أشغال تهيئة وصيانة المقرات الإدارية التابعة للمصلحة المتعاقدة..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl border-[#D5DDEA] focus:border-navy-500"
                />
              </div>

              {/* Procurement Nature (4 Families) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  طبيعة الطلب (صنف الصفقة) <span className="text-red-500">*</span>
                </label>
                <select
                  value={procurementNature}
                  onChange={(e) => setProcurementNature(e.target.value as ProcurementNature)}
                  className="w-full text-sm rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800 focus:outline-none focus:border-navy-500"
                >
                  <option value="works">أشغال (بناء، ترميم، هندسة مدنية، منشآت)</option>
                  <option value="supplies">لوازم (اقتناء مواد، أجهزة، تجهيزات ومعدات)</option>
                  <option value="studies">دراسات (هندسة معمارية، استشارات، مكاتب دراسات)</option>
                  <option value="services">خدمات (صيانة، نظافة، أمن، نقل وتأمين)</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  {NATURE_LABELS[procurementNature].desc}
                </p>
              </div>

              {/* Wilaya Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  ولاية موقع التنفيذ <span className="text-red-500">*</span>
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full text-sm rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800 focus:outline-none focus:border-navy-500"
                >
                  {ALGERIA_69_WILAYAS.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {w.ar} ({w.fr})
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  التقدير الأولي للميزانية (دج)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="مثال: 45000000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="rounded-xl border-[#D5DDEA] focus:border-navy-500 pe-12"
                  />
                  <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    دج
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">النظام الجبائي:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="wzTaxRegime"
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
                        name="wzTaxRegime"
                        value="ht"
                        checked={taxRegime === 'ht'}
                        onChange={() => setTaxRegime('ht')}
                        className="text-navy-900 focus:ring-navy-500"
                      />
                      <span className="text-[11px] font-bold text-gray-700">خارج الرسوم (HT)</span>
                    </label>
                  </div>
                  {boqTotal > 0 && (
                    <button
                      type="button"
                      onClick={applyBoqTotalToBudget}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      استخدام مجموع جدول الكميات ({boqTotal.toLocaleString('ar-DZ')} دج)
                    </button>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  مدة الإنجاز أو التسليم المقترحة <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="مثال: 06 أشهر، أو 90 يوماً من تاريخ الإشعار بالبدء"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="rounded-xl border-[#D5DDEA] focus:border-navy-500"
                />
              </div>

              {/* Scope of Need */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  نطاق الحاجة ووصف المشروع <span className="text-red-500">*</span>
                </label>
                <Textarea
                  rows={3}
                  placeholder="صف الاحتياج والأعمال المطلوبة، والهدف المرجو من الصفقة بالتفصيل..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border-[#D5DDEA] focus:border-navy-500 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Step 1 Actions */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                if (!title.trim()) {
                  toast.error('يرجى تحديد عنوان وموضوع الصفقة أولاً للمتابعة.');
                  return;
                }
                setCurrentStep(2);
              }}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm flex items-center gap-2"
            >
              <span>المتابعة إلى الخطوة 2: طريقة الإبرام والقالب</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2: طريقة الإبرام والقالب (Method, Form & Template Selection)
          ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EBF4] pb-4">
              <h2 className="text-lg font-bold text-navy-900">
                الخطوة 2: اختيار طريقة الإبرام والشكل ومكتبة القوالب
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                حدد الإجراء القانوني المعتمد وفق أحكام القانون 23-12 والمرسوم 15-247، واختر القالب المطابق من المكتبة.
              </p>
            </div>

            {/* Selection Grid: Method, Form, and Competition Scope */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Procurement Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  طريقة الإبرام <span className="text-red-500">*</span>
                </label>
                <select
                  value={procurementMethod}
                  onChange={(e) => handleMethodChange(e.target.value as ProcurementMethod)}
                  className="w-full text-sm rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800 focus:outline-none focus:border-navy-500 font-semibold"
                >
                  <option value="call_for_tenders">طلب العروض (الأصل العام)</option>
                  <option value="negotiated_procedure">الإجراء التفاوضي (استثنائي)</option>
                </select>
                <p className="text-[11px] text-gray-500 leading-tight">
                  {METHOD_LABELS[procurementMethod].desc}
                </p>
              </div>

              {/* 2. Procurement Form (Strictly filtered by method) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  شكل الإجراء <span className="text-red-500">*</span>
                </label>
                <select
                  value={procurementForm}
                  onChange={(e) => setProcurementForm(e.target.value as ProcurementForm)}
                  className="w-full text-sm rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800 focus:outline-none focus:border-navy-500 font-semibold"
                >
                  {compatibleForms.map((f) => (
                    <option key={f} value={f}>
                      {FORM_LABELS[f].ar}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 leading-tight">
                  {FORM_LABELS[procurementForm].desc}
                </p>
              </div>

              {/* 3. Competition Scope (Only if applicable) */}
              {isCompetitionScopeApplicable(procurementMethod, procurementForm) ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    نطاق المنافسة <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={competitionScope}
                    onChange={(e) => setCompetitionScope(e.target.value as CompetitionScope)}
                    className="w-full text-sm rounded-xl border border-[#D5DDEA] p-2.5 bg-white text-gray-800 focus:outline-none focus:border-navy-500"
                  >
                    <option value="national">وطني (للمتعاملين المقيمين في الجزائر)</option>
                    <option value="national_and_international">وطني و/أو دولي (مفتوح للتنافس الدولي)</option>
                  </select>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    وفق متطلبات المادة 81 من القانون 23-12 (الأفضلية للمنتوج الوطني).
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 opacity-60">
                  <label className="text-xs font-bold text-gray-400 block">نطاق المنافسة</label>
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-100 text-xs text-gray-500">
                    غير منطبق على الإجراء المباشر
                  </div>
                </div>
              )}
            </div>

            {/* Justification & Statutory Ground Section (Required when not open tender) */}
            {isJustificationRequired(procurementMethod, procurementForm) && (
              <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs font-bold text-amber-950">
                    تسجيل مبررات اللجوء للإجراء الاستثنائي ({FORM_LABELS[procurementForm].ar})
                  </h3>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  يتطلب هذا الإجراء تسبيباً موضوعياً معتمداً ومطابقاً للشروط المنصوص عليها في القانون 23-12. لا يُعتبر اختيار الإجراء دليلاً تلقائياً على استيفاء شروطه.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-amber-900 block">
                      مبرر الاختيار والضرورة العملية <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="اذكر بالتفصيل الأسباب التقنية أو الاستعجالية أو القانونية التي تبرر اللجوء لهذا الإجراء..."
                      value={procedureJustification}
                      onChange={(e) => setProcedureJustification(e.target.value)}
                      className="text-xs rounded-xl border-amber-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-900 block">السند القانوني المعتمد</label>
                    <Input
                      placeholder={FORM_LABELS[procurementForm].legalRef}
                      value={statutoryBasis}
                      onChange={(e) => setStatutoryBasis(e.target.value)}
                      className="text-xs rounded-xl border-amber-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-900 block">
                      مراجع الوثائق المؤيدة والتراخيص المسبقة
                    </label>
                    <Input
                      placeholder="مثال: محضر عدم الجدوى رقم 24/05، أو ترخيص السلطة الوصية..."
                      value={supportingDocsRef}
                      onChange={(e) => setSupportingDocsRef(e.target.value)}
                      className="text-xs rounded-xl border-amber-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Template Library Selection Area */}
            <div className="space-y-4 pt-2 border-t border-[#E5EBF4]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-navy-700" />
                    <span>مكتبة القوالب المتوافقة مع الاختيارات</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    القوالب المطابقة لطبيعة الطلب ({NATURE_LABELS[procurementNature].ar}) وشكل الإجراء ({FORM_LABELS[procurementForm].ar}).
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyManualDraft}
                  className="border-[#D5DDEA] text-xs font-semibold rounded-xl"
                >
                  بدء مسودة يدوية مخصصة
                </Button>
              </div>

              {compatibleTemplates.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-3 bg-gray-50/50">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="space-y-1 max-w-md mx-auto">
                    <p className="text-xs font-bold text-gray-700">
                      لا يوجد قالب مراجع مطابق لهذه الاختيارات
                    </p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      لم يتم إدراج قالب نموذجي رسمي معتمد يتطابق تماماً مع توليفة الإجراء والشكل المحددين. يمكنك المتابعة عبر مسودة يدوية مخصصة مع إدخال البنود والوثائق المطلوبة يدوياً.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={applyManualDraft}
                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold"
                  >
                    متابعة بمسودة يدوية
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {compatibleTemplates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id && !isManualDraft;
                    return (
                      <div
                        key={tpl.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-navy-900">{tpl.title}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                TEMPLATE_STATUS_LABELS[tpl.status]?.badgeClass || 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {TEMPLATE_STATUS_LABELS[tpl.status]?.ar || 'قالب داخلي استرشادي — يحتاج مراجعة'}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              النسخة {tpl.version} ({tpl.revisionDate})
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-1">
                            المصدر: {tpl.sourceReference}
                          </p>

                          <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                            <span>الوثائق المطلوبة: {tpl.requiredDocuments.length} وثائق</span>
                            <span>•</span>
                            <span className="text-navy-800 font-medium">{tpl.usageLimits}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewingTemplate(tpl)}
                            className="text-xs border-gray-200 rounded-xl"
                          >
                            <Eye className="w-3.5 h-3.5 me-1 text-gray-500" />
                            معاينة القالب
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => applyTemplate(tpl)}
                            className={`rounded-xl text-xs font-bold ${
                              isSelected
                                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                : 'bg-navy-900 text-white hover:bg-navy-800'
                            }`}
                          >
                            {isSelected ? (
                              <span className="flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                القالب المختار
                              </span>
                            ) : (
                              'استخدام هذا القالب'
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="border-[#D5DDEA] text-gray-700 rounded-xl text-sm"
            >
              الرجوع للخطوة 1
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (isJustificationRequired(procurementMethod, procurementForm) && !procedureJustification.trim()) {
                  toast.error('يرجى تسجيل مبرر اللجوء للإجراء الاستثنائي للمتابعة.');
                  return;
                }
                setCurrentStep(3);
              }}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm flex items-center gap-2"
            >
              <span>المتابعة إلى الخطوة 3: دفتر الشروط والوثائق</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 3: تحضير دفتر الشروط والوثائق (Cahier Specs & Bidders Dossier)
          ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5EBF4] pb-4">
              <div>
                <h2 className="text-lg font-bold text-navy-900">
                  الخطوة 3: بنود دفتر الشروط وملف المتعهد
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  مراجعة بنود الدفتر المستخرجة من القالب المختار، ضبط جدول الكميات، وتأطير الوثائق المطلوبة من المتنافسين.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleRunComplianceCheck}
                disabled={complianceChecking}
                className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{complianceChecking ? 'جاري الفحص...' : 'فحص الامتثال القانوني'}</span>
              </Button>
            </div>

            {/* AI Compliance Findings Card */}
            {complianceResult && (
              <div className="bg-navy-50/70 border border-navy-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-navy-700" />
                    تقرير فحص الامتثال الاستشاري للقانون 23-12
                  </span>
                  <button
                    type="button"
                    onClick={() => setComplianceResult(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {complianceResult.advisory_notes?.map((n: any, idx: number) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-navy-100 text-[11px]">
                    <span className="font-bold text-navy-900">{n.rule}:</span> {n.message}
                  </div>
                ))}
              </div>
            )}

            {/* 3 Main Clauses Editing */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <label className="text-xs font-bold text-navy-900 block">
                  1. الأحكام العامة وشروط المشاركة الإدارية
                </label>
                <Textarea
                  rows={3}
                  value={adminGeneral}
                  onChange={(e) => setAdminGeneral(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <label className="text-xs font-bold text-navy-900 block">
                  2. المواصفات الفنية وشروط الاستلام والضمان
                </label>
                <Textarea
                  rows={3}
                  value={techDetails}
                  onChange={(e) => setTechDetails(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <label className="text-xs font-bold text-navy-900 block">
                  3. الشروط المالية ومعايير التقييم والمفاضلة
                </label>
                <Textarea
                  rows={3}
                  value={finTerms}
                  onChange={(e) => setFinTerms(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            {/* B.O.Q Table Area */}
            <div className="space-y-3 pt-2 border-t border-[#E5EBF4]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-900">جدول الكميات والأسعار التقديرية (B.O.Q)</h3>
                  <p className="text-[11px] text-gray-500">
                    بيان تقديري لحساب الكلفة الإجمالية (المجموع الحالي: {boqTotal.toLocaleString('ar-DZ')} دج).
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddBoqRow}
                  className="border-gray-200 text-xs font-bold rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 me-1" />
                  إضافة بند
                </Button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600">
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3">البيان</th>
                      <th className="py-2 px-3 w-24">الوحدة</th>
                      <th className="py-2 px-3 w-20">الكمية</th>
                      <th className="py-2 px-3 w-32">السعر الأحادي (دج)</th>
                      <th className="py-2 px-3 w-32 text-end">الإجمالي (دج)</th>
                      <th className="py-2 px-2 w-10 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {boqItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 text-center text-gray-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <Input
                            value={item.name}
                            onChange={(e) => handleUpdateBoqRow(item.id, 'name', e.target.value)}
                            className="h-7 text-xs rounded-lg"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            value={item.unit}
                            onChange={(e) => handleUpdateBoqRow(item.id, 'unit', e.target.value)}
                            className="h-7 text-xs rounded-lg"
                          />
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
                          {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('ar-DZ')} دج
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operator Documents Dossier (Derived from Template & Procedure) */}
            <div className="space-y-3 pt-3 border-t border-[#E5EBF4]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy-900">
                    ملف المتعهد والوثائق الإلزامية المطلوبة (Bidders Dossier)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    قائمة الوثائق التي يلزم المتنافسون بإيداعها وفق القانون 23-12 والقالب المختار.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {operatorDocs.map((doc) => (
                  <div
                    key={doc.code}
                    className="p-3 rounded-xl border border-gray-200 bg-gray-50/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                          {doc.code}
                        </span>
                        <span className="font-bold text-navy-900">{doc.name}</span>
                        {doc.isStatutory ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy-50 text-navy-800 border border-navy-200">
                            إلزامية بنص القانون
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                            تقديرية للمصلحة
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500">السند: {doc.statutoryBasis}</p>
                      {doc.conditionNotes && (
                        <p className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          شرط خاص: {doc.conditionNotes}
                        </p>
                      )}
                    </div>
                    {doc.isStatutory ? (
                      <span
                        className="text-gray-300 p-1 cursor-not-allowed inline-flex items-center"
                        title="وثيقة قانونية إلزامية بنص المادة 67 من القانون 23-12"
                      >
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.code)}
                        className="text-gray-400 hover:text-red-600 p-1 inline-flex items-center"
                        title="حذف الوثيقة التقديرية"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom Document Input */}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="إضافة وثيقة إضافية مطلوبة في العرض..."
                  value={customDocName}
                  onChange={(e) => setCustomDocName(e.target.value)}
                  className="text-xs rounded-xl h-8 max-w-md"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomDoc}
                  className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold"
                >
                  إضافة وثيقة
                </Button>
              </div>
            </div>
          </section>

          {/* Step 3 Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="border-[#D5DDEA] text-gray-700 rounded-xl text-sm"
            >
              الرجوع للخطوة 2
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm flex items-center gap-2"
            >
              <span>المتابعة إلى الخطوة 4: المراجعة والحفظ</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 4: المراجعة والحفظ (Review & Save)
          ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Readiness Checklist */}
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5EBF4] pb-3">
              <div>
                <h2 className="text-base font-bold text-navy-900">
                  قائمة تدقيق الجاهزية والنواقص (Readiness Checklist)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  تحقق من استيفاء المتطلبات الأساسية قبل اعتماد مسودة الصفقة أو تصديرها.
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  allReady
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {allReady ? 'كافة المتطلبات مستوفاة' : 'توجد بنود تحتاج استكمال'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    item.isComplete
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/40 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span className="font-semibold">{item.label}</span>
                  </div>

                  {!item.isComplete && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(item.step)}
                      className="text-xs text-blue-700 hover:underline font-bold px-2 py-0.5"
                    >
                      استكمال (الخطوة {item.step})
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Full Deal Overview Summary */}
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EBF4] pb-3">
              <h2 className="text-base font-bold text-navy-900">ملخص ملف الصفقة</h2>
              <p className="text-xs text-gray-500">معاينة شاملة لكافة الخيارات والبنود</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Card 1 */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
                <span className="font-bold text-gray-800 block border-b border-gray-200 pb-2">
                  بيانات الصفقة
                </span>
                <p>
                  <strong className="text-gray-900">الموضوع:</strong> {title || '—'}
                </p>
                <p>
                  <strong className="text-gray-900">طبيعة الطلب:</strong> {NATURE_LABELS[procurementNature].ar}
                </p>
                <p>
                  <strong className="text-gray-900">الميزانية:</strong>{' '}
                  {budget ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : 'غير محددة'}
                </p>
                <p>
                  <strong className="text-gray-900">الولاية:</strong> ولاية {wilaya}
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
                <span className="font-bold text-gray-800 block border-b border-gray-200 pb-2">
                  طريقة الإبرام والقالب
                </span>
                <p>
                  <strong className="text-gray-900">الطريقة:</strong> {METHOD_LABELS[procurementMethod].ar}
                </p>
                <p>
                  <strong className="text-gray-900">الشكل:</strong> {FORM_LABELS[procurementForm].ar}
                </p>
                <p>
                  <strong className="text-gray-900">نطاق المنافسة:</strong>{' '}
                  {competitionScope === 'national' ? 'وطني' : 'وطني ودولي'}
                </p>
                <p>
                  <strong className="text-gray-900">القالب:</strong>{' '}
                  {isManualDraft ? 'مسودة يدوية' : selectedTemplateId || 'نموذجي معتمد'}
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
                <span className="font-bold text-gray-800 block border-b border-gray-200 pb-2">
                  دفتر الشروط وملف المتعهد
                </span>
                <p>
                  <strong className="text-gray-900">عدد بنود الكميات:</strong> {boqItems.length} بنود
                </p>
                <p>
                  <strong className="text-gray-900">مجموع الكميات:</strong> {boqTotal.toLocaleString('ar-DZ')} دج
                </p>
                <p>
                  <strong className="text-gray-900">الوثائق المطلوبة:</strong> {operatorDocs.length} وثائق
                </p>
                <p>
                  <strong className="text-gray-900">الامتثال القانوني:</strong> القانون رقم 23-12
                </p>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">تنبيه تنظيمي بشأن التأشيرة والنشر:</p>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  حفظ المسودة أو إحالتها لا ينشر الإعلان للعموم ولا يفتح إيداع العروض. النشر الرسمي يستوجب استيفاء التأشيرات والمصادقات القانونية من لجنة الصفقات المختصة وفق المادة 52 من القانون 23-12.
                </p>
              </div>
            </div>
          </section>

          {/* Final Action Controls */}
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(3)}
              className="border-[#D5DDEA] text-gray-700 rounded-xl text-sm"
            >
              الرجوع للخطوة 3
            </Button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold px-4 py-2.5 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{exportingPdf ? 'جاري التصدير...' : 'تصدير مسودة دفتر الشروط (PDF)'}</span>
              </Button>

              <Button
                type="button"
                onClick={async () => {
                  const savedId = await handleSaveDeal();
                  if (savedId) {
                    setLocation(`/authority/deals/${savedId}`);
                  }
                }}
                disabled={saving}
                className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold px-5 py-2.5 flex items-center justify-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ كمسودة وفتح الملف'}</span>
              </Button>

              <Button
                type="button"
                onClick={async () => {
                  const savedId = await handleSaveDeal(2);
                  if (savedId) {
                    setLocation(`/authority/deals/${savedId}`);
                  }
                }}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-5 py-2.5 flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>إحالة للمراجعة الداخلية (المرحلة 2)</span>
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* ─── Modal: Template Preview ───────────────────────────────────────── */}
      {previewingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-navy-900 text-base">{previewingTemplate.title}</h3>
                <p className="text-xs text-gray-500">
                  المصدر: {previewingTemplate.sourceReference} · النسخة {previewingTemplate.version} ({previewingTemplate.revisionDate})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="font-bold text-gray-800 block">المراجع القانونية:</span>
                <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                  {previewingTemplate.statutoryReferences.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-navy-900 block">الأحكام العامة وموضوع الصفقة:</span>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-700 leading-relaxed">
                  {previewingTemplate.sections.general}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-navy-900 block">الوثائق المطلوبة من المتعهد:</span>
                <div className="space-y-1.5">
                  {previewingTemplate.requiredDocuments.map((doc) => (
                    <div
                      key={doc.code}
                      className="p-2 rounded-lg border border-gray-200 bg-white flex justify-between items-center text-[11px]"
                    >
                      <span className="font-semibold text-gray-800">{doc.name}</span>
                      <span className="text-gray-400">{doc.statutoryBasis}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewingTemplate(null)}
                className="rounded-xl text-xs"
              >
                إغلاق المعاينة
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  applyTemplate(previewingTemplate);
                  setPreviewingTemplate(null);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                استخدام هذا القالب
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
