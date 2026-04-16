from rest_framework.permissions import BasePermission
from .models import CarUser

class IsCarMember(BasePermission):
    """
    Allows access if request.user has a CarUser record for the car.
    """
    def has_object_permission(self, request, view, obj):
        # obj could be Car, Fueling, Maintenance, RouteUsage
        car = getattr(obj, "car", obj)
        return CarUser.objects.filter(car=car, user=request.user).exists()
