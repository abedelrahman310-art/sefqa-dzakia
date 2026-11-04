import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';

/**
 * OrgLogo — يعرض شعار الجهة (المصلحة المتعاقدة أو مؤسسة المتعامل) في الشريط العلوي.
 *
 * الوسائط ليست عامة (تخدّم عبر نقاط نهاية محمية بالتوكن)، ولذا يجلب المكوّن بايتات
 * الشعار عبر عميل HTTP المصرّح (Bearer) ثم يعرضها كـ Object URL — لأن <img src>
 * لا يعمل مع مسارات ترفض الزيارات غير الموثقة. عند غياب الشعار (404) يظهر fallback.
 */

export const ORG_LOGO_UPDATED_EVENT = 'safaqat:org-logo-updated';

export type OrgLogoPortal = 'authority' | 'operator';

export function notifyOrgLogoUpdated(portal: OrgLogoPortal): void {
  window.dispatchEvent(new CustomEvent(ORG_LOGO_UPDATED_EVENT, { detail: { portal } }));
}

const ENDPOINTS = {
  authority: '/authority/settings/logo/',
  operator: '/operator/settings/logo/',
} as const;

interface OrgLogoProps {
  /** البوابة التي ينتمي إليها الشعار: مصلحة متعاقدة أم متعامل. */
  portal: OrgLogoPortal;
  /** يُعرض عند غياب الشعار (404) — أيقونة افتراضياً. */
  fallback?: ReactNode;
  /** تصفيف مخصص لصورة الشعار (الحجم/الحواف) — تظل دائماً object-cover. */
  className?: string;
  alt?: string;
}

export function OrgLogo({ portal, fallback = null, className, alt }: OrgLogoProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await api.get(ENDPOINTS[portal], { responseType: 'blob' });
        if (cancelled) {
          return;
        }
        // إلغاء الرابط القديم قبل استبداله لمنع تسريب الذاكرة
        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current);
        }
        const objectUrl = URL.createObjectURL(response.data as Blob);
        currentUrlRef.current = objectUrl;
        setUrl(objectUrl);
        setStatus('ready');
      } catch {
        if (cancelled) {
          return;
        }
        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current);
          currentUrlRef.current = null;
        }
        setUrl(null);
        setStatus('missing');
      }
    };

    void load();

    const onLogoUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ portal?: OrgLogoPortal }>).detail;
      if (!detail?.portal || detail.portal === portal) {
        void load();
      }
    };
    window.addEventListener(ORG_LOGO_UPDATED_EVENT, onLogoUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(ORG_LOGO_UPDATED_EVENT, onLogoUpdated);
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [portal]);

  if (status === 'loading' && !url) {
    // لا نرسم شيئاً أثناء الجلب الأولي لتفادي الوميض
    return null;
  }

  if (status === 'ready' && url) {
    return (
      <img
        src={url}
        alt={alt ?? ''}
        aria-hidden={alt ? undefined : 'true'}
        className={`max-w-none object-cover ${className ?? ''}`}
      />
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }
  return null;
}

export default OrgLogo;
