from django.apps import AppConfig

class CoreappConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "AutoApp"

    def ready(self):
        from AutoApp.startup import ensure_default_superadmin

        ensure_default_superadmin()
