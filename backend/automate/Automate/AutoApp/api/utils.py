from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

from django.db.models import F, DecimalField, ExpressionWrapper
from django.utils import timezone

from AutoApp.models import Car, CarUser, User


MONEY_EXPR = ExpressionWrapper(
    F("liters") * F("price_per_liter"),
    output_field=DecimalField(max_digits=14, decimal_places=2),
)


def get_current_user(request) -> User:
    return request.user


def user_has_access_to_car(user: User, car: Car) -> bool:
    return CarUser.objects.filter(user=user, car=car).exists()


def user_is_owner_of_car(user: User, car: Car) -> bool:
    return CarUser.objects.filter(user=user, car=car, permission="owner").exists()


def get_car_or_default(user, car_id=None):
    qs = Car.objects.filter(caruser__user=user)

    if not qs.exists():
        return None

    if car_id is None:
        return qs.first()

    return qs.filter(car_id=car_id).first()

def int_to_hhmm(value: Optional[int]) -> Optional[str]:
    if value is None:
        return None
    if value <= 24 * 60:
        minutes = value
    else:
        minutes = value // 60
    hh = (minutes // 60) % 24
    mm = minutes % 60
    return f"{hh:02d}:{mm:02d}"


def hu_weekday_label(iso_weekday: int) -> str:
    labels = {1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun"}
    return labels.get(iso_weekday, str(iso_weekday))


def start_of_iso_week(d) -> datetime:
    monday = d - timedelta(days=(d.isoweekday() - 1))
    tz = timezone.get_current_timezone()
    return datetime(monday.year, monday.month, monday.day, 0, 0, 0, tzinfo=tz)


def start_of_month(d) -> datetime:
    tz = timezone.get_current_timezone()
    return datetime(d.year, d.month, 1, 0, 0, 0, tzinfo=tz)


def start_of_next_month(d) -> datetime:
    tz = timezone.get_current_timezone()
    if d.month == 12:
        return datetime(d.year + 1, 1, 1, 0, 0, 0, tzinfo=tz)
    return datetime(d.year, d.month + 1, 1, 0, 0, 0, tzinfo=tz)


def to_float(x: Any) -> Optional[float]:
    if x is None:
        return None
    if isinstance(x, Decimal):
        return float(x)
    try:
        return float(x)
    except Exception:
        return None
