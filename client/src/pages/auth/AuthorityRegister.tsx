import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, AlertCircle, Eye, EyeOff, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { WILAYAS } from './OperatorRegister';

export const AUTHORITY_CATEGORIES = [
  { id: 'ministry', ar: 'إدارة مركزية / وزارة / هيئة دستورية', fr: 'Administration centrale / Ministère / Institution constitutionnelle' },
  { id: 'wilaya', ar: 'ولاية (جماعة محلية)', fr: 'Wilaya (Collectivité locale)' },
  { id: 'commune', ar: 'بلدية (جماعة محلية)', fr: 'Commune (Collectivité locale)' },
  { id: 'deconcentrated', ar: 'مديرية ولائية تنفيذية / مصلحة غير ممركزة', fr: 'Direction de wilaya / Service déconcentré' },
  { id: 'epa', ar: 'مؤسسة عمومية ذات طابع إداري (EPA)', fr: 'Établissement Public à Caractère Administratif (EPA)' },
  { id: 'epic', ar: 'مؤسسة عمومية صناعية وتجارية (EPIC)', fr: 'Établissement Public Industriel et Commercial (EPIC)' },
  { id: 'university', ar: 'مؤسسة جامعية أو بحث علمي (EPST / EPCSCP)', fr: 'Établissement Universitaire ou de Recherche (EPST / EPCSCP)' },
  { id: 'other', ar: 'هيئة عمومية أخرى', fr: 'Autre organisme public' },
];

