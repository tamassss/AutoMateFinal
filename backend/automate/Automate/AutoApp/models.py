from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# ---------------------------
# Custom User
# ---------------------------
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    role = models.CharField(
        max_length=10,
        choices=[("admin", "admin"), ("user", "user"), ("moderator", "moderator")],
        default="user",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "user"


# ---------------------------
# Brand
# ---------------------------
class Brand(models.Model):
    brand_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "brand"


# ---------------------------
# Car Model
# ---------------------------
class CarModel(models.Model):
    model_id = models.AutoField(primary_key=True)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name="models")
    name = models.CharField(max_length=255)

    class Meta:
        db_table = "car_model"
        unique_together = ("brand", "name")


# ---------------------------
# Fuel Type
# ---------------------------
class FuelType(models.Model):
    fuel_type_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "fuel_type"


# ---------------------------
# Car
# ---------------------------
class Car(models.Model):
    car_id = models.AutoField(primary_key=True)
    license_plate = models.CharField(max_length=20, unique=True)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    model = models.ForeignKey(CarModel, on_delete=models.CASCADE)
    car_image = models.CharField(max_length=255, null=True, blank=True)
    fuel_type = models.ForeignKey(FuelType, on_delete=models.CASCADE, null=True, blank=True)
    tank_capacity = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    average_consumption = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    horsepower = models.IntegerField(null=True, blank=True)
    production_year = models.IntegerField(null=True, blank=True)
    odometer_km = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "car"


# ---------------------------
# Car - User
# ---------------------------
class CarUser(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission = models.CharField(
        max_length=10,
        choices=[("owner", "owner"), ("driver", "driver")],
    )

    class Meta:
        db_table = "car_user"
        unique_together = ("car", "user")


# ---------------------------
# Address
# ---------------------------
class Address(models.Model):
    address_id = models.AutoField(primary_key=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    street = models.CharField(max_length=255, null=True, blank=True)
    house_number = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        db_table = "address"


# ---------------------------
# Route
# ---------------------------
class Route(models.Model):
    route_id = models.AutoField(primary_key=True)
    from_address = models.ForeignKey(
        Address, related_name="routes_from", on_delete=models.CASCADE
    )
    to_address = models.ForeignKey(
        Address, related_name="routes_to", on_delete=models.CASCADE
    )

    class Meta:
        db_table = "route"


# ---------------------------
# Route Usage
# ---------------------------
class RouteUsage(models.Model):
    route_usage_id = models.AutoField(primary_key=True)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    date = models.DateTimeField()
    departure_time = models.IntegerField(null=True, blank=True)
    arrival_time = models.IntegerField(null=True, blank=True)
    arrival_delta_min = models.IntegerField(null=True, blank=True)
    distance_km = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    title = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "route_usage"


# ---------------------------
# Gas Station
# ---------------------------
class GasStation(models.Model):
    gas_station_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    street = models.CharField(max_length=255, null=True, blank=True)
    house_number = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        db_table = "gas_station"


# ---------------------------
# Fueling
# ---------------------------
class Fueling(models.Model):
    fueling_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    route_usage = models.ForeignKey("RouteUsage", on_delete=models.SET_NULL, null=True, blank=True)
    gas_station = models.ForeignKey(GasStation, on_delete=models.SET_NULL, null=True, blank=True)
    fuel_type = models.ForeignKey(FuelType, on_delete=models.CASCADE, null=True, blank=True)
    date = models.DateTimeField()
    liters = models.DecimalField(max_digits=7, decimal_places=2)
    price_per_liter = models.DecimalField(max_digits=7, decimal_places=2)
    supplier = models.CharField(max_length=100, null=True, blank=True)
    odometer_km = models.IntegerField()

    class Meta:
        db_table = "fueling"


# ---------------------------
# Service Center
# ---------------------------
class ServiceCenter(models.Model):
    service_center_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    street = models.CharField(max_length=255, null=True, blank=True)
    house_number = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        db_table = "service_center"


# ---------------------------
# Maintenance
# ---------------------------
class Maintenance(models.Model):
    maintenance_id = models.AutoField(primary_key=True)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    service_center = models.ForeignKey(ServiceCenter, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField()
    description = models.TextField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    reminder = models.CharField(max_length=255, null=True, blank=True)
    part_name = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "maintenance"


# ---------------------------
# Event
# ---------------------------
class Event(models.Model):
    event_id = models.AutoField(primary_key=True)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    date = models.DateTimeField()
    reminder = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "event"


# ---------------------------
# Community car setting
# ---------------------------
class CommunityCarSetting(models.Model):
    setting_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "community_car_setting"
        unique_together = ("user", "car")


# ---------------------------
# Community gas station share request
# ---------------------------
class CommunityGasStationShare(models.Model):
    share_request_id = models.AutoField(primary_key=True)
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name="community_share_requests")
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    gas_station = models.ForeignKey(GasStation, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=10,
        choices=[("pending", "pending"), ("approved", "approved"), ("rejected", "rejected")],
        default="pending",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="community_reviewed_requests",
    )
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "community_gas_station_share"
        unique_together = ("requester", "car", "gas_station")


class CarGasStation(models.Model):
    link_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    gas_station = models.ForeignKey(GasStation, on_delete=models.CASCADE)
    fuel_type = models.ForeignKey(FuelType, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)
    price_per_liter = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    supplier = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "car_gas_station"
        unique_together = ("user", "car", "gas_station")
