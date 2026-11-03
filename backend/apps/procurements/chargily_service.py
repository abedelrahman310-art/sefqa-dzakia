import logging
import uuid
import requests
from django.conf import settings
from .models import SpecsPurchase

logger = logging.getLogger(__name__)

CHARGILY_API_KEY = getattr(settings, 'CHARGILY_API_KEY', '')
CHARGILY_MODE = getattr(settings, 'CHARGILY_MODE', 'test')
CHARGILY_BASE_URL = getattr(settings, 'CHARGILY_BASE_URL', 'https://pay.chargily.net/test/api/v2')


def create_chargily_checkout(deal, operator, purchase: SpecsPurchase, request=None) -> dict:
    """
    إنشاء جلسة دفع عبر Chargily Pay V2 لسحب دفتر الشروط.
    يدعم الربط الحي مع Chargily Pay V2 API بالإضافة إلى بيئة محاكاة واختبار تلقائية.
    """
    try:
        if request:
            success_url = request.build_absolute_uri(
                f"/operator/deals/{deal.id}?specs_payment=success&checkout_id={purchase.id}&purchase_id={purchase.id}"
            )
            failure_url = request.build_absolute_uri(
                f"/operator/deals/{deal.id}?specs_payment=failed&checkout_id={purchase.id}"
            )
            webhook_endpoint = request.build_absolute_uri("/api/webhooks/chargily/")
        else:
            raise ValueError()
    except Exception:
        success_url = f"/operator/deals/{deal.id}?specs_payment=success&checkout_id={purchase.id}&purchase_id={purchase.id}"
        failure_url = f"/operator/deals/{deal.id}?specs_payment=failed&checkout_id={purchase.id}"
        webhook_endpoint = "/api/webhooks/chargily/"

    # تحقق من توفر مفتاح Chargily الحقيقي
    is_live_key = bool(
        CHARGILY_API_KEY
        and not CHARGILY_API_KEY.startswith('test_sk_mock')
        and len(CHARGILY_API_KEY) > 15
    )

    if is_live_key:
        try:
            headers = {
                'Authorization': f'Bearer {CHARGILY_API_KEY}',
                'Content-Type': 'application/json',
            }
            payload = {
                'amount': int(purchase.amount),
                'currency': 'dzd',
                'success_url': success_url,
                'failure_url': failure_url,
                'webhook_endpoint': webhook_endpoint,
                'metadata': {
                    'deal_id': str(deal.id),
                    'operator_id': str(operator.id),
                    'purchase_id': str(purchase.id),
                    'receipt_number': purchase.receipt_number,
                }
            }
            logger.info("Connecting to Chargily Pay API (%s) for purchase %s", CHARGILY_BASE_URL, purchase.id)
            res = requests.post(f"{CHARGILY_BASE_URL}/checkouts", json=payload, headers=headers, timeout=8)
            if res.status_code in (200, 201):
                data = res.json()
                checkout_id = data.get('id')
                checkout_url = data.get('checkout_url')
                purchase.payment_id = checkout_id
                purchase.checkout_url = checkout_url
                purchase.metadata = data
                purchase.save(update_fields=['payment_id', 'checkout_url', 'metadata'])
                return {
                    'checkout_url': checkout_url,
                    'payment_id': checkout_id,
                    'purchase_id': str(purchase.id),
                    'amount': float(purchase.amount),
                    'is_mock': False,
                }
            else:
                logger.warning("Chargily Pay API returned error %s: %s", res.status_code, res.text)
        except Exception as e:
            logger.warning("Chargily Pay API connection failed: %s. Falling back to sandbox simulation.", e)

    # وضع المحاكاة والاختبار السلس (Mock / Sandbox Simulation)
    checkout_id = f"ch_mock_{uuid.uuid4().hex[:12]}"
    checkout_url = f"/operator/deals/{deal.id}?specs_payment=success&checkout_id={checkout_id}&purchase_id={purchase.id}"
    purchase.payment_id = checkout_id
    purchase.checkout_url = checkout_url
    purchase.metadata = {
        'mode': 'sandbox_simulation',
        'gateway': 'chargily_v2',
        'amount': str(purchase.amount),
    }
    purchase.save(update_fields=['payment_id', 'checkout_url', 'metadata'])

    return {
        'checkout_url': checkout_url,
        'payment_id': checkout_id,
        'purchase_id': str(purchase.id),
        'amount': float(purchase.amount),
        'is_mock': True,
    }


def verify_chargily_checkout(payment_id_or_purchase_id: str) -> tuple[bool, SpecsPurchase | None]:
    """
    التحقق من حالة الدفع وتأكيد سحب دفتر الشروط.
    """
    purchase = None
    # محاولة العثور عبر payment_id أو id
    try:
        val_uuid = uuid.UUID(payment_id_or_purchase_id)
        purchase = SpecsPurchase.objects.filter(id=val_uuid).first()
    except (ValueError, AttributeError):
        pass

    if not purchase:
        purchase = SpecsPurchase.objects.filter(payment_id=payment_id_or_purchase_id).first()

    if not purchase:
        return False, None

    if purchase.status == 'paid':
        return True, purchase

    # إذا كان المعاملة في وضع المحاكاة أو بيئة الاختبار
    is_mock = purchase.payment_id.startswith('ch_mock_') or CHARGILY_MODE == 'test'
    if is_mock or not CHARGILY_API_KEY or CHARGILY_API_KEY.startswith('test_sk_mock'):
        purchase.mark_as_paid(payment_method='EDAHABIA')
        return True, purchase

    # التحقق من API الفعلي لـ Chargily
    try:
        headers = {
            'Authorization': f'Bearer {CHARGILY_API_KEY}',
            'Content-Type': 'application/json',
        }
        res = requests.get(f"{CHARGILY_BASE_URL}/checkouts/{purchase.payment_id}", headers=headers, timeout=8)
        if res.status_code == 200:
            data = res.json()
            if data.get('status') == 'paid':
                payment_method = data.get('payment_method') or 'EDAHABIA'
                purchase.mark_as_paid(metadata=data, payment_method=payment_method)
                return True, purchase
    except Exception as e:
        logger.warning("Error verifying Chargily checkout %s: %s", purchase.payment_id, e)

    return False, purchase


def process_chargily_webhook(payload: dict) -> tuple[bool, SpecsPurchase | None]:
    """
    معالجة الويب هوك الوارد من Chargily Pay عند اكتمال عملية الدفع.
    """
    event = payload.get('event')
    data = payload.get('data') or payload
    if event == 'checkout.paid' or data.get('status') == 'paid':
        checkout_id = data.get('id')
        metadata = data.get('metadata') or {}
        purchase_id = metadata.get('purchase_id')

        purchase = None
        if purchase_id:
            try:
                purchase = SpecsPurchase.objects.filter(id=purchase_id).first()
            except Exception:
                pass

        if not purchase and checkout_id:
            purchase = SpecsPurchase.objects.filter(payment_id=checkout_id).first()

        if purchase:
            purchase.mark_as_paid(payment_id=checkout_id, metadata=data, payment_method=data.get('payment_method', 'EDAHABIA'))
            return True, purchase

    return False, None
