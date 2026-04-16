from __future__ import annotations

from typing import Any, Dict, List, Optional

from django.db.models import Sum

from AutoApp.models import RouteUsage, Fueling, User, Car
from AutoApp.api.utils import MONEY_EXPR, int_to_hhmm, to_float


def list_route_cards(user: User, car: Car, limit: int = 50) -> List[Dict[str, Any]]:
    routes = (
        RouteUsage.objects.filter(user=user, car=car)
        .select_related("route__from_address", "route__to_address")
        .order_by("-date")[:limit]
    )
    items = list(routes)
    if not items:
        return []

    result: List[Dict[str, Any]] = []

    for r in items:
        fueling_qs = Fueling.objects.filter(
            user=user,
            car=car,
            route_usage=r,
            liters__gt=0,
        )
        fueling_count = fueling_qs.count()
        fueling_spent = fueling_qs.aggregate(total=Sum(MONEY_EXPR))["total"] or 0

        result.append({
            "route_usage_id": r.route_usage_id,
            "from_city": r.route.from_address.city,
            "to_city": r.route.to_address.city,
            "date": r.date,
            "departure_time": r.departure_time,
            "departure_time_hhmm": int_to_hhmm(r.departure_time),
            "arrival_time": r.arrival_time,
            "arrival_time_hhmm": int_to_hhmm(r.arrival_time),
            "arrival_delta_min": getattr(r, "arrival_delta_min", None),
            "distance_km": to_float(r.distance_km) or 0.0,
            "fuelings_count": fueling_count,
            "fuelings_spent": float(fueling_spent),
        })

    return result


def get_latest_route_card(user: User, car: Car) -> Optional[Dict[str, Any]]:
    r = (
        RouteUsage.objects.filter(user=user, car=car)
        .select_related("route__from_address", "route__to_address")
        .order_by("-date")
        .first()
    )
    if not r:
        return None
    return {
        "route_usage_id": r.route_usage_id,
        "title": f"{r.route.from_address.city} - {r.route.to_address.city}",
        "from_city": r.route.from_address.city,
        "to_city": r.route.to_address.city,
        "date": r.date,
        "departure_time_hhmm": int_to_hhmm(r.departure_time),
        "arrival_time_hhmm": int_to_hhmm(r.arrival_time),
        "distance_km": to_float(r.distance_km) or (to_float(r.distance_km) if r.distance_km else None),
    }
