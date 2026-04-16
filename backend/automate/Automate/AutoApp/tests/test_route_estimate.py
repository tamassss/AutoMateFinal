import json
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from AutoApp.models import User


class _MockResponse:
    def __init__(self, payload):
        self.payload = payload

    def read(self):
        return json.dumps(self.payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class TestRouteEstimateEndpoint(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="route@example.com", password="pass1234")
        self.client.force_authenticate(user=self.user)

    @patch("AutoApp.services.external.route_estimate.urlopen")
    def test_route_estimate_success(self, mock_urlopen):
        mock_urlopen.side_effect = [
            _MockResponse([{"lat": "47.5", "lon": "19.0"}]),
            _MockResponse([{"lat": "47.6", "lon": "19.1"}]),
            _MockResponse({"routes": [{"distance": 12000, "duration": 900}]}),
        ]

        resp = self.client.post(
            "/api/routes/estimate/",
            {"from_text": "Budapest", "to_text": "God", "avg_consumption": 7.5},
            format="json",
        )

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["km"], 12.0)
        self.assertEqual(data["minutes"], 15)
        self.assertEqual(data["liters"], 0.9)

    def test_route_estimate_missing_fields(self):
        resp = self.client.post("/api/routes/estimate/", {"from_text": "Budapest"}, format="json")
        self.assertEqual(resp.status_code, 400)
