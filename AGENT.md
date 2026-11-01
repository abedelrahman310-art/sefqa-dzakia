# صفقات ذكية — سياق العمل للوكلاء (Agent Context)

> منصة وطنية جزائرية GovTech + LegalTech + AI لتسيير دورة حياة الصفقات العمومية وفق
> القانون رقم 23-12 والمرسوم الرئاسي 15-247.
> هذا الملف هو سياق الوكلاء العاملين على المستودع. التعليمات الأعلى أولوية هي طلب
> المستخدم ثم `docs/AGENTS.md` ثم `.agents/rules/safaqat-rules.md`.

## المعمارية الفعلية (مصدر الحقيقة)

| المجلد | الوضع | التقنية |
|---|---|---|
| `backend/` | ✅ الخادم الرسمي الوحيد | Django 6 + Django REST Framework 3.16 + PostgreSQL 16 + SimpleJWT |
| `client/` | ✅ الواجهة الرسمية | React 18 + TypeScript + Vite 5 + Tailwind v3 + shadcn/ui + wouter |
| `docker/` | ✅ النشر | Nginx + Gunicorn + docker-compose |
| `docs/` + `documentation/` | ✅ وثائق الفريق | عربية RTL |
| `server/` + `shared/` | 🗄️ إرث Node/Drizzle مُجمَّد | لا يُطوَّر ولا يُعاد تفعيله دون قرار صريح |

**لا تستخدم Drizzle ORM ولا MySQL ولا Express** في أي عمل جديد: طبقة البيانات الحالية
هي Django ORM + ترحيلات Django على PostgreSQL.

تطبيقات الخادم: `users`, `procurements`, `bids`, `contracts`, `execution`, `reports`,
`audit`, `ai_gateway`.

## البوابات والأدوار

| البوابة | الدور | المسار |
|---|---|---|
| المصلحة المتعاقدة | `authority` | `/authority` |
| المتعامل الاقتصادي | `operator` | `/operator` |
| الرقابة والإدارة المركزية | `central_admin` | `/central` |

قاعدة صلبة: **الخادم هو المصدر الوحيد للحقيقة في تحديد الدور والصلاحيات.** لا تُستخدم
أي قيمة محفوظة في `localStorage` لتقرير دور المستخدم، ولا تُمنح صلاحية بناءً على ما
يرسله المتصفح.

## التشغيل والبيئات

- Python **3.14**، Node **>=24**، pnpm **8.15.5**.
- الأسرار في `.env` فقط (غير متتبع في Git). `.env.example` هو القالب.
- PostgreSQL داخل Docker على منفذ المضيف **5434**؛ الخادم على `8001`؛ الواجهة على `5173`
  وتوجّه `/api` إلى `http://localhost:8001`.

## الأوامر المعتمدة

| الغرض | الأمر |
|---|---|
| اختبارات الخادم (SQLite سريعة) | `cd backend; python -m pytest -q` |
| اختبارات PostgreSQL المعزولة | `python -m pytest --ds=safaqat_core.settings_postgres_test -q` |
| فحص إعدادات Django | `python manage.py check` |
| التحقق من الترحيلات | `python manage.py makemigrations --check --dry-run` |
| فحص الأنواع | `pnpm --filter client typecheck` |
| الأنماط | `pnpm --filter client lint` |
| بناء الواجهة | `pnpm --filter client build` |

## قواعد إلزامية

1. لا تضع أسراراً أو كلمات مرور أو رموزاً في الكود أو الاختبارات أو السجلات.
2. لا تُنفّذ `DROP`/`TRUNCATE`/`reset --hard`/حذف volumes دون موافقة صريحة.
3. لا تعدّل ترحيلاً مطبّقاً ولا تشغّل ترحيلات على قاعدة قائمة دون خطة وموافقة.
4. كل عملية حساسة (نشر، فتح أظرفة، تقييم، إسناد، طعن) تُسجَّل في `AuditLog`.
5. الذكاء الاصطناعي مساعد فقط: لا قرار إسناد ولا تقييم نهائي ولا تنفيذ إجراء حساس.
6. الواجهات عربية RTL أولاً، بخصائص CSS منطقية وخط Cairo.
7. لا تخفِ فشل اختبار أو تعلن نجاحاً لم يُنفَّذ؛ أرفق المخرج الفعلي.
8. مهمة واحدة = فرع واحد = commit واضح، ولا تعمل مباشرة على `master`.

## مراجع سريعة

- حالة المنتج والمهام: `docs/TASKS.md` و`docs/CONTEXT.md`
- قواعد التطوير التفصيلية: `.agents/rules/safaqat-rules.md`
- تشغيل البيئة الخلفية: `README.md`
- مهارات العمل: `.agents/skills/`
