from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from decimal import Decimal

from AutoApp.models import (
    User, Brand, CarModel, FuelType, Car, CarUser,
    Address, Route, RouteUsage,
    GasStation, Fueling,
    ServiceCenter, Maintenance, CommunityCarSetting, CommunityGasStationShare
)

class BaseDeleteAPITestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(email="del_user@example.com", password="pass1234", full_name="Delete User")
        cls.user2 = User.objects.create_user(email="del_other@example.com", password="pass1234", full_name="Other User")

        cls.brand = Brand.objects.create(name="BMW")
        cls.model = CarModel.objects.create(brand=cls.brand, name="320d")
        cls.fuel_type = FuelType.objects.create(name="Diesel")

        # car owned by user
        cls.car = Car.objects.create(
            license_plate="DEL-111",
            brand=cls.brand,
            model=cls.model,
            fuel_type=cls.fuel_type,
            tank_capacity=55.00,
            horsepower=190,
            production_year=2018,
            odometer_km=123456
        )

        # car owned by user2
        cls.car2 = Car.objects.create(
            license_plate="DEL-222",
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

        # Route + usage for car
        cls.addr1 = Address.objects.create(country="HU", city="A", postal_code="1", street="S", house_number="1")
        cls.addr2 = Address.objects.create(country="HU", city="B", postal_code="2", street="T", house_number="2")
        cls.route = Route.objects.create(from_address=cls.addr1, to_address=cls.addr2)

        cls.route_usage = RouteUsage.objects.create(
            car=cls.car,
            user=cls.user,
            route=cls.route,
            date=timezone.now() - timezone.timedelta(days=2),
            departure_time=8 * 60 + 10,
            arrival_time=8 * 60 + 35,
            distance_km=Decimal("16.00")
        )

        # Gas station + fueling for car
        cls.gas_station = GasStation.objects.create(
            name="OMV", city="Budapest", postal_code="1111", street="Fuel", house_number="10"
        )
        cls.fueling = Fueling.objects.create(
            user=cls.user,
            car=cls.car,
            gas_station=cls.gas_station,
            fuel_type=cls.fuel_type,
            date=timezone.now() - timezone.timedelta(days=1),
            liters=Decimal("45.00"),
            price_per_liter=Decimal("600.00"),
            supplier="OMV",
            odometer_km=123500
        )

        # Service center + maintenance for car
        cls.service_center = ServiceCenter.objects.create(
            name="Bosch Service", city="Budapest", postal_code="1111", street="Fix", house_number="20"
        )
        cls.maintenance = Maintenance.objects.create(
            car=cls.car,
            service_center=cls.service_center,
            user=cls.user,
            date=timezone.now() - timezone.timedelta(days=7),
            description="Oil change",
            cost=Decimal("25000.00"),
            reminder="1646 km",
            part_name="Engine oil"
        )

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)


