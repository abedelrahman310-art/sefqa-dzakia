/**
 * إعدادات المنصة المركزية — الروابط العامة والتهيئة الموحدة
 * تُستخدم لتهيئة رابط المنصة الرئيسي لرمز الاستجابة السريعة QR ومشاركتها دون تكرار في الكود
 */
export const SITE_CONFIG = {
  name: 'صفقات ذكية',
  nameFr: 'Safaqat Dzakia',
  defaultUrl: 'https://safaqat-frontend.onrender.com',
  get url(): string {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const envUrl = import.meta.env.VITE_APP_URL || import.meta.env.VITE_SITE_URL;
      if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
        return envUrl.trim().replace(/\/$/, '');
      }
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return this.defaultUrl;
  },
} as const;

export function getPlatformSiteUrl(): string {
  return SITE_CONFIG.url;
}

export default SITE_CONFIG;
