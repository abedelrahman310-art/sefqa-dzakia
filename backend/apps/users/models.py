import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('البريد الإلكتروني مطلوب')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'central_admin')
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('operator', 'متعامل اقتصادي'),
        ('authority', 'مصلحة متعاقدة'),
        ('ordonnateur', 'آمر بالصرف (مصلحة متعاقدة)'),
        ('central_admin', 'إدارة مركزية ورقابة'),
    )

    CENTRAL_ROLE_CHOICES = (
        ('inspector_general', 'المفتش العام'),
        ('inspector', 'مفتش'),
        ('analyst', 'محلل بيانات'),
        ('financial_auditor', 'مراقب مالي'),
        ('system_admin', 'مدير نظام'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField('البريد الإلكتروني', unique=True, db_index=True)
    display_name = models.CharField('الاسم الظاهر', max_length=150, blank=True)
    organization_name = models.CharField('اسم المؤسسة أو المصلحة', max_length=255, blank=True)
    role = models.CharField('الدور الوظيفي', max_length=30, choices=ROLE_CHOICES, default='operator')
    central_role = models.CharField(
        'الدور في الإدارة المركزية',
        max_length=30,
        choices=CENTRAL_ROLE_CHOICES,
        blank=True,
        null=True,
        default=None,
    )
    municipality = models.CharField('البلدية', max_length=100, blank=True, null=True)
    
    is_active = models.BooleanField('مفعل', default=True)
    is_staff = models.BooleanField('موظف إداري', default=False)
    created_at = models.DateTimeField('تاريخ الإنشاء', default=timezone.now)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'مستخدم'
        verbose_name_plural = 'المستخدمون'
        ordering = ['-created_at']

    @property
    def full_name(self):
        return self.display_name or self.email

    def get_full_name(self):
        return self.display_name or self.email

    def get_short_name(self):
        return self.display_name or self.email

    @property
    def company_name(self):
        return self.organization_name

    @property
    def entity_name(self):
        return self.organization_name

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class OperatorProfile(models.Model):
    """
    الملف المهني للمتعامل الاقتصادي.
    يحفظ: القطاع، الولايات المتاحة، القدرة المالية.
    """
    
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="operator_profile",
    )
    
    # القطاع الرئيسي
    sector = models.CharField(
        max_length=20,
        blank=True,
        choices=[
            ("works", "الأشغال العمومية"),
            ("supplies", "اللوازم"),
            ("services", "الخدمات"),
            ("studies", "الدراسات"),
            ("any", "متعدد القطاعات"),
        ],
        default="any",
    )
    
    # الولايات المتاحة (JSON list)
    available_wilayas = models.JSONField(
        default=list,
        blank=True,
        help_text="قائمة رموز الولايات المتاحة (فارغ = كل الولايات)",
    )
    
    # البلدية
    municipality = models.CharField('البلدية', max_length=100, blank=True, null=True)
    
    # القدرة المالية
    max_capacity = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="أقصى مبلغ يمكن للمؤسسة تنفيذه (دج)",
    )
    
    # الخبرة
    years_of_experience = models.PositiveIntegerField(default=0)
    employee_count = models.PositiveIntegerField(default=0)
    
    # بيانات إضافية (الرمز والنشاط والتأهيل)
    extra_data = models.JSONField('بيانات إضافية للمتعامل', default=dict, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "ملف المتعامل الاقتصادي"
        verbose_name_plural = "ملفات المتعاملين الاقتصاديين"
    
    def __str__(self):
        return f"{self.user.email} - {self.get_sector_display()}"

    def validate_documents_for_bid(self, deal=None):
        """
        فحص القفل الوقائي لوثائق المتعامل الاقتصادي قبل إيداع العرض.
        يرفض العرض إذا كانت أي وثيقة أساسية منتهية الصلاحية أو غير موجودة.
        """
        from datetime import date
        today = timezone.now().date()
        
        MANDATORY_DOCS = [
            ('trade_register', 'السجل التجاري'),
            ('tax_clearance', 'شهادة الجباية'),
            ('social_clearance', 'شهادة الضمان الاجتماعي'),
        ]
        
        if deal:
            title = getattr(deal, 'title', '')
            sector = getattr(deal, 'sector', '')
            if 'أشغال' in title or sector == 'works':
                MANDATORY_DOCS.append(('qualification_certificate', 'شهادة التأهيل والتصنيف المهنيين'))

        docs_by_type = {}
        for doc in self.documents.all():
            docs_by_type[doc.document_type] = {
                'name': doc.name or dict(MANDATORY_DOCS).get(doc.document_type, doc.document_type),
                'expiry_date': doc.expiry_date,
                'is_valid': doc.is_valid,
            }
            
        extra = self.extra_data or {}
        extra_docs = extra.get('documents') or extra.get('uploaded_documents') or []
        if isinstance(extra_docs, list):
            for d in extra_docs:
                if isinstance(d, dict):
                    code = d.get('code') or d.get('type') or d.get('document_type')
                    if code and code not in docs_by_type:
                        exp = d.get('expiry_date') or d.get('expiryDate')
                        parsed_exp = None
                        if exp:
                            try:
                                if isinstance(exp, str):
                                    parsed_exp = date.fromisoformat(exp.split('T')[0])
                                elif isinstance(exp, date):
                                    parsed_exp = exp
                            except Exception:
                                pass
                        docs_by_type[code] = {
                            'name': d.get('name') or d.get('title') or dict(MANDATORY_DOCS).get(code, code),
                            'expiry_date': parsed_exp,
                            'is_valid': True,
                        }

        # دعم الحقول المباشرة بالسجل التجاري والضرائب
        if 'trade_register' not in docs_by_type and (extra.get('registrationNumber') or getattr(self.user, 'organization_name', '')):
            exp = extra.get('trade_register_expiry')
            parsed_exp = None
            if exp:
                try:
                    parsed_exp = date.fromisoformat(str(exp).split('T')[0])
                except Exception:
                    pass
            docs_by_type['trade_register'] = {
                'name': 'السجل التجاري',
                'expiry_date': parsed_exp,
                'is_valid': True,
            }
        if 'tax_clearance' not in docs_by_type and extra.get('tax_clearance_status') == 'valid':
            docs_by_type['tax_clearance'] = {
                'name': 'شهادة الجباية',
                'expiry_date': None,
                'is_valid': True,
            }
        if 'social_clearance' not in docs_by_type and extra.get('social_clearance_status') == 'valid':
            docs_by_type['social_clearance'] = {
                'name': 'شهادة الضمان الاجتماعي',
                'expiry_date': None,
                'is_valid': True,
            }

        for doc_code, doc_name in MANDATORY_DOCS:
            if doc_code not in docs_by_type:
                return False, f"لا يمكن تقديم العرض. وثيقة {doc_name} غير موجودة. يرجى رفعها في ملف مؤسستك أولاً.", doc_code
                
            doc_info = docs_by_type[doc_code]
            exp_date = doc_info.get('expiry_date')
            if exp_date and exp_date < today:
                return False, f"لا يمكن تقديم العرض. وثيقة {doc_name} منتهية الصلاحية. يرجى تحديثها في ملف مؤسستك أولاً.", doc_code

        return True, "كافة الوثائق الإدارية الأساسية سليمة ومحدثة.", None


class OperatorDocument(models.Model):
    """
    وثائق المتعامل الاقتصادي الإدارية والجبائية مع تاريخ انتهاء الصلاحية.
    """
    DOCUMENT_TYPES = (
        ('trade_register', 'السجل التجاري'),
        ('tax_clearance', 'شهادة الجباية (Extrait de rôle)'),
        ('social_clearance', 'شهادة الضمان الاجتماعي (CNAS / CASNOS)'),
        ('candidacy_declaration', 'التصريح بالترشح'),
        ('probity_declaration', 'التصريح بالنزاهة'),
        ('qualification_certificate', 'شهادة التأهيل والتصنيف المهنيين'),
        ('other', 'وثيقة أخرى'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        OperatorProfile,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='ملف المتعامل',
    )
    document_type = models.CharField('نوع الوثيقة', max_length=50, choices=DOCUMENT_TYPES)
    name = models.CharField('اسم الوثيقة', max_length=255)
    file = models.FileField('ملف الوثيقة', upload_to='operator_docs/%Y/%m/', null=True, blank=True)
    issue_date = models.DateField('تاريخ الإصدار', null=True, blank=True)
    expiry_date = models.DateField('تاريخ انتهاء الصلاحية', null=True, blank=True)
    is_valid = models.BooleanField('سارية المفعول', default=True)
    created_at = models.DateTimeField('تاريخ الرفع', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'وثيقة المتعامل الاقتصادي'
        verbose_name_plural = 'وثائق المتعاملين الاقتصاديين'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_document_type_display()}) - {self.profile.user.email}"



class Notification(models.Model):
    """
    إشعارات وتنبيهات المستخدمين داخل المنصة (جلسات الفتح، قرارات المنح، تطابق الفرص).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='المستخدم',
    )
    title = models.CharField('العنوان', max_length=255)
    text = models.TextField('نص الإشعار')
    is_read = models.BooleanField('هل تمت قراءته', default=False)
    link_href = models.CharField('رابط الإشعار', max_length=255, blank=True, default='')
    notification_type = models.CharField('نوع الإشعار', max_length=50, blank=True, default='update')
    created_at = models.DateTimeField('التاريخ', default=timezone.now)

    class Meta:
        verbose_name = 'إشعار'
        verbose_name_plural = 'الإشعارات'
        ordering = ['-created_at']

    def __str__(self):
        return f"إشعار لـ {self.user.email}: {self.title}"


class ExcludedOperator(models.Model):
    """
    سجل المتعاملين الاقتصاديين المقصيين من الصفقات العمومية (القائمة السوداء)
    وفق أحكام المرسوم الرئاسي 15-247 وأحكام القانون 23-12.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operator_name = models.CharField('اسم الشركة/المؤسسة', max_length=255)
    nif = models.CharField('رقم التعريف الجبائي (NIF)', max_length=30, db_index=True)
    reason = models.TextField('سبب الإقصاء')
    decision_reference = models.CharField('رقم القرار الإداري للإقصاء', max_length=100)
    start_date = models.DateField('تاريخ بداية الإقصاء')
    end_date = models.DateField('تاريخ نهاية الإقصاء', null=True, blank=True, help_text='يمكن تركه فارغاً إذا كان الإقصاء دائماً')
    is_active = models.BooleanField('حالة الإقصاء', default=True)

    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='excluded_operators_created',
        verbose_name='المسؤول المنفذ'
    )
    created_at = models.DateTimeField('تاريخ التسجيل', default=timezone.now)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'متعامل مقصى (القائمة السوداء)'
        verbose_name_plural = 'القائمة السوداء للمتعاملين'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.operator_name} (NIF: {self.nif}) - قرار: {self.decision_reference}"


