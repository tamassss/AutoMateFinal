from __future__ import annotations

from typing import Any, Dict, List

from AutoApp.models import CarGasStation, Fueling, User, Car


def list_gas_station_cards(user: User, car: Car, limit: int = 50) -> List[Dict[str, Any]]:
    qs = (
        Fueling.objects.filter(user=user, car=car, gas_station__isnull=False)
        .select_related("gas_station", "fuel_type")
        .order_by("-date")
    )

    cards = []
    seen_station_ids = set()
    for f in qs:
        gs = f.gas_station
        if not gs:
            continue
        if gs.gas_station_id in seen_station_ids:
            continue
        seen_station_ids.add(gs.gas_station_id)

        cards.append({
            "fueling_id": f.fueling_id,
            "date": f.date,
            "price_per_liter": float(f.price_per_liter),
            "supplier": f.supplier,
            "fuel_type": f.fuel_type.name if f.fuel_type else None,
            "fuel_type_id": f.fuel_type_id,
            "gas_station": {
                "gas_station_id": gs.gas_station_id,
                "name": gs.name,
                "city": gs.city,
                "postal_code": gs.postal_code,
                "street": gs.street,
                "house_number": gs.house_number,
            } if gs else None,
        })

        if len(cards) >= limit:
            break

    if len(cards) < limit:
        standalone_qs = (
            CarGasStation.objects.filter(user=user, car=car)
            .exclude(gas_station_id__in=seen_station_ids)
            .select_related("gas_station")
            .order_by("-created_at")
        )
        for link in standalone_qs:
            gs = link.gas_station
            cards.append({
                "fueling_id": None,
                "date": link.date or link.created_at,
                "price_per_liter": float(link.price_per_liter) if link.price_per_liter is not None else 0.0,
                "supplier": link.supplier or gs.name,
                "fuel_type": link.fuel_type.name if link.fuel_type else None,
                "fuel_type_id": link.fuel_type_id,
                "gas_station": {
                    "gas_station_id": gs.gas_station_id,
                    "name": gs.name,
                    "city": gs.city,
                    "postal_code": gs.postal_code,
                    "street": gs.street,
                    "house_number": gs.house_number,
                },
            })

            if len(cards) >= limit:
                break
    return cards
