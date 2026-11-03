import { useI18n } from "@/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { openingApi } from "../api/opening";
import type { OpenOfferPayload, ScheduleSessionPayload } from "../types";
import { toast } from "sonner";

export const useOpeningSessions = () =>
  useQuery({
    queryKey: ["opening-sessions"],
    queryFn: openingApi.listSessions,
    refetchInterval: 10000,
  });

export const useOpeningSession = (id: string | null) =>
  useQuery({
    queryKey: ["opening-session", id],
    queryFn: () => openingApi.getSession(id!),
    enabled: !!id,
    refetchInterval: 3000, // Polling every 3s as required
  });

export const useStartSession = () => {
  const { t } = useI18n();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => openingApi.start(id),
    onSuccess: (_, id) => {
      toast.success(t("opening.toast_session_started"));
      qc.invalidateQueries({ queryKey: ["opening-session", id] });
      qc.invalidateQueries({ queryKey: ["opening-sessions"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || t("opening.toast_session_start_failed");
      toast.error(msg);
    },
  });
};

export const useOpenOffer = () => {
  const { t } = useI18n();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OpenOfferPayload }) =>
      openingApi.openOffer(id, payload),
    onSuccess: (_, vars) => {
      toast.success(t("opening.toast_offer_opened"));
      qc.invalidateQueries({ queryKey: ["opening-session", vars.id] });
      qc.invalidateQueries({ queryKey: ["opening-sessions"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || t("opening.toast_offer_open_failed");
      toast.error(msg);
    },
  });
};

export const useEndSession = () => {
  const { t } = useI18n();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => openingApi.end(id),
    onSuccess: (_, id) => {
      toast.success(t("opening.toast_session_ended"));
      qc.invalidateQueries({ queryKey: ["opening-session", id] });
      qc.invalidateQueries({ queryKey: ["opening-sessions"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || t("opening.toast_session_end_failed");
      toast.error(msg);
    },
  });
};

export const useScheduleSession = () => {
  const { t } = useI18n();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScheduleSessionPayload) => openingApi.schedule(payload),
    onSuccess: () => {
      toast.success(t("opening.toast_session_scheduled"));
      qc.invalidateQueries({ queryKey: ["opening-sessions"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || t("opening.toast_session_schedule_failed");
      toast.error(msg);
    },
  });
};

export const useSubmitKeyShare = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      memberRole,
    }: {
      sessionId: string;
      memberRole: string;
    }) => openingApi.submitKeyShare(sessionId, memberRole),
    onSuccess: (data, vars) => {
      toast.success(data.message || "تم تسجيل حضور وتقديم حصة العضو بنجاح");
      qc.invalidateQueries({ queryKey: ["opening-session", vars.sessionId] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "فشل تقديم حصة عضو اللجنة";
      toast.error(msg);
    },
  });
};

export const useEligibleTenders = () =>
  useQuery({
    queryKey: ["eligible-tenders"],
    queryFn: openingApi.listTenders,
  });

export const useDealOffers = (dealId?: string) =>
  useQuery({
    queryKey: ["tender-offers", dealId],
    queryFn: () => openingApi.listOffersForDeal(dealId!),
    enabled: !!dealId,
  });

export const useTenderOffers = (tenderId?: string) =>
  useQuery({
    queryKey: ["tender-offers", tenderId],
    queryFn: () => openingApi.listOffersForDeal(tenderId!),
    enabled: !!tenderId,
  });

export const useSessionOffers = (sessionId?: string) =>
  useQuery({
    queryKey: ["session-offers", sessionId],
    queryFn: () => openingApi.listSessionOffers(sessionId!),
    enabled: !!sessionId,
  });

export const useOpenEnvelope = () => {
  const { t } = useI18n();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { offer_id: string; envelope_type: string; notes?: string };
    }) => openingApi.openEnvelope(id, payload),
    onSuccess: (data, vars) => {
      const typeLabel =
        vars.payload.envelope_type.includes("financial")
          ? t("opening.envelope_financial")
          : t("opening.envelope_technical");
      toast.success(t("opening.toast_envelope_opened", { type: typeLabel }));
      qc.invalidateQueries({ queryKey: ["opening-session", vars.id] });
      qc.invalidateQueries({ queryKey: ["opening-events", vars.id] });
      qc.invalidateQueries({ queryKey: ["opening-sessions"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || t("opening.toast_envelope_failed");
      toast.error(msg);
    },
  });
};

export const useSessionEvents = (sessionId?: string) =>
  useQuery({
    queryKey: ["opening-events", sessionId],
    queryFn: () => openingApi.getEvents(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 4000,
  });
