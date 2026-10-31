from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer
from apps.contracts.models import Contract
from apps.execution.models import PaymentSituation

class DashboardMetricsView(APIView):
    """مؤشرات لوحة القيادة والرقابة وفق القانون 23-12 مع عزل صارم لبيانات المصالح المتعاقدة"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'central_admin':
            deals_qs = ProcurementDeal.objects.all()
            bids_qs = BidOffer.objects.all()
            contracts_qs = Contract.objects.all()
            payments_qs = PaymentSituation.objects.filter(status='paid')
        elif getattr(user, 'role', None) == 'authority':
            deals_qs = ProcurementDeal.objects.filter(authority=user)
            bids_qs = BidOffer.objects.filter(deal__authority=user)
            contracts_qs = Contract.objects.filter(deal__authority=user)
            payments_qs = PaymentSituation.objects.filter(contract__deal__authority=user, status='paid')
        elif getattr(user, 'role', None) == 'operator':
            deals_qs = ProcurementDeal.objects.filter(current_stage__gte=3)
            bids_qs = BidOffer.objects.filter(operator=user)
            contracts_qs = Contract.objects.filter(awarded_operator=user)
            payments_qs = PaymentSituation.objects.filter(contract__awarded_operator=user, status='paid')
        else:
            deals_qs = ProcurementDeal.objects.none()
            bids_qs = BidOffer.objects.none()
            contracts_qs = Contract.objects.none()
            payments_qs = PaymentSituation.objects.none()

        total_deals = deals_qs.count()
        total_budget = deals_qs.aggregate(Sum('estimated_budget'))['estimated_budget__sum'] or 0
        total_contracts = contracts_qs.count()
        total_contracted_amount = contracts_qs.aggregate(Sum('signed_amount'))['signed_amount__sum'] or 0

        # Stage distribution
        stages_data = list(deals_qs.values('current_stage').annotate(count=Count('id')).order_by('current_stage'))
        
        # Payment situations aggregated
        total_paid = payments_qs.aggregate(Sum('net_payable_amount'))['net_payable_amount__sum'] or 0

        return Response({
            'total_deals': total_deals,
            'total_budget_dzd': total_budget,
            'total_contracts': total_contracts,
            'total_contracted_amount_dzd': total_contracted_amount,
            'total_paid_dzd': total_paid,
            'stages_distribution': stages_data,
            'total_bids': bids_qs.count(),
        })

class PublicTransparencyView(APIView):
    """إحصائيات الشفافية العامة (متاحة دون إفشاء أسرار تجارية)"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        deals_qs = ProcurementDeal.objects.filter(current_stage__gte=3)
        return Response({
            'published_tenders': deals_qs.count(),
            'total_active': deals_qs.filter(current_stage__lt=12).count(),
            'completed_deals': ProcurementDeal.objects.filter(current_stage=12).count(),
        })
