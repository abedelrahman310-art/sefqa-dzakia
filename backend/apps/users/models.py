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
