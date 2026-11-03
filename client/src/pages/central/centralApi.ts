import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ProcurementDealApi } from '@/lib/procurementApiTypes';

/**
 * طبقة البيانات الخاصة ببوابة الإدارة المركزية (عين الصقر).
 *
 * كل الدوال هنا تقرأ من واجهات REST الفعلية في `backend/apps/reports/central_views.py`
 * و`backend/apps/contracts/views.py` و`backend/apps/audit/views.py`
 * و`backend/apps/bids/views.py`. لا توجد أي بيانات تجريبية في هذه الطبقة.
 */

// ─── التقارير الوطنية وأداء المصالح المتعاقدة ──────────────────────────────
// GET /api/central/reports/
export interface CentralNationalSummary {
  total_authorities: number;
  total_deals: number;
  total_volume_dzd: number;
  average_compliance_rate: number;
  average_transparency_rate: number;
}

export type CentralAuthorityStatus = 'excellent' | 'normal' | 'needs_support' | 'infractions';

export interface CentralAuthorityReport {
  id: string;
  name: string;
  email: string;
  wilaya: string;
  wilaya_code: string;
  deals_count: number;
  active_deals_count: number;
  completed_deals_count: number;
  delayed_deals_count: number;
  total_volume_dzd: number;
  /** نسبة الالتزام بالآجال القانونية (0-100) */
  compliance_rate: number;
  on_time_ratio: number;
  /** مؤشر الشفافية المركب (0-100) */
  transparency_rate: number;
  transparency_score: number;
  suspicions_count: number;
  status: CentralAuthorityStatus | string;
  ai_training_needed: boolean;
}

export interface CentralReportCatalogItem {
  id: string;
  title: string;
  type: string;
  period: string;
  wilaya_scope: string;
  generated_date: string;
  total_deals: number;
  total_volume_dzd: number;
  average_compliance_rate: number;
  average_transparency_rate: number;
  status: string;
}

export interface CentralReportsResponse {
  national_summary: CentralNationalSummary;
  authorities: CentralAuthorityReport[];
  reports: CentralReportCatalogItem[];
}

// ─── الطعون على الإسناد ────────────────────────────────────────────────────
// GET /api/objections/ (ObjectionListSerializer)
export interface CentralObjectionRow {
  id: string;
  reference: string;
  tender_reference: string;
  tender_title: string;
  objector_name: string;
  objection_type: string;
  grounds: string[];
  status: string;
  submitted_at: string | null;
  deadline_at: string | null;
  days_remaining: number | null;
  is_within_deadline: boolean | null;
  checksum?: string;
}

// ─── العروض (لقياس نسب الفوز والتركّز) ─────────────────────────────────────
// GET /api/bids/offers/ (OfferViewSet.list → { offers, results, count })
export interface CentralOfferRow {
  id: string;
  deal: string;
  operator: string;
  operatorName?: string;
  operator_name?: string;
  status: string;
  financial_amount: string | number | null;
  opportunityTitle?: string;
  opportunity_title?: string;
  submittedAt?: string | null;
  submission_timestamp?: string | null;
}

// ─── سجل التدقيق القانوني ───────────────────────────────────────────────────
// GET /api/audit/logs/ (AuditLogViewSet — central_admin يرى كل السجلات)
export interface CentralAuditLogRow {
  id: string;
  user: string | null;
  user_name?: string | null;
  user_email?: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  description: string;
  changes?: Record<string, unknown>;
  ip_address?: string | null;
  timestamp: string;
  checksum?: string;
}

