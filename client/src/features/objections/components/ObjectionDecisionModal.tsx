import { useI18n } from "@/i18n";
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Gavel,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { objectionsApi } from '../api/objections';
import type { ObjectionListItem } from '../types';

interface ObjectionDecisionModalProps {
  objection: ObjectionListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ObjectionDecisionModal({
  objection,
  open,
  onOpenChange,
  onSuccess,
}: ObjectionDecisionModalProps) {
  const { t, lang, dir } = useI18n();
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('rejected');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!objection) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reason.trim().length < 10) {
      toast.error(t('objections.decision_err_rationale_short'));
      return;
    }

    setSubmitting(true);
    try {
      await objectionsApi.decide(objection.id, {
        decision,
        reason: reason.trim(),
      });
      toast.success(
        decision === 'accepted'
          ? t('objections.decision_toast_accepted')
          : t('objections.decision_toast_rejected')
      );
      setReason('');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.detail || t('objections.decision_toast_error');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg font-sans text-start">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-emerald-700" />
              <span>{t('objections.decision_modal_title', { ref: objection.reference })}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              {t('objections.decision_deal_sub', { deal: objection.tender_reference, objector: objection.objector_name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            {/* Decision selector */}
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-2 block">
                {t("objections.decision_content_label")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision('accepted')}
                  className={`p-3 rounded-xl border text-start transition-all flex items-start gap-2 ${
                    decision === 'accepted'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs">{t("objections.decision_accept_title")}</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      {t("objections.decision_accept_desc")}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('rejected')}
                  className={`p-3 rounded-xl border text-start transition-all flex items-start gap-2 ${
                    decision === 'rejected'
                      ? 'border-rose-600 bg-rose-50/70 text-rose-950 ring-1 ring-rose-600 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs">{t("objections.decision_reject_title")}</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      {t("objections.decision_reject_desc")}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Justification Textarea */}
            <div>
              <Label htmlFor="decision-reason" className="text-xs font-bold text-slate-700 mb-1.5 block">
                {t("objections.decision_rationale_label")}
              </Label>
              <Textarea
                id="decision-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("objections.decision_rationale_placeholder")}
                className="text-xs"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>{t("objections.decision_sha_notice")}</span>
                <span className={reason.trim().length < 10 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                  {reason.trim().length}/10 {t("objections.characters_count")}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between border-t border-slate-200 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || reason.trim().length < 10}
              className={
                decision === 'accepted'
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white font-bold'
                  : 'bg-rose-800 hover:bg-rose-900 text-white font-bold'
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin me-1.5" />
                  {t("objections.decision_btn_saving")}
                </>
              ) : (
                t('objections.decision_btn_submit')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
