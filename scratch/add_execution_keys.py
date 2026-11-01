import json

exec_ar = {
    'authority.execution.status_pending': 'قيد الانتظار',
    'authority.execution.status_in_progress': 'قيد التنفيذ',
    'authority.execution.status_completed': 'مكتملة ومستلمة',
    'authority.execution.status_delayed': 'متأخرة عن الأجل',
    'authority.execution.status_unspecified': 'غير محددة',
    'authority.execution.load_milestones_error': 'تعذر تحميل مراحل تنفيذ الصفقة. يرجى المحاولة مجدداً.',
    'authority.execution.err_invalid_pct': 'يرجى إدخال نسبة إنجاز صحيحة بين 0 و100.',
    'authority.execution.err_desc_required': 'يرجى كتابة بيان الأعمال المنجزة قبل رفع التقرير.',
    'authority.execution.report_uploaded_success': 'تم رفع تقرير الإنجاز بنجاح.',
    'authority.execution.report_uploaded_error': 'تعذر رفع تقرير الإنجاز. يرجى المحاولة مجدداً.',
    'authority.execution.card_title': 'مراحل تنفيذ الصفقة',
    'authority.execution.card_desc': 'متابعة نسب الإنجاز وتقارير المراحل',
    'authority.execution.for_deal_ref': 'للصفقة {{ref}}',
    'authority.execution.total_progress': 'التقدم الإجمالي · {{completed}} من {{total}} مرحلة مكتملة',
    'authority.execution.total_progress_aria': 'التقدم الإجمالي لمراحل التنفيذ',
    'authority.execution.milestones_count': '{{count}} مرحلة',
    'authority.execution.loading_aria': 'جارٍ تحميل مراحل التنفيذ',
    'authority.execution.empty_title': 'لم تُسجَّل مراحل تنفيذ بعد',
    'authority.execution.empty_desc_operator': 'ستظهر هنا المراحل التي تعدها المصلحة المتعاقدة لمتابعة الإنجاز.',
    'authority.execution.empty_desc_authority': 'ستظهر هنا مراحل التنفيذ المسجلة لهذه الصفقة.',
    'authority.execution.timeline_aria': 'الجدول الزمني لمراحل التنفيذ',
    'authority.execution.milestone_num': 'المرحلة {{num}}',
    'authority.execution.due_date_label': 'الاستحقاق: {{date}}',
    'authority.execution.completion_date_label': 'الإنجاز: {{date}}',
    'authority.execution.progress_pct_label': 'نسبة التقدم',
    'authority.execution.progress_aria': 'نسبة تقدم {{title}}',
    'authority.execution.reports_title': 'تقارير الإنجاز المرفوعة ({{count}})',
    'authority.execution.no_reports_yet': 'لم يُرفع أي تقرير إنجاز لهذه المرحلة بعد.',
    'authority.execution.default_operator_name': 'المتعامل الاقتصادي',
    'authority.execution.view_attachment': 'عرض الملف المرفق',
    'authority.execution.upload_report_title': 'رفع تقرير إنجاز لهذه المرحلة',
    'authority.execution.form_progress_pct': 'نسبة الإنجاز (%)',
    'authority.execution.form_file_label': 'ملف التقرير أو محضر المعاينة (اختياري)',
    'authority.execution.form_desc_label': 'بيان الأعمال المنجزة والملاحظات الميدانية',
    'authority.execution.form_desc_placeholder': 'اذكر الأعمال المنجزة فعلياً، نسب التقدم، وأي ملاحظات أو تحفظات...',
    'authority.execution.btn_uploading': 'جاري رفع التقرير...',
    'authority.execution.btn_upload': 'رفع تقرير الإنجاز',
}

exec_fr = {
    'authority.execution.status_pending': 'En attente',
    'authority.execution.status_in_progress': 'En cours d\'exécution',
    'authority.execution.status_completed': 'Achevée et réceptionnée',
    'authority.execution.status_delayed': 'En retard',
    'authority.execution.status_unspecified': 'Non définie',
    'authority.execution.load_milestones_error': 'Impossible de charger les étapes d\'exécution du marché. Veuillez réessayer.',
    'authority.execution.err_invalid_pct': 'Veuillez saisir un taux d\'avancement valide entre 0 et 100.',
    'authority.execution.err_desc_required': 'Veuillez décrire les prestations réalisées avant de soumettre le rapport.',
    'authority.execution.report_uploaded_success': 'Rapport d\'avancement téléversé avec succès.',
    'authority.execution.report_uploaded_error': 'Échec du téléversement du rapport d\'avancement. Veuillez réessayer.',
    'authority.execution.card_title': 'Étapes d\'exécution du marché',
    'authority.execution.card_desc': 'Suivi des taux d\'avancement et des rapports d\'étapes',
    'authority.execution.for_deal_ref': 'du marché {{ref}}',
    'authority.execution.total_progress': 'Avancement global · {{completed}} sur {{total}} étape(s) achevée(s)',
    'authority.execution.total_progress_aria': 'Avancement global des étapes d\'exécution',
    'authority.execution.milestones_count': '{{count}} étape(s)',
    'authority.execution.loading_aria': 'Chargement des étapes d\'exécution en cours',
    'authority.execution.empty_title': 'Aucune étape d\'exécution enregistrée pour le moment',
    'authority.execution.empty_desc_operator': 'Les jalons établis par le service contractant s\'afficheront ici pour le suivi de l\'exécution.',
    'authority.execution.empty_desc_authority': 'Les étapes d\'exécution enregistrées pour ce marché s\'afficheront ici.',
    'authority.execution.timeline_aria': 'Calendrier des étapes d\'exécution',
    'authority.execution.milestone_num': 'Étape {{num}}',
    'authority.execution.due_date_label': 'Échéance : {{date}}',
    'authority.execution.completion_date_label': 'Achèvement : {{date}}',
    'authority.execution.progress_pct_label': 'Taux d\'avancement',
    'authority.execution.progress_aria': 'Taux d\'avancement de {{title}}',
    'authority.execution.reports_title': 'Rapports d\'avancement déposés ({{count}})',
    'authority.execution.no_reports_yet': 'Aucun rapport d\'avancement déposé pour cette étape.',
    'authority.execution.default_operator_name': 'Opérateur économique',
    'authority.execution.view_attachment': 'Consulter le fichier joint',
    'authority.execution.upload_report_title': 'Déposer un rapport d\'avancement pour cette étape',
    'authority.execution.form_progress_pct': 'Taux d\'avancement (%)',
    'authority.execution.form_file_label': 'Fichier du rapport ou PV de constat (optionnel)',
    'authority.execution.form_desc_label': 'Description des travaux réalisés et observations de terrain',
    'authority.execution.form_desc_placeholder': 'Précisez les travaux réellement exécutés, l\'avancement et toute observation...',
    'authority.execution.btn_uploading': 'Téléversement du rapport en cours...',
    'authority.execution.btn_upload': 'Déposer le rapport d\'avancement',
}

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar_data = json.load(f)
with open('client/src/locales/fr.json', 'r', encoding='utf-8') as f:
    fr_data = json.load(f)

for k, v in exec_ar.items():
    ar_data[k] = v
for k, v in exec_fr.items():
    fr_data[k] = v

with open('client/src/locales/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar_data, f, ensure_ascii=False, indent=2)
with open('client/src/locales/fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr_data, f, ensure_ascii=False, indent=2)

print(f"Added {len(exec_ar)} execution keys to locales successfully.")
