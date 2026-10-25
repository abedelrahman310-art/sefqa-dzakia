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

/** استخراج رسالة خطأ مفهومة من استجابة الخادم. */
export function extractApiMessage(error: unknown): string {
  if (isRecord(error)) {
    const response = error.response;
    if (isRecord(response)) {
      const data = response.data;
      if (isRecord(data)) {
        const detail = data.detail ?? data.error ?? data.message;
        if (typeof detail === 'string' && detail.trim() !== '') return detail;
      }
      if (typeof response.status === 'number') {
        if (response.status === 401) return 'انتهت صلاحية الجلسة. أعد تسجيل الدخول للمتابعة.';
        if (response.status === 403) {
          return 'هذه البيانات متاحة لحسابات الرقابة المركزية فقط (central_admin).';
        }
        if (response.status === 404) return 'خدمة البيانات المطلوبة غير متوفرة على الخادم.';
        return `تعذر تحميل البيانات من الخادم (رمز ${response.status}).`;
      }
    }
    if (typeof error.message === 'string' && error.message.trim() !== '') return error.message;
  }
  return 'تعذر تحميل البيانات من الخادم.';
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
  const { data } = await api.get<unknown>('/procurements/deals/');
  return extractList<ProcurementDealApi>(data, ['results', 'deals']);
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
