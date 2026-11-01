import re

# 1. AuthorityObjectionsView.tsx
with open('client/src/features/objections/components/AuthorityObjectionsView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('إدارة الطعون ونزاعات الإسناد المؤقت', '{t("objections.auth_page_title")}')
text = text.replace('تحديث السجل', '{t("objections.auth_btn_refresh")}')
text = text.replace('الأثر الواقف للطعن والمهل القانونية (المادة 72 من القانون 23-12):', '{t("objections.auth_suspensive_title")}')
text = text.replace('تجمّد القرارات النهائية للإسناد تلقائياً فور تسجيل الطعن خلال أجل الـ 10 أيام من تاريخ إعلان المنح المؤقت.', '{t("objections.auth_suspensive_p1")}')
text = text.replace('تتولى لجنة الصفقات المختصة فحص أسباب الطعن وإصدار قرار معلل بقبول الطعن أو رفضه وتوثيق النتائج ببصمة رقمية في سجل التدقيق غير القابل للتعديل.', '{t("objections.auth_suspensive_p2")}')
text = text.replace('إجمالي الطعون الواردة', '{t("objections.auth_stat_total")}')
text = text.replace('مسجلة على صفقات المصلحة', '{t("objections.auth_stat_total_sub")}')
text = text.replace('طعون جديدة (بحاجة لمعالجة)', '{t("objections.auth_stat_new")}')
text = text.replace('تتطلب إحالة للدراسة', '{t("objections.auth_stat_new_sub")}')
text = text.replace('قيد الفحص والمداولة', '{t("objections.auth_stat_under_review")}')
text = text.replace('أمام لجنة فحص الصفقات', '{t("objections.auth_stat_under_review_sub")}')
text = text.replace('طعون مفصول فيها', '{t("objections.auth_stat_resolved")}')
text = text.replace('قرارات مبررة وموثقة', '{t("objections.auth_stat_resolved_sub")}')
text = text.replace('placeholder="بحث بالمرجع، عنوان الصفقة، أو الطاعن..."', 'placeholder={t("objections.auth_search_placeholder")}')

text = text.replace("{ id: 'all', label: 'الكل' },", "{ id: 'all', label: t('objections.filter_all_label') },")
text = text.replace("{ id: 'submitted', label: 'مُودع' },", "{ id: 'submitted', label: t('objections.filter_submitted_label') },")
text = text.replace("{ id: 'under_review', label: 'قيد الدراسة' },", "{ id: 'under_review', label: t('objections.filter_under_review_label') },")
text = text.replace("{ id: 'accepted', label: 'مقبول' },", "{ id: 'accepted', label: t('objections.filter_accepted_label') },")
text = text.replace("{ id: 'rejected', label: 'مرفوض' },", "{ id: 'rejected', label: t('objections.filter_rejected_label') },")

text = text.replace('جاري جلب سجل الطعون الواردة...', '{t("objections.auth_loading")}')
text = text.replace('لا توجد طعون مطابقة', '{t("objections.auth_empty_filtered")}')
text = text.replace("? 'لا توجد نتائج تطابق معايير البحث والفلترة المحددة.'", "? t('objections.auth_empty_filtered_desc')")
text = text.replace(": 'لم يرد أي طعن على الصفقات التابعة لمصلحتكم المتعاقدة حتى الآن.'}", ": t('objections.auth_empty_desc')}")

text = text.replace('>مرجع الطعن<', '>{t("objections.auth_table_ref")}<')
text = text.replace('>أسباب الطعن<', '>{t("objections.auth_table_ground")}<')
text = text.replace('>المهلة المتبقية<', '>{t("objections.auth_table_deadline")}<')
text = text.replace('>الإجراءات<', '>{t("objections.auth_table_actions")}<')

text = text.replace("{item.objector_name || 'متعامل مسجل'}", "{item.objector_name || t('objections.default_registered_operator')}")
text = text.replace("متبقي {item.days_remaining} يوم", "{t('objections.days_remaining_label', { days: item.days_remaining })}")
text = text.replace('انقضت المهلة', '{t("objections.deadline_expired_badge")}')

text = text.replace('>بدء الدراسة<', '>{t("objections.auth_btn_start_review")}<')
text = text.replace('>البت في الطعن<', '>{t("objections.auth_btn_issue_decision")}<')
text = text.replace('>عرض<', '>{t("objections.auth_btn_view_details")}<')

with open('client/src/features/objections/components/AuthorityObjectionsView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. ObjectionDecisionModal.tsx
with open('client/src/features/objections/components/ObjectionDecisionModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('مضمون قرار اللجنة:', '{t("objections.decision_content_label")}')
text = text.replace('إلغاء الإسناد المؤقت وإعادة فحص العروض', '{t("objections.decision_accept_desc")}')
text = text.replace('تثبيت الإسناد المؤقت ومواصلة التعاقد', '{t("objections.decision_reject_desc")}')
text = text.replace('التبرير القانوني والتقني للقرار (إلزامي):', '{t("objections.decision_rationale_label")}')
text = text.replace('placeholder="بيّن بالتفصيل مبررات القرار المستخلصة من مداولات لجنة الصفقات ومطابقتها للمادة 72..."', 'placeholder={t("objections.decision_rationale_placeholder")}')
text = text.replace('يتم تسجيل هذا التبرير بصورة نهائية في سجل التدقيق SHA-256.', '{t("objections.decision_sha_notice")}')
text = text.replace('{reason.trim().length}/10 أحرف', '{reason.trim().length}/10 {t("objections.characters_count")}')
text = text.replace('إلغاء', '{t("common.cancel")}')
text = text.replace('جاري تسجيل القرار...', '{t("objections.decision_btn_saving")}')

with open('client/src/features/objections/components/ObjectionDecisionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 3. ObjectionDetailModal.tsx
with open('client/src/features/objections/components/ObjectionDetailModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('مضمون الطعن وحجج المتعامل', '{t("objections.detail_arguments_title")}')
text = text.replace('بيان ومبررات الطعن المقدمة من العارض:', '{t("objections.detail_arguments_sub")}')
text = text.replace('المؤيدات والوثائق المرفقة:', '{t("objections.detail_proof_title")}')
text = text.replace('لم ترفق مستندات إضافية مع هذا الطعن.', '{t("objections.detail_no_files")}')
text = text.replace('قرار لجنة الصفقات:', '{t("objections.detail_decision_title")}')
text = text.replace('تاريخ القرار:', '{t("objections.detail_decision_date")}')
text = text.replace('التبرير القانوني للقرار:', '{t("objections.detail_decision_rationale")}')
text = text.replace('بصمة التوثيق الرقمية (SHA-256):', '{t("objections.detail_sha_fingerprint")}')
text = text.replace('تم التحقق من سلامة البصمة الرقمية وعدم تعديل السجل.', '{t("objections.detail_sha_verified")}')
text = text.replace('>سحب الطعن<', '>{t("objections.op_btn_withdraw")}<')

with open('client/src/features/objections/components/ObjectionDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 4. ObjectionSubmissionModal.tsx
with open('client/src/features/objections/components/ObjectionSubmissionModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('المادة 72 — القانون 23-12', '{t("objections.submit_badge_law")}')
text = text.replace('إيداع طعن على الإسناد المؤقت', '{t("objections.submit_modal_title")}')
text = text.replace('يحق لأي عارض شارك في الصفقة ويرى إجحافاً في التقييم تقديم طعن إداري خلال 10 أيام من إعلان المنح.', '{t("objections.submit_modal_desc")}')
text = text.replace('الصفقة محل الطعن *', '{t("objections.submit_deal_label")}')
text = text.replace('جاري تحميل الصفقات المتاحة...', '{t("objections.submit_loading_deals")}')
text = text.replace('لا توجد صفقات مؤهلة للطعن حالياً.', '{t("objections.submit_no_deals")}')
text = text.replace('-- اختر الصفقة المعنية بالطعن --', '{t("objections.submit_select_deal")}')
text = text.replace("تاريخ إعلان الإسناد: {selectedDeal.award_published_at} · آخر أجل للطعن: {selectedDeal.objection_deadline}", "{t('objections.submit_award_info', { date: selectedDeal.award_published_at, deadline: selectedDeal.objection_deadline })}")
text = text.replace('نوع الطعن *', '{t("objections.submit_type_label")}')
text = text.replace('أسباب ومبررات الطعن (اختر كل ما ينطبق) *', '{t("objections.submit_grounds_label")}')
text = text.replace('بيان الوقائع وأسباب الطعن بالتفصيل *', '{t("objections.submit_desc_label")}')
text = text.replace('placeholder="بيّن بالتفصيل المخالفات الإجرائية أو الأخطاء في تقييم العروض والأسس التي تستند إليها في طعنك..."', 'placeholder={t("objections.submit_desc_placeholder")}')
text = text.replace('المؤيدات والوثائق المرفقة (اختياري)', '{t("objections.submit_files_label")}')
text = text.replace('ملف إضافي', '{t("objections.submit_btn_add_file")}')
text = text.replace('تنبيه نظامي:', '{t("objections.submit_warning_title")}')
text = text.replace('إيداع الطعن يوقف إجراءات الإبرام النهائي للصفقة. يتم التحقق من صحة التمثيل التجاري وإشعار المصلحة المتعاقدة فورياً مع توثيق العملية ببصمة رقمية.', '{t("objections.submit_warning_desc")}')
text = text.replace('تأكيد وإيداع الطعن', '{t("objections.submit_btn_confirm")}')

with open('client/src/features/objections/components/ObjectionSubmissionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# 5. OperatorObjectionsView.tsx
with open('client/src/features/objections/components/OperatorObjectionsView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('>مُودع<', '>{t("objections.filter_submitted_label")}<')
text = text.replace('>قيد الدراسة<', '>{t("objections.filter_under_review_label")}<')
text = text.replace('>مقبول<', '>{t("objections.filter_accepted_label")}<')
text = text.replace('>مرفوض<', '>{t("objections.filter_rejected_label")}<')
text = text.replace('>مسحوب<', '>{t("objections.status_withdrawn")}<')

text = text.replace('المادة 72 — القانون 23-12', '{t("objections.submit_badge_law")}')
text = text.replace('>الطعون والتظلمات<', '>{t("objections.op_page_title")}<')
text = text.replace("""يحق لكل عارض يرى مساساً بحقوقه أو خرقاً لدفتر الشروط أو معايير التقييم تقديم طعن إداري
          أمام لجنة الصفقات خلال أجل 10 أيام من نشر الإسناد.""", '{t("objections.op_page_desc")}')
text = text.replace('العد التنازلي لأقرب أجل طعن', '{t("objections.op_countdown_title")}')
text = text.replace('أقل من 3 أيام', '{t("objections.op_less_than_3_days")}')
text = text.replace("""الطعن <span className="op-mono font-bold">{nextObjection.reference}</span> —
              آخر أجل: {formatDeadline(nextObjection.deadline_at)}""", '{t("objections.op_countdown_sub", { ref: nextObjection.reference, date: formatDeadline(nextObjection.deadline_at) })}')
text = text.replace("'لا توجد آجال طعن مفتوحة حالياً. تُحسب المهلة من تاريخ نشر الإسناد المؤقت.'", "t('objections.op_no_open_deadlines')")
text = text.replace('المتبقي', '{t("objections.op_remaining_label")}')
text = text.replace("""تنبيه: بقي أقل من 3 أيام على انقضاء الأجل. بادر باستكمال الإجراء أو مراجعة ملف
            الطعن قبل انتهاء المهلة.""", '{t("objections.op_urgent_warning")}')
text = text.replace('aria-label="مؤشرات الطعون"', 'aria-label={t("objections.op_kpi_aria")}')
text = text.replace('إجمالي طعوني', '{t("objections.op_kpi_total")}')
text = text.replace('موثقة برقم مرجعي وبصمة', '{t("objections.op_kpi_total_sub")}')
text = text.replace('قيد المعالجة والدراسة', '{t("objections.op_kpi_under_review")}')
text = text.replace('أمام لجان الصفقات', '{t("objections.op_kpi_under_review_sub")}')
text = text.replace('طعون مقبولة', '{t("objections.op_kpi_accepted")}')
text = text.replace('ألغي فيها الإسناد المؤقت', '{t("objections.op_kpi_accepted_sub")}')
text = text.replace('طعون مرفوضة', '{t("objections.op_kpi_rejected")}')
text = text.replace('مع تبرير معلل من اللجنة', '{t("objections.op_kpi_rejected_sub")}')

text = text.replace('سجل الطعون', '{t("objections.op_table_heading")}')
text = text.replace('تابع حالة طعونك والآجال المرتبطة بها.', '{t("objections.op_table_sub")}')
text = text.replace('placeholder="بحث برقم الطعن أو الصفقة..."', 'placeholder={t("objections.op_search_placeholder")}')
text = text.replace('aria-label="بحث في الطعون"', 'aria-label={t("objections.op_search_aria")}')
text = text.replace('aria-label="تصفية حسب الحالة"', 'aria-label={t("objections.op_filter_aria")}')

text = text.replace('<option value="all">كافة الحالات</option>', '<option value="all">{t("objections.auth_filter_all")}</option>')
text = text.replace('<option value="submitted">مُودع</option>', '<option value="submitted">{t("objections.filter_submitted_label")}</option>')
text = text.replace('<option value="under_review">قيد الدراسة</option>', '<option value="under_review">{t("objections.filter_under_review_label")}</option>')
text = text.replace('<option value="accepted">مقبول</option>', '<option value="accepted">{t("objections.filter_accepted_label")}</option>')
text = text.replace('<option value="rejected">مرفوض</option>', '<option value="rejected">{t("objections.filter_rejected_label")}</option>')
text = text.replace('<option value="withdrawn">مسحوب</option>', '<option value="withdrawn">{t("objections.status_withdrawn")}</option>')

text = text.replace('<th>الصفقة</th>', '<th>{t("objections.op_table_deal")}</th>')
text = text.replace('<th>نوع الطعن</th>', '<th>{t("objections.op_table_type")}</th>')
text = text.replace('<th>أبرز الأسباب</th>', '<th>{t("objections.op_table_ground")}</th>')
text = text.replace('<th>الحالة</th>', '<th>{t("objections.op_table_status")}</th>')
text = text.replace('<th>المهلة المتبقية</th>', '<th>{t("objections.op_table_deadline")}</th>')
text = text.replace('<th>تاريخ الإيداع</th>', '<th>{t("objections.op_table_date")}</th>')

text = text.replace('<h4>لا توجد طعون مسجلة حالياً</h4>', '<h4>{t("objections.op_empty_title")}</h4>')
text = text.replace('يمكنك إيداع طعن على أي صفقة مؤهلة خلال 10 أيام من إعلان الإسناد المؤقت.', '{t("objections.op_empty_desc")}')
text = text.replace("{fetchingDetail ? 'جارٍ التحميل...' : 'عرض الملف'}", "{fetchingDetail ? t('common.loading') : t('objections.auth_btn_view_details')}")

with open('client/src/features/objections/components/OperatorObjectionsView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied fix_all_objection_components successfully.")
