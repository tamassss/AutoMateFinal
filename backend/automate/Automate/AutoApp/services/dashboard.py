from __future__ import annotations

from typing import Any, Dict, Optional

from django.db.models import Sum
from django.db.models.functions import ExtractIsoWeekDay
from django.utils import timezone

from AutoApp.models import Event, Fueling, Maintenance, RouteUsage, User, Car
from AutoApp.api.utils import (
    MONEY_EXPR,
    get_car_or_default,
    int_to_hhmm,
    start_of_iso_week,
    start_of_month,
    start_of_next_month,
    hu_weekday_label,
    to_float,
)
from AutoApp.services.cars import get_selected_car_block
from AutoApp.services.fuelings import get_latest_fueling


DEFAULT_MONTHLY_LIMIT = 50000

#
def get_week_fueling_chart(user: User, car: Car) -> Dict[str, Any]:
    today = timezone.localdate()
    week_start = start_of_iso_week(today)
    week_end = week_start + timezone.timedelta(days=7)

    base = (
        Fueling.objects.filter(user=user, car=car, date__gte=week_start, date__lt=week_end)
        .annotate(iso_wd=ExtractIsoWeekDay("date"))
        .values("iso_wd")
        .annotate(spent_total=Sum(MONEY_EXPR), liters_total=Sum("liters"))
    )

    by_day = {
        row["iso_wd"]: {
            "spent": float(row.get("spent_total") or 0),
            "liters": float(row.get("liters_total") or 0),
        }
        for row in base
    }

    points = []
    for wd in range(1, 8):
        day_data = by_day.get(wd, {"spent": 0.0, "liters": 0.0})
        points.append(
            {
                "label": hu_weekday_label(wd),
                "value": day_data["spent"],
                "spent": day_data["spent"],
                "liters": day_data["liters"],
            }
        )

    return {
        "period": {"type": "this_week", "start": week_start, "end": week_end},
        "metric": "spent",
        "points": points,
    }
#
def get_monthly_budget(user: User, car: Car) -> Dict[str, Any]:
    today = timezone.localdate()
    start = start_of_month(today)
    end = start_of_next_month(today)

    fueling_spent = (
        Fueling.objects
        .filter(user=user, car=car, date__gte=start, date__lt=end)
        .aggregate(total=Sum(MONEY_EXPR))["total"] or 0
    )
    maintenance_spent = (
        Maintenance.objects
        .filter(user=user, car=car, date__gte=start, date__lt=end)
        .aggregate(total=Sum("cost"))["total"] or 0
    )
    spent = float(fueling_spent) + float(maintenance_spent)

    limit_val = DEFAULT_MONTHLY_LIMIT
    percent = int(round((spent / limit_val) * 100)) if limit_val else 0

    return {
        "month": f"{today.year:04d}-{today.month:02d}",
        "spent": spent,
        "limit": limit_val,
        "percent_used": percent,
    }


def get_sidebar_events(user: User, car: Car, limit: Optional[int] = None) -> Dict[str, Any]:
    qs = Event.objects.filter(user=user, car=car).order_by("date", "event_id")
    if limit is not None:
        qs = qs[:limit]
    return {
        "items": [
            {
                "event_id": event.event_id,
                "title": event.title,
                "date": event.date,
                "reminder": event.reminder,
            }
            for event in qs
        ]
    }

def get_dashboard_payload(user: User, car_id: Optional[int] = None) -> Dict[str, Any]:
    car = get_car_or_default(user, car_id)

    if car is None:
        return {
            "selected_car": None,
            "route_card": None,
            "monthly_budget": {"amount": 0.0, "currency": "HUF"} if False else None,
            "fueling_chart": [],
            "latest_fueling": None,
            "events": {"items": []},
        }

    selected_car = get_selected_car_block(user, car.car_id)

    latest_route = (
        RouteUsage.objects.filter(user=user, car=car)
        .select_related("route__from_address", "route__to_address")
        .order_by("-date")
        .first()
    )

    route_card = None
    if latest_route:
        route_card = {
            "route_usage_id": latest_route.route_usage_id,
            "title": f"{latest_route.route.from_address.city} - {latest_route.route.to_address.city}",
            "departure_time_hhmm": int_to_hhmm(latest_route.departure_time),
            "arrival_time_hhmm": int_to_hhmm(latest_route.arrival_time),
            "distance_km": to_float(latest_route.distance_km),
        }

    latest_fueling = get_latest_fueling(user, car)
    chart = get_week_fueling_chart(user, car)
    budget = get_monthly_budget(user, car)
    events = get_sidebar_events(user, car, limit=5)
    return {
        "selected_car": selected_car,
        "route_card": route_card,
        "monthly_budget": budget,
        "fueling_chart": chart,
        "latest_fueling": latest_fueling,
        "events": events,
    }
