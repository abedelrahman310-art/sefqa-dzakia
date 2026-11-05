# دليل التشغيل الميداني للإنتاج (Production Operations Runbook)
**المنصة:** صفقات ذكية (Safaqat Dhakia)  
**الفريق المسؤول:** فريق هندسة العمليات والبنية السحابية (DevOps & SRE Team)  
**تاريخ التحديث:** 2026-11-05  
**بيئة التشغيل:** Docker Compose Enterprise Architecture  

---

## 1. البنية المعمارية للخدمات (Architecture Topology)

تعتمد المنصة على بنية حاويات رباعية متكاملة ومعزولة عبر شبكة `safaqat_prod_network`:

```text
[ المستخدمون / المتصفحات / PWA ]
              │ (HTTP 80 / HTTPS 443)
              ▼
   ┌──────────────────────────────────────────────┐
   │    حاوية 1: safaqat_nginx_prod (Reverse Proxy)│
   │    • إدارة SSL/TLS وشبكات التوصيل السريع     │
   │    • استضافة الواجهة الأمامية React PWA      │
   │    • توجيه /api/ و /ws/ و /admin/ و /media/  │
   └──────────────┬───────────────────────────────┘
                  │ (HTTP 8000 / WebSockets)
                  ▼
   ┌──────────────────────────────────────────────┐
   │    حاوية 2: safaqat_django_prod (Daphne ASGI)│
   │    • خادم التطبيقات المركزي                  │
   │    • محرك الصفقات والعقود والتحكيم           │
   │    • تجميع الملفات الثابتة collectstatic     │
   └──────────────┬───────────────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌──────────────────┐  ┌───────────────────────────┐
│ حاوية 3: Redis 7 │  │ حاوية 4: PostgreSQL 16    │
│ (safaqat_redis)  │  │ مع ملحق pgvector          │
│ • قنوات Channels │  │ (safaqat_postgres_prod)   │
│ • التخزين المؤقت │  │ • التخزين الدائم للبيانات │
└──────────────────┘  └───────────────────────────┘
```

---

## 2. جدول بنود الجاهزية التشغيلية (Operational Readiness Matrix)

| البند التشغيلي | الحالة | الدليل | المسؤول | التاريخ | ملاحظات |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **تهيئة ملف البيئة الإنتاجي** | **منجز** | وجود `.env.example` الشامل مع فحص عدم تتبع `.env`. | Lead DevOps | 2026-11-05 | لا يتم تشغيل المنصة في بيئة الإنتاج إلا بـ `DJANGO_DEBUG=False`. |
| **بناء الحزم الأمامية الثابتة** | **منجز** | تنفيذ `npm run build` في `client` وتوليد `client/dist`. | Frontend Lead | 2026-11-05 | خادم Nginx يخدم ملفات PWA مع ضغط Gzip والتخزين المؤقت للأصول. |
| **تطبيق ترحيلات قاعدة البيانات** | **منجز** | تنفيذ تلقائي داخل `entrypoint.sh` عبر `python manage.py migrate --noinput`. | Backend Lead | 2026-11-05 | يضمن تكامل الجداول والمؤشرات وفهارس pgvector قبل بدء الخدمة. |
| **تفعيل قنوات المراقبة والسلامة** | **منجز** | نقطة الفحص `/api/health/` الموثقة بـ `test_health_check.py`. | SRE Engineer | 2026-11-05 | تتحقق من سلامة PostgreSQL وRedis وتعيد 200 OK. |
| **النسخ الاحتياطي الدوري** | **منجز** | توفير `scripts/backup_production.sh` مع تشفير الأذونات. | SRE Engineer | 2026-11-05 | يتم جدولته عبر Cron Job كل 6 ساعات. |

---

## 3. إجراءات التشغيل والنشر (Deployment Procedures)

### أ. التشغيل المبدئي للبيئة
```bash
# 1. الدخول إلى مجلد المشروع
cd /opt/safaqat

# 2. بناء الواجهة الأمامية
cd client
npm install --frozen-lockfile
npm run build
cd ..

# 3. إطلاق الحاويات بالوضع المنفصل (Detached Mode)
docker compose -f docker-compose.prod.yml up -d --build

# 4. التأكد من حالة الحاويات وسلامتها
docker compose -f docker-compose.prod.yml ps
```

### ب. التحقق من سلامة الخدمات (Smoke Testing)
```bash
# فحص نقطة الصحة المركزية
curl -I http://localhost/api/health/

# التحقق من سجلات الخادم
docker compose -f docker-compose.prod.yml logs --tail=50 backend
```

---

## 4. سيناريوهات وحالات الطوارئ (Emergency Runbooks)

### السيناريو 1: تعثر أو إعادة تشغيل حاوية Backend
- **الأعراض:** استجابة Nginx برمز خطأ `502 Bad Gateway` على مسار `/api/`.
- **خطوات التشخيص:**
  ```bash
  docker logs --tail=100 safaqat_django_prod
  ```
- **إجراء الحل:**
  ```bash
  docker compose -f docker-compose.prod.yml restart backend
  ```

### السيناريو 2: تصفير أو تنظيف بيانات الاختبار دون المساس بالإداريين
- **الإجراء المعتمد:**
  ```bash
  docker exec -it safaqat_django_prod python manage.py purge_demo_data --confirm
  ```
  *(يمكن تجربة `--dry-run` أولاً للمعاينة دون حذف).*

### السيناريو 3: تجديد شهادات الأمان SSL
- **الإجراء:** استبدال ملفي `safaqat.crt` و `safaqat.key` في المسار `docker/nginx/ssl/` ثم إعادة تحميل Nginx:
  ```bash
  docker exec safaqat_nginx_prod nginx -s reload
  ```
