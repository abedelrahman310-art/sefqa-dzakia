from rest_framework import status, views, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from rest_framework_simplejwt.tokens import RefreshToken
import logging
from apps.audit.models import AuditLog
from apps.procurements.models import ProcurementDeal, CahierSpecs
from apps.bids.models import BidOffer
from apps.ai_gateway.services.operator_matcher import (
    _infer_tender_sector,
    _normalize_wilaya,
    _is_wilaya_match,
    SECTOR_KEYWORDS,
    WILAYA_MAP,
)
from .models import CustomUser, OperatorProfile, Notification
from .serializers import (
    UserSerializer,
    LoginSerializer,
    RegisterSerializer,
    NotificationSerializer,
)

logger = logging.getLogger(__name__)

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = data['email']
        password = data['password']
        role = data['role']

        display_name = data.get('fullName') or data.get('name') or email.split('@')[0]
        organization_name = data.get('company') or data.get('name') or display_name

        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            role=role,
            display_name=display_name,
            organization_name=organization_name,
            is_active=True,
        )

        if role == 'operator':
            wilaya = data.get('wilaya')
            available_wilayas = [wilaya] if wilaya else []
            OperatorProfile.objects.create(
                user=user,
                available_wilayas=available_wilayas,
            )

        # التسجيل في سجل التدقيق الرقمي غير القابل للتعديل
        try:
            ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
            if ip and ',' in ip:
                ip = ip.split(',')[0].strip()
            AuditLog.objects.create(
                user=user,
                action='USER_REGISTRATION',
                resource_type='CustomUser',
                resource_id=str(user.id),
                description=f"تسجيل حساب جديد بنجاح: {user.email} بصلاحية {user.get_role_display()}",
                changes={
                    'role': user.role,
                    'organization_name': user.organization_name,
                    'display_name': user.display_name,
                },
                ip_address=ip,
            )
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'تم إنشاء الحساب بنجاح',
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(request, email=email, password=password)
        if not user or not user.is_active:
            return Response(
                {'error': 'البريد الإلكتروني أو كلمة المرور غير صحيحة'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        django_login(request, user)
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })

class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        django_logout(request)
        return Response({'message': 'تم تسجيل الخروج بنجاح'}, status=status.HTTP_200_OK)

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'user': UserSerializer(request.user).data})


