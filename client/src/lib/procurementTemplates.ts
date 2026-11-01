/**
 * procurementTemplates.ts
 * مكتبة قوالب دفاتر الشروط ونظام طرق وأشكال الإبرام وفق القانون رقم 23-12 والمرسوم الرئاسي رقم 15-247.
 */

export type ProcurementNature = 'works' | 'supplies' | 'studies' | 'services';

export type ProcurementMethod = 'call_for_tenders' | 'negotiated_procedure' | 'open_tender';

export type CallForTendersForm = 'open' | 'open_with_min_capacity' | 'restricted' | 'competition';

export type NegotiatedProcedureForm = 'direct' | 'after_consultation';

export type ProcurementForm = CallForTendersForm | NegotiatedProcedureForm;

export type CompetitionScope = 'national' | 'national_and_international';

export interface OperatorDocumentRequirement {
  id?: string;
  code: string;
  name: string;
  titleAr?: string;
  category: 'candidacy' | 'technical' | 'financial';
  isMandatory: boolean;
  isDisqualifying?: boolean;
  isStatutory: boolean;
  statutoryBasis: string;
  statutoryRef?: string;
  descriptionAr?: string;
  conditionNotes?: string;
}

export interface CahierTemplate {
  id: string;
  title: string;
  procurementNature: ProcurementNature;
  compatibleMethods: ProcurementMethod[];
  compatibleForms: ProcurementForm[];
  sourceType: 'official' | 'sectoral' | 'internal_advisory';
  sourceReference: string;
  version: string;
  revisionDate: string;
  statutoryReferences: string[];
  status: 'internal_advisory' | 'approved_official' | 'under_review' | 'advisory';
  usageLimits?: string;
  sections: {
    general: string;
    rules: string;
    details: string;
    warranty: string;
    terms: string;
    scoring: string;
  };
  requiredDocuments: OperatorDocumentRequirement[];
}

// ─── تسميات المراجع الرسمية ──────────────────────────────────────────────────

export const NATURE_LABELS: Record<ProcurementNature, { ar: string; fr: string; desc: string }> = {
  works: {
    ar: 'أشغال',
    fr: 'Travaux',
    desc: 'بناء، ترميم، صيانة، منشآت كبرى وهندسة مدنية (المادة 29 من القانون 23-12)',
  },
  supplies: {
    ar: 'لوازم',
    fr: 'Fournitures',
    desc: 'اقتناء، إيجار، أو توريد عتاد ومواد وتجهيزات (المادة 29 من القانون 23-12)',
  },
  studies: {
    ar: 'دراسات',
    fr: 'Études',
    desc: 'هندسة معمارية، استشارات، مكاتب دراسات وخبرات (المادة 29 من القانون 23-12)',
  },
  services: {
    ar: 'خدمات',
    fr: 'Services',
    desc: 'صيانة، نظافة، أمن، حراسة، نقل، إيواء وتأمين (المادة 29 من القانون 23-12)',
  },
};

export const METHOD_LABELS: Record<string, { ar: string; fr: string; desc: string; legalRef: string }> = {
  call_for_tenders: {
    ar: 'طلب العروض',
    fr: "Appel d'offres",
    desc: 'القاعدة العامة لتكريس المنافسة وتكافؤ الفرص والشفافية في إبرام الصفقات العمومية.',
    legalRef: 'المادة 39 وما بعدها من القانون 23-12 والمادة 39 من المرسوم الرئاسي 15-247',
  },
  open_tender: {
    ar: 'طلب العروض',
    fr: "Appel d'offres",
    desc: 'القاعدة العامة لتكريس المنافسة وتكافؤ الفرص والشفافية في إبرام الصفقات العمومية.',
    legalRef: 'المادة 39 وما بعدها من القانون 23-12 والمادة 39 من المرسوم الرئاسي 15-247',
  },
  negotiated_procedure: {
    ar: 'الإجراء التفاوضي',
    fr: 'Procédure négociée',
    desc: 'طريقة استثنائية لإبرام الصفقة بالتفاوض مع شريك أو عدة شركاء متعاقدين في الحالات المحددة قانوناً.',
    legalRef: 'المادة 47 وما بعدها من القانون 23-12 والمادة 49 من المرسوم الرئاسي 15-247',
  },
};

