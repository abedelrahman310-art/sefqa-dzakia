import re

# 1. AuthoritySessionControl.tsx
with open('client/src/features/opening/components/AuthoritySessionControl.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const { t, dir } = useI18n()", "const { t, lang, dir } = useI18n()")
text = text.replace('{/* Badge قانون 18-07 */}', '{/* Badge Law 18-07 */}')

text = text.replace('alert("تعذر تصدير محضر الجلسة PDF. يرجى التأكد من استقرار الاتصال بالخادم.");', 'alert(t("opening.pdf_export_error"));')
text = text.replace('>تعذر تحميل بيانات جلسة فتح الأظرفة<', '>{t("opening.load_session_error")}<')
text = text.replace('>الجلسة المطلوبة غير موجودة أو انتهت صلاحية الوصول إليها.<', '>{t("opening.session_not_found")}<')
text = text.replace('>العودة لقائمة الجلسات<', '>{t("opening.back_to_sessions")}<')
text = text.replace('>جلسات الفتح<', '>{t("opening.sessions_breadcrumb")}<')
text = text.replace('{session.location || "المقر الرئيسي"}', '{session.location || t("opening.location_hq")}')
text = text.replace('>رابط البث الحي<', '>{t("opening.live_stream_link")}<')
text = text.replace('تاريخ الجلسة:{" "}', '{t("opening.session_date_label")}{" "}')
text = text.replace('بدأت:{" "}', '{t("opening.session_started_label")}{" "}')
text = text.replace('انتهت:{" "}', '{t("opening.session_ended_label")}{" "}')

text = text.replace('title="تصدير وتحميل محضر وقائع جلسة فتح الأظرفة بصيغة PDF قابلة للطباعة والأرشفة"', 'title={t("opening.download_minutes_tooltip")}')
text = text.replace('<span>{isDownloadingPdf ? "جاري التوليد..." : "تحميل المحضر (PDF)"}</span>', '<span>{isDownloadingPdf ? t("opening.generating") : t("opening.download_minutes_pdf")}</span>')
text = text.replace('{startMutation.isPending ? "جاري البدء..." : t("opening.start")}', '{startMutation.isPending ? t("opening.starting") : t("opening.start")}')
text = text.replace('من إجمالي{" "}', '{t("opening.of_total")}{" "}')
text = text.replace('عروض مودعة', '{t("opening.deposited_offers")}')
text = text.replace('>قائمة العروض المودعة للإجراء<', '>{t("opening.deposited_offers_title")}<')
text = text.replace('>فتح الأظرفة علنياً وتسجيل السعر المُعلن والتحفظات أمام الحضور<', '>{t("opening.deposited_offers_desc")}<')
text = text.replace('{dealOffers?.length ?? session.total_offers} عروض', '{t("opening.offers_count", { count: dealOffers?.length ?? session.total_offers })}')
text = text.replace('{offer.operator_name || offer.operator || "متعامل اقتصادي"}', '{offer.operator_name || offer.operator || t("opening.default_operator")}')
text = text.replace('>تم الفتح<', '>{t("opening.status_opened")}<')
text = text.replace('السعر المقترح في العرض:{" "}', '{t("opening.proposed_price_label")}{" "}')
text = text.replace('المُعلن رسمياً:{" "}', '{t("opening.announced_officially_label")}{" "}')
text = text.replace('? "يجب بدء الجلسة أولاً لفتح الأظرفة"', '? t("opening.must_start_first_tooltip")')
text = text.replace('<p>لا توجد عروض مودعة في قاعدة البيانات لهذه الصفقة بعد.</p>', '<p>{t("opening.no_offers_yet")}</p>')
text = text.replace('>محضر وقائع الجلسة العلنية<', '>{t("opening.minutes_records_title")}<')
text = text.replace('{session.events.length} وقائع', '{t("opening.events_count", { count: session.events.length })}')
text = text.replace('title="تصدير المحضر بصيغة PDF"', 'title={t("opening.export_minutes_pdf_tooltip")}')
text = text.replace('>تصدير PDF<', '>{t("opening.export_pdf")}<')
text = text.replace('>تسجيل زمني لكافة العمليات والأظرفة المفتوحة<', '>{t("opening.records_timeline_desc")}<')
text = text.replace('"عرض متعهد"}', 't("opening.bidder_offer")}')
text = text.replace('{Number(event.announced_price).toLocaleString("ar-DZ")} دج', '{Number(event.announced_price).toLocaleString(lang === "fr" ? "fr-DZ" : "ar-DZ")} {t("common.dzd")}')
text = text.replace('>مقبول نظامياً<', '>{t("opening.status_accepted")}<')
text = text.replace('>مرفوض / غير مستوف<', '>{t("opening.status_rejected")}<')
text = text.replace('>فتح العرض وإعلان السعر<', '>{t("opening.modal_open_title")}<')
text = text.replace('>تسجيل عملية فتح الظرف وإعلان السعر المالي أمام الحضور ولجنة فتح الأظرفة<', '>{t("opening.modal_open_desc")}<')
text = text.replace('<span className="text-muted-foreground block">المتعامل الاقتصادي:</span>', '<span className="text-muted-foreground block">{t("opening.modal_operator_label")}</span>')
text = text.replace('{selectedOffer.operator_name || selectedOffer.operator || "متعامل اقتصادي"}', '{selectedOffer.operator_name || selectedOffer.operator || t("opening.default_operator")}')
text = text.replace('{t("opening.announced_price")} (دج) *', '{t("opening.announced_price")} ({t("common.dzd")}) *')
text = text.replace('>استيفاء الشروط الشكلية للظرف (قبول العرض نظامياً)<', '>{t("opening.formal_compliance_label")}<')
text = text.replace('>ملاحظات أو تحفظات الجلسة (اختياري)<', '>{t("opening.remarks_label")}<')
text = text.replace('placeholder="أي ملاحظات أبدتها اللجنة أو المتعهد أثناء فتح الظرف..."', 'placeholder={t("opening.remarks_placeholder")}')
text = text.replace('>إلغاء<', '>{t("common.cancel")}<')
text = text.replace('{openOfferMutation.isPending ? "جاري التسجيل..." : "تأكيد وإعلان السعر"}', '{openOfferMutation.isPending ? t("opening.saving") : t("opening.btn_confirm_open")}')
text = text.replace('>تأكيد إنهاء واختتام الجلسة<', '>{t("opening.modal_end_title")}<')
text = text.replace("""هل أنت متأكد من اختتام جلسة فتح الأظرفة؟ سيتم تثبيت كافة الوقائع المسجلة وإغلاق
                البث المباشر رسمياً.""", '{t("opening.modal_end_desc")}')
text = text.replace('>متابعة الجلسة<', '>{t("opening.btn_continue_session")}<')
text = text.replace('{endMutation.isPending ? "جاري الاختتام..." : "تأكيد إنهاء الجلسة"}', '{endMutation.isPending ? t("opening.ending") : t("opening.btn_confirm_end")}')

with open('client/src/features/opening/components/AuthoritySessionControl.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. AuthoritySessionManager.tsx
with open('client/src/features/opening/components/AuthoritySessionManager.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('setLocationText("قاعة الاجتماعات الرسمية - الطابق الأول");', 'setLocationText(t("opening.default_location_meeting_room"));')
text = text.replace('>جلسات فتح الأظرفة العلنية<', '>{t("opening.manager_title")}<')
text = text.replace("""إدارة جلسات فتح الأظرفة العلنية للصفقات، استدعاء المتعهدين، وتسجيل وقائع وقرارات
            اللجان وفق القانون 23-12.""", '{t("opening.manager_desc_extended")}')
text = text.replace('>برمجة جلسة فتح<', '>{t("opening.btn_new_session")}<')
text = text.replace('>كافة الحالات<', '>{t("opening.filter_all")}<')
text = text.replace('>جارية الآن<', '>{t("opening.filter_live")}<')
text = text.replace('>مبرمجة<', '>{t("opening.filter_scheduled")}<')
text = text.replace('>منتهية<', '>{t("opening.filter_ended")}<')
text = text.replace('placeholder="بحث برقم الصفقة أو العنوان..."', 'placeholder={t("opening.search_placeholder")}')
text = text.replace('>تعذر تحميل جلسات فتح الأظرفة<', '>{t("opening.load_list_error")}<')
text = text.replace("""لم تتم برمجة أي جلسة فتح أظرفة بعد. يمكنك برمجة جلسة فتح جديدة وربطها بإحدى الصف
              قات المودعة عروضها.""", '{t("opening.empty_manager_sessions")}')
text = text.replace("""لم تتم برمجة أي جلسة فتح أظرفة بعد. يمكنك برمجة جلسة فتح جديدة وربطها بإحدى الصفقات المودعة عروضها.""", '{t("opening.empty_manager_sessions")}')
text = text.replace('>الصفقة<', '>{t("opening.table_deal_ref")}<')
text = text.replace('>تاريخ وموعد الجلسة<', '>{t("opening.table_scheduled_at")}<')
text = text.replace('>الحالة<', '>{t("opening.table_status")}<')
text = text.replace('>تقدم الفتح<', '>{t("opening.table_progress")}<')
text = text.replace('>إجراءات<', '>{t("opening.table_actions")}<')
text = text.replace('>إدارة الجلسة / لوحة التحكم<', '>{t("opening.btn_manage_session_panel")}<')
text = text.replace('>برمجة جلسة فتح أظرفة جديدة<', '>{t("opening.modal_schedule_title")}<')
text = text.replace('>حدد الصفقة وموعد ومكان انعقاد جلسة فتح الأظرفة العلنية.<', '>{t("opening.modal_schedule_desc")}<')
text = text.replace('>الصفقة المعنية *<', '>{t("opening.field_deal_id")}<')
text = text.replace('<option value="">-- اختر صفقة من القائمة --</option>', '<option value="">{t("opening.opt_select_deal")}</option>')
text = text.replace('placeholder="معرّف الصفقة (UUID)"', 'placeholder={t("opening.placeholder_deal_uuid")}')
text = text.replace('>تاريخ وساعة الجلسة *<', '>{t("opening.field_datetime")}<')
text = text.replace('>مكان انعقاد الجلسة *<', '>{t("opening.field_location")}<')
text = text.replace('placeholder="مثال: قاعة الاجتماعات الكبرى - مقر الولاية"', 'placeholder={t("opening.placeholder_location_example")}')
text = text.replace('>رابط البث المرئي المباشر (اختياري)<', '>{t("opening.field_stream_url")}<')
text = text.replace('>إلغاء<', '>{t("common.cancel")}<')
text = text.replace('{scheduleMutation.isPending ? "جاري البرمجة..." : "تأكيد وبرمجة الجلسة"}', '{scheduleMutation.isPending ? t("opening.scheduling") : t("opening.btn_confirm_schedule")}')

with open('client/src/features/opening/components/AuthoritySessionManager.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 3. OperatorSessionList.tsx
with open('client/src/features/opening/components/OperatorSessionList.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('>جلسات علنية<', '>{t("opening.op_badge_public")}<')
text = text.replace("""متابعة جلسات فتح الأظرفة العلنية الخاصة بالصفقات المشارك فيها وفق المرسوم الرئاسي
          15-247 والقانون 23-12.""", '{t("opening.op_list_desc")}')
text = text.replace("""متابعة جلسات فتح الأظرفة العلنية الخاصة بالصفقات المشارك فيها وفق المرسوم الرئاسي 15-247 والقانون 23-12.""", '{t("opening.op_list_desc")}')
text = text.replace('>تعذر تحميل قائمة جلسات فتح الأظرفة. يرجى إعادة المحاولة لاحقاً.<', '>{t("opening.op_load_error")}<')
text = text.replace("""ستظهر هنا جلسات فتح الأظرفة المبرمجة والجارية حالياً للصفقات التي أودعت فيها
              عروضك رسمياً.""", '{t("opening.op_empty_desc")}')
text = text.replace("""ستظهر هنا جلسات فتح الأظرفة المبرمجة والجارية حالياً للصفقات التي أودعت فيها عروضك رسمياً.""", '{t("opening.op_empty_desc")}')
text = text.replace('{session.opened_count} من {session.total_offers} ({progress}%)', '{t("opening.of_offers_count", { opened: session.opened_count, total: session.total_offers, pct: progress })}')
text = text.replace('>متابعة البث المباشر<', '>{t("opening.op_btn_watch_live")}<')
text = text.replace('>عرض التسجيل والنتائج<', '>{t("opening.op_btn_view_results")}<')
text = text.replace('>تفاصيل الموعد<', '>{t("opening.op_btn_details")}<')

with open('client/src/features/opening/components/OperatorSessionList.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 4. OperatorSessionLive.tsx
with open('client/src/features/opening/components/OperatorSessionLive.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('alert("تعذر تنزيل محضر الجلسة PDF. يرجى إعادة المحاولة لاحقاً.");', 'alert(t("opening.op_download_pdf_error"));')
text = text.replace('<h3 className="text-base font-bold">تعذر فتح تفاصيل الجلسة</h3>', '<h3 className="text-base font-bold">{t("opening.op_load_details_error")}</h3>')
text = text.replace('>قد تكون الجلسة غير موجودة أو أن حسابك لا يملك تصريح الحضور لهذه الصفقة.<', '>{t("opening.op_details_unauthorized")}<')
text = text.replace('>العودة لقائمة الجلسات<', '>{t("opening.op_back_to_list")}<')
text = text.replace('>العودة لجلسات الفتح<', '>{t("opening.op_back_breadcrumb")}<')
text = text.replace('<span>{isDownloadingPdf ? "جاري التوليد..." : "تحميل المحضر (PDF)"}</span>', '<span>{isDownloadingPdf ? t("opening.generating") : t("opening.download_minutes_pdf")}</span>')
text = text.replace('>رابط البث المرئي المباشر<', '>{t("opening.op_stream_link")}<')
text = text.replace('الموعد: {new Date(session.scheduled_at).toLocaleString("ar-DZ")}', '{t("opening.op_scheduled_date", { date: new Date(session.scheduled_at).toLocaleString(lang === "fr" ? "fr-DZ" : "ar-DZ") })}')
text = text.replace('المصلحة المتعاقدة: {session.authority_name}', '{t("opening.op_authority_name", { name: session.authority_name })}')
text = text.replace('>مستوى تقدم فتح أظرفة العروض<', '>{t("opening.op_progress_title")}<')
text = text.replace('تحديث تلقائي كل 3 ثوان ⟳', '{t("opening.op_auto_refresh")}')
text = text.replace("""تم تسجيل حضورك الافتراضي في جلسة فتح الأظرفة. سيتم بث مبالغ العروض المعلنة وقرارات القبول المبدئي تباعاً بمجرد افتتاح الجلسة من قبل المصلحة المتعاقدة.""", '{t("opening.op_attendance_confirmed")}')
text = text.replace('>وقائع فتح الأظرفة المُعلنة<', '>{t("opening.op_announced_events_title")}<')
text = text.replace("""يتم إعلان مبالغ العروض علناً وفق المادة 72 من المرسوم الرئاسي 15-247 مع حجب الهويات التجارية للمنافسين احتراماً للقانون 18-07.""", '{t("opening.op_legal_privacy_notice")}')
text = text.replace('{session.events?.length || 0} أحداث مسجلة', '{t("opening.op_events_registered", { count: session.events?.length || 0 })}')
text = text.replace('>لم يتم تسجيل أي ظرف مفتوح حتى الآن في هذه الجلسة.<', '>{t("opening.op_no_events_yet")}<')
text = text.replace('? `${t("opening.your_offer")} (المتعامل الاقتصادي الحالي)`', '? t("opening.op_your_offer_full", { label: t("opening.your_offer") })')
text = text.replace('>عرضك المودع<', '>{t("opening.op_your_submitted_offer")}<')
text = text.replace('>مقبول مبدئياً<', '>{t("opening.op_status_accepted_preliminary")}<')
text = text.replace('>مرفوض لعدم المطابقة<', '>{t("opening.op_status_rejected_noncompliant")}<')
text = text.replace('? `${Number(event.announced_price).toLocaleString("ar-DZ")} دج`', '? `${Number(event.announced_price).toLocaleString(lang === "fr" ? "fr-DZ" : "ar-DZ")} ${t("common.dzd")}`')

with open('client/src/features/opening/components/OperatorSessionLive.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied transformations to opening components successfully.")
