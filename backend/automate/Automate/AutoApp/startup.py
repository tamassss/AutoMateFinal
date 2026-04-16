import os

from django.contrib.auth import get_user_model
from django.db import OperationalError, ProgrammingError, connection


def ensure_default_superadmin():
    User = get_user_model()

    try:
        table_names = connection.introspection.table_names()
        if User._meta.db_table not in table_names:
            return
    except (OperationalError, ProgrammingError):
        return

    email = os.environ.get("AUTOMATE_SUPERADMIN_EMAIL", "admin@example.com")
    password = os.environ.get("AUTOMATE_SUPERADMIN_PASSWORD", "pass1234")
    full_name = os.environ.get("AUTOMATE_SUPERADMIN_NAME", "Seed Admin")

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "full_name": full_name,
            "role": "admin",
            "is_active": True,
            "is_staff": True,
            "is_superuser": True,
        },
    )

    fields_to_update = []

    if user.full_name != full_name:
        user.full_name = full_name
        fields_to_update.append("full_name")
    if user.role != "admin":
        user.role = "admin"
        fields_to_update.append("role")
    if not user.is_active:
        user.is_active = True
        fields_to_update.append("is_active")
    if not user.is_staff:
        user.is_staff = True
        fields_to_update.append("is_staff")
    if not user.is_superuser:
        user.is_superuser = True
        fields_to_update.append("is_superuser")

    if created or not user.has_usable_password():
        user.set_password(password)
        fields_to_update.append("password")

    if fields_to_update:
        user.save(update_fields=fields_to_update)
