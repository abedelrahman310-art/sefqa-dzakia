import json

extra_opening_ar = {
    'opening.modal_end_title': 'تأكيد إنهاء واختتام الجلسة',
    'opening.modal_end_desc': 'هل أنت متأكد من اختتام جلسة فتح الأظرفة؟ سيتم تثبيت كافة الوقائع المسجلة وإغلاق البث المباشر رسمياً.',
    'opening.btn_continue_session': 'متابعة الجلسة',
    'opening.btn_confirm_end': 'تأكيد إنهاء الجلسة',
    'opening.ending': 'جاري الاختتام...',
    'opening.default_location_meeting_room': 'قاعة الاجتماعات الرسمية - الطابق الأول',
    'opening.manager_desc_extended': 'إدارة جلسات فتح الأظرفة العلنية للصفقات، استدعاء المتعهدين، وتسجيل وقائع وقرارات اللجان وفق القانون 23-12.',
    'opening.empty_manager_sessions': 'لم تتم برمجة أي جلسة فتح أظرفة بعد. يمكنك برمجة جلسة فتح جديدة وربطها بإحدى الصفقات المودعة عروضها.',
    'opening.btn_manage_session_panel': 'إدارة الجلسة / لوحة التحكم',
    'opening.modal_schedule_desc': 'حدد الصفقة وموعد ومكان انعقاد جلسة فتح الأظرفة العلنية.',
    'opening.opt_select_deal': '-- اختر صفقة من القائمة --',
    'opening.placeholder_deal_uuid': 'معرّف الصفقة (UUID)',
    'opening.placeholder_location_example': 'مثال: قاعة الاجتماعات الكبرى - مقر الولاية',
}

extra_opening_fr = {
    'opening.modal_end_title': 'Confirmation de clôture de la séance',
    'opening.modal_end_desc': 'Êtes-vous sûr de vouloir clôturer la séance ? Tous les événements consignés seront figés et la retransmission sera officiellement fermée.',
    'opening.btn_continue_session': 'Poursuivre la séance',
    'opening.btn_confirm_end': 'Confirmer la clôture de la séance',
    'opening.ending': 'Clôture en cours...',
    'opening.default_location_meeting_room': 'Salle des réunions officielles - 1er étage',
    'opening.manager_desc_extended': 'Gestion des séances publiques d\'ouverture des plis, convocation des soumissionnaires et enregistrement des procès-verbaux (Loi 23-12).',
    'opening.empty_manager_sessions': 'Aucune séance d\'ouverture n\'est encore programmée. Vous pouvez en programmer une nouvelle pour un marché ouvert.',
    'opening.btn_manage_session_panel': 'Gérer la séance / Panneau de contrôle',
    'opening.modal_schedule_desc': 'Indiquez le marché, la date, l\'heure et le lieu de la séance publique d\'ouverture.',
    'opening.opt_select_deal': '-- Sélectionner un marché dans la liste --',
    'opening.placeholder_deal_uuid': 'Identifiant du marché (UUID)',
    'opening.placeholder_location_example': 'Exemple : Grande salle des délibérations - Siège de la wilaya',
}

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar_data = json.load(f)
with open('client/src/locales/fr.json', 'r', encoding='utf-8') as f:
    fr_data = json.load(f)

for k, v in extra_opening_ar.items():
    ar_data[k] = v
for k, v in extra_opening_fr.items():
    fr_data[k] = v

with open('client/src/locales/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar_data, f, ensure_ascii=False, indent=2)
with open('client/src/locales/fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr_data, f, ensure_ascii=False, indent=2)

print(f"Added {len(extra_opening_ar)} extra opening keys to locales successfully.")
