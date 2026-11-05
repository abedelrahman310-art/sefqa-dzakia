import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
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
  Filter,
  Check,
  Cpu,
  Shield,
  Lock,
  Calendar,
  Building2,
  Landmark,
  Eye,
} from 'lucide-react';

export const AIPowerPage: React.FC = () => {
  const { lang, dir, setLang } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'development'>('all');
  const [targetFilter, setTargetFilter] = useState<'all' | 'operator' | 'authority' | 'central'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      portalKey: 'operator',
      title: isAr ? 'مطابقة الفرص الذكية' : 'Correspondance Intelligente des Marchés',
      target: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur',
      targetColor: 'text-[#0284c7] bg-sky-50 border-sky-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Sparkles,
      desc: isAr
        ? 'تحليل فوري لرموز السجل التجاري والأنشطة المعتمدة للمؤسسة وربطها التلقائي بالمناقصات الملائمة لتعزيز فرص المشاركة وتكافؤ الفرص'
        : 'Analyse continue du registre de commerce de l’entreprise pour identifier et suggérer les marchés publics pertinents sans exclusion.',
      highlights: isAr
        ? [
            'مطابقة لحظية مع رموز السجل التجاري',
            'رصد مستمر لمناقصات ولايات الجزائر الـ 69',
            'تنبيهات استباقية بالفرص الأكثر ملاءمة',
          ]
        : [
            'Correspondance instantanée avec les codes d’activité',
            'Surveillance des marchés des 69 wilayas',
            'Alertes proactives sur les opportunités adaptées',
          ],
      path: '/operator/deals',
    },
    {
      id: 'specs-analyzer',
      portalKey: 'operator',
      title: isAr ? 'تحليل وتلخيص دفاتر الشروط' : 'Synthèse et Analyse des Cahiers des Charges',
      target: isAr ? 'بوابة المتعامل والمصلحة' : 'Opérateur & Acheteur',
      targetColor: 'text-teal-700 bg-teal-50 border-teal-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: BookOpenCheck,
      desc: isAr
        ? 'استخلاص المعايير الفنية والمالية وجدول الآجال التعاقدية والشروط الإقصائية من دفاتر الشروط وتقديم ملخص تنفيذي مركز'
        : 'Extraction automatisée des critères d’éligibilité des délais légaux et des exigences techniques pour faciliter la soumission.',
      highlights: isAr
        ? [
            'استخراج فوري للآجال والشروط الإقصائية',
            'جدول مقارن للوثائق الإدارية المطلوبة',
            'ملخص تنفيذي لمتطلبات دفتر الشروط',
          ]
        : [
            'Extraction des délais et clauses éliminatoires',
            'Grille des pièces administratives obligatoires',
            'Synthèse claire du cahier des charges',
          ],
      path: '/operator/smart-specs',
    },
    {
      id: 'compliance-shield',
      portalKey: 'operator',
      title: isAr ? 'الدرع الامتثالي قبل الإيداع' : 'Bouclier de Conformité Préalable',
      target: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur',
      targetColor: 'text-[#0284c7] bg-sky-50 border-sky-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: ShieldCheck,
      desc: isAr
        ? 'فحص قبلي شامل لملف الترشح والوثائق الإلزامية والشهادات الجبائية وشبه الجبائية لتدارك الأخطاء الشكلية وتجنب الإقصاء الإداري'
        : 'Contrôle préventif des pièces administratives obligatoires pour éviter tout rejet formel lors de l’ouverture des plis.',
      highlights: isAr
        ? [
            'تدقيق آلي لشهادات CNAS وCASNOS والضرائب',
            'كشف النواقص الشكلية قبل جلسة الفتح',
            'تقليل احتمالات الإقصاء الإداري الشكلي',
          ]
        : [
            'Audit des certificats fiscaux et parafiscaux',
            'Détection des pièces manquantes avant dépôt',
            'Réduction du risque de rejet formel',
          ],
      path: '/operator/offers',
    },
    {
      id: 'boq-estimator',
      portalKey: 'authority',
      title: isAr ? 'التقدير الإداري وجدول الكميات السري' : 'Estimation Administrative et BOQ Confidentiel',
      target: isAr ? 'بوابة المصلحة المتعاقدة' : 'Portail Service Contractant',
      targetColor: 'text-[#006233] bg-emerald-50 border-emerald-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Calculator,
      desc: isAr
        ? 'مساعدة المصلحة المتعاقدة في تحويل الاحتياجات إلى جدول كميات BOQ واقتراح أسعار وحدة تقديرية موضوعية قبل إطلاق طلب العروض وفق القانون 23-12'
        : 'Aide à la structuration du bordereau des prix unitaires et à l’estimation confidentielle du coût d’objectif selon la Loi 23-12.',
      highlights: isAr
        ? [
            'توليد هيكل بنود جدول الكميات بدقة',
            'اقتراح أسعار مرجعية متوافقة مع السوق المحلي',
            'حفظ سرية التقدير المالي الإداري المبدئي',
          ]
        : [
            'Structuration automatisée du bordereau BOQ',
            'Prix de référence selon le marché algérien',
            'Confidentialité stricte du coût estimatif',
          ],
      path: '/authority/deals',
    },
    {
      id: 'operator-assistant',
      portalKey: 'operator',
      title: isAr ? 'المساعد الذكي للمتعامل الاقتصادي' : 'Copilote Numérique de l’Opérateur',
      target: isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur',
      targetColor: 'text-[#0284c7] bg-sky-50 border-sky-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Bot,
      desc: isAr
        ? 'مساعد حواري ذكي يشرح متطلبات الصفقات بالدينار الجزائري ويساعد في إعداد مسودات العروض المالية والتقنية المنظمة دون اتخاذ قرارات نهائية'
        : 'Assistant conversationnel guidant la préparation des offres financières et techniques et clarifiant les exigences contractuelles.',
      highlights: isAr
        ? [
            'توضيح الشروط التعاقدية بالدينار الجزائري',
            'مساندة صياغة المذكرات الفنية والمنهجية',
            'إرشادات متوافقة مع دفاتر الشروط النموذجية',
          ]
        : [
            'Clarification des exigences en dinar algérien',
            'Assistance à la rédaction de mémoires techniques',
            'Alignement avec les modèles réglementaires',
          ],
      path: '/operator/assistant',
    },
    {
      id: 'anti-collusion-radar',
      portalKey: 'central',
      title: isAr ? 'رادار مكافحة التواطؤ عين الصقر' : 'Radar Anti-Collusion Œil de Faucon',
      target: isAr ? 'بوابة الرقابة المركزية' : 'Supervision Centrale',
      targetColor: 'text-amber-800 bg-amber-50 border-amber-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: ScanSearch,
      desc: isAr
        ? 'تحليل مؤشرات المخاطر ودعم رصد السلوكيات المشبوهة كأداة تحليلية واستشارية مساندة لأجهزة الرقابة دون إصدار أي قرار قانوني'
        : 'Analyse des indicateurs de risque et appui à la détection des comportements suspects comme outil consultatif sans décision juridique.',
      highlights: isAr
        ? [
            'رصد تدوير الصفقات وتطابق الأسعار المشبوه',
            'مؤشرات احصائية لدعم المفتشيات الرقابية',
            'أداة تحليلية محايدة مساندة لاتخاذ القرار',
          ]
        : [
            'Détection de rotation anormale des marchés',
            'Indicateurs statistiques d’aide aux inspections',
            'Outil d’analyse neutre sans décision juridique',
          ],
      path: '/central',
    },
    {
      id: 'legal-rag',
      portalKey: 'central',
      title: isAr ? 'المسترجع القانوني الذكي' : 'Moteur de Recherche Juridique RAG',
      target: isAr ? 'كافة المتدخلين في المنظومة' : 'Tous les Acteurs',
      targetColor: 'text-slate-800 bg-slate-100 border-slate-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Search,
      desc: isAr
        ? 'استرجاع دلالي فوري من نصوص القانون رقم 23-12 والمرسوم الرئاسي 15-247 لتوفير السند القانوني الصريح لأي استفسار تعاقدي'
        : 'Recherche sémantique instantanée dans le corpus de la Loi 23-12 et du Décret 15-247 pour répondre aux questions réglementaires.',
      highlights: isAr
        ? [
            'ربط الإجابات بالنصوص القانونية الصريحة',
            'تحديث دائم مع النصوص التطبيقية الصادرة',
            'سهولة البحث باللغة الطبيعية دون تعقيد',
          ]
        : [
            'Citation directe des articles réglementaires',
            'Mise à jour continue avec les textes d’application',
            'Recherche fluide en langage naturel',
          ],
      path: '/faq',
    },
    {
      id: 'voice-copilot',
      portalKey: 'operator',
      title: isAr ? 'المساعد الصوتي الموجه' : 'Copilote Vocal Interactif',
      target: isAr ? 'إمكانية الوصول والشمول الرقمي' : 'Accessibilité Numérique',
      targetColor: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      status: isAr ? 'متاحة ومفعلة' : 'Opérationnelle',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: Mic,
      desc: isAr
        ? 'واجهة تفاعلية موجهة تدعم الاستفسار والتوجيه الصوتي لتسهيل الوصول إلى الصفقات والخدمات دون عوائق تقنية'
        : 'Interface vocale facilitant la navigation et la recherche vocale pour une accessibilité optimale.',
      highlights: isAr
        ? [
            'توجيه صوتي للمكفوفين وضعاف البصر',
            'مطابقة لمعايير النفاذية الرقمية الدولية',
            'استفسار صوتي سريع عن مواعيد الإيداع',
          ]
        : [
            'Guidage vocal pour l’accessibilité numérique',
            'Conformité aux normes WCAG 2.1 AA',
            'Interrogation vocale rapide des échéances',
          ],
      path: '/accessibility',
    },
  ];

  // قائمة الميزات الذكية قيد التطوير والتحضير
  const upcomingFeatures = [
    {
      id: 'project-delay-predictor',
      portalKey: 'authority',
      title: isAr ? 'المتنبئ الذكي بالتعثر والآجال' : 'Prédicteur de Retard et Dérive des Délais',
      target: isAr ? 'المصالح المتعاقدة وهيئات الرقابة' : 'Acheteurs Publics & Contrôle',
      targetColor: 'text-[#006233] bg-emerald-50 border-emerald-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '75%',
      stage: isAr ? 'مرحلة الضبط والمعايرة الميدانية' : 'Calibration avancée',
      targetRelease: isAr ? 'الربع الثاني 2026' : 'T2 2026',
      icon: Clock,
      desc: isAr
        ? 'نماذج استباقية تحلل تقدم ورشات الصفقات العمومية وتتنبأ باحتمالات تجاوز الآجال التعاقدية أو الحاجة إلى ملاحق قبل تفاقمها'
        : 'Modèles prédictifs anticipant les dérives de délais contractuels et alertant sur les goulots d’étranglement dans l’exécution.',
      milestones: isAr
        ? ['تحليل مؤشرات تقدم الأشغال التوريدات', 'رصد اختناقات التموين والتسليم', 'تنبيه مبكر لتفادي الملاحق غير المبررة']
        : ['Analyse de l’avancement des travaux', 'Détection des goulots logistiques', 'Alerte précoce sur les avenants'],
    },
    {
      id: 'neutral-specs-generator',
      portalKey: 'authority',
      title: isAr ? 'صانع دفاتر الشروط المحايدة' : 'Générateur de Cahiers des Charges Neutres',
      target: isAr ? 'المصالح المتعاقدة' : 'Services Contractants',
      targetColor: 'text-[#006233] bg-emerald-50 border-emerald-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '65%',
      stage: isAr ? 'تكامل بنوك المعايير والمقاييس' : 'Intégration référentiels',
      targetRelease: isAr ? 'الربع الثالث 2026' : 'T3 2026',
      icon: FileCode,
      desc: isAr
        ? 'صياغة آلية لبنود المواصفات الفنية المحايدة التي تضمن عدم تفصيل الشروط على مقاس متعهد محدد وتكرس المنافسة العادلة والشريفة'
        : 'Assistance à la rédaction de spécifications techniques neutres et non orientées garantissant l’égalité d’accès.',
      milestones: isAr
        ? ['منع البنود التمييزية والموجهة لعلامات تجارية', 'التوافق مع مواصفات المعهد الجزائري للتقييس', 'توليد نصوص تعاقدية متوازنة قانونياً']
        : ['Élimination des critères orientés', 'Conformité avec les normes IANOR', 'Rédaction de clauses contractuelles équilibrées'],
    },
    {
      id: 'bid-matrix-analyzer',
      portalKey: 'authority',
      title: isAr ? 'المحلل المقارن للعروض المالية' : 'Analyseur Comparatif des Offres Financières',
      target: isAr ? 'لجان فتح وتقييم العروض COPEM' : 'Commissions d’Évaluation',
      targetColor: 'text-[#006233] bg-emerald-50 border-emerald-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '60%',
      stage: isAr ? 'برمجة خوارزميات كشف الأسعار الشاذة' : 'Développement algorithmique',
      targetRelease: isAr ? 'الربع الثالث 2026' : 'T3 2026',
      icon: Scale,
      desc: isAr
        ? 'مساندة لجان التقييم في كشف الأسعار المنخفضة بشكل غير طبيعي أو المرتفعة بصورة مفرطة ومقارنة التقديرات الإدارية تلقائياً'
        : 'Détection automatisée des offres anormalement basses ou excessives et génération d’analyses comparatives objectives.',
      milestones: isAr
        ? ['كشف العروض المنخفضة غير الطبيعية آلياً', 'مقارنة انحرافات الأسعار مع التقدير الإداري', 'إعداد جدول الترتيب المالي الموضوعي']
        : ['Détection des offres anormalement basses', 'Écart par rapport au coût d’objectif', 'Classement financier objectif'],
    },
    {
      id: 'conciliation-assistant',
      portalKey: 'central',
      title: isAr ? 'مساعد التسوية الودية للنزاعات' : 'Assistant d’Aide à la Conciliation Amiable',
      target: isAr ? 'لجان التسوية والطعون' : 'Comités de Règlement Amiable',
      targetColor: 'text-amber-800 bg-amber-50 border-amber-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '50%',
      stage: isAr ? 'بناء قاعدة السوابق والحلول الودية' : 'Modélisation des précédents',
      targetRelease: isAr ? 'الربع الرابع 2026' : 'T4 2026',
      icon: TrendingUp,
      desc: isAr
        ? 'تحليل مذكرات الطعون والمنازعات واقتراح حلول تسوية ودية نظامية مستندة إلى سوابق الصفقات العمومية وأحكام القانون رقم 23-12'
        : 'Analyse des recours préalables et structuration des dossiers de conciliation conformément aux dispositions légales.',
      milestones: isAr
        ? ['فحص الأسباب الشكلية والموضوعية للطعون', 'اقتراح سيناريوهات تسوية ودية نظامية', 'تقليل اللجوء إلى النزاعات القضائية الطويلة']
        : ['Analyse des motifs des recours', 'Scénarios de conciliation amiable', 'Réduction des contentieux judiciaires'],
    },
    {
      id: 'national-price-benchmark',
      portalKey: 'central',
      title: isAr ? 'بنك الأسعار المرجعية عبر 69 ولاية' : 'Observatoire des Prix de Référence',
      target: isAr ? 'الرقابة المركزية وكافة الإدارات' : 'Supervision & Administrations',
      targetColor: 'text-slate-800 bg-slate-100 border-slate-200',
      status: isAr ? 'قيد التطوير' : 'En Développement',
      statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
      progress: '80%',
      stage: isAr ? 'تجميع وتوحيد قواعد البيانات الجغرافية' : 'Consolidation des données',
      targetRelease: isAr ? 'الربع الأول 2026' : 'T1 2026',
      icon: Network,
      desc: isAr
        ? 'بناء قاعدة بيانات مرجعية لمتوسط أسعار المواد والخدمات عبر الـ 69 ولاية جزائرية لمساعدة المصالح في ترشيد الإنفاق العمومي'
        : 'Constitution d’une base de données des prix moyens unitaires à travers les 69 wilayas pour rationaliser la commande.',
      milestones: isAr
        ? ['تغطية جغرافية كاملة لجميع ولايات الوطن', 'تحديث دوري لمعدلات التضخم وتكلفة المواد', 'مؤشرات استرشادية لترشيد المال العام']
        : ['Couverture complète des 69 wilayas', 'Actualisation selon les cours des matériaux', 'Repères d’optimisation budgétaire'],
    },
  ];

  // تصفية الميزات المتاحة والمستقبلية
  const filteredAvailable = useMemo(() => {
    if (activeTab === 'development') return [];
    return availableFeatures.filter((item) => {
      const matchPortal = targetFilter === 'all' || item.portalKey === targetFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.target.toLowerCase().includes(q);
      return matchPortal && matchQuery;
    });
  }, [activeTab, targetFilter, searchQuery, availableFeatures]);

  const filteredUpcoming = useMemo(() => {
    if (activeTab === 'available') return [];
    return upcomingFeatures.filter((item) => {
      const matchPortal = targetFilter === 'all' || item.portalKey === targetFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.target.toLowerCase().includes(q);
      return matchPortal && matchQuery;
    });
  }, [activeTab, targetFilter, searchQuery, upcomingFeatures]);

  return (
    <div
      dir={dir}
      lang={lang}
      className="min-h-screen bg-[#ffffff] text-[#080808] font-sans antialiased selection:bg-[#006233] selection:text-white"
    >
      {/* ─── الشريط العلوي والتنقل ─── */}
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
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(#006233 0.75px, transparent 0.75px), radial-gradient(#d21034 0.75px, #ffffff 0.75px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px',
          }}
        />

        {/* ══════════════════════════════════════════════════════════════════════
            رأس الصفحة: الترويسة السيادية والمؤشرات الحية
            ══════════════════════════════════════════════════════════════════════ */}
        <section className="relative max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 sm:pb-12 text-center">
          {/* مسار التنقل Breadcrumb */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              {isAr ? 'الرئيسية' : 'Accueil'}
            </Link>
            <ChevronRight className="size-3 text-slate-400 rtl:rotate-180" />
            <span className="text-[#006233] font-bold">
              {isAr ? 'قوة الذكاء الاصطناعي' : 'Puissance de l’IA'}
            </span>
          </div>

          {/* شارة سيادية خفيفة */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/80 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs">
              <Sparkles className="size-4 text-[#006233]" />
              <span>{isAr ? 'ترسانة الذكاء الاصطناعي السيادي' : 'Arsenal d’IA Souveraine'}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {isAr ? 'قوة الذكاء الاصطناعي في صفقات ذكية' : 'La Puissance de l’IA dans Safaqat Dhakia'}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
            {isAr
              ? 'دليل استعراضي شامل لجميع الأدوات الخوارزمية المفعلة والميزات الجاري تطويرها لمساندة المتعاملين والمصالح وهيئات الرقابة وفق القانون 23-12 والمرسوم 15-247'
              : 'Panorama complet des capacités algorithmiques opérationnelles et des innovations en cours pour la commande publique algérienne.'}
          </p>

          {/* ─── شبكة المؤشرات الحية السريعة ─── */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs text-center">
              <div className="text-2xl sm:text-3xl font-black text-[#006233]">8</div>
              <div className="text-xs font-bold text-slate-700 mt-1">
                {isAr ? 'أدوات ذكاء اصطناعي مفعلة' : 'Outils opérationnels'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                {isAr ? 'جاهزة للاستخدام اللحظي' : 'Prêts à l’emploi'}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-600">5</div>
              <div className="text-xs font-bold text-slate-700 mt-1">
                {isAr ? 'ميزات قيد التطوير' : 'Modèles en cours'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                {isAr ? 'بمراحل ضبط متقدمة' : 'Entraînement avancé'}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs text-center">
              <div className="text-2xl sm:text-3xl font-black text-[#0284c7]">69</div>
              <div className="text-xs font-bold text-slate-700 mt-1">
                {isAr ? 'ولاية مغطاة بالرصد' : 'Wilayas couvertes'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                {isAr ? 'مسح جغرافي شامل' : 'Couverture territoriale'}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs text-center">
              <div className="text-2xl sm:text-3xl font-black text-slate-800">100%</div>
              <div className="text-xs font-bold text-slate-700 mt-1">
                {isAr ? 'امتثال تشريعي' : 'Conformité légale'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                {isAr ? 'للقانون رقم 23-12' : 'Loi 23-12 & Décret'}
              </div>
            </div>
          </div>

          {/* ─── صندوق البحث والفلاتر المزدوجة ─── */}
          <div className="mt-8 max-w-2xl mx-auto space-y-4">
            {/* حقل البحث اللحظي */}
            <div className="relative">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن أداة ذكاء اصطناعي أو ميزة محددة...' : 'Rechercher un outil d’IA ou une fonctionnalité...'}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-[#006233] focus:ring-2 focus:ring-emerald-100 shadow-2xs transition-all"
              />
            </div>

            {/* أزرار الحالة الرئيسية */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {isAr ? 'جميع الأدوات' : 'Tous les outils'}
                <span className="ms-1.5 px-2 py-0.5 rounded-full text-[11px] bg-white/20">
                  {availableFeatures.length + upcomingFeatures.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('available')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'available'
                    ? 'bg-[#006233] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                }`}
              >
                {isAr ? 'الأدوات المفعلة حالياً' : 'Outils opérationnels'}
                <span className="ms-1.5 px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-900 font-bold">
                  {availableFeatures.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('development')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'development'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
                }`}
              >
                {isAr ? 'ميزات قيد التطوير' : 'En développement'}
                <span className="ms-1.5 px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-900 font-bold">
                  {upcomingFeatures.length}
                </span>
              </button>
            </div>

            {/* فلتر البوابات والفضاءات */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs pt-1">
              <span className="text-slate-400 font-bold text-[11px] me-1 flex items-center gap-1">
                <Filter className="size-3" /> {isAr ? 'الفضاء المستفيد:' : 'Espace:'}
              </span>
              <button
                type="button"
                onClick={() => setTargetFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  targetFilter === 'all'
                    ? 'bg-slate-200 text-slate-900'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'كافة الفضاءات' : 'Tous'}
              </button>
              <button
                type="button"
                onClick={() => setTargetFilter('operator')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  targetFilter === 'operator'
                    ? 'bg-sky-100 text-sky-800'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'المتعامل الاقتصادي' : 'Opérateur'}
              </button>
              <button
                type="button"
                onClick={() => setTargetFilter('authority')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  targetFilter === 'authority'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'المصلحة المتعاقدة' : 'Service Contractant'}
              </button>
              <button
                type="button"
                onClick={() => setTargetFilter('central')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  targetFilter === 'central'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isAr ? 'الرقابة المركزية' : 'Supervision'}
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            القسم 1: الميزات والأدوات المتاحة حالياً
            ══════════════════════════════════════════════════════════════════════ */}
        {filteredAvailable.length > 0 && (
          <section className="relative max-w-[1200px] mx-auto px-4 sm:px-6 mb-16">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-200">
              <div className="size-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#006233]">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {isAr ? 'أدوات الذكاء الاصطناعي المفعلة والجاهزة' : 'Outils IA Opérationnels et Prêts à l’Emploi'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {isAr
                    ? 'قدرات خوارزمية مدمجة بالكامل تعمل على مساندة قرارات الشراء والإيداع والتدقيق'
                    : 'Capacités algorithmiques intégrées pour soutenir les soumissions et le contrôle'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAvailable.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      {/* ترويسة الكارت: الأيقونة والشارات */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="size-11 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-center text-[#006233] shadow-2xs group-hover:scale-105 transition-transform">
                          <Icon className="size-5" strokeWidth={1.75} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tool.targetColor}`}>
                            {tool.target}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{tool.status}</span>
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-snug group-hover:text-[#006233] transition-colors">
                        {tool.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-5">
                        {tool.desc}
                      </p>

                      {/* قائمة نقاط القوة والمخرجات */}
                      <div className="pt-3.5 mb-5 border-t border-slate-100">
                        <ul className="space-y-2">
                          {tool.highlights.map((point, pIdx) => (
                            <li key={pIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                              <Check className="size-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">
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
            القسم 2: خارطة تدخل الذكاء الاصطناعي في دورة حياة الصفقة
            ══════════════════════════════════════════════════════════════════════ */}
        <section className="relative max-w-[1200px] mx-auto px-4 sm:px-6 mb-16">
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-6 sm:p-8">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs mb-2.5">
                <Layers className="size-3.5 text-[#006233]" />
                <span>{isAr ? 'دورة الحياة التعاقدية' : 'Cycle de Vie Contractuel'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isAr ? 'تكامل الأدوات الذكية عبر مراحل الصفقة' : 'Intégration de l’IA dans le Processus'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5">
                {isAr
                  ? 'تدخل خوارزمي متوازن يغطي مسار الصفقة من تقدير الحاجة الأولية حتى الإقفال المالي'
                  : 'Interventions coordonnées depuis l’expression du besoin jusqu’au bilan'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="size-7 rounded-lg bg-emerald-50 text-[#006233] font-black text-xs flex items-center justify-center mb-2.5">
                  1
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {isAr ? 'التحضير والتقدير' : 'Préparation'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'التقدير الإداري وجدول الكميات السري وصانع دفاتر الشروط المحايدة' : 'Estimation confidentielle et rédaction neutre'}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="size-7 rounded-lg bg-sky-50 text-[#0284c7] font-black text-xs flex items-center justify-center mb-2.5">
                  2
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {isAr ? 'الإشهار والمطابقة' : 'Publication'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'مطابقة الفرص الذكية وتلخيص دفاتر الشروط وفحص الدرع الامتثالي' : 'Correspondance intelligente et bouclier préalable'}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="size-7 rounded-lg bg-purple-50 text-purple-700 font-black text-xs flex items-center justify-center mb-2.5">
                  3
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {isAr ? 'الفتح والتقييم' : 'Évaluation'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'المحلل المقارن للعروض وكشف الأسعار الشاذة والمسترجع القانوني' : 'Analyse comparative des prix et support RAG'}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="size-7 rounded-lg bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center mb-2.5">
                  4
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {isAr ? 'التنفيذ والرقابة' : 'Suivi & Contrôle'}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'رادار مكافحة التواطؤ والمتنبئ بالتعثر وبنك الأسعار المرجعية' : 'Radar anti-collusion et observatoire des prix'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            القسم 3: ميزات قيد التطوير والتدريب المتقدم
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
                    ? 'نماذج ذكاء اصطناعي تخضع حالياً لمراحل المعايرة والتدريب وفق المعايير الجزائرية'
                    : 'Modèles avancés en cours d’entraînement selon les spécificités nationales'}
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
                    {/* شريط خلفي علوي بلون أصفر كهرماني */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />

                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                          <Icon className="size-5" strokeWidth={1.75} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                            {item.targetRelease}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-2.5 ${item.targetColor}`}>
                        {item.target}
                      </span>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-amber-800 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-4">
                        {item.desc}
                      </p>

                      {/* أهداف الميزة قيد التطوير */}
                      <div className="pt-3 mb-4 border-t border-slate-100">
                        <ul className="space-y-1.5">
                          {item.milestones.map((m, mIdx) => (
                            <li key={mIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                              <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>{item.stage}</span>
                        <span className="text-amber-800 font-bold">{item.progress}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-amber-600 h-1.5 rounded-full transition-all duration-500"
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
            القسم 4: ركائز الثقة والسيادة القانونية
            ══════════════════════════════════════════════════════════════════════ */}
        <section className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-2.5">
                <Scale className="size-3.5 text-[#006233]" />
                <span>{isAr ? 'السيادة والضوابط التشريعية' : 'Cadre Souverain et Éthique'}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {isAr ? 'الذكاء الاصطناعي للمساندة والقرار البشري هو السيد' : 'L’IA comme Outil d’Aide à la Décision'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <div className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#006233] mx-auto mb-2">
                  <Scale className="size-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                  {isAr ? 'مسؤولية قانونية بشرية' : 'Responsabilité humaine'}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {isAr ? 'كافة القرارات التعاقدية من اختصاص لجان الصفقات والمصالح المتعاقدة حصرياً' : 'Décisions réservées aux commissions compétentes'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <div className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sky-700 mx-auto mb-2">
                  <Lock className="size-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                  {isAr ? 'تشفير تام للأسعار والأظرفة' : 'Chiffrement souverain'}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {isAr ? 'حماية تامة للبيانات التجارية وسرية العروض قبل جلسات الفتح الرسمية' : 'Protection absolue de la confidentialité financière'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <div className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-amber-700 mx-auto mb-2">
                  <Shield className="size-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                  {isAr ? 'امتثال صارم للقانون 23-12' : 'Conformité Loi 23-12'}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  {isAr ? 'انسجام دقيق مع المبادئ الثلاثة: حرية الوصول، المساواة، والشفافية' : 'Respect strict des principes de commande publique'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AIPowerPage;
