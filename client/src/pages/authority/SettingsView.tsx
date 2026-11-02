import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Lock,
  Bell,
  Globe,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
} from 'lucide-react';

export function SettingsView() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();

  // Notification toggles
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Settings general save state
  const [generalSuccess, setGeneralSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError(t('authority.settings.pwd_err_curr'));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t('authority.settings.pwd_err_len'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('authority.settings.pwd_err_match'));
      return;
    }

    setSavingPassword(true);
    try {
      // Simulates secure password update
      await new Promise((res) => setTimeout(res, 600));
      setPasswordSuccess(t('authority.settings.pwd_success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError(t('authority.settings.pwd_err_fail'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = () => {
    setGeneralSuccess(t('authority.settings.pref_success'));
    setTimeout(() => setGeneralSuccess(''), 3000);
  };

  const orgName = user?.organizationName || user?.displayName || t('authority.topbar.default_org');
  const orgEmail = user?.email || 'contact@safaqat.dz';
  const orgWilaya = (user as any)?.wilaya ? `${(user as any).wilaya} - Alger` : '16 - Alger';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-navy-900 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-navy-100">
              {t('authority.topbar.brand_sub')}
            </span>
            <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
              {t('authority.settings.badge_profile')}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {t('authority.settings.title')}
          </h1>
          <p className="text-xs md:text-sm text-navy-100 max-w-2xl">
            {t('authority.settings.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-3 py-1 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('authority.settings.badge_verified')}</span>
          </Badge>
        </div>
      </section>

      {generalSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{generalSuccess}</span>
        </div>
      )}

      {/* 1. Organization info (Read-only) */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>{t('authority.settings.org_card_title')}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t('authority.settings.org_card_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t('authority.settings.org_name')}</label>
              <Input value={orgName} readOnly className="bg-muted text-foreground cursor-not-allowed text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t('authority.settings.org_email')}</label>
              <Input value={orgEmail} readOnly className="bg-muted text-foreground cursor-not-allowed text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t('authority.settings.org_wilaya')}</label>
              <Input value={orgWilaya} readOnly className="bg-muted text-foreground cursor-not-allowed text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Security: change password */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span>{t('authority.settings.sec_card_title')}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {t('authority.settings.sec_card_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
            {passwordError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">{t('authority.settings.pwd_curr')}</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t('authority.settings.pwd_new')}</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t('authority.settings.pwd_confirm')}</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={savingPassword}
              size="sm"
              className="text-xs gap-1.5"
            >
              <span>{savingPassword ? t('authority.settings.pwd_saving') : t('authority.settings.pwd_change_btn')}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Notifications and Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications Section */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span>{t('authority.settings.notifs_title')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('authority.settings.notifs_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle 1: In-app */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">{t('authority.settings.notifs_inapp')}</div>
                <div className="text-xs text-muted-foreground">{t('authority.settings.notifs_inapp_desc')}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={inAppNotifs}
                onClick={() => setInAppNotifs(!inAppNotifs)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary ${
                  inAppNotifs ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    inAppNotifs ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Email */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">{t('authority.settings.notifs_email')}</div>
                <div className="text-xs text-muted-foreground">{t('authority.settings.notifs_email_desc')}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailNotifs}
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary ${
                  emailNotifs ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailNotifs ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Language Section */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>{t('authority.settings.lang_title')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('authority.settings.lang_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              {/* Radio: Arabic */}
              <label
                onClick={() => setLang('ar')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  lang === 'ar'
                    ? 'border-primary bg-primary/5 text-foreground font-bold'
                    : 'border-border hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      lang === 'ar' ? 'border-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {lang === 'ar' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-xs">{t('authority.settings.lang_ar')}</span>
                </div>
                <Badge variant={lang === 'ar' ? 'default' : 'outline'} className="text-xs">
                  {t('authority.settings.lang_default')}
                </Badge>
              </label>

              {/* Radio: Français */}
              <label
                onClick={() => setLang('fr')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  lang === 'fr'
                    ? 'border-primary bg-primary/5 text-foreground font-bold'
                    : 'border-border hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      lang === 'fr' ? 'border-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {lang === 'fr' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-xs">{t('authority.settings.lang_fr')}</span>
                </div>
                <Badge variant={lang === 'fr' ? 'default' : 'outline'} className="text-xs">
                  {t('authority.settings.lang_official')}
                </Badge>
              </label>
            </div>

            <Button
              onClick={handleSavePreferences}
              size="sm"
              className="w-full text-xs gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t('authority.settings.save_btn')}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
