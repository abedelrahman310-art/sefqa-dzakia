from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Subscription

PLANS_DATA = [
    {
        'id': 'starter',
        'name_ar': 'الباقة الأساسية',
        'name_fr': 'Formule Starter',
        'badge_ar': None,
        'badge_fr': None,
        'price_ar': 'مجاناً',
        'price_fr': 'Gratuit',
        'raw_price': 0,
        'period_ar': 'دائم',
        'period_fr': 'Permanent',
        'description_ar': 'الوصول المبدئي لفرص الشراء العمومي مع تقديم العروض التقليدي.',
        'description_fr': 'Accès initial aux opportunités publiques avec soumission standard des offres.',
        'is_popular': False,
        'features_ar': [
            'تصفح كامل الصفقات والإعلانات العمومية المنشورة',
            'إيداع العروض والوثائق الأساسية في المنصة',
            'تنبيهات البريد الإلكتروني القياسية',
            'دعم فني عبر مركز المساعدة',
        ],
        'features_fr': [
            'Consultation complète des marchés et avis publics publiés',
            'Dépôt des offres et documents de base sur la plateforme',
            'Notifications standard par e-mail',
            'Support technique via le centre d’aide',
        ],
        'cta_text_ar': 'البدء مجاناً',
        'cta_text_fr': 'Commencer gratuitement',
    },
    {
        'id': 'pro',
        'name_ar': 'باقة المحترفين AI',
        'name_fr': 'Formule Pro AI',
        'badge_ar': 'الأكثر طلباً',
        'badge_fr': 'Le plus populaire',
        'price_ar': '12,000 دج',
        'price_fr': '12 000 DZD',
        'raw_price': 12000,
        'period_ar': '/ شهرياً',
        'period_fr': '/ mois',
        'description_ar': 'القوة الكاملة للذكاء الاصطناعي السيادي لمضاعفة فرص الفوز وكشف الثغرات.',
        'description_fr': 'Toute la puissance de l’IA souveraine pour maximiser vos chances de gain.',
        'is_popular': True,
        'features_ar': [
            'المساعد القانوني RAG (استشارات غير محدودة وفق القانون 23-12)',
            'وكيل كشف الشذوذ وتحليل الأسعار التنافسية',
            'إشعارات ذكية وفورية لمطابقة الصفقات والقدرات',
            'فحص الامتثال الآلي قبل إيداع العرض لتجنب الإقصاء',
            'تصدير التقارير التحليلية المعتمدة بصيغة PDF',
        ],
        'features_fr': [
            'Assistant juridique RAG illimité (conforme à la loi 23-12)',
            'Agent d’analyse des prix et détection des anomalies',
            'Notifications intelligentes et ciblage sur mesure des marchés',
            'Contrôle automatique de conformité avant soumission de l’offre',
            'Exportation de rapports d’analyse certifiés en PDF',
        ],
        'cta_text_ar': 'اشترك الآن',
        'cta_text_fr': 'S’abonner maintenant',
    },
    {
        'id': 'enterprise',
        'name_ar': 'باقة المؤسسات',
        'name_fr': 'Formule Entreprise',
        'badge_ar': 'حلول سيادية مخصصة',
        'badge_fr': 'Solutions sur mesure',
        'price_ar': 'مخصص',
        'price_fr': 'Sur mesure',
        'raw_price': None,
        'period_ar': '/ سنوياً',
        'period_fr': '/ an',
        'description_ar': 'بنية تحتية متكاملة لربط أنظمة المؤسسة مع أمان مصرفي ومرافقة مخصصة.',
        'description_fr': 'Infrastructure intégrée pour relier les systèmes de l’entreprise avec sécurité maximale.',
        'is_popular': False,
        'features_ar': [
            'ربط برمجي كامل (API Integration) مع أنظمة ERP للمؤسسة',
            'لوحات تحكم ذكاء الأعمال المخصصة ومؤشرات الأداء',
            'مدير حساب استشاري مخصص ومرافقة قانونية ميدانية',
            'اتفاقية مستوى الخدمة (SLA 99.9%) مع دعم على مدار الساعة',
            'تدريب الكوادر وخيارات النشر المحلي (On-Premise / Private Cloud)',
        ],
        'features_fr': [
            'Intégration API complète avec vos systèmes ERP et métiers',
            'Tableaux de bord BI personnalisés et KPI avancés',
            'Gestionnaire de compte dédié et accompagnement juridique',
            'Garantie de disponibilité SLA 99.9% avec support 24/7',
            'Formation des équipes et déploiement cloud privé ou sur site',
        ],
        'cta_text_ar': 'تواصل معنا',
        'cta_text_fr': 'Contacter un conseiller',
    },
]


class SubscriptionPlansView(APIView):
    """
    يعيد بيانات باقات الاشتراك بالذكاء الاصطناعي (Starter, Pro AI, Enterprise)
    باللغتين العربية والفرنسية.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'success': True,
            'plans': PLANS_DATA,
        }, status=status.HTTP_200_OK)


class SubscriptionCheckoutView(APIView):
    """
    محاكاة بوابة الدفع وتفعيل اشتراكات الذكاء الاصطناعي.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        plan_type = request.data.get('plan_type', 'pro')
        valid_plans = ['starter', 'pro', 'enterprise']
        if plan_type not in valid_plans:
            return Response(
                {'success': False, 'message': 'نوع الباقة غير صالح.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user if request.user and request.user.is_authenticated else None

        if user:
            now = timezone.now()
            duration_days = 365 if plan_type == 'enterprise' else (30 if plan_type == 'pro' else None)
            end_date = now + timedelta(days=duration_days) if duration_days else None

            # تعطيل الاشتراكات السابقة إن وُجدت
            Subscription.objects.filter(user=user, is_active=True).update(is_active=False)

            sub = Subscription.objects.create(
                user=user,
                plan_type=plan_type,
                start_date=now,
                end_date=end_date,
                is_active=True,
            )

            return Response({
                'success': True,
                'message': 'تم تفعيل الاشتراك بنجاح (بيئة محاكاة)',
                'subscription_id': str(sub.id),
                'plan_type': sub.plan_type,
                'start_date': sub.start_date.isoformat(),
                'end_date': sub.end_date.isoformat() if sub.end_date else None,
                'checkout_url': f'/operator/overview?subscribed={plan_type}',
                'is_mock': True,
            }, status=status.HTTP_200_OK)

        return Response({
            'success': True,
            'message': 'طلب اشتراك جاهز (محاكاة)',
            'plan_type': plan_type,
            'checkout_url': f'/login?redirect=/pricing&plan={plan_type}',
            'is_mock': True,
        }, status=status.HTTP_200_OK)
