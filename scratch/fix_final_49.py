with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Comments
content = content.replace("// 1. Tool: اشرح طريقة الإبرام", "// 1. Tool: Explain Procurement Method")
content = content.replace("// 2. Tool: ساعدني في اختيار القالب", "// 2. Tool: Help Select Template")
content = content.replace("// 3. Tool: استكمل المسودة من بيانات الصفقة", "// 3. Tool: Complete Draft from Deal Data")
content = content.replace("// 4. Tool: راجع المعلومات الناقصة (Audit Checklist)", "// 4. Tool: Review Missing Info (Audit Checklist)")
content = content.replace("TAB 1: بيانات الصفقة والاحتياجات (Deal Basics)", "TAB 1: Deal Basics & Needs")
content = content.replace("TAB 2: دفتر الشروط وسلسلة الإسناد (Cahier Specs & Sanad)", "TAB 2: Cahier Specs & Sanad")
content = content.replace("TAB 3: الوثائق والسندات والضمانات (Documents, Deeds & Sanad)", "TAB 3: Documents, Deeds & Sanad")
content = content.replace("{/* Operator Dynamic Documents Dossier (ملف وثائق المتعامل الاقتصادي) */}", "{/* Operator Dynamic Documents Dossier */}")

# 2. Position reference
content = content.replace("positionReference: 'الشروط المالية',", "positionReference: t('authority.workspace.sec_financial_terms'),")

# 3. Formatted budget
old_fb = "const formattedBudget = budget ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : t('authority.workspace.budget_as_approved');"
new_fb = "const formattedBudget = budget ? `${parseFloat(budget).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} ${t('common.dzd')}` : t('authority.workspace.budget_as_approved');"
content = content.replace(old_fb, new_fb)

# 4. Enriched general
old_eg = """const enrichedGeneral = `تحدد هذه الصفقة العمومية شروط وكيفيات تنفيذ العملية المعنونة: "${title.trim() || 'مشروع الصفقة'}" على مستوى ولاية: ${wilayaName}، لمدة إنجاز مقدرة بـ ${duration} وبغلاف مالي تقديري قدره ${formattedBudget} (TTC)، وذلك طبقاً لأحكام القانون رقم 23-12 المؤرخ في 5 أوت 2023 المحدد للقواعد العامة للصفقات العمومية والمرسوم الرئاسي رقم 15-247.\\n\\nطريقة الإبرام المعتمدة: ${METHOD_LABELS[procurementMethod].ar} (${FORM_LABELS[procurementForm].ar}).`;"""
new_eg = """const enrichedGeneral = t('authority.workspace.default_clause_general', {
      title: title.trim() || t('authority.workspace.default_deal_title'),
      wilaya: wilayaName,
      duration,
      budget: formattedBudget,
      method: lang === 'fr' ? (METHOD_LABELS[procurementMethod]?.fr || METHOD_LABELS[procurementMethod]?.ar) : METHOD_LABELS[procurementMethod]?.ar,
      form: lang === 'fr' ? (FORM_LABELS[procurementForm]?.fr || FORM_LABELS[procurementForm]?.ar) : FORM_LABELS[procurementForm]?.ar,
    });"""
content = content.replace(old_eg, new_eg)

# 5. Checklist items
old_c1 = "message: budget && parseFloat(budget) > 0 ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : t('authority.workspace.checklist_budget_unset'),"
new_c1 = "message: budget && parseFloat(budget) > 0 ? `${parseFloat(budget).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} ${t('common.dzd')}` : t('authority.workspace.checklist_budget_unset'),"
content = content.replace(old_c1, new_c1)

old_c2 = "message: boqTotal > 0 ? `${boqItems.length} بنود بمجموع ${boqTotal.toLocaleString('ar-DZ')} دج` : t('authority.workspace.checklist_boq_empty'),"
new_c2 = "message: boqTotal > 0 ? t('authority.workspace.checklist_boq_summary', { count: boqItems.length, total: boqTotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ') }) : t('authority.workspace.checklist_boq_empty'),"
content = content.replace(old_c2, new_c2)