class OperatorProfileView(views.APIView):
    """
    مسار /api/operator/profile/ يعيد بيانات المتعامل الحالي (يستخدم request.user)
    ويدعم التحديث والحفظ التلقائي للبيانات والرمز والتأهيل.
    يتطلب مصادقة (IsAuthenticated).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = OperatorProfile.objects.get_or_create(user=user)
        extra = profile.extra_data or {}

        wilaya_code = (
            extra.get('wilayaCode')
            or (profile.available_wilayas[0] if profile.available_wilayas else '')
        )
        main_sector = extra.get('mainSector') or profile.sector or 'construction_public_works'
        activity_codes = extra.get('declaredActivityCodes') or []
        qual_level = extra.get('declaredQualificationLevel') or ''
        qual_sector = extra.get('declaredQualificationSector') or ''

        profile_data = {
            'wilayaCode': str(wilaya_code) if wilaya_code else '',
            'mainSector': main_sector,
            'declaredActivityCodes': activity_codes,
            'declaredQualificationLevel': qual_level,
            'declaredQualificationSector': qual_sector,
            'companyName': user.organization_name or user.display_name or '',
            'displayName': user.display_name or '',
            'email': user.email,
            'maxCapacity': str(profile.max_capacity) if profile.max_capacity else None,
            'yearsOfExperience': profile.years_of_experience,
            'employeeCount': profile.employee_count,
        }

        return Response({
            'profile': profile_data,
            **profile_data,
        })

    def put(self, request):
        return self._save_profile(request)

    def patch(self, request):
        return self._save_profile(request)

    def post(self, request):
        return self._save_profile(request)

    def _save_profile(self, request):
        user = request.user
        profile, _ = OperatorProfile.objects.get_or_create(user=user)
        data = request.data

        wilaya_code = data.get('wilayaCode', '')
        main_sector = data.get('mainSector', '')
        activity_codes = data.get('declaredActivityCodes', [])
        qual_level = data.get('declaredQualificationLevel')
        qual_sector = data.get('declaredQualificationSector')

        if not isinstance(activity_codes, list):
            if isinstance(activity_codes, str):
                activity_codes = [c.strip() for c in activity_codes.split(',') if c.strip()]
            else:
                activity_codes = []

        extra = dict(profile.extra_data or {})
        extra.update({
            'wilayaCode': str(wilaya_code) if wilaya_code else '',
            'mainSector': main_sector,
            'declaredActivityCodes': activity_codes,
            'declaredQualificationLevel': qual_level or '',
            'declaredQualificationSector': qual_sector or '',
        })
        profile.extra_data = extra

        if wilaya_code:
            profile.available_wilayas = [str(wilaya_code)]
        if main_sector and main_sector in dict(profile._meta.get_field('sector').choices):
            profile.sector = main_sector

        profile.save()

        profile_data = {
            'wilayaCode': str(wilaya_code) if wilaya_code else '',
            'mainSector': main_sector,
            'declaredActivityCodes': activity_codes,
            'declaredQualificationLevel': qual_level or '',
            'declaredQualificationSector': qual_sector or '',
            'companyName': user.organization_name or user.display_name or '',
            'displayName': user.display_name or '',
            'email': user.email,
        }

        return Response({
            'message': 'تم تحديث الملف المهني للمتعامل بنجاح',
            'profile': profile_data,
            **profile_data,
        }, status=status.HTTP_200_OK)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    إدارة وعرض الإشعارات الموجهة للمستخدم الحالي وفق الصلاحيات وحماية البيانات.
    يدعم مسار /api/notifications/
    يتطلب مصادقة (IsAuthenticated).
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(user=user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'notifications': serializer.data,
            'results': serializer.data,
            'count': len(serializer.data),
            'unread_count': queryset.filter(is_read=False).count(),
        })

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post', 'patch'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({
            'status': 'success',
            'message': 'تم تعليم الإشعار كمقروء',
            'is_read': True,
        })

    @action(detail=False, methods=['post', 'patch'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated_count = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({
            'status': 'success',
            'message': 'تم تعليم جميع الإشعارات كمقروءة',
            'updated_count': updated_count,
        })


class OperatorRecommendedDealsView(views.APIView):
    """
    وكيل المطابقة (Matcher API) وفق متطلبات Operator 2.0:
    مسار GET /api/operator/recommended-deals/
    - يجلب الصفقات المنشورة (current_stage >= 3)
    - يقارنها بملف المتعامل الاقتصادي (OperatorProfile) للمستخدم الحالي
    - يعيد الصفقات مرتبة بنسبة توافق (Match Score) بناءً على تطابق القطاع (sector) والولاية (wilaya)
    - يوثق العملية في سجل التدقيق AuditLog مع بصمة SHA-256
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = OperatorProfile.objects.get_or_create(user=user)

        # استخراج بيانات القطاع والولاية من ملف المتعامل
        op_sector = (profile.sector or 'any').strip().lower()
        extra = profile.extra_data or {}
        if not op_sector or op_sector == 'any':
            main_sec = extra.get('mainSector') or extra.get('sector')
            if main_sec:
                op_sector = str(main_sec).strip().lower()

        SECTOR_SYNONYMS = {
            'construction_public_works': 'works',
            'building': 'works',
            'fournitures': 'supplies',
            'services': 'services',
            'studies': 'studies',
        }
        op_sector = SECTOR_SYNONYMS.get(op_sector, op_sector)

        op_wilayas = profile.available_wilayas or []
        extra_wilaya = extra.get('wilayaCode') or extra.get('wilaya')
        if extra_wilaya and str(extra_wilaya) not in [str(w) for w in op_wilayas]:
            op_wilayas = list(op_wilayas) + [str(extra_wilaya)]

        # استعلام الصفقات المنشورة (المرحلة 3 فما فوق)
        deals = ProcurementDeal.objects.filter(current_stage__gte=3).select_related('authority')

        scored_deals = []
        for deal in deals:
            # 1. مطابقة القطاع (حتى 50 نقطة)
            tender_sector = _infer_tender_sector(deal)
            sector_matched = False
            if op_sector in ['any', '', 'all', '*']:
                sector_score = 35
                sector_reason = "قطاع مفتوح لجميع التخصصات"
            elif tender_sector and (op_sector == tender_sector or op_sector in tender_sector or tender_sector in op_sector):
                sector_score = 50
                sector_matched = True
                sector_reason = f"تطابق تام في قطاع النشاط ({tender_sector})"
            else:
                deal_text = f"{deal.title} {deal.description}".lower()
                if op_sector in SECTOR_KEYWORDS and any(kw in deal_text for kw in SECTOR_KEYWORDS[op_sector]):
                    sector_score = 50
                    sector_matched = True
                    sector_reason = f"تطابق في الكلمات المفتاحية لقطاع {op_sector}"
                else:
                    sector_score = 10
                    sector_reason = "قطاع مختلف عن نشاط المؤسسة"

            # 2. مطابقة الولاية (حتى 50 نقطة)
            deal_wilaya = deal.wilaya or ""
            wilaya_matched = False
            is_national = False
            if not op_wilayas:
                is_national = True
            else:
                for w in op_wilayas:
                    w_str = str(w).strip().lower()
                    if w_str in ["all", "any", "00", "*", "كل الولايات", "جميع الولايات"]:
                        is_national = True
                        break
                    if _is_wilaya_match(w_str, deal_wilaya):
                        wilaya_matched = True
                        break

            if is_national:
                wilaya_score = 35
                wilaya_reason = "نطاق جغرافي وطني مفتوح"
            elif wilaya_matched:
                wilaya_score = 50
                wilaya_reason = f"تطابق تام في النطاق الجغرافي والولاية ({deal_wilaya})"
            else:
                wilaya_score = 10
                wilaya_reason = f"ولاية الصفقة ({deal_wilaya or 'غير محددة'}) تختلف عن النطاق المفضل للمتعامل"

            total_score = min(100, sector_score + wilaya_score)

            if total_score >= 80:
                match_level = "excellent"
                level_display = "ممتاز"
            elif total_score >= 60:
                match_level = "good"
                level_display = "جيد جداً"
            elif total_score >= 40:
                match_level = "fair"
                level_display = "متوسط"
            else:
                match_level = "low"
                level_display = "منخفض"

            reasons = []
            if sector_matched:
                reasons.append(sector_reason)
            if wilaya_matched:
                reasons.append(wilaya_reason)
            if not reasons:
                reasons.append("صفقة عمومية منشورة متاحة للمشاركة")

            warnings = []
            if not sector_matched and op_sector not in ['any', '', 'all', '*']:
                warnings.append("القطاع قد يتطلب تخصصاً أو رموز نشاط إضافية")
            if not wilaya_matched and not is_national:
                warnings.append("تنفيذ الصفقة خارج الولاية المفضلة لمؤسستك")

            scored_deals.append({
                'id': str(deal.id),
                'deal_id': str(deal.id),
                'reference_number': deal.reference_number,
                'title': deal.title,
                'description': deal.description,
                'authority_name': deal.authority.organization_name or deal.authority.display_name or 'المصلحة المتعاقدة',
                'wilaya': deal.wilaya,
                'estimated_budget': str(deal.estimated_budget) if deal.estimated_budget else None,
                'submission_deadline': deal.submission_deadline.isoformat() if deal.submission_deadline else None,
                'current_stage': deal.current_stage,
                'current_stage_display': deal.get_current_stage_display(),
                'match_score': total_score,
                'match_level': match_level,
                'match_level_display': level_display,
                'sector_match': sector_matched or (op_sector in ['any', '', 'all', '*']),
                'wilaya_match': wilaya_matched or is_national,
                'score_breakdown': {
                    'sector': sector_score,
                    'wilaya': wilaya_score,
                },
                'reasons': reasons,
                'warnings': warnings,
            })

        # ترتيب النتائج تنازلياً بنسبة التوافق (Match Score)
        scored_deals.sort(key=lambda d: d['match_score'], reverse=True)

        # توثيق العملية في سجل التدقيق AuditLog
        try:
            ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
            if ip and ',' in ip:
                ip = ip.split(',')[0].strip()
            AuditLog.objects.create(
                user=user,
                action='OPERATOR_RECOMMENDED_DEALS_QUERIED',
                resource_type='OperatorProfile',
                resource_id=str(user.id),
                description=f"استعلام الصفقات الموصى بها للمتعامل {user.email} مرتبة بنسبة التوافق (عدد الصفقات: {len(scored_deals)})",
                changes={
                    'operator_email': user.email,
                    'deals_count': len(scored_deals),
                    'top_match_score': scored_deals[0]['match_score'] if scored_deals else 0,
                    'op_sector': op_sector,
                    'op_wilayas': op_wilayas,
                },
                ip_address=ip,
            )
        except Exception as exc:
            logger.debug("تعذر تسجيل استعلام المطابقة في التدقيق: %s", exc)

        return Response({
            'deals': scored_deals,
            'results': scored_deals,
            'count': len(scored_deals),
            'operator_criteria': {
                'sector': op_sector,
                'wilayas': op_wilayas,
            }
        }, status=status.HTTP_200_OK)


