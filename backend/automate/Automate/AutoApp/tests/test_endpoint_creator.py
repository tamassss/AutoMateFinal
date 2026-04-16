from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from decimal import Decimal

from AutoApp.models import (
    User, Brand, CarModel, FuelType, Car, CarUser,
    CarGasStation,
    GasStation, Fueling,
    ServiceCenter, Maintenance,
    Address, Route, RouteUsage,
)


class BaseCreateAPITestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(email="creator@example.com", password="pass1234", full_name="Creator")
        cls.user2 = User.objects.create_user(email="other@example.com", password="pass1234", full_name="Other")

        cls.brand = Brand.objects.create(name="BMW")
        cls.model = CarModel.objects.create(brand=cls.brand, name="320d")
        cls.fuel_type = FuelType.objects.create(name="Diesel")

        cls.car = Car.objects.create(
            license_plate="NEW-111",
            brand=cls.brand,
            model=cls.model,
            fuel_type=cls.fuel_type,
            tank_capacity=55.00,
            horsepower=190,
            production_year=2018,
            odometer_km=123456
        )
        cls.car2 = Car.objects.create(
            license_plate="NOPE-222",
            brand=cls.brand,
            model=cls.model,
            fuel_type=cls.fuel_type,
            tank_capacity=60.00,
            horsepower=200,
            production_year=2020,
            odometer_km=55555
        )

        CarUser.objects.create(car=cls.car, user=cls.user, permission="owner")
        CarUser.objects.create(car=cls.car2, user=cls.user2, permission="owner")

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)


class TestCreateLookupsSmoke(BaseCreateAPITestCase):
    """
    Optional sanity checks for lookup endpoints if you added them.
    (Not required for create/patch, but helpful.)
    """
    def test_lookup_endpoints_exist(self):
        for path in [
            "/api/lookups/brands/",
            "/api/lookups/models/",
            "/api/lookups/fuel-types/",
        ]:
            resp = self.client.get(path)
            self.assertIn(resp.status_code, [200, 400, 403])


