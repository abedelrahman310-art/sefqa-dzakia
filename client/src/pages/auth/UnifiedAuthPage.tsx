import React, { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, Redirect } from 'wouter';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Logo } from '@/components/ui/Logo';
import { REGISTRY_69W, getCommunesForWilaya } from '@safaqat/shared/territorial';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Coins,
  Eye,
  EyeOff,
  Globe,
  Landmark,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  X,
} from 'lucide-react';

export type AuthMode = 'login' | 'operator' | 'authority';

interface UnifiedAuthPageProps {
  initialMode?: AuthMode;
}

const FIELD_NAMES = [
  'fullName',
  'organization',
  'email',
  'phone',
  'password',
  'confirmPassword',
  'wilaya',
  'commune',
] as const;

type FieldName = (typeof FIELD_NAMES)[number];

/** علم الجزائر المصغّر للشارة الرسمية */
const AlgeriaFlag = () => (
  <svg viewBox="0 0 20 14" className="h-3 w-5 shrink-0 rounded-[2px] ring-1 ring-black/10" aria-hidden="true">
    <rect width="10" height="14" fill="#006233" />
    <rect x="10" width="10" height="14" fill="#ffffff" />
    <circle cx="10" cy="7" r="3.4" fill="none" stroke="#d21034" strokeWidth="1.4" />
  </svg>
);