export const FORM_LABELS: Record<ProcurementForm, { ar: string; fr: string; desc: string; method: ProcurementMethod; legalRef: string }> = {
  open: {
    ar: 'مفتوح',
    fr: 'Ouvert',
    desc: 'إجراء يتيح لكل مترشح يستوفي الشروط القانونية تقديم عرضه دون قيد أولي.',
    method: 'call_for_tenders',
    legalRef: 'المادة 40 من القانون 23-12 والمادة 40 من المرسوم 15-247',
  },
  open_with_min_capacity: {
    ar: 'مفتوح مع اشتراط قدرات دنيا',
    fr: 'Ouvert avec capacités minimales',
    desc: 'إجراء متاح لجميع المتنافسين الذين يستوفون شروطاً دنيا معلنة مسبقاً تتعلق بالقدرات التقنية أو المالية أو المهنية.',
    method: 'call_for_tenders',
    legalRef: 'المادة 41 من القانون 23-12 والمادة 41 من المرسوم 15-247',
  },
  restricted: {
    ar: 'محدود',
    fr: 'Restreint',
    desc: 'إجراء يقتصر فيه تقديم العروض على المترشحين الذين تم انتقاؤهم مسبقاً وفق معايير موضوعية.',
    method: 'call_for_tenders',
    legalRef: 'المادة 42 من القانون 23-12 والمادة 42 من المرسوم 15-247',
  },
  competition: {
    ar: 'مسابقة',
    fr: 'Concours',
    desc: 'شكل من أشكال طلب العروض يُلجأ إليه عندما تقتضي دوافع تقنية أو جمالية أو مالية خاصة إجراء أبحاث خاصة (خاصة في صفقات الدراسات والهندسة المعمارية).',
    method: 'call_for_tenders',
    legalRef: 'المادة 43 من القانون 23-12 والمادة 44 من المرسوم 15-247',
  },
  direct: {
    ar: 'مباشر (بدون دعوة للمنافسة)',
    fr: 'Direct (sans mise en concurrence)',
    desc: 'إبرام الصفقة مع متعامل وحيد في حالات الاحتكار التقني الحصري، التكنولوجيا الفريدة، أو الاستعجال الملح غير المتوقع.',
    method: 'negotiated_procedure',
    legalRef: 'المادة 48 من القانون 23-12 والمادة 49 من المرسوم 15-247',
  },
  after_consultation: {
    ar: 'بعد الاستشارة',
    fr: 'Après consultation',
    desc: 'التفاوض مع متعاملين بعد استشارة شروطهم في حالات عدم الجدوى أو الصفقات ذات الخصوصية الاستثنائية.',
    method: 'negotiated_procedure',
    legalRef: 'المادة 49 من القانون 23-12 والمادة 51 من المرسوم 15-247',
  },
};

export const COMPETITION_SCOPE_LABELS: Record<CompetitionScope, string> = {
  national: 'وطني (مخصص للمتعاملين المقيمين بالجزائر)',
  national_and_international: 'وطني ودولي (مفتوح للمتعاملين الوطنيين والأجانب)',
};

export const TEMPLATE_STATUS_LABELS: Record<string, { ar: string; badgeClass: string; desc: string }> = {
  internal_advisory: {
    ar: 'قالب داخلي استرشادي — يحتاج مراجعة',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    desc: 'نموذج إرشادي مستخلص من القواعد العامة، ويخضع لتقدير ومراجعة المصلحة المتعاقدة قبل اعتماده.',
  },
  approved_official: {
    ar: 'معتمد رسمياً بنص تنظيمي',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    desc: 'نموذج صادر بمرسوم أو قرار وزاري منشور بالجريدة الرسمية ومطابق لنصه الحرفي.',
  },
  under_review: {
    ar: 'قيد التدقيق الداخلي',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    desc: 'قالب مسودة قيد التحقق القانوني والتنظيمي.',
  },
};

// ─── الدوال المساعدة ─────────────────────────────────────────────────────────

export function getCompatibleForms(method: ProcurementMethod): ProcurementForm[] {
  if (method === 'call_for_tenders' || method === 'open_tender') {
    return ['open', 'open_with_min_capacity', 'restricted', 'competition'];
  }
  return ['direct', 'after_consultation'];
}

export function isCompetitionScopeApplicable(
  methodOrForm: ProcurementMethod | ProcurementForm,
  maybeForm?: ProcurementForm
): boolean {
  if (maybeForm !== undefined) {
    const method = methodOrForm as ProcurementMethod;
    const form = maybeForm;
    if (method === 'negotiated_procedure' && form === 'direct') {
      return false;
    }
    return true;
  }
  const form = methodOrForm as ProcurementForm;
  return form !== 'direct';
}

export function isJustificationRequired(
  methodOrForm: ProcurementMethod | ProcurementForm,
  maybeForm?: ProcurementForm
): boolean {
  if (maybeForm !== undefined) {
    const method = methodOrForm as ProcurementMethod;
    const form = maybeForm;
    if ((method === 'call_for_tenders' || method === 'open_tender') && form === 'open') {
      return false;
    }
    return true;
  }
  const form = methodOrForm as ProcurementForm;
  return form !== 'open';
}

// ─── مكتبة القوالب النموذجية ─────────────────────────────────────────────────

