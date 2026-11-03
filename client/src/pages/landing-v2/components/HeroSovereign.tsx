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
  Fingerprint
} from 'lucide-react';

export const HeroSovereign: React.FC = () => {
  const { lang } = useI18n();
  const isAr = lang === 'ar';

  return (
    <section id="overview" className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/80">
      {/* خلفية هندسية شبكية هادئة مؤسسية (لا كرات عائمة ملونة) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#006233 1px, transparent 1px), radial-gradient(#0f172a 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px'
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ══════════ الجانب الأيمن / الرئيسي: العنوان وهوية المنصة المطورة ══════════ */}
          <div className="lg:col-span-7 flex flex-col items-start text-start">
            
            {/* الشارة السيادية العليا */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-bold mb-6 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                {isAr
                  ? 'المنظومة الوطنية الموحدة — إصدار السيادة الرقمية 2026'
                  : 'Système National Unifié — Édition Souveraine 2026'}
              </span>
            </div>

            {/* اسم المنصة المركزي المطور والعنوان الاستراتيجي */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black text-slate-900 tracking-tight leading-[1.18] font-cairo mb-6">
              <span>{isAr ? 'منصة ' : 'Plateforme '}</span>
              <span className="text-emerald-800 underline decoration-emerald-500/30 decoration-wavy underline-offset-8">
                {isAr ? 'صفقات ذكية' : 'Safaqat Dhakia'}
              </span>
              <span className="block text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-extrabold text-slate-700 mt-3 sm:mt-4 leading-snug">
                {isAr
                  ? 'الصفقات العمومية الجزائرية برؤية رقمية سيادية'
                  : 'Les Marchés Publics Algériens à l’Ère de la Souveraineté Numérique'}
              </span>
            </h1>

            {/* النص الإيضاحي الموثق بالقانون */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-8 font-medium">
              {isAr
                ? 'التجسيد الميداني الكامل لمبدأ التجريد المادي للصفقات العمومية عملاً بأحكام المادة 67 من القانون 23-12. فضاء سيادي موحد يجمع المصلحة المتعاقدة، المتعامل الاقتصادي، والإدارة المركزية تحت معايير التشفير المالي المتقدم والرقابة الذكية الشاملة.'
                : 'La concrétisation intégrale de la dématérialisation des marchés publics selon l’article 67 de la Loi 23-12. Un espace souverain unifié reliant l’Autorité Contractante, l’Opérateur Économique et l’Administration Centrale avec chiffrement financier et gouvernance intelligente.'}
            </p>

            {/* أزرار الإجراء والتحويل (CTAs) */}
            <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto mb-10">
              <a
                href="#portals"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-base shadow-sm hover:shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
              >
                <span>{isAr ? 'دخول البوابات السيادية' : 'Accéder aux Portails'}</span>
                {isAr ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </a>

              <a
                href="#lifecycle"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-base border border-slate-300 shadow-2xs hover:border-slate-400 transition-all focus:outline-hidden"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'استكشاف مسار الصفقة (7 مراحل)' : 'Cycle de vie (7 phases)'}</span>
              </a>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-sm font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                <Lock className="w-4 h-4" />
                <span>{isAr ? 'دخول فوري للمنصة' : 'Connexion directe'}</span>
              </Link>
            </div>

            {/* شريط الأمان والضمانات الرسمية */}
            <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-200/90 w-full text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'مطابق للقانون 23-12' : 'Conforme Loi 23-12'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'تأشيرة المرسوم 15-247' : 'Visa Décret 15-247'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'أختام تشفير SHA-256' : 'Scellés SHA-256'}</span>
              </div>
            </div>

          </div>

          {/* ══════════ الجانب الأيسر: بطاقة المعاينة الواقعية لصفقة رقمية مشفرة (Live Sovereign Card) ══════════ */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* إطار فخم للبطاقة مع خلفية مصقولة */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden relative">
                
                {/* ترويسة البطاقة الرسمية */}
                <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                      <Logo size={28} />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-emerald-400 tracking-wider">
                        {isAr ? 'الجمهورية الجزائرية الديمقراطية الشعبية' : 'République Algérienne'}
                      </span>
                      <strong className="block text-sm sm:text-base font-bold text-white font-cairo">
                        {isAr ? 'وثيقة صفقة عمومية رقمية' : 'Marché Public Dématérialisé'}
                      </strong>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    DZ-2026-084
                  </span>
                </div>

                {/* جسم البطاقة وبيانات الصفقة الحية */}
                <div className="p-5 sm:p-6 space-y-4 text-slate-800 text-sm">
                  
                  {/* المصلحة المتعاقدة */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
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
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="block text-xs font-semibold text-emerald-800 mb-1">
                      {isAr ? 'موضوع طلب العروض الوطني' : 'Objet du Marché'}
                    </span>
                    <p className="text-xs text-slate-700 leading-snug font-medium">
                      {isAr
                        ? 'مشروع رقمنة وتأهيل شبكات البنية التحتية والمنشآت الذكية — ولاية الجزائر'
                        : 'Projet de numérisation des infrastructures de base — Wilaya d’Alger'}
                    </p>
                  </div>

                  {/* حالة القفل والتشفير المالي السيادي */}
                  <div className="p-3.5 bg-slate-900 rounded-xl text-white space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isAr ? 'الظرف المالي مشفر ومقفل' : 'Enveloppe Chiffrée'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">AES-256 Bit</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-300 truncate bg-slate-800/90 px-2 py-1 rounded border border-slate-700">
                      SHA256: 7f8a9b2c4e1d0938...bf62a
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{isAr ? 'موعد جلسة الفتح العلنية:' : 'Ouverture publique:'}</span>
                      </span>
                      <span className="text-white font-bold">15-11-2026 (10:00)</span>
                    </div>
                  </div>

                  {/* شريط حالة درع الامتثال الذكي المسبق */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-700">
                        {isAr ? 'درع فحص الامتثال المسبق' : 'Bouclier de Conformité'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                      <Sparkles className="w-3 h-3" />
                      <span>{isAr ? '100% مؤهل للإيداع' : '100% Validé'}</span>
                    </span>
                  </div>

                </div>

                {/* تذييل البطاقة المصغرة */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {isAr ? 'ختم سيادي رقمي معتمد' : 'Scellé Numérique Certifié'}
                  </span>
                  <span>{isAr ? 'المادة 67 من القانون 23-12' : 'Art. 67 Loi 23-12'}</span>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ══════════ شريط المؤشرات الوطنية الحية (National Telemetry Bar) ══════════ */}
        <div className="mt-14 sm:mt-16 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            
            {/* المؤشر 1: 69 ولاية */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">69</span>
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <strong className="block text-sm font-bold text-slate-800">
                {isAr ? 'تغطية ولائية شاملة' : '69 Wilayas couvertes'}
              </strong>
              <span className="text-xs text-slate-500">
                {isAr ? 'ربط موحد لكافة المصالح المتعاقدة عبر القطر' : 'Interconnexion de toutes les collectivités'}
              </span>
            </div>

            {/* المؤشر 2: 0% ورق */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">0%</span>
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
              </div>
              <strong className="block text-sm font-bold text-slate-800">
                {isAr ? 'تجريد مادي كامل (ورق 0%)' : 'Zéro Papier (Démat)'}
              </strong>
              <span className="text-xs text-slate-500">
                {isAr ? 'إيداع وفتح وتقييم رقمي بالكامل (المادة 67)' : 'Dépôt, ouverture et PV 100% numériques'}
              </span>
            </div>

            {/* المؤشر 3: تشفير AES-256 */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">256-bit</span>
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              <strong className="block text-sm font-bold text-slate-800">
                {isAr ? 'تشفير سيادي مالي' : 'Chiffrement AES-256'}
              </strong>
              <span className="text-xs text-slate-500">
                {isAr ? 'أقفال تشفيرية وأختام زمنية غير قابلة للاختراق' : 'Scellés temporels inviolables'}
              </span>
            </div>

            {/* المؤشر 4: 100% امتثال */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">100%</span>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <strong className="block text-sm font-bold text-slate-800">
                {isAr ? 'امتثال تشريعي صارم' : 'Conformité Légale'}
              </strong>
              <span className="text-xs text-slate-500">
                {isAr ? 'مطابقة للقانون 23-12 والمرسوم 15-247' : 'Alignement Loi 23-12 et Décret 15-247'}
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSovereign;
