#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# منصة صفقات ذكية — سكربت استرجاع النسخة الاحتياطية لبيئة الإنتاج / بيئة التعافي
# ═══════════════════════════════════════════════════════════════════════════════
# الاستخدام: ./scripts/restore_production.sh /path/to/safaqat_db_YYYYMMDD_HHMMSS.dump [optional_media.tar.gz]

set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "خطأ: مسار ملف قاعدة البيانات مطلوب."
    echo "الاستخدام: $0 <path_to_db_dump> [path_to_media_tar_gz]"
    exit 1
fi

DB_DUMP_FILE="$1"
MEDIA_DUMP_FILE="${2:-}"

if [ ! -f "${DB_DUMP_FILE}" ]; then
    echo "خطأ: الملف ${DB_DUMP_FILE} غير موجود."
    exit 1
fi

echo "⚠️  [تحذير أمني خطير]: هذه العملية ستعيد كتابة قاعدة البيانات الحالية."
read -p "هل أنت متأكد من المتابعة؟ (اكتب YES للاستمرار): " CONFIRM
if [ "${CONFIRM}" != "YES" ]; then
    echo "تم إلغاء الاسترجاع بواسطة المسؤول."
    exit 0
fi

echo "=== [Safaqat] بدء استرجاع قاعدة البيانات ==="

# إيقاف الحاويات المعتمدة مؤقتاً لتجنب تضارب الاتصالات
docker compose -f docker-compose.prod.yml stop backend web

# استرجاع قاعدة بيانات PostgreSQL
cat "${DB_DUMP_FILE}" | docker exec -i safaqat_postgres_prod pg_restore \
    -U "${POSTGRES_USER:-safaqat_user}" \
    -d "${POSTGRES_DB:-safaqat_db}" \
    --clean --if-exists -v

# استرجاع الوسائط في حال تم تزويد الملف
if [ -n "${MEDIA_DUMP_FILE}" ] && [ -f "${MEDIA_DUMP_FILE}" ]; then
    echo "=== [Safaqat] استرجاع ملفات الوسائط والوثائق ==="
    docker run --rm \
        -v safaqat_django_media_prod:/data \
        -v "$(dirname "${MEDIA_DUMP_FILE}"):/backup:ro" \
        alpine tar -xzf "/backup/$(basename "${MEDIA_DUMP_FILE}")" -C /data
fi

# إعادة تشغيل الخدمات
docker compose -f docker-compose.prod.yml start backend web

echo "=== [Safaqat] تم استرجاع النظام بنجاح وتعمل كافة الخدمات حالياً ==="
