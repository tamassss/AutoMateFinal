from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from AutoApp.models import (
    Address,
    Brand,
    Car,
    CarGasStation,
    CarModel,
    CarUser,
    CommunityCarSetting,
    Event,
    FuelType,
    Fueling,
    GasStation,
    Maintenance,
    Route,
    RouteUsage,
    ServiceCenter,
    User,
)


DEMO_EMAILS = [
    "user1@teszt.com",
    "user2@teszt.com",
    "superadmin@teszt.com",
    "admin@teszt.com",
    "moderator@teszt.com",
]

MONTH_DATA = {
    1: {"km": "1260.50", "liters": "78.40", "price": "612.00", "cost": "42900.00", "part": "Motorolaj", "event": "Biztosítás forduló"},
    2: {"km": "980.20", "liters": "61.30", "price": "598.00", "cost": "18500.00", "part": "Pollenszűrő", "event": "Gumicsere"},
    3: {"km": "1435.00", "liters": "89.70", "price": "625.00", "cost": "0.00", "part": "Átvizsgálás", "event": "Műszaki vizsga"},
    4: {"km": "870.80", "liters": "54.10", "price": "617.00", "cost": "32600.00", "part": "Fékbetét", "event": "Éves szerviz"},
    5: {"km": "1510.40", "liters": "94.20", "price": "604.00", "cost": "12900.00", "part": "Ablaktörlő", "event": "Olajszint ellenőrzés"},
    6: {"km": "1125.70", "liters": "70.00", "price": "631.00", "cost": "0.00", "part": "Klíma tisztítás", "event": "Klíma ellenőrzés"},
    7: {"km": "1680.30", "liters": "104.90", "price": "642.00", "cost": "58400.00", "part": "Gumiabroncs", "event": "Autópálya matrica"},
    8: {"km": "760.00", "liters": "47.60", "price": "629.00", "cost": "0.00", "part": "Folyadék ellenőrzés", "event": "Fék ellenőrzés"},
    9: {"km": "1320.90", "liters": "82.10", "price": "615.00", "cost": "24700.00", "part": "Levegőszűrő", "event": "Téli felkészítés"},
    10: {"km": "1095.40", "liters": "68.80", "price": "608.00", "cost": "0.00", "part": "Kerékcsere", "event": "Guminyomás mérés"},
    11: {"km": "1478.60", "liters": "92.30", "price": "636.00", "cost": "71200.00", "part": "Féktárcsa", "event": "Szerviz időpont"},
    12: {"km": "905.20", "liters": "56.70", "price": "621.00", "cost": "15900.00", "part": "Izzókészlet", "event": "Év végi ellenőrzés"},
}


