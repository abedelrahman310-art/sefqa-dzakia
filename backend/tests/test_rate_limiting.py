import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.conf import settings

User = get_user_model()


@pytest.fixture
def auth_user(db):
    return User.objects.create_user(
        email="throttled.user@safaqat.dz",
        password="ValidPassword123!",
        role="operator",
        display_name="مستخدم الفحص",
    )


@pytest.mark.django_db
class TestRateLimitingSecurity:
    def setup_method(self):
        cache.clear()

    def teardown_method(self):
        cache.clear()

    def test_settings_contain_mandatory_throttle_classes_and_rates(self):
        drf_settings = getattr(settings, "REST_FRAMEWORK", {})
        throttle_classes = drf_settings.get("DEFAULT_THROTTLE_CLASSES", ())
        throttle_rates = drf_settings.get("DEFAULT_THROTTLE_RATES", {})

        assert "rest_framework.throttling.AnonRateThrottle" in throttle_classes
        assert "rest_framework.throttling.UserRateThrottle" in throttle_classes
        assert throttle_rates.get("anon") == "5/minute"
        assert throttle_rates.get("user") == "60/minute"

    def test_login_endpoint_throttled_after_5_attempts_returns_429(self):
        client = APIClient()

        # Execute 5 login attempts (should be rejected with 401, not throttled yet)
        for i in range(5):
            res = client.post(
                "/api/users/login/",
                {"email": "attacker@safaqat.dz", "password": "wrongpassword"},
                format="json",
            )
            assert res.status_code == status.HTTP_401_UNAUTHORIZED, f"Attempt {i+1} failed: {res.status_code}"

        # 6th attempt must be rejected by AnonRateThrottle with 429 Too Many Requests
        res_6 = client.post(
            "/api/users/login/",
            {"email": "attacker@safaqat.dz", "password": "wrongpassword"},
            format="json",
        )
        assert res_6.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert getattr(res_6.data.get("detail"), "code", None) == "throttled"

    def test_auth_login_alias_endpoint_also_throttled(self):
        client = APIClient()

        for i in range(5):
            res = client.post(
                "/api/auth/login/",
                {"email": "attacker@safaqat.dz", "password": "wrongpassword"},
                format="json",
            )
            assert res.status_code == status.HTTP_401_UNAUTHORIZED

        # 6th attempt
        res_6 = client.post(
            "/api/auth/login/",
            {"email": "attacker@safaqat.dz", "password": "wrongpassword"},
            format="json",
        )
        assert res_6.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    def test_deals_search_throttled_after_60_requests_returns_429(self, auth_user):
        client = APIClient()
        client.force_authenticate(user=auth_user)

        # 60 requests should succeed
        for i in range(60):
            res = client.get("/api/procurements/deals/")
            assert res.status_code == status.HTTP_200_OK, f"Request {i+1} failed with status {res.status_code}"

        # 61st request must be rejected by UserRateThrottle with 429 Too Many Requests
        res_61 = client.get("/api/procurements/deals/")
        assert res_61.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert getattr(res_61.data.get("detail"), "code", None) == "throttled"
