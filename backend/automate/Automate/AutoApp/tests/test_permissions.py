from django.test import TestCase
from rest_framework.test import APIClient

from AutoApp.models import User, Brand, CarModel, FuelType, Car, CarUser


class TestPermissions(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="u@example.com", password="pass1234")
        self.other = User.objects.create_user(email="o@example.com", password="pass1234")

        self.brand = Brand.objects.create(name="Audi")
        self.model = CarModel.objects.create(brand=self.brand, name="A4")
        self.fuel_type = FuelType.objects.create(name="Diesel")

        self.car = Car.objects.create(
            license_plate="PERM-1",
            brand=self.brand,
            model=self.model,
            fuel_type=self.fuel_type,
            tank_capacity=50,
            horsepower=150,
            production_year=2016,
            odometer_km=100000
        )

        CarUser.objects.create(car=self.car, user=self.user, permission="driver")

    def test_access_allowed_for_assigned_driver(self):
        self.client.force_authenticate(self.user)
        resp = self.client.get(f"/api/routes/?car_id={self.car.car_id}")
        self.assertNotEqual(resp.status_code, 403)

    def test_access_denied_for_unassigned_user(self):
        self.client.force_authenticate(self.other)
        resp = self.client.get(f"/api/routes/?car_id={self.car.car_id}")
        self.assertEqual(resp.status_code, 403)


class TestAdminPermissions(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="pass1234",
            full_name="Admin User",
            role="admin",
            is_staff=True,
        )
        self.superadmin = User.objects.create_user(
            email="superadmin@example.com",
            password="pass1234",
            full_name="Super Admin",
            role="admin",
            is_staff=True,
            is_superuser=True,
        )
        self.other_user = User.objects.create_user(
            email="member@example.com",
            password="pass1234",
            full_name="Member User",
        )
        self.other_admin = User.objects.create_user(
            email="other-admin@example.com",
            password="pass1234",
            full_name="Other Admin",
            role="admin",
            is_staff=True,
        )

    def test_admin_cannot_update_own_account_via_admin_endpoint(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.patch(
            f"/api/admin/users/{self.admin.user_id}/",
            {"role": "user"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_admin_can_update_other_user(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.patch(
            f"/api/admin/users/{self.other_user.user_id}/",
            {"role": "moderator"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)

    def test_admin_list_includes_admin_accounts(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.get("/api/admin/users/")
        self.assertEqual(resp.status_code, 200)
        returned_ids = [user["user_id"] for user in resp.data["users"]]
        self.assertIn(self.admin.user_id, returned_ids)
        self.assertIn(self.other_admin.user_id, returned_ids)
        self.assertIn(self.other_user.user_id, returned_ids)

    def test_admin_cannot_update_other_admin_account(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.patch(
            f"/api/admin/users/{self.other_admin.user_id}/",
            {"role": "user"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_admin_cannot_delete_other_admin_account(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.delete(f"/api/admin/users/{self.other_admin.user_id}/delete/")
        self.assertEqual(resp.status_code, 403)

    def test_superadmin_can_update_other_admin_account(self):
        self.client.force_authenticate(self.superadmin)
        resp = self.client.patch(
            f"/api/admin/users/{self.other_admin.user_id}/",
            {"role": "moderator"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)

    def test_superadmin_can_delete_other_admin_account(self):
        self.client.force_authenticate(self.superadmin)
        resp = self.client.delete(f"/api/admin/users/{self.other_admin.user_id}/delete/")
        self.assertEqual(resp.status_code, 200)
