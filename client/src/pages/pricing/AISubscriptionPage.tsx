import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import {
  CheckCircle2,
  Zap,
  Crown,
  Sparkles,
  Building2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  Check,
  Lock,
  Globe,
  Headphones,
  FileCheck2,
} from 'lucide-react';

export function AISubscriptionPage() {
  const { lang, dir, setLang, t } = useI18n();
  const [, setLocation] = useLocation();
  const isFr = lang === 'fr';

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    plan: string;
    checkoutUrl?: string;
  }>({
    open: false,
    plan: 'pro',
  });
  const [contactModal, setContactModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `${t('pricing.page_title')} | ${isFr ? 'Safaqat Dhakia' : 'صفقات ذكية'}`;
  }, [t, isFr]);

  const handleCheckout = async (planType: 'starter' | 'pro' | 'enterprise') => {
    if (planType === 'starter') {
      setLocation('/register/operator');
      return;
    }

    if (planType === 'enterprise') {
      setContactModal(true);
      return;
    }

    try {
      setLoadingPlan(planType);
      setErrorMessage(null);

      const res = await fetch('/api/subscriptions/checkout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan_type: planType }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessModal({
          open: true,
          plan: planType,
          checkoutUrl: data.checkout_url,
        });
      } else {
        setErrorMessage(data.message || t('pricing.checkout.error'));
      }
    } catch {
      setErrorMessage(t('pricing.checkout.error'));
    } finally {
      setLoadingPlan(null);
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col bg-gradient-to-b from-[#f0f9ff] via-[#f8fafc] to-[#eef2f6] text-[#0f3154] font-['Cairo',sans-serif] selection:bg-[#10b981]/20 selection:text-[#047857] relative overflow-hidden"
    >
      {/* ═══════════════════════════════════════════════════════════════
          خلفيات جمالية متوهجة (Ambient Gradient Glows)
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="absolute top-[-10%] start-[-5%] w-[550px] h-[550px] rounded-full bg-emerald-400/15 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-[20%] end-[-10%] w-[650px] h-[650px] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10%] start-[25%] w-[600px] h-[600px] rounded-full bg-teal-400/10 blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      {/* ═══════════════════════════════════════════════════════════════
          1. شريط التنقل العلوي السيادي (Sovereign Top Header)
          ═══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-white/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* الشعار واسم المنصة */}
          <Link
            href="/"
            className="flex items-center gap-3.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] rounded-xl p-1"
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-[#0f3154] to-[#047857] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Logo size={28} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-[#0f3154] leading-tight">
                {isFr ? 'Safaqat Dhakia' : 'صفقات ذكية'}
              </span>
              <span className="text-[11px] font-bold text-[#047857] leading-none">
                {isFr ? 'IA & Commande Publique' : 'الذكاء الاصطناعي والصفقات العمومية'}
              </span>
            </div>
          </Link>

          {/* الإجراءات: الرجوع للرئيسية، تبديل اللغة، والدخول */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-[#0f3154] hover:bg-white/80 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <span>{t('pricing.nav.back_home')}</span>
            </Link>

            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/80 text-slate-700 hover:text-[#0f3154] border border-slate-200 shadow-2xs hover:bg-white transition-all cursor-pointer"
              title={isFr ? 'Passer en arabe' : 'Changer en français'}
              aria-label={isFr ? 'Passer en arabe' : 'Changer en français'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ar' ? 'FR' : 'عربي'}</span>
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#0f3154] to-[#144272] hover:opacity-95 rounded-xl shadow-xs transition-all"
            >
              <span>{t('pricing.nav.login')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. Hero Section: العنوان ونبذة القيمة
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#047857] text-xs font-bold mb-5 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>{t('pricing.kicker')}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#0f3154] tracking-tight leading-tight sm:leading-snug">
          {t('pricing.title')}
        </h1>

        <p className="mt-4 text-sm sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
          {t('pricing.subtitle')}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 text-xs font-semibold text-slate-600 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t('pricing.guarantee_badge')}</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. بطاقات الباقات الثلاث (Glassmorphism Subscription Cards)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
          {/* ═════════ البطاقة 1: الباقة الأساسية (Starter) ═════════ */}
          <div className="bg-white/60 backdrop-blur-lg border border-white/80 shadow-lg rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl hover:border-white transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="size-12 rounded-2xl bg-blue-500/10 text-[#0f3154] flex items-center justify-center font-bold">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {t('pricing.plans.starter.period')}
                </span>
              </div>

              <h2 className="text-xl font-black text-[#0f3154]">
                {t('pricing.plans.starter.name')}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[40px]">
                {t('pricing.plans.starter.desc')}
              </p>

              <div className="mt-6 mb-6 flex items-baseline gap-1.5 border-b border-slate-200/70 pb-6">
                <span className="text-3xl font-black text-[#0f3154]">
                  {t('pricing.plans.starter.price')}
                </span>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.starter.feat1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.starter.feat2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.starter.feat3')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.starter.feat4')}</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={() => handleCheckout('starter')}
                className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 text-[#0f3154] font-bold text-sm border border-slate-200/80 shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('pricing.plans.starter.cta')}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ═════════ البطاقة 2: باقة المحترفين (Pro AI) — المميزة ═════════ */}
          <div className="relative scale-100 lg:scale-105 bg-white/85 backdrop-blur-xl border-2 border-[#10b981] shadow-2xl rounded-3xl p-8 flex flex-col justify-between ring-4 ring-[#10b981]/15 z-20">
            {/* شريط "الأكثر طلباً" في الأعلى */}
            <div className="absolute -top-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 bg-gradient-to-r from-[#047857] to-[#10b981] text-white text-[11px] font-extrabold px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('pricing.plans.pro.badge')}</span>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-extrabold text-[#047857] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  {t('pricing.plans.pro.period')}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#0f3154] flex items-center gap-2">
                <span>{t('pricing.plans.pro.name')}</span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[40px]">
                {t('pricing.plans.pro.desc')}
              </p>

              <div className="mt-6 mb-6 flex items-baseline gap-2 border-b border-emerald-100 pb-6">
                <span className="text-3xl sm:text-4xl font-black text-[#0f3154]">
                  {t('pricing.plans.pro.price')}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {t('pricing.plans.pro.period')}
                </span>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-800 font-semibold">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.pro.feat1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.pro.feat2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.pro.feat3')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.pro.feat4')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.pro.feat5')}</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                disabled={loadingPlan === 'pro'}
                onClick={() => handleCheckout('pro')}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#047857] via-[#059669] to-[#10b981] hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loadingPlan === 'pro' ? (
                  <span>{t('pricing.checkout.loading')}</span>
                ) : (
                  <>
                    <span>{t('pricing.plans.pro.cta')}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ═════════ البطاقة 3: باقة المؤسسات (Enterprise) ═════════ */}
          <div className="bg-white/60 backdrop-blur-lg border border-white/80 shadow-lg rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl hover:border-white transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="size-12 rounded-2xl bg-slate-900/10 text-[#0f3154] flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6 text-[#0f3154]" />
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {t('pricing.plans.enterprise.badge')}
                </span>
              </div>

              <h2 className="text-xl font-black text-[#0f3154]">
                {t('pricing.plans.enterprise.name')}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[40px]">
                {t('pricing.plans.enterprise.desc')}
              </p>

              <div className="mt-6 mb-6 flex items-baseline gap-1.5 border-b border-slate-200/70 pb-6">
                <span className="text-3xl font-black text-[#0f3154]">
                  {t('pricing.plans.enterprise.price')}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {t('pricing.plans.enterprise.period')}
                </span>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.enterprise.feat1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.enterprise.feat2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.enterprise.feat3')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.enterprise.feat4')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('pricing.plans.enterprise.feat5')}</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={() => handleCheckout('enterprise')}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('pricing.plans.enterprise.cta')}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="max-w-md mx-auto mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center text-sm font-semibold">
            {errorMessage}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. قسم الثقة والامتثال السيادي (Trust & Sovereignty Section)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200/60 bg-white/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-xl sm:text-2xl font-black text-[#0f3154]">
              {t('pricing.trust.title')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex flex-col items-center text-center">
              <div className="size-12 rounded-xl bg-emerald-500/10 text-[#047857] flex items-center justify-center mb-4">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0f3154] text-base mb-2">
                {t('pricing.trust.compliance_title')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('pricing.trust.compliance_desc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex flex-col items-center text-center">
              <div className="size-12 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0f3154] text-base mb-2">
                {t('pricing.trust.sovereignty_title')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('pricing.trust.sovereignty_desc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex flex-col items-center text-center">
              <div className="size-12 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0f3154] text-base mb-2">
                {t('pricing.trust.support_title')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('pricing.trust.support_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. نافذة التأكيد والاشتراك الناجح (Success / Checkout Modal)
          ═══════════════════════════════════════════════════════════════ */}
      {successModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" strokeWidth={3} />
            </div>

            <h3 className="text-xl font-black text-[#0f3154]">
              {t('pricing.checkout.success_title')}
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              {t('pricing.checkout.success_desc')}
            </p>

            <div className="pt-4 flex flex-col gap-2.5">
              <Link
                href="/operator/overview"
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#047857] to-[#10b981] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all text-center"
              >
                {t('pricing.checkout.btn_dashboard')}
              </Link>
              <button
                type="button"
                onClick={() => setSuccessModal({ open: false, plan: 'pro' })}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                {t('pricing.checkout.btn_close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          6. نافذة تواصل باقة المؤسسات (Enterprise Contact Modal)
          ═══════════════════════════════════════════════════════════════ */}
      {contactModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-start">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f3154]">
                  {t('pricing.plans.enterprise.name')}
                </h3>
                <p className="text-xs text-slate-500">
                  {isFr ? 'Solutions d’entreprise sur mesure' : 'حلول مؤسساتية واستشارية خاصة'}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isFr
                ? 'Nos conseillers d’affaires et experts en commande publique sont à votre disposition pour étudier vos besoins spécifiques et bâtir votre solution sur mesure.'
                : 'يسعد فريق المستشارين ومسؤولي العلاقات الحكومية في «صفقات ذكية» دراسة احتياجات مؤسستكم وتقديم عرض فني ومالي مخصص.'}
            </p>

            <div className="space-y-3 pt-2">
              <a
                href="mailto:contact@safaqat-dz.ai?subject=طلب باقة المؤسسات - صفقات ذكية"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
              >
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">contact@safaqat-dz.ai</span>
              </a>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>+213 (0) 21 00 00 00</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setContactModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {t('pricing.checkout.btn_close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          7. تذييل بسيط خاص بصفحة الأسعار (Subtle Footer)
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="mt-auto py-6 border-t border-slate-200/60 bg-white/60 text-center text-xs text-slate-500">
        <p>
          © 2026 {isFr ? 'Safaqat Dhakia' : 'صفقات ذكية'} —{' '}
          {isFr
            ? 'Tous droits réservés. République Algérienne Démocratique et Populaire.'
            : 'جميع الحقوق محفوظة. الجمهورية الجزائرية الديمقراطية الشعبية.'}
        </p>
      </footer>
    </div>
  );
}
export default AISubscriptionPage;
