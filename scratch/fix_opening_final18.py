# AuthoritySessionControl.tsx
with open('client/src/features/opening/components/AuthoritySessionControl.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('          تعذر تحميل بيانات جلسة فتح الأظرفة', '          {t("opening.load_session_error")}')
text = text.replace('                                  دج', '                                  {t("common.dzd")}')
text = text.replace('<p>لا توجد {t("opening.deposited_offers")} في قاعدة البيانات لهذه الصفقة بعد.</p>', '<p>{t("opening.no_offers_yet")}</p>')
text = text.replace('                              مقبول نظامياً', '                              {t("opening.status_accepted")}')
text = text.replace('                              مرفوض / غير مستوف', '                              {t("opening.status_rejected")}')
text = text.replace('                    دج', '                    {t("common.dzd")}')
text = text.replace('                  إلغاء', '                  {t("common.cancel")}')
text = text.replace('              متابعة الجلسة', '              {t("opening.btn_continue_session")}')

with open('client/src/features/opening/components/AuthoritySessionControl.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# AuthoritySessionManager.tsx
with open('client/src/features/opening/components/AuthoritySessionManager.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('                  الصفقة المعنية *', '                  {t("opening.field_deal_id")}')
text = text.replace('                  تاريخ وساعة الجلسة *', '                  {t("opening.field_datetime")}')
text = text.replace('                  مكان انعقاد الجلسة *', '                  {t("opening.field_location")}')
text = text.replace('                  رابط البث المرئي المباشر (اختياري)', '                  {t("opening.field_stream_url")}')
text = text.replace('                إلغاء', '                {t("common.cancel")}')

with open('client/src/features/opening/components/AuthoritySessionManager.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# OperatorSessionLive.tsx
with open('client/src/features/opening/components/OperatorSessionLive.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('          العودة لقائمة الجلسات', '          {t("opening.op_back_to_list")}')
text = text.replace('                مستوى تقدم فتح أظرفة العروض', '                {t("opening.op_progress_title")}')
text = text.replace('            لم يتم تسجيل أي ظرف مفتوح حتى الآن في هذه الجلسة.', '            {t("opening.op_no_events_yet")}')
text = text.replace('                            عرضك المودع', '                            {t("opening.op_your_submitted_offer")}')

with open('client/src/features/opening/components/OperatorSessionLive.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied fix_opening_final18 successfully.")