export function UnifiedAuthPage({ initialMode = 'login' }: UnifiedAuthPageProps) {
  const { lang, dir, setLang, t } = useI18n();
  const [location, setLocation] = useLocation();
  const { login, user, status } = useAuth();

  // 1. تحديد النمط الحالي
  const [mode, setMode] = useState<AuthMode>(() => {
    if (location.includes('/register/authority')) return 'authority';
    if (location.includes('/register/operator') || location.includes('/register')) return 'operator';
    return initialMode;
  });

  // مزامنة النمط عند تغير المسار
  useEffect(() => {
    if (location.includes('/register/authority')) {
      setMode('authority');
    } else if (location.includes('/register/operator') || location.includes('/register')) {
      setMode('operator');
    } else if (location === '/login') {
      setMode('login');
    }
  }, [location]);

  // التبديل وتحديث شريط العنوان دون إعادة تحميل كاملة
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setServerError(null);
    if (newMode === 'login') {
      window.history.replaceState(null, '', '/login');
    } else if (newMode === 'operator') {
      window.history.replaceState(null, '', '/register/operator');
    } else if (newMode === 'authority') {
      window.history.replaceState(null, '', '/register/authority');
    }
  };

  // حالة تسجيل الدخول
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // حالة إنشاء الحساب
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // الحالة العامة
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // قوائم الولايات والبلديات
  const [isWilayaOpen, setIsWilayaOpen] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState('');
  const [isCommuneOpen, setIsCommuneOpen] = useState(false);
  const wilayaCellRef = useRef<HTMLDivElement | null>(null);
  const communeCellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (wilayaCellRef.current && !wilayaCellRef.current.contains(event.target as Node)) {
        setIsWilayaOpen(false);
      }
      if (communeCellRef.current && !communeCellRef.current.contains(event.target as Node)) {
        setIsCommuneOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const wilayaUnits = useMemo(() => REGISTRY_69W.units, []);

  const filteredWilayas = useMemo(() => {
    if (!wilayaSearch.trim()) return wilayaUnits;
    const q = wilayaSearch.toLowerCase().trim();
    return wilayaUnits.filter(
      (unit) =>
        unit.code.includes(q) ||
        unit.nameAr.includes(q) ||
        unit.nameFr.toLowerCase().includes(q)
    );
  }, [wilayaSearch, wilayaUnits]);

  const selectedWilayaUnit = useMemo(
    () => wilayaUnits.find((unit) => unit.code === wilaya) ?? null,
    [wilaya, wilayaUnits]
  );

  const availableCommunes = useMemo(() => getCommunesForWilaya(wilaya), [wilaya]);

  // الحسابات التجريبية السريعة
  const isDemoLoginEnabled =
    import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' ||
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

  const fillTestAccount = (testEmail: string) => {
    setLoginEmail(testEmail);
    setLoginPassword('Safaqat@2026');
    setServerError(null);
  };

  // إعادة التوجيه الفوري عند تسجيل الدخول مسبقاً
  if (status === 'authenticated' && user) {
    if (user.role === 'operator') return <Redirect to="/operator" />;
    if (user.role === 'authority') return <Redirect to="/authority" />;
    if (user.role === 'central_admin') return <Redirect to="/central" />;
  }

  // نصوص متغيرة بحسب الدور
  const orgLabel =
    mode === 'operator'
      ? t('register.neumorphic.org_operator') || 'اسم الشركة أو المؤسسة'
      : t('register.neumorphic.org_authority') || 'اسم الهيئة أو المصلحة';

  const orgPlaceholder =
    mode === 'operator'
      ? t('register.neumorphic.org_placeholder_operator') || 'مؤسسة الأشغال العامة SARL'
      : t('register.neumorphic.org_placeholder_authority') || 'مديرية التجهيزات العمومية';

  // التحقق من الحقول
  const valueError = (name: FieldName): string | null => {
    switch (name) {
      case 'fullName':
        return fullName.trim().length < 2 ? t('register.neumorphic.err_full_name') || 'الاسم الكامل مطلوب' : null;
      case 'organization':
        return organization.trim().length < 2 ? `${orgLabel} مطلوب.` : null;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(regEmail.trim())
          ? null
          : t('register.neumorphic.err_email') || 'يرجى إدخال بريد إلكتروني صحيح.';
      case 'phone': {
        const clean = phone.replace(/[\s.-]/g, '');
        return /^(0[5-7]\d{8}|0[1-4]\d{7}|0\d{8,9})$/.test(clean) || /^[5-7]\d{8}$/.test(clean)
          ? null
          : t('register.neumorphic.err_phone') || 'رقم هاتف صحيح مطلوب (مثال: 0512345678).';
      }
      case 'password':
        return regPassword.length < 8 ? t('register.neumorphic.err_password') || 'كلمة المرور 8 محارف على الأقل.' : null;
      case 'confirmPassword':
        if (!confirmPassword) return t('register.neumorphic.err_confirm_required') || 'يرجى تأكيد كلمة المرور.';
        return regPassword === confirmPassword ? null : t('register.neumorphic.err_password_mismatch') || 'كلمتا المرور غير متطابقتين.';
      case 'wilaya':
        return wilaya ? null : t('register.neumorphic.err_wilaya') || 'يرجى اختيار الولاية.';
      case 'commune':
        return commune.trim() ? null : t('register.neumorphic.err_commune') || 'يرجى اختيار البلدية.';
      default:
        return null;
    }
  };

  const fieldError = (name: FieldName): string | null => (touched[name] ? valueError(name) : null);

  const markTouched = (name: FieldName) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const FieldError = ({ name }: { name: FieldName }) => {
    const message = fieldError(name);
    if (!message) return null;
    return (
      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600 animate-in fade-in-50">
        <AlertCircle className="size-3 shrink-0 text-rose-500" aria-hidden="true" />
        <span>{message}</span>
      </p>
    );
  };

  // معالجة تسجيل الدخول
  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
      });

      let data: any = {};
      const responseText = await res.text();
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { error: responseText };
        }
      }

      if (!res.ok) {
        const errorMsg =
          data.error ||
          data.detail ||
          (data.non_field_errors && data.non_field_errors[0]) ||
          (data.email && Array.isArray(data.email) ? data.email[0] : null) ||
          (data.password && Array.isArray(data.password) ? data.password[0] : null) ||
          (res.status === 502 || res.status === 504
            ? t('login.server_connection_error') || 'تعذر الاتصال بالخادم.'
            : t('login.error') || 'فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.');
        throw new Error(errorMsg);
      }

      login(data.user, { access: data.access, refresh: data.refresh });
      if (data.user.role === 'operator') setLocation('/operator');
      else if (data.user.role === 'authority') setLocation('/authority');
      else if (data.user.role === 'central_admin') setLocation('/central');
    } catch (err: any) {
      setServerError(err.message || t('login.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // معالجة إنشاء الحساب
  const handleRegisterSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);
    setTouched(
      Object.fromEntries(FIELD_NAMES.map((name) => [name, true])) as Record<FieldName, boolean>
    );

    if (FIELD_NAMES.some((name) => valueError(name) !== null)) {
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    const addressParts = [commune.trim(), selectedWilayaUnit?.nameAr ?? ''].filter(Boolean);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: mode === 'authority' ? 'authority' : 'operator',
          fullName: fullName.trim(),
          name: fullName.trim(),
          company: organization.trim(),
          email: regEmail.trim().toLowerCase(),
          phone: cleanPhone,
          password: regPassword,
          wilaya,
          commune: commune.trim(),
          municipality: commune.trim(),
          address: addressParts.join(' - '),
          repRole: mode === 'operator' ? 'المفوض قانوناً' : 'الآمر بالصرف أو المفوض عنه',
        }),
      });

      const data: Record<string, unknown> = await response.json();
      if (!response.ok) {
        let message = (data.error as string) || (data.detail as string);
        if (!message && typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          const value = data[firstKey];
          message = Array.isArray(value) ? value.join(' ') : String(value);
        }
        setServerError(message || t('register.neumorphic.err_server') || 'فشل التسجيل.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      login(
        data.user as Parameters<typeof login>[0],
        {
          access: data.access as string,
          refresh: data.refresh as string,
        },
      );
      setTimeout(() => {
        setLocation(mode === 'operator' ? '/operator' : '/authority');
      }, 1000);
    } catch {
      setServerError(t('register.neumorphic.err_network') || 'تعذر الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRtl = dir === 'rtl';

  return (
    <div
      className="relative min-h-[100dvh] lg:h-screen lg:max-h-screen lg:overflow-hidden w-full bg-gradient-to-br from-slate-50 via-sky-50/25 to-emerald-50/30 font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-white flex flex-col justify-between overflow-y-auto lg:overflow-y-hidden"
      dir={dir}
    >
      {/* ═══ Antigravity Motion Keyframes & Classes ═══ */}
      <style>{`
        @keyframes antigravity-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes antigravity-float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(2deg);
          }
        }
        @keyframes antigravity-float-reverse {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(12px) rotate(-2deg);
          }
        }
        .animate-antigravity-float {
          animation: antigravity-float 4.5s ease-in-out infinite;
        }
        .animate-antigravity-float-slow {
          animation: antigravity-float-slow 10s ease-in-out infinite;
        }
        .animate-antigravity-float-reverse {
          animation: antigravity-float-reverse 9s ease-in-out infinite;
        }
      `}</style>

      {/* ═══ Floating Ambient Blur Orbs ═══ */}
      <div
        className="pointer-events-none fixed -top-40 -start-40 size-[28rem] rounded-full bg-gradient-to-tr from-emerald-400/15 to-teal-500/15 blur-3xl animate-antigravity-float-slow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-40 -end-40 size-[28rem] rounded-full bg-gradient-to-tr from-[#0f3154]/15 to-sky-600/15 blur-3xl animate-antigravity-float-reverse"
        aria-hidden="true"
      />

      {/* ═══ Floating Top Navigation Bar ═══ */}
      <header className="relative z-30 mx-auto w-full max-w-7xl shrink-0 px-4 pt-2 sm:px-6 lg:pt-3">
        <div className="flex items-center justify-between rounded-xl border border-white/80 bg-white/75 px-4 py-1.5 shadow-xs backdrop-blur-xl">
          {/* زر العودة للصفحة الرئيسية */}
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 transition-colors hover:text-emerald-700"
          >
            {isRtl ? (
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            ) : (
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            )}
            <span>{t('register.redesign.back_home') || 'الصفحة الرئيسية'}</span>
          </Link>

          {/* مؤشر الحالة الرسمي واللغة */}
          <div className="flex items-center gap-2.5">
            {/* حالة المنصة */}
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs backdrop-blur-md sm:flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              <span>{t('register.neumorphic.system_status') || 'الربط السيادي نشط'}</span>
            </div>

            {/* محول اللغة */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs backdrop-blur-md transition-all hover:bg-white hover:text-emerald-700"
              aria-label="تبديل اللغة / Changer de langue"
            >
              <Globe className="size-3 text-slate-500" aria-hidden="true" />
              <span>{lang === 'ar' ? 'Français' : 'العربية'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Main Content Grid (Zero Scroll on Desktop) ═══ */}
      <main className="relative z-20 mx-auto w-full max-w-7xl flex-1 px-4 py-2 sm:px-6 lg:px-8 lg:py-2 flex items-center justify-center min-h-0">
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12 w-full max-h-full">
          
          {/* ══════════════════════════════════════════════════════════════════════
              العمود 1: الواجهة السيادية الطافية (5 أعمدة)
              ══════════════════════════════════════════════════════════════════════ */}
          <aside
            className={`hidden lg:col-span-5 lg:flex lg:flex-col justify-between rounded-2xl border border-white/80 bg-gradient-to-b from-white/80 to-white/50 p-4 shadow-sm backdrop-blur-2xl ${
              isRtl ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            <div>
              {/* الرأس المؤسسي */}
              <div className="text-center">
                <span className="inline-block rounded-full border border-slate-200/60 bg-slate-100/60 px-3 py-0.5 text-[10px] font-bold text-slate-600">
                  الجمهورية الجزائرية الديمقراطية الشعبية
                </span>

                {/* الشعار الوطني البارز الفاخر (حجم 96px) */}
                <div className="relative my-3 flex justify-center">
                  <div className="absolute inset-0 mx-auto size-28 rounded-full bg-emerald-400/20 blur-2xl" />
                  <div className="relative animate-antigravity-float">
                    <Logo size={96} className="drop-shadow-md" />
                  </div>
                </div>

                <h1 className="text-xl font-bold tracking-tight text-[#0f3154]">
                  {t('register.neumorphic.brand_name') || 'صفقات ذكية'}
                </h1>
                <p className="mt-0.5 text-xs font-semibold text-slate-600">
                  {t('register.neumorphic.brand_tagline') || 'البوابة الوطنية الموحدة للصفقات العمومية'}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500 font-medium">
                  منظومة رقمية وطنية موحدة وفق أحكام القانون 23-12 والمرسوم 15-247
                </p>
              </div>

              {/* بطاقات الميزات الثلاث المدمجة */}
              <div className="mt-3 space-y-2">
                {/* 1. صفر ورقة */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/90 bg-white/70 p-2 shadow-2xs backdrop-blur-md">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      مبدأ «صفر ورقة» الرقمي بالكامل
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                      إيداع وتشفير AES-256 رقمي بالكامل دون الحاجة لأي أظرفة ورقية
                    </p>
                  </div>
                </div>

                {/* 2. الربط البيني الآلي */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/90 bg-white/70 p-2 shadow-2xs backdrop-blur-md">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20">
                    <Coins className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      الربط البيني للدولة (Inter-opérabilité)
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                      تحقق تلقائي من السجل التجاري وNIF والضرائب دون طلب وثائق ورقية
                    </p>
                  </div>
                </div>

                {/* 3. الذكاء الاصطناعي السيادي */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/90 bg-white/70 p-2 shadow-2xs backdrop-blur-md">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/20">
                    <Sparkles className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      المطابقة والذكاء الاصطناعي السيادي
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                      مطابقة دقيقة لدفاتر الشروط واقتراح الفرص الأنسب لنشاطك
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* شارة التغطية الوطنية */}
            <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/70 bg-slate-50/70 py-1.5 px-2.5 text-center text-[10px] font-bold text-slate-600">
              <AlgeriaFlag />
              <span>تغطية وطنية موحدة لكافة ولايات الجزائر الـ 69 والبلديات الـ 1,541</span>
            </div>
          </aside>

          {/* ══════════════════════════════════════════════════════════════════════
              العمود 2: مساحة المصادقة الزجاجية الموحدة (7 أعمدة)
              ══════════════════════════════════════════════════════════════════════ */}
          <div
            className={`lg:col-span-7 flex flex-col justify-between rounded-2xl border border-white/90 bg-white/90 p-4 sm:p-5 shadow-lg backdrop-blur-2xl ${
              isRtl ? 'lg:order-1' : 'lg:order-2'
            }`}
          >
            <div>
              {/* الرأس الداخلي المدمج */}
              <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0f3154] to-emerald-600 text-white shadow-xs">
                    {mode === 'login' ? (
                      <LogIn className="size-4 text-emerald-100" aria-hidden="true" />
                    ) : (
                      <UserPlus className="size-4 text-emerald-100" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#0f3154]">
                      {mode === 'login'
                        ? lang === 'fr'
                          ? 'Connexion à votre espace'
                          : 'تسجيل الدخول إلى حسابك'
                        : mode === 'operator'
                        ? lang === 'fr'
                          ? 'Inscription Opérateur Économique'
                          : 'تسجيل حساب متعامل اقتصادي جديد'
                        : lang === 'fr'
                        ? 'Inscription Service Contractant'
                        : 'تسجيل حساب مصلحة متعاقدة جديدة'}
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500">
                      {mode === 'login'
                        ? lang === 'fr'
                          ? 'Saisissez vos identifiants professionnels pour continuer'
                          : 'أدخل بريدك الإلكتروني المهني المعتمد وكلمة المرور للمتابعة'
                        : t('register.neumorphic.subtitle') || 'بوابة موحدة وفق أحكام القانون رقم 23-12'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  {mode === 'login' ? (
                    <button
                      type="button"
                      onClick={() => handleModeChange('operator')}
                      className="font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {lang === 'fr' ? 'Créer un compte' : 'إنشاء حساب جديد'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleModeChange('login')}
                      className="font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {t('register.neumorphic.login') || 'تسجيل الدخول'}
                    </button>
                  )}
                </div>
              </div>

              {/* ═══ مبدل النمط الموحد الثلاثي (Segmented 3-Way Tabs) ═══ */}
              <div className="mb-2.5">
                <div
                  role="tablist"
                  aria-label="نوع العملية والمصادقة"
                  className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 backdrop-blur-md"
                >
                  {/* تبويب تسجيل الدخول */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'login'}
                    onClick={() => handleModeChange('login')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 transition-all duration-200 cursor-pointer ${
                      mode === 'login'
                        ? 'border border-emerald-500/30 bg-gradient-to-tr from-[#006233] to-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold">
                      {lang === 'fr' ? 'Connexion' : 'تسجيل الدخول'}
                    </span>
                  </button>

                  {/* تبويب متعامل اقتصادي */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'operator'}
                    onClick={() => handleModeChange('operator')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 transition-all duration-200 cursor-pointer ${
                      mode === 'operator'
                        ? 'border border-emerald-500/30 bg-gradient-to-tr from-[#006233] to-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold">
                      {t('register.neumorphic.tab_operator') || 'متعامل اقتصادي'}
                    </span>
                  </button>

                  {/* تبويب مصلحة متعاقدة */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'authority'}
                    onClick={() => handleModeChange('authority')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 transition-all duration-200 cursor-pointer ${
                      mode === 'authority'
                        ? 'border border-emerald-500/30 bg-gradient-to-tr from-[#006233] to-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    <Landmark className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold">
                      {t('register.neumorphic.tab_authority') || 'مصلحة متعاقدة'}
                    </span>
                  </button>
                </div>
              </div>

              {/* أخطاء الخادم العامة */}
              {serverError && (
                <div
                  role="alert"
                  className="mb-2.5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/90 p-2.5 text-xs font-bold text-rose-800 shadow-2xs backdrop-blur-md animate-in fade-in-50"
                >
                  <AlertCircle className="size-3.5 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
                  <span className="flex-1 leading-normal">{serverError}</span>
                  <button
                    type="button"
                    onClick={() => setServerError(null)}
                    className="text-rose-400 hover:text-rose-700 cursor-pointer"
                    aria-label="إغلاق التنبيه"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════════════
                  النموذج 1: تسجيل الدخول (LOGIN MODE)
                  ══════════════════════════════════════════════════════════════════════ */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} noValidate className="space-y-3">
                  {/* البريد الإلكتروني */}
                  <div>
                    <label
                      htmlFor="login-email"
                      className="mb-0.5 block text-[11px] font-bold text-slate-800"
                    >
                      {t('login.email') || 'البريد الإلكتروني'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-9.5 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                      <Mail className="ms-2.5 size-3.5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="login-email"
                        type="email"
                        dir="ltr"
                        required
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                        placeholder="name@organization.dz"
                        autoComplete="email"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* كلمة المرور */}
                  <div>
                    <label
                      htmlFor="login-password"
                      className="mb-0.5 block text-[11px] font-bold text-slate-800"
                    >
                      {t('login.password') || 'كلمة المرور'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-9.5 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                      <Lock className="ms-2.5 size-3.5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        dir="ltr"
                        required
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((visible) => !visible)}
                        aria-label={showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        className="me-2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Eye className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* أزرار الحسابات التجريبية السريعة للتطوير والمراجعة */}
                  {isDemoLoginEnabled && (
                    <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-2.5 transition-all">
                      <span className="mb-1.5 block text-[10px] font-bold text-slate-500">
                        {t('login.demo_accounts_title') || 'حسابات المعاينة السريعة:'}
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => fillTestAccount('authority@safaqat.dz')}
                          className="truncate rounded-lg bg-white border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
                        >
                          {t('login.demo_authority') || 'مصلحة متعاقدة'}
                        </button>
                        <button
                          type="button"
                          onClick={() => fillTestAccount('operator@safaqat.dz')}
                          className="truncate rounded-lg bg-white border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
                        >
                          {t('login.demo_operator') || 'متعامل اقتصادي'}
                        </button>
                        <button
                          type="button"
                          onClick={() => fillTestAccount('admin@safaqat.dz')}
                          className="truncate rounded-lg bg-white border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
                        >
                          {t('login.demo_central') || 'إدارة مركزية'}
                        </button>
                      </div>
                      <div className="mt-1.5 text-center text-[10px] text-slate-500">
                        {t('login.demo_password_label') || 'كلمة المرور:'}{' '}
                        <span className="font-bold tabular-nums text-emerald-800 select-all">Safaqat@2026</span>
                      </div>
                    </div>
                  )}

                  {/* زر تسجيل الدخول */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#006233] via-[#059669] to-[#0f3154] text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-75 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        <span>{t('login.loading') || 'جارٍ تسجيل الدخول...'}</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="size-4" aria-hidden="true" />
                        <span>{t('login.submit') || 'تسجيل الدخول'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ══════════════════════════════════════════════════════════════════════
                  النموذج 2: التسجيل (OPERATOR & AUTHORITY REGISTRATION)
                  ══════════════════════════════════════════════════════════════════════ */}
              {(mode === 'operator' || mode === 'authority') && (
                <form onSubmit={handleRegisterSubmit} noValidate className="space-y-2">
                  {/* ─── المجموعة 1: الهوية والمؤسسة ─── */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {/* الاسم الكامل */}
                    <div>
                      <label
                        htmlFor="reg-full-name"
                        className="mb-0.5 block text-[11px] font-bold text-slate-800"
                      >
                        {t('register.neumorphic.full_name') || 'الاسم الكامل'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="group relative flex h-9 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                        <User className="ms-2.5 size-3.5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                        <input
                          id="reg-full-name"
                          type="text"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
                          onBlur={() => markTouched('fullName')}
                          placeholder={t('register.neumorphic.full_name_placeholder') || 'أدخل اسمك الكامل'}
                          autoComplete="name"
                          className="h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <FieldError name="fullName" />
                    </div>

                    {/* المؤسسة أو المصلحة */}
                    <div>
                      <label
                        htmlFor="reg-org"
                        className="mb-0.5 block text-[11px] font-bold text-slate-800"
                      >
                        {orgLabel} <span className="text-rose-500">*</span>
                      </label>
                      <div className="group relative flex h-9 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                        <Building2 className="ms-2.5 size-3.5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                        <input
                          id="reg-org"
                          type="text"
                          value={organization}
                          onChange={(event) => setOrganization(event.target.value)}
                          onBlur={() => markTouched('organization')}
                          placeholder={orgPlaceholder}
                          className="h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <FieldError name="organization" />
                    </div>
                  </div>

                  {/* ─── المجموعة 2: الهاتف والبريد الإلكتروني ─── */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {/* رقم الهاتف الجزائري — بدون كود دولي وبدون علم */}
                    <div>
                      <label
                        htmlFor="reg-phone"
                        className="mb-0.5 block text-[11px] font-bold text-slate-800"
                      >
                        {t('register.neumorphic.phone') || 'رقم الهاتف'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="group relative flex h-9 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                        <Phone className="ms-2.5 size-3.5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                        <input
                          id="reg-phone"
                          type="tel"
                          dir="ltr"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          onBlur={() => markTouched('phone')}
                          placeholder="0550123456"
                          autoComplete="tel"
                          className="h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <FieldError name="phone" />
                    </div>

                    {/* البريد الإلكتروني */}
                    <div>
                      <label
                        htmlFor="reg-email"
                        className="mb-0.5 block text-[11px] font-bold text-slate-800"
                      >
                        {t('register.neumorphic.email') || 'البريد الإلكتروني'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="group relative flex h-9 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                        <Mail className="ms-2.5 size-3.5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                        <input
                          id="reg-email"
                          type="email"
                          dir="ltr"
                          value={regEmail}
                          onChange={(event) => setRegEmail(event.target.value)}
                          onBlur={() => markTouched('email')}
                          placeholder="contact@entreprise.dz"
                          autoComplete="email"
                          className="h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <FieldError name="email" />
                    </div>
                  </div>

                  {/* ─── المجموعة 3: كلمة المرور وتأكيدها ─── */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {/* كلمة المرور */}
                    <div>
                      <label
                        htmlFor="reg-password"
                        className="mb-0.5 block text-[11px] font-bold text-slate-800"
                      >
                        {t('register.neumorphic.password') || 'كلمة المرور'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="group relative flex h-9 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                        <Lock className="ms-2.5 size-3.5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                        <input
                          id="reg-password"
                          type={showRegPassword ? 'text' : 'password'}
                          dir="ltr"
                          value={regPassword}
                          onChange={(event) => setRegPassword(event.target.value)}
                          onBlur={() => markTouched('password')}
                          placeholder={t('register.neumorphic.password_placeholder') || 'أدخل كلمة المرور'}
                          autoComplete="new-password"
                          className="h-full w-full min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((visible) => !visible)}
                          aria-label={showRegPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                          className="me-2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
                        >
                          {showRegPassword ? (
                            <EyeOff className="size-3.5" aria-hidden="true" />
                          ) : (
                            <Eye className="size-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <FieldError name="password" />
                    </div>

                    {/* تأكيد كلمة المرور */}
                    <div>
                      <label
                        htmlFor="reg-confirm-password"
                        className="mb-0.5 block text-[11px] font-bold text-slate-800"
                      >
                        {t('register.neumorphic.confirm_password') || 'تأكيد كلمة المرور'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="group relative flex h-9 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                        <Lock className="ms-2.5 size-3.5 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                        <input
                          id="reg-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          dir="ltr"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          onBlur={() => markTouched('confirmPassword')}
                          placeholder={t('register.neumorphic.confirm_password_placeholder') || 'أعد إدخال كلمة المرور'}
                          autoComplete="new-password"
                          className="h-full w-full min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((visible) => !visible)}
                          aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                          className="me-2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-3.5" aria-hidden="true" />
                          ) : (
                            <Eye className="size-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <FieldError name="confirmPassword" />
                    </div>
                  </div>

                  {/* ─── المجموعة 4: المقر الجغرافي (الولاية والبلدية) ─── */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 transition-all">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                      <MapPin className="size-3.5 text-emerald-600" aria-hidden="true" />
                      <span>النطاق الإقليمي والمقر الإداري (الولاية والبلدية)</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {/* اختيار الولاية */}
                      <div ref={wilayaCellRef} className="relative">
                        <label className="mb-0.5 block text-[10px] font-bold text-slate-700">
                          {t('register.neumorphic.wilaya') || 'الولاية'} <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsWilayaOpen((open) => !open);
                            setWilayaSearch('');
                          }}
                          onBlur={() => markTouched('wilaya')}
                          aria-haspopup="listbox"
                          aria-expanded={isWilayaOpen}
                          className={`flex h-8.5 w-full items-center justify-between rounded-lg border bg-white px-2.5 text-start text-xs font-semibold transition-all cursor-pointer ${
                            touched.wilaya && !wilaya
                              ? 'border-rose-400 ring-2 ring-rose-500/10'
                              : 'border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                          }`}
                        >
                          <span className={`truncate ${wilaya ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                            {selectedWilayaUnit
                              ? `${selectedWilayaUnit.code} — ${
                                  lang === 'fr'
                                    ? selectedWilayaUnit.nameFr
                                    : selectedWilayaUnit.nameAr
                                }`
                              : t('register.neumorphic.select_wilaya') || 'اختر الولاية'}
                          </span>
                          <ChevronDown className={`size-3 text-slate-400 transition-transform ${isWilayaOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>

                        {/* قائمة الولايات المنسدلة الذكية تفتح للأعلى */}
                        {isWilayaOpen && (
                          <div className="absolute bottom-full z-50 mb-1.5 w-full rounded-xl border border-slate-200 bg-white/98 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in-50 zoom-in-95">
                            <div className="relative mb-1.5 flex h-8 items-center rounded-lg border border-slate-200/80 bg-slate-50 px-2">
                              <Search className="size-3 shrink-0 text-slate-400" aria-hidden="true" />
                              <input
                                type="text"
                                value={wilayaSearch}
                                onChange={(event) => setWilayaSearch(event.target.value)}
                                placeholder={t('register.neumorphic.wilaya_search_placeholder') || 'ابحث برقم الولاية أو اسمها...'}
                                className="h-full w-full min-w-0 flex-1 bg-transparent px-2 text-xs placeholder:text-slate-400 focus:outline-none"
                                autoFocus
                              />
                              {wilayaSearch && (
                                <button
                                  type="button"
                                  onClick={() => setWilayaSearch('')}
                                  aria-label="مسح البحث"
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  <X className="size-3" aria-hidden="true" />
                                </button>
                              )}
                            </div>

                            <div
                              className="max-h-40 overflow-y-auto space-y-0.5"
                              role="listbox"
                              aria-label="قائمة الولايات"
                            >
                              {filteredWilayas.length === 0 ? (
                                <p className="py-2 text-center text-xs text-slate-400">
                                  {t('register.neumorphic.no_wilaya_match') || 'لا توجد ولاية مطابقة'}
                                </p>
                              ) : (
                                filteredWilayas.map((unit) => {
                                  const active = wilaya === unit.code;
                                  return (
                                    <button
                                      key={unit.code}
                                      type="button"
                                      role="option"
                                      aria-selected={active}
                                      onClick={() => {
                                        setWilaya(unit.code);
                                        setCommune('');
                                        setIsWilayaOpen(false);
                                        setWilayaSearch('');
                                        markTouched('wilaya');
                                      }}
                                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-start text-xs transition-colors cursor-pointer ${
                                        active
                                          ? 'bg-emerald-50 font-bold text-emerald-800'
                                          : 'font-semibold text-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span>
                                        {unit.code} — {lang === 'fr' ? unit.nameFr : unit.nameAr}
                                      </span>
                                      {active && (
                                        <Check className="size-3 text-emerald-600 shrink-0" aria-hidden="true" />
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                        <FieldError name="wilaya" />
                      </div>

                      {/* اختيار البلدية */}
                      <div ref={communeCellRef} className="relative">
                        <label className="mb-0.5 block text-[10px] font-bold text-slate-700">
                          {t('register.neumorphic.commune') || 'البلدية'} <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCommuneOpen((open) => !open)}
                          onBlur={() => markTouched('commune')}
                          disabled={!wilaya}
                          aria-haspopup="listbox"
                          aria-expanded={isCommuneOpen}
                          className={`flex h-8.5 w-full items-center justify-between rounded-lg border bg-white px-2.5 text-start text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 cursor-pointer ${
                            touched.commune && !commune.trim()
                              ? 'border-rose-400 ring-2 ring-rose-500/10'
                              : 'border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                          }`}
                        >
                          <span className={`truncate ${commune.trim() ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                            {wilaya
                              ? commune.trim() || t('register.neumorphic.select_commune') || 'اختر البلدية'
                              : t('register.neumorphic.select_wilaya_first') || 'اختر الولاية أولاً'}
                          </span>
                          <ChevronDown className={`size-3 text-slate-400 transition-transform ${isCommuneOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>

                        {/* قائمة البلديات المنسدلة تفتح للأعلى */}
                        {isCommuneOpen && wilaya && (
                          <div className="absolute bottom-full z-50 mb-1.5 w-full rounded-xl border border-slate-200 bg-white/98 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in-50 zoom-in-95">
                            <div
                              className="max-h-40 overflow-y-auto space-y-0.5"
                              role="listbox"
                              aria-label="قائمة البلديات"
                            >
                              {availableCommunes.length === 0 ? (
                                <p className="py-2 text-center text-xs text-slate-400">
                                  {t('register.neumorphic.no_communes') || 'لا توجد بلديات مسجلة لهذه الولاية'}
                                </p>
                              ) : (
                                availableCommunes.map((option) => {
                                  const active = commune === option;
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      role="option"
                                      aria-selected={active}
                                      onClick={() => {
                                        setCommune(option);
                                        setIsCommuneOpen(false);
                                        markTouched('commune');
                                      }}
                                      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-start text-xs transition-colors cursor-pointer ${
                                        active
                                          ? 'bg-emerald-50 font-bold text-emerald-800'
                                          : 'font-semibold text-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span>{option}</span>
                                      {active && (
                                        <Check className="size-3 text-emerald-600 shrink-0" aria-hidden="true" />
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                        <FieldError name="commune" />
                      </div>
                    </div>
                  </div>

                  {/* زر إنشاء الحساب */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className="mt-2 flex h-9.5 sm:h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#006233] via-[#059669] to-[#0f3154] text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-75 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        <span>{t('register.neumorphic.submitting') || 'جارٍ إنشاء الحساب...'}</span>
                      </>
                    ) : isSuccess ? (
                      <>
                        <Check className="size-4 text-emerald-200" aria-hidden="true" />
                        <span>{t('register.neumorphic.success') || 'تم إنشاء الحساب بنجاح!'}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-4" aria-hidden="true" />
                        <span>{t('register.neumorphic.submit') || 'إنشاء الحساب'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ═══ تذييل البطاقة ورابط الخصوصية ═══ */}
            <div className="mt-2.5 border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <div className="flex items-center gap-1">
                <Shield className="size-3 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>{t('register.neumorphic.privacy') || 'بإنشاء حسابك، توافق على شروط الاستخدام وسياسة الخصوصية'}</span>
              </div>
              <span className="text-slate-400">القانون رقم 23-12</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default UnifiedAuthPage;
