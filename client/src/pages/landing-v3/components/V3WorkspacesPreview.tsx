import React, { useState } from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Users,
  Shield,
  Brain,
  Activity,
  FileText,
  CheckCircle2,
  Map,
  TrendingUp,
  Lock,
  Building2,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Monitor,
} from 'lucide-react';

export function V3WorkspacesPreview() {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'operator' | 'authority' | 'central'>('operator');

  const tabs = [
    {
      id: 'operator',
      label: isAr ? 'المتعامل الاقتصادي' : 'Opérateur Économique',
      icon: Users,
      badge: isAr ? 'سحب وإيداع مشفر' : 'Dépôt Scellé',
    },
    {
      id: 'authority',
      label: isAr ? 'المصلحة المتعاقدة' : 'Autorité Contractante',
      icon: Landmark,
      badge: isAr ? 'فتح وتقييم علني' : 'Ouverture Publique',
    },
    {
      id: 'central',
      label: isAr ? 'الإدارة المركزية' : 'Administration Centrale',
      icon: ShieldCheck,
      badge: isAr ? 'رقابة ونزاهة' : 'Audit & Rapatriement',
    },
  ];

  return (
    <section id="showcase" dir={dir} className="py-20 sm:py-24 bg-slate-50 relative overflow-hidden">
      {/* توهج خلفي خفيف يكرس طابع الأبيض السيادي */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200/80 bg-white/80 backdrop-blur-md text-emerald-800 text-xs sm:text-sm font-bold shadow-xs mb-4">
            <Monitor className="size-3.5 text-emerald-600" strokeWidth={2} />
            <span>{isAr ? 'تجربة استخدام حكومية فائقة' : 'Aperçu des Espaces de Travail'}</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            {isAr ? 'معاينة واجهات المنصة' : 'Aperçu des Interfaces'}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            {isAr
              ? 'تصفح مساحات العمل الثلاث واكتشف كيف تدير المنصة دورة حياة الصفقة من التقدير الأولي إلى الإقفال المالي.'
              : 'Explorez les trois espaces de travail et découvrez comment la plateforme orchestre le cycle de vie contractuel.'}
          </p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="bg-slate-200/70 p-1.5 rounded-2xl flex flex-wrap justify-center gap-1.5 border border-slate-200 shadow-2xs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Browser Mockup Chrome Container */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-2xl overflow-hidden transition-all duration-300">
            {/* شريط عنوان المتصفح (Browser Chrome) */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 select-none">
              {/* أزرار النافذة */}
              <div className="flex items-center gap-1.5 w-16">
                <span className="size-3 rounded-full bg-red-400 inline-block border border-red-500/30" />
                <span className="size-3 rounded-full bg-amber-400 inline-block border border-amber-500/30" />
                <span className="size-3 rounded-full bg-emerald-400 inline-block border border-emerald-500/30" />
              </div>

              {/* شريط الرابط المشفر السيادي */}
              <div className="flex-1 max-w-[460px] mx-auto">
                <div className="bg-white rounded-lg px-3.5 py-1.5 text-xs text-slate-500 font-mono border border-slate-200/80 flex items-center justify-center gap-2 shadow-2xs">
                  <Lock className="size-3.5 text-emerald-600" />
                  <span className="truncate">
                    https://safaqat.gov.dz/{activeTab}/dashboard
                  </span>
                </div>
              </div>

              {/* شارة الاتصال الحي */}
              <div className="w-16 flex items-center justify-end gap-1.5 text-[11px] font-mono text-emerald-700 font-bold">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            {/* محتوى مساحة العمل المصغرة (Mini UI) */}
            <div className="p-5 sm:p-7 bg-slate-50/50 min-h-[460px]">
              {activeTab === 'operator' && <OperatorWorkspace isAr={isAr} />}
              {activeTab === 'authority' && <AuthorityWorkspace isAr={isAr} />}
              {activeTab === 'central' && <CentralWorkspace isAr={isAr} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── مساحة عمل المتعامل الاقتصادي ──────────────────────────────────────────────
function OperatorWorkspace({ isAr }: { isAr: boolean }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* شريط الأدوات العلوي للمتعامل */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {isAr ? 'لوحة قيادة المتعامل الاقتصادي' : 'Tableau de bord Opérateur'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr ? 'إدارة العروض والمطابقة مع الشهادات الجبائية وشبه الجبائية' : 'Suivi des offres et vérification CNAS / CASNOS'}
          </p>
        </div>
        <Link
          href="/operator/deals"
          className="inline-flex items-center justify-center gap-1.5 bg-[#006233] hover:bg-[#004d28] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <span>{isAr ? 'إيداع عرض جديد' : 'Déposer une offre'}</span>
          <Lock className="size-3.5" />
        </Link>
      </div>

      {/* المؤشرات السريعة (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold mb-1">
            {isAr ? 'الفرص المطابقة لنشاطك' : 'Opportunités ciblées'}
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">12</div>
          <span className="text-[11px] text-emerald-700 font-medium">
            {isAr ? 'مطابقة آلية لرموز السجل التجاري' : 'Matching RC automatique'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold mb-1">
            {isAr ? 'عروض قيد التقييم' : 'Offres en évaluation'}
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">3</div>
          <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
            <Lock className="size-3" />
            <span>{isAr ? 'مشفرة بأقفال زمنية SHA-256' : 'Verrouillées SHA-256'}</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold mb-1">
            {isAr ? 'درجة الامتثال والجاهزية' : 'Score de conformité'}
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">98%</div>
          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            <span>{isAr ? 'ملف مؤهل للفتح الفوري' : 'Dossier complet et certifié'}</span>
          </span>
        </div>
      </div>

      {/* قائمة رادار الصفقات المتطابقة */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Sparkles className="size-4 text-emerald-600" />
            <span>{isAr ? 'رادار الفرص المتطابقة مع مجالك' : 'Opportunités Recommandées'}</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">AI Matcher v2</span>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex gap-3 items-center">
              <div className="size-9 bg-emerald-100/70 rounded-lg flex items-center justify-center text-emerald-700 shrink-0">
                <FileText className="size-4.5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">
                  {isAr ? 'إنجاز وتجهيز مجمع مدرسي صنف (ب)' : 'Construction et équipement d’un groupe scolaire'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {isAr ? 'ولاية الجزائر · 52,000,000 دج · ينتهي خلال 6 أيام' : 'Wilaya d’Alger · 52.000.000 DZD · Expire dans 6 jours'}
                </div>
              </div>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto">
              {isAr ? 'تطابق 95%' : 'Match 95%'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex gap-3 items-center">
              <div className="size-9 bg-blue-100/70 rounded-lg flex items-center justify-center text-blue-700 shrink-0">
                <FileText className="size-4.5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">
                  {isAr ? 'تحديث وتأمين منظومة خوادم البيانات الإدارية' : 'Sécurisation et modernisation de serveurs de données'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {isAr ? 'ولاية وهران · 38,500,000 دج · ينتهي خلال 11 يوماً' : 'Wilaya d’Oran · 38.500.000 DZD · Expire dans 11 jours'}
                </div>
              </div>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto">
              {isAr ? 'تطابق 92%' : 'Match 92%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── مساحة عمل المصلحة المتعاقدة ──────────────────────────────────────────────
function AuthorityWorkspace({ isAr }: { isAr: boolean }) {
  const deals = [
    {
      id: 'DZ-2026-031',
      title: isAr ? 'تجهيز عتاد طبي متقدم للمستشفى الجامعي' : 'Équipement biomédical pour CHU',
      stage: isAr ? 'تقييم العروض' : 'Évaluation des offres',
      stageClass: 'bg-blue-100 text-blue-800',
      status: isAr ? 'جلسة نشطة' : 'Séance active',
      officers: 'COPEM (5/5)',
    },
    {
      id: 'DZ-2026-032',
      title: isAr ? 'أشغال صيانة وإعادة تأهيل شبكة المياه' : 'Réhabilitation du réseau d’eau potable',
      stage: isAr ? 'منح مؤقت (طعون)' : 'Attribution provisoire',
      stageClass: 'bg-amber-100 text-amber-800',
      status: isAr ? 'فترة الطعن' : 'Délai de recours',
      officers: '10 jours',
    },
    {
      id: 'DZ-2026-033',
      title: isAr ? 'دراسة تقنية ومتابعة لمشروع ترامواي' : 'Étude technique de ligne tramway',
      stage: isAr ? 'إشهار وسحب دفاتر' : 'Publication & Retrait',
      stageClass: 'bg-emerald-100 text-emerald-800',
      status: isAr ? '24 سحب رقمي' : '24 retraits',
      officers: 'Loi 23-12',
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* شريط الأدوات العلوي للمصلحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {isAr ? 'إدارة الصفقات والمشتريات العمومية' : 'Gestion des Marchés Publics'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr ? 'إعداد دفاتر الشروط، جداول B.O.Q، وإدارة لجان فتح الأظرفة والتقييم' : 'Élaboration B.O.Q et séances d’ouverture des plis'}
          </p>
        </div>
        <Link
          href="/authority/deals"
          className="inline-flex items-center justify-center gap-1.5 bg-[#006233] hover:bg-[#004d28] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <span>{isAr ? 'إنشاء صفقة جديدة' : 'Nouveau Marché'}</span>
          <ArrowRight className="size-3.5 rtl:rotate-180" />
        </Link>
      </div>

      {/* جدول الصفقات المدمج */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold text-start">{isAr ? 'رقم الصفقة' : 'Réf. Marché'}</th>
                <th className="px-4 py-3 font-bold text-start">{isAr ? 'موضوع العملية' : 'Objet'}</th>
                <th className="px-4 py-3 font-bold text-start">{isAr ? 'المرحلة الحالية' : 'Étape'}</th>
                <th className="px-4 py-3 font-bold text-start">{isAr ? 'الحالة والنصاب' : 'Statut'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                    {deal.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div>{deal.title}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${deal.stageClass}`}>
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Activity className="size-3 text-emerald-600" />
                      <span>{deal.status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({deal.officers})</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-800">
        <span className="font-semibold flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-emerald-700" />
          <span>{isAr ? 'تأشيرة الرقابة القانونية: متوافقة مع المرسوم الرئاسي 15-247' : 'Visa de conformité validé selon décret 15-247'}</span>
        </span>
        <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-200">
          COPEM CERTIFIED
        </span>
      </div>
    </div>
  );
}

// ─── مساحة عمل الإدارة المركزية والرقابة ──────────────────────────────────────────
function CentralWorkspace({ isAr }: { isAr: boolean }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* شريط الأدوات العلوي للإدارة المركزية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {isAr ? 'المركز الرقابي الوطني والنزاهة المؤسسية' : 'Centre de Supervision Nationale'}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr ? 'المتابعة اللحظية للصفقات، الخريطة الحرارية للولايات، ورادار كشف التواطؤ' : 'Surveillance en temps réel et radar de détection des risques'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full font-bold animate-pulse self-start sm:self-auto">
          <AlertTriangle className="size-3.5" />
          <span>{isAr ? '3 تنبيهات حرجة تحت المعاينة' : '3 Alertes Sous Surveillance'}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* بطاقة التغطية الإقليمية (69 ولاية) */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Map className="size-4 text-emerald-700" />
              <span>{isAr ? 'التغطية الوطنية عبر 69 ولاية' : 'Couverture Territoriale (69 Wilayas)'}</span>
            </h4>
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              100% ONLINE
            </span>
          </div>

          <div className="h-36 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-600 text-xs border border-slate-200/80 p-4 text-center space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Activity className="size-4 text-emerald-600" />
              <span>{isAr ? 'شبكة الربط البيني اللحظي مفعلة' : 'Interconnexion Nationale Active'}</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              {isAr
                ? 'رصد مستمر لمصالح التعاقد الولائية، البلديات، والمؤسسات العمومية دون انقطاع'
                : 'Supervision continue des acheteurs publics régionaux et municipaux sans interruption'}
            </p>
            <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-slate-400">
              <span>ALGER · ORAN · CONSTANTINE · OUARGLA · SÉTIF</span>
            </div>
          </div>
        </div>

        {/* بطاقة رادار كشف التواطؤ ومؤشرات المخاطر */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <TrendingUp className="size-4 text-amber-600" />
              <span>{isAr ? 'رادار كشف التواطؤ والشبهات الإجرائية' : 'Radar de Risques & Collusion'}</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Law 23-12 Audit</span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 bg-rose-50/90 border border-rose-200 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-rose-800 font-bold">{isAr ? 'تحذير بصمة وثيقة:' : 'Alerte Empreinte :'}</span>{' '}
                <span className="text-slate-700">
                  {isAr ? 'تشابه في البصمة الرقمية لملفات فنية بين متعهدين اثنين في وهران.' : 'Similarité de métadonnées entre deux soumissionnaires à Oran.'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs flex items-start gap-2">
              <Activity className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-amber-800 font-bold">{isAr ? 'متابعة الآجال:' : 'Suivi des délais :'}</span>{' '}
                <span className="text-slate-700">
                  {isAr ? 'تأخر في إصدار أمر بداية الخدمة (ODS) لصفقة بولاية سطيف.' : 'Retard dans l’émission de l’Ordre de Service (ODS) à Sétif.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default V3WorkspacesPreview;
