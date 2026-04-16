from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("AutoApp", "0013_routeusage_arrival_delta_min_readd"),
    ]

    operations = [
        migrations.CreateModel(
            name="CarGasStation",
            fields=[
                ("link_id", models.AutoField(primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("car", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="AutoApp.car")),
                ("gas_station", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="AutoApp.gasstation")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "car_gas_station",
                "unique_together": {("user", "car", "gas_station")},
            },
        ),
    ]
