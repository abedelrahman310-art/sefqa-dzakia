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
      setPasswordError('يرجى إدخال كلمة المرور الحالية');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    setSavingPassword(true);
    try {
      // Simulates secure password update
      await new Promise((res) => setTimeout(res, 600));
      setPasswordSuccess('تم تحديث كلمة المرور بنجاح وفق معايير الأمان الوطنية.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('فشل تحديث كلمة المرور. يرجى المحاولة لاحقاً.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = () => {
    setGeneralSuccess('تم حفظ تفضيلات الإشعارات واللغة بنجاح.');
    setTimeout(() => setGeneralSuccess(''), 3000);
  };

  const orgName = user?.organizationName || user?.displayName || 'مديرية الصفقات العمومية';
  const orgEmail = user?.email || 'contact@safaqat.dz';
  const orgWilaya = 'الجزائر العاصمة (16)';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-navy-900 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-navy-100">
              صفقات ذكية · المصلحة المتعاقدة
            </span>
            <Badge variant="outline" className="text-[11px] bg-white/10 text-white border-white/20">
              الملف والضبط
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
            <span>حساب موثق رسمياً</span>
          </Badge>
        </div>
      </section>

      {generalSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{generalSuccess}</span>
        </div>
      )}

      {/* 1. المؤسسة (Read-only) */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>معلومات المؤسسة</span>
          </CardTitle>
          <CardDescription className="text-xs">
            البيانات الرسمية المعتمدة للمصلحة المتعاقدة (للتعديل يرجى الاتصال بالإدارة المركزية)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">اسم المؤسسة / الهيئة</label>
              <Input value={orgName} readOnly className="bg-muted text-foreground cursor-not-allowed text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">البريد الإلكتروني المؤسسي</label>
              <Input value={orgEmail} readOnly className="bg-muted text-foreground cursor-not-allowed text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">الولاية الإقليمية</label>
              <Input value={orgWilaya} readOnly className="bg-muted text-foreground cursor-not-allowed text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. الأمان: تغيير كلمة المرور */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span>الأمان وكلمة المرور</span>
          </CardTitle>
          <CardDescription className="text-xs">
            تحديث كلمة المرور لحماية حساب المصلحة وصلاحيات إدارة الصفقات
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
              <label className="text-xs font-semibold text-foreground">كلمة المرور الحالية</label>
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
                <label className="text-xs font-semibold text-foreground">كلمة المرور الجديدة</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8 أحرف كحد أدنى"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">تأكيد كلمة المرور الجديدة</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="إعادة إدخال كلمة المرور"
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
              <span>{savingPassword ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. الإشعارات واللغة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* قسم الإشعارات */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span>قنوات الإشعارات والتنبيهات</span>
            </CardTitle>
            <CardDescription className="text-xs">
              تحديد كيفية استلام التحديثات حول الصفقات وجلسات فتح الأظرفة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle 1: In-app */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">إشعارات داخل المنصة (In-App)</div>
                <div className="text-[11px] text-muted-foreground">تنبيهات فورية عند وصول عروض جديدة أو اقتراب موعد الجلسة</div>
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
                <div className="text-xs font-bold text-foreground">إشعارات البريد الإلكتروني (Email)</div>
                <div className="text-[11px] text-muted-foreground">ملخص دوري ورسائل فورية للمحاضر والقرارات المعتمدة</div>
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

        {/* قسم اللغة */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>لغة الواجهة (Langue)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              اختر لغة عرض الواجهة والتقارير في مساحة المصلحة المتعاقدة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              {/* Radio: العربية */}
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
                  <span className="text-xs">العربية (Algeria - RTL)</span>
                </div>
                <Badge variant={lang === 'ar' ? 'default' : 'outline'} className="text-[10px]">
                  الافتراضية
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
                  <span className="text-xs">Français (LTR)</span>
                </div>
                <Badge variant={lang === 'fr' ? 'default' : 'outline'} className="text-[10px]">
                  Officielle
                </Badge>
              </label>
            </div>

            <Button
              onClick={handleSavePreferences}
              size="sm"
              className="w-full text-xs gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ الإعدادات</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
