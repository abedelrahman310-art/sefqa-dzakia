# -*- coding: utf-8 -*-
ai_new_keys = {
    # AIChatAssistant
    "ai.prompt_late_deals": ("كم عدد الصفقات المتأخرة حالياً؟", "Combien de marchés sont actuellement en retard ?"),
    "ai.prompt_top_risks": ("ما هي أبرز المخاطر المرصودة في المنصة؟", "Quels sont les principaux risques détectés sur la plateforme ?"),
    "ai.prompt_oran_report": ("أعطني تقريراً عن ولاية وهران", "Donnez-moi un rapport sur la wilaya d'Oran"),
    "ai.prompt_collusion_suspicions": ("هل توجد شبهات تواطؤ بين متعاملين محددين؟", "Existe-t-il des soupçons de collusion entre des opérateurs précis ?"),
    "ai.chat_welcome_msg": (
        "مرحباً بك في المساعد الرقابي الذكي لمنصة صفقات ذكية. يمكنك سؤالي عن الصفقات، مؤشرات المخاطر، التنبيهات الإجرائية، أو التفسيرات المتعلقة بالمرسوم 15-247 والقانون 23-12.",
        "Bienvenue dans l'assistant de contrôle intelligent de la plateforme Safaqat Dhakia. Vous pouvez me poser des questions sur les marchés, les indicateurs de risque, les alertes de procédure ou les interprétations relatives au Décret 15-247 et à la Loi 23-12."
    ),
    "ai.source_deals_db": ("قواعد بيانات الصفقات الوطنية", "Bases de données nationales des marchés"),
    "ai.source_law_23_12": ("القانون 23-12", "Loi 23-12"),
    "ai.source_decree_15_247": ("المرسوم 15-247", "Décret 15-247"),
    "ai.chat_error_response": ("تعذر إتمام التحليل والاستجابة في الوقت الحالي. يرجى إعادة المحاولة لاحقاً.", "Impossible de finaliser l'analyse et de répondre pour le moment. Veuillez réessayer plus tard."),
    "ai.chat_new_conv_msg": ("تم بدء محادثة جديدة. يمكنك طرح أي استفسار رقابي أو إحصائي حول صفقات المنصة.", "Nouvelle conversation démarrée. Vous pouvez poser toute question de contrôle ou statistique sur les marchés."),
    "ai.chat_btn": ("اسأل AI", "Demander à l'IA"),
    "ai.chat_supervisory_title": ("المساعد الرقابي الذكي", "Assistant de contrôle intelligent"),
    "ai.chat_supervisory_subtitle": ("الإدارة المركزية — الرقابة الوطنية", "Administration Centrale — Contrôle National"),
    "ai.chat_new_conv": ("محادثة جديدة", "Nouvelle conversation"),
    "ai.chat_disclaimer": ("إجابات استشارية مؤتمتة — القرار النهائي للمفتش (قانون 23-12).", "Réponses consultatives automatisées — Décision finale réservée à l'inspecteur (Loi 23-12)."),
    "ai.chat_sources_label": ("المصادر المعتمدة:", "Sources certifiées :"),
    "ai.chat_analyzing": ("جاري التحليل والمطابقة الإجرائية...", "Analyse et vérification procédurale en cours..."),
    "ai.chat_input_placeholder": ("اسأل عن أي صفقة، مؤشر، أو إجراء...", "Posez une question sur un marché, un indicateur ou une procédure..."),

    # AIHealthBadge
    "ai.health_checking": ("فحص الذكاء الاصطناعي...", "Vérification de l'IA..."),
    "ai.health_engine": ("محرك AI", "Moteur IA"),

    # AIInsightsPanel
    "ai.insights_panel_title": ("التوصيات الذكية للرقابة الوطنية (AI Insights)", "Recommandations intelligentes pour le contrôle national (AI Insights)"),
    "ai.insights_advisory_note": ("توصيات استشارية فقط — القرار النهائي للمفتش البشري وفقاً للقانون 23-12.", "Recommandations consultatives uniquement — La décision finale appartient à l'inspecteur humain (Loi 23-12)."),
    "ai.refresh_title": ("تحديث البيانات", "Actualiser les données"),
    "ai.generating": ("جاري التحليل والتوليد...", "Génération et analyse en cours..."),
    "ai.generate_new": ("توليد توصيات جديدة", "Générer de nouvelles recommandations"),
    "ai.insights_empty_title": ("لا توجد توصيات نشطة في هذا المستوى", "Aucune recommandation active à ce niveau"),
    "ai.insights_empty_desc": ("مؤشرات المنصة تظهر التزاماً إجرائياً، أو تمت معالجة كافة التوصيات السابقة.", "Les indicateurs montrent une conformité procédurale ou toutes les recommandations antérieures ont été traitées."),
    "ai.run_new_scan": ("تشغيل فحص جديد", "Lancer une nouvelle analyse"),
    "ai.critical_recommendations": ("توصيات ذات خطورة حرجة ({count})", "Recommandations critiques ({count})"),
    "ai.high_recommendations": ("توصيات ذات أولوية عالية ({count})", "Recommandations à priorité élevée ({count})"),
    "ai.medium_recommendations": ("توصيات متوسطة ({count})", "Recommandations moyennes ({count})"),
    "ai.low_recommendations": ("توصيات منخفضة وإرشادية ({count})", "Recommandations faibles et indicatives ({count})"),

    # InsightCard
    "ai.cat_fraud_collusion": ("شبهة فساد وتواطؤ", "Soupçon de corruption et collusion"),
    "ai.cat_price_anomaly": ("شذوذ في الأسعار", "Anomalie tarifaire"),
    "ai.cat_procedural_delay": ("تأخير إجرائي", "Retard procédural"),
    "ai.cat_non_compliance": ("عدم امتثال نظامي", "Non-conformité réglementaire"),
    "ai.cat_suspicious_pattern": ("نمط تكرار مشبوه", "Schéma de répétition suspect"),
    "ai.cat_proactive_audit": ("توصية تدقيق استباقية", "Recommandation d'audit proactif"),
    "ai.time_few_minutes": ("منذ دقائق معدودة", "Il y a quelques minutes"),
    "ai.time_one_hour": ("منذ ساعة واحدة", "Il y a une heure"),
    "ai.time_two_hours": ("منذ ساعتين", "Il y a deux heures"),
    "ai.time_hours": ("منذ {count} ساعات", "Il y a {count} heures"),
    "ai.time_one_day": ("منذ يوم واحد", "Il y a un jour"),
    "ai.time_days": ("منذ {count} أيام", "Il y a {count} jours"),
    "ai.err_notes_min_length": ("يجب كتابة مبرر أو ملاحظات معالجة لا تقل عن 10 أحرف (إلزامي للتدقيق القانوني).", "La justification ou les notes de traitement doivent comporter au moins 10 caractères (obligatoire pour l'audit légal)."),
    "ai.advisory_legal_principle": ("مبدأ القانون 23-12: الذكاء الاصطناعي أداة مساعدة ورقابية استشارية ولا يتخذ قرارات تلقائية", "Principe de la Loi 23-12 : l'IA est un outil d'assistance et de contrôle consultatif sans décision automatisée."),
    "ai.advisory_badge": ("استشاري فقط", "Consultatif uniquement"),
    "ai.confidence_metric_title": ("مستوى الثقة الإحصائي للمؤشر", "Niveau de confiance statistique de l'indicateur"),
    "ai.proposed_action_title": ("🎯 الإجراء المقترح للمفتش:", "🎯 Action proposée pour l'inspecteur :"),
    "ai.deal_ref": ("صفقة", "Marché"),
    "ai.authority_ref": ("مصلحة", "Autorité"),
    "ai.operator_ref": ("متعامل", "Opérateur"),
    "ai.show_details_recommendations": ("عرض التفاصيل والتوصيات", "Afficher les détails et recommandations"),
    "ai.preview_deal": ("معاينة الصفقة", "Aperçu du marché"),
    "ai.resolve_modal_title": ("معالجة التوصية الرقابية وإغلاقها", "Traitement et clôture de la recommandation de contrôle"),
    "ai.recommendation_label": ("التوصية", "Recommandation"),
    "ai.audit_trail_mandatory": ("توثيق قانوني إلزامي (Audit Trail):", "Traçabilité légale obligatoire (Audit Trail) :"),
    "ai.audit_trail_notice": ("سيُسجَّل هذا الإجراء مع هويتك وتاريخه في سجل التدقيق الرقمي غير القابل للتعديل تطبيقاً للمرسوم 15-247 والقانون 23-12.", "Cette action sera consignée avec votre identité et horodatée dans le registre d'audit numérique immuable en application du Décret 15-247 et de la Loi 23-12."),
    "ai.human_notes_label": ("ملاحظات ومبررات المعالجة البشرية", "Notes et justifications du traitement humain"),
    "ai.notes_placeholder": ("اكتب الإجراء المتخذ (مثال: تم تدقيق الأسعار ومقارنتها مع الصفقات المماثلة وتبين مطابقتها للأسعار المرجعية...)", "Saisissez l'action prise (ex. : les prix ont été audités et comparés aux marchés similaires et s'avèrent conformes aux barèmes de référence...)"),
    "ai.min_chars_suffix": ("10 أحرف كحد أدنى", "10 caractères minimum"),
    "ai.confirm_resolution": ("تأكيد المعالجة وإغلاق التوصية", "Confirmer le traitement et clôturer la recommandation"),

    # OperatorRecommendationsCard
    "ai.update_company_profile": ("تحديث ملف المؤسسة", "Mettre à jour le profil de l'entreprise"),
    "ai.refresh_recommendations": ("تحديث التوصيات", "Actualiser les recommandations"),
    "ai.recommendations_periodic_update": ("يتم تحديث التوصيات دورياً بناءً على الصفقات المفتوحة حديثاً في القطاع", "Les recommandations sont actualisées régulièrement selon les marchés récemment ouverts dans le secteur"),

    # SmartKpiBadge
    "ai.smart_detection_advisory": ("رصد ذكي (استشاري)", "Détection intelligente (consultative)"),
    "ai.smart_detection_suffix": ("رصد AI", "Détection IA"),

    # SuspicionAlerts
    "ai.suspicion_bid_rigging": ("مؤشرات التواطؤ (Bid Rigging)", "Indicateurs d'entente illicite (Bid Rigging)"),
    "ai.suspicion_price_manipulation": ("التلاعب والأسعار غير الطبيعية", "Manipulation et prix anormaux"),
    "ai.suspicion_fictitious_bids": ("المنافسة الصورية والوهمية", "Offres fictives et de complaisance"),
    "ai.suspicion_conflict_interest": ("تنازع المصالح والصلات المتقاطعة", "Conflit d'intérêts et liens croisés"),
    "ai.suspicions_detected_title": ("الشبهات المكتشفة بالخوارزميات", "Soupçons détectés par les algorithmes"),
    "ai.suspicions_detected_desc": ("كشف الأنماط المشبوهة استناداً لبيانات العروض وتطابق الهويات.", "Détection des schémas suspects d'après les offres et concordances d'identité."),
    "ai.active_indicators": ("مؤشر نشط", "indicateur actif"),
    "ai.suspicions_disclaimer": ("مؤشرات احترازية استشارية تستوجب تحقيقاً تدقيقياً بشرياً وفقاً للقانون 23-12.", "Indicateurs préventifs consultatifs nécessitant un audit d'investigation humain conformément à la Loi 23-12."),
    "ai.no_suspicions_title": ("لا توجد مؤشرات شبهة مرصودة حالياً", "Aucun indicateur de soupçon détecté actuellement"),
    "ai.no_suspicions_desc": ("الفحص الدوري التلقائي لم يرصد تواطؤاً أو أسعاراً مشبوهة حتى الآن.", "L'analyse périodique automatique n'a décelé aucune entente ou prix suspect jusqu'à présent."),
    "ai.single_case": ("حالة", "cas"),
    "ai.multiple_cases": ("حالات", "cas"),
    "ai.view_details_count": ("عرض التفاصيل ({count})", "Voir les détails ({count})"),
    "ai.observed_suspicions": ("الشبهات المرصودة", "Soupçons observés"),
    "ai.statutory_reference_default": ("القانون 23-12 — مبدأ الشفافية والمنافسة الحرة", "Loi 23-12 — Principe de transparence et de libre concurrence"),
    "ai.severity_label": ("خطورة", "Gravité"),
    "ai.recommendation_prefix": ("التوصية", "Recommandation"),
    "ai.potential_violation": ("المخالفة المحتملة", "Infraction potentielle"),

    # useAI hooks
    "ai.toast_generated_success": ("تم توليد {count} توصية ذكية جديدة بنجاح", "{count} nouvelles recommandations générées avec succès"),
    "ai.toast_generated_error": ("تعذر توليد التوصيات في الوقت الحالي", "Impossible de générer les recommandations pour le moment"),
    "ai.toast_resolve_success": ("تم توثيق المعالجة وتحديث سجل التدقيق بنجاح", "Traitement consigné et registre d'audit mis à jour avec succès"),
    "ai.toast_resolve_error": ("تعذر حفظ معالجة التوصية", "Impossible d'enregistrer le traitement de la recommandation"),
}

print(f"Total new keys prepared: {len(ai_new_keys)}")
