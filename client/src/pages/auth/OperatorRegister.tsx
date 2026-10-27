import { useState, useMemo, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useLocation, Link } from 'wouter';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  ChevronDown,
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Search,
  X,
  FileText,
  Hash,
  Printer,
} from 'lucide-react';
import { RegisterHero } from '@/components/auth/RegisterHero';
import { RegisterRoleTabs, RegisterRole } from '@/components/auth/RegisterRoleTabs';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { getCommunesForWilaya } from '@safaqat/shared/territorial';

export const WILAYAS = [
  { code: '01', ar: 'أدرار', fr: 'Adrar' },
  { code: '02', ar: 'الشلف', fr: 'Chlef' },
  { code: '03', ar: 'الأغواط', fr: 'Laghouat' },
  { code: '04', ar: 'أم البواقي', fr: 'Oum El Bouaghi' },
  { code: '05', ar: 'باتنة', fr: 'Batna' },
  { code: '06', ar: 'بجاية', fr: 'Béjaïa' },
  { code: '07', ar: 'بسكرة', fr: 'Biskra' },
  { code: '08', ar: 'بشار', fr: 'Béchar' },
  { code: '09', ar: 'البليدة', fr: 'Blida' },
  { code: '10', ar: 'البويرة', fr: 'Bouira' },
  { code: '11', ar: 'تمنراست', fr: 'Tamanrasset' },
  { code: '12', ar: 'تبسة', fr: 'Tébessa' },
  { code: '13', ar: 'تلمسان', fr: 'Tlemcen' },
  { code: '14', ar: 'تيارت', fr: 'Tiaret' },
  { code: '15', ar: 'تيزي وزو', fr: 'Tizi Ouzou' },
  { code: '16', ar: 'الجزائر', fr: 'Alger' },
  { code: '17', ar: 'الجلفة', fr: 'Djelfa' },
  { code: '18', ar: 'جيجل', fr: 'Jijel' },
  { code: '19', ar: 'سطيف', fr: 'Sétif' },
  { code: '20', ar: 'سعيدة', fr: 'Saïda' },
  { code: '21', ar: 'سكيكدة', fr: 'Skikda' },
  { code: '22', ar: 'سيدي بلعباس', fr: 'Sidi Bel Abbès' },
  { code: '23', ar: 'عنابة', fr: 'Annaba' },
  { code: '24', ar: 'قالمة', fr: 'Guelma' },
  { code: '25', ar: 'قسنطينة', fr: 'Constantine' },
  { code: '26', ar: 'المدية', fr: 'Médéa' },
  { code: '27', ar: 'مستغانم', fr: 'Mostaganem' },
  { code: '28', ar: 'المسيلة', fr: "M'Sila" },
  { code: '29', ar: 'معسكر', fr: 'Mascara' },
  { code: '30', ar: 'ورقلة', fr: 'Ouargla' },
  { code: '31', ar: 'وهران', fr: 'Oran' },
  { code: '32', ar: 'البيض', fr: 'El Bayadh' },
  { code: '33', ar: 'إليزي', fr: 'Illizi' },
  { code: '34', ar: 'برج بوعريريج', fr: 'Bordj Bou Arreridj' },
  { code: '35', ar: 'بومرداس', fr: 'Boumerdès' },
  { code: '36', ar: 'الطارف', fr: 'El Tarf' },
  { code: '37', ar: 'تندوف', fr: 'Tindouf' },
  { code: '38', ar: 'تيسمسيلت', fr: 'Tissemsilt' },
  { code: '39', ar: 'الوادي', fr: 'El Oued' },
  { code: '40', ar: 'خنشلة', fr: 'Khenchela' },
  { code: '41', ar: 'سوق أهراس', fr: 'Souk Ahras' },
  { code: '42', ar: 'تيبازة', fr: 'Tipaza' },
  { code: '43', ar: 'ميلة', fr: 'Mila' },
  { code: '44', ar: 'عين الدفلى', fr: 'Aïn Defla' },
  { code: '45', ar: 'النعامة', fr: 'Naâma' },
  { code: '46', ar: 'عين تموشنت', fr: 'Aïn Témouchent' },
  { code: '47', ar: 'غرداية', fr: 'Ghardaïa' },
  { code: '48', ar: 'غليزان', fr: 'Relizane' },
  { code: '49', ar: 'تيميمون', fr: 'Timimoun' },
  { code: '50', ar: 'برج باجي مختار', fr: 'Bordj Badji Mokhtar' },
  { code: '51', ar: 'أولاد جلال', fr: 'Ouled Djellal' },
  { code: '52', ar: 'بني عباس', fr: 'Béni Abbès' },
  { code: '53', ar: 'عين صالح', fr: 'In Salah' },
  { code: '54', ar: 'عين قزام', fr: 'In Guezzam' },
  { code: '55', ar: 'تقرت', fr: 'Touggourt' },
  { code: '56', ar: 'جانت', fr: 'Djanet' },
  { code: '57', ar: 'المغير', fr: "El M'Ghair" },
  { code: '58', ar: 'المنيعة', fr: 'El Meniaa' },
];

