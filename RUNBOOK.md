# 🚀 دليل التشغيل والإنتاج الميداني (Production Runbook) — منصة «صفقات ذكية»
**البيئة:** الإنتاج السيادي (GovTech Production) | **النسخة:** 1.0.0-Gold  
**التاريخ:** 5 نوفمبر 2026 | **المجال الرسمي:** `safaqat.dz` / `*.gov.dz`

---

## 1. المعمارية التقنية للإنتاج (Production Architecture)

```
                       [الإنترنت / شبكة الإنترانت الحكومية]
                                      │
                                HTTPS / WSS (Port 443 / 80)
                                      ▼
                        ┌───────────────────────────┐
                        │    safaqat_nginx_prod     │  (Nginx 1.25 Alpine)
                        │  - Reverse Proxy / SSL    │  - PWA Web Root (/usr/share/nginx/html)
                        │  - Rate Limiting & Gzip   │  - Security Headers (HSTS, CSP)
                        └─────────────┬─────────────┘
                                      │
             ┌────────────────────────┴────────────────────────┐
             │ Proxy pass (/api/ & /admin/)                     │ WebSocket (/ws/)
             ▼                                                 ▼
┌───────────────────────────┐                     ┌───────────────────────────┐
│    safaqat_django_prod    │                     │    safaqat_django_prod    │
│  - Django 6.0 REST Core   │                     │  - Daphne ASGI Channels   │
│  - Gunicorn Multi-Workers │                     │  - Realtime Opening/Alerts│
└─────────────┬─────────────┘                     └─────────────┬─────────────┘
              │                                                 │
              ├───────────────────────┬─────────────────────────┤
              ▼                       ▼                         ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
│   safaqat_postgres_prod   │ │    safaqat_redis_prod     │ │    AI Advisory Gateway    │
│  - PostgreSQL 16          │ │  - Redis 7.0 Alpine       │ │  - Market Price Engine  │
│  - Extension pgvector     │ │  - Session / ChannelLayer │ │  - Anti-Collusion Radar │
│  - Immutable Audit Logs   │ │  - Token Blacklist Cache  │ │  - Legal RAG Assistant  │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
```

---

## 2. متطلبات التشغيل والتهيئة المسبقة (Prerequisites)

1. **العتاد الأدنى (Minimum Specs):**
   - المعالج: 4 vCPU
   - الذاكرة: 8 GB RAM (يفضل 16 GB لعمليات البحث الشعاعي pgvector)
   - التخزين: 80 GB SSD (NVMe)
2. **البرمجيات:**
   - Docker Engine 24+ & Docker Compose v2.20+
   - OpenSSL (لتوليد أو تجديد شهادات التشفير)
   - Node.js 20+ & pnpm 9+ (لبناء حزمة الواجهة الأمامية عند الحاجة)
   - Python 3.12 - 3.14 (للعمليات الإدارية خارج الحاويات)

---

## 3. إعداد الأسرار والمتغيرات البيئية (`.env.production`)

قم بإنشاء وتأمين ملف البيئة الميداني `.env.production` مع منح صلاحيات قراءة حصرية `chmod 600 .env.production`:

```bash
# ─── إعدادات الأمان الأساسية ───
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=prod_sovereign_dz_safaqat_key_exceeding_64_random_cryptographic_chars_2026
DJANGO_ALLOWED_HOSTS=safaqat.dz,www.safaqat.dz,localhost,127.0.0.1,nginx,backend,web

# ─── قاعدة البيانات السيادية (PostgreSQL 16 + pgvector) ───
DB_ENGINE=postgresql
POSTGRES_DB=safaqat_db
POSTGRES_USER=safaqat_admin
POSTGRES_PASSWORD=StrongAdminGovTechPassword2026!
POSTGRES_HOST=db
POSTGRES_PORT=5432

# ─── التخزين المؤقت وقنوات البث الحي (Redis 7) ───
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/0

# ─── النطاقات الموثوقة لـ CSRF و CORS ───
CORS_ALLOWED_ORIGINS=https://safaqat.dz,https://www.safaqat.dz
CSRF_TRUSTED_ORIGINS=https://safaqat.dz,https://www.safaqat.dz

# ─── منافذ التشغيل ───
WEB_PORT=80
SSL_PORT=443
```

---

## 4. تشغيل المنصة في بيئة الإنتاج خطوة بخطوة

### الخطوة 1: بناء وتجهيز تطبيق الواجهة الأمامية PWA
```bash
# تثبيت الاعتماديات وبناء الحزمة المحسنة
pnpm --filter client build
```

