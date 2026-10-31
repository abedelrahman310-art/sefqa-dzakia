/**
 * الترجمة الفرنسية لصفحة الهبوط V2.
 *
 * صفحة الهبوط مستند HTML خام داخل Shadow DOM، لذلك تُطبَّق الترجمة عبر خريطة
 * نصية (عربي → فرنسي) بدل مفاتيح i18next داخل الماركب. المفاتيح هي النصوص
 * الأصلية بعد تطبيع المسافات، والقيم هي المقابل الفرنسي.
 */

export const LANDING_FR_TITLE =
  'Safaqat Dzakia | Plateforme nationale intelligente des marchés publics';

/** فقرة المقدمة السردية تحتوي وسوم <em>، فتُستبدل ككتلة HTML كاملة. */
export const LANDING_FR_STORY_INTRO =
  "Le parcours commence lorsque <em>l'autorité contractante</em> exprime son besoin. " +
  "<em>L'opérateur économique</em> reçoit le marché, prépare son dossier et soumet son offre. " +
  "À chaque étape, <em>l'intelligence artificielle</em> apporte son aide, tandis que " +
  "<em>l'administration centrale</em> surveille tout de son œil de faucon.";

/** سمات ARIA العربية التي تحتاج ترجمة. */
export const LANDING_FR_ATTRIBUTES: Record<string, string> = {
  'صفقات ذكية — الرئيسية': 'Safaqat Dzakia — Accueil',
  'التنقل الرئيسي': 'Navigation principale',
};

