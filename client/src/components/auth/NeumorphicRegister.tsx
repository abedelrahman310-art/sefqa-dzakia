import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Logo } from '@/components/ui/Logo';
import { REGISTRY_69W, getCommunesForWilaya } from '@safaqat/shared/territorial';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Coins,
  Eye,
  EyeOff,
  Globe,
  Landmark,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

type RegisterRole = 'operator' | 'authority';

interface NeumorphicRegisterProps {
  initialRole: RegisterRole;
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

/** علم الجزائر المصغّر لمفتاح الدولة في حقل الهاتف */
const AlgeriaFlag = () => (
  <svg viewBox="0 0 20 14" className="h-3 w-5 shrink-0 rounded-[2px] ring-1 ring-black/10" aria-hidden="true">
    <rect width="10" height="14" fill="#006233" />
    <rect x="10" width="10" height="14" fill="#ffffff" />
    <circle cx="10" cy="7" r="3.4" fill="none" stroke="#d21034" strokeWidth="1.4" />
  </svg>
);

export function NeumorphicRegister({ initialRole }: NeumorphicRegisterProps) {
  const { lang, dir, setLang } = useI18n();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  // 1. التبديل بين التبويبين (متعامل اقتصادي / مصلحة متعاقدة)
  const [role, setRole] = useState<RegisterRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2. الولاية والبلدية
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');

  // 3. إظهار/إخفاء كلمة المرور
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 4. حالة النموذج والتحقق
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 5. قوائم الاختيار المنسدلة
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

  // نصوص ديناميكية بحسب الدور
  const orgLabel =
    role === 'operator'
      ? t('register.neumorphic.org_operator')
      : t('register.neumorphic.org_authority');

  const orgPlaceholder =
    role === 'operator'
      ? t('register.neumorphic.org_placeholder_operator')
      : t('register.neumorphic.org_placeholder_authority');

  // حساب قوة كلمة المرور بصرياً
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password) || /[a-z]/.test(password)) score += 25;
    if (/\d/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  }, [password]);

  // التحقق المضمّن
  const valueError = (name: FieldName): string | null => {
    switch (name) {
      case 'fullName':
        return fullName.trim().length < 2
          ? t('register.neumorphic.err_full_name')
          : null;
      case 'organization':
        return organization.trim().length < 2
          ? t('register.neumorphic.err_org_required', { org: orgLabel })
          : null;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
          ? null
          : t('register.neumorphic.err_email');
      case 'phone': {
        const clean = phone.replace(/[\s.-]/g, '');
        return /^0\d{8,9}$/.test(clean) ? null : t('register.neumorphic.err_phone');
      }
      case 'password':
        return password.length < 8 ? t('register.neumorphic.err_password') : null;
      case 'confirmPassword':
        if (!confirmPassword) return t('register.neumorphic.err_confirm_required');
        return password === confirmPassword
          ? null
          : t('register.neumorphic.err_password_mismatch');
      case 'wilaya':
        return wilaya ? null : t('register.neumorphic.err_wilaya');
      case 'commune':
        return commune.trim() ? null : t('register.neumorphic.err_commune');
      default:
        return null;
    }
  };

  const fieldError = (name: FieldName): string | null =>
    touched[name] ? valueError(name) : null;

  const markTouched = (name: FieldName) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const FieldError = ({ name }: { name: FieldName }) => {
    const message = fieldError(name);
    if (!message) return null;
    return (
      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in-50">
        <AlertCircle className="size-3.5 shrink-0 text-rose-500" aria-hidden="true" />
        <span>{message}</span>
      </p>
    );
  };

  const handleSubmit = async (event: FormEvent) => {
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
          role,
          fullName: fullName.trim(),
          name: fullName.trim(),
          company: organization.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          password,
          wilaya,
          commune: commune.trim(),
          municipality: commune.trim(),
          address: addressParts.join(' - '),
          repRole: role === 'operator' ? 'المفوض قانوناً' : 'الآمر بالصرف أو المفوض عنه',
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
        setServerError(message || t('register.neumorphic.err_server'));
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
        setLocation(role === 'operator' ? '/operator' : '/authority');
      }, 1000);
    } catch {
      setServerError(t('register.neumorphic.err_network'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRtl = dir === 'rtl';

  return (
    <div
      className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-sky-50/25 to-emerald-50/30 font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-white"
      dir={dir}
    >
      {/* ═══ Antigravity Motion Keyframes & Classes ═══ */}
      <style>{`
        @keyframes antigravity-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes antigravity-float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(3deg);
          }
        }
        @keyframes antigravity-float-reverse {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(16px) rotate(-3deg);
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
        className="pointer-events-none fixed -top-40 -start-40 size-[32rem] rounded-full bg-gradient-to-tr from-emerald-400/15 to-teal-500/15 blur-3xl animate-antigravity-float-slow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-40 -end-40 size-[32rem] rounded-full bg-gradient-to-tr from-[#0f3154]/15 to-sky-600/15 blur-3xl animate-antigravity-float-reverse"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-1/2 start-1/3 size-80 rounded-full bg-amber-400/10 blur-3xl"
        aria-hidden="true"
      />

      {/* ═══ Floating Top Navigation Bar ═══ */}
      <header className="relative z-30 mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 px-4 py-2.5 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-6">
          {/* زر العودة للصفحة الرئيسية */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-bold text-slate-700 transition-colors hover:text-emerald-700"
          >
            {isRtl ? (
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            ) : (
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            )}
            <span>{t('register.redesign.back_home') || 'الصفحة الرئيسية'}</span>
          </Link>

          {/* مؤشر الحالة الرسمي واللغة وتنسيق تسجيل الدخول */}
          <div className="flex items-center gap-3">
            {/* حالة المنصة */}
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-[11px] font-bold text-emerald-800 shadow-xs backdrop-blur-md sm:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span>{t('register.neumorphic.system_status')}</span>
            </div>

            {/* محول اللغة */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-emerald-700 hover:shadow-sm"
              aria-label="تبديل اللغة / Changer de langue"
            >
              <Globe className="size-3.5 text-slate-500" aria-hidden="true" />
              <span>{lang === 'ar' ? 'Français' : 'العربية'}</span>
            </button>

            {/* رابط تسجيل الدخول المباشر */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
            >
              <User className="size-3.5" aria-hidden="true" />
              <span>{t('register.neumorphic.login')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ Main Content Grid ═══ */}
      <main className="relative z-20 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          
          {/* ══════════════════════════════════════════════════════════════════════
              العمود 1: الواجهة السيادية الطافية (40% - 5 أعمدة على الشاشات الكبيرة)
              ══════════════════════════════════════════════════════════════════════ */}
          <aside
            className={`hidden lg:sticky lg:top-24 lg:col-span-5 lg:flex lg:flex-col gap-6 ${
              isRtl ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            {/* البطاقة السيادية الزجاجية */}
            <div className="rounded-3xl border border-white/80 bg-gradient-to-b from-white/80 to-white/50 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06),0_0_1px_1px_rgba(255,255,255,0.8)_inset] backdrop-blur-2xl">
              {/* الرأس المؤسسي */}
              <div className="text-center">
                <span className="inline-block rounded-full border border-slate-200/60 bg-slate-100/60 px-3.5 py-1 text-[11px] font-bold text-slate-600">
                  الجمهورية الجزائرية الديمقراطية الشعبية
                </span>
                
                {/* الشعار الطافي مع هالة ضوئية ثلاثية الأبعاد */}
                <div className="relative my-6 flex justify-center">
                  <div className="absolute inset-0 mx-auto size-32 rounded-full bg-emerald-400/20 blur-2xl" />
                  <div className="relative animate-antigravity-float">
                    <Logo size={135} className="drop-shadow-[0_16px_28px_rgba(15,49,84,0.18)]" />
                  </div>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-[#0f3154]">
                  {t('register.neumorphic.brand_name')}
                </h1>
                <p className="mt-2 text-sm font-bold text-slate-600 leading-relaxed">
                  {t('register.neumorphic.brand_tagline')}
                </p>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  منظومة رقمية وطنية موحدة وفق أحكام القانون 23-12 والمرسوم الرئاسي 15-247
                </p>
              </div>

              {/* بطاقات الميزات الطافية (Floating Feature Cards) */}
              <div className="mt-8 space-y-3.5">
                {/* 1. صفر ورقة */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20">
                    <ShieldCheck className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">
                      مبدأ «صفر ورقة» الرقمي بالكامل
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      إيداع وتشفير AES-256 رقمي بالكامل دون الحاجة لأي أظرفة ورقية
                    </p>
                  </div>
                </div>

                {/* 2. الربط البيني الآلي */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20">
                    <Coins className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">
                      الربط البيني للدولة (Inter-opérabilité)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      التحقق التلقائي من السجل التجاري وNIF والضرائب دون طلب وثائق ورقية
                    </p>
                  </div>
                </div>

                {/* 3. الذكاء الاصطناعي السيادي */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/70 p-3.5 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/20">
                    <Sparkles className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">
                      المطابقة والذكاء الاصطناعي السيادي
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      مطابقة دقيقة لدفاتر الشروط واقتراح الفرص الأنسب لنشاطك التجاري
                    </p>
                  </div>
                </div>
              </div>

              {/* شارة التغطية الوطنية */}
              <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/70 py-2.5 px-3 text-center text-[11px] font-bold text-slate-600">
                <AlgeriaFlag />
                <span>تغطية وطنية موحدة لكافة ولايات الجزائر الـ 69 والبلديات الـ 1,541</span>
              </div>
            </div>
          </aside>

          {/* ══════════════════════════════════════════════════════════════════════
              العمود 2: مساحة التسجيل الزجاجية الفاخرة (60% - 7 أعمدة)
              ══════════════════════════════════════════════════════════════════════ */}
          <div
            className={`lg:col-span-7 ${
              isRtl ? 'lg:order-1' : 'lg:order-2'
            }`}
          >
            <div className="rounded-3xl border border-white/90 bg-white/85 p-6 shadow-[0_25px_60px_-15px_rgba(15,49,84,0.10),0_0_1px_1px_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl sm:p-8 md:p-10">
              
              {/* الرأس الداخلي للبطاقة */}
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0f3154] to-emerald-600 text-white shadow-lg shadow-emerald-700/15 animate-antigravity-float">
                  <UserPlus className="size-6 text-emerald-100" aria-hidden="true" />
                </div>
                <h2 className="mt-3.5 text-2xl font-black text-[#0f3154] sm:text-3xl">
                  {t('register.neumorphic.title')}
                </h2>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-500 max-w-lg leading-relaxed">
                  {t('register.neumorphic.subtitle')}
                </p>
              </div>

              {/* ═══ مبدل الدور الفاخر (Segmented Role Switcher) ═══ */}
              <div className="mb-6">
                <span className="mb-2 block text-center text-xs font-black text-slate-700">
                  {t('register.neumorphic.account_type')}
                </span>
                <div
                  role="tablist"
                  aria-label={t('register.neumorphic.account_type')}
                  className="grid grid-cols-2 gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1.5 backdrop-blur-md"
                >
                  {/* تبويب المتعامل الاقتصادي */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={role === 'operator'}
                    onClick={() => setRole('operator')}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-3 transition-all duration-200 ${
                      role === 'operator'
                        ? 'border border-emerald-500/30 bg-gradient-to-tr from-[#006233] to-emerald-600 text-white shadow-md shadow-emerald-700/20'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="size-4 shrink-0" aria-hidden="true" />
                      <span className="text-xs sm:text-sm font-black">
                        {t('register.neumorphic.tab_operator')}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold ${role === 'operator' ? 'text-emerald-100' : 'text-slate-400'}`}>
                      المؤسسات والشركات والمقاولون
                    </span>
                  </button>

                  {/* تبويب المصلحة المتعاقدة */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={role === 'authority'}
                    onClick={() => setRole('authority')}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-3 transition-all duration-200 ${
                      role === 'authority'
                        ? 'border border-emerald-500/30 bg-gradient-to-tr from-[#006233] to-emerald-600 text-white shadow-md shadow-emerald-700/20'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Landmark className="size-4 shrink-0" aria-hidden="true" />
                      <span className="text-xs sm:text-sm font-black">
                        {t('register.neumorphic.tab_authority')}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold ${role === 'authority' ? 'text-emerald-100' : 'text-slate-400'}`}>
                      الإدارات والبلديات والهيئات العمومية
                    </span>
                  </button>
                </div>
              </div>

              {/* أخطاء الخادم العامة */}
              {serverError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-bold text-rose-800 shadow-sm backdrop-blur-md animate-in fade-in-50"
                >
                  <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
                  <span className="flex-1 leading-relaxed">{serverError}</span>
                  <button
                    type="button"
                    onClick={() => setServerError(null)}
                    className="text-rose-400 hover:text-rose-700"
                    aria-label="إغلاق التنبيه"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* ═══ نموذج التسجيل ═══ */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                
                {/* ─── المجموعة 1: الهوية والمؤسسة ─── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* الاسم الكامل */}
                  <div>
                    <label
                      htmlFor="reg-full-name"
                      className="mb-1.5 block text-xs font-black text-slate-800"
                    >
                      {t('register.neumorphic.full_name')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-12 w-full items-center rounded-2xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                      <User className="ms-3.5 size-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-full-name"
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        onBlur={() => markTouched('fullName')}
                        placeholder={t('register.neumorphic.full_name_placeholder')}
                        autoComplete="name"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <FieldError name="fullName" />
                  </div>

                  {/* المؤسسة أو المصلحة */}
                  <div>
                    <label
                      htmlFor="reg-org"
                      className="mb-1.5 block text-xs font-black text-slate-800"
                    >
                      {orgLabel} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-12 w-full items-center rounded-2xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                      <Building2 className="ms-3.5 size-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-org"
                        type="text"
                        value={organization}
                        onChange={(event) => setOrganization(event.target.value)}
                        onBlur={() => markTouched('organization')}
                        placeholder={orgPlaceholder}
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <FieldError name="organization" />
                  </div>
                </div>

                {/* ─── المجموعة 2: الهاتف والبريد الإلكتروني ─── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* رقم الهاتف الجزائري */}
                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="mb-1.5 block text-xs font-black text-slate-800"
                    >
                      {t('register.neumorphic.phone')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-12 w-full items-center rounded-2xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                      <Phone className="ms-3.5 size-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-phone"
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        onBlur={() => markTouched('phone')}
                        placeholder="0550123456"
                        autoComplete="tel"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-xs sm:text-sm font-mono font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                      <span
                        className="me-2.5 flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/60 bg-white/80 px-2 py-1 text-xs font-bold text-slate-600 shadow-xs"
                        title={t('register.neumorphic.phone_country_title')}
                      >
                        <AlgeriaFlag />
                        <span dir="ltr">+213</span>
                      </span>
                    </div>
                    <FieldError name="phone" />
                  </div>

                  {/* البريد الإلكتروني */}
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="mb-1.5 block text-xs font-black text-slate-800"
                    >
                      {t('register.neumorphic.email')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-12 w-full items-center rounded-2xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                      <Mail className="ms-3.5 size-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-email"
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onBlur={() => markTouched('email')}
                        placeholder="contact@entreprise.dz"
                        autoComplete="email"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <FieldError name="email" />
                  </div>
                </div>

                {/* ─── المجموعة 3: كلمة المرور وتأكيدها ─── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* كلمة المرور */}
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="mb-1.5 block text-xs font-black text-slate-800"
                    >
                      {t('register.neumorphic.password')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-12 w-full items-center rounded-2xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                      <Lock className="ms-3.5 size-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        dir="ltr"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onBlur={() => markTouched('password')}
                        placeholder={t('register.neumorphic.password_placeholder')}
                        autoComplete="new-password"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={
                          showPassword
                            ? t('register.neumorphic.hide_password')
                            : t('register.neumorphic.show_password')
                        }
                        className="me-3 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" aria-hidden="true" />
                        ) : (
                          <Eye className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    
                    {/* شريط قوة كلمة المرور الذكي */}
                    {password && (
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength <= 25
                                ? 'bg-rose-500'
                                : passwordStrength <= 50
                                ? 'bg-amber-500'
                                : passwordStrength <= 75
                                ? 'bg-sky-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <FieldError name="password" />
                  </div>

                  {/* تأكيد كلمة المرور */}
                  <div>
                    <label
                      htmlFor="reg-confirm-password"
                      className="mb-1.5 block text-xs font-black text-slate-800"
                    >
                      {t('register.neumorphic.confirm_password')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-12 w-full items-center rounded-2xl border border-slate-200/80 bg-slate-50/70 transition-all duration-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
                      <Lock className="ms-3.5 size-4 shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        dir="ltr"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        onBlur={() => markTouched('confirmPassword')}
                        placeholder={t('register.neumorphic.confirm_password_placeholder')}
                        autoComplete="new-password"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((visible) => !visible)}
                        aria-label={
                          showConfirmPassword
                            ? t('register.neumorphic.hide_password')
                            : t('register.neumorphic.show_password')
                        }
                        className="me-3 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-4" aria-hidden="true" />
                        ) : (
                          <Eye className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {confirmPassword && password === confirmPassword && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-in fade-in-50">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        <span>كلمتا المرور متطابقتان</span>
                      </p>
                    )}
                    <FieldError name="confirmPassword" />
                  </div>
                </div>

                {/* ─── المجموعة 4: المقر الجغرافي (الولاية والبلدية) ─── */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all">
                  <div className="mb-3 flex items-center gap-2 text-xs font-black text-slate-800">
                    <MapPin className="size-4 text-emerald-600" aria-hidden="true" />
                    <span>النطاق الإقليمي والمقر الإداري (الولاية والبلدية)</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* اختيار الولاية */}
                    <div ref={wilayaCellRef} className="relative">
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                        {t('register.neumorphic.wilaya')} <span className="text-rose-500">*</span>
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
                        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-start text-xs font-semibold transition-all ${
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
                            : t('register.neumorphic.select_wilaya')}
                        </span>
                        <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${isWilayaOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>

                      {/* قائمة الولايات المنسدلة الذكية */}
                      {isWilayaOpen && (
                        <div className="absolute top-full z-40 mt-2 w-full rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in-50 zoom-in-95">
                          {/* شريط البحث في الولايات */}
                          <div className="relative mb-2 flex h-9 items-center rounded-xl border border-slate-200/80 bg-slate-50 px-2.5">
                            <Search className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                            <input
                              type="text"
                              value={wilayaSearch}
                              onChange={(event) => setWilayaSearch(event.target.value)}
                              placeholder={t('register.neumorphic.wilaya_search_placeholder')}
                              className="h-full w-full min-w-0 flex-1 bg-transparent px-2 text-xs placeholder:text-slate-400 focus:outline-none"
                              autoFocus
                            />
                            {wilayaSearch && (
                              <button
                                type="button"
                                onClick={() => setWilayaSearch('')}
                                aria-label={t('register.neumorphic.clear_search')}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="size-3.5" aria-hidden="true" />
                              </button>
                            )}
                          </div>

                          <div
                            className="max-h-52 overflow-y-auto space-y-0.5"
                            role="listbox"
                            aria-label={t('register.neumorphic.wilaya_list')}
                          >
                            {filteredWilayas.length === 0 ? (
                              <p className="py-3 text-center text-xs text-slate-400">
                                {t('register.neumorphic.no_wilaya_match')}
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
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-start text-xs transition-colors ${
                                      active
                                        ? 'bg-emerald-50 font-black text-emerald-800'
                                        : 'font-semibold text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span>
                                      {unit.code} — {lang === 'fr' ? unit.nameFr : unit.nameAr}
                                    </span>
                                    {active && (
                                      <Check className="size-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
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
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-700">
                        {t('register.neumorphic.commune')} <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCommuneOpen((open) => !open)}
                        onBlur={() => markTouched('commune')}
                        disabled={!wilaya}
                        aria-haspopup="listbox"
                        aria-expanded={isCommuneOpen}
                        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-start text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 ${
                          touched.commune && !commune.trim()
                            ? 'border-rose-400 ring-2 ring-rose-500/10'
                            : 'border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                        }`}
                      >
                        <span className={`truncate ${commune.trim() ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                          {wilaya
                            ? commune.trim() || t('register.neumorphic.select_commune')
                            : t('register.neumorphic.select_wilaya_first')}
                        </span>
                        <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${isCommuneOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>

                      {/* قائمة البلديات المنسدلة */}
                      {isCommuneOpen && wilaya && (
                        <div className="absolute top-full z-40 mt-2 w-full rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in-50 zoom-in-95">
                          <div
                            className="max-h-52 overflow-y-auto space-y-0.5"
                            role="listbox"
                            aria-label={t('register.neumorphic.commune_list')}
                          >
                            {availableCommunes.length === 0 ? (
                              <p className="py-3 text-center text-xs text-slate-400">
                                {t('register.neumorphic.no_communes')}
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
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-start text-xs transition-colors ${
                                      active
                                        ? 'bg-emerald-50 font-black text-emerald-800'
                                        : 'font-semibold text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span>{option}</span>
                                    {active && (
                                      <Check className="size-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
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

                {/* ═══ زر تأكيد التسجيل الفاخر ═══ */}
                <button
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                  className="mt-6 flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#006233] via-[#059669] to-[#0f3154] text-base sm:text-lg font-black text-white shadow-[0_12px_25px_-5px_rgba(0,98,51,0.35)] transition-all duration-300 hover:shadow-[0_16px_35px_-5px_rgba(0,98,51,0.45)] hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                      <span>{t('register.neumorphic.submitting')}</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <Check className="size-5 text-emerald-200" aria-hidden="true" />
                      <span>{t('register.neumorphic.success')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-5" aria-hidden="true" />
                      <span>{t('register.neumorphic.submit')}</span>
                    </>
                  )}
                </button>
              </form>

              {/* ═══ تذييل البطاقة ورابط تسجيل الدخول ═══ */}
              <div className="mt-6 border-t border-slate-100 pt-5 text-center space-y-3">
                <p className="text-xs font-bold text-slate-600">
                  {t('register.neumorphic.have_account')}{' '}
                  <Link href="/login" className="font-black text-emerald-700 hover:underline">
                    {t('register.neumorphic.login')}
                  </Link>
                </p>

                <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
                  <Shield className="size-3.5 text-emerald-600" aria-hidden="true" />
                  <span>{t('register.neumorphic.privacy')}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default NeumorphicRegister;
