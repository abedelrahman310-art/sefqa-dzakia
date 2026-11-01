import json

extra_keys_ar = {
    'objections.detail_no_decision_reason': 'لا يوجد تبرير مرفق.',
    'objections.detail_timeline_title': 'السجل الزمني للأحداث الإجرائية:',
    'objections.detail_no_timeline_events': 'لا توجد أحداث مسجلة بعد.',
    'objections.detail_sha_fingerprint_notice': 'بصمة النزاهة الرقمية (SHA-256) — القانون 18-07:',
    'objections.submit_type_committee_desc': 'أمام لجنة الصفقات العمومية للمصلحة المتعاقدة',
    'objections.submit_type_tribunal_desc': 'أمام المحكمة الإدارية المختصة إقليمياً',
    'objections.submit_clear_facts_note': 'يجب أن يتضمن الطعن وقائع واضحة قابلة للتدقيق.',
}

extra_keys_fr = {
    'objections.detail_no_decision_reason': 'Aucune motivation fournie.',
    'objections.detail_timeline_title': 'Chronologie des événements de procédure :',
    'objections.detail_no_timeline_events': 'Aucun événement consigné pour le moment.',
    'objections.detail_sha_fingerprint_notice': 'Empreinte numérique d\'intégrité (SHA-256) — Loi 18-07 :',
    'objections.submit_type_committee_desc': 'Devant la commission des marchés publics du service contractant',
    'objections.submit_type_tribunal_desc': 'Devant le tribunal administratif territorialement compétent',
    'objections.submit_clear_facts_note': 'Le recours doit énoncer des faits précis et vérifiables.',
}

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)
with open('client/src/locales/fr.json', 'r', encoding='utf-8') as f:
    fr = json.load(f)

for k, v in extra_keys_ar.items():
    ar[k] = v
for k, v in extra_keys_fr.items():
    fr[k] = v

with open('client/src/locales/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar, f, ensure_ascii=False, indent=2)
with open('client/src/locales/fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr, f, ensure_ascii=False, indent=2)

print(f"Added {len(extra_keys_ar)} keys to locales.")
