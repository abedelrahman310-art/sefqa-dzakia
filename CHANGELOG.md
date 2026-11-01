# سجل التغييرات (CHANGELOG)

جميع التغييرات الجوهرية في منصة **صفقات ذكية** تُوثَّق هنا.  
الصيغة مستوحاة من [Keep a Changelog](https://keepachangelog.com/)، والإصدارات تتبع `package.json`.

---

## [0.2.0] — 2026-11-01

### ملخص الجاهزية

إغلاق ثغرات التدويل والإنتاج، تصحيح الأرقام القانونية، ترجمة المساعد القانوني بالكامل، إصلاح صلاحيات المساعد، وإصلاح ثلاث حالات فشل في اختبارات الخادم. جميع التغييرات **محلية وغير مُودَعة** (لا commit/push).

---

### Added — الإضافات

#### 1) حزمة التدويل الأساسية (خط الأساس المعلن)

تم التحقق من مجموع مكوّنات الحزم الأربع:

```
1,420 + 980 + 650 + 580 + 278 = 3,908 مفتاحاً
```

- توحيد قاموسي `ar.json` و`fr.json` في بنية مسطّحة (flat keys) متوافقة مع `i18next`.
- إضافة مفاتيح ناقصة كانت ستظهر خاماً في الواجهة (15 مفتاحاً).
- إضافة مفاتيح `api.error.*` و`pwa.*` و`dev.*` و`landing.old.*` و`landing.innovation.f_*` و`landing.innovation.d_*`.
- إضافة 52 مفتاحاً لترجمة `OperatorAssistantView.tsx` بالكامل تحت `operator.assistant.*`.
- إضافة 3 مفاتيح خارجية لاستكمال التغطية.
- **العدد الحالي الرسمي: 4,010 مفتاحاً** في `ar.json` و`fr.json` (متطابقان تماماً).

#### 2) المساعد القانوني الذكي (Legal RAG)

- صلاحية جديدة `CanUseAILegalChat` تسمح لـ`operator` و`authority` و`is_superuser`، وتستبعد `central_admin` صراحةً.
- ربط الصلاحية بـ`AILegalChatView` بدل `IsAuthenticated` فقط.
- إضافة مبدأ **صفر ورقة (Zéro papier)** إلى موجه RAG: منع الأظرفة الورقية، وتأكيد الإيداع الرقمي وتشفير العرض المالي بـAES-256.
- اختبارات RAG تزرع المادة 72 في قاعدة الاختبار بدل الاعتماد على بيانات إنتاجية غير موجودة.
- تعطيل تحميل نموذج التضمين العصبي تلقائياً في بيئة الاختبار (`pytest`) أو عند `SAFAQAT_DISABLE_NEURAL_EMBEDDINGS=1`، مع إبقائه مفعّلاً في الإنتاج. السبب: تعليق `transformers/sentence_transformers` على Python 3.14.

#### 3) الوثائق

- إنشاء `docs/I18N-BACKLOG.md`: تدقيق المفاتيح، المنهجيات الثلاث، وقرار عدم الحذف.
- إنشاء `docs/i18n-unused-keys.txt`: القائمة الرسمية الكاملة (717 مفتاحاً).
- إنشاء هذا الملف `CHANGELOG.md`.

---

### Fixed — الإصلاحات

#### 1) تصحيح الأرقام القانونية

| الموضع | قبل | بعد |
| :--- | ---: | ---: |
| `landing.hero.stat_wilayas` (ar/fr) | 48 ولاية | **58 ولاية** |
| `HeroSection.tsx` | 48 | **58** |
| `AIPriceAssistant.tsx` | 69 | **58** |
| `LandingPage.tsx` | 69 | **58** |
| `CentralMapView.tsx` | 69 | **58** |
| `DraftForm.tsx` | 69 | **58** |
| القاموسان (`ar.json`/`fr.json`) | 69 ولاية | **58 ولاية** |

- أُبقيت رموز داخلية مثل `REGISTRY_69W` و`ALGERIA_69_WILAYAS` كما هي لأنها أسماء تعريفية لا تُعرض للمستخدم؛ كل عرض مرئي أصبح **58 ولاية**.
- تم التحقق من وجود **12 مرحلة** و**10 أيام** و**58 ولاية** في القيم العربية والفرنسية.

#### 2) تدويل الواجهة

- ترجمة `OperatorAssistantView.tsx` بالكامل، مع إعادة بناء رسالة الترحيب عند تبديل اللغة.
- ترجمة بطاقات ميزات `LandingPage` القديمة، ورسائل أخطاء `api.ts`، و`PWAInstallPrompt`، و`AICard`، وصفحة 404 في `App.tsx`، و`DevShell`، وعنوان `LandingV2Page`.
- تصحيح آخر قيمتين عربيتين في `fr.json`:
  - `common.lang_switch_short`: `عربي` → `AR`
  - `common.lang_switch_label`: `العربية` → `Arabe`
- توسيع توقيع `t` في `client/src/i18n/index.tsx` إلى `(key: string, options?) => string` لحل تعارضات التواقيع مع الدوال المساعدة، مع بقاء `TranslationKey` للثوابت.
- إضافة حقول `fr` إلى `NATURE_LABELS` و`METHOD_LABELS` و`FORM_LABELS` في `procurementTemplates.ts` لأن الكود كان يقرأ `.fr` غير الموجود.
- إصلاح 296 خطأ `tsc` حتى **0 أخطاء** (تفاصيل في قسم الأدلة).

#### 3) الخادم والصلاحيات

- `CahierSpecsViewSet`: للعمليات الكتابية يُعاد الكائن كاملاً كي تُرجع صلاحية DRF **403** بدل إخفائه بـ**404** عند محاولة مصلحة أخرى التعديل.
- إضافة عبارة **"مبدأ صفر ورقة"** إلى التحليل الاسترشادي في `ai_gateway/views.py` ليتوافق مع اختبار الامتثال.
- إصلاح `test_ai_legal_chat_endpoint` (كان يفشل/يتوقف بسبب غياب مادة قانونية وبيئة التضمين).
- إصلاح `test_prevent_cross_authority_modification` (403 بدل 404).
- إصلاح `test_heuristic_analysis_zero_paper_no_three_envelopes`.

#### 4) جودة البيانات الفرنسية

- إضافة التسميات الفرنسية الناقصة للطبيعة/الطريقة/الشكل في `procurementTemplates.ts`.
- إصلاح `SuspicionAlerts` (`config.label` → `getTypeLabel`).
- استبدال `GROUND_LABELS`/`TYPE_LABELS` بـ`getGroundLabel`/`getTypeLabel` في مكونات الطعون.
- إصلاح `OperatorObjectionsView` (تمرير `t` إلى `formatRemaining`).
- إصلاح `AuthorityDealWorkspace`: `formatContractAmount` يستخدم `i18n.t`، واستبدال `SECTION_TITLES` بـ`getSectionTitle`، وإعادة تسمية معامل الخريطة `t` إلى `tpl`.

---

### Verification Evidence — أدلة التحقق

#### 1) تدقيق i18n

```bash
pnpm i18n:check
```

النتيجة:

```
Arabic keys: 4010
French keys: 4010
Arabic duplicates: 0
French duplicates: 0
Missing in French: 0
Missing in Arabic: 0
Empty values in Arabic: 0
Empty values in French: 0
Untranslated Arabic in French: 0
Identical values (e.g. acronyms/numbers): 8
SUCCESS: ar.json and fr.json are perfectly aligned!
```

#### 2) المفاتيح غير المستخدمة

```bash
pnpm i18n:unused
```

النتيجة:

```
Total keys: 4010
Directly referenced: 3290
Matched via dynamic prefix: 2
Potentially unused: 717
```

- 43 مفتاحاً عربياً محمياً (خريطة `LandingV2Page` الديناميكية).
- 674 مفتاحاً غير عربي مرشح للمراجعة.
- **لم يُحذف أي مفتاح**؛ التفاصيل في `docs/I18N-BACKLOG.md`.

#### 3) TypeScript

```bash
pnpm --filter client typecheck
```

النتيجة: **0 أخطاء** (`TOTAL: 0`).

#### 4) بناء الإنتاج

```bash
pnpm build
```

النتيجة: نجاح، مع تحذير حجم الحزمة (>500 kB) وهو تحذير غير مانع.  
آخر ناتج موثّق: `index-*.js` بحجم يقارب **2.09 MB** (gzip ≈ **535 kB**)، وPWA precache **77** مدخلاً.

#### 5) اختبارات الخادم

```bash
cd backend && python -m pytest tests/ -v
```

النتيجة: تُحدَّث بعد اكتمال المجموعة الكاملة (346 اختباراً).  
الاختبارات الثلاثة التي كانت تفشل/تتوقف تم تشغيلها منفردة ونجحت:

```
tests/test_ai_and_objections_endpoints.py::test_ai_legal_chat_endpoint PASSED
tests/test_cahier_specs_api.py::...::test_prevent_cross_authority_modification PASSED
tests/test_central_and_zero_paper_verification.py::...::test_heuristic_analysis_zero_paper_no_three_envelopes PASSED
```

---

### Changed — تغييرات سلوكية

- اللغة الافتراضية تُكتشف من `localStorage` ثم `navigator` ثم `htmlTag`، وتُحفظ تحت المفتاح `lang`.
- عند تبديل اللغة يُحدَّث `document.documentElement.lang` و`dir` و`class` (خط عربي/فرنسي) تلقائياً.
- `CanUseAILegalChat` تستبعد `central_admin` من المساعد القانوني، لأن لديها منظومة رقابة مستقلة (Hawk Eye).

---

### Security — الأمان

- منع تعديل دفتر شروط تابع لمصلحة متعاقدة أخرى يُرجع **403** صريحاً بدل إخفاء المورد.
- التحقق من صلاحية المساعد القانوني على مستوى الـView وليس الواجهة فقط.
- عدم كتابة أي استجابة API مصادَق عليها في Cache Storage (NetworkOnly).
- تعطيل النموذج العصبي في الاختبارات لا يؤثر على الإنتاج.

---

### Notes — ملاحظات

- **لا commit/push** في هذه الدفعة؛ كل التغييرات محلية.
- الملفات غير المتعقّبة `client/src/lib/dealWorkspacePresets.ts` و`client/src/pages/authority/AuthorityAssistantView.tsx` تُركت كما هي لأنها عمل مقصود.
- تحذير حجم الحزمة (>500 kB) ديناميكي وغير مانع، ويمكن معالجته لاحقاً بتقسيم `LandingV2Page` و`CentralSpace` عبر `React.lazy`.
- 351 مجموعة قيم عربية مكررة (950 مفتاحاً) موثّقة ولم تُحذف؛ قد تكون تسميات مشتركة مشروعة.
