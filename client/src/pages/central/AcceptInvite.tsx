import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import Logo from '@/components/ui/Logo';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AcceptInviteProps {
  token?: string;
}

export function AcceptInvite({ token: propToken }: AcceptInviteProps) {
  const { lang, dir, t } = useI18n();
  const [, setLocation] = useLocation();

  // Extract token from prop or pathname
  const token = propToken || window.location.pathname.split('/').pop() || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState<{
    valid: boolean;
    email: string;
    full_name: string;
    role: string;
    role_display: string;
    expires_at: string;
  } | null>(null);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title =
      lang === 'ar'
        ? 'تفعيل حساب موظف الإدارة المركزية — صفقات ذكية'
        : 'Activation du compte agent central — Safaqat Dhakia';

    if (!token) {
      setError(
        lang === 'ar'
          ? 'رمز الدعوة مفقود أو غير مكتمل.'
          : 'Jeton d’invitation manquant ou incomplet.'
      );
      setLoading(false);
      return;
    }

    api
      .get(`/central/staff/accept-invite/${token}/`)
      .then((res) => {
        setInviteData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        const detail =
          err.response?.data?.error ||
          (lang === 'ar'
            ? 'رابط الدعوة غير صالح أو منتهي الصلاحية.'
            : 'Lien d’invitation non valide ou expiré.');
        setError(detail);
        setLoading(false);
      });
  }, [token, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!password) {
      setSubmitError(
        lang === 'ar' ? 'يرجى إدخال كلمة المرور.' : 'Veuillez saisir un mot de passe.'
      );
      return;
    }

    if (password.length < 8) {
      setSubmitError(
        lang === 'ar'
          ? 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.'
          : 'Le mot de passe doit comporter au moins 8 caractères.'
      );
      return;
    }

    if (password !== passwordConfirm) {
      setSubmitError(
        lang === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Les mots de passe ne correspondent pas.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/central/staff/accept-invite/${token}/`, {
        password,
        password_confirm: passwordConfirm,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        (lang === 'ar'
          ? 'تعذر تفعيل الحساب، يرجى المحاولة لاحقاً.'
          : 'Échec de l’activation du compte.');
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div
      dir={dir}
      lang={lang}
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 selection:bg-amber-500 selection:text-black"
    >
      {/* خلفية تكنولوجية سيادية رقيقة */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* بطاقة التفعيل المركزية */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
        
        {/* ترويسة الهوية الوطنية */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-800">
          <div className="p-2 rounded-2xl bg-white shadow-md inline-flex items-center justify-center">
            <Logo size={42} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-400 text-xs font-bold mb-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {lang === 'ar'
                  ? 'الجمهورية الجزائرية الديمقراطية الشعبية'
                  : 'République Algérienne Démocratique et Populaire'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {lang === 'ar' ? 'بوابة الإدارة المركزية والرقابة (عين الصقر)' : 'Portail de Contrôle Central (Œil du Faucon)'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'ar' ? 'تفعيل حساب موظف رسمي وفق أحكام القانون 23-12' : 'Activation de compte officiel (Loi 23-12)'}
            </p>
          </div>
        </div>

        {/* 1. حالة التحميل */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="size-10 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              {lang === 'ar' ? 'جاري التحقق من رمز الدعوة...' : 'Vérification du jeton d’invitation...'}
            </p>
          </div>
        )}

        {/* 2. حالة الخطأ أو انتهاء الصلاحية */}
        {!loading && error && (
          <div className="py-8 space-y-6">
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 flex items-start gap-3">
              <AlertTriangle className="size-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-300">
                  {lang === 'ar' ? 'تعذر إتمام عملية التفعيل' : 'Impossible de finaliser l’activation'}
                </h4>
                <p className="text-xs leading-relaxed text-rose-200/90">{error}</p>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setLocation('/login')}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold gap-2"
              >
                <BackIcon className="size-4" />
                <span>{lang === 'ar' ? 'العودة لصفحة تسجيل الدخول' : 'Retour à la connexion'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* 3. حالة النجاح التام */}
        {!loading && success && (
          <div className="py-8 text-center space-y-6">
            <div className="size-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/30">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                {lang === 'ar' ? 'تم تفعيل حسابكم بنجاح!' : 'Votre compte a été activé avec succès !'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'تم تسجيل حسابكم وتعيين صلاحياتكم الرقابية في المنظومة الوطنية للصفقات العمومية. يمكنك الآن تسجيل الدخول مباشرة لممارسة مهامك.'
                  : 'Votre compte officiel a été activé. Vous pouvez dès maintenant vous connecter au portail central.'}
              </p>
            </div>

            <Button
              onClick={() => setLocation('/login')}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
            >
              {lang === 'ar' ? 'تسجيل الدخول إلى فضاء العمل' : 'Se connecter au portail'}
            </Button>
          </div>
        )}

        {/* 4. نموذج إدخال كلمة المرور وتأكيد الحساب */}
        {!loading && !error && !success && inviteData && (
          <form onSubmit={handleSubmit} className="pt-6 space-y-5">
            
            {/* بطاقة معلومات الموظف */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{lang === 'ar' ? 'الموظف المدعو:' : 'Collaborateur :'}</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-emerald-400" />
                  {inviteData.full_name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{lang === 'ar' ? 'البريد الرسمي:' : 'Email officiel :'}</span>
                <span className="font-mono text-slate-300">{inviteData.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
                <span className="text-slate-400">{lang === 'ar' ? 'الدور الوظيفي:' : 'Rôle attribué :'}</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {inviteData.role_display}
                </span>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
                {submitError}
              </div>
            )}

            {/* حقل كلمة المرور */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-200">
                {lang === 'ar' ? 'كلمة المرور الرسمية الجديدة' : 'Nouveau mot de passe'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-amber-500 pe-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-white"
                  aria-label={showPassword ? (lang === 'ar' ? 'إخفاء كلمة المرور' : 'Masquer le mot de passe') : (lang === 'ar' ? 'إظهار كلمة المرور' : 'Afficher le mot de passe')}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* حقل تأكيد كلمة المرور */}
            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm" className="text-xs font-semibold text-slate-200">
                {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
              </Label>
              <Input
                id="passwordConfirm"
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••••••"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                required
              />
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <p className="font-semibold text-slate-300">
                {lang === 'ar' ? 'معايير الأمان الإلزامية:' : 'Critères de sécurité obligatoires :'}
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                <li>{lang === 'ar' ? '8 أحرف على الأقل.' : '8 caractères au minimum.'}</li>
                <li>{lang === 'ar' ? 'مزيج من الحروف والأرقام والرموز.' : 'Mélange de lettres, chiffres et symboles.'}</li>
                <li>{lang === 'ar' ? 'ليست كلمة شائعة أو متطابقة مع البريد الإلكتروني.' : 'Non identique à l’adresse email.'}</li>
              </ul>
            </div>

            {/* زر التفعيل */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'ar' ? 'جاري التحقق والتفعيل...' : 'Activation en cours...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="size-4" />
                  <span>{lang === 'ar' ? 'تفعيل الحساب وتأكيد الانضمام' : 'Activer le compte et confirmer'}</span>
                </div>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* شريط الإحداثيات السيادية للتذييل */}
      <div className="mt-8 text-center text-xs text-slate-500 font-mono">
        36.7538° N, 3.0588° E — ALGIERS, DZ · SOVEREIGN CENTRAL RADAR · LOI 23-12
      </div>
    </div>
  );
}

export default AcceptInvite;
