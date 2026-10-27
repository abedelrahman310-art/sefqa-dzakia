import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Landmark,
} from 'lucide-react';
import { RegisterHero } from '@/components/auth/RegisterHero';
import { RegisterRoleTabs, RegisterRole } from '@/components/auth/RegisterRoleTabs';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { WILAYAS } from './OperatorRegister';
import { getCommunesForWilaya } from '@safaqat/shared/territorial';

export const AUTHORITY_SECTORS = [
  { id: 'local_gov', ar: 'الجماعات المحلية (ولاية / دائرة / بلدية)' },
  { id: 'public_works', ar: 'الأشغال العمومية والمنشآت القاعدية' },
  { id: 'housing', ar: 'السكن والعمران والمدينة' },
  { id: 'water', ar: 'الري والأمن المائي' },
  { id: 'health', ar: 'الصحة والسكان وإصلاح المستشفيات' },
  { id: 'education', ar: 'التربية الوطنية' },
  { id: 'higher_edu', ar: 'التعليم العالي والبحث العلمي' },
  { id: 'vocational', ar: 'التكوين والتعليم المهنيين' },
  { id: 'finance', ar: 'المالية والمؤسسات المالية' },
  { id: 'energy', ar: 'الطاقة والمناجم' },
  { id: 'post_telecom', ar: 'البريد والمواصلات السلكية واللاسلكية والرقمنة' },
  { id: 'agriculture', ar: 'الفلاحة والتنمية الريفية' },
  { id: 'industry', ar: 'الصناعة والإنتاج الصيدلاني' },
  { id: 'trade', ar: 'التجارة وترقية الصادرات' },
  { id: 'transport', ar: 'النقل' },
  { id: 'youth_sports', ar: 'الشباب والرياضة' },
  { id: 'culture', ar: 'الثقافة والفنون' },
  { id: 'other', ar: 'قطاع وزاري أو هيئة دستورية أخرى' },
];

