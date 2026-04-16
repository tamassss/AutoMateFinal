from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.utils.dateparse import parse_datetime
from django.utils import timezone
from django.db import transaction, IntegrityError
from django.db.models import Q

from decimal import Decimal
from datetime import timedelta

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from AutoApp.api.utils import get_current_user, get_car_or_default, user_has_access_to_car
from AutoApp.services.cars import list_user_cars
from AutoApp.services.dashboard import get_dashboard_payload
from AutoApp.services.routes import list_route_cards
from AutoApp.services.fuelings import list_fuelings_grouped_by_month
from AutoApp.services.stats import get_general_statistics, get_summary_statistics
from AutoApp.services.service_logs import list_service_log
from AutoApp.services.gas_stations import list_gas_station_cards
from AutoApp.services.external.route_estimate import (
    AddressNotFoundError,
    RouteEstimateError,
    estimate_route,
)

from AutoApp.models import (
    CarUser,
    Brand, CarModel, FuelType, Car,
      GasStation, Fueling,
      CarGasStation,
      ServiceCenter, Maintenance, Event,
    Address, Route, RouteUsage,
    CommunityCarSetting, CommunityGasStationShare,
)

User = get_user_model()

def _bad(msg, code=status.HTTP_400_BAD_REQUEST):
    return Response({"detail": msg}, status=code)

def _to_int(val, field):
    try:
        return int(val)
    except (TypeError, ValueError):
        raise ValueError(f"{field} must be an integer")

def _to_decimal_str(val, field):
    try:
        Decimal(str(val))
        return str(val)
    except Exception:
        raise ValueError(f"{field} must be a number")

def _parse_dt(val, field="date"):
    dt = parse_datetime(val) if isinstance(val, str) else None
    if dt is None:
        raise ValueError(f"Invalid {field} format. Use ISO-8601.")
    return dt


def _is_admin_user(user):
    role = str(getattr(user, "role", "") or "").strip().lower()
    return role == "admin"


def _is_moderator_or_admin(user):
    role = str(getattr(user, "role", "") or "").strip().lower()
    return role in {"admin", "moderator"}


def _build_monthly_stats(user, car):
    distance_by_month = [0.0] * 12
    liters_by_month = [0.0] * 12
    spent_by_month = [0.0] * 12

    route_rows = RouteUsage.objects.filter(user=user, car=car).only("date", "distance_km")
    for row in route_rows:
        if not row.date:
            continue
        idx = row.date.month - 1
        distance_by_month[idx] += float(row.distance_km or 0)

    fueling_rows = Fueling.objects.filter(user=user, car=car).only("date", "liters", "price_per_liter")
    for row in fueling_rows:
        if not row.date:
            continue
        idx = row.date.month - 1
        liters = float(row.liters or 0)
        price_per_liter = float(row.price_per_liter or 0)
        liters_by_month[idx] += liters
        spent_by_month[idx] += liters * price_per_liter

    price_per_km_by_month = []
    for i in range(12):
        km = distance_by_month[i]
        price_per_km_by_month.append(round((spent_by_month[i] / km), 1) if km > 0 else 0.0)

    return {
        "distance": [round(v, 1) for v in distance_by_month],
        "liters": [round(v, 1) for v in liters_by_month],
        "price_per_km": price_per_km_by_month,
    }