class Command(BaseCommand):
    help = "Letrehozza a demo profilokat  tesztadatokkal."

    def handle(self, *args, **options):
        with transaction.atomic():
            self.reset_demo_data()

            fuel_types = self.ensure_fuel_types()
            brands = self.ensure_brands()
            self.ensure_role_users()
            self.seed_profile(
                email="user1@teszt.com",
                full_name="user1 felhasználó",
                license_plate="USR-101",
                brand=brands["Toyota"],
                model_name="Corolla",
                fuel_type=fuel_types["Petrol"],
                car_image="car_3",
                tank_capacity=Decimal("50.00"),
                average_consumption=Decimal("6.40"),
                horsepower=132,
                production_year=2019,
                odometer_km=84600,
                months=range(1, 13),
            )
            self.seed_profile(
                email="user2@teszt.com",
                full_name="user2 felhasználó",
                license_plate="USR-202",
                brand=brands["Skoda"],
                model_name="Octavia",
                fuel_type=fuel_types["Diesel"],
                car_image="car_2",
                tank_capacity=Decimal("55.00"),
                average_consumption=Decimal("5.70"),
                horsepower=150,
                production_year=2021,
                odometer_km=43200,
                months=range(2, 5),
            )

        self.stdout.write(self.style.SUCCESS("Demo profilok letrehozva."))

    def reset_demo_data(self):
        users = list(User.objects.filter(email__in=DEMO_EMAILS))
        car_ids = list(
            Car.objects.filter(caruser__user__in=users)
            .values_list("car_id", flat=True)
            .distinct()
        )
        Car.objects.filter(car_id__in=car_ids).delete()
        User.objects.filter(email__in=DEMO_EMAILS).delete()
        GasStation.objects.filter(name__startswith="AutoMate Demo").delete()
        ServiceCenter.objects.filter(name__startswith="AutoMate Demo").delete()
        Address.objects.filter(street__startswith="AutoMate Demo").delete()

    def ensure_fuel_types(self):
        fuel_types = {}
        for name in ["Petrol", "Diesel"]:
            fuel_type, _ = FuelType.objects.get_or_create(name=name)
            fuel_types[name] = fuel_type
        return fuel_types

    def ensure_brands(self):
        data = {
            "Toyota": ["Corolla"],
            "Skoda": ["Octavia"],
        }
        brands = {}
        for brand_name, models in data.items():
            brand, _ = Brand.objects.get_or_create(name=brand_name)
            brands[brand_name] = brand
            for model_name in models:
                CarModel.objects.get_or_create(brand=brand, name=model_name)
        return brands

    def ensure_role_users(self):
        self.ensure_user(
            email="superadmin@teszt.com",
            full_name="superadmin",
            role="admin",
            is_staff=True,
            is_superuser=True,
        )
        self.ensure_user(
            email="admin@teszt.com",
            full_name="admin",
            role="admin",
            is_staff=True,
        )
        self.ensure_user(
            email="moderator@teszt.com",
            full_name="moderator",
            role="moderator",
        )

    def ensure_user(self, email, full_name, role="user", is_staff=False, is_superuser=False):
        user, _ = User.objects.get_or_create(email=email)
        user.full_name = full_name
        user.role = role
        user.is_active = True
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.set_password("12345")
        user.save()
        return user

    def seed_profile(
        self,
        email,
        full_name,
        license_plate,
        brand,
        model_name,
        fuel_type,
        car_image,
        tank_capacity,
        average_consumption,
        horsepower,
        production_year,
        odometer_km,
        months,
    ):
        user = self.ensure_user(email=email, full_name=full_name)
        model = CarModel.objects.get(brand=brand, name=model_name)
        car, _ = Car.objects.get_or_create(
            license_plate=license_plate,
            defaults={
                "brand": brand,
                "model": model,
            },
        )
        car.brand = brand
        car.model = model
        car.fuel_type = fuel_type
        car.car_image = car_image
        car.tank_capacity = tank_capacity
        car.average_consumption = average_consumption
        car.horsepower = horsepower
        car.production_year = production_year
        car.odometer_km = odometer_km
        car.save()

        CarUser.objects.update_or_create(
            car=car,
            user=user,
            defaults={"permission": "owner"},
        )
        CommunityCarSetting.objects.update_or_create(
            user=user,
            car=car,
            defaults={"enabled": True},
        )

        gas_stations = self.ensure_gas_stations()
        service_center = self.ensure_service_center()
        routes = self.ensure_routes()

        for month in months:
            self.create_month_data(
                user=user,
                car=car,
                fuel_type=fuel_type,
                gas_station=gas_stations[month % len(gas_stations)],
                service_center=service_center,
                route=routes[month % len(routes)],
                month=month,
                odometer_base=odometer_km,
            )

    def ensure_gas_stations(self):
        data = [
            ("MOL", "Budapest", "1117", "Budafoki út", "59"),
            ("Shell", "Budapest", "1138", "Váci út", "178"),
            ("OMV", "Göd", "2131", "Pesti út", "93"),
        ]
        stations = []
        for name, city, postal_code, street, house_number in data:
            station, _ = GasStation.objects.get_or_create(
                name=name,
                city=city,
                defaults={
                    "postal_code": postal_code,
                    "street": street,
                    "house_number": house_number,
                },
            )
            stations.append(station)
        return stations

    def ensure_service_center(self):
        service_center, _ = ServiceCenter.objects.get_or_create(
            name="Bosch Car Service",
            city="Budapest",
            defaults={
                "postal_code": "1119",
                "street": "Andor utca",
                "house_number": "21",
            },
        )
        return service_center

    def ensure_routes(self):
        route_data = [
            (
                ("Budapest", "1117", "Fehérvári út", "45"),
                ("Göd", "2131", "Duna út", "8"),
            ),
            (
                ("Budapest", "1138", "Váci út", "140"),
                ("Mogyoród", "2146", "Dózsa György út", "2"),
            ),
        ]
        routes = []
        for from_data, to_data in route_data:
            from_address = self.ensure_address(*from_data)
            to_address = self.ensure_address(*to_data)
            route, _ = Route.objects.get_or_create(
                from_address=from_address,
                to_address=to_address,
            )
            routes.append(route)
        return routes

    def ensure_address(self, city, postal_code, street, house_number):
        address, _ = Address.objects.get_or_create(
            country="HU",
            city=city,
            postal_code=postal_code,
            street=street,
            house_number=house_number,
        )
        return address

    def create_month_data(self, user, car, fuel_type, gas_station, service_center, route, month, odometer_base):
        year = timezone.now().year
        month_date = timezone.make_aware(timezone.datetime(year, month, 15, 9, 0, 0))
        data = MONTH_DATA[month]
        distance = Decimal(data["km"])
        liters = Decimal(data["liters"])
        price_per_liter = Decimal(data["price"])
        service_cost = Decimal(data["cost"])
        odometer = odometer_base + int(sum(Decimal(MONTH_DATA[i]["km"]) for i in range(1, month + 1)))
        reminder_date = timezone.make_aware(timezone.datetime(year + 1, month, 15, 9, 0, 0)).date().isoformat()
        reminder_km = odometer + 10000
        event_date = timezone.make_aware(timezone.datetime(year + 1, month, 10, 10, 0, 0))

        RouteUsage.objects.create(
            user=user,
            car=car,
            route=route,
            date=month_date,
            departure_time=(7 + month % 3) * 60 + 10,
            arrival_time=(8 + month % 3) * 60 + 5 + month % 7,
            arrival_delta_min=[4, -3, 0, 6, -5, 2, 1, -2, 5, -4, 3, 0][month - 1],
            distance_km=distance,
            title=f"{route.from_address.city} - {route.to_address.city}",
        )
        Fueling.objects.create(
            user=user,
            car=car,
            gas_station=gas_station,
            fuel_type=fuel_type,
            date=month_date,
            liters=liters,
            price_per_liter=price_per_liter,
            supplier=gas_station.name,
            odometer_km=odometer,
        )
        CarGasStation.objects.update_or_create(
            user=user,
            car=car,
            gas_station=gas_station,
            defaults={
                "fuel_type": fuel_type,
                "date": month_date,
                "price_per_liter": price_per_liter,
                "supplier": gas_station.name,
            },
        )
        if service_cost > 0:
            Maintenance.objects.create(
                user=user,
                car=car,
                service_center=service_center,
                date=month_date,
                description=None,
                cost=service_cost,
                reminder=f"{reminder_date} | {reminder_km} km",
                part_name=data["part"],
            )
        Event.objects.create(
            user=user,
            car=car,
            date=event_date,
            title=data["event"],
            reminder=f"{reminder_km} km",
        )
