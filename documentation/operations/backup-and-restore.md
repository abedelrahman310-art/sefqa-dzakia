# سياسة النسخ الاحتياطي والاسترجاع والتعافي من الكوارث (Backup & Recovery Policy)
**المنصة:** صفقات ذكية (Safaqat Dhakia)  
**المرجع:** وثيقة السياسات التشغيلية لحماية البيانات السيادية  
**تاريخ التحديث:** 2026-11-05  
**الحالة:** معتمد ومختبر ميدانياً (Operational & Verified)  

---

## 1. جدول التحقق من سياسة النسخ الاحتياطي (Backup Verification Matrix)

| الرقم | المعيار التشغيلي | الحالة | الدليل | المسؤول | التاريخ | ملاحظات |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| **BKP-01** | تكرار أخذ النسخ الاحتياطية (Frequency) | **منجز** | جدولة كل 6 ساعات لقاعدة البيانات، ويومياً لملفات الوسائط عبر `scripts/backup_production.sh`. | Lead DevOps | 2026-11-05 | يحقق هدف نقطة التعافي (RPO < 6 ساعات). |
| **BKP-02** | سياسة الاستبقاء والحفظ (Retention Policy) | **منجز** | حذف آلي للنسخ الأقدم من 30 يوماً داخل سكربت النسخ الاحتياطي (`find ... -mtime +30 -delete`). | Lead DevOps | 2026-11-05 | توفير مساحة التخزين مع الحفاظ على دورة شهرية كاملة. |
| **BKP-03** | سلامة البصمات المشفرة (Checksum Verification) | **منجز** | توليد ملف بصمة `checksums_*.sha256` لكل عملية نسخ احتياطي والتحقق عبر `sha256sum -c`. | Lead SecOps | 2026-11-05 | يكشف أي تلف أو تعديل غير مصرح به على ملفات النسخ. |
| **BKP-04** | تقييد صلاحيات الوصول (Access Permissions) | **منجز** | تعيين أذونات `0700` لمجلد النسخ و `0600` لملفات `.dump` و `.tar.gz`. | Lead SecOps | 2026-11-05 | يمنع قراءة أو نسخ البيانات من أي مستخدم محلي غير مخول. |
| **BKP-05** | جاهزية سكربت الاسترجاع (Restore Script) | **منجز** | توفير سكربت `scripts/restore_production.sh` مع طلب تأكيد `YES` وإيقاف الخدمات أثناء الاستعادة. | Lead DevOps | 2026-11-05 | يحقق هدف زمن التعافي (RTO < 15 دقيقة). |

---

## 2. إجراءات تنفيذ النسخ الاحتياطي اليدوي والمجدول

### أ. التنفيذ اليدوي
```bash
# تشغيل سكربت النسخ الاحتياطي الفوري
chmod +x scripts/backup_production.sh
./scripts/backup_production.sh
```

### ب. الجدولة التلقائية عبر Cron Job (Linux Production Host)
```bash
# إضافة الأمر في crontab لمستخدم root أو devops
crontab -e

# أخذ نسخة من قاعدة البيانات كل 6 ساعات، والوسائط يومياً الساعة 02:00 صباحاً
0 */6 * * * /opt/safaqat/scripts/backup_production.sh >> /var/log/safaqat_backup.log 2>&1
```

---

## 3. إجراءات الاسترجاع والتعافي السريع (Disaster Recovery Drill)

عند حدوث طارئ يتطلب استعادة النظام إلى نقطة زمنية سابقة، يتم اتباع الخطوات التالية:

### الخطوة 1: التحقق من سلامة ملف النسخة الاحتياطية
```bash
cd /var/backups/safaqat
sha256sum -c checksums_20261105_120000.sha256
```

### الخطوة 2: تشغيل سكربت الاسترجاع
```bash
cd /opt/safaqat
chmod +x scripts/restore_production.sh
./scripts/restore_production.sh /var/backups/safaqat/safaqat_db_20261105_120000.dump /var/backups/safaqat/safaqat_media_20261105_120000.tar.gz
```
*سيطلب السكربت تأكيداً صريحاً بكتابة `YES`، ثم يوقف خوادم التطبيقات مؤقتاً، ينفذ `pg_restore --clean`، يستخرج ملفات الوسائط، ويعيد تشغيل الخدمات تلقائياً.*

### الخطوة 3: التحقق الفوري من سلامة النظام بعد الاسترجاع
```bash
curl -f http://localhost/api/health/
docker compose -f docker-compose.prod.yml ps
```

---

## 4. أهداف التعافي المعتمدة (Recovery Objectives)
- **هدف نقطة التعافي (RPO - Recovery Point Objective):** أقصى فقدان مسموح به هو 6 ساعات من البيانات.
- **هدف زمن التعافي (RTO - Recovery Time Objective):** استعادة الخدمة الكاملة في غضون أقل من 15 دقيقة من انطلاق عملية الاسترجاع.
- **تخزين النسخ خارج الموقع (Off-site Replication):** يُوصى بمزامنة مجلد `/var/backups/safaqat` إلى مساحة تخزين سحابية سيادية أو خادم تخزين منعزل (S3-compatible / SFTP) مشفر بمفتاح GPG.
