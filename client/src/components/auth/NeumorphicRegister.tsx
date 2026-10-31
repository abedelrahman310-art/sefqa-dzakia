import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Logo } from '@/components/ui/Logo';
import { REGISTRY_69W, getCommunesForWilaya } from '@safaqat/shared/territorial';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Bot,
  Building2,
  Check,
  ChevronDown,
  Coins,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  X,
} from 'lucide-react';

type RegisterRole = 'operator' | 'authority';

interface NeumorphicRegisterProps {
  initialRole: RegisterRole;
}

/**
 * تأثير "الحَفر" (Neumorphism) الموحّد لحقول النموذج.
 */
const ENGRAVED_FIELD =
  'bg-[#f4f7fa] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] border-none rounded-xl h-12 text-sm';

const ENGRAVED_SOFT =
  'rounded-xl bg-[#f4f7fa] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]';

const RAISED_PILL = 'shadow-[3px_3px_8px_#d1d9e6,-3px_-3px_8px_#ffffff]';

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

/** علم الجزائر المصغّر لمفتاح الدولة في حقل الهاتف. */
const AlgeriaFlag = () => (
  <svg viewBox="0 0 20 14" className="h-3 w-5 shrink-0 rounded-[2px] ring-1 ring-black/5" aria-hidden="true">
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

  // 1. التبديل بين التبويبين (متعامل / مصلحة) فقط عبر useState؛ النصوص تتغير تلقائياً حسب الدور.
  const [role, setRole] = useState<RegisterRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2. الولاية والبلدية: قسم قابل للطي تُملأ قائمتاه من REGISTRY_69W.
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [geoOpen, setGeoOpen] = useState(true);

  // 3. إظهار/إخفاء كلمة المرور.
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 4. حالة النموذج.
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  // نصوص تتبدل حسب التبويب النشط.
  const orgLabel =
    role === 'operator'
      ? t('register.neumorphic.org_operator')
      : t('register.neumorphic.org_authority');
  const orgPlaceholder =
    role === 'operator'
      ? t('register.neumorphic.org_placeholder_operator')
      : t('register.neumorphic.org_placeholder_authority');

  // ─── التحقق المضمّن ───────────────────────────────────────────
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
      <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-500">
        <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
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
      setGeoOpen(true);
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
      className="min-h-screen w-full bg-[#f0f4f8] font-['Cairo',sans-serif] select-none lg:flex"
      dir={dir}
    >
      {/* ═══ العمود المخصص للهوية البصرية (40%) — يختفي على الشاشات الصغيرة ═══ */}
      <aside
        className={`relative hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[40%] shrink-0 overflow-hidden ${
          isRtl ? 'lg:order-2' : 'lg:order-1'
        }`}
      >
        {/* خلفية فاتحة نيوومورفية متناسقة مع بطاقة النموذج البيضاء */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] to-[#e9eef2]" />
        {/* لمسات ضوئية ناعمة جداً لإضفاء العمق دون كسر النعومة */}
        <div
          className="pointer-events-none absolute -start-24 -top-24 size-72 rounded-full bg-white/60 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -end-20 bottom-10 size-64 rounded-full bg-emerald-100/40 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-between p-10 text-center xl:p-12">
          {/* مؤشر حالة النظام — نقطة خضراء صغيرة على خلفية بيضاء ناعمة */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 shadow-[3px_3px_8px_#d1d9e6,-3px_-3px_8px_#ffffff]">
            <span className="relative flex size-2.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {t('register.neumorphic.system_status')}
            </span>
          </div>

          {/* الشعار في منتصف العمود — العنصر البصري الأساسي */}
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <Logo size={160} className="drop-shadow-[0_18px_30px_rgba(15,23,42,0.10)]" />
            <h1 className="mt-6 text-4xl font-black text-slate-800">
              {t('register.neumorphic.brand_name')}
            </h1>
            <p className="mt-3 max-w-xs text-base font-bold leading-7 text-slate-500">
              {t('register.neumorphic.brand_tagline')}
            </p>
          </div>

          {/* الشارات الثلاث — دوائر بيضاء بظل ناعم وأيقونات خضراء */}
          <div className="w-full max-w-xs space-y-4">
            {[
              {
                icon: ShieldCheck,
                lines: [
                  t('register.neumorphic.badge_transparency_1'),
                  t('register.neumorphic.badge_transparency_2'),
                ],
              },
              {
                icon: Bot,
                lines: [
                  t('register.neumorphic.badge_ai_1'),
                  t('register.neumorphic.badge_ai_2'),
                ],
              },
              {
                icon: Coins,
                lines: [
                  t('register.neumorphic.badge_economy_1'),
                  t('register.neumorphic.badge_economy_2'),
                ],
              },
            ].map(({ icon: Icon, lines }) => (
              <div key={lines[0]} className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-[5px_5px_12px_#d1d9e6,-5px_-5px_12px_#ffffff] ring-1 ring-white/70">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <p className="text-start text-sm font-black leading-6 text-slate-700">
                  {lines[0]}
                  <br />
                  {lines[1]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ═══ عمود النموذج (60%) ═══ */}
      <main
        className={`flex w-full flex-col px-4 py-6 sm:px-8 lg:w-[60%] lg:py-8 ${
          isRtl ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        {/* الشريط العلوي: تسجيل الدخول + اللغة */}
        <div className="mx-auto flex w-full max-w-2xl xl:max-w-3xl items-center justify-between gap-3 text-xs">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-bold text-[#0A2540] transition-colors hover:text-emerald-700"
          >
            <span>{t('register.neumorphic.login')}</span>
            <User className="size-4" aria-hidden="true" />
          </Link>
          <span className="hidden h-4 w-px bg-slate-300 sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2f7] px-3 py-1.5 font-bold text-[#0A2540] shadow-[2px_2px_6px_#d1d9e6,-2px_-2px_6px_#ffffff] transition-all hover:bg-white"
          >
            <Globe className="size-3.5" aria-hidden="true" />
            <span dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {lang === 'ar' ? 'العربية' : 'Français'}
            </span>
            <ChevronDown className="size-3" aria-hidden="true" />
          </button>
        </div>

        {/* بطاقة النموذج */}
        <div className="mx-auto mt-5 w-full max-w-2xl xl:max-w-3xl rounded-[2rem] bg-white p-8 sm:p-10 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          {/* العنوان */}
          <div className="flex flex-col items-center">
            <span
              className={`flex size-14 items-center justify-center rounded-full border-none bg-[#f4f7fa] ${RAISED_PILL}`}
            >
              <Sparkles className="size-6 text-emerald-600" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-center text-2xl font-black text-[#0A2540]">
              {t('register.neumorphic.title')}
            </h2>
            <p className="mt-1.5 text-center text-xs font-bold text-slate-500">
              {t('register.neumorphic.subtitle')}
            </p>
          </div>

          {/* تبويب الدور */}
          <div
            role="tablist"
            aria-label={t('register.neumorphic.account_type')}
            className="mt-6 flex flex-row-reverse gap-1 rounded-full bg-[#f0f4f8] p-1 shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={role === 'operator'}
              onClick={() => setRole('operator')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold transition-all sm:text-sm ${
                role === 'operator'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white rounded-full shadow-md'
                  : 'text-slate-500 hover:bg-white/70 hover:text-[#0A2540]'
              }`}
            >
              <User className="size-4" aria-hidden="true" />
              <span>{t('register.neumorphic.tab_operator')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === 'authority'}
              onClick={() => setRole('authority')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold transition-all sm:text-sm ${
                role === 'authority'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white rounded-full shadow-md'
                  : 'text-slate-500 hover:bg-white/70 hover:text-[#0A2540]'
              }`}
            >
              <Building2 className="size-4" aria-hidden="true" />
              <span>{t('register.neumorphic.tab_authority')}</span>
            </button>
          </div>

          {/* أخطاء الخادم */}
          {serverError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            {/* الصف 1: الاسم الكامل | المؤسسة/المصلحة */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="reg-full-name"
                  className="mb-1.5 block text-[11px] font-black text-[#0B1A2B]"
                >
                  {t('register.neumorphic.full_name')} <span className="text-red-500">*</span>
                </label>
                <div className={`relative flex w-full items-center ${ENGRAVED_FIELD}`}>
                  <input
                    id="reg-full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    onBlur={() => markTouched('fullName')}
                    placeholder={t('register.neumorphic.full_name_placeholder')}
                    autoComplete="name"
                    className="h-full w-full min-w-0 flex-1 bg-transparent px-3 placeholder:text-slate-400 focus:outline-none"
                  />
                  <span className="h-5 w-px shrink-0 bg-slate-300/80" aria-hidden="true" />
                  <User className="mx-2.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
                <FieldError name="fullName" />
              </div>

              <div>
                <label
                  htmlFor="reg-org"
                  className="mb-1.5 block text-[11px] font-black text-[#0B1A2B]"
                >
                  {orgLabel} <span className="text-red-500">*</span>
                </label>
                <div className={`relative flex w-full items-center ${ENGRAVED_FIELD}`}>
                  <input
                    id="reg-org"
                    type="text"
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    onBlur={() => markTouched('organization')}
                    placeholder={orgPlaceholder}
                    className="h-full w-full min-w-0 flex-1 bg-transparent px-3 placeholder:text-slate-400 focus:outline-none"
                  />
                  <span className="h-5 w-px shrink-0 bg-slate-300/80" aria-hidden="true" />
                  <Building2
                    className="mx-2.5 size-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
                <FieldError name="organization" />
              </div>
            </div>

            {/* الصف 2: الهاتف مع مفتاح الدولة | البريد الإلكتروني */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="reg-phone"
                  className="mb-1.5 block text-[11px] font-black text-[#0B1A2B]"
                >
                  {t('register.neumorphic.phone')} <span className="text-red-500">*</span>
                </label>
                <div className={`relative flex w-full items-center ${ENGRAVED_FIELD}`}>
                  <Phone
                    className="mx-2.5 size-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <span className="h-5 w-px shrink-0 bg-slate-300/80" aria-hidden="true" />
                  <input
                    id="reg-phone"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    onBlur={() => markTouched('phone')}
                    placeholder="0512345678"
                    autoComplete="tel"
                    className="h-full w-full min-w-0 flex-1 bg-transparent px-2 text-start placeholder:text-slate-400 focus:outline-none"
                  />
                  <span
                    className="flex shrink-0 items-center gap-1.5 px-2 text-xs font-bold text-slate-500"
                    title={t('register.neumorphic.phone_country_title')}
                  >
                    <AlgeriaFlag />
                    <span dir="ltr">+213</span>
                    <ChevronDown className="size-3 text-slate-400" aria-hidden="true" />
                  </span>
                </div>
                <FieldError name="phone" />
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="mb-1.5 block text-[11px] font-black text-[#0B1A2B]"
                >
                  {t('register.neumorphic.email')} <span className="text-red-500">*</span>
                </label>
                <div className={`relative flex w-full items-center ${ENGRAVED_FIELD}`}>
                  <input
                    id="reg-email"
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => markTouched('email')}
                    placeholder="exemple@domaine.dz"
                    autoComplete="email"
                    className="h-full w-full min-w-0 flex-1 bg-transparent px-3 placeholder:text-slate-400 focus:outline-none"
                  />
                  <span className="h-5 w-px shrink-0 bg-slate-300/80" aria-hidden="true" />
                  <Mail className="mx-2.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
                <FieldError name="email" />
              </div>
            </div>

            {/* الصف 3: كلمة المرور | تأكيد كلمة المرور متقابلين */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="reg-password"
                  className="mb-1.5 block text-[11px] font-black text-[#0B1A2B]"
                >
                  {t('register.neumorphic.password')} <span className="text-red-500">*</span>
                </label>
                <div className={`relative flex w-full items-center ${ENGRAVED_FIELD}`}>
                  <Lock
                    className="mx-2.5 size-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onBlur={() => markTouched('password')}
                    placeholder={t('register.neumorphic.password_placeholder')}
                    autoComplete="new-password"
                    className="h-full w-full min-w-0 flex-1 bg-transparent px-2 text-start placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword
                        ? t('register.neumorphic.hide_password')
                        : t('register.neumorphic.show_password')
                    }
                    className="mx-2 text-slate-400 transition-colors hover:text-[#0A2540]"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <FieldError name="password" />
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="mb-1.5 block text-[11px] font-black text-[#0B1A2B]"
                >
                  {t('register.neumorphic.confirm_password')} <span className="text-red-500">*</span>
                </label>
                <div className={`relative flex w-full items-center ${ENGRAVED_FIELD}`}>
                  <Lock
                    className="mx-2.5 size-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onBlur={() => markTouched('confirmPassword')}
                    placeholder={t('register.neumorphic.confirm_password_placeholder')}
                    autoComplete="new-password"
                    className="h-full w-full min-w-0 flex-1 bg-transparent px-2 text-start placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    aria-label={
                      showConfirmPassword
                        ? t('register.neumorphic.hide_password')
                        : t('register.neumorphic.show_password')
                    }
                    className="mx-2 text-slate-400 transition-colors hover:text-[#0A2540]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <FieldError name="confirmPassword" />
              </div>
            </div>

            {/* الولاية والبلدية — قسم قابل للطي */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setGeoOpen((open) => !open)}
                aria-expanded={geoOpen}
                className={`${ENGRAVED_FIELD} relative flex w-full items-center gap-2 px-3 ${
                  touched.wilaya && !wilaya ? 'ring-2 ring-red-400' : ''
                }`}
              >
                <MapPin
                  className="mx-1 size-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <span
                  className={`min-w-0 flex-1 truncate text-start text-xs font-bold ${
                    wilaya && commune.trim() ? 'text-[#0B1A2B]' : 'text-slate-400'
                  }`}
                >
                  {wilaya && commune.trim()
                    ? `${wilaya} — ${
                        selectedWilayaUnit
                          ? lang === 'fr'
                            ? selectedWilayaUnit.nameFr
                            : selectedWilayaUnit.nameAr
                          : wilaya
                      } (${commune.trim()})`
                    : t('register.neumorphic.geo_toggle')}
                </span>
                <ChevronDown
                  className={`mx-1.5 size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                    geoOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <FieldError name="wilaya" />

              {geoOpen && (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* الولاية */}
                  <div ref={wilayaCellRef} className="relative">
                    <span className="mb-1.5 block text-[11px] font-black text-[#0B1A2B]">
                      {t('register.neumorphic.wilaya')} <span className="text-red-500">*</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWilayaOpen((open) => !open);
                        setWilayaSearch('');
                      }}
                      onBlur={() => markTouched('wilaya')}
                      aria-haspopup="listbox"
                      aria-expanded={isWilayaOpen}
                      className={`relative flex w-full items-center gap-2 px-3 text-start ${ENGRAVED_FIELD}`}
                    >
                      <span
                        className={`min-w-0 flex-1 truncate text-xs font-bold ${
                          wilaya ? 'text-[#0B1A2B]' : 'text-slate-400'
                        }`}
                      >
                        {selectedWilayaUnit
                          ? `${selectedWilayaUnit.code} — ${
                              lang === 'fr'
                                ? selectedWilayaUnit.nameFr
                                : selectedWilayaUnit.nameAr
                            }`
                          : t('register.neumorphic.select_wilaya')}
                      </span>
                      <MapPin
                        className="size-3.5 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                    </button>

                    {isWilayaOpen && (
                      <div className="absolute top-full z-30 mt-2 w-full rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl">
                        <div className={`relative mb-2 flex h-9 items-center ${ENGRAVED_SOFT}`}>
                          <Search
                            className="mx-2 size-3.5 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            value={wilayaSearch}
                            onChange={(event) => setWilayaSearch(event.target.value)}
                            placeholder={t('register.neumorphic.wilaya_search_placeholder')}
                            className="h-full w-full min-w-0 flex-1 bg-transparent px-1 text-xs placeholder:text-slate-400 focus:outline-none"
                          />
                          {wilayaSearch && (
                            <button
                              type="button"
                              onClick={() => setWilayaSearch('')}
                              aria-label={t('register.neumorphic.clear_search')}
                              className="mx-1.5 text-slate-400 hover:text-slate-600"
                            >
                              <X className="size-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                        <div
                          className="max-h-52 overflow-y-auto"
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
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-xs transition-colors ${
                                    active
                                      ? 'bg-emerald-50 font-black text-emerald-700'
                                      : 'font-bold text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>
                                    {unit.code} —{' '}
                                    {lang === 'fr' ? unit.nameFr : unit.nameAr}
                                  </span>
                                  {active && (
                                    <Check
                                      className="size-3.5 shrink-0"
                                      aria-hidden="true"
                                    />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* البلدية */}
                  <div ref={communeCellRef} className="relative">
                    <span className="mb-1.5 block text-[11px] font-black text-[#0B1A2B]">
                      {t('register.neumorphic.commune')} <span className="text-red-500">*</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCommuneOpen((open) => !open)}
                      onBlur={() => markTouched('commune')}
                      disabled={!wilaya}
                      aria-haspopup="listbox"
                      aria-expanded={isCommuneOpen}
                      className={`relative flex w-full items-center gap-2 px-3 text-start ${ENGRAVED_FIELD} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span
                        className={`min-w-0 flex-1 truncate text-xs font-bold ${
                          commune.trim() ? 'text-[#0B1A2B]' : 'text-slate-400'
                        }`}
                      >
                        {wilaya
                          ? commune.trim() || t('register.neumorphic.select_commune')
                          : t('register.neumorphic.select_wilaya_first')}
                      </span>
                      <Building2
                        className="size-3.5 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                    </button>

                    {isCommuneOpen && wilaya && (
                      <div className="absolute top-full z-30 mt-2 w-full rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl">
                        <div
                          className="max-h-52 overflow-y-auto"
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
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-xs transition-colors ${
                                    active
                                      ? 'bg-emerald-50 font-black text-emerald-700'
                                      : 'font-bold text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{option}</span>
                                  {active && (
                                    <Check
                                      className="size-3.5 shrink-0"
                                      aria-hidden="true"
                                    />
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
              )}
            </div>

            {/* زر الإرسال */}
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-l from-blue-600 to-green-600 text-lg font-bold text-white shadow-[0_16px_30px_rgba(37,99,235,0.28)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  <span>{t('register.neumorphic.submitting')}</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="size-5" aria-hidden="true" />
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

          {/* التذييل */}
          <p className="mt-5 text-center text-xs text-slate-500">
            {t('register.neumorphic.have_account')}{' '}
            <Link href="/login" className="font-black text-emerald-700 hover:underline">
              {t('register.neumorphic.login')}
            </Link>
          </p>
          <div
            className={`mx-auto mt-3 flex max-w-sm items-center justify-center gap-2 px-4 py-2.5 ${ENGRAVED_SOFT}`}
          >
            <ShieldCheck
              className="size-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <p className="text-center text-[10px] font-bold text-slate-500">
              {t('register.neumorphic.privacy')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NeumorphicRegister;
