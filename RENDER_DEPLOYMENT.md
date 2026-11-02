# دليل النشر والتشغيل المباشر على منصة Render (Render Blueprint)

تمت تهيئة منصة **صفقات ذكية** بالكامل لتنشر سحابياً على خوادم **Render** بنقرة زر واحدة عبر ملف المخطط المعماري `render.yaml` (Blueprint).

---

## 🏛️ المخطط المعماري للنشر السحابي (Architecture)

يقوم ملف `render.yaml` بإنشاء بيئة إنتاجية متكاملة تتضمن:
1. **قاعدة بيانات PostgreSQL سحابية (`safaqat-db`):** تدعم ملحق `pgvector` للبحث الدلالي القانوني.
2. **خادم Redis سحابي (`safaqat-redis`):** لإدارة طبقة قنوات WebSockets الفورية (`Channels`) وإجراءات فتح الأظرفة عن بعد.
3. **خادم الواجهة الخلفية الدانقو (`safaqat-backend`):** يعمل داخل حاوية Docker الرسمية للإنتاج مع خادم `Daphne ASGI`، ويقوم تلقائياً بتطبيق الهجرات (`migrate`) وجمع الملفات الثابتة.
4. **الواجهة الأمامية الثابتة السريعة (`safaqat-frontend`):** مبنية عبر شبكة توزيع عالمية (Edge CDN) مع قواعد إعادة توجيه ذكية (`Rewrites`) تضمن توجيه مسارات واجهة برمجة التطبيقات `/api/*` تلقائياً إلى خادم الدانقو دون أي مشاكل CORS.

---

## 🚀 خطوات النشر في 4 خطوات بسيطة

### الخطوة 1: التأكد من دفع التحديثات إلى GitHub
تأكد من أن مستودعك على GitHub يحتوي على آخر التحديثات وملف `render.yaml`:
```bash
git add .
git commit -m "chore(render): configure complete production blueprint with Daphne ASGI and static SPA"
git push origin main
```

---

### الخطوة 2: الدخول إلى Render وإنشاء Blueprint
1. افتح منصة [Render.com](https://dashboard.render.com/) وسجّل الدخول بحسابك في GitHub.
2. من لوحة التحكم الرئيسية (Dashboard)، اضغط على الزر الأزرق **`+ New`** في أعلى الصفحة.
3. اختر من القائمة خيار **`Blueprint`**.

---

### الخطوة 3: ربط المستودع وتأكيد الموارد
1. اختر مستودع المشروع: `abedelrahman310-art/sefqa-dzakia`.
2. سيقوم Render تلقائياً بفحص ملف `render.yaml` واكتشاف الموارد الأربعة:
   - `safaqat-db` (Database)
   - `safaqat-redis` (Redis)
   - `safaqat-backend` (Docker Web Service)
   - `safaqat-frontend` (Static Site)
3. قم بإدخال اسم للـ Blueprint Instance (مثل `safaqat-prod`).
4. إذا طلب منك مفتاح الذكاء الاصطناعي `GEMINI_API_KEY`، يمكنك إدخاله (أو إبقاؤه فارغاً وتحديده لاحقاً من قسم Environment).
5. اضغط على الزر الأزرق **`Apply`** لبدء النشر التلقائي.

---

### الخطوة 4: اكتمال النشر والتشغيل ☕
- سيقوم Render ببناء وتشغيل كل خدمة بالترتيب:
  1. إنشاء قاعدة البيانات وخادم Redis أولاً.
  2. بناء حاوية الدانقو، تطبيق هجرات قاعدة البيانات، وبدء خادم Daphne.
  3. بناء الواجهة الأمامية React ونشرها على الـ CDN.
- ستظهر لك علامة **`Live 🟢`** بجانب جميع الخدمات.
- سيكون رابط موقعك المباشر:
  - **الواجهة الأمامية للمنصة:** `https://safaqat-frontend.onrender.com`
  - **واجهة API الخلفية:** `https://safaqat-backend.onrender.com`

---

## ⚙️ المتغيرات البيئية الإضافية (اختياري)
إذا رغبت في إضافة مفاتيح الذكاء الاصطناعي، انتقل إلى خدمة `safaqat-backend` في لوحة تحكم Render -> قسم **Environment**:
* `GEMINI_API_KEY`: مفتاح Google Gemini API لتشغيل المستشار القانوني الذكي.
* `ENCRYPTION_KEY`: مفتاح التشفير المالي لعروض الصفقات.
