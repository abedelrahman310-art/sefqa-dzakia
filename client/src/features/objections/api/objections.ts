import { api } from '@/lib/api';
import type {
  ObjectionListItem,
  ObjectionDetailItem,
  CreateObjectionPayload,
  DecideObjectionPayload,
} from '../types';

export const objectionsApi = {
  list: () =>
    api.get<ObjectionListItem[]>('/contracts/objections/').then((r) => r.data),

  get: (id: string) =>
    api.get<ObjectionDetailItem>(`/contracts/objections/${id}/`).then((r) => r.data),

  create: (payload: CreateObjectionPayload) =>
    api.post<ObjectionDetailItem>('/contracts/objections/', payload).then((r) => r.data),

  startReview: (id: string) =>
    api.post<ObjectionDetailItem>(`/contracts/objections/${id}/start_review/`).then((r) => r.data),

  decide: (id: string, payload: DecideObjectionPayload) =>
    api.post<ObjectionDetailItem>(`/contracts/objections/${id}/decide/`, payload).then((r) => r.data),

  withdraw: (id: string) =>
    api.post<ObjectionDetailItem>(`/contracts/objections/${id}/withdraw/`).then((r) => r.data),

  listEligibleDeals: () =>
    api.get<any[]>('/procurements/deals/').then((r) => r.data),
};
