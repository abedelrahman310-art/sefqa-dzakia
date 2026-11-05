import pytest
from rest_framework.test import APIClient
from rest_framework import status


@pytest.mark.django_db
def test_health_check_endpoint():
    """التحقق من عمل نقطة فحص الصحة والحالة التشغيلية /api/health/"""
    client = APIClient()
    response = client.get('/api/health/')
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data['status'] == 'healthy'
    assert data['service'] == 'safaqat-backend'
    assert data['database'] == 'connected'
    assert 'timestamp' in data
