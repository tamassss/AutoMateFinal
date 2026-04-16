from django.test import TestCase
from rest_framework.test import APIClient

from AutoApp.models import User


class TestSmoke(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="smoke@example.com", password="pass1234")
        self.client.force_authenticate(user=self.user)

    def test_endpoints_exist(self):
        for path in [
            "/api/cars/",
            "/api/dashboard/",
            "/api/statistics/summary/",
        ]:
            resp = self.client.get(path)
            self.assertIn(resp.status_code, [200, 400, 403])
