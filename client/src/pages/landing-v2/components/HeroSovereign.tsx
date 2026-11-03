import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import {
  ShieldCheck,
  FileCheck2,
  Lock,
  ArrowLeft,
  ArrowRight,
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Fingerprint,
  Scale,
  Activity,
  Award,
  Globe2,
  Crown
} from 'lucide-react';

export const HeroSovereign: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  return (
    <section
      id="overview"
      dir={dir}
      className="relative pt-6 pb-16 lg:pt-10 lg:pb-24 overflow-hidden bg-gradient-to-b from-[#fcfbf7] via-white to-[#fbfaf5]"
    >
      {/* خلفية هندسية شبكية هادئة مؤسسية وفاتحة */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#006233 1px, transparent 1px), radial-gradient(#d97706 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px'
        }}
        aria-hidden="true"
      />

      {/* هالة إشعاعية ذهبية زمردية هادئة في الخلفية */}
      <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-amber-200/20 via-emerald-100/15 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ══════════════════════════════════════════════════════════════════
            1. الإطار الفاخر الملكي لاسم وشعار المنصة السيادية
            ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 relative max-w-4xl mx-auto">
          {/* الإطار الملكي المذهب المزدوج */}
          <div className="relative rounded-3xl border-2 border-amber-400/70 bg-gradient-to-b from-amber-50/60 via-white to-emerald-50/30 p-6 sm:p-8 shadow-xl ring-4 ring-amber-100/50 backdrop-blur-sm overflow-hidden text-center">
            
            {/* زخارف الزوايا الذهبية الأنيقة */}
            <div className="absolute top-2 start-2 size-6 border-t-2 border-s-2 border-amber-500/80 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2 end-2 size-6 border-t-2 border-e-2 border-amber-500/80 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2 start-2 size-6 border-b-2 border-s-2 border-amber-500/80 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2 end-2 size-6 border-b-2 border-e-2 border-amber-500/80 rounded-br-lg pointer-events-none" />

            {/* الشريط الملكي العلوي */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-amber-300 shadow-xs mb-4">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-600 inline-block shadow-2xs" />
                <span className="size-2 rounded-full bg-white border border-slate-300 inline-block shadow-2xs" />
                <span className="size-2 rounded-full bg-rose-600 inline-block shadow-2xs" />
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide font-cairo">
                {isAr ? 'الجمهورية الجزائرية الديمقراطية الشعبية • منظومة السيادة الرقمية 2026' : 'République Algérienne • Système National Souverain 2026'}
              </span>
            </div>

            {/* شعار المنصة ثلاثي الأبعاد واسمها الفاخر */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 my-2">
              
              {/* شعار المنصة في قاعدة دائرية ملكية مضيئة */}
              <div className="relative flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-tr from-white via-amber-50/40 to-emerald-50/50 border-2 border-amber-400/60 shadow-md">
                <div className="absolute inset-0 rounded-2xl bg-amber-400/10 animate-pulse pointer-events-none" />
                <Logo size={70} />
              </div>

              {/* الاسم الملكي للمنصة مع تدرج ذهبي زمردي أنيق */}
              <div className="text-center sm:text-start">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Crown className="size-5 text-amber-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-amber-800 uppercase tracking-widest font-mono">
                    {isAr ? 'المنظومة الوطنية الموحدة' : 'PLATEFORME NATIONALE'}
                  </span>
                </div>
                
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-cairo leading-[1.15]">
                  <span className="text-slate-900">{isAr ? 'منصة ' : 'Plateforme '}</span>
                  <span className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-amber-700 bg-clip-text text-transparent underline decoration-amber-400/50 decoration-wavy underline-offset-8">
                    {isAr ? 'صفقات ذكية' : 'Safaqat Dhakia'}
                  </span>
                </h1>

                <p className="text-xs sm:text-sm font-bold text-slate-600 mt-2">
                  {isAr ? 'تسيير وتجريد ومراقبة الصفقات العمومية وفق القانون 23-12' : 'Gestion et Dématérialisation des Marchés Publics (Loi 23-12)'}
                </p>
              </div>

            </div>

            {/* أختام الضمان السيادي داخل الإطار الملكي */}
            <div className="mt-5 pt-4 border-t border-amber-300/50 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-600 font-semibold">
              <span className="inline-flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>{isAr ? 'المادة 67: التجريد المادي الكامل' : 'Art. 67 Dématérialisation'}</span>
              </span>
              <span className="text-amber-400">•</span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <Scale className="size-4 text-amber-600" />
                <span>{isAr ? 'المرسوم الرئاسي 15-247' : 'Décret 15-247'}</span>
              </span>
              <span className="text-amber-400">•</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-800">
                <Lock className="size-4 text-emerald-600" />
                <span>{isAr ? 'تشفير مالي AES-256 + SHA-256' : 'Chiffrement AES-256'}</span>
              </span>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. صلب القسم الأول: العرض الاستراتيجي وبطاقة المعاينة الواقعية
            ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-14">
          
          {/* الجانب الأيمن: النص والشروحات وأزرار الدخول */}
          <div className="lg:col-span-7 flex flex-col items-start text-start space-y-6">
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug font-cairo">
              {isAr
                ? 'الصفقات العمومية الجزائرية برؤية رقمية موحدة وعالية الشفافية'
                : 'Les Marchés Publics Algériens à l’Ère de la Souveraineté et de la Transparence'}
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              {isAr
                ? 'فضاء سيادي موحد يجمع المصلحة المتعاقدة، المتعامل الاقتصادي، والإدارة المركزية في مسار رقمي متكامل يبدأ من نشر الإعلان واستلام العروض إلى غاية الإسناد والتنفيذ والدفع، مع الحماية الاستباقية ضد الإقصاء الشكلي وضمان الشفافية المطلقة.'
                : 'Un espace souverain reliant l’Autorité Contractante, l’Opérateur Économique et l’Administration Centrale. Un cycle dématérialisé de bout en bout conforme aux plus hauts standards de sécurité et de contrôle.'}
            </p>

            {/* أزرار التحويل والدخول */}
            <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto pt-2">
              <a
                href="#portals"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 hover:from-emerald-800 hover:to-teal-950 text-white font-bold text-base shadow-md hover:shadow-lg transition-all focus:outline-hidden cursor-pointer"
              >
                <span>{isAr ? 'دخول البوابات السيادية' : 'Accéder aux Portails'}</span>
                {isAr ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </a>

              <a
                href="#lifecycle"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-base border border-slate-300 shadow-2xs hover:border-amber-400 transition-all focus:outline-hidden cursor-pointer"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'مسار الصفقة (7 مراحل)' : 'Cycle de vie (7 étapes)'}</span>
              </a>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-sm font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{isAr ? 'دخول فوري للمنصة' : 'Connexion directe'}</span>
              </Link>
            </div>

          </div>

          {/* الجانب الأيسر: بطاقة المعاينة التنفيذية لصفقة رقمية مشفرة (Executive Sovereign Card) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* بطاقة تنفيذية أنيقة بألوان فاتحة وراقية */}
              <div className="rounded-3xl bg-white border-2 border-emerald-600/30 shadow-xl overflow-hidden relative">
                
                {/* ترويسة البطاقة: أخضر زمردي سيادي غني ومهيب */}
                <div className="bg-gradient-to-r from-emerald-900 via-[#006233] to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-white shadow-xs">
                      <Logo size={28} />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-emerald-300 tracking-wider">
                        {isAr ? 'الجمهورية الجزائرية الديمقراطية الشعبية' : 'République Algérienne'}
                      </span>
                      <strong className="block text-sm sm:text-base font-bold text-white font-cairo">
                        {isAr ? 'وثيقة صفقة عمومية رقمية' : 'Marché Public Dématérialisé'}
                      </strong>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-400/20 text-amber-200 border border-amber-300/40">
                    DZ-2026-084
                  </span>
                </div>

                {/* جسم البطاقة وبيانات الصفقة الحية بألوان فاتحة ومريحة */}
                <div className="p-5 sm:p-6 space-y-4 text-slate-800 text-sm bg-gradient-to-b from-white via-slate-50/40 to-white">
                  
                  {/* المصلحة المتعاقدة */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">
                        {isAr ? 'المصلحة المتعاقدة (صاحب المشروع)' : 'Autorité Contractante'}
                      </span>
                      <strong className="text-slate-900 font-bold text-xs sm:text-sm">
                        {isAr ? 'وزارة الأشغال العمومية والمنشآت القاعدية' : 'Ministère des Travaux Publics'}
                      </strong>
                    </div>
                  </div>

                  {/* موضوع الصفقة */}
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
                    <span className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-600" />
                      <span>{isAr ? 'موضوع طلب العروض الوطني المفتوح' : 'Objet du Marché Public'}</span>
                    </span>
                    <p className="text-xs text-slate-800 leading-snug font-medium">
                      {isAr
                        ? 'مشروع رقمنة وتأهيل شبكات البنية التحتية والمنشآت الذكية — ولاية الجزائر'
                        : 'Projet de numérisation des infrastructures de base — Wilaya d’Alger'}
                    </p>
                  </div>

                  {/* حالة القفل والتشفير المالي السيادي في إطار راقٍ */}
                  <div className="p-4 bg-emerald-950 rounded-2xl text-white space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? 'الظرف المالي مشفر ومقفل سيادياً' : 'Enveloppe Chiffrée'}</span>
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">AES-256 Bit</span>
                    </div>
                    <div className="font-mono text-[11px] text-emerald-200 truncate bg-slate-900 px-2.5 py-1.5 rounded-lg border border-emerald-800/80">
                      SHA256: 7f8a9b2c4e1d0938...bf62a
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{isAr ? 'موعد جلسة الفتح العلنية:' : 'Séance d’ouverture:'}</span>
                      </span>
                      <span className="text-white font-bold font-mono">15-11-2026 (10:00)</span>
                    </div>
                  </div>

                  {/* شريط حالة درع الامتثال الذكي المسبق */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-slate-800">
                        {isAr ? 'درع فحص الامتثال المسبق' : 'Bouclier de Conformité'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px]">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{isAr ? '100% مؤهل للإيداع' : '100% Validé'}</span>
                    </span>
                  </div>

                </div>

                {/* تذييل البطاقة المصغرة */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                    {isAr ? 'ختم سيادي رقمي معتمد' : 'Scellé Numérique Certifié'}
                  </span>
                  <span className="font-semibold text-slate-600">{isAr ? 'المادة 67 من القانون 23-12' : 'Art. 67 Loi 23-12'}</span>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. شريط المؤشرات الوطنية الحية (Live Sovereign Telemetry Bar)
               مع أيقونات فاخرة ومؤشرات حية نبضية
            ══════════════════════════════════════════════════════════════════ */}
        <div className="pt-10 border-t-2 border-amber-200/60">
          
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-amber-800 tracking-wider uppercase bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              {isAr ? 'المؤشرات السيادية الحية للمنظومة' : 'Indicateurs Souverains en Temps Réel'}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            
            {/* المؤشر 1: 69 ولاية */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">69</span>
                <div className="size-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                  <MapPin className="size-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <strong className="block text-xs sm:text-sm font-bold text-slate-900">
                  {isAr ? 'تغطية ولائية شاملة' : '69 Wilayas'}
                </strong>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight block">
                {isAr ? 'ربط موحد لكافة المصالح المتعاقدة عبر القطر' : 'Couverture de toutes les wilayas'}
              </span>
            </div>

            {/* المؤشر 2: 0% ورق */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono tracking-tight">0%</span>
                <div className="size-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                  <FileCheck2 className="size-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                <strong className="block text-xs sm:text-sm font-bold text-slate-900">
                  {isAr ? 'تجريد مادي كامل (ورق 0%)' : 'Zéro Papier (100% Démat)'}
                </strong>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight block">
                {isAr ? 'إيداع وفتح وتقييم رقمي بالكامل (المادة 67)' : 'Dépôt et évaluation 100% numériques'}
              </span>
            </div>

            {/* المؤشر 3: تشفير AES-256 */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">256-bit</span>
                <div className="size-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                  <Lock className="size-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                <strong className="block text-xs sm:text-sm font-bold text-slate-900">
                  {isAr ? 'تشفير سيادي مالي' : 'Chiffrement AES-256'}
                </strong>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight block">
                {isAr ? 'أقفال تشفيرية وأختام زمنية غير قابلة للتعديل' : 'Scellés temporels inviolables'}
              </span>
            </div>

            {/* المؤشر 4: 100% امتثال */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono tracking-tight">100%</span>
                <div className="size-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                  <Scale className="size-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                <strong className="block text-xs sm:text-sm font-bold text-slate-900">
                  {isAr ? 'امتثال تشريعي صارم' : 'Conformité Légale'}
                </strong>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight block">
                {isAr ? 'مطابقة للقانون 23-12 والمرسوم 15-247' : 'Alignement Loi 23-12 et Décret 15-247'}
              </span>
            </div>

            {/* المؤشر 5: 24/7 رقابة فورية */}
            <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl sm:text-3xl font-black text-teal-800 font-mono tracking-tight">24/7</span>
                <div className="size-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                  <Activity className="size-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="size-2 rounded-full bg-teal-500 animate-pulse shrink-0" />
                <strong className="block text-xs sm:text-sm font-bold text-slate-900">
                  {isAr ? 'رقابة ورادار ذكي' : 'Veille Intelligente'}
                </strong>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight block">
                {isAr ? 'عين الصقر ورادار الصفقات التنبؤي الآلي' : 'Hawk-Eye & Radar prédictif continu'}
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSovereign;