def _build_shared_station_card(share_row, date_value):
    latest_fueling = (
        Fueling.objects.filter(user=share_row.requester, car=share_row.car, gas_station=share_row.gas_station)
        .select_related("fuel_type")
        .order_by("-date", "-fueling_id")
        .first()
    )
    linked_station = (
        CarGasStation.objects.filter(user=share_row.requester, car=share_row.car, gas_station=share_row.gas_station)
        .select_related("fuel_type")
        .first()
    )

    return {
        "gasStationId": share_row.gas_station.gas_station_id,
        "helyseg": share_row.gas_station.city or "-",
        "cim": " ".join([x for x in [share_row.gas_station.street, share_row.gas_station.house_number] if x]) or (share_row.gas_station.name or "-"),
        "stationName": share_row.gas_station.name or "",
        "stationCity": share_row.gas_station.city or "",
        "stationPostalCode": share_row.gas_station.postal_code or "",
        "stationStreet": share_row.gas_station.street or "",
        "stationHouseNumber": share_row.gas_station.house_number or "",
        "datum": str(date_value.date()),
        "literft": (
            float(linked_station.price_per_liter)
            if linked_station and linked_station.price_per_liter is not None
            else (
                float(latest_fueling.price_per_liter)
                if latest_fueling and latest_fueling.price_per_liter is not None
                else 0
            )
        ),
        "supplier": (
            linked_station.supplier
            if linked_station and linked_station.supplier
            else (
                latest_fueling.supplier
                if latest_fueling and latest_fueling.supplier
                else (share_row.gas_station.name or "")
            )
        ),
        "fuelType": (
            linked_station.fuel_type.name
            if linked_station and linked_station.fuel_type
            else (latest_fueling.fuel_type.name if latest_fueling and latest_fueling.fuel_type else "")
        ),
        "fuelTypeId": (
            linked_station.fuel_type_id
            if linked_station
            else (latest_fueling.fuel_type_id if latest_fueling else None)
        ),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_cars(request):
    user = get_current_user(request)
    return Response({"cars": list_user_cars(user)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_dashboard(request):
    user = get_current_user(request)
    car_id = request.query_params.get("car_id")

    if car_id is not None:
        car_id = int(car_id)

        if not CarUser.objects.filter(user=user, car_id=car_id).exists():
            return Response({"detail": "Forbidden"}, status=403)

    return Response(get_dashboard_payload(user, car_id))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_routes(request):
    user = get_current_user(request)
    car_id = request.query_params.get("car_id")
    car = get_car_or_default(user, int(car_id) if car_id else None)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)
    limit = request.query_params.get("limit")
    limit = int(limit) if limit else 50
    return Response({"routes": list_route_cards(user, car, limit=limit)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_route_estimate(request):
    d = request.data or {}
    from_text = str(d.get("from_text") or "").strip()
    to_text = str(d.get("to_text") or "").strip()
    avg_consumption = d.get("avg_consumption")

    if not from_text or not to_text:
        return _bad("from_text and to_text are required")

    try:
        data = estimate_route(from_text, to_text, avg_consumption)
    except AddressNotFoundError as e:
        return _bad(str(e))
    except RouteEstimateError as e:
        return _bad(str(e), code=status.HTTP_503_SERVICE_UNAVAILABLE)
    except ValueError:
        return _bad("avg_consumption must be a number")

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_fuelings(request):
    user = get_current_user(request)
    car_id = request.query_params.get("car_id")
    car = get_car_or_default(user, int(car_id) if car_id else None)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)
    return Response({"fuelings_by_month": list_fuelings_grouped_by_month(user, car)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_statistics_general(request):
    user = get_current_user(request)
    car_id = request.query_params.get("car_id")
    car = get_car_or_default(user, int(car_id) if car_id else None)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)
    return Response(get_general_statistics(user, car))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_statistics_summary(request):
    user = get_current_user(request)
    return Response({"summary": get_summary_statistics(user)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_service_log(request):
    user = get_current_user(request)
    car_id = request.query_params.get("car_id")
    car = get_car_or_default(user, int(car_id) if car_id else None)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)
    return Response({"service_log": list_service_log(user, car)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_gas_stations(request):
    user = get_current_user(request)
    car_id = request.query_params.get("car_id")
    car = get_car_or_default(user, int(car_id) if car_id else None)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)
    limit = request.query_params.get("limit")
    limit = int(limit) if limit else 50
    return Response({"gas_station_cards": list_gas_station_cards(user, car, limit=limit)})


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def api_community_settings(request):
    user = get_current_user(request)

    car_id = request.query_params.get("car_id") if request.method == "GET" else request.data.get("car_id")
    if car_id in (None, ""):
        return _bad("car_id is required")
    try:
        car_id = int(car_id)
    except (TypeError, ValueError):
        return _bad("car_id must be an integer")

    car = get_car_or_default(user, car_id)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    setting, _ = CommunityCarSetting.objects.get_or_create(user=user, car=car, defaults={"enabled": False})

    if request.method == "PUT":
        enabled = bool(request.data.get("enabled", False))
        setting.enabled = enabled
        setting.save(update_fields=["enabled", "updated_at"])
        if not enabled:
            CommunityGasStationShare.objects.filter(requester=user, car=car).delete()

    return Response(
        {
            "car_id": car.car_id,
            "enabled": bool(setting.enabled),
            "updated_at": setting.updated_at,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_community_profiles(request):
    user = get_current_user(request)
    can_moderate = _is_moderator_or_admin(user)
    car_id = request.query_params.get("car_id")
    if car_id in (None, ""):
        return _bad("car_id is required")
    try:
        car_id = int(car_id)
    except (TypeError, ValueError):
        return _bad("car_id must be an integer")

    car = get_car_or_default(user, car_id)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    my_setting = CommunityCarSetting.objects.filter(user=user, car=car).first()
    my_enabled = bool(my_setting.enabled) if my_setting else False
    effective_my_enabled = my_enabled or can_moderate
    my_profile = None
    if effective_my_enabled:
        my_stats = get_general_statistics(user, car)
        my_distance = float(my_stats.get("distance_km_total") or 0)
        my_liters = float((my_stats.get("fuelings") or {}).get("liters") or 0)
        my_spent = float((my_stats.get("fuelings") or {}).get("spent") or 0)
        my_profile = {
            "user_id": user.user_id,
            "full_name": user.full_name or "Felhasználó",
            "car_id": car.car_id,
            "car_name": f"{car.brand.name} {car.model.name}",
            "license_plate": car.license_plate,
            "car_image": car.car_image,
            "stats": {
                "distance": my_distance,
                "liters": my_liters,
                "spent": my_spent,
                "price_per_km": round((my_spent / my_distance), 1) if my_distance > 0 else 0,
            },
        }

    if can_moderate:
        profile_rows = (
            CarUser.objects.filter(permission="owner")
            .exclude(user=user, car=car)
            .select_related("user", "car__brand", "car__model")
            .order_by("user_id", "car_id")
        )
    else:
        profile_rows = (
            CommunityCarSetting.objects.filter(enabled=True)
            .exclude(user=user, car=car)
            .select_related("user", "car__brand", "car__model")
            .order_by("updated_at")
        )
    profiles = []
    for row in profile_rows:
        profile_user = row.user
        profile_car = row.car
        stats = get_general_statistics(profile_user, profile_car)
        distance = float(stats.get("distance_km_total") or 0)
        liters = float((stats.get("fuelings") or {}).get("liters") or 0)
        spent = float((stats.get("fuelings") or {}).get("spent") or 0)
        profiles.append(
            {
                "user_id": profile_user.user_id,
                "full_name": profile_user.full_name or "Felhasználó",
                "car_id": profile_car.car_id,
                "car_name": f"{profile_car.brand.name} {profile_car.model.name}",
                "license_plate": profile_car.license_plate,
                "car_image": profile_car.car_image,
                "stats": {
                    "distance": distance,
                    "liters": liters,
                    "spent": spent,
                    "price_per_km": round((spent / distance), 1) if distance > 0 else 0,
                },
            }
        )

    return Response(
        {
            "enabled": effective_my_enabled,
            "my_profile": my_profile,
            "profiles": profiles,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_community_compare_monthly(request):
    user = get_current_user(request)
    can_moderate = _is_moderator_or_admin(user)

    try:
        my_car_id = int(request.query_params.get("car_id"))
        other_user_id = int(request.query_params.get("other_user_id"))
        other_car_id = int(request.query_params.get("other_car_id"))
    except (TypeError, ValueError):
        return _bad("car_id, other_user_id and other_car_id are required integers")

    my_car = get_car_or_default(user, my_car_id)
    if not user_has_access_to_car(user, my_car):
        return Response({"detail": "Forbidden"}, status=403)

    my_enabled = CommunityCarSetting.objects.filter(user=user, car=my_car, enabled=True).exists()
    if not (my_enabled or can_moderate):
        return _bad("Community is not enabled for your selected car")

    other_user = User.objects.filter(user_id=other_user_id).first()
    other_car = Car.objects.filter(car_id=other_car_id).select_related("brand", "model").first()
    if not other_user or not other_car:
        return Response({"detail": "Not found"}, status=404)

    other_has_access = CarUser.objects.filter(user=other_user, car=other_car).exists()
    other_enabled = CommunityCarSetting.objects.filter(user=other_user, car=other_car, enabled=True).exists()
    if not other_has_access or (not other_enabled and not can_moderate):
        return Response({"detail": "Forbidden"}, status=403)

    my_series = _build_monthly_stats(user, my_car)
    other_series = _build_monthly_stats(other_user, other_car)

    return Response(
        {
            "months": [str(i) for i in range(1, 13)],
            "meta": {
                "me_name": user.full_name or "Én",
                "other_name": other_user.full_name or "Másik",
            },
            "series": {
                "distance": {"me": my_series["distance"], "other": other_series["distance"]},
                "liters": {"me": my_series["liters"], "other": other_series["liters"]},
                "price_per_km": {"me": my_series["price_per_km"], "other": other_series["price_per_km"]},
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_community_my_share_statuses(request):
    user = get_current_user(request)
    car_id = request.query_params.get("car_id")
    if car_id in (None, ""):
        return _bad("car_id is required")
    try:
        car_id = int(car_id)
    except (TypeError, ValueError):
        return _bad("car_id must be an integer")

    car = get_car_or_default(user, car_id)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    rows = CommunityGasStationShare.objects.filter(requester=user, car=car)
    statuses = [
        {
            "request_id": row.share_request_id,
            "gas_station_id": row.gas_station_id,
            "status": row.status,
        }
        for row in rows
    ]
    return Response({"statuses": statuses})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_community_share_request_create(request):
    user = get_current_user(request)
    d = request.data or {}
    if d.get("car_id") in (None, "") or d.get("gas_station_id") in (None, ""):
        return _bad("car_id and gas_station_id are required")
    try:
        car_id = int(d.get("car_id"))
        gas_station_id = int(d.get("gas_station_id"))
    except (TypeError, ValueError):
        return _bad("car_id and gas_station_id must be integers")

    car = get_car_or_default(user, car_id)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    if not CommunityCarSetting.objects.filter(user=user, car=car, enabled=True).exists():
        return _bad("Community is not enabled for this car")

    gas_station = GasStation.objects.filter(gas_station_id=gas_station_id).first()
    if not gas_station:
        return Response({"detail": "Not found"}, status=404)

    share, _ = CommunityGasStationShare.objects.get_or_create(
        requester=user,
        car=car,
        gas_station=gas_station,
        defaults={"status": "pending"},
    )
    if share.status != "pending":
        share.status = "pending"
        share.reviewed_at = None
        share.reviewed_by = None
        share.expires_at = None
        share.save(update_fields=["status", "reviewed_at", "reviewed_by", "expires_at"])

    return Response({"request_id": share.share_request_id, "status": share.status}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_community_share_request_revoke(request):
    user = get_current_user(request)
    d = request.data or {}
    if d.get("car_id") in (None, "") or d.get("gas_station_id") in (None, ""):
        return _bad("car_id and gas_station_id are required")
    try:
        car_id = int(d.get("car_id"))
        gas_station_id = int(d.get("gas_station_id"))
    except (TypeError, ValueError):
        return _bad("car_id and gas_station_id must be integers")

    car = get_car_or_default(user, car_id)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    CommunityGasStationShare.objects.filter(requester=user, car=car, gas_station_id=gas_station_id).delete()
    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_community_share_requests_pending(request):
    user = get_current_user(request)
    if not _is_moderator_or_admin(user):
        return Response({"detail": "Forbidden"}, status=403)

    rows = (
        CommunityGasStationShare.objects.filter(status="pending")
        .select_related("requester", "car__brand", "car__model", "gas_station")
        .order_by("-created_at")
    )

    items = []
    for row in rows:
        items.append({
            "request_id": row.share_request_id,
            "user_id": row.requester.user_id,
            "full_name": row.requester.full_name or "Felhasználó",
            "car_id": row.car_id,
            "car_name": f"{row.car.brand.name} {row.car.model.name}",
            "gas_station_id": row.gas_station_id,
            "created_at": row.created_at,
            "station": _build_shared_station_card(row, row.created_at),
        })
    return Response({"pending": items})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_community_share_request_review(request, request_id: int):
    reviewer = get_current_user(request)
    if not _is_moderator_or_admin(reviewer):
        return Response({"detail": "Forbidden"}, status=403)

    share = CommunityGasStationShare.objects.filter(share_request_id=request_id).first()
    if not share:
        return Response({"detail": "Not found"}, status=404)

    decision = str((request.data or {}).get("decision") or "").strip().lower()
    if decision not in {"accept", "reject"}:
        return _bad("decision must be one of: accept, reject")

    now = timezone.now()
    share.status = "approved" if decision == "accept" else "rejected"
    share.reviewed_at = now
    share.reviewed_by = reviewer
    share.expires_at = now + timedelta(days=30) if decision == "accept" else None
    share.save(update_fields=["status", "reviewed_at", "reviewed_by", "expires_at"])

    return Response({"ok": True, "status": share.status})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_community_shared_stations(request):
    now = timezone.now()
    rows = (
        CommunityGasStationShare.objects.filter(status="approved")
        .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
        .select_related("requester", "car__brand", "car__model", "gas_station")
        .order_by("-reviewed_at", "-created_at")
    )

    items = []
    for row in rows:
        items.append({
            "request_id": row.share_request_id,
            "full_name": row.requester.full_name or "Felhasználó",
            "car_name": f"{row.car.brand.name} {row.car.model.name}",
            "approved_at": row.reviewed_at,
            "station": _build_shared_station_card(row, (row.reviewed_at or row.created_at)),
        })
    return Response({"shared_stations": items})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_community_share_request_delete(request, request_id: int):
    user = get_current_user(request)
    if not _is_moderator_or_admin(user):
        return Response({"detail": "Forbidden"}, status=403)

    share = CommunityGasStationShare.objects.filter(share_request_id=request_id).first()
    if not share:
        return Response({"detail": "Not found"}, status=404)
    share.delete()
    return Response(status=204)


# --------------------------
# AUTH (Register + Login)
# --------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def api_register(request):
    """
    Body: { "email": "...", "password": "...", "full_name": "..." }
    Returns: user + JWT tokens
    """
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password")
    full_name = request.data.get("full_name")

    if not email or not password:
        return _bad("Email and password are required")

    if User.objects.filter(email=email).exists():
        return _bad("Ezzel az e-mail címmel már van regisztrált felhasználó.")

    try:
        user = User.objects.create_user(email=email, password=password, full_name=full_name)
    except Exception:
        return _bad("Could not create user")

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "user": {"user_id": user.user_id, "email": user.email, "full_name": user.full_name, "role": user.role},
            "tokens": {"refresh": str(refresh), "access": str(refresh.access_token)},
        },
        status=201,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password")

    if not email or not password:
        return _bad("Email and password are required")

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "Invalid credentials"}, status=401)

    if not user.check_password(password):
        return Response({"detail": "Invalid credentials"}, status=401)

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "user": {"user_id": user.user_id, "email": user.email, "full_name": user.full_name, "role": user.role},
            "tokens": {"refresh": str(refresh), "access": str(refresh.access_token)},
        }
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def api_profile_update(request):
    user = get_current_user(request)
    d = request.data or {}

    full_name = d.get("full_name")
    email = d.get("email")
    password = d.get("password")

    if full_name is None and email is None and password is None:
        return _bad("No fields to update")

    if full_name is not None:
        full_name = str(full_name).strip()
        if not full_name:
            return _bad("full_name cannot be empty")
        user.full_name = full_name

    if email is not None:
        email = str(email).strip().lower()
        if not email:
            return _bad("email cannot be empty")
        if User.objects.filter(email=email).exclude(user_id=user.user_id).exists():
            return _bad("Email already in use")
        user.email = email

    if password is not None:
        password = str(password)
        if not password:
            return _bad("password cannot be empty")
        user.set_password(password)

    user.save()
    return Response(
        {
            "ok": True,
            "user": {
                "user_id": user.user_id,
                "full_name": user.full_name or "",
                "email": user.email,
                "role": user.role,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_admin_users(request):
    current_user = get_current_user(request)
    if not _is_admin_user(current_user):
        return Response({"detail": "Forbidden"}, status=403)

    email_query = (request.query_params.get("email") or "").strip().lower()
    qs = User.objects.all().order_by("user_id")
    if email_query:
        qs = qs.filter(email__icontains=email_query)

    users = [
        {
            "user_id": u.user_id,
            "full_name": u.full_name or "",
            "email": u.email,
            "password": "",
            "role": u.role,
            "is_superadmin": bool(getattr(u, "is_superuser", False)),
        }
        for u in qs
    ]
    return Response({"users": users})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def api_admin_user_update(request, user_id: int):
    current_user = get_current_user(request)
    if not _is_admin_user(current_user):
        return Response({"detail": "Forbidden"}, status=403)

    target_user = User.objects.filter(user_id=user_id).first()
    if not target_user:
        return Response({"detail": "Not found"}, status=404)
    if _is_admin_user(target_user) and not bool(getattr(current_user, "is_superuser", False)):
        return _bad("You cannot modify another admin account from the admin page", code=403)
    if target_user.user_id == current_user.user_id:
        return _bad("You cannot modify your own account from the admin page", code=403)

    d = request.data or {}

    if "full_name" in d:
        full_name = str(d.get("full_name") or "").strip()
        if not full_name:
            return _bad("full_name cannot be empty")
        target_user.full_name = full_name

    if "email" in d:
        email = str(d.get("email") or "").strip().lower()
        if not email:
            return _bad("email cannot be empty")
        if User.objects.filter(email=email).exclude(user_id=target_user.user_id).exists():
            return _bad("Email already in use")
        target_user.email = email

    if "password" in d:
        password = str(d.get("password") or "")
        if password:
            target_user.set_password(password)

    if "role" in d:
        role = str(d.get("role") or "").strip().lower()
        if role not in {"admin", "user", "moderator"}:
            return _bad("Invalid role")
        target_user.role = role
        target_user.is_staff = role == "admin"

    target_user.save()
    return Response(
        {
            "ok": True,
            "user": {
                "user_id": target_user.user_id,
                "full_name": target_user.full_name or "",
                "email": target_user.email,
                "password": "",
                "role": target_user.role,
            },
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_admin_user_delete(request, user_id: int):
    current_user = get_current_user(request)
    if not _is_admin_user(current_user):
        return Response({"detail": "Forbidden"}, status=403)

    target_user = User.objects.filter(user_id=user_id).first()
    if not target_user:
        return Response({"detail": "Not found"}, status=404)
    if _is_admin_user(target_user) and not bool(getattr(current_user, "is_superuser", False)):
        return _bad("You cannot delete another admin account from the admin page", code=403)
    if target_user.user_id == current_user.user_id:
        return _bad("Cannot delete your own account")

    target_user.delete()
    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_brands(request):
    brands = Brand.objects.all().order_by("name")
    return Response({"brands": [{"brand_id": b.brand_id, "name": b.name} for b in brands]})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_car_models(request):
    """
    Optional filter: ?brand_id=1
    """
    qs = CarModel.objects.select_related("brand").all().order_by("brand_id", "name")
    brand_id = request.query_params.get("brand_id")
    if brand_id:
        try:
            qs = qs.filter(brand_id=_to_int(brand_id, "brand_id"))
        except ValueError as e:
            return _bad(str(e))

    return Response(
        {
            "models": [
                {"model_id": m.model_id, "brand_id": m.brand_id, "name": m.name}
                for m in qs
            ]
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_fuel_types(request):
    qs = FuelType.objects.all().order_by("name")
    return Response({"fuel_types": [{"fuel_type_id": f.fuel_type_id, "name": f.name} for f in qs]})


# --------------------------
# Car add / update
# --------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_car_create(request):
    """
    Body:
    {
      "license_plate": "ABC-123",
      "brand": "BMW",
      "model": "320d",
      "average_consumption": "6.80", (optional)
      "odometer_km": 120000 (optional)
    }
    """
    user = get_current_user(request)
    d = request.data

    required = ["license_plate", "brand", "model"]
    missing = [k for k in required if d.get(k) in (None, "")]
    if missing:
        return _bad(f"Missing fields: {', '.join(missing)}")

    try:
        brand_name = str(d.get("brand")).strip()
        model_name = str(d.get("model")).strip()
        car_image = str(d.get("car_image")).strip() if d.get("car_image") not in (None, "") else None
        odometer_km = _to_int(d.get("odometer_km"), "odometer_km") if d.get("odometer_km") not in (None, "") else None
        average_consumption = _to_decimal_str(d.get("average_consumption"), "average_consumption") if d.get("average_consumption") not in (None, "") else None
    except ValueError as e:
        return _bad(str(e))

    if not brand_name or not model_name:
        return _bad("brand and model must be non-empty strings")

    brand, _ = Brand.objects.get_or_create(name=brand_name)
    model, _ = CarModel.objects.get_or_create(brand=brand, name=model_name)

    try:
        with transaction.atomic():
            car = Car.objects.create(
                license_plate=d["license_plate"],
                brand=brand,
                model=model,
                car_image=car_image,
                odometer_km=odometer_km,
                average_consumption=average_consumption,
            )
            CarUser.objects.create(car=car, user=user, permission="owner")
    except IntegrityError:
        return Response(
            {
                "detail": "Nem sikerült létrehozni az autót.",
                "field_errors": {"plate": "Ez a rendszám már regisztrálva van."},
            },
            status=400,
        )

    return Response({"car_id": car.car_id}, status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def api_car_update(request, car_id: int):
    """
    PATCH /cars/{car_id}/
    """
    user = get_current_user(request)
    car = get_car_or_default(user, int(car_id))
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    d = request.data
    try:
        if "brand" in d and d["brand"] in (None, ""):
            return _bad("brand cannot be empty")
        if "model" in d and d["model"] in (None, ""):
            return _bad("model cannot be empty")
    except ValueError as e:
        return _bad(str(e))

    try:
        if "license_plate" in d:
            car.license_plate = d["license_plate"] if d["license_plate"] != "" else None

        if "brand" in d or "model" in d:
            brand_name = str(d.get("brand", car.brand.name)).strip()
            model_name = str(d.get("model", car.model.name)).strip()
            if not brand_name or not model_name:
                return _bad("brand and model must be non-empty strings")
            brand, _ = Brand.objects.get_or_create(name=brand_name)
            model, _ = CarModel.objects.get_or_create(brand=brand, name=model_name)
            car.brand = brand
            car.model = model

        if "average_consumption" in d:
            car.average_consumption = _to_decimal_str(d["average_consumption"], "average_consumption") if d["average_consumption"] not in (None, "") else None

        if "odometer_km" in d:
            car.odometer_km = _to_int(d["odometer_km"], "odometer_km") if d["odometer_km"] not in (None, "") else None

        if "car_image" in d:
            car.car_image = str(d.get("car_image")).strip() if d.get("car_image") not in (None, "") else None
    except ValueError as e:
        return _bad(str(e))

    try:
        car.save()
    except IntegrityError:
        return Response(
            {
                "detail": "Nem sikerült módosítani az autót.",
                "field_errors": {"plate": "Ez a rendszám már regisztrálva van."},
            },
            status=400,
        )

    return Response({"ok": True})


# --------------------------
# Gas station create
# --------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_gas_station_create(request):
    """
    Body:
    { "name": "...", "city": "...", "postal_code": "...", "street": "...", "house_number": "..." }
    """
    user = get_current_user(request)
    d = request.data
    car_id = d.get("car_id")
    car = None

    if car_id not in (None, ""):
        try:
            car = get_car_or_default(user, int(car_id))
        except (TypeError, ValueError):
            return _bad("car_id must be an integer")
        if not user_has_access_to_car(user, car):
            return Response({"detail": "Forbidden"}, status=403)

    try:
        gas_station = GasStation.objects.create(
            name=(d.get("name") or None),
            city=(d.get("city") or None),
            postal_code=(d.get("postal_code") or None),
            street=(d.get("street") or None),
            house_number=(d.get("house_number") or None),
        )
        if car is not None:
            fuel_type_id = d.get("fuel_type_id")
            if fuel_type_id in (None, ""):
                fuel_type_id = None
            else:
                try:
                    fuel_type_id = int(fuel_type_id)
                except (TypeError, ValueError):
                    return _bad("fuel_type_id must be an integer")

            gas_station_link, _ = CarGasStation.objects.get_or_create(user=user, car=car, gas_station=gas_station)
            gas_station_link.date = _parse_dt(d.get("date"), "date") if d.get("date") not in (None, "") else None
            gas_station_link.price_per_liter = _to_decimal_str(d.get("price_per_liter"), "price_per_liter") if d.get("price_per_liter") not in (None, "") else None
            gas_station_link.supplier = d.get("supplier") or None
            gas_station_link.fuel_type_id = fuel_type_id
            gas_station_link.save()
    except ValueError as e:
        return _bad(str(e))
    except IntegrityError:
        return _bad("Could not create gas station (integrity error).")

    return Response({"gas_station_id": gas_station.gas_station_id}, status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def api_gas_station_update(request, gas_station_id: int):
    user = get_current_user(request)
    try:
        gs = GasStation.objects.get(gas_station_id=gas_station_id)
    except GasStation.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    d = request.data or {}

    if "name" in d:
        gs.name = d.get("name") or None
    if "city" in d:
        gs.city = d.get("city") or None
    if "postal_code" in d:
        gs.postal_code = d.get("postal_code") or None
    if "street" in d:
        gs.street = d.get("street") or None
    if "house_number" in d:
        gs.house_number = d.get("house_number") or None

    try:
        gs.save()
    except IntegrityError:
        return _bad("Could not update gas station (integrity error).")

    CommunityGasStationShare.objects.filter(
        requester=user,
        gas_station=gs,
    ).exclude(status="pending").update(
        status="pending",
        reviewed_at=None,
        reviewed_by=None,
        expires_at=None,
    )

    car_id = d.get("car_id")
    if car_id not in (None, ""):
        try:
            car = get_car_or_default(user, int(car_id))
        except (TypeError, ValueError):
            return _bad("car_id must be an integer")
        if not user_has_access_to_car(user, car):
            return Response({"detail": "Forbidden"}, status=403)

        try:
            link, _ = CarGasStation.objects.get_or_create(user=user, car=car, gas_station=gs)
            if "date" in d:
                link.date = _parse_dt(d.get("date"), "date") if d.get("date") not in (None, "") else None
            if "price_per_liter" in d:
                link.price_per_liter = _to_decimal_str(d.get("price_per_liter"), "price_per_liter") if d.get("price_per_liter") not in (None, "") else None
            if "supplier" in d:
                link.supplier = d.get("supplier") or None
            if "fuel_type_id" in d:
                link.fuel_type_id = _to_int(d.get("fuel_type_id"), "fuel_type_id") if d.get("fuel_type_id") not in (None, "") else None
            link.save()
        except ValueError as e:
            return _bad(str(e))

    return Response(
        {
            "ok": True,
            "gas_station": {
                "gas_station_id": gs.gas_station_id,
                "name": gs.name,
                "city": gs.city,
                "postal_code": gs.postal_code,
                "street": gs.street,
                "house_number": gs.house_number,
            },
        }
    )


# --------------------------
# Fueling create
# --------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_fueling_create(request):
    """
    Body:
    {
      "car_id": 1,
      "gas_station_id": 3,
      "fuel_type_id": 2, (optional)
      "date": "2026-02-05T10:30:00Z",
      "liters": "42.50",
      "price_per_liter": "615.00",
      "supplier": "MOL" (optional),
      "odometer_km": 121000
    }
    """
    user = get_current_user(request)
    d = request.data

    required = ["car_id", "date", "liters", "price_per_liter", "odometer_km"]
    missing = [k for k in required if d.get(k) in (None, "")]
    if missing:
        return _bad(f"Missing fields: {', '.join(missing)}")

    try:
        car_id = _to_int(d.get("car_id"), "car_id")
        gas_station_id = _to_int(d.get("gas_station_id"), "gas_station_id") if d.get("gas_station_id") not in (None, "") else None
        fuel_type_id = _to_int(d.get("fuel_type_id"), "fuel_type_id") if d.get("fuel_type_id") not in (None, "") else None
        route_usage_id = _to_int(d.get("route_usage_id"), "route_usage_id") if d.get("route_usage_id") not in (None, "") else None
        odometer_km = _to_int(d.get("odometer_km"), "odometer_km")
        dt = _parse_dt(d.get("date"), "date")
        liters = _to_decimal_str(d.get("liters"), "liters")
        price_per_liter = _to_decimal_str(d.get("price_per_liter"), "price_per_liter")
    except ValueError as e:
        return _bad(str(e))

    car = get_car_or_default(user, car_id)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    if gas_station_id is not None and not GasStation.objects.filter(gas_station_id=gas_station_id).exists():
        return _bad("Invalid gas_station_id")
    if fuel_type_id is not None and not FuelType.objects.filter(fuel_type_id=fuel_type_id).exists():
        return _bad("Invalid fuel_type_id")
    if route_usage_id is not None:
        route_usage = RouteUsage.objects.filter(route_usage_id=route_usage_id).select_related("car").first()
        if not route_usage:
            return _bad("Invalid route_usage_id")
        if route_usage.car_id != car.car_id or route_usage.user_id != user.user_id:
            return Response({"detail": "Forbidden"}, status=403)

    try:
        fueling = Fueling.objects.create(
            user=user,
            car=car,
            route_usage_id=route_usage_id,
            gas_station_id=gas_station_id,
            fuel_type_id=fuel_type_id,
            date=dt,
            liters=liters,
            price_per_liter=price_per_liter,
            supplier=d.get("supplier") or None,
            odometer_km=odometer_km,
        )
        if gas_station_id is not None:
            link, _ = CarGasStation.objects.get_or_create(user=user, car=car, gas_station_id=gas_station_id)
            link.date = dt
            link.price_per_liter = price_per_liter
            link.supplier = d.get("supplier") or None
            link.fuel_type_id = fuel_type_id
            link.save()
    except IntegrityError:
        return _bad("Could not create fueling (integrity error). Check ids and values.")

    return Response({"fueling_id": fueling.fueling_id}, status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def api_fueling_update(request, fueling_id: int):
    user = get_current_user(request)

    try:
        fueling = Fueling.objects.select_related("car").get(fueling_id=fueling_id)
    except Fueling.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if not user_has_access_to_car(user, fueling.car):
        return Response({"detail": "Forbidden"}, status=403)

    d = request.data or {}

    try:
        if "liters" in d:
            fueling.liters = _to_decimal_str(d.get("liters"), "liters") if d.get("liters") not in (None, "") else fueling.liters

        if "price_per_liter" in d:
            fueling.price_per_liter = _to_decimal_str(d.get("price_per_liter"), "price_per_liter") if d.get("price_per_liter") not in (None, "") else fueling.price_per_liter

        if "odometer_km" in d:
            fueling.odometer_km = _to_int(d.get("odometer_km"), "odometer_km") if d.get("odometer_km") not in (None, "") else fueling.odometer_km

        if "supplier" in d:
            fueling.supplier = d.get("supplier") or None

        if "fuel_type_id" in d:
            fuel_type_id = _to_int(d.get("fuel_type_id"), "fuel_type_id") if d.get("fuel_type_id") not in (None, "") else None
            if fuel_type_id is not None and not FuelType.objects.filter(fuel_type_id=fuel_type_id).exists():
                return _bad("Invalid fuel_type_id")
            fueling.fuel_type_id = fuel_type_id

        if "route_usage_id" in d:
            route_usage_id = _to_int(d.get("route_usage_id"), "route_usage_id") if d.get("route_usage_id") not in (None, "") else None
            if route_usage_id is not None:
                route_usage = RouteUsage.objects.filter(route_usage_id=route_usage_id).select_related("car").first()
                if not route_usage:
                    return _bad("Invalid route_usage_id")
                if route_usage.car_id != fueling.car_id or route_usage.user_id != user.user_id:
                    return Response({"detail": "Forbidden"}, status=403)
            fueling.route_usage_id = route_usage_id
    except ValueError as e:
        return _bad(str(e))

    try:
        fueling.save()
    except IntegrityError:
        return _bad("Could not update fueling (integrity error).")

    return Response(
        {
            "ok": True,
            "fueling": {
                "fueling_id": fueling.fueling_id,
                "liters": float(fueling.liters),
                "price_per_liter": float(fueling.price_per_liter),
                "odometer_km": fueling.odometer_km,
                "supplier": fueling.supplier,
                "route_usage_id": fueling.route_usage_id,
                "fuel_type_id": fueling.fuel_type_id,
                "fuel_type": fueling.fuel_type.name if fueling.fuel_type else None,
            },
        }
    )


# --------------------------
# Service center + maintenance create
# --------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_service_center_create(request):
    """
    Body: { "name": "...", "city": "...", "postal_code": "...", "street": "...", "house_number": "..." }
    """
    d = request.data
    if not d.get("name"):
        return _bad("name is required")

    try:
        sc = ServiceCenter.objects.create(
            name=d["name"],
            city=d.get("city") or None,
            postal_code=d.get("postal_code") or None,
            street=d.get("street") or None,
            house_number=d.get("house_number") or None,
        )
    except IntegrityError:
        return _bad("Could not create service center (integrity error).")

    return Response({"service_center_id": sc.service_center_id}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_maintenance_create(request):
    """
    Body:
    {
      "car_id": 1,
      "service_center_id": 2,
      "date": "2026-02-01T09:00:00Z",
      "part_name": "...", (optional)
      "cost": "35000.00", (optional)
      "description": "...", (optional)
      "reminder": "...", (optional)
    }
    """
    user = get_current_user(request)
    d = request.data

    required = ["car_id", "service_center_id", "date"]
    missing = [k for k in required if d.get(k) in (None, "")]
    if missing:
        return _bad(f"Missing fields: {', '.join(missing)}")

    try:
        car_id = _to_int(d.get("car_id"), "car_id")
        service_center_id = _to_int(d.get("service_center_id"), "service_center_id")
        dt = _parse_dt(d.get("date"), "date")
        cost = _to_decimal_str(d.get("cost"), "cost") if d.get("cost") not in (None, "") else None
    except ValueError as e:
        return _bad(str(e))

    car = get_car_or_default(user, car_id)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    if not ServiceCenter.objects.filter(service_center_id=service_center_id).exists():
        return _bad("Invalid service_center_id")

    try:
        m = Maintenance.objects.create(
            car=car,
            service_center_id=service_center_id,
            user=user,
            date=dt,
            description=d.get("description") or None,
            cost=cost,
            reminder=d.get("reminder") or None,
            part_name=d.get("part_name") or None,
        )
    except IntegrityError:
        return _bad("Could not create maintenance (integrity error). Check ids and values.")

    return Response({"maintenance_id": m.maintenance_id}, status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def api_maintenance_update(request, maintenance_id: int):
    user = get_current_user(request)

    try:
        maintenance = Maintenance.objects.select_related("car").get(maintenance_id=maintenance_id)
    except Maintenance.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if not user_has_access_to_car(user, maintenance.car):
        return Response({"detail": "Forbidden"}, status=403)

    d = request.data or {}

    try:
        if "part_name" in d:
            maintenance.part_name = (d.get("part_name") or None)

        if "date" in d:
            maintenance.date = _parse_dt(d.get("date"), "date")

        if "cost" in d:
            maintenance.cost = _to_decimal_str(d.get("cost"), "cost") if d.get("cost") not in (None, "") else None

        if "description" in d:
            maintenance.description = d.get("description") or None

        if "reminder" in d:
            maintenance.reminder = d.get("reminder") or None
    except ValueError as e:
        return _bad(str(e))

    try:
        maintenance.save()
    except IntegrityError:
        return _bad("Could not update maintenance (integrity error).")

    return Response(
        {
            "ok": True,
            "maintenance": {
                "maintenance_id": maintenance.maintenance_id,
                "part_name": maintenance.part_name,
                "date": maintenance.date,
                "cost": float(maintenance.cost) if maintenance.cost is not None else None,
                "description": maintenance.description,
                "reminder": maintenance.reminder,
            },
        }
    )


# --------------------------
# Event CRUD
# --------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_events(request):
    user = get_current_user(request)
    car_id = request.query_params.get("car_id")

    if car_id in (None, ""):
        car = get_car_or_default(user, None)
    else:
        try:
            car = get_car_or_default(user, _to_int(car_id, "car_id"))
        except ValueError as e:
            return _bad(str(e))

    if car is None:
        return Response({"events": []})

    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    items = (
        Event.objects.filter(user=user, car=car)
        .order_by("date", "event_id")
    )

    return Response(
        {
            "events": [
                {
                    "event_id": event.event_id,
                    "title": event.title,
                    "date": event.date,
                    "reminder": event.reminder,
                }
                for event in items
            ]
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_event_create(request):
    user = get_current_user(request)
    d = request.data or {}

    required = ["car_id", "title", "date"]
    missing = [k for k in required if d.get(k) in (None, "")]
    if missing:
        return _bad(f"Missing fields: {', '.join(missing)}")

    try:
        car_id = _to_int(d.get("car_id"), "car_id")
        dt = _parse_dt(d.get("date"), "date")
    except ValueError as e:
        return _bad(str(e))

    car = get_car_or_default(user, car_id)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    try:
        event = Event.objects.create(
            user=user,
            car=car,
            title=str(d.get("title") or "").strip(),
            date=dt,
            reminder=d.get("reminder") or None,
        )
    except IntegrityError:
        return _bad("Could not create event (integrity error).")

    return Response({"event_id": event.event_id}, status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def api_event_update(request, event_id: int):
    user = get_current_user(request)

    try:
        event = Event.objects.select_related("car").get(event_id=event_id)
    except Event.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if not user_has_access_to_car(user, event.car):
        return Response({"detail": "Forbidden"}, status=403)

    d = request.data or {}

    try:
        if "title" in d:
            title = str(d.get("title") or "").strip()
            if not title:
                return _bad("title cannot be empty")
            event.title = title

        if "date" in d:
            event.date = _parse_dt(d.get("date"), "date")

        if "reminder" in d:
            event.reminder = d.get("reminder") or None
    except ValueError as e:
        return _bad(str(e))

    try:
        event.save()
    except IntegrityError:
        return _bad("Could not update event (integrity error).")

    return Response(
        {
            "ok": True,
            "event": {
                "event_id": event.event_id,
                "title": event.title,
                "date": event.date,
                "reminder": event.reminder,
            },
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_event_delete(request, event_id: int):
    user = get_current_user(request)

    try:
        event = Event.objects.select_related("car").get(event_id=event_id)
    except Event.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if not user_has_access_to_car(user, event.car):
        return Response({"detail": "Forbidden"}, status=403)

    event.delete()
    return Response(status=204)


# --------------------------
# Address + Route + RouteUsage create
# --------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_address_create(request):
    """
    Body: { "country":"", "city":"", "postal_code":"", "street":"", "house_number":"" }
    """
    d = request.data
    if not d.get("city"):
        return _bad("city is required")

    try:
        a = Address.objects.create(
            country=d.get("country") or None,
            city=d["city"],
            postal_code=d.get("postal_code") or None,
            street=d.get("street") or None,
            house_number=d.get("house_number") or None,
        )
    except IntegrityError:
        return _bad("Could not create address (integrity error).")

    return Response({"address_id": a.address_id}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_route_create(request):
    """
    Body: { "from_address_id": 1, "to_address_id": 2 }
    """
    d = request.data
    if not d.get("from_address_id") or not d.get("to_address_id"):
        return _bad("from_address_id and to_address_id are required")

    try:
        from_address_id = _to_int(d.get("from_address_id"), "from_address_id")
        to_address_id = _to_int(d.get("to_address_id"), "to_address_id")
    except ValueError as e:
        return _bad(str(e))

    if not Address.objects.filter(address_id=from_address_id).exists():
        return _bad("Invalid from_address_id")
    if not Address.objects.filter(address_id=to_address_id).exists():
        return _bad("Invalid to_address_id")

    try:
        r = Route.objects.create(from_address_id=from_address_id, to_address_id=to_address_id)
    except IntegrityError:
        return _bad("Could not create route (integrity error).")

    return Response({"route_id": r.route_id}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_route_usage_create(request):
    """
    Body:
    {
      "car_id": 1,
      "route_id": 5,
      "date": "2026-02-05T12:00:00Z",
      "distance_km": "15.20" (optional),
      "departure_time": 930 (optional),
      "arrival_time": 1015 (optional)
    }
    """
    user = get_current_user(request)
    d = request.data

    required = ["car_id", "route_id", "date"]
    missing = [k for k in required if d.get(k) in (None, "")]
    if missing:
        return _bad(f"Missing fields: {', '.join(missing)}")

    try:
        car_id = _to_int(d.get("car_id"), "car_id")
        route_id = _to_int(d.get("route_id"), "route_id")
        dt = _parse_dt(d.get("date"), "date")
        departure_time = _to_int(d.get("departure_time"), "departure_time") if d.get("departure_time") not in (None, "") else None
        arrival_time = _to_int(d.get("arrival_time"), "arrival_time") if d.get("arrival_time") not in (None, "") else None
        arrival_delta_min = _to_int(d.get("arrival_delta_min"), "arrival_delta_min") if d.get("arrival_delta_min") not in (None, "") else None
        distance_km = _to_decimal_str(d.get("distance_km"), "distance_km") if d.get("distance_km") not in (None, "") else None
    except ValueError as e:
        return _bad(str(e))

    car = get_car_or_default(user, car_id)
    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    if not Route.objects.filter(route_id=route_id).exists():
        return _bad("Invalid route_id")

    create_kwargs = dict(
        car=car,
        user=user,
        route_id=route_id,
        date=dt,
        departure_time=departure_time,
        arrival_time=arrival_time,
        arrival_delta_min=arrival_delta_min,
        distance_km=distance_km,
    )

    if "title" in d:
        create_kwargs["title"] = d.get("title")

    try:
        ru = RouteUsage.objects.create(**create_kwargs)
    except TypeError:
        return _bad("RouteUsage does not support one of the provided fields (e.g., title).")
    except IntegrityError:
        return _bad("Could not create route usage (integrity error).")

    return Response({"route_usage_id": ru.route_usage_id}, status=201)


def _is_owner(user, car: Car) -> bool:
    return CarUser.objects.filter(user=user, car=car, permission="owner").exists()


# ----------------------------
# DELETE: Car (owner only)
# ----------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_car_delete(request, car_id: int):
    user = get_current_user(request)
    car = get_car_or_default(user, int(car_id))

    if not user_has_access_to_car(user, car):
        return Response({"detail": "Forbidden"}, status=403)

    if not _is_owner(user, car):
        return Response({"detail": "Only the owner can delete a car"}, status=403)

    route_ids = list(RouteUsage.objects.filter(car=car).values_list("route_id", flat=True).distinct())
    gas_station_ids = list(Fueling.objects.filter(car=car, gas_station__isnull=False).values_list("gas_station_id", flat=True).distinct())
    service_center_ids = list(Maintenance.objects.filter(car=car).values_list("service_center_id", flat=True).distinct())

    address_ids = []
    if route_ids:
        address_ids = list(
            Address.objects.filter(
                Q(routes_from__route_id__in=route_ids) | Q(routes_to__route_id__in=route_ids)
            )
            .values_list("address_id", flat=True)
            .distinct()
        )

    with transaction.atomic():
        CarUser.objects.filter(car=car).delete()
        car.delete()

        if gas_station_ids:
            GasStation.objects.filter(gas_station_id__in=gas_station_ids).exclude(
                Q(fueling__isnull=False) | Q(communitygasstationshare__isnull=False)
            ).delete()

        if service_center_ids:
            ServiceCenter.objects.filter(service_center_id__in=service_center_ids, maintenance__isnull=True).delete()

        if route_ids:
            Route.objects.filter(route_id__in=route_ids, routeusage__isnull=True).delete()

        if address_ids:
            Address.objects.filter(address_id__in=address_ids).exclude(
                Q(routes_from__isnull=False) | Q(routes_to__isnull=False)
            ).delete()

    return Response(status=204)


# ----------------------------
# DELETE: Fueling
# ----------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_fueling_delete(request, fueling_id: int):
    user = get_current_user(request)

    try:
        fueling = Fueling.objects.select_related("car").get(fueling_id=fueling_id)
    except Fueling.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if not user_has_access_to_car(user, fueling.car):
        return Response({"detail": "Forbidden"}, status=403)

    fueling.delete()
    return Response(status=204)


# ----------------------------
# DELETE: Maintenance
# ----------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_maintenance_delete(request, maintenance_id: int):
    user = get_current_user(request)

    try:
        m = Maintenance.objects.select_related("car").get(maintenance_id=maintenance_id)
    except Maintenance.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if not user_has_access_to_car(user, m.car):
        return Response({"detail": "Forbidden"}, status=403)

    m.delete()
    return Response(status=204)


# ----------------------------
# DELETE: RouteUsage (event)
# ----------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_route_usage_delete(request, route_usage_id: int):
    user = get_current_user(request)

    try:
        ru = RouteUsage.objects.select_related("car").get(route_usage_id=route_usage_id)
    except RouteUsage.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if not user_has_access_to_car(user, ru.car):
        return Response({"detail": "Forbidden"}, status=403)

    ru.delete()
    return Response(status=204)


# ----------------------------
# DELETE: GasStation (only if unused)
# ----------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_gas_station_delete(request, gas_station_id: int):
    try:
        gs = GasStation.objects.get(gas_station_id=gas_station_id)
    except GasStation.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    gs.delete()
    return Response(status=204)


# ----------------------------
# DELETE: ServiceCenter (only if unused)
# ----------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_service_center_delete(request, service_center_id: int):
    try:
        sc = ServiceCenter.objects.get(service_center_id=service_center_id)
    except ServiceCenter.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if Maintenance.objects.filter(service_center=sc).exists():
        return Response({"detail": "Cannot delete service center: it is used by maintenance logs"}, status=409)

    sc.delete()
    return Response(status=204)


# ----------------------------
# DELETE: Address (only if unused by routes)
# ----------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_address_delete(request, address_id: int):
    try:
        a = Address.objects.get(address_id=address_id)
    except Address.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if Route.objects.filter(Q(from_address=a) | Q(to_address=a)).exists():
        return Response({"detail": "Cannot delete address: it is used by a route"}, status=409)

    a.delete()
    return Response(status=204)


# ----------------------------
# DELETE: Route (only if unused by route usage)
# ----------------------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def api_route_delete(request, route_id: int):
    try:
        r = Route.objects.get(route_id=route_id)
    except Route.DoesNotExist:
        return Response({"detail": "Not found"}, status=404)

    if RouteUsage.objects.filter(route=r).exists():
        return Response({"detail": "Cannot delete route: it is used by route usage"}, status=409)

    r.delete()
    return Response(status=204)


