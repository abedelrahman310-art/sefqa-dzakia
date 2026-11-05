import React, { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, Redirect } from 'wouter';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Logo } from '@/components/ui/Logo';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { REGISTRY_69W, getCommunesForWilaya } from '@safaqat/shared/territorial';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
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

export function UnifiedAuthPage({ initialMode = 'operator' }: UnifiedAuthPageProps) {
  const { lang, dir, setLang, t } = useI18n();
  const [location, setLocation] = useLocation();
  const { login, user, status } = useAuth();

  // 1. تحديد النمط الحالي (تسجيل متعامل / تسجيل مصلحة / تسجيل الدخول)
  const [mode, setMode] = useState<AuthMode>(() => {
    if (location.includes('/register/authority')) return 'authority';
    if (location.includes('/register/operator') || location.includes('/register')) return 'operator';
    if (location === '/login') return 'login';
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
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // الحالة العامة
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // قوائم الولايات والبلديات
  const [isWilayaOpen, setIsWilayaOpen] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState('');
  const [isCommuneOpen, setIsCommuneOpen] = useState(false);
  const [communeSearch, setCommuneSearch] = useState('');
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

  // فهرس وطني كامل للبلديات الـ 1,541 يربط كل بلدية بولايتها لتسهيل البحث الشامل
  const nationalCommunesIndex = useMemo(() => {
    const list: { commune: string; wilayaCode: string; wilayaNameAr: string; wilayaNameFr: string }[] = [];
    for (const unit of wilayaUnits) {
      const comms = getCommunesForWilaya(unit.code);
      for (const c of comms) {
        list.push({
          commune: c,
          wilayaCode: unit.code,
          wilayaNameAr: unit.nameAr,
          wilayaNameFr: unit.nameFr,
        });
      }
    }
    return list;
  }, [wilayaUnits]);

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

  // البلديات المصفاة للولاية أو لكل التراب الوطني عند البحث
  const filteredCommunes = useMemo(() => {
    const q = communeSearch.trim().toLowerCase();
    if (wilaya) {
      if (!q) return availableCommunes;
      return availableCommunes.filter((c) => c.toLowerCase().includes(q));
    }
    // لم يتم تحديد ولاية مسبقاً -> بحث وطني فوري
    if (!q) return [];
    return nationalCommunesIndex
      .filter(
        (item) =>
          item.commune.toLowerCase().includes(q) ||
          item.wilayaNameAr.includes(q) ||
          item.wilayaCode.includes(q)
      )
      .slice(0, 40);
  }, [wilaya, communeSearch, availableCommunes, nationalCommunesIndex]);

  const toggleWilaya = () => {
    setIsWilayaOpen((open) => {
      const next = !open;
      if (next) {
        setIsCommuneOpen(false);
        setWilayaSearch('');
      }
      return next;
    });
  };

  const toggleCommune = () => {
    setIsCommuneOpen((open) => {
      const next = !open;
      if (next) {
        setIsWilayaOpen(false);
        setCommuneSearch('');
      }
      return next;
    });
  };

  const handleSelectWilaya = (code: string) => {
    setWilaya(code);
    setCommune('');
    setCommuneSearch('');
    setIsWilayaOpen(false);
    setWilayaSearch('');
    markTouched('wilaya');
  };

  const handleSelectCommune = (communeName: string, parentWilayaCode?: string) => {
    setCommune(communeName);
    if (parentWilayaCode && parentWilayaCode !== wilaya) {
      setWilaya(parentWilayaCode);
      markTouched('wilaya');
    }
    setIsCommuneOpen(false);
    setCommuneSearch('');
    markTouched('commune');
  };

  // الحسابات التجريبية السريعة
  const isDemoLoginEnabled =
    import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' ||
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.onrender.com')));

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

  const isAr = lang === 'ar';

  // نصوص متغيرة بحسب الدور واللغة
  const orgLabel =
    mode === 'operator'
      ? (isAr ? 'اسم الشركة أو المؤسسة' : 'Nom de l\'entreprise / société')
      : (isAr ? 'اسم الهيئة أو المصلحة' : 'Nom du service contractant');

  const orgPlaceholder =
    mode === 'operator'
      ? (isAr ? 'مؤسسة الأشغال العامة SARL' : 'Entreprise des travaux publics SARL')
      : (isAr ? 'مديرية التجهيزات العمومية' : 'Direction des équipements publics');

  // التحقق من الحقول
  const valueError = (name: FieldName): string | null => {
    switch (name) {
      case 'fullName':
        return fullName.trim().length < 2
          ? (isAr ? 'الاسم الكامل مطلوب (حرفان على الأقل)' : 'Le nom complet est requis (2 caractères minimum)')
          : null;
      case 'organization':
        return organization.trim().length < 2
          ? (isAr ? `${orgLabel} مطلوب` : `${orgLabel} est requis`)
          : null;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(regEmail.trim())
          ? null
          : (isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Veuillez saisir une adresse e-mail valide');
      case 'phone': {
        const clean = phone.replace(/[\s.-]/g, '');
        return /^(0[5-7]\d{8}|0[1-4]\d{7}|0\d{8,9})$/.test(clean) || /^[5-7]\d{8}$/.test(clean)
          ? null
          : (isAr ? 'رقم هاتف صحيح مطلوب (مثال: 0512345678)' : 'Numéro de téléphone valide requis (ex. : 0512345678)');
      }
      case 'password':
        return regPassword.length < 8
          ? (isAr ? 'كلمة المرور 8 محارف على الأقل' : 'Le mot de passe doit contenir au moins 8 caractères')
          : null;
      case 'confirmPassword':
        if (!confirmPassword) return isAr ? 'يرجى تأكيد كلمة المرور' : 'Veuillez confirmer le mot de passe';
        return regPassword === confirmPassword
          ? null
          : (isAr ? 'كلمتا المرور غير متطابقتين' : 'Les mots de passe ne correspondent pas');
      case 'wilaya':
        return wilaya ? null : (isAr ? 'يرجى اختيار الولاية' : 'Veuillez choisir une wilaya');
      case 'commune':
        return commune.trim() ? null : (isAr ? 'يرجى اختيار البلدية' : 'Veuillez choisir une commune');
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
      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600 animate-in fade-in-50">
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
            ? (isAr ? 'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال' : 'Impossible de contacter le serveur. Vérifiez votre connexion')
            : (isAr ? 'فشل تسجيل الدخول. تحقق من صحة البريد وكلمة المرور' : 'Échec de la connexion. Vérifiez votre e-mail et votre mot de passe'));
        throw new Error(errorMsg);
      }

      login(data.user, { access: data.access, refresh: data.refresh });
      if (data.user.role === 'operator') setLocation('/operator');
      else if (data.user.role === 'authority') setLocation('/authority');
      else if (data.user.role === 'central_admin') setLocation('/central');
    } catch (err: any) {
      setServerError(err.message || (isAr ? 'فشل تسجيل الدخول' : 'Échec de la connexion'));
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
        setServerError(message || (isAr ? 'فشل التسجيل. يرجى مراجعة البيانات المدخلة' : 'Échec de l\'inscription. Veuillez vérifier les informations saisies'));
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
      setServerError(isAr ? 'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال' : 'Impossible de contacter le serveur. Vérifiez votre connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRtl = dir === 'rtl';
  const isLoginMode = mode === 'login';

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-10 min-h-screen w-full bg-slate-50 font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-white"
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
        .animate-antigravity-float {
          animation: antigravity-float 4.5s ease-in-out infinite;
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════════
          اللوحة الجانبية (Brand Panel): تمثل بالضبط 30% على الشاشات الكبيرة (lg:col-span-3)
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:col-span-3 flex-col justify-center items-center bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100 p-8 relative overflow-hidden border-e border-slate-200/80 min-h-screen">
        {/* هالات الإضاءة الخلفية الناعمة */}
        <div
          className="absolute -top-24 -start-24 size-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -end-24 size-80 rounded-full bg-[#0f3154]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* الشعار الوطني والهوية المؤسسية في المنتصف */}
        <div className="w-full text-center relative z-10 flex flex-col items-center justify-center my-auto py-12">
          <span className="inline-block rounded-full border border-slate-200/80 bg-white/90 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-2xs mb-8">
            {isAr ? 'الجمهورية الجزائرية الديمقراطية الشعبية' : 'République Algérienne Démocratique et Populaire'}
          </span>

          {/* الشعار الوطني الفاخر في المنتصف مع تأثير الطفو */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-4 rounded-full bg-emerald-500/15 blur-2xl opacity-80 group-hover:opacity-100 transition duration-500" />
              <div className="relative animate-antigravity-float">
                <Logo size={130} className="drop-shadow-md" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-black text-[#0f3154] tracking-tight">
            {isAr ? 'صفقات ذكية' : 'Safaqat Dzakia'}
          </h1>
          <p className="mt-2 text-sm font-bold text-emerald-800">
            {isAr ? 'المنظومة الموحدة للصفقات العمومية' : 'Plateforme unifiée des marchés publics'}
          </p>
          <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
            {isAr
              ? 'المنظومة الرقمية السيادية المعتمدة وفق أحكام القانون 23-12 والمرسوم الرئاسي 15-247'
              : 'Système numérique souverain régi par la Loi 23-12 et le Décret présidentiel 15-247'}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          نموذج التسجيل / المصادقة (Form Panel): يمثل بالضبط 70% على الشاشات الكبيرة (lg:col-span-7)
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex lg:col-span-7 flex-col justify-between bg-white p-6 sm:p-8 md:p-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl">
          {/* شريط الإجراءات العلوي: العودة للرئيسية + حالة النظام + تبديل اللغة */}
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 transition-colors hover:text-emerald-700"
            >
              {isRtl ? (
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              ) : (
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              )}
              <span>{isAr ? 'الصفحة الرئيسية' : 'Retour à l\'accueil'}</span>
            </Link>

            <div className="flex items-center gap-3">
              {/* مؤشر الربط السيادي */}
              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 sm:flex">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                <span>{isAr ? 'الربط السيادي نشط' : 'Système en ligne'}</span>
              </div>

              {/* زر تبديل اللغة */}
              <button
                type="button"
                onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-white hover:text-emerald-700 cursor-pointer"
                aria-label="تبديل اللغة / Changer de langue"
              >
                <Globe className="size-3.5 text-slate-500" aria-hidden="true" />
                <span>{lang === 'ar' ? 'Français' : 'العربية'}</span>
              </button>
            </div>
          </div>

          {/* ─── في وضع إنشاء الحساب (التسجيل) ─── */}
          {!isLoginMode ? (
            <div>
              {/* رأس القسم: واضح ودقيق */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      {mode === 'operator'
                        ? (isAr ? 'فضاء المتعاملين الاقتصاديين' : 'Espace Opérateurs Économiques')
                        : (isAr ? 'فضاء المصالح المتعاقدة' : 'Espace Services Contractants')}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                      {mode === 'operator'
                        ? (isAr ? 'إنشاء حساب متعامل اقتصادي جديد' : 'Créer un compte opérateur économique')
                        : (isAr ? 'إنشاء حساب مصلحة متعاقدة جديدة' : 'Créer un compte service contractant')}
                    </h2>
                  </div>

                  {/* رابط التحويل لتسجيل الدخول */}
                  <div className="text-end">
                    <span className="block text-xs text-slate-500">{isAr ? 'لديك حساب مسجل؟' : 'Déjà inscrit ?'}</span>
                    <button
                      type="button"
                      onClick={() => handleModeChange('login')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      {isAr ? 'تسجيل الدخول ←' : 'Se connecter →'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'operator'
                    ? (isAr
                        ? 'سجّل مؤسستك للمشاركة في الصفقات العمومية، تحميل دفاتر الشروط، وإيداع العروض المشفرة'
                        : 'Inscrivez votre entreprise pour soumissionner aux marchés publics, télécharger les cahiers des charges et déposer vos offres chiffrées')
                    : (isAr
                        ? 'سجّل هيئتك أو إدارتك العمومية لنشر دفاتر الشروط وإدارة لجان فتح الأظرفة وتقييم العروض'
                        : 'Inscrivez votre administration pour publier les cahiers des charges et gérer l\'évaluation des offres')}
                </p>
              </div>

              {/* اختيار صفة التسجيل (متعامل اقتصادي أم مصلحة متعاقدة) */}
              <div className="mb-6">
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  {isAr ? 'اختر صفة الحساب المراد إنشاؤه:' : 'Sélectionnez le type de compte à créer :'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* كارت المتعامل الاقتصادي */}
                  <button
                    type="button"
                    onClick={() => handleModeChange('operator')}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-start transition-all duration-200 cursor-pointer ${
                      mode === 'operator'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        mode === 'operator'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {isAr ? 'متعامل اقتصادي' : 'Opérateur économique'}
                        </span>
                        {mode === 'operator' && (
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {isAr
                          ? 'للشركات والمقاولين والموردين والمكاتب الاستشارية'
                          : 'Pour les entreprises, entrepreneurs, fournisseurs et bureaux d\'études'}
                      </p>
                    </div>
                  </button>

                  {/* كارت المصلحة المتعاقدة */}
                  <button
                    type="button"
                    onClick={() => handleModeChange('authority')}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-start transition-all duration-200 cursor-pointer ${
                      mode === 'authority'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        mode === 'authority'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      <Landmark className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {isAr ? 'مصلحة متعاقدة' : 'Service contractant'}
                        </span>
                        {mode === 'authority' && (
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {isAr
                          ? 'للوزارات والولايات والبلديات والمؤسسات العمومية'
                          : 'Pour les ministères, wilayas, communes et établissements publics'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* تنبيه رسالة الخطأ من الخادم */}
              {serverError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-800 animate-in fade-in-50">
                  <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* تنبيه رسالة النجاح */}
              {isSuccess && (
                <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 animate-in fade-in-50">
                  <Check className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{isAr ? 'تم إنشاء الحساب بنجاح! جارٍ التوجيه للفضاء الخاص بك...' : 'Compte créé avec succès ! Redirection en cours...'}</span>
                </div>
              )}

              {/* استمارة التسجيل */}
              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
                {/* 1. الاسم الكامل + اسم المؤسسة أو المصلحة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* الاسم الكامل */}
                  <div>
                    <label htmlFor="reg-fullname" className="mb-1 block text-xs font-bold text-slate-800">
                      {isAr ? 'الاسم الكامل للمسؤول أو المفوض' : 'Nom complet du responsable ou mandataire'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                      <User className="ms-3 size-4 shrink-0 text-slate-400 group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => markTouched('fullName')}
                        placeholder={isAr ? 'محمد بن عبد الله' : 'ex. Mohamed Benali'}
                        autoComplete="name"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <FieldError name="fullName" />
                  </div>

                  {/* اسم المؤسسة أو الهيئة */}
                  <div>
                    <label htmlFor="reg-org" className="mb-1 block text-xs font-bold text-slate-800">
                      {orgLabel} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                      {mode === 'operator' ? (
                        <Briefcase className="ms-3 size-4 shrink-0 text-slate-400 group-focus-within:text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Landmark className="ms-3 size-4 shrink-0 text-slate-400 group-focus-within:text-emerald-600" aria-hidden="true" />
                      )}
                      <input
                        id="reg-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        onBlur={() => markTouched('organization')}
                        placeholder={orgPlaceholder}
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <FieldError name="organization" />
                  </div>
                </div>

                {/* 2. الهاتف والبريد الإلكتروني */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* رقم الهاتف الجزائري — بدون كود دولي وبدون علم */}
                  <div>
                    <label htmlFor="reg-phone" className="mb-1 block text-xs font-bold text-slate-800">
                      {isAr ? 'رقم الهاتف' : 'Numéro de téléphone'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                      <Phone className="ms-3 size-4 shrink-0 text-slate-400 group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-phone"
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => markTouched('phone')}
                        placeholder="0550123456"
                        autoComplete="tel"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <FieldError name="phone" />
                  </div>

                  {/* البريد الإلكتروني المهني */}
                  <div>
                    <label htmlFor="reg-email" className="mb-1 block text-xs font-bold text-slate-800">
                      {isAr ? 'البريد الإلكتروني المهني' : 'Adresse e-mail professionnelle'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                      <Mail className="ms-3 size-4 shrink-0 text-slate-400 group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-email"
                        type="email"
                        dir="ltr"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        onBlur={() => markTouched('email')}
                        placeholder="contact@entreprise.dz"
                        autoComplete="email"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <FieldError name="email" />
                  </div>
                </div>

                {/* 3. كلمة المرور وتأكيدها */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* كلمة المرور */}
                  <div>
                    <label htmlFor="reg-password" className="mb-1 block text-xs font-bold text-slate-800">
                      {isAr ? 'كلمة المرور' : 'Mot de passe'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                      <Lock className="ms-3 size-4 shrink-0 text-slate-400 group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        onBlur={() => markTouched('password')}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="me-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showRegPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FieldError name="password" />
                    <div className="mt-1.5">
                      <PasswordStrengthMeter password={regPassword} />
                    </div>
                  </div>

                  {/* تأكيد كلمة المرور */}
                  <div>
                    <label htmlFor="reg-confirm-password" className="mb-1 block text-xs font-bold text-slate-800">
                      {isAr ? 'تأكيد كلمة المرور' : 'Confirmation du mot de passe'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                      <Lock className="ms-3 size-4 shrink-0 text-slate-400 group-focus-within:text-emerald-600" aria-hidden="true" />
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => markTouched('confirmPassword')}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="me-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FieldError name="confirmPassword" />
                  </div>
                </div>

                {/* 4. النطاق الإقليمي (الولاية والبلدية) */}
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-3.5">
                  <div className="mb-2.5 flex items-center justify-between text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-4 text-emerald-600" aria-hidden="true" />
                      <span>{isAr ? 'النطاق الإقليمي والمقر الإداري (الولاية والبلدية)' : 'Périmètre territorial et siège administratif (Wilaya et Commune)'}</span>
                    </div>
                    {wilaya && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {selectedWilayaUnit?.code} — {lang === 'fr' ? selectedWilayaUnit?.nameFr : selectedWilayaUnit?.nameAr}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* اختيار الولاية */}
                    <div ref={wilayaCellRef} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="reg-wilaya-btn" className="block text-xs font-bold text-slate-700">
                          {isAr ? 'الولاية' : 'Wilaya'} <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isAr ? '69 ولاية ودائرة منتدبة' : '69 wilayas et circonscriptions'}
                        </span>
                      </div>

                      <button
                        id="reg-wilaya-btn"
                        type="button"
                        onClick={toggleWilaya}
                        aria-haspopup="listbox"
                        aria-expanded={isWilayaOpen}
                        className={`flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 text-xs font-semibold shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all ${
                          touched.wilaya && !wilaya
                            ? 'border-rose-400 ring-2 ring-rose-500/10'
                            : 'border-slate-200'
                        } text-slate-800`}
                      >
                        <span className="truncate">
                          {selectedWilayaUnit ? (
                            <span className="font-bold text-slate-900">
                              {selectedWilayaUnit.code} — {lang === 'fr' ? selectedWilayaUnit.nameFr : selectedWilayaUnit.nameAr}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {isAr ? 'اختر الولاية...' : 'Sélectionnez la wilaya...'}
                            </span>
                          )}
                        </span>
                        <ChevronDown className={`size-4 text-slate-400 transition-transform ${isWilayaOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isWilayaOpen && (
                        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in-50">
                          <div className="p-2 border-b border-slate-100 bg-slate-50/60">
                            <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 shadow-2xs">
                              <Search className="size-3.5 text-slate-400 shrink-0" />
                              <input
                                type="text"
                                value={wilayaSearch}
                                onChange={(e) => setWilayaSearch(e.target.value)}
                                placeholder={isAr ? 'ابحث برقم الولاية أو اسمها...' : 'Rechercher par code ou nom de wilaya...'}
                                className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
                                autoFocus
                              />
                              {wilayaSearch && (
                                <button
                                  type="button"
                                  onClick={() => setWilayaSearch('')}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                  aria-label={isAr ? 'تفريغ البحث' : 'Effacer la recherche'}
                                >
                                  <X className="size-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto p-1" role="listbox">
                            {filteredWilayas.length === 0 ? (
                              <div className="py-6 px-4 text-center">
                                <p className="text-xs font-bold text-slate-600">
                                  {isAr ? `لا توجد ولاية مطابقة لـ "${wilayaSearch}"` : `Aucune wilaya ne correspond à "${wilayaSearch}"`}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setWilayaSearch('')}
                                  className="mt-2 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                                >
                                  {isAr ? 'عرض كافة الولايات (69)' : 'Afficher toutes les wilayas (69)'}
                                </button>
                              </div>
                            ) : (
                              filteredWilayas.map((unit) => (
                                <button
                                  key={unit.code}
                                  type="button"
                                  role="option"
                                  aria-selected={wilaya === unit.code}
                                  onClick={() => handleSelectWilaya(unit.code)}
                                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-start text-xs font-medium cursor-pointer transition-colors ${
                                    wilaya === unit.code
                                      ? 'bg-emerald-50 font-bold text-emerald-800'
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{unit.code} — {lang === 'fr' ? unit.nameFr : unit.nameAr}</span>
                                  {wilaya === unit.code && <Check className="size-3.5 text-emerald-600" />}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                      <FieldError name="wilaya" />
                    </div>

                    {/* اختيار البلدية */}
                    <div ref={communeCellRef} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="reg-commune-btn" className="block text-xs font-bold text-slate-700">
                          {isAr ? 'البلدية' : 'Commune'} <span className="text-rose-500">*</span>
                        </label>
                        {wilaya && (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            {isAr ? `${availableCommunes.length} بلدية مسجلة` : `${availableCommunes.length} communes enregistrées`}
                          </span>
                        )}
                      </div>

                      <button
                        id="reg-commune-btn"
                        type="button"
                        onClick={toggleCommune}
                        aria-haspopup="listbox"
                        aria-expanded={isCommuneOpen}
                        className={`flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 text-xs font-semibold shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer transition-all ${
                          touched.commune && !commune.trim()
                            ? 'border-rose-400 ring-2 ring-rose-500/10'
                            : 'border-slate-200 hover:border-slate-300'
                        } ${!wilaya && !commune ? 'text-slate-500' : 'text-slate-800'}`}
                      >
                        <span className="truncate">
                          {commune ? (
                            <span className="font-bold text-slate-900">{commune}</span>
                          ) : wilaya ? (
                            <span className="text-slate-600">
                              {isAr ? 'اختر البلدية من القائمة...' : 'Sélectionnez la commune dans la liste...'}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {isAr ? 'اختر البلدية (أو ابحث مباشرة)...' : 'Sélectionnez la commune (ou recherchez directement)...'}
                            </span>
                          )}
                        </span>
                        <ChevronDown
                          className={`size-4 text-slate-400 transition-transform ${
                            isCommuneOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isCommuneOpen && (
                        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in-50">
                          {/* شريط البحث في البلديات */}
                          <div className="p-2 border-b border-slate-100 bg-slate-50/60">
                            <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 shadow-2xs">
                              <Search className="size-3.5 text-slate-400 shrink-0" />
                              <input
                                type="text"
                                value={communeSearch}
                                onChange={(e) => setCommuneSearch(e.target.value)}
                                placeholder={
                                  selectedWilayaUnit
                                    ? (isAr ? `ابحث في بلديات ${selectedWilayaUnit.nameAr}...` : `Rechercher dans les communes de ${selectedWilayaUnit.nameFr}...`)
                                    : (isAr ? 'ابحث عن أي بلدية في الجزائر...' : 'Rechercher une commune en Algérie...')
                                }
                                className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
                                autoFocus
                              />
                              {communeSearch && (
                                <button
                                  type="button"
                                  onClick={() => setCommuneSearch('')}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                  aria-label={isAr ? 'تفريغ البحث' : 'Effacer la recherche'}
                                >
                                  <X className="size-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* محتوى القائمة */}
                          <div className="max-h-48 overflow-y-auto p-1" role="listbox">
                            {wilaya ? (
                              // حالة 1: الولاية محددة
                              (filteredCommunes as string[]).length === 0 ? (
                                <div className="py-6 px-4 text-center">
                                  <MapPin className="size-5 text-slate-300 mx-auto mb-1.5" />
                                  <p className="text-xs font-bold text-slate-600">
                                    {isAr ? `لا توجد بلدية مطابقة لـ "${communeSearch}"` : `Aucune commune ne correspond à "${communeSearch}"`}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {isAr
                                      ? `تأكد من كتابة الاسم أو انقر لمسح البحث لعرض كل بلديات ${selectedWilayaUnit?.nameAr}`
                                      : `Vérifiez l'orthographe ou effacez la recherche pour afficher toutes les communes de ${selectedWilayaUnit?.nameFr}`}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setCommuneSearch('')}
                                    className="mt-2 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                                  >
                                    {isAr ? `إظهار كل بلديات الولاية (${availableCommunes.length})` : `Afficher toutes les communes de la wilaya (${availableCommunes.length})`}
                                  </button>
                                </div>
                              ) : (
                                (filteredCommunes as string[]).map((comm) => {
                                  const isSelected = commune === comm;
                                  return (
                                    <button
                                      key={comm}
                                      type="button"
                                      role="option"
                                      aria-selected={isSelected}
                                      onClick={() => handleSelectCommune(comm)}
                                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-start text-xs font-medium cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-emerald-50 font-bold text-emerald-800'
                                          : 'text-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span>{comm}</span>
                                      {isSelected && <Check className="size-3.5 text-emerald-600" />}
                                    </button>
                                  );
                                })
                              )
                            ) : (
                              // حالة 2: لم يتم اختيار ولاية بعد
                              !communeSearch.trim() ? (
                                <div className="p-4 text-center">
                                  <MapPin className="size-6 text-emerald-500/60 mx-auto mb-2" />
                                  <p className="text-xs font-bold text-slate-800 mb-1">
                                    {isAr ? 'تحديد البلدية والمقر الإداري' : 'Sélection de la commune et siège administratif'}
                                  </p>
                                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                                    {isAr
                                      ? 'يمكنك اختيار الولاية أولاً لتصفية بلدياتها المعتمدة، أو البدء بكتابة اسم بلديتك في شريط البحث أعلاه وسنقوم بربط الولاية تلقائياً'
                                      : 'Vous pouvez choisir la wilaya pour filtrer les communes, ou taper le nom de la commune pour lier la wilaya automatiquement.'}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsCommuneOpen(false);
                                      setIsWilayaOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors"
                                  >
                                    <span>{isAr ? 'اختر الولاية أولاً' : 'Choisir la wilaya d\'abord'}</span>
                                    <ArrowLeft className="size-3" />
                                  </button>
                                </div>
                              ) : (filteredCommunes as { commune: string; wilayaCode: string; wilayaNameAr: string; wilayaNameFr?: string }[]).length === 0 ? (
                                <div className="py-6 px-4 text-center">
                                  <p className="text-xs font-bold text-slate-600">
                                    {isAr ? `لا توجد بلدية مطابقة لـ "${communeSearch}"` : `Aucune commune ne correspond à "${communeSearch}"`}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {isAr ? 'جرّب البحث بدون همزات أو اختر الولاية من القائمة المجاورة' : 'Essayez une autre recherche ou sélectionnez la wilaya'}
                                  </p>
                                </div>
                              ) : (
                                (filteredCommunes as { commune: string; wilayaCode: string; wilayaNameAr: string; wilayaNameFr?: string }[]).map((item) => {
                                  const isSelected = commune === item.commune && wilaya === item.wilayaCode;
                                  return (
                                    <button
                                      key={`${item.wilayaCode}-${item.commune}`}
                                      type="button"
                                      role="option"
                                      aria-selected={isSelected}
                                      onClick={() => handleSelectCommune(item.commune, item.wilayaCode)}
                                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-start text-xs font-medium cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-emerald-50 font-bold text-emerald-800'
                                          : 'text-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">{item.commune}</span>
                                        <span className="text-[10px] rounded-md bg-slate-100 text-slate-500 px-1.5 py-0.5">
                                          {item.wilayaCode} - {lang === 'fr' ? (item.wilayaNameFr || item.wilayaNameAr) : item.wilayaNameAr}
                                        </span>
                                      </div>
                                      {isSelected && <Check className="size-3.5 text-emerald-600" />}
                                    </button>
                                  );
                                })
                              )
                            )}
                          </div>
                        </div>
                      )}
                      <FieldError name="commune" />
                    </div>
                  </div>
                </div>

                {/* الموافقة على الشروط */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-medium text-slate-600 leading-tight">
                      {isAr ? 'أشهد بصحة كافة البيانات المدخلة وأوافق على' : 'J\'atteste de l\'exactitude des informations et j\'accepte les'}{' '}
                      <Link href="/terms" className="font-bold text-emerald-700 hover:underline">
                        {isAr ? 'شروط الاستخدام' : 'conditions d\'utilisation'}
                      </Link>{' '}
                      {isAr
                        ? 'والمطابقة لمنظومة الصفقات العمومية وفق القانون 23-12 والمرسوم الرئاسي 15-247'
                        : 'et la conformité au cadre des marchés publics selon la Loi 23-12 et le Décret présidentiel 15-247'}
                    </span>
                  </label>
                </div>

                {/* زر الإرسال الرئيسي */}
                <button
                  type="submit"
                  disabled={isSubmitting || !acceptedTerms}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#006233] via-[#059669] to-[#0f3154] text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-75 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{isAr ? 'جارٍ إنشاء الحساب وتجهيز الفضاء...' : 'Création du compte en cours...'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" />
                      <span>{isAr ? 'تأكيد تسجيل الحساب' : 'Confirmer l\'inscription'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* التذييل في أسفل نموذج التسجيل */}
              <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                {isAr ? 'لديك حساب مسجل بالفعل؟' : 'Vous possédez déjà un compte ?'}{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  {isAr ? 'تسجيل الدخول إلى فضاء عملك' : 'Se connecter à votre espace'}
                </button>
              </div>
            </div>
          ) : (
            /* ─── في وضع تسجيل الدخول (Login Mode) ─── */
            <div>
              {/* رأس القسم */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      {isAr ? 'بوابة الدخول الموحدة' : 'Portail d\'accès unifié'}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                      {isAr ? 'تسجيل الدخول إلى حسابك' : 'Connexion à votre compte'}
                    </h2>
                  </div>

                  {/* رابط التحويل لإنشاء حساب */}
                  <div className="text-end">
                    <span className="block text-xs text-slate-500">{isAr ? 'مستخدم جديد؟' : 'Nouvel utilisateur ?'}</span>
                    <button
                      type="button"
                      onClick={() => handleModeChange('operator')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      {isAr ? 'إنشاء حساب ←' : 'Créer un compte →'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'أدخل بريدك الإلكتروني المهني المعتمد وكلمة المرور للوصول إلى فضاء عملك'
                    : 'Saisissez votre e-mail professionnel et votre mot de passe pour accéder à votre espace'}
                </p>
              </div>

              {/* تنبيه رسالة الخطأ */}
              {serverError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-800 animate-in fade-in-50">
                  <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* نموذج تسجيل الدخول */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* البريد الإلكتروني */}
                <div>
                  <label htmlFor="login-email" className="mb-1 block text-xs font-bold text-slate-800">
                    {isAr ? 'البريد الإلكتروني المهني' : 'Adresse e-mail professionnelle'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="group relative flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                    <Mail className="ms-3 size-4 shrink-0 text-slate-400 group-focus-within:text-emerald-600" aria-hidden="true" />
                    <input
                      id="login-email"
                      type="email"
                      dir="ltr"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={isAr ? 'admin@safaqat.dz أو user@entreprise.dz' : 'admin@safaqat.dz ou user@entreprise.dz'}
                      required
                      autoComplete="email"
                      className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* كلمة المرور */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor="login-password" className="text-xs font-bold text-slate-800">
                      {isAr ? 'كلمة المرور' : 'Mot de passe'} <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="group relative flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10">
                    <Lock className="ms-3 size-4 shrink-0 text-slate-400 group-focus-within:text-emerald-600" aria-hidden="true" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="me-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* أزرار الحسابات التجريبية السريعة للتطوير والمعاينة */}
                {isDemoLoginEnabled && (
                  <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 transition-all">
                    <span className="mb-2 block text-[11px] font-bold text-slate-600">
                      {isAr ? 'حسابات المعاينة السريعة (Demo Accounts):' : 'Comptes de démonstration rapide (Demo Accounts) :'}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => fillTestAccount('authority@safaqat.dz')}
                        className="truncate rounded-lg bg-white border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-700 cursor-pointer transition-colors"
                      >
                        {isAr ? 'مصلحة متعاقدة' : 'Service contractant'}
                      </button>
                      <button
                        type="button"
                        onClick={() => fillTestAccount('operator@safaqat.dz')}
                        className="truncate rounded-lg bg-white border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-700 cursor-pointer transition-colors"
                      >
                        {isAr ? 'متعامل اقتصادي' : 'Opérateur économique'}
                      </button>
                      <button
                        type="button"
                        onClick={() => fillTestAccount('admin@safaqat.dz')}
                        className="truncate rounded-lg bg-white border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-700 cursor-pointer transition-colors"
                      >
                        {isAr ? 'إدارة مركزية' : 'Administration centrale'}
                      </button>
                    </div>
                    <div className="mt-2 text-center text-[10px] text-slate-500">
                      {isAr ? 'كلمة المرور لجميع الحسابات:' : 'Mot de passe commun :'}{' '}
                      <span className="font-bold tabular-nums text-emerald-800 select-all">Safaqat@2026</span>
                    </div>
                  </div>
                )}

                {/* زر تسجيل الدخول */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#006233] via-[#059669] to-[#0f3154] text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-75 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{isAr ? 'جاري التحقق...' : 'Vérification en cours...'}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="size-4" />
                      <span>{isAr ? 'تسجيل الدخول' : 'Se connecter'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* التذييل في أسفل نموذج الدخول */}
              <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                {isAr ? 'ليس لديك حساب بعد؟' : 'Pas encore de compte ?'}{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('operator')}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  {isAr ? 'إنشاء حساب جديد كمتعامل أو مصلحة' : 'Créer un compte opérateur ou administration'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnifiedAuthPage;
