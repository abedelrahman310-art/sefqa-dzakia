import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Bell,
  User,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface NotificationPrefs {
  matchedDeals: boolean;
  openingSessions: boolean;
  evaluationResults: boolean;
  emailDigest: boolean;
}

const STORAGE_KEY = 'safaqat_operator_settings';

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
      // fallback
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/operator')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-navy-900 ps-0"
        >
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{t('operator.req.back')}</span>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-xs font-semibold text-navy-900">
          {t('operator.settings.title')}
        </span>
      </div>

      {/* Header Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <Settings className="w-4 h-4 text-gold-400" />
          <span className="font-bold text-gold-300">
            {t('nav.operator.settings')} — منصة صفقات
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          {t('operator.settings.title')}
        </h1>
        <p className="text-xs md:text-sm text-navy-100 max-w-2xl leading-relaxed">
          {t('operator.settings.subtitle')}
        </p>
      </section>

      {/* Success Notification */}
      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-none" />
          <span>{t('operator.settings.saved_msg')}</span>
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Info Card */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <User className="w-5 h-5 text-navy-800" />
            <h2 className="text-base font-bold text-navy-900">
              {t('operator.settings.account_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/30 border border-border rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-muted-foreground block">
                {t('operator.settings.org_name')}
              </span>
              <strong className="text-sm font-bold text-navy-900 block truncate">
                {orgName}
              </strong>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-muted-foreground block">
                {t('operator.settings.email')}
              </span>
              <strong className="text-sm font-bold text-navy-900 block font-mono">
                {email}
              </strong>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-muted-foreground block">
                {t('operator.settings.role')}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t('operator.settings.role_val')}</span>
              </div>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-3.5 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted-foreground block">
                ملف النشاط والتأهيل المصرح به
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold gap-1.5 self-start rounded-xl border-border hover:bg-muted text-navy-900"
                onClick={() => setLocation('/operator/profile')}
              >
                <span>{t('operator.settings.profile_link')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Notifications Card */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Bell className="w-5 h-5 text-navy-800" />
            <div>
              <h2 className="text-base font-bold text-navy-900">
                {t('operator.settings.notif_title')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('operator.settings.notif_desc')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Matched Deals Toggle */}
            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-background hover:bg-muted/20 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-navy-900 block">
                  {t('operator.settings.notif_matched')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  تلقي إشعار فوري عند نشر مصلحة متعاقدة لصفقة تتقاطع مع رموز نشاطك أو ولايتك.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.matchedDeals}
                onChange={() => handleToggle('matchedDeals')}
                className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary mt-1"
              />
            </label>

            {/* Opening Sessions Toggle */}
            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-background hover:bg-muted/20 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-navy-900 block">
                  {t('operator.settings.notif_opening')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  إشعار عند انعقاد جلسة فتح أظرفة العروض وتوقيع محضر الفتح الخاص بالصفقات المشارك فيها.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.openingSessions}
                onChange={() => handleToggle('openingSessions')}
                className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary mt-1"
              />
            </label>

            {/* Evaluation Results Toggle */}
            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-background hover:bg-muted/20 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-navy-900 block">
                  {t('operator.settings.notif_eval')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  تنبيه فوري عند صدور مقرر المنح المؤقت وإعلان نتائج التقييم الإداري والتقني والمالي.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.evaluationResults}
                onChange={() => handleToggle('evaluationResults')}
                className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary mt-1"
              />
            </label>

            {/* Email Digest Toggle */}
            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-background hover:bg-muted/20 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-navy-900 block">
                  {t('operator.settings.notif_email')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  تلقي نشرة أسبوعية تتضمن ملخص الفرص والصفقات في قطاعك عبر البريد الإلكتروني.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.emailDigest}
                onChange={() => handleToggle('emailDigest')}
                className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary mt-1"
              />
            </label>
          </div>
        </section>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs px-6 py-2 rounded-xl shadow-sm"
          >
            {saving ? '...' : t('operator.settings.save_btn')}
          </Button>
        </div>
      </form>
    </div>
  );
}