old_c3 = "? `قالب: ${CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId)?.title || templateId}`"
new_c3 = "? `${t('authority.workspace.template_prefix')}: ${CAHIER_TEMPLATES_LIBRARY.find((t) => t.id === templateId)?.title || templateId}`"
content = content.replace(old_c3, new_c3)

old_c4 = "message: `${operatorDocuments.length} وثيقة مطلوبة مقسمة على الأظرفة الثلاثة.`,"
new_c4 = "message: t('authority.workspace.checklist_docs_msg', { count: operatorDocuments.length }),"
content = content.replace(old_c4, new_c4)

# 6. Toasts
old_t1 = "toast.success(`تم تحديث الميزانية التقديرية لتصبح: ${boqTotal.toLocaleString('ar-DZ')} دج (TTC).`);"
new_t1 = "toast.success(t('authority.workspace.toast_budget_updated_val', { amount: boqTotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ'), dzd: t('common.dzd') }));"
content = content.replace(old_t1, new_t1)

# 7. Summary proposal
old_sp = "`ملخص استشاري لملف الصفقة: ${title || deal?.title}. يهدف المشروع إلى تنفيذ الأعمال المحددة في نطاق الحاجة، ويتعين على المتنافسين استيفاء الشروط الإدارية والتقنية وإيداع العروض قبل انقضاء الأجل القانوني.`"
new_sp = "t('authority.workspace.summary_proposal_text', { title: title || deal?.title || '' })"
content = content.replace(old_sp, new_sp)

# 8. Proposal title
old_pt = "title: `اقتراح صياغة من قالب نموذجي: ${getSectionTitle(sectionKey)}`,"
new_pt = "title: t('authority.workspace.proposal_from_template_title', { section: getSectionTitle(sectionKey) }),"
content = content.replace(old_pt, new_pt)

# 9. Header stage badge
old_sb = "{deal?.stage_display || `المرحلة ${deal?.current_stage || 1}`}"
new_sb = "{deal?.stage_display || `${t('authority.workspace.stage_prefix')} ${deal?.current_stage || 1}`}"
content = content.replace(old_sb, new_sb)

# 10. Deal ref in contract tab
old_cr = 'الصفقة: <span className="font-mono font-bold text-navy-900">{contract.deal_reference || deal?.reference_number || \'—\'}</span>'
new_cr = '{t(\'authority.workspace.contract_deal_ref_label\')}: <span className="font-mono font-bold text-navy-900">{contract.deal_reference || deal?.reference_number || \'—\'}</span>'
content = content.replace(old_cr, new_cr)

# 11. Contract not generated text
old_cng = """<p className="text-xs text-gray-500 max-w-sm mt-1">
                  يتاح توليد العقد بعد اعتماد الإسناد وتحديد المتعامل الفائز. سيتم إنشاء
                  نسخة PDF رسمية وربطها بمراحل التنفيذ.
                </p>"""
new_cng = """<p className="text-xs text-gray-500 max-w-sm mt-1">
                  {t('authority.workspace.contract_not_generated_desc')}
                </p>"""
content = content.replace(old_cng, new_cng)

# 12. Open tender option
old_oto = '<option value="open_tender">طلب العروض (Appel d&apos;offres)</option>'
new_oto = '<option value="open_tender">{t(\'authority.workspace.opt_open_tender\')}</option>'
content = content.replace(old_oto, new_oto)

# 13. Justification description
old_jd = "وفقاً للقانون 23-12، يلتزم مسؤولو المصلحة بتدوين السند القانوني الصريح ومبررات اللجوء لهذا الإجراء في ملف الصفقة تمهيداً لعرضه على لجنة الصفقات المختصة."
new_jd = "{t('authority.workspace.justif_section_desc')}"
content = content.replace(old_jd, new_jd)

