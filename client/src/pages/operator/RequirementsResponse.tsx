import { useEffect, useState } from 'react';
import { useI18n, type TranslationKey } from '@/i18n';
import { useLocation, useParams } from 'wouter';
import {
  ArrowLeft,
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
  { value: 'compliant', labelKey: 'operator.req.compliant' },
  { value: 'partially_compliant', labelKey: 'operator.req.partial' },
  { value: 'non_compliant', labelKey: 'operator.req.non_compliant' },
  { value: 'not_applicable', labelKey: 'operator.req.not_applicable' },
] as const;

const CLAIM_TONE: Record<string, string> = {
  compliant: 'green',
  partially_compliant: 'gold',
  non_compliant: 'red',
  not_applicable: '',
};

const CLAIM_BUTTON: Record<string, string> = {
  compliant: 'op-btn-green',
  partially_compliant: 'op-btn-gold',
  non_compliant: 'op-btn-red',
  not_applicable: 'op-btn-slate',
};

const VERIFICATION_LABEL_KEYS: Record<string, TranslationKey> = {
  pending: 'operator.req.verif.pending',
  needs_review: 'operator.req.verif.needs_review',
  verified: 'operator.req.verif.verified',
  approved: 'operator.req.verif.approved',
  rejected: 'operator.req.verif.rejected',
};

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
      <div className="op-page" aria-label={t('operator.req.loading')}>
        <div className="op-card p-8">
          <div className="op-skeleton mb-4 h-8 w-2/3" />
          <div className="op-skeleton mb-3 h-4 w-1/3" />
          <div className="op-skeleton h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="op-page">
        <div className="op-alert error">
          <AlertTriangle aria-hidden="true" />
          <span>{error}</span>
        </div>
        <div>
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/deals')}
          >
            <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
            <span>{t('operator.req.back')}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!hasRequirements) {
    return (
      <div className="op-page">
        <div className="op-page-head">
          <div>
            <span className="op-chip gold mb-2">
              <ClipboardList aria-hidden="true" />
              <span>{t('operator.req.verified_cahier')}</span>
            </span>
            <h1>{t('operator.req.title')}</h1>
            <p>{t('operator.req.subtitle')}</p>
          </div>
          <div className="op-page-actions">
            <button
              type="button"
              className="op-btn op-btn-outline"
              onClick={() => setLocation(`/operator/opportunities/${oppId}`)}
            >
              <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
              <span>{t('operator.req.back')}</span>
            </button>
          </div>
        </div>

        <div className="op-big-empty">
          <div className="op-big-empty-icon">
            <ClipboardList aria-hidden="true" />
          </div>
          <h3>{t('operator.req.none_title')}</h3>
          <p>{t('operator.req.none_desc')}</p>
        </div>
      </div>
    );
  }

  const isOfferFrozen = offerStatus === 'submitted';

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="op-chip green">
              <ShieldCheck aria-hidden="true" />
              <span>{t('operator.req.verified_cahier')}</span>
            </span>
            {cahierVersion?.frozenDigest && (
              <span className="op-chip op-mono">
                SHA-256: {cahierVersion.frozenDigest.slice(0, 16)}...
              </span>
            )}
          </div>
          <h1>{t('operator.req.title')}</h1>
          <p>{t('operator.req.subtitle')}</p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation(`/operator/opportunities/${oppId}`)}
          >
            <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
            <span>{t('operator.req.back')}</span>
          </button>
        </div>
      </div>

      <div className="op-grid-3">
        <div className="op-kpi">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="op-kpi-label">{t('operator.req.total')}</div>
              <div className="op-kpi-value">{totalCount}</div>
            </div>
            <div className="op-kpi-icon gold">
              <ClipboardList aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="op-kpi">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="op-kpi-label">{t('operator.req.answered')}</div>
              <div className="op-kpi-value">
                {answeredCount} {t('common.of')} {totalCount}
              </div>
            </div>
            <div className="op-kpi-icon green">
              <FileCheck aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="op-kpi">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="op-kpi-label">{t('operator.req.disqualifying')}</div>
              <div
                className={`mt-1 text-lg font-extrabold ${
                  disqualifyingUnanswered > 0
                    ? 'text-[var(--op-red)]'
                    : 'text-[var(--op-green-dark)]'
                }`}
              >
                {disqualifyingUnanswered > 0
                  ? `${disqualifyingUnanswered} ${t('operator.req.remaining')}`
                  : t('operator.req.all_covered')}
              </div>
            </div>
            <div
              className={`op-kpi-icon ${
                disqualifyingUnanswered > 0 ? 'rose' : 'green'
              }`}
            >
              {disqualifyingUnanswered > 0 ? (
                <AlertTriangle aria-hidden="true" />
              ) : (
                <CheckCircle2 aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </div>

      {!offerId && (
        <div className="op-alert warning">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong className="mb-1 block text-sm font-bold">{t('operator.req.no_offer')}</strong>
            <p>{t('operator.req.no_offer_desc')}</p>
            <button
              type="button"
              className="op-btn op-btn-gold op-btn-sm mt-3"
              onClick={() => setLocation(`/operator/opportunities/${oppId}/offer`)}
            >
              {t('operator.req.create_offer')}
            </button>
          </div>
        </div>
      )}

      {isOfferFrozen && (
        <div className="op-alert">
          <Info aria-hidden="true" />
          <span>{t('operator.req.frozen_notice')}</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {requirements.map((req) => {
          const isEditing = editingReqId === req.id;
          const resp = req.operatorResponse;
          const tone = resp ? CLAIM_TONE[resp.complianceClaim] || '' : '';

          return (
            <section key={req.id} className="op-card space-y-3 p-5">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="op-mono rounded-md bg-[var(--op-ink)] px-2 py-0.5 text-xs font-extrabold text-white">
                    {req.requirementCode}
                  </span>
                  <span className="text-xs font-semibold text-[var(--op-ink)]">
                    {req.positionReference}
                  </span>
                  {req.isDisqualifying && (
                    <span className="op-chip red">
                      <AlertTriangle aria-hidden="true" />
                      <span>{t('operator.req.disqualifying_badge')}</span>
                    </span>
                  )}
                </div>

                {resp ? (
                  <span className={`op-chip ${tone}`}>
                    {t(`operator.req.${resp.complianceClaim}` as any)}
                  </span>
                ) : (
                  <span className="op-chip">{t('operator.req.unanswered')}</span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-[var(--op-text)]">{req.description}</p>

              {resp && !isEditing && (
                <div className="space-y-1 rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] p-3 text-xs">
                  {resp.evidenceLocation && (
                    <div>
                      <span className="text-[var(--op-muted)]">
                        {t('operator.req.evidence_loc')}:{' '}
                      </span>
                      <span className="font-semibold text-[var(--op-ink)]">
                        {resp.evidenceLocation}
                      </span>
                    </div>
                  )}
                  {resp.operatorNotes && (
                    <div>
                      <span className="text-[var(--op-muted)]">
                        {t('operator.req.notes_label')}:{' '}
                      </span>
                      <span className="text-[var(--op-text)]">{resp.operatorNotes}</span>
                    </div>
                  )}
                  <div className="text-[var(--op-muted)]">
                    {t('operator.req.verification')}:{' '}
                    {VERIFICATION_LABEL_KEYS[resp.verificationState] ? t(VERIFICATION_LABEL_KEYS[resp.verificationState]) : resp.verificationState}
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-3 border-t border-[var(--op-line)] pt-4">
                  <div className="flex flex-wrap gap-2">
                    {COMPLIANCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditClaim(opt.value)}
                        className={`op-btn op-btn-sm ${
                          editClaim === opt.value
                            ? CLAIM_BUTTON[opt.value] || 'op-btn-outline'
                            : 'op-btn-outline'
                        }`}
                      >
                        {t(opt.labelKey as any)}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="op-input"
                    placeholder={t('operator.req.evidence_ph')}
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />

                  <input
                    type="text"
                    className="op-input"
                    placeholder={t('operator.req.notes_ph')}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="op-btn op-btn-outline op-btn-sm"
                      disabled={saving}
                      onClick={() => setEditingReqId(null)}
                    >
                      {t('drafts.btn.cancel')}
                    </button>
                    <button
                      type="button"
                      className="op-btn op-btn-gold op-btn-sm"
                      disabled={saving}
                      onClick={() => handleSave(req.id)}
                    >
                      {saving ? t('operator.req.saving') : t('operator.req.save')}
                    </button>
                  </div>
                </div>
              ) : (
                !isOfferFrozen &&
                offerId && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="op-btn op-btn-ghost op-btn-sm"
                      onClick={() => handleStartEdit(req)}
                    >
                      {resp ? t('operator.req.update') : t('operator.req.respond')}
                    </button>
                  </div>
                )
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
