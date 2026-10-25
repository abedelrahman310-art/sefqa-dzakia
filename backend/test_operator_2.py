import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safaqat_core.settings')
django.setup()

import uuid
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import CustomUser, OperatorProfile, Notification
from apps.procurements.models import ProcurementDeal, Contract, Milestone
from apps.bids.models import BidOffer
from apps.audit.models import AuditLog

client = APIClient(SERVER_NAME='localhost', HTTP_HOST='localhost')

print("--- STEP 0: Setup test users & profiles ---")
authority, _ = CustomUser.objects.get_or_create(
    email="authority_test@safaqat.dz",
    defaults={
        "role": "authority",
        "display_name": "المصلحة المتعاقدة للتجارب",
        "organization_name": "مديرية التجهيزات العمومية",
        "is_active": True,
    }
)
authority.set_password("Safaqat@2026")
authority.save()

operator, _ = CustomUser.objects.get_or_create(
    email="operator_test2@safaqat.dz",
    defaults={
        "role": "operator",
        "display_name": "مؤسسة الأمل للأشغال",
        "organization_name": "مؤسسة الأمل للري والبناء",
        "is_active": True,
    }
)
operator.set_password("Safaqat@2026")
operator.save()

profile, _ = OperatorProfile.objects.get_or_create(user=operator)
profile.sector = "works"
profile.available_wilayas = ["16", "الجزائر"]
profile.max_capacity = Decimal("50000000.00")
profile.extra_data = {
    "mainSector": "works",
    "wilayaCode": "16",
    "registrationNumber": "RC-16-9999",
    "nif": "009912345678901",
    "declaredQualificationLevel": "الدرجة الرابعة",
    "declaredQualificationSector": "أشغال عمومية وبناء",
}
profile.save()

# Create 2 published deals
deal_matching = ProcurementDeal.objects.create(
    reference_number=f"TEST-OP2-MATCH-{uuid.uuid4().hex[:6]}",
    title="مشروع أشغال تهيئة الواجهة البحرية بالجزائر العاصمة",
    description="إنجاز أشغال تهيئة وبناء الأرصفة والإنارة العمومية والخرسانة",
    authority=authority,
    current_stage=3,
    status="PUBLISHED",
    estimated_budget=Decimal("35000000.00"),
    wilaya="الجزائر",
    submission_deadline=timezone.now() + timezone.timedelta(days=20),
)

deal_different = ProcurementDeal.objects.create(
    reference_number=f"TEST-OP2-DIFF-{uuid.uuid4().hex[:6]}",
    title="اقتناء وتوريد أجهزة حواسيب وبرمجيات لإدارة الموارد",
    description="توريد لوازم إعلام آلي وطابعات مكتبية",
    authority=authority,
    current_stage=3,
    status="PUBLISHED",
    estimated_budget=Decimal("8000000.00"),
    wilaya="وهران",
    submission_deadline=timezone.now() + timezone.timedelta(days=15),
)

print(f"Created deals: matching={deal_matching.reference_number}, diff={deal_different.reference_number}")

# Test 1: Matcher API
print("\n--- TEST 1: GET /api/operator/recommended-deals/ ---")
client.force_authenticate(user=operator)
resp1 = client.get('/api/operator/recommended-deals/')
print(f"Status Code: {resp1.status_code}")
data1 = resp1.json()
deals_res = data1.get('deals', [])
print(f"Total Recommended Deals returned: {len(deals_res)}")
assert resp1.status_code == 200, f"Expected 200, got {resp1.status_code}"
assert len(deals_res) >= 2, "Expected at least 2 deals returned"

# Check ordering by match_score descending
scores = [d['match_score'] for d in deals_res]
print(f"Match Scores: {scores}")
assert scores == sorted(scores, reverse=True), "Deals must be sorted by match_score descending"

# Find our matching and different deals
match_item = next((d for d in deals_res if d['id'] == str(deal_matching.id)), None)
diff_item = next((d for d in deals_res if d['id'] == str(deal_different.id)), None)
assert match_item is not None, "Matching deal should be in recommended deals"
assert diff_item is not None, "Different deal should be in recommended deals"
print(f"Matching Deal Score: {match_item['match_score']} (Sector match: {match_item['sector_match']}, Wilaya match: {match_item['wilaya_match']})")
print(f"Different Deal Score: {diff_item['match_score']} (Sector match: {diff_item['sector_match']}, Wilaya match: {diff_item['wilaya_match']})")
assert match_item['match_score'] > diff_item['match_score'], "Matching deal should have a higher score than different deal"

# Check AuditLog for matcher API
audit_matcher = AuditLog.objects.filter(action='OPERATOR_RECOMMENDED_DEALS_QUERIED', user=operator).first()
assert audit_matcher is not None, "AuditLog should record OPERATOR_RECOMMENDED_DEALS_QUERIED"
print(f"AuditLog Matcher Action verified: {audit_matcher.action} - Checksum: {audit_matcher.checksum}")

# Test 2: Compliance API
print("\n--- TEST 2: POST /api/operator/check-compliance/ ---")
resp2 = client.post('/api/operator/check-compliance/', {'deal_id': str(deal_matching.id)}, format='json')
print(f"Status Code: {resp2.status_code}")
data2 = resp2.json()
print(f"Compliance Result: is_compliant={data2.get('is_compliant')}, score={data2.get('compliance_score')}%, missing={data2.get('missing_count')}")
assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}"
assert 'missing_documents' in data2, "Response should contain missing_documents list"
assert 'available_documents' in data2, "Response should contain available_documents list"

