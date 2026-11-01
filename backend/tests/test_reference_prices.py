"""اختبارات الأسعار المرجعية ومسار فحص الأسعار المقترحة."""

from decimal import Decimal

import pytest
from django.core.management import call_command
from django.db import IntegrityError, transaction
from rest_framework.test import APIClient

from apps.procurements.models import ReferencePrice
from apps.users.models import CustomUser

URL = "/api/procurements/check-prices/"


@pytest.fixture
def operator_user(db):
    return CustomUser.objects.create_user(
        email="reference.operator@safaqat.dz",
        password="TestPassword123!",
        role="operator",
        organization_name="مؤسسة البناء المرجعي",
    )


@pytest.fixture
def reference_prices(db):
    rows = [
        ("كيس إسمنت", "كيس", "600.00", "الجزائر"),
        ("حديد التسليح", "طن", "120000.00", "الجزائر"),
        ("رمل البناء", "م3", "4500.00", "الجزائر"),
        ("حصى البناء", "م3", "5500.00", "الجزائر"),
        ("طلاء الجدران", "لتر", "450.00", "الجزائر"),
        ("كيس إسمنت", "كيس", "600.00", "وهران"),
        ("حديد التسليح", "طن", "120000.00", "وهران"),
        ("رمل البناء", "م3", "5500.00", "وهران"),
        ("حصى البناء", "م3", "5800.00", "وهران"),
        ("طلاء الجدران", "لتر", "470.00", "وهران"),
    ]
    return [
        ReferencePrice.objects.create(
            name=name,
            unit=unit,
            reference_price=Decimal(price),
            wilaya=wilaya,
        )
        for name, unit, price, wilaya in rows
    ]


@pytest.fixture
def auth_client(operator_user):
    client = APIClient()
    client.force_authenticate(user=operator_user)
    return client


def post_prices(client, payload):
    return client.post(URL, payload, format="json")


@pytest.mark.django_db
class TestReferencePriceModel:
    def test_normalizes_name_and_wilaya_on_save(self):
        reference = ReferencePrice.objects.create(
            name="  كيس الإسمنت  ",
            unit="كيس",
            reference_price=Decimal("600.00"),
            wilaya="الجزائر العاصمة",
        )

        assert reference.name == "كيس الإسمنت"
        assert reference.normalized_name == "كيس اسمنت"
        assert reference.normalized_wilaya == "جزاير"

    def test_duplicate_normalized_name_and_wilaya_is_rejected(self):
        ReferencePrice.objects.create(
            name="كيس إسمنت",
            unit="كيس",
            reference_price=Decimal("600.00"),
            wilaya="الجزائر",
        )

        with pytest.raises(IntegrityError):
            with transaction.atomic():
                ReferencePrice.objects.create(
                    name="كيس الإسمنت",
                    unit="كيس",
                    reference_price=Decimal("610.00"),
                    wilaya="16",
                )

    def test_non_positive_reference_price_is_rejected_by_database(self):
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                ReferencePrice.objects.create(
                    name="سعر صفري",
                    unit="وحدة",
                    reference_price=Decimal("0.00"),
                    wilaya="الجزائر",
                )


