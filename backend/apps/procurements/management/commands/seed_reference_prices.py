"""بذر أسعار مرجعية تجريبية للمواد الشائعة في الجزائر ووهران.

الاستخدام:
    python manage.py seed_reference_prices
    python manage.py seed_reference_prices --reset
    python manage.py seed_reference_prices --allow-production
"""

from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.procurements.models import ReferencePrice
from apps.procurements.reference_prices import (
    normalize_item_name,
    normalize_wilaya,
)

# (اسم المادة/الخدمة، الوحدة، السعر المرجعي بالدينار)
ALGIERS_REFERENCE_PRICES = [
    ('كيس إسمنت', 'كيس', '600.00'),
    ('حديد التسليح', 'طن', '120000.00'),
    ('رمل البناء', 'م3', '4500.00'),
    ('حصى البناء', 'م3', '5500.00'),
    ('طوب أحمر', 'وحدة', '25.00'),
    ('بلاط سيراميك', 'م2', '1800.00'),
    ('كابل كهربائي', 'متر', '180.00'),
    ('أنبوب PVC', 'متر', '350.00'),
    ('طلاء الجدران', 'لتر', '450.00'),
    ('خشب البناء', 'م3', '45000.00'),
    ('يد عاملة بناء', 'يوم', '3500.00'),
    ('خدمة النقل بالشاحنة', 'رحلة', '15000.00'),
]

ORAN_REFERENCE_PRICES = [
    ('كيس إسمنت', 'كيس', '600.00'),
    ('حديد التسليح', 'طن', '120000.00'),
    ('رمل البناء', 'م3', '4800.00'),
    ('حصى البناء', 'م3', '5800.00'),
    ('طوب أحمر', 'وحدة', '27.00'),
    ('بلاط سيراميك', 'م2', '1900.00'),
    ('كابل كهربائي', 'متر', '185.00'),
    ('أنبوب PVC', 'متر', '360.00'),
    ('طلاء الجدران', 'لتر', '470.00'),
    ('خشب البناء', 'م3', '46500.00'),
    ('يد عاملة بناء', 'يوم', '3300.00'),
    ('خدمة النقل بالشاحنة', 'رحلة', '14000.00'),
]

REFERENCE_PRICES_BY_WILAYA = {
    'الجزائر': ALGIERS_REFERENCE_PRICES,
    'وهران': ORAN_REFERENCE_PRICES,
}


class Command(BaseCommand):
    help = 'بذر أسعار مرجعية تجريبية للمواد الشائعة في ولايتي الجزائر ووهران.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='حذف جميع الأسعار المرجعية الحالية قبل البذر.',
        )
        parser.add_argument(
            '--allow-production',
            action='store_true',
            help='السماح الصريح بالتنفيذ حتى في البيئات الإنتاجية (DEBUG=False).',
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and not options.get('allow_production'):
            raise CommandError(
                'تم رفض التنفيذ: بيئة التشغيل إنتاجية (DEBUG=False). '
                'لا يمكن بذر الأسعار المرجعية إلا بتمرير الراية --allow-production صراحة.'
            )

        if options.get('reset'):
            deleted_count, _ = ReferencePrice.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(
                    f'تم حذف {deleted_count} سعراً مرجعياً سابقاً قبل إعادة البذر.'
                )
            )

        created_count = 0
        updated_count = 0

        for wilaya, rows in REFERENCE_PRICES_BY_WILAYA.items():
            for name, unit, price in rows:
                normalized_name = normalize_item_name(name)
                normalized_wilaya = normalize_wilaya(wilaya)
                _, created = ReferencePrice.objects.update_or_create(
                    normalized_name=normalized_name,
                    normalized_wilaya=normalized_wilaya,
                    defaults={
                        'name': name,
                        'unit': unit,
                        'reference_price': Decimal(price),
                        'wilaya': wilaya,
                    },
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        total_count = ReferencePrice.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                'تم بذر الأسعار المرجعية بنجاح: '
                f'{created_count} سجلاً جديداً، {updated_count} سجلاً محدّثاً، '
                f'المجموع الحالي {total_count} سجلاً.'
            )
        )