class Subscription(models.Model):
    """
    اشتراكات وباقات الذكاء الاصطناعي للمتعاملين والمؤسسات
    (Starter, Pro AI, Enterprise).
    """
    PLAN_CHOICES = (
        ('starter', 'الأساسية (Starter)'),
        ('pro', 'المحترفين (Pro AI)'),
        ('enterprise', 'المؤسسات (Enterprise)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='subscriptions',
        verbose_name='المستخدم',
    )
    plan_type = models.CharField(
        'نوع الباقة',
        max_length=20,
        choices=PLAN_CHOICES,
        default='starter',
        db_index=True,
    )
    start_date = models.DateTimeField('تاريخ بداية الاشتراك', default=timezone.now)
    end_date = models.DateTimeField('تاريخ نهاية الاشتراك', null=True, blank=True)
    is_active = models.BooleanField('حالة الاشتراك', default=True, db_index=True)

    created_at = models.DateTimeField('تاريخ الإنشاء', default=timezone.now)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'اشتراك ذكاء اصطناعي'
        verbose_name_plural = 'اشتراكات الذكاء الاصطناعي'
        ordering = ['-start_date', '-created_at']

    def __str__(self):
        return f"اشتراك {self.user.email} - {self.get_plan_type_display()} ({'نشط' if self.is_active else 'غير نشط'})"


class CentralStaffInvitation(models.Model):
    """
    دعوات موظفي الإدارة المركزية والرقابة الوطنية (عين الصقر).
    تتيح للمفتش العام أو مدير النظام إرسال دعوة مشفرة تنتهي بعد 7 أيام
    وفق أحكام القانون 23-12 وقواعد حوكمة صلاحيات الإدارة المركزية.
    """
    STATUS_CHOICES = (
        ('pending', 'معلقة'),
        ('accepted', 'مقبولة'),
        ('expired', 'منتهية الصلاحية'),
        ('revoked', 'ملغاة'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField('البريد الرسمي للموظف', db_index=True)
    full_name = models.CharField('الاسم الكامل', max_length=150)
    role = models.CharField(
        'الدور الوظيفي',
        max_length=30,
        choices=CustomUser.CENTRAL_ROLE_CHOICES,
        default='inspector',
    )
    invited_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_central_invitations',
        verbose_name='المسؤول صاحب الدعوة',
    )
    token = models.UUIDField('رمز التفعيل', default=uuid.uuid4, unique=True, editable=False, db_index=True)
    status = models.CharField('حالة الدعوة', max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    created_at = models.DateTimeField('تاريخ الدعوة', default=timezone.now)
    expires_at = models.DateTimeField('تاريخ انتهاء الصلاحية', null=True, blank=True)

    class Meta:
        verbose_name = 'دعوة موظف إدارة مركزية'
        verbose_name_plural = 'دعوات موظفي الإدارة المركزية'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)

    def is_valid(self):
        if self.status != 'pending':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            self.status = 'expired'
            self.save(update_fields=['status'])
            return False
        return True

    def __str__(self):
        return f"دعوة {self.full_name} ({self.email}) - {self.get_role_display()} [{self.get_status_display()}]"




