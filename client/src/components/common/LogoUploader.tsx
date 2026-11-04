import { useRef, useState, type ChangeEvent } from 'react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { Upload, Trash2, ImagePlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { OrgLogo, notifyOrgLogoUpdated, type OrgLogoPortal } from './OrgLogo';

/**
 * LogoUploader — رفع/تغيير/حذف شعار الجهة في صفحة الإعدادات.
 * مسار المشاركة: POST + DELETE على /authority/settings/ أو /operator/settings/.
 * التحقق المحلي: الحجم ≤ 2 ميغابايت والصيغ PNG/JPG/SVG (الخادم يعيد التحقق).
 * كل عملية تُوثَّق خلفياً في AuditLog تلقائياً.
 */

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'];

const ENDPOINTS = {
  authority: '/authority/settings/',
  operator: '/operator/settings/',
} as const;

interface LogoUploaderProps {
  portal: OrgLogoPortal;
}

export function LogoUploader({ portal }: LogoUploaderProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleted, setDeleted] = useState(false);
  /** يتغير عند كل تعديل ليُعيد OrgLogo الجلب ويحدّث الشريط العلوي. */
  const [nonce, setNonce] = useState(0);

  const endpoint = ENDPOINTS[portal];

  const validateFile = (file: File): string | null => {
    const name = (file.name || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      return t('settings.logo.error_format');
    }
    if (file.size > MAX_SIZE_BYTES) {
      return t('settings.logo.error_size');
    }
    return null;
  };

  const handlePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // إعادة تهيئة الحقل حتى يسمح باختيار نفس الملف مجدداً بعد فشل
    event.target.value = '';
    setError(null);
    setSuccess(false);
    if (!file) {
      return;
    }
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setDeleted(false);
      setNonce((prev) => prev + 1);
      notifyOrgLogoUpdated(portal);
    } catch (err) {
      const detail = (
        err as { response?: { data?: { logo?: unknown; detail?: unknown } } }
      )?.response?.data;
      const message = Array.isArray(detail?.logo) && detail.logo.length
        ? String(detail.logo[0])
        : typeof detail?.logo === 'string'
          ? detail.logo
          : typeof detail?.detail === 'string'
            ? detail.detail
            : t('settings.logo.error_generic');
      setError(message);
      setSuccess(false);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setSuccess(false);
    setBusy(true);
    try {
      await api.delete(endpoint);
      setDeleted(true);
      setNonce((prev) => prev + 1);
      notifyOrgLogoUpdated(portal);
    } catch {
      setError(t('settings.logo.error_generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-[var(--op-line-2,#e2e8f0)] bg-[var(--op-surface-2,#f8fafc)] p-4"
      data-testid={`logo-uploader-${portal}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* مربع المعاينة */}
        <div className="relative size-[72px] shrink-0 rounded-xl border border-[var(--op-line-2,#e2e8f0)] bg-white shadow-xs overflow-hidden flex items-center justify-center">
          <OrgLogo
            key={nonce}
            portal={portal}
            className="size-full"
            fallback={
              <ImagePlus className="size-6 text-[var(--op-muted,#94a3b8)]" aria-hidden="true" />
            }
          />
        </div>

        {/* الأزرار والرسائل */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-xs text-[var(--op-muted,#64748b)]">{t('settings.logo.hint')}</p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              className="hidden"
              onChange={handlePick}
              aria-label={t('settings.logo.upload')}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold bg-[var(--op-ink,#0f172a)] text-white hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer border-0"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
              <span>{t('settings.logo.upload')}</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold bg-transparent border border-[var(--op-line-2,#e2e8f0)] text-[var(--op-danger,#dc2626)] hover:bg-red-50 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span>{t('settings.logo.delete')}</span>
            </button>
          </div>

          {success && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700" role="status">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              <span>{t('settings.logo.uploaded')}</span>
            </p>
          )}
          {deleted && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700" role="status">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              <span>{t('settings.logo.deleted')}</span>
            </p>
          )}
          {error && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-red-600" role="alert">
              <AlertCircle className="size-3.5" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LogoUploader;
