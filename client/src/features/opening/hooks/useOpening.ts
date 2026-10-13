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
    refetchInterval: 3000, // Polling كل 3 ثوان وفق المتطلبات
  });

export const useStartSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => openingApi.start(id),
    onSuccess: (_, id) => {
      toast.success("بدأت الجلسة بنجاح");
      qc.invalidateQueries({ queryKey: ["opening-session", id] });
      qc.invalidateQueries({ queryKey: ["opening-sessions"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "فشل بدء الجلسة";
      toast.error(msg);
    },
  });
};

export const useOpenOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OpenOfferPayload }) =>
      openingApi.openOffer(id, payload),
    onSuccess: (_, vars) => {
      toast.success("تم فتح العرض وإعلان السعر بنجاح");
      qc.invalidateQueries({ queryKey: ["opening-session", vars.id] });
      qc.invalidateQueries({ queryKey: ["opening-sessions"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "فشل تسجيل فتح العرض";
      toast.error(msg);
    },
  });
};

export const useEndSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => openingApi.end(id),
    onSuccess: (_, id) => {
      toast.success("انتهت الجلسة وتم توثيق الوقائع");
      qc.invalidateQueries({ queryKey: ["opening-session", id] });
      qc.invalidateQueries({ queryKey: ["opening-sessions"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "فشل إنهاء الجلسة";
      toast.error(msg);
    },
  });
};

export const useScheduleSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScheduleSessionPayload) => openingApi.schedule(payload),
    onSuccess: () => {
      toast.success("تمت برمجة جلسة فتح الأظرفة بنجاح");
      qc.invalidateQueries({ queryKey: ["opening-sessions"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "فشل برمجة الجلسة";
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