class OperatorCheckComplianceView(views.APIView):
    """
    وكيل الامتثال (Compliance API) وفق متطلبات Operator 2.0:
    مسار POST /api/operator/check-compliance/
    - يستقبل deal_id
    - يفحص ما إذا كان ملف المتعامل يحتوي على الوثائق الأساسية المطلوبة في الصفقة وفق القانون 23-12
    - يعيد قائمة بالوثائق الناقصة missing_documents
    - يوثق العملية في سجل التدقيق AuditLog مع بصمة SHA-256
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        deal_id = request.data.get('deal_id') or request.data.get('dealId') or request.data.get('deal')
        if not deal_id:
            return Response(
                {'error': 'معرف الصفقة deal_id مطلوب لإجراء فحص الامتثال.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            deal = ProcurementDeal.objects.select_related('authority').get(id=deal_id)
        except (ProcurementDeal.DoesNotExist, ValueError):
            return Response(
                {'error': 'الصفقة المحددة غير موجودة.'},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        profile, _ = OperatorProfile.objects.get_or_create(user=user)
        extra = profile.extra_data or {}

        # الوثائق المسجلة أو المرفوعة مسبقاً لدى المتعامل في ملفه
        # أو المرفقة في أي عرض لهذا المتعامل في هذه الصفقة
        existing_doc_codes = set()

        # 1. من ملف المتعامل extra_data
        for doc_key in ['documents', 'uploaded_documents', 'verified_documents']:
            docs_list = extra.get(doc_key) or []
            if isinstance(docs_list, list):
                for d in docs_list:
                    if isinstance(d, dict) and 'code' in d:
                        existing_doc_codes.add(d['code'])
                    elif isinstance(d, str):
                        existing_doc_codes.add(d)

        # 2. من بيانات المؤسسة الأساسية (السجل التجاري، NIF، شهادات التأهيل)
        if extra.get('registrationNumber') or user.organization_name:
            existing_doc_codes.add('trade_register')
        if extra.get('nif') or extra.get('tax_id'):
            existing_doc_codes.add('tax_id_nif')
        if extra.get('declaredQualificationLevel') or extra.get('declaredQualificationSector'):
            existing_doc_codes.add('qualification_certificate')

        # 3. من أي عرض سابق أو حالي للمتعامل على هذه الصفقة
        existing_offer = BidOffer.objects.filter(deal=deal, operator=user).first()
        if existing_offer:
            for doc in existing_offer.documents.all():
                filename = doc.file.name.lower()
                existing_doc_codes.add('offer_document_file')
                if 'candidacy' in filename or 'ترشح' in filename:
                    existing_doc_codes.add('candidacy_declaration')
                if 'probity' in filename or 'نزاهة' in filename:
                    existing_doc_codes.add('probity_declaration')
                if 'register' in filename or 'rc' in filename or 'سجل' in filename:
                    existing_doc_codes.add('trade_register')
                if 'tax' in filename or 'ضرائب' in filename or 'extrait' in filename:
                    existing_doc_codes.add('tax_clearance')
                if 'cnas' in filename or 'casnos' in filename or 'ضمان' in filename:
                    existing_doc_codes.add('social_clearance')
                if 'technic' in filename or 'تقني' in filename:
                    existing_doc_codes.add('technical_memo')
                if 'financ' in filename or 'مالي' in filename or 'bpu' in filename:
                    existing_doc_codes.add('financial_letter_and_bpu')

        # تحديد الوثائق الإلزامية المطلوبة وفق القانون 23-12
        tender_sector = _infer_tender_sector(deal)
        requires_qualification = (tender_sector in ['works', 'studies'] or 'أشغال' in deal.title or 'دراسة' in deal.title)

        STANDARD_DOCUMENTS = [
            {
                'code': 'candidacy_declaration',
                'name': 'التصريح بالترشح (Déclaration de candidature)',
                'category': 'ملف الترشح',
                'is_mandatory': True,
                'legal_ref': 'المادة 67 من القانون 23-12',
                'description': 'وثيقة رسمية تتضمن معلومات المتعهد وتأكيد أهليته القانونية.',
            },
            {
                'code': 'probity_declaration',
                'name': 'التصريح بالنزاهة (Déclaration de probité)',
                'category': 'ملف الترشح',
                'is_mandatory': True,
                'legal_ref': 'المادة 67 من القانون 23-12',
                'description': 'إقرار كتابي بالالتزام بالنزاهة والشفافية وعدم التورط في أي ممارسات غير قانونية.',
            },
            {
                'code': 'trade_register',
                'name': 'السجل التجاري الإلكتروني (Registre de Commerce)',
                'category': 'الملف القانوني',
                'is_mandatory': True,
                'legal_ref': 'المادة 67 من القانون 23-12',
                'description': 'نسخة حديثة ومطابقة من السجل التجاري تحمل الرمز الإلكتروني QR.',
            },
            {
                'code': 'tax_id_nif',
                'name': 'رقم التعريف الجبائي (NIF)',
                'category': 'الملف الجبائي',
                'is_mandatory': True,
                'legal_ref': 'المادة 67 من القانون 23-12',
                'description': 'شهادة التسجيل في النظام الجبائي الوطني للمؤسسة.',
            },
            {
                'code': 'tax_clearance',
                'name': 'شهادة أداء المستحقات الجبائية (Extrait de rôle مصفى)',
                'category': 'الملف الجبائي',
                'is_mandatory': True,
                'legal_ref': 'المادة 67 من القانون 23-12',
                'description': 'جدول الضرائب مصفى أو جدول تقسيط ساري المفعول بأقل من 3 أشهر.',
            },
            {
                'code': 'social_clearance',
                'name': 'شهادة أداء اشتراكات الضمان الاجتماعي (CNAS / CASNOS)',
                'category': 'الملف شبه الجبائي',
                'is_mandatory': True,
                'legal_ref': 'المادة 67 من القانون 23-12',
                'description': 'شهادة تبرئة ذمة صادرة عن صناديق الضمان الاجتماعي سارية المفعول.',
            },
            {
                'code': 'technical_memo',
                'name': 'المذكرة التقنية التبريرية للمشروع',
                'category': 'العرض التقني',
                'is_mandatory': True,
                'legal_ref': 'المادة 68 من القانون 23-12',
                'description': 'تفصيل الوسائل البشرية والمادية وخطة العمل ومنهجية التنفيذ المقترحة.',
            },
            {
                'code': 'financial_letter_and_bpu',
                'name': 'رسالة التعهد وجدول الأسعار الوحدوية (BPU)',
                'category': 'العرض المالي',
                'is_mandatory': True,
                'legal_ref': 'المادة 68 من القانون 23-12',
                'description': 'تعهد المتعامل بإنجاز موضوع الصفقة مع بيان الأسعار الوحدوية بالأرقام والحروف.',
            },
        ]

        if requires_qualification:
            STANDARD_DOCUMENTS.append({
                'code': 'qualification_certificate',
                'name': 'شهادة التأهيل والتصنيف المهنيين (Certificat de qualification)',
                'category': 'ملف الترشح والقدرات الفنية',
                'is_mandatory': True,
                'legal_ref': 'المادة 67 من القانون 23-12 والمرسوم 15-247',
                'description': 'شهادة رسمية تثبت درجة وتصنيف المؤسسة في قطاع الأشغال العمومية أو البناء.',
            })

        # فحص الوثائق الناقصة والموجودة
        missing_documents = []
        available_documents = []

        for doc in STANDARD_DOCUMENTS:
            if doc['code'] in existing_doc_codes:
                available_documents.append(doc)
            else:
                missing_documents.append(doc)

        total_req = len(STANDARD_DOCUMENTS)
        avail_count = len(available_documents)
        compliance_score = int((avail_count / total_req) * 100) if total_req > 0 else 100
        is_compliant = (len(missing_documents) == 0)

        # التوصيات الإرشادية
        advisory_notes = []
        if is_compliant:
            advisory_notes.append("ملفكم يستوفي كافة الوثائق الأساسية المشترطة قانوناً للمشاركة في هذه الصفقة.")
        else:
            advisory_notes.append(f"تم رصد {len(missing_documents)} وثيقة ناقصة. يرجى استكمالها وإرفاقها قبل انقضاء أجل إيداع العروض.")
            if any(d['code'] == 'qualification_certificate' for d in missing_documents):
                advisory_notes.append("الصفقة تتطلب شهادة تأهيل مهني متخصصة؛ تأكد من حيازتك للدرجة المطلوبة في دفتر الشروط.")

        # توثيق في سجل التدقيق AuditLog
        try:
            ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
            if ip and ',' in ip:
                ip = ip.split(',')[0].strip()
            AuditLog.objects.create(
                user=user,
                action='COMPLIANCE_CHECK_PERFORMED',
                resource_type='ProcurementDeal',
                resource_id=str(deal.id),
                description=f"إجراء فحص الامتثال القانوني للصفقة {deal.reference_number} للمتعامل {user.email} (نسبة الامتثال: {compliance_score}%)",
                changes={
                    'deal_id': str(deal.id),
                    'deal_reference': deal.reference_number,
                    'is_compliant': is_compliant,
                    'compliance_score': compliance_score,
                    'missing_documents_count': len(missing_documents),
                    'missing_codes': [d['code'] for d in missing_documents],
                },
                ip_address=ip,
            )
        except Exception as exc:
            logger.debug("تعذر تسجيل فحص الامتثال في التدقيق: %s", exc)

        return Response({
            'deal_id': str(deal.id),
            'deal_reference': deal.reference_number,
            'deal_title': deal.title,
            'is_compliant': is_compliant,
            'compliance_score': compliance_score,
            'total_required': total_req,
            'submitted_count': avail_count,
            'missing_count': len(missing_documents),
            'missing_documents': missing_documents,
            'available_documents': available_documents,
            'advisory_notes': advisory_notes,
            'submission_deadline': deal.submission_deadline.isoformat() if deal.submission_deadline else None,
        }, status=status.HTTP_200_OK)



