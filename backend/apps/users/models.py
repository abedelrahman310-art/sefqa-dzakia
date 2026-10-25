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
        ('central_admin', 'إدارة مركزية ورقابة'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField('البريد الإلكتروني', unique=True, db_index=True)
    display_name = models.CharField('الاسم الظاهر', max_length=150, blank=True)
    organization_name = models.CharField('اسم المؤسسة أو المصلحة', max_length=255, blank=True)
    role = models.CharField('الدور الوظيفي', max_length=30, choices=ROLE_CHOICES, default='operator')
    
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


