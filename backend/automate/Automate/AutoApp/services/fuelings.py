from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from django.db.models.functions import ExtractYear, ExtractMonth

from AutoApp.models import Fueling, User, Car
from AutoApp.api.utils import MONEY_EXPR


def list_fuelings_grouped_by_month(user: User, car: Car) -> List[Dict[str, Any]]:
    qs = (
        Fueling.objects.filter(user=user, car=car)
        .annotate(year=ExtractYear("date"), month=ExtractMonth("date"))
        .select_related("gas_station", "fuel_type")
        .order_by("-year", "-month", "-date")
    )

    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for f in qs:
        key = f"{int(f.year):04d}-{int(f.month):02d}"
        grouped.setdefault(key, []).append(
            {
                "fueling_id": f.fueling_id,
                "date": f.date,
                "liters": float(f.liters),
                "price_per_liter": float(f.price_per_liter),
                "odometer_km": f.odometer_km,
                "gas_station": {
                    "gas_station_id": f.gas_station.gas_station_id,
                    "name": f.gas_station.name,
                    "city": f.gas_station.city,
                    "postal_code": f.gas_station.postal_code,
                    "street": f.gas_station.street,
                    "house_number": f.gas_station.house_number,
                } if f.gas_station_id else None,
                "fuel_type": {
                    "fuel_type_id": f.fuel_type.fuel_type_id,
                    "name": f.fuel_type.name,
                } if f.fuel_type_id else None,
                "supplier": f.supplier,
            }
        )

    result = []
    for month_key in sorted(grouped.keys(), reverse=True):
        result.append({"month": month_key, "items": grouped[month_key]})
    return result


def get_latest_fueling(user: User, car: Car) -> Optional[Dict[str, Any]]:
    f = (
        Fueling.objects.filter(user=user, car=car)
        .select_related("gas_station", "fuel_type")
        .order_by("-date")
        .first()
    )
    if not f:
        return None
    return {
        "fueling_id": f.fueling_id,
        "date": f.date,
        "liters": float(f.liters),
        "price_per_liter": float(f.price_per_liter),
        "odometer_km": f.odometer_km,
        "spent": float(f.liters * f.price_per_liter),
        "gas_station": {
            "gas_station_id": f.gas_station.gas_station_id,
            "name": f.gas_station.name,
            "city": f.gas_station.city,
        } if f.gas_station_id else None,
        "fuel_type": {
            "fuel_type_id": f.fuel_type.fuel_type_id,
            "name": f.fuel_type.name,
        } if f.fuel_type_id else None,
        "supplier": f.supplier,
    }