export function AuthorityRegister() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();

  // Current Step: 0 = Public Body, 1 = Ordonnateur & Docs, 2 = Account
  const [step, setStep] = useState(0);

  // Form state held purely in React memory (never persisted to localStorage/sessionStorage)
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [tutelle, setTutelle] = useState('');
  const [code, setCode] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [address, setAddress] = useState('');

  const [repName, setRepName] = useState('');
  const [repRole, setRepRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [docName, setDocName] = useState('');
  const [docValid, setDocValid] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Field errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summaryError, setSummaryError] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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
    if (!category) {
      errs.category = t('register.authority.err.category');
    }
    if (name.trim().length < 2) {
      errs.name = t('register.authority.err.name');
    }
    if (tutelle.trim().length < 2) {
      errs.tutelle = t('register.authority.err.tutelle');
    }
    if (code.trim().length < 3) {
      errs.code = t('register.authority.err.code');
    }
    if (!wilaya) {
      errs.wilaya = t('register.authority.err.wilaya');
    }
    if (address.trim().length < 5) {
      errs.address = t('register.authority.err.address');
    }
    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;
    setSummaryError(!isValid);
    return isValid;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (repName.trim().split(/\s+/).length < 2) {
      errs.repName = t('register.authority.err.rep');
    }
    if (repRole.trim().length < 2) {
      errs.repRole = t('register.authority.err.role');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      errs.email = t('register.authority.err.email');
    }
    if (!/^(?:\+213|00213|0)[5-79]\d{8}$/.test(phone.trim().replace(/[\s-]/g, '')) && phone.trim().length < 9) {
      errs.phone = t('register.authority.err.phone');
    }
    if (!docValid || !docName) {
      errs.doc = t('register.authority.err.doc_req');
    }
    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;
    setSummaryError(!isValid);
    return isValid;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      errs.password = t('register.authority.err.pw');
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = t('register.authority.err.pw_match');
    }
    if (!termsAccepted) {
      errs.terms = t('register.authority.err.terms');
    }
    setErrors(errs);
    const isValid = Object.keys(errs).length === 0;
    setSummaryError(!isValid);
    return isValid;
  };

  const handleNext = () => {
    if (step === 0 && validateStep1()) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 1 && validateStep2()) {
      setStep(2);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setDocName('');
      setDocValid(false);
      return;
    }

    if (!/\.(pdf|png|jpe?g)$/i.test(file.name)) {
      setErrors((prev) => ({ ...prev, doc: t('register.authority.err.doc_format') }));
      setDocName(file.name);
      setDocValid(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, doc: t('register.authority.err.doc_size') }));
      setDocName(file.name);
      setDocValid(false);
      return;
    }

    setDocName(file.name);
    setDocValid(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.doc;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep3()) {
      setIsCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
              {t('register.authority.brand.title')}
            </h1>
            <p className="text-xs text-navy-100 leading-relaxed">
              {t('register.authority.brand.desc')}
            </p>
          </div>

          <ul className="space-y-3 text-xs text-navy-100/90 pt-2">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-none mt-1.5" />
              <span>{t('register.authority.brand.point1')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-none mt-1.5" />
              <span>{t('register.authority.brand.point2')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-none mt-1.5" />
              <span>{t('register.authority.brand.point3')}</span>
            </li>
          </ul>

          <div className="pt-4 border-t border-navy-800 text-xs text-navy-200 space-y-1">
            <p className="text-navy-300">{t('register.authority.brand.is_operator')}</p>
            <button
              type="button"
              className="text-gold-400 hover:text-gold-300 font-bold underline cursor-pointer"
              onClick={() => setLocation('/register/operator')}
            >
              {t('register.authority.brand.register_operator')}
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-navy-700 text-xs text-navy-100 flex items-center justify-between relative z-10">
          <span>{t('register.authority.brand.has_account')}</span>
          <button
            type="button"
            className="text-gold-500 hover:text-gold-300 font-bold underline cursor-pointer"
            onClick={() => setLocation('/login')}
          >
            {t('register.authority.brand.login')}
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
                <div className="flex items-center justify-between gap-2" aria-label="Authority Registration Steps">
                  <div className={`flex items-center gap-2 text-xs font-bold ${step === 0 ? 'text-primary' : step > 0 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 ${step === 0 ? 'border-gold-500 text-gold-700 font-extrabold' : step > 0 ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border text-muted-foreground'}`}>
                      {step > 0 ? <Check className="w-4 h-4" /> : '1'}
                    </span>
                    <span>{t('register.authority.step1.stepper')}</span>
                  </div>

                  <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-primary' : step > 1 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 ${step === 1 ? 'border-gold-500 text-gold-700 font-extrabold' : step > 1 ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border text-muted-foreground'}`}>
                      {step > 1 ? <Check className="w-4 h-4" /> : '2'}
                    </span>
                    <span>{t('register.authority.step2.stepper')}</span>
                  </div>

                  <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 ${step === 2 ? 'border-gold-500 text-gold-700 font-extrabold' : 'border-border text-muted-foreground'}`}>
                      3
                    </span>
                    <span>{t('register.authority.step3.stepper')}</span>
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
                  <span>{t('register.authority.err.summary')}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* STEP 1: Public Body Details */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-navy-900">{t('register.authority.step1.title')}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('register.authority.step1.sub')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Authority Category */}
                      <div className="sm:col-span-2 space-y-1">
                        <label htmlFor="category" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.category')} <span className="text-destructive">*</span>
                        </label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className={`w-full text-xs h-10 px-3 rounded-md border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.category ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">{t('register.authority.field.category_select')}</option>
                          {AUTHORITY_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {lang === 'fr' ? cat.fr : cat.ar}
                            </option>
                          ))}
                        </select>
                        {errors.category && <p className="text-[11px] text-destructive">{errors.category}</p>}
                      </div>

                      {/* Official Name */}
                      <div className="sm:col-span-2 space-y-1">
                        <label htmlFor="name" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.name')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="مثال: مديرية التجهيزات العمومية لولاية سطيف"
                          className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
                      </div>

                      {/* Tutelle */}
                      <div className="space-y-1">
                        <label htmlFor="tutelle" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.tutelle')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="tutelle"
                          value={tutelle}
                          onChange={(e) => setTutelle(e.target.value)}
                          placeholder="مثال: وزارة السكن والعمران والمدينة"
                          className={errors.tutelle ? 'border-destructive' : ''}
                        />
                        {errors.tutelle && <p className="text-[11px] text-destructive">{errors.tutelle}</p>}
                      </div>

                      {/* Ordonnateur Code / NIS */}
                      <div className="space-y-1">
                        <label htmlFor="code" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.code')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="code"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="مثال: ORD-19-0442 أو رقم NIS"
                          dir="ltr"
                          className={errors.code ? 'border-destructive' : ''}
                        />
                        {errors.code && <p className="text-[11px] text-destructive">{errors.code}</p>}
                      </div>

                      {/* Wilaya */}
                      <div className="space-y-1">
                        <label htmlFor="wilaya" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.wilaya')} <span className="text-destructive">*</span>
                        </label>
                        <select
                          id="wilaya"
                          value={wilaya}
                          onChange={(e) => setWilaya(e.target.value)}
                          className={`w-full text-xs h-10 px-3 rounded-md border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.wilaya ? 'border-destructive' : 'border-input'}`}
                        >
                          <option value="">{t('register.authority.field.wilaya_select')}</option>
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
                          {t('register.authority.field.address')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="العنوان الإداري للمقر الرئيسي للمصلحة"
                          className={errors.address ? 'border-destructive' : ''}
                        />
                        {errors.address && <p className="text-[11px] text-destructive">{errors.address}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Ordonnateur / Authorized Officer & Documents */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-navy-900">{t('register.authority.step2.title')}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('register.authority.step2.sub')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Authorized Representative Full Name */}
                      <div className="space-y-1">
                        <label htmlFor="repName" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.rep')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="repName"
                          value={repName}
                          onChange={(e) => setRepName(e.target.value)}
                          placeholder="الاسم واللقب الكامل للمسؤول الإداري"
                          className={errors.repName ? 'border-destructive' : ''}
                        />
                        {errors.repName && <p className="text-[11px] text-destructive">{errors.repName}</p>}
                      </div>

                      {/* Administrative Role / Title */}
                      <div className="space-y-1">
                        <label htmlFor="repRole" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.role')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="repRole"
                          value={repRole}
                          onChange={(e) => setRepRole(e.target.value)}
                          placeholder={t('register.authority.field.role_ph')}
                          className={errors.repRole ? 'border-destructive' : ''}
                        />
                        {errors.repRole && <p className="text-[11px] text-destructive">{errors.repRole}</p>}
                      </div>

                      {/* Official Email */}
                      <div className="space-y-1">
                        <label htmlFor="email" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.email')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ordonnateur@wilaya.gov.dz"
                          dir="ltr"
                          className={errors.email ? 'border-destructive' : ''}
                        />
                        <span className="text-[11px] text-muted-foreground block">{t('register.authority.field.email_hint')}</span>
                        {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
                      </div>

                      {/* Administrative Phone */}
                      <div className="space-y-1">
                        <label htmlFor="phone" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.phone')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="021 XX XX XX أو 05XX XX XX XX"
                          dir="ltr"
                          className={errors.phone ? 'border-destructive' : ''}
                        />
                        {errors.phone && <p className="text-[11px] text-destructive">{errors.phone}</p>}
                      </div>

                      {/* Official Appointment / Delegation Document */}
                      <div className="sm:col-span-2 space-y-1">
                        <label htmlFor="doc" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.doc')} <span className="text-destructive">*</span>
                        </label>
                        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${docValid ? 'border-emerald-500 bg-emerald-50/30' : errors.doc ? 'border-destructive bg-destructive/5' : 'border-border hover:border-gold-500/50'}`}>
                          <input
                            id="doc"
                            type="file"
                            accept=".pdf,image/png,image/jpeg"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label htmlFor="doc" className="cursor-pointer flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${docValid ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                              {docValid ? <Check className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                            </div>
                            <span className="text-xs font-semibold text-foreground">
                              {docName || t('register.authority.field.doc_select')}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {t('register.authority.field.doc_hint')}
                            </span>
                          </label>
                        </div>
                        {errors.doc && <p className="text-[11px] text-destructive">{errors.doc}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Account Creation & Official Terms */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-navy-900">{t('register.authority.step3.title')}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('register.authority.step3.sub')}</p>
                    </div>

                    <div className="space-y-4">
                      {/* Password */}
                      <div className="space-y-1">
                        <label htmlFor="password" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.password')} <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            dir="ltr"
                            className={`pe-10 ${errors.password ? 'border-destructive' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label={showPassword ? t('register.operator.toggle.hide') : t('register.operator.toggle.show')}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password strength meter */}
                        {password && (
                          <div className="space-y-1 pt-1">
                            <div className="flex gap-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className={`h-full flex-1 ${passwordStrength >= 1 ? 'bg-destructive' : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 ${passwordStrength >= 2 ? 'bg-amber-500' : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 ${passwordStrength >= 3 ? 'bg-gold-500' : 'bg-transparent'}`} />
                              <div className={`h-full flex-1 ${passwordStrength >= 4 ? 'bg-emerald-600' : 'bg-transparent'}`} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {passwordStrength === 1 && 'ضعيفة'}
                              {passwordStrength === 2 && 'متوسطة'}
                              {passwordStrength === 3 && 'جيدة'}
                              {passwordStrength === 4 && 'قوية جداً'}
                            </span>
                          </div>
                        )}
                        <span className="text-[11px] text-muted-foreground block">{t('register.authority.field.password_hint')}</span>
                        {errors.password && <p className="text-[11px] text-destructive">{errors.password}</p>}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1">
                        <label htmlFor="confirmPassword" className="text-xs font-bold text-foreground">
                          {t('register.authority.field.password_confirm')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          dir="ltr"
                          className={errors.confirmPassword ? 'border-destructive' : ''}
                        />
                        {errors.confirmPassword && <p className="text-[11px] text-destructive">{errors.confirmPassword}</p>}
                      </div>

                      {/* Terms Acceptance */}
                      <div className="pt-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 rounded border-border text-primary focus:ring-ring"
                          />
                          <span className="text-xs text-foreground leading-relaxed">
                            {t('register.authority.field.terms')} <span className="text-destructive">*</span>
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
                      <span>{t('register.authority.btn.prev')}</span>
                    </Button>
                  ) : <div />}

                  {step < 2 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-navy-900 hover:bg-navy-700 text-white text-xs font-bold px-6 py-2 rounded-xl flex items-center gap-2"
                    >
                      <span>{t('register.authority.btn.next')}</span>
                      <ArrowNext className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="bg-gold-500 hover:bg-gold-700 text-navy-900 font-extrabold text-xs px-6 py-2 rounded-xl"
                    >
                      {t('register.authority.btn.submit')}
                    </Button>
                  )}
                </div>
              </form>
            </>
          ) : (
            /* Done Box */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-navy-900">
                {t('register.authority.done.title')}
              </h2>
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs max-w-lg mx-auto leading-relaxed">
                <strong>تنبيه توضيحي:</strong> {t('register.authority.done.notice')}
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => setLocation('/login')}
                  className="bg-navy-900 hover:bg-navy-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
                >
                  {t('register.authority.done.back_login')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
