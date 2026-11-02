import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import i18n from '@/lib/i18n';

export const ACCESS_TOKEN_KEY = 'safaqat_access_token';
export const REFRESH_TOKEN_KEY = 'safaqat_refresh_token';
export const LEGACY_USER_KEY = 'safaqat_user';
export const AUTH_EXPIRED_EVENT = 'safaqat:auth-expired';
export const TOKEN_REFRESHED_EVENT = 'safaqat:token-refreshed';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const apiBaseUrl = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: apiBaseUrl,
});

/**
 * عميل منفصل لتجديد التوكن: لا يمر عبر اعتراضات api حتى لا يدخل في حلقة 401.
 */
const refreshClient = axios.create({
  baseURL: apiBaseUrl,
});

let refreshPromise: Promise<string | null> | null = null;
let sessionGeneration = 0;

export function clearAuthSession(): void {
  sessionGeneration += 1;
  refreshPromise = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

function notifySessionExpired(): void {
  clearAuthSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

/**
 * تجديد Access Token عبر Refresh Token مع توحيد الطلبات المتزامنة.
 * يعيد null إذا لم يوجد Refresh Token أو فشل التجديد.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refresh) {
    return null;
  }

  const generation = sessionGeneration;
  let request: Promise<string | null> | null = null;
  request = (async (): Promise<string | null> => {
    try {
      const { data } = await refreshClient.post<{ access?: string; refresh?: string }>(
        '/auth/token/refresh/',
        { refresh },
      );

      // إذا تم تسجيل الخروج أثناء التجديد، لا نعيد كتابة جلسة جديدة.
      if (generation !== sessionGeneration) {
        return null;
      }

      if (!data?.access) {
        throw new Error('Token refresh response missing access token');
      }

      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      if (data.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: { access: data.access } }),
        );
      }

      return data.access;
    } catch (error) {
      // لا نحذف الجلسة عند خطأ عابر (429/5xx/انقطاع الشبكة)؛ الحذف محصور
      // في رفض رمز التجديد نفسه (400/401/403) حتى لا يخرج المستخدم بسبب
      // ضغط مؤقت على الخادم.
      const status = (error as AxiosError | undefined)?.response?.status;
      const invalidRefresh = status === 400 || status === 401 || status === 403;
      if (invalidRefresh && generation === sessionGeneration) {
        notifySessionExpired();
      }
      return null;
    } finally {
      if (request && refreshPromise === request) {
        refreshPromise = null;
      }
    }
  })();

  const pending = request;
  if (!pending) {
    return null;
  }
  refreshPromise = pending;
  return pending;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? '';

    // مسارات المصادقة لا تدخل في دورة التجديد؛ خطأ كلمة المرور ليس جلسة منتهية.
    if (
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/token/refresh') ||
      requestUrl.includes('/auth/logout')
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      notifySessionExpired();
      return Promise.reject(error);
    }

    if (!localStorage.getItem(REFRESH_TOKEN_KEY)) {
      notifySessionExpired();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
      return Promise.reject(error);
    }

    // اعتراض الطلب يعيد إضافة ترويسة Authorization بالتوكن الجديد تلقائياً.
    return api(originalRequest);
  },
);

/**
 * استخراج رسالة خطأ عربية مفهومة من استجابة الخادم أو من خطأ الشبكة.
 * تُستعمل في الصفحات التي تعرض حالة خطأ حقيقية بدل بيانات بديلة.
 */
export function extractApiErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      response?: { status?: number; data?: { detail?: string; error?: string; message?: string } };
      message?: string;
    };
    const data = candidate.response?.data;
    const detail = data?.detail ?? data?.error ?? data?.message;
    if (typeof detail === 'string' && detail.trim() !== '') return detail;

    const status = candidate.response?.status;
    if (typeof status === 'number') {
      if (status === 401) return i18n.t('api.error.session_expired');
      if (status === 403) return i18n.t('api.error.forbidden');
      if (status === 404) return i18n.t('api.error.not_found');
      if (status >= 500) return i18n.t('api.error.server');
      return i18n.t('api.error.load_failed', { status });
    }

    if (typeof candidate.message === 'string' && candidate.message.trim() !== '') {
      return candidate.message;
    }
  }
  return i18n.t('api.error.network');
}
