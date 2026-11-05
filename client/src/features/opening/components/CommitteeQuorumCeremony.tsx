import React from "react";
import { useI18n } from "@/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  KeyRound,
  CheckCircle2,
  Lock,
  Unlock,
} from "lucide-react";
import { useSubmitKeyShare } from "../hooks/useOpening";
import type { OpeningSessionDetail } from "../types";

interface Props {
  session: OpeningSessionDetail;
}

export function CommitteeQuorumCeremony({ session }: Props) {
  const { t, dir, lang } = useI18n();
  const isAr = lang === 'ar';

  // عدم عرض مراسم التشفير التعددي إذا كانت غير مفعلة للجلسة ولم يتم إنشاء حصص لها
  if (session.require_committee_ceremony === false && (!session.committee_shares || session.committee_shares.length === 0)) {
    return null;
  }
  const submitKeyShareMutation = useSubmitKeyShare();

  const isUnlocked =
    session.ceremony_status === "unlocked" || session.quorum_reached;
  const k = session.threshold_k || 2;
  const n = session.threshold_n || 3;
  const shares = session.committee_shares && session.committee_shares.length > 0 ? session.committee_shares : [
    {
      id: "president",
      member_name: session.authority_name || (isAr ? "رئيس المصلحة المتعاقدة" : "Président du service contractant"),
      member_role: "president",
      role_display: isAr ? "رئيس المصلحة المتعاقدة (رئيس اللجنة)" : "Président du service contractant (Président)",
      share_index: 1,
      is_submitted: Boolean(isUnlocked),
      submitted_at: null,
    },
    {
      id: "finance_rep",
      member_name: isAr ? "أمين الخزينة / ممثل المصلحة المالية" : "Trésorier / Représentant financier",
      member_role: "finance_rep",
      role_display: isAr ? "ممثل المصلحة المالية والمحاسبة" : "Représentant du service financier",
      share_index: 2,
      is_submitted: Boolean(isUnlocked),
      submitted_at: null,
    },
    {
      id: "technical_rep",
      member_name: isAr ? "الخبير التقني المختص" : "Expert technique qualifié",
      member_role: "technical_rep",
      role_display: isAr ? "ممثل المصلحة التقنية المختصة" : "Représentant du service technique",
      share_index: 3,
      is_submitted: false,
      submitted_at: null,
    },
  ];

  const submittedCount = shares.filter((s) => s.is_submitted).length;

  const handleSubmitShare = async (role: string) => {
    if (!session?.id) return;
    try {
      await submitKeyShareMutation.mutateAsync({
        sessionId: session.id,
        memberRole: role,
      });
    } catch {
      // Toast handles error
    }
  };

  return (
    <Card
      className={`border transition-all shadow-sm ${
        isUnlocked
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-white to-white dark:from-emerald-950/20 dark:to-slate-900"
          : "border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-white to-white dark:from-amber-950/20 dark:to-slate-900"
      }`}
    >
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold text-navy-900 dark:text-slate-100 flex items-center gap-2">
              <KeyRound
                className={`w-4 h-4 ${
                  isUnlocked ? "text-emerald-600" : "text-amber-600"
                }`}
              />
              <span>
                {isAr ? "لجنة فتح الأظرفة ومراسم فك الختم التعددي (Shamir Threshold Ceremony)" : "Commission d’ouverture des plis et protocole de déverrouillage (Cérémonie de Shamir)"}
              </span>
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {isAr ? `المادة 70 من القانون 23-12 والمادتان 70-71 من المرسوم الرئاسي 15-247: لا تفتح الأظرفة إلا باكتمال النصاب القانوني (حضور وعتبة ${k} من ${n} أعضاء).` : `Art. 70 de la loi 23-12 et art. 70-71 du décret 15-247 : ouverture des plis conditionnée au quorum réglementaire (${k} sur ${n} membres requis).`}
            </CardDescription>
          </div>

          <Badge
            className={`text-xs px-3 py-1 font-bold ${
              isUnlocked
                ? "bg-emerald-600 text-white"
                : "bg-amber-600 text-white animate-pulse"
            }`}
          >
            {isUnlocked ? (
              <span className="flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5" />
                <span>{isAr ? "النصاب مكتمل (الأظرفة مفكوكة)" : "Quorum atteint (Plis déverrouillés)"}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isAr ? `النصاب مطلوب: ${submittedCount} / ${k} حصص` : `Quorum requis : ${submittedCount} / ${k} parts`}
                </span>
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Quorum Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{isAr ? "تقدم النصاب القانوني للجنة:" : "Progression du quorum de la commission :"}</span>
            <span className="font-mono">
              {isAr ? `${submittedCount} من ${k} حصص معتمدة (الإجمالي: ${n})` : `${submittedCount} sur ${k} parts validées (Total : ${n})`}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isUnlocked ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{
                width: `${Math.min(100, (submittedCount / k) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Committee Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {shares.map((share, idx) => (
            <div
              key={share.id || idx}
              className={`p-3 rounded-xl border flex flex-col justify-between gap-3 ${
                share.is_submitted
                  ? "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20"
                  : "border-slate-200 bg-white dark:bg-slate-900 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {isAr ? `عضو #${share.share_index}` : `Membre #${share.share_index}`}
                  </span>
                  {share.is_submitted ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] px-1.5 py-0">
                      <CheckCircle2 className="w-3 h-3 me-0.5" />
                      {isAr ? "مؤكد" : "Confirmé"}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-amber-700 border-amber-300 bg-amber-50 text-[10px] px-1.5 py-0"
                    >
                      {isAr ? "بانتظار التأكيد" : "En attente"}
                    </Badge>
                  )}
                </div>
                <div className="font-bold text-xs text-navy-900 dark:text-slate-100 line-clamp-1">
                  {share.member_name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {share.role_display || share.member_role}
                </div>
              </div>

              {!share.is_submitted ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={submitKeyShareMutation.isPending}
                  onClick={() => handleSubmitShare(share.member_role)}
                  className="w-full text-xs font-bold gap-1.5 border-amber-500/40 hover:bg-amber-50 text-amber-900 dark:text-amber-200 h-8 rounded-lg"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAr ? "تقديم الحصة وتأكيد الحضور" : "Valider la part et confirmer la présence"}</span>
                </Button>
              ) : (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? "تم الختم التعددي بالحصة الرقمية" : "Part numérique scellée"}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
