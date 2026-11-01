import re

# AuthoritySessionControl.tsx
with open('client/src/features/opening/components/AuthoritySessionControl.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'<h3 className="text-base font-bold text-destructive">\s*تعذر تحميل بيانات جلسة فتح الأظرفة\s*</h3>', '<h3 className="text-base font-bold text-destructive">{t("opening.load_session_error")}</h3>', text)
text = re.sub(r'<p className="text-sm text-muted-foreground">\s*الجلسة المطلوبة غير موجودة أو انتهت صلاحية الوصول إليها\.\s*</p>', '<p className="text-sm text-muted-foreground">{t("opening.session_not_found")}</p>', text)
text = text.replace('فتح الأظرفة علنياً وتسجيل السعر المُعلن والتحفظات أمام الحضور', '{t("opening.deposited_offers_desc")}')
text = re.sub(r'(\d+)\s*دج', r'\1 {t("common.dzd")}', text)
text = text.replace('{Number(selectedOffer.proposed_price).toLocaleString("ar-DZ")} دج', '{Number(selectedOffer.proposed_price).toLocaleString(lang === "fr" ? "fr-DZ" : "ar-DZ")} {t("common.dzd")}')
text = text.replace('{Number(announcedPrice).toLocaleString("ar-DZ")} دج', '{Number(announcedPrice).toLocaleString(lang === "fr" ? "fr-DZ" : "ar-DZ")} {t("common.dzd")}')
text = re.sub(r'<p>\s*لا توجد[^\<]+عروض مودعة[^\<]+</p>', '<p>{t("opening.no_offers_yet")}</p>', text)
text = text.replace('تسجيل زمني لكافة العمليات والأظرفة المفتوحة', '{t("opening.records_timeline_desc")}')
text = text.replace('>مقبول نظامياً<', '>{t("opening.status_accepted")}<')
text = text.replace('>مرفوض / غير مستوف<', '>{t("opening.status_rejected")}<')
text = text.replace('تسجيل عملية فتح الظرف وإعلان السعر المالي أمام الحضور ولجنة فتح الأظرفة', '{t("opening.modal_open_desc")}')
text = text.replace('استيفاء الشروط الشكلية للظرف (قبول العرض نظامياً)', '{t("opening.formal_compliance_label")}')
text = text.replace('ملاحظات أو تحفظات الجلسة (اختياري)', '{t("opening.remarks_label")}')
text = text.replace('>إلغاء<', '>{t("common.cancel")}<')
text = re.sub(r'هل أنت متأكد من اختتام جلسة فتح الأظرفة[^\<]+البث المباشر رسمياً\.', '{t("opening.modal_end_desc")}', text)
text = text.replace('>متابعة الجلسة<', '>{t("opening.btn_continue_session")}<')

with open('client/src/features/opening/components/AuthoritySessionControl.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# AuthoritySessionManager.tsx
with open('client/src/features/opening/components/AuthoritySessionManager.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'إدارة جلسات فتح الأظرفة العلنية للصفقات[^\<]+وفق القانون 23-12\.', '{t("opening.manager_desc_extended")}', text)
text = re.sub(r'لم تتم برمجة أي جلسة فتح أظرفة بعد[^\<]+الصفقات المطروحة\.', '{t("opening.empty_manager_sessions")}', text)
text = text.replace('حدد الصفقة وموعد ومكان انعقاد جلسة فتح الأظرفة العلنية.', '{t("opening.modal_schedule_desc")}')
text = text.replace('>الصفقة المعنية *<', '>{t("opening.field_deal_id")}<')
text = text.replace('>تاريخ وساعة الجلسة *<', '>{t("opening.field_datetime")}<')
text = text.replace('>مكان انعقاد الجلسة *<', '>{t("opening.field_location")}<')
text = text.replace('>رابط البث المرئي المباشر (اختياري)<', '>{t("opening.field_stream_url")}<')
text = text.replace('>إلغاء<', '>{t("common.cancel")}<')

with open('client/src/features/opening/components/AuthoritySessionManager.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# OperatorSessionList.tsx
with open('client/src/features/opening/components/OperatorSessionList.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'متابعة جلسات فتح الأظرفة العلنية[^\<]+15-247 والقانون 23-12\.', '{t("opening.op_list_desc")}', text)
text = re.sub(r'ستظهر هنا جلسات فتح الأظرفة المبرمجة[^\<]+عروضك رسمياً\.', '{t("opening.op_empty_desc")}', text)

with open('client/src/features/opening/components/OperatorSessionList.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# OperatorSessionLive.tsx
with open('client/src/features/opening/components/OperatorSessionLive.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'قد تكون الجلسة غير موجودة أو أن حسابك لا يملك تصريح الحضور لهذه الصفقة\.', '{t("opening.op_details_unauthorized")}', text)
text = text.replace('>العودة لقائمة الجلسات<', '>{t("opening.op_back_to_list")}<')
text = text.replace('>مستوى تقدم فتح أظرفة العروض<', '>{t("opening.op_progress_title")}<')
text = text.replace('>لم يتم تسجيل أي ظرف مفتوح حتى الآن في هذه الجلسة.<', '>{t("opening.op_no_events_yet")}<')
text = text.replace('>عرضك المودع<', '>{t("opening.op_your_submitted_offer")}<')

with open('client/src/features/opening/components/OperatorSessionLive.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied fix_opening_last34 successfully.")
