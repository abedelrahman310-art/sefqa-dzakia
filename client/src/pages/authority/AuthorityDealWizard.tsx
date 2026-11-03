import { useEffect, useState, useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
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

  const { t, lang, dir } = useI18n();
  const { user } = useAuth();
  const defaultWilaya = (user as any)?.wilaya || '16';

  // ─── Wizard Step State (1..4) ─────────────────────────────────────────────
  // 1: Deal Data | 2: Method & Template | 3: Specs & Docs | 4: Review & Save
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(!!dealId);
  const [saving, setSaving] = useState<boolean>(false);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [existingStage, setExistingStage] = useState<number>(1);

  // ─── Step 1 State: Basic Deal Data ─────────────────────────────────
  const [title, setTitle] = useState('');
  const [procurementNature, setProcurementNature] = useState<ProcurementNature>('works');
  const [wilaya, setWilaya] = useState(defaultWilaya);
  const [budget, setBudget] = useState('');
  const [specsPrice, setSpecsPrice] = useState('2000');
  const [taxRegime, setTaxRegime] = useState<'ttc' | 'ht'>('ttc');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');

  // ─── Step 2 State: Method & Template ──────────────────────────────────
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

  // ─── Step 3 State: Specs & Documents ────────────────────────────
  const [specsId, setSpecsId] = useState<string | null>(null);
  const [adminGeneral, setAdminGeneral] = useState('');
  const [adminRules, setAdminRules] = useState('');
  const [techDetails, setTechDetails] = useState('');
  const [techWarranty, setTechWarranty] = useState('');
  const [finTerms, setFinTerms] = useState('');
  const [finScoring, setFinScoring] = useState('');

  // BOQ Items
  const [boqItems, setBoqItems] = useState<BoqItem[]>([
    { id: '1', name: '', unit: '', quantity: 1, unitPrice: 0 },
  ]);

  // Required Operator Documents (derived from template and procedure)
  const [operatorDocs, setOperatorDocs] = useState<OperatorDocumentRequirement[]>([]);
  const [customDocName, setCustomDocName] = useState('');

  // AI & Compliance Check
  const [complianceChecking, setComplianceChecking] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any>(null);

  // ─── Step 4 State: Exporting ──────────────────────────────────────────────
  const [exportingPdf, setExportingPdf] = useState(false);
  const getNatureLabel = (natureKey: ProcurementNature) => {
    const map: Record<string, string> = {
      works: t('common.nature.works'),
      supplies: t('common.nature.supplies'),
      services: t('common.nature.services'),
      studies: t('common.nature.studies'),
    };
    return map[natureKey] || NATURE_LABELS[natureKey]?.ar || natureKey;
  };

  const getMethodLabel = (methodKey: string) => {
    const map: Record<string, string> = {
      call_for_tenders: t('authority.wizard.s2_method_call_tenders'),
      negotiated_procedure: t('authority.wizard.s2_method_negotiated'),
    };
    return map[methodKey] || METHOD_LABELS[methodKey]?.ar || methodKey;
  };

  const getFormLabel = (formKey: ProcurementForm) => {
    const map: Record<string, string> = {
      open: t('authority.wizard.s2_form_open'),
      restricted: t('authority.wizard.s2_form_restricted'),
      open_with_minimum_capacities: t('authority.wizard.s2_form_open_min_capacities'),
      two_stage: t('authority.wizard.s2_form_two_stage'),
    };
    return map[formKey] || FORM_LABELS[formKey]?.ar || formKey;
  };


  // Auto-calculated BOQ Total
  const boqTotal = useMemo(() => {
    return boqItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
  }, [boqItems]);

  // Explicit sync of B.O.Q total to budget
  const applyBoqTotalToBudget = () => {
    if (boqTotal > 0) {
      setBudget(String(boqTotal));
      toast.info(t('authority.wizard.toast_budget_updated', { budget: boqTotal.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') }));
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
    toast.success(t('authority.wizard.toast_template_applied', { title: tpl.title }));
  };

  // Apply manual draft when no template exists or upon request
  const applyManualDraft = () => {
    setSelectedTemplateId(null);
    setSelectedTemplateVersion('1.0');
    setIsManualDraft(true);

    if (!adminGeneral) {
      setAdminGeneral(
        t('authority.wizard.default_clause_general')
      );
    }
    if (!adminRules) {
      setAdminRules(
        t('authority.wizard.default_clause_rules')
      );
    }
    if (!techDetails) {
      setTechDetails(t('authority.wizard.default_clause_tech_details'));
    }
    if (!techWarranty) {
      setTechWarranty(t('authority.wizard.default_clause_warranty'));
    }
    if (!finTerms) {
      setFinTerms(t('authority.wizard.default_clause_fin_terms'));
    }
    if (!finScoring) {
      setFinScoring(t('authority.wizard.default_clause_scoring'));
    }

    // Default basic documents
    setOperatorDocs([
      {
        code: 'DOC-ADM-01',
        name: t('authority.wizard.default_doc_candidacy'),
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: t('authority.wizard.default_doc_basis'),
      },
      {
        code: 'DOC-ADM-02',
        name: t('authority.wizard.default_doc_integrity'),
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: t('authority.wizard.default_doc_basis'),
      },
      {
        code: 'DOC-FIN-01',
        name: t('authority.wizard.default_doc_financial'),
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: t('authority.wizard.default_doc_basis'),
      },
    ]);

    toast.info(t('authority.wizard.toast_manual_draft_started'));
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
            if (d.specs_price !== undefined) setSpecsPrice(String(d.specs_price));

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
          toast.error(t('authority.wizard.toast_load_error'));
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
      toast.success(t('authority.wizard.toast_compliance_success'));
    } catch {
      setComplianceResult({
        is_advisory: true,
        statutory_reference: t('authority.wizard.default_compliance_ref'),
        legal_disclaimer:
          t('authority.wizard.default_compliance_disclaimer'),
        preliminary_compliance_check: true,
        advisory_notes: [
          {
            rule: t('authority.wizard.default_compliance_rule'),
            severity: 'info',
            message: t('authority.wizard.default_compliance_msg'),
            recommendation: t('authority.wizard.default_compliance_rec'),
          },
        ],
        human_verification_required: true,
      });
      toast.info(t('authority.wizard.toast_advisory_shown'));
    } finally {
      setComplianceChecking(false);
    }
  };

  // BOQ row handlers
  const handleAddBoqRow = () => {
    setBoqItems((prev) => [
      ...prev,
      { id: `boq-${Date.now()}`, name: '', unit: t('authority.wizard.default_boq_unit'), quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleUpdateBoqRow = (id: string, field: keyof BoqItem, value: any) => {
    setBoqItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleRemoveBoqRow = (id: string) => {
    if (boqItems.length <= 1) {
      toast.warning(t('authority.wizard.toast_min_one_boq'));
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
        statutoryBasis: t('authority.wizard.default_doc_discretionary_basis'),
      },
    ]);
    setCustomDocName('');
    toast.success(t('authority.wizard.toast_doc_added'));
  };

  const handleRemoveDoc = (code: string) => {
    const doc = operatorDocs.find((d) => d.code === code);
    if (doc?.isStatutory) {
      toast.error(t('authority.wizard.toast_doc_cannot_delete', { name: doc.name }));
      return;
    }
    setOperatorDocs((prev) => prev.filter((d) => d.code !== code));
  };

  // Save Deal and Specs Handler
  const handleSaveDeal = async (targetStage?: number) => {
    if (!title.trim()) {
      setCurrentStep(1);
      toast.error(t('authority.wizard.toast_title_required'));
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
        specs_price: specsPrice ? parseFloat(specsPrice) : 0,
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
          ? t('authority.wizard.toast_promoted_success')
          : t('authority.wizard.toast_draft_saved_success')
      );

      return activeDealId;
    } catch (err: any) {
      console.error('Failed to save deal:', err);
      toast.error(err?.response?.data?.detail || t('authority.wizard.toast_save_error'));
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
      toast.success(t('authority.wizard.toast_pdf_success'));
    } catch {
      toast.error(t('authority.wizard.toast_pdf_error'));
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
        label: t('authority.wizard.chk_title'),
        isComplete: !!title.trim(),
        step: 1,
      },
      {
        id: 'description',
        label: t('authority.wizard.chk_desc'),
        isComplete: description.trim().length >= 10,
        step: 1,
      },
      {
        id: 'method',
        label: t('authority.wizard.chk_method'),
        isComplete: !!procurementMethod && !!procurementForm,
        step: 2,
      },
      {
        id: 'justification',
        label: needJustif ? t('authority.wizard.chk_justif_required') : t('authority.wizard.chk_justif_not_required'),
        isComplete: needJustif ? !!procedureJustification.trim() : true,
        step: 2,
      },
      {
        id: 'template',
        label: t('authority.wizard.chk_template'),
        isComplete: !!selectedTemplateId || isManualDraft,
        step: 2,
      },
      {
        id: 'clauses',
        label: t('authority.wizard.chk_clauses'),
        isComplete: adminGeneral.trim().length > 20 && techDetails.trim().length > 20 && finTerms.trim().length > 15,
        step: 3,
      },
      {
        id: 'operator_docs',
        label: t('authority.wizard.chk_docs'),
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
      <div className="py-24 flex flex-col items-center justify-center text-gray-500 space-y-3" dir={dir}>
        <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">{t('authority.wizard.btn_saving')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16" dir={dir}>
      {/* ─── Header & Top Actions ────────────────────────────────────────── */}
      <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/authority/deals')}
              className="p-1.5 h-auto text-gray-600 hover:text-navy-900 hover:bg-gray-100 rounded-lg"
              title={t('authority.wizard.nav_back_to_deals')}
            >
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
              {referenceNumber || t('authority.wizard.new_deal_ref')}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {t('authority.wizard.stage_planning')}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-navy-900 tracking-tight">
            {dealId ? (title ? t('authority.wizard.title_edit', { title }) : t('authority.wizard.title_edit_fallback')) : t('authority.wizard.title_new')}
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            {t('authority.wizard.subtitle')}
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
            <span>{saving ? t('authority.wizard.btn_saving') : t('authority.wizard.btn_save_draft')}</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="border-[#D5DDEA] text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{exportingPdf ? t('authority.wizard.btn_exporting_pdf') : t('authority.wizard.btn_export_pdf')}</span>
          </Button>
        </div>
      </section>

      {/* ─── Stepper Navigation (Reorganized into 4 Canonical Steps) ──────── */}
      <nav aria-label={t('authority.wizard.nav_aria')} className="bg-white border border-[#D5DDEA] rounded-2xl p-3 shadow-sm">
        <ol className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { step: 1, title: t('authority.wizard.step1_title'), desc: t('authority.wizard.step1_desc') },
            { step: 2, title: t('authority.wizard.step2_title'), desc: t('authority.wizard.step2_desc') },
            { step: 3, title: t('authority.wizard.step3_title'), desc: t('authority.wizard.step3_desc') },
            { step: 4, title: t('authority.wizard.step4_title'), desc: t('authority.wizard.step4_desc') },
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
                      className={`text-xs truncate ${
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
          STEP 1: Basic Deal Data
          ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EBF4] pb-4">
              <h2 className="text-lg font-bold text-navy-900">{t('authority.wizard.s1_title')}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {t('authority.wizard.s1_desc')}
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
                    {t('authority.wizard.s1_authority_label', { org: (user as any)?.organizationName || (user as any)?.displayName || t('authority.wizard.s1_authority_default') })}
                  </p>
                  <p className="text-gray-500">
                    {t('authority.wizard.s1_officer_label', {
                      email: user?.email || t('authority.wizard.s1_officer_default'),
                      wilaya: (user as any)?.wilaya || '16',
                    })}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {t('authority.wizard.s1_auto_data')}
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {t('authority.wizard.s1_deal_title')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={t('authority.wizard.s1_deal_title_placeholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl border-[#D5DDEA] focus:border-navy-500"
                />
              </div>

              {/* Procurement Nature (4 Families) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {t('authority.wizard.s1_nature_label')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={procurementNature}
                  onChange={(e) => setProcurementNature(e.target.value as ProcurementNature)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="works">{t('authority.wizard.s1_nature_works')}</option>
                  <option value="supplies">{t('authority.wizard.s1_nature_supplies')}</option>
                  <option value="studies">{t('authority.wizard.s1_nature_studies')}</option>
                  <option value="services">{t('authority.wizard.s1_nature_services')}</option>
                </select>
                <p className="text-xs text-gray-500">
                  {NATURE_LABELS[procurementNature].desc}
                </p>
              </div>

              {/* Wilaya Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {t('authority.wizard.s1_wilaya_exec')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  {t('authority.wizard.s1_initial_budget')}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder={t('authority.wizard.s1_budget_placeholder')}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="rounded-xl border-[#D5DDEA] focus:border-navy-500 pe-12"
                  />
                  <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    {t('common.dzd')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">{t('authority.wizard.s1_tax_system')}</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="wzTaxRegime"
                        value="ttc"
                        checked={taxRegime === 'ttc'}
                        onChange={() => setTaxRegime('ttc')}
                        className="text-navy-900 focus:ring-navy-500"
                      />
                      <span className="text-xs font-bold text-gray-700">{t('authority.wizard.s1_ttc')}</span>
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
                      <span className="text-xs font-bold text-gray-700">{t('authority.wizard.s1_ht')}</span>
                    </label>
                  </div>
                  {boqTotal > 0 && (
                    <button
                      type="button"
                      onClick={applyBoqTotalToBudget}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      {t('authority.wizard.s1_use_boq_total', { total: boqTotal.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') })}
                    </button>
                  )}
                </div>
              </div>

              {/* Specs Price Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {t('authority.specs.price_label')}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    placeholder="2000"
                    value={specsPrice}
                    onChange={(e) => setSpecsPrice(e.target.value)}
                    className="rounded-xl border-[#D5DDEA] focus:border-navy-500 pe-12"
                  />
                  <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    {t('common.dzd')}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {t('authority.specs.price_help')}
                </p>
              </div>


              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {t('authority.wizard.s1_proposed_duration')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={t('authority.wizard.s1_duration_placeholder')}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="rounded-xl border-[#D5DDEA] focus:border-navy-500"
                />
              </div>

              {/* Scope of Need */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {t('authority.wizard.s1_scope_required')} <span className="text-red-500">*</span>
                </label>
                <Textarea
                  rows={3}
                  placeholder={t('authority.wizard.s1_scope_desc_placeholder')}
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
                  toast.error(t('authority.wizard.s1_title_req_toast'));
                  return;
                }
                setCurrentStep(2);
              }}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm flex items-center gap-2"
            >
              <span>{t('authority.wizard.s1_btn_next')}</span>
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 2: Method, Form & Template Selection
          ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EBF4] pb-4">
              <h2 className="text-lg font-bold text-navy-900">
                {t('authority.wizard.s2_step_eyebrow')}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {t('authority.wizard.s2_step_subtitle')}
              </p>
            </div>

            {/* Selection Grid: Method, Form, and Competition Scope */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Procurement Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {t('authority.wizard.s2_method_label')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={procurementMethod}
                  onChange={(e) => handleMethodChange(e.target.value as ProcurementMethod)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="call_for_tenders">{t('authority.wizard.s2_method_tenders')}</option>
                  <option value="negotiated_procedure">{t('authority.wizard.s2_method_negotiated')}</option>
                </select>
                <p className="text-xs text-gray-500 leading-tight">
                  {METHOD_LABELS[procurementMethod].desc}
                </p>
              </div>

              {/* 2. Procurement Form (Strictly filtered by method) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  {t('authority.wizard.s2_form_title')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={procurementForm}
                  onChange={(e) => setProcurementForm(e.target.value as ProcurementForm)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {compatibleForms.map((f) => (
                    <option key={f} value={f}>
                      {FORM_LABELS[f].ar}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 leading-tight">
                  {FORM_LABELS[procurementForm].desc}
                </p>
              </div>

              {/* 3. Competition Scope (Only if applicable) */}
              {isCompetitionScopeApplicable(procurementMethod, procurementForm) ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {t('authority.wizard.s2_scope_title')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={competitionScope}
                    onChange={(e) => setCompetitionScope(e.target.value as CompetitionScope)}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="national">{t('authority.wizard.s2_scope_national')}</option>
                    <option value="national_and_international">{t('authority.wizard.s2_scope_national_international')}</option>
                  </select>
                  <p className="text-xs text-gray-500 leading-tight">
                    {t('authority.wizard.s2_scope_art81')}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 opacity-60">
                  <label className="text-xs font-bold text-muted-foreground block">{t('authority.wizard.s2_scope_title')}</label>
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-100 text-xs text-gray-500">
                    {t('authority.wizard.s2_scope_not_applicable')}
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
                    {t('authority.wizard.s2_record_justif_title', { form: getFormLabel(procurementForm) })}
                  </h3>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {t('authority.wizard.s2_record_justif_desc')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-amber-900 block">
                      {t('authority.wizard.s2_justif_motive_label')} <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      rows={2}
                      placeholder={t('authority.wizard.s2_justif_motive_placeholder')}
                      value={procedureJustification}
                      onChange={(e) => setProcedureJustification(e.target.value)}
                      className="text-xs rounded-xl border-amber-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900 block">{t('authority.wizard.s2_statutory_basis_label')}</label>
                    <Input
                      placeholder={FORM_LABELS[procurementForm].legalRef}
                      value={statutoryBasis}
                      onChange={(e) => setStatutoryBasis(e.target.value)}
                      className="text-xs rounded-xl border-amber-300 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900 block">
                      {t('authority.wizard.s2_supporting_docs_label')}
                    </label>
                    <Input
                      placeholder={t('authority.wizard.s2_supporting_docs_placeholder')}
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
                    <span>{t('authority.wizard.s2_templates_lib_title')}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t('authority.wizard.s2_templates_lib_desc', { nature: getNatureLabel(procurementNature), form: getFormLabel(procurementForm) })}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyManualDraft}
                  className="border-[#D5DDEA] text-xs font-semibold rounded-xl"
                >
                  {t('authority.wizard.s2_start_manual_btn')}
                </Button>
              </div>

              {compatibleTemplates.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-3 bg-gray-50/50">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="space-y-1 max-w-md mx-auto">
                    <p className="text-xs font-bold text-gray-700">
                      {t('authority.wizard.s2_no_matching_tpl')}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {t('authority.wizard.s2_no_matching_tpl_desc')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={applyManualDraft}
                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold"
                  >
                    {t('authority.wizard.s2_continue_manual')}
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
                              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                TEMPLATE_STATUS_LABELS[tpl.status]?.badgeClass || 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              TEMPLATE_STATUS_LABELS[tpl.status]?.ar || 'Modèle indicatif'
                            </span>
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {t('authority.wizard.s2_tpl_version', { version: tpl.version, date: tpl.revisionDate })}
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-1">
                            {t('authority.wizard.s2_tpl_source', { source: tpl.sourceReference })}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            <span>{t('authority.wizard.s2_tpl_required_docs', { count: tpl.requiredDocuments.length })}</span>
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
                            {t('authority.wizard.s2_tpl_preview')}
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
                                {t('authority.wizard.s2_tpl_selected')}
                              </span>
                            ) : (
                              t('authority.wizard.s2_tpl_use')
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
              {t('authority.wizard.s2_btn_prev')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (isJustificationRequired(procurementMethod, procurementForm) && !procedureJustification.trim()) {
                  toast.error(t('authority.wizard.s2_justif_required_toast'));
                  return;
                }
                setCurrentStep(3);
              }}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm flex items-center gap-2"
            >
              <span>{t('authority.wizard.s2_btn_next')}</span>
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 3: Cahier Specs & Bidders Dossier
          ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5EBF4] pb-4">
              <div>
                <h2 className="text-lg font-bold text-navy-900">
                  {t('authority.wizard.s3_step_eyebrow')}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {t('authority.wizard.s3_step_subtitle')}
                </p>
              </div>

              <Button
                type="button"
                onClick={handleRunComplianceCheck}
                disabled={complianceChecking}
                className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{complianceChecking ? t('authority.wizard.s3_compliance_checking') : t('authority.wizard.s3_compliance_btn')}</span>
              </Button>
            </div>

            {/* AI Compliance Findings Card */}
            {complianceResult && (
              <div className="bg-navy-50/70 border border-navy-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-navy-700" />
                    {t('authority.wizard.s3_compliance_report')}
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
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-navy-100 text-xs">
                    <span className="font-bold text-navy-900">{n.rule}:</span> {n.message}
                  </div>
                ))}
              </div>
            )}

            {/* 3 Main Clauses Editing */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <label className="text-xs font-bold text-navy-900 block">
                  {t('authority.wizard.s3_sec_admin')}
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
                  {t('authority.wizard.s3_sec_tech')}
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
                  {t('authority.wizard.s3_sec_fin')}
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
                  <h3 className="text-sm font-bold text-navy-900">{t('authority.wizard.s3_boq_title')}</h3>
                  <p className="text-xs text-gray-500">
                    {t('authority.wizard.s3_boq_desc', { total: boqTotal.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR') })}
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
                  {t('authority.wizard.s3_boq_add_btn')}
                </Button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600">
                      <th className="px-4 py-4 w-10 text-center">#</th>
                      <th className="px-4 py-4">{t('authority.wizard.s3_boq_th_desc')}</th>
                      <th className="px-4 py-4 w-24">{t('authority.wizard.s3_boq_th_unit')}</th>
                      <th className="px-4 py-4 w-20">{t('authority.wizard.s3_boq_th_qty')}</th>
                      <th className="px-4 py-4 w-32">{t('authority.wizard.s3_boq_th_price')}</th>
                      <th className="px-4 py-4 w-32 text-end">{t('authority.wizard.s3_boq_th_total')}</th>
                      <th className="px-4 py-4 w-10 text-center">{t('authority.wizard.s3_boq_th_delete')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {boqItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-center text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <Input
                            value={item.name}
                            onChange={(e) => handleUpdateBoqRow(item.id, 'name', e.target.value)}
                            className="h-7 text-xs rounded-lg"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={item.unit}
                            onChange={(e) => handleUpdateBoqRow(item.id, 'unit', e.target.value)}
                            className="h-7 text-xs rounded-lg"
                          />
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
                          {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} {t('common.dzd')}
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
                    {t('authority.wizard.s3_sec_docs')}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {t('authority.wizard.s3_sec_docs_desc')}
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
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                          {doc.code}
                        </span>
                        <span className="font-bold text-navy-900">{doc.name}</span>
                        {doc.isStatutory ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-navy-50 text-navy-800 border border-navy-200">
                            {t('authority.wizard.s3_doc_statutory')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {t('authority.wizard.s3_doc_discretionary')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('authority.wizard.s3_doc_basis', { basis: doc.statutoryBasis })}</p>
                      {doc.conditionNotes && (
                        <p className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          {t('authority.wizard.s3_doc_cond', { cond: doc.conditionNotes })}
                        </p>
                      )}
                    </div>
                    {doc.isStatutory ? (
                      <span
                        className="text-gray-300 p-1 cursor-not-allowed inline-flex items-center"
                        title={t('authority.wizard.s3_doc_title_tooltip')}
                      >
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.code)}
                        className="text-gray-400 hover:text-red-600 p-1 inline-flex items-center"
                        title={t('authority.wizard.s3_doc_delete_tooltip')}
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
                  placeholder={t('authority.wizard.s3_doc_add_placeholder')}
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
                  {t('authority.wizard.s3_doc_add_btn')}
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
              {t('authority.wizard.s3_btn_prev')}
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm text-sm flex items-center gap-2"
            >
              <span>{t('authority.wizard.s3_btn_next')}</span>
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STEP 4: Review & Save
          ══════════════════════════════════════════════════════════════════════ */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Readiness Checklist */}
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5EBF4] pb-3">
              <div>
                <h2 className="text-base font-bold text-navy-900">
                  {t('authority.wizard.s4_checklist_title')}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('authority.wizard.s4_checklist_desc')}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  allReady
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {allReady ? t('authority.wizard.s4_all_ready') : t('authority.wizard.s4_needs_completion')}
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
                      {t('authority.wizard.s4_complete_step', { step: item.step })}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Full Deal Overview Summary */}
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E5EBF4] pb-3">
              <h2 className="text-base font-bold text-navy-900">{t('authority.wizard.s4_summary_title')}</h2>
              <p className="text-xs text-muted-foreground">{t('authority.wizard.s4_summary_desc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Card 1 */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
                <span className="font-bold text-gray-800 block border-b border-gray-200 pb-2">
                  {t('authority.wizard.s4_sum_sec_deal')}
                </span>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_subject')}</strong> {title || '—'}
                </p>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_nature')}</strong> {getNatureLabel(procurementNature)}
                </p>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_budget')}</strong>{' '}{budget ? `${parseFloat(budget).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} ${t('common.dzd')}` : t('authority.wizard.s4_sum_unspecified')}
                </p>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_wilaya')}</strong> {t('authority.wizard.s4_sum_wilaya_val', { wilaya })}
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
                <span className="font-bold text-gray-800 block border-b border-gray-200 pb-2">
                  {t('authority.wizard.s4_sum_sec_method')}
                </span>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_method')}</strong> {getMethodLabel(procurementMethod)}
                </p>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_form')}</strong> {getFormLabel(procurementForm)}
                </p>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_scope')}</strong>{' '}{competitionScope === 'national' ? t('authority.wizard.s4_sum_scope_nat') : t('authority.wizard.s4_sum_scope_intl')}
                </p>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_template')}</strong>{' '}{isManualDraft ? t('authority.wizard.s4_sum_manual_draft') : selectedTemplateId || t('authority.wizard.s4_sum_approved_tpl')}
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-2">
                <span className="font-bold text-gray-800 block border-b border-gray-200 pb-2">
                  {t('authority.wizard.s4_sum_sec_specs')}
                </span>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_boq_items')}</strong> {t('authority.wizard.s4_sum_boq_items_count', { count: boqItems.length })}
                </p>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_boq_total')}</strong> {boqTotal.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} {t('common.dzd')}
                </p>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_docs_count')}</strong> {t('authority.wizard.s4_sum_docs_val', { count: operatorDocs.length })}
                </p>
                <p>
                  <strong className="text-foreground">{t('authority.wizard.s4_sum_compliance')}</strong> {t('authority.wizard.s4_sum_law_val')}
                </p>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{t('authority.wizard.s4_visa_warning_title')}</p>
                <p className="text-amber-800 leading-relaxed text-xs">
                  {t('authority.wizard.s4_visa_warning_desc')}
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
              {t('authority.wizard.s4_btn_prev')}
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
                <span>{exportingPdf ? t('authority.wizard.btn_exporting_pdf') : t('authority.wizard.s4_btn_export_pdf')}</span>
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
                <span>{saving ? t('authority.wizard.btn_saving') : t('authority.wizard.btn_save_draft')}</span>
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
                <span>{t('authority.wizard.s4_btn_promote')}</span>
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
                  {t('authority.wizard.modal_preview_source', { source: previewingTemplate.sourceReference, version: previewingTemplate.version, date: previewingTemplate.revisionDate })}
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
                <span className="font-bold text-foreground block">{t('authority.wizard.modal_legal_refs')}</span>
                <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                  {previewingTemplate.statutoryReferences.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-navy-900 block">{t('authority.wizard.modal_general_provisions')}</span>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-700 leading-relaxed">
                  {previewingTemplate.sections.general}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-navy-900 block">{t('authority.wizard.modal_required_docs')}</span>
                <div className="space-y-1.5">
                  {previewingTemplate.requiredDocuments.map((doc) => (
                    <div
                      key={doc.code}
                      className="p-2 rounded-lg border border-gray-200 bg-white flex justify-between items-center text-xs"
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
                {t('authority.wizard.modal_close')}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  applyTemplate(previewingTemplate);
                  setPreviewingTemplate(null);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                {t('authority.wizard.modal_use_template')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