class TestCarCreateAndPatch(BaseCreateAPITestCase):
    def test_car_create_success_and_caruser_owner_created(self):
        payload = {
            "license_plate": "ADD-333",
            "brand_id": self.brand.brand_id,
            "model_id": self.model.model_id,
            "fuel_type_id": self.fuel_type.fuel_type_id,
            "odometer_km": 1000,
            "tank_capacity": "50.00",
            "horsepower": 110,
            "production_year": 2017,
        }
        resp = self.client.post("/api/cars/create/", payload, format="json")
        self.assertEqual(resp.status_code, 201)
        car_id = resp.json()["car_id"]

        self.assertTrue(Car.objects.filter(car_id=car_id, license_plate="ADD-333").exists())
        self.assertTrue(CarUser.objects.filter(car_id=car_id, user=self.user, permission="owner").exists())

    def test_car_patch_updates_allowed_for_owner(self):
        resp = self.client.patch(
            f"/api/cars/{self.car.car_id}/",
            {"odometer_km": 200000},
            format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.car.refresh_from_db()
        self.assertEqual(self.car.odometer_km, 200000)

    def test_car_patch_forbidden_for_other_users_car(self):
        resp = self.client.patch(
            f"/api/cars/{self.car2.car_id}/",
            {"odometer_km": 99999},
            format="json"
        )
        self.assertEqual(resp.status_code, 403)

    def test_car_create_missing_fields_returns_400(self):
        resp = self.client.post("/api/cars/create/", {"license_plate": "MISS-1"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_car_create_saves_car_image(self):
        payload = {
            "license_plate": "IMG-333",
            "brand": "BMW",
            "model": "320d",
            "car_image": "car_4",
        }
        resp = self.client.post("/api/cars/create/", payload, format="json")
        self.assertEqual(resp.status_code, 201)
        car_id = resp.json()["car_id"]
        created = Car.objects.get(car_id=car_id)
        self.assertEqual(created.car_image, "car_4")

    def test_car_patch_updates_car_image(self):
        resp = self.client.patch(
            f"/api/cars/{self.car.car_id}/",
            {"car_image": "car_5"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.car.refresh_from_db()
        self.assertEqual(self.car.car_image, "car_5")


class TestGasStationAndFuelingCreate(BaseCreateAPITestCase):
    def test_gas_station_create_success(self):
        payload = {
            "car_id": self.car.car_id,
            "date": timezone.now().isoformat(),
            "price_per_liter": "620.00",
            "supplier": "OMV",
            "fuel_type_id": self.fuel_type.fuel_type_id,
            "name": "OMV",
            "city": "Budapest",
            "postal_code": "1111",
            "street": "Fuel",
            "house_number": "10",
        }
        resp = self.client.post("/api/gas-stations/create/", payload, format="json")
        self.assertEqual(resp.status_code, 201)
        gas_station_id = resp.json()["gas_station_id"]
        self.assertTrue(GasStation.objects.filter(gas_station_id=gas_station_id).exists())
        link = CarGasStation.objects.get(user=self.user, car=self.car, gas_station_id=gas_station_id)
        self.assertEqual(float(link.price_per_liter), 620.0)
        self.assertEqual(link.supplier, "OMV")
        self.assertEqual(link.fuel_type_id, self.fuel_type.fuel_type_id)

    def test_fueling_create_success(self):
        gas_station = GasStation.objects.create(
            name="Shell", city="Budapest", postal_code="1111", street="Main", house_number="1"
        )

        payload = {
            "car_id": self.car.car_id,
            "gas_station_id": gas_station.gas_station_id,
            "fuel_type_id": self.fuel_type.fuel_type_id,
            "date": timezone.now().isoformat(),
            "liters": "42.50",
            "price_per_liter": "600.00",
            "supplier": "Shell",
            "odometer_km": 123999
        }
        resp = self.client.post("/api/fuelings/create/", payload, format="json")
        self.assertEqual(resp.status_code, 201)

        fueling_id = resp.json()["fueling_id"]
        fueling = Fueling.objects.get(fueling_id=fueling_id)
        self.assertEqual(fueling.user_id, self.user.user_id)
        self.assertEqual(fueling.car_id, self.car.car_id)
        self.assertEqual(fueling.gas_station_id, gas_station.gas_station_id)
        self.assertEqual(fueling.odometer_km, 123999)

    def test_fueling_create_forbidden_for_other_users_car(self):
        gas_station = GasStation.objects.create(
            name="Shell", city="Budapest", postal_code="1111", street="Main", house_number="1"
        )

        payload = {
            "car_id": self.car2.car_id,  # belongs to user2
            "gas_station_id": gas_station.gas_station_id,
            "fuel_type_id": self.fuel_type.fuel_type_id,
            "date": timezone.now().isoformat(),
            "liters": "10.00",
            "price_per_liter": "650.00",
            "odometer_km": 60000
        }
        resp = self.client.post("/api/fuelings/create/", payload, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_fueling_create_invalid_date_returns_400(self):
        gas_station = GasStation.objects.create(
            name="Shell", city="Budapest", postal_code="1111", street="Main", house_number="1"
        )

        payload = {
            "car_id": self.car.car_id,
            "gas_station_id": gas_station.gas_station_id,
            "fuel_type_id": self.fuel_type.fuel_type_id,
            "date": "not-a-date",
            "liters": "10.00",
            "price_per_liter": "650.00",
            "odometer_km": 124000
        }
        resp = self.client.post("/api/fuelings/create/", payload, format="json")
        self.assertEqual(resp.status_code, 400)


class TestServiceCenterAndMaintenanceCreate(BaseCreateAPITestCase):
    def test_service_center_create_success(self):
        payload = {
            "name": "Bosch Service",
            "city": "Budapest",
            "postal_code": "1111",
            "street": "Fix",
            "house_number": "20",
        }
        resp = self.client.post("/api/service-centers/create/", payload, format="json")
        self.assertEqual(resp.status_code, 201)
        service_center_id = resp.json()["service_center_id"]
        self.assertTrue(ServiceCenter.objects.filter(service_center_id=service_center_id).exists())

    def test_service_center_create_missing_name_400(self):
        resp = self.client.post("/api/service-centers/create/", {"city": "Budapest"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_maintenance_create_success(self):
        sc = ServiceCenter.objects.create(
            name="Bosch", city="Budapest", postal_code="1111", street="Fix", house_number="20"
        )

        payload = {
            "car_id": self.car.car_id,
            "service_center_id": sc.service_center_id,
            "date": timezone.now().isoformat(),
            "part_name": "Engine oil",
            "cost": "25000.00",
            "description": "Oil change",
            "reminder": "Next at 130000 km",
        }
        resp = self.client.post("/api/maintenance/create/", payload, format="json")
        self.assertEqual(resp.status_code, 201)

        maintenance_id = resp.json()["maintenance_id"]
        m = Maintenance.objects.get(maintenance_id=maintenance_id)
        self.assertEqual(m.user_id, self.user.user_id)
        self.assertEqual(m.car_id, self.car.car_id)
        self.assertEqual(m.service_center_id, sc.service_center_id)

    def test_maintenance_create_forbidden_for_other_users_car(self):
        sc = ServiceCenter.objects.create(name="Bosch", city="Budapest")

        payload = {
            "car_id": self.car2.car_id,
            "service_center_id": sc.service_center_id,
            "date": timezone.now().isoformat(),
        }
        resp = self.client.post("/api/maintenance/create/", payload, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_maintenance_create_missing_fields_400(self):
        resp = self.client.post("/api/maintenance/create/", {"car_id": self.car.car_id}, format="json")
        self.assertEqual(resp.status_code, 400)


class TestAddressRouteRouteUsageCreate(BaseCreateAPITestCase):
    def test_address_create_success(self):
        payload = {
            "country": "HU",
            "city": "Göd",
            "postal_code": "2131",
            "street": "Main",
            "house_number": "1",
        }
        resp = self.client.post("/api/addresses/create/", payload, format="json")
        self.assertEqual(resp.status_code, 201)
        address_id = resp.json()["address_id"]
        self.assertTrue(Address.objects.filter(address_id=address_id).exists())

    def test_address_create_missing_city_400(self):
        resp = self.client.post("/api/addresses/create/", {"country": "HU"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_route_create_success(self):
        a1 = Address.objects.create(country="HU", city="A", postal_code="1", street="S", house_number="1")
        a2 = Address.objects.create(country="HU", city="B", postal_code="2", street="T", house_number="2")

        resp = self.client.post(
            "/api/routes/create/",
            {"from_address_id": a1.address_id, "to_address_id": a2.address_id},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        route_id = resp.json()["route_id"]
        self.assertTrue(Route.objects.filter(route_id=route_id).exists())

    def test_route_create_missing_fields_400(self):
        resp = self.client.post("/api/routes/create/", {"from_address_id": 1}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_route_usage_create_success(self):
        a1 = Address.objects.create(country="HU", city="A", postal_code="1", street="S", house_number="1")
        a2 = Address.objects.create(country="HU", city="B", postal_code="2", street="T", house_number="2")
        route = Route.objects.create(from_address=a1, to_address=a2)

        payload = {
            "car_id": self.car.car_id,
            "route_id": route.route_id,
            "date": timezone.now().isoformat(),
            "distance_km": "16.00",
            "departure_time": 8 * 60 + 10,
            "arrival_time": 8 * 60 + 35,
        }
        resp = self.client.post("/api/route-usage/create/", payload, format="json")
        self.assertEqual(resp.status_code, 201)

        route_usage_id = resp.json()["route_usage_id"]
        ru = RouteUsage.objects.get(route_usage_id=route_usage_id)
        self.assertEqual(ru.user_id, self.user.user_id)
        self.assertEqual(ru.car_id, self.car.car_id)
        self.assertEqual(ru.route_id, route.route_id)

    def test_route_usage_create_forbidden_for_other_users_car(self):
        a1 = Address.objects.create(country="HU", city="A")
        a2 = Address.objects.create(country="HU", city="B")
        route = Route.objects.create(from_address=a1, to_address=a2)

        payload = {
            "car_id": self.car2.car_id,
            "route_id": route.route_id,
            "date": timezone.now().isoformat(),
        }
        resp = self.client.post("/api/route-usage/create/", payload, format="json")
        self.assertEqual(resp.status_code, 403)

    def test_route_usage_create_invalid_date_400(self):
        a1 = Address.objects.create(country="HU", city="A")
        a2 = Address.objects.create(country="HU", city="B")
        route = Route.objects.create(from_address=a1, to_address=a2)

        payload = {
            "car_id": self.car.car_id,
            "route_id": route.route_id,
            "date": "not-a-date",
        }
        resp = self.client.post("/api/route-usage/create/", payload, format="json")
        self.assertEqual(resp.status_code, 400)