### الخطوة 2: تشغيل الحاويات المترابطة عبر Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### الخطوة 3: التحقق من صحة وجاهزية الحاويات
```bash
docker compose -f docker-compose.prod.yml ps
```
*يجب أن تظهر جميع الحاويات الأربع في حالة `healthy` أو `running`:*
- `safaqat_postgres_prod`
- `safaqat_redis_prod`
- `safaqat_django_prod`
- `safaqat_nginx_prod`

### الخطوة 4: تطبيق ترحيلات قواعد البيانات (Database Migrations)
```bash
docker exec -it safaqat_django_prod python manage.py migrate
```

### الخطوة 5: حقن بيانات الأسعار المرجعية لـ 69 ولاية جزائرية
```bash
docker exec -it safaqat_django_prod python manage.py seed_market_prices
```

### الخطوة 6: حقن بيانات المحاكاة الرقابية (اختياري للبيئات التجريبية/Staging)
```bash
docker exec -it safaqat_django_prod python manage.py seed_central_demo --allow-production
```

---

## 5. بروتوكول اختبار القبول الشامل (Golden Run Protocol)

للتأكد الميداني من جاهزية دورة حياة الصفقات العمومية كاملة وفق القانون 23-12 والمرسوم 15-247، يتم تشغيل سكربت الفحص الآلي المعتمد:

```bash
docker exec -it safaqat_django_prod python scripts/run_procurement_lifecycle.py
```

### معايير النجاح الإلزامية في فحص الـ Golden Run:
1. **المرحلة 01-02:** تسجيل مصلحة متعاقدة ومتعاملين وفحص السجل التجاري والتأهيل.
2. **المرحلة 03:** إنشاء صفقة وتجميد دفتر الشروط ببصمة SHA-256 مشفرة.
3. **المرحلة 04:** نشر طلب العروض وتحديد تاريخ الإيداع النهائي.
4. **المرحلة 05-06:** إيداع العروض الثلاثية المشفرة وتفعيل القفل التشفيري لمنع كشف الأسعار قبل موعدها.
5. **المرحلة 07-08:** انعقاد جلسة فتح الأظرفة العلنية وتوليد وتصدير محضر الفتح الرسمي PDF.
6. **المرحلة 09-10:** التقييم التقني والمالي ونشر إشعار المنح المؤقت وبدء مهلة الـ 10 أيام القانونية.
7. **المرحلة 11-12:** تسجيل طعن إداري، إيقاف التعاقد، وفصل هيئة الرقابة المركزية فيه وتثبيت العقد.
8. **المرحلة 13:** التحقق من اكتمال قيود سجل التدقيق الجنائي غير القابل للتعديل (`AuditLog`).

---

## 6. إجراءات النسخ الاحتياطي واستعادة البيانات (Backup & Restore)

### النسخ الاحتياطي اليومي لقاعدة البيانات PostgreSQL + pgvector:
```bash
docker exec -t safaqat_postgres_prod pg_dump -U safaqat_user safaqat_db | gzip > /backups/safaqat_db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### استعادة قاعدة البيانات من نسخة احتياطية:
```bash
gunzip < /backups/safaqat_db_20261105_000000.sql.gz | docker exec -i safaqat_postgres_prod psql -U safaqat_user -d safaqat_db
```

---

## 7. استكشاف الأخطاء ومعالجتها (Troubleshooting)

| العارض / المشكلة | السبب المحتمل | إجراء المعالجة الفوري |
|------------------|---------------|-----------------------|
| خطأ `Connection refused: port 5432` | حاوية PostgreSQL لم تكتمل مرحلة التهيئة | فحص السجلات عبر `docker logs safaqat_postgres_prod` والتأكد من نجاح الـ Healthcheck |
| خطأ `Invalid host header` | النطاق المستخدم غير مدرج في `DJANGO_ALLOWED_HOSTS` | تحديث `DJANGO_ALLOWED_HOSTS` في ملف البيئة وإعادة تشغيل حاوية دجانغو |
| خطأ في تحديثات WebSocket | تعطل خدمة Redis أو منع Nginx لمسارات الترقية | التأكد من تشغيل `safaqat_redis_prod` ومراجعة إعدادات `Upgrade` في `docker/nginx/default.conf` |
| عدم ظهور بعض الولايات في البحث | استخدام إصدار قديم من كتالوج الولايات | التأكد من استخدام الكتالوج المركزي المحدث لـ 69 ولاية وإعادة تشغيل `seed_market_prices` |
