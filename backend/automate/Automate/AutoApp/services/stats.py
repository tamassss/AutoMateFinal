from __future__ import annotations

from typing import Any, Dict, List, Optional

from django.db.models import Sum, Count, Max, Min

from AutoApp.models import Car, CarUser, Fueling, RouteUsage, Maintenance, User
from AutoApp.api.utils import MONEY_EXPR, to_float, int_to_hhmm


def get_general_statistics(user: User, car: Car) -> Dict[str, Any]:
    distance = RouteUsage.objects.filter(user=user, car=car).aggregate(total=Sum("distance_km"))["total"] or 0
    fueling_count = Fueling.objects.filter(user=user, car=car).count()
    fueling_liters = Fueling.objects.filter(user=user, car=car).aggregate(total=Sum("liters"))["total"] or 0
    fueling_spent = Fueling.objects.filter(user=user, car=car).aggregate(total=Sum(MONEY_EXPR))["total"] or 0

    maintenance_cost = Maintenance.objects.filter(user=user, car=car).aggregate(total=Sum("cost"))["total"] or 0
    last_maintenance = Maintenance.objects.filter(user=user, car=car).aggregate(last=Max("date"))["last"]

    longest = (
        RouteUsage.objects.filter(user=user, car=car)
        .select_related("route__from_address", "route__to_address")
        .order_by("-distance_km")
        .first()
    )
    longest_route = None
    if longest:
        longest_route = {
            "route_usage_id": longest.route_usage_id,
            "from_city": longest.route.from_address.city,
            "to_city": longest.route.to_address.city,
            "distance_km": to_float(longest.distance_km) or 0.0,
            "departure_time_hhmm": int_to_hhmm(longest.departure_time),
            "arrival_time_hhmm": int_to_hhmm(longest.arrival_time),
            "date": longest.date,
        }

    return {
        "car": {
            "car_id": car.car_id,
            "display_name": f"{car.brand.name} {car.model.name}",
            "license_plate": car.license_plate,
        },
        "distance_km_total": float(distance),
        "fuelings": {
            "count": fueling_count,
            "liters": float(fueling_liters),
            "spent": float(fueling_spent),
        },
        "maintenance": {
            "total_cost": float(maintenance_cost),
            "last_date": last_maintenance,
        },
        "monthly": get_monthly_statistics(user, car),
        "longest_route": longest_route,
    }


def get_monthly_statistics(user: User, car: Car) -> Dict[str, Any]:
    distance_by_month = [0.0] * 12
    liters_by_month = [0.0] * 12
    fuel_spent_by_month = [0.0] * 12
    service_spent_by_month = [0.0] * 12

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
        fuel_spent_by_month[idx] += liters * price_per_liter

    maintenance_rows = Maintenance.objects.filter(user=user, car=car).only("date", "cost")
    for row in maintenance_rows:
        if not row.date:
            continue
        idx = row.date.month - 1
        service_spent_by_month[idx] += float(row.cost or 0)

    price_per_km_by_month = []
    total_spent_by_month = []
    for i in range(12):
        km = distance_by_month[i]
        fuel_spent = fuel_spent_by_month[i]
        service_spent = service_spent_by_month[i]
        price_per_km_by_month.append(round((fuel_spent / km), 1) if km > 0 else 0.0)
        total_spent_by_month.append(fuel_spent + service_spent)

    return {
        "distance": [round(v, 1) for v in distance_by_month],
        "liters": [round(v, 1) for v in liters_by_month],
        "price_per_km": price_per_km_by_month,
        "fuel_spent": [round(v) for v in fuel_spent_by_month],
        "service_spent": [round(v) for v in service_spent_by_month],
        "total_spent": [round(v) for v in total_spent_by_month],
    }


def get_summary_statistics(user: User) -> List[Dict[str, Any]]:
    cars = (
        Car.objects.filter(caruser__user=user)
        .select_related("brand", "model")
        .distinct()
        .order_by("brand__name", "model__name", "license_plate")
    )

    result: List[Dict[str, Any]] = []
    for c in cars:
        distance = RouteUsage.objects.filter(user=user, car=c).aggregate(total=Sum("distance_km"))["total"] or 0
        fueling_count = Fueling.objects.filter(user=user, car=c).count()
        fueling_liters = Fueling.objects.filter(user=user, car=c).aggregate(total=Sum("liters"))["total"] or 0
        fueling_spent = Fueling.objects.filter(user=user, car=c).aggregate(total=Sum(MONEY_EXPR))["total"] or 0

        maintenance_cost = Maintenance.objects.filter(user=user, car=c).aggregate(total=Sum("cost"))["total"] or 0
        result.append({
            "car_id": c.car_id,
            "car_name": f"{c.brand.name} {c.model.name}",
            "distance_km": float(distance),
            "fuelings": {
                "count": fueling_count,
                "liters": float(fueling_liters),
                "spent": float(fueling_spent),
            },
            "maintenance_total_cost": float(maintenance_cost),
        })

    return result
