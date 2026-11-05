import uuid
import logging
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import views, status, permissions
from rest_framework.response import Response

from apps.users.models import CustomUser, CentralStaffInvitation
from apps.users.permissions import IsInspectorGeneral, CanIssueInjunctions, CanViewFinancials
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """استخراج عنوان IP الحقيقي للطلب لتضمينه في سجل التدقيق الموثق"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def build_invite_url(token, request=None):
    """
    بناء رابط التفعيل الرسمي للموظف.
    يستخدم متغير البيئة FRONTEND_URL إن وجد، أو الرابط الافتراضي للإنتاج / المنصة.
    """
    frontend_base = getattr(settings, 'FRONTEND_URL', None) or 'https://safaqat-frontend.onrender.com'
    if request:
        origin = request.headers.get('origin') or request.headers.get('referer')
        if origin and ('localhost' in origin or '127.0.0.1' in origin):
            frontend_base = origin.rstrip('/')
    return f"{frontend_base}/central/accept-invite/{token}"


def send_invitation_email(invitation, invite_url):
    """إرسال بريد تفعيل الحساب ثنائي اللغة (عربي/فرنسي)"""
    subject = f"دعوة انضمام لبوابة الإدارة المركزية والرقابة — منصة صفقات ذكية"
    
    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #006233; padding-bottom: 12px; margin-bottom: 16px;">
        <h3 style="color: #006233; margin: 0;">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
        <h4 style="color: #475569; margin: 4px 0 0 0;">المفتشية العامة للصفقات العمومية · منصة صفقات ذكية</h4>
      </div>
      
      <p style="font-size: 15px;">السيد(ة) المحترم(ة): <strong>{invitation.full_name}</strong>،</p>
      
      <p style="font-size: 14px; line-height: 1.6;">
        تمت دعوتكم رسمياً للانضمام إلى فريق عمل <strong>بوابة الإدارة المركزية والرقابة</strong> وفق أحكام القانون رقم 23-12، وذلك بالدور والصلاحيات الرقابية التالية:
      </p>
      
      <div style="margin: 16px 0; padding: 12px 18px; background-color: #f1f5f9; border-inline-start: 4px solid #006233; border-radius: 4px;">
        <span style="font-size: 13px; color: #64748b; display: block;">الدور الوظيفي الممنوح:</span>
        <strong style="font-size: 16px; color: #0f172a;">{invitation.get_role_display()} ({invitation.role})</strong>
      </div>

      <p style="font-size: 14px; line-height: 1.6;">
        لتفعيل حسابكم واختيار كلمة المرور الرسمية الخاصة بكم، يرجى النقر على زر التفعيل أدناه:
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="{invite_url}" style="background-color: #006233; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
          تفعيل الحساب وتعيين كلمة المرور
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
        أو انسخ الرابط المباشر التالي إلى متصفحك:<br />
        <a href="{invite_url}" style="color: #0284c7; word-break: break-all;">{invite_url}</a>
      </p>

      <div style="margin-top: 24px; padding: 12px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #991b1b; line-height: 1.5;">
          ⚠️ <strong>تنبيه أمني وقانوني:</strong> هذه الدعوة صالحة لمدة <strong>7 أيام</strong> وتنتهي صلاحيتها تلقائياً. إذا لم تكن أنت المعني بهذه الدعوة، يرجى تجاهل هذا البريد وإبلاغ مسؤول النظام فوراً.
        </p>
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      
      <div dir="ltr" style="font-size: 12px; color: #64748b; line-height: 1.5;">
        <p><strong>Invitation Officielle — Portail de Contrôle Central (Safaqat Dhakia)</strong></p>
        <p>Vous avez été invité à rejoindre la Plateforme Nationale des Marchés Publics en tant que : <strong>{invitation.get_role_display()}</strong>.</p>
        <p>Lien d'activation : <a href="{invite_url}" style="color: #0284c7;">{invite_url}</a> (Valide 7 jours).</p>
      </div>
    </div>
    """

    plain_message = f"""
الجمهورية الجزائرية الديمقراطية الشعبية
منصة صفقات ذكية — فضاء الإدارة المركزية والرقابة

السيد(ة) المحترم(ة): {invitation.full_name}
تمت دعوتكم للانضمام إلى بوابة الإدارة المركزية بالدور: {invitation.get_role_display()}.
لتفعيل الحساب وتعيين كلمة المرور، يرجى زيارة الرابط التالي (صالح لمدة 7 أيام):
{invite_url}

إذا لم تطلب هذه الدعوة، يرجى تجاهل هذه الرسالة.
    """

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@safaqat.gov.dz')
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[invitation.email],
            html_message=html_content,
            fail_silently=True,
        )
        logger.info(f"Invitation email dispatched successfully to {invitation.email}")
    except Exception as e:
        logger.warning(f"Could not dispatch email to {invitation.email}: {e}")


