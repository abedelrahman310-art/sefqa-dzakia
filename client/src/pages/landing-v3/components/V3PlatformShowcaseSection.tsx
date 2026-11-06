import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  Monitor,
  Lock,
  Building2,
  Landmark,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Users,
  Eye,
  FileCheck,
  Download,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const V3PlatformShowcaseSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'operator' | 'authority' | 'central'>('operator');

  return (
    <section
      id="showcase"
      dir={dir}
      className="relative w-full bg-transparent py-16 sm:py-20 px-4 sm:px-6 overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto">
        {/* رأس القسم */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/30 bg-white/15 backdrop-blur-md text-white text-xs sm:text-sm font-bold shadow-sm mb-4">
            <Monitor className="size-3.5 text-emerald-300" strokeWidth={2} />
            <span>{isAr ? 'تجربة استخدام حكومية فائقة' : 'Aperçu des Espaces'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
            {isAr ? 'معاينة واجهات المنصة' : 'Aperçu Interactif des Espaces'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-blue-100 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'واجهات رقمية احترافية مصممة خصيصاً لكل متدخل في مسار الصفقات العمومية'
              : 'Des environnements ergonomiques dédiés à chaque intervenant dans la commande publique'}
          </p>
        </div>

        {/* أزرار التبديل بين البوابات الثلاث (Tabs) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('operator')}
            className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'operator'
                ? 'bg-[#006233] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <Building2 className="size-4" />
            <span>{isAr ? 'فضاء المتعامل الاقتصادي' : 'Espace Opérateur'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('authority')}
            className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'authority'
                ? 'bg-[#006233] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <Landmark className="size-4" />
            <span>{isAr ? 'فضاء المصلحة المتعاقدة' : 'Espace Service Contractant'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('central')}
            className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'central'
                ? 'bg-[#006233] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>{isAr ? 'فضاء الإدارة المركزية' : 'Espace Administration Centrale'}</span>
          </button>
        </div>

        {/* إطار نافذة المتصفح للمعاينة الحية (Browser Frame Mockup) */}
        <div className="max-w-[1040px] mx-auto rounded-2xl border border-slate-200/90 bg-white shadow-md overflow-hidden transition-all duration-300">
          
          {/* شريط عنوان المتصفح العلوي */}
          <div className="h-10 bg-slate-100/90 border-b border-slate-200 px-4 flex items-center justify-between select-none">
            {/* أزرار التحكم بالنوافذ */}
            <div className="flex items-center gap-1.5 w-16">
              <span className="size-2.5 rounded-full bg-rose-400 inline-block border border-rose-500/40" />
              <span className="size-2.5 rounded-full bg-amber-400 inline-block border border-amber-500/40" />
              <span className="size-2.5 rounded-full bg-emerald-400 inline-block border border-emerald-500/40" />
            </div>

            {/* شريط الرابط المشفر */}
            <div className="flex-1 max-w-[420px] mx-auto">
              <div className="bg-white border border-slate-200/90 rounded-md px-3 py-1 flex items-center justify-center gap-1.5 text-xs font-mono text-slate-600 shadow-2xs">
                <Lock className="size-3 text-emerald-600" />
                <span className="truncate">
                  {activeTab === 'operator' && 'safaqat.dz/operator/deals'}
                  {activeTab === 'authority' && 'safaqat.dz/authority/opening-sessions'}
                  {activeTab === 'central' && 'safaqat.dz/central/monitoring'}
                </span>
              </div>
            </div>

            {/* شارة الاتصال الحي */}
            <div className="w-16 flex items-center justify-end gap-1.5 text-[11px] font-mono text-emerald-700 font-bold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          {/* محتوى الشاشة التفاعلي بحسب التبويب النشط */}
          <div className="p-6 sm:p-8 bg-slate-50/40 min-h-[380px]">
            {activeTab === 'operator' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      AO-2026-DZ-041
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {isAr ? 'عصرنة ورقمنة شبكات الربط الإداري' : 'Modernisation des Réseaux Informatiques'}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {isAr ? 'وزارة البريد والمواصلات السلكية واللاسلكية' : 'Ministère de la Poste et des Télécoms'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <Lock className="size-3" />
                      <span>{isAr ? 'العرض مشفر SHA-256' : 'Offre Scellée SHA-256'}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{isAr ? 'حالة دفتر الشروط' : 'Cahier des charges'}</span>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FileCheck className="size-4 text-emerald-600" />
                      <span>{isAr ? 'تم السحب الرقمي' : 'Retiré avec récépissé'}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{isAr ? 'الدرع الامتثالي' : 'Audit préventif'}</span>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span>{isAr ? 'مطابق للشهادات الجبائية' : 'Conformité CNAS/DGI validée'}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{isAr ? 'موعد جلسة الفتح' : 'Séance d’ouverture'}</span>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      2026-11-20 · 10:00
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'authority' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      SESSION-LIVE-08
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {isAr ? 'غرفة التحكم بجلسة فتح الأظرفة المباشرة' : 'Contrôle de la Séance d’Ouverture Publique'}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {isAr ? 'لجنة فتح الأظرفة وتقييم العروض (COPEM)' : 'Commission d’Ouverture des Plis (COPEM)'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    <Users className="size-3.5" />
                    <span>{isAr ? 'النصاب القانوني مكتمل' : 'Quorum Légal Atteint'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{isAr ? 'الأظرفة المودعة' : 'Plis enregistrés'}</span>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="size-4 text-emerald-600" />
                      <span>{isAr ? 'أظرفة مشفرة ومختومة' : 'Plis scellés'}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{isAr ? 'التقدير المالي السري' : 'Estimation B.O.Q'}</span>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      <span>{isAr ? 'محمي ومحجوب حتى الفتح' : 'Protégé sous clé'}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{isAr ? 'محضر الجلسة الرقمي' : 'PV Numérique'}</span>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="size-4 text-blue-600" />
                      <span>{isAr ? 'جاهز للتوقيع 15-04' : 'Prêt pour signature 15-04'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'central' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                      CENTRAL-CONTROL-DZ
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {isAr ? 'لوحة المراقبة الاستباقية والنزاهة المؤسسية' : 'Tableau de Bord du Contrôle Central'}
                    </h4>
                    <span className="text-xs text-slate-500">
                      {isAr ? 'المفتشية العامة وسلطة ضبط الصفقات العمومية' : 'Inspection Générale et Autorité de Régulation'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>{isAr ? 'الوضع الرقابي سليم' : 'Conformité Totale'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{isAr ? 'رادار المخاطر والشبهات' : 'Radar de risques'}</span>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      <span>{isAr ? 'فحص آلي مستمر' : 'Audit algorithmique actif'}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{isAr ? 'التغطية الإقليمية' : 'Couverture territoriale'}</span>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="size-4 text-blue-600" />
                      <span>{isAr ? '69 ولاية تحت المتابعة' : '69 Wilayas interconnectées'}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{isAr ? 'سجل العمليات المشفر' : 'Journal d’audit'}</span>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="size-4 text-emerald-600" />
                      <span>{isAr ? 'سجل تدقيق تراكمي موثق' : 'Journal d’audit certifié'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};

export default V3PlatformShowcaseSection;