missing_codes = [d['code'] for d in data2['missing_documents']]
avail_codes = [d['code'] for d in data2['available_documents']]
print(f"Missing doc codes: {missing_codes}")
print(f"Available doc codes: {avail_codes}")

# trade_register and qualification_certificate should be in available (as they are in operator profile)
assert 'trade_register' in avail_codes, "trade_register should be available from profile"
assert 'qualification_certificate' in avail_codes, "qualification_certificate should be available from profile"
# candidacy_declaration and financial_letter_and_bpu should be in missing (not yet uploaded for this deal)
assert 'candidacy_declaration' in missing_codes, "candidacy_declaration should be in missing_documents"

# Check AuditLog for compliance API
audit_comp = AuditLog.objects.filter(action='COMPLIANCE_CHECK_PERFORMED', user=operator).first()
assert audit_comp is not None, "AuditLog should record COMPLIANCE_CHECK_PERFORMED"
print(f"AuditLog Compliance Action verified: {audit_comp.action} - Checksum: {audit_comp.checksum}")

# Test 3A: Automatic Notification on Deal Publish matching sector
print("\n--- TEST 3A: Notification on Deal Publish ---")
# Clear previous notifications for operator
Notification.objects.filter(user=operator).delete()

# Create a draft deal in stage 2 matching operator's works sector
deal_to_publish = ProcurementDeal.objects.create(
    reference_number=f"TEST-OP2-PUB-{uuid.uuid4().hex[:6]}",
    title="مشروع أشغال بناء مجمع إداري بلدي جديد",
    description="إنجاز أشغال الهيكل الرئيسي والخرسانة والتهيئة العامة",
    authority=authority,
    current_stage=2,
    status="DRAFT",
    estimated_budget=Decimal("40000000.00"),
    wilaya="الجزائر",
    submission_deadline=timezone.now() + timezone.timedelta(days=25),
)

# Call publish action by authority
client.force_authenticate(user=authority)
pub_resp = client.post(f'/api/procurements/deals/{deal_to_publish.id}/publish/')
print(f"Publish Status: {pub_resp.status_code}")
assert pub_resp.status_code == 200, f"Publish failed: {pub_resp.data}"

# Check if notification was created for operator
notif_pub = Notification.objects.filter(user=operator, notification_type='new_opportunity').first()
assert notif_pub is not None, "Notification should be created for matching operator on deal publish"
print(f"Notification 3A Created: Title='{notif_pub.title}', Link='{notif_pub.link_href}'")

# Test 3B: Automatic Notification on Offer Status Change (Evaluation)
print("\n--- TEST 3B: Notification on Offer Status Evaluation ---")
# Operator submits an offer on deal_matching
offer = BidOffer.objects.create(
    deal=deal_matching,
    operator=operator,
    financial_amount=Decimal("32000000.00"),
    status="submitted",
    submission_timestamp=timezone.now(),
)

# Authority evaluates offer and rejects it (or admits it)
client.force_authenticate(user=authority)
eval_resp = client.post(
    f'/api/authority/offers/{offer.id}/evaluate/',
    {
        'status': 'rejected',
        'technical_score': '45.00',
        'financial_score': '0.00',
        'rejection_reason': 'عدم توفير الآليات والمعدات الكافية في المذكرة التقنية',
        'evaluator_notes': 'الملف لا يستوفي الحد الأدنى من النقاط التقنية',
    },
    format='json'
)
print(f"Evaluation Status: {eval_resp.status_code}")
assert eval_resp.status_code == 200, f"Evaluation failed: {eval_resp.data}"

offer.refresh_from_db()
assert offer.status == 'rejected', "Offer status should be updated to rejected"

notif_offer = Notification.objects.filter(user=operator, notification_type='offer_status_change').first()
assert notif_offer is not None, "Notification should be created for operator on offer evaluation"
print(f"Notification 3B Created: Title='{notif_offer.title}', Text='{notif_offer.text}'")

# Test 3C: Automatic Notification on Milestone Added to Deal/Contract
print("\n--- TEST 3C: Notification on Milestone Added ---")
# Create Contract on deal_matching for operator
contract, _ = Contract.objects.get_or_create(
    deal=deal_matching,
    operator=operator,
    defaults={
        'contract_number': 'CTR-2026-TEST-99',
        'status': 'CONTRACT_SIGNED',
        'amount': Decimal('32000000.00'),
    }
)
# Authority creates a milestone on deal_matching
milestone_resp = client.post(
    f'/api/procurements/deals/{deal_matching.id}/milestones/',
    {
        'title': 'المرحلة 01: استكمال أعمال الحفر والأساسات الخرسانية',
        'amount': '10000000.00',
        'due_date': str((timezone.now() + timezone.timedelta(days=60)).date()),
        'description': 'إنهاء صب الخرسانة المسلحة وتجهيز القاعدة السفلية',
    },
    format='json'
)
print(f"Milestone Create Status: {milestone_resp.status_code}")
assert milestone_resp.status_code == 201, f"Milestone creation failed: {milestone_resp.data}"

notif_ms = Notification.objects.filter(user=operator, notification_type='milestone_added').first()
assert notif_ms is not None, "Notification should be created for operator on milestone addition"
print(f"Notification 3C Created: Title='{notif_ms.title}', Text='{notif_ms.text}'")

print("\n==============================================")
print("ALL OPERATOR 2.0 TESTS PASSED SUCCESSFULLY! ✅")
print("==============================================")
