import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, AlertCircle, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';

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

  // Current Step: 0 = Company, 1 = Representative & Doc, 2 = Account
  const [step, setStep] = useState(0);

  // Form state held purely in React memory (never persisted to localStorage/sessionStorage)
  const [company, setCompany] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [rc, setRc] = useState('');
  const [nif, setNif] = useState('');
  const [nis, setNis] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [address, setAddress] = useState('');

  const [repName, setRepName] = useState('');
  const [repRole, setRepRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
    
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Field errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summaryError, setSummaryError] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;
    return score;
  }, [password]);

  // Validation functions
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (company.trim().length < 2) {
      errs.company = t('register.operator.err.company');
    }
    if (!legalForm) {
      errs.legalForm = t('register.operator.err.form');
    }
    if (!/^[0-9A-Za-z/-]{6,}$/.test(rc.trim())) {
      errs.rc = t('register.operator.err.rc');
    }
    if (!/^\d{9,15}$/.test(nif.trim())) {
      errs.nif = t('register.operator.err.nif');
    }
    if (!/^\d{5,15}$/.test(nis.trim())) {
      errs.nis = t('register.operator.err.nis');
    }
    if (!wilaya) {
      errs.wilaya = t('register.operator.err.wilaya');
    }
    if (address.trim().length < 5) {
      errs.address = t('register.operator.err.address');
    }
    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;
    setSummaryError(!isValid);
    return isValid;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (repName.trim().split(/\s+/).length < 2) {
      errs.repName = t('register.operator.err.rep');
    }
    if (repRole.trim().length < 2) {
      errs.repRole = t('register.operator.err.role');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      errs.email = t('register.operator.err.email');
    }
    if (!/^(?:\+213|0)\d{8,9}$/.test(phone.replace(/[\s.-]/g, ''))) {
      errs.phone = t('register.operator.err.phone');
    }
    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;
    setSummaryError(!isValid);
    return isValid;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!(password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password))) {
      errs.password = t('register.operator.err.pw');
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = t('register.operator.err.pw_match');
    }
    if (!termsAccepted) {
      errs.terms = t('register.operator.err.terms');
    }
    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;
    setSummaryError(!isValid);
    return isValid;
  };

  const handleNext = () => {
    if (step === 0 && validateStep1()) {
      setStep(1);
      setSummaryError(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 1 && validateStep2()) {
      setStep(2);
      setSummaryError(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      setSummaryError(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (validateStep3()) {
      setIsSubmitting(true);
      setServerError(null);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-safaqat-csrf': '1'
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            company: company.trim(),
            repName: repName.trim(),
            phone: phone.trim(),
            wilaya,
            legalForm,
            rc: rc.trim(),
            nif: nif.trim(),
            nis: nis.trim(),
            address: address.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setServerError(data.error || 'فشل التسجيل. يرجى المحاولة لاحقاً.');
          setSummaryError(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // Login user in auth context and navigate to operator workspace
        login(data.user);
        setLocation('/operator');
      } catch {
        setServerError('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.');
        setSummaryError(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const ArrowPrev = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const ArrowNext = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-muted/30 grid grid-cols-1 lg:grid-cols-[380px_1fr]">
      {/* Brand Sidebar */}
      <aside className="bg-gradient-to-b from-navy-900 via-navy-900 to-navy-700 text-white p-8 md:p-10 flex flex-col justify-between gap-8 relative overflow-hidden">
        <div className="space-y-6 relative z-10">
          <div className="border border-gold-500/50 p-4 text-center rounded-sm relative">
            <b className="text-2xl font-extrabold text-white block">
              صفقات <em className="text-gold-500 not-italic">ذكية</em>
            </b>
            <small className="text-xs text-navy-100 block mt-1">بوابة الصفقات العمومية</small>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-white leading-relaxed">
              {t('register.operator.brand.title')}
            </h1>
            <p className="text-xs text-navy-100 leading-relaxed">
              {t('register.operator.brand.desc')}
            </p>
          </div>

          <ul className="space-y-3 text-xs text-navy-100/90 pt-2">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-none mt-1.5" />
              <span>{t('register.operator.brand.point1')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-none mt-1.5" />
              <span>{t('register.operator.brand.point2')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-none mt-1.5" />
              <span>{t('register.operator.brand.point3')}</span>
            </li>
          </ul>

          <div className="pt-4 border-t border-navy-800 text-xs text-navy-200 space-y-1">
            <p className="text-navy-300">{t('register.operator.brand.is_authority')}</p>
            <button
              type="button"
              className="text-gold-400 hover:text-gold-300 font-bold underline cursor-pointer"
              onClick={() => setLocation('/register/authority')}
            >
              {t('register.operator.brand.register_authority')}
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-navy-700 text-xs text-navy-100 flex items-center justify-between relative z-10">
          <span>{t('register.operator.brand.has_account')}</span>
          <button
            type="button"
            className="text-gold-500 hover:text-gold-300 font-bold underline cursor-pointer"
            onClick={() => setLocation('/login')}
          >
            {t('register.operator.brand.login')}
          </button>
        </div>
      </aside>

      {/* Main Form Panel */}
      <main className="p-6 md:p-12 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm space-y-6">
          {!isCompleted ? (
            <>
              {/* Stepper Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2" aria-label="Registration Steps">
                  <div className={`flex items-center gap-2 text-xs font-bold ${step === 0 ? 'text-primary' : step > 0 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 ${step === 0 ? 'border-gold-500 text-gold-700 font-extrabold' : step > 0 ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border text-muted-foreground'}`}>
                      {step > 0 ? <Check className="w-4 h-4" /> : '1'}
                    </span>
                    <span>{t('register.operator.step1.stepper')}</span>
                  </div>

                  <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-primary' : step > 1 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 ${step === 1 ? 'border-gold-500 text-gold-700 font-extrabold' : step > 1 ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border text-muted-foreground'}`}>
                      {step > 1 ? <Check className="w-4 h-4" /> : '2'}
                    </span>
                    <span>{t('register.operator.step2.stepper')}</span>
                  </div>

                  <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 ${step === 2 ? 'border-gold-500 text-gold-700 font-extrabold' : 'border-border text-muted-foreground'}`}>
                      3
                    </span>
                    <span>{t('register.operator.step3.stepper')}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-gold-500 transition-all duration-300"
                    style={{ width: `${((step + 1) / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Summary Error Alert */}
              {summaryError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-none" />
                  <span>{serverError || t('register.operator.err.summary')}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* STEP 1: Company Details */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-navy-900">{t('register.operator.step1.title')}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('register.operator.step1.sub')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Company Name */}
                      <div className="sm:col-span-2 space-y-1">
                        <label htmlFor="company" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.company')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="مثال: شركة المقاولات والبناء الحديث"
                          className={errors.company ? 'border-destructive' : ''}
                        />
                        {errors.company && <p className="text-[11px] text-destructive">{errors.company}</p>}
                      </div>

                      {/* Legal Form */}
                      <div className="space-y-1">
                        <label htmlFor="legalForm" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.form')} <span className="text-destructive">*</span>
                        </label>
                        <select
                          id="legalForm"
                          value={legalForm}
                          onChange={(e) => setLegalForm(e.target.value)}
                          className={`w-full text-xs h-10 px-3 rounded-md border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.legalForm ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">{t('register.operator.field.form_select')}</option>
                          {LEGAL_FORMS.map((f) => (
                            <option key={f.id} value={f.id}>
                              {lang === 'fr' ? f.fr : f.ar}
                            </option>
                          ))}
                        </select>
                        {errors.legalForm && <p className="text-[11px] text-destructive">{errors.legalForm}</p>}
                      </div>

                      {/* RC Number */}
                      <div className="space-y-1">
                        <label htmlFor="rc" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.rc')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="rc"
                          value={rc}
                          onChange={(e) => setRc(e.target.value)}
                          dir="ltr"
                          placeholder="16/00-1234567B22"
                          className={`text-start ${errors.rc ? 'border-destructive' : ''}`}
                        />
                        {errors.rc && <p className="text-[11px] text-destructive">{errors.rc}</p>}
                      </div>

                      {/* NIF */}
                      <div className="space-y-1">
                        <label htmlFor="nif" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.nif')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="nif"
                          value={nif}
                          onChange={(e) => setNif(e.target.value.replace(/\D/g, ''))}
                          dir="ltr"
                          inputMode="numeric"
                          placeholder="000116012345678"
                          className={`text-start ${errors.nif ? 'border-destructive' : ''}`}
                        />
                        {errors.nif && <p className="text-[11px] text-destructive">{errors.nif}</p>}
                      </div>

                      {/* NIS */}
                      <div className="space-y-1">
                        <label htmlFor="nis" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.nis')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="nis"
                          value={nis}
                          onChange={(e) => setNis(e.target.value.replace(/\D/g, ''))}
                          dir="ltr"
                          inputMode="numeric"
                          placeholder="12345678901"
                          className={`text-start ${errors.nis ? 'border-destructive' : ''}`}
                        />
                        {errors.nis && <p className="text-[11px] text-destructive">{errors.nis}</p>}
                      </div>

                      {/* Wilaya (All 58 official Algerian wilayas) */}
                      <div className="space-y-1">
                        <label htmlFor="wilaya" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.wilaya')} <span className="text-destructive">*</span>
                        </label>
                        <select
                          id="wilaya"
                          value={wilaya}
                          onChange={(e) => setWilaya(e.target.value)}
                          className={`w-full text-xs h-10 px-3 rounded-md border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.wilaya ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">{t('register.operator.field.wilaya_select')}</option>
                          {WILAYAS.map((w) => (
                            <option key={w.code} value={w.code}>
                              {w.code} — {lang === 'fr' ? w.fr : w.ar}
                            </option>
                          ))}
                        </select>
                        {errors.wilaya && <p className="text-[11px] text-destructive">{errors.wilaya}</p>}
                      </div>

                      {/* Address */}
                      <div className="space-y-1">
                        <label htmlFor="address" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.address')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="العنوان الكامل للمقر الاجتماعي"
                          className={errors.address ? 'border-destructive' : ''}
                        />
                        {errors.address && <p className="text-[11px] text-destructive">{errors.address}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Legal Representative & Documents */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-navy-900">{t('register.operator.step2.title')}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('register.operator.step2.sub')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Representative Full Name */}
                      <div className="space-y-1">
                        <label htmlFor="repName" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.rep')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="repName"
                          value={repName}
                          onChange={(e) => setRepName(e.target.value)}
                          placeholder="الاسم واللقب الكامل"
                          className={errors.repName ? 'border-destructive' : ''}
                        />
                        {errors.repName && <p className="text-[11px] text-destructive">{errors.repName}</p>}
                      </div>

                      {/* Representative Role */}
                      <div className="space-y-1">
                        <label htmlFor="repRole" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.role')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="repRole"
                          value={repRole}
                          onChange={(e) => setRepRole(e.target.value)}
                          placeholder={t('register.operator.field.role_ph')}
                          className={errors.repRole ? 'border-destructive' : ''}
                        />
                        {errors.repRole && <p className="text-[11px] text-destructive">{errors.repRole}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label htmlFor="email" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.email')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          dir="ltr"
                          placeholder="contact@entreprise.dz"
                          className={`text-start ${errors.email ? 'border-destructive' : ''}`}
                        />
                        <span className="text-[11px] text-muted-foreground block">{t('register.operator.field.email_hint')}</span>
                        {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label htmlFor="phone" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.phone')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          dir="ltr"
                          placeholder="0550123456"
                          className={`text-start ${errors.phone ? 'border-destructive' : ''}`}
                        />
                        {errors.phone && <p className="text-[11px] text-destructive">{errors.phone}</p>}
                      </div>

                      
                    </div>
                  </div>
                )}

                {/* STEP 3: Account Credentials */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-navy-900">{t('register.operator.step3.title')}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('register.operator.step3.sub')}</p>
                    </div>

                    <div className="space-y-4">
                      {/* Password */}
                      <div className="space-y-1">
                        <label htmlFor="pw" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.password')} <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            id="pw"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            dir="ltr"
                            className={`text-start pe-10 ${errors.password ? 'border-destructive' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {/* 4-bar strength meter */}
                        <div className="flex gap-1.5 pt-1" aria-hidden="true">
                          {[1, 2, 3, 4].map((level) => (
                            <span
                              key={level}
                              className={`flex-1 h-1.5 rounded-full transition-colors ${
                                passwordStrength >= level
                                  ? passwordStrength <= 2
                                    ? 'bg-destructive'
                                    : passwordStrength === 3
                                    ? 'bg-gold-500'
                                    : 'bg-emerald-600'
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground block">{t('register.operator.field.password_hint')}</span>
                        {errors.password && <p className="text-[11px] text-destructive">{errors.password}</p>}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1">
                        <label htmlFor="pw2" className="text-xs font-bold text-foreground">
                          {t('register.operator.field.password_confirm')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="pw2"
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          dir="ltr"
                          className={`text-start ${errors.confirmPassword ? 'border-destructive' : ''}`}
                        />
                        {errors.confirmPassword && <p className="text-[11px] text-destructive">{errors.confirmPassword}</p>}
                      </div>

                      {/* Terms Acceptance */}
                      <div className="pt-2">
                        <label className="flex items-start gap-3 cursor-pointer text-xs text-foreground leading-relaxed">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-emerald-600 rounded"
                          />
                          <span>
                            {t('register.operator.field.terms')} <span className="text-destructive">*</span>
                          </span>
                        </label>
                        {errors.terms && <p className="text-[11px] text-destructive mt-1">{errors.terms}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Navigation Actions */}
                <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
                  {step > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrev}
                      className="text-xs font-bold flex items-center gap-2"
                    >
                      <ArrowPrev className="w-4 h-4" />
                      <span>{t('register.operator.btn.prev')}</span>
                    </Button>
                  ) : <div />}

                  {step < 2 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-navy-900 hover:bg-navy-700 text-white text-xs font-bold px-6 py-2 rounded-xl flex items-center gap-2"
                    >
                      <span>{t('register.operator.btn.next')}</span>
                      <ArrowNext className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gold-500 hover:bg-gold-700 text-navy-900 font-extrabold text-xs px-6 py-2 rounded-xl"
                    >
                      {isSubmitting ? 'جاري التسجيل...' : t('register.operator.btn.submit')}
                    </Button>
                  )}
                </div>
              </form>
            </>
          ) : (
            /* Done Box matching redesign */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-navy-900">
                {t('register.operator.done.title')}
              </h2>
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs max-w-lg mx-auto leading-relaxed">
                <strong>تنبيه توضيحي:</strong> {t('register.operator.done.notice')}
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => setLocation('/login')}
                  className="bg-navy-900 hover:bg-navy-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
                >
                  {t('register.operator.done.back_login')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
