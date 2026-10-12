import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  FileCheck,
  Info,
} from 'lucide-react';

interface CahierVersionSummary {
  id: string;
  versionNumber: number;
  status: string;
  frozenDigest: string | null;
}

interface OperatorResponse {
  id: string;
  complianceClaim: string;
  evidenceDocId: string | null;
  evidenceLocation: string | null;
  verificationState: string;
  operatorNotes: string | null;
}

interface Requirement {
  id: string;
  clauseId: string;
  requirementCode: string;
  requirementType: string;
  positionReference: string;
  description: string;
  isDisqualifying: boolean;
  operatorResponse: OperatorResponse | null;
}

const COMPLIANCE_OPTIONS = [
  { value: 'compliant', labelKey: 'operator.req.compliant', color: 'emerald' },
  { value: 'partially_compliant', labelKey: 'operator.req.partial', color: 'amber' },
  { value: 'non_compliant', labelKey: 'operator.req.non_compliant', color: 'red' },
  { value: 'not_applicable', labelKey: 'operator.req.na', color: 'gray' },
] as const;

export function RequirementsResponse() {
  const { oppId } = useParams<{ oppId: string }>();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRequirements, setHasRequirements] = useState(false);
  const [cahierVersion, setCahierVersion] = useState<CahierVersionSummary | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  // Per-requirement editing state
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [editClaim, setEditClaim] = useState<string>('compliant');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // We need the operator's offerId — fetch from /api/offers
  const [offerId, setOfferId] = useState<string | null>(null);
  const [offerStatus, setOfferStatus] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get requirements for this opportunity
      const reqRes = await fetch(`/api/sanad/opportunities/${oppId}/requirements`);
      if (!reqRes.ok) throw new Error('Failed to load requirements');
      const reqData = await reqRes.json();

      setHasRequirements(reqData.hasRequirements);
      setCahierVersion(reqData.cahierVersion || null);
      setRequirements(reqData.requirements || []);

      // 2. Get the operator's offer for this opportunity
      const offersRes = await fetch('/api/offers');
      if (offersRes.ok) {
        const offersData = await offersRes.json();
        const found = offersData.offers?.find((o: any) => o.opportunityId === oppId);
        if (found) {
          setOfferId(found.id);
          setOfferStatus(found.status);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [oppId]);

  const handleStartEdit = (req: Requirement) => {
    setEditingReqId(req.id);
    setEditClaim(req.operatorResponse?.complianceClaim || 'compliant');
    setEditLocation(req.operatorResponse?.evidenceLocation || '');
    setEditNotes(req.operatorResponse?.operatorNotes || '');
  };

  const handleSave = async (reqId: string) => {
    if (!offerId) {
      alert(t('operator.req.no_offer'));
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/sanad/offers/${offerId}/requirements/${reqId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
        body: JSON.stringify({
          complianceClaim: editClaim,
          evidenceLocation: editLocation || null,
          operatorNotes: editNotes || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save');
      }
      setEditingReqId(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const answeredCount = requirements.filter((r) => r.operatorResponse != null).length;
  const totalCount = requirements.length;
  const disqualifyingUnanswered = requirements.filter(
    (r) => r.isDisqualifying && r.operatorResponse == null
  ).length;

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">{t('operator.req.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 text-center space-y-3">
        <p className="font-bold text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={() => setLocation('/operator/deals')}>
          {t('operator.req.back')}
        </Button>
      </div>
    );
  }

  if (!hasRequirements) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/operator/opportunities/${oppId}`)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-navy-900"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          <span>{t('operator.req.back')}</span>
        </Button>
        <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-4 shadow-sm">
          <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">{t('operator.req.none_title')}</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {t('operator.req.none_desc')}
          </p>
        </div>
      </div>
    );
  }

  const isOfferFrozen = offerStatus === 'submitted';

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/operator/opportunities/${oppId}`)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy-900 ps-0"
        >
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{t('operator.req.back')}</span>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-xs font-semibold text-navy-900">
          {t('operator.req.title')}
        </span>
      </div>

      {/* Header Banner */}
      <section className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-navy-900 to-navy-700 text-white shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-emerald-300">{t('operator.req.verified_cahier')}</span>
          {cahierVersion?.frozenDigest && (
            <span className="font-mono text-[10px] text-navy-200 bg-navy-800 px-2 py-0.5 rounded">
              SHA-256: {cahierVersion.frozenDigest.slice(0, 16)}...
            </span>
          )}
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold">{t('operator.req.title')}</h1>
        <p className="text-xs text-navy-100 leading-relaxed max-w-2xl">
          {t('operator.req.subtitle')}
        </p>
      </section>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('operator.req.total')}</div>
            <div className="text-lg font-extrabold text-navy-900">{totalCount}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('operator.req.answered')}</div>
            <div className="text-lg font-extrabold text-emerald-800">
              {answeredCount} / {totalCount}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              disqualifyingUnanswered > 0
                ? 'bg-destructive/10 text-destructive'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {disqualifyingUnanswered > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('operator.req.disqualifying')}</div>
            <div
              className={`text-lg font-extrabold ${
                disqualifyingUnanswered > 0 ? 'text-destructive' : 'text-emerald-700'
              }`}
            >
              {disqualifyingUnanswered > 0
                ? `${disqualifyingUnanswered} ${t('operator.req.remaining')}`
                : t('operator.req.all_covered')}
            </div>
          </div>
        </div>
      </div>

      {/* No Offer Warning */}
      {!offerId && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-amber-900 block">{t('operator.req.no_offer')}</strong>
            <p className="text-amber-800">{t('operator.req.no_offer_desc')}</p>
            <Button
              size="sm"
              className="bg-navy-900 hover:bg-navy-800 text-white text-xs mt-2"
              onClick={() => setLocation(`/operator/opportunities/${oppId}/offer`)}
            >
              {t('operator.req.create_offer')}
            </Button>
          </div>
        </div>
      )}

      {/* Frozen Offer Notice */}
      {isOfferFrozen && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{t('operator.req.frozen_notice')}</span>
        </div>
      )}

      {/* Requirements List */}
      <div className="space-y-3">
        {requirements.map((req) => {
          const isEditing = editingReqId === req.id;
          const resp = req.operatorResponse;

          return (
            <div
              key={req.id}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-navy-900 text-white">
                    {req.requirementCode}
                  </span>
                  <span className="text-xs font-semibold text-navy-800">
                    {req.positionReference}
                  </span>
                  {req.isDisqualifying && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                      {t('operator.req.disqualifying_badge')}
                    </span>
                  )}
                </div>

                {/* Current Status Badge */}
                {resp ? (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      resp.complianceClaim === 'compliant'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : resp.complianceClaim === 'partially_compliant'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : resp.complianceClaim === 'non_compliant'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {t(`operator.req.${resp.complianceClaim}` as any)}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border">
                    {t('operator.req.unanswered')}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-foreground/80 leading-relaxed">{req.description}</p>

              {/* Existing Response Summary (when not editing) */}
              {resp && !isEditing && (
                <div className="text-[11px] bg-muted/30 p-3 rounded-xl border border-border/60 space-y-1">
                  {resp.evidenceLocation && (
                    <div>
                      <span className="text-muted-foreground">{t('operator.req.evidence_loc')}: </span>
                      <span className="font-semibold text-navy-900">{resp.evidenceLocation}</span>
                    </div>
                  )}
                  {resp.operatorNotes && (
                    <div>
                      <span className="text-muted-foreground">{t('operator.req.notes_label')}: </span>
                      <span className="text-navy-800">{resp.operatorNotes}</span>
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    {t('operator.req.verification')}: {resp.verificationState}
                  </div>
                </div>
              )}

              {/* Edit Form */}
              {isEditing ? (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  {/* Compliance Selection */}
                  <div className="flex flex-wrap gap-2">
                    {COMPLIANCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditClaim(opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          editClaim === opt.value
                            ? opt.color === 'emerald'
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : opt.color === 'amber'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : opt.color === 'red'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-gray-600 text-white border-gray-600'
                            : 'bg-card text-muted-foreground border-border hover:bg-muted/70'
                        }`}
                      >
                        {t(opt.labelKey as any)}
                      </button>
                    ))}
                  </div>

                  {/* Evidence Location */}
                  <Input
                    placeholder={t('operator.req.evidence_ph')}
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="text-xs rounded-xl h-9"
                  />

                  {/* Notes */}
                  <Input
                    placeholder={t('operator.req.notes_ph')}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="text-xs rounded-xl h-9"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => setEditingReqId(null)}
                      className="text-xs rounded-xl"
                    >
                      {t('drafts.btn.cancel')}
                    </Button>
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => handleSave(req.id)}
                      className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl"
                    >
                      {saving ? t('operator.req.saving') : t('operator.req.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                !isOfferFrozen &&
                offerId && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(req)}
                      className="text-xs text-navy-700 hover:text-navy-900 hover:bg-navy-50"
                    >
                      {resp ? t('operator.req.update') : t('operator.req.respond')}
                    </Button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
