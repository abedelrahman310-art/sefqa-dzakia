"""إعدادات تحقق PostgreSQL المعزولة (BE-03/BE-04).

لا تُستخدم في الإنتاج إطلاقاً. تُفعَّل فقط عبر:
    python -m pytest --ds=safaqat_core.settings_postgres_test ...

المتغيرات المطلوبة:
- BE03_POSTGRES_DB: قاعدة أساس اختبارية يبدأ اسمها بـ safaqat_be03_.
- BE03_POSTGRES_TEST_NAME: قاعدة الاختبار التي ينشئها Django ويحذفها،
  ويجب أن يبدأ اسمها بـ test_safaqat_be03_.
- POSTGRES_USER وPOSTGRES_PASSWORD: بيانات اتصال PostgreSQL.
- BE03_POSTGRES_HOST: افتراضياً localhost.
- BE03_POSTGRES_PORT: افتراضياً 5434 (منفذ Docker التطويري).

لا تُقرأ POSTGRES_HOST/POSTGRES_PORT العامة هنا حتى لا تعتمد الاختبارات
على حالة جلسة طرفية أو على منفذ قاعدة تطوير/إنتاج آخر.

الحمايات:
- اسم قاعدة الأساس يجب أن يبدأ بـ safaqat_be03_.
- اسم قاعدة الاختبار يجب أن يبدأ بـ test_safaqat_be03_.
- الخادم يجب أن يكون محلياً (localhost/127.0.0.1/::1).
وبذلك يُمنع الاتصال بقاعدة إنتاج مهما كانت متغيرات البيئة.
"""

import os

from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F401,F403


def _require(name):
    value = os.environ.get(name)
    if not value:
        raise ImproperlyConfigured(
            f'{name} مطلوب لتشغيل تحقق PostgreSQL المعزول.'
        )
    return value


be03_db = _require('BE03_POSTGRES_DB')
be03_test_db = os.environ.get('BE03_POSTGRES_TEST_NAME', 'test_safaqat_be03_run')
be03_host = os.environ.get('BE03_POSTGRES_HOST', 'localhost')
be03_port = os.environ.get('BE03_POSTGRES_PORT', '5434')

if not be03_db.startswith('safaqat_be03_'):
    raise ImproperlyConfigured(
        'BE-04 يرفض أي قاعدة غير مخصصة (يجب أن يبدأ اسمها بـ safaqat_be03_).'
    )
if not be03_test_db.startswith('test_safaqat_be03_'):
    raise ImproperlyConfigured(
        'BE-04 يرفض أي قاعدة اختبار غير مخصصة '
        '(يجب أن يبدأ اسمها بـ test_safaqat_be03_).'
    )
if be03_host not in ('localhost', '127.0.0.1', '::1'):
    raise ImproperlyConfigured('BE-04 يسمح فقط بخادم PostgreSQL محلي.')
if not be03_port.isdigit():
    raise ImproperlyConfigured('BE03_POSTGRES_PORT يجب أن يكون رقماً.')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': be03_db,
        'USER': _require('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),
        'HOST': be03_host,
        'PORT': be03_port,
        'CONN_MAX_AGE': 0,
        'TEST': {'NAME': be03_test_db},
    }
}
