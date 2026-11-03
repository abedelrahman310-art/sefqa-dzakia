import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  Layers,
  Calendar,
  FileText,
  Lock,
  Eye,
  CheckCircle2,
  Award,
  Truck,
  Building,
  Briefcase,
  Coins,
  ShieldCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export const LifecycleGanttSection: React.FC = () => {
  const { lang } = useI18n();
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
    <section id="lifecycle" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ترويسة القسم */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-4 border border-emerald-200">
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>{isAr ? 'المسار الإجرائي القانوني' : 'Processus Procédural Conforme'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-cairo mb-4">
            {isAr ? 'دورة حياة الصفقة… 7 مراحل قانونية متزامنة' : 'Cycle de Vie du Marché… 7 Jalons Légaux Synchronisés'}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-medium">
            {isAr
              ? 'تزامن دقيق للأدوار بين المصلحة المتعاقدة، المتعامل الاقتصادي، والمراقب المالي، تحت الإشراف اللحظي لعين الصقر للإدارة المركزية.'
              : 'Coordination transparente entre l’Autorité, l’Opérateur et le Contrôleur Financier, sous le regard vigilant de l’Administration Centrale.'}
          </p>
        </div>

        {/* شريط المراحل التفاعلي (Desktop & Mobile Stepper) */}
        <div className="mb-10 overflow-x-auto pb-4 scrollbar-none">
          <div className="flex items-center justify-between min-w-[720px] gap-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            {stages.map((stage) => {
              const isSelected = stage.id === selectedStage;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStage(stage.id)}
                  className={`flex-1 flex flex-col items-center py-3 px-2 rounded-xl transition-all text-center ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-md'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full mb-1 ${
                      isSelected ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {stage.num}
                  </span>
                  <strong className="text-xs sm:text-sm font-bold font-cairo leading-tight line-clamp-1">
                    {stage.title}
                  </strong>
                  <span
                    className={`text-[10px] mt-0.5 font-medium line-clamp-1 ${
                      isSelected ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {stage.legal}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* بطاقة تفاصيل المرحلة المحددة مع توزيع الأدوار الرباعي */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-sm">
          
          {/* عنوان المرحلة والسند القانوني */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
            <div className="flex items-center gap-3.5">
              <span className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-mono text-xl font-black shadow-xs">
                {current.num}
              </span>
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-cairo">
                  {current.title}
                </h3>
                <span className="text-xs font-bold text-emerald-700">
                  {current.legal} — {current.subtitle}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">{isAr ? 'المخرج الإجرائي:' : 'Livrable Officiel:'}</span>
              <span>{current.output}</span>
            </div>
          </div>

          {/* شبكة الأدوار المتزامنة (الأطراف الأربعة) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. المصلحة المتعاقدة */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-xs">
                  <Building className="w-4 h-4" />
                  <span>{isAr ? 'المصلحة المتعاقدة' : 'Autorité Contractante'}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {current.authorityRole}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-4 pt-2 border-t border-slate-200/60">
                {isAr ? 'صاحب المشروع والآمر بالصرف' : 'Maître d’ouvrage'}
              </span>
            </div>

            {/* 2. المتعامل الاقتصادي */}
            <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 text-emerald-800 font-bold text-xs">
                  <Briefcase className="w-4 h-4" />
                  <span>{isAr ? 'المتعامل الاقتصادي' : 'Opérateur Économique'}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {current.operatorRole}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-4 pt-2 border-t border-emerald-200/60">
                {isAr ? 'المتعهد والمورد الوطني' : 'Soumissionnaire / Titulaire'}
              </span>
            </div>

            {/* 3. المراقب المالي والمحاسب */}
            <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold text-xs">
                  <Coins className="w-4 h-4" />
                  <span>{isAr ? 'المراقب المالي' : 'Contrôleur Financier'}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {current.financeRole}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-4 pt-2 border-t border-amber-200/60">
                {isAr ? 'الرقابة المالية والمحاسبية' : 'Contrôle préalable & Payeur'}
              </span>
            </div>

            {/* 4. عين الصقر (الإدارة المركزية) */}
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-xs">
                  <Eye className="w-4 h-4" />
                  <span>{isAr ? 'عين الصقر (الإدارة)' : 'Supervision Centrale'}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  {current.hawkRole}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-4 pt-2 border-t border-slate-800">
                {isAr ? 'النزاهة والرقابة المستمرة' : 'Veille anti-fraude & Régulation'}
              </span>
            </div>

          </div>

          {/* أزرار التنقل بين المراحل */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
            <button
              type="button"
              disabled={selectedStage === 1}
              onClick={() => setSelectedStage((prev) => Math.max(1, prev - 1))}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedStage === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isAr ? 'المرحلة السابقة' : 'Étape précédente'}</span>
            </button>

            <span className="text-xs font-bold text-slate-400">
              {selectedStage} / 7
            </span>

            <button
              type="button"
              disabled={selectedStage === 7}
              onClick={() => setSelectedStage((prev) => Math.min(7, prev + 1))}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedStage === 7
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <span>{isAr ? 'المرحلة التالية' : 'Étape suivante'}</span>
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

export default LifecycleGanttSection;
