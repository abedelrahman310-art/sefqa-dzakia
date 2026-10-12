import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
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
} from 'lucide-react';

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
  const { t } = useI18n();
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

  const fetchCahierData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch draft info
      const draftRes = await fetch(`/api/drafts/${draftId}`);
      if (!draftRes.ok) {
        throw new Error('Failed to load draft details');
      }
      const draftData = await draftRes.json();
      setDraftTitle(draftData.draft?.title || 'صفقة');

      // Fetch cahier data
      const cahierRes = await fetch(`/api/sanad/drafts/${draftId}/cahier`);
      if (cahierRes.status === 404) {
        setCahier(null);
        setClauses([]);
        setRequirements([]);
        return;
      }
      if (!cahierRes.ok) {
        throw new Error('Failed to load cahier des charges');
      }
      const data = await cahierRes.json();
      setCahier(data.cahier);
      setClauses(data.clauses || []);
      setRequirements(data.requirements || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading cahier');
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
      const res = await fetch(`/api/sanad/drafts/${draftId}/cahier/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to initialize cahier');
      }
      await fetchCahierData();
    } catch (err: any) {
      alert(err.message || 'Failed to initialize');
      setLoading(false);
    }
  };

  const handleStartEdit = (clause: Clause) => {
    setEditingClauseId(clause.id);
    setEditedContent(clause.content);
    setEditReason('');
  };

  const handleSaveClause = async (clauseId: string) => {
    try {
      setSavingClause(true);
      const res = await fetch(`/api/sanad/drafts/${draftId}/cahier/clauses/${clauseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
        body: JSON.stringify({
          content: editedContent,
          actionReason: editReason || 'تعديل صياغة البند لمصلحة المشروع',
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save clause');
      }
      setEditingClauseId(null);
      await fetchCahierData();
    } catch (err: any) {
      alert(err.message || 'Failed to save clause');
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
      const res = await fetch(`/api/sanad/drafts/${draftId}/cahier/freeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to freeze cahier');
      }
      setShowFreezeConfirm(false);
      await fetchCahierData();
    } catch (err: any) {
      alert(err.message || 'Failed to freeze cahier');
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
        <span className="text-sm font-medium">جاري تحميل بيانات دفتر الشروط وسلسلة الإسناد...</span>
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
              <span>المرجعية النظامية المعتمدة تلقائياً:</span>
            </div>
            <ul className="list-disc ps-5 space-y-1">
              <li>المرسوم الرئاسي 15-247 (المادتان 53 و67: دفاتر الشروط النموذجية والتأمينات)</li>
              <li>القانون 23-12 (المادتان 5 و26: حرية المنافسة والشفافية وتكافؤ الفرص)</li>
              <li>فحص تلقائي لمخاطر حصر المنافسة وذكر الماركات التجارية</li>
            </ul>
          </div>

          <Button
            onClick={handleInitCahier}
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-8 py-3 rounded-xl shadow transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>{t('specs.init_cahier')}</span>
          </Button>
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
              الإصدار {cahier.versionNumber}
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

        {/* Freeze Action */}
        {!isFrozen ? (
          <Button
            onClick={() => setShowFreezeConfirm(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-2 self-start sm:self-auto"
          >
            <Lock className="w-4 h-4" />
            <span>{t('specs.freeze_btn')}</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t('specs.frozen_badge')}</span>
          </div>
        )}
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
                تم تجميد دفتر الشروط وإحالته للاعتماد بنجاح
              </div>
              <div className="font-mono text-[11px] text-emerald-800 break-all">
                {t('specs.frozen_digest_label')}:{' '}
                <span className="font-bold select-all">{cahier.frozenDigest}</span>
              </div>
            </div>
          </div>
          <div className="text-end text-[11px] text-emerald-700 shrink-0">
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
                تأكيد التجميد الرقمي لدفتر الشروط
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
              إلغاء
            </Button>
            <Button
              size="sm"
              disabled={freezing}
              onClick={handleFreeze}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4"
            >
              {freezing ? 'جاري التجميد واستخراج المتطلبات...' : 'نعم، تجميد النسخة'}
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
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-card text-muted-foreground hover:bg-muted/70 hover:text-navy-900 border border-border/80'
              }`}
            >
              <span>{t(`specs.section.${key}` as any)}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-navy-800 text-gold-300' : 'bg-muted text-muted-foreground'
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
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
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
              تُستخرج هذه المتطلبات تلقائياً من بنود الدفتر عند التجميد لتمكين التحقق الرقمي للمتعاملين
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
                        إقصائي في حال عدم التقديم
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
              لا توجد بنود مدرجة في هذا القسم حالياً.
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
                      <span className="font-mono text-xs font-extrabold px-2 py-1 rounded-lg bg-navy-900 text-white">
                        {clause.clauseCode}
                      </span>
                      <h4 className="text-sm font-bold text-navy-900">{clause.title}</h4>
                      {clause.isMandatory && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-200">
                          بند إلزامي
                        </span>
                      )}
                    </div>

                    {/* Provenance Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {clause.provenance.map((prov) => (
                        <span
                          key={prov.id}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
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
                        className="text-[11px] text-muted-foreground hover:text-navy-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <History className="w-3 h-3" />
                        <span>({clause.events.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Clause Content Area */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="text-xs min-h-[140px] leading-relaxed rounded-xl font-normal"
                        dir="rtl"
                      />
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <Input
                          placeholder="مبرر التعديل (إلزامي للتوثيق في سجل التدقيق)..."
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
                            إلغاء
                          </Button>
                          <Button
                            size="sm"
                            disabled={savingClause}
                            onClick={() => handleSaveClause(clause.id)}
                            className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl"
                          >
                            {savingClause ? 'جاري الحفظ...' : t('specs.save_clause')}
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
                            تعديل نص البند
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

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
                                  {t('specs.stress.detected')}: رصد مصطلح مقيد للمنافسة («
                                  {finding.detectedTerm}»)
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
                                  className="text-[11px] h-7 px-2 border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
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
                                placeholder="اكتب المبرر الإداري أو الفني لاستعمال هذا المصطلح أو الطراز..."
                                value={justificationText}
                                onChange={(e) => setJustificationText(e.target.value)}
                                className="text-xs bg-white rounded-lg h-8"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setJustifyingFindingId(null)}
                                  className="text-[11px] h-7"
                                >
                                  إلغاء
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={savingJustification}
                                  onClick={() => handleSaveJustification(clause.id, finding.id)}
                                  className="bg-amber-700 hover:bg-amber-800 text-white text-[11px] h-7 px-3 font-bold"
                                >
                                  {savingJustification ? 'جاري الحفظ...' : 'تثبيت المبرر'}
                                </Button>
                              </div>
                            </div>
                          )}

                          {finding.humanJustification && (
                            <div className="text-[11px] text-amber-900 bg-white/70 p-2 rounded border border-amber-200/80">
                              <span className="font-bold">المبرر الإداري المسجل: </span>
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
                      <div className="font-bold text-navy-900 flex items-center gap-1.5 text-[11px]">
                        <History className="w-3.5 h-3.5 text-navy-700" />
                        <span>{t('specs.history.title')}</span>
                      </div>
                      <div className="space-y-2 divide-y divide-border/40">
                        {clause.events.map((ev) => (
                          <div key={ev.id} className="pt-2 first:pt-0 space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="font-semibold text-navy-800">
                                {ev.eventType} — بواسطة ({ev.actorType})
                              </span>
                              <span>{new Date(ev.createdAt).toLocaleString()}</span>
                            </div>
                            {ev.actionReason && (
                              <p className="text-[11px] text-navy-900 italic">
                                السبب: {ev.actionReason}
                              </p>
                            )}
                            {ev.previousContent && (
                              <div className="text-[10px] text-muted-foreground line-through">
                                النص السابق: {ev.previousContent}
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
    </div>
  );
}