export function AuthorityRegister() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  // 1. بيانات المصلحة المتعاقدة (الملحق 1)
  const [fullName, setFullName] = useState('');
  const [sector, setSector] = useState('local_gov');
  const [legalText, setLegalText] = useState('');
  const [nif, setNif] = useState('');

  // 2. المقر والعنوان الكامل
  const [address, setAddress] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // 3. معلومات الشخص المعيّن (Personne désignée)
  const [appointedName, setAppointedName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // 4. الأمان وكلمة المرور
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
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

  const selectedSectorObj = useMemo(
    () => AUTHORITY_SECTORS.find((s) => s.id === sector),
    [sector]
  );

  // Validation Helpers
  const isEmailValid = useMemo(() => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }, [email]);

  const isPhoneValid = useMemo(() => {
    if (!phone.trim()) return true;
    const clean = phone.replace(/[\s.-]/g, '');
    return /^0\d{8,9}$/.test(clean);
  }, [phone]);

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
      sector: true,
      legalText: true,
      nif: true,
      address: true,
      wilaya: true,
      commune: true,
      postalCode: true,
      appointedName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    };
    setTouched(newTouched);

    if (!fullName.trim() || fullName.trim().length < 2) return false;
    if (!sector.trim()) return false;
    if (!legalText.trim() || legalText.trim().length < 3) return false;
    if (!nif.trim() || !isNifValid) return false;
    if (!address.trim() || address.trim().length < 3) return false;
    if (!wilaya) return false;
    if (!commune.trim()) return false;
    if (!postalCode.trim() || !isPostalCodeValid) return false;
    if (!appointedName.trim() || appointedName.trim().length < 2) return false;
    if (!phone.trim() || !isPhoneValid) return false;
    if (!email.trim() || !isEmailValid) return false;
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
    } else if (role === 'operator') {
      setLocation('/register');
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
          role: 'authority',
          fullName: fullName.trim(),
          name: fullName.trim(),
          company: fullName.trim(),
          sector: selectedSectorObj ? selectedSectorObj.ar : sector,
          tutelle: selectedSectorObj ? selectedSectorObj.ar : sector,
          legalText: legalText.trim(),
          nif: nif.trim(),
          address: fullAddress,
          wilaya,
          commune: commune.trim(),
          municipality: commune.trim(),
          postalCode: postalCode.trim(),
          appointedName: appointedName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          repRole: 'الآمر بالصرف أو المفوض عنه',
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
        setLocation('/authority');
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
              إنشاء حساب مصلحة متعاقدة
            </h2>
            <p className="text-xs text-[#64748b] leading-relaxed">
              يرجى إدخال البيانات القانونية والإدارية الإلزامية للمصلحة المتعاقدة وفق النماذج الوزارية الرسمية.
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
            activeRole="authority"
            onSelectRole={handleRoleSelect}
          />

          {/* Registration Form — Structured Cards */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">
            {/* ── CARD 1: البيانات القانونية للمصلحة المتعاقدة ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <Landmark className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  1. البيانات القانونية للمصلحة المتعاقدة
                </h3>
              </div>

              {/* التسمية الرسمية للمصلحة */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#0A2540]">
                  تسمية المصلحة المتعاقدة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => markTouched('fullName')}
                    placeholder="مثال: مديرية الأشغال العمومية لولاية الجزائر"
                    className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all ${
                      touched.fullName && (!fullName.trim() || fullName.trim().length < 2)
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  <Landmark className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
                {touched.fullName && (!fullName.trim() || fullName.trim().length < 2) && (
                  <p className="text-[10px] text-red-600">تسمية المصلحة المتعاقدة إلزامية</p>
                )}
              </div>

              {/* القطاع الوزاري */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#0A2540]">
                  القطاع الوزاري أو الوصاية <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    onBlur={() => markTouched('sector')}
                    className="w-full h-10 pe-10 ps-3.5 rounded-xl border border-[#e2e8f0] bg-white text-xs text-[#0B1A2B] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all appearance-none cursor-pointer"
                  >
                    {AUTHORITY_SECTORS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ar}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
              </div>

              {/* النص القانوني للإنشاء ورقم التعريف الجبائي */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* النص القانوني للإنشاء */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    النص القانوني للإنشاء <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={legalText}
                      onChange={(e) => setLegalText(e.target.value)}
                      onBlur={() => markTouched('legalText')}
                      placeholder="مرسوم تنفيذي / قرار وزاري رقم..."
                      className={`w-full h-10 pe-10 ps-3 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.legalText && (!legalText.trim() || legalText.trim().length < 3)
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <FileText className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.legalText && (!legalText.trim() || legalText.trim().length < 3) && (
                    <p className="text-[10px] text-red-600">النص القانوني للإنشاء إلزامي وفق الملحق 1</p>
                  )}
                </div>

                {/* رقم التعريف الجبائي NIF */}
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
                      placeholder="رقم التعريف الجبائي للمصلحة"
                      className={`w-full h-10 pe-10 ps-3 rounded-xl border bg-white text-xs font-mono text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.nif && (!nif.trim() || !isNifValid)
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Hash className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.nif && (!nif.trim() || !isNifValid) && (
                    <p className="text-[10px] text-red-600">رقم التعريف الجبائي إلزامي</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── CARD 2: المقر والعنوان الكامل ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  2. المقر والعنوان الكامل للمصلحة
                </h3>
              </div>

              {/* العنوان الكامل */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#0A2540]">
                  العنوان الكامل للمقر الإداري <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={() => markTouched('address')}
                    placeholder="شارع، حي، المبنى أو المقر الإداري..."
                    className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 transition-all ${
                      touched.address && (!address.trim() || address.trim().length < 3)
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  <MapPin className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
                {touched.address && (!address.trim() || address.trim().length < 3) && (
                  <p className="text-[10px] text-red-600">العنوان الكامل للمقر إلزامي</p>
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

            {/* ── CARD 3: معلومات الشخص المعيّن (Personne désignée) ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <User className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  3. معلومات الشخص المعيّن (الآمر بالصرف أو المفوض)
                </h3>
              </div>

              {/* الاسم واللقب للشخص المعين */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#0A2540]">
                  الاسم واللقب للشخص المعيّن <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={appointedName}
                    onChange={(e) => setAppointedName(e.target.value)}
                    onBlur={() => markTouched('appointedName')}
                    placeholder="الاسم واللقب الكامل للمسؤول المعيّن"
                    className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                      touched.appointedName && (!appointedName.trim() || appointedName.trim().length < 2)
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-[#e2e8f0]'
                    }`}
                  />
                  <User className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                </div>
                {touched.appointedName && (!appointedName.trim() || appointedName.trim().length < 2) && (
                  <p className="text-[10px] text-red-600">اسم ولقب الشخص المعيّن إلزامي</p>
                )}
              </div>

              {/* الهاتف والبريد الإلكتروني المهني */}
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
                      placeholder="021 XX XX XX / 06XX XX XX XX"
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

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#0A2540]">
                    البريد الإلكتروني المهني للحساب <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched('email')}
                      placeholder="officer@authority.gov.dz"
                      className={`w-full h-10 pe-10 ps-3.5 rounded-xl border bg-white text-xs text-[#0B1A2B] placeholder-[#9ca3af] focus:outline-none focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 ${
                        touched.email && (!email.trim() || !isEmailValid)
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    />
                    <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                  {touched.email && (!email.trim() || !isEmailValid) && (
                    <p className="text-[10px] text-red-600">بريد إلكتروني مهني صحيح إلزامي</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── CARD 4: الأمان وبيانات الدخول ── */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                <Lock className="w-4 h-4 text-[#0A2540]" />
                <h3 className="text-xs font-bold text-[#0A2540]">
                  4. الأمان وكلمة المرور
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
                  أصرح بصفتي الشخص المعيّن رسمياً عن المصلحة المتعاقدة بصحة هذه البيانات الإدارية والقانونية وفق أحكام القانون رقم 23-12 والملحق 1 لقرار وزارة المالية المؤرخ في 4 فبراير 2026، وألتزم بـ{' '}
                  <span className="text-[#1e3a8a] font-bold underline">شروط الاستخدام وميثاق النزاهة الرقمية للمنصة</span>. <span className="text-red-500">*</span>
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
                  <span>جاري تسجيل وتوثيق المصلحة المتعاقدة...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم التسجيل بنجاح! جاري التوجيه...</span>
                </>
              ) : (
                <span>تأكيد التسجيل وإنشاء حساب المصلحة المتعاقدة</span>
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