export const CAHIER_TEMPLATES_LIBRARY: CahierTemplate[] = [
  // ═══ 1. عائلة الأشغال (Works) ═══
  {
    id: 'tpl-works-open-std',
    title: 'دفتر الشروط النموذجي لأشغال البناء والهندسة المدنية (طلب عروض مفتوح)',
    procurementNature: 'works',
    compatibleMethods: ['call_for_tenders'],
    compatibleForms: ['open', 'open_with_min_capacity'],
    sourceType: 'internal_advisory',
    sourceReference: 'نموذج استرشادي مستند للقواعد العامة للقانون 23-12 والمرسوم 15-247 (غير منشور كملحق حرفي في الجريدة الرسمية)',
    version: '2.1',
    revisionDate: '2024-01-15',
    statutoryReferences: [
      'القانون رقم 23-12 (المادتان 29 و40)',
      'المرسوم الرئاسي رقم 15-247 (المادتان 13 و40)',
      'دفتر الشروط الإدارية العامة المطبقة على صفقات الأشغال (CCAG)',
    ],
    status: 'internal_advisory',
    usageLimits: 'مخصص لمشاريع البناء والترميم والتهيئة العامة التي تطرح للمنافسة العامة.',
    sections: {
      general:
        'تحدد هذه الصفقة العمومية شروط وكيفيات إنجاز الأشغال المحددة في نطاق الحاجة، طبقاً لأحكام القانون رقم 23-12 المؤرخ في 5 أوت 2023 المتعلق بالقواعد العامة للصفقات العمومية والمرسوم الرئاسي رقم 15-247.',
      rules:
        'يتكون ملف الترشح والعرض الإداري وجوباً من: التصريح بالترشح، التصريح بالنزاهة، القانون الأساسي للشركة، السجل التجاري الإلكتروني، والشهادات الجبائية وشبه الجبائية سارية المفعول.',
      details:
        'تنفذ الأشغال طبقاً لدفتر الشروط والمواصفات الفنية الوطنية والمقاييس المعتمدة من المعهد الجزائري للتقييس (IANOR). يلتزم المقاول بتقديم مخطط تنفيذ تفصيلي وبرنامج زمني دقيق في أجل 15 يوماً من إشعار بدء الأشغال.',
      warranty:
        'فترة الضمان التعاقدي محددة بسنة واحدة (12 شهراً) تبدأ من تاريخ الاستلام المؤقت للأشغال دون تحفظات، ويلتزم المقاول بإصلاح كل عيب يظهر خلال هذه الفترة على نفقته الخاصة.',
      terms:
        'يتم الدفع بواسطة حوالات مصرفية على أساس وضعيات الأشغال الشهرية المنجزة فعلياً والمصادق عليها من طرف المصلحة المتعاقدة. يتم اقتطاع كفالة حسن التنفيذ بنسبة 5% وتسترجع عند الاستلام النهائي.',
      scoring:
        'يتم تقييم العروض التقنية على أساس 100 نقطة: الوسائل البشرية والكفاءات (30 ن)، العتاد والمعدات المخصصة للمشروع (30 ن)، المراجع المهنية لمشاريع مماثلة (30 ن)، والمنهجية والجدول الزمني (10 ن). الحد الأدنى للتأهيل هو 65 نقطة، ويسند المشروع للمتعهد المؤهل تقنياً صاحب العرض الأقل ثمناً.',
    },
    requiredDocuments: [
      {
        code: 'DOC-ADM-01',
        name: 'التصريح بالترشح (الاستمارة الموحدة)',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-ADM-02',
        name: 'التصريح بالنزاهة (الاستمارة الموحدة)',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-ADM-03',
        name: 'شهادة التأهيل والتصنيف المهنيين (سارية المفعول)',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'التنظيم المعمول به لصفقات الأشغال',
        conditionNotes: 'النشاط الرئيسي والرتبة المطلوبة في إعلان المنافسة',
      },
      {
        code: 'DOC-TECH-01',
        name: 'مذكرة تقنية تبريرية ومنهجية التنفيذ والجدول الزمني',
        category: 'technical',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-TECH-02',
        name: 'قائمة الوسائل البشرية والمادية مع وثائق الإثبات',
        category: 'technical',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-FIN-01',
        name: 'رسالة التعهد وجدول الأسعار الفردية (BPU)',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-FIN-02',
        name: 'التفصيل الكمي والتقديري (DQE)',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
    ],
  },
  {
    id: 'tpl-works-direct-urgent',
    title: 'نموذج دفتر بنود الأشغال الاستعجالية (إجراء تفاوضي مباشر)',
    procurementNature: 'works',
    compatibleMethods: ['negotiated_procedure'],
    compatibleForms: ['direct'],
    sourceType: 'internal_advisory',
    sourceReference: 'دليل الإجراءات الاستثنائية الاسترشادي للمصالح المتعاقدة المستند للقانون 23-12 والمرسوم 15-247',
    version: '1.0',
    revisionDate: '2024-03-01',
    statutoryReferences: [
      'القانون رقم 23-12 (المادة 48 - حالات الاستعجال غير المتوقع)',
      'المرسوم الرئاسي رقم 15-247 (المادة 49)',
    ],
    status: 'internal_advisory',
    usageLimits: 'يقتصر حصراً على حالات الاستعجال القاهر غير المتوقع التي تهدد سلامة الأشخاص أو الممتلكات وموثقة بمحاضر رسمية.',
    sections: {
      general:
        'تبرم هذه الصفقة الاستعجالية وفق الإجراء التفاوضي المباشر سنداً للمادة 48 من القانون 23-12، لتنفيذ الأشغال الضرورية لتفادي الخطر المحدق بالمنشأة.',
      rules:
        'تقديم الملف الإداري الأساسي المثبت للصفة والقدرة القانونية مع التصريح بالنزاهة والترشح والسجل التجاري.',
      details:
        'التدخل الفوري والميداني خلال 48 ساعة من تاريخ التوقيع على الصفقة، مع الالتزام بالمخطط الأمني وتأمين الموقع.',
      warranty:
        'ضمان فني استعجالي للأشغال المنجزة لمدة 12 شهراً.',
      terms:
        'الدفع على أساس كشوف الحساب الدورية للأشغال المنفذة فعلياً بعد معاينة مكتب المراقبة التقنية CTC.',
      scoring:
        'إجراء تفاوضي مباشر لا يخضع لشبكة تنقيط تنافسية، وإنما لمطابقة المقدرة الفنية والاعتدال السعري للمتعامل المفاوض.',
    },
    requiredDocuments: [
      {
        code: 'DOC-URG-01',
        name: 'محضر إثبات حالة الاستعجال والتقرير التقني للمعاينة',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 48 من القانون 23-12',
      },
      {
        code: 'DOC-ADM-01',
        name: 'التصريح بالترشح والنزاهة',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-FIN-01',
        name: 'العرض المالي التفاوضي المفصل',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12 ومحضر التفاوض',
      },
    ],
  },

  // ═══ 2. عائلة اللوازم (Supplies) ═══
  {
    id: 'tpl-supplies-open-std',
    title: 'دفتر الشروط النموذجي لاقتناء اللوازم والتجهيزات (طلب عروض مفتوح)',
    procurementNature: 'supplies',
    compatibleMethods: ['call_for_tenders'],
    compatibleForms: ['open', 'open_with_min_capacity'],
    sourceType: 'internal_advisory',
    sourceReference: 'نموذج استرشادي مستند للقواعد العامة للقانون 23-12 والمرسوم 15-247 (غير منشور كملحق حرفي في الجريدة الرسمية)',
    version: '2.0',
    revisionDate: '2024-02-10',
    statutoryReferences: [
      'القانون رقم 23-12 (المادتان 29 و40)',
      'المرسوم الرئاسي رقم 15-247 (المادتان 13 و40)',
    ],
    status: 'internal_advisory',
    usageLimits: 'لتوريد المعدات واللوازم والمواد المكتبية والتقنية المطروحة للمنافسة العامة.',
    sections: {
      general:
        'موضوع هذه الصفقة هو اقتناء وتوريد وتركيب التجهيزات والمواد موضوع الطلب، بما يشمل الفحص الأولي والتسليم بمخازن المصلحة المتعاقدة وفق القانون رقم 23-12.',
      rules:
        'يحتوي الملف الإداري على: التصريح بالترشح والنزاهة، شهادة الوكيل المعتمد أو الموزع الرسمي عند الاقتضاء، السجل التجاري للنشاط المعني، والوضعية الجبائية المحدثة.',
      details:
        'يجب أن تكون التجهيزات الموردة أصلية جديدة تماماً غير مجددة، مصحوبة ببطاقات البيانات التقنية الرسمية وشهادات المنشأ والمطابقة لمعايير ISO/CE والمعايير الجزائرية المعمول بها.',
      warranty:
        'الضمان الأدنى المطلوب للتجهيزات هو 24 شهراً يشمل قطع الغيار الأصلية والصيانة في موقع الاستغلال مع التزام التدخل خلال 48 ساعة من الإخطار.',
      terms:
        'الدفع يتم بنسبة 100% بعد الاستلام النهائي والتشغيل التجريبي للمعدات وتحرير محضر المطابقة التامة من لجنة الاستلام.',
      scoring:
        'العرض المالي الأقل ثمناً من بين العروض التقنية المقبولة والمطابقة للمواصفات الفنية المحددة بدفتر الشروط، مع اشتراط شهادة مطابقة الجودة وتوفر خدمة ما بعد البيع.',
    },
    requiredDocuments: [
      {
        code: 'DOC-ADM-01',
        name: 'التصريح بالترشح والتصريح بالنزاهة',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-SUP-01',
        name: 'البطاقات التقنية المفصلة للعتاد وشهادات المنشأ والمطابقة',
        category: 'technical',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المواصفات الفنية لدفتر الشروط',
      },
      {
        code: 'DOC-SUP-02',
        name: 'تعهد والتزام بخدمة ما بعد البيع وتوفير قطع الغيار الأصلية',
        category: 'technical',
        isMandatory: true,
        isStatutory: false,
        statutoryBasis: 'شروط الضمان التعاقدي التقديرية',
      },
      {
        code: 'DOC-FIN-01',
        name: 'رسالة التعهد وجدول الأسعار الفردية والتفصيل التقديري',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
    ],
  },
  {
    id: 'tpl-supplies-restricted-tech',
    title: 'نموذج اقتناء التجهيزات المتخصصة المعقدة (طلب عروض محدود)',
    procurementNature: 'supplies',
    compatibleMethods: ['call_for_tenders'],
    compatibleForms: ['restricted'],
    sourceType: 'internal_advisory',
    sourceReference: 'دليل التجهيزات التخصصية الاسترشادي للمصالح المتعاقدة',
    version: '1.2',
    revisionDate: '2023-11-20',
    statutoryReferences: [
      'القانون رقم 23-12 (المادة 42)',
      'المرسوم الرئاسي رقم 15-247 (المادة 42)',
    ],
    status: 'internal_advisory',
    usageLimits: 'يستخدم عند توفر عدد محدود ومحدد من المصنعين المؤهلين تقنياً لتوريد العتاد المعقد.',
    sections: {
      general:
        'إبرام صفقة اقتناء عتاد تقني معقد وفق أسلوب طلب العروض المحدود طبقاً للمادة 42 من القانون 23-12 بعد الانتقاء الأولي للمترشحين المؤهلين.',
      rules:
        'شهادة المصنع الأصلي والاعتماد الحصري الدولي للمعدات، مع توفير الكفاءات المعتمدة للتركيب.',
      details:
        'مواصفات دقيقة خاضعة للاختبارات المعملية والفحص قبل الشحن مع مطابقة المعايير الصناعية.',
      warranty:
        'ضمان تصنيعي كامل لمدة 36 شهراً يشمل الاستبدال الفوري والتحديثات البرمجية.',
      terms:
        'اعتماد مستندي أو دفع مجزأ بنسبة 30% دفعة أولية، و70% بعد التركيب والتشغيل الناجح.',
      scoring:
        'مفاضلة وفق العرض الأفضل اقتصادياً (الجودة التقنية، الصيانة، والسعر الإجمالي للملكية TCO).',
    },
    requiredDocuments: [
      {
        code: 'DOC-ADM-01',
        name: 'التصريح بالترشح والنزاهة ووثائق الانتقاء الأولي',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 42 والمادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-MFG-01',
        name: 'شهادة الاعتماد والتفويض الحصري من المصنع الأصلي (Manufacturer Auth)',
        category: 'technical',
        isMandatory: true,
        isStatutory: false,
        statutoryBasis: 'دفتر الشروط المحدود',
      },
      {
        code: 'DOC-FIN-01',
        name: 'رسالة التعهد والعرض المالي المتكامل',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
    ],
  },

  // ═══ 3. عائلة الدراسات (Studies) ═══
  {
    id: 'tpl-studies-competition-arch',
    title: 'دفتر شروط مسابقة الهندسة المعمارية والدراسات العمرانية (مسابقة / طلب عروض)',
    procurementNature: 'studies',
    compatibleMethods: ['call_for_tenders'],
    compatibleForms: ['competition'],
    sourceType: 'internal_advisory',
    sourceReference: 'نموذج استرشادي مستند للقواعد العامة للقانون 23-12 والمرسوم 15-247 (غير منشور كملحق حرفي في الجريدة الرسمية)',
    version: '1.5',
    revisionDate: '2024-01-20',
    statutoryReferences: [
      'القانون رقم 23-12 (المادة 43 - المسابقة)',
      'المرسوم الرئاسي رقم 15-247 (المادتان 44 و45)',
      'المرسوم التنفيذي المنظم لمهنة المهندس المعماري',
    ],
    status: 'internal_advisory',
    usageLimits: 'مخصص لمشاريع الدراسات الهندسية المعمارية والمشاريع الكبرى ذات الطابع الجمالي أو التقني الخاص.',
    sections: {
      general:
        'تنظم هذه المسابقة المعمارية كشكل من أشكال طلب العروض عملاً بالمادة 43 من القانون رقم 23-12 والمادة 44 من المرسوم 15-247 لاختيار أفضل مشروع معماري وهندسي.',
      rules:
        'المشاركة مفتوحة للمهندسين المعماريين المسجلين في الجدول الوطني لهيئة المهندسين المعماريين، ومكاتب الدراسات المؤهلة.',
      details:
        'تقديم برنامج وظيفي تفصيلي وتصاميم هندسية أولية (APS) ومجسمات رقمية مع مراعاة الهوية العمرانية الوطنية ومعايير البناء البيئي المستدام.',
      warranty:
        'المسؤولية العشرية المعمارية والتعاقدية وفق القانون المدني الجزائري.',
      terms:
        'تحديد جوائز مالية للمشاريع الثلاثة الأولى الفائزة، مع إسناد صفقة متابعة الإنجاز للفائز بالجائزة الأولى.',
      scoring:
        'تقييم المشاريع من طرف لجنة تحكيم مستقلة مع احترام سرية الهوية (الأظرفة المجهولة) وفق شبكة تقييم معمارية ووظيفية وبيئية.',
    },
    requiredDocuments: [
      {
        code: 'DOC-ADM-01',
        name: 'التصريح بالترشح والنزاهة والتسجيل في هيئة المهندسين المعماريين (CLOA)',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 43 من القانون 23-12',
      },
      {
        code: 'DOC-ANON-01',
        name: 'ملف المسابقة المعماري المجهول الهوية (لوحات وتصاميم ومذكرة مفاهيمية)',
        category: 'technical',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 45 من المرسوم 15-247 (حجب الهوية أمام لجنة التحكيم)',
        conditionNotes: 'يجب ألا يحمل أي علامة أو توقيع يدل على هوية المتسابق',
      },
      {
        code: 'DOC-FIN-01',
        name: 'العرض المالي المقترح لإنجاز دراسات التنفيذ والمتابعة',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
    ],
  },
  {
    id: 'tpl-studies-open-std',
    title: 'دفتر شروط دراسات المتابعة والمراقبة التقنية للمشاريع (طلب عروض مفتوح مع قدرات دنيا)',
    procurementNature: 'studies',
    compatibleMethods: ['call_for_tenders'],
    compatibleForms: ['open', 'open_with_min_capacity'],
    sourceType: 'internal_advisory',
    sourceReference: 'نموذج استرشادي مستند للقواعد العامة للقانون 23-12 والمرسوم 15-247 (غير منشور كملحق حرفي في الجريدة الرسمية)',
    version: '1.3',
    revisionDate: '2023-12-10',
    statutoryReferences: [
      'القانون رقم 23-12 (المادتان 29 و41)',
      'المرسوم الرئاسي رقم 15-247 (المادتان 13 و41)',
    ],
    status: 'internal_advisory',
    usageLimits: 'لدراسات المتابعة والإشراف الفني ومكاتب الدراسات والخبرة التقنية.',
    sections: {
      general:
        'موضوع الصفقة إنجاز دراسات المتابعة والتدقيق والمراقبة الفنية لضمان حسن سير وجودة التنفيذ طبقاً للقانون 23-12.',
      rules:
        'اعتماد مكتب الدراسات من الوزارة الوصية، وتوفير فريق خبراء يضم مهندسين ذوي خبرة مثبتة بمشاريع مماثلة.',
      details:
        'إعداد تقارير دورية للمتابعة الميدانية، مطابقة المخططات مع الواقع، والمصادقة على كشوف الحساب.',
      warranty:
        'ضمان دقة الدراسات والتقارير والمطابقة للمعايير الوطنية.',
      terms:
        'الدفع على مراحل الإنجاز والمصادقة على المحاضر التقنية.',
      scoring:
        'مفاضلة بين الكفاءات الفنية وخبرة الفريق المسخر وملاءمة العرض المالي.',
    },
    requiredDocuments: [
      {
        code: 'DOC-ADM-01',
        name: 'التصريح بالترشح والنزاهة واعتماد مكتب الدراسات',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-TECH-EXP',
        name: 'السير الذاتية للخبراء والمهندسين المسخرين للمشروع مع شهادات الانتساب',
        category: 'technical',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'معايير التأهيل التقني',
      },
      {
        code: 'DOC-FIN-01',
        name: 'رسالة التعهد والعرض المالي التفصيلي',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
    ],
  },

  // ═══ 4. عائلة الخدمات (Services) ═══
  {
    id: 'tpl-services-open-std',
    title: 'دفتر الشروط النموذجي لخدمات الصيانة والحراسة والنظافة (طلب عروض مفتوح)',
    procurementNature: 'services',
    compatibleMethods: ['call_for_tenders'],
    compatibleForms: ['open', 'open_with_min_capacity'],
    sourceType: 'internal_advisory',
    sourceReference: 'نموذج استرشادي مستند للقواعد العامة للقانون 23-12 والمرسوم 15-247 (غير منشور كملحق حرفي في الجريدة الرسمية)',
    version: '2.0',
    revisionDate: '2024-02-01',
    statutoryReferences: [
      'القانون رقم 23-12 (المادتان 29 و40)',
      'المرسوم الرئاسي رقم 15-247 (المادتان 13 و40)',
      'التشريع المتعلق بالحراسة ونقل الأموال والمواد الحساسة عند الانطباق',
    ],
    status: 'internal_advisory',
    usageLimits: 'لخدمات النظافة، الحراسة، الصيانة الدورية، والنقل لفائدة المصالح المتعاقدة.',
    sections: {
      general:
        'تحدد هذه الصفقة شروط أداء خدمات الصيانة والنظافة والحراسة والخدمات المتخصصة لصالح مقرات ومرافق المصلحة المتعاقدة وفق القانون رقم 23-12.',
      rules:
        'تقديم التصريح بالترشح والنزاهة، ترخيص ممارسة النشاط من السلطات المختصة، إثبات تسوية اشتراكات التأمين الاجتماعي (CNAS/CASNOS)، والمراجع المهنية للسنوات الثلاث الأخيرة.',
      details:
        'تنفيذ الخدمات وفق ميثاق الجودة والسلامة المهنية، وتوفير طاقم مؤهل ومجهز بأدوات السلامة مع تعيين مشرف دائم للتنسيق اليومي.',
      warranty:
        'التزام باستمرارية الخدمة والتعويض الفوري لأي نقص أو خلل خلال مدة التعاقد البالغة 12 شهراً قابلة للتجديد وفق دفتر الشروط.',
      terms:
        'دفع مستحقات الخدمة كل شهرين أو فصلياً على أساس فواتير مؤشرة وجداول متابعة الحضور والتقارير الدورية المعتمدة.',
      scoring:
        'مفاضلة بين أحسن عرض اقتصادي من حيث جودة التسيير ونسبة التأطير والخبرة والملاءمة السعرية.',
    },
    requiredDocuments: [
      {
        code: 'DOC-ADM-01',
        name: 'التصريح بالترشح والنزاهة',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-SEC-01',
        name: 'ترخيص ممارسة النشاط الصادر عن وزارة الداخلية (خاص بالحراسة والأمن)',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'القانون المنظم لأنشطة الحراسة ونقل الأموال',
        conditionNotes: 'ينطبق حصراً على صفقات الحراسة والأمن',
      },
      {
        code: 'DOC-TECH-SRV',
        name: 'مخطط تسيير الخدمة، جدولة المناوبات، والوسائل والمعدات المسخرة',
        category: 'technical',
        isMandatory: true,
        isStatutory: false,
        statutoryBasis: 'دفتر التعليمات الخاصة التقديري',
      },
      {
        code: 'DOC-FIN-01',
        name: 'رسالة التعهد وجدول الأسعار الشهرية والأحادية',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
    ],
  },
  {
    id: 'tpl-services-consultation-spec',
    title: 'نموذج الخدمات التخصصية بعد الاستشارة (إجراء تفاوضي بعد الاستشارة)',
    procurementNature: 'services',
    compatibleMethods: ['negotiated_procedure'],
    compatibleForms: ['after_consultation'],
    sourceType: 'internal_advisory',
    sourceReference: 'دليل الإجراءات التخصصية الداخلي للمصالح المتعاقدة المستند للقانون 23-12',
    version: '1.0',
    revisionDate: '2024-03-10',
    statutoryReferences: [
      'القانون رقم 23-12 (المادة 49 - التفاوض بعد الاستشارة)',
      'المرسوم الرئاسي رقم 15-247 (المادة 51)',
    ],
    status: 'internal_advisory',
    usageLimits: 'يستخدم عند عدم جدوى طلب العروض في الخدمات أو للحالات التي لا يمكن معها تحديد الأسعار مسبقاً بدقة.',
    sections: {
      general:
        'إبرام صفقة خدمات تخصصية وفق أسلوب الإجراء التفاوضي بعد الاستشارة عملاً بالمادة 49 من القانون رقم 23-12، بعد استشارة عروض المتعهدين المعتمدين.',
      rules:
        'تقديم ملف التأهيل المهني والتصريح بالنزاهة والترشح مع مراجع العمليات المشابهة.',
      details:
        'تنفيذ الخدمات وفق دفتر الشروط مع التزام التدخل الفني والتأهيل المتخصص.',
      warranty:
        'ضمان حسن تنفيذ الخدمة ومطابقتها للمعايير المتفق عليها في محضر التفاوض.',
      terms:
        'الدفع على مراحل الإنجاز المحددة في اتفاقية التفاوض.',
      scoring:
        'تقييم المفاوضات على أساس الملاءمة السعرية والقدرات الفنية.',
    },
    requiredDocuments: [
      {
        code: 'DOC-CNS-01',
        name: 'محضر عدم جدوى طلب العروض المسبق أو مبرر الاستشارة القانوني',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 49 من القانون 23-12',
      },
      {
        code: 'DOC-ADM-01',
        name: 'التصريح بالترشح والنزاهة',
        category: 'candidacy',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12',
      },
      {
        code: 'DOC-FIN-01',
        name: 'العرض المالي التفاوضي النهائي',
        category: 'financial',
        isMandatory: true,
        isStatutory: true,
        statutoryBasis: 'المادة 67 من القانون 23-12 ومحضر جلسة التفاوض',
      },
    ],
  },
];

export function getCompatibleTemplates(
  nature: ProcurementNature,
  method?: ProcurementMethod,
  form?: ProcurementForm
): CahierTemplate[] {
  return CAHIER_TEMPLATES_LIBRARY.filter((tpl) => {
    if (tpl.procurementNature !== nature) return false;
    if (method && !tpl.compatibleMethods.includes(method)) return false;
    if (form && !tpl.compatibleForms.includes(form)) return false;
    return true;
  });
}

export function getDynamicOperatorRequirements(
  nature: ProcurementNature,
  method: ProcurementMethod,
  form: ProcurementForm,
  templateId?: string | null
): OperatorDocumentRequirement[] {
  if (templateId) {
    const tpl = CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId);
    if (tpl && tpl.requiredDocuments.length > 0) {
      return tpl.requiredDocuments.map((d) => ({
        ...d,
        id: d.code,
        titleAr: d.name,
        isDisqualifying: d.isMandatory,
        isStatutory: d.isStatutory ?? true,
        statutoryRef: d.statutoryBasis,
      }));
    }
  }

  const baseDocs: OperatorDocumentRequirement[] = [
    {
      code: 'DOC-ADM-01',
      id: 'DOC-ADM-01',
      name: 'التصريح بالترشح (الاستمارة الموحدة)',
      titleAr: 'التصريح بالترشح (الاستمارة الموحدة)',
      category: 'candidacy',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'المادة 67 من القانون رقم 23-12',
      statutoryRef: 'المادة 67 من القانون رقم 23-12',
    },
    {
      code: 'DOC-ADM-02',
      id: 'DOC-ADM-02',
      name: 'التصريح بالنزاهة (الاستمارة الموحدة)',
      titleAr: 'التصريح بالنزاهة (الاستمارة الموحدة)',
      category: 'candidacy',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'المادة 67 من القانون رقم 23-12',
      statutoryRef: 'المادة 67 من القانون رقم 23-12',
    },
    {
      code: 'DOC-ADM-03',
      id: 'DOC-ADM-03',
      name: 'القانون الأساسي للشركة ومستخرج السجل التجاري الإلكتروني',
      titleAr: 'القانون الأساسي للشركة ومستخرج السجل التجاري الإلكتروني',
      category: 'candidacy',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'التشريع التجاري وقانون الصفقات 23-12',
      statutoryRef: 'التشريع التجاري وقانون الصفقات 23-12',
    },
    {
      code: 'DOC-ADM-04',
      id: 'DOC-ADM-04',
      name: 'الشهادات الجبائية وشبه الجبائية سارية المفعول (ضرائب، CNAS، CASNOS)',
      titleAr: 'الشهادات الجبائية وشبه الجبائية سارية المفعول (ضرائب، CNAS، CASNOS)',
      category: 'candidacy',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'المادة 67 من القانون رقم 23-12',
      statutoryRef: 'المادة 67 من القانون رقم 23-12',
    },
  ];

  if (nature === 'works') {
    baseDocs.push({
      code: 'DOC-ADM-05',
      id: 'DOC-ADM-05',
      name: 'شهادة التأهيل والتصنيف المهنيين (سارية المفعول بالدرجة والنشاط المطلوب)',
      titleAr: 'شهادة التأهيل والتصنيف المهنيين (سارية المفعول بالدرجة والنشاط المطلوب)',
      category: 'candidacy',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'التنظيم المعمول به لصفقات الأشغال',
      statutoryRef: 'التنظيم المعمول به لصفقات الأشغال',
    });
  } else if (nature === 'studies') {
    baseDocs.push({
      code: 'DOC-ADM-05',
      id: 'DOC-ADM-05',
      name: 'شهادة الاعتماد والتسجيل في جدول هيئة المهندسين المعماريين أو الخبراء',
      titleAr: 'شهادة الاعتماد والتسجيل في جدول هيئة المهندسين المعماريين أو الخبراء',
      category: 'candidacy',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'المرسوم التشريعي المنظم لمهنة المهندس المعماري',
      statutoryRef: 'المرسوم التشريعي المنظم لمهنة المهندس المعماري',
    });
  }

  // Technical Envelope
  baseDocs.push(
    {
      code: 'DOC-TECH-01',
      id: 'DOC-TECH-01',
      name: 'مذكرة تقنية تبريرية ومنهجية التنفيذ والجدول الزمني للإنجاز',
      titleAr: 'مذكرة تقنية تبريرية ومنهجية التنفيذ والجدول الزمني للإنجاز',
      category: 'technical',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'دفتر الشروط ومعايير التقييم التقني',
      statutoryRef: 'دفتر الشروط ومعايير التقييم التقني',
    },
    {
      code: 'DOC-TECH-02',
      id: 'DOC-TECH-02',
      name: 'قائمة الوسائل البشرية والمادية المسخرة للمشروع مع الإثباتات',
      titleAr: 'قائمة الوسائل البشرية والمادية المسخرة للمشروع مع الإثباتات',
      category: 'technical',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'دفتر الشروط',
      statutoryRef: 'دفتر الشروط',
    },
    {
      code: 'DOC-TECH-03',
      id: 'DOC-TECH-03',
      name: 'المراجع المهنية وشهادات حسن التنفيذ لمشاريع مماثلة',
      titleAr: 'المراجع المهنية وشهادات حسن التنفيذ لمشاريع مماثلة',
      category: 'technical',
      isMandatory: false,
      isDisqualifying: false,
      isStatutory: false,
      statutoryBasis: 'معايير التنقيط والتقييم التقديرية للمصلحة',
      statutoryRef: 'معايير التنقيط والتقييم',
    },
    {
      code: 'DOC-TECH-04',
      id: 'DOC-TECH-04',
      name: 'دفتر الشروط مؤشر وموقع عليه في آخر صفحة مع عبارة «قرئ وقبل»',
      titleAr: 'دفتر الشروط مؤشر وموقع عليه في آخر صفحة مع عبارة «قرئ وقبل»',
      category: 'technical',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'المرسوم 15-247 والقانون 23-12',
      statutoryRef: 'المرسوم 15-247 والقانون 23-12',
    }
  );

  // Financial Envelope
  baseDocs.push(
    {
      code: 'DOC-FIN-01',
      id: 'DOC-FIN-01',
      name: 'رسالة التعهد معبأة وموقعة ومؤرخة',
      titleAr: 'رسالة التعهد معبأة وموقعة ومؤرخة',
      category: 'financial',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'المادة 67 من القانون رقم 23-12',
      statutoryRef: 'المادة 67 من القانون رقم 23-12',
    },
    {
      code: 'DOC-FIN-02',
      id: 'DOC-FIN-02',
      name: 'جدول الأسعار الفردية بالوحدة (BPU) معبأ وموقع',
      titleAr: 'جدول الأسعار الفردية بالوحدة (BPU) معبأ وموقع',
      category: 'financial',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'المادة 67 من القانون رقم 23-12',
      statutoryRef: 'المادة 67 من القانون رقم 23-12',
    },
    {
      code: 'DOC-FIN-03',
      id: 'DOC-FIN-03',
      name: 'التفصيل الكمي والتقديري (DQE) معبأ وموقع',
      titleAr: 'التفصيل الكمي والتقديري (DQE) معبأ وموقع',
      category: 'financial',
      isMandatory: true,
      isDisqualifying: true,
      isStatutory: true,
      statutoryBasis: 'المادة 67 من القانون رقم 23-12',
      statutoryRef: 'المادة 67 من القانون رقم 23-12',
    }
  );

  return baseDocs;
}
