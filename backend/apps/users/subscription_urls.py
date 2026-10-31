from django.urls import path
from .subscription_views import SubscriptionPlansView, SubscriptionCheckoutView

urlpatterns = [
    path('plans/', SubscriptionPlansView.as_view(), name='subscription_plans'),
    path('plans', SubscriptionPlansView.as_view(), name='subscription_plans_no_slash'),
    path('checkout/', SubscriptionCheckoutView.as_view(), name='subscription_checkout'),
    path('checkout', SubscriptionCheckoutView.as_view(), name='subscription_checkout_no_slash'),
]
