import logging
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, FileResponse
from rest_framework import views, status, permissions
from rest_framework.response import Response

from apps.audit.models import AuditLog
from .models import ProcurementDeal, SpecsPurchase
from .chargily_service import (
    create_chargily_checkout,
    verify_chargily_checkout,
    process_chargily_webhook,
)
from .pdf_service import generate_cahier_specs_pdf, generate_specs_withdrawal_receipt_pdf

logger = logging.getLogger(__name__)


class SpecsCheckoutView(views.APIView):
    """
    إنشاء طلب دفع إلكتروني لسحب دفتر الشروط:
    - POST /api/procurements/deals/{id}/specs/checkout/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk_or_id):
        user = request.user
        deal = None
        try:
            deal = ProcurementDeal.objects.filter(pk=pk_or_id).first()
        except Exception:
            pass
        if not deal:
            deal = ProcurementDeal.objects.filter(reference_number=pk_or_id).first()
        if not deal:
            return Response({'error': 'الصفقة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)

        # 1. إذا كان المتعامل قد دفع مسبقاً، نوفر له الروابط مباشرة
        existing = SpecsPurchase.objects.filter(deal=deal, operator=user, status='paid').first()
        if existing:
            return Response({
                'already_paid': True,
                'status': 'paid',
                'receipt_number': existing.receipt_number,
                'download_url': f"/api/procurements/specs/download/{existing.receipt_number}/",
                'receipt_url': f"/api/procurements/specs/receipt/{existing.receipt_number}/",
                'message': 'لقد قمت بسحب دفتر الشروط مسبقاً.',
            }, status=status.HTTP_200_OK)

        # 2. إذا كان دفتر الشروط مجانياً (السعر 0)
        if deal.is_specs_free:
            purchase = SpecsPurchase.objects.create(
                deal=deal,
                operator=user,
                amount=deal.specs_price or 0,
                status='pending',
                payment_method='FREE',
            )
            purchase.mark_as_paid(payment_method='FREE')
            return Response({
                'is_free': True,
                'status': 'paid',
                'receipt_number': purchase.receipt_number,
                'download_url': f"/api/procurements/specs/download/{purchase.receipt_number}/",
                'receipt_url': f"/api/procurements/specs/receipt/{purchase.receipt_number}/",
                'message': 'تم سحب دفتر الشروط المجاني بنجاح.',
            }, status=status.HTTP_200_OK)

        # 3. إنشاء سجل عملية الشراء والربط مع Chargily Pay
        purchase = SpecsPurchase.objects.create(
            deal=deal,
            operator=user,
            amount=deal.specs_price,
            payment_gateway='chargily',
            status='pending',
            payment_method='EDAHABIA',
        )

        checkout_info = create_chargily_checkout(deal, user, purchase, request=request)

        return Response({
            'already_paid': False,
            'status': 'pending',
            'purchase_id': str(purchase.id),
            'payment_id': checkout_info['payment_id'],
            'checkout_url': checkout_info['checkout_url'],
            'amount': float(purchase.amount),
            'currency': 'DZD',
            'is_mock': checkout_info.get('is_mock', False),
            'message': 'تم إنشاء جلسة الدفع بنجاح. يرجى المتابعة لإتمام الدفع.',
        }, status=status.HTTP_201_CREATED)


class SpecsVerifyView(views.APIView):
    """
    التحقق من حالة الدفع وتأكيد سحب دفتر الشروط:
    - GET /api/procurements/specs/purchase/{payment_id}/verify/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, payment_id):
        success, purchase = verify_chargily_checkout(payment_id)
        if not purchase:
            return Response({'error': 'لم يتم العثور على معاملة سحب دفتر الشروط المطابقة.'}, status=status.HTTP_404_NOT_FOUND)

        if success and purchase.status == 'paid':
            return Response({
                'status': 'paid',
                'purchase_id': str(purchase.id),
                'receipt_number': purchase.receipt_number,
                'amount': float(purchase.amount),
                'paid_at': purchase.paid_at.isoformat() if purchase.paid_at else None,
                'download_url': f"/api/procurements/specs/download/{purchase.receipt_number}/",
                'receipt_url': f"/api/procurements/specs/receipt/{purchase.receipt_number}/",
                'message': 'تم تأكيد الدفع وسحب دفتر الشروط بنجاح.',
            }, status=status.HTTP_200_OK)

        return Response({
            'status': purchase.status,
            'purchase_id': str(purchase.id),
            'message': 'عملية الدفع لا تزال قيد المعالجة أو لم يتم تأكيدها بعد.',
        }, status=status.HTTP_200_OK)


