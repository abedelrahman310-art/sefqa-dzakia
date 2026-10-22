from rest_framework import status, views, permissions
from rest_framework.response import Response
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from rest_framework_simplejwt.tokens import RefreshToken
from apps.audit.models import AuditLog
from .models import CustomUser, OperatorProfile
from .serializers import UserSerializer, LoginSerializer, RegisterSerializer

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
