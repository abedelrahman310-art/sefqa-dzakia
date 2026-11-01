from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    LogoutView,
    CurrentUserView,
    RegisterView,
    OperatorProfileView,
    OperatorRecommendedDealsView,
    OperatorCheckComplianceView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('register', RegisterView.as_view(), name='auth_register_no_slash'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('login', LoginView.as_view(), name='auth_login_no_slash'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('operator/profile/', OperatorProfileView.as_view(), name='auth_operator_profile'),
    path('operator/profile', OperatorProfileView.as_view(), name='auth_operator_profile_no_slash'),
    path('operator/recommended-deals/', OperatorRecommendedDealsView.as_view(), name='auth_operator_recommended_deals'),
    path('operator/recommended-deals', OperatorRecommendedDealsView.as_view(), name='auth_operator_recommended_deals_no_slash'),
    path('operator/check-compliance/', OperatorCheckComplianceView.as_view(), name='auth_operator_check_compliance'),
    path('operator/check-compliance', OperatorCheckComplianceView.as_view(), name='auth_operator_check_compliance_no_slash'),
]
