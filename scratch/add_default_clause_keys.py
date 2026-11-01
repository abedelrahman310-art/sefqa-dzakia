import json

ar_add = {
    'authority.wizard.default_duration': '06 أشهر',
    'authority.wizard.default_boq_name': 'بند أولي يحدد حسب موضوع الصفقة',
    'authority.wizard.default_boq_unit': 'وحدة',
    'authority.wizard.default_clause_general': 'تحدد هذه الصفقة الشروط الإدارية والتعاقدية المطبقة لإبرام وتنفيذ العملية وفق القانون 23-12.',
    'authority.wizard.default_clause_rules': 'تقديم ملف الترشح والعرض الإداري المنصوص عليه بالمادة 67 من القانون 23-12 شاملاً التصريح بالترشح والنزاهة.',
    'authority.wizard.default_clause_tech_details': 'المواصفات الفنية التفصيلية للأشغال أو الخدمات المطلوبة.',
    'authority.wizard.default_clause_warranty': 'الضمان التعاقدي وفق الأحكام القانونية والتنظيمية.',
    'authority.wizard.default_clause_fin_terms': 'شروط الدفع والتسديد والضمانات البنكية المعتمدة.',
    'authority.wizard.default_clause_scoring': 'معايير التقييم الموضوعية لاختيار العرض الأفضل اقتصادياً.',
    'authority.wizard.default_doc_candidacy': 'التصريح بالترشح (الاستمارة الموحدة)',
    'authority.wizard.default_doc_integrity': 'التصريح بالنزاهة (الاستمارة الموحدة)',
    'authority.wizard.default_doc_financial': 'رسالة التعهد والعرض المالي',
    'authority.wizard.default_doc_basis': 'المادة 67 من القانون 23-12',
    'authority.wizard.default_doc_discretionary_basis': 'متطلب تقديري خاص بالمصلحة المتعاقدة',
    'authority.wizard.default_compliance_ref': 'القانون 23-12 المؤرخ في 5 أوت 2023 والمتعلق بالقواعد العامة للصفقات العمومية',
    'authority.wizard.default_compliance_disclaimer': 'هذا التحليل استرشادي تقني مؤتمت، وتبقى السلطة التقديرية الحصرية لمسؤولي المصلحة المتعاقدة ولجنة الصفقات.',
    'authority.wizard.default_compliance_rule': 'المادة 67 - وثائق ملف الترشح',
    'authority.wizard.default_compliance_msg': 'تم التحقق من إدراج التصريح بالنزاهة والتصريح بالترشح ضمن الملف الإداري الإلزامي.',
    'authority.wizard.default_compliance_rec': 'التأكد من اعتماد النماذج الرسمية الصادرة عن وزارة المالية.'
}

fr_add = {
    'authority.wizard.default_duration': '06 mois',
    'authority.wizard.default_boq_name': 'Poste initial à définir selon l\'objet du marché',
    'authority.wizard.default_boq_unit': 'Unité',
    'authority.wizard.default_clause_general': 'Le présent marché fixe les conditions administratives et contractuelles régissant l\'opération selon la loi 23-12.',
    'authority.wizard.default_clause_rules': 'Présentation du dossier de candidature et offre administrative prévus par l\'article 67 de la loi 23-12, y compris déclarations de candidature et probité.',
    'authority.wizard.default_clause_tech_details': 'Spécifications techniques détaillées des travaux ou prestations requises.',
    'authority.wizard.default_clause_warranty': 'Garantie contractuelle conformément aux dispositions législatives et réglementaires en vigueur.',
    'authority.wizard.default_clause_fin_terms': 'Modalités de paiement, de règlement et garanties bancaires agréées.',
    'authority.wizard.default_clause_scoring': 'Critères d\'évaluation objectifs pour retenir l\'offre économiquement la plus avantageuse.',
    'authority.wizard.default_doc_candidacy': 'Déclaration de candidature (formulaire unifié)',
    'authority.wizard.default_doc_integrity': 'Déclaration de probité (formulaire unifié)',
    'authority.wizard.default_doc_financial': 'Lettre de soumission et offre financière',
    'authority.wizard.default_doc_basis': 'Article 67 de la loi 23-12',
    'authority.wizard.default_doc_discretionary_basis': 'Exigence discrétionnaire du service contractant',
    'authority.wizard.default_compliance_ref': 'Loi n° 23-12 du 5 août 2023 fixant les règles générales relatives aux marchés publics',
    'authority.wizard.default_compliance_disclaimer': 'Cette analyse est un audit technique consultatif ; le pouvoir d\'appréciation exclusif relève de la commission des marchés.',
    'authority.wizard.default_compliance_rule': 'Article 67 - Pièces du dossier de candidature',
    'authority.wizard.default_compliance_msg': 'Vérification effectuée de l\'inclusion de la déclaration de probité et de candidature.',
    'authority.wizard.default_compliance_rec': 'S\'assurer de la conformité aux modèles officiels arrêtés par le Ministère des Finances.'
}

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)
with open('client/src/locales/fr.json', 'r', encoding='utf-8') as f:
    fr = json.load(f)

ar.update(ar_add)
fr.update(fr_add)

with open('client/src/locales/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar, f, ensure_ascii=False, indent=2)
with open('client/src/locales/fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr, f, ensure_ascii=False, indent=2)

print(f'Total AR: {len(ar)}, Total FR: {len(fr)}')
assert len(ar) == len(fr), 'Mismatch AR and FR count!'
assert set(ar.keys()) == set(fr.keys()), 'Key set parity mismatch!'
print('PARITY CONFIRMED 100%')
