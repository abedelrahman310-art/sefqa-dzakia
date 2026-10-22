# صفقات ذكية

منصة GovTech + LegalTech + AI لتسيير دورة حياة الصفقات العمومية في الجزائر.

## Quick start

```bash
cp .env.example .env   # أضف بيانات قاعدة البيانات
pnpm install
pnpm dev               # client: http://localhost:5173 | server: http://localhost:4000
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | يشغّل الخادم والعميل معًا |
| `pnpm build` | يبني الخادم والعميل للإنتاج |
| `pnpm start` | يشغّل الخادم المبني (بعد `pnpm build`) |
| `pnpm typecheck` | تحقق من أنواع TypeScript |
| `pnpm lint` | تشغيل ESLint |
| `pnpm db:generate` | توليد migrations بـ Drizzle Kit |

## Backend (Django) — Python 3.14 / PostgreSQL 16

يتطلب تشغيل الواجهة الخلفية واختباراتها:

- Python **3.14.x**
- Docker Desktop / Docker Compose (لـ PostgreSQL)
- لا تحتاج Node.js لتشغيل اختبارات Django.

### 1) إنشاء بيئة نظيفة

من جذر المشروع:

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements-dev.txt
```

`requirements.txt` مخصص لاعتماديات التشغيل، و`requirements-dev.txt` يضيف
أدوات الاختبار (`pytest` و`pytest-django` و`pytest-cov` و`pytest-timeout`).
صورة Docker للإنتاج تثبّت `requirements.txt` فقط.

### 2) اختبارات SQLite السريعة

```powershell
cd backend
python -m pytest -q
```

ملف `backend/conftest.py` يفرض SQLite و`LLM_PROVIDER=rule_based` أثناء
`pytest`. اختبارات PostgreSQL الخاصة معلّمة وتُتخطى تلقائياً هنا.

### 3) اختبارات PostgreSQL المعزولة

شغّل قاعدة Docker التطويرية أولاً:

```powershell
cd D:\dev\safaqat
docker compose up -d db
```

أنشئ قاعدة أساس اختبارية منفصلة (مرة واحدة):

```powershell
docker exec safaqat_postgres psql -U safaqat_user -d postgres `
  -c "CREATE DATABASE safaqat_be03_base OWNER safaqat_user;"
```

بيانات الاتصال (`POSTGRES_USER`/`POSTGRES_PASSWORD`) تُقرأ من `.env`
دون طباعتها. لا تستخدم قاعدة الإنتاج. ثم:

```powershell
cd backend
$env:BE03_POSTGRES_DB = 'safaqat_be03_base'
$env:BE03_POSTGRES_TEST_NAME = 'test_safaqat_be03_run'
$env:BE03_POSTGRES_HOST = 'localhost'
$env:BE03_POSTGRES_PORT = '5434'
python -m pytest --ds=safaqat_core.settings_postgres_test -q
```

ينشئ Django قاعدة `test_safaqat_be03_run` ويحذفها بعد الجلسة. إعدادات
`settings_postgres_test.py` ترفض أي قاعدة لا يبدأ اسمها بـ
`safaqat_be03_`، أو خادماً غير محلي. لا تعتمد على `POSTGRES_PORT` العام
في `.env` لهذا المسار.

للتحقق من القاعدة المستخدمة فعلياً:

```powershell
python manage.py shell --settings=safaqat_core.settings_postgres_test `
  -c "from django.db import connection; print(connection.vendor, connection.pg_version, connection.settings_dict['NAME'])"
```

### 4) فحوصات Django وmigrations

مع تفعيل متغيرات PostgreSQL أعلاه:

```powershell
python manage.py check --settings=safaqat_core.settings_postgres_test
python manage.py makemigrations --check --dry-run --settings=safaqat_core.settings_postgres_test
```

### 5) المنافذ والبيئات

- داخل شبكة Docker: `POSTGRES_HOST=db` و`POSTGRES_PORT=5432`.
- من المضيف: منفذ التطوير الافتراضي **5434** (`POSTGRES_HOST_PORT`).
- لا تعدّل `.env` لمجرد تبديل المنفذ؛ استخدم متغيرات العملية أو ملف البيئة
  الخاص بكل بيئة.
- PostgreSQL المحلي على المنفذ **5432** قد يكون خدمة أخرى (مثل pgvector)،
  وليس قاعدة صفقات التطويرية.

### 6) المجموعة الكاملة

بعد تفعيل متغيرات PostgreSQL من القسم 3:

```powershell
cd backend
python -m pytest -q
python -m pytest --ds=safaqat_core.settings_postgres_test -q
```

## Notes

### `shared/components.json` — stub workaround
The file `shared/components.json` is **not** a real shadcn/ui configuration.  
It exists solely as a workaround for a bug in `shadcn@4.21` where the CLI scans
all pnpm workspace packages for `components.json` and aborts if one is missing,
even when you only want to add components to `client/`.  
Do **not** use it to add components — always run `pnpm dlx shadcn@latest add <component>`
from inside the `client/` directory.

## Rules

See [`.agents/rules/safaqat-rules.md`](.agents/rules/safaqat-rules.md).
