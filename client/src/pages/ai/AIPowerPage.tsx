import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import V3Footer from '../landing-v3/components/V3Footer';
import {
  Sparkles,
  Bot,
  ScanSearch,
  BookOpenCheck,
  ShieldCheck,
  Calculator,
  Mic,
  Search,
  Clock,
  FileCode,
  Scale,
  TrendingUp,
  Network,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Construction,
  Layers,
  Globe,
  Home,
  ChevronRight,
} from 'lucide-react';

export const AIPowerPage: React.FC = () => {
  const { lang, dir, setLang } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'development'>('all');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = isAr
      ? 'قوة الذكاء الاصطناعي — صفقات ذكية'
      : 'Puissance de l’IA — Safaqat Dhakia';
  }, [isAr]);

  // قائمة الميزات المتاحة والمفعلة حالياً في المنصة
  const availableFeatures = [
    {
      id: 'smart-matching',
      title: isAr ? 'مطابقة الفرص الذكية' : 'Correspondance Intelligente des Marchés',
      target: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur',
      targetColor: 'text-[#0284c7] bg-sky-50 border-sky-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Sparkles,
      desc: isAr
        ? 'تحليل فوري لرموز السجل التجاري والأنشطة المعتمدة للمؤسسة وربطها التلقائي بالمناقصات الملائمة لتعزيز فرص المشاركة وتكافؤ الفرص.'
        : 'Analyse continue du registre de commerce de l’entreprise pour identifier et suggérer les marchés publics pertinents.',
      path: '/operator/deals',
    },
    {
      id: 'specs-analyzer',
      title: isAr ? 'تحليل وتلخيص دفاتر الشروط' : 'Synthèse et Analyse des Cahiers des Charges',
      target: isAr ? 'بوابة المتعامل والمصلحة' : 'Opérateur & Acheteur',
      targetColor: 'text-teal-700 bg-teal-50 border-teal-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: BookOpenCheck,
      desc: isAr
        ? 'استخلاص المعايير الفنية والمالية وجدول الآجال التعاقدية والشروط الإقصائية من دفاتر الشروط وتقديم ملخص تنفيذي مركز.'
        : 'Extraction automatisée des critères d’éligibilité, des délais légaux et des exigences techniques pour faciliter la soumission.',
      path: '/operator/smart-specs',
    },
    {
      id: 'compliance-shield',
      title: isAr ? 'الدرع الامتثالي قبل الإيداع' : 'Bouclier de Conformité Préalable',
      target: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur',
      targetColor: 'text-[#0284c7] bg-sky-50 border-sky-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: ShieldCheck,
      desc: isAr
        ? 'فحص قبلي شامل لملف الترشح والوثائق الإلزامية والشهادات الجبائية وشبه الجبائية لتدارك الأخطاء الشكلية وتجنب الإقصاء الإداري.'
        : 'Contrôle préventif des pièces administratives obligatoires (CNAS, CASNOS, impôts, caution) pour éviter tout rejet formel.',
      path: '/operator/offers',
    },
    {
      id: 'boq-estimator',
      title: isAr ? 'التقدير الإداري وجدول الكميات السري' : 'Estimation Administrative et BOQ Confidentiel',
      target: isAr ? 'بوابة المصلحة المتعاقدة' : 'Portail Service Contractant',
      targetColor: 'text-[#0b4348] bg-teal-50 border-teal-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Calculator,
      desc: isAr
        ? 'مساعدة المصلحة المتعاقدة في تحويل الاحتياجات إلى جدول كميات B.O.Q واقتراح أسعار وحدة تقديرية موضوعية قبل إطلاق طلب العروض وفق القانون 23-12.'
        : 'Aide à la structuration du bordereau des prix unitaires et à l’estimation confidentielle du coût d’objectif selon la Loi 23-12.',
      path: '/authority/deals',
    },
    {
      id: 'operator-assistant',
      title: isAr ? 'المساعد الذكي للمتعامل الاقتصادي' : 'Copilote Numérique de l’Opérateur',
      target: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur',
      targetColor: 'text-[#0284c7] bg-sky-50 border-sky-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Bot,
      desc: isAr
        ? 'مساعد حواري ذكي يشرح متطلبات الصفقات بالدينار الجزائري ويساعد في إعداد مسودات العروض المالية والتقنية المنظمة دون اتخاذ قرارات نهائية.'
        : 'Assistant conversationnel guidant la préparation des offres financières et techniques et clarifiant les exigences contractuelles.',
      path: '/operator/assistant',
    },
    {
      id: 'anti-collusion-radar',
      title: isAr ? 'رادار مكافحة التواطؤ عين الصقر' : 'Radar Anti-Collusion Œil de Faucon',
      target: isAr ? 'بوابة الرقابة المركزية' : 'Supervision Centrale',
      targetColor: 'text-amber-800 bg-amber-50 border-amber-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: ScanSearch,
      desc: isAr
        ? 'تحليل مؤشرات المخاطر ودعم رصد السلوكيات المشبوهة كأداة تحليلية واستشارية مساندة لأجهزة الرقابة، دون إصدار أي قرار قانوني.'
        : 'Analyse des indicateurs de risque et appui à la détection des comportements suspects, en tant qu’outil consultatif sans décision juridique.',
      path: '/central',
    },
    {
      id: 'legal-rag',
      title: isAr ? 'المسترجع القانوني الذكي' : 'Moteur de Recherche Juridique RAG',
      target: isAr ? 'كافة المتدخلين في المنظومة' : 'Tous les Acteurs',
      targetColor: 'text-slate-800 bg-slate-100 border-slate-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Search,
      desc: isAr
        ? 'استرجاع دلالي فوري من نصوص القانون رقم 23-12 والمرسوم الرئاسي 15-247 لتوفير السند القانوني الصريح لأي استفسار تعاقدي.'
        : 'Recherche sémantique instantanée dans le corpus de la Loi 23-12 et du Décret 15-247 pour répondre aux questions réglementaires.',
      path: '/faq',
    },
    {
      id: 'voice-copilot',
      title: isAr ? 'المساعد الصوتي الموجه' : 'Copilote Vocal Interactif',
      target: isAr ? 'إمكانية الوصول والشمول الرقمي' : 'Accessibilité Numérique',
      targetColor: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Mic,
      desc: isAr
        ? 'واجهة تفاعلية موجهة تدعم الاستفسار والتوجيه الصوتي لتسهيل الوصول إلى الصفقات والخدمات دون عوائق تقنية.'
        : 'Interface vocale facilitant la navigation et la recherche vocale pour une accessibilité gouvernementale optimale.',
      path: '/accessibility',
    },
  ];

  // قائمة الميزات الذكية قيد التطوير والتحضير
  const upcomingFeatures = [
    {
      id: 'project-delay-predictor',
      title: isAr ? 'المتنبئ الذكي بالتعثر والآجال' : 'Prédicteur de Retard et Dérive des Délais',
      target: isAr ? 'المصالح المتعاقدة وهيئات الرقابة' : 'Acheteurs Publics & Contrôle',
      targetColor: 'text-[#0b4348] bg-teal-50 border-teal-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '75%',
      icon: Clock,
      desc: isAr
        ? 'نماذج استباقية تحلل تقدم ورشات الصفقات العمومية وتتنبأ باحتمالات تجاوز الآجال التعاقدية أو الحاجة إلى ملاحق قبل تفاقمها.'
        : 'Modèles prédictifs anticipant les dérives de délais contractuels et alertant sur les goulots d’étranglement dans l’exécution.',
    },
    {
      id: 'neutral-specs-generator',
      title: isAr ? 'صانع دفاتر الشروط المحايدة' : 'Générateur de Cahiers des Charges Neutres',
      target: isAr ? 'المصالح المتعاقدة' : 'Services Contractants',
      targetColor: 'text-[#0b4348] bg-teal-50 border-teal-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '65%',
      icon: FileCode,
      desc: isAr
        ? 'صياغة آلية لبنود المواصفات الفنية المحايدة التي تضمن عدم تفصيل الشروط على مقاس متعهد محدد وتكرس المنافسة العادلة والشريفة.'
        : 'Assistance à la rédaction de spécifications techniques neutres et non orientées, garantissant le respect de l’égalité d’accès.',
    },
    {
      id: 'bid-matrix-analyzer',
      title: isAr ? 'المحلل المقارن للعروض المالية' : 'Analyseur Comparatif des Offres Financières',
      target: isAr ? 'لجان فتح وتقييم العروض COPEM' : 'Commissions d’Évaluation',
      targetColor: 'text-blue-800 bg-blue-50 border-blue-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '60%',
      icon: Scale,
      desc: isAr
        ? 'مساندة لجان التقييم في كشف الأسعار المنخفضة بشكل غير طبيعي أو المرتفعة بصورة مفرطة ومقارنة التقديرات الإدارية تلقائياً.'
        : 'Détection automatisée des offres anormalement basses ou excessives et génération d’analyses comparatives objectives.',
    },
    {
      id: 'conciliation-assistant',
      title: isAr ? 'مساعد التسوية الودية للنزاعات' : 'Assistant d’Aide à la Conciliation Amiable',
      target: isAr ? 'لجان التسوية والطعون' : 'Comités de Règlement Amiable',
      targetColor: 'text-purple-800 bg-purple-50 border-purple-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '50%',
      icon: TrendingUp,
      desc: isAr
        ? 'تحليل مذكرات الطعون والمنازعات واقتراح حلول تسوية ودية نظامية مستندة إلى سوابق الصفقات العمومية وأحكام القانون رقم 23-12.'
        : 'Analyse des recours préalables et structuration des dossiers de conciliation conformément aux dispositions légales.',
    },
    {
      id: 'national-price-benchmark',
      title: isAr ? 'بنك الأسعار المرجعية الوطنية عبر 69 ولاية' : 'Observatoire National des Prix de Référence',
      target: isAr ? 'الرقابة المركزية وكافة الإدارات' : 'Supervision & Administrations',
      targetColor: 'text-slate-800 bg-slate-100 border-slate-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '80%',
      icon: Network,
      desc: isAr
        ? 'بناء قاعدة بيانات مرجعية لمتوسط أسعار المواد والخدمات عبر الـ 69 ولاية جزائرية لمساعدة المصالح في ترشيد الإنفاق العمومي.'
        : 'Constitution d’une base de données nationale des prix moyens unitaires à travers les 69 wilayas pour rationaliser la commande.',
    },
  ];

  const filteredAvailable = activeTab === 'development' ? [] : availableFeatures;
  const filteredUpcoming = activeTab === 'available' ? [] : upcomingFeatures;

  return (
    <div
      dir={dir}
      lang={lang}
      className="min-h-screen bg-[#ffffff] text-[#080808] font-sans antialiased selection:bg-[#006233] selection:text-white"
    >
      {/* ─── الشريط العلوي الرئاسي والتنقل ─── */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90" style={{ height: '56px' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center size-8 rounded-[4px] bg-[#146ef5] text-white">
              <Logo size={20} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans text-[17px] font-bold text-[#080808] tracking-tight">
                {isAr ? 'صفقات ذكية' : 'Safaqat'}
              </span>
              <span className="size-1.5 rounded-full bg-[#146ef5]" />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Home className="size-4 text-slate-500" />
              <span>{isAr ? 'الرئيسية' : 'Accueil'}</span>
            </Link>

            <button
              type="button"
              onClick={() => setLang(isAr ? 'fr' : 'ar')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <Globe className="size-3.5" />
              <span>{isAr ? 'FR' : 'عربي'}</span>
            </button>

            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-1.5 text-xs sm:text-sm font-bold text-white bg-[#006233] hover:bg-[#004d28] rounded-lg transition-colors shadow-2xs"
            >
              {isAr ? 'الدخول إلى المنصة' : 'Connexion'}
            </Link>
          </div>
        </div>
      </header>

      {/* ─── صلب الصفحة ─── */}
      <main className="relative pb-20">
        {/* خلفية زليج جزائري خفيفة وهادئة جداً */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(#006233 0.75px, transparent 0.75px), radial-gradient(#d21034 0.75px, #ffffff 0.75px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px',
          }}
        />

        {/* رأس الصفحة ومسار التنقل */}
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 sm:pb-12 text-center">
          {/* Breadcrumb */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              {isAr ? 'الرئيسية' : 'Accueil'}
            </Link>
            <ChevronRight className="size-3 text-slate-400 rtl:rotate-180" />
            <span className="text-[#006233] font-bold">
              {isAr ? 'قوة الذكاء الاصطناعي' : 'Puissance de l’IA'}
            </span>
          </div>

          {/* شارة سيادية */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/80 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs">
              <Sparkles className="size-4 text-[#006233]" />
              <span>{isAr ? 'منظومة الذكاء الاصطناعي السيادي' : 'Intelligence Artificielle Souveraine'}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {isAr ? 'قوة الذكاء الاصطناعي في صفقات ذكية' : 'La Puissance de l’IA dans Safaqat Dhakia'}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
            {isAr
              ? 'دليل شامل لجميع الأدوات الخوارزمية المعتمدة حالياً في المنصة، مع استعراض الميزات الجاري تطويرها لمساندة المتعاملين والمصالح وهيئات الرقابة وفق القانون رقم 23-12 والمرسوم الرئاسي 15-247.'
              : 'Panorama complet des capacités algorithmiques opérationnelles et des innovations en cours de développement pour la commande publique algérienne.'}
          </p>

          {/* أزرار التصفية السريعة */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {isAr ? 'جميع الميزات' : 'Toutes les fonctionnalités'}
              <span className="ms-2 px-2 py-0.5 rounded-full text-[11px] bg-white/20">
                {availableFeatures.length + upcomingFeatures.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'available'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              {isAr ? 'الميزات المتاحة حالياً' : 'Fonctionnalités disponibles'}
              <span className="ms-2 px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-900 font-black">
                {availableFeatures.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('development')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'development'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              {isAr ? 'ميزات قيد التطوير' : 'En cours de développement'}
              <span className="ms-2 px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-900 font-black">
                {upcomingFeatures.length}
              </span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            القسم الأول: الميزات المتاحة حالياً في المنصة
            ══════════════════════════════════════════════════════════════════════ */}
        {filteredAvailable.length > 0 && (
          <section className="relative max-w-[1200px] mx-auto px-4 sm:px-6 mb-16">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-200">
              <div className="size-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#006233]">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {isAr ? 'الميزات المتاحة والجاهزة للاستخدام' : 'Fonctionnalités Opérationnelles et Disponibles'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {isAr
                    ? 'أدوات ذكية مدمجة ومفعلة يمكن للمتعاملين والمصالح استخدامها فور تسجيل الدخول'
                    : 'Outils opérationnels intégrés utilisables dès la connexion'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAvailable.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="size-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#006233] shadow-2xs group-hover:scale-105 transition-transform">
                          <Icon className="size-5" strokeWidth={1.75} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tool.targetColor}`}>
                            {tool.target}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tool.statusColor}`}>
                            {tool.status}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-snug group-hover:text-[#006233] transition-colors">
                        {tool.title}
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">
                        {isAr ? 'أداة مساندة معتمدة' : 'Outil certifié'}
                      </span>
                      <Link
                        href={tool.path}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006233] hover:text-[#004d28] group/link"
                      >
                        <span>{isAr ? 'تجربة الأداة' : 'Accéder'}</span>
                        <ArrowIcon className="size-3.5 transition-transform group-hover/link:translate-x-1 rtl:group-hover/link:-translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            القسم الثاني: ميزات قيد التطوير والتحضير
            ══════════════════════════════════════════════════════════════════════ */}
        {filteredUpcoming.length > 0 && (
          <section className="relative max-w-[1200px] mx-auto px-4 sm:px-6 mb-16">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-200">
              <div className="size-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Construction className="size-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {isAr ? 'الميزات قيد التطوير والتدريب المتقدم' : 'Fonctionnalités en Cours de Développement'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {isAr
                    ? 'نماذج ذكاء اصطناعي متقدمة تخضع حالياً لمراحل التدريب والضبط وفق المعايير الجزائرية'
                    : 'Modèles d’IA avancés en cours d’entraînement selon les normes algériennes'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUpcoming.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl border border-amber-200/80 p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* شريط خلفي خفيف يشير إلى قيد التطوير */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />

                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                          <Icon className="size-5" strokeWidth={1.75} />
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </div>

                      <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-2.5 ${item.targetColor}`}>
                        {item.target}
                      </span>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-amber-800 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-5">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                        <span>{isAr ? 'نسبة الإنجاز التقني' : 'Progression'}</span>
                        <span className="text-amber-800 font-bold">{item.progress}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: item.progress }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            الإطار المرجعي الأخلاقي والقانوني
            ══════════════════════════════════════════════════════════════════════ */}
        <section className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-6 sm:p-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-3">
              <Scale className="size-3.5 text-[#006233]" />
              <span>{isAr ? 'المحددات الأخلاقية والقانونية' : 'Cadre Éthique et Juridique'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              {isAr ? 'الذكاء الاصطناعي للمساندة والقرار البشري هو السيد' : 'L’IA comme Outil d’Aide à la Décision'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              {isAr
                ? 'تلتزم منصة صفقات ذكية بأن تكون جميع خوارزميات الذكاء الاصطناعي أدوات استشارية وتحليلية لمساندة لجان الصفقات وأجهزة الرقابة والمتعاملين، ويبقى القرار البشري والإداري هو السيد المسؤول قانونياً وفق أحكام القانون رقم 23-12.'
                : 'L’intelligence artificielle agit exclusivement comme un support consultatif; la responsabilité juridique des décisions incombe pleinement aux commissions compétentes selon la Loi 23-12.'}
            </p>
          </div>
        </section>
      </main>

      {/* ─── التذييل المؤسسي الراقي ─── */}
      <V3Footer />
    </div>
  );
};

export default AIPowerPage;