class CentralStaffListView(views.APIView):
    """
    استعراض قائمة الموظفين الحاليين والدعوات المعلقة في الإدارة المركزية:
    GET /api/central/staff/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_staff and getattr(user, 'role', None) != 'central_admin' and not user.is_superuser:
            return Response(
                {'error': 'استعراض موظفي الإدارة المركزية مقصور على المشرفين والمفتشية العامة.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 1. قائمة الموظفين الفعليين الحاليين
        staff_qs = CustomUser.objects.filter(
            role='central_admin'
        ).order_by('-created_at')

        staff_list = []
        for u in staff_qs:
            role_key = u.central_role or 'system_admin'
            # جلب الاسم المقروء للدور
            role_dict = dict(CustomUser.CENTRAL_ROLE_CHOICES)
            role_display = role_dict.get(role_key, role_key)

            staff_list.append({
                'id': str(u.id),
                'email': u.email,
                'full_name': u.display_name or u.email,
                'role': role_key,
                'role_display': role_display,
                'is_active': u.is_active,
                'is_staff': u.is_staff,
                'is_superuser': u.is_superuser,
                'last_login': u.last_login.isoformat() if u.last_login else None,
                'created_at': u.created_at.isoformat() if hasattr(u, 'created_at') and u.created_at else None,
            })

        # 2. قائمة الدعوات المعلقة والسابقة
        invitations_qs = CentralStaffInvitation.objects.all().select_related('invited_by').order_by('-created_at')
        invitations_list = []
        for inv in invitations_qs:
            # تحديث الصلاحية إن انتهت
            inv.is_valid()
            role_dict = dict(CustomUser.CENTRAL_ROLE_CHOICES)
            invitations_list.append({
                'id': str(inv.id),
                'email': inv.email,
                'full_name': inv.full_name,
                'role': inv.role,
                'role_display': role_dict.get(inv.role, inv.role),
                'status': inv.status,
                'status_display': inv.get_status_display(),
                'invited_by_name': inv.invited_by.display_name if inv.invited_by else None,
                'created_at': inv.created_at.isoformat() if inv.created_at else None,
                'expires_at': inv.expires_at.isoformat() if inv.expires_at else None,
                'is_valid': inv.status == 'pending' and (not inv.expires_at or timezone.now() < inv.expires_at),
                'invite_url': build_invite_url(inv.token, request),
            })

        can_manage = bool(
            user.is_superuser
            or getattr(user, 'central_role', None) in ['inspector_general', 'system_admin']
            or (getattr(user, 'central_role', None) is None and user.is_staff)
        )

        return Response({
            'can_manage': can_manage,
            'staff': staff_list,
            'invitations': invitations_list,
            'total_staff': len(staff_list),
            'active_staff': sum(1 for s in staff_list if s['is_active']),
            'pending_invitations': sum(1 for inv in invitations_list if inv['status'] == 'pending'),
        })


class CentralStaffInviteView(views.APIView):
    """
    إنشاء دعوة موظف جديد وإرسال بريد إلكتروني رسمي:
    POST /api/central/staff/invite/
    """
    permission_classes = [IsInspectorGeneral]

    def post(self, request):
        data = request.data or {}
        email = (data.get('email') or '').strip().lower()
        full_name = (data.get('full_name') or '').strip()
        role = (data.get('role') or 'inspector').strip()

        if not email or '@' not in email:
            return Response({'error': 'البريد الإلكتروني الرسمي مطلوب وغير صحيح.'}, status=status.HTTP_400_BAD_REQUEST)

        if not full_name:
            return Response({'error': 'الاسم الكامل للموظف مطلوب إلزامياً.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_roles = [c[0] for c in CustomUser.CENTRAL_ROLE_CHOICES]
        if role not in valid_roles:
            return Response(
                {'error': f'الدور المحدد غير صالح. الأدوار المتاحة: {", ".join(valid_roles)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # التحقق إن كان الموظف مسجلاً بالفعل
        existing_user = CustomUser.objects.filter(email=email).first()
        if existing_user and existing_user.role == 'central_admin' and existing_user.is_active:
            return Response(
                {'error': 'يوجد بالفعل موظف نشط بهذا البريد الإلكتروني في الإدارة المركزية.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # التحقق من وجود دعوة معلقة سابقة
        pending_inv = CentralStaffInvitation.objects.filter(email=email, status='pending').first()
        if pending_inv and pending_inv.is_valid():
            # تحديث الصلاحية لـ 7 أيام جديدة وإعادة إرسال الرابط
            pending_inv.full_name = full_name
            pending_inv.role = role
            pending_inv.invited_by = request.user
            pending_inv.expires_at = timezone.now() + timezone.timedelta(days=7)
            pending_inv.save()
            invitation = pending_inv
        else:
            invitation = CentralStaffInvitation.objects.create(
                email=email,
                full_name=full_name,
                role=role,
                invited_by=request.user,
                expires_at=timezone.now() + timezone.timedelta(days=7),
            )

        invite_url = build_invite_url(invitation.token, request)

        # إرسال البريد الإلكتروني
        send_invitation_email(invitation, invite_url)

        # تسجيل العملية في سجل التدقيق غير القابل للتعديل
        AuditLog.objects.create(
            user=request.user,
            action='invited_central_staff',
            resource_type='CentralStaffInvitation',
            resource_id=str(invitation.id),
            description=f'تم إصدار دعوة انضمام رسمية لموظف جديد في الإدارة المركزية: {full_name} ({email}) بالدور: {invitation.get_role_display()}',
            changes={
                'email': email,
                'full_name': full_name,
                'role': role,
                'expires_at': invitation.expires_at.isoformat(),
            },
            ip_address=get_client_ip(request),
        )

        return Response({
            'message': 'تم إنشاء الدعوة بنجاح وإرسال رابط التفعيل إلى البريد الإلكتروني.',
            'invitation': {
                'id': str(invitation.id),
                'email': invitation.email,
                'full_name': invitation.full_name,
                'role': invitation.role,
                'role_display': invitation.get_role_display(),
                'expires_at': invitation.expires_at.isoformat(),
                'invite_url': invite_url,
            }
        }, status=status.HTTP_201_CREATED)


class CentralStaffRevokeToggleView(views.APIView):
    """
    تعطيل / تفعيل حساب موظف، أو إلغاء دعوة معلقة:
    PATCH /api/central/staff/{id}/revoke/
    """
    permission_classes = [IsInspectorGeneral]

    def patch(self, request, pk):
        current_user = request.user
        target_id = str(pk)

        # 1. فحص إذا كان المعرف لمستخدم فعلي (User)
        target_user = CustomUser.objects.filter(pk=target_id).first()
        if target_user:
            # حظر تعطيل الحساب الشخصي
            if str(current_user.id) == str(target_user.id):
                return Response({'error': 'لا يمكنك تعطيل أو تغيير حالة حسابك الشخصي.'}, status=status.HTTP_400_BAD_REQUEST)

            # تحديد الحالة الجديدة مع دعم القيم البوليانية والنصية
            desired_state = request.data.get('is_active')
            if desired_state is not None:
                if isinstance(desired_state, str):
                    new_state = desired_state.strip().lower() in ['true', '1', 'yes', 't']
                else:
                    new_state = bool(desired_state)
            else:
                # إذا لم تحدد، يتم التبديل عكس الحالة الحالية
                new_state = not target_user.is_active

            # التحقق من عدم تعطيل آخر مفتش عام أو مشرف نشط
            if not new_state and (target_user.is_superuser or target_user.central_role == 'inspector_general'):
                active_super_count = CustomUser.objects.filter(
                    role='central_admin',
                    is_active=True
                ).filter(models.Q(is_superuser=True) | models.Q(central_role='inspector_general')).count()
                if active_super_count <= 1:
                    return Response(
                        {'error': 'لا يمكن تعطيل المفتش العام النشط الوحيد لحماية استمرارية النظام.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            target_user.is_active = new_state
            target_user.save(update_fields=['is_active'])

            action_name = 'activate_central_staff' if new_state else 'deactivate_central_staff'
            desc = f'تم {"تفعيل" if new_state else "تعطيل"} حساب الموظف بالإدارة المركزية: {target_user.display_name or target_user.email}'

            AuditLog.objects.create(
                user=current_user,
                action=action_name,
                resource_type='CustomUser',
                resource_id=str(target_user.id),
                description=desc,
                changes={'is_active': new_state, 'email': target_user.email},
                ip_address=get_client_ip(request),
            )

            return Response({
                'message': desc,
                'user': {
                    'id': str(target_user.id),
                    'email': target_user.email,
                    'is_active': target_user.is_active,
                }
            })

        # 2. فحص إذا كان المعرف لدعوة معلقة (Invitation)
        invitation = CentralStaffInvitation.objects.filter(pk=target_id).first()
        if invitation:
            invitation.status = 'revoked'
            invitation.save(update_fields=['status'])

            desc = f'تم إلغاء دعوة الانضمام للموظف: {invitation.full_name} ({invitation.email})'
            AuditLog.objects.create(
                user=current_user,
                action='revoke_central_invitation',
                resource_type='CentralStaffInvitation',
                resource_id=str(invitation.id),
                description=desc,
                changes={'status': 'revoked', 'email': invitation.email},
                ip_address=get_client_ip(request),
            )

            return Response({
                'message': desc,
                'invitation': {
                    'id': str(invitation.id),
                    'status': invitation.status,
                }
            })

        return Response({'error': 'لم يتم العثور على موظف أو دعوة بهذا المعرف.'}, status=status.HTTP_404_NOT_FOUND)


class CentralStaffAcceptInviteView(views.APIView):
    """
    التحقق من رمز الدعوة وقبولها وتعيين كلمة المرور:
    GET  /api/central/staff/accept-invite/{token}/ (فحص صلاحية الرابط وبيانات الموظف)
    POST /api/central/staff/accept-invite/{token}/ (تعيين كلمة المرور وتفعيل الحساب)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            token_uuid = uuid.UUID(str(token))
        except (ValueError, TypeError):
            return Response({'error': 'رمز الدعوة غير صالح أو مشوه.'}, status=status.HTTP_400_BAD_REQUEST)

        invitation = CentralStaffInvitation.objects.filter(token=token_uuid).first()
        if not invitation:
            return Response({'error': 'رابط الدعوة غير موجود أو تم إلغاؤه.'}, status=status.HTTP_404_NOT_FOUND)

        if not invitation.is_valid():
            if invitation.status == 'accepted':
                return Response(
                    {'error': 'تم تفعيل هذا الحساب بالفعل مسبقاً. يمكنك تسجيل الدخول مباشرة.', 'is_already_accepted': True},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if invitation.status == 'expired' or (invitation.expires_at and timezone.now() > invitation.expires_at):
                return Response(
                    {'error': 'انتهت صلاحية رابط الدعوة (أكثر من 7 أيام). يرجى طلب دعوة جديدة من المفتش العام.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {'error': 'هذه الدعوة ملغاة أو غير صالحة.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        role_dict = dict(CustomUser.CENTRAL_ROLE_CHOICES)
        return Response({
            'valid': True,
            'email': invitation.email,
            'full_name': invitation.full_name,
            'role': invitation.role,
            'role_display': role_dict.get(invitation.role, invitation.role),
            'expires_at': invitation.expires_at.isoformat() if invitation.expires_at else None,
        })

    def post(self, request, token):
        try:
            token_uuid = uuid.UUID(str(token))
        except (ValueError, TypeError):
            return Response({'error': 'رمز الدعوة غير صالح أو مشوه.'}, status=status.HTTP_400_BAD_REQUEST)

        invitation = CentralStaffInvitation.objects.filter(token=token_uuid).first()
        if not invitation or not invitation.is_valid():
            return Response(
                {'error': 'رابط الدعوة غير صالح أو منتهي الصلاحية.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data or {}
        password = data.get('password') or ''
        password_confirm = data.get('password_confirm') or ''

        if not password:
            return Response({'error': 'كلمة المرور مطلوبة إلزامياً.'}, status=status.HTTP_400_BAD_REQUEST)

        if password_confirm and password != password_confirm:
            return Response({'error': 'كلمتا المرور غير متطابقتين.'}, status=status.HTTP_400_BAD_REQUEST)

        # التحقق من أمان كلمة المرور عبر معايير Django الرسمية
        try:
            validate_password(password)
        except ValidationError as e:
            return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        # إنشاء أو تحديث حساب المستخدم
        user = CustomUser.objects.filter(email=invitation.email).first()
        if user:
            user.set_password(password)
            user.role = 'central_admin'
            user.central_role = invitation.role
            user.display_name = invitation.full_name
            user.is_active = True
            user.is_staff = True
            user.save()
        else:
            user = CustomUser.objects.create_user(
                email=invitation.email,
                password=password,
                display_name=invitation.full_name,
                role='central_admin',
                central_role=invitation.role,
                is_active=True,
                is_staff=True,
            )

        # تعليم الدعوة بأنها مقبولة
        invitation.status = 'accepted'
        invitation.save(update_fields=['status'])

        # تسجيل العملية في سجل التدقيق
        AuditLog.objects.create(
            user=user,
            action='accept_central_invitation',
            resource_type='CustomUser',
            resource_id=str(user.id),
            description=f'تم قبول دعوة الانضمام وتفعيل حساب موظف الإدارة المركزية: {user.display_name} ({user.email}) بالدور: {invitation.get_role_display()}',
            changes={'email': user.email, 'role': user.role, 'central_role': user.central_role},
            ip_address=get_client_ip(request),
        )

        return Response({
            'message': 'تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول مباشرة إلى فضاء الإدارة المركزية.',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.display_name,
                'role': user.central_role,
            }
        }, status=status.HTTP_200_OK)
