import json

# Define the new keys in AR and FR
new_keys_ar = {
    # Sources and Requirements
    'authority.workspace.source_law_23_12_5_27': 'القانون 23-12 (المادتان 5 و27)',
    'authority.workspace.source_law_23_12_67': 'القانون 23-12 (المادة 67: ملف الترشح والنزاهة)',
    'authority.workspace.source_ianor': 'المواصفات التقنية والمقاييس الوطنية (IANOR)',
    'authority.workspace.source_decree_15_247_125': 'المرسوم الرئاسي 15-247 (المادة 125: التأمينات والضمانات)',
    'authority.workspace.source_law_23_12_criteria': 'القانون 23-12 (معايير الاختيار الموضوعية)',
    'authority.workspace.pos_admin_dossier': 'ملف الترشح الإداري',
    'authority.workspace.req_declaration_candidacy_integrity': 'تقديم التصريح بالترشح والتصريح بالنزاهة مُمضيين ومؤرخين من صاحب العرض.',
    'authority.workspace.req_guarantee_bank': 'تقديم كفالة التعهد أو حسن التنفيذ من بنك جزائري معتمد عند الاقتضاء.',
    
    # Draft generation & checklist
    'authority.workspace.draft_complete_title': 'استكمال صياغة مسودة دفتر الشروط من بيانات الصفقة',
    'authority.workspace.draft_complete_desc': 'صياغة مستندة إلى بيانات عنوان الصفقة والولاية والمدة والميزانية وطريقة الإبرام وفق أحكام القانون 23-12.',
    'authority.workspace.checklist_title_ok': 'العنوان محدد وواضح.',
    'authority.workspace.checklist_title_empty': 'عنوان الصفقة فارغ أو قصير جداً.',
    'authority.workspace.checklist_justif_name': 'أسانيد وتبرير الإجراء',
    'authority.workspace.checklist_justif_not_required': 'غير مطلوبة للشكل المفتوح العام.',
    'authority.workspace.checklist_justif_recorded': 'تم تدوين السند القانوني والمبررات.',
    'authority.workspace.checklist_justif_required': 'يتطلب هذا الإجراء تسبيب مبرراته وسنده القانوني وجوباً.',
    'authority.workspace.checklist_template_name': 'قالب دفتر الشروط المعتمد',
    'authority.workspace.checklist_template_not_linked': 'لم يتم ربط قالب نموذجي مراجع.',
    'authority.workspace.checklist_docs_msg': '{{count}} وثيقة مطلوبة مقسمة على الأظرفة الثلاثة.',
    'authority.workspace.checklist_clauses_name': 'بنود دفتر الشروط الخمسة',
    'authority.workspace.checklist_clauses_complete': 'جميع البنود محررة ومكتملة.',
    'authority.workspace.checklist_clauses_partial': 'بعض البنود تحتوي على نصوص افتراضية موجزة.',
    
    # Auditing and proposals
    'authority.workspace.audit_clause_edited_by_authority': 'تعديل صياغة البند بواسطة المصلحة المتعاقدة',
    'authority.workspace.summary_proposal_text': 'ملخص استشاري لملف الصفقة: {{title}}. يهدف المشروع إلى تنفيذ الأعمال المحددة في نطاق الحاجة، ويتعين على المتنافسين استيفاء الشروط الإدارية والتقنية وإيداع العروض قبل انقضاء الأجل القانوني.',
    'authority.workspace.compliance_integrity_msg': 'تم التحقق من إدراج التصريح بالنزاهة والترشح ضمن الملف الإداري الإلزامي.',
    'authority.workspace.compliance_integrity_rec': 'اعتماد النماذج الوزارية الصادرة عن وزارة المالية.',
    'authority.workspace.proposal_from_template_title': 'اقتراح صياغة من قالب نموذجي: {{section}}',
    'authority.workspace.proposal_from_template_desc': 'اقتراح مستند إلى دفاتر الشروط النموذجية المعتمدة وفق القانون 23-12. (قالب محلي غير مولد بنموذج لغوي).',
    'authority.workspace.reason_applied_template': 'تطبيق صياغة من قالب نموذجي معتمد',
    'authority.workspace.header_unified_desc': 'ملف الصفقة الموحد: إدارة البيانات، جدول الكميات، بنود دفتر الشروط وسلسلة الإسناد، والوثائق والسندات.',
    
    # Units and statutory
    'authority.workspace.unit_sqm': 'م²',
    'authority.workspace.unit_cum': 'م³',
    'authority.workspace.statutory_ref_estimated': 'دفتر الشروط (تقديري)',
    'authority.workspace.template_prefix': 'قالب',
    'authority.workspace.procedural_basis': 'السند الإجرائي',
    'authority.workspace.nature_of_need': 'طبيعة الحاجة',

    # Assistant method explanations
    'authority.workspace.method_exp_open': 'طلب العروض المفتوح هو الإجراء المبدئي العام لضمان أوسع منافسة وتكافؤ فرص. لا يستلزم تبريراً استثنائياً، ويتطلب النشر الإلزامي في BOMOP ويوميتين وطنيتين.',
    'authority.workspace.method_exp_open_min': 'يشترط قدرات دنيا تقنية ومالية موضوعية معلنة مسبقاً في دفتر الشروط (المادة 41). يُفحص ظرف الترشح قبل فتح العروض التقنية والمالية.',
    'authority.workspace.method_exp_restricted': 'طلب عروض محدود (المادة 42) يقتصر على المتعهدين المؤهلين مسبقاً. يستوجب تبرير أسباب حصر المنافسة وربطها بالتعقيد التقني للعملية.',
    'authority.workspace.method_exp_contest': 'المسابقة (المادة 43 من القانون 23-12 والمادة 44 من المرسوم 15-247) شكل خاص من طلب العروض يُخصص للدراسات المعمارية والمشاريع الفكرية والتهيئة العمرانية.',
    'authority.workspace.method_exp_direct_neg': 'الإجراء التفاوضي المباشر (المادة 48) استثنائي ومقيد بحالات حصرية: الاحتكار التقني، الاستعجال الملح غير المتوقع، أو الأمن والدفاع الوطني. يستلزم تقريراً معللاً وسنداً قانونياً مسبقاً.',
    'authority.workspace.method_exp_after_consult_neg': 'الإجراء التفاوضي بعد الاستشارة (المادتان 46 و47) يُلجأ إليه بعد إعلان عدم جدوى طلب العروض أو في الحالات المحددة صراحة في القانون.',
    'authority.workspace.legal_ref_art_48': 'المادة 48 من القانون رقم 23-12 المؤرخ في 5 أوت 2023',
    'authority.workspace.legal_ref_art_41_42': 'المادتان 41 و42 من القانون رقم 23-12',
}

