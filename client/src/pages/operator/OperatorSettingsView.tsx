import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLocation } from 'wouter';
import {
  Bell,
  User,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Save,
  Building2,
  Mail,
  BadgeCheck,
} from 'lucide-react';

interface NotificationPrefs {
  matchedDeals: boolean;
  openingSessions: boolean;
  evaluationResults: boolean;
  emailDigest: boolean;
}

const STORAGE_KEY = 'safaqat_operator_settings';

interface SwitchRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function SwitchRow({ title, description, checked, onChange }: SwitchRowProps) {
  return (
    <div className="op-switch-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={onChange}
        className={`op-switch${checked ? ' on' : ''}`}
      />
    </div>
  );
}

export function OperatorSettingsView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [savedMsg, setSavedMsg] = useState(false);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPrefs>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fall back to defaults
    }
    return {
      matchedDeals: true,
      openingSessions: true,
      evaluationResults: true,
      emailDigest: false,
    };
  });

  useEffect(() => {
    if (savedMsg) {
      const timer = setTimeout(() => setSavedMsg(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [savedMsg]);

  const handleToggle = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setSavedMsg(true);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const orgName = user?.organizationName || user?.displayName || 'المتعامل الاقتصادي';
  const email = user?.email || 'operator@safaqat.dz';

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <h1>{t('operator.settings.title')}</h1>
          <p>{t('operator.settings.subtitle')}</p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator/profile')}
          >
            <ExternalLink aria-hidden="true" />
            <span>ملف المؤسسة</span>
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="op-alert success" role="status">
          <CheckCircle aria-hidden="true" />
          <span>{t('operator.settings.saved_msg')}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-[18px]">
        <section className="op-card" aria-labelledby="account-info-title">
          <div className="op-card-head">
            <h2 id="account-info-title" className="flex items-center gap-2">
              <User className="size-5 text-[var(--op-gold)]" aria-hidden="true" />
              <span>{t('operator.settings.account_title')}</span>
            </h2>
          </div>
          <div className="op-card-body">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[var(--op-muted)]">
                  <Building2 className="size-3.5" aria-hidden="true" />
                  {t('operator.settings.org_name')}
                </span>
                <strong className="block truncate text-sm font-bold text-[var(--op-ink)]">{orgName}</strong>
              </div>

              <div className="rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[var(--op-muted)]">
                  <Mail className="size-3.5" aria-hidden="true" />
                  {t('operator.settings.email')}
                </span>
                <strong className="block truncate font-mono text-sm font-bold text-[var(--op-ink)]">{email}</strong>
              </div>

              <div className="rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4">
                <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[var(--op-muted)]">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  {t('operator.settings.role')}
                </span>
                <strong className="flex items-center gap-1.5 text-sm font-bold text-[var(--op-green-dark)]">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  <span>{t('operator.settings.role_val')}</span>
                </strong>
              </div>

              <div className="flex flex-col justify-between gap-2 rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-4">
                <span className="text-[11px] font-bold text-[var(--op-muted)]">ملف النشاط والتأهيل المصرح به</span>
                <button
                  type="button"
                  className="op-btn op-btn-ghost op-btn-sm self-start"
                  onClick={() => setLocation('/operator/profile')}
                >
                  <span>{t('operator.settings.profile_link')}</span>
                  <ExternalLink aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="op-card" aria-labelledby="notification-prefs-title">
          <div className="op-card-head">
            <div>
              <h2 id="notification-prefs-title" className="flex items-center gap-2">
                <Bell className="size-5 text-[var(--op-gold)]" aria-hidden="true" />
                <span>{t('operator.settings.notif_title')}</span>
              </h2>
              <p className="mt-1 text-xs text-[var(--op-muted)]">{t('operator.settings.notif_desc')}</p>
            </div>
          </div>
          <div className="op-card-body py-2">
            <SwitchRow
              title={t('operator.settings.notif_matched')}
              description="تلقي إشعار فوري عند نشر مصلحة متعاقدة لصفقة تتقاطع مع رموز نشاطك أو ولايتك."
              checked={prefs.matchedDeals}
              onChange={() => handleToggle('matchedDeals')}
            />
            <SwitchRow
              title={t('operator.settings.notif_opening')}
              description="إشعار عند انعقاد جلسة فتح أظرفة العروض وتوقيع محضر الفتح الخاص بالصفقات المشارك فيها."
              checked={prefs.openingSessions}
              onChange={() => handleToggle('openingSessions')}
            />
            <SwitchRow
              title={t('operator.settings.notif_eval')}
              description="تنبيه فوري عند صدور مقرر المنح المؤقت وإعلان نتائج التقييم الإداري والتقني والمالي."
              checked={prefs.evaluationResults}
              onChange={() => handleToggle('evaluationResults')}
            />
            <SwitchRow
              title={t('operator.settings.notif_email')}
              description="تلقي نشرة أسبوعية تتضمن ملخص الفرص والصفقات في قطاعك عبر البريد الإلكتروني."
              checked={prefs.emailDigest}
              onChange={() => handleToggle('emailDigest')}
            />
          </div>
        </section>

        <div className="op-action-bar">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => setLocation('/operator')}
          >
            إلغاء
          </button>
          <button type="submit" className="op-btn op-btn-gold" disabled={saving}>
            <Save aria-hidden="true" />
            <span>{saving ? 'جارٍ الحفظ...' : t('operator.settings.save_btn')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default OperatorSettingsView;
