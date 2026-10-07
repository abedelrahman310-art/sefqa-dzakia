# TECHNICAL PROCUREMENT COMPLIANCE AGENT
**Platform:** Smart Algerian Public Procurement Platform (صفقات ذكية)  
**Component:** Backend AI Governance & Compliance Agent  
**Branch:** `feature/technical-compliance-agent`  
**Legal References:** Algerian Law No. 23-12 (5 August 2023) & Presidential Decree No. 15-247 (16 September 2015)  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. نظرة عامة والهدف (Overview & Objective)

يُعد **وكيل الامتثال التقني للصفقات العمومية (Technical Procurement Compliance Agent)** محركاً استشارياً متخصصاً تم بناؤه لمساعدة المصالح المتعاقدة ولجان تقييم العروض (Commissions d'ouverture des plis et d'évaluation des offres) في فحص مطابقة العروض التقنية لدفاتر الشروط بدقة رقمية وقانونية متناهية، بالاستناد الحصري إلى:
1. **القانون رقم 23-12 المؤرخ في 5 أوت 2023** المحدد للقواعد العامة المتعلقة بالصفقات العمومية (لا سيما المواد 71 و72 المتعلقة بدراسة ومطابقة العروض).
2. **المرسوم الرئاسي رقم 15-247 المؤرخ في 16 سبتمبر 2015** المتضمن تنظيم الصفقات العمومية وتفويضات المرفق العام (المواد 72 و78 و125).

---

## 2. القواعد الحاكمة غير القابلة للخرق (Governance Lock)

تم تضمين مبادئ الحوكمة الهندسية والقانونية داخل منطق الخادم ونماذج البيانات بصورة صارمة:

1. **حظر القرار الآلي (Strict No-Automated Decision Rule):**
   - يُمنع منعاً باتاً على الوكيل اتخاذ قرار إقصاء (Elimination) أو منح صفقة (Award).
   - دور الوكيل استشاري تحليلي بالكامل (`Advisory Only`).
   - القرار القانوني والنهائي يعود حصراً للجنة تقييم العروض البشرية (`Human-in-the-loop`).
   - تم قفل هذا المبدأ على مستوى قاعدة البيانات عبر حقل `automatedDecisionForbidden = true` الثابت.

2. **قاعدة الإثبات الصارم (Verifiable Evidence Rule):**
   - لا يُقبل أي استنتاج بالامتثال أو عدم الامتثال دون إسناد مباشر إلى:
     - اسم الوثيقة المصدر.
     - رقم الصفحة بدقة (`sourcePage` و `evidencePage`).
     - الاقتباس النصي الحرفي من العرض (`evidenceQuote`).

3. **قاعدة السند القانوني (Statutory Citation Rule):**
   - كل ملاحظة أو تدقيق يربط وجوباً بالمادة القانونية المقابلة من القانون 23-12 أو المرسوم 15-247.

4. **إلزامية المراجعة البشرية في حالات الشك (Human Review Delegation):**
   - الحالات التي تحتمل التأويل، أو التي تفتقر لوثائق واضحة، تُصنف تلقائياً كـ `uncertain_requires_human_review` مع تفعيل وسم `requiresHumanReview = true` وتوجيهها لتدقيق اللجنة.

5. **حصانة معايير دفتر الشروط (Cahier Immunity):**
   - يُحظر على الوكيل أو أي مستخدم تخفيف أو تعديل معايير التنقيط والشروط الإقصائية بعد الإعلان والمصادقة على دفتر الشروط.

---

## 3. نماذج قاعدة البيانات (Database Architecture)

