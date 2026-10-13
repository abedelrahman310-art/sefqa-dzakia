import { api } from "@/lib/api";
import type {
  OpeningSessionList,
  OpeningSessionDetail,
  OpeningEvent,
  ScheduleSessionPayload,
  OpenOfferPayload,
  EligibleTender,
  DealOfferSummary,
} from "../types";

export const openingApi = {
  listSessions: () =>
    api.get<OpeningSessionList[]>("/procurements/sessions/").then((r) => r.data),

  getSession: (id: string) =>
    api.get<OpeningSessionDetail>(`/procurements/sessions/${id}/`).then((r) => r.data),

  schedule: (payload: ScheduleSessionPayload) =>
    api
      .post<OpeningSessionDetail>("/procurements/sessions/schedule/", payload)
      .then((r) => r.data),

  start: (id: string) =>
    api
      .post<OpeningSessionDetail>(`/procurements/sessions/${id}/start/`)
      .then((r) => r.data),

  openOffer: (
    id: string,
    payload: OpenOfferPayload
  ) =>
    api
      .post<OpeningEvent>(`/procurements/sessions/${id}/open-offer/`, payload)
      .then((r) => r.data),

  end: (id: string) =>
    api
      .post<OpeningSessionDetail>(`/procurements/sessions/${id}/end/`)
      .then((r) => r.data),

  // إضافات مساعدة لإدارة الجلسة لدى المصلحة المتعاقدة
  listTenders: () =>
    api.get<EligibleTender[]>("/procurements/deals/").then((r) => r.data),

  listOffersForDeal: (dealId: string) =>
    api
      .get<DealOfferSummary[]>("/bids/offers/", { params: { deal: dealId } })
      .then((r) => r.data),

  listSessionOffers: (sessionId: string) =>
    api
      .get<DealOfferSummary[]>(`/procurements/sessions/${sessionId}/offers/`)
      .then((r) => r.data),
};