# 14. BOQ totals in alert & table
old_bq1 = "مجموع جدول الكميات الحالي يبلغ: {boqTotal.toLocaleString('ar-DZ')} دج (TTC)"
new_bq1 = "{t('authority.workspace.boq_total_current', { amount: boqTotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ'), dzd: t('common.dzd') })}"
content = content.replace(old_bq1, new_bq1)

old_bq2 = "الميزانية المسجلة حالياً: {budget ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : t('authority.workspace.boq_alert_unspecified')}."
new_bq2 = "{t('authority.workspace.boq_current_registered', { amount: budget ? `${parseFloat(budget).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} ${t('common.dzd')}` : t('authority.workspace.boq_alert_unspecified') })}"
content = content.replace(old_bq2, new_bq2)

old_st1 = "{subtotal.toLocaleString('ar-DZ')} دج"
new_st1 = "{subtotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} {t('common.dzd')}"
content = content.replace(old_st1, new_st1)

old_st2 = "{boqTotal.toLocaleString('ar-DZ')} دج"
new_st2 = "{boqTotal.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} {t('common.dzd')}"
content = content.replace(old_st2, new_st2)

# 15. Version badge
old_vb = "الإصدار {templateVersion}"
new_vb = "{t('authority.workspace.version_prefix', { version: templateVersion })}"
content = content.replace(old_vb, new_vb)

# 16. Procedural basis
old_pb = "السند الإجرائي: {METHOD_LABELS[procurementMethod].ar} — {FORM_LABELS[procurementForm].ar} ({NATURE_LABELS[procurementNature].ar})"
new_pb = "{t('authority.workspace.procedural_basis')}: {lang === 'fr' ? (METHOD_LABELS[procurementMethod]?.fr || METHOD_LABELS[procurementMethod]?.ar) : METHOD_LABELS[procurementMethod]?.ar} — {lang === 'fr' ? (FORM_LABELS[procurementForm]?.fr || FORM_LABELS[procurementForm]?.ar) : FORM_LABELS[procurementForm]?.ar} ({lang === 'fr' ? (NATURE_LABELS[procurementNature]?.fr || NATURE_LABELS[procurementNature]?.ar) : NATURE_LABELS[procurementNature]?.ar})"
content = content.replace(old_pb, new_pb)

# 17. Freeze badges
old_fbd1 = "بصمة التجميد: {frozenDigest}"
new_fbd1 = "{t('authority.workspace.badge_frozen_digest', { digest: frozenDigest })}"
content = content.replace(old_fbd1, new_fbd1)

old_fbd2 = "تاريخ الاعتماد: {new Date(frozenAt || '').toLocaleDateString('ar-DZ')}"
new_fbd2 = "{t('authority.workspace.badge_frozen_date', { date: new Date(frozenAt || '').toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ') })}"
content = content.replace(old_fbd2, new_fbd2)

# 18. Counts in tabs
old_tc1 = "<span>المتطلبات الإلزامية ({requirements.length})</span>"
new_tc1 = "<span>{t('authority.workspace.tab_reqs_count', { count: requirements.length })}</span>"
content = content.replace(old_tc1, new_tc1)

old_tc2 = "<span>سجل التعديلات ({clause.events.length})</span>"
new_tc2 = "<span>{t('authority.workspace.tab_audit_count', { count: clause.events.length })}</span>"
content = content.replace(old_tc2, new_tc2)

# 19. Operator docs count
old_odc = "{operatorDocuments.length} وثيقة مطلوبة"
new_odc = "{t('authority.workspace.operator_docs_count', { count: operatorDocuments.length })}"
content = content.replace(old_odc, new_odc)

# 20. Operator docs delete toasts
old_odt1 = "`لا يمكن حذف وثيقة «${doc.titleAr || doc.name}»؛ فهي مشترطة وجوباً بنص المادة 67 من القانون 23-12.`"
new_odt1 = "t('authority.workspace.cannot_delete_mandatory_doc', { name: doc.titleAr || doc.name })"
content = content.replace(old_odt1, new_odt1)

