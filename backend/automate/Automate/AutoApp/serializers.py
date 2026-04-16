from rest_framework import serializers
from django.contrib.auth import get_user_model
from AutoApp.models import (
    User, Brand, CarModel, FuelType,
    Car, CarUser, Address, Route,
    RouteUsage, GasStation, Fueling,
    ServiceCenter, Maintenance
)



User = get_user_model()
# --------- Auth ----------
class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        error_messages={
            "required": "Az email megadása kötelező.",
            "blank": "Az email megadása kötelező.",
            "invalid": "Érvénytelen email cím.",
        }
    )
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "password", "full_name")

    def validate_email(self, value):
        normalized = (value or "").strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Ez az e-mail cím már használatban van.")
        return normalized

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data.get("full_name")
        )
        return user

class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_id", "email", "full_name", "role"]


# --------- Lookups ----------
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["brand_id", "name"]


class CarModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarModel
        fields = ["model_id", "brand", "name"]


class FuelTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelType
        fields = ["fuel_type_id", "name"]


# --------- Car ----------
class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = [
            "car_id",
            "license_plate",
            "brand",
            "model",
            "car_image",
            "fuel_type",
            "tank_capacity",
            "average_consumption",
            "horsepower",
            "production_year",
            "odometer_km",
        ]


class CarUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarUser
        fields = ["car", "user", "permission"]


# --------- Fueling / Gas station ----------
class GasStationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GasStation
        fields = [
            "gas_station_id",
            "name",
            "city",
            "postal_code",
            "street",
            "house_number",
        ]


class FuelingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fueling
        fields = [
            "fueling_id",
            "user",
            "car",
            "route_usage",
            "gas_station",
            "fuel_type",
            "date",
            "liters",
            "price_per_liter",
            "supplier",
            "odometer_km",
        ]
        read_only_fields = ["user"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


# --------- Service / Maintenance ----------
class ServiceCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCenter
        fields = [
            "service_center_id",
            "name",
            "city",
            "postal_code",
            "street",
            "house_number",
        ]


class MaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = [
            "maintenance_id",
            "car",
            "service_center",
            "user",
            "date",
            "description",
            "cost",
            "reminder",
            "part_name",
        ]
        read_only_fields = ["user"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


# --------- Route usage ("Új esemény") ----------
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["address_id", "country", "city", "postal_code", "street", "house_number"]


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = ["route_id", "from_address", "to_address"]


class RouteUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteUsage
        fields = [
            "route_usage_id",
            "car",
            "user",
            "route",
            "date",
            "departure_time",
            "arrival_time",
            "distance_km",
        ]
        read_only_fields = ["user"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
