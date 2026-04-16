from .models import AutoFelhasznalo

def can_user_acces_car(user, auto_id):
    return AutoFelhasznalo.objects.filter(
        auto_id=auto_id,
        felhasznalo=user
    ).exists()
