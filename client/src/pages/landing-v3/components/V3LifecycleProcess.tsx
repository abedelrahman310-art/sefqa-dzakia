import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  Building,
  Briefcase,
  Coins,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check
} from 'lucide-react';

export const V3LifecycleProcess: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [selectedStage, setSelectedStage] = useState<number>(1);

  const stages = [
    {
      num: '01',
      id: 1,
      title: isAr ? 'التخطيط وتحديد الحاجيات' : 'Planification & Besoins',
      legal: isAr ? 'المادتان 16 و24' : 'Articles 16 et 24',
      subtitle: isAr ? 'ضبط الحاجيات والكلفة والاعتمادات' : 'Estimation préalable et crédits',
      authorityRole: isAr
        ? 'حصر الحاجيات السنوية بدقة، إعداد بطاقة التقدير المالي، وتسجيل العملية ضمن المخطط التقديري.'
        : 'Recensement annuel des besoins, évaluation financière et inscription au plan prévisionnel.',
      operatorRole: isAr
        ? 'متابعة البرمجة العامة للمصالح العمومية والاستعداد لتجهيز القدرات التقنية والمالية.'
        : 'Veille sur les programmes prévisionnels et préparation des capacités techniques et financières.',
      financeRole: isAr
        ? 'التحقق من توفر رخصة البرامج والاعتمادات المالية المفتوحة ومنح التأشيرة المسبقة.'
        : 'Vérification de la disponibilité des crédits budgétaires et visa préalable d’engagement.',
      hawkRole: isAr
        ? 'التأكد من التوافق مع السياسات الوطنية للإنفاق العام وعدم تجزئة الصفقات.'
        : 'Contrôle de conformité avec les budgets nationaux et prévention du fractionnement illégal.',
      output: isAr ? 'بطاقة الحاجيات السنوية والتأشيرة المسبقة' : 'Fiche des besoins validée & Visa',
    },
    {
      num: '02',
      id: 2,
      title: isAr ? 'الإشهار ودفتر الشروط' : 'Avis d’Appel & Cahier des Charges',
      legal: isAr ? 'المواد 39 إلى 43' : 'Articles 39 à 43',
      subtitle: isAr ? 'صياغة المعايير المحايدة والنشر' : 'Rédaction neutre et publication',
      authorityRole: isAr
        ? 'صياغة دفتر الشروط بمواصفات تقنية محايدة، تحديد معايير الاختيار، ونشر الإعلان بالبوابة والصحف.'
        : 'Élaboration du cahier des charges aux critères objectifs et publication de l’avis d’appel.',
      operatorRole: isAr
        ? 'سحب دفتر الشروط رقمياً عبر المنصة، دراسة الشروط والقدرات المطلوبة، وتقديم طلبات الاستفسار.'
        : 'Téléchargement électronique des dossiers, analyse des critères et formulation des requêtes d’éclaircissement.',
      financeRole: isAr
        ? 'مراقبة مطابقة دفتر الشروط للحدود المالية المعتمدة في قانون المالية.'
        : 'Contrôle de l’alignement des clauses financières avec les plafonds autorisés.',
      hawkRole: isAr
        ? 'فحص مدة الإشهار القانونية (منع تقليص الآجال غير المبرر) وضمان مبدأ حرية الوصول.'
        : 'Surveillance des délais d’affichage légaux et garantie du libre accès à la commande.',
      output: isAr ? 'دفتر شروط معتمد وإعلان رسمي منشور' : 'Cahier des charges homologué et publié',
    },
    {
      num: '03',
      id: 3,
      title: isAr ? 'تقديم العروض والإيداع المشفر' : 'Dépôt & Chiffrement des Offres',
      legal: isAr ? 'المواد 48 إلى 51' : 'Articles 48 à 51',
      subtitle: isAr ? 'الختم التشفيري والحماية الزمنية' : 'Scellement temporel AES-256',
      authorityRole: isAr
        ? 'الإجابة الشفافة عن استفسارات المتعهدين وتعميم مذكرات الإيضاح على جميع المتنافسين بالتساوي.'
        : 'Réponse impartiale aux questions et diffusion publique des notes additives à tous les soumissionnaires.',
      operatorRole: isAr
        ? 'تجهيز ملفات الترشح والعروض المالية، فحصها بدرع الامتثال، وتشفيرها وختمها بـ AES-256.'
        : 'Constitution des offres, audit pré-dépôt via le bouclier IA et scellement électronique AES-256.',
      financeRole: isAr
        ? 'تسجيل ومراقبة استقرار الالتزامات المالية للعملية.'
        : 'Suivi de la stabilité des engagements de l’opération.',
      hawkRole: isAr
        ? 'الرقابة على سلامة أقفال التشفير ومنع أي تسريب أو فتح للوثائق قبل انقضاء الأجل القانوني.'
        : 'Surveillance de l’inviolabilité des clés cryptographiques jusqu’à la minute légale d’ouverture.',
      output: isAr ? 'وصل إيداع إلكتروني مشفر بخاتم زمني' : 'Récépissé de dépôt scellé et horodaté',
    },
    {
      num: '04',
      id: 4,
      title: isAr ? 'فتح الأظرفة العلني المباشر' : 'Séance d’Ouverture Publique',
      legal: isAr ? 'المادة 53 من القانون' : 'Article 53 de la Loi',
      subtitle: isAr ? 'بث رقمي وتوثيق فوري للمحاضر' : 'Retransmission directe & PV instantané',
      authorityRole: isAr
        ? 'عقد الجلسة بحضور المتعهدين أو عبر البث الرقمي المباشر، وتفريغ الوثائق وتدوين المحضر ثانية بثانية.'
        : 'Tenue de la séance en présence des candidats ou en streaming direct, avec PV dressé séance tenante.',
      operatorRole: isAr
        ? 'حضور الجلسة العلنية مباشرة والاطلاع اللحظي على قائمة المنافسين والأسعار المسجلة بالمحضر.'
        : 'Participation en temps réel à l’ouverture et consultation immédiate des montants annoncés.',
      financeRole: isAr
        ? 'حضور ممثل الهيئات المالية ومطابقة المبالغ والضمانات المصرفية المسجلة.'
        : 'Vérification des cautions bancaires et constats des montants proposés.',
      hawkRole: isAr
        ? 'التوثيق الجنائي المرئي والمكتوب لجلسة الفتح وضمان نزاهة القيد ومنع أي إضافة وثائق لاحقة.'
        : 'Enregistrement légal infalsifiable garantissant qu’aucune pièce n’est ajoutée après clôture.',
      output: isAr ? 'محضر جلسة فتح الأظرفة الموقع إلكترونياً' : 'Procès-Verbal d’ouverture officiel (PV)',
    },
    {
      num: '05',
      id: 5,
      title: isAr ? 'تقييم العروض والترتيب' : 'Évaluation des Offres & Classement',
      legal: isAr ? 'المواد 55 إلى 60' : 'Articles 55 à 60',
      subtitle: isAr ? 'فحص المطابقة وتطبيق مصفوفة التنقيط' : 'Examen technique et matrice 100 pts',
      authorityRole: isAr
        ? 'الفحص التقني والمالي الموضوعي، تطبيق مصفوفة الـ 100 نقطة، وإقصاء العروض غير المطابقة أو الشاذة.'
        : 'Évaluation objective des dossiers, application du barème 100 pts et détection des offres anormales.',
      operatorRole: isAr
        ? 'الرد على طلبات الاستيضاح أو تبرير الأسعار التي توجهها لجنة الصفقات دون تعديل العرض.'
        : 'Réponse aux demandes de précisions ou de justifications de prix sans modifier le fond de l’offre.',
      financeRole: isAr
        ? 'فحص التناسب المالي والجدوى الاقتصادية للعرض الأفضل تقنياً ومالياً.'
        : 'Contrôle de la viabilité budgétaire de l’offre économiquement la plus avantageuse.',
      hawkRole: isAr
        ? 'تشغيل رادار كشف التواطؤ ومقارنة الأسعار مع الصفقات المماثلة في الولايات الـ 69.'
        : 'Activation du radar anti-collusion et comparaison avec les mercuriales des 69 wilayas.',
      output: isAr ? 'تقرير تقييم العروض واقتراح المنح المؤقت' : 'Rapport d’évaluation et proposition de choix',
    },
    {
      num: '06',
      id: 6,
      title: isAr ? 'الإسناد المؤقت والطعون والتعاقد' : 'Attribution, Recours & Contrat',
      legal: isAr ? 'المواد 65 و73 و82' : 'Articles 65, 73 et 82',
      subtitle: isAr ? 'مهلة الـ 10 أيام والتأشيرة النهائية' : 'Délai de 10 jours et visa définitif',
      authorityRole: isAr
        ? 'نشر إعلان المنح المؤقت، تسيير مهلة الطعون القانونية (10 أيام)، وإعداد وثيقة العقد النهائي.'
        : 'Publication de l’attribution provisoire, gestion du délai de recours de 10 jours et finalisation du contrat.',
      operatorRole: isAr
        ? 'تقديم كفالة حسن التنفيذ (5% من مبلغ العقد) أو رفع طعن نظامي مؤسس في الآجال، وتوقيع العقد.'
        : 'Dépôt de la caution de bonne exécution (5%) ou recours gracieux motivé, puis signature du marché.',
      financeRole: isAr
        ? 'فحص ملف الصفقة النهائي ومحاضر اللجان ومنح التأشيرة المالية النهائية الملزمة لسريان العقد.'
        : 'Examen juridique et budgétaire approfondi pour délivrance du visa définitif du Contrôle Financier.',
      hawkRole: isAr
        ? 'المتابعة المركزية للطعون والفصل فيها وفق أحكام القانون، وضمان الشفافية التامة للإسناد.'
        : 'Suivi national des recours devant la commission des marchés et validation de la probité de l’attribution.',
      output: isAr ? 'عقد الصفقة المبرم والمؤشر عليه مالياً' : 'Contrat de marché revêtu du visa financier',
    },
    {
      num: '07',
      id: 7,
      title: isAr ? 'التنفيذ وأوامر الخدمة والتسديد' : 'Exécution, ODS & Règlements',
      legal: isAr ? 'المواد 88 إلى 102' : 'Articles 88 à 102',
      subtitle: isAr ? 'أوامر الخدمة والاستلام الميداني' : 'Ordres de service et réceptions',
      authorityRole: isAr
        ? 'إصدار أمر بداية الأشغال (ODS)، متابعة الوتيرة الميدانية، والتحقق عبر الختم الجغرافي بالأقمار الصناعية.'
        : 'Notification de l’ODS de démarrage, suivi d’avancement certifié par GPS et réception des travaux.',
      operatorRole: isAr
        ? 'تنفيذ الأشغال وفق المواصفات والآجال، وتقديم وضعيات الكشوف الشهرية وصرف المستحقات.'
        : 'Réalisation des prestations conformément aux clauses, dépôt des décomptes mensuels et facturation.',
      financeRole: isAr
        ? 'صرف الحوالات المالية بعد مطابقة الإنجاز الفعلي، وتصفية وتحرير كفالات الضمان عند الاستلام النهائي.'
        : 'Mandatement des situations sur attestation de service fait et mainlevée des cautions à terme.',
      hawkRole: isAr
        ? 'تفعيل مؤشر مخاطر التأخير والانحراف المالي لمنع تجاوز سقف الملاحق القانوني (10% و20%).'
        : 'Détection prédictive des retards et blocage des avenants dépassant les plafonds stricts (10% / 20%).',
      output: isAr ? 'محاضر الاستلام المؤقت والنهائي وتصفية الحساب' : 'PV de réception provisoire/définitive & Décompte général',
    },
  ];

  const current = stages.find((s) => s.id === selectedStage) || stages[0];

  return (
    <section
      id="lifecycle"
      dir={dir}
      className="w-full bg-[#f0f0f0] py-20 border-b border-[#d8d8d8]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Heading */}
        <div className="max-w-[720px] mx-auto text-center space-y-3 mb-12">
          <p className="text-[13px] font-medium tracking-[0.1em] uppercase text-[#5a5a5a] font-mono">
            {isAr ? 'المسار الإجرائي القانوني' : 'CYCLE DE VIE DU MARCHÉ'}
          </p>
          <h2 className="text-[32px] sm:text-[40px] font-semibold text-[#080808] leading-[1.04] tracking-[-0.4px]">
            {isAr ? 'دورة حياة الصفقة… 7 مراحل قانونية متزامنة' : '7 Jalons Légaux Synchronisés (Loi 23-12)'}
          </h2>
          <p className="text-[16px] text-[#5a5a5a] leading-[1.6]">
            {isAr
              ? 'تزامن الأدوار بدقة بين المصلحة المتعاقدة، المتعامل الاقتصادي، والمراقب المالي، تحت الإشراف المباشر لعين الصقر للإدارة المركزية.'
              : 'Coordination fluide et traçabilité intégrale entre l’ensemble des acteurs institutionnels et économiques.'}
          </p>
        </div>

        {/* Stepper Tabs (Spec: 1px #d8d8d8 border, 4px/8px radii) */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center min-w-[780px] bg-[#ffffff] border border-[#d8d8d8] rounded-[8px] p-1.5">
            {stages.map((stage) => {
              const isSelected = stage.id === selectedStage;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStage(stage.id)}
                  className={`flex-1 py-3 px-2 text-center rounded-[4px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#080808] text-white'
                      : 'text-[#5a5a5a] hover:text-[#080808] hover:bg-[#f0f0f0]'
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] block font-bold ${
                      isSelected ? 'text-[#146ef5]' : 'text-[#5a5a5a]'
                    }`}
                  >
                    {stage.num}
                  </span>
                  <strong className="text-[13px] font-semibold block truncate">
                    {stage.title}
                  </strong>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Content Card (Spec: 8px radius, 1px #d8d8d8 border, 24px padding) */}
        <div className="bg-[#ffffff] border border-[#d8d8d8] rounded-[8px] p-6 sm:p-8 space-y-6">
          
          {/* Header of Stage */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#d8d8d8]">
            <div className="flex items-center gap-3">
              <span className="size-10 rounded-[4px] bg-[#146ef5] text-white flex items-center justify-center font-mono text-[16px] font-bold">
                {current.num}
              </span>
              <div>
                <h3 className="text-[20px] font-semibold text-[#080808]">
                  {current.title}
                </h3>
                <span className="text-[13px] text-[#5a5a5a]">
                  {current.legal} — {current.subtitle}
                </span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-[4px] bg-[#f0f0f0] border border-[#d8d8d8] text-[12px] text-[#5a5a5a]">
              <span className="font-semibold text-[#080808] me-1.5">{isAr ? 'المخرج الإجرائي:' : 'Livrable :'}</span>
              <span>{current.output}</span>
            </div>
          </div>

          {/* 4 Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Role 1: Authority */}
            <div className="p-4 rounded-[6px] border border-[#d8d8d8] border-t-4 border-t-[#60ed76] bg-[#ffffff] space-y-2">
              <div className="flex items-center gap-2 text-[#080808] text-[13px] font-semibold">
                <Building className="size-4 text-[#15803d]" />
                <span className="text-[#15803d] font-bold">{isAr ? 'المصلحة المتعاقدة' : 'Service Contractant'}</span>
              </div>
              <p className="text-[13px] text-[#5a5a5a] leading-relaxed">
                {current.authorityRole}
              </p>
            </div>

            {/* Role 2: Operator */}
            <div className="p-4 rounded-[6px] border border-[#d8d8d8] border-t-4 border-t-[#146ef5] bg-[#ffffff] space-y-2">
              <div className="flex items-center gap-2 text-[#080808] text-[13px] font-semibold">
                <Briefcase className="size-4 text-[#146ef5]" />
                <span className="text-[#146ef5] font-bold">{isAr ? 'المتعامل الاقتصادي' : 'Opérateur'}</span>
              </div>
              <p className="text-[13px] text-[#5a5a5a] leading-relaxed">
                {current.operatorRole}
              </p>
            </div>

            {/* Role 3: Finance Controller */}
            <div className="p-4 rounded-[6px] border border-[#d8d8d8] bg-[#ffffff] space-y-2">
              <div className="flex items-center gap-2 text-[#080808] text-[13px] font-semibold">
                <Coins className="size-4 text-[#5a5a5a]" />
                <span>{isAr ? 'المراقب المالي' : 'Contrôleur'}</span>
              </div>
              <p className="text-[13px] text-[#5a5a5a] leading-relaxed">
                {current.financeRole}
              </p>
            </div>

            {/* Role 4: Hawk Eye */}
            <div className="p-4 rounded-[6px] border border-[#d8d8d8] border-t-4 border-t-[#ffa666] bg-[#ffffff] space-y-2">
              <div className="flex items-center gap-2 text-[#080808] text-[13px] font-semibold">
                <Eye className="size-4 text-[#c2410c]" />
                <span className="text-[#c2410c] font-bold">{isAr ? 'عين الصقر المركزية' : 'Supervision'}</span>
              </div>
              <p className="text-[13px] text-[#5a5a5a] leading-relaxed">
                {current.hawkRole}
              </p>
            </div>

          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#d8d8d8]">
            <button
              type="button"
              disabled={selectedStage === 1}
              onClick={() => setSelectedStage((prev) => Math.max(1, prev - 1))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#d8d8d8] text-[13px] font-medium transition-colors ${
                selectedStage === 1
                  ? 'text-[#bdbdbd] bg-[#f0f0f0] cursor-not-allowed border-transparent'
                  : 'text-[#080808] bg-white hover:bg-[#f0f0f0] cursor-pointer'
              }`}
            >
              {isAr ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
              <span>{isAr ? 'المرحلة السابقة' : 'Précédente'}</span>
            </button>

            <span className="font-mono text-[12px] text-[#5a5a5a]">
              0{selectedStage} / 07
            </span>

            <button
              type="button"
              disabled={selectedStage === 7}
              onClick={() => setSelectedStage((prev) => Math.min(7, prev + 1))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#d8d8d8] text-[13px] font-medium transition-colors ${
                selectedStage === 7
                  ? 'text-[#bdbdbd] bg-[#f0f0f0] cursor-not-allowed border-transparent'
                  : 'text-[#080808] bg-white hover:bg-[#f0f0f0] cursor-pointer'
              }`}
            >
              <span>{isAr ? 'المرحلة التالية' : 'Suivante'}</span>
              {isAr ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

export default V3LifecycleProcess;
