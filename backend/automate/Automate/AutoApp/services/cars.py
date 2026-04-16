from __future__ import annotations

from typing import Any, Dict, List, Optional

from AutoApp.models import Car, CarUser, User
from AutoApp.api.utils import get_car_or_default


def list_user_cars(user: User) -> List[Dict[str, Any]]:
    qs = (
        Car.objects.filter(caruser__user=user)
        .select_related("brand", "model", "fuel_type")
        .distinct()
        .order_by("brand__name", "model__name", "license_plate")
    )
    car_ids = [c.car_id for c in qs]
    perms = {
        cu.car_id: cu.permission
        for cu in CarUser.objects.filter(user=user, car_id__in=car_ids)
    }
    return [
        {
            "car_id": c.car_id,
            "display_name": f"{c.brand.name} {c.model.name}",
            "license_plate": c.license_plate,
            "brand": c.brand.name,
            "model": c.model.name,
            "car_image": c.car_image,
            "fuel_type": c.fuel_type.name if c.fuel_type_id else None,
            "tank_capacity": float(c.tank_capacity) if c.tank_capacity is not None else None,
            "average_consumption": float(c.average_consumption) if c.average_consumption is not None else None,
            "horsepower": c.horsepower,
            "production_year": c.production_year,
            "odometer_km": c.odometer_km,
            "permission": perms.get(c.car_id),
        }
        for c in qs
    ]


def get_selected_car_block(user: User, car_id: Optional[int] = None) -> Dict[str, Any]:
    c = get_car_or_default(user, car_id)
    perm = CarUser.objects.filter(user=user, car=c).values_list("permission", flat=True).first()
    return {
        "car_id": c.car_id,
        "display_name": f"{c.brand.name} {c.model.name}",
        "license_plate": c.license_plate,
        "brand": c.brand.name,
        "model": c.model.name,
        "car_image": c.car_image,
        "fuel_type": c.fuel_type.name if c.fuel_type_id else None,
        "tank_capacity": float(c.tank_capacity) if c.tank_capacity is not None else None,
        "average_consumption": float(c.average_consumption) if c.average_consumption is not None else None,
        "horsepower": c.horsepower,
        "production_year": c.production_year,
        "odometer_km": c.odometer_km,
        "permission": perm,
    }
