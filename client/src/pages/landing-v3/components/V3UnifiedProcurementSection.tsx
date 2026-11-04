import React, { useState } from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Sparkles,
  ShieldCheck,
  Landmark,
  Building2,
  Briefcase,
  Search,
  FileText,
  CheckCircle2,
  FolderArchive,
  PenTool,
  Calculator,
  Lock,
  Scale,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Eye,
  GitMerge,
  Award,
} from 'lucide-react';

interface MilestoneItem {
  id: number;
  stepNumber: string;
  title: string;
  titleFr: string;
  badge: string;
  badgeFr: string;

  // الرقابة المركزية بالذكاء الاصطناعي (Supervision & Audit)
  centralRole: string;
  centralRoleFr: string;
  centralDetail: string;
  centralDetailFr: string;

  // المصلحة المتعاقدة (Contracting Authority)
  authorityTitle: string;
  authorityTitleFr: string;
  authorityRole: string;
  authorityRoleFr: string;
  authorityDetail: string;
  authorityDetailFr: string;
  authorityIcon: React.ComponentType<{ className?: string }>;

  // المتعامل الاقتصادي (Economic Operator)
  operatorTitle: string;
  operatorTitleFr: string;
  operatorRole: string;
  operatorRoleFr: string;
  operatorDetail: string;
  operatorDetailFr: string;
  operatorIcon: React.ComponentType<{ className?: string }>;
}

