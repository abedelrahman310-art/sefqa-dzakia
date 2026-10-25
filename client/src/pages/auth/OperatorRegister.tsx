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
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { RegisterHero } from '@/components/auth/RegisterHero';
import { RegisterRoleTabs, RegisterRole } from '@/components/auth/RegisterRoleTabs';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

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

export const LEGAL_FORMS = [
  { id: 'individual', ar: 'مؤسسة فردية', fr: 'Entreprise individuelle' },
  { id: 'eurl', ar: 'مؤسسة ذات شخص وحيد ومسؤولية محدودة (EURL)', fr: 'EURL' },
  { id: 'sarl', ar: 'شركة ذات مسؤولية محدودة (SARL)', fr: 'SARL' },
  { id: 'spa', ar: 'شركة مساهمة (SPA)', fr: 'SPA' },
  { id: 'snc', ar: 'شركة تضامن (SNC)', fr: 'SNC' },
];

export function OperatorRegister() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  // Primary visible fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [rc, setRc] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Preserved state for backend payload integrity
  const [company] = useState('');
  const [legalForm] = useState('sarl');
  const [nif] = useState('');
  const [nis] = useState('');
  const [address] = useState('');
  const [repRole] = useState('المسير');

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

  // Inline Validation Helpers
  const isEmailValid = useMemo(() => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }, [email]);

  const isPhoneValid = useMemo(() => {
    if (!phone.trim()) return true;
    const clean = phone.replace(/[\s.-]/g, '');
    return /^0[567]\d{8}$/.test(clean);
  }, [phone]);

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
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      wilaya: true,
      rc: true,
      terms: true,
    };
    setTouched(newTouched);

    if (!fullName.trim() || fullName.trim().length < 2) return false;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return false;
    if (!phone.trim() || !/^0[567]\d{8}$/.test(phone.replace(/[\s.-]/g, ''))) return false;
    if (!password || password.length < 8) return false;
    if (password !== confirmPassword) return false;
    if (!wilaya) return false;
    if (!rc.trim()) return false;

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
    const payloadCompany = company.trim() || fullName.trim();
    const payloadAddress = address.trim() || (selectedWilayaObj ? `${selectedWilayaObj.ar} - الجزائر` : 'الجزائر');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'operator',
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          wilaya,
          company: payloadCompany,
          legalForm,
          rc: rc.trim(),
          nif: nif.trim() || rc.trim(),
          nis: nis.trim() || '0000000000',
          address: payloadAddress,
          repRole,
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
        setServerError(msg || 'فشل التسجيل. يرجى مراجعة البيانات والمحاولة مجدداً.');
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
      className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] overflow-x-hidden lg:overflow-hidden select-none font-sans"
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
        <div className="w-full max-w-[540px] space-y-4">
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
            <h2 className="text-2xl sm:text-[28px] font-black text-[#0A2540] tracking-tight leading-tight">
              {t('register.redesign.title')}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#64748b] leading-relaxed">
              {t('register.redesign.sub')}
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

          {/* Registration Form — 3 Visual Cards */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5 pt-1">
            {/* ── CARD 1: Identity Info (بيانات الهوية والممثل) ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <User className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  {t('register.redesign.groups.identity')}
                </h3>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => markTouched('fullName')}
                    placeholder={`${t('register.redesign.full_name')} *`}
                    className={`w-full h-11 pe-11 ps-4 rounded-xl border bg-white text-xs sm:text-sm text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all text-start ${
                      touched.fullName && (!fullName.trim() || fullName.trim().length < 2)
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  <User className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
                {touched.fullName && (!fullName.trim() || fullName.trim().length < 2) && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 ps-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('register.redesign.name_min')}</span>
                  </p>
                )}
              </div>

              {/* Grid: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched('email')}
                      placeholder={`${t('register.redesign.email')} *`}
                      className={`w-full h-11 pe-11 ps-4 rounded-xl border bg-white text-xs sm:text-sm text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all text-start ${
                        touched.email && !isEmailValid
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Mail className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.email && !isEmailValid && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 ps-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{t('register.redesign.email_invalid')}</span>
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => markTouched('phone')}
                      placeholder={`${t('register.redesign.phone')} *`}
                      className={`w-full h-11 pe-11 ps-4 rounded-xl border bg-white text-xs sm:text-sm text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all text-start ${
                        touched.phone && !isPhoneValid
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Phone className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.phone && !isPhoneValid ? (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 ps-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{t('register.redesign.phone_invalid')}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 ps-1">
                      {t('register.redesign.phone_hint')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── CARD 2: Role Details (معلومات النشاط والولاية) ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  {t('register.redesign.groups.role_operator')}
                </h3>
              </div>

              {/* Wilaya Searchable Dropdown */}
              <div className="space-y-1" ref={wilayaRef}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsWilayaOpen(!isWilayaOpen)}
                    onBlur={() => markTouched('wilaya')}
                    className={`w-full h-11 pe-11 ps-10 rounded-xl border bg-white text-xs sm:text-sm text-start flex items-center justify-between transition-all focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 cursor-pointer ${
                      touched.wilaya && !wilaya
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    } ${!wilaya ? 'text-[#9ca3af]' : 'text-[#0B1A2B] font-medium'}`}
                  >
                    <span>
                      {selectedWilayaObj
                        ? `${selectedWilayaObj.code} — ${lang === 'fr' ? selectedWilayaObj.fr : selectedWilayaObj.ar}`
                        : `${t('register.redesign.wilaya')} *`}
                    </span>
                  </button>
                  <MapPin className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  <ChevronDown
                    className={`absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] transition-transform duration-200 pointer-events-none ${
                      isWilayaOpen ? 'rotate-180 text-[#0A2540]' : ''
                    }`}
                  />
                </div>

                {/* Combobox Dropdown Menu */}
                {isWilayaOpen && (
                  <div className="relative z-30">
                    <div className="absolute top-1 start-0 end-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2 max-h-60 overflow-hidden flex flex-col">
                      <div className="relative">
                        <input
                          type="text"
                          value={wilayaSearch}
                          onChange={(e) => setWilayaSearch(e.target.value)}
                          placeholder="ابحث برقم الولاية أو اسمها..."
                          className="w-full h-9 pe-9 ps-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-[#0B1A2B] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0A2540]"
                          autoFocus
                        />
                        <Search className="absolute end-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        {wilayaSearch && (
                          <button
                            type="button"
                            onClick={() => setWilayaSearch('')}
                            className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto max-h-48 divide-y divide-slate-100 text-xs">
                        {filteredWilayas.length === 0 ? (
                          <div className="py-3 text-center text-slate-400 text-xs">
                            لا توجد ولاية مطابقة للبحث
                          </div>
                        ) : (
                          filteredWilayas.map((w) => (
                            <button
                              key={w.code}
                              type="button"
                              onClick={() => {
                                setWilaya(w.code);
                                setIsWilayaOpen(false);
                                setWilayaSearch('');
                              }}
                              className={`w-full text-start py-2 px-3 rounded-md hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer ${
                                wilaya === w.code
                                  ? 'bg-[#0A2540]/10 text-[#0A2540] font-bold'
                                  : 'text-slate-700'
                              }`}
                            >
                              <span>
                                {w.code} — {lang === 'fr' ? w.fr : w.ar}
                              </span>
                              {wilaya === w.code && (
                                <Check className="w-3.5 h-3.5 text-[#0A2540]" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {touched.wilaya && !wilaya && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 ps-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('register.redesign.wilaya_required')}</span>
                  </p>
                )}
              </div>

              {/* Commercial Register / Tax ID */}
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="text"
                    value={rc}
                    onChange={(e) => setRc(e.target.value)}
                    onBlur={() => markTouched('rc')}
                    placeholder={`${t('register.redesign.rc_nif')} *`}
                    className={`w-full h-11 pe-11 ps-4 rounded-xl border bg-white text-xs sm:text-sm text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all text-start ${
                      touched.rc && !rc.trim()
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  <Building2 className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
                {touched.rc && !rc.trim() && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 ps-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('register.redesign.rc_required')}</span>
                  </p>
                )}
              </div>
            </div>

            {/* ── CARD 3: Security & Credentials (الأمان وبيانات الدخول) ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Lock className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  {t('register.redesign.groups.security')}
                </h3>
              </div>

              {/* Grid: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password with Strength Meter */}
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => markTouched('password')}
                      placeholder={`${t('register.redesign.password')} *`}
                      className={`w-full h-11 pe-11 ps-10 rounded-xl border bg-white text-xs sm:text-sm text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all text-start ${
                        touched.password && (!password || password.length < 8)
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Lock className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#0A2540] focus:outline-none"
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password Strength Meter */}
                  <PasswordStrengthMeter password={password} />
                  {touched.password && (!password || password.length < 8) && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 ps-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{t('register.redesign.password_min')}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password with Live Match Indicator */}
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => markTouched('confirmPassword')}
                      placeholder={`${t('register.redesign.password_confirm')} *`}
                      className={`w-full h-11 pe-11 ps-10 rounded-xl border bg-white text-xs sm:text-sm text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all text-start ${
                        passwordsMatch === false && confirmPassword.length > 0
                          ? 'border-red-500 bg-red-50/20'
                          : passwordsMatch === true && confirmPassword.length >= 8
                          ? 'border-emerald-500'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Lock className="absolute end-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#0A2540] focus:outline-none"
                      aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-time Match Feedback */}
                  {confirmPassword.length > 0 && (
                    <div className="ps-1 pt-0.5">
                      {passwordsMatch ? (
                        <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>{t('register.redesign.password_match')}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{t('register.redesign.password_mismatch')}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox: Terms & Privacy with Shake on Error */}
              <div
                className={`pt-1 transition-all rounded-lg p-1.5 ${
                  shakeTerms ? 'animate-shake bg-red-50/60 border border-red-300' : ''
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#4b5563] leading-relaxed">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) setShakeTerms(false);
                    }}
                    className="mt-0.5 w-[18px] h-[18px] rounded border-[#0A2540] text-[#0A2540] accent-[#0A2540] cursor-pointer"
                  />
                  <span>
                    {t('register.redesign.terms_prefix')}{' '}
                    <a
                      href="#terms"
                      onClick={(e) => e.preventDefault()}
                      className="text-[#0A2540] font-bold hover:underline"
                    >
                      {t('register.redesign.terms_link')}
                    </a>{' '}
                    {t('register.redesign.terms_and')}{' '}
                    <a
                      href="#privacy"
                      onClick={(e) => e.preventDefault()}
                      className="text-[#0A2540] font-bold hover:underline"
                    >
                      {t('register.redesign.privacy_link')}
                    </a>{' '}
                    {t('register.redesign.terms_suffix')}
                  </span>
                </label>
                {touched.terms && !termsAccepted && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 ps-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('register.redesign.terms_required')}</span>
                  </p>
                )}
              </div>
            </div>

            {/* ── Submit Button (3 States: idle, loading, success) ── */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className={`w-full h-[52px] rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-90 ${
                  isSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#0A2540] hover:bg-[#071d33] active:scale-[0.99]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('register.redesign.submitting')}</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <Check className="w-5 h-5 text-white animate-bounce" />
                    <span>{t('register.redesign.success')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>{t('register.redesign.submit')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider "أو" */}
            <div className="relative flex items-center justify-center py-0.5">
              <div className="w-full border-t border-[#e2e8f0]" />
              <span className="absolute px-3 bg-[#f8fafc] text-xs text-[#94a3b8] font-medium">
                {t('register.redesign.or')}
              </span>
            </div>

            {/* Google Registration Button */}
            <button
              type="button"
              onClick={() => {}}
              className="w-full h-11 rounded-xl border border-[#cbd5e1] bg-white hover:bg-slate-50 text-[#334155] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-colors shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('register.redesign.google')}</span>
            </button>

            {/* Bottom Link: Already have an account? */}
            <div className="text-center pt-1 text-xs text-[#64748b]">
              <span>{t('register.redesign.has_account')}</span>{' '}
              <Link href="/login" className="text-[#0A2540] font-bold hover:underline">
                {t('register.redesign.login')}
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default OperatorRegister;