class SpecsDownloadView(views.APIView):
    """
    تحميل دفتر الشروط الرسمي بصيغة PDF بعد التحقق من الدفع وامتلاك الوصل:
    - GET /api/procurements/specs/download/{receipt_number}/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, receipt_number):
        purchase = get_object_or_404(SpecsPurchase, receipt_number=receipt_number, status='paid')
        user = request.user

        # التحقق من الصلاحيات: المشتري، المصلحة، أو مسؤولو النظام
        is_owner = (purchase.operator_id == user.id)
        is_authority = (purchase.deal.authority_id == user.id)
        is_staff = user.is_staff or getattr(user, 'role', None) == 'central_admin'

        if not (is_owner or is_authority or is_staff):
            return Response({'error': 'غير مصرح لك بتحميل دفتر الشروط باستخدام هذا الوصل.'}, status=status.HTTP_403_FORBIDDEN)

        # تسجيل التحميل في سجل التدقيق الجنائي
        AuditLog.objects.create(
            user=user,
            action='SPECS_PDF_DOWNLOADED',
            resource_type='SpecsPurchase',
            resource_id=str(purchase.id),
            description=f"تحميل دفتر الشروط للصفقة {purchase.deal.reference_number} بالوصل {purchase.receipt_number}.",
            changes={
                'receipt_number': purchase.receipt_number,
                'deal_id': str(purchase.deal.id),
            },
        )

        deal = purchase.deal
        # إذا كان هناك ملف PDF مرفوع مسبقاً في CahierSpecs
        if hasattr(deal, 'cahier_specs') and deal.cahier_specs and deal.cahier_specs.file:
            try:
                return FileResponse(deal.cahier_specs.file.open(), content_type='application/pdf')
            except Exception:
                pass

        # توليد دفتر الشروط الذكي رسمياً عبر محرك ReportLab
        try:
            pdf_bytes = generate_cahier_specs_pdf(deal, request.user)
            clean_ref = "".join(c for c in deal.reference_number if c.isalnum() or c in '-_')
            filename = f"Cahier_des_charges_{clean_ref}.pdf"
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            logger.error("Error generating cahier specs pdf: %s", e)
            return Response({'error': 'حدث خطأ أثناء إعداد وتصدير وثيقة دفتر الشروط.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SpecsReceiptView(views.APIView):
    """
    تحميل وصل السحب الرقمي الرسمي (PDF) لدفتر الشروط:
    - GET /api/procurements/specs/receipt/{receipt_number}/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, receipt_number):
        purchase = get_object_or_404(SpecsPurchase, receipt_number=receipt_number, status='paid')
        user = request.user

        is_owner = (purchase.operator_id == user.id)
        is_authority = (purchase.deal.authority_id == user.id)
        is_staff = user.is_staff or getattr(user, 'role', None) == 'central_admin'

        if not (is_owner or is_authority or is_staff):
            return Response({'error': 'غير مصرح لك باستعراض وصل السحب.'}, status=status.HTTP_403_FORBIDDEN)

        if purchase.receipt_pdf:
            try:
                return FileResponse(purchase.receipt_pdf.open(), content_type='application/pdf')
            except Exception:
                pass

        try:
            pdf_bytes = generate_specs_withdrawal_receipt_pdf(purchase, request.user)
            filename = f"Receipt_{purchase.receipt_number}.pdf"
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            logger.error("Error generating specs receipt pdf: %s", e)
            return Response({'error': 'حدث خطأ أثناء توليد وثيقة وصل السحب.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SpecsStatusView(views.APIView):
    """
    الاستعلام عن حالة سحب دفتر الشروط للمتعامل في صفقة معينة:
    - GET /api/procurements/deals/{id}/specs/status/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk_or_id):
        deal = None
        try:
            deal = ProcurementDeal.objects.filter(pk=pk_or_id).first()
        except Exception:
            pass
        if not deal:
            deal = ProcurementDeal.objects.filter(reference_number=pk_or_id).first()
        if not deal:
            return Response({'error': 'الصفقة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)
        user = request.user

        purchase = SpecsPurchase.objects.filter(deal=deal, operator=user, status='paid').first()

        purchase_data = None
        if purchase:
            purchase_data = {
                'id': str(purchase.id),
                'receipt_number': purchase.receipt_number,
                'amount': float(purchase.amount),
                'paid_at': purchase.paid_at.isoformat() if purchase.paid_at else None,
                'payment_method': purchase.payment_method,
                'download_url': f"/api/procurements/specs/download/{purchase.receipt_number}/",
                'receipt_url': f"/api/procurements/specs/receipt/{purchase.receipt_number}/",
            }

        return Response({
            'deal_id': str(deal.id),
            'specs_price': float(deal.specs_price),
            'is_specs_free': deal.is_specs_free,
            'has_purchased': bool(purchase is not None),
            'total_buyers_count': deal.specs_purchases_count,
            'purchase': purchase_data,
        })


class SpecsBuyersListView(views.APIView):
    """
    استعراض سجل سحب دفاتر الشروط (Registre des Retraits) للمصلحة المتعاقدة:
    - GET /api/procurements/deals/{id}/specs/purchases/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk_or_id):
        deal = None
        try:
            deal = ProcurementDeal.objects.filter(pk=pk_or_id).first()
        except Exception:
            pass
        if not deal:
            deal = ProcurementDeal.objects.filter(reference_number=pk_or_id).first()
        if not deal:
            return Response({'error': 'الصفقة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)
        user = request.user

        is_authority = (deal.authority_id == user.id)
        is_staff = user.is_staff or getattr(user, 'role', None) == 'central_admin'

        if not (is_authority or is_staff):
            return Response({'error': 'استعراض سجل سحب دفاتر الشروط مقصور على المصلحة المتعاقدة وهيئات الرقابة.'}, status=status.HTTP_403_FORBIDDEN)

        purchases = deal.specs_purchases.filter(status='paid').select_related('operator').order_by('-paid_at')

        results = []
        for p in purchases:
            op = p.operator
            results.append({
                'id': str(p.id),
                'operator_id': str(op.id),
                'operator_name': getattr(op, 'organization_name', None) or getattr(op, 'full_name', None) or op.email,
                'operator_email': op.email,
                'operator_tax_id': getattr(op, 'tax_id', None) or getattr(op, 'nif', None) or 'غير مسجل',
                'amount': float(p.amount),
                'payment_gateway': p.payment_gateway,
                'payment_method': p.payment_method,
                'payment_id': p.payment_id,
                'receipt_number': p.receipt_number,
                'receipt_url': f"/api/procurements/specs/receipt/{p.receipt_number}/",
                'paid_at': p.paid_at.isoformat() if p.paid_at else p.created_at.isoformat(),
            })

        return Response({
            'deal_id': str(deal.id),
            'deal_reference': deal.reference_number,
            'deal_title': deal.title,
            'specs_price': float(deal.specs_price),
            'total_buyers': len(results),
            'total_revenue': float(deal.total_specs_revenue),
            'buyers': results,
        })


class MySpecsPurchasesView(views.APIView):
    """
    استعراض سجل مشتريات وسحوبات دفاتر الشروط الخاصة بالمتعامل الاقتصادي الحالي:
    - GET /api/procurements/specs/my-purchases/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        purchases = SpecsPurchase.objects.filter(operator=user).select_related('deal', 'deal__authority').order_by('-created_at')

        total_spent = sum(float(p.amount) for p in purchases if p.status == 'paid')
        paid_count = sum(1 for p in purchases if p.status == 'paid')

        results = []
        for p in purchases:
            deal = p.deal
            authority_name = getattr(deal, 'authority_entity', '') or (getattr(deal.authority, 'organization_name', '') or getattr(deal.authority, 'full_name', '') or getattr(deal.authority, 'email', ''))
            results.append({
                'id': str(p.id),
                'deal_id': str(deal.id),
                'deal_reference': deal.reference_number,
                'deal_title': deal.title,
                'deal_wilaya': deal.wilaya,
                'authority_name': authority_name,
                'amount': float(p.amount),
                'payment_gateway': p.payment_gateway,
                'payment_method': p.payment_method,
                'payment_id': p.payment_id,
                'status': p.status,
                'receipt_number': p.receipt_number,
                'created_at': p.created_at.isoformat(),
                'paid_at': p.paid_at.isoformat() if p.paid_at else None,
                'download_url': f"/api/procurements/specs/download/{p.receipt_number}/" if p.status == 'paid' and p.receipt_number else None,
                'receipt_url': f"/api/procurements/specs/receipt/{p.receipt_number}/" if p.status == 'paid' and p.receipt_number else None,
                'deal_url': f"/operator/deals/{deal.id}",
            })

        return Response({
            'total_count': len(results),
            'paid_count': paid_count,
            'total_spent': total_spent,
            'purchases': results,
        })


class ChargilyWebhookView(views.APIView):
    """
    الاستماع إلى إشعارات Webhook الفورية من Chargily Pay:
    - POST /api/webhooks/chargily/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.data
        logger.info("Chargily Webhook received: %s", payload)

        success, purchase = process_chargily_webhook(payload)
        if success and purchase:
            return Response({'success': True, 'purchase_id': str(purchase.id), 'receipt': purchase.receipt_number}, status=status.HTTP_200_OK)

        return Response({'success': False, 'message': 'Event ignored or purchase not found'}, status=status.HTTP_200_OK)
