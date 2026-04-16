from django.db import migrations
from django.utils import timezone
from decimal import Decimal


def seed_data(apps, schema_editor):
    # Get historical models (important in migrations!)
    User = apps.get_model("AutoApp", "User")
    Brand = apps.get_model("AutoApp", "Brand")
    CarModel = apps.get_model("AutoApp", "CarModel")
    FuelType = apps.get_model("AutoApp", "FuelType")
    Car = apps.get_model("AutoApp", "Car")
    CarUser = apps.get_model("AutoApp", "CarUser")
    Address = apps.get_model("AutoApp", "Address")
    Route = apps.get_model("AutoApp", "Route")
    RouteUsage = apps.get_model("AutoApp", "RouteUsage")
    GasStation = apps.get_model("AutoApp", "GasStation")
    Fueling = apps.get_model("AutoApp", "Fueling")
    ServiceCenter = apps.get_model("AutoApp", "ServiceCenter")
    Maintenance = apps.get_model("AutoApp", "Maintenance")

    now = timezone.now()

    # -----------------------
    # Fuel types
    # -----------------------
    fuel_type_names = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG"]
    fuel_types = {}
    for name in fuel_type_names:
        obj, _ = FuelType.objects.get_or_create(name=name)
        fuel_types[name] = obj

    # -----------------------
    # Brands & Models
    # -----------------------
    brands_and_models = {
        "BMW": ["116i", "118i", "320d", "330i", "X3", "X5"],
        "Audi": ["A3", "A4", "A6", "Q5", "Q7"],
        "Volkswagen": ["Golf", "Passat", "Polo", "Tiguan"],
        "Toyota": ["Corolla", "Yaris", "Camry", "RAV4"],
        "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "GLC"],
        "Ford": ["Fiesta", "Focus", "Mondeo", "Kuga"],
        "Skoda": ["Octavia", "Fabia", "Superb"],
        "Hyundai": ["i20", "i30", "Tucson"],
    }

    brands = {}
    car_models = {}  # (brand_name, model_name) -> CarModel
    for brand_name, model_list in brands_and_models.items():
        brand, _ = Brand.objects.get_or_create(name=brand_name)
        brands[brand_name] = brand
        for model_name in model_list:
            cm, _ = CarModel.objects.get_or_create(brand=brand, name=model_name)
            car_models[(brand_name, model_name)] = cm

    # -----------------------
    # Users (OPTIONAL but very useful for testing)
    # NOTE: In migrations we can't reliably call create_user() on custom managers,
    # so we set the password via set_password().
    # -----------------------
    from django.contrib.auth.hashers import make_password

    def ensure_user(email, full_name, role="user", is_staff=False, is_superuser=False):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "role": role,
                "is_active": True,
                "is_staff": is_staff,
                "is_superuser": is_superuser,
                "password": make_password("pass1234"),
            },
        )

        if not created and (not user.password or not user.password.startswith("pbkdf2_")):
            user.password = make_password("pass1234")
            user.save(update_fields=["password"])

        return user

    user1 = ensure_user("user@example.com", "Seed User One", role="user")
    user2 = ensure_user("user2@example.com", "Seed User Two", role="user")
    admin = ensure_user("admin@example.com", "Seed Admin", role="admin", is_staff=True, is_superuser=True)

    # -----------------------
    # Cars + ownership
    # -----------------------
    # Note: license_plate is unique -> good key for get_or_create
    car1, _ = Car.objects.get_or_create(
        license_plate="ABC-123",
        defaults={
            "brand": brands["BMW"],
            "model": car_models[("BMW", "320d")],
            "fuel_type": fuel_types["Diesel"],
            "tank_capacity": Decimal("55.00"),
            "horsepower": 190,
            "production_year": 2018,
            "odometer_km": 123456,
        },
    )
    car2, _ = Car.objects.get_or_create(
        license_plate="XYZ-999",
        defaults={
            "brand": brands["Audi"],
            "model": car_models[("Audi", "A4")],
            "fuel_type": fuel_types["Diesel"],
            "tank_capacity": Decimal("60.00"),
            "horsepower": 200,
            "production_year": 2020,
            "odometer_km": 55555,
        },
    )

    # Ensure CarUser links exist
    CarUser.objects.get_or_create(car=car1, user=user1, defaults={"permission": "owner"})
    CarUser.objects.get_or_create(car=car2, user=user2, defaults={"permission": "owner"})

    # Optional: allow user1 to drive car2 (handy for permission tests)
    CarUser.objects.get_or_create(car=car2, user=user1, defaults={"permission": "driver"})

    # -----------------------
    # Gas stations
    # -----------------------
    gas_station1, _ = GasStation.objects.get_or_create(
        name="OMV",
        city="Budapest",
        defaults={"postal_code": "1111", "street": "Fuel", "house_number": "10"},
    )
    gas_station2, _ = GasStation.objects.get_or_create(
        name="Shell",
        city="Budapest",
        defaults={"postal_code": "1111", "street": "Main", "house_number": "1"},
    )

    # -----------------------
    # Service centers
    # -----------------------
    sc1, _ = ServiceCenter.objects.get_or_create(
        name="Bosch Service",
        city="Budapest",
        defaults={"postal_code": "1111", "street": "Fix", "house_number": "20"},
    )
    sc2, _ = ServiceCenter.objects.get_or_create(
        name="AutoMate Garage",
        city="Göd",
        defaults={"postal_code": "2131", "street": "Service", "house_number": "5"},
    )

    # -----------------------
    # Addresses + routes
    # -----------------------
    addr1, _ = Address.objects.get_or_create(
        country="HU",
        city="Göd",
        postal_code="2131",
        street="Main",
        house_number="1",
    )
    addr2, _ = Address.objects.get_or_create(
        country="HU",
        city="Mogyoród",
        postal_code="2146",
        street="Track",
        house_number="2",
    )
    addr3, _ = Address.objects.get_or_create(
        country="HU",
        city="Budapest",
        postal_code="1111",
        street="Ring",
        house_number="3",
    )

    route1, _ = Route.objects.get_or_create(from_address=addr1, to_address=addr2)
    route2, _ = Route.objects.get_or_create(from_address=addr3, to_address=addr1)

    # -----------------------
    # Route usage (events)
    # -----------------------
    RouteUsage.objects.get_or_create(
        car=car1,
        user=user1,
        route=route1,
        date=now - timezone.timedelta(days=2),
        defaults={
            "departure_time": 8 * 60 + 10,
            "arrival_time": 8 * 60 + 35,
            "distance_km": Decimal("16.00"),
        },
    )

    RouteUsage.objects.get_or_create(
        car=car1,
        user=user1,
        route=route2,
        date=now - timezone.timedelta(days=10),
        defaults={
            "departure_time": 18 * 60 + 0,
            "arrival_time": 18 * 60 + 50,
            "distance_km": Decimal("22.50"),
        },
    )

    # -----------------------
    # Fuelings
    # -----------------------
    Fueling.objects.get_or_create(
        user=user1,
        car=car1,
        gas_station=gas_station1,
        fuel_type=fuel_types["Diesel"],
        date=now - timezone.timedelta(days=1),
        defaults={
            "liters": Decimal("45.00"),
            "price_per_liter": Decimal("600.00"),
            "supplier": "OMV",
            "odometer_km": 123500,
        },
    )

    Fueling.objects.get_or_create(
        user=user1,
        car=car1,
        gas_station=gas_station2,
        fuel_type=fuel_types["Diesel"],
        date=now - timezone.timedelta(days=25),
        defaults={
            "liters": Decimal("35.50"),
            "price_per_liter": Decimal("590.00"),
            "supplier": "Shell",
            "odometer_km": 122800,
        },
    )

    # -----------------------
    # Maintenance
    # -----------------------
    Maintenance.objects.get_or_create(
        car=car1,
        service_center=sc1,
        user=user1,
        date=now - timezone.timedelta(days=7),
        defaults={
            "description": "Oil change",
            "cost": Decimal("25000.00"),
            "reminder": "Next at 130000 km",
            "part_name": "Engine oil",
        },
    )

    Maintenance.objects.get_or_create(
        car=car1,
        service_center=sc2,
        user=user1,
        date=now - timezone.timedelta(days=40),
        defaults={
            "description": "Brake pads replacement",
            "cost": Decimal("48000.00"),
            "reminder": "Check after 15000 km",
            "part_name": "Brake pads",
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("AutoApp", "0003_routeusage_title"),
    ]

    operations = [
        migrations.RunPython(seed_data, migrations.RunPython.noop),
    ]