new_keys_fr = {
    # Sources and Requirements
    'authority.workspace.source_law_23_12_5_27': 'Loi 23-12 (Articles 5 et 27)',
    'authority.workspace.source_law_23_12_67': 'Loi 23-12 (Article 67 : Dossier de candidature et probité)',
    'authority.workspace.source_ianor': 'Spécifications techniques et normes nationales (IANOR)',
    'authority.workspace.source_decree_15_247_125': 'Décret présidentiel 15-247 (Article 125 : Assurances et garanties)',
    'authority.workspace.source_law_23_12_criteria': 'Loi 23-12 (Critères de sélection objectifs)',
    'authority.workspace.pos_admin_dossier': 'Dossier de candidature administratif',
    'authority.workspace.req_declaration_candidacy_integrity': 'Présentation de la déclaration de candidature et de probité signées et datées par le soumissionnaire.',
    'authority.workspace.req_guarantee_bank': 'Fourniture de la caution de soumission ou de bonne exécution d\'une banque algérienne agréée le cas échéant.',
    
    # Draft generation & checklist
    'authority.workspace.draft_complete_title': 'Finalisation du projet de cahier des charges d\'après les données du marché',
    'authority.workspace.draft_complete_desc': 'Rédaction fondée sur l\'intitulé, la wilaya, le délai, le budget et le mode de passation selon la loi 23-12.',
    'authority.workspace.checklist_title_ok': 'Intitulé précis et clair.',
    'authority.workspace.checklist_title_empty': 'Intitulé du marché vide ou trop court.',
    'authority.workspace.checklist_justif_name': 'Fondements et justification de la procédure',
    'authority.workspace.checklist_justif_not_required': 'Non requise pour la forme ouverte générale.',
    'authority.workspace.checklist_justif_recorded': 'Base juridique et motifs dûment consignés.',
    'authority.workspace.checklist_justif_required': 'Cette procédure requiert obligatoirement une motivation préalable et sa base légale.',
    'authority.workspace.checklist_template_name': 'Modèle de cahier des charges agréé',
    'authority.workspace.checklist_template_not_linked': 'Aucun modèle type révisé associé.',
    'authority.workspace.checklist_docs_msg': '{{count}} document(s) requis réparti(s) sur les trois plis.',
    'authority.workspace.checklist_clauses_name': 'Les cinq clauses du cahier des charges',
    'authority.workspace.checklist_clauses_complete': 'Toutes les clauses sont rédigées et complètes.',
    'authority.workspace.checklist_clauses_partial': 'Certaines clauses comportent des rédactions provisoires sommaires.',
    
    # Auditing and proposals
    'authority.workspace.audit_clause_edited_by_authority': 'Modification de la clause par le service contractant',
    'authority.workspace.summary_proposal_text': 'Résumé consultatif du dossier du marché : {{title}}. Le projet vise l\'exécution des prestations définies dans le besoin, et les candidats doivent remplir les conditions administratives et techniques et déposer leurs offres dans le délai légal.',
    'authority.workspace.compliance_integrity_msg': 'Inclusion de la déclaration de probité et de candidature vérifiée dans le dossier administratif obligatoire.',
    'authority.workspace.compliance_integrity_rec': 'Adoption des modèles ministériels émis par le Ministère des Finances.',
    'authority.workspace.proposal_from_template_title': 'Proposition de rédaction issue d\'un modèle type : {{section}}',
    'authority.workspace.proposal_from_template_desc': 'Proposition basée sur les cahiers des charges types agréés selon la loi 23-12 (modèle local non issu d\'une IA).',
    'authority.workspace.reason_applied_template': 'Application de la rédaction d\'un modèle type agréé',
    'authority.workspace.header_unified_desc': 'Dossier unifié du marché : gestion des données, bordereau des prix, clauses et chaîne de traçabilité, pièces et garanties.',
    
    # Units and statutory
    'authority.workspace.unit_sqm': 'm²',
    'authority.workspace.unit_cum': 'm³',
    'authority.workspace.statutory_ref_estimated': 'Cahier des charges (estimatif)',
    'authority.workspace.template_prefix': 'Modèle',
    'authority.workspace.procedural_basis': 'Base procédurale',
    'authority.workspace.nature_of_need': 'Nature du besoin',

    # Assistant method explanations
    'authority.workspace.method_exp_open': 'L\'appel d\'offres ouvert est la procédure de principe garantissant la plus large concurrence et l\'égalité des chances. Il ne requiert pas de justification exceptionnelle et impose la publication au BOMOP et dans deux quotidiens nationaux.',
    'authority.workspace.method_exp_open_min': 'Exige des capacités minimales techniques et financières objectives annoncées préalablement dans le cahier des charges (art. 41). Le pli de candidature est examiné avant l\'ouverture des offres techniques et financières.',
    'authority.workspace.method_exp_restricted': 'L\'appel d\'offres restreint (art. 42) s\'adresse aux soumissionnaires présélectionnés. Il nécessite de justifier les motifs de restriction liés à la complexité technique de l\'opération.',
    'authority.workspace.method_exp_contest': 'Le concours (art. 43 de la loi 23-12 et art. 44 du décret 15-247) est une modalité particulière consacrée aux études architecturales, projets intellectuels et aménagement urbain.',
    'authority.workspace.method_exp_direct_neg': 'La procédure négociée directe (art. 48) est exceptionnelle et strictement limitée : monopole technique, urgence impérieuse imprévisible, ou défense et sécurité nationale. Exige un rapport motivé préalable.',
    'authority.workspace.method_exp_after_consult_neg': 'La procédure négociée après consultation (art. 46 et 47) intervient après déclaration d\'infructuosité de l\'appel d\'offres ou dans les cas expressément définis par la loi.',
    'authority.workspace.legal_ref_art_48': 'Article 48 de la loi n° 23-12 du 5 août 2023',
    'authority.workspace.legal_ref_art_41_42': 'Articles 41 et 42 de la loi n° 23-12',
}

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

with open('client/src/locales/fr.json', 'r', encoding='utf-8') as f:
    fr = json.load(f)

for k, v in new_keys_ar.items():
    ar[k] = v

for k, v in new_keys_fr.items():
    fr[k] = v

with open('client/src/locales/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar, f, ensure_ascii=False, indent=2)

with open('client/src/locales/fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr, f, ensure_ascii=False, indent=2)

print(f"Added {len(new_keys_ar)} keys to both locales successfully.")