export const OPERATOR_LEGAL_FORMS = [
  { id: 'sarl', ar: 'شركة ذات مسؤولية محدودة (SARL)', fr: 'SARL' },
  { id: 'eurl', ar: 'مؤسسة ذات شخص وحيد وذات مسؤولية محدودة (EURL)', fr: 'EURL' },
  { id: 'spa', ar: 'شركة مساهمة (SPA)', fr: 'SPA' },
  { id: 'snc', ar: 'شركة تضامن (SNC)', fr: 'SNC' },
  { id: 'individual', ar: 'مؤسسة فردية (شخص طبيعي)', fr: 'Entreprise individuelle' },
  { id: 'groupement', ar: 'تجمع مؤقت لمؤسسات (Groupement)', fr: 'Groupement momentané' },
  { id: 'startup', ar: 'مؤسسة ناشئة حائزة على علامة (Label Startup)', fr: 'Startup labellisée' },
  { id: 'other', ar: 'شكل قانوني آخر', fr: 'Autre forme juridique' },
];

export function OperatorRegister() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  // 1. البيانات القانونية والجبائية للمؤسسة (الملحق 2)
  const [fullName, setFullName] = useState('');
  const [legalForm, setLegalForm] = useState('sarl');
  const [nif, setNif] = useState('');
  const [rc, setRc] = useState('');
  const [nin, setNin] = useState('');

  // 2. المقر الاجتماعي والعنوان
  const [address, setAddress] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // 3. معلومات الاتصال المهنية
  const [phone, setPhone] = useState('');
  const [fax, setFax] = useState('');
  const [email, setEmail] = useState('');

  // 4. معلومات الشخص المفوض
  const [delegateName, setDelegateName] = useState('');
  const [delegatePhone, setDelegatePhone] = useState('');
  const [delegateEmail, setDelegateEmail] = useState('');

  // 5. الأمان وكلمة المرور
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [centralNotice, setCentralNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeTerms, setShakeTerms] = useState(false);

  // Searchable Wilaya combobox
  const [isWilayaOpen, setIsWilayaOpen] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState('');
  const wilayaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wilayaRef.current && !wilayaRef.current.contains(event.target as Node)) {
        setIsWilayaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredWilayas = useMemo(() => {
    if (!wilayaSearch.trim()) return WILAYAS;
    const q = wilayaSearch.toLowerCase().trim();
    return WILAYAS.filter(
      (w) =>
        w.code.includes(q) ||
        w.ar.includes(q) ||
        w.fr.toLowerCase().includes(q)
    );
  }, [wilayaSearch]);

  const selectedWilayaObj = useMemo(
    () => WILAYAS.find((w) => w.code === wilaya),
    [wilaya]
  );

  const availableCommunes = useMemo(
    () => getCommunesForWilaya(wilaya),
    [wilaya]
  );

  // Inline Validation Helpers
  const isEmailValid = useMemo(() => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }, [email]);

  const isDelegateEmailValid = useMemo(() => {
    if (!delegateEmail.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(delegateEmail.trim());
  }, [delegateEmail]);

  const isPhoneValid = useMemo(() => {
    if (!phone.trim()) return true;
    const clean = phone.replace(/[\s.-]/g, '');
    return /^0\d{8,9}$/.test(clean);
  }, [phone]);

  const isDelegatePhoneValid = useMemo(() => {
    if (!delegatePhone.trim()) return true;
    const clean = delegatePhone.replace(/[\s.-]/g, '');
    return /^0\d{8,9}$/.test(clean);
  }, [delegatePhone]);

  const isPostalCodeValid = useMemo(() => {
    if (!postalCode.trim()) return true;
    return /^\d{4,5}$/.test(postalCode.trim());
  }, [postalCode]);

  const isNifValid = useMemo(() => {
    if (!nif.trim()) return true;
    return nif.trim().length >= 8;
  }, [nif]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateAll = (): boolean => {
    const newTouched = {
      fullName: true,
      legalForm: true,
      nif: true,
      rc: true,
      nin: true,
      address: true,
      wilaya: true,
      commune: true,
      postalCode: true,
      phone: true,
      fax: true,
      email: true,
      delegateName: true,
      delegatePhone: true,
      delegateEmail: true,
      password: true,
      confirmPassword: true,
      terms: true,
    };
    setTouched(newTouched);

    if (!fullName.trim() || fullName.trim().length < 2) return false;
    if (!legalForm.trim()) return false;
    if (!nif.trim() || nif.trim().length < 8) return false;
    if (!rc.trim()) return false;
    if (!nin.trim()) return false;
    if (!address.trim() || address.trim().length < 3) return false;
    if (!wilaya) return false;
    if (!commune.trim()) return false;
    if (!postalCode.trim() || !isPostalCodeValid) return false;
    if (!phone.trim() || !isPhoneValid) return false;
    if (!fax.trim()) return false;
    if (!email.trim() || !isEmailValid) return false;
    if (!delegateName.trim() || delegateName.trim().length < 2) return false;
    if (!delegatePhone.trim() || !isDelegatePhoneValid) return false;
    if (!delegateEmail.trim() || !isDelegateEmailValid) return false;
    if (!password || password.length < 8) return false;
    if (password !== confirmPassword) return false;

    if (!termsAccepted) {
      setShakeTerms(true);
      setTimeout(() => setShakeTerms(false), 500);
      return false;
    }

    return true;
  };

  const handleRoleSelect = (role: RegisterRole) => {
    if (role === 'central') {
      setCentralNotice(true);
    } else if (role === 'authority') {
      setLocation('/register/authority');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);
    const fullAddress = `${address.trim()} - ${commune.trim()} - ${selectedWilayaObj ? selectedWilayaObj.ar : wilaya} (${postalCode.trim()})`;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'operator',
          fullName: fullName.trim(),
          company: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          fax: fax.trim(),
          password,
          wilaya,
          commune: commune.trim(),
          municipality: commune.trim(),
          postalCode: postalCode.trim(),
          address: fullAddress,
          legalForm,
          rc: rc.trim(),
          nif: nif.trim(),
          nin: nin.trim(),
          delegateName: delegateName.trim(),
          delegatePhone: delegatePhone.trim(),
          delegateEmail: delegateEmail.trim(),
          repRole: 'المفوض قانوناً',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || data.detail;
        if (!msg && typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          const val = data[firstKey];
          msg = Array.isArray(val) ? val.join(' ') : String(val);
        }
        setServerError(msg || 'فشل التسجيل. يرجى مراجعة البيانات الإلزامية والمحاولة مجدداً.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      login(data.user, { access: data.access, refresh: data.refresh });
      setTimeout(() => {
        setLocation('/operator');
      }, 1000);
    } catch (err: any) {
      setServerError(err?.message || 'تعذر الاتصال بالخادم. يرجى التأكد من تشغيل الخدمة والمحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div
      className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] overflow-x-hidden lg:overflow-hidden select-none font-['Cairo',sans-serif]"
      dir={dir}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      {/* ═══ 1. Hero Section (Right in RTL, 45% width) ═══ */}
      <div className="w-full lg:w-[45%] h-auto lg:h-full shrink-0">
        <RegisterHero />
      </div>

      {/* ═══ 2. Form Section (Left in RTL, 55% width) ═══ */}
      <main className="w-full lg:w-[55%] h-full flex flex-col justify-start items-center px-4 sm:px-8 lg:px-12 py-6 lg:py-8 overflow-y-auto">
        <div className="w-full max-w-[560px] space-y-4">
          {/* Top navigation link */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0A2540] transition-colors"
            >
              <BackArrow className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>{t('register.redesign.back_home')}</span>
            </Link>
          </div>

          {/* Header Title & Subtitle */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#0A2540] tracking-tight leading-tight">
              إنشاء حساب متعامل اقتصادي
            </h2>
            <p className="text-xs text-[#64748b] leading-relaxed">
              يرجى إدخال جميع البيانات القانونية والجبائية الإلزامية للمؤسسة وفق المعايير الوزارية المعتمدة.
            </p>
          </div>

          {/* Central Admin Information Notice */}
          {centralNotice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs flex items-start gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{t('register.redesign.central_notice')}</span>{' '}
                <Link href="/login" className="font-bold underline text-[#0A2540]">
                  {t('register.redesign.login')}
                </Link>
              </div>
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 text-xs flex items-center gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Role Tabs */}
          <RegisterRoleTabs
            activeRole="operator"
            onSelectRole={handleRoleSelect}
          />

          {/* Registration Form — Structured Cards */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
            {/* ── CARD 1: الهوية القانونية والجبائية للمؤسسة ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  1. البيانات القانونية والجبائية للمؤسسة
                </h3>
              </div>

              {/* التسمية الاجتماعية / الاسم الكامل */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#0A2540]">
                  التسمية الاجتماعية أو الاسم الكامل للمتعامل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => markTouched('fullName')}
                    placeholder="مثال: شركة الأشغال والبناء الجزائرية SARL"
                    className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all ${
                      touched.fullName && (!fullName.trim() || fullName.trim().length < 2)
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  <Building2 className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
                {touched.fullName && (!fullName.trim() || fullName.trim().length < 2) && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 ps-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>التسمية الاجتماعية أو الاسم الكامل إلزامي (حرفين على الأقل).</span>
                  </p>
                )}
              </div>

              {/* الشكل القانوني للمؤسسة */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#0A2540]">
                  الشكل القانوني للمؤسسة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={legalForm}
                    onChange={(e) => setLegalForm(e.target.value)}
                    onBlur={() => markTouched('legalForm')}
                    className="w-full h-10 pe-10 ps-3.5 rounded-xl border border-[#e2e8f0] bg-white text-xs text-[#0B1A2B] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all appearance-none cursor-pointer"
                  >
                    {OPERATOR_LEGAL_FORMS.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.ar}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
              </div>

              {/* الأرقام الجبائية والرسمية: NIF, RC, NIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* NIF */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    رقم التعريف الجبائي (NIF) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nif}
                      onChange={(e) => setNif(e.target.value)}
                      onBlur={() => markTouched('nif')}
                      placeholder="NIF (15 رقماً)"
                      className={`w-full h-10 pe-8 ps-2.5 rounded-xl border bg-white text-xs font-mono text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.nif && (!nif.trim() || !isNifValid)
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Hash className="absolute end-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.nif && (!nif.trim() || !isNifValid) && (
                    <p className="text-[10px] text-red-600">رقم NIF إلزامي (8 أرقام على الأقل)</p>
                  )}
                </div>

                {/* RC */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    رقم السجل التجاري <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={rc}
                      onChange={(e) => setRc(e.target.value)}
                      onBlur={() => markTouched('rc')}
                      placeholder="رقم السجل التجاري"
                      className={`w-full h-10 pe-8 ps-2.5 rounded-xl border bg-white text-xs font-mono text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.rc && !rc.trim()
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <FileText className="absolute end-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.rc && !rc.trim() && (
                    <p className="text-[10px] text-red-600">رقم السجل التجاري إلزامي</p>
                  )}
                </div>

                {/* NIN */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    التعريف الوطني (NIN) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={nin}
                      onChange={(e) => setNin(e.target.value)}
                      onBlur={() => markTouched('nin')}
                      placeholder="رقم التعريف الوطني"
                      className={`w-full h-10 pe-8 ps-2.5 rounded-xl border bg-white text-xs font-mono text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.nin && !nin.trim()
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Hash className="absolute end-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.nin && !nin.trim() && (
                    <p className="text-[10px] text-red-600">رقم NIN إلزامي</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── CARD 2: المقر الاجتماعي والعنوان الجغرافي ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  2. عنوان المقر الاجتماعي
                </h3>
              </div>

              {/* عنوان المقر الاجتماعي */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#0A2540]">
                  عنوان المقر الاجتماعي المفصل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={() => markTouched('address')}
                    placeholder="الحي، الشارع، رقم المبنى..."
                    className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all ${
                      touched.address && (!address.trim() || address.trim().length < 3)
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  <MapPin className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
                {touched.address && (!address.trim() || address.trim().length < 3) && (
                  <p className="text-[10px] text-red-600">عنوان المقر الاجتماعي إلزامي.</p>
                )}
              </div>

              {/* شبكة: الولاية، البلدية، الرمز البريدي */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Wilaya Combobox */}
                <div className="space-y-1" ref={wilayaRef}>
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    الولاية <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsWilayaOpen(!isWilayaOpen)}
                      onBlur={() => markTouched('wilaya')}
                      className={`w-full h-10 pe-8 ps-7 rounded-xl border bg-white text-xs text-start flex items-center justify-between transition-all focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 cursor-pointer ${
                        touched.wilaya && !wilaya
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      } ${!wilaya ? 'text-[#9ca3af]' : 'text-[#0B1A2B] font-medium'}`}
                    >
                      <span className="truncate">
                        {selectedWilayaObj
                          ? `${selectedWilayaObj.code} — ${lang === 'fr' ? selectedWilayaObj.fr : selectedWilayaObj.ar}`
                          : 'اختر الولاية'}
                      </span>
                    </button>
                    <MapPin className="absolute end-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] pointer-events-none" />
                    <ChevronDown
                      className={`absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] transition-transform duration-200 pointer-events-none ${
                        isWilayaOpen ? 'rotate-180 text-[#0A2540]' : ''
                      }`}
                    />
                  </div>

                  {isWilayaOpen && (
                    <div className="relative z-30">
                      <div className="absolute top-1 start-0 end-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2 max-h-56 overflow-hidden flex flex-col">
                        <div className="relative">
                          <input
                            type="text"
                            value={wilayaSearch}
                            onChange={(e) => setWilayaSearch(e.target.value)}
                            placeholder="ابحث برقم الولاية أو اسمها..."
                            className="w-full h-8 pe-8 ps-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-[#0B1A2B] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0A2540]"
                            autoFocus
                          />
                          <Search className="absolute end-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          {wilayaSearch && (
                            <button
                              type="button"
                              onClick={() => setWilayaSearch('')}
                              className="absolute start-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="overflow-y-auto max-h-40 divide-y divide-slate-100 text-xs">
                          {filteredWilayas.length === 0 ? (
                            <div className="py-2.5 text-center text-slate-400 text-xs">
                              لا توجد ولاية مطابقة
                            </div>
                          ) : (
                            filteredWilayas.map((w) => (
                              <button
                                key={w.code}
                                type="button"
                                onClick={() => {
                                  setWilaya(w.code);
                                  setCommune('');
                                  setIsWilayaOpen(false);
                                  setWilayaSearch('');
                                }}
                                className={`w-full text-start py-1.5 px-2.5 rounded-md hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer ${
                                  wilaya === w.code
                                    ? 'bg-[#0A2540]/10 text-[#0A2540] font-bold'
                                    : 'text-slate-700'
                                }`}
                              >
                                <span>
                                  {w.code} — {lang === 'fr' ? w.fr : w.ar}
                                </span>
                                {wilaya === w.code && (
                                  <Check className="w-3 h-3 text-[#0A2540]" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {touched.wilaya && !wilaya && (
                    <p className="text-[10px] text-red-600">الولاية إلزامية</p>
                  )}
                </div>

                {/* Commune / Municipality */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    البلدية <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    onBlur={() => markTouched('commune')}
                    disabled={!wilaya}
                    aria-label="البلدية"
                    className={`w-full h-10 px-3 rounded-xl border bg-white text-xs text-[#0B1A2B] font-['Cairo',sans-serif] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                      touched.commune && !commune.trim()
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  >
                    {!wilaya ? (
                      <option value="">اختر الولاية أولاً</option>
                    ) : (
                      <>
                        <option value="">اختر البلدية</option>
                        {availableCommunes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {touched.commune && !commune.trim() && (
                    <p className="text-[10px] text-red-600">البلدية إلزامية</p>
                  )}
                </div>

                {/* Postal Code */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    الرمز البريدي <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    onBlur={() => markTouched('postalCode')}
                    placeholder="مثال: 16000"
                    maxLength={5}
                    className={`w-full h-10 px-3 rounded-xl border bg-white text-xs font-mono text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                      touched.postalCode && (!postalCode.trim() || !isPostalCodeValid)
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  {touched.postalCode && (!postalCode.trim() || !isPostalCodeValid) && (
                    <p className="text-[10px] text-red-600">رمز بريدي صحيح إلزامي</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── CARD 3: الاتصال المهني للمؤسسة ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <Phone className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  3. معلومات الاتصال المهنية
                </h3>
              </div>

              {/* البريد الإلكتروني المهني */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#0A2540]">
                  البريد الإلكتروني المهني للشركة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => markTouched('email')}
                    placeholder="contact@enterprise.dz"
                    className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all ${
                      touched.email && (!email.trim() || !isEmailValid)
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
                {touched.email && (!email.trim() || !isEmailValid) && (
                  <p className="text-[10px] text-red-600">بريد إلكتروني مهني صحيح إلزامي.</p>
                )}
              </div>

              {/* الهاتف والفاكس */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    الهاتف المهني <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => markTouched('phone')}
                      placeholder="021 XX XX XX / 0550 XX XX XX"
                      className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs font-mono text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.phone && (!phone.trim() || !isPhoneValid)
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Phone className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.phone && (!phone.trim() || !isPhoneValid) && (
                    <p className="text-[10px] text-red-600">رقم هاتف مهني صحيح إلزامي</p>
                  )}
                </div>

                {/* Fax */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    رقم الفاكس <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      onBlur={() => markTouched('fax')}
                      placeholder="021 XX XX XX"
                      className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs font-mono text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.fax && !fax.trim()
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Printer className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.fax && !fax.trim() && (
                    <p className="text-[10px] text-red-600">رقم الفاكس إلزامي وفق الملحق 2</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── CARD 4: معلومات الشخص المفوض ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <User className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  4. معلومات الشخص المفوض قانوناً
                </h3>
              </div>

              {/* اسم ولقب المفوض */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#0A2540]">
                  الاسم واللقب للشخص المفوض <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={delegateName}
                    onChange={(e) => setDelegateName(e.target.value)}
                    onBlur={() => markTouched('delegateName')}
                    placeholder="الاسم واللقب الكامل للمسير أو الوكيل المفوض"
                    className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                      touched.delegateName && (!delegateName.trim() || delegateName.trim().length < 2)
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  <User className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
                {touched.delegateName && (!delegateName.trim() || delegateName.trim().length < 2) && (
                  <p className="text-[10px] text-red-600">اسم ولقب الشخص المفوض إلزامي</p>
                )}
              </div>

              {/* هاتف وبريد المفوض */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Delegate Phone */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    هاتف الشخص المفوض <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={delegatePhone}
                      onChange={(e) => setDelegatePhone(e.target.value)}
                      onBlur={() => markTouched('delegatePhone')}
                      placeholder="06XX XX XX XX"
                      className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs font-mono text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.delegatePhone && (!delegatePhone.trim() || !isDelegatePhoneValid)
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Phone className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.delegatePhone && (!delegatePhone.trim() || !isDelegatePhoneValid) && (
                    <p className="text-[10px] text-red-600">رقم هاتف الشخص المفوض إلزامي</p>
                  )}
                </div>

                {/* Delegate Email */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    البريد الإلكتروني للمفوض <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={delegateEmail}
                      onChange={(e) => setDelegateEmail(e.target.value)}
                      onBlur={() => markTouched('delegateEmail')}
                      placeholder="delegate@enterprise.dz"
                      className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.delegateEmail && (!delegateEmail.trim() || !isDelegateEmailValid)
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.delegateEmail && (!delegateEmail.trim() || !isDelegateEmailValid) && (
                    <p className="text-[10px] text-red-600">بريد إلكتروني صحيح للمفوض إلزامي</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── CARD 5: الأمان وبيانات الدخول ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <Lock className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  5. الأمان وكلمة المرور
                </h3>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => markTouched('password')}
                      placeholder="8 محارف على الأقل"
                      className={`w-full h-10 pe-10 ps-9 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.password && (!password || password.length < 8)
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#0A2540]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.password && (!password || password.length < 8) && (
                    <p className="text-[10px] text-red-600">كلمة المرور يجب ألا تقل عن 8 محارف</p>
                  )}
                  {password && <PasswordStrengthMeter password={password} />}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    تأكيد كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => markTouched('confirmPassword')}
                      placeholder="أعد إدخال كلمة المرور"
                      className={`w-full h-10 pe-10 ps-9 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.confirmPassword && passwordsMatch === false
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute start-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#0A2540]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.confirmPassword && passwordsMatch === false && (
                    <p className="text-[10px] text-red-600">كلمات المرور غير متطابقة</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and declaration checkbox */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                shakeTerms ? 'animate-shake border-red-500 bg-red-50/20' : 'border-slate-200 bg-white'
              }`}
            >
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0A2540] focus:ring-[#0A2540]"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  أصرح بشرفي بصحة ودقة جميع المعلومات والبيانات المصرح بها أعلاه وفق أحكام القانون رقم 23-12 المتعلق بالصفقات العمومية والملحق 2 لقرار وزارة المالية المؤرخ في 4 فبراير 2026، وأوافق على{' '}
                  <span className="text-[#1e3a8a] font-bold underline">شروط الاستخدام وميثاق النزاهة الرقمية</span>. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="w-full h-11 rounded-xl bg-[#0A2540] hover:bg-[#1e3a8a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل وتوثيق الحساب...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم التسجيل بنجاح! جاري التوجيه...</span>
                </>
              ) : (
                <span>تأكيد التسجيل وإنشاء حساب المتعامل الاقتصادي</span>
              )}
            </button>

            {/* Footer: Already have an account? */}
            <div className="pt-2 text-center text-xs text-slate-500">
              لديك حساب بالفعل في المنصة؟{' '}
              <Link href="/login" className="font-bold text-[#0A2540] hover:underline">
                تسجيل الدخول
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