old_odt2 = "toast.info(`تم حذف الوثيقة التقديرية: ${doc.titleAr || doc.name}`);"
new_odt2 = "toast.info(t('authority.workspace.deleted_discretionary_doc', { name: doc.titleAr || doc.name }));"
content = content.replace(old_odt2, new_odt2)

# 21. Assistant Deal Title
old_adt = "الصفقة: {title || deal?.title || 'مسودة صفقة'}"
new_adt = "{t('authority.workspace.assistant_deal_title', { title: title || deal?.title || t('authority.workspace.default_deal_title') })}"
content = content.replace(old_adt, new_adt)

# 22. Statutory basis
old_asb = "<strong>السند التشريعي:</strong> القانون رقم 23-12 (المواد 29، 39، 40-49) والمرسوم الرئاسي رقم 15-247."
new_asb = "<strong>{t('authority.workspace.assistant_statutory_basis')}</strong>"
content = content.replace(old_asb, new_asb)

# 23. Nature of need
old_non = "<strong>طبيعة الحاجة:</strong> {NATURE_LABELS[procurementNature].ar}"
new_non = "<strong>{t('authority.workspace.nature_of_need')}:</strong> {lang === 'fr' ? (NATURE_LABELS[procurementNature]?.fr || NATURE_LABELS[procurementNature]?.ar) : NATURE_LABELS[procurementNature]?.ar}"
content = content.replace(old_non, new_non)

# 24. Template applied toast
old_tat = "toast.success(`تم تطبيق القالب النموذجي: ${t.title}`);"
new_tat = "toast.success(t('authority.workspace.template_applied_toast', { title: t.title }));"
content = content.replace(old_tat, new_tat)

# 25. Avg price
old_ap = "{priceEstimateResult.avg_price?.toLocaleString('ar-DZ')} دج"
new_ap = "{priceEstimateResult.avg_price?.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} {t('common.dzd')}"
content = content.replace(old_ap, new_ap)

# 26. Load template button
old_ltb = "تحميل قالب {getSectionTitle(activeSection) || 'القسم'}"
new_ltb = "{t('authority.workspace.tool_btn_load_template', { section: getSectionTitle(activeSection) || t('authority.workspace.default_section') })}"
content = content.replace(old_ltb, new_ltb)

# 27. Summarize tool desc
old_std = "يستدعي خدمة `/api/ai/summarize/` لاستخراج أهم المتطلبات الإلزامية في ملخص تنفيذي."
new_std = "{t('authority.workspace.tool_summary_desc')}"
content = content.replace(old_std, new_std)

# 28. Modal freeze desc
old_mfd = "تجميد دفتر الشروط يمنع أي تعديل لاحق على النصوص والبنود، ويولّد بصمة رقمية ملزمة للاعتماد تمهيداً لعرضه على لجنة الصفقات المختصة."
new_mfd = "{t('authority.workspace.modal_freeze_desc')}"
content = content.replace(old_mfd, new_mfd)

# 29. Modal change method desc & warning
old_mmd = "تغيير طريقة أو شكل الإبرام يؤثر مباشرة على الأساس القانوني، شروط المشاركة، وملف وثائق المتعامل الإلزامية."
new_mmd = "{t('authority.workspace.modal_change_method_desc')}"
content = content.replace(old_mmd, new_mmd)

old_mmw = "عند التأكيد، ستتم مواءمة قائمة وثائق المتعامل تلقائياً وفق الإجراء الجديد، وتنبيهك في حال استلزم الإجراء الجديد تسبيباً أو مبررات قانونية مسبقة."
new_mmw = "{t('authority.workspace.modal_change_method_warning')}"
content = content.replace(old_mmw, new_mmw)

# Modal current budget
old_mcb = "{budget ? `${parseFloat(budget).toLocaleString('ar-DZ')} دج` : t('authority.workspace.boq_alert_unspecified')}"
new_mcb = "{budget ? `${parseFloat(budget).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')} ${t('common.dzd')}` : t('authority.workspace.boq_alert_unspecified')}"
content = content.replace(old_mcb, new_mcb)

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied fix_final_49 successfully.")