تمت إضافة ثلاثة نماذج في المخطط الموحد [`shared/src/schema/index.ts`](file:///C:/dev/safaqat/shared/src/schema/index.ts):

### أ. جدول المواصفات التقنية المستخرجة (`technical_requirements`):
* `id`: معرف فريد (UUID).
* `draftId`: ارتباط بالصفقة المحددة (`drafts.id`).
* `code`: كود المتطلب (مثل `TR-01`).
* `title`: عنوان المتطلب.
* `description`: الوصف الفني الدقيق.
* `category`: تصنيف المتطلب (`functional`, `performance`, `security`, `normative`, `environmental`, `general`).
* `isMandatory`: شرط إقصائي إلزامي (`boolean`).
* `sourceDocument`: اسم وثيقة دفتر الشروط المصدر.
* `sourcePage`: رقم الصفحة بدفتر الشروط.
* `sourceClauseReference`: رقم البند أو المادة التعاقدية.
* `minThreshold`: الحد الأدنى المقبول.
* `weightScore`: الوزن التنقيطي للمتطلب.
* `extractedById`: معرف المستخدم المستخرج للبيانات.

### ب. جدول جلسات التقييم التقني (`technical_evaluations`):
* `id`: معرف جلسة التقييم.
* `draftId`: الصفقة.
* `offerId`: العرض التقني محل الدراسة (`offers.id`).
* `totalRequirementsCount`: إجمالي المتطلبات المفحوصة.
* `compliantCount`: عدد المتطلبات المطابقة.
* `nonCompliantCount`: عدد المتطلبات غير المطابقة.
* `requiresHumanReviewCount`: عدد البنود المحالة للمراجعة البشرية.
* `preliminaryScore`: النقطة التقنية الاستشارية الأولية.
* `humanReviewStatus`: حالة المراجعة البشرية (`pending`, `in_review`, `verified_by_committee`, `overridden`).
* `automatedDecisionForbidden`: قفل حوكمة ثابت (`true`).

### ج. جدول نتائج المطابقة الفردية (`compliance_findings`):
* `id`: معرف النتيجة.
* `evaluationId`: جلسة التقييم المرتبطة.
* `requirementId`: المتطلب التقني المفحوص.
* `status`: حالة المطابقة (`compliant`, `non_compliant`, `partial`, `uncertain_requires_human_review`).
* `findingDetails`: تفاصيل التعليل الفني.
* `evidenceDocument`: اسم وثيقة الإثبات.
* `evidencePage`: رقم صفحة الإثبات في العرض.
* `evidenceQuote`: الاقتباس الحرفي من العرض التقني.
* `statutoryReference`: السند القانوني الجزائري.
* `legalRiskLevel`: مستوى الخطر القانوني (`none`, `low`, `medium`, `high`, `critical`).
* `humanResolution`: قرار اللجنة البشرية النهائي.

---

## 4. خدمات الوكيل الأساسية (Agent Core Services)

تتمركز وظائف الوكيل داخل الخدمة [`TechnicalComplianceAgent.ts`](file:///C:/dev/safaqat/server/src/ai/services/TechnicalComplianceAgent.ts):

1. **`extractRequirements(draftId, extractedByUserId, customRequirements?)`:**
   - استخراج شروط ومواصفات دفتر الشروط مع توثيق أرقام الصفحات والبنود القانونية.
   - التحقق الصارم عبر مخطط Zod: `ExtractRequirementsOutputSchema`.

2. **`extractEvaluationCriteria(draftId)`:**
   - استخراج معايير التنقيط المعتمدة وتحديد الحد الإقصائي الأدنى (60/100 طبقاً للمادة 72 من القانون 23-12).
   - التحقق الصارم عبر مخطط Zod: `ExtractCriteriaOutputSchema`.

3. **`buildComplianceMatrix(draftId, offerId, evaluatorUserId)`:**
   - بناء جدول المطابقة المقارن بين دفتر الشروط وعرض المتعامل الاقتصادي.
   - استدعاء نصوص المواد القانونية ومطابقة الاقتباسات والأدلة.
   - عزل المتطلبات المشكوك فيها وتوجيهها للمراجعة البشرية مع تسجيل بيان الحوكمة الإلزامي.

4. **`submitHumanReview(submission, reviewerUserId)`:**
   - تمكين أعضاء لجنة تقييم العروض من المصادقة على التقرير أو تعديل نتائج أي بند مع التبرير المكتوب.
   - حفظ سجل التدقيق غير القابل للتعديل.

---

## 5. واجهات البرمجة (API Endpoints Reference)

المسار الرئيسي: `/api/compliance` (محمي بـ `requireAuth` و `requireRole('authority', 'central_admin')` و `csrfProtection`):

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/compliance/extract-requirements` | `POST` | Authority, Central | استخراج وتخزين المتطلبات التقنية مع أرقام الصفحات |
| `/api/compliance/criteria/:draftId` | `GET` | Authority, Central | جلب واستخراج معايير التنقيط وشروط الإقصاء |
| `/api/compliance/matrix` | `POST` | Authority, Central | بناء جدول المطابقة التقنية المدعوم بالاقتباسات والأدلة |
| `/api/compliance/human-review` | `POST` | Authority, Central | إيداع واعتماد مراجعة وتعديلات لجنة تقييم العروض البشرية |
| `/api/compliance/evaluations/:evaluationId` | `GET` | Authority, Central | استرجاع بيانات جلسة التقييم وجدول النتائج التفصيلي |

---

## 6. سجل التدقيق والأمان (Audit Trail & Security)

* كل استدعاء أو فحص يقوم به الوكيل يوثق تلقائياً في جدول `ai_audit_log` مسجلاً:
  - معرف المستخدم (`userId`).
  - دور المستخدم (`role`).
  - نص السؤال أو العملية.
  - قائمة الأدوات المستدعاة (`toolNames`).
  - عدد السجلات المعالجة وحالة العملية (`success` / `error`).
* يتم عزل بيانات العروض للمتعاملين الآخرين منعاً لأي تسريب قبل الجلسات الرسمية.

---

## 7. نتائج الاختبارات وضمان الجودة (Verification & Testing)

* ملف الاختبار: [`server/src/tests/technicalCompliance.test.ts`](file:///C:/dev/safaqat/server/src/tests/technicalCompliance.test.ts)
* نتائج التشغيل عبر Vitest:
  - **11 اختبار وحدة وتكامل اجتيزت بنجاح (11 Passed, 0 Failed)**:
    - فحص الالتزام بالقانون 23-12 والمرسوم 15-247.
    - فحص حظر القرارات الآلية ووجوب الرقابة البشرية.
    - فحص إلزامية أرقام الصفحات والاقتباسات النصية.
    - فحص تحويل حالات الشك إلى `uncertain_requires_human_review`.
    - فحص اكتمال عقد المراجعة البشرية للجان.
* اكتمال فحص الأنواع الصارم: `pnpm run typecheck` (نجاح تام).
* اكتمال فحص الجودة والتنسيق: `pnpm run lint` (0 أخطاء، 0 تحذيرات).
