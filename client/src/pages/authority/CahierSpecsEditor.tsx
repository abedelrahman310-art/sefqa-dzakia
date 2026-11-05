import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  ArrowRight,
  CheckCircle2,
  History,
  Scale,
  Sparkles,
  FileText,
} from 'lucide-react';
import { downloadPdfBlob } from '@/lib/pdfDownloader';
import { ClauseLinterWidget } from '@/features/specs/ClauseLinterWidget';
import { VoiceDictationButton } from '@/features/voice/VoiceDictationButton';
import { SmartSpecsGeneratorModal, type GeneratedSpecsClause } from '@/features/specs/SmartSpecsGeneratorModal';

// Removed LegalNode

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

interface CahierVersion {
  id: string;
  draftId: string;
  versionNumber: number;
  templateVersionId?: string | null;
  status: string;
  frozenDigest?: string | null;
  frozenAt?: string | null;
  changeSummary?: string | null;
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

interface CahierSpecsEditorProps {
  draftId: string;
}

const SECTION_KEYS = [
  'general_provisions',
  'administrative',
  'technical_specs',
  'financial_terms',
  'evaluation_criteria',
] as const;

export function CahierSpecsEditor({ draftId }: CahierSpecsEditorProps) {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [cahier, setCahier] = useState<CahierVersion | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [requirements, setRequirements] = useState<DealRequirement[]>([]);
  const [activeSection, setActiveSection] = useState<string>('general_provisions');

  // Clause editing local state
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [savingClause, setSavingClause] = useState(false);

  // Justification modal/input state
  const [justifyingFindingId, setJustifyingFindingId] = useState<string | null>(null);
  const [justificationText, setJustificationText] = useState('');
  const [savingJustification, setSavingJustification] = useState(false);

  // History expanded clause
  const [expandedHistoryClauseId, setExpandedHistoryClauseId] = useState<string | null>(null);

  // Freezing state
  const [freezing, setFreezing] = useState(false);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showSpecsGenerator, setShowSpecsGenerator] = useState(false);

