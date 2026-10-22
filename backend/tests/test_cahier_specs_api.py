import pytest
from rest_framework.test import APIClient
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, CahierSpecs


@pytest.fixture
def auth_authority_1(db):
    user = CustomUser.objects.create_user(
        email='authority_wilaya@safaqat.dz',
        password='password123',
        role='authority',
        organization_name='مديرية التجهيزات العمومية لولاية الجزائر',
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client, user


@pytest.fixture
def auth_authority_2(db):
    user = CustomUser.objects.create_user(
        email='authority_commune@safaqat.dz',
        password='password123',
        role='authority',
        organization_name='بلدية سيدي امحمد',
    )
    client = APIClient()
    client.force_authenticate(user=user)
    return client, user


@pytest.fixture
def sample_deal_1(db, auth_authority_1):
    _, user = auth_authority_1
    deal = ProcurementDeal.objects.create(
        reference_number='DZ-2026-ALG-001',
        title='مشروع إنجاز مجمع مدرسي',
        description='إنجاز مجمع مدرسي صنف ب بالحميز',
        authority=user,
        estimated_budget=45000000.00,
        wilaya='الجزائر',
    )
    specs = CahierSpecs.objects.create(
        deal=deal,
        administrative_clauses={
            'procurement_nature': 'works',
            'procurement_method': 'call_for_tenders',
            'procurement_form': 'open',
            'template_id': 'tpl-works-open-std',
            'template_version': '2.1',
            'legacy_clause_ref': 'LEGACY-2023-A',
        },
        technical_requirements={'spec_item_1': 'إسمنت بورتلاند مقاوم للأملاح'},
        financial_criteria={'evaluation_method': 'lowest_price_evaluated'},
        is_validated=False,
    )
    return deal, specs


@pytest.mark.django_db
class TestCahierSpecsBackendSecurityAndValidation:
    def test_reject_incompatible_method_and_form_via_api(self, auth_authority_1, sample_deal_1):
        """
        سيناريو 1: رفض التوافق غير الصالح عبر API مباشرة.
        مثال: طلب عروض (call_for_tenders) مع شكل مباشر (direct)، أو إجراء تفاوضي مع شكل مفتوح.
        """
        client, user = auth_authority_1
        deal, specs = sample_deal_1

        # 1. طلب عروض مع شكل غير صالح (direct)
        resp1 = client.patch(
            f'/api/procurements/specs/{specs.id}/',
            {
                'administrative_clauses': {
                    'procurement_method': 'call_for_tenders',
                    'procurement_form': 'direct',
                }
            },
            format='json',
        )
        assert resp1.status_code == 400
        assert 'procurement_form' in resp1.data

        # 2. إجراء تفاوضي مع شكل غير صالح (open)
        resp2 = client.patch(
            f'/api/procurements/specs/{specs.id}/',
            {
                'administrative_clauses': {
                    'procurement_method': 'negotiated_procedure',
                    'procurement_form': 'open',
                }
            },
            format='json',
        )
        assert resp2.status_code == 400
        assert 'procurement_form' in resp2.data

    def test_save_incomplete_draft_then_complete_it(self, auth_authority_1, sample_deal_1):
        """
        سيناريو 2: حفظ مسودة غير مكتملة في أي مرحلة، ثم إكمالها لاحقاً دون إجبار مسبق.
        """
        client, user = auth_authority_1
        deal, specs = sample_deal_1

        # حفظ مسودة أولية جزئية للغاية (مثلاً فقط طبيعة الصفقة ودون وثائق كاملة)
        draft_payload = {
            'administrative_clauses': {
                'procurement_nature': 'supplies',
                'draft_notes': 'مسودة أولية قيد التحرير من مصلحة الصفقات',
            }
        }
        resp_draft = client.patch(f'/api/procurements/specs/{specs.id}/', draft_payload, format='json')
        assert resp_draft.status_code == 200
        specs.refresh_from_db()
        assert specs.administrative_clauses.get('draft_notes') == 'مسودة أولية قيد التحرير من مصلحة الصفقات'
        assert specs.is_validated is False

        # استكمال المسودة لاحقاً ببيانات كاملة ومتوافقة
        complete_payload = {
            'administrative_clauses': {
                'procurement_method': 'call_for_tenders',
                'procurement_form': 'open_with_min_capacity',
                'template_id': 'tpl-supplies-open-std',
                'template_version': '1.8',
                'completion_status': 'ready_for_review',
            }
        }
        resp_complete = client.patch(f'/api/procurements/specs/{specs.id}/', complete_payload, format='json')
        assert resp_complete.status_code == 200
        specs.refresh_from_db()
        assert specs.administrative_clauses.get('procurement_form') == 'open_with_min_capacity'
        assert specs.administrative_clauses.get('completion_status') == 'ready_for_review'

    def test_prevent_modifying_validated_cahier_specs(self, auth_authority_1, sample_deal_1):
        """
        سيناريو 3: منع تعديل دفتر الشروط إذا كان مؤشراً عليه ومجمداً (is_validated = True).
        """
        client, user = auth_authority_1
        deal, specs = sample_deal_1

        # تجميد دفتر الشروط
        specs.is_validated = True
        specs.save(update_fields=['is_validated'])

        # محاولة تعديل بنود الدفتر المجمد
        modify_payload = {
            'administrative_clauses': {
                'procurement_method': 'call_for_tenders',
                'procurement_form': 'restricted',
            }
        }
        resp = client.patch(f'/api/procurements/specs/{specs.id}/', modify_payload, format='json')
        assert resp.status_code == 400
        assert 'دفتر الشروط مؤشر عليه ومجمد' in str(resp.data)

    def test_prevent_cross_authority_modification(self, auth_authority_2, sample_deal_1):
        """
        سيناريو 4: منع مصلحة متعاقدة من تعديل أو حذف دفتر شروط تابع لمصلحة متعاقدة أخرى (403).
        """
        client2, user2 = auth_authority_2
        deal, specs = sample_deal_1

        # المصلحة 2 تحاول تعديل دفتر شروط المصلحة 1
        resp_patch = client2.patch(
            f'/api/procurements/specs/{specs.id}/',
            {'technical_requirements': {'tampered': True}},
            format='json',
        )
        assert resp_patch.status_code == 403

        # المصلحة 2 تحاول حذف دفتر شروط المصلحة 1
        resp_delete = client2.delete(f'/api/procurements/specs/{specs.id}/')
        assert resp_delete.status_code == 403

    def test_preserve_legacy_json_keys_on_partial_update(self, auth_authority_1, sample_deal_1):
        """
        سيناريو 5: الحفاظ على مفاتيح JSON السابقة عند التحديث الجزئي (PATCH) دون مسح البيانات القديمة.
        """
        client, user = auth_authority_1
        deal, specs = sample_deal_1

        assert specs.administrative_clauses.get('legacy_clause_ref') == 'LEGACY-2023-A'

        # إرسال تحديث جزئي بحقول جديدة فقط
        update_payload = {
            'administrative_clauses': {
                'justification_text': 'تم اختيار المسابقة لطابع المشروع المعماري',
                'competition_scope': 'national',
            }
        }
        resp = client.patch(f'/api/procurements/specs/{specs.id}/', update_payload, format='json')
        assert resp.status_code == 200

        specs.refresh_from_db()
        # التأكد من بقاء المفتاح القديم مدمجاً ومحفوظاً
        assert specs.administrative_clauses.get('legacy_clause_ref') == 'LEGACY-2023-A'
        assert specs.administrative_clauses.get('procurement_nature') == 'works'
        assert specs.administrative_clauses.get('justification_text') == 'تم اختيار المسابقة لطابع المشروع المعماري'
        assert specs.administrative_clauses.get('competition_scope') == 'national'

    def test_reopen_and_retrieve_procedure_form_and_template(self, auth_authority_1, sample_deal_1):
        """
        سيناريو 6: استرجاع طريقة الإبرام وشكلها ومعرف القالب وإصداره بدقة عند إعادة فتح الصفقة،
        مع التأكد من عدم الوثوق بصفة 'approved_official' القادمة من العميل وفرض 'internal_advisory'.
        """
        client, user = auth_authority_1
        deal, specs = sample_deal_1

        # العميل يحاول إرسال 'approved_official' دون نص ملحق بالجريدة الرسمية
        update_payload = {
            'administrative_clauses': {
                'procurement_method': 'call_for_tenders',
                'procurement_form': 'open_with_min_capacity',
                'template_id': 'tpl-works-open-std',
                'template_version': '2.1',
                'template_status': 'approved_official',  # العميل يدّعي الاعتماد الرسمي
            }
        }
        resp_update = client.patch(f'/api/procurements/specs/{specs.id}/', update_payload, format='json')
        assert resp_update.status_code == 200

        # إعادة فتح الدفتر عبر GET والتحقق من الحقول المسترجعة
        resp_get = client.get(f'/api/procurements/specs/{specs.id}/')
        assert resp_get.status_code == 200
        admin_data = resp_get.data['administrative_clauses']
        assert admin_data['procurement_method'] == 'call_for_tenders'
        assert admin_data['procurement_form'] == 'open_with_min_capacity'
        assert admin_data['template_id'] == 'tpl-works-open-std'
        assert admin_data['template_version'] == '2.1'
        # تم فرض الحالة النزيهة 'internal_advisory'
        assert admin_data['template_status'] == 'internal_advisory'