class TestDeleteFueling(BaseDeleteAPITestCase):
    def test_delete_fueling_success(self):
        resp = self.client.delete(f"/api/fuelings/{self.fueling.fueling_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Fueling.objects.filter(fueling_id=self.fueling.fueling_id).exists())

    def test_delete_fueling_forbidden_without_car_access(self):
        # create fueling under car2 (user2 owns it)
        gas_station2 = GasStation.objects.create(name="Shell", city="X")
        fueling2 = Fueling.objects.create(
            user=self.user2,
            car=self.car2,
            gas_station=gas_station2,
            fuel_type=self.fuel_type,
            date=timezone.now(),
            liters=Decimal("10.00"),
            price_per_liter=Decimal("650.00"),
            odometer_km=60000
        )

        resp = self.client.delete(f"/api/fuelings/{fueling2.fueling_id}/delete/")
        self.assertEqual(resp.status_code, 403)
        self.assertTrue(Fueling.objects.filter(fueling_id=fueling2.fueling_id).exists())


class TestDeleteMaintenance(BaseDeleteAPITestCase):
    def test_delete_maintenance_success(self):
        resp = self.client.delete(f"/api/maintenance/{self.maintenance.maintenance_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Maintenance.objects.filter(maintenance_id=self.maintenance.maintenance_id).exists())

    def test_delete_maintenance_forbidden_without_car_access(self):
        # maintenance for car2 (owned by user2)
        sc2 = ServiceCenter.objects.create(name="Other SC", city="X")
        m2 = Maintenance.objects.create(
            car=self.car2,
            service_center=sc2,
            user=self.user2,
            date=timezone.now(),
        )

        resp = self.client.delete(f"/api/maintenance/{m2.maintenance_id}/delete/")
        self.assertEqual(resp.status_code, 403)
        self.assertTrue(Maintenance.objects.filter(maintenance_id=m2.maintenance_id).exists())


class TestDeleteRouteUsage(BaseDeleteAPITestCase):
    def test_delete_route_usage_success(self):
        resp = self.client.delete(f"/api/route-usage/{self.route_usage.route_usage_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(RouteUsage.objects.filter(route_usage_id=self.route_usage.route_usage_id).exists())

    def test_delete_route_usage_forbidden_without_car_access(self):
        # create a route usage for car2 (owned by user2)
        ru2 = RouteUsage.objects.create(
            car=self.car2,
            user=self.user2,
            route=self.route,
            date=timezone.now(),
            distance_km=Decimal("5.00")
        )

        resp = self.client.delete(f"/api/route-usage/{ru2.route_usage_id}/delete/")
        self.assertEqual(resp.status_code, 403)
        self.assertTrue(RouteUsage.objects.filter(route_usage_id=ru2.route_usage_id).exists())


class TestDeleteGasStation(BaseDeleteAPITestCase):
    def test_delete_gas_station_blocked_if_used_409(self):
        # self.gas_station is referenced by self.fueling
        resp = self.client.delete(f"/api/gas-stations/{self.gas_station.gas_station_id}/delete/")
        self.assertEqual(resp.status_code, 409)
        self.assertTrue(GasStation.objects.filter(gas_station_id=self.gas_station.gas_station_id).exists())

    def test_delete_gas_station_success_when_unused(self):
        unused = GasStation.objects.create(name="Unused", city="Budapest")
        resp = self.client.delete(f"/api/gas-stations/{unused.gas_station_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(GasStation.objects.filter(gas_station_id=unused.gas_station_id).exists())


class TestDeleteServiceCenter(BaseDeleteAPITestCase):
    def test_delete_service_center_blocked_if_used_409(self):
        # self.service_center referenced by maintenance
        resp = self.client.delete(f"/api/service-centers/{self.service_center.service_center_id}/delete/")
        self.assertEqual(resp.status_code, 409)
        self.assertTrue(ServiceCenter.objects.filter(service_center_id=self.service_center.service_center_id).exists())

    def test_delete_service_center_success_when_unused(self):
        sc = ServiceCenter.objects.create(name="Unused SC", city="Budapest")
        resp = self.client.delete(f"/api/service-centers/{sc.service_center_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(ServiceCenter.objects.filter(service_center_id=sc.service_center_id).exists())


class TestDeleteAddressAndRoute(BaseDeleteAPITestCase):
    def test_delete_address_blocked_if_used_by_route_409(self):
        # addr1/addr2 are used by self.route
        resp = self.client.delete(f"/api/addresses/{self.addr1.address_id}/delete/")
        self.assertEqual(resp.status_code, 409)
        self.assertTrue(Address.objects.filter(address_id=self.addr1.address_id).exists())

    def test_delete_route_blocked_if_used_by_route_usage_409(self):
        # route is used by self.route_usage
        resp = self.client.delete(f"/api/routes/{self.route.route_id}/delete/")
        self.assertEqual(resp.status_code, 409)
        self.assertTrue(Route.objects.filter(route_id=self.route.route_id).exists())

    def test_delete_route_success_when_unused(self):
        a1 = Address.objects.create(country="HU", city="X")
        a2 = Address.objects.create(country="HU", city="Y")
        route = Route.objects.create(from_address=a1, to_address=a2)

        resp = self.client.delete(f"/api/routes/{route.route_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Route.objects.filter(route_id=route.route_id).exists())

    def test_delete_address_success_when_unused(self):
        a = Address.objects.create(country="HU", city="Unused City")
        resp = self.client.delete(f"/api/addresses/{a.address_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Address.objects.filter(address_id=a.address_id).exists())


class TestDeleteCar(BaseDeleteAPITestCase):
    def test_delete_car_cascades_related_data(self):
        CommunityCarSetting.objects.create(user=self.user, car=self.car, enabled=True)
        CommunityGasStationShare.objects.create(
            requester=self.user,
            car=self.car,
            gas_station=self.gas_station,
            status="approved",
        )

        resp = self.client.delete(f"/api/cars/{self.car.car_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Car.objects.filter(car_id=self.car.car_id).exists())
        self.assertFalse(CarUser.objects.filter(car=self.car).exists())
        self.assertFalse(Fueling.objects.filter(car=self.car).exists())
        self.assertFalse(Maintenance.objects.filter(car=self.car).exists())
        self.assertFalse(RouteUsage.objects.filter(car=self.car).exists())
        self.assertFalse(CommunityCarSetting.objects.filter(car=self.car).exists())
        self.assertFalse(CommunityGasStationShare.objects.filter(car=self.car).exists())
        self.assertFalse(GasStation.objects.filter(gas_station_id=self.gas_station.gas_station_id).exists())
        self.assertFalse(ServiceCenter.objects.filter(service_center_id=self.service_center.service_center_id).exists())
        self.assertFalse(Route.objects.filter(route_id=self.route.route_id).exists())
        self.assertFalse(Address.objects.filter(address_id=self.addr1.address_id).exists())
        self.assertFalse(Address.objects.filter(address_id=self.addr2.address_id).exists())

    def test_delete_car_keeps_shared_related_records(self):
        shared_station = GasStation.objects.create(name="Shared Station", city="Budapest")
        shared_center = ServiceCenter.objects.create(name="Shared Center", city="Budapest")
        shared_addr1 = Address.objects.create(country="HU", city="Shared A")
        shared_addr2 = Address.objects.create(country="HU", city="Shared B")
        shared_route = Route.objects.create(from_address=shared_addr1, to_address=shared_addr2)

        Fueling.objects.create(
            user=self.user2,
            car=self.car2,
            gas_station=shared_station,
            fuel_type=self.fuel_type,
            date=timezone.now(),
            liters=Decimal("10.00"),
            price_per_liter=Decimal("650.00"),
            odometer_km=60000
        )
        Fueling.objects.create(
            user=self.user,
            car=self.car,
            gas_station=shared_station,
            fuel_type=self.fuel_type,
            date=timezone.now(),
            liters=Decimal("11.00"),
            price_per_liter=Decimal("651.00"),
            odometer_km=123600
        )
        Maintenance.objects.create(
            car=self.car2,
            service_center=shared_center,
            user=self.user2,
            date=timezone.now(),
            part_name="Shared maintenance",
        )
        Maintenance.objects.create(
            car=self.car,
            service_center=shared_center,
            user=self.user,
            date=timezone.now(),
            part_name="Own maintenance",
        )
        RouteUsage.objects.create(
            car=self.car2,
            user=self.user2,
            route=shared_route,
            date=timezone.now(),
            distance_km=Decimal("5.00")
        )
        RouteUsage.objects.create(
            car=self.car,
            user=self.user,
            route=shared_route,
            date=timezone.now(),
            distance_km=Decimal("7.00")
        )

        resp = self.client.delete(f"/api/cars/{self.car.car_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Car.objects.filter(car_id=self.car.car_id).exists())
        self.assertTrue(GasStation.objects.filter(gas_station_id=shared_station.gas_station_id).exists())
        self.assertTrue(ServiceCenter.objects.filter(service_center_id=shared_center.service_center_id).exists())
        self.assertTrue(Route.objects.filter(route_id=shared_route.route_id).exists())
        self.assertTrue(Address.objects.filter(address_id=shared_addr1.address_id).exists())
        self.assertTrue(Address.objects.filter(address_id=shared_addr2.address_id).exists())

    def test_delete_car_forbidden_if_not_owner(self):
        # give user "driver" permission on a new car
        car = Car.objects.create(
            license_plate="DRV-777",
            brand=self.brand,
            model=self.model,
            fuel_type=self.fuel_type,
            odometer_km=100
        )
        CarUser.objects.create(car=car, user=self.user2, permission="owner")
        CarUser.objects.create(car=car, user=self.user, permission="driver")

        resp = self.client.delete(f"/api/cars/{car.car_id}/delete/")
        self.assertEqual(resp.status_code, 403)
        self.assertTrue(Car.objects.filter(car_id=car.car_id).exists())

    def test_delete_car_success_when_no_related_data(self):
        car = Car.objects.create(
            license_plate="FREE-888",
            brand=self.brand,
            model=self.model,
            fuel_type=self.fuel_type,
            odometer_km=100
        )
        CarUser.objects.create(car=car, user=self.user, permission="owner")

        resp = self.client.delete(f"/api/cars/{car.car_id}/delete/")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Car.objects.filter(car_id=car.car_id).exists())
        self.assertFalse(CarUser.objects.filter(car=car).exists())