  const handleApplyGeneratedSpecs = async (generated: GeneratedSpecsClause[]) => {
    const genGeneral = generated.find((c) => c.sectionKey === 'general_provisions')?.content || '';
    const genRules = generated.find((c) => c.sectionKey === 'administrative')?.content || '';
    const genTech = generated.find((c) => c.sectionKey === 'technical_specs')?.content || '';
    const genFin = generated.find((c) => c.sectionKey === 'financial_terms')?.content || '';
    const genEval = generated.find((c) => c.sectionKey === 'evaluation_criteria')?.content || '';

    const payload = {
      deal: draftId,
      administrative_clauses: {
        general: genGeneral,
        rules: genRules,
      },
      technical_requirements: {
        details: genTech,
      },
      financial_criteria: {
        terms: genFin,
        scoring: genEval,
      },
    };

    try {
      setLoading(true);
      if (cahier?.id) {
        await api.patch(`/procurements/specs/${cahier.id}/`, payload);
      } else {
        await api.post('/procurements/specs/', payload);
      }
      setShowSpecsGenerator(false);
      await fetchCahierData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || 'فشل تطبيق دفتر الشروط المولد');
      setLoading(false);
    }
  };

  const handleQuickFixClause = async (clauseId: string, fixedContent: string) => {
    const target = clauses.find((c) => c.id === clauseId);
    if (!target) return;

    setClauses((prev) =>
      prev.map((c) => (c.id === clauseId ? { ...c, content: fixedContent } : c))
    );

    if (cahier?.id) {
      let payload: any = {};
      if (target.sectionKey === 'general_provisions') {
        payload = { administrative_clauses: { general: fixedContent } };
      } else if (target.sectionKey === 'administrative') {
        payload = { administrative_clauses: { rules: fixedContent } };
      } else if (target.sectionKey === 'technical_specs') {
        payload = { technical_requirements: { details: fixedContent } };
      } else if (target.sectionKey === 'financial_terms') {
        payload = { financial_criteria: { terms: fixedContent } };
      } else if (target.sectionKey === 'evaluation_criteria') {
        payload = { financial_criteria: { scoring: fixedContent } };
      }
      try {
        await api.patch(`/procurements/specs/${cahier.id}/`, payload);
      } catch (err) {
        console.error('Failed to auto-save quick fix', err);
      }
    }
  };

  const handleExportPdf = async () => {
    if (!draftId) return;
    setIsExportingPdf(true);
    try {
      const filename = `Cahier_Specs_${draftTitle || draftId}.pdf`;
      await downloadPdfBlob(`/procurements/deals/${draftId}/specs-pdf/`, filename);
    } catch {
      alert(t('specs.export_error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const fetchCahierData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dealRes = await api.get(`/procurements/deals/${draftId}/`);
      const dealData = dealRes.data;
      setDraftTitle(dealData?.title || t('specs.default_deal_title'));

      let specs = dealData?.cahier_specs;
      if (!specs) {
        const specsRes = await api.get('/procurements/specs/', { params: { deal: draftId } });
        const list = Array.isArray(specsRes.data) ? specsRes.data : specsRes.data?.results || [];
        specs = list.find((s: any) => String(s.deal) === String(draftId));
      }

      if (!specs) {
        setCahier(null);
        setClauses([]);
        setRequirements([]);
        return;
      }

      setCahier({
        id: String(specs.id),
        draftId: String(draftId),
        versionNumber: 1,
        status: specs.is_validated ? 'frozen' : 'active',
        changeSummary: t('specs.statutory_ref_source'),
      });

      const loadedClauses: Clause[] = [];
      const sections = [
        { key: 'general_provisions', title: t('specs.section.general_provisions'), content: specs.administrative_clauses?.general || '' },
        { key: 'administrative', title: t('specs.section.administrative'), content: specs.administrative_clauses?.rules || '' },
        { key: 'technical_specs', title: t('specs.section.technical_specs'), content: specs.technical_requirements?.details || '' },
        { key: 'financial_terms', title: t('specs.section.financial_terms'), content: specs.financial_criteria?.terms || '' },
        { key: 'evaluation_criteria', title: t('specs.section.evaluation_criteria'), content: specs.financial_criteria?.scoring || '' },
      ];

      sections.forEach((sec, idx) => {
        loadedClauses.push({
          id: `clause-${idx + 1}`,
          cahierVersionId: String(specs.id),
          clauseCode: `CLAUSE-0${idx + 1}`,
          sectionKey: sec.key,
          sortOrder: idx + 1,
          title: sec.title,
          content: sec.content,
          status: 'verified',
          isMandatory: true,
          provenance: [
            {
              id: `prov-${idx}`,
              sourceType: 'standard_decree',
              sourceLabel: t('specs.statutory_ref_source'),
              verificationStatus: 'verified',
            },
          ],
          events: [],
          stressFindings: [],
        });
      });

      setClauses(loadedClauses);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || err?.message || 'Error loading cahier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCahierData();
  }, [draftId]);

  const handleInitCahier = async () => {
    try {
      setLoading(true);
      await api.post('/procurements/specs/', {
        deal: draftId,
        administrative_clauses: { general: '' },
        technical_requirements: { details: '' },
        financial_criteria: { scoring: '' },
      });
      await fetchCahierData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || 'Failed to initialize');
      setLoading(false);
    }
  };

  const handleStartEdit = (clause: Clause) => {
    setEditingClauseId(clause.id);
    setEditedContent(clause.content);
    setEditReason('');
  };

  const handleSaveClause = async (_clauseId: string) => {
    try {
      setSavingClause(true);
      if (cahier?.id) {
        await api.patch(`/procurements/specs/${cahier.id}/`, {
          administrative_clauses: { updated: editedContent },
        });
      }
      setEditingClauseId(null);
      await fetchCahierData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || 'Failed to save clause');
    } finally {
      setSavingClause(false);
    }
  };

  const handleSaveJustification = async (clauseId: string, findingId: string) => {
    if (!justificationText.trim()) return;
    try {
      setSavingJustification(true);
      const res = await fetch(`/api/sanad/drafts/${draftId}/cahier/clauses/${clauseId}/justify-stress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
        body: JSON.stringify({
          findingId,
          justification: justificationText,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save justification');
      }
      setJustifyingFindingId(null);
      setJustificationText('');
      await fetchCahierData();
    } catch (err: any) {
      alert(err.message || 'Failed to record justification');
    } finally {
      setSavingJustification(false);
    }
  };

  const handleFreeze = async () => {
    try {
      setFreezing(true);
      if (cahier?.id) {
        await api.patch(`/procurements/specs/${cahier.id}/`, {
          is_validated: true,
        });
      }
      setShowFreezeConfirm(false);
      await fetchCahierData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || 'Failed to freeze cahier');
    } finally {
      setFreezing(false);
    }
  };

  const isFrozen = cahier?.status === 'ready_for_approval' || cahier?.status === 'frozen_published';

  const currentSectionClauses = useMemo(() => {
    return clauses.filter((c) => c.sectionKey === activeSection);
  }, [clauses, activeSection]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">{t('specs.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 text-center space-y-4">
        <p className="font-bold text-base">{error}</p>
        <Button
          variant="outline"
          onClick={() => setLocation('/authority/drafts')}
          className="text-xs"
        >
          {t('specs.back_to_drafts')}
        </Button>
      </div>
    );
  }

  // Not yet initialized
  if (!cahier) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/authority/drafts')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-navy-900"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            <span>{t('specs.back_to_drafts')}</span>
          </Button>
          <h2 className="text-lg font-bold text-navy-900">{draftTitle}</h2>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-navy-50 text-navy-800 flex items-center justify-center mx-auto shadow-sm">
            <Scale className="w-8 h-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-extrabold text-navy-900">
              {t('specs.init_cahier')}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('specs.init_cahier_desc')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 max-w-lg mx-auto text-start space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-navy-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('specs.statutory_ref_title')}</span>
            </div>
            <ul className="list-disc ps-5 space-y-1">
              <li>{t('specs.statutory_ref_decree')}</li>
              <li>{t('specs.statutory_ref_law')}</li>
              <li>{t('specs.statutory_ref_check')}</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              onClick={() => setShowSpecsGenerator(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow transition-colors inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-100" />
              <span>{isAr ? "توليد دفتر شروط ذكي ومطابق قانونياً (AI Generator)" : "Générateur de cahier des charges IA conforme"}</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleInitCahier}
              className="font-bold px-6 py-3 rounded-xl border-border inline-flex items-center gap-2"
            >
              <span>{t('specs.init_cahier')}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/authority/drafts')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy-900 ps-0"
            >
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t('specs.back_to_drafts')}</span>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="text-xs font-semibold text-muted-foreground">
              {t('specs.title')}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-navy-900 flex items-center gap-3">
            <span>{draftTitle}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-navy-50 text-navy-800 border border-navy-200 font-bold">
              {t('specs.version_label', { version: cahier.versionNumber })}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                isFrozen
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isFrozen ? t('specs.status.ready_for_approval') : t('specs.status.drafting')}
            </span>
          </h1>
        </div>

        {/* Top Actions: PDF Export & Freeze */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {!isFrozen && (
            <Button
              onClick={() => setShowSpecsGenerator(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-100" />
              <span>{isAr ? "توليد ذكي (AI Generator)" : "Générateur IA"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="border-border hover:bg-muted text-foreground font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5"
            title={t('specs.export_pdf_tooltip')}
          >
            <FileText className="w-4 h-4 text-primary" />
            <span>{isExportingPdf ? t('specs.exporting') : t('specs.export_pdf_btn')}</span>
          </Button>

          {!isFrozen ? (
            <Button
              onClick={() => setShowFreezeConfirm(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{t('specs.freeze_btn')}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('specs.frozen_badge')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cryptographic Digest Banner (if frozen) */}
      {isFrozen && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <div className="font-extrabold text-emerald-900 text-sm">
                {t('specs.frozen_success_title')}
              </div>
              <div className="font-mono text-xs text-emerald-800 break-all">
                {t('specs.frozen_digest_label')}:{' '}
                <span className="font-bold select-all">{cahier.frozenDigest}</span>
              </div>
            </div>
          </div>
          <div className="text-end text-xs text-emerald-700 shrink-0">
            {cahier.frozenAt && new Date(cahier.frozenAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Freeze Confirmation Modal / Banner */}
      {showFreezeConfirm && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 text-amber-950 space-y-4 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-amber-900">
                {t('specs.freeze_modal_title')}
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                {t('specs.freeze_confirm')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={freezing}
              onClick={() => setShowFreezeConfirm(false)}
              className="text-xs"
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              disabled={freezing}
              onClick={handleFreeze}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4"
            >
              {freezing ? t('specs.freezing_status') : t('specs.freeze_confirm_btn')}
            </Button>
          </div>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
        {SECTION_KEYS.map((key) => {
          const count = clauses.filter((c) => c.sectionKey === key).length;
          const isActive = activeSection === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-[#006233] text-white shadow-sm'
                  : 'bg-card text-muted-foreground hover:bg-muted/70 hover:text-navy-900 border border-border/80'
              }`}
            >
              <span>{t(`specs.section.${key}` as any)}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-[#004d28] text-emerald-200' : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Requirements Tab */}
        <button
          type="button"
          onClick={() => setActiveSection('requirements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeSection === 'requirements'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-card text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('specs.requirements.title')}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeSection === 'requirements'
                ? 'bg-emerald-900 text-white'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {requirements.length}
          </span>
        </button>
      </div>

      {/* Active Section Content */}
      {activeSection === 'requirements' ? (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{t('specs.requirements.title')}</span>
            </h3>
            <span className="text-xs text-muted-foreground">
              {t('specs.requirements_disclaimer')}
            </span>
          </div>

          {requirements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl text-xs">
              {t('specs.requirements.none')}
            </div>
          ) : (
            <div className="grid gap-3">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-background border border-border rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-2 py-0.5 bg-navy-100 text-navy-900 rounded">
                        {req.requirementCode}
                      </span>
                      <span className="font-semibold text-navy-800">
                        {req.positionReference}
                      </span>
                    </div>
                    {req.isDisqualifying && (
                      <span className="px-2 py-0.5 bg-destructive/10 text-destructive border border-destructive/20 rounded font-bold">
                        {t('specs.disqualifying_badge')}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{req.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentSectionClauses.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-xs">
              {t('specs.no_clauses_in_section')}
            </div>
          ) : (
            currentSectionClauses.map((clause) => {
              const isEditing = editingClauseId === clause.id;
              const hasStress = clause.stressFindings && clause.stressFindings.length > 0;
              const isHistoryOpen = expandedHistoryClauseId === clause.id;

              return (
                <div
                  key={clause.id}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-border/80 transition-colors"
                >
                  {/* Clause Header & Provenance */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold px-2 py-1 rounded-lg bg-[#006233] text-white">
                        {clause.clauseCode}
                      </span>
                      <h4 className="text-sm font-bold text-navy-900">{clause.title}</h4>
                      {clause.isMandatory && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-200">
                          {t('specs.mandatory_clause')}
                        </span>
                      )}
                    </div>

                    {/* Provenance Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {clause.provenance.map((prov) => (
                        <span
                          key={prov.id}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                            prov.verificationStatus === 'verified_statutory'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : prov.verificationStatus === 'template_standard'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-navy-50 text-navy-800 border-navy-200'
                          }`}
                        >
                          <Scale className="w-3 h-3" />
                          <span>{prov.sourceLabel}</span>
                        </span>
                      ))}

                      {/* History Toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistoryClauseId(isHistoryOpen ? null : clause.id)
                        }
                        className="text-xs text-muted-foreground hover:text-navy-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <History className="w-3 h-3" />
                        <span>({clause.events.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Clause Content Area */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[11px] font-bold text-navy-900">تعديل البند (مع إمكانية الإملاء الصوتي):</span>
                        <VoiceDictationButton
                          onTranscript={(spoken) => {
                            setEditedContent((prev) => (prev ? prev + ' ' + spoken : spoken));
                          }}
                        />
                      </div>
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="text-xs min-h-[140px] leading-relaxed rounded-xl font-normal"
                        dir="rtl"
                      />
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <Input
                          placeholder={t('specs.edit_reason_placeholder')}
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          className="text-xs rounded-xl h-9 flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={savingClause}
                            onClick={() => setEditingClauseId(null)}
                            className="text-xs rounded-xl"
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button
                            size="sm"
                            disabled={savingClause}
                            onClick={() => handleSaveClause(clause.id)}
                            className="bg-[#006233] hover:bg-[#004d28] text-white font-bold text-xs rounded-xl"
                          >
                            {savingClause ? t('specs.saving_justification') : t('specs.save_clause')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-navy-950 leading-relaxed whitespace-pre-wrap bg-muted/20 p-3.5 rounded-xl border border-border/40 font-normal">
                        {clause.content}
                      </div>
                      {!isFrozen && (
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(clause)}
                            className="text-xs text-navy-700 hover:text-navy-900 hover:bg-navy-50"
                          >
                            {t('specs.edit_clause_btn')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Anti-Discriminatory Clause Linter */}
                  <div className="pt-2">
                    <ClauseLinterWidget
                      content={isEditing ? editedContent : clause.content}
                      onApplyFix={(fixedText) => {
                        if (isEditing) {
                          setEditedContent(fixedText);
                        } else {
                          handleQuickFixClause(clause.id, fixedText);
                        }
                      }}
                    />
                  </div>

                  {/* Competition Stress Findings (if any) */}
                  {hasStress && (
                    <div className="space-y-2 pt-1">
                      {clause.stressFindings.map((finding) => (
                        <div
                          key={finding.id}
                          className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="font-bold text-amber-900 block">
                                  {t('specs.competition_term_detected', {
                                    label: t('specs.stress.detected'),
                                    term: finding.detectedTerm,
                                  })}
                                </span>
                                <p className="text-amber-800 leading-relaxed">
                                  {finding.explanationAr}
                                </p>
                                {finding.suggestedRemedy && (
                                  <p className="text-emerald-800 font-medium">
                                    {finding.suggestedRemedy}
                                  </p>
                                )}
                              </div>
                            </div>

                            {finding.resolutionStatus === 'officially_justified' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                                {t('specs.stress.justified')}
                              </span>
                            ) : (
                              !isFrozen && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setJustifyingFindingId(finding.id);
                                    setJustificationText(finding.humanJustification || '');
                                  }}
                                  className="text-xs h-7 px-2 border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
                                >
                                  {t('specs.stress.justify_btn')}
                                </Button>
                              )
                            )}
                          </div>

                          {/* Justification form if open */}
                          {justifyingFindingId === finding.id && (
                            <div className="pt-2 border-t border-amber-200 space-y-2">
                              <Input
                                placeholder={t('specs.justify_placeholder')}
                                value={justificationText}
                                onChange={(e) => setJustificationText(e.target.value)}
                                className="text-xs bg-white rounded-lg h-8"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setJustifyingFindingId(null)}
                                  className="text-xs h-7"
                                >
                                  {t('common.cancel')}
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={savingJustification}
                                  onClick={() => handleSaveJustification(clause.id, finding.id)}
                                  className="bg-amber-700 hover:bg-amber-800 text-white text-xs h-7 px-3 font-bold"
                                >
                                  {savingJustification ? t('specs.saving_justification') : t('specs.justify_save_btn')}
                                </Button>
                              </div>
                            </div>
                          )}

                          {finding.humanJustification && (
                            <div className="text-xs text-amber-900 bg-white/70 p-2 rounded border border-amber-200/80">
                              <span className="font-bold">{t('specs.justification_recorded')} </span>
                              <span>{finding.humanJustification}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lifecycle Event History (if open) */}
                  {isHistoryOpen && (
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2 text-xs">
                      <div className="font-bold text-navy-900 flex items-center gap-1.5 text-xs">
                        <History className="w-3.5 h-3.5 text-navy-700" />
                        <span>{t('specs.history.title')}</span>
                      </div>
                      <div className="space-y-2 divide-y divide-border/40">
                        {clause.events.map((ev) => (
                          <div key={ev.id} className="pt-2 first:pt-0 space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="font-semibold text-navy-800">
                                {t('specs.by_actor', {
                                  type: ev.eventType,
                                  actor: ev.actorType,
                                })}
                              </span>
                              <span>{new Date(ev.createdAt).toLocaleString()}</span>
                            </div>
                            {ev.actionReason && (
                              <p className="text-xs text-navy-900 italic">
                                {t('specs.reason_label')} {ev.actionReason}
                              </p>
                            )}
                            {ev.previousContent && (
                              <div className="text-xs text-muted-foreground line-through">
                                {t('specs.previous_text')} {ev.previousContent}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
      {/* Smart Specs Generator Modal */}
      <SmartSpecsGeneratorModal
        isOpen={showSpecsGenerator}
        onClose={() => setShowSpecsGenerator(false)}
        onApplyGeneratedClauses={handleApplyGeneratedSpecs}
      />
    </div>
  );
}