// ─── أدوات مساعدة ──────────────────────────────────────────────────────────
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractList<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (isRecord(payload)) {
    for (const key of keys) {
      const value = payload[key];
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}

/** تحويل رقم قادم من DRF (number أو string عشري) إلى number آمن. */
export function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/** استخراج رسالة خطأ مفهومة من استجابة الخادم مع دعم اللغتين (ar/fr). */
export function extractApiMessage(error: unknown, fallbackMessage?: string): string {
  if (isRecord(error)) {
    const response = error.response;
    if (isRecord(response)) {
      const data = response.data;
      if (isRecord(data)) {
        const detail = data.detail ?? data.error ?? data.message;
        if (typeof detail === 'string' && detail.trim() !== '') return detail;
      }
      if (typeof response.status === 'number') {
        const isFr = typeof document !== 'undefined' && document.documentElement.lang === 'fr';
        if (response.status === 401) {
          return isFr
            ? 'Session expirée. Veuillez vous reconnecter.'
            : 'انتهت صلاحية الجلسة. أعد تسجيل الدخول للمتابعة.';
        }
        if (response.status === 403) {
          return isFr
            ? 'Ces données sont réservées aux comptes d’administration centrale (central_admin).'
            : 'هذه البيانات متاحة لحسابات الرقابة المركزية فقط (central_admin).';
        }
        if (response.status === 404) {
          return isFr
            ? 'Le service de données demandé n’est pas disponible sur le serveur.'
            : 'خدمة البيانات المطلوبة غير متوفرة على الخادم.';
        }
        return isFr
          ? `Impossible de charger les données du serveur (code ${response.status}).`
          : `تعذر تحميل البيانات من الخادم (رمز ${response.status}).`;
      }
    }
    if (typeof error.message === 'string' && error.message.trim() !== '') return error.message;
  }
  if (fallbackMessage) return fallbackMessage;
  const isFr = typeof document !== 'undefined' && document.documentElement.lang === 'fr';
  return isFr ? 'Impossible de charger les données du serveur.' : 'تعذر تحميل البيانات من الخادم.';
}

// ─── الطلبات ───────────────────────────────────────────────────────────────
export async function fetchCentralReports(): Promise<CentralReportsResponse> {
  const { data } = await api.get<Partial<CentralReportsResponse> | null>('/central/reports/');
  const summary = data?.national_summary ?? null;
  return {
    national_summary: {
      total_authorities: toNumber(summary?.total_authorities),
      total_deals: toNumber(summary?.total_deals),
      total_volume_dzd: toNumber(summary?.total_volume_dzd),
      average_compliance_rate: toNumber(summary?.average_compliance_rate),
      average_transparency_rate: toNumber(summary?.average_transparency_rate),
    },
    authorities: Array.isArray(data?.authorities) ? data.authorities : [],
    reports: Array.isArray(data?.reports) ? data.reports : [],
  };
}

export async function fetchNationalDeals(): Promise<ProcurementDealApi[]> {
  const { data } = await api.get<unknown>('/central/deals/');
  return extractList<ProcurementDealApi>(data, ['results', 'deals']);
}

export interface CentralRealAuthority {
  id: string;
  name: string;
  organization_name?: string;
  display_name?: string;
  email: string;
  phone_number?: string;
  wilaya: string;
  wilaya_code: string;
  wilaya_name_fr?: string;
  deals_count: number;
  active_deals_count: number;
  completed_deals_count: number;
  delayed_deals_count: number;
  total_volume_dzd: number;
  is_active: boolean;
  created_at?: string | null;
}

export interface CentralRealOperator {
  id: string;
  name: string;
  company_name?: string;
  display_name?: string;
  email: string;
  phone_number?: string;
  nif?: string;
  nis?: string;
  sector: string;
  sector_display: string;
  available_wilayas: string[];
  offers_count: number;
  wins_count: number;
  awarded_count: number;
  rejected_count: number;
  contracts_count: number;
  total_volume_dzd: number;
  is_active: boolean;
  created_at?: string | null;
}

export interface CentralRealDeal {
  id: string;
  reference_number: string;
  title: string;
  description: string;
  authority_id?: string | null;
  authority_name: string;
  wilaya: string;
  estimated_budget: number;
  current_stage: number;
  stage_display: string;
  submission_deadline?: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchCentralAuthorities(): Promise<CentralRealAuthority[]> {
  const { data } = await api.get<unknown>('/central/authorities/');
  return extractList<CentralRealAuthority>(data, ['authorities', 'results']);
}

export async function fetchCentralOperators(): Promise<CentralRealOperator[]> {
  const { data } = await api.get<unknown>('/central/operators/');
  return extractList<CentralRealOperator>(data, ['operators', 'results']);
}

export async function fetchCentralDeals(): Promise<CentralRealDeal[]> {
  const { data } = await api.get<unknown>('/central/deals/');
  return extractList<CentralRealDeal>(data, ['deals', 'results']);
}

export async function fetchCentralObjections(): Promise<CentralObjectionRow[]> {
  const { data } = await api.get<unknown>('/objections/');
  return extractList<CentralObjectionRow>(data, ['results', 'objections']);
}

export async function fetchCentralOffers(): Promise<CentralOfferRow[]> {
  const { data } = await api.get<unknown>('/bids/offers/');
  return extractList<CentralOfferRow>(data, ['offers', 'results']);
}

export async function fetchCentralAuditLogs(): Promise<CentralAuditLogRow[]> {
  const { data } = await api.get<unknown>('/audit/logs/');
  return extractList<CentralAuditLogRow>(data, ['results', 'logs']);
}

// ─── خطاف التحميل الموحّد ──────────────────────────────────────────────────
export interface CentralResource<T> {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

/**
 * تحميل مورد واحد من الخادم مع حالات التحميل والخطأ وإعادة المحاولة.
 * مرّر دالة تحميل ثابتة (المصدَّرة من هذا الملف) لتجنّب إعادة الطلب في كل تصيير.
 */
export function useCentralResource<T>(loader: () => Promise<T>): CentralResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    loader()
      .then((result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(extractApiMessage(err));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loader, reloadKey]);

  return {
    data,
    loading,
    error,
    reload: () => setReloadKey((current) => current + 1),
  };
}

// ─── القائمة السوداء للمتعاملين الاقتصاديين المقصيين ───────────────────────
// GET /api/central/excluded-operators/
export interface CentralExcludedOperator {
  id: string;
  operator_name: string;
  nif: string;
  reason: string;
  decision_reference: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExcludedOperatorPayload {
  operator_name: string;
  nif: string;
  reason: string;
  decision_reference: string;
  start_date: string;
  end_date?: string | null;
  is_active?: boolean;
}

export async function fetchCentralExcludedOperators(): Promise<CentralExcludedOperator[]> {
  const { data } = await api.get<unknown>('/central/excluded-operators/');
  return extractList<CentralExcludedOperator>(data, ['results', 'excluded_operators']);
}

export async function createCentralExcludedOperator(
  payload: CreateExcludedOperatorPayload,
): Promise<CentralExcludedOperator> {
  const { data } = await api.post<CentralExcludedOperator>('/central/excluded-operators/', payload);
  return data;
}

export async function deleteCentralExcludedOperator(id: string): Promise<void> {
  await api.delete(`/central/excluded-operators/${id}/`);
}

// ─── إدارة الحسابات والصلاحيات (Staff & Role Management) ──────────────────
export interface CentralStaffMember {
  id: string;
  email: string;
  full_name: string;
  role: 'inspector_general' | 'inspector' | 'analyst' | 'financial_auditor' | 'system_admin' | string;
  role_display: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login?: string | null;
  created_at?: string | null;
}

export interface CentralStaffInvitationRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  role_display: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked' | string;
  status_display: string;
  invited_by_name?: string | null;
  created_at: string;
  expires_at: string;
  is_valid: boolean;
  invite_url: string;
}

export interface CentralStaffResponse {
  can_manage: boolean;
  staff: CentralStaffMember[];
  invitations: CentralStaffInvitationRow[];
  total_staff: number;
  active_staff: number;
  pending_invitations: number;
}

export interface InviteStaffPayload {
  email: string;
  full_name: string;
  role: string;
}

export async function fetchCentralStaff(): Promise<CentralStaffResponse> {
  const { data } = await api.get<CentralStaffResponse>('/central/staff/');
  return data;
}

export async function inviteCentralStaff(payload: InviteStaffPayload): Promise<{
  message: string;
  invitation: CentralStaffInvitationRow;
}> {
  const { data } = await api.post('/central/staff/invite/', payload);
  return data;
}

export async function revokeToggleCentralStaff(
  id: string,
  isActive?: boolean
): Promise<{ message: string }> {
  const payload = isActive !== undefined ? { is_active: isActive } : {};
  const { data } = await api.patch(`/central/staff/${id}/revoke/`, payload);
  return data;
}


