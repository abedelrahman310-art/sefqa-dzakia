#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# منصة صفقات ذكية — سكربت النسخ الاحتياطي الدوري لبيئة الإنتاج
# ═══════════════════════════════════════════════════════════════════════════════
# الاستخدام: ./scripts/backup_production.sh
# التكرار الموصى به: كل 6 ساعات لقاعدة البيانات، ويومياً للملفات الإعلامية.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/safaqat}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="${BACKUP_DIR}/safaqat_db_${TIMESTAMP}.dump"
MEDIA_BACKUP_FILE="${BACKUP_DIR}/safaqat_media_${TIMESTAMP}.tar.gz"
CHECKSUM_FILE="${BACKUP_DIR}/checksums_${TIMESTAMP}.sha256"

# التأكد من وجود مجلد النسخ الاحتياطي بالصلاحيات المقيدة (0700)
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "=== [Safaqat] بدء عملية النسخ الاحتياطي الإنتاجي: ${TIMESTAMP} ==="

# 1. النسخ الاحتياطي لقاعدة بيانات PostgreSQL مع pgvector
echo "1. تصدير قاعدة البيانات من حاوية safaqat_postgres_prod..."
docker exec safaqat_postgres_prod pg_dump \
    -U "${POSTGRES_USER:-safaqat_user}" \
    -d "${POSTGRES_DB:-safaqat_db}" \
    -F c -b -v > "${DB_BACKUP_FILE}"

chmod 600 "${DB_BACKUP_FILE}"
echo "✓ تم حفظ قاعدة البيانات: ${DB_BACKUP_FILE} ($(du -h "${DB_BACKUP_FILE}" | cut -f1))"

# 2. النسخ الاحتياطي للملفات والوثائق المرفوعة media
if [ -d "backend/media" ] || docker volume inspect safaqat_django_media_prod >/dev/null 2>&1; then
    echo "2. أرشفة ملفات الوسائط والوثائق المشفرة..."
    docker run --rm \
        -v safaqat_django_media_prod:/data:ro \
        -v "${BACKUP_DIR}:/backup" \
        alpine tar -czf "/backup/safaqat_media_${TIMESTAMP}.tar.gz" -C /data .
    chmod 600 "${MEDIA_BACKUP_FILE}"
    echo "✓ تم حفظ الوسائط: ${MEDIA_BACKUP_FILE} ($(du -h "${MEDIA_BACKUP_FILE}" | cut -f1))"
fi

# 3. توليد البصمات المشفرة SHA-256 للتحقق من سلامة النسخ
echo "3. حساب بصمات SHA-256..."
sha256sum "${DB_BACKUP_FILE}" > "${CHECKSUM_FILE}"
if [ -f "${MEDIA_BACKUP_FILE}" ]; then
    sha256sum "${MEDIA_BACKUP_FILE}" >> "${CHECKSUM_FILE}"
fi
echo "✓ تم توليد ملف البصمة: ${CHECKSUM_FILE}"

# 4. تطبيق سياسة الاحتفاظ (حذف النسخ الأقدم من 30 يوماً)
echo "4. تطبيق سياسة الاستبقاء (30 يوماً)..."
find "${BACKUP_DIR}" -name "safaqat_db_*.dump" -mtime +30 -delete
find "${BACKUP_DIR}" -name "safaqat_media_*.tar.gz" -mtime +30 -delete
find "${BACKUP_DIR}" -name "checksums_*.sha256" -mtime +30 -delete

echo "=== [Safaqat] اكتملت عملية النسخ الاحتياطي بنجاح وبأمان تام ==="
