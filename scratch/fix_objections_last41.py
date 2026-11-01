import re

# 1. AuthorityObjectionsView.tsx
with open('client/src/features/objections/components/AuthorityObjectionsView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('>بدء الدراسة<', '>{t("objections.auth_btn_start_review")}<')
text = text.replace('>البت في الطعن<', '>{t("objections.auth_btn_issue_decision")}<')
text = text.replace('>عرض<', '>{t("objections.auth_btn_view_details")}<')

with open('client/src/features/objections/components/AuthorityObjectionsView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. ObjectionDecisionModal.tsx
with open('client/src/features/objections/components/ObjectionDecisionModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("'اعتماد القرار رسمياً'", "t('objections.decision_btn_submit')")

with open('client/src/features/objections/components/ObjectionDecisionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 3. ObjectionDetailModal.tsx
with open('client/src/features/objections/components/ObjectionDetailModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<span className="text-slate-500">نوع الطعن: </span>', '<span className="text-slate-500">{t("objections.detail_type_label")} </span>')
text = text.replace('<span className="text-slate-500">المُطعِن: </span>', '<span className="text-slate-500">{t("objections.detail_objector_label")} </span>')
text = text.replace('{/* Grounds / الأسباب */}', '{/* Grounds */}')
text = text.replace('<h4 className="text-xs font-bold text-slate-700 mb-2">أسباب وأوجه الطعن القانونية:</h4>', '<h4 className="text-xs font-bold text-slate-700 mb-2">{t("objections.detail_ground_label")}</h4>')
text = text.replace('<h4 className="text-xs font-bold text-slate-700 mb-1.5">بيان تفاصيل وأسباب الطعن:</h4>', '<h4 className="text-xs font-bold text-slate-700 mb-1.5">{t("objections.detail_arguments_title")}</h4>')
text = text.replace(
    "{t(\"objections.detail_decision_title\")} {objection.decision === 'accepted' ? 'قبول الطعن وإلغاء الإسناد المؤقت' : 'رفض الطعن وتثبيت الإسناد'}",
    "{t(\"objections.detail_decision_title\")} {objection.decision === 'accepted' ? t('objections.decision_accept_title') : t('objections.decision_reject_title')}"
)
text = text.replace("{objection.decision_reason || 'لا يوجد تبرير مرفق.'}", "{objection.decision_reason || t('objections.detail_no_decision_reason')}")
text = text.replace("تاريخ صدور القرار: {new Date(objection.review_ended_at).toLocaleString('ar-DZ')}", "{t('objections.detail_decision_date')} {new Date(objection.review_ended_at).toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ')}")
text = text.replace('{/* Timeline / السجل الزمني */}', '{/* Timeline */}')
text = text.replace('<span>السجل الزمني للأحداث الإجرائية:</span>', '<span>{t("objections.detail_timeline_title")}</span>')
text = text.replace("<span>{item.actor_name || 'النظام'}</span>", "<span>{item.actor_name || t('common.system')}</span>")
text = text.replace('<div className="text-slate-400 text-xs">لا توجد أحداث مسجلة بعد.</div>', '<div className="text-slate-400 text-xs">{t("objections.detail_no_timeline_events")}</div>')
text = text.replace('<div className="text-[11px] text-slate-500">بصمة النزاهة الرقمية (SHA-256) — القانون 18-07:</div>', '<div className="text-[11px] text-slate-500">{t("objections.detail_sha_fingerprint_notice")}</div>')
text = text.replace("<span className=\"ms-1\">{copied ? 'تم النسخ' : 'نسخ'}</span>", "<span className=\"ms-1\">{copied ? t('common.copied') : t('common.copy')}</span>")
text = text.replace('>سحب الطعن<', '>{t("objections.op_btn_withdraw")}<')
text = text.replace('>إغلاق<', '>{t("objections.detail_btn_close")}<')

with open('client/src/features/objections/components/ObjectionDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 4. ObjectionSubmissionModal.tsx
with open('client/src/features/objections/components/ObjectionSubmissionModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('المادة 72 من القانون 23-12: يجب إيداع الطعن خلال مهلة 10 أيام من تاريخ الإعلان، مع وجوب تقديم عرض مسبق في الصفقة.', '{t("objections.submit_modal_desc")}')
text = text.replace('الصفقة المعنية بالطعن:', '{t("objections.submit_deal_label")}')
text = text.replace('لم يتم العثور على صفقات نشطة في مرحلة الإسناد المؤقت.', '{t("objections.submit_no_deals")}')
text = text.replace('<Label className="text-xs font-bold text-slate-700 mb-2 block">نوع الطعن:</Label>', '<Label className="text-xs font-bold text-slate-700 mb-2 block">{t("objections.submit_type_label")}</Label>')
text = text.replace("? 'أمام لجنة الصفقات العمومية للمصلحة المتعاقدة'", "? t('objections.submit_type_committee_desc')")
text = text.replace(": 'أمام المحكمة الإدارية المختصة إقليمياً'}", ": t('objections.submit_type_tribunal_desc')}")
text = text.replace('أسباب وأوجه الطعن القانونية (اختر ما ينطبق):', '{t("objections.submit_grounds_label")}')
text = text.replace('شرح وتفاصيل أسباب الطعن والمآخذ الموضوعية:', '{t("objections.submit_desc_label")}')
text = text.replace('placeholder="بيّن بالتفصيل النقاط القانونية والتقنية أو المالية محل الاعتراض ومطابقتها لدفتر الشروط..."', 'placeholder={t("objections.submit_desc_placeholder")}')
text = text.replace('<span>يجب أن يتضمن الطعن وقائع واضحة قابلة للتدقيق.</span>', '<span>{t("objections.submit_clear_facts_note")}</span>')
text = text.replace('{description.trim().length}/20 حرفاً', '{description.trim().length}/20 {t("objections.characters_count")}')
text = text.replace('>إلغاء<', '>{t("common.cancel")}<')
text = text.replace('جاري الإيداع والتوثيق...', '{t("objections.submit_btn_uploading")}')
text = text.replace('إيداع الطعن رسمياً', '{t("objections.submit_btn_confirm")}')

with open('client/src/features/objections/components/ObjectionSubmissionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 5. OperatorObjectionsView.tsx
with open('client/src/features/objections/components/OperatorObjectionsView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'يحق لكل عارض يرى مساساً بحقوقه[^\<]+أمام لجنة الصفقات خلال أجل 10 أيام من نشر الإسناد\.', '{t("objections.op_page_desc")}', text)
text = re.sub(r'الطعن <span className="op-mono font-bold">\{nextObjection\.reference\}</span>[^\<]+آخر أجل: \{formatDeadline\(nextObjection\.deadline_at\)\}', '{t("objections.op_countdown_sub", { ref: nextObjection.reference, date: formatDeadline(nextObjection.deadline_at) })}', text)
text = re.sub(r'تنبيه: بقي[^\<]+الطعن قبل انتهاء المهلة\.', '{t("objections.op_urgent_warning")}', text)
text = text.replace('<th>المهلة {t("objections.op_remaining_label")}ة</th>', '<th>{t("objections.op_table_deadline")}</th>')

with open('client/src/features/objections/components/OperatorObjectionsView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied fix_objections_last41 successfully.")