export const V3UnifiedProcurementSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);

  // مصفوفة المحطات الخمس الكبرى المدمجة تحت الرقابة المركزية
  const milestones: MilestoneItem[] = [
    // ══════════════════════════════════════════════════════════════════════════
    // المحطة 1: الإعداد، فحص الأهلية والتأهيل
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 1,
      stepNumber: '01',
      title: isAr ? 'الإعداد والتأهيل القانوني' : 'Préparation & Éligibilité Légale',
      titleFr: 'Préparation & Éligibilité Légale',
      badge: isAr ? 'المرحلة التحضيرية • القانون 23-12' : 'Phase Préparatoire • Loi 23-12',
      badgeFr: 'Phase Préparatoire • Loi 23-12',

      // الرقابة المركزية
      centralRole: isAr
        ? 'فحص دفاتر الشروط ومنع الشروط الإقصائية وضمان مطابقة التقديرات المالية للأسعار المرجعية.'
        : 'Audit préalable des cahiers des charges, exclusion des clauses discriminatoires et conformité aux mercuriales.',
      centralDetail: isAr
        ? 'خوارزميات التدقيق القانوني تفحص مطابقة المواد 16 إلى 38 وتمنع تفتيت الحاجات لتفادي العتبات المالية.'
        : 'Contrôle algorithmique des articles 16 à 38 pour prévenir le saucissonnage et respecter les seuils.',
      centralRoleFr: 'Audit préalable des cahiers des charges et conformité aux mercuriales.',
      centralDetailFr: 'Contrôle algorithmique des articles 16 à 38.',

      // المصلحة المتعاقدة
      authorityTitle: isAr ? 'تحديد الحاجة وإعداد الملف' : 'Définition du besoin & Dossier',
      authorityTitleFr: 'Définition du besoin & Dossier',
      authorityRole: isAr
        ? 'تحديد الحاجة بدقة، صياغة دفتر الشروط، واختيار طريقة الإبرام المناسبة.'
        : 'Définition rigoureuse du besoin, rédaction du cahier des charges et choix de la procédure.',
      authorityDetail: isAr
        ? 'إعداد ملف المناقصة وحساب التكلفة التقديرية بناءً على المعايير الرسمية المعتمدة.'
        : 'Préparation du dossier d’appel d’offres et calcul de l’estimation administrative prévisionnelle.',
      authorityIcon: FileText,

      // المتعامل الاقتصادي
      operatorTitle: isAr ? 'فحص الأهلية المسبق' : 'Vérification de l’éligibilité',
      operatorTitleFr: 'Vérification de l’éligibilité',
      operatorRole: isAr
        ? 'مطابقة قدرات المؤسسة مع معايير التأهيل المالي والتقني لتفادي الإقصاء.'
        : 'Conformité des capacités de l’entreprise avec les exigences de qualification requises.',
      operatorDetail: isAr
        ? 'مقارنة رقم الأعمال، شهادات التصنيف، والمراجع المهنية مع الشروط الدنيا المطلوبة.'
        : 'Audit interne du chiffre d’affaires, certificats de qualification et références similaires.',
      operatorIcon: CheckCircle2,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // المحطة 2: الإشهار القانوني واكتشاف الفرص
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 2,
      stepNumber: '02',
      title: isAr ? 'الإشهار واكتشاف الفرص' : 'Publication & Découverte des Opportunités',
      titleFr: 'Publication & Découverte des Opportunités',
      badge: isAr ? 'الشفافية وتكافؤ الفرص • المواد 39 إلى 47' : 'Transparence & Égalité • Articles 39 à 47',
      badgeFr: 'Transparence & Égalité • Articles 39 à 47',

      // الرقابة المركزية
      centralRole: isAr
        ? 'رصد النشر العادل في البوابة الوطنية، والتحقق الصارم من احترام الآجال القانونية لسحب الدفاتر.'
        : 'Surveillance de la diffusion équitable et respect scrupuleux des délais légaux de retrait.',
      centralDetail: isAr
        ? 'تتبع آلي لآجال تحضير العروض ومنع أي تقليص غير قانوني للمهل الزمنية للمتعاملين.'
        : 'Veille automatisée sur les délais de préparation évitant tout raccourcissement illégal.',
      centralRoleFr: 'Surveillance de la diffusion équitable et respect des délais.',
      centralDetailFr: 'Veille automatisée sur les délais de préparation des offres.',

      // المصلحة المتعاقدة
      authorityTitle: isAr ? 'النشر والإشهار الرسمي' : 'Avis et publication officielle',
      authorityTitleFr: 'Avis et publication officielle',
      authorityRole: isAr
        ? 'إشهار طلب العروض عبر البوابة الوطنية وتحديد رزنامة الإجراءات بدقة.'
        : 'Publication de l’avis sur le portail national et fixation du calendrier officiel.',
      authorityDetail: isAr
        ? 'توفير دفتر الشروط رقمياً وتسجيل عمليات السحب والإجابة عن استفسارات المتعهدين.'
        : 'Mise à disposition numérique du dossier, traçabilité des retraits et réponses aux clarifications.',
      authorityIcon: Building2,

      // المتعامل الاقتصادي
      operatorTitle: isAr ? 'اكتشاف الفرصة وفهم الشروط' : 'Découverte ciblée & Analyse',
      operatorTitleFr: 'Découverte ciblée & Analyse',
      operatorRole: isAr
        ? 'اقتراح ذكي للصفقات المطابقة لنشاط المؤسسة وتلخيص دفتر الشروط والمواعيد.'
        : 'Détection intelligente des marchés adaptés au profil et synthèse des clauses clés.',
      operatorDetail: isAr
        ? 'استخراج فوري لجدول الوثائق المطلوبة وتحديد الموعد النهائي الدقيق للإيداع.'
        : 'Génération instantanée de la checklist documentaire et des jalons temporels impératifs.',
      operatorIcon: Search,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // المحطة 3: تحضير العروض وتدقيق النزاهة
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 3,
      stepNumber: '03',
      title: isAr ? 'إعداد العروض وتدقيق الجودة والتسعير' : 'Préparation des Offres & Contrôle Qualité',
      titleFr: 'Préparation des Offres & Contrôle Qualité',
      badge: isAr ? 'التنافسية والنزاهة • المواد 48 إلى 66' : 'Compétitivité & Intégrité • Articles 48 à 66',
      badgeFr: 'Compétitivité & Intégrité • Articles 48 à 66',

      // الرقابة المركزية
      centralRole: isAr
        ? 'تشغيل رادار كشف التواطؤ ومحاكاة التلاعب بالأسعار (Anti-Collusion AI Engine) ورصد الأسعار غير المبررة.'
        : 'Activation du moteur IA anti-collusion et détection précoce des anomalies tarifaires abusives.',
      centralDetail: isAr
        ? 'فحص البصمات الرقمية وتقاطع البيانات بين المتعهدين لحماية الأموال العمومية من الاتفاقات المسبقة.'
        : 'Contrôle croisé des empreintes et liaisons d’intérêts pour garantir une saine émulation.',
      centralRoleFr: 'Moteur IA anti-collusion et détection des anomalies tarifaires.',
      centralDetailFr: 'Contrôle croisé des liaisons d’intérêts et des offres concertées.',

      // المصلحة المتعاقدة
      authorityTitle: isAr ? 'المساواة والإيضاحات' : 'Clarifications & Égalité',
      authorityTitleFr: 'Clarifications & Égalité',
      authorityRole: isAr
        ? 'نشر الإيضاحات لجميع المتعهدين في وقت متزامن لضمان الشفافية والمساواة.'
        : 'Diffusion simultanée de toutes les réponses aux questions pour garantir une stricte égalité.',
      authorityDetail: isAr
        ? 'استقبال الاستفسارات وصياغة ملحقات التوضيح عند الاقتضاء وفق الصيغ القانونية.'
        : 'Gestion centralisée des questions-réponses et additifs éventuels selon les règles d’impartialité.',
      authorityIcon: Briefcase,

      // المتعامل الاقتصادي
      operatorTitle: isAr ? 'إعداد العرض التقني والمالي' : 'Offres Technique & Financière',
      operatorTitleFr: 'Offres Technique & Financière',
      operatorRole: isAr
        ? 'صياغة المذكرة التقنية، حساب جدول الأسعار بدقة، وتدقيق الجودة الشامل.'
        : 'Structuration du mémoire technique, calcul rigoureux des coûts et audit interne.',
      operatorDetail: isAr
        ? 'تنظيم ملف الترشح، تدقيق تطابق الأرقام مع دفتر الشروط، والتنبيه التلقائي إلى أي خطأ شكلي.'
        : 'Vérification croisée BPU/DQE et correction préalable des erreurs pouvant entraîner l’élimination.',
      operatorIcon: Calculator,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // المحطة 4: الإيداع المشفر، فتح الأظرفة والتقييم
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 4,
      stepNumber: '04',
      title: isAr ? 'الإيداع المشفر، فتح الأظرفة والتقييم' : 'Dépôt Chiffré, Ouverture & Évaluation',
      titleFr: 'Dépôt Chiffré, Ouverture & Évaluation',
      badge: isAr ? 'الأمان السيادي والتقييم • المواد 67 إلى 77' : 'Sécurité Souveraine • Articles 67 à 77',
      badgeFr: 'Sécurité Souveraine • Articles 67 à 77',

      // الرقابة المركزية
      centralRole: isAr
        ? 'تشفير سيادي AES-256 للأظرفة، وفك تشفير آلي متزامن في جلسة الفتح لمنع أي تسريب أو تعديل.'
        : 'Chiffrement souverain AES-256 des plis et déchiffrement simultané inviolable en séance.',
      centralDetail: isAr
        ? 'تدقيق محايد لمعايير التنقيط المحددة مسبقاً في دفتر الشروط والتأكد من مطابقة جداول التقييم.'
        : 'Contrôle de conformité de l’application stricte de la grille de notation arrêtée initialement.',
      centralRoleFr: 'Chiffrement souverain AES-256 et déchiffrement inviolable.',
      centralDetailFr: 'Audit impartial de l’application stricte du barème de notation.',

      // المصلحة المتعاقدة
      authorityTitle: isAr ? 'الفتح العلني والتقييم' : 'Ouverture publique & Évaluation',
      authorityTitleFr: 'Ouverture publique & Évaluation',
      authorityRole: isAr
        ? 'عقد جلسة فتح الأظرفة العلنية بحضور العارضين، وتقييم العروض تقنياً ومالياً.'
        : 'Séance publique d’ouverture des plis et évaluation multicritère des propositions.',
      authorityDetail: isAr
        ? 'تسجيل المحاضر الرسمية للفتح والتقييم واستخراج الترتيب النهائي وفق المعايير المعتمدة.'
        : 'Rédaction des procès-verbaux réglementaires et classement objectif de l’offre économiquement la plus avantageuse.',
      authorityIcon: Scale,

      // المتعامل الاقتصادي
      operatorTitle: isAr ? 'الإيداع الآمن وحضور الفتح' : 'Dépôt sécurisé & Séance',
      operatorTitleFr: 'Dépôt sécurisé & Séance',
      operatorRole: isAr
        ? 'إيداع إلكتروني محمي مع استخراج وصل سحب فوري معتمد قانوناً يثبت تاريخ وساعة الإيداع.'
        : 'Dépôt électronique scellé avec récépissé légal immédiat horodaté certifiant la conformité.',
      operatorDetail: isAr
        ? 'حضور جلسة فتح الأظرفة العلنية أو متابعة البث الرقمي المباشر لمجريات الفتح والأسعار.'
        : 'Présence à l’ouverture publique des plis ou suivi numérique transparent des montants annoncés.',
      operatorIcon: Lock,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // المحطة 5: المنح المؤقت، الطعون القانونية والإسناد النهائي
    // ══════════════════════════════════════════════════════════════════════════
    {
      id: 5,
      stepNumber: '05',
      title: isAr ? 'المنح المؤقت، الطعون والإسناد النهائي' : 'Attribution, Recours & Contrat Définitif',
      titleFr: 'Attribution, Recours & Contrat Définitif',
      badge: isAr ? 'الرقابة القبلية والإسناد • المواد 78 إلى 88' : 'Contrôle A Priori & Visa • Articles 78 à 88',
      badgeFr: 'Contrôle A Priori & Visa • Articles 78 à 88',

      // الرقابة المركزية
      centralRole: isAr
        ? 'المتابعة الصارمة لأجل الطعون القانوني (10 أيام)، وتوليد تقرير التدقيق النهائي المعتمد للتأشيرة الرقابية.'
        : 'Suivi rigoureux du délai de recours légal de 10 jours et rapport d’audit certifié pour le visa.',
      centralDetail: isAr
        ? 'فحص شامل لملف الصفقة قبل التوقيع النهائي لضمان عدم وجود طعون معلقة أو مخالفات تشريعية.'
        : 'Vérification complète du dossier avant signature définitive assurant la sécurité juridique du marché.',
      centralRoleFr: 'Suivi du délai de recours légal de 10 jours et visa de conformité.',
      centralDetailFr: 'Audit exhaustif avant engagement définitif de la dépense publique.',

      // المصلحة المتعاقدة
      authorityTitle: isAr ? 'إعلان المنح والإسناد' : 'Avis d’attribution & Visa',
      authorityTitleFr: 'Avis d’attribution & Visa',
      authorityRole: isAr
        ? 'نشر إعلان المنح المؤقت متضمناً الأسعار والتنقيط، وإبرام العقد بعد استيفاء التأشيرات.'
        : 'Publication de l’attribution provisoire, traitement des recours et contractualisation finale.',
      authorityDetail: isAr
        ? 'إبلاغ الفائز، تسوية مستحقات الكفالات للمستبعدين، ورفع الملف إلى لجنة الصفقات للتأشيرة.'
        : 'Notification officielle, restitution des cautions aux soumissionnaires évincés et visa des marchés.',
      authorityIcon: Award,

      // المتعامل الاقتصادي
      operatorTitle: isAr ? 'الاطلاع والطعن والإنجاز' : 'Notification, Recours & Contrat',
      operatorTitleFr: 'Notification, Recours & Contrat',
      operatorRole: isAr
        ? 'الاطلاع الفوري على تفاصيل المنح، وممارسة حق الطعن القانوني خلال أجل 10 أيام في حال الاعتراض.'
        : 'Accès direct aux résultats détaillés et exercice du droit légal de recours sous 10 jours.',
      operatorDetail: isAr
        ? 'استكمال الضمانات النهائية وبدء تنفيذ المشروع فور استلام الأمر ببدء الخدمة (ODS).'
        : 'Constitution de la caution de bonne exécution et démarrage après ordre de service officiel.',
      operatorIcon: ShieldCheck,
    },
  ];

  return (
    <section
      id="procurement-matrix"
      dir={dir}
      className="w-full bg-[#FFFFFF] py-14 sm:py-20 overflow-hidden"
    >
      {/* مرابط وصول إضافية لضمان التوافق مع أي روابط سابقة في الصفحة */}
      <span id="lifecycle" className="sr-only" />
      <span id="bid-prep" className="sr-only" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* ══════════════════════════════════════════════════════════════════════
            ترويسة القسم: إطار بسيط يحيط بالعنوان الرئيسي وخلفية بيضاء ناصعة
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center justify-center text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs mb-3">
            <Landmark className="size-3.5 text-[#00753A]" />
            <span>{isAr ? 'منظومة التكامل والرقابة المركزية • القانون 23-12' : 'Système Intégré & Contrôle Central • Loi 23-12'}</span>
          </div>

          {/* إطار العنوان المؤطر البسيط والأنيق */}
          <div className="inline-block px-6 sm:px-10 py-3 rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'مصفوفة مسار الصفقة والرقابة المركزية' : 'Matrice du Marché Public & Contrôle Central'}
            </h2>
            <span className="block mt-1 text-sm sm:text-base font-bold text-[#00753A]">
              {isAr
                ? 'تكامل المصلحة المتعاقدة والمتعامل الاقتصادي تحت إشراف الذكاء الاصطناعي السيادي'
                : 'Synergie Acheteur Public & Opérateur Économique sous Supervision IA'}
            </span>
          </div>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed font-medium">
            {isAr
              ? 'تجمع هذه المصفوفة دورة حياة الصفقة العمومية كاملة في 5 محطات كبرى متزامنة: إجراءات المصلحة المتعاقدة، تحضير المتعامل لعرضه، والرقابة المستمرة لضمان النزاهة والشفافية وتكافؤ الفرص.'
              : 'Une vision unifiée du marché public en 5 étapes clés synchronisées : démarches de l’acheteur, préparation de l’opérateur et contrôle central continu assurant transparence et équité.'}
          </p>

          {/* دليل الألوان السيادي المدمج للتوضيح السريع */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800">
              <Landmark className="size-3.5 text-amber-600" />
              <span>{isAr ? 'قبة الرقابة المركزية (AI السيادي)' : 'Contrôle Central & IA'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#00753A]">
              <span className="size-2.5 rounded-full bg-[#00753A]" />
              <span>{isAr ? 'المصلحة المتعاقدة (الإدارة)' : 'Acheteur Public'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-[#D21034]">
              <span className="size-2.5 rounded-full bg-[#D21034]" />
              <span>{isAr ? 'المتعامل الاقتصادي (العارض)' : 'Opérateur Économique'}</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            المحطات الخمس الكبرى (The 5 Milestone Cards)
            كل محطة تجمع الرقابة المركزية في الأعلى، والمصلحة والمتعامل في جناحين متقابلين
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6 sm:space-y-8">
          {milestones.map((m, idx) => {
            const AuthorityIcon = m.authorityIcon;
            const OperatorIcon = m.operatorIcon;
            const isHovered = activeMilestone === m.id;
            const isLast = idx === milestones.length - 1;

            return (
              <div key={m.id} className="relative flex flex-col items-center">
                
                {/* البطاقة الزجاجية المتكاملة للمحطة */}
                <div
                  className={`w-full relative rounded-2xl sm:rounded-3xl p-5 sm:p-7 border transition-all duration-300 backdrop-blur-xl ${
                    isHovered
                      ? 'bg-white/95 border-slate-400 shadow-xl -translate-y-1 ring-2 ring-slate-200'
                      : 'bg-white/80 border-slate-200/90 shadow-xs hover:border-slate-300'
                  }`}
                  onMouseEnter={() => setActiveMilestone(m.id)}
                  onMouseLeave={() => setActiveMilestone(null)}
                >
                  {/* شريط العلم الوطني العلوي الرفيع */}
                  <div className="absolute top-0 inset-x-0 h-1 flex rounded-t-2xl sm:rounded-t-3xl overflow-hidden">
                    <div className="w-1/2 bg-[#00753A]" />
                    <div className="w-1/2 bg-[#D21034]" />
                  </div>

                  {/* ──────────────────────────────────────────────────────────
                      1. رأس المحطة: رقم المحطة + العنوان + شارة القانون
                      ────────────────────────────────────────────────────────── */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {/* رقم المحطة داخل دائرة سيادية ثنائية */}
                      <div className="size-11 sm:size-12 rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-mono font-black text-base sm:text-lg shadow-sm shrink-0">
                        {m.stepNumber}
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                          {isAr ? `المحطة التنظيمية ${m.stepNumber}` : `Jalon Réglementaire ${m.stepNumber}`}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                          {isAr ? m.title : m.titleFr}
                        </h3>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full shadow-2xs self-start sm:self-auto">
                      {isAr ? m.badge : m.badgeFr}
                    </span>
                  </div>

                  {/* ──────────────────────────────────────────────────────────
                      2. قبة الرقابة المركزية بالذكاء الاصطناعي (Supervision Canopy)
                      ────────────────────────────────────────────────────────── */}
                  <div className="mt-4 p-4 rounded-xl sm:rounded-2xl bg-linear-to-r from-slate-900/5 via-amber-500/5 to-slate-900/5 border border-slate-200/80">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <Landmark className="size-4 text-amber-400" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 tracking-wide uppercase">
                            {isAr ? 'الرقابة المركزية والنزاهة المؤسسية بالذكاء الاصطناعي' : 'Contrôle Central & Audit IA'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-200">
                            <Sparkles className="size-2.5 text-amber-700" />
                            <span>AI</span>
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                          {isAr ? m.centralRole : m.centralRoleFr}
                        </p>

                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed pt-1">
                          {isAr ? m.centralDetail : m.centralDetailFr}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ──────────────────────────────────────────────────────────
                      3. الجناحان المتقابلان: المصلحة المتعاقدة مقابل المتعامل
                      ────────────────────────────────────────────────────────── */}
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* الجناح الأيمن: المصلحة المتعاقدة (الأخضر السيادي #00753A) */}
                    <div className="relative rounded-xl p-4 sm:p-5 bg-emerald-50/40 border border-emerald-200/70 flex flex-col justify-between transition-all group-hover:border-[#00753A]/60">
                      <div>
                        {/* وسم المصلحة المتعاقدة */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-[#00753A]" />
                            <span className="text-xs font-black text-[#00753A] tracking-wider uppercase">
                              {isAr ? 'المصلحة المتعاقدة (الإدارة العمومية)' : 'Acheteur Public'}
                            </span>
                          </div>
                          <div className="size-7 rounded-lg bg-emerald-100/80 text-[#00753A] flex items-center justify-center">
                            <AuthorityIcon className="size-3.5" />
                          </div>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                          {isAr ? m.authorityTitle : m.authorityTitleFr}
                        </h4>

                        <p className="text-xs font-semibold text-slate-700 leading-snug">
                          {isAr ? m.authorityRole : m.authorityRoleFr}
                        </p>
                      </div>

                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-3 pt-2 border-t border-emerald-100">
                        {isAr ? m.authorityDetail : m.authorityDetailFr}
                      </p>
                    </div>

                    {/* الجناح الأيسر: المتعامل الاقتصادي (الأحمر السيادي #D21034) */}
                    <div className="relative rounded-xl p-4 sm:p-5 bg-rose-50/40 border border-rose-200/70 flex flex-col justify-between transition-all group-hover:border-[#D21034]/60">
                      <div>
                        {/* وسم المتعامل الاقتصادي */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-[#D21034]" />
                            <span className="text-xs font-black text-[#D21034] tracking-wider uppercase">
                              {isAr ? 'المتعامل الاقتصادي (العارض)' : 'Opérateur Économique'}
                            </span>
                          </div>
                          <div className="size-7 rounded-lg bg-rose-100/80 text-[#D21034] flex items-center justify-center">
                            <OperatorIcon className="size-3.5" />
                          </div>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                          {isAr ? m.operatorTitle : m.operatorTitleFr}
                        </h4>

                        <p className="text-xs font-semibold text-slate-700 leading-snug">
                          {isAr ? m.operatorRole : m.operatorRoleFr}
                        </p>
                      </div>

                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-3 pt-2 border-t border-rose-100">
                        {isAr ? m.operatorDetail : m.operatorDetailFr}
                      </p>
                    </div>

                  </div>

                </div>

                {/* سهم متدرج عمودي يربط المحطة بالتي تليها */}
                {!isLast && (
                  <div className="py-2.5 sm:py-3 flex items-center justify-center">
                    <div className="size-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center shadow-2xs">
                      <ArrowDown className="size-4 text-slate-600" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            أسفل القسم: المبدأ السيادي الحاكم + التنبيه القانوني + بوابات الدخول
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="mt-14 sm:mt-18 flex flex-col items-center justify-center gap-6">

          {/* العبارة الإلزامية في بطاقة زجاجية سيادية */}
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-md text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="w-1/2 bg-[#00753A]" />
              <div className="w-1/2 bg-[#D21034]" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <div className="size-11 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="size-6 text-[#00753A]" />
              </div>

              <div className="text-center sm:text-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  {isAr ? 'المبدأ الحاكم لمنظومة الصفقات العمومية' : 'Principe Fondamental du Système National'}
                </span>
                <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {isAr
                    ? 'المنظومة الرقمية تضمن الشفافية وتدعم القرار، والرقابة المركزية تضمن سيادة القانون وتكافؤ الفرص.'
                    : 'Le système numérique garantit la transparence, le contrôle central assure l’égalité et la primauté de la loi.'}
                </p>
              </div>
            </div>
          </div>

          {/* التنبيه القانوني الصغير */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs sm:text-sm font-semibold shadow-2xs">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>
              {isAr
                ? 'تخضع كافة الإجراءات للرقابة المستمرة والتدقيق الآلي وفق أحكام القانون رقم 23-12 والمرسوم الرئاسي 15-247.'
                : 'Toutes les procédures sont soumises à l’audit continu conformément à la Loi 23-12 et au Décret 15-247.'}
            </span>
          </div>

          {/* زرا الدخول المباشر للبوابتين السياديتين */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/register/authority"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#00753A] hover:bg-[#005e2e] active:scale-[0.99] transition-all shadow-md hover:shadow-lg focus:outline-hidden"
            >
              <Building2 className="size-4" />
              <span>{isAr ? 'بوابة المصلحة المتعاقدة' : 'Portail Acheteur Public'}</span>
              {isAr ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </Link>

            <Link
              href="/register/operator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#D21034] hover:bg-[#b00d2b] active:scale-[0.99] transition-all shadow-md hover:shadow-lg focus:outline-hidden"
            >
              <Briefcase className="size-4" />
              <span>{isAr ? 'بوابة المتعامل الاقتصادي' : 'Portail Opérateur'}</span>
              {isAr ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};

export default V3UnifiedProcurementSection;