@pytest.mark.django_db
class TestCheckPricesEndpoint:
    def test_unauthenticated_request_is_denied(self, reference_prices):
        response = post_prices(
            APIClient(),
            {
                "wilaya": "الجزائر",
                "items": [{"name": "كيس إسمنت", "proposed_price": 600}],
            },
        )

        assert response.status_code in (401, 403)

    def test_exact_match_returns_normal_price(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [{"name": "كيس إسمنت", "proposed_price": 620}],
            },
        )

        assert response.status_code == 200
        data = response.data
        item = data["items"][0]

        assert item["reference_price"] == 600.0
        assert item["reference_unit"] == "كيس"
        assert item["reference_wilaya"] == "الجزائر"
        assert item["deviation_percent"] == pytest.approx(3.3)
        assert item["is_normal"] is True
        assert item["status"] == "normal"
        assert item["match_type"] == "exact"
        assert "طبيعي" in item["recommendation"]
        assert item["reference_updated_at"]
        assert data["summary"]["normal_count"] == 1
        assert data["summary"]["matched_count"] == 1
        assert data["is_advisory"] is True
        assert "استشارية" in data["disclaimer"]

    def test_low_price_returns_clear_recommendation(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [{"name": "كيس إسمنت", "proposed_price": 350}],
            },
        )

        assert response.status_code == 200
        item = response.data["items"][0]

        assert item["deviation_percent"] == pytest.approx(-41.7)
        assert item["is_normal"] is False
        assert item["status"] == "too_low"
        assert "منخفض جداً" in item["recommendation"]
        assert "41.7%" in item["recommendation"]
        assert response.data["summary"]["too_low_count"] == 1

    def test_high_price_returns_clear_recommendation(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [{"name": "حديد التسليح", "proposed_price": 180000}],
            },
        )

        assert response.status_code == 200
        item = response.data["items"][0]

        assert item["deviation_percent"] == pytest.approx(50.0)
        assert item["is_normal"] is False
        assert item["status"] == "too_high"
        assert "مرتفع جداً" in item["recommendation"]
        assert "50%" in item["recommendation"]
        assert response.data["summary"]["too_high_count"] == 1

    def test_threshold_boundaries_match_frontend_60_140_rule(
        self, auth_client, reference_prices
    ):
        # 60% من المرجع بالضبط و140% بالضبط يبقيان ضمن النطاق الاستشاري.
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [
                    {"name": "كيس إسمنت", "proposed_price": 360},
                    {"name": "كيس إسمنت", "proposed_price": 840},
                ],
            },
        )

        assert response.status_code == 200
        low, high = response.data["items"]
        assert low["deviation_percent"] == pytest.approx(-40.0)
        assert low["is_normal"] is True
        assert high["deviation_percent"] == pytest.approx(40.0)
        assert high["is_normal"] is True

        # 359 دج أقل من 60% و841 دج أكثر من 140%.
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [
                    {"name": "كيس إسمنت", "proposed_price": 359},
                    {"name": "كيس إسمنت", "proposed_price": 841},
                ],
            },
        )

        low, high = response.data["items"]
        assert low["deviation_percent"] == pytest.approx(-40.2)
        assert low["status"] == "too_low"
        assert high["deviation_percent"] == pytest.approx(40.2)
        assert high["status"] == "too_high"

    def test_arabic_normalization_matches_variants(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر العاصمة",
                "items": [
                    {"name": "كيس الإسمنت", "proposed_price": 600},
                    {"name": "كيس اسمنت", "proposed_price": 600},
                ],
            },
        )

        assert response.status_code == 200
        assert all(item["match_type"] == "exact" for item in response.data["items"])
        assert all(item["reference_price"] == 600.0 for item in response.data["items"])

    def test_fuzzy_match_handles_short_material_names(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [
                    {"name": "إسمنت", "proposed_price": 600},
                    {"name": "طن حديد", "proposed_price": 120000},
                ],
            },
        )

        assert response.status_code == 200
        cement, steel = response.data["items"]
        assert cement["reference_price"] == 600.0
        assert cement["match_type"] == "fuzzy"
        assert cement["reference_name"] == "كيس إسمنت"
        assert steel["reference_price"] == 120000.0
        assert steel["match_type"] == "fuzzy"
        assert steel["reference_name"] == "حديد التسليح"

    def test_ambiguous_fuzzy_match_is_not_guessed(self, auth_client, reference_prices):
        ReferencePrice.objects.create(
            name="أنبوب حديد",
            unit="متر",
            reference_price=Decimal("900.00"),
            wilaya="الجزائر",
        )

        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [{"name": "حديد", "proposed_price": 1000}],
            },
        )

        assert response.status_code == 200
        item = response.data["items"][0]
        assert item["status"] == "no_reference"
        assert item["reference_price"] is None
        assert item["match_type"] == "none"

    def test_wilaya_specific_prices_are_used(self, auth_client, reference_prices):
        # 6000 دج للرمل: +33.3% في الجزائر (طبيعي) و+9.1% في وهران (طبيعي).
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [{"name": "رمل البناء", "proposed_price": 6000}],
            },
        )
        assert response.data["items"][0]["reference_price"] == 4500.0
        assert response.data["items"][0]["status"] == "normal"

        response = post_prices(
            auth_client,
            {
                "wilaya": "وهران",
                "items": [{"name": "رمل البناء", "proposed_price": 6000}],
            },
        )
        assert response.data["items"][0]["reference_price"] == 5500.0
        assert response.data["items"][0]["status"] == "normal"

        # 7000 دج: +55.6% في الجزائر (مرتفع جداً) و+27.3% في وهران (طبيعي).
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [{"name": "رمل البناء", "proposed_price": 7000}],
            },
        )
        assert response.data["items"][0]["status"] == "too_high"

        response = post_prices(
            auth_client,
            {
                "wilaya": "وهران",
                "items": [{"name": "رمل البناء", "proposed_price": 7000}],
            },
        )
        assert response.data["items"][0]["status"] == "normal"

    def test_per_item_wilaya_overrides_default(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [
                    {
                        "name": "رمل البناء",
                        "proposed_price": 7000,
                        "wilaya": "وهران",
                    }
                ],
            },
        )

        assert response.status_code == 200
        item = response.data["items"][0]
        assert item["wilaya"] == "وهران"
        assert item["reference_price"] == 5500.0
        assert item["status"] == "normal"

    def test_missing_reference_returns_no_reference(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [{"name": "مادة غير معروفة", "proposed_price": 1000}],
            },
        )

        assert response.status_code == 200
        item = response.data["items"][0]
        assert item["reference_price"] is None
        assert item["deviation_percent"] is None
        assert item["is_normal"] is None
        assert item["status"] == "no_reference"
        assert item["match_type"] == "none"
        assert "لا يتوفر سعر مرجعي" in item["recommendation"]
        assert response.data["summary"]["no_reference_count"] == 1

    def test_without_wilaya_uses_available_reference(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {"items": [{"name": "كيس إسمنت", "price": 600}]},
        )

        assert response.status_code == 200
        item = response.data["items"][0]
        assert item["reference_price"] == 600.0
        assert item["reference_wilaya"] in {"الجزائر", "وهران"}
        assert item["match_type"] == "exact"

    def test_accepts_raw_list_payload(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            [
                {
                    "name": "كيس إسمنت",
                    "proposed_price": 350,
                    "wilaya": "الجزائر",
                }
            ],
        )

        assert response.status_code == 200
        assert response.data["items"][0]["status"] == "too_low"

    def test_accepts_field_aliases(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {
                "province": "16",
                "financial_items": [
                    {
                        "item_name": "كيس إسمنت",
                        "price": 350,
                        "measure_unit": "كيس",
                    }
                ],
            },
        )

        assert response.status_code == 200
        item = response.data["items"][0]
        assert item["reference_price"] == 600.0
        assert item["status"] == "too_low"

    def test_multiple_items_return_summary_counts(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [
                    {"name": "كيس إسمنت", "proposed_price": 600},
                    {"name": "كيس إسمنت", "proposed_price": 350},
                    {"name": "كيس إسمنت", "proposed_price": 900},
                    {"name": "مادة غير معروفة", "proposed_price": 100},
                ],
            },
        )

        assert response.status_code == 200
        summary = response.data["summary"]
        assert summary["total"] == 4
        assert summary["matched_count"] == 3
        assert summary["normal_count"] == 1
        assert summary["too_low_count"] == 1
        assert summary["too_high_count"] == 1
        assert summary["no_reference_count"] == 1

    def test_empty_items_returns_400(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {"wilaya": "الجزائر", "items": []},
        )

        assert response.status_code == 400
        assert "error" in response.data

    def test_missing_name_returns_400(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {"wilaya": "الجزائر", "items": [{"proposed_price": 600}]},
        )

        assert response.status_code == 400
        assert "error" in response.data
        assert "details" in response.data

    @pytest.mark.parametrize("invalid_price", [0, -1, "abc"])
    def test_invalid_price_returns_400(
        self, auth_client, reference_prices, invalid_price
    ):
        response = post_prices(
            auth_client,
            {
                "wilaya": "الجزائر",
                "items": [{"name": "كيس إسمنت", "proposed_price": invalid_price}],
            },
        )

        assert response.status_code == 400

    def test_items_must_be_a_list(self, auth_client, reference_prices):
        response = post_prices(
            auth_client,
            {"wilaya": "الجزائر", "items": "not-a-list"},
        )

        assert response.status_code == 400


@pytest.mark.django_db
class TestSeedReferencePricesCommand:
    def test_seed_is_idempotent_and_contains_required_examples(self):
        call_command(
            "seed_reference_prices",
            "--reset",
            "--allow-production",
            verbosity=0,
        )

        assert ReferencePrice.objects.count() == 24

        algiers_cement = ReferencePrice.objects.get(
            name="كيس إسمنت", wilaya="الجزائر"
        )
        oran_cement = ReferencePrice.objects.get(name="كيس إسمنت", wilaya="وهران")
        algiers_steel = ReferencePrice.objects.get(
            name="حديد التسليح", wilaya="الجزائر"
        )
        oran_steel = ReferencePrice.objects.get(name="حديد التسليح", wilaya="وهران")

        assert algiers_cement.reference_price == Decimal("600.00")
        assert oran_cement.reference_price == Decimal("600.00")
        assert algiers_steel.reference_price == Decimal("120000.00")
        assert oran_steel.reference_price == Decimal("120000.00")

        call_command(
            "seed_reference_prices",
            "--allow-production",
            verbosity=0,
        )

        assert ReferencePrice.objects.count() == 24
