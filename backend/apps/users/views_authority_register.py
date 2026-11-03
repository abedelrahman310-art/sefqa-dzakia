import logging
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.users.models import CustomUser, Notification
from apps.procurements.models import Authority
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """استخراج عنوان IP لتسجيله في سجل التدقيق الموثق"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class AuthoritySelfRegistrationView(views.APIView):
    """
    نظام التسجيل الذاتي للمصالح المتعاقدة (الهيئات العمومية والآمر بالصرف):
    POST /api/auth/register/authority/
    - permission_classes = [] (عام للجميع)
    - parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    الخطوات:
    1. التحقق من صحة البيانات وعدم تكرار البريد.
    2. إنشاء مستخدم جديد (role='ordonnateur').
    3. إنشاء كائن Authority بحالة 'pending_approval' وربطه بالمستخدم.
    4. تسجيل العملية في سجل التدقيق المحصن AuditLog وفق أحكام القانون 23-12.
    5. إشعار مسؤولي الإدارة المركزية (عين الصقر) للمراجعة والاعتماد.
    6. إرجاع رسالة تأكيد تفيد بأن الحساب "قيد المراجعة والاعتماد".
    """
    permission_classes = []
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        data = request.data or {}

        email = (data.get('email') or data.get('ordonnateur_email') or '').strip().lower()
        password = data.get('password') or ''
        name = (data.get('name') or data.get('organization_name') or data.get('company') or '').strip()
        wilaya = (data.get('wilaya') or data.get('municipality') or '').strip()
        entity_type = (data.get('entity_type') or 'public_institution').strip()

        ordonnateur_name = (
            data.get('ordonnateur_name')
            or data.get('fullName')
            or data.get('appointedName')
            or name
        ).strip()
        ordonnateur_title = (data.get('ordonnateur_title') or data.get('title') or '').strip()
        ordonnateur_phone = (data.get('ordonnateur_phone') or data.get('phone') or '').strip()

        # الملفات المرفقة
        appointment_proof = request.FILES.get('appointment_proof')
        logo = request.FILES.get('logo')

        # 1. التحقق من المدخلات الإلزامية
        if not email or '@' not in email:
            return Response(
                {'error': 'البريد الإلكتروني الرسمي للمصلحة أو الآمر بالصرف مطلوب وغير صالح.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password:
            return Response({'error': 'كلمة المرور مطلوبة.'}, status=status.HTTP_400_BAD_REQUEST)

        if not name:
            return Response({'error': 'اسم المصلحة المتعاقدة أو الهيئة مطلوب إلزامياً.'}, status=status.HTTP_400_BAD_REQUEST)

        # التحقق من عدم وجود حساب سابق بهذا البريد
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {'error': 'يوجد بالفعل حساب مسجل بهذا البريد الإلكتروني في المنصة.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # التحقق من معايير كلمة المرور
        try:
            validate_password(password)
        except ValidationError as e:
            return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        # 2. إنشاء المستخدم الجديد (role='ordonnateur')
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            role='ordonnateur',
            display_name=ordonnateur_name,
            organization_name=name,
            municipality=wilaya,
            is_active=True,
            is_staff=False,
        )

        # 3. إنشاء كائن Authority بحالة 'pending_approval' وربطه بالمستخدم
        authority = Authority.objects.create(
            name=name,
            wilaya=wilaya,
            entity_type=entity_type,
            user=user,
            status='pending_approval',
            ordonnateur_name=ordonnateur_name,
            ordonnateur_title=ordonnateur_title,
            ordonnateur_email=email,
            ordonnateur_phone=ordonnateur_phone,
            appointment_proof=appointment_proof,
            logo=logo,
        )

        # 4. تسجيل العملية في سجل التدقيق AuditLog
        try:
            AuditLog.objects.create(
                user=user,
                action='authority_self_registration',
                resource_type='Authority',
                resource_id=str(authority.id),
                description=f'طلب تسجيل ذاتي لمصلحة متعاقدة جديدة: {name} (الآمر بالصرف: {ordonnateur_name} - ولاية: {wilaya}) - الحالة: قيد المراجعة',
                changes={
                    'name': name,
                    'wilaya': wilaya,
                    'email': email,
                    'status': 'pending_approval',
                    'ordonnateur_name': ordonnateur_name,
                },
                ip_address=get_client_ip(request),
            )
        except Exception as e:
            logger.warning(f"Could not write audit log for authority self-registration: {e}")

        # 5. إشعار مسؤولي الإدارة المركزية (عين الصقر)
        try:
            central_admins = CustomUser.objects.filter(role='central_admin')[:5]
            for admin_user in central_admins:
                Notification.objects.create(
                    user=admin_user,
                    title='طلب اعتماد مصلحة متعاقدة جديدة',
                    text=f'تم إيداع ملف تسجيل جديد لمصلحة "{name}" (ولاية {wilaya}) من قبل الآمر بالصرف {ordonnateur_name}، وهو بانتظار الاعتماد الرسمي.',
                    link_href='/central/authorities',
                    notification_type='system',
                )
        except Exception as e:
            logger.warning(f"Could not send notifications for authority self-registration: {e}")

        # 6. إرجاع رسالة "قيد المراجعة"
        return Response({
            'message': 'تم استلام طلب تسجيل المصلحة المتعاقدة بنجاح. الحساب حالياً قيد المراجعة والتدقيق الإداري من قبل الإدارة المركزية (عين الصقر)، وسيتم إشعاركم فور اعتماده رسمياً.',
            'status': 'pending_approval',
            'authority_id': str(authority.id),
            'authority_name': authority.name,
            'email': user.email,
        }, status=status.HTTP_201_CREATED)