export const LANDING_FR: Record<string, string> = {
  'صفقات ذكية': 'Safaqat Dzakia',
  'منصة الصفقات العمومية': 'Plateforme des marchés publics',
  'الرئيسية': 'Accueil',
  'المنصة': 'Plateforme',
  'البوابات': 'Portails',
  'الذكاء الاصطناعي': "Intelligence artificielle",
  'رحلة الصفقة': 'Parcours du marché',
  'دخول المنصة': 'Accéder à la plateforme',
  'مدعومة بالذكاء الاصطناعي': "Propulsée par l'IA",
  'المنصة الرقمية التي تجمع المصلحة المتعاقدة والمتعامل الاقتصادي والإدارة المركزية في فضاء واحد، وتضع الذكاء الاصطناعي في قلب دورة حياة الصفقة العمومية.':
    "La plateforme numérique qui réunit l'autorité contractante, l'opérateur économique et l'administration centrale dans un espace unique, en plaçant l'intelligence artificielle au cœur du cycle de vie du marché public.",
  'شفافية كاملة': 'Transparence totale',
  'ذكاء اصطناعي في كل مرحلة': "L'IA à chaque étape",
  'رقابة إدارية مستمرة': 'Contrôle administratif continu',
  'اكتشف البوابات': 'Découvrir les portails',
  'شاهد رحلة الصفقة': 'Voir le parcours du marché',
  'التحدي': 'Le défi',
  'الصفقات العمومية اليوم… معقدة، مبعثرة، وتُهدر الفرص':
    "Les marchés publics aujourd'hui… complexes, dispersés et source d'opportunités perdues",
  'رغم الأهمية الاستراتيجية للصفقات العمومية في الجزائر، لا يزال الفاعلون يواجهون عقبات يومية تعرقل الكفاءة والشفافية.':
    "Malgré l'importance stratégique des marchés publics en Algérie, les acteurs font face à des obstacles quotidiens qui freinent l'efficacité et la transparence.",
  'تشتّت المعلومات': "Dispersion de l'information",
  'تُنشر الصفقات عبر قنوات متعددة وغير موحّدة، ما يُصعّب على المتعاملين تتبّع الفرص في الوقت المناسب.':
    'Les marchés sont publiés sur des canaux multiples et non unifiés, ce qui complique le suivi des opportunités au bon moment pour les opérateurs.',
  'بطء الإجراءات': 'Lenteur des procédures',
  'تعقيد الوثائق والمراحل يستهلك وقتًا وجهدًا كبيرين من الإدارات والمتعاملين على حدٍّ سواء.':
    'La complexité des documents et des étapes consomme un temps et des efforts considérables, tant pour les administrations que pour les opérateurs.',
  'غياب أدوات التحليل': "Absence d'outils d'analyse",
  'لا توجد أدوات ذكية تساعد على تقييم العروض ومقارنة الجدوى ومتابعة التنفيذ بشكل منهجي.':
    "Aucun outil intelligent n'aide à évaluer les offres, comparer la faisabilité et suivre l'exécution de manière méthodique.",
  'الحل': 'La solution',
  'منصة واحدة… دورة صفقة كاملة… مدعومة بالذكاء الاصطناعي':
    "Une seule plateforme… tout le cycle du marché… propulsée par l'IA",
  '«صفقات ذكية» توحّد الفاعلين والبيانات والإجراءات في فضاء رقمي واحد، مع طبقة ذكاء اصطناعي تُسرّع وتُحسّن كل مرحلة.':
    "« Safaqat Dzakia » unifie les acteurs, les données et les procédures dans un espace numérique unique, avec une couche d'IA qui accélère et améliore chaque étape.",
  'توحيد الفاعلين': 'Unification des acteurs',
  'ثلاث بوابات مترابطة تجمع المتعامل الاقتصادي، المصلحة المتعاقدة، والإدارة المركزية في نظام بيئي واحد.':
    "Trois portails interconnectés réunissent l'opérateur économique, l'autorité contractante et l'administration centrale dans un même écosystème.",
  'أتمتة ذكية': 'Automatisation intelligente',
  'خوارزميات تحلل الوثائق، تقترح الصياغات، وتُقيّم العروض، لتقليل الأخطاء وتحرير الوقت للقرار البشري.':
    'Des algorithmes analysent les documents, proposent des rédactions et évaluent les offres, afin de réduire les erreurs et de libérer du temps pour la décision humaine.',
  'شفافية قابلة للتتبع': 'Transparence traçable',
  'كل خطوة موثقة ومرئية للأطراف المعنية، بما يعزز الثقة ويضمن الامتثال للمعايير القانونية.':
    'Chaque étape est documentée et visible par les parties concernées, ce qui renforce la confiance et garantit la conformité aux normes juridiques.',
  'الركائز القانونية': 'Les fondements juridiques',
  'منصة مبنية على الامتثال القانوني': 'Une plateforme fondée sur la conformité juridique',
  'صُممت «صفقات ذكية» لتكون متوافقة مع الإطار التشريعي والتنظيمي الجزائري للصفقات العمومية، ومحافظة على مبادئ الشفافية والمنافسة والمساواة.':
    "« Safaqat Dzakia » est conçue pour être conforme au cadre législatif et réglementaire algérien des marchés publics, en préservant les principes de transparence, de concurrence et d'égalité.",
  'التشريع الوطني للصفقات العمومية': 'La législation nationale des marchés publics',
  'احترام أحكام القانون رقم 23-12 المتعلق بتنظيم الصفقات العمومية وتسوية العقود، ومختلف النصوص التطبيقية المرتبطة به.':
    'Respect des dispositions de la loi n° 23-12 relative à la réglementation des marchés publics et au règlement des contrats, ainsi que des textes d’application associés.',
  'هيئات الضبط والرقابة': 'Organes de régulation et de contrôle',
  'التكامل مع صلاحيات المجلس الوطني للصفقات العمومية والهيئات الرقابية، مع توفير بيانات قابلة للتدقيق والتتبع.':
    'Intégration avec les prérogatives du Conseil national des marchés publics et des organes de contrôle, avec des données auditables et traçables.',
  'حماية المعطيات الشخصية': 'Protection des données personnelles',
  'التقيد بأحكام القانون 18-07 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي.':
    'Conformité aux dispositions de la loi 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel.',
  'الرقمنة والتبادل الإلكتروني': 'Dématérialisation et échanges électroniques',
  'اعتماد الوثيقة الإلكترونية والأرشفة الرقمية للمبادلات داخل المنصة، مع مواءمة التوقيع الإلكتروني عند اعتماده رسميًا.':
    "Adoption du document électronique et de l'archivage numérique des échanges au sein de la plateforme, avec alignement sur la signature électronique lors de son adoption officielle.",
  'مبادئ الصفقة العمومية': 'Principes du marché public',
  'الالتزام بمبادئ حرية الوصول إلى الطلب العمومي، المساواة في المعاملة، الشفافية، ونزاهة الإجراءات.':
    "Respect des principes de libre accès à la commande publique, d'égalité de traitement, de transparence et d'intégrité des procédures.",
  'أرشفة وتتبع قانوني': 'Archivage et traçabilité juridique',
  'حفظ الوثائق والمراسلات وسجل الأحداث بشكل يسمح بالمراجعة القانونية والرقابة اللاحقة في أي وقت.':
    'Conservation des documents, correspondances et journaux d’événements de manière à permettre la revue juridique et le contrôle a posteriori à tout moment.',
  'البوابات الثلاث': 'Les trois portails',
  'فضاء واحد… ثلاث بوابات متكاملة': 'Un espace unique… trois portails intégrés',
  'كل فاعل يدخل من بوابته المخصصة، ويجد الأدوات والصلاحيات التي تناسب دوره في دورة الصفقة العمومية.':
    'Chaque acteur accède à son portail dédié et trouve les outils et les habilitations adaptés à son rôle dans le cycle du marché public.',
  'البوابة 01': 'Portail 01',
  'المتعامل الاقتصادي': "L'opérateur économique",
  'فضاء المتعاملين للوصول إلى الفرص، إيداع العروض، ومتابعة الملفات.':
    "Espace des opérateurs pour accéder aux opportunités, déposer des offres et suivre les dossiers.",
  'تصفح الصفقات المفتوحة والإشعارات': 'Consulter les marchés ouverts et les avis',
  'إيداع العروض إلكترونيًا وتتبعها': 'Déposer et suivre les offres en ligne',
  'مطابقة ذكية للصفقات حسب النشاط': "Correspondance intelligente des marchés selon l'activité",
  'أرشيف رقمي لوثائق المتعامل': "Archive numérique des documents de l'opérateur",
  'دخول البوابة': 'Accéder au portail',
  'البوابة 02': 'Portail 02',
  'المصلحة المتعاقدة': "L'autorité contractante",
  'أدوات الإدارة اليومية للصفقات، من التحضير إلى الإسناد والمتابعة.':
    "Outils de gestion quotidienne des marchés, de la préparation à l'attribution et au suivi.",
  'إعداد ونشر وثائق الصفقة': 'Préparer et publier les documents du marché',
  'استقبال العروض وفتحها إلكترونيًا': 'Recevoir et ouvrir les offres en ligne',
  'تقييم ومقارنة العروض بمساعدة الذكاء': "Évaluer et comparer les offres avec l'aide de l'IA",
  'متابعة تنفيذ العقد والآجال': "Suivre l'exécution du contrat et les délais",
  'البوابة 03': 'Portail 03',
  'الإدارة المركزية': "L'administration centrale",
  'مستوى استراتيجي للمتابعة والرقابة وتوجيه السياسة الوطنية للصفقات.':
    'Niveau stratégique pour le suivi, le contrôle et l’orientation de la politique nationale des marchés.',
  'لوحات قيادة وتحليلات وطنية': 'Tableaux de bord et analyses nationales',
  'متابعة الالتزام والآجال': 'Suivi de la conformité et des délais',
  'إحصاءات ومؤشرات قطاعية': 'Statistiques et indicateurs sectoriels',
  'تنسيق المعايير واللوائح': 'Coordination des normes et réglementations',
  'قلب المنصة': 'Le cœur de la plateforme',
  'الذكاء الاصطناعي… في صميم «صفقات ذكية»': "L'IA… au cœur de « Safaqat Dzakia »",
  'طبقة ذكاء تعمل على بيانات المنصة: تقرأ الوثائق، تقارن العروض، وتنبّه إلى الشبهات — ثم تُسلّم القرار موثّقاً إلى الإنسان.':
    "Une couche d'intelligence qui exploite les données de la plateforme : elle lit les documents, compare les offres et signale les suspicions — avant de remettre la décision, documentée, à l'humain.",
  'استشاري فقط: القرار للجنة': 'Consultatif uniquement : la décision revient à la commission',
  'كل مخرَج مسجّل في سجل التدقيق': 'Chaque résultat est consigné dans le journal d’audit',
  'يعمل على بيانات الصفقات داخل المنصة': 'Fonctionne sur les données des marchés au sein de la plateforme',
  'معالجة اللغة الطبيعية العربية': 'Traitement du langage naturel arabe',
  'قراءة وفهم دفاتر الشروط والوثائق الإدارية والتقنية لاستخراج المعلومات الأساسية تلقائيًا.':
    'Lecture et compréhension des cahiers des charges et des documents administratifs et techniques pour en extraire automatiquement les informations essentielles.',
  'الرؤية الحاسوبية للوثائق': 'Vision par ordinateur des documents',
  'التعرف على الوثائق الممسوحة ضوئيًا وتصنيفها والتحقق من اكتمال الملفات.':
    'Reconnaissance des documents numérisés, classification et vérification de la complétude des dossiers.',
  'تحليل وتقييم العروض': 'Analyse et évaluation des offres',
  'مقارنة موضوعية للعروض وفق معايير الصفقة، مع إبراز الفروقات ونقاط القوة والضعف.':
    'Comparaison objective des offres selon les critères du marché, en mettant en évidence les écarts, les forces et les faiblesses.',
  'توليد ومراجعة الوثائق': 'Génération et révision des documents',
  'مساعدة المصالح المتعاقدة في صياغة الوثائق ومراجعة الاتساق القانوني والإجرائي.':
    'Aide aux autorités contractantes pour la rédaction des documents et la révision de la cohérence juridique et procédurale.',
  'قراءة وتصنيف': 'Lecture et classification',
  'دفاتر الشروط والوثائق تُقرأ وتُصنّف وتُستخرج منها المتطلبات.':
    'Les cahiers des charges et documents sont lus, classés et leurs exigences extraites.',
  'تحليل ومقارنة': 'Analyse et comparaison',
  'مطابقة الشروط واستخراج الفروقات ونقاط الاختلاف بين العروض.':
    'Mise en correspondance des critères et extraction des écarts et divergences entre les offres.',
  'توصية موثّقة': 'Recommandation documentée',
  'ملاحظات استشارية مع مرجعها في السجل، تُراجعها لجنة الصفقات.':
    'Observations consultatives avec leur référence au journal, examinées par la commission des marchés.',
  'المخرجات استشارية ولا تُنشئ قرار إسناد أو التزاماً قانونياً؛ المرجع النهائي هو لجنة الصفقات وسجل التدقيق.':
    "Les résultats sont consultatifs et ne créent ni décision d'attribution ni obligation légale ; la référence finale est la commission des marchés et le journal d'audit.",
  'دورة حياة الصفقة — كقصة': 'Le cycle de vie du marché — comme une histoire',
  'رحلة صفقة عمومية… من الفكرة إلى التنفيذ': "Le parcours d'un marché public… de l'idée à l'exécution",
  'في كل فصل من هذه الرحلة، ثلاثة أبطال يعملون معًا: المصلحة تُبرمج، الذكاء يُساعد، والإدارة المركزية تُراقب كعين الصقر.':
    "À chaque chapitre de ce parcours, trois héros travaillent ensemble : l'autorité programme, l'IA assiste et l'administration centrale surveille tel un faucon.",
  'الإدارة المركزية — عين الصقر': "Administration centrale — l'œil du faucon",
  'تراقب كل مرحلة، كل خطوة، كل قرار — في الوقت الحقيقي':
    'Surveille chaque étape, chaque action, chaque décision — en temps réel',
  'مراقبة نشطة': 'Surveillance active',
  'تبدأ الرحلة حين تُعلن': 'Le parcours commence lorsque',
  'حاجتها. يستقبل': 'son besoin. Reçoit',
  'الصفقة، فيُعدّ ملفه ويقدّم عرضه. وفي كل خطوة، يمدّ':
    'le marché, prépare son dossier et soumet son offre. À chaque étape,',
  'يد العون، بينما تُراقب': "apporte son aide, tandis que",
  'كل شيء بعين الصقر.': "surveille tout de son œil de faucon.",
  'الذكاء يُساعد': "L'IA assiste",
  'الإدارة تراقب': "L'administration surveille",
  'الفصل الأول': 'Chapitre premier',
  'التخطيط وتحديد الحاجيات': 'Planification et identification des besoins',
  'تُعرب المصلحة المتعاقدة عن حاجتها وتحدد مواصفاتها بدقة. تبني المخطط الأولي للصفقة: الموضوع، الميزانية التقديرية، والآجال المتوقعة.':
    "L'autorité contractante exprime son besoin et définit précisément ses spécifications. Elle construit le schéma initial du marché : objet, budget prévisionnel et délais attendus.",
  'تدخّل الذكاء': "Intervention de l'IA",
  'يحلل الاحتياجات ويقترح تقسيمًا مناسبًا للصفقة، ويقدّر الميزانية بناءً على صفقات مماثلة.':
    'Analyse les besoins, propose une segmentation adaptée du marché et estime le budget à partir de marchés similaires.',
  'عين الصقر': "L'œil du faucon",
  'تتحقق الإدارة من إدراج الصفقة ضمن البرامج الوطنية، ومن مطابقة التقدير المالي للتوجيهات.':
    "L'administration vérifie l'inscription du marché dans les programmes nationaux et la conformité de l'estimation financière aux orientations.",
  'الفصل الثاني': 'Chapitre II',
  'إعداد وثائق الصفقة ودفتر الشروط': 'Élaboration des documents du marché et du cahier des charges',
  'تصوغ المصلحة دفتر الشروط بمواصفات تقنية محايدة، ومعايير تقييم موضوعية. تُحدد الآجال وطريقة الإبرام والضمانات المطلوبة.':
    "L'autorité rédige le cahier des charges avec des spécifications techniques neutres et des critères d'évaluation objectifs. Elle fixe les délais, le mode de passation et les garanties exigées.",
  'يولّد مسودات دفتر الشروط، يراجع الاتساق القانوني، ويكشف أي بنود قد تعرقل المنافسة أو تضر بالمساواة.':
    "Génère des projets de cahier des charges, vérifie la cohérence juridique et détecte toute clause susceptible d'entraver la concurrence ou de nuire à l'égalité.",
  'تراجع الإدارة مطابقة دفتر الشروط لأحكام القانون 23-12 قبل اعتماده، وتضمن خضوعه للجنة الصفقات.':
    "L'administration vérifie la conformité du cahier des charges aux dispositions de la loi 23-12 avant son adoption et garantit sa soumission à la commission des marchés.",
  'المصلحة تُعلن': "L'autorité publie",
  'المتعامل يستقبل': "L'opérateur reçoit",
  'الذكاء يُطابق': "L'IA met en correspondance",
  'الفصل الثالث': 'Chapitre III',
  'الإشهار… الصفقة تصل إلى المتعاملين': 'La publicité… le marché parvient aux opérateurs',
  'تُنشر الصفقة على المنصة. يمكن للمتعامل الاقتصادي تصفحها والبحث فيها، وتُقترح عليه الصفقات المطابقة لنشاطه، فيبدأ في دراسة دفتر الشروط.':
    "Le marché est publié sur la plateforme. L'opérateur économique peut le consulter et le rechercher ; les marchés correspondant à son activité lui sont proposés, et il commence à étudier le cahier des charges.",
  'يطابق الصفقة آليًا مع ملفات المتعاملين (القطاع، الولاية، الكلمات المفتاحية)، ويقترح صفقات مستهدفة بدل الإغراق العشوائي.':
    "Met automatiquement en correspondance le marché avec les profils des opérateurs (secteur, wilaya, mots-clés) et propose des marchés ciblés plutôt qu'une diffusion aléatoire.",
  'تتحقق الإدارة من صحة الإشهار ومدته، وتراقب مؤشرات الوصول لضمان تكافؤ الفرص للجميع.':
    "L'administration vérifie la validité et la durée de la publicité, et suit les indicateurs de portée pour garantir l'égalité des chances.",
  'المتعامل يُعدّ ويُقدّم': "L'opérateur prépare et soumet",
  'الذكاء يُراجع': "L'IA vérifie",
  'الفصل الرابع': 'Chapitre IV',
  'المشاركة… المتعامل يُحضّر ويُودع': "La participation… l'opérateur prépare et dépose",
  'يجمع المتعامل وثائقه: السجل التجاري، الشهادات الجبائية، العرض التقني والمالي. يحضر ملفه كاملًا ويودعه إلكترونيًا قبل انتهاء الأجل.':
    "L'opérateur rassemble ses documents : registre de commerce, attestations fiscales, offre technique et financière. Il prépare son dossier complet et le dépose en ligne avant l'expiration du délai.",
  'يتحقق من اكتمال الملف تلقائيًا، ينبّه المتعامل إذا نقصت وثيقة، ويقترح تحسينات على العرض التقني قبل الإرسال النهائي.':
    "Vérifie automatiquement la complétude du dossier, alerte l'opérateur en cas de document manquant et propose des améliorations de l'offre technique avant l'envoi final.",
  'تتابع الإدارة إيداع كل عرض ووقت وصوله، لضمان نزاهة العملية ومنع أي تسريب أو تلاعب.':
    "L'administration suit le dépôt de chaque offre et son heure d'arrivée, afin de garantir l'intégrité de l'opération et de prévenir toute fuite ou manipulation.",
  'المصلحة تُقيّم': "L'autorité évalue",
  'الذكاء يُوصي': "L'IA recommande",
  'الفصل الخامس': 'Chapitre V',
  'فتح الأظرفة وتقييم العروض': 'Ouverture des plis et évaluation des offres',
  'تُفتح الأظرفة في جلسة علنية. تُقيّم العروض وفق معايير دفتر الشروط. تُرتب العروض ويُختار الأفضل موضوعيًا وشفافًا.':
    'Les plis sont ouverts en séance publique. Les offres sont évaluées selon les critères du cahier des charges. Elles sont classées et la meilleure est choisie de manière objective et transparente.',
  'يقارن العروض آليًا حسب الأوزان، يحسب النقاط، ويُقدم توصية موضوعية مع تفسير النتيجة — القرار النهائي يبقى للجنة.':
    'Compare automatiquement les offres selon les pondérations, calcule les scores et formule une recommandation objective avec explication du résultat — la décision finale reste à la commission.',
  'تراجع الإدارة محاضر التقييم، وتتحقق من مطابقة القرار للمعايير، وتتدخل فورًا عند أي شبهة.':
    "L'administration examine les procès-verbaux d'évaluation, vérifie la conformité de la décision aux critères et intervient immédiatement en cas de suspicion.",
  'المصلحة تُسند': "L'autorité attribue",
  'المتعامل يُنفّذ': "L'opérateur exécute",
  'الذكاء يتابع': "L'IA suit",
  'الفصل السادس': 'Chapitre VI',
  'الإسناد والتعاقد… ثم بدء التنفيذ':
    "L'attribution et la contractualisation… puis le début de l'exécution",
  'يُمنح الإسناد المؤقت للمتعامل الفائز. تُبرم الصفقة رسميًا، ويبدأ التنفيذ. يُعدّ المتعامل كفالة حسن التنفيذ (5% من مبلغ العقد).':
    "L'attribution provisoire est accordée à l'opérateur retenu. Le marché est conclu officiellement et l'exécution commence. L'opérateur constitue la garantie de bonne exécution (5 % du montant du contrat).",
  'يولّد مسودة العقد، يتابع الآجال والالتزامات، يُنبّه من أي تأخير قبل حدوثه، ويُعد تقارير التقدم تلقائيًا.':
    'Génère le projet de contrat, suit les délais et les obligations, alerte avant tout retard et prépare automatiquement les rapports d’avancement.',
  'تراقب الإدارة تنفيذ العقود على المستوى الوطني، وتقيس مؤشرات الأداء والالتزام، وتتدخل عند أي انحراف.':
    "L'administration surveille l'exécution des contrats au niveau national, mesure les indicateurs de performance et de conformité, et intervient en cas d'écart.",
  'وهكذا… صفقة شفافة من البداية إلى النهاية': 'Ainsi… un marché transparent du début à la fin',
  'المصلحة تُبرمج وتُعدّ، المتعامل يشارك ويُقدّم، الذكاء يُحلّل ويُرشّح ويُرشد، والإدارة المركزية تراقب كل شيء كعين الصقر. كل خطوة موثقة، كل قرار مبرر، وكل نتيجة قابلة للتتبع.':
    "L'autorité programme et prépare, l'opérateur participe et soumet, l'IA analyse, présélectionne et guide, et l'administration centrale surveille tout de son œil de faucon. Chaque étape est documentée, chaque décision justifiée et chaque résultat traçable.",
  'استكشف البوابات': 'Découvrir les portails',
  'خارطة الميزات': 'Cartographie des fonctionnalités',
  'ما هو متاح اليوم… وما هو قيد التطوير':
    "Ce qui est disponible aujourd'hui… et ce qui est en cours de développement",
  'شفافية كاملة حول ميزات المنصة: كل ما هو جاهز ومفعّل تشغيلياً للاستخدام الآن، والمحاور المستقبلية لتوسيع نطاق الخدمة.':
    'Transparence totale sur les fonctionnalités de la plateforme : tout ce qui est prêt et opérationnel dès maintenant, et les axes futurs d’extension du service.',
  'الميزات المتاحة': 'Fonctionnalités disponibles',
  'مُفعّلة اليوم': "Opérationnelles aujourd'hui",
  'التصفح الموحد للصفقات العمومية:': 'Navigation unifiée des marchés publics :',
  'استعراض الإعلانات ودفاتر الشروط وتحميل الوثائق عبر بوابات موحدة.':
    'Consultation des avis et cahiers des charges et téléchargement des documents via des portails unifiés.',
  'إنشاء الحسابات المعتمدة:': 'Création de comptes certifiés :',
  'تسجيل المتعاملين والمصالح المتعاقدة وفق الملاحق الرسمية لوزارة المالية وقائمة البلديات الـ 69 ولاية.':
    'Inscription des opérateurs et des autorités contractantes conformément aux annexes officielles du ministère des Finances et à la liste des 69 wilayas.',
  'إيداع العروض والختم التشفيري:': 'Dépôt des offres et scellement cryptographique :',
  'تشفير العروض المالية (AES-256) والقفل الوقائي للوثائق الإدارية منتهية الصلاحية.':
    'Chiffrement des offres financières (AES-256) et verrou préventif des documents administratifs expirés.',
  'فتح الأظرفة العلني الرقمي:': 'Ouverture publique numérique des plis :',
  'غرف بث افتراضية فورية وتوثيق محضر جلسة الفتح (PV) وتوقيت كل ظرف بالثانية.':
    "Salles de diffusion virtuelles en direct, procès-verbal d'ouverture (PV) documenté et horodatage de chaque pli à la seconde.",
  'إدارة العقود وتتبع الإنجاز:': "Gestion des contrats et suivi de l'exécution :",
  'إصدار أوامر الخدمة (ODS)، متابعة مراحل التنفيذ، وحساب آجال التسليم وغرامات التأخير آلياً.':
    'Émission des ordres de service (ODS), suivi des étapes d’exécution et calcul automatique des délais de livraison et des pénalités de retard.',
  'المساعد القانوني الذكي (RAG):': 'Assistant juridique intelligent (RAG) :',
  'يجيب على أسئلة المتعاملين بناءً على نصوص القانون 23-12 والمرسوم 15-247 حصراً، مع ذكر رقم المادة والنص الحرفي (Zero Hallucination).':
    'Répond aux questions des opérateurs sur la base exclusive des textes de la loi 23-12 et du décret 15-247, en citant le numéro d’article et le texte littéral (zéro hallucination).',
  'وكيل تحليل الأسعار:': "Agent d'analyse des prix :",
  'يكشف العروض الشاذة (المنخفضة جداً أو المرتفعة جداً) ويوجه لجنة التقييم لطلب تبريرات الأسعار الأحادية.':
    "Détecte les offres anormales (trop basses ou trop élevées) et oriente la commission d'évaluation vers une demande de justification des prix unitaires.",
  'رادار الطعون:': 'Radar des recours :',
  'متابعة آلية لمهلة الطعون القانونية (10 أيام من إعلان الإسناد المؤقت) مع عدّاد تنازلي يتحدث لحظياً.':
    "Suivi automatique du délai légal de recours (10 jours à compter de l'attribution provisoire) avec un compte à rebours actualisé en temps réel.",
  'سجل التدقيق الجنائي:': "Journal d'audit forensique :",
  'توثيق كل حركة وإجراء ببصمة SHA-256 غير قابلة للتعديل أو الحذف لضمان الشفافية المطلقة.':
    'Documentation de chaque action et procédure par une empreinte SHA-256 inaltérable et non supprimable, garantissant une transparence absolue.',
  'التقارير السيادية الموحدة:': 'Rapports souverains unifiés :',
  'إصدار وتوليد التقارير الوطنية والقطاعية الرسمية بصيغة PDF بضغطة زر.':
    'Édition et génération de rapports nationaux et sectoriels officiels au format PDF en un clic.',
  'محرك كشف الشبهات الذكي:': 'Moteur intelligent de détection des suspicions :',
  'رصد شبهات تجزئة الصفقات، التواطؤ، المنافسة الصورية، واحتكار الإسناد.':
    "Détection des suspicions de fractionnement des marchés, de collusion, de concurrence fictive et de monopole d'attribution.",
  'المرصد الجغرافي والرقابي:': 'Observatoire géographique et de contrôle :',
  'خريطة حرارية تفاعلية لمراقبة تدفقات الصفقات والإنذار المبكر عبر 69 ولاية.':
    'Carte thermique interactive pour surveiller les flux de marchés et l’alerte précoce dans les 69 wilayas.',
  'التوفيق والبحث الذكي:': 'Appariement et recherche intelligente :',
  'اقتراح الفرص الأكثر ملاءمة للمتعاملين استناداً إلى النشاط والقدرة المالية والتوزيع الجغرافي.':
    "Proposition des opportunités les plus adaptées aux opérateurs selon leur activité, leur capacité financière et leur répartition géographique.",
  'الأرشيف الرقمي المؤمن:': 'Archive numérique sécurisée :',
  'حماية مستندات الصفقات بروابط مشفرة وتخزين آمن وموثق.':
    'Protection des documents des marchés par des liens chiffrés et un stockage sûr et documenté.',
  'قيد التطوير': 'En cours de développement',
  'قريبًا': 'Bientôt',
  'التكامل مع أنظمة الإدارات الحكومية الأخرى':
    'Intégration avec les autres systèmes des administrations publiques',
  'التوقيع الإلكتروني المعتمد': 'Signature électronique certifiée',
  'المنصة الوطنية الذكية للصفقات العمومية. تجمع الفاعلين، تُسرّع الإجراءات، وتُرسّخ الشفافية بمساعدة الذكاء الاصطناعي وتحت رقابة الإدارة المركزية.':
    "La plateforme nationale intelligente des marchés publics. Elle réunit les acteurs, accélère les procédures et ancre la transparence grâce à l'intelligence artificielle, sous le contrôle de l'administration centrale.",
  'تواصل': 'Contact',
  'الجزائر العاصمة': 'Alger',
  'الأحد — الخميس: 08:00 - 16:30': 'Dimanche — jeudi : 08h00 - 16h30',
  '© 2026 صفقات ذكية — جميع الحقوق محفوظة.': '© 2026 Safaqat Dzakia — Tous droits réservés.',
};
