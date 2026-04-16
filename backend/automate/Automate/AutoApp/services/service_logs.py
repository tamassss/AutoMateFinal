from __future__ import annotations

from typing import Any, Dict, List

from AutoApp.models import Maintenance, User, Car


def list_service_log(user: User, car: Car) -> List[Dict[str, Any]]:
    qs = (
        Maintenance.objects.filter(user=user, car=car)
        .select_related("service_center")
        .order_by("-date")
    )
    return [
        {
            "maintenance_id": m.maintenance_id,
            "part_name": m.part_name,
            "date": m.date,
            "cost": float(m.cost) if m.cost is not None else None,
            "reminder": m.reminder,
            "description": m.description,
            "service_center": {
                "service_center_id": m.service_center.service_center_id,
                "name": m.service_center.name,
                "city": m.service_center.city,
                "postal_code": m.service_center.postal_code,
                "street": m.service_center.street,
                "house_number": m.service_center.house_number,
            } if m.service_center_id else None,
        }
        for m in qs
    ]
